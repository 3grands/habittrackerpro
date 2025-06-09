import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();

// Essential middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// In production, serve the Vite build output:
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath, {
    maxAge: '1d',
    etag: false
  }));
  
  // Fallback to index.html for SPA routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    try {
      res.sendFile(path.join(publicPath, "index.html"));
    } catch (error) {
      console.error("Error serving index.html:", error);
      res.status(500).send("Server Error");
    }
  });
}

// Register your API routes & error handler
(async () => {
  await registerRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Error" });
  });
})();

export default app;
