#!/usr/bin/env node

import { spawn } from 'child_process';

// Start Vite with correct port configuration
const viteProcess = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5000'
  }
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  viteProcess.kill('SIGTERM');
});