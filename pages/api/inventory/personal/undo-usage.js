// pages/api/inventory/personal/undo-usage.js
// API endpoint to undo parts usage from vehicle inventory (restore parts back to inventory)

import fs from 'fs';
import path from 'path';

const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
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

// Multi-auth token validation
function validateToken(token) {
  if (!token) return null;

  const techSessions = readJSON(technicianSessionsPath);
  if (techSessions) {
    const session = techSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  const empSessions = readJSON(employeeSessionsPath);
  if (empSessions) {
    const session = empSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  return null;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  console.log('🔄 POST /api/inventory/personal/undo-usage - Cofanie użycia części');

  try {
    // Validate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authenticatedEmployeeId = validateToken(token);

    if (!authenticatedEmployeeId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Brak autoryzacji - zaloguj się ponownie' 
      });
    }

    const { usageId, partId } = req.body;

    if (!usageId || !partId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych danych: usageId, partId' 
      });
    }

    console.log(`📦 Cofanie: usageId=${usageId}, partId=${partId}`);

    // 1. Odczytaj historię użycia
    let usageHistory = readJSON(partUsagePath);
    if (!usageHistory) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać historii użycia' 
      });
    }

    // 2. Znajdź rekord użycia
    const usageIndex = usageHistory.findIndex(u => u.usageId === usageId);
    if (usageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nie znaleziono rekordu użycia' 
      });
    }

    const usage = usageHistory[usageIndex];

    // 3. Sprawdź uprawnienia (tylko własny magazyn)
    if (usage.employeeId !== authenticatedEmployeeId) {
      console.error(`❌ Access denied: ${authenticatedEmployeeId} tried to undo ${usage.employeeId}'s usage`);
      return res.status(403).json({ 
        success: false, 
        error: 'Nie masz uprawnień do cofnięcia tego użycia' 
      });
    }

    // 4. Znajdź część w rekordzie użycia
    const partIndex = usage.parts.findIndex(p => p.partId === partId);
    if (partIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Część nie znaleziona w tym użyciu' 
      });
    }

    const part = usage.parts[partIndex];
    console.log(`✅ Znaleziono część: ${part.partName} (${part.quantity} szt)`);

    // 5. Odczytaj magazyny osobiste
    let inventories = readJSON(personalInventoriesPath);
    if (!inventories) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać magazynów' 
      });
    }

    // 6. Znajdź magazyn pracownika
    const inventoryIndex = inventories.findIndex(inv => inv.employeeId === usage.employeeId);
    if (inventoryIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nie znaleziono magazynu pracownika' 
      });
    }

    const inventory = inventories[inventoryIndex];

    // 7. Przywróć część do magazynu
    const inventoryPartIndex = inventory.parts.findIndex(p => p.partId === partId);
    
    if (inventoryPartIndex !== -1) {
      // Część już istnieje - zwiększ ilość
      inventory.parts[inventoryPartIndex].quantity += part.quantity;
      console.log(`📈 Zwiększono ilość części w magazynie: ${inventory.parts[inventoryPartIndex].quantity}`);
    } else {
      // Dodaj część do magazynu
      inventory.parts.push({
        partId: partId,
        quantity: part.quantity,
        location: 'vehicle',
        addedDate: new Date().toISOString()
      });
      console.log(`➕ Dodano część z powrotem do magazynu: ${part.quantity} szt`);
    }

    inventory.lastUpdated = new Date().toISOString();

    // 8. Usuń część z rekordu użycia (lub cały rekord jeśli to była ostatnia część)
    if (usage.parts.length === 1) {
      // To była ostatnia część - usuń cały rekord użycia
      usageHistory.splice(usageIndex, 1);
      console.log('🗑️ Usunięto cały rekord użycia (była to ostatnia część)');
    } else {
      // Usuń tylko tę część z rekordu
      usage.parts.splice(partIndex, 1);
      
      // Przelicz totalValue
      usage.totalValue = usage.parts.reduce((sum, p) => sum + p.totalPrice, 0);
      usage.lastUpdated = new Date().toISOString();
      
      usageHistory[usageIndex] = usage;
      console.log(`📝 Zaktualizowano rekord użycia, nowa wartość: ${usage.totalValue} zł`);
    }

    // 9. Zapisz zmiany
    if (!writeJSON(personalInventoriesPath, inventories)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać magazynu' 
      });
    }

    if (!writeJSON(partUsagePath, usageHistory)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać historii użycia' 
      });
    }

    console.log('✅ Pomyślnie cofnięto użycie części');

    return res.status(200).json({ 
      success: true, 
      message: 'Użycie części zostało cofnięte',
      restoredPart: {
        partId: part.partId,
        partName: part.partName,
        quantity: part.quantity,
        value: part.totalPrice
      },
      inventory: {
        employeeId: inventory.employeeId,
        partsCount: inventory.parts.length,
        totalParts: inventory.parts.reduce((sum, p) => sum + p.quantity, 0)
      }
    });

  } catch (error) {
    console.error('💥 Error in undo-usage handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Błąd serwera: ' + error.message 
    });
  }
}
