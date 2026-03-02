# ── Stage 1: Dependencies ──
FROM node:20-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Production image ──
FROM node:20-slim AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies (includes tsx for runtime)
COPY --from=deps /app/node_modules ./node_modules/
COPY package.json pnpm-lock.yaml ./

# Copy source code + prisma + assets
COPY src ./src/
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY assets ./assets/
COPY tsconfig.json ./

# Generate Prisma client
RUN pnpm prisma generate

# Font setup for resvg (loadSystemFonts: true)
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ \
    && cp /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ \
    && fc-cache -fv

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
