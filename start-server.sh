#!/bin/bash

# Kill any existing processes
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
sleep 2

# Start the Express server with integrated Vite
NODE_ENV=development tsx server/index.ts