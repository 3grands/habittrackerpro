import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Security threat patterns
const THREAT_PATTERNS = {
  xss: [
    /<script[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi
  ],
  sqlInjection: [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /;\s*(drop|delete|update|create|alter)/gi,
    /--/g,
    /\/\*/g,
    /'\s*(or|and)\s*'/gi
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\+/g,
    /%2e%2e/gi,
    /\.\.%2f/gi
  ],
  commandInjection: [
    /;\s*(rm|del|kill|shutdown)/gi,
    /\|\s*(cat|ls|ps|wget)/gi,
    /`.*`/g,
    /\$\(.*\)/g
  ]
};

export function blockMaliciousContent(req: Request, res: Response, next: NextFunction) {
  // Only validate POST/PUT/PATCH requests with bodies
  if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.body) {
    return next();
  }

  const content = JSON.stringify(req.body);
  const securityCheck = scanForThreats(content, req.path, req.ip || '127.0.0.1');

  if (!securityCheck.safe) {
    console.warn(`[SECURITY BLOCK] ${securityCheck.threat} detected on ${req.path} from ${req.ip}`);
    
    return res.status(400).json({
      error: 'Security Violation',
      message: `Request blocked due to ${securityCheck.threat}`,
      code: securityCheck.code,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

function scanForThreats(content: string, path: string, ip: string): {
  safe: boolean;
  threat?: string;
  code?: string;
} {
  // Check XSS patterns
  for (const pattern of THREAT_PATTERNS.xss) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Cross-Site Scripting (XSS)',
        code: 'XSS_BLOCKED'
      };
    }
  }

  // Check SQL injection patterns
  for (const pattern of THREAT_PATTERNS.sqlInjection) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'SQL Injection',
        code: 'SQL_INJECTION_BLOCKED'
      };
    }
  }

  // Check path traversal patterns
  for (const pattern of THREAT_PATTERNS.pathTraversal) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Path Traversal',
        code: 'PATH_TRAVERSAL_BLOCKED'
      };
    }
  }

  // Check command injection patterns
  for (const pattern of THREAT_PATTERNS.commandInjection) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Command Injection',
        code: 'COMMAND_INJECTION_BLOCKED'
      };
    }
  }

  return { safe: true };
}

export function enforceDataSecurity(req: Request, res: Response, next: NextFunction) {
  // Enhanced security for critical endpoints
  const criticalPaths = ['/api/users', '/api/subscription', '/api/stripe-webhook'];
  
  if (criticalPaths.some(path => req.path.startsWith(path))) {
    // Require HTTPS in production
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
      return res.status(426).json({
        error: 'HTTPS Required',
        message: 'This endpoint requires a secure connection',
        code: 'HTTPS_REQUIRED'
      });
    }

    // Validate origin for critical operations
    const origin = req.headers.origin || req.headers.referer;
    if (!origin || !isValidOrigin(origin, req.headers.host || '')) {
      return res.status(403).json({
        error: 'Invalid Origin',
        message: 'Request origin not allowed for this operation',
        code: 'INVALID_ORIGIN'
      });
    }
  }

  next();
}

function isValidOrigin(origin: string, host: string): boolean {
  try {
    const originUrl = new URL(origin);
    const allowedHosts = [
      host,
      'localhost:5000',
      'localhost:3000',
      process.env.ALLOWED_ORIGIN
    ].filter(Boolean);
    
    return allowedHosts.some(allowedHost => 
      originUrl.host === allowedHost || 
      originUrl.hostname.endsWith(`.${allowedHost}`)
    );
  } catch {
    return false;
  }
}

export function logSecurityEvents(req: Request, res: Response, next: NextFunction) {
  const sensitiveEndpoints = ['/api/habits', '/api/mood', '/api/chat', '/api/subscription'];
  
  if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    const simpleFingerprint = generateSimpleFingerprint(req);
    console.log(`[DATA ACCESS] ${req.method} ${req.path} | IP: ${req.ip} | Fingerprint: ${simpleFingerprint}`);
  }
  
  next();
}

function generateSimpleFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || '127.0.0.1';
  // Simple hash alternative without crypto dependency
  let hash = 0;
  const str = `${ip}|${userAgent}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}