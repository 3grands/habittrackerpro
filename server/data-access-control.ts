import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Data classification levels
enum DataSensitivity {
  PUBLIC = 0,      // Public data, no restrictions
  INTERNAL = 1,    // Internal app data, requires valid session
  SENSITIVE = 2,   // User personal data, requires ownership validation
  RESTRICTED = 3   // Payment/billing data, requires strict validation
}

// Define data access rules
const DATA_ACCESS_RULES = {
  '/api/habits': DataSensitivity.SENSITIVE,
  '/api/habits/stats': DataSensitivity.SENSITIVE,
  '/api/habits/completions': DataSensitivity.SENSITIVE,
  '/api/mood': DataSensitivity.SENSITIVE,
  '/api/chat': DataSensitivity.SENSITIVE,
  '/api/users': DataSensitivity.RESTRICTED,
  '/api/subscription': DataSensitivity.RESTRICTED,
  '/api/create-subscription': DataSensitivity.RESTRICTED,
  '/api/stripe-webhook': DataSensitivity.RESTRICTED,
  '/api/coaching': DataSensitivity.INTERNAL,
  '/api/validate-keys': DataSensitivity.INTERNAL,
  '/api/security-audit': DataSensitivity.RESTRICTED
};

interface ValidationContext {
  userId: number;
  sessionId: string;
  requestId: string;
  timestamp: number;
  fingerprint: string;
}

// Request fingerprinting for anomaly detection
function generateRequestFingerprint(req: Request): string {
  const components = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || ''
  ];
  return crypto.createHash('sha256').update(components.join('|')).digest('hex').substring(0, 16);
}

