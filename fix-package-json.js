#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

try {
  const packageJsonPath = 'package.json';
  let content = readFileSync(packageJsonPath, 'utf8');
  
  console.log('Fixing package.json structure...');
  
  // Fix the scripts section by replacing the malformed part
  content = content.replace(
    `  "scripts": {
    "dev": "vite",
    "build": "vite build && cross-env SKIP_SERVER_START=true esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js",
    "preview": "vite preview --port=$PORT"
  }

    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },`,
    `  "scripts": {
    "dev": "vite",
    "build": "vite build && cross-env SKIP_SERVER_START=true esbuild server/start.ts --platform=node --bundle --format=esm --outfile=dist/server.js",
    "preview": "vite preview --port=$PORT",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },`
  );
  
  // Validate the JSON structure
  const parsed = JSON.parse(content);
  console.log('JSON validation successful');
  
  // Write the fixed content
  writeFileSync(packageJsonPath, content, 'utf8');
  console.log('Fixed package.json successfully');
  
} catch (error) {
  console.error('Error:', error.message);
  
  // If JSON parsing fails, let's try a more surgical approach
  try {
    let content = readFileSync('package.json', 'utf8');
    
    // Remove the problematic lines and rebuild
    const lines = content.split('\n');
    const fixedLines = [];
    let inScripts = false;
    let scriptsBrace = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('"scripts":')) {
        inScripts = true;
        fixedLines.push(line);
        continue;
      }
      
      if (inScripts) {
        if (line.includes('{')) scriptsBrace++;
        if (line.includes('}')) scriptsBrace--;
        
        if (scriptsBrace === 0 && line.includes('}')) {
          // This is the end of scripts section
          fixedLines.push('    "start": "NODE_ENV=production node dist/index.js",');
          fixedLines.push('    "check": "tsc",');
          fixedLines.push('    "db:push": "drizzle-kit push"');
          fixedLines.push('  },');
          inScripts = false;
          continue;
        }
        
        if (line.includes('"preview":')) {
          fixedLines.push('    "preview": "vite preview --port=$PORT",');
          continue;
        }
        
        fixedLines.push(line);
      } else {
        // Skip malformed entries outside scripts
        if (line.includes('"start":') || line.includes('"check":') || line.includes('"db:push":')) {
          continue;
        }
        fixedLines.push(line);
      }
    }
    
    const fixedContent = fixedLines.join('\n');
    JSON.parse(fixedContent); // Validate
    writeFileSync('package.json', fixedContent, 'utf8');
    console.log('Fixed package.json with surgical approach');
    
  } catch (secondError) {
    console.error('Surgical fix also failed:', secondError.message);
    process.exit(1);
  }
}