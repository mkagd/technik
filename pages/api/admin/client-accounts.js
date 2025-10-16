// pages/api/admin/client-accounts.js
// 🔐 Admin API do zarządzania kontami klientów

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'client-sessions.json');
const SECURITY_LOG_FILE = path.join(process.cwd(), 'data', 'client-security-log.json');

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
    console.error('❌ Error saving clients:', error);
    return false;
  }
};

const readSessions = () => {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading sessions:', error);
    return [];
  }
};

const saveSessions = (sessions) => {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving sessions:', error);
    return false;
  }
};

const logSecurityEvent = (event) => {
  try {
    let logs = [];
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const data = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
      logs = JSON.parse(data);
    }

    logs.unshift({
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    });

    // Zachowaj tylko ostatnie 1000 logów
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000);
    }

    fs.writeFileSync(SECURITY_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('❌ Error logging security event:', error);
  }
};

// ===========================
// MAIN HANDLER
// ===========================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // TODO: Dodać autoryzację admina
  // const adminAuth = req.headers.authorization;
  // if (!adminAuth || !validateAdminToken(adminAuth)) {
  //   return res.status(401).json({ success: false, message: 'Unauthorized' });
  // }

  const { action } = req.body || req.query;

  try {
    switch (action) {
      case 'resetPassword':
        return await handleResetPassword(req, res);
      
      case 'lockAccount':
        return handleLockAccount(req, res);
      
      case 'unlockAccount':
        return handleUnlockAccount(req, res);
      
      case 'getSecurityInfo':
        return handleGetSecurityInfo(req, res);
      
      case 'invalidateAllSessions':
        return handleInvalidateAllSessions(req, res);
      
      case 'getSecurityLog':
        return handleGetSecurityLog(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown action. Use: resetPassword, lockAccount, unlockAccount, getSecurityInfo, invalidateAllSessions, getSecurityLog'
        });
    }
  } catch (error) {
    console.error('❌ Client account management error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// ===========================
// RESET PASSWORD
// ===========================
async function handleResetPassword(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { clientId, newPassword, adminId, adminName } = req.body;

  if (!clientId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'clientId i newPassword są wymagane'
    });
  }

  // Walidacja hasła
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Hasło musi mieć minimum 6 znaków'
    });
  }

  const clients = readClients();
  const clientIndex = clients.findIndex(c => c.id === clientId);

  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  const client = clients[clientIndex];

  // Hashuj nowe hasło
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Aktualizuj klienta
  clients[clientIndex] = {
    ...client,
    passwordHash,
    passwordResetBy: adminId || 'admin',
    passwordResetAt: new Date().toISOString(),
    failedLoginAttempts: 0, // Reset prób logowania
    isLocked: false, // Odblokuj konto jeśli było zablokowane
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!saveClients(clients)) {
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania zmian'
    });
  }

  // Invalidate wszystkie sesje użytkownika (wymuszenie ponownego logowania)
  const sessions = readSessions();
  const updatedSessions = sessions.map(s => 
    s.clientId === clientId ? { ...s, isValid: false, invalidatedBy: 'password_reset' } : s
  );
  saveSessions(updatedSessions);

  // Log security event
  logSecurityEvent({
    type: 'PASSWORD_RESET',
    action: 'Admin password reset',
    clientId: client.id,
    clientEmail: client.email,
    adminId: adminId || 'unknown',
    adminName: adminName || 'Admin',
    success: true
  });

  console.log(`🔑 Password reset for client ${client.id} by admin ${adminName || adminId || 'unknown'}`);

  return res.status(200).json({
    success: true,
    message: 'Hasło zostało zresetowane pomyślnie. Wszystkie sesje użytkownika zostały unieważnione.',
    client: {
      id: client.id,
      name: client.name,
      email: client.email
    }
  });
}

// ===========================
// LOCK ACCOUNT
// ===========================
function handleLockAccount(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { clientId, reason, adminId, adminName } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'clientId jest wymagane'
    });
  }

  const clients = readClients();
  const clientIndex = clients.findIndex(c => c.id === clientId);

  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  const client = clients[clientIndex];

  // Sprawdź czy już zablokowane
  if (client.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Konto jest już zablokowane'
    });
  }

  // Zablokuj konto
  clients[clientIndex] = {
    ...client,
    isLocked: true,
    lockedBy: adminId || 'admin',
    lockedByName: adminName || 'Admin',
    lockedAt: new Date().toISOString(),
    lockReason: reason || 'Admin manual lock',
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!saveClients(clients)) {
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania zmian'
    });
  }

  // Invalidate wszystkie sesje
  const sessions = readSessions();
  const updatedSessions = sessions.map(s => 
    s.clientId === clientId ? { ...s, isValid: false, invalidatedBy: 'account_locked' } : s
  );
  saveSessions(updatedSessions);

  // Log security event
  logSecurityEvent({
    type: 'ACCOUNT_LOCKED',
    action: 'Admin locked account',
    clientId: client.id,
    clientEmail: client.email,
    adminId: adminId || 'unknown',
    adminName: adminName || 'Admin',
    reason: reason || 'Manual lock',
    success: true
  });

  console.log(`🔒 Account locked for client ${client.id} by admin ${adminName || adminId || 'unknown'}`);

  return res.status(200).json({
    success: true,
    message: 'Konto zostało zablokowane. Wszystkie sesje użytkownika zostały unieważnione.',
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      isLocked: true,
      lockedAt: clients[clientIndex].lockedAt,
      lockReason: clients[clientIndex].lockReason
    }
  });
}

