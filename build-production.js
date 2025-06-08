import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';

async function buildProduction() {
  try {
    console.log('Building frontend...');
    
    // Build frontend with Vite
    await build({
      root: path.resolve(process.cwd(), 'client'),
      build: {
        outDir: path.resolve(process.cwd(), 'dist/public'),
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          "@": path.resolve(process.cwd(), "client", "src"),
          "@shared": path.resolve(process.cwd(), "shared"),
          "@assets": path.resolve(process.cwd(), "attached_assets"),
        },
      },
    });
    
    console.log('Frontend build complete.');
    
    console.log('Building backend...');
    
    // Build backend with esbuild
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit'
    });
    
    console.log('Backend build complete.');
    console.log('Production build finished successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProduction();