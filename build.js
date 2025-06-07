import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildApp() {
  try {
    console.log('Building frontend...');
    
    // Build frontend with explicit configuration
    await build({
      root: path.resolve(__dirname, 'client'),
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        rollupOptions: {
          input: path.resolve(__dirname, 'client/index.html')
        }
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
    });
    
    console.log('Frontend build completed successfully');
    
    console.log('Building backend...');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log('Backend build completed successfully');
    console.log('Build process completed!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();