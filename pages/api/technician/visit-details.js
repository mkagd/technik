// pages/api/technician/visit-details.js
// 📋 API dla szczegółowych danych pojedynczej wizyty

import fs from 'fs';
import path from 'path';
import { logger } from '../../../utils/logger';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');
const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');

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

const readClients = () => {
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    logger.error('❌ Error reading clients.json:', error);
    return [];
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

// Waliduj token (multi-auth: technician-sessions + employee-sessions)
const validateToken = (token) => {
  // Try technician-sessions.json (primary)
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (session) {
    // ✅ Jeśli jest isValid: true, to token jest aktywny (nie sprawdzamy daty)
    logger.debug(`✅ Valid technician token for ${session.employeeId}`);
    return session.employeeId;
  }
  
  // Try employee-sessions.json (fallback for pracownik-logowanie)
  const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');
  if (fs.existsSync(employeeSessionsPath)) {
    try {
      const empSessions = JSON.parse(fs.readFileSync(employeeSessionsPath, 'utf-8'));
      const empSession = empSessions.find(s => s.token === token && s.isValid);
      if (empSession) {
        logger.debug(`✅ Valid employee token for ${empSession.employeeId}`);
        return empSession.employeeId;
      }
    } catch (error) {
      logger.error('Error reading employee-sessions:', error);
    }
  }
  
  return null;
};

// Znajdź wizytę po ID
const findVisitById = (visitId) => {
  const orders = readOrders();
  
  for (const order of orders) {
    if (order.visits && Array.isArray(order.visits)) {
      const visit = order.visits.find(v => v.visitId === visitId);
      if (visit) {
        return { visit, order };
      }
    }
    
    // Stary system - wirtualna wizyta
    if (visitId === `VIS-${order.orderNumber}`) {
      return { 
        visit: null,  // będzie utworzona wirtualna
        order,
        isVirtual: true
      };
    }
  }
  
  return null;
};

// Znajdź klienta
const findClientById = (clientId) => {
  const clients = readClients();
  return clients.find(c => c.id === clientId) || null;
};

// Buduj pełne szczegóły wizyty
const buildVisitDetails = (visitData) => {
  const { visit, order, isVirtual } = visitData;
  
  // Pobierz szczegóły klienta jeśli istnieją
  const clientDetails = order.clientId ? findClientById(order.clientId) : null;
  
  // Jeśli wirtualna wizyta
  if (isVirtual) {
    return {
      visitId: `VIS-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderId: order.orderNumber || order.id, // ✅ Use orderNumber as primary orderId
      type: 'repair',
      typeLabel: 'Naprawa',
      status: mapOrderStatusToVisitStatus(order.status),
      statusLabel: getVisitStatusLabel(mapOrderStatusToVisitStatus(order.status)),
      
      // Data i czas
      date: order.visitDate || order.plannedDate || order.createdDate,
      time: order.visitTime || order.time || '09:00',
      scheduledDate: order.visitDate || order.plannedDate,
      estimatedDuration: order.estimatedDuration || 120,
      actualDuration: order.actualDuration,
      
      // Przypisanie
      assignedTo: order.assignedTo || order.technicianId,
      technicianId: order.technicianId || order.assignedTo,
      
      // Klient - pełne dane
      client: {
        id: order.clientId,
        name: order.clientName || order.customerName,
        phone: order.clientPhone || order.phone,
        email: order.clientEmail || order.email,
        address: order.address || order.clientAddress,
        city: order.city,
        street: order.street,
        postalCode: order.postalCode,
        
        // Dodatkowe z bazy klientów
        ...(clientDetails ? {
          preferredContactMethod: clientDetails.preferredContactMethod,
          notes: clientDetails.notes,
          visitCount: clientDetails.visitCount,
          totalSpent: clientDetails.totalSpent
        } : {})
      },
      
      // Urządzenie - pełne dane
      device: {
        type: order.deviceType || order.category,
        brand: order.brand,
        model: order.model,
        serialNumber: order.serialNumber,
        fullName: `${order.brand || ''} ${order.model || ''}`.trim() || order.device,
        
        // AGD Specific
        warrantyStatus: order.agdSpecific?.warrantyStatus,
        warrantyExpiryDate: order.agdSpecific?.warrantyExpiryDate,
        purchaseDate: order.agdSpecific?.purchaseDate,
        
        // Zabudowa
        isBuiltIn: order.builtInParams?.isBuiltIn || false,
        builtInType: order.builtInParams?.type,
        builtInComplexity: order.builtInParams?.difficulty,
        requiresDismantling: order.builtInParams?.demontaz || false,
        requiresReassembly: order.builtInParams?.montaz || false,
        
        // Historia
        previousRepairs: order.deviceHistory?.previousRepairs || [],
        previousIssues: order.deviceHistory?.issues || []
      },
      
      // Problem i diagnoza
      problem: {
        description: order.problemDescription || order.description,
        symptoms: order.symptoms || [],
        reportedBy: order.reportedBy || 'Klient',
        reportedDate: order.createdAt,
        priority: order.priority || 'medium',
        
        // Diagnoza
        diagnosis: order.diagnosis,
        diagnosisDate: order.diagnosisDate,
        diagnosedBy: order.diagnosedBy,
        diagnosisNotes: order.diagnosisNotes,
        
        // Przyczyna
        rootCause: order.rootCause,
        faultCode: order.faultCode
      },
      
      // Części
      parts: {
        // 🆕 Główna lista części przypisanych (dla starych zleceń bez systemu wizyt)
        assigned: order.parts || [],
        needed: order.partsNeeded || [],
        used: order.partsUsed || [],
        ordered: order.partsOrdered || [],
        estimatedCost: order.partsEstimatedCost,
        actualCost: order.partsActualCost,
        supplier: order.partsSupplier,
        deliveryDate: order.partsDeliveryDate
      },
      
      // Koszty
      costs: {
        laborCost: order.laborCost,
        partsCost: order.partsCost,
        travelCost: order.travelCost,
        additionalCosts: order.additionalCosts || [],
        estimatedTotal: order.estimatedCost,
        actualTotal: order.totalCost,
        currency: 'PLN',
        invoiceNumber: order.invoiceNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      },
      
      // Notatki
      notes: {
        technician: order.technicianNotes || '',
        internal: order.internalNotes || '',
        client: order.clientNotes || '',
        recommendations: order.recommendations || []
      },
      
      // Zdjęcia - wszystkie kategorie
      photos: order.photos || [], // Główne zdjęcia od klienta
      beforePhotos: order.beforePhotos || [],
      duringPhotos: order.duringPhotos || [],
      afterPhotos: order.afterPhotos || [],
      completionPhotos: order.completionPhotos || [],
      problemPhotos: order.problemPhotos || [],
      partPhotos: order.partPhotos || [],
      allPhotos: order.allPhotos || [...(order.photos || []), ...(order.beforePhotos || []), ...(order.duringPhotos || []), ...(order.afterPhotos || []), ...(order.completionPhotos || []), ...(order.problemPhotos || []), ...(order.partPhotos || [])],
      
      // Tracking czasu
      timeTracking: {
        sessions: order.workSessions || [],
        totalTime: calculateTotalTime(order.workSessions || []),
        startTime: order.startTime,
        endTime: order.endTime,
        pausedTime: order.pausedTime,
        breakDuration: order.breakDuration || 0
      },
      
      // Status i historia
      statusHistory: order.statusHistory || [],
      
      // Metadane
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      source: order.source,
      
      // Flagi
      _isVirtualVisit: true,
      _hasFullOrderData: true
    };
  }
  
  // NORMALNA WIZYTA Z order.visits
  return {
    visitId: visit.visitId,
    orderNumber: order.orderNumber,
    orderId: visit.orderId || order.orderNumber || order.id, // ✅ Use visit.orderId first, then orderNumber
    type: visit.type,
    typeLabel: getVisitTypeLabel(visit.type),
    status: visit.status,
    statusLabel: getVisitStatusLabel(visit.status),
    
    // Data i czas
    date: visit.date,
    time: visit.time || visit.scheduledTime,
    scheduledDate: visit.scheduledDate || visit.date,
    scheduledTime: visit.scheduledTime,
    estimatedDuration: visit.estimatedDuration || 120,
    actualDuration: visit.actualDuration,
    
    // Przypisanie
    assignedTo: visit.assignedTo || visit.technicianId,
    technicianId: visit.technicianId || visit.assignedTo,
    technicianName: visit.technicianName,
    
    // Klient
    client: {
      id: order.clientId,
      name: order.clientName || order.customerName,
      phone: order.clientPhone || order.phone,
      email: order.clientEmail || order.email,
      address: order.address || order.clientAddress,
      city: order.city,
      street: order.street,
      postalCode: order.postalCode,
      
      ...(clientDetails ? {
        preferredContactMethod: clientDetails.preferredContactMethod,
        notes: clientDetails.notes,
        visitCount: clientDetails.visitCount,
        totalSpent: clientDetails.totalSpent
      } : {})
    },
    
    // Urządzenie (backward compatibility - pojedyncze urządzenie)
    device: {
      type: order.deviceType || order.category,
      brand: order.brand,
      model: order.model,
      serialNumber: order.serialNumber,
      fullName: `${order.brand || ''} ${order.model || ''}`.trim() || order.device,
      
      warrantyStatus: order.agdSpecific?.warrantyStatus,
      warrantyExpiryDate: order.agdSpecific?.warrantyExpiryDate,
      purchaseDate: order.agdSpecific?.purchaseDate,
      
      isBuiltIn: order.builtInParams?.isBuiltIn || false,
      builtInType: order.builtInParams?.type,
      builtInComplexity: order.builtInParams?.difficulty,
      requiresDismantling: order.builtInParams?.demontaz || false,
      requiresReassembly: order.builtInParams?.montaz || false,
      
      previousRepairs: order.deviceHistory?.previousRepairs || [],
      previousIssues: order.deviceHistory?.issues || []
    },
    
    // ✅ MULTI-DEVICE: Tablica wszystkich urządzeń ze zlecenia
    devices: order.devices || [],
    
    // ✅ MULTI-DEVICE: Modele zeskanowane dla każdego urządzenia
    deviceModels: visit.deviceModels || [],
    
    // Problem i diagnoza
    problem: {
      description: order.problemDescription || order.description,
      symptoms: order.symptoms || [],
      reportedBy: order.reportedBy || 'Klient',
      reportedDate: order.createdAt,
      priority: visit.priority || order.priority || 'medium',
      
      diagnosis: visit.diagnosis || order.diagnosis,
      diagnosisDate: visit.diagnosisDate,
      diagnosedBy: visit.diagnosedBy,
      diagnosisNotes: visit.diagnosisNotes,
      
      rootCause: visit.rootCause || order.rootCause,
      faultCode: visit.faultCode || order.faultCode
    },
    
    // Części
    parts: {
      // 🆕 Główna lista części przypisanych do wizyty (z zamówienia)
      assigned: visit.parts || order.parts || [],
      needed: visit.partsNeeded || order.partsNeeded || [],
      used: visit.partsUsed || [],
      ordered: visit.partsOrdered || order.partsOrdered || [],
      estimatedCost: visit.partsEstimatedCost || order.partsEstimatedCost,
      actualCost: visit.partsActualCost,
      supplier: visit.partsSupplier || order.partsSupplier,
      deliveryDate: visit.partsDeliveryDate
    },
    
    // Koszty
    costs: {
      laborCost: visit.laborCost,
      partsCost: visit.partsCost,
      travelCost: visit.travelCost,
      additionalCosts: visit.additionalCosts || [],
      estimatedTotal: visit.estimatedCost,
      actualTotal: visit.totalCost,
      currency: 'PLN',
      invoiceNumber: visit.invoiceNumber,
      paymentStatus: visit.paymentStatus,
      paymentMethod: visit.paymentMethod
    },
    
    // Notatki
    notes: {
      technician: visit.technicianNotes || '',
      internal: visit.internalNotes || order.internalNotes || '',
      client: visit.clientNotes || '',
      recommendations: visit.recommendations || []
    },
    
    // Zdjęcia - wszystkie kategorie
    photos: order.photos || [], // Główne zdjęcia od klienta
    beforePhotos: visit.beforePhotos || order.beforePhotos || [],
    duringPhotos: visit.duringPhotos || order.duringPhotos || [],
    afterPhotos: visit.afterPhotos || order.afterPhotos || [],
    completionPhotos: visit.completionPhotos || order.completionPhotos || [],
    problemPhotos: visit.problemPhotos || order.problemPhotos || [],
    partPhotos: visit.partPhotos || order.partPhotos || [],
    allPhotos: order.allPhotos || [...(order.photos || []), ...(visit.beforePhotos || order.beforePhotos || []), ...(visit.duringPhotos || order.duringPhotos || []), ...(visit.afterPhotos || order.afterPhotos || []), ...(visit.completionPhotos || order.completionPhotos || []), ...(visit.problemPhotos || order.problemPhotos || []), ...(visit.partPhotos || order.partPhotos || [])],
    
    // Tracking czasu
    timeTracking: {
      sessions: visit.workSessions || [],
      totalTime: calculateTotalTime(visit.workSessions || []),
      startTime: visit.startTime,
      endTime: visit.endTime,
      pausedTime: visit.pausedTime,
      breakDuration: visit.breakDuration || 0
    },
    
    // Status i historia
    statusHistory: visit.statusHistory || [],
    
    // Metadane
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
    completedAt: visit.completedAt,
    
    _hasFullOrderData: true,
    _orderData: order  // Pełne dane zlecenia na wszelki wypadek
  };
};

// Pomocnicze funkcje
const mapOrderStatusToVisitStatus = (orderStatus) => {
  const statusMap = {
    'new': 'scheduled',
    'assigned': 'scheduled',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'paused'
  };
  return statusMap[orderStatus] || 'scheduled';
};

const getVisitTypeLabel = (type) => {
  const labels = {
    'diagnosis': 'Diagnoza',
    'repair': 'Naprawa',
    'control': 'Kontrola',
    'installation': 'Instalacja',
    'maintenance': 'Konserwacja'
  };
  return labels[type] || 'Wizyta';
};

const getVisitStatusLabel = (status) => {
  const labels = {
    'scheduled': 'Zaplanowana',
    'on_way': 'W drodze',
    'in_progress': 'W trakcie',
    'paused': 'Wstrzymana',
    'completed': 'Zakończona',
    'cancelled': 'Anulowana',
    'rescheduled': 'Przełożona'
  };
  return labels[status] || 'Nieznany';
};

const calculateTotalTime = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  return sessions.reduce((total, session) => {
    if (session.duration) {
      return total + session.duration;
    }
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return total + Math.floor((end - start) / 60000); // minuty
    }
    return total;
  }, 0);
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.'
    });
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

  try {
    // Pobierz visitId z query
    const { visitId } = req.query;

    if (!visitId) {
      return res.status(400).json({
        success: false,
        message: 'visitId parameter is required'
      });
    }

    logger.debug(`🔍 Szukam wizyty ${visitId} dla pracownika ${employeeId}`);

    // Znajdź wizytę
    const visitData = findVisitById(visitId);

    if (!visitData) {
      return res.status(404).json({
        success: false,
        message: `Visit ${visitId} not found`
      });
    }

    // Sprawdź czy wizyta jest przypisana do tego pracownika
    const visit = visitData.visit;
    const order = visitData.order;
    
    const isAssigned = visit 
      ? (visit.assignedTo === employeeId || visit.technicianId === employeeId)
      : (order.assignedTo === employeeId || order.technicianId === employeeId);

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'This visit is not assigned to you'
      });
    }

    // Buduj pełne szczegóły
    const fullDetails = buildVisitDetails(visitData);

    logger.success(`✅ Zwracam szczegóły wizyty ${visitId}`);

    return res.status(200).json({
      success: true,
      message: 'Visit details retrieved successfully',
      visit: fullDetails,
      employeeId
    });

  } catch (error) {
    logger.error('❌ Error fetching visit details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
