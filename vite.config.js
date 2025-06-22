import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
<<<<<<< HEAD

  // your HTML lives at the workspace root
  root: '.',

  resolve: {
    alias: {
      // keep client/src aliased for your imports
      '@': path.resolve(__dirname, 'client/src'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      '@shared': path.resolve(__dirname, 'shared'),
=======
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
>>>>>>> ec4d63714fb920967c2a0372d4d3463bfdc33dc1
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
<<<<<<< HEAD

    // explicitly tell Vite to use the root index.html
=======
>>>>>>> ec4d63714fb920967c2a0372d4d3463bfdc33dc1
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
<<<<<<< HEAD
})
=======
})
>>>>>>> ec4d63714fb920967c2a0372d4d3463bfdc33dc1
