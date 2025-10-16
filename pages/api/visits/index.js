import Fuse from 'fuse.js';
import { getServiceSupabase } from '../../../lib/supabase';

/**
 * API endpoint for visits management
 * GET /api/visits - Get all visits with filters
 * GET /api/visits?id=VIS123 - Get single visit
 * POST /api/visits - Create new visit
 * PUT /api/visits - Update visit
 * DELETE /api/visits - Delete visit
 */

// Helper: Enrich visit with related data
async function enrichVisit(visit, order, client, employee) {
  return {
    // Visit core data
    id: visit.id,
    visitId: visit.id, // Alias for backward compatibility
    orderId: visit.order_id,
    employeeId: visit.employee_id,
    
    // Dates and times
    scheduledDate: visit.scheduled_date ? visit.scheduled_date.split('T')[0] : null,
    scheduledTime: visit.scheduled_date ? visit.scheduled_date.split('T')[1]?.substring(0, 5) : null,
    scheduledDateTime: visit.scheduled_date,
    startedAt: visit.started_at,
    completedAt: visit.completed_at,
    
    // Visit details
    status: visit.status,
    type: visit.visit_type,
    visitType: visit.visit_type,
    workDescription: visit.work_description,
    
    // Location
    address: visit.address || order?.address,
    city: order?.city,
    street: order?.address,
    postalCode: order?.postal_code,
    latitude: visit.latitude,
    longitude: visit.longitude,
    
    // Parts and costs
    parts: visit.parts_used || [],
    partsUsed: visit.parts_used || [],
    partsCost: (visit.parts_used || []).reduce((sum, part) => sum + (parseFloat(part.price) || 0), 0),
    
    // Photos
    photos: visit.photos || [],
    beforePhotos: (visit.photos || []).filter(p => p.type === 'before'),
    afterPhotos: (visit.photos || []).filter(p => p.type === 'after'),
    totalPhotos: (visit.photos || []).length,
    
    // Duration
    durationMinutes: visit.duration_minutes,
    actualDuration: visit.duration_minutes,
    travelDistanceKm: visit.travel_distance_km,
    
    // Order information (if available)
    orderNumber: order?.order_number,
    orderStatus: order?.status,
    orderPriority: order?.priority,
    priority: order?.priority,
    
    // Device information (from order)
    deviceType: order?.device_type,
    deviceBrand: order?.brand,
    deviceModel: order?.model,
    deviceSerialNumber: order?.serial_number,
    deviceDescription: order?.description,
    
    // Client information (if available)
    clientId: order?.client_id,
    clientName: client?.name,
    clientPhone: client?.phone,
    clientEmail: client?.email,
    
    // Technician information (if available)
    technicianId: visit.employee_id,
    technicianName: employee?.name || 'Nieprzydzielony',
    technicianPhone: employee?.phone,
    technicianEmail: employee?.email,
    
    // Metadata
    metadata: visit.metadata || {},
    
    // Timestamps
    createdAt: visit.created_at,
    updatedAt: visit.updated_at,
    
    // Calculate costs
    totalCost: visit.metadata?.totalCost || 0,
    estimatedCost: visit.metadata?.estimatedCost || 0,
  };
}

