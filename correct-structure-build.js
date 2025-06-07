#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildCorrectStructure() {
  try {
    console.log('Building with correct project structure...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    
    // Build frontend with correct structure
    console.log('Building frontend with root index.html...');
    await build({
      configFile: false,
      plugins: [
        (await import('@vitejs/plugin-react')).default()
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      root: __dirname,
      build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: false,
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
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
    
    console.log('Build completed with correct structure!');
    
    // Verify structure
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Dist contents:', distFiles);
    
    // Check if index.html exists
    const indexExists = await fs.access(path.join(__dirname, 'dist/index.html')).then(() => true).catch(() => false);
    console.log('Index.html in dist:', indexExists);
    
    // Check backend
    const backendExists = await fs.access(path.join(__dirname, 'dist/index.js')).then(() => true).catch(() => false);
    console.log('Backend in dist:', backendExists);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

buildCorrectStructure();