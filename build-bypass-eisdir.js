import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildBypassEisdir() {
  try {
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });

    console.log('🎨 Building frontend with file copy approach...');
    
    // First, copy the HTML file manually to avoid EISDIR
    const htmlSource = path.join(__dirname, 'client/index.html');
    const htmlDest = path.join(__dirname, 'dist/public/index.html');
    await fs.copyFile(htmlSource, htmlDest);
    
    // Build using rollup directly to avoid Vite's file handling issues
    console.log('📦 Running rollup build...');
    execSync(`npx rollup -c rollup.config.js`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    console.log('✅ Frontend build completed');
    
    console.log('🏗️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('✅ Backend build completed');
    console.log('🎉 Production build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildBypassEisdir();