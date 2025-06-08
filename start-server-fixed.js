#!/usr/bin/env node

import { spawn } from 'child_process';

// Start the server with correct port configuration
const serverProcess = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  env: { 
    ...process.env,
    PORT: '5000',
    VITE_PORT: '5000'
  }
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  serverProcess.kill('SIGTERM');
});