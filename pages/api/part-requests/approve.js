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
    approvedBy,       // ID logistyka
    finalDelivery,    // Ostateczna decyzja o dostawie
    paczkomatId,
    deliveryAddress,
    logisticianNotes,
    estimatedDelivery // Opcjonalnie: data dostawy
  } = req.body;
  
  console.log('🔍 API DEBUG: requestId =', requestId);
  console.log('🔍 API DEBUG: approvedBy =', approvedBy);
  console.log('🔍 API DEBUG: body =', req.body);
  
  // Walidacja
  if (!requestId || !approvedBy) {
    console.log('❌ API: Brak requestId lub approvedBy');
    return res.status(400).json({ 
      success: false, 
      error: 'Brak requestId lub approvedBy' 
    });
  }
  
  // Sprawdź logistyka
  const logistician = findEmployee(approvedBy);
  console.log('🔍 API DEBUG: znaleziony logistyk =', logistician ? logistician.id : 'NIE ZNALEZIONY');
  
  if (!logistician) {
    console.log('❌ API: Logistyk nie znaleziony, szukano ID:', approvedBy);
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
  
  // Sprawdź czy już nie jest zatwierdzone/odrzucone
  if (request.status !== 'pending') {
    return res.status(400).json({ 
      success: false, 
      error: `Zamówienie już ma status: ${request.status}` 
    });
  }
  
  // Aktualizuj zamówienie
  requests[requestIndex] = {
    ...request,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy,
    approvedByName: logistician.name,
    finalDelivery: finalDelivery || request.preferredDelivery,
    paczkomatId: paczkomatId || request.paczkomatId,
    deliveryAddress: deliveryAddress || request.deliveryAddress,
    logisticianNotes: logisticianNotes || request.logisticianNotes,
    estimatedDelivery: estimatedDelivery || null,
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
  const deliveryInfo = finalDelivery === 'paczkomat' 
    ? `paczkomat ${paczkomatId}` 
    : finalDelivery === 'office' 
    ? 'biuro' 
    : 'adres serwisanta';
  
  sendNotification(
    '✅ Zamówienie zatwierdzone',
    `${logistician.name} zatwierdził Twoje zamówienie ${requestId}. Dostawa: ${deliveryInfo}`,
    'success',
    `/serwisant/zamowienia?id=${requestId}`,
    request.requestedFor // Notyfikacja dla serwisanta
  );
  
  return res.status(200).json({ 
    success: true, 
    request: requests[requestIndex],
    message: 'Zamówienie zatwierdzone'
  });
}
