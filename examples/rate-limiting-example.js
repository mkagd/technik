/**
 * 🛡️ PRZYKŁAD RATE LIMITING
 * Ogranicza liczbę requestów na minutę/użytkownika
 */

// middleware/rateLimiter.js
const requestCounts = new Map(); // IP → { count, resetTime }

export function rateLimit(maxRequests = 100, windowMs = 60000) { // 100 req/min
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Pobierz aktualny stan dla tego IP
    let clientData = requestCounts.get(clientIP);
    
    // Reset okna czasowego
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Sprawdź limit
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    // Zwiększ licznik
    clientData.count++;
    requestCounts.set(clientIP, clientData);
    
    // Dodaj headers info
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - clientData.count,
      'X-RateLimit-Reset': clientData.resetTime
    });
    
    next();
  };
}

// Użycie w Next.js:
// next.config.js
module.exports = {
  async middleware(request) {
    // Aplikuj rate limiting do API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return rateLimit(50, 60000)(request); // 50 req/min dla API
    }
  }
};

// EFEKT:
// Request 1-50:   ✅ OK
// Request 51:     ❌ 429 Too Many Requests
// Po 1 minucie:   ✅ Reset, znów można