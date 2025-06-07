import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function productionBuild() {
  try {
    console.log('Starting production build...');
    
    // Clean and create dist directory
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });
    
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Building frontend assets...');
    
    // Build main React application with esbuild
    execSync(`npx esbuild client/src/main.tsx --bundle --outfile=dist/public/assets/main.js --format=esm --target=es2020 --jsx=automatic --define:process.env.NODE_ENV='"production"' --minify --sourcemap --loader:.css=css --loader:.svg=file --loader:.png=file --loader:.jpg=file --loader:.jpeg=file`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Generate CSS bundle
    execSync(`npx esbuild client/src/index.css --bundle --outfile=dist/public/assets/main.css --minify`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Creating production HTML...');
    
    // Create production index.html
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
    
    <link rel="stylesheet" href="/assets/main.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodIndexHtml);
    
    // Create a simplified server serve script
    const serveScript = `import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
    
    await fs.writeFile(path.join(__dirname, 'dist/serve.js'), serveScript);
    
    console.log('Production build completed successfully!');
    console.log('To start the production server: node dist/serve.js');
    
  } catch (error) {
    console.error('Production build failed:', error);
    process.exit(1);
  }
}

productionBuild();