// pages/api/technician/update-status.js
// 🔄 API do aktualizacji statusu wizyty

import fs from 'fs';
import path from 'path';

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
    console.error('❌ Error reading orders.json:', error);
    return [];
  }
};

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error writing orders.json:', error);
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
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return { employeeId: session.employeeId, employeeName: session.email };
};

// Dopuszczalne statusy wizyt
const VALID_STATUSES = [
  'scheduled',      // Zaplanowana
  'on_way',         // W drodze
  'in_progress',    // W trakcie
  'paused',         // Wstrzymana
  'completed',      // Zakończona
  'cancelled',      // Anulowana
  'rescheduled'     // Przełożona
];

// Walidacja przejść między statusami
const isValidTransition = (currentStatus, newStatus) => {
  const transitions = {
    'scheduled': ['on_way', 'in_progress', 'cancelled', 'rescheduled'],
    'on_way': ['in_progress', 'scheduled', 'cancelled'],
    'in_progress': ['paused', 'completed', 'cancelled'],
    'paused': ['in_progress', 'cancelled'],
    'completed': [], // Nie można zmienić po zakończeniu
    'cancelled': [], // Nie można zmienić po anulowaniu
    'rescheduled': ['scheduled', 'cancelled']
  };
  
  return transitions[currentStatus]?.includes(newStatus) || false;
};

