#!/usr/bin/env node

// Override Vite with Express server
import { execSync } from 'child_process';

try {
  // Kill standalone Vite if running
  execSync('pkill -f "vite" 2>/dev/null || true', { stdio: 'ignore' });
} catch (e) {
  // Ignore errors
}

// Import and start Express server directly
import('./server/index.js').catch(err => {
  console.error('Failed to start Express server:', err);
  process.exit(1);
});