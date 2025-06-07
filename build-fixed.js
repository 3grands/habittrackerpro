import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildForProduction() {
  try {
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });

    console.log('🎨 Building frontend...');
    
    // Build frontend with explicit configuration
    await build({
      root: path.resolve(__dirname, 'client'),
      plugins: [
        (await import('@vitejs/plugin-react')).default(),
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        rollupOptions: {
          input: path.resolve(__dirname, 'client/index.html'),
        },
      },
    });
    
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

buildForProduction();