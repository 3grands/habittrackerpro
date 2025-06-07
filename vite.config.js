import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/client/src',
      '@assets': '/attached_assets',
      '@shared': '/shared'
    }
  }
});
