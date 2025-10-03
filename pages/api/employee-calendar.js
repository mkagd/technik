// pages/api/employee-calendar.js
// 🗓️ API dla zarządzania kalendarzami pracowników - 15-minutowe sloty
// ✅ Real-time aktualizacje kalendarzy
// ✅ Sprawdzanie dostępności
// ✅ Automatyczne generowanie slotów na podstawie workingHours

import fs from 'fs';
import path from 'path';

const SCHEDULES_FILE = path.join(process.cwd(), 'data', 'employee-schedules.json');
const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

// Pomocnicze funkcje do odczytu/zapisu
const readSchedules = () => {
  try {
    const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu employee-schedules.json:', error);
    return { schedules: {}, employeePreferences: {}, systemSettings: {}, metadata: {} };
  }
};

const writeSchedules = (data) => {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Błąd zapisu employee-schedules.json:', error);
    return false;
  }
};

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu employees.json:', error);
    return [];
  }
};

// Automatyczne generowanie slotów 15-minutowych na podstawie workingHours
const generateTimeSlotsFromWorkingHours = (workingHours, employeeId, date) => {
  const slots = [];
  
  if (!workingHours || !workingHours.includes('-')) {
    console.warn(`⚠️ Nieprawidłowe workingHours dla ${employeeId}: ${workingHours}`);
    return slots;
  }
  
  const [startTime, endTime] = workingHours.split('-');
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  // Generuj sloty co 15 minut
  for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    slots.push({
      time: timeString,
      status: 'available',
      duration: 15,
      activity: null,
      location: null,
      canBeModified: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    });
  }
  
  return slots;
};

// Obliczanie statystyk harmonogramu
const calculateScheduleStatistics = (timeSlots) => {
  const stats = {
    totalAvailableMinutes: 0,
    usedMinutes: 0,
    availableMinutes: 0,
    breaksMinutes: 0,
    travelMinutes: 0,
    totalSlots: timeSlots.length,
    availableSlots: 0,
    busySlots: 0,
    breakSlots: 0,
    travelSlots: 0
  };
  
  timeSlots.forEach(slot => {
    switch (slot.status) {
      case 'available':
        stats.availableMinutes += slot.duration;
        stats.availableSlots++;
        break;
      case 'busy':
        stats.usedMinutes += slot.duration;
        stats.busySlots++;
        break;
      case 'break':
        stats.breaksMinutes += slot.duration;
        stats.breakSlots++;
        break;
      case 'travel':
        stats.travelMinutes += slot.duration;
        stats.travelSlots++;
        break;
    }
    stats.totalAvailableMinutes += slot.duration;
  });
  
  stats.utilizationPercentage = stats.totalAvailableMinutes > 0 
    ? Math.round((stats.usedMinutes / stats.totalAvailableMinutes) * 100)
    : 0;
  
  return stats;
};

export default async function handler(req, res) {
  const { method, query, body } = req;
  
  console.log(`📅 Employee Calendar API: ${method} ${req.url}`);
  
  try {
    switch (method) {
      case 'GET':
        if (query.action === 'get-schedule') {
          return await getEmployeeSchedule(req, res);
        }
        if (query.action === 'check-availability') {
          return await checkAvailability(req, res);
        }
        if (query.action === 'get-all-schedules') {
          return await getAllSchedules(req, res);
        }
        break;
        
      case 'POST':
        if (body.action === 'update-schedule') {
          return await updateEmployeeSchedule(req, res);
        }
        if (body.action === 'reserve-slot') {
          return await reserveTimeSlot(req, res);
        }
        if (body.action === 'generate-schedule') {
          return await generateEmployeeSchedule(req, res);
        }
        break;
        
      case 'PUT':
        return await modifyTimeSlot(req, res);
        
      case 'DELETE':
        return await releaseTimeSlot(req, res);
        
      default:
        return res.status(405).json({
          success: false,
          message: `Metoda ${method} nie jest obsługiwana`
        });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Brak lub nieprawidłowa akcja'
    });
    
  } catch (error) {
    console.error('❌ Błąd Employee Calendar API:', error);
    return res.status(500).json({
      success: false,
      message: 'Wewnętrzny błąd serwera',
      error: error.message
    });
  }
}

// ==========================================
// IMPLEMENTACJE FUNKCJI
// ==========================================

