import app from "./index-production.js";
import { serveStatic, log } from "./vite-production.js";

const PORT = parseInt(process.env.PORT || "5000");

// Only start the server if we are not in "build mode"
if (process.env.SKIP_SERVER_START !== "true") {
  const startServer = async () => {
    try {
      log("Starting HabitFlow API server...");
      
      const server = app.listen(PORT, "0.0.0.0", async () => {
        console.log(`🚀 Server running on port ${PORT}`);
        
        // Serve static files in production
        serveStatic(app);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          log('Process terminated');
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
} else {
  console.log("SKIP_SERVER_START is true: not starting the server.");
}