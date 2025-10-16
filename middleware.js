/**
 * 🔒 NEXT.JS MIDDLEWARE FOR COMPREHENSIVE SECURITY
 * Edge-level protection for all requests
 */

import { NextResponse } from 'next/server';

// In-memory stores (consider using Redis in production)
const rateLimitStore = new Map();
const blockedIPs = new Set();

// Rate limiting function with sliding window
function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const key = `${identifier}_${windowKey}`;
  
  // Clean up old entries BEFORE checking
  const previousWindowKey = windowKey - 1;
  const oldKey = `${identifier}_${previousWindowKey}`;
  rateLimitStore.delete(oldKey);
  
  // Get or initialize current count
  const current = rateLimitStore.get(key) || 0;
  
  if (current >= maxRequests) {
    console.log(`⚠️ Rate limit hit: ${identifier} (${current}/${maxRequests})`);
    return false; // Rate limit exceeded
  }
  
  // Increment counter
  rateLimitStore.set(key, current + 1);
  
  // Aggressive cleanup every 100 requests
  if (rateLimitStore.size > 100) {
    const cutoff = now - windowMs * 3;
    let cleaned = 0;
    for (const [k] of rateLimitStore.entries()) {
      try {
        const parts = k.split('_');
        const keyWindowMs = parseInt(parts[parts.length - 1]) * windowMs;
        if (keyWindowMs < cutoff) {
          rateLimitStore.delete(k);
          cleaned++;
        }
      } catch (e) {
        // Invalid key, delete it
        rateLimitStore.delete(k);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old rate limit entries`);
    }
  }
  
  return true;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const clientIP = request.ip || 'unknown';
  
  // Development: Allow reset endpoint
  if (pathname === '/api/dev/reset-rate-limit' && process.env.NODE_ENV !== 'production') {
    rateLimitStore.clear();
    blockedIPs.clear();
    console.log('🔄 Rate limits cleared (development mode)');
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Rate limits cleared',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && !pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    console.log(`🚫 Blocked IP: ${clientIP} tried to access ${pathname}`);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'IP_BLOCKED',
        message: 'Access denied'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Apply different rate limits based on path
  let rateLimitExceeded = false;
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (pathname.startsWith('/api/auth/')) {
    // Strict rate limiting for auth endpoints
    const authLimit = isDevelopment ? 50 : 5;
    const authWindow = isDevelopment ? 60 * 1000 : 15 * 60 * 1000; // 1 min dev, 15 min prod
    rateLimitExceeded = !checkRateLimit(`auth_${clientIP}`, authLimit, authWindow);
  } else if (pathname.startsWith('/api/')) {
    // Generous rate limiting for API endpoints
    const apiLimit = isDevelopment ? 10000 : 1000;
    const apiWindow = isDevelopment ? 60 * 1000 : 15 * 60 * 1000; // 1 min dev, 15 min prod
    rateLimitExceeded = !checkRateLimit(`api_${clientIP}`, apiLimit, apiWindow);
  } else {
    // Very generous rate limiting for pages
    const pageLimit = isDevelopment ? 50000 : 5000;
    const pageWindow = isDevelopment ? 60 * 1000 : 15 * 60 * 1000; // 1 min dev, 15 min prod
    rateLimitExceeded = !checkRateLimit(`page_${clientIP}`, pageLimit, pageWindow);
  }
  
  if (rateLimitExceeded) {
    const isDev = process.env.NODE_ENV !== 'production';
    const retryAfter = isDev ? '60' : '900'; // 1 min dev, 15 min prod
    
    console.log(`🚫 Rate limit exceeded: ${clientIP} for ${pathname}`);
    console.log(`   Current store size: ${rateLimitStore.size} entries`);
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please slow down. Retry after ${retryAfter} seconds.`,
          retryAfter: parseInt(retryAfter)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter
          }
        }
      );
    } else {
      // For pages, redirect to a rate limit page or show a message
      return new NextResponse(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`, {
        status: 429,
        headers: {
          'Retry-After': retryAfter
        }
      });
    }
  }
  
  // Add security headers to response
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP header (✅ allow iframe for North.pl proxy)
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "font-src 'self'",
    "media-src 'self'",
    "frame-src 'self' https://north.pl"
  ].join('; '));
  
  // Remove server info
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};