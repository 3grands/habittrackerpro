#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForDeployment() {
  try {
    console.log('🚀 Starting deployment build...');
    
    // Clean dist directory
    console.log('🧹 Cleaning previous build...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend - change to client directory first
    console.log('🎨 Building frontend...');
    process.chdir(path.join(__dirname, 'client'));
    execSync('npx vite build --config ../vite.config.build.js', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Return to root directory
    process.chdir(__dirname);
    
    // Build backend
    console.log('🔧 Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    console.log('✅ Deployment build completed successfully!');
    console.log('📦 Frontend built to: dist/public/');
    console.log('📦 Backend built to: dist/index.js');
    
  } catch (error) {
    console.error('❌ Deployment build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();