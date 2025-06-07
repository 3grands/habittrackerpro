import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deploymentBuild() {
  try {
    console.log('🚀 Starting deployment build process...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    console.log('🎨 Building frontend...');
    
    // Build frontend using esbuild (bypasses Vite EISDIR issue)
    const buildCommand = `npx esbuild client/src/main.tsx \
      --bundle \
      --format=esm \
      --target=es2020 \
      --jsx=automatic \
      --loader:.css=css \
      --loader:.svg=file \
      --loader:.png=file \
      --loader:.jpg=file \
      --loader:.jpeg=file \
      --outdir=dist/public/assets \
      --entry-names=[name]-[hash] \
      --chunk-names=[name]-[hash] \
      --asset-names=[name]-[hash] \
      --splitting \
      --minify \
      --define:process.env.NODE_ENV='"production"'`;
    
    execSync(buildCommand, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('🎨 Building CSS...');
    
    // Build CSS with Tailwind
    execSync('npx tailwindcss -i client/src/index.css -o dist/public/assets/main.css --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('📄 Creating production HTML...');
    
    // Find generated asset filenames
    const assetsDir = path.join(__dirname, 'dist/public/assets');
    const files = await fs.readdir(assetsDir);
    const jsFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
    const cssFile = files.find(f => f.endsWith('.css') && !f.endsWith('.map'));
    
    // Create optimized production HTML
    const prodIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>HabitFlow - Smart Habit Tracking for Better Living</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - an intelligent habit tracker featuring AI coaching, mood tracking, and ADHD-friendly design. Build lasting habits that stick." />
    <meta name="keywords" content="habit tracker, habit building, productivity, wellness, ADHD support, neurodiversity, mindfulness, AI coaching" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta property="og:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    <meta property="og:site_name" content="HabitFlow" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta name="twitter:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="HabitFlow" />
    <link rel="canonical" href="/" />
    
    <!-- Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="/assets/${jsFile}" as="script" />
    <link rel="preload" href="/assets/${cssFile}" as="style" />
    
    <link rel="stylesheet" href="/assets/${cssFile}">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodIndexHtml);
    
    console.log('🏗️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('📝 Creating production start script...');
    
    // Create production start script
    const startScript = `#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_ENV = 'production';

// Import and start the server
await import('./index.js');
`;
    
    await fs.writeFile(path.join(__dirname, 'dist/start.js'), startScript);
    
    console.log('✅ Deployment build completed successfully!');
    console.log('📦 Built files are ready in the dist/ directory');
    console.log('🚀 Ready for deployment with Replit Deployments');
    
    // Provide deployment information
    console.log('\n📋 Deployment Information:');
    console.log('   - Frontend: dist/public/');
    console.log('   - Backend: dist/index.js');
    console.log('   - Start command: node dist/index.js');
    console.log('   - Port: 5000 (or from PORT env var)');
    
  } catch (error) {
    console.error('❌ Deployment build failed:', error);
    process.exit(1);
  }
}

deploymentBuild();