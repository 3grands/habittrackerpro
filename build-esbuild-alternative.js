import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWithEsbuild() {
  try {
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });

    console.log('🎨 Building frontend with esbuild...');
    
    // Copy index.html
    const htmlSource = path.join(__dirname, 'client/index.html');
    const htmlDest = path.join(__dirname, 'dist/public/index.html');
    let htmlContent = await fs.readFile(htmlSource, 'utf-8');
    
    // Update HTML to point to built assets
    htmlContent = htmlContent.replace(
      '/src/main.tsx', 
      '/assets/main.js'
    );
    
    await fs.writeFile(htmlDest, htmlContent);
    
    // Build React app with esbuild
    await build({
      entryPoints: [path.join(__dirname, 'client/src/main.tsx')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/assets/main.js'),
      format: 'esm',
      target: 'es2020',
      minify: true,
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.MODE': '"production"'
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
        '.svg': 'file'
      },
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    });
    
    // Copy CSS if exists
    const cssFiles = await glob('client/src/**/*.css');
    for (const cssFile of cssFiles) {
      const relativePath = path.relative('client/src', cssFile);
      const destPath = path.join(__dirname, 'dist/public/assets', relativePath);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(cssFile, destPath);
    }
    
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

buildWithEsbuild();