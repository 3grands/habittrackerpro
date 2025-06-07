#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Kill any existing processes that might conflict
pkill -f "vite" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start the Express server with integrated Vite
echo "Starting HabitFlow Express server with integrated Vite..."
NODE_ENV=development exec tsx server/index.ts