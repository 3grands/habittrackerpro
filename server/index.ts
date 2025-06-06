import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateAllApiKeys } from "./api-validation";
import { 
  securityHeaders, 
  rateLimiter, 
  validateApiKeyUsage, 
  validateRequestIntegrity 
} from "./security-middleware";
import {
  requireValidStripeKeys,
  requireValidOpenAIKey,
  requireValidSubscription,
  validateResourceAccess
} from "./auth-middleware";
import {
  validateDataAccess,
  logDataAccess,
  sanitizeResponse
} from "./data-access-control";
import {
  sanitizeInput,
  validateInputSafety
} from "./input-sanitization";

const app = express();

// Apply security middleware first
app.use(securityHeaders);
app.use(rateLimiter);
app.use(validateRequestIntegrity);
app.use(validateApiKeyUsage);

// Apply API key validation gates for sensitive resources
app.use(requireValidStripeKeys);
app.use(requireValidOpenAIKey);
app.use(requireValidSubscription);
app.use(validateResourceAccess);

// Apply data access control middleware
app.use(validateDataAccess);
app.use(logDataAccess);
app.use(sanitizeResponse);

// Apply input sanitization and validation before parsing
app.use(validateInputSafety);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply input sanitization after parsing
app.use(sanitizeInput);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate API keys on startup for security
  log("Validating API keys...");
  const validation = await validateAllApiKeys();
  
  if (!validation.allValid) {
    log(`⚠️  API Key Validation Warning: ${validation.summary}`);
    validation.results.forEach(result => {
      if (!result.valid) {
        log(`   - ${result.service}: ${result.error}`);
      }
    });
    log("Server will start but some features may not work properly.");
  } else {
    log(`✅ API validation successful: ${validation.summary}`);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
