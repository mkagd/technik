// pages/api/technician/auth.js
// 🔐 API dla autoryzacji techników z JWT tokens

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');

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

// Generuj bezpieczny token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hashuj hasło (prosty SHA256 dla demo, w produkcji użyj bcrypt)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Waliduj token
const validateToken = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  // Sprawdź czy token nie wygasł (7 dni)
  const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 dni
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    // Token wygasł
    session.isValid = false;
    saveSessions(sessions);
    return null;
  }
  
  return session;
};

// ===========================
// API HANDLERS
// ===========================

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.body || req.query;

  try {
    switch (action) {
      case 'login':
        return handleLogin(req, res);
      
      case 'logout':
        return handleLogout(req, res);
      
      case 'validate':
        return handleValidateToken(req, res);
      
      case 'refresh':
        return handleRefreshToken(req, res);
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown action. Use: login, logout, validate, refresh'
        });
    }
  } catch (error) {
    console.error('❌ Auth API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// ===========================
// LOGIN
// ===========================
const handleLogin = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email i hasło są wymagane'
    });
  }

  const employees = readEmployees();
  
  // Znajdź pracownika po emailu
  const employee = employees.find(emp => 
    emp.email.toLowerCase() === email.toLowerCase() && emp.isActive
  );

  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy email lub konto nieaktywne'
    });
  }

  // ⭐ KROK 1: Sprawdź czy konto jest zablokowane (PRZED sprawdzeniem hasła!)
  if (employee.isLocked) {
    return res.status(403).json({
      success: false,
      message: '🔒 Twoje konto zostało zablokowane/zawieszone. Skontaktuj się z administratorem, aby je odblokować.',
      isLocked: true
    });
  }

  // ⭐ KROK 2: Sprawdź hasło z bcrypt
  
  // Sprawdź czy pracownik ma ustawione hasło
  if (!employee.passwordHash) {
    // Fallback: sprawdź domyślne hasło (dla wstecznej kompatybilności)
    const defaultPassword = 'haslo123';
    if (password !== defaultPassword) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowe hasło'
      });
    }
    console.log(`⚠️ Employee ${employee.id} using default password - migration needed`);
  } else {
    // Użyj bcrypt do weryfikacji
    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    
    if (!isPasswordValid) {
      // Zwiększ licznik nieudanych prób
      if (!employee.failedLoginAttempts) employee.failedLoginAttempts = 0;
      employee.failedLoginAttempts++;
      employee.lastLoginAttempt = new Date().toISOString();

      // Zablokuj po 5 nieudanych próbach
      if (employee.failedLoginAttempts >= 5) {
        employee.isLocked = true;
        employee.lockedAt = new Date().toISOString();
        employee.lockReason = 'automatic'; // 5 failed attempts
        saveEmployees(employees);
        
        return res.status(403).json({
          success: false,
          message: '🔒 Twoje konto zostało zablokowane z powodu zbyt wielu nieudanych prób logowania. Skontaktuj się z administratorem.',
          isLocked: true
        });
      }

      saveEmployees(employees);

      return res.status(401).json({
        success: false,
        message: `❌ Nieprawidłowe hasło. Pozostało prób: ${5 - employee.failedLoginAttempts}.`,
        attemptsLeft: 5 - employee.failedLoginAttempts
      });
    }

    // ✅ Hasło prawidłowe - reset failed attempts
    employee.failedLoginAttempts = 0;
    employee.lastLogin = new Date().toISOString();
    saveEmployees(employees);
  }

  // ⭐ KROK 3: Sprawdź czy wymaga zmiany hasła
  if (employee.requirePasswordChange) {
    return res.status(403).json({
      success: false,
      message: '⚠️ Wymagana zmiana hasła. Skontaktuj się z administratorem.',
      requirePasswordChange: true
    });
  }

  // Generuj token
  const token = generateToken();
  const sessions = readSessions();

  // Utwórz nową sesję
  const session = {
    token,
    employeeId: employee.id,
    email: employee.email,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isValid: true,
    rememberMe: rememberMe || false,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  sessions.push(session);
  saveSessions(sessions);

  // Przygotuj dane do zwrócenia (bez wrażliwych informacji)
  const employeeData = {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    firstName: employee.name.split(' ')[0],
    lastName: employee.name.split(' ').slice(1).join(' '),
    specializations: employee.specializations || [],
    agdSpecializations: employee.agdSpecializations || null,
    workingHours: employee.workingHours || '8:00-16:00',
    phone: employee.phone,
    address: employee.address,
    rating: employee.rating,
    experience: employee.experience,
    completedJobs: employee.completedJobs,
    vehicles: employee.vehicles || null
  };

  console.log(`✅ Login successful: ${employee.name} (${employee.id})`);

  return res.status(200).json({
    success: true,
    message: 'Zalogowano pomyślnie',
    token,
    employee: employeeData,
    expiresIn: '7d'
  });
};

// ===========================
// LOGOUT
// ===========================
const handleLogout = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token jest wymagany'
    });
  }

  const sessions = readSessions();
  const sessionIndex = sessions.findIndex(s => s.token === token);

  if (sessionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Sesja nie znaleziona'
    });
  }

  // Oznacz sesję jako nieważną
  sessions[sessionIndex].isValid = false;
  sessions[sessionIndex].logoutAt = new Date().toISOString();
  saveSessions(sessions);

  console.log(`✅ Logout successful: Token ${token.substring(0, 8)}...`);

  return res.status(200).json({
    success: true,
    message: 'Wylogowano pomyślnie'
  });
};

// ===========================
// VALIDATE TOKEN
// ===========================
const handleValidateToken = (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token jest wymagany'
    });
  }

  const session = validateToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy lub wygasły token'
    });
  }

  // Aktualizuj ostatnią aktywność
  const sessions = readSessions();
  const currentSession = sessions.find(s => s.token === token);
  if (currentSession) {
    currentSession.lastActivity = new Date().toISOString();
    saveSessions(sessions);
  }

  // Pobierz dane pracownika
  const employees = readEmployees();
  const employee = employees.find(emp => emp.id === session.employeeId);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Pracownik nie znaleziony'
    });
  }

  const employeeData = {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    firstName: employee.name.split(' ')[0],
    lastName: employee.name.split(' ').slice(1).join(' '),
    specializations: employee.specializations || [],
    agdSpecializations: employee.agdSpecializations || null,
    workingHours: employee.workingHours || '8:00-16:00',
    phone: employee.phone,
    rating: employee.rating,
    completedJobs: employee.completedJobs
  };

  return res.status(200).json({
    success: true,
    message: 'Token jest prawidłowy',
    employee: employeeData,
    session: {
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }
  });
};

// ===========================
// REFRESH TOKEN
// ===========================
const handleRefreshToken = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const oldToken = req.headers.authorization?.replace('Bearer ', '');

  if (!oldToken) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }

  const session = validateToken(oldToken);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Generuj nowy token
  const newToken = generateToken();
  const sessions = readSessions();

  // Oznacz stary token jako nieważny
  const oldSession = sessions.find(s => s.token === oldToken);
  if (oldSession) {
    oldSession.isValid = false;
    oldSession.replacedBy = newToken;
  }

  // Utwórz nową sesję
  const newSession = {
    token: newToken,
    employeeId: session.employeeId,
    email: session.email,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isValid: true,
    rememberMe: session.rememberMe,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    refreshedFrom: oldToken
  };

  sessions.push(newSession);
  saveSessions(sessions);

  console.log(`✅ Token refreshed for employee: ${session.employeeId}`);

  return res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    token: newToken,
    expiresIn: '7d'
  });
};
