#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

async function buildWithCrossEnv() {
  console.log('Building with cross-env SKIP_SERVER_START...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Build CSS
    console.log('Building styles...');
    execSync('npx tailwindcss -i ./client/src/index.css -o ./dist/public/main.css --minify', { 
      stdio: 'inherit'
    });

    // Build frontend with cross-env
    console.log('Building frontend...');
    execSync('npx cross-env SKIP_SERVER_START=true vite build', { 
      stdio: 'inherit'
    });

    // Build backend with cross-env
    console.log('Building backend...');
    execSync('npx cross-env SKIP_SERVER_START=true esbuild server/start.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js --target=node18', { 
      stdio: 'inherit'
    });

    // Create deployment package.json
    const deployPackage = {
      "name": "habitflow-deploy",
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

    writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));

    // Verify build
    const requiredFiles = [
      'dist/public/index.html',
      'dist/server.js',
      'dist/package.json'
    ];

    const missing = requiredFiles.filter(file => !existsSync(file));
    
    if (missing.length > 0) {
      throw new Error(`Missing files: ${missing.join(', ')}`);
    }

    console.log('Cross-env build completed successfully!');
    console.log('Frontend assets: dist/public/');
    console.log('Backend server: dist/server.js');
    console.log('SKIP_SERVER_START environment variable used during build');
    
    return true;

  } catch (error) {
    console.error('Cross-env build failed:', error.message);
    return false;
  }
}

const success = await buildWithCrossEnv();
process.exit(success ? 0 : 1);