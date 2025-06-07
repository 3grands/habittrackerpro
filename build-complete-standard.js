#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildComplete() {
  try {
    console.log('Building complete application...');
    
    // Clean and create dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist', 'public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist', 'shared'), { recursive: true });
    
    // Build frontend
    await build({
      entryPoints: ['client/src/main.tsx'],
      bundle: true,
      outfile: 'dist/public/app.js',
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
    
    // Build backend
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      outfile: 'dist/index.js',
      format: 'esm',
      platform: 'node',
      target: 'node20',
      packages: 'external',
      minify: false
    });
    
    // Copy and update index.html
    const indexHtmlContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
    const updatedHtml = indexHtmlContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<script type="module" src="/app.js"></script>'
    );
    await fs.writeFile(path.join(__dirname, 'dist', 'public', 'index.html'), updatedHtml);
    
    // Copy shared schema
    await fs.copyFile(
      path.join(__dirname, 'shared', 'schema.ts'),
      path.join(__dirname, 'dist', 'shared', 'schema.ts')
    );
    
    // Create production package.json with standard Vite scripts
    const productionPackageJson = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview --port=$PORT",
        "start": "node index.js"
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'dist', 'package.json'),
      JSON.stringify(productionPackageJson, null, 2)
    );
    
    console.log('✓ Complete build finished');
    
    // Show build results
    const stats = await fs.stat(path.join(__dirname, 'dist', 'index.js'));
    const frontendStats = await fs.stat(path.join(__dirname, 'dist', 'public', 'app.js'));
    
    console.log(`Backend: ${(stats.size / 1024).toFixed(1)}KB`);
    console.log(`Frontend: ${(frontendStats.size / 1024).toFixed(1)}KB`);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

buildComplete();