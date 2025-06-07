#!/usr/bin/env node

import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWithRollup() {
  try {
    console.log('Building with Rollup to bypass EISDIR error...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend using Rollup
    console.log('Building frontend with Rollup...');
    
    const bundle = await rollup({
      input: path.resolve(__dirname, 'client/src/main.tsx'),
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          preventAssignment: true
        }),
        resolve({
          browser: true,
          preferBuiltins: false
        }),
        commonjs(),
        typescript({
          tsconfig: path.resolve(__dirname, 'tsconfig.json'),
          compilerOptions: {
            declaration: false,
            declarationMap: false,
            outDir: path.resolve(__dirname, 'dist/public')
          }
        }),
        terser()
      ],
      external: []
    });
    
    await bundle.write({
      file: path.resolve(__dirname, 'dist/public/main.js'),
      format: 'es',
      sourcemap: false
    });
    
    await bundle.close();
    
    // Create the HTML file manually
    const htmlContent = `<!DOCTYPE html>
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
    
    <style>
      /* Critical CSS */
      * { box-sizing: border-box; }
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      #root { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), htmlContent);
    
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
    
    // Create production package.json
    const packageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      }
    };
    
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log('Production build completed successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
    // Verify outputs
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Public files:', publicFiles);
    console.log('Dist files:', distFiles);
    
    // Check file sizes
    const stats = await fs.stat(path.join(__dirname, 'dist/public/main.js'));
    console.log(`Main.js size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

buildWithRollup();