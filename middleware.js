/**
 * 🔒 NEXT.JS MIDDLEWARE FOR COMPREHENSIVE SECURITY
 * Edge-level protection for all requests
 */

import { NextResponse } from 'next/server';

// In-memory stores (consider using Redis in production)
const rateLimitStore = new Map();
const blockedIPs = new Set();

// Rate limiting function
function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) || 0;
  
  if (current >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  rateLimitStore.set(key, current + 1);
  
  // Cleanup old entries (simple cleanup)
  if (Math.random() < 0.01) { // 1% chance to cleanup
    const cutoff = now - windowMs * 2;
    for (const [k] of rateLimitStore.entries()) {
      const keyTime = parseInt(k.split('_').pop()) * windowMs;
      if (keyTime < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return true;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const clientIP = request.ip || 'unknown';
  
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
  
  if (pathname.startsWith('/api/auth/')) {
    // Strict rate limiting for auth endpoints
    rateLimitExceeded = !checkRateLimit(`auth_${clientIP}`, 5, 15 * 60 * 1000);
  } else if (pathname.startsWith('/api/')) {
    // Generous rate limiting for API endpoints (increased for development)
    rateLimitExceeded = !checkRateLimit(`api_${clientIP}`, 2000, 15 * 60 * 1000);
  } else {
    // Very generous rate limiting for pages
    rateLimitExceeded = !checkRateLimit(`page_${clientIP}`, 5000, 15 * 60 * 1000);
  }
  
  if (rateLimitExceeded) {
    console.log(`🚫 Rate limit exceeded: ${clientIP} for ${pathname}`);
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          }
        }
      );
    } else {
      // For pages, redirect to a rate limit page or show a message
      return new NextResponse('Rate limit exceeded. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': '900'
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
  
  // CSP header
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "font-src 'self'",
    "media-src 'self'",
    "frame-src 'none'"
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