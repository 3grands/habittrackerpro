#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import path from 'path';

async function buildProduction() {
  console.log('🚀 Building for production deployment...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Build CSS first using Tailwind directly
    console.log('🎨 Building CSS...');
    execSync('npx tailwindcss -i ./client/src/index.css -o ./dist/public/index.css --minify', { 
      stdio: 'inherit'
    });

    // Build frontend JavaScript using esbuild (avoiding Vite server conflicts)
    console.log('📦 Building frontend with esbuild...');
    execSync(`npx esbuild client/src/main.tsx --bundle --outfile=dist/public/index.js --format=esm --platform=browser --target=es2020 --minify --define:process.env.NODE_ENV='"production"' --alias:@=./client/src --alias:@shared=./shared --alias:@assets=./attached_assets --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts`, { 
      stdio: 'inherit'
    });

    // Create production HTML file
    console.log('📄 Creating production HTML...');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Build Better Habits</title>
    <meta name="description" content="Transform your life with intelligent habit tracking, AI-powered coaching, and personalized wellness insights." />
    <link rel="stylesheet" href="/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;

    writeFileSync('dist/public/index.html', htmlContent);

    // Build backend
    console.log('⚙️ Building backend...');
    execSync('npx esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js --packages=external --target=node18 --define:process.env.NODE_ENV=\\"production\\"', { 
      stdio: 'inherit'
    });

    // Create production package.json
    const productionPackage = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
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

    console.log('✅ Production build completed successfully!');
    console.log('📁 Output: dist/');
    console.log('🌐 Frontend: dist/public/');
    console.log('⚡ Server: dist/server.js');
    console.log('');
    console.log('Ready for deployment! The build fixes:');
    console.log('• ✅ Fixed package.json JSON syntax error');
    console.log('• ✅ Resolved port conflicts during build');
    console.log('• ✅ Created production-ready assets');
    console.log('• ✅ Optimized for deployment');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildProduction();