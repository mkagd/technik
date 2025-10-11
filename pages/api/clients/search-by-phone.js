import fs from 'fs';
import path from 'path';
import { optionalAuth } from '../../../middleware/auth';

/**
 * API endpoint: Search clients by phone number
 * POST /api/clients/search-by-phone
 * 
 * 🔒 WYMAGANA AUTORYZACJA:
 * - Admin, logistyk, pracownik z uprawnieniem "view_clients"
 * - Publiczny dostęp ZABLOKOWANY (RODO - ochrona danych osobowych)
 * 
 * Wyszukuje klientów po numerze telefonu
 * Przygotowanie pod integrację z Google Contacts w przyszłości
 */

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');

// Helper: Read JSON file
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper: Normalize phone number (remove spaces, dashes, parentheses, etc.)
function normalizePhone(phone) {
  if (!phone) return '';
  return phone
    .replace(/\s+/g, '')       // Remove spaces
    .replace(/-/g, '')          // Remove dashes
    .replace(/\(/g, '')         // Remove (
    .replace(/\)/g, '')         // Remove )
    .replace(/\+/g, '')         // Remove +
    .replace(/^48/, '');        // Remove Poland prefix
}

// Extract unique clients from orders
function extractClientsFromOrders(orders) {
  const clientsMap = new Map();
  
  if (!orders || !Array.isArray(orders)) return [];
  
  orders.forEach(order => {
    const clientId = order.clientId;
    const phone = order.clientPhone;
    
    if (!clientId || !phone) return;
    
    // Build full address
    const fullAddress = [
      order.street || order.address,
      order.postalCode,
      order.city
    ].filter(Boolean).join(', ');
    
    // Check if client already exists in map
    if (clientsMap.has(clientId)) {
      const existingClient = clientsMap.get(clientId);
      existingClient.orderCount++;
      existingClient.orders.push({
        orderNumber: order.orderNumber || order.id,
        orderId: order.id,
        date: order.createdAt || order.date,
        deviceType: order.deviceType || order.category,
        deviceBrand: order.brand,
        status: order.status,
        problem: order.problem
      });
      
      // Update last order date
      const orderDate = new Date(order.createdAt || order.date);
      const lastOrderDate = new Date(existingClient.lastOrderDate);
      if (orderDate > lastOrderDate) {
        existingClient.lastOrderDate = order.createdAt || order.date;
      }
      
      // Collect alternative phone numbers
      const normalizedPhone = normalizePhone(phone);
      const existingNormalized = normalizePhone(existingClient.phone);
      if (normalizedPhone !== existingNormalized && !existingClient.alternativePhones.includes(phone)) {
        existingClient.alternativePhones.push(phone);
      }
    } else {
      // Create new client entry
      clientsMap.set(clientId, {
        clientId: clientId,
        name: order.clientName,
        phone: phone,
        email: order.email || order.clientEmail,
        address: fullAddress,
        street: order.street || order.address,
        postalCode: order.postalCode,
        city: order.city,
        orderCount: 1,
        lastOrderDate: order.createdAt || order.date,
        alternativePhones: [], // Will be filled if client has multiple phones
        orders: [{
          orderNumber: order.orderNumber || order.id,
          orderId: order.id,
          date: order.createdAt || order.date,
          deviceType: order.deviceType || order.category,
          deviceBrand: order.brand,
          status: order.status,
          problem: order.problem
        }]
      });
    }
  });
  
  return Array.from(clientsMap.values());
}

export default async function handler(req, res) {
  console.log('📞 [search-by-phone] Request received');
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // 🔒 AUTORYZACJA: Sprawdź czy użytkownik jest zalogowany
  await new Promise((resolve, reject) => {
    optionalAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Sprawdź czy użytkownik ma uprawnienia
  if (!req.user) {
    console.warn('⚠️ [search-by-phone] Unauthorized access attempt');
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Ta funkcja wymaga zalogowania. Dostępna tylko dla pracowników.'
    });
  }

  // Sprawdź role i uprawnienia (RODO - ochrona danych osobowych)
  const allowedRoles = ['admin', 'manager', 'employee', 'logistyk'];
  const hasPermission = 
    allowedRoles.includes(req.user.role) ||
    req.user.permissions?.includes('view_clients') ||
    req.user.permissions?.includes('*');

  if (!hasPermission) {
    console.warn(`⚠️ [search-by-phone] Access denied for ${req.user.email} (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Brak uprawnień do wyszukiwania klientów.'
    });
  }

  console.log(`✅ [search-by-phone] Authorized: ${req.user.email} (${req.user.role})`);
  
  const { phone } = req.body;
  
  // Validation
  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required'
    });
  }
  
  console.log('📋 [search-by-phone] Searching for:', phone);
  
  // Read orders
  const orders = readJSON(ordersPath);
  if (!orders) {
    return res.status(500).json({
      success: false,
      error: 'Failed to read orders data'
    });
  }
  
  // Extract unique clients
  const clients = extractClientsFromOrders(orders);
  console.log(`📊 [search-by-phone] Found ${clients.length} unique clients`);
  
  // Normalize search phone
  const searchPhoneNormalized = normalizePhone(phone);
  console.log('🔍 [search-by-phone] Normalized search:', searchPhoneNormalized);
  
  // Find matching clients
  const matches = [];
  
  clients.forEach(client => {
    // Normalize client's primary phone
    const clientPhoneNormalized = normalizePhone(client.phone);
    
    // Check primary phone
    if (clientPhoneNormalized === searchPhoneNormalized) {
      matches.push({
        ...client,
        matchScore: 1.0,
        matchReason: 'Primary phone exact match',
        matchedPhone: client.phone
      });
      return;
    }
    
    // Check alternative phones
    for (const altPhone of client.alternativePhones) {
      const altPhoneNormalized = normalizePhone(altPhone);
      if (altPhoneNormalized === searchPhoneNormalized) {
        matches.push({
          ...client,
          matchScore: 0.95,
          matchReason: 'Alternative phone match',
          matchedPhone: altPhone
        });
        return;
      }
    }
    
    // Fuzzy match (last 9 digits) - for cases with/without country code
    if (searchPhoneNormalized.length >= 9) {
      const searchLast9 = searchPhoneNormalized.slice(-9);
      const clientLast9 = clientPhoneNormalized.slice(-9);
      
      if (searchLast9 === clientLast9) {
        matches.push({
          ...client,
          matchScore: 0.9,
          matchReason: 'Phone fuzzy match (last 9 digits)',
          matchedPhone: client.phone
        });
      }
    }
  });
  
  // Sort by match score (best first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  console.log(`✅ [search-by-phone] Found ${matches.length} matches`);
  
  return res.status(200).json({
    success: true,
    matches,
    totalMatches: matches.length,
    searchQuery: {
      phone,
      normalized: searchPhoneNormalized
    }
  });
}
