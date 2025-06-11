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

    // Configure MIME types for TypeScript and JavaScript modules
    express.static.mime.define({
      'application/javascript': ['tsx', 'ts', 'jsx', 'js'],
      'text/css': ['css']
    });

    // Serve static files from client/src directory with proper MIME types
    app.use('/src', express.static(path.resolve(process.cwd(), 'client/src'), {
      setHeaders: (res, path) => {
        if (path.endsWith('.tsx') || path.endsWith('.ts')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));
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