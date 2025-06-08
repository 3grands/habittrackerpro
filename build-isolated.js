#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🏗️  Building HabitFlow for deployment...');

try {
  // Clean previous build
  if (existsSync('dist')) {
    console.log('🧹 Cleaning previous build...');
    rmSync('dist', { recursive: true, force: true });
  }

  // Kill any existing dev servers to free port 5000
  console.log('🛑 Stopping development servers...');
  try {
    execSync('pkill -f "npm run dev" || true', { stdio: 'pipe' });
    execSync('pkill -f "vite" || true', { stdio: 'pipe' });
    execSync('pkill -f "tsx.*server" || true', { stdio: 'pipe' });
  } catch (e) {
    // Ignore kill errors
  }

  // Wait for processes to terminate
  console.log('⏳ Waiting for cleanup...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Build frontend with isolated configuration
  console.log('📦 Building frontend...');
  execSync('vite build --config vite.build.config.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Build backend with proper environment
  console.log('🔧 Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'build' }
  });

  console.log('✅ Build completed successfully!');
  console.log('🚀 Ready for deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}