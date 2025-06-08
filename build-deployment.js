#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

async function buildForDeployment() {
  console.log('🚀 Starting deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Build frontend only (without server interference)
    console.log('🎨 Building frontend...');
    process.env.NODE_ENV = 'production';
    
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        SKIP_SERVER_START: 'true'
      }
    });

    // Build backend with explicit server skip
    console.log('⚙️ Building backend...');
    execSync('npx esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js --packages=external --target=node18', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        SKIP_SERVER_START: 'true'
      }
    });

    // Create production package.json
    const productionPackage = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(productionPackage, null, 2)
    );

    // Copy shared schema if it exists
    try {
      if (existsSync('shared')) {
        mkdirSync('dist/shared', { recursive: true });
        execSync('cp -r shared/* dist/shared/', { stdio: 'inherit' });
      }
    } catch (err) {
      console.log('Note: No shared directory to copy');
    }

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: dist/');
    console.log('🌐 Frontend assets: dist/public/');
    console.log('⚡ Server file: dist/server.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();