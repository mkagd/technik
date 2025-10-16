// pages/api/technician/visits/[visitId].js
// 🔧 API dla aktualizacji konkretnej wizyty przez serwisanta

import fs from 'fs';
import path from 'path';
import { logger } from '../../../../utils/logger';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');

// ===========================
// HELPER FUNCTIONS
// ===========================

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('❌ Error reading orders.json:', error);
    return [];
  }
};

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    logger.success('✅ Orders saved successfully');
    return true;
  } catch (error) {
    logger.error('❌ Error writing orders.json:', error);
    return false;
  }
};

const readSessions = () => {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    logger.error('❌ Error reading sessions:', error);
    return [];
  }
};

// Waliduj token i zwróć employeeId
const validateToken = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  // Sprawdź wygaśnięcie (7 dni)
  const expirationTime = 7 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return session.employeeId;
};

// Znajdź zlecenie i wizytę po visitId
const findVisitInOrders = (orders, visitId) => {
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    if (order.visits && Array.isArray(order.visits)) {
      const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
      
      if (visitIndex !== -1) {
        return {
          orderIndex: i,
          visitIndex,
          order: order,
          visit: order.visits[visitIndex]
        };
      }
    }
  }
  
  return null;
};

// ===========================
// GET - Pobierz szczegóły wizyty
// ===========================

