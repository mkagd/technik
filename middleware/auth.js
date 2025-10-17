/**
 * 🔐 JWT AUTHENTICATION MIDDLEWARE
 * Professional-grade authentication system
 * Vercel-compatible with Supabase
 */

import jwt from 'jsonwebtoken';
import { getServiceSupabase } from '../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Enhanced JWT token creation
export function createToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'technik-system',
    audience: 'technik-users'
  });
}

// Token verification with enhanced error handling
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'technik-system',
      audience: 'technik-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('TOKEN_INVALID');
    } else {
      throw new Error('TOKEN_ERROR');
    }
  }
}

// Main authentication middleware
export function requireAuth(requiredRole = null, requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      // Extract token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'NO_TOKEN',
          message: 'No authentication token provided'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify token
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: error.message,
          message: 'Invalid or expired token'
        });
      }

      // Load user from Supabase to check if still active
      const supabase = getServiceSupabase();
      const { data: user, error: dbError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();
      
      if (dbError || !user) {
        return res.status(401).json({
          success: false,
          error: 'USER_INACTIVE',
          message: 'User account is inactive or not found'
        });
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_ROLE',
          message: `Required role: ${requiredRole}`
        });
      }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermissions = requiredPermissions.every(perm => 
          userPermissions.includes(perm) || userPermissions.includes('*')
        );
        
        if (!hasPermissions && user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'Missing required permissions'
          });
        }
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        name: user.name,
        tokenData: decoded
      };

      // Log access for audit
      console.log(`🔐 Auth success: ${user.email} (${user.role}) accessing ${req.method} ${req.url}`);

      next();
    } catch (error) {
      console.error('🔐 Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'AUTH_ERROR',
        message: 'Authentication system error'
      });
    }
  };
}

// Optional authentication (for public endpoints that benefit from user context)
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      const supabase = getServiceSupabase();
      
      const { data: user } = await supabase
        .from('accounts')
        .select('id, email, role, permissions, name, is_active')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
          name: user.name
        };
      }
    } catch (error) {
      // Ignore errors in optional auth
      console.log('🔐 Optional auth failed, continuing as anonymous');
    }
  }
  
  next();
}

// Role-based access shortcuts
export const requireAdmin = () => requireAuth('admin');
export const requireEmployee = () => requireAuth('employee');
export const requireManager = () => requireAuth('manager');

// Permission-based access
export const requirePermissions = (...permissions) => requireAuth(null, permissions);

export default requireAuth;