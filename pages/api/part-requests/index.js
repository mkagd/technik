import fs from 'fs';
import path from 'path';

// Ścieżki do plików
const partRequestsPath = path.join(process.cwd(), 'data', 'part-requests.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
const ocrPath = path.join(process.cwd(), 'data', 'device-plate-ocr.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');
const systemConfigPath = path.join(process.cwd(), 'data', 'system-config.json');

// Helper: Odczyt JSON
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper: Zapis JSON
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Helper: Generuj ID zamówienia
function generateRequestId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `PR-${year}-${month}-${day}-${random}`;
}

// Helper: Sprawdź czy po deadline
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

// Helper: Wyślij notyfikację
function sendNotification(title, message, type, link, userId = null) {
  const notifications = readJSON(notificationsPath) || [];
  
  const notification = {
    id: Date.now(),
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    link,
    userId, // null = dla wszystkich adminów/logistyków
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  writeJSON(notificationsPath, notifications);
}

// Helper: Znajdź pracownika
function findEmployee(employeeId) {
  const employees = readJSON(employeesPath);
  if (!employees) return null;
  return employees.find(emp => emp.id === employeeId);
}

// Helper: Znajdź OCR
function findOCR(ocrId) {
  const ocrRecords = readJSON(ocrPath);
  if (!ocrRecords) return null;
  return ocrRecords.find(ocr => ocr.ocrId === ocrId);
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // ============================================
    // GET: Lista zamówień części
    // ============================================
    const { 
      id, 
      requestedBy, 
      requestedFor,
      status, 
      urgency,
      supplierId,
      limit 
    } = req.query;
    
    let requests = readJSON(partRequestsPath);
    if (!requests) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać zamówień' 
      });
    }
    
    // Filtrowanie
    if (id) {
      const request = requests.find(r => r.requestId === id);
      if (!request) {
        return res.status(404).json({ 
          success: false, 
          error: 'Zamówienie nie znalezione' 
        });
      }
      return res.status(200).json({ success: true, request });
    }
    
    if (requestedBy) {
      requests = requests.filter(r => r.requestedBy === requestedBy);
    }
    
    if (requestedFor) {
      requests = requests.filter(r => r.requestedFor === requestedFor);
    }
    
    if (status) {
      const statuses = status.split(',');
      requests = requests.filter(r => statuses.includes(r.status));
    }
    
    if (urgency) {
      requests = requests.filter(r => r.urgency === urgency);
    }
    
    if (supplierId) {
      requests = requests.filter(r => 
        r.parts.some(p => p.preferredSupplierId === supplierId)
      );
    }
    
    // Sortowanie: najnowsze pierwsze
    requests.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Limit
    if (limit) {
      const limitNum = parseInt(limit);
      requests = requests.slice(0, limitNum);
    }
    
    return res.status(200).json({ 
      success: true, 
      requests,
      count: requests.length
    });
    
  } else if (req.method === 'POST') {
    // ============================================
    // POST: Nowe zamówienie części
    // ============================================
    const {
      requestedBy,      // ID pracownika tworzącego (serwisant lub admin)
      requestedFor,     // ID pracownika dla którego (może być inny niż requestedBy)
      ocrId,            // Opcjonalnie: ID OCR z device-plate-ocr.json
      deviceInfo,       // Opcjonalnie: { brand, model, serialNumber } jeśli bez OCR
      parts,            // Array: [{ partId, quantity, preferredSupplierId }]
      urgency,          // 'standard', 'tomorrow', 'urgent'
      preferredDelivery, // 'paczkomat', 'office', 'technician-address'
      paczkomatId,      // Jeśli preferredDelivery === 'paczkomat'
      deliveryAddress,  // Jeśli preferredDelivery !== 'paczkomat'
      notes             // Opcjonalne uwagi
    } = req.body;
    
    // Walidacja
    if (!requestedBy || !requestedFor || !parts || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych pól: requestedBy, requestedFor, parts' 
      });
    }
    
    // Sprawdź czy pracownicy istnieją
    const requester = findEmployee(requestedBy);
    const recipient = findEmployee(requestedFor);
    
    if (!requester || !recipient) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pracownik nie znaleziony' 
      });
    }
    
    // Sprawdź czy OCR istnieje (jeśli podano)
    let ocrData = null;
    if (ocrId) {
      ocrData = findOCR(ocrId);
      if (!ocrData) {
        return res.status(400).json({ 
          success: false, 
          error: 'OCR nie znaleziony' 
        });
      }
    }
    
    // Sprawdź deadline i oblicz express charge
    const afterDeadline = isAfterDeadline();
    const config = readJSON(systemConfigPath);
    const expressCharge = afterDeadline && urgency === 'urgent' 
      ? (config?.ordering?.afterDeadlineCharge || 25) 
      : 0;
    
    // Generuj ID
    const requestId = generateRequestId();
    
    // Określ czy to admin ordering dla kogoś innego
    const isAdminOrder = requestedBy !== requestedFor;
    
    // Utwórz zamówienie
    const newRequest = {
      requestId,
      requestedBy,
      requestedByName: requester.name,
      requestedFor,
      requestedForName: recipient.name,
      createdBy: requestedBy, // Kto faktycznie stworzył
      isAdminOrder, // Czy admin zamawia dla kogoś innego
      
      // Device info z OCR lub ręczne
      deviceInfo: ocrData?.device || deviceInfo || null,
      ocrId: ocrId || null,
      
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
      finalDelivery: null, // Logistyk ustali
      
      // Status
      status: 'pending', // pending, approved, rejected, ordered, delivered, completed
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      
      // Konsolidacja (będzie uzupełnione przez logistyka)
      consolidatedWith: [],
      
      // Notatki
      notes: notes || null,
      logisticianNotes: null
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
    
    // Wyślij notyfikację do logistyka
    const urgencyLabel = urgency === 'urgent' ? '🔴 PILNE' : urgency === 'tomorrow' ? '⚠️ NA JUTRO' : '';
    const expressLabel = expressCharge > 0 ? ` (+${expressCharge}zł express)` : '';
    const adminLabel = isAdminOrder ? ` [Admin zamawia dla ${recipient.name}]` : '';
    
    sendNotification(
      `${urgencyLabel} Nowe zamówienie części`,
      `${requester.name} zamówił ${parts.length} części${expressLabel}${adminLabel}`,
      urgency === 'urgent' ? 'error' : 'info',
      `/admin/logistyk/zamowienia?id=${requestId}`,
      null // Dla wszystkich logistyków
    );
    
    // Jeśli urgent po deadline → dodatkowa notyfikacja
    if (afterDeadline && urgency === 'urgent') {
      sendNotification(
        '🚨 Express po deadline!',
        `${requester.name} złożył zamówienie express po ${config?.ordering?.defaultDeadline || '15:00'} (+${expressCharge}zł)`,
        'error',
        `/admin/logistyk/zamowienia?id=${requestId}`,
        null
      );
    }
    
    return res.status(201).json({ 
      success: true, 
      request: newRequest,
      message: `Zamówienie ${requestId} utworzone pomyślnie`
    });
    
  } else {
    res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
}
