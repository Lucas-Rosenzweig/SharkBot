#!/bin/sh
set -e

# Installer les polices Inter pour resvg (loadSystemFonts: true)
echo "[entrypoint] Installing Inter fonts..."
mkdir -p /usr/share/fonts/truetype/inter
cp -f /app/assets/fonts/Inter-Medium.ttf /usr/share/fonts/truetype/inter/ 2>/dev/null || true
cp -f /app/assets/fonts/Inter-Bold.ttf /usr/share/fonts/truetype/inter/ 2>/dev/null || true
fc-cache -f 2>/dev/null || true

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting bot..."
exec npx tsx src/index.ts

