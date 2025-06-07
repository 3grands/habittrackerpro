#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForProduction() {
  try {
    console.log('Creating production build...');
    
    // Create a clean temporary directory for the build
    const tempDir = path.join(__dirname, 'temp-build');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Copy all client source files to temp directory
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempDir, 'shared'), { recursive: true });
    
    // Create a clean index.html in temp directory
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>HabitFlow - Smart Habit Tracking for Better Living</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - an intelligent habit tracker featuring AI coaching, mood tracking, and ADHD-friendly design. Build lasting habits that stick." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create a simple vite config for the temp build
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("${path.join(__dirname, 'attached_assets')}"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});`;
    
    await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
    
    // Create package.json for temp build
    const packageJson = {
      "type": "module",
      "dependencies": {}
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Build frontend from temp directory
    console.log('Building frontend...');
    execSync('npx vite build', {
      stdio: 'inherit',
      cwd: tempDir,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
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
    
    // Copy shared schema for runtime
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    console.log('Production build completed successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
    // Verify build outputs
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    console.log('Public files:', publicFiles);
    console.log('Dist files:', distFiles);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

buildForProduction();