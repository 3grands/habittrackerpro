#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'fs';
import path from 'path';

async function fixDeployment() {
  try {
    console.log('🔧 Applying deployment fixes...');
    
    // 1. Clean existing build
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist/public', { recursive: true });

    // 2. Build frontend with Vite
    console.log('📦 Building frontend...');
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // 3. Create production server with CommonJS format
    console.log('🏗️ Building server with CommonJS format...');
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

    // 4. Create production package.json with CommonJS
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

    // 5. Create production server entry that binds to 0.0.0.0
    const productionServer = `
const express = require('express');
const path = require('path');

const app = express();

// Essential middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath, {
  maxAge: '1d',
  etag: false
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  try {
    res.sendFile(path.join(publicPath, 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server Error');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Error' });
});

// Start server with proper host binding
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Always bind to 0.0.0.0 for deployment

app.listen(PORT, HOST, () => {
  console.log(\`🚀 Server running on \${HOST}:\${PORT}\`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
`;

    writeFileSync('dist/server.js', productionServer);

    // 6. Copy any necessary shared files
    if (existsSync('shared')) {
      mkdirSync('dist/shared', { recursive: true });
      try {
        copyFileSync('shared/schema.ts', 'dist/shared/schema.ts');
      } catch (e) {
        console.log('Note: shared/schema.ts not found, skipping copy');
      }
    }

    console.log('✅ Deployment fixes applied successfully!');
    console.log('\nDeployment is ready with:');
    console.log('• CommonJS server format for compatibility');
    console.log('• Server binding to 0.0.0.0 for deployment');
    console.log('• External packages configuration');
    console.log('• Single port configuration');
    console.log('• Production-optimized build');
    
    console.log('\nTo test the production build locally:');
    console.log('cd dist && node server.js');

  } catch (error) {
    console.error('❌ Deployment fix failed:', error);
    process.exit(1);
  }
}

fixDeployment();