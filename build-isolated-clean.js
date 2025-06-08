#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Build process that completely avoids server imports
async function isolatedBuild() {
  console.log('Starting isolated deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Create ultra-minimal vite config
    const ultraMinimalConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/home/runner/workspace/client/src",
      "@shared": "/home/runner/workspace/shared",
      "@assets": "/home/runner/workspace/attached_assets",
    },
  },
  root: "/home/runner/workspace/client",
  build: {
    outDir: "/home/runner/workspace/dist/public",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
  mode: 'production',
  clearScreen: false,
  logLevel: 'warn',
});
`;

    writeFileSync('vite.ultra.config.js', ultraMinimalConfig);

    // Build frontend in completely isolated process
    console.log('Building frontend with isolated configuration...');
    const frontendProcess = spawn('npx', ['vite', 'build', '--config', 'vite.ultra.config.js'], {
      stdio: 'pipe',
      env: { 
        NODE_ENV: 'production',
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        TERM: 'xterm'
      },
      cwd: process.cwd(),
      detached: false
    });

    let frontendOutput = '';
    let frontendError = '';

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      frontendOutput += output;
      process.stdout.write(output);
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      frontendError += output;
      if (!output.includes('HabitFlow running on port')) {
        process.stderr.write(output);
      }
    });

    await new Promise((resolve, reject) => {
      frontendProcess.on('close', (code) => {
        if (code === 0 || (frontendError.includes('build completed') || frontendOutput.includes('built in'))) {
          resolve();
        } else if (frontendError.includes('HabitFlow running on port')) {
          reject(new Error('Build triggered server startup - configuration issue'));
        } else {
          reject(new Error(`Frontend build failed with code ${code}`));
        }
      });

      frontendProcess.on('error', reject);

      // Kill process if it hangs due to server startup
      setTimeout(() => {
        if (!frontendProcess.killed) {
          frontendProcess.kill('SIGKILL');
          reject(new Error('Frontend build timed out - likely server startup conflict'));
        }
      }, 30000);
    });

    console.log('Frontend build completed');

    // Build backend with isolation
    console.log('Building backend...');
    const backendProcess = spawn('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], {
      stdio: 'inherit',
      env: { 
        NODE_ENV: 'build',
        PATH: process.env.PATH,
        HOME: process.env.HOME
      }
    });

    await new Promise((resolve, reject) => {
      backendProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Backend build failed with code ${code}`));
        }
      });

      backendProcess.on('error', reject);
    });

    // Clean up
    if (existsSync('vite.ultra.config.js')) {
      rmSync('vite.ultra.config.js');
    }

    // Verify build artifacts
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/index.js');

    if (frontendExists && backendExists) {
      console.log('Deployment build successful!');
      console.log('Frontend assets: dist/public/');
      console.log('Backend bundle: dist/index.js');
      return true;
    } else {
      throw new Error('Build verification failed - missing artifacts');
    }

  } catch (error) {
    console.error('Deployment build failed:', error.message);
    
    // Clean up on error
    if (existsSync('vite.ultra.config.js')) {
      rmSync('vite.ultra.config.js');
    }
    
    return false;
  }
}

isolatedBuild().then(success => {
  process.exit(success ? 0 : 1);
});