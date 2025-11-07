#!/usr/bin/env bash
# exit on error
set -o errexit

# Install all dependencies including devDependencies (needed for TypeScript build)
npm install --include=dev
npm run build

# Generate Prisma Client first
npx prisma generate

# Try to deploy migrations, if that fails, use db push as fallback
npx prisma migrate deploy || npx prisma db push --accept-data-loss

