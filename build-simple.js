#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function buildDeployment() {
  console.log('Building for deployment...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create simple vite config without problematic imports
    const simpleConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  mode: 'production',
});
`;

    writeFileSync('vite.simple.config.js', simpleConfig);

    // Set environment variables to avoid conflicts
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      XDG_CONFIG_HOME: process.env.HOME + '/.config',
      XDG_DATA_HOME: process.env.HOME + '/.local/share',
      XDG_CACHE_HOME: process.env.HOME + '/.cache'
    };

    // Build frontend
    console.log('Building frontend...');
    execSync('vite build --config vite.simple.config.js', { 
      stdio: 'inherit',
      env: env
    });

    // Build backend
    console.log('Building backend...');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit',
      env: { ...env, NODE_ENV: 'build' }
    });

    // Clean up
    rmSync('vite.simple.config.js');

    // Verify
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Deployment build completed successfully!');
      console.log('Frontend: dist/public/');
      console.log('Backend: dist/index.js');
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    
    if (existsSync('vite.simple.config.js')) {
      rmSync('vite.simple.config.js');
    }
    
    process.exit(1);
  }
}

buildDeployment();