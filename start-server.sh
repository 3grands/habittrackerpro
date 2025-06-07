#!/bin/bash

# Start the HabitFlow development server
echo "Starting HabitFlow development server..."

# Kill any existing processes
pkill -f "tsx.*server" || true
pkill -f "node.*server" || true

# Start the Express server with Vite middleware
NODE_ENV=development exec tsx server/index.ts