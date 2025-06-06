import { Request, Response, NextFunction } from "express";

// Input sanitization patterns
const MALICIOUS_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  scriptOpen: /<script[^>]*>/gi,
  scriptClose: /<\/script>/gi,
  javascript: /javascript:/gi,
  vbscript: /vbscript:/gi,
  onEvents: /on\w+\s*=/gi,
  iframe: /<iframe[^>]*>/gi,
  object: /<object[^>]*>/gi,
  embed: /<embed[^>]*>/gi,
  sqlInjection: /(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+.*set|exec\s*\()/gi,
  sqlComments: /(--|\*\/|\/\*)/g,
  pathTraversal: /(\.\.\/)|(\.\.\\)/g
};

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Only sanitize POST, PUT, PATCH requests with JSON bodies
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Get raw body before parsing
  const originalBody = req.body;
  
  if (originalBody && typeof originalBody === 'object') {
    const sanitizedBody = sanitizeObject(originalBody);
    
    // Check if any dangerous patterns were found and removed
    const originalStr = JSON.stringify(originalBody);
    const sanitizedStr = JSON.stringify(sanitizedBody);
    
    if (originalStr !== sanitizedStr) {
      console.warn(`[Input Sanitization] Malicious content detected and sanitized from ${req.path} - IP: ${req.ip}`);
      
      // For demonstration, we'll block the request entirely if malicious content is detected
      return res.status(400).json({
        error: 'Input Validation Failed',
        message: 'Request contains potentially harmful content that has been blocked',
        code: 'MALICIOUS_CONTENT_DETECTED',
        timestamp: new Date().toISOString()
      });
    }
    
    req.body = sanitizedBody;
  }
  
  next();
}

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

function sanitizeString(input: string): string {
  let sanitized = input;
  
  // Remove script tags and their content
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.script, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.scriptOpen, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.scriptClose, '');
  
  // Remove javascript and vbscript protocols
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.javascript, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.vbscript, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.onEvents, '');
  
  // Remove potentially dangerous HTML tags
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.iframe, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.object, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.embed, '');
  
  // Remove SQL injection patterns
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.sqlInjection, '');
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.sqlComments, '');
  
  // Remove path traversal patterns
  sanitized = sanitized.replace(MALICIOUS_PATTERNS.pathTraversal, '');
  
  return sanitized;
}

export function validateInputSafety(req: Request, res: Response, next: NextFunction) {
  // Additional safety check for critical endpoints
  const criticalEndpoints = ['/api/users', '/api/subscription', '/api/stripe-webhook'];
  
  if (criticalEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    const bodyStr = JSON.stringify(req.body || {});
    const queryStr = JSON.stringify(req.query || {});
    const paramsStr = JSON.stringify(req.params || {});
    
    const allData = `${bodyStr}${queryStr}${paramsStr}`;
    
    // Strict validation for critical endpoints
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /union\s+select/i,
      /\.\.\//,
      /exec\s*\(/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(allData)) {
        console.error(`[Critical Security] Dangerous pattern detected on critical endpoint ${req.path} from IP ${req.ip}`);
        return res.status(403).json({
          error: 'Security Violation',
          message: 'Access denied due to security policy violation',
          code: 'CRITICAL_SECURITY_VIOLATION'
        });
      }
    }
  }
  
  next();
}