import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';

/**
 * API endpoint for visits management
 * Extracts and manages visits from orders.json
 * GET /api/visits - Get all visits with filters
 * GET /api/visits?id=VIS123 - Get single visit
 * PUT /api/visits - Update visit
 */

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');

// Helper: Read JSON file
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper: Write JSON file
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Helper: Extract all visits from orders
function extractVisits(orders, employees) {
  const visits = [];
  const employeeMap = {};
  
  // Create employee lookup map
  if (employees && Array.isArray(employees)) {
    employees.forEach(emp => {
      employeeMap[emp.id] = emp;
    });
  }

  if (!orders || !Array.isArray(orders)) return visits;

  orders.forEach(order => {
    if (order.visits && Array.isArray(order.visits)) {
      order.visits.forEach(visit => {
        // Enrich visit with order and employee data
        const technician = employeeMap[visit.technicianId] || employeeMap[visit.assignedTo];
        
        const enrichedVisit = {
          // Visit core data
          ...visit,
          
          // Order reference - USE orderNumber as primary ID
          orderId: visit.orderId || order.orderNumber || order.id,
          orderNumber: order.orderNumber,
          
          // Client information
          clientId: order.clientId,
          clientName: order.clientName,
          clientPhone: order.clientPhone,
          clientEmail: order.email,
          
          // Address information
          address: order.address,
          city: order.city,
          street: order.street,
          postalCode: order.postalCode,
          
          // Device information
          deviceType: order.deviceType,
          deviceBrand: order.brand,
          deviceModel: order.model,
          deviceSerialNumber: order.serialNumber,
          deviceDescription: order.description,
          
          // Order priority and status
          orderPriority: order.priority,
          orderStatus: order.status,
          
          // Technician information (enriched)
          technicianName: visit.technicianName || technician?.name || 'Nieprzydzielony',
          technicianPhone: technician?.phone || null,
          technicianEmail: technician?.email || null,
          technicianAvatar: technician?.avatar || null,
          
          // 🔧 Parts - Przypisane części z zamówienia
          parts: visit.parts || order.parts || [],
          
          // Parts used (calculate total if exists)
          partsUsed: visit.partsUsed || [],
          partsCost: visit.partsUsed?.reduce((sum, part) => sum + (part.price || 0), 0) || 0,
          
          // Costs summary
          totalCost: visit.totalCost || visit.estimatedCost || 0,
          
          // Photos
          beforePhotos: visit.beforePhotos || [],
          afterPhotos: visit.afterPhotos || [],
          totalPhotos: (visit.beforePhotos?.length || 0) + (visit.afterPhotos?.length || 0),
          
          // Work sessions
          workSessions: visit.workSessions || [],
          
          // Duration calculation
          estimatedDuration: visit.estimatedDuration || null,
          actualDuration: visit.actualDuration || null,
          
          // Timestamps
          createdAt: visit.createdAt,
          completedAt: visit.completedAt,
          scheduledDateTime: `${visit.scheduledDate || visit.date}T${visit.scheduledTime || visit.time || '00:00'}`,
        };

        visits.push(enrichedVisit);
      });
    }
  });

  return visits;
}

