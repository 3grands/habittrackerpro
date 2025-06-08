#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';

function buildWithRollup() {
  console.log('Building with Rollup to avoid server conflicts...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Create rollup config that bypasses vite server imports
    const rollupConfig = `
import { defineConfig } from 'rollup';
import react from '@vitejs/plugin-react';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  input: 'client/src/main.tsx',
  output: {
    dir: 'dist/public',
    format: 'es',
    entryFileNames: 'assets/[name]-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash].[ext]'
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    nodeResolve({
      browser: true,
      exportConditions: ['import']
    }),
    commonjs(),
    react(),
    terser()
  ],
  external: []
});
`;

    writeFileSync('rollup.config.js', rollupConfig);

    // Copy index.html template
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>
`;

    writeFileSync('dist/public/index.html', indexHtml);

    // Build frontend with rollup
    console.log('Building frontend with Rollup...');
    execSync('npx rollup -c rollup.config.js', {
      stdio: 'inherit',
      env: {
        NODE_ENV: 'production',
        PATH: process.env.PATH,
        HOME: process.env.HOME
      }
    });

    // Build backend
    console.log('Building backend...');
    execSync('NODE_ENV=build npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', {
      stdio: 'inherit'
    });

    // Clean up
    rmSync('rollup.config.js');

    // Verify
    if (existsSync('dist/public/index.html') && existsSync('dist/index.js')) {
      console.log('Rollup deployment build completed successfully');
      return true;
    } else {
      throw new Error('Build verification failed');
    }

  } catch (error) {
    console.error('Rollup build failed:', error.message);
    
    if (existsSync('rollup.config.js')) {
      rmSync('rollup.config.js');
    }
    
    return false;
  }
}

const success = buildWithRollup();
process.exit(success ? 0 : 1);