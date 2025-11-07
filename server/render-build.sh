#!/usr/bin/env bash
# exit on error
set -o errexit

# Install all dependencies including devDependencies (needed for TypeScript build)
npm install --include=dev
npm run build
npx prisma migrate deploy
npx prisma generate

