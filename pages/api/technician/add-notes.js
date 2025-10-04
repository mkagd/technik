// pages/api/technician/add-notes.js
// 📝 API do dodawania notatek pracownika do wizyty

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
  
  return { employeeId: session.employeeId, employeeName: session.name || session.email };
};

// Typy notatek
const NOTE_TYPES = {
  GENERAL: 'general',           // Ogólna notatka
  DIAGNOSIS: 'diagnosis',       // Diagnoza problemu
  WORK_PERFORMED: 'work',       // Wykonana praca
  PARTS_NEEDED: 'parts',        // Potrzebne części
  ISSUE: 'issue',               // Problem/przeszkoda
  RECOMMENDATION: 'recommendation', // Rekomendacja dla klienta
  CLIENT_FEEDBACK: 'client',    // Informacja od klienta
  INTERNAL: 'internal'          // Notatka wewnętrzna
};

// Dodaj notatkę do wizyty
const addNoteToVisit = (visitId, noteData, employeeId, employeeName) => {
  const orders = readOrders();
  let noteAdded = false;

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
      
      // Inicjalizuj tablicę notatek jeśli nie istnieje
      if (!visit.notes) visit.notes = [];
      if (!visit.technicianNotes) visit.technicianNotes = '';
      
      // Stwórz obiekt notatki
      const note = {
        id: `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: noteData.type || NOTE_TYPES.GENERAL,
        content: noteData.content,
        category: noteData.category || null,
        priority: noteData.priority || 'normal',
        isPrivate: noteData.isPrivate || false,
        tags: noteData.tags || [],
        
        // Metadata
        createdBy: employeeId,
        createdByName: employeeName,
        createdAt: now,
        
        // Powiązania
        relatedTo: noteData.relatedTo || null, // np. part ID, photo ID
        
        // Flagi
        isPinned: noteData.isPinned || false,
        isResolved: false
      };
      
      // Dodaj notatkę do tablicy
      visit.notes.push(note);
      
      // Aktualizuj pole technicianNotes (legacy)
      const notePrefix = getNotePrefix(note.type);
      visit.technicianNotes += `\n[${now}] ${notePrefix}${note.content}`;
      
      // Specjalne akcje dla niektórych typów notatek
      switch (note.type) {
        case NOTE_TYPES.DIAGNOSIS:
          // Aktualizuj pole diagnosis
          if (!visit.diagnosis) {
            visit.diagnosis = note.content;
          } else {
            visit.diagnosis += `\n${note.content}`;
          }
          visit.diagnosisDate = now;
          visit.diagnosedBy = employeeId;
          break;
          
        case NOTE_TYPES.PARTS_NEEDED:
          // Dodaj do listy potrzebnych części
          if (noteData.parts && Array.isArray(noteData.parts)) {
            if (!visit.partsNeeded) visit.partsNeeded = [];
            visit.partsNeeded.push(...noteData.parts);
          }
          break;
          
        case NOTE_TYPES.RECOMMENDATION:
          // Dodaj do rekomendacji
          if (!visit.recommendations) visit.recommendations = [];
          visit.recommendations.push({
            text: note.content,
            addedBy: employeeId,
            addedAt: now,
            priority: noteData.priority
          });
          break;
          
        case NOTE_TYPES.ISSUE:
          // Flaguj wizytę jako mającą problem
          visit.hasIssues = true;
          if (!visit.issues) visit.issues = [];
          visit.issues.push({
            description: note.content,
            reportedBy: employeeId,
            reportedAt: now,
            severity: noteData.priority,
            resolved: false
          });
          break;
      }
      
      // Aktualizuj timestamp
      visit.updatedAt = now;
      order.updatedAt = now;
      
      // Zapisz
      noteAdded = writeOrders(orders);
      
      if (noteAdded) {
        return {
          success: true,
          message: 'Note added successfully',
          note: note,
          visitId: visitId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to save note'
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

// Pobierz prefix dla typu notatki
const getNotePrefix = (type) => {
  const prefixes = {
    [NOTE_TYPES.DIAGNOSIS]: '🔍 DIAGNOZA: ',
    [NOTE_TYPES.WORK_PERFORMED]: '🔧 WYKONANO: ',
    [NOTE_TYPES.PARTS_NEEDED]: '🛠️ CZĘŚCI: ',
    [NOTE_TYPES.ISSUE]: '⚠️ PROBLEM: ',
    [NOTE_TYPES.RECOMMENDATION]: '💡 REKOMENDACJA: ',
    [NOTE_TYPES.CLIENT_FEEDBACK]: '💬 KLIENT: ',
    [NOTE_TYPES.INTERNAL]: '🔒 WEWNĘTRZNE: ',
    [NOTE_TYPES.GENERAL]: ''
  };
  return prefixes[type] || '';
};

// Pobierz notatki wizyty
const getVisitNotes = (visitId, employeeId) => {
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
      
      return {
        success: true,
        visitId: visitId,
        notes: visit.notes || [],
        count: visit.notes?.length || 0
      };
    }
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: `Visit ${visitId} not found`
  };
};

// Usuń notatkę
const deleteNote = (visitId, noteId, employeeId) => {
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
      
      if (!visit.notes || visit.notes.length === 0) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'No notes found for this visit'
        };
      }
      
      const noteIndex = visit.notes.findIndex(n => n.id === noteId);
      
      if (noteIndex === -1) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: `Note ${noteId} not found`
        };
      }
      
      const note = visit.notes[noteIndex];
      
      // Sprawdź czy pracownik może usunąć tę notatkę
      if (note.createdBy !== employeeId) {
        return {
          success: false,
          error: 'FORBIDDEN',
          message: 'You can only delete your own notes'
        };
      }
      
      // Usuń notatkę
      visit.notes.splice(noteIndex, 1);
      visit.updatedAt = new Date().toISOString();
      
      if (writeOrders(orders)) {
        return {
          success: true,
          message: 'Note deleted successfully',
          noteId: noteId
        };
      } else {
        return {
          success: false,
          error: 'WRITE_ERROR',
          message: 'Failed to delete note'
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
    // GET - Pobierz notatki
    if (req.method === 'GET') {
      const { visitId } = req.query;

      if (!visitId) {
        return res.status(400).json({
          success: false,
          message: 'visitId parameter is required'
        });
      }

      const result = getVisitNotes(visitId, employee.employeeId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 : 500;
        return res.status(statusCode).json(result);
      }
    }

    // POST - Dodaj notatkę
    if (req.method === 'POST') {
      const { visitId, type, content, category, priority, isPrivate, tags, parts, relatedTo } = req.body;

      if (!visitId) {
        return res.status(400).json({
          success: false,
          message: 'visitId is required'
        });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Note content is required'
        });
      }

      const noteData = {
        type,
        content: content.trim(),
        category,
        priority,
        isPrivate,
        tags: tags || [],
        parts,
        relatedTo
      };

      console.log(`📝 Dodawanie notatki do wizyty ${visitId} (typ: ${type || 'general'})`);

      const result = addNoteToVisit(visitId, noteData, employee.employeeId, employee.employeeName);

      if (result.success) {
        console.log(`✅ Notatka dodana: ${result.note.id}`);
        return res.status(201).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 : 500;
        console.log(`❌ Błąd: ${result.message}`);
        return res.status(statusCode).json(result);
      }
    }

    // DELETE - Usuń notatkę
    if (req.method === 'DELETE') {
      const { visitId, noteId } = req.body;

      if (!visitId || !noteId) {
        return res.status(400).json({
          success: false,
          message: 'visitId and noteId are required'
        });
      }

      const result = deleteNote(visitId, noteId, employee.employeeId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.error === 'NOT_FOUND' ? 404 : 
                           result.error === 'NOT_ASSIGNED' ? 403 :
                           result.error === 'FORBIDDEN' ? 403 : 500;
        return res.status(statusCode).json(result);
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error handling notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
