import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerWindow: 100,
  apiKeyRotationCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
  suspiciousPatternThreshold: 10,
  blockedIPs: new Set<string>()
};

// Track API key usage patterns
const apiKeyUsagePatterns = new Map<string, {
  lastUsed: number;
  requestCount: number;
  suspiciousActivity: number;
  firstSeen: number;
}>();

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set comprehensive security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'HabitTracker');
  
  next();
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Check if IP is blocked
  if (SECURITY_CONFIG.blockedIPs.has(clientIP)) {
    return res.status(429).json({ 
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity'
    });
  }
  
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit data
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.rateLimitWindow
    });
    return next();
  }
  
  if (clientData.count >= SECURITY_CONFIG.maxRequestsPerWindow) {
    // Log suspicious activity
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    
    // Block IP after repeated violations
    if (clientData.count > SECURITY_CONFIG.maxRequestsPerWindow * 2) {
      SECURITY_CONFIG.blockedIPs.add(clientIP);
      setTimeout(() => {
        SECURITY_CONFIG.blockedIPs.delete(clientIP);
      }, 60 * 60 * 1000); // Unblock after 1 hour
    }
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
}

export function validateApiKeyUsage(req: Request, res: Response, next: NextFunction) {
  // Only validate on API routes that require authentication
  if (!req.path.startsWith('/api/') || req.path === '/api/validate-keys') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '') || 'anonymous';
  const now = Date.now();
  
  // Track usage patterns
  const usage = apiKeyUsagePatterns.get(apiKey) || {
    lastUsed: now,
    requestCount: 0,
    suspiciousActivity: 0,
    firstSeen: now
  };
  
  usage.lastUsed = now;
  usage.requestCount++;
  
  // Detect suspicious patterns
  const timeSinceFirstSeen = now - usage.firstSeen;
  const requestRate = usage.requestCount / (timeSinceFirstSeen / 1000); // requests per second
  
  if (requestRate > 10) { // More than 10 requests per second
    usage.suspiciousActivity++;
    console.warn(`Suspicious API usage detected for key: ${apiKey.substring(0, 10)}...`);
  }
  
  // Block if too much suspicious activity
  if (usage.suspiciousActivity > SECURITY_CONFIG.suspiciousPatternThreshold) {
    return res.status(403).json({
      error: 'Suspicious activity detected',
      message: 'API key usage patterns indicate potential abuse'
    });
  }
  
  apiKeyUsagePatterns.set(apiKey, usage);
  next();
}

export function validateRequestIntegrity(req: Request, res: Response, next: NextFunction) {
  // Validate request structure for API endpoints
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /exec.*\(/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.warn(`Suspicious request pattern detected: ${req.path} from ${req.ip}`);
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request contains potentially malicious content'
      });
    }
  }
  
  next();
}

export function generateSecurityToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateSecurityToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Cleanup rate limit store
  rateLimitStore.forEach((data, ip) => {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  });
  
  // Cleanup old API key usage data
  apiKeyUsagePatterns.forEach((usage, key) => {
    if (now - usage.lastUsed > 24 * 60 * 60 * 1000) { // 24 hours
      apiKeyUsagePatterns.delete(key);
    }
  });
}, 5 * 60 * 1000); // Run every 5 minutes