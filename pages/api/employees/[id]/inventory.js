// pages/api/employees/[id]/inventory.js
// ✅ ZMIGROWANE - używa personal-inventories.json zamiast employees.json
import fs from 'fs';
import path from 'path';

const personalInventoriesPath = path.join(process.cwd(), 'data', 'personal-inventories.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const partsInventoryPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
const historyPath = path.join(process.cwd(), 'data', 'inventory-history.json');

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

function logHistory(action, data) {
  try {
    const history = readJSON(historyPath) || [];
    history.push({
      id: `HIST-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      ...data
    });
    writeJSON(historyPath, history);
  } catch (error) {
    console.error('Error logging history:', error);
  }
}

export default async function handler(req, res) {
  const { id: employeeId } = req.query;

  if (req.method === 'POST') {
    // Dodaj część do magazynu pracownika (przez personal-inventories.json)
    try {
      const { 
        partId, 
        quantity, 
        location = 'Schowek główny',
        notes = '',
        assignedBy = 'ADMIN'
      } = req.body;

      if (!partId || !quantity || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nieprawidłowe dane' 
        });
      }

      // Wczytaj dane
      const employees = readJSON(employeesPath);
      const employee = employees?.find(emp => emp.id === employeeId);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pracownik nie znaleziony' 
        });
      }

      let inventories = readJSON(personalInventoriesPath) || [];
      const parts = readJSON(partsInventoryPath);
      const allParts = parts?.inventory || parts || [];
      const partDetails = allParts.find(p => p.id === partId);

      if (!partDetails) {
        return res.status(404).json({ 
          success: false, 
          message: `Część ${partId} nie znaleziona w systemie` 
        });
      }

      // Znajdź lub utwórz magazyn osobisty
      let inventory = inventories.find(inv => inv.employeeId === employeeId);
      let isNew = false;

      if (!inventory) {
        isNew = true;
        inventory = {
          id: `PI-${Date.now()}-${employeeId.slice(-3)}`,
          employeeId,
          employeeName: employee.name,
          employeeRole: employee.role || 'SERWISANT',
          vehicle: employee.vehicle 
            ? `${employee.vehicle.brand} ${employee.vehicle.model} - ${employee.vehicle.licensePlate}`
            : 'Brak pojazdu',
          parts: [],
          totalValue: 0,
          lastUpdated: new Date().toISOString(),
          statistics: {
            totalParts: 0,
            totalTypes: 0,
            usedThisMonth: 0,
            valueUsedThisMonth: 0
          }
        };
        inventories.push(inventory);
        console.log(`✨ Utworzono nowy magazyn osobisty: ${inventory.id}`);
      }

      // Sprawdź czy część już istnieje
      const existingPart = inventory.parts.find(p => p.partId === partId);

      if (existingPart) {
        // Zwiększ ilość
        const oldQty = existingPart.quantity;
        existingPart.quantity += quantity;
        existingPart.lastRestocked = new Date().toISOString();
        existingPart.restockedBy = assignedBy;
        
        console.log(`🔄 Zaktualizowano ${partId}: ${oldQty} → ${existingPart.quantity} szt w magazynie ${employee.name}`);
        
        // Log do historii
        logHistory('UPDATE', {
          employeeId,
          employeeName: employee.name,
          partId,
          partName: partDetails.name,
          quantityChange: +quantity,
          oldQuantity: oldQty,
          newQuantity: existingPart.quantity,
          performedBy: assignedBy
        });
      } else {
        // Dodaj nową część
        const newPart = {
          partId,
          partNumber: partDetails.partNumber || 'N/A',
          name: partDetails.name,
          quantity,
          assignedDate: new Date().toISOString(),
          assignedBy,
          assignedByName: `Admin/Logistyka`,
          location,
          status: 'available',
          unitPrice: partDetails.price || 0,
          notes: notes || null
        };

        inventory.parts.push(newPart);
        console.log(`✅ Dodano ${quantity}x ${partDetails.name} do magazynu ${employee.name}`);
        
        // Log do historii
        logHistory('ADD', {
          employeeId,
          employeeName: employee.name,
          partId,
          partName: partDetails.name,
          quantity,
          location,
          performedBy: assignedBy,
          notes
        });
      }

      // Przelicz statystyki
      inventory.statistics.totalTypes = inventory.parts.length;
      inventory.statistics.totalParts = inventory.parts.reduce((sum, p) => sum + p.quantity, 0);
      inventory.totalValue = inventory.parts.reduce((sum, p) => {
        const price = p.unitPrice || 0;
        return sum + (price * p.quantity);
      }, 0);
      inventory.lastUpdated = new Date().toISOString();

      // Zapisz
      if (!writeJSON(personalInventoriesPath, inventories)) {
        return res.status(500).json({ 
          success: false, 
          message: 'Nie można zapisać magazynu' 
        });
      }

      return res.status(200).json({
        success: true,
        message: `Część ${partDetails.name} dodana do magazynu`,
        inventory: {
          id: inventory.id,
          parts: inventory.parts,
          statistics: inventory.statistics,
          totalValue: inventory.totalValue
        }
      });

    } catch (error) {
      console.error('Błąd dodawania części do magazynu:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Błąd serwera', 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: 'Metoda nie obsługiwana' 
  });
}
