#!/usr/bin/env node

import { spawn } from 'child_process';
import { createServer } from 'http';

// Kill any existing Vite processes
function killVite() {
  try {
    const { execSync } = require('child_process');
    execSync('pkill -f "vite" 2>/dev/null || true', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors
  }
}

// Start the Express server with Vite middleware
function startServer() {
  console.log('Starting HabitFlow development server on port 5000...');
  
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    setTimeout(startServer, 2000);
  });

  server.on('close', (code) => {
    console.log(`Server exited with code ${code}, restarting...`);
    setTimeout(startServer, 1000);
  });

  return server;
}

// Monitor and restart if needed
function monitor() {
  killVite();
  const server = startServer();
  
  // Check if Vite starts again and kill it
  setInterval(() => {
    try {
      const { execSync } = require('child_process');
      const viteProcesses = execSync('ps aux | grep "vite" | grep -v grep | wc -l', { encoding: 'utf8' });
      if (parseInt(viteProcesses) > 0) {
        console.log('Detected Vite process, killing...');
        killVite();
      }
    } catch (e) {
      // Ignore errors
    }
  }, 5000);

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });
}

monitor();