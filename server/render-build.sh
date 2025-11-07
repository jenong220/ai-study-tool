#!/usr/bin/env bash
# exit on error
set -o errexit

# Install all dependencies including devDependencies (needed for TypeScript build)
npm install --include=dev
npm run build

# Generate Prisma Client first
npx prisma generate

# Try to deploy migrations, if that fails, use db push as fallback
# Temporarily disable errexit for the migration step
set +o errexit
npx prisma migrate deploy
MIGRATE_EXIT_CODE=$?
set -o errexit

if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
  echo "Migration deploy failed, using db push instead..."
  npx prisma db push --accept-data-loss
fi

