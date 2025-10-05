// pages/api/admin/employee-password.js
// 🔐 API dla zarządzania hasłami pracowników (tylko admin)

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

// ===========================
// HELPER FUNCTIONS
// ===========================

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading employees.json:', error);
    return [];
  }
};

const saveEmployees = (employees) => {
  try {
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving employees.json:', error);
    return false;
  }
};

// ===========================
// API HANDLER
// ===========================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // TODO: Dodaj walidację JWT admina
  // const adminToken = req.headers.authorization;
  // if (!validateAdminToken(adminToken)) {
  //   return res.status(403).json({ success: false, message: 'Unauthorized' });
  // }

  if (req.method === 'POST') {
    const { action, employeeId, newPassword, adminId } = req.body;

    if (!action || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: action, employeeId'
      });
    }

    try {
      const employees = readEmployees();
      const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

      if (employeeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      switch (action) {
        case 'reset':
          // Reset hasła (admin podaje nowe)
          return await handleResetPassword(employees, employeeIndex, newPassword, adminId, res);
        
        case 'generate':
          // Wygeneruj tymczasowe hasło
          return await handleGeneratePassword(employees, employeeIndex, adminId, res);
        
        case 'require-change':
          // Wymusza zmianę hasła przy następnym logowaniu
          return handleRequirePasswordChange(employees, employeeIndex, adminId, res);
        
        case 'lock':
          // Zablokuj konto (ręcznie przez admina)
          return handleLockAccount(employees, employeeIndex, adminId, res);
        
        case 'unlock':
          // Odblokuj konto (jeśli było zablokowane)
          return handleUnlockAccount(employees, employeeIndex, adminId, res);
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: reset, generate, require-change, lock, unlock'
          });
      }
    } catch (error) {
      console.error('❌ Password management error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Sprawdź status hasła pracownika
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing employeeId parameter'
      });
    }
    
    const employees = readEmployees();
    const employee = employees.find(emp => emp.id === employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasPassword: !!employee.passwordHash,
        passwordSetAt: employee.passwordSetAt || null,
        requirePasswordChange: employee.requirePasswordChange || false,
        lastPasswordChange: employee.lastPasswordChange || null,
        passwordChangedBy: employee.passwordChangedBy || null,
        isLocked: employee.isLocked || false,
        failedLoginAttempts: employee.failedLoginAttempts || 0,
        lastLoginAttempt: employee.lastLoginAttempt || null
      }
    });
  } else {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET or POST.'
    });
  }
}

// ===========================
// RESET PASSWORD (admin sets new password)
// ===========================
async function handleResetPassword(employees, employeeIndex, newPassword, adminId, res) {
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  const employee = employees[employeeIndex];
  
  try {
    // Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Save old password to history
    if (!employee.passwordHistory) {
      employee.passwordHistory = [];
    }
    
    if (employee.passwordHash) {
      employee.passwordHistory.push({
        hash: employee.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: employee.passwordChangedBy || 'unknown'
      });

      // Keep only last 5 passwords in history
      if (employee.passwordHistory.length > 5) {
        employee.passwordHistory = employee.passwordHistory.slice(-5);
      }
    }

    // Update employee data
    employee.passwordHash = passwordHash;
    employee.passwordSetAt = new Date().toISOString();
    employee.passwordChangedBy = adminId || 'admin';
    employee.lastPasswordChange = new Date().toISOString();
    employee.requirePasswordChange = false; // Reset flag
    employee.isLocked = false; // Unlock account
    employee.failedLoginAttempts = 0; // Reset failed attempts

    // Save to file
    if (!saveEmployees(employees)) {
      throw new Error('Failed to save employees data');
    }

    console.log(`✅ Password reset for employee ${employee.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        employeeId: employee.id,
        passwordSetAt: employee.passwordSetAt
      }
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
}

// ===========================
// GENERATE TEMPORARY PASSWORD
// ===========================
async function handleGeneratePassword(employees, employeeIndex, adminId, res) {
  const employee = employees[employeeIndex];
  
  try {
    // Generuj losowe hasło (8 znaków: wielkie litery + cyfry)
    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Save old password to history
    if (!employee.passwordHistory) {
      employee.passwordHistory = [];
    }
    
    if (employee.passwordHash) {
      employee.passwordHistory.push({
        hash: employee.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: employee.passwordChangedBy || 'unknown'
      });

      // Keep only last 5 passwords
      if (employee.passwordHistory.length > 5) {
        employee.passwordHistory = employee.passwordHistory.slice(-5);
      }
    }

    // Update employee data
    employee.passwordHash = passwordHash;
    employee.passwordSetAt = new Date().toISOString();
    employee.passwordChangedBy = adminId || 'admin';
    employee.lastPasswordChange = new Date().toISOString();
    employee.requirePasswordChange = true; // Wymaga zmiany przy logowaniu
    employee.isLocked = false; // Unlock account
    employee.failedLoginAttempts = 0; // Reset failed attempts

    // Save to file
    if (!saveEmployees(employees)) {
      throw new Error('Failed to save employees data');
    }

    console.log(`✅ Temporary password generated for employee ${employee.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Temporary password generated successfully',
      data: {
        employeeId: employee.id,
        temporaryPassword: tempPassword, // ⚠️ TYLKO RAZ! Admin musi to przekazać pracownikowi
        passwordSetAt: employee.passwordSetAt,
        requirePasswordChange: true
      }
    });
  } catch (error) {
    console.error('❌ Error generating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate password',
      error: error.message
    });
  }
}

