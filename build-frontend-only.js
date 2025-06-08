#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, cpSync } from 'fs';
import path from 'path';

function buildFrontend() {
  console.log('Building frontend for deployment...');

  try {
    // Clean dist
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Create completely isolated config
    const isolatedConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "${process.cwd()}/client/src",
      "@shared": "${process.cwd()}/shared",
      "@assets": "${process.cwd()}/attached_assets",
    },
  },
  root: "${process.cwd()}/client",
  build: {
    outDir: "${process.cwd()}/dist/public",
    emptyOutDir: true,
    rollupOptions: {
      input: "${process.cwd()}/client/index.html"
    }
  },
  mode: 'production',
});
`;

    writeFileSync('vite.isolated.config.js', isolatedConfig);

    // Build with clean environment
    execSync('NODE_ENV=production npx vite build --config vite.isolated.config.js --force', { 
      stdio: 'inherit',
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: 'production',
        VITE_BUILD_ONLY: 'true'
      }
    });

    console.log('Frontend build completed');

    // Build backend separately without server startup
    console.log('Building backend...');
    execSync(`NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js`, { 
      stdio: 'inherit'
    });

    // Clean up
    rmSync('vite.isolated.config.js');

    // Verify
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Deployment build successful!');
      return true;
    } else {
      throw new Error('Missing build artifacts');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    if (existsSync('vite.isolated.config.js')) {
      rmSync('vite.isolated.config.js');
    }
    return false;
  }
}

const success = buildFrontend();
process.exit(success ? 0 : 1);