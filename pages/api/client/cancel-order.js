// pages/api/client/cancel-order.js
// API do anulowania zamówienia przez klienta

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

export default async function handler(req, res) {
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

  const { orderId, reason } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Brak ID zamówienia'
    });
  }

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Podaj przyczynę anulowania (minimum 5 znaków)'
    });
  }

  try {
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Zamówienie nie znalezione'
      });
    }

    const order = orders[orderIndex];

    // Sprawdź czy zamówienie należy do klienta
    if (order.clientId !== session.clientId) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do anulowania tego zamówienia'
      });
    }

    // Sprawdź czy zamówienie można anulować
    if (!['pending', 'scheduled', 'zaplanowane'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Można anulować tylko zamówienia oczekujące lub zaplanowane'
      });
    }

    // Sprawdź czy już nie zostało anulowane
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'To zamówienie jest już anulowane'
      });
    }

    const oldStatus = order.status;
    
    // Anuluj zamówienie
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    order.cancelledBy = 'client';
    order.cancelledByClientId = session.clientId;
    order.cancellationReason = reason.trim();
    order.updatedAt = new Date().toISOString();

    // Dodaj do statusHistory
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date().toISOString(),
      changedBy: 'client',
      notes: `Anulowane przez klienta. Przyczyna: ${reason.trim()}`
    });

    // Dodaj do changeHistory
    if (!order.changeHistory) {
      order.changeHistory = [];
    }

    order.changeHistory.push({
      action: 'cancelled',
      changedAt: new Date().toISOString(),
      changedBy: 'client',
      clientId: session.clientId,
      changes: [
        {
          field: 'status',
          fieldName: 'Status',
          oldValue: oldStatus,
          newValue: 'cancelled'
        }
      ],
      note: `Anulowane przez klienta. Przyczyna: ${reason.trim()}`
    });

    orders[orderIndex] = order;
    const saved = saveOrders(orders);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas zapisywania zmian'
      });
    }

    console.log(`✅ Order ${orderId} cancelled by client ${session.clientId}. Reason: ${reason.trim()}`);

    return res.status(200).json({
      success: true,
      message: '✅ Zamówienie zostało anulowane',
      order: order
    });

  } catch (error) {
    console.error('❌ Error in /api/client/cancel-order:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
