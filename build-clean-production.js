#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

async function buildProduction() {
  console.log('Creating clean production build without cartographer...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Build CSS
    console.log('Building styles...');
    execSync('npx tailwindcss -i ./client/src/index.css -o ./dist/public/main.css --minify', { 
      stdio: 'inherit'
    });

    // Build frontend using esbuild
    console.log('Building frontend...');
    const esbuildConfig = `
import { build } from 'esbuild';
import { resolve } from 'path';

await build({
  entryPoints: ['client/src/main.tsx'],
  bundle: true,
  outfile: 'dist/public/main.js',
  format: 'esm',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file'
  },
  target: 'es2020',
  minify: true,
  alias: {
    '@': resolve('./client/src'),
    '@shared': resolve('./shared'),
    '@assets': resolve('./attached_assets')
  }
});
`;

    writeFileSync('esbuild.config.mjs', esbuildConfig);
    execSync('node esbuild.config.mjs', { stdio: 'inherit' });

    // Build backend using clean production entry point
    console.log('Building backend...');
    execSync('npx esbuild server/start-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js --target=node18', { 
      stdio: 'inherit'
    });

    // Create HTML file
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Build Better Habits</title>
    <meta name="description" content="Transform your daily routines with HabitFlow's intelligent habit tracking and AI-powered coaching." />
    <link rel="stylesheet" href="/main.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;

    writeFileSync('dist/public/index.html', indexHtml);

    // Create deployment package.json
    const deployPackage = {
      "name": "habitflow-deploy",
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

    writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));

    // Clean up temp files
    if (existsSync('esbuild.config.mjs')) {
      rmSync('esbuild.config.mjs');
    }

    // Verify build
    const requiredFiles = [
      'dist/public/index.html',
      'dist/public/main.js', 
      'dist/public/main.css',
      'dist/server.js',
      'dist/package.json'
    ];

    const missing = requiredFiles.filter(file => !existsSync(file));
    
    if (missing.length > 0) {
      throw new Error(`Missing files: ${missing.join(', ')}`);
    }

    console.log('Production build completed successfully!');
    console.log('Frontend assets: dist/public/');
    console.log('Backend server: dist/server.js');
    console.log('Deployment ready - cartographer completely removed');
    
    return true;

  } catch (error) {
    console.error('Production build failed:', error.message);
    return false;
  }
}

const success = await buildProduction();
process.exit(success ? 0 : 1);