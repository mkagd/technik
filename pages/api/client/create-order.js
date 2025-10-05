// pages/api/client/create-order.js
// API dla tworzenia nowego zamówienia przez klienta

import fs from 'fs';
import path from 'path';
import { normalizeObject } from '../../../utils/fieldMapping';

// Zwiększenie limitu body dla uploadu zdjęć
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

const saveOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving orders.json:', error);
    return false;
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
  
  const expirationTime = 30 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return session;
};

export default async function handler(req, res) {
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

  const {
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
    serviceAddress // Nowy parametr: adres naprawy (jeśli inny niż klienta)
  } = req.body;

  // Walidacja
  if (!deviceType || !brand || !issueDescription) {
    return res.status(400).json({
      success: false,
      message: 'Typ urządzenia, marka i opis problemu są wymagane'
    });
  }

  if (issueDescription.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Opis problemu powinien mieć minimum 10 znaków'
    });
  }

  // Walidacja custom address jeśli podany
  if (serviceAddress) {
    if (!serviceAddress.street || !serviceAddress.buildingNumber || !serviceAddress.city || !serviceAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Niepełny adres naprawy. Wymagane: ulica, numer budynku, miasto, kod pocztowy'
      });
    }
    if (!/^\d{2}-\d{3}$/.test(serviceAddress.postalCode)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy format kodu pocztowego (wymagany: XX-XXX)'
      });
    }
  }

  // Walidacja preferowanej daty (maksymalnie 30 dni w przód)
  if (preferredDate) {
    const selectedDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Preferowana data nie może być wcześniejsza niż dzisiaj'
      });
    }
    
    if (selectedDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Preferowana data nie może być późniejsza niż 30 dni od dziś'
      });
    }
  }

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

    // Generuj ID dla nowego zamówienia
    // Format: ORD2025XXXXXX gdzie XXXXXX to 6-cyfrowy numer sekwencyjny
    const lastOrder = orders.length > 0 
      ? orders.sort((a, b) => b.id.localeCompare(a.id))[0]
      : null;
    
    let newIdNumber = 1;
    if (lastOrder && lastOrder.id) {
      // Wyciągnij tylko ostatnie 6 cyfr (numer sekwencyjny)
      const match = lastOrder.id.match(/ORD2025(\d{6})/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        newIdNumber = lastNumber + 1;
      }
    }
    
    const newId = `ORD2025${String(newIdNumber).padStart(6, '0')}`;

    // Przygotuj adres naprawy (custom lub klienta)
    let repairAddress;
    if (serviceAddress) {
      // Użyj custom address
      repairAddress = `${serviceAddress.street} ${serviceAddress.buildingNumber}${serviceAddress.apartmentNumber ? '/' + serviceAddress.apartmentNumber : ''}, ${serviceAddress.postalCode} ${serviceAddress.city}`;
    } else {
      // Użyj adresu klienta
      repairAddress = `${client.address.street} ${client.address.buildingNumber}${client.address.apartmentNumber ? '/' + client.address.apartmentNumber : ''}, ${client.address.postalCode} ${client.address.city}`;
    }

    // Utwórz nowe zamówienie
    const newOrder = {
      id: newId,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || client.mobile,
      clientAddress: `${client.address.street} ${client.address.buildingNumber}${client.address.apartmentNumber ? '/' + client.address.apartmentNumber : ''}, ${client.address.postalCode} ${client.address.city}`, // Adres klienta z konta
      serviceAddress: repairAddress, // Adres naprawy (może być inny)
      
      deviceType,
      brand,
      model: model || '',
      serialNumber: serialNumber || '',
      issueDescription,
      
      status: 'pending',
      priority: priority || 'normal',
      
      technicianId: null,
      technicianName: null,
      
      estimatedCost: null,
      finalCost: null,
      
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      notes: notes || '',
      
      photos: photos || [],
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledDate: null,
      completedAt: null,
      
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date().toISOString(),
          notes: 'Zamówienie utworzone przez klienta'
        }
      ]
    };

    // Normalizuj obiekt przed zapisem (usuwa stare pola, standaryzuje statusy)
    const normalizedOrder = normalizeObject(newOrder);

    // Dodaj zamówienie
    orders.push(normalizedOrder);
    const saved = saveOrders(orders);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas zapisywania zamówienia'
      });
    }

    console.log('✅ New order created by client:', newOrder.id, client.email);

    return res.status(201).json({
      success: true,
      message: '✅ Zgłoszenie zostało utworzone pomyślnie',
      order: newOrder
    });

  } catch (error) {
    console.error('❌ Error in /api/client/create-order:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
