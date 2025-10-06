// pages/api/technician/work-schedule.js
// 📅 API do zarządzania harmonogramem pracy technika
// Pracownik może ustawiać swoje godziny dostępności z dokładnością do 15 minut

import fs from 'fs';
import path from 'path';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');
const SCHEDULES_FILE = path.join(process.cwd(), 'data', 'work-schedules.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');

// ===========================
// HELPER FUNCTIONS
// ===========================

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading employees.json:', error);
    return [];
  }
};

const readSchedules = () => {
  try {
    if (fs.existsSync(SCHEDULES_FILE)) {
      const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading work-schedules.json:', error);
    return [];
  }
};

const writeSchedules = (schedules) => {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error writing work-schedules.json:', error);
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
    console.error('❌ Error reading sessions:', error);
    return [];
  }
};

const validateToken = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  const expirationTime = 7 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) return null;
  
  return { 
    employeeId: session.employeeId, 
    employeeName: session.name || session.email,
    email: session.email 
  };
};

// Walidacja time slotu (czas w formacie HH:MM)
const validateTimeFormat = (time) => {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(time);
};

// Sprawdź czy czas jest wielokrotnością 15 minut
const isValidInterval = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return minutes % 15 === 0;
};

// Konwertuj czas do minut (do porównań)
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Sprawdź czy sloty się nakładają
const doSlotsOverlap = (slot1, slot2) => {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);
  
  return start1 < end2 && start2 < end1;
};

// Oblicz długość slotu w minutach
const calculateDuration = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

// Oblicz statystyki tygodnia
const calculateWeekStats = (schedule) => {
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let daysWithWork = new Set();
  
  schedule.workSlots.forEach(slot => {
    totalWorkMinutes += calculateDuration(slot.startTime, slot.endTime);
    daysWithWork.add(slot.dayOfWeek);
  });
  
  schedule.breaks.forEach(breakSlot => {
    totalBreakMinutes += calculateDuration(breakSlot.startTime, breakSlot.endTime);
  });
  
  const netWorkMinutes = totalWorkMinutes - totalBreakMinutes;
  
  return {
    totalHours: Math.floor(netWorkMinutes / 60),
    totalMinutes: netWorkMinutes % 60,
    daysPerWeek: daysWithWork.size,
    averageHoursPerDay: daysWithWork.size > 0 ? (netWorkMinutes / 60 / daysWithWork.size).toFixed(1) : 0,
    breakHours: Math.floor(totalBreakMinutes / 60),
    breakMinutes: totalBreakMinutes % 60,
    efficiency: totalWorkMinutes > 0 ? ((netWorkMinutes / totalWorkMinutes) * 100).toFixed(1) : 0
  };
};

// ===========================
// GAMIFICATION SYSTEM
// ===========================

const calculateIncentives = (schedule, employee) => {
  const stats = calculateWeekStats(schedule);
  const totalHours = stats.totalHours + (stats.totalMinutes / 60);
  
  // Bazowa stawka godzinowa (przykładowa)
  const hourlyRate = 50; // PLN/h
  
  // Potencjalne zarobki tygodniowe
  const weeklyEarnings = totalHours * hourlyRate;
  
  // Bonusy za ilość godzin
  let bonus = 0;
  let bonusDescription = '';
  
  if (totalHours >= 40) {
    bonus = weeklyEarnings * 0.15; // 15% bonus
    bonusDescription = '🏆 Bonus 15% za 40+ godzin!';
  } else if (totalHours >= 35) {
    bonus = weeklyEarnings * 0.10; // 10% bonus
    bonusDescription = '⭐ Bonus 10% za 35+ godzin!';
  } else if (totalHours >= 30) {
    bonus = weeklyEarnings * 0.05; // 5% bonus
    bonusDescription = '✨ Bonus 5% za 30+ godzin!';
  }
  
  // Możliwe dodatkowe zarobki
  const potentialExtraHours = 40 - totalHours;
  const potentialExtraEarnings = potentialExtraHours > 0 ? potentialExtraHours * hourlyRate : 0;
  
  // Achievement badges
  const badges = [];
  
  if (stats.daysPerWeek >= 5) {
    badges.push({ icon: '🔥', name: 'Streak Master', description: '5+ dni w tygodniu' });
  }
  if (totalHours >= 40) {
    badges.push({ icon: '💪', name: 'Full Timer', description: '40+ godzin tygodniowo' });
  }
  if (stats.efficiency >= 90) {
    badges.push({ icon: '⚡', name: 'Efficient Pro', description: 'Mało przerw, wysoka efektywność' });
  }
  if (schedule.workSlots.some(s => timeToMinutes(s.startTime) <= 420)) { // 7:00 AM
    badges.push({ icon: '🌅', name: 'Early Bird', description: 'Praca przed 7:00' });
  }
  if (schedule.workSlots.some(s => timeToMinutes(s.endTime) >= 1200)) { // 8:00 PM
    badges.push({ icon: '🌙', name: 'Night Owl', description: 'Praca po 20:00' });
  }
  
  return {
    weeklyEarnings: weeklyEarnings.toFixed(2),
    bonus: bonus.toFixed(2),
    bonusDescription,
    totalWithBonus: (weeklyEarnings + bonus).toFixed(2),
    potentialExtraHours: Math.max(0, potentialExtraHours).toFixed(1),
    potentialExtraEarnings: potentialExtraEarnings.toFixed(2),
    badges,
    motivationMessage: generateMotivationMessage(totalHours, stats.daysPerWeek)
  };
};

