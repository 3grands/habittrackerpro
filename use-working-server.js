#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function useWorkingServer() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    packageJson.scripts.dev = "npx tsx server/working-dev-server.ts";
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Updated to use Vite-based working dev server');
    
  } catch (error) {
    console.error('Failed to update dev script:', error.message);
    process.exit(1);
  }
}

useWorkingServer();