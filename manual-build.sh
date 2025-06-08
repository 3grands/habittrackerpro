#!/bin/bash

echo "Starting production build..."

# Kill any running processes
pkill -f "node.*vite\|npm.*dev" 2>/dev/null || true
sleep 2

# Build frontend
echo "Building frontend..."
cd client
npx vite build --outDir ../dist/public --emptyOutDir
cd ..

echo "Frontend build complete."

# Build backend
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --out-extension:.js=.mjs

echo "Backend build complete."
echo "Production build finished successfully!"