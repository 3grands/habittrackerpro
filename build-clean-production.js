#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

async function buildProduction() {
  console.log('Creating production build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create clean vite config without server imports
    const cleanViteConfig = `
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
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  mode: 'production',
});
`;

    writeFileSync('vite.clean.config.js', cleanViteConfig);

    // Build frontend without any server imports
    console.log('Building frontend...');
    execSync('NODE_ENV=production npx vite build --config vite.clean.config.js', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Build backend separately
    console.log('Building backend...');
    execSync('NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit'
    });

    // Clean up temporary config
    if (existsSync('vite.clean.config.js')) {
      rmSync('vite.clean.config.js');
    }

    console.log('Production build completed successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
    // Test if build artifacts exist
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Build verification: All artifacts created successfully');
    } else {
      throw new Error('Build verification failed: Missing build artifacts');
    }

  } catch (error) {
    console.error('Production build failed:', error.message);
    
    // Clean up on error
    if (existsSync('vite.clean.config.js')) {
      rmSync('vite.clean.config.js');
    }
    
    process.exit(1);
  }
}

buildProduction();