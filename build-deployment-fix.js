#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, rmSync, mkdirSync, copyFileSync } from 'fs';
import path from 'path';

async function buildForDeployment() {
  console.log('Building for deployment with fixes...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Step 1: Build frontend
    console.log('Building frontend...');
    execSync('npx vite build --outDir dist/public', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Step 2: Build server with CommonJS format and proper externals
    console.log('Building server...');
    execSync([
      'npx esbuild server/start.ts',
      '--bundle',
      '--platform=node',
      '--format=cjs',
      '--packages=external',
      '--outfile=dist/server.js',
      '--define:process.env.NODE_ENV=\\"production\\"',
      '--target=node18',
      '--external:*.node',
      '--external:lightningcss'
    ].join(' '), { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Step 3: Create production package.json with CommonJS
    const productionPackage = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "commonjs",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(productionPackage, null, 2)
    );

    // Step 4: Copy shared schema
    if (existsSync('shared')) {
      mkdirSync('dist/shared', { recursive: true });
      execSync('cp -r shared/* dist/shared/', { stdio: 'inherit' });
    }

    // Step 5: Create .replit configuration for single port
    const replitConfig = `
run = "cd dist && node server.js"

[deployment]
run = ["sh", "-c", "cd dist && node server.js"]

[[ports]]
localPort = 5000
externalPort = 80
`;

    writeFileSync('.replit', replitConfig);

    console.log('✅ Deployment build completed successfully!');
    console.log('Built files:');
    console.log('  - dist/server.js (CommonJS server bundle)');
    console.log('  - dist/public/ (Frontend assets)');
    console.log('  - dist/package.json (Production config)');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildForDeployment();