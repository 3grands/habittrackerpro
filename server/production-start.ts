#!/usr/bin/env node

import express, { Request, Response, NextFunction } from "express";
import path from "path";

// CommonJS __dirname equivalent
const __dirname = process.cwd();

const app = express();

// Essential middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files in production
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath, {
  maxAge: '1d',
  etag: false
}));

// Basic API endpoint for health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback for frontend routes
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  try {
    res.sendFile(path.join(publicPath, "index.html"));
  } catch (error) {
    console.error("Error serving index.html:", error);
    res.status(500).send("Server Error");
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT ?? "5000", 10);
const HOST = "0.0.0.0"; // Always bind to 0.0.0.0 for Cloud Run compatibility

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Production server running on ${HOST}:${PORT}`);
}).on('error', (err: Error) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;