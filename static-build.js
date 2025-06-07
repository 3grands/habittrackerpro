import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createStaticBuild() {
  try {
    console.log('Creating static build directory...');
    
    // Create dist directory structure
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'dist/public/assets'), { recursive: true });
    
    // Copy index.html to dist
    const indexHtml = await fs.readFile(path.join(__dirname, 'client/index.html'), 'utf-8');
    
    // Update script path for production
    const prodIndexHtml = indexHtml.replace(
      'src="/src/main.tsx"',
      'src="/assets/main.js"'
    );
    
    await fs.writeFile(path.join(__dirname, 'dist/public/index.html'), prodIndexHtml);
    console.log('HTML file copied and updated');
    
    // Build TypeScript/React with esbuild directly
    console.log('Building frontend with esbuild...');
    execSync(`npx esbuild client/src/main.tsx --bundle --outfile=dist/public/assets/main.js --format=esm --target=es2020 --jsx=automatic --define:process.env.NODE_ENV='"production"' --external:react --external:react-dom`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Copy React dependencies
    console.log('Copying React dependencies...');
    execSync('cp node_modules/react/umd/react.production.min.js dist/public/assets/', { stdio: 'inherit' });
    execSync('cp node_modules/react-dom/umd/react-dom.production.min.js dist/public/assets/', { stdio: 'inherit' });
    
    // Build backend
    console.log('Building backend...');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Static build completed successfully!');
    
  } catch (error) {
    console.error('Static build failed:', error);
    process.exit(1);
  }
}

createStaticBuild();