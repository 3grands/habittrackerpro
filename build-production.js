import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildProduction() {
  try {
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });

    console.log('🎨 Building frontend with esbuild...');
    
    // Copy and process index.html
    const htmlSource = path.join(__dirname, 'client/index.html');
    const htmlDest = path.join(__dirname, 'dist/public/index.html');
    let htmlContent = await fs.readFile(htmlSource, 'utf-8');
    
    // Update HTML to point to built assets
    htmlContent = htmlContent.replace(
      '<script type="module" src="/src/main.tsx"></script>', 
      '<script type="module" src="/assets/main.js"></script>'
    );
    
    await fs.writeFile(htmlDest, htmlContent);
    
    // Build CSS first
    console.log('📦 Processing CSS...');
    const cssResult = await build({
      entryPoints: [path.join(__dirname, 'client/src/index.css')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/assets/main.css'),
      loader: { '.css': 'css' },
      minify: true,
      sourcemap: false
    });
    
    // Build React app with esbuild
    console.log('⚛️ Building React application...');
    const jsResult = await build({
      entryPoints: [path.join(__dirname, 'client/src/main.tsx')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/assets/main.js'),
      format: 'esm',
      target: 'es2020',
      minify: true,
      sourcemap: true,
      treeShaking: true,
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.MODE': '"production"',
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false'
      },
      alias: {
        '@': path.join(__dirname, 'client/src'),
        '@shared': path.join(__dirname, 'shared'),
        '@assets': path.join(__dirname, 'attached_assets')
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
        '.css': 'css',
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.svg': 'text',
        '.gif': 'file',
        '.webp': 'file'
      },
      external: [],
      splitting: false,
      chunkNames: 'chunks/[name]-[hash]',
      assetNames: 'assets/[name]-[hash]'
    });
    
    // Update HTML to include CSS
    htmlContent = htmlContent.replace(
      '</head>',
      '    <link rel="stylesheet" href="/assets/main.css">\n  </head>'
    );
    await fs.writeFile(htmlDest, htmlContent);
    
    console.log('✅ Frontend build completed');
    
    console.log('🏗️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Copy shared directory for runtime access
    console.log('📋 Copying shared schema...');
    await fs.mkdir(path.join(__dirname, 'dist/shared'), { recursive: true });
    await fs.copyFile(
      path.join(__dirname, 'shared/schema.ts'),
      path.join(__dirname, 'dist/shared/schema.ts')
    );
    
    console.log('✅ Backend build completed');
    
    // Verify build output
    const stats = await fs.stat(path.join(__dirname, 'dist/public/index.html'));
    const jsStats = await fs.stat(path.join(__dirname, 'dist/public/assets/main.js'));
    const serverStats = await fs.stat(path.join(__dirname, 'dist/index.js'));
    
    console.log('📊 Build Summary:');
    console.log(`   HTML: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   JS Bundle: ${(jsStats.size / 1024).toFixed(2)} KB`);
    console.log(`   Server: ${(serverStats.size / 1024).toFixed(2)} KB`);
    console.log('🎉 Production build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildProduction();