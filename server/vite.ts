import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Simple logger for requests and errors
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Setup Vite dev middleware in development only
export async function setupVite(app: Express, server?: Server) {
  if (process.env.NODE_ENV === "production") return;

  // Dynamically import Vite so it isn't included in production bundle
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../vite.config.js");

  const viteLogger = createLogger();
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: server ? { server } : undefined,
      watch: {
        usePolling: true,
      },
      fs: {
        allow: [process.cwd()],
      },
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
  });

  // Use Vite's middleware
  app.use(vite.middlewares);

  // Serve index.html on all unmatched routes via Vite
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const templatePath = path.resolve(
        new URL(import.meta.url).pathname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(templatePath, "utf-8");
      // Cache-bust main.js during dev
      template = template.replace(
        `src=\"/src/main.tsx\"`,
        `src=\"/src/main.tsx?v=${nanoid()}\"`
      );
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// Serve built static files in production
export function serveStatic(app: Express) {
  const distPath = path.resolve(new URL(import.meta.url).pathname, "..", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html for SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
