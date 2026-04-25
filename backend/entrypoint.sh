#!/bin/sh
set -e

echo "[entrypoint] Pushing Prisma schema..."
npx prisma db push --skip-generate

echo "[entrypoint] Seeding database..."
npx prisma db seed || echo "[entrypoint] Seed skipped or already applied"

echo "[entrypoint] Starting server..."
node dist/index.js
