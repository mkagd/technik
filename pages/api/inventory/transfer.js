// pages/api/inventory/transfer.js
import { readEmployees, updateEmployee } from '../../../utils/employeeStorage';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Metoda nie obsługiwana' 
    });
  }

  try {
    const { fromEmployeeId, toEmployeeId, partId, quantity } = req.body;

    // Walidacja
    if (!fromEmployeeId || !toEmployeeId || !partId || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nieprawidłowe dane' 
      });
    }

    if (fromEmployeeId === toEmployeeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nie można przenieść części do tego samego pracownika' 
      });
    }

    const employees = readEmployees();
    const fromEmployee = employees.find(emp => emp.id === fromEmployeeId);
    const toEmployee = employees.find(emp => emp.id === toEmployeeId);

    if (!fromEmployee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pracownik źródłowy nie znaleziony' 
      });
    }

    if (!toEmployee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pracownik docelowy nie znaleziony' 
      });
    }

    // Sprawdź czy pracownik źródłowy ma część
    if (!fromEmployee.inventory || fromEmployee.inventory.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Magazyn źródłowy jest pusty' 
      });
    }

    const fromItemIndex = fromEmployee.inventory.findIndex(item => item.partId === partId);

    if (fromItemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Część nie znaleziona w magazynie źródłowym' 
      });
    }

    const fromItem = fromEmployee.inventory[fromItemIndex];

    if (fromItem.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Niewystarczająca ilość. Dostępne: ${fromItem.quantity}` 
      });
    }

    // Inicjalizuj magazyn docelowy jeśli nie istnieje
    if (!toEmployee.inventory) {
      toEmployee.inventory = [];
    }

    // Znajdź lub utwórz pozycję w magazynie docelowym
    const toItemIndex = toEmployee.inventory.findIndex(item => item.partId === partId);

    if (toItemIndex !== -1) {
      // Zwiększ ilość
      toEmployee.inventory[toItemIndex].quantity += quantity;
    } else {
      // Dodaj nową pozycję
      toEmployee.inventory.push({
        partId,
        quantity,
        addedAt: new Date().toISOString(),
        transferredFrom: fromEmployeeId
      });
    }

    // Zmniejsz lub usuń z magazynu źródłowego
    if (fromItem.quantity === quantity) {
      fromEmployee.inventory.splice(fromItemIndex, 1);
    } else {
      fromEmployee.inventory[fromItemIndex].quantity -= quantity;
    }

    // Zapisz zmiany dla obu pracowników
    updateEmployee(fromEmployeeId, { inventory: fromEmployee.inventory });
    updateEmployee(toEmployeeId, { inventory: toEmployee.inventory });

    console.log(`✅ Transfer: ${quantity}x ${partId} od ${fromEmployee.name} do ${toEmployee.name}`);

    return res.status(200).json({
      success: true,
      message: `Przeniesiono ${quantity} szt części ${partId}`,
      from: {
        employeeId: fromEmployeeId,
        employeeName: fromEmployee.name,
        inventory: fromEmployee.inventory
      },
      to: {
        employeeId: toEmployeeId,
        employeeName: toEmployee.name,
        inventory: toEmployee.inventory
      }
    });

  } catch (error) {
    console.error('Błąd transferu części:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera', 
      error: error.message 
    });
  }
}
