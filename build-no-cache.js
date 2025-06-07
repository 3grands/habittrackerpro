import { build } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildWithoutCache() {
  try {
    console.log('🧹 Cleaning all cache and dist directories...');
    
    // Remove all possible cache directories
    const cacheDirs = [
      'dist',
      'node_modules/.vite',
      'node_modules/.cache',
      '.vite',
      'client/.vite'
    ];
    
    for (const dir of cacheDirs) {
      try {
        await fs.rm(path.join(__dirname, dir), { recursive: true, force: true });
      } catch (e) {
        // Directory might not exist, continue
      }
    }
    
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });

    console.log('🎨 Building frontend with cache disabled...');
    
    // Set environment variables to disable caching
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      DISABLE_DEV_DEPENDENCIES: 'true',
      NO_CACHE: 'true',
      VITE_LEGACY_BUILD: 'true'
    };
    
    // Build frontend with explicit no-cache configuration
    await build({
      root: path.resolve(__dirname, 'client'),
      configFile: false, // Don't use config file to avoid conflicts
      plugins: [
        (await import('@vitejs/plugin-react')).default()
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
        minify: true,
        sourcemap: false,
        rollupOptions: {
          input: path.resolve(__dirname, 'client/index.html'),
          output: {
            manualChunks: undefined // Disable code splitting to avoid issues
          }
        },
      },
      cacheDir: false, // Disable Vite cache
      optimizeDeps: {
        force: true // Force re-optimization
      }
    });
    
    console.log('✅ Frontend build completed');
    
    console.log('🏗️ Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
      stdio: 'inherit',
      cwd: __dirname,
      env: buildEnv
    });
    
    console.log('✅ Backend build completed');
    console.log('🎉 Production build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildWithoutCache();