#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function addPreviewScript() {
  try {
    // Read current package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add preview script
    packageJson.scripts.preview = "vite preview --port=${PORT:-4173} --host 0.0.0.0";
    
    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Added preview script to package.json');
    
    // Ensure build is ready for preview
    console.log('Building for preview...');
    await import('./fix-production-structure.js');
    
  } catch (error) {
    console.error('Failed to add preview script:', error.message);
    process.exit(1);
  }
}

addPreviewScript();