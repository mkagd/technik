// pages/api/client/auth.js
// 🔐 API dla autoryzacji klientów
// Obsługuje 3 sposoby logowania:
// 1. EMAIL + HASŁO
// 2. TELEFON + HASŁO
// 3. NUMER ZAMÓWIENIA + HASŁO

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'client-sessions.json');

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

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading orders.json:', error);
    return [];
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

const saveClients = (clients) => {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving clients:', error);
    return false;
  }
};

const generateToken = () => {
  return crypto.randomUUID();
};

const validateSession = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  // Sprawdź czy token nie wygasł (30 dni)
  const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30 dni
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

  const { action } = req.body || req.query;

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      
      case 'register':
        return await handleRegister(req, res);
      
      case 'logout':
        return handleLogout(req, res);
      
      case 'validate':
        return handleValidateToken(req, res);
      
      case 'check':
        return handleCheckCredentials(req, res);
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown action. Use: login, register, logout, validate, check'
        });
    }
  } catch (error) {
    console.error('❌ Client auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// ===========================
// REGISTER
// ===========================
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { 
    type, 
    firstName, 
    lastName, 
    email, 
    phone, 
    mobile,
    companyName,
    nip,
    address, 
    password 
  } = req.body;

  // Walidacja wymaganych pól
  if (!firstName || !lastName || !email || !phone || !address || !password) {
    return res.status(400).json({
      success: false,
      message: 'Wszystkie pola oznaczone * są wymagane'
    });
  }

  // Walidacja email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Nieprawidłowy format adresu email'
    });
  }

  // Walidacja hasła
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Hasło musi mieć minimum 6 znaków'
    });
  }

  const clients = readClients();

  // Sprawdź czy email już istnieje
  const existingEmail = clients.find(c => 
    c.email && c.email.toLowerCase() === email.toLowerCase()
  );
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: 'Ten adres email jest już zarejestrowany'
    });
  }

  // Sprawdź czy telefon już istnieje
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const existingPhone = clients.find(c => {
    if (!c.phone) return false;
    return c.phone.replace(/[\s-]/g, '') === normalizedPhone;
  });
  if (existingPhone) {
    return res.status(409).json({
      success: false,
      message: 'Ten numer telefonu jest już zarejestrowany'
    });
  }

  // Jeśli firma, sprawdź NIP
  if (type === 'company' && nip) {
    const existingNip = clients.find(c => c.nip === nip.replace(/[-\s]/g, ''));
    if (existingNip) {
      return res.status(409).json({
        success: false,
        message: 'Ten NIP jest już zarejestrowany'
      });
    }
  }

  // Generuj ID dla nowego klienta
  const lastClient = clients.length > 0 
    ? clients.sort((a, b) => b.id.localeCompare(a.id))[0]
    : null;
  
  let newIdNumber = 1;
  if (lastClient && lastClient.id) {
    const lastNumber = parseInt(lastClient.id.replace('CLI', ''));
    newIdNumber = lastNumber + 1;
  }
  
  const newId = `CLI2025${String(newIdNumber).padStart(6, '0')}`;

  // Hashuj hasło
  const passwordHash = await bcrypt.hash(password, 10);

  // Utwórz nowego klienta
  const newClient = {
    id: newId,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    type: type || 'individual',
    email: email.toLowerCase(),
    phone: phone.trim(),
    mobile: mobile?.trim() || phone.trim(),
    address: {
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber || '',
      city: address.city,
      postalCode: address.postalCode,
      voivodeship: address.voivodeship || 'podkarpackie',
      country: address.country || 'Polska'
    },
    passwordHash,
    status: 'active',
    failedLoginAttempts: 0,
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Dodaj dane firmowe jeśli firma
  if (type === 'company') {
    newClient.companyName = companyName;
    newClient.nip = nip.replace(/[-\s]/g, '');
  }

  // Zapisz nowego klienta
  clients.push(newClient);
  const saved = saveClients(clients);

  if (!saved) {
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania konta'
    });
  }

  // Utwórz sesję (automatyczne logowanie po rejestracji)
  const token = generateToken();
  const sessions = readSessions();
  
  const newSession = {
    token,
    clientId: newClient.id,
    loginMethod: 'email',
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isValid: true
  };

  sessions.push(newSession);
  saveSessions(sessions);

  // Przygotuj dane klienta do wysłania (bez hasła)
  const clientData = {
    id: newClient.id,
    name: newClient.name,
    firstName: newClient.firstName,
    lastName: newClient.lastName,
    email: newClient.email,
    phone: newClient.phone,
    mobile: newClient.mobile,
    type: newClient.type,
    address: newClient.address
  };

  console.log('✅ New client registered:', newClient.id, newClient.email);

  return res.status(201).json({
    success: true,
    message: '✅ Konto zostało utworzone pomyślnie',
    client: clientData,
    token
  });
}

