// pages/api/employees/[id]/inventory/[partId].js
import { readEmployees, updateEmployee } from '../../../../../utils/employeeStorage';

export default async function handler(req, res) {
  const { id, partId } = req.query;

  if (req.method === 'DELETE') {
    // Usuń część z magazynu pracownika
    try {
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nieprawidłowa ilość' 
        });
      }

      const employees = readEmployees();
      const employee = employees.find(emp => emp.id === id);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pracownik nie znaleziony' 
        });
      }

      if (!employee.inventory || employee.inventory.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Magazyn jest pusty' 
        });
      }

      // Znajdź część w magazynie
      const itemIndex = employee.inventory.findIndex(item => item.partId === partId);

      if (itemIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Część nie znaleziona w magazynie' 
        });
      }

      const item = employee.inventory[itemIndex];

      if (item.quantity < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Niewystarczająca ilość. Dostępne: ${item.quantity}` 
        });
      }

      // Zmniejsz ilość lub usuń całkowicie
      if (item.quantity === quantity) {
        employee.inventory.splice(itemIndex, 1);
      } else {
        employee.inventory[itemIndex].quantity -= quantity;
      }

      // Zapisz zmiany
      updateEmployee(id, { inventory: employee.inventory });

      console.log(`✅ Usunięto ${quantity}x ${partId} z magazynu ${employee.name}`);

      return res.status(200).json({
        success: true,
        message: 'Część usunięta z magazynu',
        inventory: employee.inventory
      });

    } catch (error) {
      console.error('Błąd usuwania części z magazynu:', error);
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
