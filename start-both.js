#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting HabitFlow application...');

// Start Express server
const expressProcess = spawn('tsx', ['server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Start Vite frontend after a short delay
setTimeout(() => {
  const viteProcess = spawn('vite', [], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    expressProcess.kill();
  });
}, 2000);

expressProcess.on('close', (code) => {
  console.log(`Express process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  expressProcess.kill();
  process.exit(0);
});