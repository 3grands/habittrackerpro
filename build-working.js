#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function buildWorking() {
  console.log('Creating deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create minimal vite config
    const config = `
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

    writeFileSync('vite.working.config.js', config);

    // Set complete environment
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      XDG_CONFIG_HOME: process.env.HOME + '/.config',
      XDG_DATA_HOME: process.env.HOME + '/.local/share',
      XDG_CACHE_HOME: process.env.HOME + '/.cache',
      XDG_RUNTIME_DIR: '/tmp',
      USER: process.env.USER || 'runner',
      SHELL: '/bin/bash'
    };

    // Kill any processes using port 5000
    try {
      execSync('ps aux | grep ":5000" | grep -v grep | awk \'{print $2}\' | xargs kill -9 || true', { stdio: 'pipe' });
    } catch (e) {
      // Ignore kill errors
    }

    // Wait for cleanup
    execSync('sleep 2');

    // Build frontend
    console.log('Building frontend...');
    execSync('vite build --config vite.working.config.js', { 
      stdio: 'inherit',
      env: buildEnv
    });

    // Build backend
    console.log('Building backend...');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit',
      env: { ...buildEnv, NODE_ENV: 'build' }
    });

    // Clean up
    rmSync('vite.working.config.js');

    // Verify
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Deployment build completed successfully!');
      console.log('Build artifacts created in dist/ directory');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    
    if (existsSync('vite.working.config.js')) {
      rmSync('vite.working.config.js');
    }
    
    return false;
  }
}

const success = buildWorking();
process.exit(success ? 0 : 1);