// Helper: Apply filters using Fuse.js for search
function applySearchFilter(visits, search) {
  if (!search) return visits;
  
  const fuse = new Fuse(visits, {
    keys: [
      { name: 'clientName', weight: 2 },
      { name: 'address', weight: 1.5 },
      { name: 'city', weight: 1 },
      { name: 'deviceType', weight: 1.5 },
      { name: 'deviceBrand', weight: 1 },
      { name: 'deviceModel', weight: 1 },
      { name: 'id', weight: 1.5 },
      { name: 'orderId', weight: 1.5 },
      { name: 'technicianName', weight: 1 },
      { name: 'clientPhone', weight: 1 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  });
  
  const results = fuse.search(search);
  return results.map(r => r.item);
}

// Helper: Apply additional filters in memory (for complex filters not in DB)
function applyMemoryFilters(visits, filters) {
  let filtered = [...visits];
  
  // Filter by cost range
  if (filters.costMin !== undefined && filters.costMin !== null) {
    const minCost = parseFloat(filters.costMin) || 0;
    filtered = filtered.filter(v => (v.totalCost || 0) >= minCost);
  }
  
  if (filters.costMax !== undefined && filters.costMax !== null) {
    const maxCost = parseFloat(filters.costMax) || 5000;
    filtered = filtered.filter(v => (v.totalCost || 0) <= maxCost);
  }
  
  // Filter by withParts
  if (filters.withParts === 'true') {
    filtered = filtered.filter(v => {
      const parts = v.partsUsed || [];
      return Array.isArray(parts) && parts.length > 0;
    });
  }
  
  // Filter by withPhotos
  if (filters.withPhotos === 'true') {
    filtered = filtered.filter(v => {
      const photos = v.photos || [];
      return Array.isArray(photos) && photos.length > 0;
    });
  }
  
  // Filter by urgentOnly
  if (filters.urgentOnly === 'true') {
    filtered = filtered.filter(v => v.priority === 'urgent');
  }
  
  return filtered;
}

// Helper: Sort visits
function sortVisits(visits, sortBy, sortOrder) {
  const sorted = [...visits];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        const dateA = new Date(a.scheduledDateTime || a.scheduledDate || 0);
        const dateB = new Date(b.scheduledDateTime || b.scheduledDate || 0);
        comparison = dateA - dateB;
        break;

      case 'client':
        comparison = (a.clientName || '').localeCompare(b.clientName || '');
        break;

      case 'technician':
        comparison = (a.technicianName || '').localeCompare(b.technicianName || '');
        break;

      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;

      case 'type':
        comparison = (a.type || a.visitType || '').localeCompare(b.type || b.visitType || '');
        break;

      case 'cost':
        comparison = (a.totalCost || 0) - (b.totalCost || 0);
        break;

      case 'waitTime':
        const createdA = new Date(a.createdAt || a.scheduledDateTime || 0);
        const createdB = new Date(b.createdAt || b.scheduledDateTime || 0);
        comparison = createdA - createdB;
        break;

      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;
        comparison = priorityA - priorityB;
        break;

      default:
        const defaultDateA = new Date(a.scheduledDateTime || a.scheduledDate || 0);
        const defaultDateB = new Date(b.scheduledDateTime || b.scheduledDate || 0);
        comparison = defaultDateB - defaultDateA;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// Helper: Calculate statistics
function calculateStats(visits) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const stats = {
    total: visits.length,
    today: visits.filter(v => v.scheduledDate === today).length,
    thisWeek: visits.filter(v => {
      const visitDate = new Date(v.scheduledDate);
      return visitDate >= startOfWeek && visitDate < endOfWeek;
    }).length,
    
    byStatus: {
      scheduled: visits.filter(v => v.status === 'scheduled').length,
      in_progress: visits.filter(v => v.status === 'in_progress').length,
      completed: visits.filter(v => v.status === 'completed').length,
      cancelled: visits.filter(v => v.status === 'cancelled').length,
      rescheduled: visits.filter(v => v.status === 'rescheduled').length,
    },
    
    byType: {
      diagnosis: visits.filter(v => (v.type || v.visitType) === 'diagnosis').length,
      repair: visits.filter(v => (v.type || v.visitType) === 'repair').length,
      followup: visits.filter(v => (v.type || v.visitType) === 'followup').length,
      installation: visits.filter(v => (v.type || v.visitType) === 'installation').length,
      maintenance: visits.filter(v => (v.type || v.visitType) === 'maintenance').length,
    },
    
    byPriority: {
      normal: visits.filter(v => v.priority === 'normal').length,
      high: visits.filter(v => v.priority === 'high').length,
      urgent: visits.filter(v => v.priority === 'urgent').length,
    },
    
    averageDuration: visits
      .filter(v => v.durationMinutes || v.actualDuration)
      .reduce((sum, v) => sum + (v.durationMinutes || v.actualDuration || 0), 0) / 
      (visits.filter(v => v.durationMinutes || v.actualDuration).length || 1),
    
    totalCost: visits.reduce((sum, v) => sum + (v.totalCost || 0), 0),
    totalPartsCost: visits.reduce((sum, v) => sum + (v.partsCost || 0), 0),
  };

  return stats;
}

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === 'GET') {
    try {
      const {
        id,
        status,
        technicianId,
        selectedTechnicianIds,
        selectedStatuses,
        type,
        dateFrom,
        dateTo,
        today,
        priority,
        search,
        orderId,
        costMin,
        costMax,
        withParts,
        withPhotos,
        urgentOnly,
        sortBy = 'date',
        sortOrder = 'desc',
        page = '1',
        limit = '50',
        includeStats = 'true'
      } = req.query;

      // Build Supabase query
      let query = supabase.from('visits').select(`
        *,
        order:orders(id, order_number, client_id, status, priority, device_type, brand, model, serial_number, description, address, city, postal_code, parts),
        employee:employees(id, name, phone, email),
        client:orders(clients(id, name, phone, email))
      `);

      // Filter by ID
      if (id) {
        query = query.eq('id', id);
      }

      // Filter by order ID
      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      // Filter by status (multiple)
      if (selectedStatuses) {
        const statusArray = Array.isArray(selectedStatuses) 
          ? selectedStatuses 
          : selectedStatuses.split(',').map(s => s.trim());
        query = query.in('status', statusArray);
      } else if (status) {
        const statuses = status.split(',').map(s => s.trim());
        query = query.in('status', statuses);
      }

      // Filter by technician (multiple)
      if (selectedTechnicianIds) {
        const technicianArray = Array.isArray(selectedTechnicianIds) 
          ? selectedTechnicianIds 
          : selectedTechnicianIds.split(',').map(t => t.trim());
        query = query.in('employee_id', technicianArray);
      } else if (technicianId) {
        query = query.eq('employee_id', technicianId);
      }

      // Filter by visit type
      if (type) {
        const types = type.split(',').map(t => t.trim());
        query = query.in('visit_type', types);
      }

      // Filter by date range
      if (dateFrom) {
        query = query.gte('scheduled_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('scheduled_date', dateTo);
      }

      // Filter by today
      if (today === 'true') {
        const todayDate = new Date().toISOString().split('T')[0];
        query = query.gte('scheduled_date', `${todayDate}T00:00:00`)
                    .lt('scheduled_date', `${todayDate}T23:59:59`);
      }

      // Execute query
      const { data: visitsData, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch visits',
          details: error.message
        });
      }

      // Enrich visits with related data
      let visits = await Promise.all(visitsData.map(async (visit) => {
        const order = Array.isArray(visit.order) ? visit.order[0] : visit.order;
        const employee = Array.isArray(visit.employee) ? visit.employee[0] : visit.employee;
        const client = order?.clients ? (Array.isArray(order.clients) ? order.clients[0] : order.clients) : null;
        
        return enrichVisit(visit, order, client, employee);
      }));

      // Calculate stats before filtering (if requested)
      const stats = includeStats === 'true' ? calculateStats(visits) : null;

      // Apply memory filters (cost, parts, photos, urgent)
      visits = applyMemoryFilters(visits, {
        costMin,
        costMax,
        withParts,
        withPhotos,
        urgentOnly
      });

      // Apply search filter
      if (search) {
        visits = applySearchFilter(visits, search);
      }

      // Filter by priority (if not already filtered)
      if (priority) {
        const priorities = priority.split(',').map(p => p.trim());
        visits = visits.filter(v => priorities.includes(v.priority));
      }

      // If requesting single visit by ID
      if (id && visits.length === 1) {
        return res.status(200).json({
          success: true,
          visit: visits[0]
        });
      }

      // Sort visits
      visits = sortVisits(visits, sortBy, sortOrder);

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedVisits = visits.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        visits: paginatedVisits,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: visits.length,
          pages: Math.ceil(visits.length / limitNum)
        },
        stats: stats,
        filters: {
          status: selectedStatuses || status,
          technicianId: selectedTechnicianIds || technicianId,
          type,
          dateFrom,
          dateTo,
          today,
          priority,
          search
        }
      });

    } catch (error) {
      console.error('Error fetching visits:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }

  } else if (req.method === 'POST') {
    try {
      // POST: Create new visit
      const visitData = req.body;

      // Map camelCase to snake_case
      const dbData = {
        id: visitData.id || visitData.visitId || `VIS-${Date.now()}`,
        order_id: visitData.orderId,
        employee_id: visitData.employeeId || visitData.technicianId,
        scheduled_date: visitData.scheduledDate || visitData.scheduledDateTime,
        started_at: visitData.startedAt,
        completed_at: visitData.completedAt,
        status: visitData.status || 'scheduled',
        visit_type: visitData.type || visitData.visitType,
        address: visitData.address,
        latitude: visitData.latitude,
        longitude: visitData.longitude,
        work_description: visitData.workDescription,
        parts_used: visitData.partsUsed || [],
        photos: visitData.photos || [],
        duration_minutes: visitData.durationMinutes || visitData.estimatedDuration,
        travel_distance_km: visitData.travelDistanceKm,
        metadata: visitData.metadata || {}
      };

      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) delete dbData[key];
      });

      const { data, error } = await supabase
        .from('visits')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create visit',
          details: error.message
        });
      }

      return res.status(201).json({
        success: true,
        visit: data,
        message: 'Visit created successfully'
      });

    } catch (error) {
      console.error('Error creating visit:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }

  } else if (req.method === 'PUT') {
    try {
      // PUT: Update visit
      const { id, visitId, updates } = req.body;
      const updateId = id || visitId;

      if (!updateId) {
        return res.status(400).json({
          success: false,
          error: 'id or visitId is required'
        });
      }

      // Map camelCase to snake_case
      const dbUpdates = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.scheduledDate) dbUpdates.scheduled_date = updates.scheduledDate;
      if (updates.startedAt) dbUpdates.started_at = updates.startedAt;
      if (updates.completedAt) dbUpdates.completed_at = updates.completedAt;
      if (updates.visitType || updates.type) dbUpdates.visit_type = updates.visitType || updates.type;
      if (updates.workDescription) dbUpdates.work_description = updates.workDescription;
      if (updates.partsUsed) dbUpdates.parts_used = updates.partsUsed;
      if (updates.photos) dbUpdates.photos = updates.photos;
      if (updates.durationMinutes) dbUpdates.duration_minutes = updates.durationMinutes;
      if (updates.travelDistanceKm) dbUpdates.travel_distance_km = updates.travelDistanceKm;
      if (updates.metadata) dbUpdates.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('visits')
        .update(dbUpdates)
        .eq('id', updateId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update visit',
          details: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Visit not found'
        });
      }

      return res.status(200).json({
        success: true,
        visit: data,
        message: 'Visit updated successfully'
      });

    } catch (error) {
      console.error('Error updating visit:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }

  } else if (req.method === 'DELETE') {
    try {
      // DELETE: Remove visit
      const { id, visitId } = req.query;
      const deleteId = id || visitId;

      if (!deleteId) {
        return res.status(400).json({
          success: false,
          error: 'id or visitId is required'
        });
      }

      // Get visit before deleting (for response)
      const { data: visit } = await supabase
        .from('visits')
        .select()
        .eq('id', deleteId)
        .single();

      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete visit',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        visit: visit,
        message: 'Visit deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting visit:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }

  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
