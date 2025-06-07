#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWithoutIndexHtml() {
  try {
    console.log('Building application with EISDIR workaround...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend without relying on index.html processing
    console.log('Building frontend components...');
    await build({
      configFile: false,
      plugins: [
        (await import('@vitejs/plugin-react')).default()
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: false,
        lib: {
          entry: path.resolve(__dirname, 'client/src/main.tsx'),
          name: 'HabitFlow',
          formats: ['es'],
          fileName: 'main'
        },
        rollupOptions: {
          external: [],
          output: {
            format: 'es'
          }
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    // Manually create index.html in dist/public
    const productionHtml = `<!DOCTYPE html>
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), productionHtml);
    
    console.log('Frontend build completed');
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    console.log('Build completed successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
    // Verify outputs
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Public files:', publicFiles);
    console.log('Dist files:', distFiles);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

buildWithoutIndexHtml();