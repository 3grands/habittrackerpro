#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';

async function quickDeploymentFix() {
  console.log('Creating quick deployment fix...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build server only with proper configuration
    console.log('Building server with deployment fixes...');
    execSync([
      'npx esbuild server/start.ts',
      '--bundle',
      '--platform=node',
      '--format=cjs',
      '--packages=external',
      '--outfile=dist/server.js',
      '--define:process.env.NODE_ENV=\\"production\\"',
      '--target=node18',
      '--external:lightningcss',
      '--external:*.node',
      '--external:@neondatabase/serverless',
      '--external:express',
      '--external:drizzle-orm'
    ].join(' '), { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Create production package.json with CommonJS
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

    // Copy shared schema
    if (existsSync('shared')) {
      mkdirSync('dist/shared', { recursive: true });
      execSync('cp -r shared/* dist/shared/', { stdio: 'inherit' });
    }

    // Copy client files temporarily (for faster testing)
    mkdirSync('dist/public', { recursive: true });
    execSync('cp -r client/* dist/public/', { stdio: 'inherit' });

    // Create simple .replit for deployment
    const replitConfig = `run = "cd dist && node server.js"

[deployment]
run = ["sh", "-c", "cd dist && node server.js"]

[[ports]]
localPort = 5000
externalPort = 80
`;

    writeFileSync('.replit', replitConfig);

    console.log('✅ Quick deployment fix completed!');
    console.log('Server built with:');
    console.log('  - CommonJS format for compatibility');
    console.log('  - External packages to avoid bundling issues');
    console.log('  - 0.0.0.0 host binding for Cloud Run');
    console.log('  - Proper error handling');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

quickDeploymentFix();