
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve("client/src"),
      "@shared": resolve("shared"),
      "@assets": resolve("attached_assets"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  },
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    force: true
  }
});