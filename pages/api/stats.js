import { getServiceSupabase } from '../../lib/supabase';

/**
 * API endpoint for dashboard statistics - SUPABASE
 * GET /api/stats - Returns real-time statistics from all data sources
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();

    // Fetch all data in parallel
    const [
      { data: clients },
      { data: orders },
      { data: employees },
      { data: visits }
    ] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('visits').select('*')
    ]);

    // Calculate statistics
    const stats = {
      // Total counts
      totalClients: clients?.length || 0,
      totalOrders: orders?.length || 0,
      totalEmployees: employees?.length || 0,
      totalVisits: visits?.length || 0,

      // Order statistics by status
      ordersByStatus: {
        pending: orders?.filter(o => o.status === 'Oczekujące' || o.status === 'pending').length || 0,
        inProgress: orders?.filter(o => o.status === 'W trakcie' || o.status === 'in_progress').length || 0,
        completed: orders?.filter(o => o.status === 'Zakończone' || o.status === 'completed').length || 0,
        cancelled: orders?.filter(o => o.status === 'Anulowane' || o.status === 'cancelled').length || 0,
      },

      // Visit statistics by status
      visitsByStatus: {
        scheduled: visits?.filter(v => v.status === 'scheduled').length || 0,
        inProgress: visits?.filter(v => v.status === 'in_progress').length || 0,
        completed: visits?.filter(v => v.status === 'completed').length || 0,
        cancelled: visits?.filter(v => v.status === 'cancelled').length || 0,
      },

      // Today's visits
      todayVisits: getTodayVisits(visits || []),

      // This week's scheduled orders
      thisWeekOrders: getThisWeekOrders(orders || []),

      // Employee statistics
      activeEmployees: employees?.filter(e => e.is_active !== false).length || 0,
      inactiveEmployees: employees?.filter(e => e.is_active === false).length || 0,

      // Client satisfaction (from orders with rating in metadata)
      averageRating: calculateAverageRating(orders || []),
      totalRatings: orders?.filter(o => o.metadata?.rating).length || 0,

      // Recent activity (last 10 items)
      recentActivity: getRecentActivity(orders || [], visits || [], clients || []),

      // Priority distribution
      ordersByPriority: {
        low: orders?.filter(o => o.priority === 'Niska' || o.priority === 'low').length || 0,
        normal: orders?.filter(o => o.priority === 'Normalna' || o.priority === 'normal' || !o.priority).length || 0,
        high: orders?.filter(o => o.priority === 'Wysoka' || o.priority === 'high').length || 0,
        urgent: orders?.filter(o => o.priority === 'Pilne' || o.priority === 'urgent').length || 0,
      },

      // Device categories (AGD types)
      deviceCategories: getDeviceCategories(orders || []),

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
 * Get today's visits
 */
function getTodayVisits(visits) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return visits.filter(visit => {
    const visitDate = new Date(visit.scheduled_date || visit.scheduledDate);
    return visitDate >= today && visitDate < tomorrow;
  }).length;
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
    if (order.scheduled_date || order.scheduledDate) {
      const scheduledDate = new Date(order.scheduled_date || order.scheduledDate);
      return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
    }
    return false;
  }).length;
}

/**
 * Calculate average rating from orders
 */
function calculateAverageRating(orders) {
  const ordersWithRating = orders.filter(o => 
    (o.metadata?.rating && typeof o.metadata.rating === 'number') ||
    (o.rating && typeof o.rating === 'number')
  );
  
  if (ordersWithRating.length === 0) return 0;
  
  const sum = ordersWithRating.reduce((acc, o) => 
    acc + (o.metadata?.rating || o.rating), 0
  );
  return (sum / ordersWithRating.length).toFixed(1);
}

/**
 * Get recent activity (last 10 items)
 */
function getRecentActivity(orders, visits, clients) {
  const activities = [];

  // Add orders (with created_at)
  orders.forEach(order => {
    const date = order.created_at || order.createdAt;
    if (date) {
      activities.push({
        type: 'order',
        action: 'created',
        description: `Nowe zamówienie: ${order.device_type || order.deviceType || 'Urządzenie'} - ${order.brand || ''}`,
        date: date,
        id: order.id,
      });
    }
  });

  // Add visits
  visits.forEach(visit => {
    const date = visit.created_at || visit.createdAt;
    if (date) {
      activities.push({
        type: 'visit',
        action: 'created',
        description: `Nowa wizyta: ${visit.visit_type || 'Serwis'}`,
        date: date,
        id: visit.id,
      });
    }
  });

  // Add clients (with created_at)
  clients.forEach(client => {
    if (client.created_at || client.createdAt) {
      activities.push({
        type: 'client',
        action: 'registered',
        description: `Nowy klient: ${client.name || 'Klient'}`,
        date: client.created_at || client.createdAt,
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
    const category = order.device_type || order.deviceType || order.category || 'Inne';
    categories[category] = (categories[category] || 0) + 1;
  });

  return categories;
}
