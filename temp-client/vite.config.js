
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("/home/runner/workspace/client/src"),
      "@shared": path.resolve("/home/runner/workspace/shared"),
      "@assets": path.resolve("/home/runner/workspace/attached_assets"),
    },
  },
  build: {
    outDir: "/home/runner/workspace/dist/public",
    emptyOutDir: true,
  },
});
