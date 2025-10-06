// pages/api/part-requests/[requestId]/order.js
// Oznacz zamówienie jako "zamówione" (status: approved → ordered)

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

  const { trackingNumber, orderedBy, notes } = req.body;

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

  // Sprawdź status - musi być 'approved'
  if (request.status !== 'approved') {
    return res.status(400).json({ 
      success: false, 
      error: `Nie można oznaczyć jako zamówione. Aktualny status: ${request.status}. Wymagany status: approved` 
    });
  }

  // Zaktualizuj status na 'ordered'
  requests[requestIndex] = {
    ...request,
    status: 'ordered',
    orderedAt: new Date().toISOString(),
    orderedBy: orderedBy || 'admin',
    trackingNumber: trackingNumber || null,
    orderNotes: notes || null,
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!writeJSON(partRequestsPath, requests)) {
    return res.status(500).json({ success: false, error: 'Nie można zapisać zmian' });
  }

  // Wyślij notyfikację do serwisanta
  const technicianName = request.requestedForName || request.requestedByName || 'Serwisant';
  const trackingInfo = trackingNumber ? ` (nr przesyłki: ${trackingNumber})` : '';
  
  sendNotification(
    '📦 Części zamówione',
    `Zamówienie ${requestId} zostało złożone u dostawcy${trackingInfo}. Oczekuj na dostawę.`,
    'success',
    `/serwisant/zamowienia?id=${requestId}`,
    request.requestedFor || request.requestedBy
  );

  // Notyfikacja globalna dla logistyków
  sendNotification(
    '✅ Zamówienie złożone',
    `Zamówienie ${requestId} dla ${technicianName} zostało złożone u dostawcy${trackingInfo}`,
    'info',
    `/admin/magazyn/zamowienia?id=${requestId}`,
    null
  );

  return res.status(200).json({ 
    success: true, 
    message: `Zamówienie ${requestId} oznaczone jako zamówione`,
    request: requests[requestIndex]
  });
}
