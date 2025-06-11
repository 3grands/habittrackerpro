#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);

// Check different possible paths for index.html
const possiblePaths = [
  path.resolve(__dirname, 'index.html'),
  path.resolve(__dirname, 'client', 'index.html'),
  path.resolve(process.cwd(), 'index.html'),
  path.resolve(process.cwd(), 'client', 'index.html'),
];

console.log('\nChecking index.html paths:');
possiblePaths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`${exists ? '✓' : '✗'} ${p}`);
});

// Check the actual path resolution used in server/vite.ts
const serverPath = new URL(import.meta.url).pathname;
const viteTemplatePath = path.resolve(
  path.dirname(serverPath),
  "..",
  "client",
  "index.html"
);
console.log('\nVite template path (as used in server):', viteTemplatePath);
console.log('Exists:', fs.existsSync(viteTemplatePath));

// Check if we can read the file
try {
  const content = fs.readFileSync(path.resolve(__dirname, 'client', 'index.html'), 'utf-8');
  console.log('\nindex.html content preview:');
  console.log(content.substring(0, 200) + '...');
} catch (error) {
  console.log('\nError reading index.html:', error.message);
}