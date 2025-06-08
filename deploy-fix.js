#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';

console.log('Building for deployment...');

try {
  // Clean build directory
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
  }

  // Create a temporary package.json with build-only script
  const tempPackage = {
    "type": "module",
    "scripts": {
      "build-frontend": "vite build --config vite.minimal.config.ts"
    }
  };

  writeFileSync('temp-package.json', JSON.stringify(tempPackage, null, 2));

  // Build frontend using different package.json to avoid conflicts
  console.log('Building frontend...');
  execSync('npm run build-frontend --package=temp-package.json', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', PORT: '0' }
  });

  // Build backend with build environment flag
  console.log('Building backend...');
  execSync('NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit'
  });

  // Clean up temporary file
  if (existsSync('temp-package.json')) {
    rmSync('temp-package.json');
  }

  console.log('Deployment build completed successfully');

} catch (error) {
  console.error('Build failed:', error.message);
  
  // Clean up temporary file on error
  if (existsSync('temp-package.json')) {
    rmSync('temp-package.json');
  }
  
  process.exit(1);
}