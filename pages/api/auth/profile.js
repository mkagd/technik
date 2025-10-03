import { verifyToken } from '../../../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method allowed'
    });
  }

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

    // Load user from database
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    const user = accounts.find(u => u.id === decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found or inactive'
      });
    }

    // Return user profile (without password)
    const { password: _, ...userProfile } = user;
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: userProfile,
        tokenValid: true,
        tokenExpiry: decoded.exp,
        serverTime: Math.floor(Date.now() / 1000)
      }
    });

  } catch (error) {
    console.error('🔐 Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_ERROR',
      message: 'Internal server error'
    });
  }
}