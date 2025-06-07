import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function finalDeployment() {
  try {
    console.log('Creating final deployment build...');
    
    // Clean dist
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build CSS first by extracting from the source
    console.log('Processing CSS...');
    const cssContent = await fs.readFile(path.join(__dirname, 'client/src/index.css'), 'utf-8');
    await fs.writeFile(path.join(__dirname, 'dist/public/main.css'), cssContent);
    
    // Build React app with esbuild
    console.log('Building React app...');
    await build({
      entryPoints: [path.join(__dirname, 'client/src/main.tsx')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/main.js'),
      format: 'esm',
      target: 'es2020',
      minify: true,
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
        '.css': 'css',
        '.png': 'dataurl',
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.svg': 'text',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.MODE': '"production"',
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false'
      },
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    });
    
    // Create production HTML
    const prodHtml = `<!DOCTYPE html>
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
    
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodHtml);
    
    // Build backend
    console.log('Building backend...');
    await build({
      entryPoints: [path.join(__dirname, 'server/index.ts')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/index.js'),
      platform: 'node',
      format: 'esm',
      target: 'node18',
      packages: 'external',
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    // Copy shared schema
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { recursive: true });
    
    // Create package.json for deployment
    const deployPackage = {
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "drizzle-orm": "^0.29.0",
        "@neondatabase/serverless": "^0.6.0"
      }
    };
    await fs.writeFile(path.join(__dirname, 'dist/package.json'), JSON.stringify(deployPackage, null, 2));
    
    console.log('✅ Final deployment build completed successfully!');
    
    // Verify outputs
    const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
    const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
    
    console.log('Frontend files:', publicFiles.join(', '));
    console.log('Backend files:', distFiles.filter(f => f.endsWith('.js')).join(', '));
    
    return true;
    
  } catch (error) {
    console.error('❌ Final deployment failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

finalDeployment();