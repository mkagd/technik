import bcrypt from 'bcryptjs';
import { createToken } from '../../../middleware/auth.js';
import { getServiceSupabase } from '../../../lib/supabase.js';

// Vercel-compatible login using Supabase database
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@technik.pl').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123').trim();

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

    console.log('🔐 Login attempt:', {
      receivedEmail: email,
      receivedPassword: password ? '***' + password.slice(-3) : 'undefined'
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
    const supabase = getServiceSupabase();
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !account) {
      console.log('🔐 Account not found in database:', email);
      
      // Fallback to env-based admin account
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        const user = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          name: 'Administrator Systemu',
          role: 'admin',
          permissions: ['*'],
          isActive: true,
          lastLogin: new Date().toISOString()
        };
        
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
    console.error('🔐 Login error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: 'Internal server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}