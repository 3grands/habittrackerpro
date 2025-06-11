#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function revertDevScript() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Revert to original dev script
    packageJson.scripts.dev = "npx tsx server/dev-server.ts";
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Reverted dev script to original');
    
  } catch (error) {
    console.error('Failed to revert dev script:', error.message);
    process.exit(1);
  }
}

revertDevScript();