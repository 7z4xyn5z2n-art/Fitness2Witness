#!/bin/bash
set -e

echo "Starting Fitness2Witness production server..."

# Run database migrations if DATABASE_URL is set (production environment)
if [ -n "$DATABASE_URL" ]; then
  echo "Installing devDependencies for migrations..."
  NODE_ENV=development pnpm install --include=dev
  
  echo "Running database migrations..."
  pnpm migrate || echo "Migration failed or no changes needed"
fi

# Start the server
echo "Starting Node server..."
exec node dist/index.mjs
