import fs from 'fs';
import path from 'path';
import { logger } from '../../../utils/logger';

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
    logger.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper: Zapis JSON
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Helper: Generuj ID zamówienia dla pracownika
function generateRequestId(employeeId) {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // 25 zamiast 2025
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  const dateTime = `${year}${month}${day}${hour}${minute}`;
  
  // Policz ile zamówień ma już ten pracownik (licznik życiowy)
  const data = readJSON(partRequestsPath) || { requests: [] };
  const requests = Array.isArray(data) ? data : (data.requests || []);
  const employeeRequestsCount = requests.filter(r => 
    r.requestedFor === employeeId || r.requestedBy === employeeId
  ).length;
  
  // Następne zamówienie = count + 1
  const counter = employeeRequestsCount + 1;
  
  return `ZC-${dateTime}-${String(counter).padStart(3, '0')}`;
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
      visitId, // ✅ Nowy parametr filtrowania
      status, 
      urgency,
      supplierId,
      limit 
    } = req.query;
    
    const data = readJSON(partRequestsPath);
    if (!data) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać zamówień' 
      });
    }
    
    // ✅ FIX: Pobierz tablicę z obiektu { requests: [...] }
    let requests = Array.isArray(data) ? data : (data.requests || []);
    
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
    
    // ✅ Filtruj po visitId (powiązanie z wizytą)
    if (visitId) {
      requests = requests.filter(r => r.visitId === visitId);
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
      preferredDelivery, // 'paczkomat', 'office', 'custom'
      paczkomatId,      // Jeśli preferredDelivery === 'paczkomat'
      deliveryAddress,  // Jeśli preferredDelivery !== 'paczkomat'
      alternativeAddress, // ✅ Nowe: alternatywny adres dostawy (jeśli podany)
      paymentMethod,    // 💳 'prepaid' (przedpłata) lub 'cod' (pobranie)
      notes             // Opcjonalne uwagi
    } = req.body;
    
    // 🐛 DEBUG: Log incoming parts data
    logger.debug('🔍 DEBUG parts received:', JSON.stringify(parts, null, 2));
    
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
    
    // Generuj ID (przekaż employeeId aby stworzyć unikalny licznik dla pracownika)
    const requestId = generateRequestId(requestedFor);
    
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
      
      // ✅ Powiązanie z wizytą (jeśli istnieje)
      visitId: req.body.visitId || null,
      orderNumber: req.body.orderNumber || null,
      clientName: req.body.clientName || null,
      
      // Device info z OCR lub ręczne
      deviceInfo: ocrData?.device || deviceInfo || null,
      ocrId: ocrId || null,
      
      // Części
      parts: parts.map(part => ({
        partId: part.partId,
        quantity: part.quantity || 1,
        preferredSupplierId: part.preferredSupplierId || null,
        northData: part.northData || null // ✅ Zachowaj dane North.pl (nazwa, cena, zdjęcia)
      })),
      
      // Pilność i dostawa
      urgency: urgency || 'standard',
      afterDeadline,
      expressCharge,
      
      preferredDelivery: preferredDelivery || 'office',
      paczkomatId: paczkomatId || null,
      deliveryAddress: deliveryAddress || null,
      alternativeAddress: alternativeAddress || null, // ✅ Alternatywny adres (opcjonalny)
      paymentMethod: paymentMethod || 'prepaid', // 💳 'prepaid' (przedpłata) lub 'cod' (pobranie)
      finalDelivery: null, // Logistyk ustali
      
      // 💰 Finansowe (opcjonalne - od serwisanta)
      pricing: req.body.pricing || {
        partsTotal: 0,           // Suma części
        laborCost: 0,            // Koszt naprawy/robocizny
        totalCost: 0,            // Łącznie
        paymentMethod: null,     // 'cash', 'card', 'transfer', null
        paymentStatus: 'unpaid', // 'paid', 'unpaid', 'partial'
        paidAmount: 0,           // Zapłacona kwota
        clientCharged: false     // Czy klient został obciążony
      },
      
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
    
    // 🐛 DEBUG: Log newRequest before saving
    logger.debug('💾 DEBUG newRequest.parts przed zapisem:', JSON.stringify(newRequest.parts, null, 2));
    
    // Dodaj do listy - OBSŁUGA ZARÓWNO [] JAK I { requests: [] }
    const data = readJSON(partRequestsPath);
    let requests = [];
    
    if (Array.isArray(data)) {
      // Stary format - tablica
      requests = data;
    } else if (data && data.requests && Array.isArray(data.requests)) {
      // Nowy format - obiekt z kluczem requests
      requests = data.requests;
    } else if (data === null || data === undefined) {
      // Brak pliku lub pusty
      requests = [];
    } else {
      logger.error('❌ Nieprawidłowy format part-requests.json:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'Nieprawidłowy format pliku zamówień' 
      });
    }
    
    requests.push(newRequest);
    
    // Zapisz w odpowiednim formacie (zachowaj strukturę { requests: [] })
    const saveData = data && typeof data === 'object' && !Array.isArray(data)
      ? { ...data, requests } // Zachowaj inne klucze jeśli istnieją
      : requests; // Stary format - sama tablica
    
    if (!writeJSON(partRequestsPath, saveData)) {
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
    
    // 🔔 Wyślij notyfikację do adminów/magazynu (dzwoneczek u góry)
    sendNotification(
      `🔔 Nowe zamówienie części`,
      `${requester.name} zamówił ${parts.length} części${urgencyLabel ? ` - ${urgencyLabel}` : ''}`,
      urgency === 'urgent' ? 'error' : 'info',
      `/admin/magazyn/zamowienia`,
      null // Dla wszystkich adminów
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
    
  } else if (req.method === 'PUT') {
    // UPDATE REQUEST - np. dodanie zdjęć
    const { requestId, attachedPhotos } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is required' });
    }
    
    const data = readJSON(partRequestsPath);
    if (!data) {
      return res.status(500).json({ success: false, error: 'Could not read requests' });
    }
    
    // Obsługa zarówno [] jak i { requests: [] }
    let requests = Array.isArray(data) ? data : (data.requests || []);
    
    const requestIndex = requests.findIndex(r => r.requestId === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    // Update attachedPhotos if provided
    if (attachedPhotos) {
      requests[requestIndex].attachedPhotos = attachedPhotos;
    }
    
    // Update timestamp
    requests[requestIndex].updatedAt = new Date().toISOString();
    
    // Zapisz w tym samym formacie co odczytano
    const saveData = data && typeof data === 'object' && !Array.isArray(data)
      ? { ...data, requests }
      : requests;
    
    // Save updated requests
    if (!writeJSON(partRequestsPath, saveData)) {
      return res.status(500).json({ success: false, error: 'Could not save updated request' });
    }
    
    return res.status(200).json({
      success: true,
      request: requests[requestIndex],
      message: 'Request updated successfully'
    });
    
  } else {
    res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
}
