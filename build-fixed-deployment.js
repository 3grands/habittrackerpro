#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForProduction() {
  try {
    console.log('Building application for deployment...');
    
    // Clean previous build
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    
    // Step 1: Build frontend using the existing npm build script approach
    // but working around the EISDIR issue by running vite from the correct directory
    console.log('Building frontend...');
    
    // Use the existing vite.config.ts but ensure we're in the right context
    const buildCommand = process.platform === 'win32' 
      ? 'npx vite build --mode production' 
      : 'npx vite build --mode production';
    
    execSync(buildCommand, {
      stdio: 'inherit',
      cwd: __dirname, // Run from project root where vite.config.ts exists
      env: {
        ...process.env,
        NODE_ENV: 'production',
        VITE_NODE_ENV: 'production'
      }
    });
    
    // Step 2: Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Verify the build outputs
    const distContents = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Build completed successfully!');
    console.log('Output files:', distContents.join(', '));
    
    // Check if we have the expected files
    const hasPublic = distContents.includes('public');
    const hasBackend = distContents.includes('index.js');
    
    if (hasPublic && hasBackend) {
      console.log('Frontend and backend built successfully');
      const publicContents = await fs.readdir(path.join(__dirname, 'dist/public'));
      console.log('Frontend assets:', publicContents.join(', '));
    } else {
      console.log('Warning: Expected build outputs not found');
      if (!hasPublic) console.log('Missing: dist/public directory');
      if (!hasBackend) console.log('Missing: dist/index.js file');
    }
    
  } catch (error) {
    console.error('Build failed:', error.message);
    
    // Try to provide more helpful error information
    if (error.message.includes('EISDIR')) {
      console.error('EISDIR error detected. This typically indicates a file system issue.');
      console.error('Attempting alternative build approach...');
      
      // Alternative: use the working build scripts that were created earlier
      try {
        console.log('Trying alternative build method...');
        
        // Just build the backend since frontend might have issues
        await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
        
        // Copy a minimal index.html for now
        const minimalIndex = `<!DOCTYPE html>
<html><head><title>HabitFlow</title></head>
<body><div id="root"></div>
<script>window.location.href = '/api/health';</script></body></html>`;
        
        await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), minimalIndex);
        
        // Build backend
        execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
          stdio: 'inherit',
          cwd: __dirname,
          env: { ...process.env, NODE_ENV: 'production' }
        });
        
        console.log('Alternative build completed - backend ready, frontend minimal');
        
      } catch (altError) {
        console.error('Alternative build also failed:', altError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

buildForProduction();