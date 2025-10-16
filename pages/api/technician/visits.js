// pages/api/technician/visits.js
// 📅 API dla pobierania wizyt pracownika z systemu Enhanced v4.0

import fs from 'fs';
import path from 'path';
import { getTechnicianId, statusToUI } from '../../../utils/fieldMapping';
import { logger } from '../../../utils/logger';

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

// Waliduj token i zwróć employeeId (multi-auth: technician-sessions + employee-sessions)
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

// Wyciągnij wszystkie wizyty ze zlecenia
const extractVisitsFromOrder = (order) => {
  const visits = [];
  
  // Sprawdź czy zlecenie ma system wizyt (visits array)
  if (order.visits && Array.isArray(order.visits)) {
    // NOWY SYSTEM WIZYT - Enhanced v4.0
    order.visits.forEach(visit => {
      visits.push({
        visitId: visit.visitId,
        orderNumber: order.orderNumber,
        orderId: order.id,
        
        // Typ wizyty
        type: visit.type, // diagnosis, repair, control, installation
        typeLabel: getVisitTypeLabel(visit.type),
        
        // Status wizyty
        status: visit.status,
        statusLabel: getVisitStatusLabel(visit.status),
        
        // Data i czas
        date: visit.date,
        time: visit.time || visit.scheduledTime || '09:00',
        scheduledDate: visit.scheduledDate || visit.date,
        
        // Przypisanie (używamy uniwersalnego gettera)
        technicianId: getTechnicianId(visit) || getTechnicianId(order),
        
        // Dane klienta
        clientId: order.clientId,
        clientName: order.clientName || order.customerName,
        clientPhone: order.clientPhone || order.phone,
        clientEmail: order.clientEmail || order.email,
        address: order.address || order.clientAddress,
        city: order.city,
        
        // Dane urządzenia
        device: order.device || `${order.brand || ''} ${order.model || ''}`.trim(),
        deviceType: order.deviceType || order.category,
        brand: order.brand,
        model: order.model,
        serialNumber: order.serialNumber,
        
        // AGD Specific
        warrantyStatus: order.agdSpecific?.warrantyStatus,
        isBuiltIn: order.builtInParams?.isBuiltIn || false,
        builtInType: order.builtInParams?.type,
        
        // Problem i diagnoza
        problemDescription: order.problemDescription || order.description,
        symptoms: order.symptoms || [],
        diagnosis: visit.diagnosis || order.diagnosis,
        
        // Części i koszty
        partsUsed: visit.partsUsed || [],
        estimatedCost: visit.estimatedCost || order.estimatedCost,
        totalCost: visit.totalCost,
        
        // Czas i prioritet
        estimatedDuration: visit.estimatedDuration || order.estimatedDuration || 120,
        actualDuration: visit.actualDuration,
        priority: visit.priority || order.priority || 'medium',
        
        // Notatki
        technicianNotes: visit.technicianNotes || '',
        internalNotes: visit.internalNotes || order.internalNotes,
        
        // Zdjęcia - wszystkie kategorie
        photos: order.photos || [], // Główne zdjęcia od klienta
        beforePhotos: visit.beforePhotos || order.beforePhotos || [],
        duringPhotos: visit.duringPhotos || order.duringPhotos || [],
        afterPhotos: visit.afterPhotos || order.afterPhotos || [],
        completionPhotos: visit.completionPhotos || order.completionPhotos || [],
        problemPhotos: visit.problemPhotos || order.problemPhotos || [],
        partPhotos: visit.partPhotos || order.partPhotos || [],
        allPhotos: order.allPhotos || [], // Wszystkie zdjęcia (agregat)
        
        // Tracking
        startTime: visit.startTime,
        endTime: visit.endTime,
        workSessions: visit.workSessions || [],
        
        // Metadane
        createdAt: visit.createdAt || order.createdAt,
        completedAt: visit.completedAt,
        source: order.source,
        
        // Pełne dane zlecenia (do szczegółów)
        _orderData: order
      });
    });
  } else {
    // STARY SYSTEM - Jedno zlecenie = Jedna wizyta
    // Tworzymy wirtualną wizytę z danych zlecenia
    visits.push({
      visitId: `VIS-${order.orderNumber}`, // Wirtualny ID
      orderNumber: order.orderNumber,
      orderId: order.id,
      
      type: 'repair', // Domyślny typ
      typeLabel: 'Naprawa',
      
      status: mapOrderStatusToVisitStatus(order.status),
      statusLabel: getVisitStatusLabel(mapOrderStatusToVisitStatus(order.status)),
      
      date: order.visitDate || order.plannedDate || order.createdDate,
      time: order.visitTime || order.time || '09:00',
      scheduledDate: order.visitDate || order.plannedDate,
      
      // Przypisanie (uniwersalny getter)
      technicianId: getTechnicianId(order),
      
      clientId: order.clientId,
      clientName: order.clientName || order.customerName,
      clientPhone: order.clientPhone || order.phone,
      clientEmail: order.clientEmail || order.email,
      address: order.address || order.clientAddress,
      city: order.city,
      
      device: order.device || `${order.brand || ''} ${order.model || ''}`.trim(),
      deviceType: order.deviceType || order.category,
      brand: order.brand,
      model: order.model,
      serialNumber: order.serialNumber,
      
      warrantyStatus: order.agdSpecific?.warrantyStatus,
      isBuiltIn: order.builtInParams?.isBuiltIn || false,
      
      problemDescription: order.problemDescription || order.description,
      symptoms: order.symptoms || [],
      diagnosis: order.diagnosis,
      
      partsUsed: order.partsUsed || [],
      estimatedCost: order.estimatedCost,
      totalCost: order.totalCost,
      
      estimatedDuration: order.estimatedDuration || 120,
      priority: order.priority || 'medium',
      
      technicianNotes: order.technicianNotes || '',
      internalNotes: order.internalNotes,
      
      // Zdjęcia - wszystkie kategorie
      photos: order.photos || [],
      beforePhotos: order.beforePhotos || [],
      duringPhotos: order.duringPhotos || [],
      afterPhotos: order.afterPhotos || [],
      completionPhotos: order.completionPhotos || [],
      problemPhotos: order.problemPhotos || [],
      partPhotos: order.partPhotos || [],
      allPhotos: order.allPhotos || [],
      
      workSessions: order.workSessions || [],
      
      createdAt: order.createdAt,
      source: order.source,
      
      _isVirtualVisit: true,
      _orderData: order
    });
  }
  
  return visits;
};