// Znajdź wizytę i zaktualizuj status
const updateVisitStatus = (visitId, newStatus, employeeId, notes = '') => {
  const orders = readOrders();
  let visitFound = false;
  let visitUpdated = false;

  for (const order of orders) {
    if (!order.visits || !Array.isArray(order.visits)) continue;

    const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
    
    if (visitIndex !== -1) {
      visitFound = true;
      const visit = order.visits[visitIndex];
      
      // Sprawdź przypisanie
      if (visit.assignedTo !== employeeId && visit.technicianId !== employeeId) {
        return { 
          success: false, 
          error: 'NOT_ASSIGNED',
          message: 'This visit is not assigned to you' 
        };
      }
      
      const currentStatus = visit.status;
      
      // Waliduj przejście
      if (!isValidTransition(currentStatus, newStatus)) {
        return {
          success: false,
          error: 'INVALID_TRANSITION',
          message: `Cannot change status from "${currentStatus}" to "${newStatus}"`,
          currentStatus,
          requestedStatus: newStatus
        };
      }
      
      const now = new Date().toISOString();
      
      // Aktualizuj status
      visit.status = newStatus;
      visit.updatedAt = now;
      
      // Dodaj do historii statusów
      if (!visit.statusHistory) visit.statusHistory = [];
      visit.statusHistory.push({
        from: currentStatus,
        to: newStatus,
        changedBy: employeeId,
        changedAt: now,
        notes: notes || ''
      });
      
      // Specjalne akcje dla niektórych statusów
      switch (newStatus) {
        case 'on_way':
          visit.onWayStartedAt = now;
          if (notes) visit.technicianNotes = (visit.technicianNotes || '') + `\n[${now}] W drodze: ${notes}`;
          break;
          
        case 'in_progress':
          if (!visit.startTime) {
            visit.startTime = now;
          }
          // Automatyczne rozpoczęcie sesji pracy
          if (!visit.workSessions) visit.workSessions = [];
          
          // Sprawdź czy nie ma już otwartej sesji
          const hasOpenSession = visit.workSessions.some(s => !s.endTime);
          if (!hasOpenSession) {
            visit.workSessions.push({
              startTime: now,
              startedBy: employeeId,
              pauseDuration: 0
            });
          }
          
          if (notes) visit.technicianNotes = (visit.technicianNotes || '') + `\n[${now}] Rozpoczęto pracę: ${notes}`;
          break;
          
        case 'paused':
          // Zakończ aktualną sesję pracy
          if (visit.workSessions && visit.workSessions.length > 0) {
            const lastSession = visit.workSessions[visit.workSessions.length - 1];
            if (!lastSession.endTime) {
              lastSession.endTime = now;
              lastSession.pauseReason = notes || 'Przerwa';
              
              // Oblicz czas trwania sesji
              const start = new Date(lastSession.startTime);
              const end = new Date(now);
              lastSession.duration = Math.floor((end - start) / 60000); // minuty
            }
          }
          
          visit.pausedAt = now;
          visit.pauseReason = notes || '';
          if (notes) visit.technicianNotes = (visit.technicianNotes || '') + `\n[${now}] Wstrzymano: ${notes}`;
          break;
          
        case 'completed':
          visit.completedAt = now;
          visit.completedBy = employeeId;
          
          // Zakończ ostatnią sesję jeśli otwarta
          if (visit.workSessions && visit.workSessions.length > 0) {
            const lastSession = visit.workSessions[visit.workSessions.length - 1];
            if (!lastSession.endTime) {
              lastSession.endTime = now;
              const start = new Date(lastSession.startTime);
              const end = new Date(now);
              lastSession.duration = Math.floor((end - start) / 60000);
            }
          }
          
          // Oblicz całkowity czas pracy
          if (visit.workSessions) {
            visit.actualDuration = visit.workSessions.reduce((total, session) => {
              return total + (session.duration || 0);
            }, 0);
          }
          
          if (visit.startTime) {
            visit.endTime = now;
          }
          
          // Aktualizuj status zlecenia jeśli to ostatnia wizyta
          const activeVisits = order.visits.filter(v => 
            v.status !== 'completed' && v.status !== 'cancelled'
          );
          
          if (activeVisits.length === 0) {
            order.status = 'completed';
            order.completedAt = now;
          }
          
          if (notes) visit.completionNotes = notes;
          break;
          
        case 'cancelled':
          visit.cancelledAt = now;
          visit.cancelledBy = employeeId;
          visit.cancellationReason = notes || '';
          
          // Zakończ sesje pracy
          if (visit.workSessions && visit.workSessions.length > 0) {
            const lastSession = visit.workSessions[visit.workSessions.length - 1];
            if (!lastSession.endTime) {
              lastSession.endTime = now;
              lastSession.cancelled = true;
              const start = new Date(lastSession.startTime);
              const end = new Date(now);
              lastSession.duration = Math.floor((end - start) / 60000);
            }
          }
          
          if (notes) visit.technicianNotes = (visit.technicianNotes || '') + `\n[${now}] Anulowano: ${notes}`;
          break;
          
        case 'rescheduled':
          visit.rescheduledAt = now;
          visit.rescheduledBy = employeeId;
          visit.rescheduledReason = notes || '';
          if (notes) visit.technicianNotes = (visit.technicianNotes || '') + `\n[${now}] Przełożono: ${notes}`;
          break;
      }
      
      // Zapisz zmiany
      visitUpdated = writeOrders(orders);
      
      if (visitUpdated) {
        return {
          success: true,
          message: `Visit status updated from "${currentStatus}" to "${newStatus}"`,
          visit: {
            visitId: visit.visitId,
            previousStatus: currentStatus,
            newStatus: newStatus,
            updatedAt: now,
            statusHistory: visit.statusHistory
          }
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to save changes'
        };
      }
    }
  }

  if (!visitFound) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: `Visit ${visitId} not found`
    };
  }

  return {
    success: false,
    error: 'UNKNOWN',
    message: 'Failed to update visit'
  };
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
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

  const employee = validateToken(token);
  
  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    const { visitId, status, notes } = req.body;

    // Walidacja
    if (!visitId) {
      return res.status(400).json({
        success: false,
        message: 'visitId is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`,
        validStatuses: VALID_STATUSES
      });
    }

    console.log(`🔄 Aktualizacja statusu wizyty ${visitId} -> ${status} (pracownik: ${employee.employeeId})`);

    // Aktualizuj status
    const result = updateVisitStatus(visitId, status, employee.employeeId, notes);

    if (result.success) {
      console.log(`✅ Status wizyty ${visitId} zaktualizowany: ${result.visit.previousStatus} -> ${result.visit.newStatus}`);
      return res.status(200).json(result);
    } else {
      const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                         result.error === 'NOT_ASSIGNED' ? 403 : 
                         result.error === 'INVALID_TRANSITION' ? 400 : 500;
      
      console.log(`❌ Błąd aktualizacji: ${result.message}`);
      return res.status(statusCode).json(result);
    }

  } catch (error) {
    console.error('❌ Error updating status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
