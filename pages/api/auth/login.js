import bcrypt from 'bcryptjs';
import { createToken } from '../../../middleware/auth.js';

// Vercel-compatible login using environment variables
// Use non-NEXT_PUBLIC variables for server-side only access
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@technik.pl';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123';

// Default admin account (hash will be created on-demand)
function getDefaultAdmin() {
  return {
    id: 'admin-001',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // Plain password, will be compared directly
    name: 'Administrator Systemu',
    role: 'admin',
    permissions: ['*'],
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed'
    });
  }

  try {
    const { email, password } = req.body;
    const DEFAULT_ADMIN = getDefaultAdmin();

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }

    // Check if email matches admin
    if (email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase()) {
      // Simulate processing time to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Simple password comparison (no hashing for env-based auth)
    // In production, use proper database with hashed passwords
    if (password !== DEFAULT_ADMIN.password) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Create JWT token
    const user = {
      ...DEFAULT_ADMIN,
      lastLogin: new Date().toISOString()
    };
    
    const token = createToken(user);

    console.log(`🔐 Login success: ${user.email} (${user.role})`);

    // Return success response (don't include password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('🔐 Login error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: 'Internal server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}