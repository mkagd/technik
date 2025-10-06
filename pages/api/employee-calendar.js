// pages/api/employee-calendar.js
// 🗓️ API dla zarządzania kalendarzami pracowników - 15-minutowe sloty
// ✅ Real-time aktualizacje kalendarzy
// ✅ Sprawdzanie dostępności
// ✅ Automatyczne generowanie slotów na podstawie workingHours

import fs from 'fs';
import path from 'path';

const SCHEDULES_FILE = path.join(process.cwd(), 'data', 'employee-schedules.json');
const WORK_SCHEDULES_FILE = path.join(process.cwd(), 'data', 'work-schedules.json'); // ← NOWY: System A
const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

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

// ← NOWA FUNKCJA: Odczyt z work-schedules.json (System A)
const readWorkSchedules = () => {
  try {
    if (fs.existsSync(WORK_SCHEDULES_FILE)) {
      const data = fs.readFileSync(WORK_SCHEDULES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Błąd odczytu work-schedules.json:', error);
    return [];
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

const readOrders = () => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu orders.json:', error);
    return [];
  }
};

// ← NOWA FUNKCJA: Konwersja z work-schedules.json (tygodniowy) → dzienny format
const convertWorkScheduleToDaily = (employeeId, date) => {
  const workSchedules = readWorkSchedules();
  
  // Oblicz poniedziałek tygodnia dla danej daty
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0=niedziela, 1=pon, 2=wt...
  const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(targetDate);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split('T')[0];
  
  console.log(`🔄 Konwersja harmonogramu: employeeId=${employeeId}, date=${date}, weekStart=${weekStart}, dayOfWeek=${dayOfWeek}`);
  
  // Znajdź harmonogram dla tego pracownika i tygodnia
  const schedule = workSchedules.find(s => s.employeeId === employeeId && s.weekStart === weekStart);
  
  if (!schedule) {
    console.log(`⚠️ Brak harmonogramu w work-schedules.json dla ${employeeId} w tygodniu ${weekStart}`);
    return null;
  }
  
  // Znajdź sloty pracy dla tego dnia tygodnia
  const workSlotsForDay = schedule.workSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
  const breaksForDay = schedule.breaks.filter(slot => slot.dayOfWeek === dayOfWeek);
  
  if (workSlotsForDay.length === 0) {
    console.log(`⚠️ Brak workSlots dla dayOfWeek=${dayOfWeek} (${['Nd','Pn','Wt','Śr','Cz','Pt','Sb'][dayOfWeek]}) - zwracam PUSTY harmonogram (dzień wolny)`);
    // ✅ ZMIANA: Zwracamy pusty harmonogram zamiast null
    // To oznacza że serwisant świadomie NIE ustawił pracy na ten dzień
    return {
      employeeId,
      date,
      timeSlots: [], // Pusty = dzień wolny
      sourceSystem: 'work-schedules.json',
      workSlotsCount: 0,
      breaksCount: 0,
      isDayOff: true // Oznaczenie że to dzień wolny
    };
  }
  
  // Generuj 15-minutowe sloty
  const timeSlots = [];
  
  workSlotsForDay.forEach(workSlot => {
    const [startHour, startMinute] = workSlot.startTime.split(':').map(Number);
    const [endHour, endMinute] = workSlot.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Generuj sloty co 15 minut
    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      // Sprawdź czy ten slot jest w przerwie
      const isInBreak = breaksForDay.some(breakSlot => {
        const [bStartHour, bStartMinute] = breakSlot.startTime.split(':').map(Number);
        const [bEndHour, bEndMinute] = breakSlot.endTime.split(':').map(Number);
        const breakStart = bStartHour * 60 + bStartMinute;
        const breakEnd = bEndHour * 60 + bEndMinute;
        return minutes >= breakStart && minutes < breakEnd;
      });
      
      timeSlots.push({
        time: timeString,
        status: isInBreak ? 'break' : 'available',
        duration: 15,
        activity: isInBreak ? 'Przerwa' : null,
        location: null,
        canBeModified: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'work-schedule-system'
      });
    }
  });
  
  console.log(`✅ Wygenerowano ${timeSlots.length} slotów dla ${employeeId} na ${date}`);
  
  return {
    employeeId,
    date,
    timeSlots,
    sourceSystem: 'work-schedules.json',
    workSlotsCount: workSlotsForDay.length,
    breaksCount: breaksForDay.length
  };
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
  
  console.log(`📅 getEmployeeSchedule: employeeId=${employeeId}, date=${date}`);
  
  // ✅ PRIORYTET 1: Sprawdź work-schedules.json (System A - ustawiony przez technika)
  const workScheduleData = convertWorkScheduleToDaily(employeeId, date);
  
  // ✅ ZMIANA: Obsługujemy też puste harmonogramy (dzień wolny)
  if (workScheduleData) {
    const employees = readEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    
    const schedule = {
      employeeId,
      employeeName: employee?.name || 'Unknown',
      date,
      workingHours: workScheduleData.isDayOff ? 'day-off' : 'custom', // Oznacza że pochodzi z work-schedules.json
      timeSlots: workScheduleData.timeSlots,
      dailyNotes: workScheduleData.isDayOff 
        ? 'Dzień wolny (serwisant nie ustawił godzin pracy)'
        : `Harmonogram ustawiony przez technika (${workScheduleData.workSlotsCount} bloków pracy, ${workScheduleData.breaksCount} przerw)`,
      emergencyAvailable: !workScheduleData.isDayOff,
      maxOvertimeToday: workScheduleData.isDayOff ? 0 : 60,
      currentOvertimeUsed: 0,
      lastSyncWithEmployee: new Date().toISOString(),
      version: 2, // v2 = work-schedules.json
      sourceSystem: 'work-schedules.json',
      isDayOff: workScheduleData.isDayOff || false
    };
    
    schedule.statistics = calculateScheduleStatistics(schedule.timeSlots);
    
    if (workScheduleData.isDayOff) {
      console.log(`✅ Zwracam PUSTY harmonogram (dzień wolny) z work-schedules.json`);
    } else {
      console.log(`✅ Zwracam harmonogram z work-schedules.json: ${schedule.timeSlots.length} slotów`);
    }
    
    return res.json({
      success: true,
      schedule,
      message: workScheduleData.isDayOff 
        ? 'Dzień wolny (brak slotów pracy w work-schedules.json)'
        : 'Harmonogram z work-schedules.json (ustawiony przez technika)'
    });
  }
  
  console.log(`⚠️ Brak harmonogramu w work-schedules.json, sprawdzam employee-schedules.json...`);
  
  // PRIORYTET 2: Sprawdź employee-schedules.json (System B - fallback)
  const schedulesData = readSchedules();
  const schedule = schedulesData.schedules[date]?.[employeeId];
  
  if (!schedule) {
    console.log(`⚠️ Brak w employee-schedules.json, generuję z workingHours...`);
    
    // PRIORYTET 3: Wygeneruj z workingHours (employees.json)
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
      dailyNotes: 'Automatycznie wygenerowany z workingHours (employees.json)',
      emergencyAvailable: true,
      maxOvertimeToday: 60,
      currentOvertimeUsed: 0,
      lastSyncWithEmployee: new Date().toISOString(),
      version: 1,
      sourceSystem: 'auto-generated'
    };
    
    newSchedule.statistics = calculateScheduleStatistics(newSchedule.timeSlots);
    
    console.log(`✅ Wygenerowano harmonogram z workingHours: ${newSchedule.timeSlots.length} slotów`);
    
    // Nie zapisujemy - zwracamy tylko
    return res.json({
      success: true,
      schedule: newSchedule,
      message: 'Harmonogram automatycznie wygenerowany z workingHours'
    });
  }
  
  console.log(`✅ Zwracam harmonogram z employee-schedules.json`);
  
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
  
  console.log(`🔍 checkAvailability: employeeId=${employeeId}, date=${date}, duration=${duration}`);
  
  // ✅ PRIORYTET 1: Sprawdź work-schedules.json (System A)
  const workScheduleData = convertWorkScheduleToDaily(employeeId, date);
  
  let schedule = null;
  let sourceSystem = null;
  
  // ✅ ZMIANA: Obsługujemy też puste harmonogramy (dzień wolny)
  if (workScheduleData) {
    schedule = {
      timeSlots: workScheduleData.timeSlots,
      isDayOff: workScheduleData.isDayOff
    };
    sourceSystem = 'work-schedules.json';
    
    if (workScheduleData.isDayOff) {
      console.log(`⚠️ Dzień wolny w work-schedules.json - pracownik niedostępny`);
      return res.json({
        success: true,
        isAvailable: false,
        availableSlots: [],
        message: 'Dzień wolny (serwisant nie ustawił godzin pracy)',
        sourceSystem: 'work-schedules.json',
        isDayOff: true
      });
    }
    
    console.log(`✅ Używam harmonogramu z work-schedules.json: ${schedule.timeSlots.length} slotów`);
  } else {
    // PRIORYTET 2: Sprawdź employee-schedules.json
    const schedulesData = readSchedules();
    schedule = schedulesData.schedules[date]?.[employeeId];
    
    if (!schedule) {
      // PRIORYTET 3: Wygeneruj z workingHours
      const employees = readEmployees();
      const employee = employees.find(emp => emp.id === employeeId);
      
      if (employee && employee.workingHours) {
        schedule = {
          timeSlots: generateTimeSlotsFromWorkingHours(employee.workingHours, employeeId, date)
        };
        sourceSystem = 'auto-generated';
        console.log(`⚠️ Wygenerowano harmonogram z workingHours: ${schedule.timeSlots.length} slotów`);
      } else {
        console.log(`❌ Brak harmonogramu - pracownik niedostępny`);
        return res.json({
          success: true,
          isAvailable: false,
          availableSlots: [],
          message: 'Brak harmonogramu dla tego dnia',
          sourceSystem: 'none'
        });
      }
    } else {
      sourceSystem = 'employee-schedules.json';
      console.log(`✅ Używam harmonogramu z employee-schedules.json: ${schedule.timeSlots.length} slotów`);
    }
  }
  
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
  
  console.log(`✅ checkAvailability: znaleziono ${availableSlots.length} dostępnych slotów (źródło: ${sourceSystem})`);
  
  return res.json({
    success: true,
    isAvailable: availableSlots.length > 0,
    availableSlots,
    nextAvailableSlot,
    utilizationPercentage: schedule.statistics?.utilizationPercentage || 0,
    totalSlotsNeeded: requiredSlots,
    sourceSystem, // Dodano informację o źródle danych
    version: 2 // Wersja zunifikowanego API
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
  const orders = readOrders();
  const daySchedules = schedulesData.schedules[date] || {};
  
  // Dodaj informacje o pracownikach
  const enrichedSchedules = {};
  
  employees.forEach(employee => {
    if (!employee.isActive) return;
    
    let schedule = null;
    let sourceSystem = null;
    
    // ✅ PRIORYTET 1: Sprawdź work-schedules.json (System A)
    const workScheduleData = convertWorkScheduleToDaily(employee.id, date);
    
    // ✅ ZMIANA: Obsługuj też puste harmonogramy (dzień wolny)
    if (workScheduleData) {
      if (workScheduleData.isDayOff) {
        // Dzień wolny - pusty harmonogram
        schedule = {
          employeeId: employee.id,
          employeeName: employee.name,
          date,
          workingHours: 'day-off',
          timeSlots: [],
          dailyNotes: 'Dzień wolny (serwisant nie ustawił godzin pracy)',
          emergencyAvailable: false,
          maxOvertimeToday: 0,
          currentOvertimeUsed: 0,
          lastSyncWithEmployee: new Date().toISOString(),
          version: 2,
          sourceSystem: 'work-schedules.json',
          isDayOff: true,
          workSlotsCount: 0,
          breaksCount: 0
        };
        sourceSystem = 'work-schedules.json';
        console.log(`⚠️ getAllSchedules: ${employee.name} - dzień wolny (work-schedules.json)`);
      } else {
        // Normalny harmonogram z slotami
        schedule = {
          employeeId: employee.id,
          employeeName: employee.name,
          date,
          timeSlots: workScheduleData.timeSlots,
          dailyNotes: 'Harmonogram ustawiony przez technika',
          emergencyAvailable: true,
          maxOvertimeToday: 60,
          currentOvertimeUsed: 0,
          lastSyncWithEmployee: new Date().toISOString(),
          version: 2,
          sourceSystem: 'work-schedules.json',
          workSlotsCount: workScheduleData.workSlotsCount,
          breaksCount: workScheduleData.breaksCount
        };
        sourceSystem = 'work-schedules.json';
        console.log(`✅ getAllSchedules: ${employee.name} - harmonogram z work-schedules.json`);
      }
    } else {
      // PRIORYTET 2: Sprawdź employee-schedules.json
      schedule = daySchedules[employee.id];
      
      if (!schedule) {
        // PRIORYTET 3: Wygeneruj z workingHours
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
          version: 1,
          sourceSystem: 'auto-generated'
        };
        sourceSystem = 'auto-generated';
        console.log(`⚠️ getAllSchedules: ${employee.name} - wygenerowano z workingHours`);
      } else {
        sourceSystem = 'employee-schedules.json';
        console.log(`✅ getAllSchedules: ${employee.name} - harmonogram z employee-schedules.json`);
      }
      
      schedule.statistics = calculateScheduleStatistics(schedule.timeSlots);
    }
    
    // 🔥 WYPEŁNIJ HARMONOGRAM RZECZYWISTYMI WIZYTAMI
    const employeeVisitsToday = [];
    orders.forEach(order => {
      if (order.visits && Array.isArray(order.visits)) {
        order.visits.forEach(visit => {
          // Sprawdź czy wizyta jest dla tego pracownika i tej daty
          // UWAGA: wizyta może mieć employeeId LUB technicianId
          const visitEmployeeId = visit.employeeId || visit.technicianId;
          if (visitEmployeeId === employee.id && visit.scheduledDate === date) {
            employeeVisitsToday.push({
              visitId: visit.visitId || visit.id,
              orderId: order.id,
              orderNumber: order.orderNumber,
              clientName: order.clientName,
              deviceType: order.deviceType,
              scheduledTime: visit.scheduledTime || visit.time,
              duration: visit.estimatedDuration || 60,
              status: visit.status,
              visitType: visit.type || visit.visitType,
              address: order.address || order.city
            });
          }
        });
      }
    });
    
    console.log(`👤 ${employee.name} (${employee.id}): ${employeeVisitsToday.length} wizyt na ${date}`);
    
    // Aktualizuj sloty o wizyty
    if (employeeVisitsToday.length > 0) {
      employeeVisitsToday.forEach(visit => {
        const visitTime = visit.scheduledTime; // np. "10:00"
        const [visitHour, visitMinute] = visitTime.split(':').map(Number);
        const visitStartMinutes = visitHour * 60 + visitMinute;
        const visitEndMinutes = visitStartMinutes + visit.duration;
        
        // Oznacz wszystkie sloty w czasie wizyty jako busy
        schedule.timeSlots.forEach(slot => {
          const [slotHour, slotMinute] = slot.time.split(':').map(Number);
          const slotMinutes = slotHour * 60 + slotMinute;
          
          if (slotMinutes >= visitStartMinutes && slotMinutes < visitEndMinutes) {
            slot.status = 'busy';
            slot.activity = `${visit.clientName} - ${visit.deviceType}`;
            slot.visitId = visit.visitId;
            slot.orderId = visit.orderId;
            slot.orderNumber = visit.orderNumber;
            slot.canBeModified = false;
            slot.lastUpdated = new Date().toISOString();
            slot.updatedBy = 'system-from-visits';
          }
        });
      });
      
      // Przelicz statystyki po dodaniu wizyt
      schedule.statistics = calculateScheduleStatistics(schedule.timeSlots);
    }
    
    enrichedSchedules[employee.id] = {
      ...schedule,
      visitsToday: employeeVisitsToday.length,
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
  
  console.log(`📅 Wygenerowano harmonogramy dla ${Object.keys(enrichedSchedules).length} pracowników na ${date}`);
  
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