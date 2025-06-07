import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("/home/runner/workspace/attached_assets"),
    },
  },
  build: {
    outDir: "/home/runner/workspace/dist/public",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});