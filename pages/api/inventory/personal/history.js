import fs from 'fs';
import path from 'path';

const partUsagePath = path.join(process.cwd(), 'data', 'part-usage.json');
const technicianSessionsPath = path.join(process.cwd(), 'data', 'technician-sessions.json');
const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Walidacja tokenu (multi-auth: technician + employee)
function validateToken(token) {
  if (!token) return null;

  // Try technician-sessions.json
  const techSessions = readJSON(technicianSessionsPath);
  if (techSessions) {
    const session = techSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  // Try employee-sessions.json (fallback)
  const empSessions = readJSON(employeeSessionsPath);
  if (empSessions) {
    const session = empSessions.find(s => s.token === token && s.isValid);
    if (session) return session.employeeId;
  }

  return null;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  // Walidacja tokenu
  const token = req.headers.authorization?.replace('Bearer ', '');
  const authenticatedEmployeeId = validateToken(token);

  if (!authenticatedEmployeeId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Brak autoryzacji - zaloguj się ponownie' 
    });
  }
  
  const { 
    employeeId, 
    orderId, 
    usageId,
    dateFrom,
    dateTo,
    limit 
  } = req.query;
  
  // Odczytaj historię użycia
  let usageHistory = readJSON(partUsagePath);
  if (!usageHistory) {
    return res.status(500).json({ 
      success: false, 
      error: 'Nie można odczytać historii użycia' 
    });
  }
  
  // Filtrowanie
  if (usageId) {
    const usage = usageHistory.find(u => u.usageId === usageId);
    if (!usage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Użycie nie znalezione' 
      });
    }
    return res.status(200).json({ success: true, usage });
  }
  
  if (employeeId) {
    usageHistory = usageHistory.filter(u => u.employeeId === employeeId);
  }
  
  if (orderId) {
    usageHistory = usageHistory.filter(u => u.orderId === orderId);
  }
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    usageHistory = usageHistory.filter(u => new Date(u.usageDate) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    usageHistory = usageHistory.filter(u => new Date(u.usageDate) <= toDate);
  }
  
  // Sortowanie: najnowsze pierwsze
  usageHistory.sort((a, b) => new Date(b.usageDate) - new Date(a.usageDate));
  
  // Limit
  if (limit) {
    const limitNum = parseInt(limit);
    usageHistory = usageHistory.slice(0, limitNum);
  }
  
  // Oblicz statystyki
  const totalUsages = usageHistory.length;
  const totalValue = usageHistory.reduce((sum, u) => sum + u.totalValue, 0);
  const totalParts = usageHistory.reduce((sum, u) => {
    return sum + u.parts.reduce((partSum, p) => partSum + p.quantity, 0);
  }, 0);
  
  return res.status(200).json({ 
    success: true, 
    usageHistory,
    statistics: {
      totalUsages,
      totalParts,
      totalValue
    },
    count: usageHistory.length
  });
}
