#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🏗️  Building HabitFlow for production...');

try {
  // Clean previous build
  if (existsSync('dist')) {
    console.log('🧹 Cleaning previous build...');
    rmSync('dist', { recursive: true, force: true });
  }

  // Build frontend
  console.log('📦 Building frontend...');
  execSync('vite build --config vite.build.config.ts', { stdio: 'inherit' });

  // Build backend with proper environment
  console.log('🔧 Building backend...');
  execSync('NODE_ENV=build esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'build' }
  });

  console.log('✅ Build completed successfully!');
  console.log('🚀 Run "npm start" to start the production server');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}