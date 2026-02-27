FROM node:20-slim AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends openrc openssl fontconfig fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src/
COPY prisma ./prisma/
COPY assets ./assets/
COPY tsconfig.json ./

RUN pnpm prisma generate

# Font setup for resvg
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ \
    && cp /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ \
    && fc-cache -fv

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
