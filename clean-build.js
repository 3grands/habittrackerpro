import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanBuild() {
  try {
    console.log('🧹 Cleaning and preparing build environment...');
    
    // Clean dist and temp directories
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.rm(path.join(__dirname, 'build-temp'), { recursive: true, force: true });
    
    // Create fresh directories
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'build-temp'), { recursive: true });
    
    console.log('📁 Copying source files to clean build directory...');
    
    // Copy client source to temporary clean location
    await fs.cp(path.join(__dirname, 'client/src'), path.join(__dirname, 'build-temp/src'), { recursive: true });
    
    // Create a clean index.html file
    const indexContent = `<!DOCTYPE html>
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'build-temp/index.html'), indexContent);
    
    console.log('🎨 Building frontend with clean environment...');
    
    // Build frontend from clean temp directory
    await build({
      root: path.resolve(__dirname, 'build-temp'),
      plugins: [
        (await import('@vitejs/plugin-react')).default(),
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "build-temp", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: false,
      },
    });
    
    console.log('✅ Frontend build completed');
    
    console.log('🏗️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('🧹 Cleaning up temporary files...');
    await fs.rm(path.join(__dirname, 'build-temp'), { recursive: true, force: true });
    
    console.log('✅ Backend build completed');
    console.log('🎉 Clean build completed successfully!');
    console.log('📦 Built files are in the dist/ directory');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    // Clean up on failure
    await fs.rm(path.join(__dirname, 'build-temp'), { recursive: true, force: true }).catch(() => {});
    process.exit(1);
  }
}

cleanBuild();