const handleGet = (req, res, visitId, employeeId) => {
  try {
    const orders = readOrders();
    const result = findVisitInOrders(orders, visitId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Visit ${visitId} not found`
      });
    }
    
    // Sprawdź czy wizyta należy do tego pracownika
    if (result.visit.assignedTo !== employeeId && result.visit.technicianId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this visit'
      });
    }
    
    // Zwróć pełne dane wizyty + informacje ze zlecenia
    const fullVisit = {
      ...result.visit,
      // Dodaj dane ze zlecenia
      orderNumber: result.order.id,
      clientId: result.order.clientId,
      clientName: result.order.clientName,
      clientPhone: result.order.clientPhone,
      clientEmail: result.order.clientEmail,
      clientAddress: result.order.clientAddress,
      serviceAddress: result.order.serviceAddress || result.order.clientAddress,
      
      // ✅ MULTI-DEVICE: Dodaj tablicę urządzeń ze zlecenia
      devices: result.order.devices || [],
      
      // ⚠️ DEPRECATED: Pojedyncze urządzenie (dla backward compatibility)
      deviceType: result.visit.deviceType || result.order.deviceType,
      brand: result.visit.brand || result.order.brand,
      model: result.visit.model || result.order.model,
      serialNumber: result.visit.serialNumber || result.order.serialNumber,
      
      // Opis problemu
      issueDescription: result.visit.issueDescription || result.order.issueDescription,
      
      // Dodatkowe dane ze zlecenia
      priority: result.visit.priority || result.order.priority,
      orderCreatedAt: result.order.createdAt
    };
    
    logger.success(`✅ Zwracam szczegóły wizyty ${visitId} dla pracownika ${employeeId}`);
    
    return res.status(200).json({
      success: true,
      visit: fullVisit
    });
    
  } catch (error) {
    logger.error('❌ Error getting visit:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================
// PUT - Aktualizuj wizytę
// ===========================

const handlePut = (req, res, visitId, employeeId) => {
  try {
    const orders = readOrders();
    const result = findVisitInOrders(orders, visitId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Visit ${visitId} not found`
      });
    }
    
    // Sprawdź czy wizyta należy do tego pracownika
    if (result.visit.assignedTo !== employeeId && result.visit.technicianId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this visit'
      });
    }
    
    // Pobierz dane do aktualizacji z body
    const updateData = req.body;
    const { deviceIndex, models } = updateData; // ✅ NEW: deviceIndex dla multi-device
    
    logger.debug(`🔄 Aktualizuję wizytę ${visitId}:`, updateData);
    if (typeof deviceIndex === 'number') {
      logger.debug(`   📱 Dla urządzenia deviceIndex=${deviceIndex}`);
    }
    
    // Lista pól, które serwisant może aktualizować
    const allowedFields = [
      'status',
      'notes',
      'technicianNotes',
      'diagnosis',
      'startTime',
      'endTime',
      'actualDuration',
      'partsUsed',
      'totalCost',
      'estimatedCost',
      'beforePhotos',
      'afterPhotos',
      'completionPhotos',
      'workSessions',
      'models', // 🆕 Tabliczki znamionowe (backward compatibility)
      'deviceIndex', // ✅ NEW: Index urządzenia dla multi-device
      'completedAt',
      'issues',
      'solutions',
      'recommendations'
    ];
    
    // Aktualizuj tylko dozwolone pola
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        result.visit[field] = updateData[field];
      }
    });
    
    // Dodaj timestamp aktualizacji
    result.visit.updatedAt = new Date().toISOString();
    result.visit.lastUpdatedBy = employeeId;
    
    // Jeśli status zmieniony na "completed", dodaj completedAt
    if (updateData.status === 'completed' && !result.visit.completedAt) {
      result.visit.completedAt = new Date().toISOString();
    }
    
    // ✅ MULTI-DEVICE: Zapisz modele dla konkretnego urządzenia
    if (models && Array.isArray(models) && typeof deviceIndex === 'number') {
      logger.debug(`📱 Zapisuję ${models.length} model(i) dla urządzenia deviceIndex=${deviceIndex}`);
      
      // Inicjalizuj deviceModels jeśli nie istnieje
      if (!result.visit.deviceModels) {
        result.visit.deviceModels = [];
      }
      
      // Znajdź lub utwórz wpis dla tego urządzenia
      let deviceModelsEntry = result.visit.deviceModels.find(dm => dm.deviceIndex === deviceIndex);
      
      if (!deviceModelsEntry) {
        deviceModelsEntry = {
          deviceIndex: deviceIndex,
          models: []
        };
        result.visit.deviceModels.push(deviceModelsEntry);
        logger.debug(`   ✅ Utworzono nowy wpis deviceModels[${deviceIndex}]`);
      }
      
      // Zaktualizuj modele dla tego urządzenia
      deviceModelsEntry.models = models;
      logger.debug(`   ✅ Zaktualizowano modele dla urządzenia ${deviceIndex}`);
      
      // Zachowaj backward compatibility - zapisz też do starego pola models
      // (tylko jeśli to pierwsze urządzenie deviceIndex=0)
      if (deviceIndex === 0) {
        result.visit.models = models;
        logger.debug(`   ⚠️  Backward compatibility: skopiowano też do visit.models`);
      }
    }
    
    // 🆕 AUTO-UZUPEŁNIENIE: Jeśli zapisano modele dla urządzenia
    if (models && Array.isArray(models) && models.length > 0 && typeof deviceIndex === 'number') {
      const firstModel = models[0];
      const order = orders[result.orderIndex];
      
      logger.debug(`🔍 Auto-fill check dla urządzenia ${deviceIndex}:`, firstModel.brand, firstModel.model);
      
      // ✅ INICJALIZUJ order.devices[] jeśli nie istnieje
      if (!order.devices || !Array.isArray(order.devices)) {
        logger.debug(`   📦 Inicjalizuję order.devices[] (było puste)`);
        order.devices = [];
      }
      
      // ✅ UTWÓRZ urządzenie jeśli nie istnieje
      if (!order.devices[deviceIndex]) {
        logger.debug(`   📦 Tworzę order.devices[${deviceIndex}] (nie istniało)`);
        order.devices[deviceIndex] = {
          deviceIndex: deviceIndex,
          deviceType: firstModel.type || firstModel.finalType || 'Nieznane',
          brand: firstModel.brand || '',
          model: firstModel.model || firstModel.finalModel || '',
          serialNumber: firstModel.serialNumber || '',
          notes: ''
        };
      }
      
      // Sprawdź czy urządzenie o tym indeksie istnieje w order.devices
      if (order.devices && order.devices[deviceIndex]) {
        const device = order.devices[deviceIndex];
        
        logger.debug(`   📋 Aktualne dane urządzenia ${deviceIndex}:`, {
          type: device.deviceType,
          brand: device.brand,
          model: device.model,
          sn: device.serialNumber
        });
        
        // ✅ ZAWSZE nadpisuj dane z tabliczki znamionowej (są bardziej aktualne!)
        const isEmpty = (val) => !val || val === 'Nieznany' || val === 'Brak' || val === '';
        
        // Nadpisz dane z modelu (tabliczka znamionowa ma priorytet)
        if (firstModel.type || firstModel.finalType) {
          const oldType = device.deviceType;
          device.deviceType = firstModel.type || firstModel.finalType;
          logger.debug(`   ✅ Nadpisano deviceType[${deviceIndex}]: "${oldType}" → "${device.deviceType}"`);
        }
        
        if (firstModel.brand) {
          const oldBrand = device.brand;
          device.brand = firstModel.brand;
          logger.debug(`   ✅ Nadpisano brand[${deviceIndex}]: "${oldBrand}" → "${device.brand}"`);
        }
        
        if (firstModel.model || firstModel.finalModel) {
          const oldModel = device.model;
          device.model = firstModel.model || firstModel.finalModel;
          logger.debug(`   ✅ Nadpisano model[${deviceIndex}]: "${oldModel}" → "${device.model}"`);
        }
        
        if (firstModel.serialNumber) {
          const oldSN = device.serialNumber;
          device.serialNumber = firstModel.serialNumber;
          logger.debug(`   ✅ Nadpisano serialNumber[${deviceIndex}]: "${oldSN}" → "${device.serialNumber}"`);
        }
        
        // ⚠️  Backward compatibility: Jeśli to pierwsze urządzenie, zaktualizuj też stare pola
        if (deviceIndex === 0) {
          if (isEmpty(order.deviceType)) {
            order.deviceType = device.deviceType;
            logger.debug(`   ⚠️  Backward compat: order.deviceType =`, order.deviceType);
          }
          if (isEmpty(order.brand)) {
            order.brand = device.brand;
            logger.debug(`   ⚠️  Backward compat: order.brand =`, order.brand);
          }
          if (isEmpty(order.model)) {
            order.model = device.model;
            logger.debug(`   ⚠️  Backward compat: order.model =`, order.model);
          }
          if (isEmpty(order.serialNumber)) {
            order.serialNumber = device.serialNumber;
            logger.debug(`   ⚠️  Backward compat: order.serialNumber =`, order.serialNumber);
          }
        }
        
        logger.debug(`✅ Auto-fill zakończone dla urządzenia ${deviceIndex}`);
      } else {
        logger.warn(`⚠️  OSTRZEŻENIE: Urządzenie deviceIndex=${deviceIndex} nie istnieje w order.devices[]`);
        
        // Fallback: stary sposób (dla backward compatibility)
        if (deviceIndex === 0) {
          logger.debug(`   📌 Stosuj stary sposób auto-fill dla deviceIndex=0`);
          
          const isEmpty = (val) => !val || val === 'Nieznany' || val === 'Brak' || val === '';
          
          if (isEmpty(order.deviceType)) {
            order.deviceType = firstModel.type || firstModel.finalType || order.deviceType;
            logger.debug(`   ✅ Fallback: order.deviceType =`, order.deviceType);
          }
          if (isEmpty(order.brand)) {
            order.brand = firstModel.brand || order.brand;
            logger.debug(`   ✅ Fallback: order.brand =`, order.brand);
          }
          if (isEmpty(order.model)) {
            order.model = firstModel.model || firstModel.finalModel || order.model;
            logger.debug(`   ✅ Fallback: order.model =`, order.model);
          }
          if (isEmpty(order.serialNumber)) {
            order.serialNumber = firstModel.serialNumber || order.serialNumber;
            logger.debug(`   ✅ Fallback: order.serialNumber =`, order.serialNumber);
          }
        }
      }
    }
    
    // Zaktualizuj wizytę w zleceniu
    orders[result.orderIndex].visits[result.visitIndex] = result.visit;
    
    // Zaktualizuj timestamp zlecenia
    orders[result.orderIndex].updatedAt = new Date().toISOString();
    
    // 🔍 DEBUG: Pokaż co zostanie zapisane do order.devices
    if (models && deviceIndex !== undefined) {
      logger.debug(`📊 Finalne order.devices[${deviceIndex}] przed zapisem:`, 
        JSON.stringify(orders[result.orderIndex].devices?.[deviceIndex], null, 2));
    }
    
    // Zapisz do pliku
    const saved = writeOrders(orders);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save changes'
      });
    }
    
    logger.success(`✅ Wizyta ${visitId} zaktualizowana pomyślnie`);
    
    // 🔍 DEBUG: Sprawdź czy dane zostały zapisane do pliku
    if (models && deviceIndex !== undefined) {
      const rereadOrders = readOrders();
      const rereadOrder = rereadOrders.find(o => o.id === orders[result.orderIndex].id);
      logger.debug(`🔍 Weryfikacja zapisu - order.devices[${deviceIndex}] po odczycie z pliku:`,
        JSON.stringify(rereadOrder?.devices?.[deviceIndex], null, 2));
    }
    
    return res.status(200).json({
      success: true,
      message: 'Visit updated successfully',
      visit: result.visit,
      // ✅ Zwróć też zaktualizowane devices dla frontendu
      orderDevices: orders[result.orderIndex].devices
    });
    
  } catch (error) {
    logger.error('❌ Error updating visit:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Waliduj token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required'
    });
  }

  const employeeId = validateToken(token);
  
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Pobierz visitId z URL
  const { visitId } = req.query;
  
  if (!visitId) {
    return res.status(400).json({
      success: false,
      message: 'Visit ID is required'
    });
  }

  logger.debug(`📞 API ${req.method} /api/technician/visits/${visitId} - Pracownik: ${employeeId}`);

  // Routing
  if (req.method === 'GET') {
    return handleGet(req, res, visitId, employeeId);
  } else if (req.method === 'PUT') {
    return handlePut(req, res, visitId, employeeId);
  } else {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed. Use GET or PUT.`
    });
  }
}
