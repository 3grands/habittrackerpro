#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixTsxScript() {
  try {
    console.log('Fixing tsx script in package.json...');
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Update scripts to use npx tsx
    packageJson.scripts.dev = "npx tsx server/dev-server.ts";
    packageJson.scripts.build = "vite build && npx tsx server/build.ts";
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Fixed tsx scripts in package.json');
    
  } catch (error) {
    console.error('Failed to fix tsx scripts:', error.message);
    process.exit(1);
  }
}

fixTsxScript();