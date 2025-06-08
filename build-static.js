import { build } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';

async function buildStatic() {
  try {
    console.log('Building frontend assets...');
    
    // Build frontend only, without starting server
    await build({
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: './index.html'
          }
        }
      },
      server: {
        port: 5173 // Use different port to avoid conflict
      }
    });

    console.log('Frontend build completed successfully');
    
    // Create proper index.html for static deployment
    if (!fs.existsSync('dist/index.html')) {
      const staticHTML = fs.readFileSync('./dist/index.html', 'utf8') || 
        fs.readFileSync('./create-static-build.js', 'utf8').match(/staticHTML = `([\s\S]*?)`;/)[1];
      
      fs.writeFileSync('dist/index.html', staticHTML);
    }

    console.log('Static deployment build completed');
    
  } catch (error) {
    console.error('Build failed:', error.message);
    
    // Fallback: copy our working static build
    console.log('Using fallback static build...');
    execSync('node create-static-build.js');
  }
}

buildStatic();