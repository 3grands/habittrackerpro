#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixViteStructure() {
  try {
    // Ensure index.html is in root and remove from client
    const rootIndexPath = path.join(__dirname, 'index.html');
    const clientIndexPath = path.join(__dirname, 'client', 'index.html');
    
    // Check if client/index.html exists and remove it
    try {
      await fs.access(clientIndexPath);
      await fs.unlink(clientIndexPath);
      console.log('Removed client/index.html');
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Ensure root index.html exists
    try {
      await fs.access(rootIndexPath);
      console.log('Root index.html exists');
    } catch (error) {
      // Create root index.html from backup if needed
      const backupPath = path.join(__dirname, 'client', 'index.html.backup');
      try {
        const backupContent = await fs.readFile(backupPath, 'utf-8');
        await fs.writeFile(rootIndexPath, backupContent);
        console.log('Created root index.html from backup');
      } catch (backupError) {
        console.error('No backup found, cannot create root index.html');
      }
    }
    
    console.log('Vite structure fixed for standard build');
    
  } catch (error) {
    console.error('Failed to fix Vite structure:', error.message);
    process.exit(1);
  }
}

fixViteStructure();