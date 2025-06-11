import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

async function startServer() {
  try {
    log("Starting HabitFlow development server...");
    
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite middleware properly
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(process.cwd(), "client"),
      resolve: {
        alias: {
          "@": path.resolve(process.cwd(), "client", "src"),
          "@shared": path.resolve(process.cwd(), "shared"),
          "@assets": path.resolve(process.cwd(), "attached_assets"),
        },
      },
    });

    app.use(vite.middlewares);

    // Fallback handler for SPA routes
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      
      try {
        const templatePath = path.resolve(process.cwd(), "client", "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    // Start server on port 5000
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
    }, () => {
      log(`HabitFlow running on port ${port}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();