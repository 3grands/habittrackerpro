#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';

console.log('🏗️  Creating deployment build...');

async function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

try {
  // Clean previous build
  if (existsSync('dist')) {
    console.log('🧹 Cleaning previous build...');
    rmSync('dist', { recursive: true, force: true });
  }
  mkdirSync('dist', { recursive: true });

  // Build frontend without server integration
  console.log('📦 Building frontend (isolated)...');
  await runCommand('npx', ['vite', 'build', '--config', 'vite.build.config.ts'], {
    NODE_ENV: 'production'
  });

  // Build backend separately
  console.log('🔧 Building backend...');
  await runCommand('npx', [
    'esbuild', 
    'server/index.ts',
    '--platform=node',
    '--packages=external', 
    '--bundle',
    '--format=esm',
    '--outdir=dist'
  ], {
    NODE_ENV: 'build'
  });

  console.log('✅ Deployment build completed!');
  console.log('📁 Build output in /dist directory');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}