import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
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

function generateUsageId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `PU-${year}-${month}-${day}-${random}`;
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const {
    employeeId,
    orderId,          // ID zlecenia serwisowego
    parts,            // Array: [{ partId, quantity, installationNotes }]
    addToInvoice,     // Czy dodać do faktury (default: true)
    invoiceId,        // Opcjonalnie: ID faktury
    customerInfo,     // Opcjonalnie: dane klienta
    warranty          // Opcjonalnie: okres gwarancji (miesiące)
  } = req.body;
  
  // Walidacja
  if (!employeeId || !orderId || !parts || !Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak wymaganych pól: employeeId, orderId, parts' 
    });
  }
  
  // Sprawdź pracownika
  const employee = findEmployee(employeeId);
  if (!employee) {
    return res.status(400).json({ 
      success: false, 
      error: 'Pracownik nie znaleziony' 
    });
  }
  
  // Odczytaj magazyny osobiste
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
  
  // Sprawdź dostępność wszystkich części
  const unavailableParts = [];
  for (const usedPart of parts) {
    const inventoryPart = inventory.parts.find(p => p.partId === usedPart.partId);
    if (!inventoryPart || inventoryPart.quantity < usedPart.quantity) {
      const partDetails = findPart(usedPart.partId);
      unavailableParts.push({
        partId: usedPart.partId,
        name: partDetails?.name || 'Nieznana część',
        requested: usedPart.quantity,
        available: inventoryPart?.quantity || 0
      });
    }
  }
  
  if (unavailableParts.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Niewystarczająca ilość części w magazynie',
      unavailableParts
    });
  }
  
  // Przygotuj dane użycia części
  const usageId = generateUsageId();
  const usedPartsDetails = [];
  let totalValue = 0;
  
  // Odejmij części z magazynu
  for (const usedPart of parts) {
    const inventoryPartIndex = inventory.parts.findIndex(p => p.partId === usedPart.partId);
    const inventoryPart = inventory.parts[inventoryPartIndex];
    const partDetails = findPart(usedPart.partId);
    
    // Odejmij ilość
    inventoryPart.quantity -= usedPart.quantity;
    inventoryPart.lastUsed = new Date().toISOString();
    
    // Usuń część z magazynu jeśli ilość = 0
    if (inventoryPart.quantity === 0) {
      inventory.parts.splice(inventoryPartIndex, 1);
    }
    
    // Dodaj do historii użycia
    const partValue = (partDetails?.price || 0) * usedPart.quantity;
    totalValue += partValue;
    
    usedPartsDetails.push({
      partId: usedPart.partId,
      partName: partDetails?.name || 'Nieznana część',
      partNumber: partDetails?.partNumber || '',
      quantity: usedPart.quantity,
      unitPrice: partDetails?.price || 0,
      totalPrice: partValue,
      installationNotes: usedPart.installationNotes || null,
      warranty: warranty || partDetails?.warranty || 12
    });
  }
  
  // Przelicz statystyki magazynu
  const totalParts = inventory.parts.reduce((sum, p) => sum + p.quantity, 0);
  const totalInventoryValue = inventory.parts.reduce((sum, p) => {
    const partDetails = findPart(p.partId);
    return sum + (partDetails?.price || 0) * p.quantity;
  }, 0);
  
  inventory.statistics = {
    totalParts,
    totalValue: totalInventoryValue,
    lastUpdated: new Date().toISOString()
  };
  
  // Zapisz zaktualizowany magazyn
  inventories[inventoryIndex] = inventory;
  if (!writeJSON(personalInventoriesPath, inventories)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać magazynu' 
    });
  }
  
  // Utwórz rekord użycia części
  const usageRecord = {
    usageId,
    employeeId,
    employeeName: employee.name,
    orderId,
    usageDate: new Date().toISOString(),
    parts: usedPartsDetails,
    totalValue,
    addedToInvoice: addToInvoice !== false, // default true
    invoiceId: invoiceId || null,
    customerInfo: customerInfo || null,
    createdAt: new Date().toISOString()
  };
  
  // Dodaj do historii użycia
  const usageHistory = readJSON(partUsagePath) || [];
  usageHistory.push(usageRecord);
  
  if (!writeJSON(partUsagePath, usageHistory)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać historii użycia' 
    });
  }
  
  // Sprawdź low stock (0 quantity) i wyślij notyfikację
  const outOfStockParts = [];
  for (const usedPart of parts) {
    const inventoryPart = inventory.parts.find(p => p.partId === usedPart.partId);
    if (!inventoryPart) { // Usunięto bo 0
      const partDetails = findPart(usedPart.partId);
      outOfStockParts.push(partDetails?.name || 'Nieznana część');
    }
  }
  
  if (outOfStockParts.length > 0) {
    sendNotification(
      '⚠️ Low stock alert!',
      `${employee.name} zużył ostatnie: ${outOfStockParts.join(', ')}. Stan magazynu: 0`,
      'warning',
      `/admin/logistyk/magazyny?employeeId=${employeeId}`,
      null // Dla logistyka
    );
  }
  
  return res.status(201).json({ 
    success: true, 
    usage: usageRecord,
    inventory: inventory,
    lowStockAlert: outOfStockParts.length > 0,
    outOfStockParts,
    message: `Użyto ${parts.length} części z magazynu (${totalValue}zł)`
  });
}