// ===========================
// LOGIN
// ===========================
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { identifier, password, rememberMe, loginMethod } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/telefon i hasło są wymagane'
    });
  }

  const clients = readClients();
  let client = null;
  let usedMethod = loginMethod || 'auto';

  // ===========================
  // METODA 1: EMAIL + HASŁO
  // ===========================
  if (!client && (usedMethod === 'auto' || usedMethod === 'email')) {
    client = clients.find(c => 
      c.email && c.email.toLowerCase() === identifier.toLowerCase()
    );
    if (client) usedMethod = 'email';
  }

  // ===========================
  // METODA 2: TELEFON + HASŁO
  // ===========================
  if (!client && (usedMethod === 'auto' || usedMethod === 'phone')) {
    // Normalizuj numer telefonu (usuń spacje, myślniki)
    const normalizedIdentifier = identifier.replace(/[\s-]/g, '');
    client = clients.find(c => {
      if (!c.phone) return false;
      const normalizedPhone = c.phone.replace(/[\s-]/g, '');
      return normalizedPhone === normalizedIdentifier;
    });
    if (client) usedMethod = 'phone';
  }

  // ===========================
  // METODA 3: NUMER ZAMÓWIENIA + HASŁO
  // ===========================
  if (!client && (usedMethod === 'auto' || usedMethod === 'order')) {
    const orders = readOrders();
    const order = orders.find(o => o.id === identifier || o.orderNumber === identifier);
    
    if (order && order.clientId) {
      client = clients.find(c => c.id === order.clientId);
      if (client) usedMethod = 'order';
    }
  }

  // Nie znaleziono klienta
  if (!client) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowe dane logowania. Sprawdź email, telefon lub numer zamówienia.'
    });
  }

  // Sprawdź czy klient ma ustawione hasło
  if (!client.passwordHash) {
    return res.status(403).json({
      success: false,
      message: 'Hasło nie zostało ustawione. Skontaktuj się z obsługą, aby skonfigurować konto.',
      requireSetup: true
    });
  }

  // Sprawdź hasło z bcrypt
  const isPasswordValid = await bcrypt.compare(password, client.passwordHash);
  
  if (!isPasswordValid) {
    // Zwiększ licznik nieudanych prób logowania
    if (!client.failedLoginAttempts) client.failedLoginAttempts = 0;
    client.failedLoginAttempts++;
    client.lastLoginAttempt = new Date().toISOString();

    // Zablokuj konto po 5 nieudanych próbach
    if (client.failedLoginAttempts >= 5) {
      client.isLocked = true;
      saveClients(clients);
      
      return res.status(403).json({
        success: false,
        message: '🔒 Konto zostało zablokowane z powodu zbyt wielu nieudanych prób logowania. Skontaktuj się z obsługą.',
        isLocked: true
      });
    }

    saveClients(clients);

    return res.status(401).json({
      success: false,
      message: `❌ Nieprawidłowe hasło. Pozostało prób: ${5 - client.failedLoginAttempts}.`,
      attemptsLeft: 5 - client.failedLoginAttempts
    });
  }

  // Sprawdź czy konto jest zablokowane
  if (client.isLocked) {
    return res.status(403).json({
      success: false,
      message: '🔒 Konto jest zablokowane. Skontaktuj się z obsługą, aby je odblokować.',
      isLocked: true
    });
  }

  // ✅ LOGOWANIE UDANE

  // Reset failed attempts
  client.failedLoginAttempts = 0;
  client.lastLogin = new Date().toISOString();
  client.lastLoginMethod = usedMethod;
  saveClients(clients);

  // Generuj token i utwórz sesję
  const token = generateToken();
  const sessions = readSessions();

  const session = {
    token,
    clientId: client.id,
    email: client.email,
    phone: client.phone,
    loginMethod: usedMethod,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isValid: true,
    rememberMe: rememberMe || false,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  sessions.push(session);
  saveSessions(sessions);

  // Przygotuj dane do zwrócenia (bez wrażliwych informacji)
  const clientData = {
    id: client.id,
    email: client.email,
    phone: client.phone,
    name: client.name,
    firstName: client.firstName || client.name.split(' ')[0],
    lastName: client.lastName || client.name.split(' ').slice(1).join(' '),
    address: client.address || null,
    loginMethod: usedMethod
  };

  console.log(`✅ Client ${client.id} logged in via ${usedMethod}`);

  return res.status(200).json({
    success: true,
    message: '✅ Zalogowano pomyślnie',
    token,
    client: clientData,
    loginMethod: usedMethod
  });
}

