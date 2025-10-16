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
import { areAddressesSimilar } from '../../../utils/addressNormalizer';

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

const saveOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving orders:', error);
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
  // Format: CLI2025XXXXXX gdzie XXXXXX to 6-cyfrowy numer sekwencyjny
  const lastClient = clients.length > 0 
    ? clients.sort((a, b) => {
        // Convert both IDs to strings to safely use localeCompare
        const idA = String(a.id || '');
        const idB = String(b.id || '');
        return idB.localeCompare(idA);
      })[0]
    : null;
  
  let newIdNumber = 1;
  if (lastClient && lastClient.id) {
    // Wyciągnij tylko ostatnie 6 cyfr (numer sekwencyjny)
    const idString = String(lastClient.id);
    const match = idString.match(/CLI2025(\d{6})/);
    if (match && match[1]) {
      const lastNumber = parseInt(match[1], 10);
      // Walidacja - upewnij się że nie jest NaN
      if (!isNaN(lastNumber) && lastNumber > 0) {
        newIdNumber = lastNumber + 1;
      } else {
        console.warn('⚠️ Invalid client ID number parsed:', match[1], '- defaulting to 1');
        newIdNumber = 1;
      }
    } else {
      console.warn('⚠️ Could not parse client ID from:', idString, '- defaulting to 1');
    }
  }
  
  const newId = `CLI2025${String(newIdNumber).padStart(6, '0')}`;
  console.log('🆔 Generated new client ID:', newId, '(previous:', lastClient?.id || 'none', ')');

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

  // 🔗 AUTOMATYCZNE LINKOWANIE ZLECEŃ
  // Znajdź zlecenia z tym samym telefonem i podobnym adresem
  let linkedOrdersCount = 0;
  const orders = readOrders();
  const normalizedPhoneForLinking = phone.replace(/\s+/g, '').replace(/^(\+48)?/, '+48');
  
  // Buduj pełny adres do porównania
  const fullAddress = `${address.street} ${address.buildingNumber}${address.apartmentNumber ? '/' + address.apartmentNumber : ''}, ${address.city}`;
  
  const updatedOrders = orders.map(order => {
    // Sprawdź czy zlecenie już ma clientId (pomiń)
    if (order.clientId) {
      return order;
    }
    
    // Normalizuj telefon ze zlecenia
    const orderPhone = order.phone?.replace(/\s+/g, '').replace(/^(\+48)?/, '+48');
    
    // Sprawdź czy telefony się zgadzają
    if (orderPhone === normalizedPhoneForLinking) {
      // Sprawdź czy adresy są podobne (90% threshold)
      if (areAddressesSimilar(fullAddress, order.address, 90)) {
        linkedOrdersCount++;
        console.log(`🔗 Linking order ${order.orderNumber} to client ${newClient.id}`);
        return {
          ...order,
          clientId: newClient.id,
          linkedAt: new Date().toISOString(),
          linkedBy: 'auto-registration'
        };
      }
    }
    
    return order;
  });
  
  // Zapisz zaktualizowane zlecenia jeśli coś zlinkowano
  if (linkedOrdersCount > 0) {
    saveOrders(updatedOrders);
    console.log(`✅ Successfully linked ${linkedOrdersCount} orders to client ${newClient.id}`);
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

  // ✅ NOWE: Wyślij email powitalny
  let emailSent = false;
  let emailError = null;

  if (process.env.RESEND_API_KEY && process.env.RESEND_EMAIL_FROM && newClient.email) {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Witaj w naszym serwisie!</h1>
            </div>
            <div class="content">
              <p>Cześć <strong>${newClient.firstName}</strong>!</p>
              
              <p>Dziękujemy za założenie konta w naszym serwisie AGD. Twoje konto zostało pomyślnie utworzone i jest już aktywne.</p>
              
              <div class="info-box">
                <h3>📋 Twoje dane logowania:</h3>
                <p><strong>Email:</strong> ${newClient.email}</p>
                <p><strong>Numer klienta:</strong> ${newClient.id}</p>
              </p>
              
              <div class="info-box">
                <h3>✨ Co możesz teraz zrobić?</h3>
                <ul>
                  <li>📱 Przeglądać swoje zlecenia i ich statusy</li>
                  <li>🛠️ Zgłaszać nowe naprawy online</li>
                  <li>📅 Sprawdzać historię wizyt serwisowych</li>
                  <li>💳 Przeglądać faktury i płatności</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://twoja-strona.pl'}/login" class="button">
                  Zaloguj się teraz
                </a>
              </div>
              
              <p style="margin-top: 30px;">W razie pytań lub problemów, skontaktuj się z nami:</p>
              <p>
                📞 Telefon: ${process.env.CONTACT_PHONE || '123-456-789'}<br>
                📧 Email: ${process.env.RESEND_EMAIL_FROM}<br>
              </p>
              
              <div class="footer">
                <p>Ten email został wysłany automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
                <p>&copy; ${new Date().getFullYear()} Twój Serwis AGD. Wszelkie prawa zastrzeżone.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_EMAIL_FROM,
          to: newClient.email,
          subject: '🎉 Witamy w naszym serwisie - Konto utworzone!',
          html: emailHtml
        })
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log('✅ Welcome email sent to:', newClient.email);
      } else {
        const errorData = await emailResponse.json();
        emailError = errorData.message || 'Nieznany błąd Resend API';
        console.error('❌ Failed to send welcome email:', emailError);
      }
    } catch (error) {
      emailError = error.message;
      console.error('❌ Error sending welcome email:', error);
    }
  } else {
    console.log('⚠️ Email service not configured - skipping welcome email');
  }

  return res.status(201).json({
    success: true,
    message: '✅ Konto zostało utworzone pomyślnie' + 
             (emailSent ? ' - email powitalny wysłany' : '') +
             (linkedOrdersCount > 0 ? ` - zlinkowano ${linkedOrdersCount} ${linkedOrdersCount === 1 ? 'zlecenie' : linkedOrdersCount < 5 ? 'zlecenia' : 'zleceń'}` : ''),
    client: clientData,
    token,
    emailSent,
    emailError,
    linkedOrdersCount,
    linkedOrders: linkedOrdersCount > 0
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
