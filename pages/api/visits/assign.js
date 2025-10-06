// pages/api/visits/assign.js
import fs from 'fs';
import path from 'path';

const visitsPath = path.join(process.cwd(), 'data', 'visits.json');
const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

function sendNotification(title, message, type, link, userId = null) {
  const notifications = readJSON(notificationsPath) || [];
  notifications.push({
    id: Date.now(),
    title,
    message,
    type,
    link,
    userId,
    read: false,
    createdAt: new Date().toISOString()
  });
  writeJSON(notificationsPath, notifications);
}

export default function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  const { visitId, employeeId, assignedBy, notes } = req.body;

  console.log('🔧 Przypisywanie wizyty:', { visitId, employeeId, assignedBy });

  // Walidacja
  if (!visitId || !employeeId) {
    return res.status(400).json({
      success: false,
      error: 'Brak visitId lub employeeId'
    });
  }

  // Odczytaj wizyty
  const visits = readJSON(visitsPath);
  if (!visits) {
    return res.status(500).json({
      success: false,
      error: 'Nie można odczytać wizyt'
    });
  }

  // Znajdź wizytę
  const visitIndex = visits.findIndex(v => v.visitId === visitId);
  if (visitIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Nie znaleziono wizyty'
    });
  }

  const visit = visits[visitIndex];

  // Aktualizuj wizytę
  visits[visitIndex] = {
    ...visit,
    employeeId: employeeId,
    assignedBy: assignedBy || 'SYSTEM',
    assignedAt: new Date().toISOString(),
    assignmentNotes: notes || '',
    status: visit.status === 'unassigned' ? 'assigned' : visit.status,
    updatedAt: new Date().toISOString()
  };

  // Zapisz
  if (!writeJSON(visitsPath, visits)) {
    return res.status(500).json({
      success: false,
      error: 'Nie można zapisać zmian'
    });
  }

  // Wyślij powiadomienie do serwisanta
  sendNotification(
    'Nowe zlecenie',
    `Przydzielono Ci wizytę ${visitId}. Klient: ${visit.client?.name || 'Nieznany'}`,
    'visit',
    `/technician/visit/${visitId}`,
    employeeId
  );

  console.log('✅ Wizyta przypisana:', visitId, '→', employeeId);

  return res.status(200).json({
    success: true,
    message: 'Wizyta przypisana',
    visit: visits[visitIndex]
  });
}
