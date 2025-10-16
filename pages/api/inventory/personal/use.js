import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');
const technicianSessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');
const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');

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
  const data = readJSON(partsInventoryPath);
  if (!data) return null;
  
  // Support both old and new structure
  const parts = data.inventory || data;
  if (!Array.isArray(parts)) {
    console.error('❌ parts-inventory.json is not an array:', typeof parts);
    return null;
  }
  
  return parts.find(p => p.id === partId);
}

// Walidacja tokenu (multi-auth: technician + employee)
function validateToken(token) {
  if (!token) return null;

  // Try technician-sessions.json
  const techSessions = readJSON(technicianSessionsPath);
  if (techSessions) {
    const session = techSessions.find(s => s.token === token && s.isValid);
    if (session) {
      console.log(`✅ Valid technician token for ${session.employeeId}`);
      return session.employeeId;
    }
  }

  // Try employee-sessions.json (fallback)
  const empSessions = readJSON(employeeSessionsPath);
  if (empSessions) {
    const session = empSessions.find(s => s.token === token && s.isValid);
    if (session) {
      console.log(`✅ Valid employee token for ${session.employeeId}`);
      return session.employeeId;
    }
  }

  return null;
}

export default function handler(req, res) {
  console.log('📥 POST /api/inventory/personal/use - START');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
    }

    // ============================================
    // 🔐 WALIDACJA TOKENU
    // ============================================
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔑 Token received:', token ? token.substring(0, 20) + '...' : 'NONE');

    const authenticatedEmployeeId = validateToken(token);

    if (!authenticatedEmployeeId) {
      console.error('❌ Invalid or missing token');
      return res.status(401).json({ 
        success: false, 
        error: 'Brak autoryzacji - zaloguj się ponownie' 
      });
    }

    console.log(`🔐 Authenticated as: ${authenticatedEmployeeId}`);
    
    const {
      employeeId,
      orderId,          // ID zlecenia serwisowego
      parts,            // Array: [{ partId, quantity, installationNotes }]
      addToInvoice,     // Czy dodać do faktury (default: true)
      invoiceId,        // Opcjonalnie: ID faktury
      customerInfo,     // Opcjonalnie: dane klienta
      warranty          // Opcjonalnie: okres gwarancji (miesiące)
    } = req.body;

    console.log(`📦 Request: employeeId=${employeeId}, orderId=${orderId}, parts=${parts?.length || 0}`);

    // Sprawdź czy authenticated user = employeeId z request (bezpieczeństwo)
    if (authenticatedEmployeeId !== employeeId) {
      console.error(`❌ Token mismatch: ${authenticatedEmployeeId} vs ${employeeId}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Nie masz uprawnień do użycia części z tego magazynu' 
      });
    }
    
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
    // Support both pricing structures: pricing.retailPrice or price
    const unitPrice = partDetails?.pricing?.retailPrice || partDetails?.price || 0;
    const partValue = unitPrice * usedPart.quantity;
    totalValue += partValue;
    
    usedPartsDetails.push({
      partId: usedPart.partId,
      partName: partDetails?.name || 'Nieznana część',
      partNumber: partDetails?.partNumber || '',
      quantity: usedPart.quantity,
      unitPrice: unitPrice,
      totalPrice: partValue,
      installationNotes: usedPart.installationNotes || null,
      warranty: warranty || partDetails?.warranty || 12
    });
  }
  
  // Przelicz statystyki magazynu
  const totalParts = inventory.parts.reduce((sum, p) => sum + p.quantity, 0);
  const totalInventoryValue = inventory.parts.reduce((sum, p) => {
    const partDetails = findPart(p.partId);
    const price = partDetails?.pricing?.retailPrice || partDetails?.price || 0;
    return sum + price * p.quantity;
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
    
    console.log('✅ Use parts completed successfully');
    
    return res.status(201).json({ 
      success: true, 
      usage: usageRecord,
      inventory: inventory,
      lowStockAlert: outOfStockParts.length > 0,
      outOfStockParts,
      message: `Użyto ${parts.length} części z magazynu (${totalValue}zł)`
    });
  } catch (error) {
    console.error('💥 CRASH in handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Błąd serwera: ' + error.message 
    });
  }
}
