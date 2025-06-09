#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
      timeout: 60000, // 1 minute timeout
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function quickBuild() {
  console.log('Building with simplified configuration...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Create minimal vite config for fast build
    const minimalConfig = `
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
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: false,
    minify: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});`;

    writeFileSync('vite.minimal.config.js', minimalConfig);

    // Build frontend with timeout
    console.log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.minimal.config.js'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production'
      }
    });

    // Build backend
    console.log('Building backend...');
    await runCommand('npx', [
      'esbuild', 
      'server/production.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outfile=dist/server.js'
    ]);

    console.log('Build completed successfully!');
    
    // Verify build
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/server.js');
    
    if (frontendExists && backendExists) {
      console.log('Build verification passed - Ready for deployment!');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    return false;
  }
}

quickBuild().then(success => {
  process.exit(success ? 0 : 1);
});