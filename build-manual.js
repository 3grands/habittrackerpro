#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function manualBuild() {
  console.log('Creating manual deployment build...');

  try {
    // Clean and create build directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // Step 1: Build frontend without any config files that import server code
    console.log('Building frontend assets...');
    
    // Create a temporary, completely isolated package.json for building
    const tempPackage = {
      "type": "module",
      "dependencies": {
        "vite": "^5.4.14",
        "@vitejs/plugin-react": "^4.3.2",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
      }
    };
    
    writeFileSync('temp-package.json', JSON.stringify(tempPackage, null, 2));

    // Create minimal config in memory without imports
    const minimalViteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": new URL("./client/src", import.meta.url).pathname,
      "@shared": new URL("./shared", import.meta.url).pathname,
      "@assets": new URL("./attached_assets", import.meta.url).pathname,
    },
  },
  mode: "production",
});
`;

    writeFileSync('vite.temp.config.js', minimalViteConfig);

    // Build frontend using temporary config
    execSync('vite build --config vite.temp.config.js', {
      stdio: 'inherit',
      env: {
        NODE_ENV: 'production',
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        XDG_CONFIG_HOME: process.env.HOME + '/.config'
      }
    });

    console.log('Frontend build completed');

    // Step 2: Build backend
    console.log('Building backend...');
    execSync('NODE_ENV=build esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', {
      stdio: 'inherit'
    });

    // Clean up temporary files
    rmSync('temp-package.json');
    rmSync('vite.temp.config.js');

    // Verify build
    const frontendExists = existsSync('dist/public/index.html');
    const backendExists = existsSync('dist/index.js');

    if (frontendExists && backendExists) {
      console.log('Manual deployment build completed successfully');
      console.log('Frontend: dist/public/');
      console.log('Backend: dist/index.js');
      return true;
    } else {
      throw new Error('Build verification failed - missing files');
    }

  } catch (error) {
    console.error('Manual build failed:', error.message);
    
    // Clean up on error
    if (existsSync('temp-package.json')) rmSync('temp-package.json');
    if (existsSync('vite.temp.config.js')) rmSync('vite.temp.config.js');
    
    return false;
  }
}

const success = manualBuild();
process.exit(success ? 0 : 1);