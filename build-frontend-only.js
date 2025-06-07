#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildFrontend() {
  try {
    console.log('Building frontend with standard Vite-like output...');
    
    // Ensure dist/public directory exists
    await fs.mkdir(path.join(__dirname, 'dist', 'public'), { recursive: true });
    
    // Build React app using esbuild
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
    
    // Copy and update index.html
    const indexHtmlContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
    const updatedHtml = indexHtmlContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<script type="module" src="/app.js"></script>'
    );
    
    await fs.writeFile(path.join(__dirname, 'dist', 'public', 'index.html'), updatedHtml);
    
    console.log('Frontend build completed successfully');
    
  } catch (error) {
    console.error('Frontend build failed:', error.message);
    process.exit(1);
  }
}

buildFrontend();