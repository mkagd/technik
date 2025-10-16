// pages/api/technician/visits.js
// 📅 API dla pobierania wizyt pracownika z systemu Enhanced v4.0

import { getServiceSupabase } from '../../../lib/supabase';
import { getTechnicianId, statusToUI } from '../../../utils/fieldMapping';
import { logger } from '../../../utils/logger';

// ===========================
// HELPER FUNCTIONS
// ===========================

// Waliduj token i zwróć employeeId (sprawdza sesje w Supabase)
const validateToken = async (token) => {
  const supabase = getServiceSupabase();
  
  // Sprawdź sesje w tabeli sessions (is_valid = true)
  const { data: session, error } = await supabase
    .from('sessions')
    .select('employee_id, is_valid')
    .eq('token', token)
    .eq('is_valid', true)
    .single();
  
  if (error || !session) {
    logger.debug('❌ Invalid or expired token');
    return null;
  }
  
  logger.debug(`✅ Valid token for employee ${session.employee_id}`);
  return session.employee_id;
};

// Wyciągnij wizyty z bazy danych (używamy tabeli visits)
const getEmployeeVisits = async (employeeId, filters = {}) => {
  const supabase = getServiceSupabase();
  
  let query = supabase
    .from('visits')
    .select(`
      *,
      order:orders(
        order_number,
        client_name,
        phone,
        email,
        address,
        city,
        device_type,
        brand,
        model,
        serial_number,
        problem_description,
        symptoms,
        priority,
        source,
        metadata
      )
    `)
    .eq('employee_id', employeeId);
  
  // Filtrowanie po dacie
  if (filters.date) {
    query = query.eq('scheduled_date', filters.date);
  } else if (filters.period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    query = query.eq('scheduled_date', today);
  } else if (filters.period === 'week') {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    query = query
      .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
      .lt('scheduled_date', endOfWeek.toISOString().split('T')[0]);
  } else if (filters.period === 'month') {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    query = query
      .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
      .lte('scheduled_date', endOfMonth.toISOString().split('T')[0]);
  }
  
  // Filtrowanie po statusie
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  // Filtrowanie po typie
  if (filters.type) {
    query = query.eq('visit_type', filters.type);
  }
  
  // Wykluczenie zakończonych
  if (filters.includeCompleted === 'false') {
    query = query.not('status', 'in', '(completed,cancelled)');
  }
  
  // Sortowanie po dacie i czasie
  query = query.order('scheduled_date', { ascending: true });
  
  const { data: visits, error } = await query;
  
  if (error) {
    logger.error('❌ Error fetching visits:', error);
    throw error;
  }
  
  // Transformuj wizyty do formatu API
  return visits.map(visit => transformVisitToAPI(visit));
};

// Transformuj wizytę z Supabase do formatu API
const transformVisitToAPI = (visit) => {
  const order = visit.order || {};
  
  return {
    visitId: visit.id,
    orderNumber: order.order_number,
    orderId: visit.order_id,
    
    // Typ wizyty
    type: visit.visit_type,
    typeLabel: getVisitTypeLabel(visit.visit_type),
    
    // Status wizyty
    status: visit.status,
    statusLabel: getVisitStatusLabel(visit.status),
    
    // Data i czas
    date: visit.scheduled_date,
    time: visit.scheduled_date ? new Date(visit.scheduled_date).toTimeString().slice(0, 5) : '09:00',
    scheduledDate: visit.scheduled_date,
    
    // Przypisanie
    technicianId: visit.employee_id,
    
    // Dane klienta (z order)
    clientId: order.client_id,
    clientName: order.client_name || order.metadata?.clientName,
    clientPhone: order.phone || order.metadata?.phone,
    clientEmail: order.email || order.metadata?.email,
    address: order.address || order.metadata?.address,
    city: order.city,
    
    // Dane urządzenia (z order)
    device: order.metadata?.device || `${order.brand || ''} ${order.model || ''}`.trim(),
    deviceType: order.device_type,
    brand: order.brand,
    model: order.model,
    serialNumber: order.serial_number,
    
    // AGD Specific (z metadata)
    warrantyStatus: order.metadata?.agdSpecific?.warrantyStatus,
    isBuiltIn: order.metadata?.builtInParams?.isBuiltIn || false,
    builtInType: order.metadata?.builtInParams?.type,
    
    // Problem i diagnoza
    problemDescription: order.problem_description,
    symptoms: order.symptoms || order.metadata?.symptoms || [],
    diagnosis: visit.diagnosis,
    
    // Części i koszty
    partsUsed: visit.parts_used || [],
    estimatedCost: visit.estimated_cost,
    totalCost: visit.total_cost,
    
    // Czas i priorytet
    estimatedDuration: visit.duration_minutes || order.metadata?.estimatedDuration || 120,
    actualDuration: visit.actual_duration_minutes,
    priority: order.priority || 'medium',
    
    // Notatki
    technicianNotes: visit.notes || '',
    internalNotes: order.metadata?.internalNotes,
    
    // Zdjęcia (z metadata)
    photos: order.metadata?.photos || [],
    beforePhotos: visit.metadata?.beforePhotos || order.metadata?.beforePhotos || [],
    duringPhotos: visit.metadata?.duringPhotos || order.metadata?.duringPhotos || [],
    afterPhotos: visit.metadata?.afterPhotos || order.metadata?.afterPhotos || [],
    completionPhotos: visit.metadata?.completionPhotos || order.metadata?.completionPhotos || [],
    problemPhotos: visit.metadata?.problemPhotos || order.metadata?.problemPhotos || [],
    partPhotos: visit.metadata?.partPhotos || order.metadata?.partPhotos || [],
    allPhotos: order.metadata?.allPhotos || [],
    
    // Tracking
    startTime: visit.started_at,
    endTime: visit.completed_at,
    workSessions: visit.metadata?.workSessions || [],
    
    // Metadane
    createdAt: visit.created_at,
    completedAt: visit.completed_at,
    source: order.source,
    
    // Pełne dane zlecenia
    _orderData: order
  };
};

// Wyciągnij wszystkie wizyty ze zlecenia (LEGACY - dla kompatybilności)
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

export default async function handler(req, res) {
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

  const employeeId = await validateToken(token);
  
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

    // Pobierz wizyty pracownika z Supabase
    const employeeVisits = await getEmployeeVisits(employeeId, {
      date,
      period,
      status,
      type,
      includeCompleted
    });

    logger.debug(`📊 Znaleziono ${employeeVisits.length} wizyt dla pracownika ${employeeId}`);

    // Przygotuj statystyki
    const stats = {
      total: employeeVisits.length,
      today: employeeVisits.filter(v => isToday(v.date)).length,
      thisWeek: employeeVisits.filter(v => isThisWeek(v.date)).length,
      byStatus: {
        pending: employeeVisits.filter(v => v.status === 'pending').length,
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
