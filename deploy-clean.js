#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, rmSync, mkdirSync } from 'fs';

const execAsync = promisify(exec);

async function cleanDeploy() {
  console.log('Creating clean deployment build...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Stop all conflicting processes
    console.log('Stopping development servers...');
    try {
      await execAsync('pkill -f "npm run dev" || true');
      await execAsync('pkill -f "vite" || true'); 
      await execAsync('pkill -f "tsx.*server" || true');
    } catch (e) {
      // Ignore process kill errors
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Build frontend with clean environment
    console.log('Building frontend...');
    const { stdout: frontendOutput, stderr: frontendError } = await execAsync(
      'npx vite build --config vite.minimal.config.ts',
      { 
        env: { 
          ...process.env, 
          NODE_ENV: 'production',
          PORT: undefined,
          VITE_PORT: undefined
        }
      }
    );

    if (frontendError && !frontendError.includes('warnings')) {
      throw new Error(`Frontend build failed: ${frontendError}`);
    }

    console.log('Frontend build completed');

    // Build backend with isolated environment
    console.log('Building backend...');
    const { stdout: backendOutput, stderr: backendError } = await execAsync(
      'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
      { 
        env: { 
          ...process.env, 
          NODE_ENV: 'build'
        }
      }
    );

    if (backendError && !backendError.includes('warnings')) {
      throw new Error(`Backend build failed: ${backendError}`);
    }

    console.log('Backend build completed');
    console.log('Deployment build successful!');
    console.log('Build artifacts are in the /dist directory');

  } catch (error) {
    console.error('Deployment build failed:', error.message);
    process.exit(1);
  }
}

cleanDeploy();