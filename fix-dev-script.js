#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  // Update dev script to include port configuration
  packageJson.scripts.dev = "vite --port 5000 --host 0.0.0.0";
  
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Updated dev script to use port 5000');
  
} catch (error) {
  console.error('Failed to update package.json:', error.message);
  process.exit(1);
}