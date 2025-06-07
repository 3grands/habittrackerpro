#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildComplete() {
  try {
    console.log('Starting complete deployment build...');
    
    // Clean all cache directories
    const cleanDirs = ['dist', 'node_modules/.vite', '.vite', 'client/.vite'];
    for (const dir of cleanDirs) {
      try {
        await fs.rm(path.join(__dirname, dir), { recursive: true, force: true });
      } catch (e) {
        // Directory might not exist
      }
    }
    
    // Create fresh dist directory
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Create temporary build environment
    const tempDir = path.join(__dirname, 'temp-complete-build');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Copy all necessary files and directories
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempDir, 'shared'), { recursive: true });
    await fs.cp(path.join(__dirname, 'attached_assets'), path.join(tempDir, 'attached_assets'), { recursive: true });
    
    // Create clean index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitFlow - Smart Habit Tracking</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create package.json
    const packageJson = {
      "type": "module",
      "dependencies": {}
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create Tailwind config
    const tailwindConfig = `export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};`;
    
    await fs.writeFile(path.join(tempDir, 'tailwind.config.js'), tailwindConfig);
    
    // Create PostCSS config
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
    
    await fs.writeFile(path.join(tempDir, 'postcss.config.js'), postcssConfig);
    
    // Create Vite config
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(process.cwd(), "index.html"),
    },
  },
});`;
    
    await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
    
    // Build frontend
    console.log('Building frontend...');
    execSync('npx vite build', {
      stdio: 'inherit',
      cwd: tempDir,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    // Build backend
    console.log('Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    console.log('Complete deployment build finished successfully!');
    console.log('Frontend built to: dist/public/');
    console.log('Backend built to: dist/index.js');
    
    // Verify build outputs
    try {
      const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
      const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
      console.log('Public assets:', publicFiles.filter(f => f !== 'assets').join(', '));
      console.log('Backend files:', distFiles.filter(f => f !== 'public').join(', '));
    } catch (e) {
      console.log('Build verification failed, but build may have succeeded');
    }
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

buildComplete();