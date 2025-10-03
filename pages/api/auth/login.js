import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { createToken } from '../../../middleware/auth.js';
import { validateAuthData } from '../../../utils/validation.js';
import { rateLimit } from '../../../middleware/security.js';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

// Initialize accounts file if it doesn't exist
function initializeAccountsFile() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const defaultAccounts = [
      {
        id: 'admin-001',
        email: 'admin@technik.pl',
        password: bcrypt.hashSync('admin123', 12), // Change this password!
        name: 'Administrator Systemu',
        role: 'admin',
        permissions: ['*'], // All permissions
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0,
        lockedUntil: null
      },
      {
        id: 'manager-001',
        email: 'manager@technik.pl',
        password: bcrypt.hashSync('manager123', 12), // Change this password!
        name: 'Kierownik Serwisu',
        role: 'manager',
        permissions: ['orders.view', 'orders.edit', 'clients.view', 'clients.edit', 'reports.view'],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0,
        lockedUntil: null
      }
    ];
    
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(defaultAccounts, null, 2));
    console.log('🔐 Default accounts created');
  }
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
    initializeAccountsFile();

    // Input validation and sanitization
    const validation = validateAuthData(req.body, 'login');
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validation.errors
      });
    }

    const { email, password } = validation.sanitized;

    // Basic validation (redundant but safer)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }

    // Load accounts
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    const user = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Simulate processing time to prevent timing attacks
      await bcrypt.hash('dummy', 12);
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      return res.status(423).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to too many failed attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        console.log(`🔐 Account locked: ${email} (${user.loginAttempts} attempts)`);
      }
      
      // Save updated account data
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Successful login - reset attempts and update last login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    
    // Save updated account data
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

    // Create JWT token
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
      message: 'Internal server error during login'
    });
  }
}