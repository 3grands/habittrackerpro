import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // your HTML lives at the workspace root
  root: '.',

  resolve: {
    alias: {
      // keep client/src aliased for your imports
      '@': path.resolve(__dirname, 'client/src'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // explicitly tell Vite to use the root index.html
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
})
