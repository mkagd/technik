import fs from 'fs';
import path from 'path';

const supplierOrdersPath = path.join(process.cwd(), 'data', 'supplier-orders.json');
const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
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

function sendNotification(title, message, type, link, userId = null) {
  const notifications = readJSON(notificationsPath) || [];
  notifications.push({
    id: Date.now() + Math.random(), // Unikatowy ID
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

function findPart(partId) {
  const parts = readJSON(partsInventoryPath);
  if (!parts) return null;
  return parts.find(p => p.id === partId);
}

// Auto-assign części do magazynów osobistych po dostawie
function autoAssignToInventories(order, updatedBy) {
  const inventories = readJSON(personalInventoriesPath) || [];
  
  order.items.forEach(item => {
    const part = findPart(item.partId);
    if (!part) return;
    
    item.assignTo.forEach(assignment => {
      // Znajdź magazyn pracownika
      let inventoryIndex = inventories.findIndex(inv => 
        inv.employeeId === assignment.employeeId
      );
      
      // Jeśli nie ma magazynu → utwórz
      if (inventoryIndex === -1) {
        inventories.push({
          inventoryId: `PI-${Date.now()}-${assignment.employeeId}`,
          employeeId: assignment.employeeId,
          employeeName: assignment.employeeName,
          vehicle: 'Do uzupełnienia',
          parts: [],
          statistics: {
            totalParts: 0,
            totalValue: 0,
            lastUpdated: new Date().toISOString()
          }
        });
        inventoryIndex = inventories.length - 1;
      }
      
      const inventory = inventories[inventoryIndex];
      
      // Sprawdź czy część już jest
      const existingPartIndex = inventory.parts.findIndex(p => p.partId === item.partId);
      
      if (existingPartIndex !== -1) {
        // Zwiększ ilość
        inventory.parts[existingPartIndex].quantity += assignment.quantity;
        inventory.parts[existingPartIndex].lastRestocked = new Date().toISOString();
        inventory.parts[existingPartIndex].restockedBy = updatedBy;
      } else {
        // Dodaj nową część
        inventory.parts.push({
          partId: item.partId,
          quantity: assignment.quantity,
          location: 'Schowek główny',
          status: 'available',
          assignedBy: updatedBy,
          assignedDate: new Date().toISOString(),
          lastRestocked: new Date().toISOString(),
          restockedBy: updatedBy,
          supplierOrderId: order.orderId,
          notes: `Auto-przypisane z zamówienia ${order.orderId}`
        });
      }
      
      // Przelicz statystyki
      const totalParts = inventory.parts.reduce((sum, p) => sum + p.quantity, 0);
      const totalValue = inventory.parts.reduce((sum, p) => {
        const partDetails = findPart(p.partId);
        return sum + (partDetails?.price || 0) * p.quantity;
      }, 0);
      
      inventory.statistics = {
        totalParts,
        totalValue,
        lastUpdated: new Date().toISOString()
      };
      
      inventories[inventoryIndex] = inventory;
    });
  });
  
  // Zapisz zaktualizowane magazyny
  writeJSON(personalInventoriesPath, inventories);
  
  return inventories;
}

export default function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const { orderId } = req.query;
  const {
    status,             // 'confirmed', 'shipped', 'delivered'
    updatedBy,          // ID logistyka
    trackingNumbers,    // Array dla multi-delivery lub string dla single
    deliveryNotes,
    autoAssign          // true = automatycznie przypisz do magazynów (tylko dla delivered)
  } = req.body;
  
  // Walidacja
  if (!orderId || !status || !updatedBy) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak orderId, status lub updatedBy' 
    });
  }
  
  if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Status musi być: confirmed, shipped lub delivered' 
    });
  }
  
  // Odczytaj zamówienia
  const supplierOrders = readJSON(supplierOrdersPath);
  if (!supplierOrders) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać zamówień' 
    });
  }
  
  // Znajdź zamówienie
  const orderIndex = supplierOrders.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Zamówienie nie znalezione' 
    });
  }
  
  const order = supplierOrders[orderIndex];
  
  // Aktualizuj status
  const updates = {
    status,
    updatedAt: new Date().toISOString(),
    updatedBy
  };
  
  switch (status) {
    case 'confirmed':
      updates.confirmedAt = new Date().toISOString();
      break;
      
    case 'shipped':
      updates.shippedAt = new Date().toISOString();
      
      // Tracking numbers
      if (trackingNumbers) {
        if (Array.isArray(trackingNumbers)) {
          // Multi-delivery - przypisz tracking do każdego adresu
          order.deliveryAddresses.forEach((addr, index) => {
            if (trackingNumbers[index]) {
              addr.trackingNumber = trackingNumbers[index];
              addr.status = 'shipped';
            }
          });
        } else {
          // Single tracking dla wszystkich
          order.deliveryAddresses.forEach(addr => {
            addr.trackingNumber = trackingNumbers;
            addr.status = 'shipped';
          });
        }
      }
      break;
      
    case 'delivered':
      updates.deliveredAt = new Date().toISOString();
      
      // Zaktualizuj wszystkie adresy
      order.deliveryAddresses.forEach(addr => {
        addr.status = 'delivered';
      });
      
      if (deliveryNotes) {
        updates.deliveryNotes = deliveryNotes;
      }
      break;
  }
  
  // Zapisz zamówienie
  supplierOrders[orderIndex] = {
    ...order,
    ...updates
  };
  
  if (!writeJSON(supplierOrdersPath, supplierOrders)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać zamówienia' 
    });
  }
  
  // ============================================
  // AUTO-ASSIGN DO MAGAZYNÓW (jeśli delivered)
  // ============================================
  let assignedInventories = null;
  
  if (status === 'delivered' && autoAssign !== false) {
    assignedInventories = autoAssignToInventories(supplierOrders[orderIndex], updatedBy);
    
    // Aktualizuj part requests → delivered
    const partRequests = readJSON(partRequestsPath);
    if (partRequests) {
      const updatedRequests = partRequests.map(r => {
        if (order.partRequestIds.includes(r.requestId)) {
          return {
            ...r,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      writeJSON(partRequestsPath, updatedRequests);
    }
  }
  
  // ============================================
  // NOTYFIKACJE
  // ============================================
  
  // Dla każdego serwisanta
  const uniqueEmployeeIds = [];
  order.deliveryAddresses.forEach(addr => {
    addr.employeeIds.forEach(id => {
      if (!uniqueEmployeeIds.includes(id)) {
        uniqueEmployeeIds.push(id);
      }
    });
  });
  
  switch (status) {
    case 'confirmed':
      uniqueEmployeeIds.forEach(employeeId => {
        sendNotification(
          '✅ Zamówienie potwierdzone',
          `${order.supplierName} potwierdził zamówienie ${orderId}`,
          'success',
          `/serwisant/zamowienia?orderId=${orderId}`,
          employeeId
        );
      });
      break;
      
    case 'shipped':
      uniqueEmployeeIds.forEach(employeeId => {
        const tracking = Array.isArray(trackingNumbers) 
          ? trackingNumbers[0] 
          : trackingNumbers;
        
        sendNotification(
          '📦 Zamówienie wysłane!',
          `Twoje części w drodze! Zamówienie: ${orderId}${tracking ? `. Tracking: ${tracking}` : ''}`,
          'info',
          `/serwisant/zamowienia?orderId=${orderId}`,
          employeeId
        );
      });
      break;
      
    case 'delivered':
      uniqueEmployeeIds.forEach(employeeId => {
        const autoAssignLabel = autoAssign !== false 
          ? '. Części automatycznie dodane do magazynu!' 
          : '';
        
        sendNotification(
          '🎉 Części dostarczone!',
          `Zamówienie ${orderId} dostarczone${autoAssignLabel}`,
          'success',
          `/serwisant/magazyn`,
          employeeId
        );
      });
      
      // Notyfikacja dla logistyka
      sendNotification(
        '✅ Dostawa zakończona',
        `Zamówienie ${orderId} dostarczone. ${uniqueEmployeeIds.length} serwisant(ów) otrzymało części.`,
        'success',
        `/admin/logistyk/zamowienia-dostawcy?id=${orderId}`,
        null
      );
      break;
  }
  
  return res.status(200).json({ 
    success: true, 
    order: supplierOrders[orderIndex],
    autoAssigned: status === 'delivered' && autoAssign !== false,
    assignedInventories: assignedInventories ? assignedInventories.length : 0,
    message: `Zamówienie ${orderId} → ${status}`
  });
}
