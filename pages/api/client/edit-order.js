// pages/api/client/edit-order.js
// API do edycji zamówienia przez klienta z historią zmian

import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use PUT.'
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

  const {
    orderId,
    deviceType,
    brand,
    model,
    serialNumber,
    issueDescription,
    priority,
    preferredDate,
    preferredTime,
    notes,
    photos,
    serviceAddress
  } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Brak ID zamówienia'
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
        message: 'Brak uprawnień do edycji tego zamówienia'
      });
    }

    // Sprawdź czy zamówienie można edytować (tylko pending)
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Można edytować tylko zamówienia oczekujące (status: pending)'
      });
    }

    // Zbierz zmiany do historii
    const changes = [];
    const oldOrder = { ...order };

    if (deviceType && deviceType !== order.deviceType) {
      changes.push({
        field: 'deviceType',
        fieldName: 'Typ urządzenia',
        oldValue: order.deviceType,
        newValue: deviceType
      });
      order.deviceType = deviceType;
    }

    if (brand && brand !== order.brand) {
      changes.push({
        field: 'brand',
        fieldName: 'Marka',
        oldValue: order.brand,
        newValue: brand
      });
      order.brand = brand;
    }

    if (model !== undefined && model !== order.model) {
      changes.push({
        field: 'model',
        fieldName: 'Model',
        oldValue: order.model || '(brak)',
        newValue: model || '(brak)'
      });
      order.model = model;
    }

    if (serialNumber !== undefined && serialNumber !== order.serialNumber) {
      changes.push({
        field: 'serialNumber',
        fieldName: 'Numer seryjny',
        oldValue: order.serialNumber || '(brak)',
        newValue: serialNumber || '(brak)'
      });
      order.serialNumber = serialNumber;
    }

    if (issueDescription && issueDescription !== order.issueDescription) {
      changes.push({
        field: 'issueDescription',
        fieldName: 'Opis problemu',
        oldValue: order.issueDescription,
        newValue: issueDescription
      });
      order.issueDescription = issueDescription;
    }

    if (priority && priority !== order.priority) {
      changes.push({
        field: 'priority',
        fieldName: 'Priorytet',
        oldValue: order.priority,
        newValue: priority
      });
      order.priority = priority;
    }

    if (preferredDate !== undefined && preferredDate !== order.preferredDate) {
      changes.push({
        field: 'preferredDate',
        fieldName: 'Preferowana data',
        oldValue: order.preferredDate || '(brak)',
        newValue: preferredDate || '(brak)'
      });
      order.preferredDate = preferredDate;
    }

    if (preferredTime !== undefined && preferredTime !== order.preferredTime) {
      changes.push({
        field: 'preferredTime',
        fieldName: 'Preferowana godzina',
        oldValue: order.preferredTime || '(brak)',
        newValue: preferredTime || '(brak)'
      });
      order.preferredTime = preferredTime;
    }

    if (notes !== undefined && notes !== order.notes) {
      changes.push({
        field: 'notes',
        fieldName: 'Uwagi',
        oldValue: order.notes || '(brak)',
        newValue: notes || '(brak)'
      });
      order.notes = notes;
    }

    if (photos !== undefined && JSON.stringify(photos) !== JSON.stringify(order.photos)) {
      changes.push({
        field: 'photos',
        fieldName: 'Zdjęcia',
        oldValue: `${order.photos?.length || 0} zdjęć`,
        newValue: `${photos.length} zdjęć`
      });
      order.photos = photos;
    }

    // Obsługa serviceAddress
    if (serviceAddress !== undefined) {
      const oldAddress = order.serviceAddress;
      let newAddress;
      
      if (serviceAddress === null) {
        // Użyj adresu klienta
        newAddress = order.clientAddress;
      } else {
        // Użyj custom address
        newAddress = `${serviceAddress.street} ${serviceAddress.buildingNumber}${serviceAddress.apartmentNumber ? '/' + serviceAddress.apartmentNumber : ''}, ${serviceAddress.postalCode} ${serviceAddress.city}`;
      }

      if (newAddress !== oldAddress) {
        changes.push({
          field: 'serviceAddress',
          fieldName: 'Adres naprawy',
          oldValue: oldAddress,
          newValue: newAddress
        });
        order.serviceAddress = newAddress;
      }
    }

    // Jeśli są zmiany, zapisz
    if (changes.length > 0) {
      order.updatedAt = new Date().toISOString();
      
      // Dodaj do historii
      if (!order.changeHistory) {
        order.changeHistory = [];
      }

      order.changeHistory.push({
        action: 'edited',
        changedAt: new Date().toISOString(),
        changedBy: 'client',
        clientId: session.clientId,
        changes: changes,
        note: 'Zamówienie edytowane przez klienta'
      });

      orders[orderIndex] = order;
      const saved = saveOrders(orders);

      if (!saved) {
        return res.status(500).json({
          success: false,
          message: 'Błąd podczas zapisywania zmian'
        });
      }

      console.log(`✅ Order ${orderId} edited by client ${session.clientId}. Changes: ${changes.length}`);

      return res.status(200).json({
        success: true,
        message: '✅ Zamówienie zostało zaktualizowane',
        order: order,
        changes: changes
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Brak zmian do zapisania',
        order: order
      });
    }

  } catch (error) {
    console.error('❌ Error in /api/client/edit-order:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