// ===========================
// UNLOCK ACCOUNT
// ===========================
function handleUnlockAccount(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { clientId, adminId, adminName } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'clientId jest wymagane'
    });
  }

  const clients = readClients();
  const clientIndex = clients.findIndex(c => c.id === clientId);

  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  const client = clients[clientIndex];

  // Sprawdź czy zablokowane
  if (!client.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Konto nie jest zablokowane'
    });
  }

  // Odblokuj konto
  clients[clientIndex] = {
    ...client,
    isLocked: false,
    unlockedBy: adminId || 'admin',
    unlockedByName: adminName || 'Admin',
    unlockedAt: new Date().toISOString(),
    failedLoginAttempts: 0, // Reset prób
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!saveClients(clients)) {
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania zmian'
    });
  }

  // Log security event
  logSecurityEvent({
    type: 'ACCOUNT_UNLOCKED',
    action: 'Admin unlocked account',
    clientId: client.id,
    clientEmail: client.email,
    adminId: adminId || 'unknown',
    adminName: adminName || 'Admin',
    success: true
  });

  console.log(`🔓 Account unlocked for client ${client.id} by admin ${adminName || adminId || 'unknown'}`);

  return res.status(200).json({
    success: true,
    message: 'Konto zostało odblokowane. Użytkownik może się teraz zalogować.',
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      isLocked: false,
      unlockedAt: clients[clientIndex].unlockedAt
    }
  });
}

// ===========================
// GET SECURITY INFO
// ===========================
function handleGetSecurityInfo(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET.' 
    });
  }

  const { clientId } = req.query;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'clientId jest wymagane'
    });
  }

  const clients = readClients();
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  // Pobierz sesje użytkownika
  const sessions = readSessions();
  const clientSessions = sessions.filter(s => s.clientId === clientId);
  const activeSessions = clientSessions.filter(s => s.isValid);

  // Pobierz logi bezpieczeństwa
  let securityLogs = [];
  try {
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const data = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
      const allLogs = JSON.parse(data);
      securityLogs = allLogs.filter(log => log.clientId === clientId).slice(0, 50); // Ostatnie 50 zdarzeń
    }
  } catch (error) {
    console.error('Error reading security logs:', error);
  }

  return res.status(200).json({
    success: true,
    securityInfo: {
      // Status konta
      isLocked: client.isLocked || false,
      status: client.status || 'active',
      
      // Hasło i logowanie
      hasPassword: !!client.passwordHash,
      lastLogin: client.lastLogin || null,
      lastLoginMethod: client.lastLoginMethod || null,
      failedLoginAttempts: client.failedLoginAttempts || 0,
      maxFailedAttempts: 5,
      
      // Blokada
      lockedBy: client.lockedBy || null,
      lockedByName: client.lockedByName || null,
      lockedAt: client.lockedAt || null,
      lockReason: client.lockReason || null,
      unlockedBy: client.unlockedBy || null,
      unlockedAt: client.unlockedAt || null,
      
      // Reset hasła
      passwordResetBy: client.passwordResetBy || null,
      passwordResetAt: client.passwordResetAt || null,
      
      // Sesje
      totalSessions: clientSessions.length,
      activeSessions: activeSessions.length,
      sessions: activeSessions.map(s => ({
        token: s.token.substring(0, 8) + '...', // Ukryj pełny token
        loginMethod: s.loginMethod,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        ip: s.ip || 'unknown',
        userAgent: s.userAgent || 'unknown'
      })),
      
      // Historia
      securityLog: securityLogs
    }
  });
}

// ===========================
// INVALIDATE ALL SESSIONS
// ===========================
function handleInvalidateAllSessions(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { clientId, adminId, adminName } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'clientId jest wymagane'
    });
  }

  const clients = readClients();
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  // Invalidate wszystkie sesje
  const sessions = readSessions();
  const updatedSessions = sessions.map(s => 
    s.clientId === clientId ? { 
      ...s, 
      isValid: false, 
      invalidatedBy: 'admin_action',
      invalidatedAt: new Date().toISOString()
    } : s
  );
  const invalidatedCount = updatedSessions.filter(s => 
    s.clientId === clientId && !s.isValid
  ).length;

  saveSessions(updatedSessions);

  // Log security event
  logSecurityEvent({
    type: 'SESSIONS_INVALIDATED',
    action: 'Admin invalidated all sessions',
    clientId: client.id,
    clientEmail: client.email,
    adminId: adminId || 'unknown',
    adminName: adminName || 'Admin',
    sessionsCount: invalidatedCount,
    success: true
  });

  console.log(`🚪 All sessions invalidated for client ${client.id} by admin ${adminName || adminId || 'unknown'}`);

  return res.status(200).json({
    success: true,
    message: `Unieważniono ${invalidatedCount} sesji użytkownika. Użytkownik będzie musiał zalogować się ponownie.`,
    invalidatedSessions: invalidatedCount
  });
}

// ===========================
// GET SECURITY LOG (for admin dashboard)
// ===========================
function handleGetSecurityLog(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET.' 
    });
  }

  const { limit = 100, clientId, type } = req.query;

  try {
    let logs = [];
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const data = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
      logs = JSON.parse(data);
    }

    // Filtruj po clientId jeśli podano
    if (clientId) {
      logs = logs.filter(log => log.clientId === clientId);
    }

    // Filtruj po typie jeśli podano
    if (type) {
      logs = logs.filter(log => log.type === type);
    }

    // Ogranicz liczbę wyników
    logs = logs.slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error reading security log:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd odczytu logów bezpieczeństwa'
    });
  }
}
