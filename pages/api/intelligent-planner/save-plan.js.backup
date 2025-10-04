// pages/api/intelligent-planner/save-plan.js
// 💾 API endpoint do zapisywania planu tygodniowego
// Automatycznie tworzy wizyty w systemie na podstawie wygenerowanego planu

import fs from 'fs';
import path from 'path';
const { suggestVisitDuration } = require('../../../utils/repairTimeCalculator');

// Pomocnicza funkcja do ładowania orders.json
const loadOrders = () => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'orders.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    return [];
  }
};

// Pomocnicza funkcja do ładowania employees.json
const loadEmployees = () => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'employees.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading employees:', error);
    return [];
  }
};

// Pomocnicza funkcja do zapisywania orders.json
const saveOrders = (orders) => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'orders.json');
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error saving orders:', error);
    return false;
  }
};

// Funkcja do konwersji dnia tygodnia na datę
const getDayDate = (dayKey, weekStart) => {
  const dayOffsets = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
  };
  
  const offset = dayOffsets[dayKey.toLowerCase()] || 0;
  const date = new Date(weekStart || Date.now());
  date.setDate(date.getDate() - date.getDay() + 1 + offset); // Poniedziałek jako start
  return date.toISOString().split('T')[0];
};

// Funkcja do tworzenia lub aktualizacji wizyty
const createOrUpdateVisit = (order, visitData, employee = null) => {
  const visitId = visitData.visitId || `VIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Oblicz inteligentnie szacowany czas naprawy
  let estimatedDuration = visitData.estimatedDuration;
  
  // Jeśli nie ma czasu, spróbuj go obliczyć
  if (!estimatedDuration || estimatedDuration === 60) {
    try {
      estimatedDuration = suggestVisitDuration(order, employee);
      console.log(`🧮 Obliczony czas naprawy: ${estimatedDuration} min dla zlecenia ${order.orderNumber}`);
    } catch (error) {
      console.warn('⚠️ Błąd obliczania czasu, używam domyślnego 60 min:', error.message);
      estimatedDuration = order.estimatedDuration || 60;
    }
  }
  
  const visit = {
    visitId: visitId,
    id: visitId,
    visitNumber: order.visits?.length + 1 || 1,
    type: visitData.type || 'diagnosis',
    scheduledDate: visitData.scheduledDate,
    scheduledTime: visitData.scheduledTime || '09:00',
    estimatedDuration: estimatedDuration,
    status: visitData.status || 'scheduled',
    employeeId: visitData.employeeId,
    employeeName: visitData.employeeName || 'Serwisant',
    technicianId: visitData.employeeId,
    technicianName: visitData.employeeName || 'Serwisant',
    servicemanId: visitData.employeeId,
    notes: visitData.notes || '',
    autoAssigned: true,
    assignedBy: 'Intelligent Planner',
    assignedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    
    // Dodatkowe metadata
    plannedRoute: visitData.plannedRoute || null,
    estimatedArrivalTime: visitData.estimatedArrivalTime || null,
    estimatedDepartureTime: visitData.estimatedDepartureTime || null,
    travelTimeFromPrevious: visitData.travelTimeFromPrevious || null
  };
  
  return visit;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { servicemanId, servicemanName, weeklyPlan, weekStart } = req.body;
    
    if (!servicemanId || !weeklyPlan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'servicemanId and weeklyPlan are required'
      });
    }
    
    console.log('💾 Saving weekly plan for serviceman:', servicemanId);
    console.log('📅 Week start:', weekStart);
    console.log('📊 Days in plan:', Object.keys(weeklyPlan).length);
    
    // Pobierz wszystkie zlecenia i pracowników
    const orders = loadOrders();
    const employees = loadEmployees();
    const currentEmployee = employees.find(emp => emp.id === servicemanId);
    
    if (!currentEmployee) {
      console.warn(`⚠️ Employee not found: ${servicemanId}, continuing without employee-specific times`);
    } else {
      console.log(`👨‍🔧 Found employee: ${currentEmployee.name}`);
    }
    
    let updatedOrdersCount = 0;
    let createdVisitsCount = 0;
    const createdVisits = [];
    
    // Przetwórz każdy dzień w planie
    for (const [dayKey, dayPlan] of Object.entries(weeklyPlan)) {
      if (!dayPlan.orders || dayPlan.orders.length === 0) {
        console.log(`⏭️ Skipping ${dayKey} - no orders`);
        continue;
      }
      
      const dayDate = getDayDate(dayKey, weekStart);
      console.log(`📅 Processing ${dayKey} (${dayDate}): ${dayPlan.orders.length} orders`);
      
      // Przetwórz każde zlecenie w tym dniu
      for (let orderIndex = 0; orderIndex < dayPlan.orders.length; orderIndex++) {
        const planOrder = dayPlan.orders[orderIndex];
        
        // Znajdź zlecenie w bazie
        const orderInDb = orders.find(o => o.id === planOrder.id);
        
        if (!orderInDb) {
          console.warn(`⚠️ Order not found in database: ${planOrder.id}`);
          continue;
        }
        
        // Oblicz szacowane czasy przyjazdu/wyjazdu (jeśli są dostępne)
        let estimatedArrivalTime = null;
        let estimatedDepartureTime = null;
        let travelTimeFromPrevious = null;
        
        if (planOrder.assignedTimeSlot) {
          estimatedArrivalTime = planOrder.assignedTimeSlot.start;
          estimatedDepartureTime = planOrder.assignedTimeSlot.end;
        }
        
        if (planOrder.travelTime) {
          travelTimeFromPrevious = planOrder.travelTime;
        }
        
        // Sprawdź czy wizyta już istnieje
        const existingVisitIndex = orderInDb.visits?.findIndex(v => 
          v.employeeId === servicemanId &&
          v.scheduledDate === dayDate &&
          v.status !== 'completed' &&
          v.status !== 'cancelled'
        );
        
        if (existingVisitIndex !== undefined && existingVisitIndex >= 0) {
          // Aktualizuj istniejącą wizytę
          console.log(`🔄 Updating existing visit for order ${planOrder.id}`);
          orderInDb.visits[existingVisitIndex].scheduledTime = planOrder.assignedTimeSlot?.start || '09:00';
          orderInDb.visits[existingVisitIndex].estimatedDuration = planOrder.estimatedDuration || 60;
          orderInDb.visits[existingVisitIndex].estimatedArrivalTime = estimatedArrivalTime;
          orderInDb.visits[existingVisitIndex].estimatedDepartureTime = estimatedDepartureTime;
          orderInDb.visits[existingVisitIndex].travelTimeFromPrevious = travelTimeFromPrevious;
          orderInDb.visits[existingVisitIndex].updatedAt = new Date().toISOString();
          orderInDb.visits[existingVisitIndex].updatedBy = 'Intelligent Planner';
        } else {
          // Utwórz nową wizytę
          console.log(`✅ Creating new visit for order ${planOrder.id}`);
          
          const newVisit = createOrUpdateVisit(orderInDb, {
            employeeId: servicemanId,
            employeeName: servicemanName || currentEmployee?.name || 'Serwisant',
            scheduledDate: dayDate,
            scheduledTime: planOrder.assignedTimeSlot?.start || '09:00',
            estimatedDuration: planOrder.estimatedDuration || 60,
            type: 'diagnosis',
            status: 'scheduled',
            notes: `Automatycznie przydzielone przez Intelligent Planner - ${dayKey} ${dayDate}`,
            estimatedArrivalTime,
            estimatedDepartureTime,
            travelTimeFromPrevious
          }, currentEmployee);
          
          if (!orderInDb.visits) {
            orderInDb.visits = [];
          }
          
          orderInDb.visits.push(newVisit);
          createdVisits.push({
            orderId: orderInDb.id,
            orderNumber: orderInDb.orderNumber,
            visitId: newVisit.visitId,
            day: dayKey,
            date: dayDate,
            time: newVisit.scheduledTime
          });
          
          createdVisitsCount++;
        }
        
        // Zaktualizuj status zlecenia jeśli trzeba
        if (orderInDb.status === 'pending' || orderInDb.status === 'new') {
          orderInDb.status = 'scheduled';
        }
        
        updatedOrdersCount++;
      }
    }
    
    // Zapisz zaktualizowane zlecenia
    const saved = saveOrders(orders);
    
    if (!saved) {
      throw new Error('Failed to save orders to database');
    }
    
    console.log(`✅ Plan saved successfully:`);
    console.log(`   - Updated orders: ${updatedOrdersCount}`);
    console.log(`   - Created visits: ${createdVisitsCount}`);
    
    return res.status(200).json({
      success: true,
      message: 'Plan zapisany pomyślnie',
      data: {
        updatedOrdersCount,
        createdVisitsCount,
        createdVisits,
        servicemanId,
        weekStart: weekStart || 'current',
        savedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save plan',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
