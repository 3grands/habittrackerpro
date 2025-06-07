import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function productionReadyBuild() {
  try {
    console.log('Building production-ready application...');
    
    // Clean and prepare directories
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend with esbuild (bypasses Vite EISDIR error)
    console.log('Building frontend...');
    const frontendBuild = `npx esbuild client/src/main.tsx \
      --bundle \
      --format=esm \
      --target=es2020 \
      --jsx=automatic \
      --loader:.css=css \
      --loader:.svg=dataurl \
      --loader:.png=dataurl \
      --loader:.jpg=dataurl \
      --loader:.jpeg=dataurl \
      --outdir=dist/public/assets \
      --entry-names=[name]-[hash] \
      --minify \
      --define:process.env.NODE_ENV='"production"' \
      --external:@shared`;
    
    execSync(frontendBuild, { stdio: 'inherit', cwd: __dirname });
    
    // Build CSS
    console.log('Building styles...');
    execSync('npx tailwindcss -i client/src/index.css -o dist/public/assets/styles.css --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Get generated asset names
    const assetsDir = path.join(__dirname, 'dist/public/assets');
    const files = await fs.readdir(assetsDir);
    const jsFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
    const cssFile = 'styles.css';
    
    // Create production HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>HabitFlow - Smart Habit Tracking for Better Living</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - an intelligent habit tracker featuring AI coaching, mood tracking, and ADHD-friendly design. Build lasting habits that stick." />
    <link rel="stylesheet" href="/assets/${cssFile}">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), htmlContent);
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Copy shared schema for runtime
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    console.log('Production build completed successfully!');
    console.log('Files ready for deployment in dist/ directory');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

productionReadyBuild();