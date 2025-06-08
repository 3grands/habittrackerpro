#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function deploymentSolution() {
  console.log('Creating deployment build without cartographer dependency...');

  try {
    // Clean previous builds
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Build CSS first using Tailwind
    console.log('Building styles...');
    execSync('npx tailwindcss -i ./client/src/index.css -o ./dist/public/main.css --minify', { 
      stdio: 'inherit'
    });

    // Build React frontend using esbuild (completely bypasses Vite and cartographer)
    console.log('Building frontend...');
    const buildCommand = [
      'npx esbuild client/src/main.tsx',
      '--bundle',
      '--outfile=dist/public/main.js',
      '--format=esm',
      '--jsx=automatic',
      '--define:process.env.NODE_ENV="production"',
      '--loader:.tsx=tsx',
      '--loader:.ts=ts',
      '--loader:.jsx=jsx',
      '--loader:.js=js',
      '--loader:.css=css',
      '--loader:.png=file',
      '--loader:.jpg=file',
      '--loader:.jpeg=file',
      '--loader:.svg=file',
      '--target=es2020',
      '--minify',
      `--resolve-dir=${__dirname}`,
      '--alias:@=./client/src',
      '--alias:@shared=./shared',
      '--alias:@assets=./attached_assets'
    ].join(' ');

    execSync(buildCommand, { stdio: 'inherit' });

    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --target=node18', { 
      stdio: 'inherit'
    });

    // Create optimized HTML
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Build Better Habits</title>
    <meta name="description" content="Transform your daily routines with HabitFlow's intelligent habit tracking and AI-powered coaching." />
    <meta name="keywords" content="habit tracker, productivity, personal development, goal setting" />
    <meta property="og:title" content="HabitFlow - Build Better Habits" />
    <meta property="og:description" content="Transform your daily routines with intelligent habit tracking" />
    <meta property="og:type" content="website" />
    <link rel="stylesheet" href="/main.css" />
    <link rel="preload" href="/main.js" as="script" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;

    writeFileSync('dist/public/index.html', html);

    // Create package.json for deployment
    const deployPackage = {
      "name": "habitflow-deploy",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));

    // Verify all components exist
    const requiredFiles = [
      'dist/public/index.html',
      'dist/public/main.js', 
      'dist/public/main.css',
      'dist/index.js',
      'dist/package.json'
    ];

    const missing = requiredFiles.filter(file => !existsSync(file));
    
    if (missing.length > 0) {
      throw new Error(`Missing files: ${missing.join(', ')}`);
    }

    console.log('✅ Deployment build completed successfully!');
    console.log('📁 Frontend assets: dist/public/');
    console.log('🚀 Backend server: dist/index.js');
    console.log('📦 Deployment ready - cartographer dependency bypassed');
    
    return true;

  } catch (error) {
    console.error('❌ Deployment build failed:', error.message);
    return false;
  }
}

const success = deploymentSolution();
process.exit(success ? 0 : 1);