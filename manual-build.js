import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function manualBuild() {
  try {
    console.log('Starting manual build process...');
    
    // Clean dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    console.log('Building frontend using esbuild...');
    
    // Use esbuild for frontend instead of Vite
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
      --sourcemap`;
    
    execSync(buildCommand, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Building CSS...');
    
    // Build CSS separately
    execSync('npx tailwindcss -i client/src/index.css -o dist/public/assets/main.css --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Creating production HTML...');
    
    // Find the generated asset filenames
    const assetsDir = path.join(__dirname, 'dist/public/assets');
    const files = await fs.readdir(assetsDir);
    const jsFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
    const cssFile = files.find(f => f.startsWith('main-') && f.endsWith('.css') && !f.endsWith('.map'));
    
    // Create production HTML with correct asset references
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
    
    <link rel="stylesheet" href="/assets/${cssFile}">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodIndexHtml);
    
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Production build completed successfully!');
    console.log('Built files are in the dist/ directory');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

manualBuild();