#!/usr/bin/env bash
# exit on error
set -o errexit

# Install all dependencies including devDependencies (needed for TypeScript build)
npm install --include=dev
npm run build

# Generate Prisma Client first
npx prisma generate

# Check if migrations exist, if not use db push
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Migrations found, attempting to deploy..."
  set +o errexit
  npx prisma migrate deploy
  MIGRATE_EXIT_CODE=$?
  set -o errexit
  
  if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
    echo "Migration deploy failed, using db push instead..."
    npx prisma db push --accept-data-loss
  fi
else
  echo "No migrations found, using db push to sync schema..."
  npx prisma db push --accept-data-loss
fi

