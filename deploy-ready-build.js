import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createDeploymentBuild() {
  try {
    console.log('🚀 Creating deployment-ready build...');
    
    // Clean and prepare directories
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });

    // Build frontend with esbuild to bypass EISDIR
    console.log('Building frontend with esbuild...');
    
    const htmlSource = path.join(__dirname, 'client/index.html');
    const htmlDest = path.join(__dirname, 'dist/public/index.html');
    let htmlContent = await fs.readFile(htmlSource, 'utf-8');
    
    // Process CSS
    await build({
      entryPoints: [path.join(__dirname, 'client/src/index.css')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/assets/index.css'),
      loader: { '.css': 'css' },
      minify: true
    });
    
    // Build JavaScript
    await build({
      entryPoints: [path.join(__dirname, 'client/src/main.tsx')],
      bundle: true,
      outfile: path.join(__dirname, 'dist/public/assets/index.js'),
      format: 'esm',
      target: 'es2020',
      minify: true,
      sourcemap: true,
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
        '.svg': 'text'
      },
      external: []
    });
    
    // Update HTML with asset references
    htmlContent = htmlContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      `<link rel="stylesheet" href="/assets/index.css">
    <script type="module" src="/assets/index.js"></script>`
    );
    
    await fs.writeFile(htmlDest, htmlContent);
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify --target=node18', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Copy necessary files
    await fs.mkdir(path.join(__dirname, 'dist/shared'), { recursive: true });
    await fs.copyFile(
      path.join(__dirname, 'shared/schema.ts'),
      path.join(__dirname, 'dist/shared/schema.ts')
    );
    
    // Create production start script
    const startScript = `#!/bin/bash
export NODE_ENV=production
export DISABLE_DEV_DEPENDENCIES=true
node index.js
`;
    
    await fs.writeFile(path.join(__dirname, 'dist/start.sh'), startScript);
    await fs.chmod(path.join(__dirname, 'dist/start.sh'), 0o755);
    
    console.log('✅ Deployment build completed successfully!');
    console.log('🎯 Ready for deployment with Replit Deployments');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

createDeploymentBuild();