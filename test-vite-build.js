#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testViteBuild() {
  try {
    console.log('Testing Vite build with updated scripts...');
    
    // Clean dist directory first
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    
    // Try using the standard vite build command
    console.log('Running vite build...');
    execSync('npx vite build', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    console.log('Vite build completed successfully!');
    
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
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    // Create production package.json
    const packageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log('Complete build finished successfully!');
    
    // Verify outputs
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Build contents:', distFiles);
    
  } catch (error) {
    console.error('Vite build failed, using alternative approach...');
    
    // Fall back to our working build method
    console.log('Using alternative build method...');
    execSync('node production-build-final.js', {
      stdio: 'inherit',
      cwd: __dirname
    });
  }
}

testViteBuild();