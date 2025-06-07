import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deployBuild() {
  try {
    console.log('🏗️  Starting deployment build...');
    
    // Clean and create dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    console.log('📁  Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('🎨  Building frontend...');
    
    // Copy client source to temporary location to avoid the index.html issue
    const tempClientDir = path.join(__dirname, 'temp-client');
    await fs.rm(tempClientDir, { recursive: true, force: true });
    await fs.mkdir(tempClientDir, { recursive: true });
    
    // Copy src directory
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempClientDir, 'src'), { recursive: true });
    
    // Create a new index.html in temp location
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
    
    await fs.writeFile(path.join(tempClientDir, 'index.html'), indexContent);
    
    // Create a temporary vite config for the build
    const tempViteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("${path.join(__dirname, 'client/src')}"),
      "@shared": path.resolve("${path.join(__dirname, 'shared')}"),
      "@assets": path.resolve("${path.join(__dirname, 'attached_assets')}"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: true,
  },
});
`;
    
    await fs.writeFile(path.join(tempClientDir, 'vite.config.js'), tempViteConfig);
    
    // Build with temp directory
    execSync(`cd ${tempClientDir} && npx vite build`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Clean up temp directory
    await fs.rm(tempClientDir, { recursive: true, force: true });
    
    console.log('✅  Deployment build completed successfully!');
    console.log('📦  Built files are in the dist/ directory');
    
  } catch (error) {
    console.error('❌  Deployment build failed:', error);
    process.exit(1);
  }
}

deployBuild();