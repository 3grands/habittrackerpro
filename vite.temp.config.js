
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": new URL("./client/src", import.meta.url).pathname,
      "@shared": new URL("./shared", import.meta.url).pathname,
      "@assets": new URL("./attached_assets", import.meta.url).pathname,
    },
  },
  mode: "production",
});
