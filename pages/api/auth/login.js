import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getServiceSupabase } from '../../../lib/supabase';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Inline createToken function to avoid import issues
function createToken(user) {
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

// Vercel-compatible login using Supabase database
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@technik.pl').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123').trim();

export default async function handler(req, res) {
  console.log('🔐 Login handler started - method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed'
    });
  }

  try {
    console.log('🔐 Parsing request body...');
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', {
      receivedEmail: email,
      receivedPassword: password ? '***' + password.slice(-3) : 'undefined',
      hasSupabase: typeof getServiceSupabase === 'function',
      hasJWT: typeof jwt !== 'undefined'
    });

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }

    // Check Supabase for account
    console.log('🔐 Querying Supabase...');
    const supabase = getServiceSupabase();
    console.log('🔐 Supabase client created');
    
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    console.log('🔐 Supabase query result:', { 
      hasAccount: !!account, 
      hasError: !!error,
      errorMsg: error?.message 
    });

    if (error || !account) {
      console.log('🔐 Account not found in database:', email);
      
      // Fallback to env-based admin account
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        console.log('🔐 Using env fallback for admin');
        const user = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          name: 'Administrator Systemu',
          role: 'admin',
          permissions: ['*'],
          isActive: true,
          lastLogin: new Date().toISOString()
        };
        
        console.log('🔐 Creating token for env admin...');
        const token = createToken(user);
        console.log(`🔐 Login success (env fallback): ${user.email}`);
        
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: userWithoutPassword,
            token,
            expiresIn: '24h'
          }
        });
      }
      
      // Invalid credentials
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (account.locked_until && new Date(account.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Verify password
    let passwordValid = false;
    
    // Try bcrypt first (if password is hashed)
    if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
      passwordValid = await bcrypt.compare(password, account.password);
    } else {
      // Plain text comparison (for migrated data)
      passwordValid = password === account.password;
    }

    if (!passwordValid) {
      // Increment failed login attempts
      const newAttempts = (account.login_attempts || 0) + 1;
      const updates = { login_attempts: newAttempts };
      
      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      }
      
      await supabase
        .from('accounts')
        .update(updates)
        .eq('id', account.id);
      
      console.log('🔐 Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Reset failed login attempts and update last login
    await supabase
      .from('accounts')
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', account.id);

    // Create JWT token
    const user = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      permissions: account.permissions,
      isActive: account.is_active,
      lastLogin: new Date().toISOString()
    };
    
    const token = createToken(user);
    console.log(`🔐 Login success: ${user.email} (${user.role})`);

    // Return success response (don't include password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('🔐 Login error - DETAILED:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: 'Internal server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorName: error.name,
      errorCode: error.code
    });
  }
}