#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

async function buildIsolated() {
  console.log('Starting isolated build process...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Create minimal vite config for production build
    const minimalViteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
`;

    writeFileSync('vite.build.config.js', minimalViteConfig);

    // Build frontend with isolated config
    console.log('Building frontend with isolated configuration...');
    execSync('npx vite build --config vite.build.config.js', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_NODE_ENV: 'production'
      }
    });

    // Build backend separately
    console.log('Building backend...');
    execSync('npx esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js --packages=external --target=node18 --define:process.env.NODE_ENV=\\"production\\"', { 
      stdio: 'inherit'
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

    // Copy shared schema
    if (existsSync('shared')) {
      mkdirSync('dist/shared', { recursive: true });
      execSync('cp -r shared/* dist/shared/', { stdio: 'inherit' });
    }

    // Clean up temporary config
    if (existsSync('vite.build.config.js')) {
      rmSync('vite.build.config.js');
    }

    console.log('Build completed successfully!');
    console.log('Output directory: dist/');
    console.log('Frontend assets: dist/public/');
    console.log('Server file: dist/server.js');
    
  } catch (error) {
    console.error('Build failed:', error.message);
    
    // Clean up on failure
    if (existsSync('vite.build.config.js')) {
      rmSync('vite.build.config.js');
    }
    
    process.exit(1);
  }
}

buildIsolated();