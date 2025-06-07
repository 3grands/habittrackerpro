#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForDeployment() {
  try {
    console.log('Building application for deployment...');
    
    // Clean and create dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });
    
    // Build backend with all dependencies
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --sourcemap', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Build frontend with full React bundle
    console.log('Building frontend...');
    execSync(`npx esbuild client/src/main.tsx --bundle --outfile=dist/public/assets/main.js --format=esm --target=es2020 --jsx=automatic --define:process.env.NODE_ENV='"production"' --minify --sourcemap --external:none`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Build CSS
    execSync(`npx esbuild client/src/index.css --bundle --outfile=dist/public/assets/main.css --minify`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Create production HTML
    const prodIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>HabitFlow - Smart Habit Tracking for Better Living</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - an intelligent habit tracker featuring AI coaching, mood tracking, and ADHD-friendly design. Build lasting habits that stick." />
    <meta name="keywords" content="habit tracker, habit building, productivity, wellness, ADHD support, neurodiversity, mindfulness, AI coaching" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta property="og:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    <meta property="og:site_name" content="HabitFlow" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta name="twitter:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="HabitFlow" />
    <link rel="canonical" href="/" />
    
    <!-- Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <link rel="stylesheet" href="/assets/main.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodIndexHtml);
    
    // Copy package.json for production dependencies
    const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf-8'));
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: "module",
      scripts: {
        start: "node index.js"
      },
      dependencies: {
        express: packageJson.dependencies.express
      }
    };
    
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(prodPackageJson, null, 2));
    
    console.log('Build completed successfully!');
    console.log('Files ready for deployment in dist/ directory');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForDeployment();