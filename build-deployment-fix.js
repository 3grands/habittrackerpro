#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForDeployment() {
  try {
    console.log('🏗️ Starting deployment build...');
    
    // Build frontend with correct configuration
    console.log('📦 Building frontend...');
    await build({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      mode: 'production'
    });
    
    console.log('✅ Frontend build completed');
    
    // Build backend
    console.log('⚙️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    console.log('✅ Backend build completed');
    console.log('🚀 Deployment build finished successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();