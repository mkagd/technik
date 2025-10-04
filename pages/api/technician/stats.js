// pages/api/technician/stats.js
// 📊 API do statystyk i podsumowań dla pracownika

import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'technician-sessions.json');
const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

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

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading employees.json:', error);
    return [];
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

// Wyciągnij wizyty pracownika
const getEmployeeVisits = (employeeId) => {
  const orders = readOrders();
  let visits = [];

  orders.forEach(order => {
    if (order.visits && Array.isArray(order.visits)) {
      const empVisits = order.visits.filter(v => 
        v.assignedTo === employeeId || v.technicianId === employeeId
      );
      visits = visits.concat(empVisits.map(v => ({ ...v, _order: order })));
    }
  });

  return visits;
};

// Sprawdź czy data jest dziś
const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const date = new Date(dateString);
  return today.toDateString() === date.toDateString();
};

// Sprawdź czy data jest w tym tygodniu
const isThisWeek = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const date = new Date(dateString);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  return date >= startOfWeek && date < endOfWeek;
};

// Sprawdź czy data jest w tym miesiącu
const isThisMonth = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const date = new Date(dateString);
  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

// Generuj statystyki
const generateStats = (employeeId, period = 'all') => {
  const visits = getEmployeeVisits(employeeId);
  const employees = readEmployees();
  const employee = employees.find(e => e.id === employeeId);

  // Filtruj po okresie
  let filteredVisits = visits;
  
  if (period === 'today') {
    filteredVisits = visits.filter(v => isToday(v.date));
  } else if (period === 'week') {
    filteredVisits = visits.filter(v => isThisWeek(v.date));
  } else if (period === 'month') {
    filteredVisits = visits.filter(v => isThisMonth(v.date));
  }

  // Podstawowe liczby
  const total = filteredVisits.length;
  const completed = filteredVisits.filter(v => v.status === 'completed').length;
  const inProgress = filteredVisits.filter(v => v.status === 'in_progress').length;
  const scheduled = filteredVisits.filter(v => v.status === 'scheduled').length;
  const cancelled = filteredVisits.filter(v => v.status === 'cancelled').length;

  // Statystyki czasu
  const completedVisits = filteredVisits.filter(v => v.status === 'completed');
  const totalWorkTime = completedVisits.reduce((sum, v) => {
    return sum + (v.actualDuration || 0);
  }, 0);
  
  const avgWorkTime = completedVisits.length > 0 
    ? Math.round(totalWorkTime / completedVisits.length) 
    : 0;

  // Statystyki finansowe
  const totalRevenue = completedVisits.reduce((sum, v) => {
    return sum + (v.totalCost || v.estimatedCost || 0);
  }, 0);
  
  const avgRevenue = completedVisits.length > 0 
    ? Math.round(totalRevenue / completedVisits.length) 
    : 0;

  // Typy wizyt
  const visitsByType = {
    diagnosis: filteredVisits.filter(v => v.type === 'diagnosis').length,
    repair: filteredVisits.filter(v => v.type === 'repair').length,
    control: filteredVisits.filter(v => v.type === 'control').length,
    installation: filteredVisits.filter(v => v.type === 'installation').length
  };

  // Urządzenia
  const deviceCounts = {};
  filteredVisits.forEach(v => {
    const deviceType = v._order?.deviceType || 'Unknown';
    deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
  });

  // Top 5 urządzeń
  const topDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Miast
  const cityCounts = {};
  filteredVisits.forEach(v => {
    const city = v._order?.city || 'Unknown';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  // Najbliższe wizyty
  const now = new Date();
  const upcomingVisits = visits
    .filter(v => 
      (v.status === 'scheduled' || v.status === 'on_way') && 
      v.date && 
      new Date(v.date) >= now
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map(v => ({
      visitId: v.visitId,
      date: v.date,
      time: v.time,
      clientName: v._order?.clientName,
      deviceType: v._order?.deviceType,
      city: v._order?.city,
      status: v.status
    }));

  // Ostatnio zakończone
  const recentCompleted = visits
    .filter(v => v.status === 'completed' && v.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5)
    .map(v => ({
      visitId: v.visitId,
      completedAt: v.completedAt,
      clientName: v._order?.clientName,
      deviceType: v._order?.deviceType,
      duration: v.actualDuration,
      revenue: v.totalCost
    }));

  // Ocena i performance
  const performance = {
    rating: employee?.rating || 0,
    totalJobs: employee?.completedJobs || completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgTimeVsEstimate: calculateTimeEfficiency(completedVisits),
    onTimeRate: calculateOnTimeRate(completedVisits)
  };

  // Trendy (porównanie z poprzednim okresem)
  const trends = calculateTrends(visits, period);

  return {
    success: true,
    employeeId: employeeId,
    employeeName: employee?.name || 'Unknown',
    period: period,
    generatedAt: new Date().toISOString(),
    
    summary: {
      total,
      completed,
      inProgress,
      scheduled,
      cancelled,
      completionRate: performance.completionRate
    },
    
    time: {
      totalWorkTime,      // minuty
      avgWorkTime,        // minuty na wizytę
      totalHours: Math.round(totalWorkTime / 60 * 10) / 10,
      avgHours: Math.round(avgWorkTime / 60 * 10) / 10
    },
    
    financial: {
      totalRevenue,
      avgRevenue,
      currency: 'PLN'
    },
    
    visitTypes: visitsByType,
    
    topDevices,
    topCities,
    
    upcomingVisits,
    recentCompleted,
    
    performance,
    trends
  };
};

// Oblicz efektywność czasu (czy mieszczą się w estymacji)
const calculateTimeEfficiency = (visits) => {
  if (visits.length === 0) return 100;
  
  const efficiencies = visits
    .filter(v => v.actualDuration && v.estimatedDuration)
    .map(v => (v.estimatedDuration / v.actualDuration) * 100);
  
  if (efficiencies.length === 0) return 100;
  
  const avg = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
  return Math.round(avg);
};

// Oblicz % wizyt na czas
const calculateOnTimeRate = (visits) => {
  if (visits.length === 0) return 100;
  
  const onTime = visits.filter(v => {
    if (!v.scheduledDate || !v.completedAt) return true;
    const scheduled = new Date(v.scheduledDate);
    const completed = new Date(v.completedAt);
    // Uznajemy "na czas" jeśli tego samego dnia
    return scheduled.toDateString() === completed.toDateString();
  }).length;
  
  return Math.round((onTime / visits.length) * 100);
};

// Oblicz trendy
const calculateTrends = (allVisits, period) => {
  const now = new Date();
  let currentPeriodStart, previousPeriodStart, previousPeriodEnd;
  
  if (period === 'today') {
    currentPeriodStart = new Date(now.setHours(0, 0, 0, 0));
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
  } else if (period === 'week') {
    currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - now.getDay());
    currentPeriodStart.setHours(0, 0, 0, 0);
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
  } else if (period === 'month') {
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    return null;
  }
  
  const currentCompleted = allVisits.filter(v => 
    v.status === 'completed' && 
    v.completedAt && 
    new Date(v.completedAt) >= currentPeriodStart
  ).length;
  
  const previousCompleted = allVisits.filter(v => 
    v.status === 'completed' && 
    v.completedAt && 
    new Date(v.completedAt) >= previousPeriodStart &&
    new Date(v.completedAt) < previousPeriodEnd
  ).length;
  
  const change = previousCompleted > 0 
    ? Math.round(((currentCompleted - previousCompleted) / previousCompleted) * 100)
    : (currentCompleted > 0 ? 100 : 0);
  
  return {
    currentPeriod: currentCompleted,
    previousPeriod: previousCompleted,
    change: change,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
};

// ===========================
// MAIN API HANDLER
// ===========================

export default function handler(req, res) {
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

  const employee = validateToken(token);
  
  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    // Parametr okresu
    const { period } = req.query; // today, week, month, all

    console.log(`📊 Generuję statystyki dla ${employee.employeeId} (okres: ${period || 'all'})`);

    const stats = generateStats(employee.employeeId, period || 'all');

    console.log(`✅ Statystyki wygenerowane: ${stats.summary.total} wizyt`);

    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Error generating stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
