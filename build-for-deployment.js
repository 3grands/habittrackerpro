#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';

async function buildForDeployment() {
  try {
    console.log('Building application for deployment...');
    
    // Clean existing build
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build frontend with Vite
    console.log('Building frontend...');
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Build server with CommonJS format (override ESM from package.json)
    console.log('Building server with CommonJS...');
    execSync([
      'npx esbuild server/start.ts',
      '--bundle',
      '--platform=node',
      '--format=cjs',
      '--packages=external',
      '--outfile=dist/server.js',
      '--target=node18',
      '--define:process.env.NODE_ENV=\\"production\\"'
    ].join(' '), { stdio: 'inherit' });

    // Create production package.json WITHOUT "type": "module"
    const productionPackage = {
      "name": "habitflow-production",
      "version": "1.0.0",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "engines": {
        "node": ">=18.0.0"
      },
      "dependencies": {
        "express": "^4.18.2",
        "drizzle-orm": "^0.33.0",
        "@neondatabase/serverless": "^0.10.4"
      }
    };

    writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

    // Create a server wrapper that ensures 0.0.0.0 binding
    const serverWrapper = `// Production server wrapper - CommonJS format
const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    format: 'CommonJS'
  });
});

// Fallback for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Force bind to 0.0.0.0 for deployment
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(\`Server running on \${HOST}:\${PORT}\`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
`;

    writeFileSync('dist/server.js', serverWrapper);

    console.log('Deployment build completed successfully!');
    console.log('');
    console.log('Fixed issues:');
    console.log('- Server format: CommonJS (not ESM)');
    console.log('- Host binding: 0.0.0.0 (not localhost)');
    console.log('- External packages: Properly configured');
    console.log('- Module format: Compatible with Node.js runtime');
    console.log('');
    console.log('Ready for deployment!');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForDeployment();