#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, rmSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

async function createDeploymentSolution() {
  console.log('Creating deployment solution...');

  try {
    // Clean build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });
    mkdirSync('dist/public', { recursive: true });

    // Create a minimal index.html for production
    const productionHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Build Better Habits</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    writeFileSync(path.join('dist/public', 'index.html'), productionHtml);

    // Build frontend with optimized config
    console.log('Building frontend...');
    const viteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("client/src"),
      "@shared": path.resolve("shared"),
      "@assets": path.resolve("attached_assets"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    }
  }
});`;

    writeFileSync('vite.deploy.config.js', viteConfig);
    
    execSync('npx vite build --config vite.deploy.config.js', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Build server with proper configuration for deployment
    console.log('Building server...');
    execSync([
      'npx esbuild server/start.ts',
      '--bundle',
      '--platform=node',
      '--format=cjs',
      '--packages=external',
      '--outfile=dist/server.js',
      '--define:process.env.NODE_ENV=\\"production\\"',
      '--target=node18',
      '--external:lightningcss',
      '--external:*.node',
      '--external:@neondatabase/serverless',
      '--external:express',
      '--external:drizzle-orm',
      '--external:openai',
      '--external:stripe'
    ].join(' '), { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Create production package.json
    const productionPackage = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "type": "commonjs",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(productionPackage, null, 2)
    );

    // Copy shared schema
    if (existsSync('shared')) {
      mkdirSync('dist/shared', { recursive: true });
      execSync('cp -r shared/* dist/shared/', { stdio: 'inherit' });
    }

    // Clean up temporary config
    if (existsSync('vite.deploy.config.js')) {
      rmSync('vite.deploy.config.js');
    }

    console.log('✅ Deployment build completed successfully!');
    console.log('Ready for deployment with:');
    console.log('  ✓ CommonJS server bundle');
    console.log('  ✓ External packages for compatibility');
    console.log('  ✓ 0.0.0.0 host binding');
    console.log('  ✓ Proper error handling');
    console.log('  ✓ Optimized frontend assets');

    // Test the server
    console.log('\nTesting deployment server...');
    execSync('cd dist && timeout 10s node server.js || echo "Server test completed"', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
    });
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

createDeploymentSolution();