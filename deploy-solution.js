#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function deploymentSolution() {
  console.log('Resolving deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create deployment-specific vite config that avoids server imports
    const deployConfig = `
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
  server: {
    port: 3001
  }
});
`;

    writeFileSync('vite.deploy.config.js', deployConfig);

    // Build with environment that prevents server startup
    console.log('Building frontend...');
    execSync('VITE_BUILD_ONLY=true NODE_ENV=production vite build --config vite.deploy.config.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        VITE_BUILD_ONLY: 'true',
        PORT: '3001',
        XDG_CONFIG_HOME: process.env.HOME + '/.config'
      }
    });

    console.log('Building backend...');
    execSync('NODE_ENV=build esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit'
    });

    // Clean up config
    rmSync('vite.deploy.config.js');

    // Verify build
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Deployment build resolved successfully');
      console.log('Frontend built to dist/public/');
      console.log('Backend built to dist/index.js');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Deployment build failed:', error.message);
    
    if (existsSync('vite.deploy.config.js')) {
      rmSync('vite.deploy.config.js');
    }
    
    return false;
  }
}

const success = deploymentSolution();
process.exit(success ? 0 : 1);