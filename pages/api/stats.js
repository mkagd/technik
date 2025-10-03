import fs from 'fs';
import path from 'path';

/**
 * API endpoint for dashboard statistics
 * GET /api/stats - Returns real-time statistics from all data sources
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read all data files
    const dataDir = path.join(process.cwd(), 'data');
    
    const clientsPath = path.join(dataDir, 'clients.json');
    const ordersPath = path.join(dataDir, 'orders.json');
    const employeesPath = path.join(dataDir, 'employees.json');
    const rezerwacjePath = path.join(dataDir, 'rezervacje.json'); // Uwaga: nazwa pliku z 'v' nie 'w'

    // Parse data
    const clients = fs.existsSync(clientsPath) 
      ? JSON.parse(fs.readFileSync(clientsPath, 'utf8'))
      : [];
    
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath, 'utf8'))
      : [];
    
    const employees = fs.existsSync(employeesPath)
      ? JSON.parse(fs.readFileSync(employeesPath, 'utf8'))
      : [];
    
    const rezerwacje = fs.existsSync(rezerwacjePath)
      ? JSON.parse(fs.readFileSync(rezerwacjePath, 'utf8'))
      : [];

    // Calculate statistics
    const stats = {
      // Total counts
      totalClients: clients.length,
      totalOrders: orders.length,
      totalEmployees: employees.length,
      totalReservations: rezerwacje.length,

      // Order statistics by status
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'Oczekujące' || o.status === 'pending').length,
        inProgress: orders.filter(o => o.status === 'W trakcie' || o.status === 'in_progress').length,
        completed: orders.filter(o => o.status === 'Zakończone' || o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'Anulowane' || o.status === 'cancelled').length,
      },

      // Reservation statistics by status
      reservationsByStatus: {
        pending: rezerwacje.filter(r => r.status === 'pending').length,
        contacted: rezerwacje.filter(r => r.status === 'contacted').length,
        scheduled: rezerwacje.filter(r => r.status === 'scheduled').length,
        confirmed: rezerwacje.filter(r => r.status === 'confirmed').length,
        completed: rezerwacje.filter(r => r.status === 'completed').length,
        cancelled: rezerwacje.filter(r => r.status === 'cancelled').length,
      },

      // Today's visits (from orders with visits array)
      todayVisits: getTodayVisits(orders),

      // This week's scheduled orders
      thisWeekOrders: getThisWeekOrders(orders),

      // Employee statistics
      activeEmployees: employees.filter(e => e.active !== false).length,
      inactiveEmployees: employees.filter(e => e.active === false).length,

      // Client satisfaction (from orders with rating)
      averageRating: calculateAverageRating(orders),
      totalRatings: orders.filter(o => o.rating).length,

      // Recent activity (last 10 items)
      recentActivity: getRecentActivity(orders, rezerwacje, clients),

      // Priority distribution
      ordersByPriority: {
        low: orders.filter(o => o.priority === 'Niska' || o.priority === 'low').length,
        normal: orders.filter(o => o.priority === 'Normalna' || o.priority === 'normal' || !o.priority).length,
        high: orders.filter(o => o.priority === 'Wysoka' || o.priority === 'high').length,
        urgent: orders.filter(o => o.priority === 'Pilne' || o.priority === 'urgent').length,
      },

      // Device categories (AGD types)
      deviceCategories: getDeviceCategories(orders),

      // Timestamp
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Error generating statistics:', error);
    return res.status(500).json({ 
      error: 'Failed to generate statistics',
      details: error.message 
    });
  }
}

/**
 * Get today's visits from orders
 */
function getTodayVisits(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let count = 0;
  orders.forEach(order => {
    if (order.visits && Array.isArray(order.visits)) {
      order.visits.forEach(visit => {
        const visitDate = new Date(visit.date || visit.scheduledDate);
        if (visitDate >= today && visitDate < tomorrow) {
          count++;
        }
      });
    }
  });

  return count;
}

/**
 * Get this week's scheduled orders
 */
function getThisWeekOrders(orders) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return orders.filter(order => {
    if (order.scheduledDate) {
      const scheduledDate = new Date(order.scheduledDate);
      return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
    }
    return false;
  }).length;
}

/**
 * Calculate average rating from orders
 */
function calculateAverageRating(orders) {
  const ordersWithRating = orders.filter(o => o.rating && typeof o.rating === 'number');
  if (ordersWithRating.length === 0) return 0;
  
  const sum = ordersWithRating.reduce((acc, o) => acc + o.rating, 0);
  return (sum / ordersWithRating.length).toFixed(1);
}

/**
 * Get recent activity (last 10 items)
 */
function getRecentActivity(orders, rezerwacje, clients) {
  const activities = [];

  // Add orders (with dateAdded or createdAt)
  orders.forEach(order => {
    const date = order.dateAdded || order.createdAt;
    if (date) {
      activities.push({
        type: 'order',
        action: 'created',
        description: `Nowe zamówienie: ${order.deviceType || 'Urządzenie'} - ${order.brand || ''}`,
        date: date,
        id: order.id,
      });
    }
  });

  // Add reservations
  rezerwacje.forEach(rez => {
    const date = rez.createdAt || rez.dateAdded;
    if (date) {
      activities.push({
        type: 'reservation',
        action: 'created',
        description: `Nowa rezerwacja: ${rez.category || 'AGD'} - ${rez.clientName || 'Klient'}`,
        date: date,
        id: rez.id,
      });
    }
  });

  // Add clients (with dateAdded)
  clients.forEach(client => {
    if (client.dateAdded) {
      activities.push({
        type: 'client',
        action: 'registered',
        description: `Nowy klient: ${client.name || 'Klient'}`,
        date: client.dateAdded,
        id: client.id,
      });
    }
  });

  // Sort by date descending and take last 10
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return activities.slice(0, 10);
}

/**
 * Get device categories distribution
 */
function getDeviceCategories(orders) {
  const categories = {};
  
  orders.forEach(order => {
    const category = order.deviceType || order.category || 'Inne';
    categories[category] = (categories[category] || 0) + 1;
  });

  return categories;
}
