#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import path from 'path';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Command timed out'));
    }, 120000); // 2 minute timeout

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function fastBuild() {
  console.log('Starting fast build process...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Create optimized vite config
    const fastConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve("client/src"),
      "@shared": resolve("shared"),
      "@assets": resolve("attached_assets"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  },
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    force: true
  }
});`;

    writeFileSync('vite.fast.config.js', fastConfig);

    // Build with simplified config
    console.log('Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.fast.config.js'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_BUILD_FAST: 'true'
      }
    });

    // Build server
    console.log('Building server...');
    await runCommand('npx', [
      'esbuild', 
      'server/production.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outfile=dist/server.js',
      '--define:process.env.NODE_ENV="production"'
    ]);

    // Verify build
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/server.js');
    
    if (frontendExists && backendExists) {
      console.log('Build completed successfully!');
      console.log('Frontend built to: dist/public/');
      console.log('Server built to: dist/server.js');
      console.log('Start with: node dist/server.js');
      return true;
    } else {
      throw new Error('Build verification failed - missing files');
    }

  } catch (error) {
    console.error('Build failed:', error.message);
    return false;
  }
}

fastBuild().then(success => {
  process.exit(success ? 0 : 1);
});