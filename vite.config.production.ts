import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['lucide-react']
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});