#!/bin/bash

# Kill any existing processes
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "tsx.*server" >/dev/null 2>&1 || true

# Start the proper development server
echo "Starting HabitFlow development server on port 5000..."
NODE_ENV=development exec tsx server/index.ts