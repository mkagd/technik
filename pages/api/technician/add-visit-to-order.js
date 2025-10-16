// pages/api/technician/add-visit-to-order.js
// API endpoint to add a new visit to an existing order (by technician)

import fs from 'fs';
import path from 'path';
import { logger } from '../../../utils/logger';

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const technicianSessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');
const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Multi-auth token validation
function validateToken(token) {
  if (!token) return null;

  const techSessions = readJSON(technicianSessionsPath);
  if (techSessions) {
    const session = techSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  const empSessions = readJSON(employeeSessionsPath);
  if (empSessions) {
    const session = empSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  return null;
}

// Generate unique visit ID
function generateVisitId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `VIS${year}${month}${day}${random}`;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  logger.debug('📅 POST /api/technician/add-visit-to-order - Dodawanie wizyty');

  try {
    // Validate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authenticatedEmployeeId = validateToken(token);

    if (!authenticatedEmployeeId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Brak autoryzacji - zaloguj się ponownie' 
      });
    }

    const { orderId, visitType, scheduledDate, description } = req.body;

    // Validate required fields (scheduledDate is now optional)
    if (!orderId || !visitType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych danych: orderId, visitType' 
      });
    }

    logger.debug(`📦 Dodawanie wizyty: orderId=${orderId}, type=${visitType}, date=${scheduledDate || 'DO USTALENIA'}`);

    // Read orders
    const orders = readJSON(ordersPath);
    if (!orders) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać zleceń' 
      });
    }

    // Find order by orderNumber (primary) or id (fallback)
    const orderIndex = orders.findIndex(o => o.orderNumber === orderId || o.id === orderId);
    if (orderIndex === -1) {
      logger.error(`❌ Nie znaleziono zlecenia: ${orderId}`);
      return res.status(404).json({ 
        success: false, 
        error: `Nie znaleziono zlecenia o ID: ${orderId}` 
      });
    }

    const order = orders[orderIndex];

    // Generate new visit ID
    const newVisitId = generateVisitId();

    // Create new visit object
    const newVisit = {
      visitId: newVisitId,
      orderId: order.orderNumber || order.id, // ✅ Add orderId reference
      type: visitType,
      status: scheduledDate ? 'scheduled' : 'unscheduled', // ✅ "unscheduled" if no date
      scheduledDate: scheduledDate || null, // ✅ null if empty
      description: description || '',
      technicianId: authenticatedEmployeeId,
      assignedTo: authenticatedEmployeeId, // ✅ Also set assignedTo
      createdAt: new Date().toISOString(),
      createdBy: authenticatedEmployeeId,
      // Inherit basic info from order
      client: order.client,
      device: order.device,
      devices: order.devices || (order.device ? [order.device] : []),
      photos: [],
      notes: [],
      workSessions: [],
      statusHistory: [{
        status: 'scheduled',
        timestamp: new Date().toISOString(),
        changedBy: authenticatedEmployeeId,
        reason: 'Wizyta utworzona przez serwisanta'
      }]
    };

    // Add visit to order
    if (!order.visits) {
      order.visits = [];
    }
    order.visits.push(newVisit);

    // Update order status if needed
    if (order.status === 'completed') {
      order.status = 'in_progress'; // Reopen if was completed
    }

    order.lastUpdated = new Date().toISOString();

    // Save changes
    orders[orderIndex] = order;

    if (!writeJSON(ordersPath, orders)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać zlecenia' 
      });
    }

    logger.success(`✅ Dodano wizytę ${newVisitId} do zlecenia ${order.orderNumber || order.id}`);

    return res.status(201).json({ 
      success: true, 
      message: 'Wizyta została dodana do zlecenia',
      visitId: newVisitId,
      visit: newVisit,
      order: {
        orderId: order.orderNumber || order.id,
        orderNumber: order.orderNumber,
        visitsCount: order.visits.length
      }
    });

  } catch (error) {
    logger.error('💥 Error in add-visit-to-order handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Błąd serwera: ' + error.message 
    });
  }
}
