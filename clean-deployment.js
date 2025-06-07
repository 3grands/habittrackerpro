import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanDeployment() {
  try {
    console.log('Creating clean deployment build...');
    
    // Remove any existing problematic directories
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.rm(path.join(__dirname, 'temp-deploy'), { recursive: true, force: true });
    
    // Create clean temporary directory
    const tempDir = path.join(__dirname, 'temp-deploy');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Copy all necessary source files to temp directory
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempDir, 'shared'), { recursive: true });
    await fs.cp(path.join(__dirname, 'attached_assets'), path.join(tempDir, 'attached_assets'), { recursive: true });
    
    // Create clean index.html in temp directory
    const indexHtml = `<!DOCTYPE html>
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
    
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create clean vite config for temp build
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(process.cwd(), "index.html"),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});`;
    
    await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
    
    // Create package.json for temp build
    const packageJson = {
      "type": "module",
      "dependencies": {}
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create dist directory
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend from clean temp directory
    console.log('Building frontend...');
    execSync('npx vite build', {
      stdio: 'inherit',
      cwd: tempDir,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    console.log('✅ Clean deployment build completed successfully!');
    
    // Verify build outputs
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    
    console.log('Frontend files built:', publicFiles);
    console.log('Backend files built:', distFiles);
    
    return true;
    
  } catch (error) {
    console.error('❌ Clean deployment failed:', error.message);
    return false;
  }
}

cleanDeployment();