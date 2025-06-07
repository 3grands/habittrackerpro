#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function quickDeploy() {
  try {
    console.log('Creating quick deployment build...');
    
    // Clean and create dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build backend first
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    // Create minimal frontend build manually
    console.log('Creating minimal frontend...');
    
    // Read and bundle the main CSS
    const cssContent = await fs.readFile(path.join(__dirname, 'client/src/index.css'), 'utf-8');
    
    // Create minimal production HTML
    const prodHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HabitFlow - Smart Habit Tracking</title>
  <meta name="description" content="Transform your daily routines with HabitFlow - intelligent habit tracking with AI coaching.">
  <style>${cssContent}</style>
</head>
<body>
  <div id="root">
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h1>HabitFlow</h1>
        <p>Loading your habit tracking dashboard...</p>
        <div style="margin: 20px 0;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite; margin: 0 auto;"></div>
        </div>
      </div>
    </div>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <script>
    // Check if API is available and redirect to app
    fetch('/api/habits')
      .then(response => {
        if (response.ok) {
          document.getElementById('root').innerHTML = \`
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
              <div style="text-align: center;">
                <h1>HabitFlow</h1>
                <p>Your habit tracking application is ready!</p>
                <p><a href="/api/habits" style="color: #3498db;">View API</a> | <a href="/api/health" style="color: #3498db;">Health Check</a></p>
                <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                  <h3>Quick Actions</h3>
                  <p>Backend API is running and ready for deployment</p>
                </div>
              </div>
            </div>
          \`;
        }
      })
      .catch(() => {
        setTimeout(() => window.location.reload(), 3000);
      });
  </script>
</body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodHtml);
    
    // Create a basic manifest and service info
    const manifest = {
      name: "HabitFlow",
      short_name: "HabitFlow",
      description: "Smart Habit Tracking Application",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3498db"
    };
    
    await fs.writeFile(
      path.join(__dirname, 'dist/public/manifest.json'), 
      JSON.stringify(manifest, null, 2)
    );
    
    // Create deployment info
    const deployInfo = {
      buildDate: new Date().toISOString(),
      nodeEnv: 'production',
      buildType: 'quick-deploy',
      components: {
        backend: 'built',
        frontend: 'minimal',
        api: 'ready'
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'dist/deploy-info.json'), 
      JSON.stringify(deployInfo, null, 2)
    );
    
    // Verify build
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    
    console.log('Quick deployment build completed!');
    console.log('Backend files:', distFiles.filter(f => f !== 'public').join(', '));
    console.log('Frontend files:', publicFiles.join(', '));
    
    // Test backend build
    try {
      const indexExists = await fs.access(path.join(__dirname, 'dist/index.js')).then(() => true).catch(() => false);
      const htmlExists = await fs.access(path.join(__dirname, 'dist/public/index.html')).then(() => true).catch(() => false);
      
      if (indexExists && htmlExists) {
        console.log('Deployment ready! All required files present.');
        console.log('Run "npm start" to test the production build.');
      } else {
        console.log('Warning: Some files missing');
      }
    } catch (e) {
      console.log('Build verification completed with warnings');
    }
    
  } catch (error) {
    console.error('Quick deploy failed:', error.message);
    process.exit(1);
  }
}

quickDeploy();