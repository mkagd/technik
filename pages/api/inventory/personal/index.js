import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');
const technicianSessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');
const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
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
  const data = readJSON(partsInventoryPath);
  if (!data) return null;
  const parts = data.inventory || data; // Support both old and new structure
  if (!Array.isArray(parts)) return null;
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
      return session.employeeId;
    }
  }

  // Try employee-sessions.json (fallback)
  const empSessions = readJSON(employeeSessionsPath);
  if (empSessions) {
    const session = empSessions.find(s => s.token === token && s.isValid);
    if (session) {
      return session.employeeId;
    }
  }

  return null;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // ============================================
    // GET: Magazyn osobisty pracownika lub wszystkich
    // ============================================
    const { employeeId } = req.query;

    // Walidacja tokenu
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authenticatedEmployeeId = validateToken(token);

    if (!authenticatedEmployeeId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Brak autoryzacji - zaloguj się ponownie' 
      });
    }

    // ✅ Jeśli brak employeeId, zwróć wszystkie magazyny (tylko dla adminów - TODO: sprawdzić rolę)
    if (!employeeId) {
      const inventories = readJSON(personalInventoriesPath) || [];
      console.log(`✅ Returning all ${inventories.length} personal inventories`);
      return res.status(200).json({ 
        success: true, 
        inventories 
      });
    }

    // 🔒 BEZPIECZEŃSTWO: Użytkownik może pobierać tylko SWÓJ magazyn
    if (authenticatedEmployeeId !== employeeId) {
      console.error(`❌ Access denied: ${authenticatedEmployeeId} tried to access ${employeeId}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Nie masz uprawnień do tego magazynu' 
      });
    }

    console.log(`✅ Authenticated GET for employeeId: ${employeeId}`);
    
    // Znajdź pracownika
    const employee = findEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pracownik nie znaleziony' 
      });
    }
    
    // Odczytaj magazyny osobiste
    const inventories = readJSON(personalInventoriesPath);
    if (!inventories) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać magazynów' 
      });
    }
    
    // Znajdź magazyn pracownika
    const inventory = inventories.find(inv => inv.employeeId === employeeId);
    
    if (!inventory) {
      // Brak magazynu → utwórz pusty
      return res.status(200).json({ 
        success: true, 
        inventory: {
          inventoryId: `PI-${Date.now()}`,
          employeeId,
          employeeName: employee.name,
          vehicle: employee.vehicle || 'Brak pojazdu',
          parts: [],
          statistics: {
            totalParts: 0,
            totalValue: 0,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    }
    
    // Wzbogać dane o szczegóły części
    const enrichedParts = inventory.parts.map(part => {
      const partDetails = findPart(part.partId);
      return {
        ...part,
        partName: partDetails?.name || 'Nieznana część',
        partNumber: partDetails?.partNumber || '',
        price: partDetails?.pricing?.retailPrice || partDetails?.price || 0,
        unitPrice: partDetails?.pricing?.retailPrice || partDetails?.price || 0,
        category: partDetails?.category || '',
        brand: partDetails?.brand || '',
        stock: partDetails?.availability?.inStock || 0
      };
    });
    
    return res.status(200).json({ 
      success: true, 
      inventory: {
        ...inventory,
        parts: enrichedParts
      }
    });
    
  } else if (req.method === 'POST') {
    // ============================================
    // POST: Przypisz część do magazynu (po dostawie)
    // ============================================
    const {
      employeeId,
      partId,
      quantity,
      location,         // Lokalizacja w aucie (np. "Schowek boczny")
      assignedBy,       // Kto przypisał (logistyk)
      supplierOrderId,  // Opcjonalnie: z jakiego zamówienia
      notes
    } = req.body;
    
    // Walidacja
    if (!employeeId || !partId || !quantity || !assignedBy) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych pól: employeeId, partId, quantity, assignedBy' 
      });
    }
    
    // Sprawdź pracownika i część
    const employee = findEmployee(employeeId);
    const assigner = findEmployee(assignedBy);
    const part = findPart(partId);
    
    if (!employee || !assigner || !part) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pracownik, przypisujący lub część nie znaleziona' 
      });
    }
    
    // Odczytaj magazyny
    let inventories = readJSON(personalInventoriesPath) || [];
    
    // Znajdź magazyn pracownika
    let inventoryIndex = inventories.findIndex(inv => inv.employeeId === employeeId);
    
    // Jeśli nie ma magazynu → utwórz
    if (inventoryIndex === -1) {
      inventories.push({
        inventoryId: `PI-${Date.now()}`,
        employeeId,
        employeeName: employee.name,
        vehicle: employee.vehicle || 'Brak pojazdu',
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
    
    // Sprawdź czy część już jest w magazynie
    const existingPartIndex = inventory.parts.findIndex(p => p.partId === partId);
    
    if (existingPartIndex !== -1) {
      // Część już istnieje → zwiększ ilość
      inventory.parts[existingPartIndex].quantity += quantity;
      inventory.parts[existingPartIndex].lastRestocked = new Date().toISOString();
      inventory.parts[existingPartIndex].restockedBy = assignedBy;
    } else {
      // Nowa część → dodaj
      inventory.parts.push({
        partId,
        quantity,
        location: location || 'Schowek główny',
        status: 'available',
        assignedBy,
        assignedDate: new Date().toISOString(),
        lastRestocked: new Date().toISOString(),
        restockedBy: assignedBy,
        supplierOrderId: supplierOrderId || null,
        notes: notes || null
      });
    }
    
    // Przelicz statystyki
    const totalParts = inventory.parts.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = inventory.parts.reduce((sum, p) => {
      const partDetails = findPart(p.partId);
      const price = partDetails?.pricing?.retailPrice || partDetails?.price || 0;
      return sum + price * p.quantity;
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
    
    // Wyślij notyfikację do serwisanta
    sendNotification(
      '📦 Nowe części w magazynie!',
      `${assigner.name} dodał do Twojego magazynu: ${part.name} (${quantity} szt)`,
      'success',
      `/serwisant/magazyn`,
      employeeId
    );
    
    return res.status(201).json({ 
      success: true, 
      inventory: inventories[inventoryIndex],
      message: `Przypisano ${quantity} szt ${part.name} do magazynu ${employee.name}`
    });
    
  } else {
    res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
}
