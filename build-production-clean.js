#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function productionBuild() {
  console.log('Creating production build without cartographer...');

  try {
    // Stop any running processes that might conflict
    try {
      execSync('pkill -f "vite" || true', { stdio: 'pipe' });
      execSync('pkill -f "npm run dev" || true', { stdio: 'pipe' });
    } catch (e) {
      // Ignore process kill errors
    }

    // Wait for cleanup
    execSync('sleep 2');

    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Build frontend with esbuild (avoids cartographer completely)
    console.log('Building frontend with esbuild...');
    execSync('cd client && npx esbuild src/main.tsx --bundle --outfile=../dist/public/main.js --format=esm --jsx=automatic --define:process.env.NODE_ENV="production" --external:react --external:react-dom --minify', { 
      stdio: 'inherit'
    });

    // Build backend
    console.log('Building backend...');
    execSync('NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { 
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

    // Verify build
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js') && existsSync('dist/public/main.js')) {
      console.log('Production build completed successfully!');
      console.log('Build bypassed cartographer import conflict');
      console.log('Frontend: dist/public/');
      console.log('Backend: dist/index.js');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Production build failed:', error.message);
    return false;
  }
}

const success = productionBuild();
process.exit(success ? 0 : 1);