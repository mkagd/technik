import fs from 'fs';
import path from 'path';

const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');
const systemConfigPath = path.join(process.cwd(), 'data', 'system-config.json');

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

function generateRequestId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `PR-${year}-${month}-${day}-${random}`;
}

function isAfterDeadline() {
  const config = readJSON(systemConfigPath);
  if (!config) return false;
  
  const deadline = config.ordering?.defaultDeadline || '15:00';
  const [deadlineHour, deadlineMinute] = deadline.split(':').map(Number);
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (currentHour > deadlineHour) return true;
  if (currentHour === deadlineHour && currentMinute > deadlineMinute) return true;
  return false;
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
  
  const {
    adminId,          // ID admina/logistyka który zamawia
    technicianId,     // ID serwisanta dla którego zamawia
    orderId,          // Opcjonalnie: ID zlecenia serwisowego
    deviceInfo,       // { brand, model, serialNumber }
    parts,            // Array: [{ partId, quantity, preferredSupplierId }]
    urgency,          // 'standard', 'tomorrow', 'urgent'
    preferredDelivery, // 'paczkomat', 'office', 'technician-address'
    paczkomatId,
    deliveryAddress,
    reason,           // Powód zamówienia przez admina
    autoApprove,      // Czy od razu zatwierdzić (admin ma uprawnienia)
    notes
  } = req.body;
  
  // Walidacja
  if (!adminId || !technicianId || !parts || !Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Brak wymaganych pól: adminId, technicianId, parts' 
    });
  }
  
  // Sprawdź czy admin istnieje
  const admin = findEmployee(adminId);
  if (!admin) {
    return res.status(400).json({ 
      success: false, 
      error: 'Admin nie znaleziony' 
    });
  }
  
  // Sprawdź czy admin ma uprawnienia (role: admin, logistyk)
  if (!admin.role || !['admin', 'logistyk'].includes(admin.role.toLowerCase())) {
    return res.status(403).json({ 
      success: false, 
      error: 'Brak uprawnień do zamawiania dla innych' 
    });
  }
  
  // Sprawdź czy serwisant istnieje
  const technician = findEmployee(technicianId);
  if (!technician) {
    return res.status(400).json({ 
      success: false, 
      error: 'Serwisant nie znaleziony' 
    });
  }
  
  // Sprawdź deadline i oblicz express charge
  const afterDeadline = isAfterDeadline();
  const config = readJSON(systemConfigPath);
  const expressCharge = afterDeadline && urgency === 'urgent' 
    ? (config?.ordering?.afterDeadlineCharge || 25) 
    : 0;
  
  // Generuj ID
  const requestId = generateRequestId();
  
  // Utwórz zamówienie (admin zamawia dla serwisanta)
  const newRequest = {
    requestId,
    requestedBy: adminId,           // Admin
    requestedByName: admin.name,
    requestedFor: technicianId,     // Serwisant
    requestedForName: technician.name,
    createdBy: adminId,
    isAdminOrder: true,             // ✅ Flagka że to admin zamawia
    adminOrderReason: reason || 'Zamówienie przez admina',
    
    // Device info
    deviceInfo: deviceInfo || null,
    orderId: orderId || null,
    ocrId: null,
    
    // Części
    parts: parts.map(part => ({
      partId: part.partId,
      quantity: part.quantity || 1,
      preferredSupplierId: part.preferredSupplierId || null
    })),
    
    // Pilność i dostawa
    urgency: urgency || 'standard',
    afterDeadline,
    expressCharge,
    
    preferredDelivery: preferredDelivery || 'paczkomat',
    paczkomatId: paczkomatId || null,
    deliveryAddress: deliveryAddress || null,
    finalDelivery: autoApprove ? (preferredDelivery || 'paczkomat') : null,
    
    // Status - jeśli autoApprove to od razu approved
    status: autoApprove ? 'approved' : 'pending',
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: autoApprove ? new Date().toISOString() : null,
    approvedBy: autoApprove ? adminId : null,
    approvedByName: autoApprove ? admin.name : null,
    
    // Konsolidacja
    consolidatedWith: [],
    
    // Notatki
    notes: notes || null,
    logisticianNotes: autoApprove ? `Auto-zatwierdzone przez ${admin.name}` : null
  };
  
  // Dodaj do listy
  const requests = readJSON(partRequestsPath) || [];
  requests.push(newRequest);
  
  if (!writeJSON(partRequestsPath, requests)) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można zapisać zamówienia' 
    });
  }
  
  // Notyfikacje
  const statusLabel = autoApprove ? '✅ zatwierdzone' : '⏳ oczekuje';
  const expressLabel = expressCharge > 0 ? ` (+${expressCharge}zł express)` : '';
  
  // Notyfikacja do serwisanta
  sendNotification(
    `🛒 ${admin.name} zamówił dla Ciebie części`,
    `Zamówienie ${requestId} (${parts.length} części) - ${statusLabel}${expressLabel}. Powód: ${reason || 'Zamówienie przez admina'}`,
    autoApprove ? 'success' : 'info',
    `/serwisant/zamowienia?id=${requestId}`,
    technicianId
  );
  
  // Jeśli NIE auto-approve → notyfikacja do innych logistyków
  if (!autoApprove) {
    sendNotification(
      '🔔 Admin zamówił części dla serwisanta',
      `${admin.name} utworzył zamówienie ${requestId} dla ${technician.name} (${parts.length} części)`,
      'info',
      `/admin/logistyk/zamowienia?id=${requestId}`,
      null
    );
  }
  
  // Jeśli urgent po deadline → dodatkowa notyfikacja
  if (afterDeadline && urgency === 'urgent') {
    sendNotification(
      '🚨 Express po deadline (admin)!',
      `${admin.name} złożył zamówienie express dla ${technician.name} po ${config?.ordering?.defaultDeadline || '15:00'} (+${expressCharge}zł)`,
      'error',
      `/admin/logistyk/zamowienia?id=${requestId}`,
      null
    );
  }
  
  return res.status(201).json({ 
    success: true, 
    request: newRequest,
    message: autoApprove 
      ? `Zamówienie ${requestId} utworzone i zatwierdzone automatycznie` 
      : `Zamówienie ${requestId} utworzone, oczekuje na zatwierdzenie`
  });
}
