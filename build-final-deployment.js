#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

async function deploymentBuild() {
  console.log('Creating deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create minimal vite config without Replit plugins that cause server startup
    const minimalConfig = `
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
    minify: true,
    sourcemap: false,
  },
  mode: 'production',
});
`;

    writeFileSync('vite.deploy.config.js', minimalConfig);

    // Build frontend
    console.log('Building frontend...');
    execSync('NODE_ENV=production npx vite build --config vite.deploy.config.js', { 
      stdio: 'inherit'
    });

    // Build backend
    console.log('Building backend...');
    execSync('NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit'
    });

    // Clean up
    rmSync('vite.deploy.config.js');

    // Verify build
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Deployment build successful!');
      console.log('Frontend: dist/public/');
      console.log('Backend: dist/index.js');
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    
    // Cleanup on error
    if (existsSync('vite.deploy.config.js')) {
      rmSync('vite.deploy.config.js');
    }
    
    process.exit(1);
  }
}

deploymentBuild();