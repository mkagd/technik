import fs from 'fs';
import path from 'path';

const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
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

export default function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const { requestId } = req.query;
  const {
    confirmedBy,      // ID osoby potwierdzającej (logistyk lub serwisant)
    trackingNumber,   // Opcjonalnie: numer przesyłki
    actualDeliveryDate, // Faktyczna data dostawy
    notes             // Uwagi do dostawy
  } = req.body;
  
  // Walidacja
  if (!requestId || !confirmedBy) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak requestId lub confirmedBy' 
    });
  }
  
  // Sprawdź pracownika
  const confirmer = findEmployee(confirmedBy);
  if (!confirmer) {
    return res.status(400).json({ 
      success: false, 
      error: 'Pracownik nie znaleziony' 
    });
  }
  
  // Odczytaj zamówienia
  const requests = readJSON(partRequestsPath);
  if (!requests) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać zamówień' 
    });
  }
  
  // Znajdź zamówienie
  const requestIndex = requests.findIndex(r => r.requestId === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Zamówienie nie znalezione' 
    });
  }
  
  const request = requests[requestIndex];
  
  // Sprawdź czy można oznaczyć jako dostarczone
  if (request.status !== 'ordered' && request.status !== 'approved') {
    return res.status(400).json({ 
      success: false, 
      error: `Nie można oznaczyć jako dostarczone zamówienia ze statusem: ${request.status}` 
    });
  }
  
  // Aktualizuj zamówienie
  requests[requestIndex] = {
    ...request,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    confirmedBy,
    confirmedByName: confirmer.name,
    trackingNumber: trackingNumber || request.trackingNumber || null,
    actualDeliveryDate: actualDeliveryDate || new Date().toISOString(),
    deliveryNotes: notes || null,
    updatedAt: new Date().toISOString()
  };
  
  // Zapisz
  if (!writeJSON(partRequestsPath, requests)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać zmian' 
    });
  }
  
  // Wyślij notyfikację do serwisanta (jeśli potwierdzał logistyk)
  if (confirmedBy !== request.requestedFor) {
    const partsCount = request.parts.length;
    const deliveryInfo = request.finalDelivery === 'paczkomat' 
      ? `paczkomat ${request.paczkomatId}` 
      : request.finalDelivery === 'office' 
      ? 'biuro' 
      : 'Twój adres';
    
    sendNotification(
      '📦 Części dostarczone!',
      `Zamówienie ${requestId} (${partsCount} części) dostarczone: ${deliveryInfo}`,
      'success',
      `/serwisant/magazyn`,
      request.requestedFor // Notyfikacja dla serwisanta
    );
  }
  
  // Notyfikacja do logistyka (jeśli potwierdzał serwisant)
  if (confirmedBy === request.requestedFor) {
    sendNotification(
      '✅ Odbiór potwierdzony',
      `${confirmer.name} potwierdził odbiór zamówienia ${requestId}`,
      'info',
      `/admin/logistyk/zamowienia?id=${requestId}`,
      null // Dla logistyka
    );
  }
  
  return res.status(200).json({ 
    success: true, 
    request: requests[requestIndex],
    message: 'Zamówienie oznaczone jako dostarczone'
  });
}
