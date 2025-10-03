import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import requireAuth from '../../../middleware/auth.js';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed'
    });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'New password and confirmation do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_WEAK',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Load accounts
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    const userIndex = accounts.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found'
      });
    }

    const user = accounts[userIndex];

    // Verify current password
    const currentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!currentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    accounts[userIndex].password = hashedNewPassword;
    accounts[userIndex].passwordChangedAt = new Date().toISOString();
    
    // Save updated accounts
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));

    console.log(`🔐 Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        changedAt: accounts[userIndex].passwordChangedAt
      }
    });

  } catch (error) {
    console.error('🔐 Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'CHANGE_PASSWORD_ERROR',
      message: 'Internal server error'
    });
  }
}

// Apply authentication middleware
export default requireAuth()(handler);