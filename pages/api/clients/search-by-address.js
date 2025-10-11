import fs from 'fs';
import path from 'path';
import { optionalAuth } from '../../../middleware/auth';

/**
 * API endpoint: Search clients by address
 * POST /api/clients/search-by-address
 * 
 * 🔒 WYMAGANA AUTORYZACJA:
 * - Admin, logistyk, pracownik z uprawnieniem "view_clients"
 * - Publiczny dostęp ZABLOKOWANY (zabezpieczenie przed wyciekiem danych)
 * 
 * Wyszukuje klientów po adresie (ulica, kod pocztowy, miasto)
 * Używane przy dodawaniu nowego zgłoszenia - auto-wykrywanie istniejących klientów
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

// Helper: Normalize string for comparison (lowercase, trim, remove special chars)
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Helper: Calculate match score between two addresses
function calculateAddressMatchScore(address1, address2) {
  const norm1 = normalizeString(address1);
  const norm2 = normalizeString(address2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Partial match
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  let matchedWords = 0;
  words1.forEach(word1 => {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matchedWords++;
    }
  });
  
  return matchedWords / Math.max(words1.length, words2.length);
}

// Extract unique clients from orders
function extractClientsFromOrders(orders) {
  const clientsMap = new Map();
  
  if (!orders || !Array.isArray(orders)) return [];
  
  orders.forEach(order => {
    const clientId = order.clientId;
    if (!clientId) return;
    
    // Build full address for comparison
    const fullAddress = [
      order.street || order.address,
      order.postalCode,
      order.city
    ].filter(Boolean).join(', ');
    
    // Check if client already exists in map
    if (clientsMap.has(clientId)) {
      // Update order count and add this order to history
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
    } else {
      // Create new client entry
      clientsMap.set(clientId, {
        clientId: clientId,
        name: order.clientName,
        phone: order.clientPhone,
        email: order.email || order.clientEmail,
        address: fullAddress,
        street: order.street || order.address,
        postalCode: order.postalCode,
        city: order.city,
        orderCount: 1,
        lastOrderDate: order.createdAt || order.date,
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
  console.log('🔍 [search-by-address] Request received');
  
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
    console.warn('⚠️ [search-by-address] Unauthorized access attempt');
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Ta funkcja wymaga zalogowania. Dostępna tylko dla pracowników.'
    });
  }

  // Sprawdź role i uprawnienia
  const allowedRoles = ['admin', 'manager', 'employee', 'logistyk'];
  const hasPermission = 
    allowedRoles.includes(req.user.role) ||
    req.user.permissions?.includes('view_clients') ||
    req.user.permissions?.includes('*');

  if (!hasPermission) {
    console.warn(`⚠️ [search-by-address] Access denied for ${req.user.email} (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Brak uprawnień do wyszukiwania klientów.'
    });
  }

  console.log(`✅ [search-by-address] Authorized: ${req.user.email} (${req.user.role})`);
  
  const { street, city, postalCode } = req.body;
  
  // Validation
  if (!street && !city && !postalCode) {
    return res.status(400).json({
      success: false,
      error: 'At least one address field (street, city, postalCode) is required'
    });
  }
  
  console.log('📋 [search-by-address] Searching for:', { street, city, postalCode });
  
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
  console.log(`📊 [search-by-address] Found ${clients.length} unique clients`);
  
  // Build search address
  const searchAddress = [street, postalCode, city]
    .filter(Boolean)
    .join(', ');
  
  // Find matching clients
  const matches = [];
  
  clients.forEach(client => {
    let matchScore = 0;
    let matchReasons = [];
    
    // Match by full address
    if (searchAddress) {
      const addressScore = calculateAddressMatchScore(searchAddress, client.address);
      if (addressScore > 0.6) { // Threshold 60%
        matchScore = addressScore;
        matchReasons.push(`Address match: ${(addressScore * 100).toFixed(0)}%`);
      }
    }
    
    // Match by street only (if full address doesn't match well)
    if (street && matchScore < 0.9) {
      const streetScore = calculateAddressMatchScore(street, client.street);
      if (streetScore > 0.7) {
        matchScore = Math.max(matchScore, streetScore * 0.9); // Slightly lower weight
        matchReasons.push(`Street match: ${(streetScore * 100).toFixed(0)}%`);
      }
    }
    
    // Match by postal code + city
    if (postalCode && city && matchScore < 0.9) {
      const normalizedPostalCode = normalizeString(postalCode);
      const normalizedCity = normalizeString(city);
      const clientPostalCode = normalizeString(client.postalCode);
      const clientCity = normalizeString(client.city);
      
      if (normalizedPostalCode === clientPostalCode && normalizedCity === clientCity) {
        matchScore = Math.max(matchScore, 0.7);
        matchReasons.push('Postal code + city match');
      }
    }
    
    // If match found, add to results
    if (matchScore >= 0.6) {
      matches.push({
        ...client,
        matchScore,
        matchReason: matchReasons.join(', ')
      });
    }
  });
  
  // Sort by match score (best first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  console.log(`✅ [search-by-address] Found ${matches.length} matches`);
  
  return res.status(200).json({
    success: true,
    matches,
    totalMatches: matches.length,
    searchQuery: {
      street,
      city,
      postalCode
    }
  });
}
