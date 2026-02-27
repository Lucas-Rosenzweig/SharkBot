# ── Build stage ──
FROM node:20-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

# Fontconfig nécessaire pour resvg (aussi en dev via target: build)
RUN apt-get update && apt-get install -y --no-install-recommends fontconfig && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY assets ./assets/

RUN pnpm prisma generate
RUN pnpm exec tsc

# Installer les polices Inter pour resvg dans le build stage (utilisé en dev)
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ \
    && cp /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ \
    && fc-cache -fv

# ── Runtime stage ──
FROM node:20-slim AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends openrc openssl fontconfig fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist/
COPY --from=build /app/generated ./generated/
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/assets ./assets/

# Installer les polices Inter dans le système pour resvg (loadSystemFonts:true)
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ \
    && cp /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ \
    && fc-cache -fv

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