// Mapuj status zlecenia na status wizyty
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

// Etykiety typów wizyt
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

// Etykiety statusów wizyt
const getVisitStatusLabel = (status) => {
  const labels = {
    'pending': 'Do zaplanowania', // Dodano: pending
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

// Sprawdź czy wizyta jest dziś
const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const visitDate = new Date(dateString);
  return today.toDateString() === visitDate.toDateString();
};

// Sprawdź czy wizyta jest w tym tygodniu
const isThisWeek = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const visitDate = new Date(dateString);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  return visitDate >= startOfWeek && visitDate < endOfWeek;
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
    // Pobierz parametry filtrowania
    const { 
      date,        // konkretna data (YYYY-MM-DD)
      period,      // 'today', 'week', 'month', 'all'
      status,      // filtruj po statusie
      type,        // filtruj po typie wizyty
      includeCompleted  // czy włączyć zakończone
    } = req.query;

    // Wczytaj wszystkie zlecenia
    const allOrders = readOrders();
    
    // Wyciągnij wszystkie wizyty ze wszystkich zleceń
    let allVisits = [];
    allOrders.forEach(order => {
      const orderVisits = extractVisitsFromOrder(order);
      allVisits = allVisits.concat(orderVisits);
    });

    // Filtruj wizyty przypisane do tego pracownika
    let employeeVisits = allVisits.filter(visit => {
      const isAssigned = visit.technicianId === employeeId;
      
      if (isAssigned) {
        logger.debug(`✅ Wizyta ${visit.visitId} przypisana do ${employeeId}:`, {
          technicianId: visit.technicianId,
          date: visit.date,
          status: visit.status
        });
      }
      
      return isAssigned;
    });

    logger.debug(`📊 Znaleziono ${employeeVisits.length} wizyt dla pracownika ${employeeId} z ${allVisits.length} wszystkich wizyt`);

    // Filtrowanie po dacie/okresie
    if (date) {
      employeeVisits = employeeVisits.filter(visit => 
        visit.date && visit.date.startsWith(date)
      );
    } else if (period === 'today') {
      employeeVisits = employeeVisits.filter(visit => isToday(visit.date));
    } else if (period === 'week') {
      employeeVisits = employeeVisits.filter(visit => isThisWeek(visit.date));
    } else if (period === 'month') {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      employeeVisits = employeeVisits.filter(visit => 
        visit.date && visit.date.startsWith(currentMonth)
      );
    }

    // Filtrowanie po statusie
    if (status) {
      employeeVisits = employeeVisits.filter(visit => visit.status === status);
    }

    // Filtrowanie po typie
    if (type) {
      employeeVisits = employeeVisits.filter(visit => visit.type === type);
    }

    // Czy wykluczyć zakończone?
    if (includeCompleted === 'false') {
      employeeVisits = employeeVisits.filter(visit => 
        visit.status !== 'completed' && visit.status !== 'cancelled'
      );
    }

    // Sortuj po dacie i czasie
    employeeVisits.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

    // Przygotuj statystyki
    const stats = {
      total: employeeVisits.length,
      today: employeeVisits.filter(v => isToday(v.date)).length,
      thisWeek: employeeVisits.filter(v => isThisWeek(v.date)).length,
      byStatus: {
        pending: employeeVisits.filter(v => v.status === 'pending').length, // Dodano: pending
        scheduled: employeeVisits.filter(v => v.status === 'scheduled').length,
        on_way: employeeVisits.filter(v => v.status === 'on_way').length,
        in_progress: employeeVisits.filter(v => v.status === 'in_progress').length,
        paused: employeeVisits.filter(v => v.status === 'paused').length,
        completed: employeeVisits.filter(v => v.status === 'completed').length,
        cancelled: employeeVisits.filter(v => v.status === 'cancelled').length
      },
      byType: {
        diagnosis: employeeVisits.filter(v => v.type === 'diagnosis').length,
        repair: employeeVisits.filter(v => v.type === 'repair').length,
        control: employeeVisits.filter(v => v.type === 'control').length,
        installation: employeeVisits.filter(v => v.type === 'installation').length
      }
    };

    logger.success(`✅ Zwracam ${employeeVisits.length} wizyt dla pracownika ${employeeId}`);

    return res.status(200).json({
      success: true,
      message: `Found ${employeeVisits.length} visits`,
      employeeId,
      filters: {
        date: date || null,
        period: period || 'all',
        status: status || 'all',
        type: type || 'all'
      },
      visits: employeeVisits,
      stats,
      count: employeeVisits.length
    });

  } catch (error) {
    logger.error('❌ Error fetching visits:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