// Pobierz harmonogram pracownika
async function getEmployeeSchedule(req, res) {
  const { employeeId, date } = req.query;
  
  if (!employeeId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Wymagane parametry: employeeId, date'
    });
  }
  
  const schedulesData = readSchedules();
  const schedule = schedulesData.schedules[date]?.[employeeId];
  
  if (!schedule) {
    // Jeśli brak harmonogramu, wygeneruj automatycznie
    const employees = readEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Pracownik nie znaleziony'
      });
    }
    
    // Wygeneruj nowy harmonogram
    const newSchedule = {
      employeeId,
      employeeName: employee.name,
      date,
      workingHours: employee.workingHours || '8:00-16:00',
      timeSlots: generateTimeSlotsFromWorkingHours(employee.workingHours || '8:00-16:00', employeeId, date),
      dailyNotes: '',
      emergencyAvailable: true,
      maxOvertimeToday: 60,
      currentOvertimeUsed: 0,
      lastSyncWithEmployee: new Date().toISOString(),
      version: 1
    };
    
    newSchedule.statistics = calculateScheduleStatistics(newSchedule.timeSlots);
    
    // Zapisz nowy harmonogram
    if (!schedulesData.schedules[date]) {
      schedulesData.schedules[date] = {};
    }
    schedulesData.schedules[date][employeeId] = newSchedule;
    writeSchedules(schedulesData);
    
    return res.json({
      success: true,
      schedule: newSchedule,
      message: 'Harmonogram automatycznie wygenerowany'
    });
  }
  
  return res.json({
    success: true,
    schedule
  });
}

// Sprawdź dostępność pracownika
async function checkAvailability(req, res) {
  const { employeeId, date, duration = 60 } = req.query;
  
  if (!employeeId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Wymagane parametry: employeeId, date'
    });
  }
  
  const schedulesData = readSchedules();
  const schedule = schedulesData.schedules[date]?.[employeeId];
  
  if (!schedule) {
    return res.json({
      success: true,
      isAvailable: false,
      availableSlots: [],
      message: 'Brak harmonogramu dla tego dnia'
    });
  }
  
  // Znajdź dostępne sloty
  const availableSlots = [];
  const requiredSlots = Math.ceil(parseInt(duration) / 15); // Ile slotów 15-min potrzeba
  
  for (let i = 0; i <= schedule.timeSlots.length - requiredSlots; i++) {
    const slotsGroup = schedule.timeSlots.slice(i, i + requiredSlots);
    const allAvailable = slotsGroup.every(slot => slot.status === 'available');
    
    if (allAvailable) {
      availableSlots.push({
        startTime: slotsGroup[0].time,
        endTime: slotsGroup[slotsGroup.length - 1].time,
        duration: requiredSlots * 15,
        date
      });
    }
  }
  
  const nextAvailableSlot = availableSlots[0] || null;
  
  return res.json({
    success: true,
    isAvailable: availableSlots.length > 0,
    availableSlots,
    nextAvailableSlot,
    utilizationPercentage: schedule.statistics?.utilizationPercentage || 0,
    totalSlotsNeeded: requiredSlots
  });
}

// Pobierz wszystkie harmonogramy (dla panelu przydziału)
async function getAllSchedules(req, res) {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Wymagany parametr: date'
    });
  }
  
  const schedulesData = readSchedules();
  const employees = readEmployees();
  const daySchedules = schedulesData.schedules[date] || {};
  
  // Dodaj informacje o pracownikach
  const enrichedSchedules = {};
  
  employees.forEach(employee => {
    if (!employee.isActive) return;
    
    let schedule = daySchedules[employee.id];
    
    // Jeśli brak harmonogramu, wygeneruj podstawowy
    if (!schedule) {
      schedule = {
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        workingHours: employee.workingHours || '8:00-16:00',
        timeSlots: generateTimeSlotsFromWorkingHours(employee.workingHours || '8:00-16:00', employee.id, date),
        dailyNotes: '',
        emergencyAvailable: true,
        maxOvertimeToday: 60,
        currentOvertimeUsed: 0,
        lastSyncWithEmployee: new Date().toISOString(),
        version: 1
      };
      
      schedule.statistics = calculateScheduleStatistics(schedule.timeSlots);
    }
    
    enrichedSchedules[employee.id] = {
      ...schedule,
      employeeInfo: {
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        specializations: employee.specializations || [],
        region: employee.address,
        rating: employee.rating
      }
    };
  });
  
  return res.json({
    success: true,
    schedules: enrichedSchedules,
    date,
    totalEmployees: Object.keys(enrichedSchedules).length
  });
}

