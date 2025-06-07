#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWorkaround() {
  try {
    console.log('Starting workaround build process...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Create a temporary clean build environment
    const tempBuildDir = path.join(__dirname, 'temp-build-env');
    await fs.rm(tempBuildDir, { recursive: true, force: true });
    await fs.mkdir(tempBuildDir, { recursive: true });
    
    // Copy source files
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempBuildDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempBuildDir, 'shared'), { recursive: true });
    
    // Create package.json for temp environment
    const tempPackageJson = {
      "type": "module",
      "name": "temp-build",
      "version": "1.0.0"
    };
    await fs.writeFile(path.join(tempBuildDir, 'package.json'), JSON.stringify(tempPackageJson, null, 2));
    
    // Generate clean HTML content programmatically
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Smart Habit Tracking</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - intelligent habit tracking with AI coaching." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(tempBuildDir, 'index.html'), htmlContent);
    
    // Build using Vite API with explicit configuration
    console.log('Building frontend from clean environment...');
    
    await build({
      configFile: false,
      root: tempBuildDir,
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(tempBuildDir, "src"),
          "@shared": path.resolve(tempBuildDir, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'dist', 'public'),
        emptyOutDir: true,
        rollupOptions: {
          input: path.resolve(tempBuildDir, 'index.html'),
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    console.log('Frontend build completed');
    
    // Clean up temp directory
    await fs.rm(tempBuildDir, { recursive: true, force: true });
    
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
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    // Verify build results
    const distContents = await fs.readdir(path.join(__dirname, 'dist'));
    const publicContents = await fs.readdir(path.join(__dirname, 'dist/public'));
    
    console.log('Build completed successfully!');
    console.log('Dist directory:', distContents.join(', '));
    console.log('Public assets:', publicContents.join(', '));
    
    // Check for required files
    const hasIndex = publicContents.includes('index.html');
    const hasAssets = publicContents.some(f => f.startsWith('assets') || f.endsWith('.js') || f.endsWith('.css'));
    const hasBackend = distContents.includes('index.js');
    
    if (hasIndex && hasAssets && hasBackend) {
      console.log('All required build artifacts present');
      console.log('Deployment build ready');
    } else {
      console.log('Warning: Some expected files may be missing');
      if (!hasIndex) console.log('- Missing index.html');
      if (!hasAssets) console.log('- Missing frontend assets');
      if (!hasBackend) console.log('- Missing backend bundle');
    }
    
  } catch (error) {
    console.error('Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

buildWorkaround();