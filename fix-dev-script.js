#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixDevScript() {
  try {
    console.log('Updating dev script to use fixed server...');
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Update dev script to use the fixed server
    packageJson.scripts.dev = "npx tsx server/dev-server-fixed.ts";
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Updated dev script successfully');
    
  } catch (error) {
    console.error('Failed to update dev script:', error.message);
    process.exit(1);
  }
}

fixDevScript();