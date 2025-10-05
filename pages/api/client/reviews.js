// pages/api/client/reviews.js
// API dla ocen i opinii klientów

import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
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

const saveOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving orders.json:', error);
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

const validateSession = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
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

  const { orderId, rating, comment } = req.body;

  // Walidacja
  if (!orderId || !rating) {
    return res.status(400).json({
      success: false,
      message: 'ID zamówienia i ocena są wymagane'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Ocena musi być w zakresie 1-5'
    });
  }

  try {
    const orders = readOrders();

    // Znajdź zamówienie
    const orderIndex = orders.findIndex(o => 
      o.id === orderId && o.clientId === session.clientId
    );

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Zamówienie nie znalezione lub nie należy do tego klienta'
      });
    }

    const order = orders[orderIndex];

    // Sprawdź czy zamówienie jest zakończone
    if (order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Można wystawić ocenę tylko dla zakończonych zamówień'
      });
    }

    // Sprawdź czy ocena już istnieje
    if (order.review) {
      return res.status(400).json({
        success: false,
        message: 'Ocena dla tego zamówienia została już wystawiona'
      });
    }

    // Dodaj ocenę
    orders[orderIndex].review = {
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    // Zapisz
    const saved = saveOrders(orders);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas zapisywania oceny'
      });
    }

    console.log('✅ Review added for order:', orderId, `Rating: ${rating}/5`);

    return res.status(200).json({
      success: true,
      message: '✅ Ocena została dodana pomyślnie',
      review: orders[orderIndex].review
    });

  } catch (error) {
    console.error('❌ Error in /api/client/reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
