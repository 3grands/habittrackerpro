#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createStandardBuild() {
  try {
    console.log('Creating production build with standard Vite structure...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    
    // Build frontend with Vite-compatible structure
    await build({
      entryPoints: ['client/src/main.tsx'],
      bundle: true,
      outfile: 'dist/assets/index.js',
      format: 'esm',
      target: 'es2020',
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.MODE': '"production"',
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false'
      },
      alias: {
        '@': path.join(__dirname, 'client/src'),
        '@shared': path.join(__dirname, 'shared'),
        '@assets': path.join(__dirname, 'attached_assets')
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      },
      minify: true,
      sourcemap: false
    });
    
    // Build CSS separately
    await fs.mkdir(path.join(__dirname, 'dist', 'assets'), { recursive: true });
    await fs.writeFile(
      path.join(__dirname, 'dist', 'assets', 'index.css'),
      `/* CSS processed by build system */\n@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n`
    );
    
    // Build backend
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      outfile: 'dist/server.js',
      format: 'esm',
      platform: 'node',
      target: 'node20',
      packages: 'external',
      minify: false
    });
    
    // Create production index.html with proper asset links
    const indexHtmlContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
    const productionHtml = indexHtmlContent
      .replace('<script type="module" src="/src/main.tsx"></script>', 
               '<link rel="stylesheet" href="/assets/index.css">\n    <script type="module" src="/assets/index.js"></script>')
      .replace('/src/main.tsx', '/assets/index.js');
    
    await fs.writeFile(path.join(__dirname, 'dist', 'index.html'), productionHtml);
    
    // Create package.json with proper start script
    const packageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "server.js",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview --port=$PORT",
        "start": "node server.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'dist', 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Copy shared files
    await fs.mkdir(path.join(__dirname, 'dist', 'shared'), { recursive: true });
    await fs.copyFile(
      path.join(__dirname, 'shared', 'schema.ts'),
      path.join(__dirname, 'dist', 'shared', 'schema.ts')
    );
    
    // Get file sizes
    const serverStats = await fs.stat(path.join(__dirname, 'dist', 'server.js'));
    const frontendStats = await fs.stat(path.join(__dirname, 'dist', 'assets', 'index.js'));
    
    console.log('✓ Production build complete');
    console.log(`Backend: ${(serverStats.size / 1024).toFixed(1)}KB`);
    console.log(`Frontend: ${(frontendStats.size / 1024).toFixed(1)}KB`);
    
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    const assetFiles = await fs.readdir(path.join(__dirname, 'dist', 'assets'));
    console.log(`Structure: ${distFiles.join(', ')}`);
    console.log(`Assets: ${assetFiles.join(', ')}`);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

createStandardBuild();