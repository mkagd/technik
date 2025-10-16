import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');
const techniciansFilePath = path.join(process.cwd(), 'data', 'technicians.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Weryfikacja tokenu technika
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Brak autoryzacji' });
    }

    const techniciansData = await readFile(techniciansFilePath, 'utf8');
    const technicians = JSON.parse(techniciansData);
    const technician = technicians.find(t => t.token === token);

    if (!technician) {
      return res.status(401).json({ error: 'Nieprawidłowy token' });
    }

    const { visitId, scheduledDate, scheduledTime } = req.body;

    if (!visitId || !scheduledDate) {
      return res.status(400).json({ error: 'Brak wymaganych danych' });
    }

    // Wczytaj zamówienia
    const ordersData = await readFile(ordersFilePath, 'utf8');
    const orders = JSON.parse(ordersData);

    // Znajdź zamówienie zawierające wizytę
    let orderFound = false;
    let updatedVisit = null;

    for (let order of orders) {
      if (order.visits && Array.isArray(order.visits)) {
        const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
        
        if (visitIndex !== -1) {
          // Znaleziono wizytę - zaktualizuj datę
          order.visits[visitIndex].scheduledDate = scheduledDate;
          if (scheduledTime) {
            order.visits[visitIndex].scheduledTime = scheduledTime;
          }
          
          // Dodaj informację o aktualizacji
          order.visits[visitIndex].lastUpdated = new Date().toISOString();
          order.visits[visitIndex].updatedBy = technician.id;
          
          updatedVisit = order.visits[visitIndex];
          orderFound = true;
          break;
        }
      }
    }

    if (!orderFound) {
      return res.status(404).json({ error: 'Wizyta nie została znaleziona' });
    }

    // Zapisz zaktualizowane zamówienia
    await writeFile(ordersFilePath, JSON.stringify(orders, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Termin wizyty został zaktualizowany',
      visit: updatedVisit
    });

  } catch (error) {
    console.error('Error updating visit date:', error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}
