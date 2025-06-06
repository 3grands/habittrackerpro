import { Request, Response, NextFunction } from "express";
import { validateStripeKeys, validateOpenAIKey } from "./api-validation";

// Cache validation results to avoid repeated API calls
const validationCache = new Map<string, { valid: boolean; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedValidation(service: string, validator: () => Promise<any>) {
  const cached = validationCache.get(service);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.valid;
  }
  
  try {
    const result = await validator();
    validationCache.set(service, {
      valid: result.valid,
      timestamp: now,
      ttl: CACHE_TTL
    });
    return result.valid;
  } catch (error) {
    // Cache failure for shorter period
    validationCache.set(service, {
      valid: false,
      timestamp: now,
      ttl: 60 * 1000 // 1 minute
    });
    return false;
  }
}

export function requireValidStripeKeys(req: Request, res: Response, next: NextFunction) {
  // Only protect Stripe-related endpoints
  const stripeEndpoints = [
    '/api/create-subscription',
    '/api/stripe-webhook',
    '/api/create-payment-intent'
  ];
  
  if (!stripeEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }
  
  getCachedValidation('stripe', validateStripeKeys).then(isValid => {
    if (!isValid) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Payment processing is currently unavailable due to configuration issues',
        code: 'STRIPE_VALIDATION_FAILED',
        details: 'Please contact support if this issue persists'
      });
    }
    next();
  }).catch(error => {
    console.error('Stripe validation error:', error);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Payment processing validation failed',
      code: 'STRIPE_VALIDATION_ERROR'
    });
  });
}

export function requireValidOpenAIKey(req: Request, res: Response, next: NextFunction) {
  // Only protect OpenAI-related endpoints
  const openaiEndpoints = [
    '/api/coaching',
    '/api/chat',
    '/api/ai-insights',
    '/api/generate-recommendations'
  ];
  
  if (!openaiEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }
  
  getCachedValidation('openai', validateOpenAIKey).then(isValid => {
    if (!isValid) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI coaching features are currently unavailable due to configuration issues',
        code: 'OPENAI_VALIDATION_FAILED',
        details: 'Please contact support if this issue persists'
      });
    }
    next();
  }).catch(error => {
    console.error('OpenAI validation error:', error);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'AI service validation failed',
      code: 'OPENAI_VALIDATION_ERROR'
    });
  });
}

export function requireValidSubscription(req: Request, res: Response, next: NextFunction) {
  // Premium endpoints that require valid subscription
  const premiumEndpoints = [
    '/api/advanced-analytics',
    '/api/voice-commands',
    '/api/premium-insights',
    '/api/custom-templates',
    '/api/team-sharing'
  ];
  
  if (!premiumEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }
  
  // In a real app, verify user's subscription status from database
  // For now, allow access but log the attempt
  console.log(`Premium feature access attempt: ${req.path} from ${req.ip}`);
  next();
}

export function validateResourceAccess(req: Request, res: Response, next: NextFunction) {
  // Enhanced validation for sensitive operations
  const sensitiveOperations = [
    'DELETE',
    'PATCH'
  ];
  
  const sensitiveEndpoints = [
    '/api/habits',
    '/api/users',
    '/api/subscriptions'
  ];
  
  const isSensitiveOperation = sensitiveOperations.includes(req.method);
  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isSensitiveOperation && isSensitiveEndpoint) {
    // Require additional validation for destructive operations
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    
    // Basic bot detection
    if (userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawler')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated access to sensitive operations is not allowed',
        code: 'BOT_ACCESS_DENIED'
      });
    }
    
    // Require referer for sensitive operations (CSRF protection)
    if (!referer || !referer.includes(req.headers.host || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request origin',
        code: 'INVALID_ORIGIN'
      });
    }
  }
  
  next();
}

// Cleanup validation cache periodically
setInterval(() => {
  const now = Date.now();
  validationCache.forEach((value, key) => {
    if ((now - value.timestamp) > value.ttl) {
      validationCache.delete(key);
    }
  });
}, 60 * 1000); // Run every minute