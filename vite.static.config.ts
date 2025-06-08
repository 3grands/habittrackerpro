import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Static build configuration that avoids all server imports
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
    minify: true,
    sourcemap: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  mode: 'production',
  clearScreen: false,
  logLevel: 'info',
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});