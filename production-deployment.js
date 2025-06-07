#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createProductionBuild() {
  try {
    console.log('Starting comprehensive production build...');
    
    // Create a clean temporary directory for the build
    const tempDir = path.join(__dirname, 'temp-production');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Copy all necessary files to temp directory
    await fs.cp(path.join(__dirname, 'client/src'), path.join(tempDir, 'src'), { recursive: true });
    await fs.cp(path.join(__dirname, 'shared'), path.join(tempDir, 'shared'), { recursive: true });
    
    // Create a production index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>HabitFlow - Smart Habit Tracking for Better Living</title>
    <meta name="description" content="Transform your daily routines with HabitFlow - an intelligent habit tracker featuring AI coaching, mood tracking, and ADHD-friendly design. Build lasting habits that stick." />
    <meta name="keywords" content="habit tracker, habit building, productivity, wellness, ADHD support, neurodiversity, mindfulness, AI coaching" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta property="og:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    <meta property="og:site_name" content="HabitFlow" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="HabitFlow - Smart Habit Tracking for Better Living" />
    <meta name="twitter:description" content="Transform your daily routines with intelligent habit tracking, AI coaching, and neurodiversity-friendly features." />
    
    <!-- Additional SEO -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="HabitFlow" />
    <link rel="canonical" href="/" />
    
    <!-- Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create a production Tailwind config
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
    
    // Create a production Vite config
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("${path.join(__dirname, 'attached_assets')}"),
    },
  },
  build: {
    outDir: "${path.join(__dirname, 'dist/public')}",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});`;
    
    await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
    
    // Create package.json for temp build
    const packageJson = {
      "type": "module",
      "dependencies": {}
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Ensure dist/public directory exists
    await fs.mkdir(path.join(__dirname, 'dist/public'), { recursive: true });
    
    // Build frontend from temp directory
    console.log('Building frontend with clean configuration...');
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
    
    // Copy shared schema for runtime
    await fs.cp(path.join(__dirname, 'shared'), path.join(__dirname, 'dist/shared'), { 
      recursive: true,
      force: true 
    });
    
    console.log('Production build completed successfully!');
    console.log('Frontend built to: dist/public/');
    console.log('Backend built to: dist/index.js');
    
    // Verify build outputs
    try {
      const publicFiles = await fs.readdir(path.join(__dirname, 'dist/public'));
      const distFiles = await fs.readdir(path.join(__dirname, 'dist'));
      console.log('Public files:', publicFiles);
      console.log('Dist files:', distFiles);
      
      // Check if index.html exists in public
      const indexExists = await fs.access(path.join(__dirname, 'dist/public/index.html')).then(() => true).catch(() => false);
      console.log('Index.html exists:', indexExists);
      
    } catch (error) {
      console.log('Could not verify build outputs:', error.message);
    }
    
  } catch (error) {
    console.error('Production build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

createProductionBuild();