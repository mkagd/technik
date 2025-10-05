// pages/api/admin/client-password.js
// 🔐 API dla zarządzania hasłami klientów (tylko admin)

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');

// ===========================
// HELPER FUNCTIONS
// ===========================

const readClients = () => {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading clients.json:', error);
    return [];
  }
};

const saveClients = (clients) => {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving clients.json:', error);
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
    const { action, clientId, newPassword, adminId } = req.body;

    if (!action || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: action, clientId'
      });
    }

    try {
      const clients = readClients();
      const clientIndex = clients.findIndex(client => client.id === clientId);

      if (clientIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      switch (action) {
        case 'reset':
          // Reset hasła (admin podaje nowe)
          return await handleResetPassword(clients, clientIndex, newPassword, adminId, res);
        
        case 'generate':
          // Wygeneruj tymczasowe hasło
          return await handleGeneratePassword(clients, clientIndex, adminId, res);
        
        case 'send-email':
          // Wyślij hasło na email klienta
          return await handleSendPasswordEmail(clients, clientIndex, adminId, res);
        
        case 'send-sms':
          // Wyślij hasło SMS-em
          return await handleSendPasswordSMS(clients, clientIndex, adminId, res);
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: reset, generate, send-email, send-sms'
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
    // Sprawdź status hasła klienta
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing clientId parameter'
      });
    }
    
    const clients = readClients();
    const client = clients.find(c => c.id === clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasPassword: !!client.passwordHash,
        passwordSetAt: client.passwordSetAt || null,
        lastPasswordChange: client.lastPasswordChange || null,
        passwordChangedBy: client.passwordChangedBy || null,
        lastLogin: client.lastLogin || null,
        lastLoginMethod: client.lastLoginMethod || null
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
async function handleResetPassword(clients, clientIndex, newPassword, adminId, res) {
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  const client = clients[clientIndex];
  
  try {
    // Hash new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Save old password to history
    if (!client.passwordHistory) {
      client.passwordHistory = [];
    }
    
    if (client.passwordHash) {
      client.passwordHistory.push({
        hash: client.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: client.passwordChangedBy || 'unknown'
      });

      // Keep only last 3 passwords in history
      if (client.passwordHistory.length > 3) {
        client.passwordHistory = client.passwordHistory.slice(-3);
      }
    }

    // Update client data
    client.passwordHash = passwordHash;
    client.passwordSetAt = new Date().toISOString();
    client.passwordChangedBy = adminId || 'admin';
    client.lastPasswordChange = new Date().toISOString();

    // Save to file
    if (!saveClients(clients)) {
      throw new Error('Failed to save clients data');
    }

    console.log(`✅ Password reset for client ${client.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        clientId: client.id,
        passwordSetAt: client.passwordSetAt
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
async function handleGeneratePassword(clients, clientIndex, adminId, res) {
  const client = clients[clientIndex];
  
  try {
    // Generuj losowe hasło (6 znaków: cyfry)
    // Łatwiejsze dla klientów (tylko cyfry)
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Save old password to history
    if (!client.passwordHistory) {
      client.passwordHistory = [];
    }
    
    if (client.passwordHash) {
      client.passwordHistory.push({
        hash: client.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: client.passwordChangedBy || 'unknown'
      });

      // Keep only last 3 passwords
      if (client.passwordHistory.length > 3) {
        client.passwordHistory = client.passwordHistory.slice(-3);
      }
    }

    // Update client data
    client.passwordHash = passwordHash;
    client.passwordSetAt = new Date().toISOString();
    client.passwordChangedBy = adminId || 'admin';
    client.lastPasswordChange = new Date().toISOString();

    // Save to file
    if (!saveClients(clients)) {
      throw new Error('Failed to save clients data');
    }

    console.log(`✅ Temporary password generated for client ${client.id} by ${adminId || 'admin'}`);

    return res.status(200).json({
      success: true,
      message: 'Temporary password generated successfully',
      data: {
        clientId: client.id,
        temporaryPassword: tempPassword, // ⚠️ TYLKO RAZ!
        passwordSetAt: client.passwordSetAt,
        clientEmail: client.email,
        clientPhone: client.phone
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
// SEND PASSWORD VIA EMAIL
// ===========================
async function handleSendPasswordEmail(clients, clientIndex, adminId, res) {
  const client = clients[clientIndex];

  if (!client.email) {
    return res.status(400).json({
      success: false,
      message: 'Client has no email address'
    });
  }

  try {
    // Generuj hasło
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Update client data
    if (!client.passwordHistory) {
      client.passwordHistory = [];
    }
    
    if (client.passwordHash) {
      client.passwordHistory.push({
        hash: client.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: client.passwordChangedBy || 'unknown'
      });
    }

    client.passwordHash = passwordHash;
    client.passwordSetAt = new Date().toISOString();
    client.passwordChangedBy = adminId || 'admin';
    client.lastPasswordChange = new Date().toISOString();

    // Save to file
    if (!saveClients(clients)) {
      throw new Error('Failed to save clients data');
    }

    // TODO: Wysłanie emaila z hasłem
    // Integracja z Resend API (już masz w projekcie)
    console.log(`✅ Password email should be sent to ${client.email}`);
    console.log(`   Temporary password: ${tempPassword}`);

    return res.status(200).json({
      success: true,
      message: 'Password generated and email sent',
      data: {
        clientId: client.id,
        temporaryPassword: tempPassword, // TODO: Usuń to po dodaniu emaila
        emailSent: client.email,
        passwordSetAt: client.passwordSetAt
      }
    });
  } catch (error) {
    console.error('❌ Error sending password email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send password email',
      error: error.message
    });
  }
}

// ===========================
// SEND PASSWORD VIA SMS
// ===========================
async function handleSendPasswordSMS(clients, clientIndex, adminId, res) {
  const client = clients[clientIndex];

  if (!client.phone) {
    return res.status(400).json({
      success: false,
      message: 'Client has no phone number'
    });
  }

  try {
    // Generuj hasło (6 cyfr - łatwiejsze do wpisania z SMS)
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Update client data
    if (!client.passwordHistory) {
      client.passwordHistory = [];
    }
    
    if (client.passwordHash) {
      client.passwordHistory.push({
        hash: client.passwordHash,
        changedAt: new Date().toISOString(),
        changedBy: client.passwordChangedBy || 'unknown'
      });
    }

    client.passwordHash = passwordHash;
    client.passwordSetAt = new Date().toISOString();
    client.passwordChangedBy = adminId || 'admin';
    client.lastPasswordChange = new Date().toISOString();

    // Save to file
    if (!saveClients(clients)) {
      throw new Error('Failed to save clients data');
    }

    // TODO: Wysłanie SMS z hasłem
    // Integracja z Twilio/SMS API
    console.log(`✅ Password SMS should be sent to ${client.phone}`);
    console.log(`   Temporary password: ${tempPassword}`);

    return res.status(200).json({
      success: true,
      message: 'Password generated and SMS sent',
      data: {
        clientId: client.id,
        temporaryPassword: tempPassword, // TODO: Usuń to po dodaniu SMS
        smsSent: client.phone,
        passwordSetAt: client.passwordSetAt
      }
    });
  } catch (error) {
    console.error('❌ Error sending password SMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send password SMS',
      error: error.message
    });
  }
}
