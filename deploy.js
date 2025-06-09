#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
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

async function buildForDeployment() {
  console.log('🚀 Building HabitFlow for deployment...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      console.log('Cleaning previous build...');
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build frontend with production config
    console.log('📦 Building frontend...');
    await runCommand('npx', ['vite', 'build', '--config', 'vite.config.production.ts'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production'
      }
    });

    // Build backend
    console.log('⚙️ Building backend...');
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

    console.log('✅ Deployment build completed successfully!');
    
    // Verify build artifacts
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/server.js');
    
    if (frontendExists && backendExists) {
      console.log('🎉 Build verification passed');
      console.log('📁 Frontend: dist/public/');
      console.log('🖥️ Backend: dist/server.js');
      console.log('🚀 Ready for deployment!');
      console.log('\nTo start production server: node dist/server.js');
    } else {
      throw new Error('Build verification failed - missing artifacts');
    }

  } catch (error) {
    console.error('❌ Deployment build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();