// ===========================
// REQUIRE PASSWORD CHANGE
// ===========================
function handleRequirePasswordChange(employees, employeeIndex, adminId, res) {
  const employee = employees[employeeIndex];

  try {
    employee.requirePasswordChange = true;
    employee.passwordChangedBy = adminId || 'admin';

    // Save to file
    if (!saveEmployees(employees)) {
      throw new Error('Failed to save employees data');
    }

    console.log(`✅ Password change required for employee ${employee.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Password change will be required on next login',
      data: {
        employeeId: employee.id,
        requirePasswordChange: true
      }
    });
  } catch (error) {
    console.error('❌ Error setting password change requirement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set password change requirement',
      error: error.message
    });
  }
}

// ===========================
// LOCK ACCOUNT (ręcznie przez admina)
// ===========================
function handleLockAccount(employees, employeeIndex, adminId, res) {
  const employee = employees[employeeIndex];

  try {
    // Sprawdź czy już zablokowane
    if (employee.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Account is already locked'
      });
    }

    employee.isLocked = true;
    employee.lockedBy = adminId || 'admin';
    employee.lockedAt = new Date().toISOString();
    employee.lockReason = 'manual'; // manual vs automatic (5 failed attempts)

    // Save to file
    if (!saveEmployees(employees)) {
      throw new Error('Failed to save employees data');
    }

    console.log(`🔒 Account locked for employee ${employee.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Account locked successfully',
      data: {
        employeeId: employee.id,
        isLocked: true,
        lockedBy: adminId || 'admin',
        lockedAt: employee.lockedAt
      }
    });
  } catch (error) {
    console.error('❌ Error locking account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to lock account',
      error: error.message
    });
  }
}

// ===========================
// UNLOCK ACCOUNT
// ===========================
function handleUnlockAccount(employees, employeeIndex, adminId, res) {
  const employee = employees[employeeIndex];

  try {
    employee.isLocked = false;
    employee.failedLoginAttempts = 0;
    employee.lastLoginAttempt = null;
    employee.unlockedBy = adminId || 'admin';
    employee.unlockedAt = new Date().toISOString();

    // Save to file
    if (!saveEmployees(employees)) {
      throw new Error('Failed to save employees data');
    }

    console.log(`✅ Account unlocked for employee ${employee.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Account unlocked successfully',
      data: {
        employeeId: employee.id,
        isLocked: false
      }
    });
  } catch (error) {
    console.error('❌ Error unlocking account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock account',
      error: error.message
    });
  }
}