// Aktualizuj harmonogram pracownika
async function updateEmployeeSchedule(req, res) {
  const { employeeId, date, timeSlots, updatedBy = 'employee', version } = req.body;
  
  if (!employeeId || !date || !timeSlots) {
    return res.status(400).json({
      success: false,
      message: 'Wymagane parametry: employeeId, date, timeSlots'
    });
  }
  
  const schedulesData = readSchedules();
  
  // Pobierz obecny harmonogram
  if (!schedulesData.schedules[date]) {
    schedulesData.schedules[date] = {};
  }
  
  const currentSchedule = schedulesData.schedules[date][employeeId] || {
    employeeId,
    date,
    timeSlots: [],
    version: 0
  };
  
  // Sprawdź konflikty wersji (optimistic locking)
  if (version && version !== currentSchedule.version) {
    return res.status(409).json({
      success: false,
      message: 'Konflikt wersji - ktoś inny już zmodyfikował harmonogram',
      currentVersion: currentSchedule.version
    });
  }
  
  // Walidacja - sprawdź czy pracownik może modyfikować te sloty
  const validatedSlots = timeSlots.map(slot => {
    if (slot.canBeModified || updatedBy === 'admin') {
      return {
        ...slot,
        lastUpdated: new Date().toISOString(),
        updatedBy
      };
    }
    // Jeśli nie może modyfikować, zachowaj stary slot
    const oldSlot = currentSchedule.timeSlots.find(s => s.time === slot.time);
    return oldSlot || slot;
  });
  
  // Aktualizuj harmonogram
  const updatedSchedule = {
    ...currentSchedule,
    timeSlots: validatedSlots,
    lastSyncWithEmployee: new Date().toISOString(),
    version: currentSchedule.version + 1
  };
  
  // Przelicz statystyki
  updatedSchedule.statistics = calculateScheduleStatistics(validatedSlots);
  
  schedulesData.schedules[date][employeeId] = updatedSchedule;
  schedulesData.metadata.lastUpdated = new Date().toISOString();
  
  // Zapisz do pliku
  if (writeSchedules(schedulesData)) {
    console.log(`✅ Harmonogram zaktualizowany: ${employeeId} na ${date}`);
    
    return res.json({
      success: true,
      schedule: updatedSchedule,
      message: 'Harmonogram zaktualizowany'
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Błąd zapisu harmonogramu'
    });
  }
}

// Zarezerwuj slot czasowy (dla systemu przydziału)
async function reserveTimeSlot(req, res) {
  const { employeeId, date, startTime, duration, activity, orderId, visitId } = req.body;
  
  if (!employeeId || !date || !startTime || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Wymagane parametry: employeeId, date, startTime, duration'
    });
  }
  
  const schedulesData = readSchedules();
  
  if (!schedulesData.schedules[date]?.[employeeId]) {
    return res.status(404).json({
      success: false,
      message: 'Brak harmonogramu dla tego pracownika i daty'
    });
  }
  
  const schedule = schedulesData.schedules[date][employeeId];
  const requiredSlots = Math.ceil(duration / 15);
  
  // Znajdź index slotu startowego
  const startIndex = schedule.timeSlots.findIndex(slot => slot.time === startTime);
  
  if (startIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'Nie znaleziono slotu startowego'
    });
  }
  
  // Sprawdź czy wszystkie wymagane sloty są dostępne
  for (let i = startIndex; i < startIndex + requiredSlots; i++) {
    if (i >= schedule.timeSlots.length || schedule.timeSlots[i].status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Nie wszystkie wymagane sloty są dostępne'
      });
    }
  }
  
  // Zarezerwuj sloty
  for (let i = startIndex; i < startIndex + requiredSlots; i++) {
    schedule.timeSlots[i] = {
      ...schedule.timeSlots[i],
      status: 'busy',
      activity,
      orderId,
      visitId,
      canBeModified: false,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
  
  schedule.statistics = calculateScheduleStatistics(schedule.timeSlots);
  schedule.version++;
  
  if (writeSchedules(schedulesData)) {
    return res.json({
      success: true,
      message: 'Slot zarezerwowany',
      reservedSlots: requiredSlots,
      schedule
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Błąd zapisu rezerwacji'
    });
  }
}

// Wygeneruj harmonogram dla pracownika (na podstawie workingHours)
async function generateEmployeeSchedule(req, res) {
  const { employeeId, date } = req.body;
  
  if (!employeeId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Wymagane parametry: employeeId, date'
    });
  }
  
  const employees = readEmployees();
  const employee = employees.find(emp => emp.id === employeeId);
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Pracownik nie znaleziony'
    });
  }
  
  const schedulesData = readSchedules();
  
  const newSchedule = {
    employeeId,
    employeeName: employee.name,
    date,
    workingHours: employee.workingHours || '8:00-16:00',
    timeSlots: generateTimeSlotsFromWorkingHours(employee.workingHours || '8:00-16:00', employeeId, date),
    dailyNotes: '',
    emergencyAvailable: true,
    maxOvertimeToday: 60,
    currentOvertimeUsed: 0,
    lastSyncWithEmployee: new Date().toISOString(),
    version: 1
  };
  
  newSchedule.statistics = calculateScheduleStatistics(newSchedule.timeSlots);
  
  // Zapisz nowy harmonogram
  if (!schedulesData.schedules[date]) {
    schedulesData.schedules[date] = {};
  }
  schedulesData.schedules[date][employeeId] = newSchedule;
  schedulesData.metadata.lastUpdated = new Date().toISOString();
  
  if (writeSchedules(schedulesData)) {
    return res.json({
      success: true,
      schedule: newSchedule,
      message: 'Harmonogram wygenerowany'
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Błąd zapisu harmonogramu'
    });
  }
}