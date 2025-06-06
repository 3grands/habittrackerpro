import { Request, Response, NextFunction } from "express";
import getRawBody from "raw-body";
import express from "express";

// Comprehensive malicious pattern detection
const SECURITY_PATTERNS = {
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi
  ],
  sqlInjection: [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+.*set/gi,
    /exec\s*\(/gi,
    /xp_cmdshell/gi,
    /;\s*(drop|delete|update|insert|create|alter)/gi,
    /--[\s\S]*$/gm,
    /\/\*[\s\S]*?\*\//g,
    /'\s*(or|and)\s*'/gi,
    /'\s*=\s*'/gi
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\+/g,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  commandInjection: [
    /;\s*(rm|del|format|shutdown|reboot|halt)/gi,
    /\|\s*(nc|netcat|wget|curl|cat|ls|ps|kill)/gi,
    /`[^`]*`/g,
    /\$\([^)]*\)/g,
    /&&\s*(rm|del|format)/gi,
    /\|\|\s*(rm|del|format)/gi
  ]
};

export function validateRawBody(req: Request, res: Response, next: NextFunction) {
  // Skip validation for GET requests and non-JSON content
  if (req.method === 'GET' || !req.headers['content-type']?.includes('application/json')) {
    return next();
  }

  // Store original body parsing
  const originalJson = express.json();
  
  // Get raw body first
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: 'utf8'
  })
  .then((rawBody: string) => {
    // Check raw body for malicious patterns
    const securityCheck = validateSecurityPatterns(rawBody, req);
    
    if (!securityCheck.safe) {
      console.warn(`[Security Block] ${securityCheck.threat} detected on ${req.path} from ${req.ip}`);
      console.warn(`[Security Block] Blocked content: ${rawBody.substring(0, 100)}...`);
      
      return res.status(400).json({
        error: 'Security Violation',
        message: `Request blocked: ${securityCheck.threat} detected`,
        code: securityCheck.code,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      });
    }
    
    // If safe, parse the JSON normally
    try {
      req.body = JSON.parse(rawBody);
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON',
        code: 'JSON_PARSE_ERROR'
      });
    }
  })
  .catch((error) => {
    console.error('[Security] Raw body validation error:', error);
    return res.status(400).json({
      error: 'Request Processing Error',
      message: 'Unable to process request body',
      code: 'BODY_PROCESSING_ERROR'
    });
  });
}

function validateSecurityPatterns(content: string, req: Request): {
  safe: boolean;
  threat?: string;
  code?: string;
} {
  // XSS detection
  for (const pattern of SECURITY_PATTERNS.xss) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Cross-Site Scripting (XSS)',
        code: 'XSS_DETECTED'
      };
    }
  }
  
  // SQL injection detection
  for (const pattern of SECURITY_PATTERNS.sqlInjection) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'SQL Injection',
        code: 'SQL_INJECTION_DETECTED'
      };
    }
  }
  
  // Path traversal detection
  for (const pattern of SECURITY_PATTERNS.pathTraversal) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Path Traversal',
        code: 'PATH_TRAVERSAL_DETECTED'
      };
    }
  }
  
  // Command injection detection
  for (const pattern of SECURITY_PATTERNS.commandInjection) {
    if (pattern.test(content)) {
      return {
        safe: false,
        threat: 'Command Injection',
        code: 'COMMAND_INJECTION_DETECTED'
      };
    }
  }
  
  return { safe: true };
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}