// ===========================
// LOGOUT
// ===========================
function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: 'Brak tokenu autoryzacji'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Sesja nie znaleziona'
    });
  }

  // Invalidate session
  session.isValid = false;
  session.loggedOutAt = new Date().toISOString();
  saveSessions(sessions);

  console.log(`✅ Client ${session.clientId} logged out`);

  return res.status(200).json({
    success: true,
    message: '✅ Wylogowano pomyślnie'
  });
}

// ===========================
// VALIDATE TOKEN
// ===========================
function handleValidateToken(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET.' 
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: 'Brak tokenu autoryzacji'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const session = validateSession(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy lub wygasły token',
      isValid: false
    });
  }

  // Update last activity
  const sessions = readSessions();
  const sessionIndex = sessions.findIndex(s => s.token === token);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].lastActivity = new Date().toISOString();
    saveSessions(sessions);
  }

  // Pobierz dane klienta
  const clients = readClients();
  const client = clients.find(c => c.id === session.clientId);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Klient nie znaleziony'
    });
  }

  return res.status(200).json({
    success: true,
    isValid: true,
    client: {
      id: client.id,
      email: client.email,
      phone: client.phone,
      name: client.name,
      firstName: client.firstName || client.name.split(' ')[0],
      lastName: client.lastName || client.name.split(' ').slice(1).join(' ')
    },
    session: {
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      loginMethod: session.loginMethod
    }
  });
}

// ===========================
// CHECK CREDENTIALS (bez logowania)
// ===========================
async function handleCheckCredentials(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { identifier, type } = req.body;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Email/telefon jest wymagany'
    });
  }

  const clients = readClients();
  let found = false;
  let method = null;

  // Sprawdź EMAIL
  if (type === 'email' || !type) {
    const client = clients.find(c => 
      c.email && c.email.toLowerCase() === identifier.toLowerCase()
    );
    if (client) {
      found = true;
      method = 'email';
    }
  }

  // Sprawdź TELEFON
  if (!found && (type === 'phone' || !type)) {
    const normalizedIdentifier = identifier.replace(/[\s-]/g, '');
    const client = clients.find(c => {
      if (!c.phone) return false;
      const normalizedPhone = c.phone.replace(/[\s-]/g, '');
      return normalizedPhone === normalizedIdentifier;
    });
    if (client) {
      found = true;
      method = 'phone';
    }
  }

  // Sprawdź NUMER ZAMÓWIENIA
  if (!found && (type === 'order' || !type)) {
    const orders = readOrders();
    const order = orders.find(o => o.id === identifier || o.orderNumber === identifier);
    if (order && order.clientId) {
      const client = clients.find(c => c.id === order.clientId);
      if (client) {
        found = true;
        method = 'order';
      }
    }
  }

  return res.status(200).json({
    success: true,
    found,
    method,
    message: found 
      ? `Konto znalezione. Możesz zalogować się przez ${method === 'email' ? 'email' : method === 'phone' ? 'telefon' : 'numer zamówienia'}.`
      : 'Nie znaleziono konta z tym identyfikatorem.'
  });
}