const generateMotivationMessage = (totalHours, daysPerWeek) => {
  if (totalHours >= 40) {
    return '🎉 Świetna robota! Maksymalny harmonogram pracy!';
  } else if (totalHours >= 35) {
    return `💪 Nieźle! Dodaj jeszcze ${(40 - totalHours).toFixed(1)}h aby osiągnąć bonus 15%`;
  } else if (totalHours >= 30) {
    return `📈 Dobry start! Dodaj ${(40 - totalHours).toFixed(1)}h więcej = więcej zarobków!`;
  } else if (totalHours >= 20) {
    return `🚀 Więcej godzin = więcej zleceń! Cel: 40h/tydzień`;
  } else {
    return '⏰ Dodaj więcej godzin aby otrzymywać więcej zleceń!';
  }
};

// ===========================
// CRUD OPERATIONS
// ===========================

// GET - Pobierz harmonogram pracownika
const getSchedule = (employeeId, weekStart = null) => {
  const schedules = readSchedules();
  
  // Jeśli nie podano weekStart, użyj bieżącego tygodnia
  if (!weekStart) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Poniedziałek
    weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
  
  // Znajdź harmonogram dla tego pracownika i tygodnia
  let schedule = schedules.find(s => s.employeeId === employeeId && s.weekStart === weekStart);
  
  // Jeśli nie istnieje, stwórz pusty
  if (!schedule) {
    schedule = {
      id: `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: employeeId,
      weekStart: weekStart,
      workSlots: [],
      breaks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  const stats = calculateWeekStats(schedule);
  const incentives = calculateIncentives(schedule, { id: employeeId });
  
  return {
    success: true,
    schedule: schedule,
    stats: stats,
    incentives: incentives
  };
};

// POST - Dodaj work slot (blok czasu pracy)
const addWorkSlot = (employeeId, slotData, weekStart) => {
  const { dayOfWeek, startTime, endTime, type = 'work', notes = '' } = slotData;
  
  // Walidacja
  if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6) {
    return { success: false, error: 'INVALID_DAY', message: 'dayOfWeek must be 0-6 (0=Sunday, 1=Monday, etc.)' };
  }
  
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return { success: false, error: 'INVALID_TIME_FORMAT', message: 'Time must be in HH:MM format' };
  }
  
  if (!isValidInterval(startTime) || !isValidInterval(endTime)) {
    return { success: false, error: 'INVALID_INTERVAL', message: 'Time must be in 15-minute intervals (e.g., 08:00, 08:15, 08:30)' };
  }
  
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return { success: false, error: 'INVALID_TIME_RANGE', message: 'Start time must be before end time' };
  }
  
  const duration = calculateDuration(startTime, endTime);
  if (duration < 15) {
    return { success: false, error: 'TOO_SHORT', message: 'Slot must be at least 15 minutes' };
  }
  
  if (duration > 720) { // 12 godzin
    return { success: false, error: 'TOO_LONG', message: 'Slot cannot be longer than 12 hours' };
  }
  
  // Pobierz harmonogram
  const schedules = readSchedules();
  let schedule = schedules.find(s => s.employeeId === employeeId && s.weekStart === weekStart);
  
  if (!schedule) {
    schedule = {
      id: `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: employeeId,
      weekStart: weekStart,
      workSlots: [],
      breaks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    schedules.push(schedule);
  }
  
  const newSlot = {
    id: `SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dayOfWeek: dayOfWeek,
    startTime: startTime,
    endTime: endTime,
    type: type, // 'work' or 'break'
    duration: duration,
    notes: notes,
    createdAt: new Date().toISOString()
  };
  
  // Sprawdź nakładanie się slotów
  const targetArray = type === 'break' ? schedule.breaks : schedule.workSlots;
  const slotsOnSameDay = targetArray.filter(s => s.dayOfWeek === dayOfWeek);
  
  for (const existingSlot of slotsOnSameDay) {
    if (doSlotsOverlap(newSlot, existingSlot)) {
      return {
        success: false,
        error: 'OVERLAP',
        message: `This slot overlaps with existing ${existingSlot.type} slot (${existingSlot.startTime}-${existingSlot.endTime})`,
        conflictingSlot: existingSlot
      };
    }
  }
  
  // Dodaj slot
  targetArray.push(newSlot);
  schedule.updatedAt = new Date().toISOString();
  
  if (writeSchedules(schedules)) {
    const stats = calculateWeekStats(schedule);
    const incentives = calculateIncentives(schedule, { id: employeeId });
    
    return {
      success: true,
      message: `${type === 'break' ? 'Break' : 'Work slot'} added successfully`,
      slot: newSlot,
      schedule: schedule, // Zwróć zaktualizowany harmonogram
      stats: stats,
      incentives: incentives
    };
  } else {
    return { success: false, error: 'WRITE_ERROR', message: 'Failed to save schedule' };
  }
};

// DELETE - Usuń work slot
const deleteWorkSlot = (employeeId, slotId, weekStart) => {
  const schedules = readSchedules();
  const schedule = schedules.find(s => s.employeeId === employeeId && s.weekStart === weekStart);
  
  if (!schedule) {
    console.log(`❌ Schedule NOT FOUND: employeeId=${employeeId}, weekStart=${weekStart}`);
    console.log(`   Available schedules:`, schedules.map(s => ({ id: s.employeeId, week: s.weekStart })));
    return { success: false, error: 'NOT_FOUND', message: 'Schedule not found' };
  }
  
  console.log(`🔍 Searching for slot ${slotId} in schedule ${schedule.id}`);
  console.log(`   Available workSlots:`, schedule.workSlots.map(s => s.id));
  console.log(`   Available breaks:`, schedule.breaks.map(s => s.id));
  
  // Szukaj w workSlots
  let slotIndex = schedule.workSlots.findIndex(s => s.id === slotId);
  let slotType = 'work';
  
  if (slotIndex === -1) {
    // Szukaj w breaks
    slotIndex = schedule.breaks.findIndex(s => s.id === slotId);
    slotType = 'break';
  }
  
  if (slotIndex === -1) {
    console.log(`❌ Slot ${slotId} NOT FOUND in workSlots or breaks`);
    return { success: false, error: 'SLOT_NOT_FOUND', message: 'Slot not found' };
  }
  
  console.log(`✅ Found slot ${slotId} in ${slotType} array at index ${slotIndex}`);
  
  // Usuń slot
  if (slotType === 'break') {
    schedule.breaks.splice(slotIndex, 1);
  } else {
    schedule.workSlots.splice(slotIndex, 1);
  }
  
  schedule.updatedAt = new Date().toISOString();
  
  if (writeSchedules(schedules)) {
    const stats = calculateWeekStats(schedule);
    const incentives = calculateIncentives(schedule, { id: employeeId });
    
    return {
      success: true,
      message: 'Slot deleted successfully',
      schedule: schedule, // Zwróć zaktualizowany harmonogram
      stats: stats,
      incentives: incentives
    };
  } else {
    return { success: false, error: 'WRITE_ERROR', message: 'Failed to save schedule' };
  }
};

// COPY WEEK - Kopiuj harmonogram z poprzedniego tygodnia
const copyPreviousWeek = (employeeId, weekStart) => {
  const schedules = readSchedules();
  
  // Oblicz poprzedni tydzień
  const currentWeekDate = new Date(weekStart);
  currentWeekDate.setDate(currentWeekDate.getDate() - 7);
  const previousWeekStart = currentWeekDate.toISOString().split('T')[0];
  
  const previousSchedule = schedules.find(s => s.employeeId === employeeId && s.weekStart === previousWeekStart);
  
  if (!previousSchedule || (previousSchedule.workSlots.length === 0 && previousSchedule.breaks.length === 0)) {
    return { success: false, error: 'NO_PREVIOUS_WEEK', message: 'No schedule found for previous week' };
  }
  
  // Usuń istniejący harmonogram dla bieżącego tygodnia (jeśli istnieje)
  const existingIndex = schedules.findIndex(s => s.employeeId === employeeId && s.weekStart === weekStart);
  if (existingIndex !== -1) {
    schedules.splice(existingIndex, 1);
  }
  
  // Skopiuj harmonogram
  const newSchedule = {
    id: `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    employeeId: employeeId,
    weekStart: weekStart,
    workSlots: previousSchedule.workSlots.map(slot => ({
      ...slot,
      id: `SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    })),
    breaks: previousSchedule.breaks.map(breakSlot => ({
      ...breakSlot,
      id: `SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    })),
    copiedFrom: previousWeekStart,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  schedules.push(newSchedule);
  
  if (writeSchedules(schedules)) {
    const stats = calculateWeekStats(newSchedule);
    const incentives = calculateIncentives(newSchedule, { id: employeeId });
    
    return {
      success: true,
      message: `Schedule copied from week ${previousWeekStart}`,
      schedule: newSchedule,
      stats: stats,
      incentives: incentives
    };
  } else {
    return { success: false, error: 'WRITE_ERROR', message: 'Failed to save schedule' };
  }
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Walidacja tokenu
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required'
    });
  }

  const employee = validateToken(token);
  
  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    // GET - Pobierz harmonogram
    if (req.method === 'GET') {
      const { weekStart } = req.query;
      
      const result = getSchedule(employee.employeeId, weekStart);
      return res.status(200).json(result);
    }

    // POST - Dodaj slot lub wykonaj akcję
    if (req.method === 'POST') {
      const { action, slotData, weekStart } = req.body;

      if (!weekStart) {
        return res.status(400).json({
          success: false,
          message: 'weekStart is required (YYYY-MM-DD format, Monday of the week)'
        });
      }

      // Akcja: kopiuj poprzedni tydzień
      if (action === 'copy_previous_week') {
        const result = copyPreviousWeek(employee.employeeId, weekStart);
        
        if (result.success) {
          console.log(`📋 Skopiowano harmonogram dla ${employee.employeeName}`);
          return res.status(200).json(result);
        } else {
          const statusCode = result.error === 'NO_PREVIOUS_WEEK' ? 404 : 500;
          return res.status(statusCode).json(result);
        }
      }

      // Domyślna akcja: dodaj slot
      if (!slotData) {
        return res.status(400).json({
          success: false,
          message: 'slotData is required'
        });
      }

      const result = addWorkSlot(employee.employeeId, slotData, weekStart);
      
      if (result.success) {
        console.log(`➕ Dodano ${slotData.type || 'work'} slot dla ${employee.employeeName}`);
        return res.status(201).json(result);
      } else {
        const statusCode = result.error.includes('INVALID') || result.error === 'OVERLAP' || result.error === 'TOO_SHORT' || result.error === 'TOO_LONG' ? 400 : 500;
        return res.status(statusCode).json(result);
      }
    }

    // DELETE - Usuń slot
    if (req.method === 'DELETE') {
      const { slotId, weekStart } = req.query;

      if (!slotId || !weekStart) {
        return res.status(400).json({
          success: false,
          message: 'slotId and weekStart are required'
        });
      }

      const result = deleteWorkSlot(employee.employeeId, slotId, weekStart);
      
      if (result.success) {
        console.log(`🗑️ Usunięto slot ${slotId} dla ${employee.employeeName}`);
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' || result.error === 'SLOT_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error in work-schedule API:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
