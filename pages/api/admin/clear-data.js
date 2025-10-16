// pages/api/admin/clear-data.js
// API endpoint do czyszczenia danych z systemu

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

// Ścieżki do plików danych
const FILES = {
  orders: path.join(dataDir, 'orders.json'),
  partRequests: path.join(dataDir, 'part-requests.json'),
  personalInventories: path.join(dataDir, 'personal-inventories.json'),
  partsInventory: path.join(dataDir, 'parts-inventory.json'),
  reservations: path.join(dataDir, 'reservations.json'),
  clients: path.join(dataDir, 'clients.json'),
  employees: path.join(dataDir, 'employees.json'),
  auditLogs: path.join(dataDir, 'audit-logs.json'),
  notifications: path.join(dataDir, 'notifications.json'),
  rezerwacje: path.join(dataDir, 'rezerwacje.json'),
};

// Domyślne puste struktury dla każdego pliku
const EMPTY_STRUCTURES = {
  orders: { orders: [] },
  partRequests: { requests: [] },
  personalInventories: { inventories: [] },
  partsInventory: { parts: [] },
  reservations: { reservations: [] },
  clients: { clients: [] },
  employees: { employees: [] }, // Zachowaj ostrożność - nie usuwa adminów!
  auditLogs: { logs: [] },
  notifications: { notifications: [] },
  rezerwacje: { rezerwacje: [] },
};

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, confirmPassword } = req.body;

    // 🔐 ZABEZPIECZENIE: Wymagaj hasła do potwierdzenia
    // W produkcji użyj prawdziwego hasła lub tokenu sesji admina
    if (confirmPassword !== 'CLEAR_DATA_2025') {
      return res.status(403).json({ 
        error: 'Nieprawidłowe hasło potwierdzenia',
        message: 'Operacja wymaga autoryzacji administratora' 
      });
    }

    let cleared = [];
    let errors = [];

    switch (category) {
      case 'orders':
        // Wyczyść zamówienia (z wizytami)
        if (writeJSON(FILES.orders, EMPTY_STRUCTURES.orders)) {
          cleared.push('Zamówienia');
        } else {
          errors.push('Zamówienia');
        }
        break;

      case 'part-requests':
        // Wyczyść zamówienia części z magazynu
        if (writeJSON(FILES.partRequests, EMPTY_STRUCTURES.partRequests)) {
          cleared.push('Zamówienia części');
        } else {
          errors.push('Zamówienia części');
        }
        break;

      case 'inventories':
        // Wyczyść stany magazynowe techników
        if (writeJSON(FILES.personalInventories, EMPTY_STRUCTURES.personalInventories)) {
          cleared.push('Stany magazynowe techników');
        } else {
          errors.push('Stany magazynowe techników');
        }
        break;

      case 'parts':
        // Wyczyść katalog części w magazynie głównym
        if (writeJSON(FILES.partsInventory, EMPTY_STRUCTURES.partsInventory)) {
          cleared.push('Katalog części magazynu');
        } else {
          errors.push('Katalog części magazynu');
        }
        break;

      case 'reservations':
        // Wyczyść rezerwacje (oba pliki)
        if (writeJSON(FILES.reservations, EMPTY_STRUCTURES.reservations)) {
          cleared.push('Rezerwacje (reservations)');
        } else {
          errors.push('Rezerwacje (reservations)');
        }
        if (writeJSON(FILES.rezerwacje, EMPTY_STRUCTURES.rezerwacje)) {
          cleared.push('Rezerwacje (rezerwacje)');
        } else {
          errors.push('Rezerwacje (rezerwacje)');
        }
        break;

      case 'clients':
        // Wyczyść klientów
        if (writeJSON(FILES.clients, EMPTY_STRUCTURES.clients)) {
          cleared.push('Klienci');
        } else {
          errors.push('Klienci');
        }
        break;

      case 'audit-logs':
        // Wyczyść logi audytowe
        if (writeJSON(FILES.auditLogs, EMPTY_STRUCTURES.auditLogs)) {
          cleared.push('Logi audytowe');
        } else {
          errors.push('Logi audytowe');
        }
        break;

      case 'notifications':
        // Wyczyść powiadomienia
        if (writeJSON(FILES.notifications, EMPTY_STRUCTURES.notifications)) {
          cleared.push('Powiadomienia');
        } else {
          errors.push('Powiadomienia');
        }
        break;

      case 'all-warehouse':
        // Wyczyść wszystko związane z magazynem
        const warehouseFiles = ['partRequests', 'personalInventories', 'partsInventory'];
        warehouseFiles.forEach(key => {
          if (writeJSON(FILES[key], EMPTY_STRUCTURES[key])) {
            cleared.push(key);
          } else {
            errors.push(key);
          }
        });
        break;

      case 'all-data':
        // ⚠️ NIEBEZPIECZNE: Wyczyść wszystko poza pracownikami
        const allExceptEmployees = ['orders', 'partRequests', 'personalInventories', 'partsInventory', 'reservations', 'rezerwacje', 'clients', 'auditLogs', 'notifications'];
        allExceptEmployees.forEach(key => {
          if (writeJSON(FILES[key], EMPTY_STRUCTURES[key])) {
            cleared.push(key);
          } else {
            errors.push(key);
          }
        });
        break;

      default:
        return res.status(400).json({ 
          error: 'Nieznana kategoria',
          message: `Kategoria "${category}" nie jest obsługiwana` 
        });
    }

    // Zwróć wyniki
    if (errors.length > 0) {
      return res.status(500).json({
        success: false,
        cleared,
        errors,
        message: `Wyczyszczono: ${cleared.join(', ')}. Błędy: ${errors.join(', ')}`
      });
    }

    return res.status(200).json({
      success: true,
      cleared,
      message: `✅ Pomyślnie wyczyszczono: ${cleared.join(', ')}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    return res.status(500).json({ 
      error: 'Błąd serwera',
      message: error.message 
    });
  }
}