// Request validation patterns
const SUSPICIOUS_PATTERNS = {
  sqlInjection: [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /update\s+.*set/i,
    /insert\s+into/i,
    /exec\s*\(/i,
    /xp_cmdshell/i
  ],
  xss: [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\s*\(/i,
    /document\.cookie/i
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\*/g,
    /%2e%2e%2f/i,
    /%252e%252e%252f/i
  ],
  commandInjection: [
    /;\s*(rm|del|format|shutdown)/i,
    /\|\s*(nc|netcat|wget|curl)/i,
    /`.*`/,
    /\$\(.*\)/
  ]
};

export function validateDataAccess(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const method = req.method;
  
  // Determine data sensitivity level
  let sensitivityLevel = DataSensitivity.PUBLIC;
  for (const [pattern, level] of Object.entries(DATA_ACCESS_RULES)) {
    if (path.startsWith(pattern)) {
      sensitivityLevel = Math.max(sensitivityLevel, level);
    }
  }
  
  // Skip validation for public endpoints
  if (sensitivityLevel === DataSensitivity.PUBLIC) {
    return next();
  }
  
  try {
    // Generate validation context
    const context: ValidationContext = {
      userId: 1, // Default user ID for demo - in real app, extract from session
      sessionId: req.headers['x-session-id'] as string || 'anonymous',
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      fingerprint: generateRequestFingerprint(req)
    };
    
    // Validate request integrity
    const validationResult = validateRequestIntegrity(req, context, sensitivityLevel);
    if (!validationResult.valid) {
      return res.status(validationResult.statusCode).json({
        error: 'Access Denied',
        message: validationResult.message,
        code: validationResult.code,
        requestId: context.requestId
      });
    }
    
    // Add validation context to request for downstream use
    (req as any).validationContext = context;
    (req as any).datasensitivity = sensitivityLevel;
    
    next();
  } catch (error: any) {
    console.error('Data access validation error:', error);
    res.status(500).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
}

function validateRequestIntegrity(req: Request, context: ValidationContext, sensitivityLevel: DataSensitivity): {
  valid: boolean;
  statusCode: number;
  message: string;
  code: string;
} {
  
  // Check for malicious patterns in request data
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  });
  
  // SQL injection detection
  for (const pattern of SUSPICIOUS_PATTERNS.sqlInjection) {
    if (pattern.test(requestData)) {
      console.warn(`SQL injection attempt detected: ${req.path} from ${req.ip}`);
      return {
        valid: false,
        statusCode: 400,
        message: 'Request contains potentially malicious SQL patterns',
        code: 'SQL_INJECTION_DETECTED'
      };
    }
  }
  
  // XSS detection
  for (const pattern of SUSPICIOUS_PATTERNS.xss) {
    if (pattern.test(requestData)) {
      console.warn(`XSS attempt detected: ${req.path} from ${req.ip}`);
      return {
        valid: false,
        statusCode: 400,
        message: 'Request contains potentially malicious script content',
        code: 'XSS_DETECTED'
      };
    }
  }
  
  // Path traversal detection
  for (const pattern of SUSPICIOUS_PATTERNS.pathTraversal) {
    if (pattern.test(requestData)) {
      console.warn(`Path traversal attempt detected: ${req.path} from ${req.ip}`);
      return {
        valid: false,
        statusCode: 400,
        message: 'Request contains path traversal patterns',
        code: 'PATH_TRAVERSAL_DETECTED'
      };
    }
  }
  
  // Command injection detection
  for (const pattern of SUSPICIOUS_PATTERNS.commandInjection) {
    if (pattern.test(requestData)) {
      console.warn(`Command injection attempt detected: ${req.path} from ${req.ip}`);
      return {
        valid: false,
        statusCode: 400,
        message: 'Request contains command injection patterns',
        code: 'COMMAND_INJECTION_DETECTED'
      };
    }
  }
  
  // Validate request size limits
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSizes: Record<DataSensitivity, number> = {
    [DataSensitivity.PUBLIC]: 2048 * 1024,       // 2MB
    [DataSensitivity.INTERNAL]: 1024 * 1024,     // 1MB
    [DataSensitivity.SENSITIVE]: 512 * 1024,     // 512KB
    [DataSensitivity.RESTRICTED]: 256 * 1024     // 256KB
  };
  
  if (contentLength > maxSizes[sensitivityLevel]) {
    return {
      valid: false,
      statusCode: 413,
      message: 'Request payload too large for data sensitivity level',
      code: 'PAYLOAD_TOO_LARGE'
    };
  }
  
  // Validate required headers for sensitive data
  if (sensitivityLevel >= DataSensitivity.SENSITIVE) {
    const requiredHeaders = ['user-agent', 'accept'];
    for (const header of requiredHeaders) {
      if (!req.headers[header]) {
        return {
          valid: false,
          statusCode: 400,
          message: `Missing required header: ${header}`,
          code: 'MISSING_REQUIRED_HEADER'
        };
      }
    }
  }
  
  // Validate content type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return {
        valid: false,
        statusCode: 415,
        message: 'Unsupported content type for data modification',
        code: 'UNSUPPORTED_CONTENT_TYPE'
      };
    }
  }
  
  // Additional validation for restricted data
  if (sensitivityLevel === DataSensitivity.RESTRICTED) {
    // Require HTTPS in production
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
      return {
        valid: false,
        statusCode: 426,
        message: 'HTTPS required for accessing restricted data',
        code: 'HTTPS_REQUIRED'
      };
    }
    
    // Validate request origin
    const origin = req.headers.origin || req.headers.referer;
    if (!origin || !isValidOrigin(origin, req.headers.host || '')) {
      return {
        valid: false,
        statusCode: 403,
        message: 'Invalid request origin for restricted data access',
        code: 'INVALID_ORIGIN'
      };
    }
  }
  
  return {
    valid: true,
    statusCode: 200,
    message: 'Request validation passed',
    code: 'VALIDATION_SUCCESS'
  };
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

export function logDataAccess(req: Request, res: Response, next: NextFunction) {
  const context = (req as any).validationContext;
  const sensitivity = (req as any).datasensitivity;
  
  // Log sensitive data access
  if (sensitivity >= DataSensitivity.SENSITIVE) {
    console.log(`Data access: ${req.method} ${req.path} | User: ${context?.userId} | Sensitivity: ${DataSensitivity[sensitivity]} | IP: ${req.ip} | Fingerprint: ${context?.fingerprint}`);
  }
  
  next();
}

export function sanitizeResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(obj: any) {
    const sensitivity = (req as any).datasensitivity;
    
    // Remove sensitive fields based on data classification
    if (sensitivity >= DataSensitivity.SENSITIVE && obj) {
      // Remove internal system fields
      if (Array.isArray(obj)) {
        obj = obj.map(item => sanitizeObject(item, sensitivity));
      } else if (typeof obj === 'object') {
        obj = sanitizeObject(obj, sensitivity);
      }
    }
    
    return originalJson.call(this, obj);
  };
  
  next();
}

function sanitizeObject(obj: any, sensitivity: DataSensitivity): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  const restrictedFields = ['createdAt', 'updatedAt', 'internalId', 'systemFlags'];
  
  const result = { ...obj };
  
  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (field in result) {
      delete result[field];
    }
  });
  
  // Remove restricted fields for high sensitivity
  if (sensitivity >= DataSensitivity.RESTRICTED) {
    restrictedFields.forEach(field => {
      if (field in result) {
        delete result[field];
      }
    });
  }
  
  return result;
}