// pages/api/client/orders.js
// API dla zamówień klienta

import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'client-sessions.json');

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading orders.json:', error);
    return [];
  }
};

const readClients = () => {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading clients.json:', error);
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

const validateSession = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  // Sprawdź czy token nie wygasł (30 dni)
  const expirationTime = 30 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return session;
};

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }

  // Sprawdź autoryzację
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Brak tokenu autoryzacji'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const session = validateSession(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy lub wygasły token'
    });
  }

  const { orderId } = req.query;

  try {
    const orders = readOrders();
    const clients = readClients();

    // Znajdź klienta
    const client = clients.find(c => c.id === session.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Klient nie znaleziony'
      });
    }

    // Jeśli podano orderId, zwróć pojedyncze zamówienie
    if (orderId) {
      const order = orders.find(o => o.id === orderId && o.clientId === client.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Zamówienie nie znalezione lub nie należy do tego klienta'
        });
      }

      return res.status(200).json({
        success: true,
        order
      });
    }

    // Zwróć wszystkie zamówienia klienta
    const clientOrders = orders.filter(o => o.clientId === client.id);

    // Sortuj po dacie (najnowsze pierwsze)
    clientOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      orders: clientOrders,
      count: clientOrders.length
    });

  } catch (error) {
    console.error('❌ Error in /api/client/orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
