#!/usr/bin/env node

import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deployProduction() {
  try {
    console.log('Starting production deployment build...');
    
    // Clean all build artifacts
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend using Vite API directly to bypass file system issues
    console.log('Building frontend with direct Vite API...');
    
    await build({
      configFile: false,
      root: path.join(__dirname, 'client'),
      base: '/',
      plugins: [
        react({
          jsxRuntime: 'automatic'
        })
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.PROD': true,
        'import.meta.env.DEV': false,
      },
      build: {
        outDir: path.resolve(__dirname, 'dist', 'public'),
        emptyOutDir: true,
        sourcemap: false,
        minify: 'terser',
        target: 'esnext',
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'client', 'index.html')
          },
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['@radix-ui/react-dialog', '@radix-ui/react-button', 'lucide-react'],
              utils: ['clsx', 'tailwind-merge', 'date-fns']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      },
      css: {
        postcss: path.join(__dirname, 'postcss.config.js')
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@tanstack/react-query']
      }
    });
    
    console.log('Frontend build completed successfully');
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Copy shared directory for runtime use
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    // Verify build outputs
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    
    console.log('Production build completed successfully!');
    console.log('Dist contents:', distFiles.join(', '));
    console.log('Public assets:', publicFiles.join(', '));
    
    // Create deployment info
    const deployInfo = {
      buildDate: new Date().toISOString(),
      nodeEnv: 'production',
      frontendAssets: publicFiles.length,
      backendBundle: distFiles.includes('index.js')
    };
    
    await fs.writeFile(
      path.join(__dirname, 'dist/deploy-info.json'), 
      JSON.stringify(deployInfo, null, 2)
    );
    
    console.log('Deployment ready! Use "npm start" to run the production build.');
    
  } catch (error) {
    console.error('Production build failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

deployProduction();