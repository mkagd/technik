// pages/api/part-requests/[requestId]/deliver.js
// Oznacz zamówienie jako "dostarczone" (status: ordered → delivered)

import fs from 'fs';
import path from 'path';

const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON:', error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing JSON:', error);
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

export default function handler(req, res) {
  const { requestId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  if (!requestId) {
    return res.status(400).json({ success: false, error: 'Brak requestId' });
  }

  const { confirmedBy, notes } = req.body || {};

  // Wczytaj zamówienia
  const requests = readJSON(partRequestsPath);
  if (!requests) {
    return res.status(500).json({ success: false, error: 'Nie można wczytać zamówień' });
  }

  // Znajdź zamówienie
  const requestIndex = requests.findIndex(r => r.requestId === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ success: false, error: 'Zamówienie nie znalezione' });
  }

  const request = requests[requestIndex];

  // Sprawdź status - musi być 'ordered'
  if (request.status !== 'ordered') {
    return res.status(400).json({ 
      success: false, 
      error: `Nie można oznaczyć jako dostarczone. Aktualny status: ${request.status}. Wymagany status: ordered` 
    });
  }

  // Zaktualizuj status na 'delivered'
  requests[requestIndex] = {
    ...request,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    confirmedBy: confirmedBy || 'admin',
    deliveryNotes: notes || null,
    actualDeliveryDate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!writeJSON(partRequestsPath, requests)) {
    return res.status(500).json({ success: false, error: 'Nie można zapisać zmian' });
  }

  // Wyślij notyfikację do serwisanta
  const technicianName = request.requestedForName || request.requestedByName || 'Serwisant';
  const partsCount = request.parts?.length || 0;
  const deliveryInfo = request.finalDelivery === 'paczkomat' 
    ? `paczkomat ${request.paczkomatId || ''}` 
    : request.finalDelivery === 'office' 
    ? 'biuro' 
    : 'wskazany adres';
  
  sendNotification(
    '✅ Części dostarczone',
    `Zamówienie ${requestId} (${partsCount} części) dostarczone do: ${deliveryInfo}. Możesz odebrać części.`,
    'success',
    `/serwisant/magazyn`,
    request.requestedFor || request.requestedBy
  );

  // Notyfikacja globalna
  sendNotification(
    '📦 Dostawa potwierdzona',
    `Zamówienie ${requestId} dla ${technicianName} zostało dostarczone`,
    'info',
    `/admin/magazyn/zamowienia?id=${requestId}`,
    null
  );

  return res.status(200).json({ 
    success: true, 
    message: `Zamówienie ${requestId} oznaczone jako dostarczone`,
    request: requests[requestIndex]
  });
}
