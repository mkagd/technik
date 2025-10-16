// pages/api/technician/time-tracking.js
// ⏱️ API do trackingu czasu pracy podczas wizyty

import fs from 'fs';
import path from 'path';
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

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
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

const validateToken = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  const expirationTime = 7 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return { employeeId: session.employeeId, employeeName: session.name || session.email };
};

// Oblicz czas trwania sesji w minutach
const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end - start) / 60000); // minuty
};

// START - Rozpocznij sesję pracy
const startWorkSession = (visitId, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const now = new Date().toISOString();
      
      // Sprawdź czy nie ma już otwartej sesji
      if (!visit.workSessions) visit.workSessions = [];
      
      const hasOpenSession = visit.workSessions.some(s => !s.endTime);
      
      if (hasOpenSession) {
        return {
          success: false,
          error: 'SESSION_ALREADY_ACTIVE',
          message: 'Work session already active. Stop current session first.',
          currentSession: visit.workSessions.find(s => !s.endTime)
        };
      }
      
      // Utwórz nową sesję
      const newSession = {
        id: `SESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: now,
        endTime: null,
        duration: null,
        pauseDuration: 0,
        pauses: [],
        startedBy: employeeId,
        location: null, // Może być dodane przez frontend (GPS)
        notes: ''
      };
      
      visit.workSessions.push(newSession);
      
      // Ustaw startTime wizyty jeśli pierwsza sesja
      if (!visit.startTime) {
        visit.startTime = now;
      }
      
      // Zmień status na in_progress jeśli nie był
      if (visit.status === 'scheduled' || visit.status === 'on_way' || visit.status === 'paused') {
        const oldStatus = visit.status;
        visit.status = 'in_progress';
        
        if (!visit.statusHistory) visit.statusHistory = [];
        visit.statusHistory.push({
          from: oldStatus,
          to: 'in_progress',
          changedBy: employeeId,
          changedAt: now,
          notes: 'Auto: Started work session'
        });
      }
      
      visit.updatedAt = now;
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Work session started',
          session: newSession,
          visitId: visitId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to start session'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// STOP - Zakończ sesję pracy
const stopWorkSession = (visitId, employeeId, notes = '') => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      if (!visit.workSessions || visit.workSessions.length === 0) {
        return {
          success: false,
          error: 'NO_SESSIONS',
          message: 'No work sessions found'
        };
      }
      
      // Znajdź otwartą sesję
      const openSession = visit.workSessions.find(s => !s.endTime);
      
      if (!openSession) {
        return {
          success: false,
          error: 'NO_ACTIVE_SESSION',
          message: 'No active work session to stop'
        };
      }
      
      const now = new Date().toISOString();
      
      // Zakończ sesję
      openSession.endTime = now;
      openSession.duration = calculateDuration(openSession.startTime, now);
      openSession.endedBy = employeeId;
      if (notes) openSession.notes = notes;
      
      // Oblicz całkowity czas pracy (suma wszystkich sesji)
      visit.actualDuration = visit.workSessions
        .filter(s => s.duration)
        .reduce((total, s) => total + s.duration, 0);
      
      visit.updatedAt = now;
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Work session stopped',
          session: openSession,
          totalDuration: visit.actualDuration,
          visitId: visitId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to stop session'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// PAUSE - Wstrzymaj sesję (przerwa)
const pauseWorkSession = (visitId, employeeId, reason = '') => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const openSession = visit.workSessions?.find(s => !s.endTime);
      
      if (!openSession) {
        return {
          success: false,
          error: 'NO_ACTIVE_SESSION',
          message: 'No active session to pause'
        };
      }
      
      // Sprawdź czy nie ma już aktywnej przerwy
      if (openSession.pauses && openSession.pauses.some(p => !p.endTime)) {
        return {
          success: false,
          error: 'PAUSE_ALREADY_ACTIVE',
          message: 'Session already paused. Resume first.'
        };
      }
      
      const now = new Date().toISOString();
      
      // Dodaj przerwę
      if (!openSession.pauses) openSession.pauses = [];
      openSession.pauses.push({
        startTime: now,
        endTime: null,
        duration: null,
        reason: reason || 'Break'
      });
      
      visit.updatedAt = now;
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Work session paused',
          pauseStarted: now,
          reason: reason
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to pause session'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// RESUME - Wznów sesję po przerwie
const resumeWorkSession = (visitId, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const openSession = visit.workSessions?.find(s => !s.endTime);
      
      if (!openSession) {
        return {
          success: false,
          error: 'NO_ACTIVE_SESSION',
          message: 'No active session to resume'
        };
      }
      
      // Znajdź aktywną przerwę
      const activePause = openSession.pauses?.find(p => !p.endTime);
      
      if (!activePause) {
        return {
          success: false,
          error: 'NOT_PAUSED',
          message: 'Session is not paused'
        };
      }
      
      const now = new Date().toISOString();
      
      // Zakończ przerwę
      activePause.endTime = now;
      activePause.duration = calculateDuration(activePause.startTime, now);
      
      // Dodaj do całkowitego czasu przerw
      openSession.pauseDuration = (openSession.pauseDuration || 0) + activePause.duration;
      
      visit.updatedAt = now;
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Work session resumed',
          pauseDuration: activePause.duration,
          totalPauseDuration: openSession.pauseDuration
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to resume session'
        };
      }
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// STATUS - Pobierz status sesji
const getSessionStatus = (visitId, employeeId) => {
  const orders = readOrders();

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visit = order.visits.find(v => v.visitId === visitId);
    
    if (visit) {
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const openSession = visit.workSessions?.find(s => !s.endTime);
      const activePause = openSession?.pauses?.find(p => !p.endTime);
      
      // Oblicz czas trwania aktualnej sesji
      let currentSessionDuration = 0;
      if (openSession) {
        const now = Date.now();
        const start = new Date(openSession.startTime).getTime();
        const pauseTime = openSession.pauseDuration || 0;
        currentSessionDuration = Math.floor((now - start) / 60000) - pauseTime;
      }
      
      // Oblicz całkowity czas
      const completedDuration = visit.workSessions
        ?.filter(s => s.duration)
        .reduce((total, s) => total + s.duration, 0) || 0;
      
      const totalDuration = completedDuration + currentSessionDuration;
      
      return {
        success: true,
        visitId: visitId,
        status: {
          isActive: !!openSession,
          isPaused: !!activePause,
          currentSession: openSession || null,
          currentPause: activePause || null,
          currentSessionDuration: currentSessionDuration,
          totalDuration: totalDuration,
          sessionCount: visit.workSessions?.length || 0,
          estimatedDuration: visit.estimatedDuration || 120
        },
        sessions: visit.workSessions || []
      };
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

  const employee = validateToken(token);
  
  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    // GET - Pobierz status sesji
    if (req.method === 'GET') {
      const { visitId } = req.query;

      if (!visitId) {
        return res.status(400).json({
          success: false,
          message: 'visitId parameter is required'
        });
      }

      const result = getSessionStatus(visitId, employee.employeeId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 : 500;
        return res.status(statusCode).json(result);
      }
    }

    // POST - Akcje (start, stop, pause, resume)
    if (req.method === 'POST') {
      const { action, visitId, notes, reason } = req.body;

      if (!action || !visitId) {
        return res.status(400).json({
          success: false,
          message: 'action and visitId are required'
        });
      }

      let result;

      switch (action) {
        case 'start':
          console.log(`▶️ Start sesji - wizyta ${visitId}`);
          result = startWorkSession(visitId, employee.employeeId);
          break;
          
        case 'stop':
          console.log(`⏹️ Stop sesji - wizyta ${visitId}`);
          result = stopWorkSession(visitId, employee.employeeId, notes);
          break;
          
        case 'pause':
          console.log(`⏸️ Pauza - wizyta ${visitId}`);
          result = pauseWorkSession(visitId, employee.employeeId, reason);
          break;
          
        case 'resume':
          console.log(`▶️ Wznowienie - wizyta ${visitId}`);
          result = resumeWorkSession(visitId, employee.employeeId);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid action: ${action}. Valid actions: start, stop, pause, resume`
          });
      }

      if (result.success) {
        console.log(`✅ ${action} - sukces`);
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 : 
                           result.error.includes('ALREADY') || result.error.includes('NO_') ? 400 : 500;
        console.log(`❌ ${action} - błąd: ${result.message}`);
        return res.status(statusCode).json(result);
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error in time tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
