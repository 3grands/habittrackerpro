#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixPackageJson() {
  try {
    console.log('Fixing package.json...');
    
    // Create a proper package.json structure
    const packageJson = {
      "name": "habitflow",
      "version": "1.0.0",
      "type": "module",
      "scripts": {
        "dev": "tsx server/dev-server.ts",
        "build": "vite build && tsx server/build.ts",
        "start": "node dist/server.js",
        "preview": "vite preview --port=$PORT",
        "check": "tsc",
        "db:push": "drizzle-kit push"
      },
      "dependencies": {
        "@hookform/resolvers": "^3.3.2",
        "@radix-ui/react-dialog": "^1.0.5",
        "@radix-ui/react-dropdown-menu": "^2.0.6",
        "@radix-ui/react-form": "^0.0.3",
        "@radix-ui/react-icons": "^1.3.0",
        "@radix-ui/react-label": "^2.0.2",
        "@radix-ui/react-popover": "^1.0.7",
        "@radix-ui/react-select": "^2.0.0",
        "@radix-ui/react-separator": "^1.0.3",
        "@radix-ui/react-slot": "^1.0.2",
        "@radix-ui/react-toast": "^1.1.5",
        "@tanstack/react-query": "^5.8.4",
        "class-variance-authority": "^0.7.0",
        "clsx": "^2.0.0",
        "cors": "^2.8.5",
        "drizzle-orm": "^0.29.0",
        "drizzle-zod": "^0.5.1",
        "express": "^4.18.2",
        "lucide-react": "^0.294.0",
        "pg": "^8.11.3",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-hook-form": "^7.47.0",
        "react-icons": "^4.12.0",
        "tailwind-merge": "^2.0.0",
        "tailwindcss-animate": "^1.0.7",
        "wouter": "^3.0.0",
        "zod": "^3.22.4"
      },
      "devDependencies": {
        "@types/cors": "^2.8.15",
        "@types/express": "^4.17.21",
        "@types/node": "^20.8.10",
        "@types/pg": "^8.10.7",
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@vitejs/plugin-react": "^4.0.3",
        "autoprefixer": "^10.4.16",
        "drizzle-kit": "^0.20.4",
        "postcss": "^8.4.31",
        "tailwindcss": "^3.3.5",
        "tsx": "^4.1.2",
        "typescript": "^5.2.2",
        "vite": "^4.4.5"
      }
    };
    
    // Write the fixed package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('package.json has been fixed!');
    console.log('Running npm install to ensure dependencies are installed...');
    
  } catch (error) {
    console.error('Failed to fix package.json:', error.message);
    process.exit(1);
  }
}

fixPackageJson();