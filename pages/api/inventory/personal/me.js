import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
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
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  // Walidacja tokenu
  const token = req.headers.authorization?.replace('Bearer ', '');
  const authenticatedEmployeeId = validateToken(token);

  if (!authenticatedEmployeeId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Brak autoryzacji - zaloguj się ponownie' 
    });
  }

  console.log(`✅ GET /me for authenticated user: ${authenticatedEmployeeId}`);
  
  // Znajdź pracownika
  const employee = findEmployee(authenticatedEmployeeId);
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
  const inventory = inventories.find(inv => inv.employeeId === authenticatedEmployeeId);
  
  if (!inventory) {
    // Brak magazynu → utwórz pusty
    return res.status(200).json({ 
      success: true, 
      inventory: {
        inventoryId: `PI-${Date.now()}`,
        employeeId: authenticatedEmployeeId,
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
}
