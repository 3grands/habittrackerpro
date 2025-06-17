import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
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
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// TypeScript transpilation middleware
app.use('/src', async (req, res, next) => {
  const filePath = path.join(process.cwd(), 'client/src', req.path.replace('/src', ''));
  
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
    try {
      // Use esbuild to transpile TypeScript on-the-fly
      const esbuild = await import('esbuild');
      const result = await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        format: 'esm',
        target: 'es2020',
        write: false,
        jsx: 'automatic',
        loader: { '.tsx': 'tsx', '.ts': 'ts' },
        external: ['react', 'react-dom'],
        define: {
          'process.env.NODE_ENV': '"development"'
        }
      });
      
      res.setHeader('Content-Type', 'application/javascript');
      res.send(result.outputFiles[0].text);
    } catch (error) {
      console.error('Error transpiling TypeScript:', error);
      next(error);
    }
  } else {
    next();
  }
});

async function startServer() {
  try {
    console.log("Starting HabitFlow development server...");
    
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Serve static files from client/src directory
    app.use('/src', express.static(path.resolve(process.cwd(), 'client/src')));
    app.use('/node_modules', express.static(path.resolve(process.cwd(), 'node_modules')));

    // Serve index.html for all non-API routes
    app.use("*", (req, res) => {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      
      const indexPath = path.resolve(process.cwd(), "client", "index.html");
      res.sendFile(indexPath);
    });

    // Start server on port 5000
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
    }, () => {
      console.log(`HabitFlow running on port ${port}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();