// Helper: Filter visits
function filterVisits(visits, filters) {
  let filtered = [...visits];

  // Filter by visit ID
  if (filters.id) {
    return filtered.filter(v => v.visitId === filters.id);
  }

  // Filter by status - ENHANCED for WEEK 3: Multiple selection support
  if (filters.selectedStatuses) {
    // NEW: Handle array from multiple selection checkboxes
    const statusArray = Array.isArray(filters.selectedStatuses) 
      ? filters.selectedStatuses 
      : filters.selectedStatuses.split(',').map(s => s.trim());
    
    if (statusArray.length > 0) {
      filtered = filtered.filter(v => statusArray.includes(v.status));
    }
  } else if (filters.status) {
    // LEGACY: Backward compatibility with old single-select filter
    const statuses = filters.status.split(',').map(s => s.trim());
    filtered = filtered.filter(v => statuses.includes(v.status));
  }

  // Filter by technician - ENHANCED for WEEK 3: Multiple selection support
  if (filters.selectedTechnicianIds) {
    // NEW: Handle array from multiple selection checkboxes
    const technicianArray = Array.isArray(filters.selectedTechnicianIds) 
      ? filters.selectedTechnicianIds 
      : filters.selectedTechnicianIds.split(',').map(t => t.trim());
    
    if (technicianArray.length > 0) {
      filtered = filtered.filter(v => 
        technicianArray.includes(v.technicianId) || 
        technicianArray.includes(v.assignedTo)
      );
    }
  } else if (filters.technicianId) {
    // LEGACY: Backward compatibility with old single-select filter
    filtered = filtered.filter(v => 
      v.technicianId === filters.technicianId || 
      v.assignedTo === filters.technicianId
    );
  }

  // Filter by visit type
  if (filters.type) {
    const types = filters.type.split(',').map(t => t.trim());
    filtered = filtered.filter(v => types.includes(v.type));
  }

  // Filter by date range
  if (filters.dateFrom) {
    filtered = filtered.filter(v => {
      const visitDate = v.scheduledDate || v.date;
      return visitDate >= filters.dateFrom;
    });
  }

  if (filters.dateTo) {
    filtered = filtered.filter(v => {
      const visitDate = v.scheduledDate || v.date;
      return visitDate <= filters.dateTo;
    });
  }

  // Filter by today
  if (filters.today === 'true') {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(v => {
      const visitDate = v.scheduledDate || v.date;
      return visitDate === today;
    });
  }

  // Filter by priority
  if (filters.priority) {
    const priorities = filters.priority.split(',').map(p => p.trim());
    filtered = filtered.filter(v => priorities.includes(v.priority || v.orderPriority));
  }

  // WEEK 3 PHASE 2: Filter by cost range
  if (filters.costMin !== undefined && filters.costMin !== null) {
    const minCost = parseFloat(filters.costMin) || 0;
    filtered = filtered.filter(v => (v.totalCost || 0) >= minCost);
  }

  if (filters.costMax !== undefined && filters.costMax !== null) {
    const maxCost = parseFloat(filters.costMax) || 5000;
    filtered = filtered.filter(v => (v.totalCost || 0) <= maxCost);
  }

  // WEEK 3 PHASE 3: Filter by withParts (has used parts)
  if (filters.withParts === 'true') {
    filtered = filtered.filter(v => {
      const parts = v.partsUsed || [];
      return Array.isArray(parts) && parts.length > 0;
    });
  }

  // WEEK 3 PHASE 3: Filter by withPhotos (has photos)
  if (filters.withPhotos === 'true') {
    filtered = filtered.filter(v => {
      const photos = v.photos || [];
      return Array.isArray(photos) && photos.length > 0;
    });
  }

  // WEEK 3 PHASE 3: Filter by urgentOnly (only urgent priority)
  if (filters.urgentOnly === 'true') {
    filtered = filtered.filter(v => {
      const priority = v.priority || v.orderPriority;
      return priority === 'urgent';
    });
  }

  // Search in client name, address, device using Fuse.js (fuzzy search)
  if (filters.search) {
    const fuse = new Fuse(filtered, {
      keys: [
        { name: 'clientName', weight: 2 },      // Most important
        { name: 'address', weight: 1.5 },
        { name: 'city', weight: 1 },
        { name: 'deviceType', weight: 1.5 },
        { name: 'deviceBrand', weight: 1 },
        { name: 'deviceModel', weight: 1 },
        { name: 'visitId', weight: 1.5 },
        { name: 'orderId', weight: 1.5 },
        { name: 'technicianName', weight: 1 },
        { name: 'clientPhone', weight: 1 }
      ],
      threshold: 0.3,              // 0 = exact match, 1 = anything matches
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    });
    
    const results = fuse.search(filters.search);
    filtered = results.map(r => r.item);  // Return items sorted by relevance
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
        const dateA = new Date(a.scheduledDateTime);
        const dateB = new Date(b.scheduledDateTime);
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
        comparison = (a.type || '').localeCompare(b.type || '');
        break;

      case 'cost':
        comparison = (a.totalCost || 0) - (b.totalCost || 0);
        break;

      case 'waitTime':
        // Sort by how long the visit has been waiting (createdAt to now)
        // Older visits = longer wait time = higher priority
        const createdA = new Date(a.createdAt || a.scheduledDateTime);
        const createdB = new Date(b.createdAt || b.scheduledDateTime);
        comparison = createdA - createdB; // Older first when asc
        break;

      case 'priority':
        // Sort by priority: urgent > high > normal > low
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityA = priorityOrder[a.priority || a.orderPriority] || 2;
        const priorityB = priorityOrder[b.priority || b.orderPriority] || 2;
        comparison = priorityA - priorityB;
        break;

      default:
        // Default: sort by date descending
        const defaultDateA = new Date(a.scheduledDateTime);
        const defaultDateB = new Date(b.scheduledDateTime);
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
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const stats = {
    total: visits.length,
    today: visits.filter(v => (v.scheduledDate || v.date) === today).length,
    thisWeek: visits.filter(v => {
      const visitDate = new Date(v.scheduledDate || v.date);
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
      diagnosis: visits.filter(v => v.type === 'diagnosis').length,
      repair: visits.filter(v => v.type === 'repair').length,
      followup: visits.filter(v => v.type === 'followup').length,
      installation: visits.filter(v => v.type === 'installation').length,
      maintenance: visits.filter(v => v.type === 'maintenance').length,
    },
    
    byPriority: {
      normal: visits.filter(v => (v.priority || v.orderPriority) === 'normal').length,
      high: visits.filter(v => (v.priority || v.orderPriority) === 'high').length,
      urgent: visits.filter(v => (v.priority || v.orderPriority) === 'urgent').length,
    },
    
    averageDuration: visits
      .filter(v => v.actualDuration)
      .reduce((sum, v) => sum + v.actualDuration, 0) / 
      (visits.filter(v => v.actualDuration).length || 1),
    
    totalCost: visits.reduce((sum, v) => sum + (v.totalCost || 0), 0),
    totalPartsCost: visits.reduce((sum, v) => sum + (v.partsCost || 0), 0),
  };

  return stats;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // GET: List visits with filters
    const {
      id,
      status,
      technicianId,
      type,
      dateFrom,
      dateTo,
      today,
      priority,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
      includeStats = 'true'
    } = req.query;

    // Read data
    const orders = readJSON(ordersPath);
    const employees = readJSON(employeesPath);

    if (!orders) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read orders data'
      });
    }

    // Extract all visits
    let visits = extractVisits(orders, employees);

    // Calculate stats before filtering (if requested)
    const stats = includeStats === 'true' ? calculateStats(visits) : null;

    // Apply filters
    visits = filterVisits(visits, {
      id,
      status,
      technicianId,
      type,
      dateFrom,
      dateTo,
      today,
      priority,
      search
    });

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
        status,
        technicianId,
        type,
        dateFrom,
        dateTo,
        today,
        priority,
        search
      }
    });

  } else if (req.method === 'PUT') {
    // PUT: Update visit
    const { visitId, updates, userId, userName, reason } = req.body;

    if (!visitId) {
      return res.status(400).json({
        success: false,
        error: 'visitId is required'
      });
    }

    const orders = readJSON(ordersPath);
    if (!orders) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read orders data'
      });
    }

    let visitFound = false;
    let updatedVisit = null;
    let oldVisit = null;
    let orderId = null;

    // Find and update visit in orders
    for (let order of orders) {
      if (order.visits && Array.isArray(order.visits)) {
        const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
        if (visitIndex !== -1) {
          // Store old state for audit log
          oldVisit = { ...order.visits[visitIndex] };
          orderId = order.id;

          // Update visit
          order.visits[visitIndex] = {
            ...order.visits[visitIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          updatedVisit = order.visits[visitIndex];
          visitFound = true;
          break;
        }
      }
    }

    if (!visitFound) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    // Save updated orders
    if (!writeJSON(ordersPath, orders)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save updated visit'
      });
    }

    // Create audit log entry (async, don't block response)
    try {
      const auditLogPath = path.join(process.cwd(), 'pages', 'api', 'visits', 'audit-log.js');
      
      // Call audit log API internally
      fetch(`http://localhost:${process.env.PORT || 3000}/api/visits/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          orderId,
          userId: userId || 'system',
          userName: userName || 'System',
          action: oldVisit.status !== updatedVisit.status ? 
                  (updatedVisit.status === 'cancelled' ? 'deleted' : 'updated') : 
                  'updated',
          reason: reason || `Zaktualizowano wizytę ${visitId}`,
          oldState: oldVisit,
          newState: updatedVisit
        })
      }).catch(err => {
        // Log error but don't fail the update
        console.error('Failed to create audit log:', err);
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }

    return res.status(200).json({
      success: true,
      visit: updatedVisit,
      message: 'Visit updated successfully'
    });

  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
