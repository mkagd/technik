import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../../middleware/auth.js';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

async function handler(req, res) {
  if (req.method === 'GET') {
    // List all users (admin only)
    try {
      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
      
      // Remove passwords from response
      const users = accounts.map(({ password, ...user }) => user);
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          total: users.length
        }
      });
    } catch (error) {
      console.error('🔐 Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'GET_USERS_ERROR',
        message: 'Failed to retrieve users'
      });
    }
  }
  
  else if (req.method === 'POST') {
    // Create new user (admin only)
    try {
      const { email, password, name, role, permissions } = req.body;

      // Validation
      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Email, password, name, and role are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'PASSWORD_TOO_WEAK',
          message: 'Password must be at least 6 characters long'
        });
      }

      const validRoles = ['admin', 'manager', 'employee', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_ROLE',
          message: 'Role must be one of: ' + validRoles.join(', ')
        });
      }

      // Load existing accounts
      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
      
      // Check if email already exists
      if (accounts.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        name,
        role,
        permissions: permissions || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: req.user.id,
        lastLogin: null,
        loginAttempts: 0,
        lockedUntil: null
      };

      accounts.push(newUser);
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

      console.log(`🔐 New user created: ${email} (${role}) by ${req.user.email}`);

      // Return user without password
      const { password: _, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: userResponse
        }
      });

    } catch (error) {
      console.error('🔐 Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'CREATE_USER_ERROR',
        message: 'Failed to create user'
      });
    }
  }
  
  else if (req.method === 'PUT') {
    // Update user (admin only)
    try {
      const { userId, name, role, permissions, isActive } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_USER_ID',
          message: 'User ID is required'
        });
      }

      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
      const userIndex = accounts.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user.id && isActive === false) {
        return res.status(400).json({
          success: false,
          error: 'CANNOT_DEACTIVATE_SELF',
          message: 'Cannot deactivate your own account'
        });
      }

      // Update user fields
      if (name !== undefined) accounts[userIndex].name = name;
      if (role !== undefined) accounts[userIndex].role = role;
      if (permissions !== undefined) accounts[userIndex].permissions = permissions;
      if (isActive !== undefined) accounts[userIndex].isActive = isActive;
      
      accounts[userIndex].updatedAt = new Date().toISOString();
      accounts[userIndex].updatedBy = req.user.id;

      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

      console.log(`🔐 User updated: ${accounts[userIndex].email} by ${req.user.email}`);

      // Return updated user without password
      const { password: _, ...userResponse } = accounts[userIndex];
      
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: userResponse
        }
      });

    } catch (error) {
      console.error('🔐 Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'UPDATE_USER_ERROR',
        message: 'Failed to update user'
      });
    }
  }
  
  else {
    res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed'
    });
  }
}

// Apply admin authentication middleware
export default requireAdmin()(handler);