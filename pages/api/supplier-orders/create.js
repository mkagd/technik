import fs from 'fs';
import path from 'path';

const supplierOrdersPath = path.join(process.cwd(), 'data', 'supplier-orders.json');
const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const suppliersPath = path.join(process.cwd(), 'data', 'suppliers.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() + 9000) + 1000);
  return `SO-${year}-${month}-${day}-${random}`;
}

function sendNotification(title, message, type, link, userId = null) {
  const notifications = readJSON(notificationsPath) || [];
  notifications.push({
    id: Date.now(),
    title,
    message,
    type,
    link,
    userId,
    read: false,
    createdAt: new Date().toISOString()
  });
  writeJSON(notificationsPath, notifications);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const {
    createdBy,          // ID logistyka
    supplierId,         // ID dostawcy
    partRequestIds,     // Array: IDs zamówień do konsolidacji
    deliveryMethod,     // 'consolidated', 'multi-address', 'express'
    consolidationInfo,  // { type, location, savings } jeśli consolidated
    priority,           // 'standard', 'express'
    notes
  } = req.body;
  
  // Walidacja
  if (!createdBy || !supplierId || !partRequestIds || !Array.isArray(partRequestIds) || partRequestIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak wymaganych pól: createdBy, supplierId, partRequestIds' 
    });
  }
  
  // Odczytaj dane
  const suppliers = readJSON(suppliersPath);
  const partRequests = readJSON(partRequestsPath);
  const partsInventory = readJSON(partsInventoryPath);
  
  if (!suppliers || !partRequests || !partsInventory) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać danych' 
    });
  }
  
  // Znajdź dostawcę
  const supplier = suppliers.find(s => s.supplierId === supplierId);
  if (!supplier) {
    return res.status(404).json({ 
      success: false, 
      error: 'Dostawca nie znaleziony' 
    });
  }
  
  // Znajdź zamówienia
  const requests = partRequests.filter(r => partRequestIds.includes(r.requestId));
  if (requests.length !== partRequestIds.length) {
    return res.status(404).json({ 
      success: false, 
      error: 'Niektóre zamówienia nie znalezione' 
    });
  }
  
  // Sprawdź czy wszystkie są approved
  const notApproved = requests.filter(r => r.status !== 'approved');
  if (notApproved.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: `Zamówienia nie są zatwierdzone: ${notApproved.map(r => r.requestId).join(', ')}` 
    });
  }
  
  // ============================================
  // PRZYGOTUJ POZYCJE ZAMÓWIENIA
  // ============================================
  const itemsMap = new Map(); // partId -> { part, assignTo[], totalQuantity }
  
  requests.forEach(request => {
    request.parts.forEach(partRequest => {
      const partId = partRequest.partId;
      
      if (!itemsMap.has(partId)) {
        const part = partsInventory.find(p => p.id === partId);
        if (!part) return; // Skip jeśli część nie znaleziona
        
        itemsMap.set(partId, {
          partId,
          partName: part.name,
          partNumber: part.partNumber,
          unitPrice: part.price,
          assignTo: [],
          totalQuantity: 0
        });
      }
      
      const item = itemsMap.get(partId);
      item.totalQuantity += partRequest.quantity;
      item.assignTo.push({
        requestId: request.requestId,
        employeeId: request.requestedFor,
        employeeName: request.requestedForName,
        quantity: partRequest.quantity
      });
    });
  });
  
  const items = Array.from(itemsMap.values());
  
  // ============================================
  // PRZYGOTUJ ADRESY DOSTAW
  // ============================================
  const deliveryAddresses = [];
  
  if (deliveryMethod === 'consolidated' && consolidationInfo) {
    // Jedna dostawa (konsolidacja)
    deliveryAddresses.push({
      type: consolidationInfo.type, // 'paczkomat', 'office', 'address'
      address: consolidationInfo.type === 'office' 
        ? 'Biuro firmy - ul. Testowa 123, Kraków' 
        : consolidationInfo.type === 'address'
        ? consolidationInfo.location
        : null,
      paczkomatId: consolidationInfo.type === 'paczkomat' ? consolidationInfo.location : null,
      employeeIds: requests.map(r => r.requestedFor),
      employeeNames: requests.map(r => r.requestedForName),
      trackingNumber: null,
      status: 'pending'
    });
  } else if (deliveryMethod === 'multi-address') {
    // Osobne dostawy dla każdego serwisanta
    const uniqueEmployees = new Map();
    
    requests.forEach(request => {
      if (!uniqueEmployees.has(request.requestedFor)) {
        uniqueEmployees.set(request.requestedFor, {
          type: request.finalDelivery,
          address: request.deliveryAddress || null,
          paczkomatId: request.paczkomatId || null,
          employeeIds: [request.requestedFor],
          employeeNames: [request.requestedForName],
          trackingNumber: null,
          status: 'pending'
        });
      }
    });
    
    deliveryAddresses.push(...uniqueEmployees.values());
  }
  
  // ============================================
  // OBLICZ KOSZTY
  // ============================================
  const subtotal = items.reduce((sum, item) => 
    sum + (item.unitPrice * item.totalQuantity), 0
  );
  
  // Koszt dostawy
  let shippingCost = 0;
  const freeShippingThreshold = supplier.freeShippingThreshold || 500;
  
  if (subtotal < freeShippingThreshold) {
    if (deliveryMethod === 'consolidated') {
      shippingCost = 15; // Jedna dostawa
    } else {
      shippingCost = deliveryAddresses.length * 15; // Wiele dostaw
    }
  }
  
  // Express charge
  const expressCharge = priority === 'express' ? 25 : 0;
  
  const total = subtotal + shippingCost + expressCharge;
  
  // Oszczędności (jeśli konsolidacja)
  const savings = consolidationInfo?.savings || 0;
  
  // ============================================
  // UTWÓRZ ZAMÓWIENIE U DOSTAWCY
  // ============================================
  const orderId = generateOrderId();
  
  const supplierOrder = {
    orderId,
    supplierId,
    supplierName: supplier.name,
    supplierContact: supplier.contactEmail,
    
    createdBy,
    createdAt: new Date().toISOString(),
    
    partRequestIds,
    requestsCount: requests.length,
    
    items,
    
    deliveryMethod,
    deliveryAddresses,
    consolidationInfo: consolidationInfo || null,
    
    pricing: {
      subtotal,
      shippingCost,
      expressCharge,
      total,
      savings
    },
    
    priority,
    
    status: 'pending', // pending, confirmed, shipped, delivered
    
    orderDate: new Date().toISOString(),
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    
    notes: notes || null,
    
    updatedAt: new Date().toISOString()
  };
  
  // Zapisz zamówienie u dostawcy
  const supplierOrders = readJSON(supplierOrdersPath) || [];
  supplierOrders.push(supplierOrder);
  
  if (!writeJSON(supplierOrdersPath, supplierOrders)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać zamówienia' 
    });
  }
  
  // ============================================
  // AKTUALIZUJ PART REQUESTS
  // ============================================
  const updatedPartRequests = partRequests.map(r => {
    if (partRequestIds.includes(r.requestId)) {
      return {
        ...r,
        status: 'ordered',
        supplierOrderId: orderId,
        consolidatedWith: partRequestIds.filter(id => id !== r.requestId),
        orderedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return r;
  });
  
  if (!writeJSON(partRequestsPath, updatedPartRequests)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zaktualizować zamówień' 
    });
  }
  
  // ============================================
  // NOTYFIKACJE
  // ============================================
  
  // Dla każdego serwisanta
  const uniqueEmployeeIds = [...new Set(requests.map(r => r.requestedFor))];
  
  uniqueEmployeeIds.forEach(employeeId => {
    const employeeName = requests.find(r => r.requestedFor === employeeId)?.requestedForName;
    
    const consolidationLabel = deliveryMethod === 'consolidated' 
      ? ` [Konsolidacja: -${savings}zł]` 
      : '';
    
    const expressLabel = priority === 'express' ? ' [EXPRESS]' : '';
    
    sendNotification(
      `📦 Zamówienie u dostawcy${expressLabel}`,
      `Twoje części zamówione u ${supplier.name}${consolidationLabel}. Zamówienie: ${orderId}`,
      'success',
      `/serwisant/zamowienia?orderId=${orderId}`,
      employeeId
    );
  });
  
  // Dla logistyka (podsumowanie)
  const consolidationSummary = deliveryMethod === 'consolidated'
    ? `Konsolidacja ${requests.length} zamówień → oszczędność ${savings}zł!`
    : `${requests.length} zamówień, ${deliveryAddresses.length} dostaw`;
  
  sendNotification(
    '✅ Zamówienie u dostawcy utworzone',
    `${orderId} u ${supplier.name}. ${consolidationSummary}. Wartość: ${total}zł`,
    'success',
    `/admin/logistyk/zamowienia-dostawcy?id=${orderId}`,
    null
  );
  
  return res.status(201).json({ 
    success: true, 
    order: supplierOrder,
    message: `Zamówienie ${orderId} utworzone. ${consolidationSummary}`
  });
}
