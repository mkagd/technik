/**
 * 🛡️ ADVANCED RATE LIMITING & SECURITY MIDDLEWARE
 * Enterprise-grade API protection system
 */

import rateLimitLib from 'express-rate-limit';
import slowDownLib from 'express-slow-down';

// Rate limiting configurations
const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimitLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit by IP and email combination for more precise control
      const email = req.body?.email || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;
      return `auth_${ip}_${email}`;
    },
    handler: (req, res) => {
      console.log(`🚫 Auth rate limit exceeded: ${req.ip} - ${req.body?.email}`);
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      });
    }
  }),

  // Standard rate limiting for API endpoints
  api: rateLimitLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests. Please slow down.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Include user ID in key if authenticated
      const userId = req.user?.id || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;
      return `api_${ip}_${userId}`;
    },
    handler: (req, res) => {
      console.log(`🚫 API rate limit exceeded: ${req.ip} - ${req.user?.email || 'anonymous'}`);
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      });
    }
  }),

  // Aggressive rate limiting for sensitive operations
  sensitive: rateLimitLib({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many sensitive operations. Please try again later.',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`🚫 Sensitive operation rate limit exceeded: ${req.ip} - ${req.user?.email}`);
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many sensitive operations. Please try again in an hour.',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      });
    }
  }),

  // Generous rate limiting for public endpoints
  public: rateLimitLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};

// Slow down middleware for progressive delays
const slowDownConfigs = {
  // Progressive slowdown for API endpoints
  api: slowDownLib({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Start slowing down after 50 requests
    delayMs: 500, // Increase delay by 500ms for each request
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;
      return `slowdown_${ip}_${userId}`;
    },
    onLimitReached: (req, res, options) => {
      console.log(`🐌 Slowdown activated: ${req.ip} - ${req.user?.email || 'anonymous'}`);
    }
  }),

  // More aggressive slowdown for public endpoints
  public: slowDownLib({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100,
    delayMs: 250,
    maxDelayMs: 10000,
    skipFailedRequests: true
  })
};

// Security headers middleware
export function securityHeaders(req, res, next) {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https:",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; '));

  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  next();
}

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-domain.com', // Replace with actual domain
      'https://www.your-domain.com' // Replace with actual domain
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

// IP validation and blocking
const blockedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> { count, lastSeen }

export function ipSecurity(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    console.log(`🚫 Blocked IP attempted access: ${clientIP}`);
    return res.status(403).json({
      success: false,
      error: 'IP_BLOCKED',
      message: 'Access denied'
    });
  }
  
  // Track suspicious activity
  if (suspiciousIPs.has(clientIP)) {
    const activity = suspiciousIPs.get(clientIP);
    activity.count++;
    activity.lastSeen = Date.now();
    
    // Block IP if too many suspicious requests
    if (activity.count > 50) {
      blockedIPs.add(clientIP);
      suspiciousIPs.delete(clientIP);
      console.log(`🚫 IP blocked due to suspicious activity: ${clientIP}`);
      return res.status(403).json({
        success: false,
        error: 'IP_BLOCKED',
        message: 'Access denied due to suspicious activity'
      });
    }
  }
  
  // Add IP to request for further processing
  req.clientIP = clientIP;
  next();
}

// Request size limiting
export function requestSizeLimit(maxSizeBytes = 10 * 1024 * 1024) { // 10MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength && contentLength > maxSizeBytes) {
      console.log(`🚫 Request too large: ${contentLength} bytes from ${req.ip}`);
      return res.status(413).json({
        success: false,
        error: 'REQUEST_TOO_LARGE',
        message: `Request size exceeds ${maxSizeBytes} bytes limit`
      });
    }
    
    next();
  };
}

// Anti-DDoS middleware
const requestCounts = new Map(); // IP -> { count, window }

export function antiDDoS(req, res, next) {
  const clientIP = req.clientIP || req.ip;
  const now = Date.now();
  const windowSize = 10 * 1000; // 10 seconds
  const threshold = 200; // 200 requests per 10 seconds
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, window: now });
  } else {
    const data = requestCounts.get(clientIP);
    
    // Reset window if expired
    if (now - data.window > windowSize) {
      data.count = 1;
      data.window = now;
    } else {
      data.count++;
    }
    
    // Check if threshold exceeded
    if (data.count > threshold) {
      // Mark as suspicious
      if (suspiciousIPs.has(clientIP)) {
        suspiciousIPs.get(clientIP).count += 10; // Heavy penalty
      } else {
        suspiciousIPs.set(clientIP, { count: 10, lastSeen: now });
      }
      
      console.log(`🚫 DDoS protection triggered: ${clientIP} (${data.count} requests)`);
      return res.status(429).json({
        success: false,
        error: 'DDOS_PROTECTION',
        message: 'Too many requests detected. Please slow down.'
      });
    }
  }
  
  next();
}

// Cleanup function for maps (should be called periodically)
export function cleanupSecurityMaps() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  // Clean up suspicious IPs
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.lastSeen > maxAge) {
      suspiciousIPs.delete(ip);
    }
  }
  
  // Clean up request counts
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.window > maxAge) {
      requestCounts.delete(ip);
    }
  }
  
  console.log(`🧹 Security maps cleaned up. Suspicious IPs: ${suspiciousIPs.size}, Request counts: ${requestCounts.size}`);
}

// Export rate limiting configs
export const rateLimit = rateLimitConfigs;
export const slowDown = slowDownConfigs;

export default {
  rateLimit: rateLimitConfigs,
  slowDown: slowDownConfigs,
  securityHeaders,
  corsOptions,
  ipSecurity,
  requestSizeLimit,
  antiDDoS,
  cleanupSecurityMaps
};
