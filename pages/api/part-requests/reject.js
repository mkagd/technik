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
    rejectedBy,       // ID logistyka
    rejectionReason   // Powód odrzucenia
  } = req.body;
  
  // Walidacja
  if (!requestId || !rejectedBy || !rejectionReason) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak requestId, rejectedBy lub rejectionReason' 
    });
  }
  
  // Sprawdź logistyka
  const logistician = findEmployee(rejectedBy);
  if (!logistician) {
    return res.status(400).json({ 
      success: false, 
      error: 'Logistyk nie znaleziony' 
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
  
  // Sprawdź czy można odrzucić
  if (request.status !== 'pending') {
    return res.status(400).json({ 
      success: false, 
      error: `Nie można odrzucić zamówienia ze statusem: ${request.status}` 
    });
  }
  
  // Aktualizuj zamówienie
  requests[requestIndex] = {
    ...request,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy,
    rejectedByName: logistician.name,
    rejectionReason,
    updatedAt: new Date().toISOString()
  };
  
  // Zapisz
  if (!writeJSON(partRequestsPath, requests)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać zmian' 
    });
  }
  
  // Wyślij notyfikację do serwisanta
  sendNotification(
    '❌ Zamówienie odrzucone',
    `${logistician.name} odrzucił zamówienie ${requestId}. Powód: ${rejectionReason}`,
    'warning',
    `/serwisant/zamowienia?id=${requestId}`,
    request.requestedFor // Notyfikacja dla serwisanta
  );
  
  return res.status(200).json({ 
    success: true, 
    request: requests[requestIndex],
    message: 'Zamówienie odrzucone'
  });
}
