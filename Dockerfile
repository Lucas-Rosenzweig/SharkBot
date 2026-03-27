# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-slim AS deps

# Installer pnpm via npm est plus rapide et plus fiable que corepack
RUN npm install -g pnpm@10.18.0 --prefer-offline

WORKDIR /app

# Copier SEULEMENT les fichiers de lock pour maximiser le cache Docker.
# Ce layer ne sera invalidé que si package.json ou pnpm-lock.yaml changent.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:20-slim AS runtime

RUN npm install -g pnpm@10.18.0 --prefer-offline

# Installer les dépendances système en une seule couche
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Copie des node_modules depuis le stage deps ─────────────────────────────
COPY --from=deps /app/node_modules ./node_modules/
COPY package.json pnpm-lock.yaml ./

# ── Setup des polices Inter (layer stable, mis en cache tant que les fonts ne changent pas) ──
COPY assets/fonts ./assets/fonts/
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ \
    && cp /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ \
    && fc-cache -f   # Sans -v pour être silencieux et légèrement plus rapide

# ── Copie du code source (layer le plus souvent invalidé, donc en dernier) ──
COPY src ./src/
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Copier le reste des assets (images, etc.) sauf les fonts déjà copiées
COPY assets ./assets/

# Générer le client Prisma (dépend du schema.prisma → après sa copie)
RUN pnpm prisma generate

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
