#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForDeployment() {
  try {
    console.log('Starting deployment build...');
    
    // Clean dist directory
    console.log('Cleaning previous build...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend using Vite programmatically
    console.log('Building frontend...');
    await build({
      configFile: false,
      root: path.join(__dirname, 'client'),
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'dist', 'public'),
        emptyOutDir: true,
        rollupOptions: {
          input: path.resolve(__dirname, 'client', 'index.html'),
        },
      },
    });
    
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
    
    console.log('Deployment build completed successfully!');
    console.log('Frontend built to: dist/public/');
    console.log('Backend built to: dist/index.js');
    
  } catch (error) {
    console.error('Deployment build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();