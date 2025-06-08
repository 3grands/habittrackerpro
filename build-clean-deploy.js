#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';

function cleanBuild() {
  console.log('Building with clean configuration (no cartographer)...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build frontend using production config without cartographer
    console.log('Building frontend...');
    execSync('NODE_ENV=production vite build --config vite.production.config.ts', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    // Build backend
    console.log('Building backend...');
    execSync('NODE_ENV=build esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit'
    });

    // Verify build
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Clean deployment build completed successfully!');
      console.log('Frontend: dist/public/');
      console.log('Backend: dist/index.js');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Clean build failed:', error.message);
    return false;
  }
}

const success = cleanBuild();
process.exit(success ? 0 : 1);