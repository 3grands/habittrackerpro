#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildClean() {
  try {
    console.log('Creating clean deployment build...');
    
    // Clean all possible cache and build directories
    const cleanDirs = ['dist', 'node_modules/.vite', '.vite', 'client/.vite'];
    for (const dir of cleanDirs) {
      try {
        await fs.rm(path.join(__dirname, dir), { recursive: true, force: true });
      } catch (e) {
        // Directory might not exist
      }
    }
    
    // Create fresh dist directory
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Create a temporary build directory with proper structure
    const tempDir = path.join(__dirname, 'temp-build');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Copy client source files to temp directory
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempDir, 'shared'), { recursive: true });
    await fs.cp(path.join(__dirname, 'attached_assets'), path.join(tempDir, 'attached_assets'), { recursive: true });
    
    // Create clean index.html in temp directory
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Smart Habit Tracking</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create package.json for temp build
    const packageJson = {
      "type": "module",
      "dependencies": {}
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create vite config for temp build
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: false,
  },
});`;
    
    await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
    
    // Build from temp directory
    console.log('Building frontend from clean environment...');
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
    
    console.log('Clean deployment build completed successfully!');
    console.log('Frontend: dist/public/');
    console.log('Backend: dist/index.js');
    
  } catch (error) {
    console.error('Clean build failed:', error.message);
    process.exit(1);
  }
}

buildClean();