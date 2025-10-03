import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
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

function findEmployee(employeeId) {
  const employees = readJSON(employeesPath);
  if (!employees) return null;
  return employees.find(emp => emp.id === employeeId);
}

function findPart(partId) {
  const parts = readJSON(partsInventoryPath);
  if (!parts) return null;
  return parts.find(p => p.id === partId);
}

export default function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const {
    employeeId,
    partId,
    adjustment,       // 'add', 'remove', 'set'
    quantity,         // Ile dodać/odjąć lub ustawić
    reason,           // Powód korekty (wymagany)
    adjustedBy,       // Kto wykonał korektę
    location,         // Opcjonalnie: zmień lokalizację
    notes
  } = req.body;
  
  // Walidacja
  if (!employeeId || !partId || !adjustment || quantity === undefined || !reason || !adjustedBy) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak wymaganych pól: employeeId, partId, adjustment, quantity, reason, adjustedBy' 
    });
  }
  
  if (!['add', 'remove', 'set'].includes(adjustment)) {
    return res.status(400).json({ 
      success: false, 
      error: 'adjustment musi być: add, remove lub set' 
    });
  }
  
  // Sprawdź pracowników i część
  const employee = findEmployee(employeeId);
  const adjuster = findEmployee(adjustedBy);
  const part = findPart(partId);
  
  if (!employee || !adjuster || !part) {
    return res.status(400).json({ 
      success: false, 
      error: 'Pracownik lub część nie znaleziona' 
    });
  }
  
  // Odczytaj magazyny
  let inventories = readJSON(personalInventoriesPath);
  if (!inventories) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać magazynów' 
    });
  }
  
  // Znajdź magazyn pracownika
  const inventoryIndex = inventories.findIndex(inv => inv.employeeId === employeeId);
  if (inventoryIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Magazyn pracownika nie znaleziony' 
    });
  }
  
  const inventory = inventories[inventoryIndex];
  
  // Znajdź część w magazynie
  const partIndex = inventory.parts.findIndex(p => p.partId === partId);
  
  let oldQuantity = 0;
  let newQuantity = 0;
  
  if (partIndex === -1) {
    // Część nie istnieje w magazynie
    if (adjustment === 'remove') {
      return res.status(400).json({ 
        success: false, 
        error: 'Nie można odjąć części której nie ma w magazynie' 
      });
    }
    
    // Dodaj nową część
    newQuantity = adjustment === 'set' ? quantity : quantity;
    oldQuantity = 0;
    
    inventory.parts.push({
      partId,
      quantity: newQuantity,
      location: location || 'Schowek główny',
      status: 'available',
      assignedBy: adjustedBy,
      assignedDate: new Date().toISOString(),
      lastAdjusted: new Date().toISOString(),
      adjustmentHistory: [{
        date: new Date().toISOString(),
        adjustedBy,
        adjustment,
        oldQuantity,
        newQuantity,
        reason,
        notes
      }]
    });
    
  } else {
    // Część istnieje - aktualizuj
    const inventoryPart = inventory.parts[partIndex];
    oldQuantity = inventoryPart.quantity;
    
    switch (adjustment) {
      case 'add':
        newQuantity = oldQuantity + quantity;
        break;
      case 'remove':
        newQuantity = Math.max(0, oldQuantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
    }
    
    inventoryPart.quantity = newQuantity;
    inventoryPart.lastAdjusted = new Date().toISOString();
    
    if (location) {
      inventoryPart.location = location;
    }
    
    // Historia korekt
    if (!inventoryPart.adjustmentHistory) {
      inventoryPart.adjustmentHistory = [];
    }
    
    inventoryPart.adjustmentHistory.push({
      date: new Date().toISOString(),
      adjustedBy,
      adjustment,
      oldQuantity,
      newQuantity,
      reason,
      notes
    });
    
    // Usuń część jeśli ilość = 0
    if (newQuantity === 0) {
      inventory.parts.splice(partIndex, 1);
    }
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
  
  // Zapisz
  inventories[inventoryIndex] = inventory;
  if (!writeJSON(personalInventoriesPath, inventories)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać magazynu' 
    });
  }
  
  // Notyfikacja
  const changeLabel = adjustment === 'add' 
    ? `+${quantity}` 
    : adjustment === 'remove' 
    ? `-${quantity}` 
    : `→ ${quantity}`;
  
  sendNotification(
    '🔧 Korekta magazynu',
    `${adjuster.name} zmienił stan: ${part.name} ${changeLabel} szt. Powód: ${reason}`,
    'info',
    `/serwisant/magazyn`,
    employeeId
  );
  
  // Alert jeśli nowy stan = 0
  if (newQuantity === 0 && oldQuantity > 0) {
    sendNotification(
      '⚠️ Low stock alert!',
      `Po korekcie: ${part.name} w magazynie ${employee.name} = 0. Powód: ${reason}`,
      'warning',
      `/admin/logistyk/magazyny?employeeId=${employeeId}`,
      null
    );
  }
  
  return res.status(200).json({ 
    success: true, 
    inventory,
    adjustment: {
      partName: part.name,
      oldQuantity,
      newQuantity,
      change: newQuantity - oldQuantity,
      reason
    },
    message: `Korekta wykonana: ${part.name} ${oldQuantity} → ${newQuantity} szt`
  });
}
