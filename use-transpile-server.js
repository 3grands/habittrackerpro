#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function useTranspileServer() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    packageJson.scripts.dev = "npx tsx server/transpile-dev-server.ts";
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Updated to use transpile dev server');
    
  } catch (error) {
    console.error('Failed to update dev script:', error.message);
    process.exit(1);
  }
}

useTranspileServer();