#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
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

async function buildForDeployment() {
  console.log('Building HabitFlow for deployment...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      console.log('Cleaning previous build...');
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build frontend using static configuration
    console.log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.static.config.ts'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_BUILD_ONLY: 'true'
      }
    });

    // Build backend with build flag to prevent server startup
    console.log('Building backend...');
    await runCommand('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist',
      '--define:process.env.NODE_ENV="build"'
    ]);

    console.log('Deployment build completed successfully!');
    
    // Verify build artifacts
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/index.js');
    
    if (frontendExists && backendExists) {
      console.log('Build verification passed');
      console.log('Frontend assets: dist/public/');
      console.log('Backend bundle: dist/index.js');
      console.log('Ready for deployment');
    } else {
      throw new Error('Build verification failed - missing artifacts');
    }

  } catch (error) {
    console.error('Deployment build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();