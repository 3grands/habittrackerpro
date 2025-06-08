#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

async function buildForProduction() {
  console.log('Building HabitFlow for production deployment...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create a minimal vite config that doesn't import server code
    const minimalViteConfig = `
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
    port: 3001, // Use different port to avoid conflict
  }
});
`;

    writeFileSync('vite.deploy.config.js', minimalViteConfig);

    // Build frontend with isolated config
    console.log('Building frontend with isolated configuration...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.deploy.config.js'], {
      NODE_ENV: 'production'
    });

    console.log('Building backend...');
    await runCommand('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], {
      NODE_ENV: 'build'
    });

    // Clean up temporary config
    if (existsSync('vite.deploy.config.js')) {
      rmSync('vite.deploy.config.js');
    }

    console.log('Production build completed successfully!');
    console.log('Build artifacts available in /dist directory');
    console.log('Frontend: /dist/public');
    console.log('Backend: /dist/index.js');

  } catch (error) {
    console.error('Production build failed:', error.message);
    
    // Clean up on error
    if (existsSync('vite.deploy.config.js')) {
      rmSync('vite.deploy.config.js');
    }
    
    process.exit(1);
  }
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'pipe',
      env: { ...process.env, ...env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

buildForProduction();