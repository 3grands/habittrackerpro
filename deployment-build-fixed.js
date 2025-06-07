#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForDeployment() {
  try {
    console.log('Starting production build...');
    
    // Ensure dist directory exists
    await fs.mkdir(path.join(__dirname, 'dist', 'public'), { recursive: true });
    
    // Build frontend with explicit configuration
    console.log('Building frontend...');
    await build({
      configFile: path.resolve(__dirname, 'vite.deployment.config.js'),
      mode: 'production',
      logLevel: 'info'
    });
    
    console.log('Frontend build completed');
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Copy shared schema for runtime
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    console.log('Backend build completed');
    console.log('Production build finished successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
  } catch (error) {
    console.error('Build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

buildForDeployment();