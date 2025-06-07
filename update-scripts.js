#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function updateScripts() {
  try {
    // Read current package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Update scripts to the requested configuration
    packageJson.scripts = {
      "dev": "vite",
      "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
      "preview": "vite preview --port=$PORT",
      "start": "NODE_ENV=production node dist/index.js",
      "check": "tsc",
      "db:push": "drizzle-kit push"
    };
    
    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Updated package.json scripts');
    console.log('Scripts:', JSON.stringify(packageJson.scripts, null, 2));
    
  } catch (error) {
    console.error('Failed to update scripts:', error.message);
    process.exit(1);
  }
}

updateScripts();