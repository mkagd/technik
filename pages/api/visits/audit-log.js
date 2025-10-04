import fs from 'fs';
import path from 'path';

/**
 * API endpoint for visit audit logs
 * GET /api/visits/audit-log?visitId=VIS001 - Get logs for a visit
 * GET /api/visits/audit-log?userId=admin - Get logs by user
 * POST /api/visits/audit-log - Create new log entry
 * POST /api/visits/audit-log/rollback - Rollback to previous state
 */

// Helper: Generate unique ID
function generateId(prefix = 'VLOG') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

const auditLogPath = path.join(process.cwd(), 'data', 'visit-audit-logs.json');
const ordersPath = path.join(process.cwd(), 'data', 'orders.json');

// Helper: Read JSON file
function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { logs: [], _metadata: { version: '1.0', created: new Date().toISOString() } };
    }
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

// Helper: Calculate diff between two objects
function calculateDiff(oldObj, newObj, fieldMappings = {}) {
  const changes = [];
  
  // Default field display names
  const defaultMappings = {
    status: 'Status',
    scheduledDate: 'Data wizyty',
    scheduledTime: 'Godzina',
    technicianId: 'ID technika',
    technicianName: 'Technik',
    type: 'Typ wizyty',
    priority: 'Priorytet',
    technicianNotes: 'Notatki technika',
    estimatedCost: 'Szacowany koszt',
    totalCost: 'Całkowity koszt',
    completedAt: 'Data zakończenia'
  };

  const allMappings = { ...defaultMappings, ...fieldMappings };

  // Compare all fields
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  allKeys.forEach(key => {
    // Skip internal fields
    if (key.startsWith('_') || ['createdAt', 'updatedAt'].includes(key)) {
      return;
    }

    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];

    // Check if values are different
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue,
        displayName: allMappings[key] || key
      });
    }
  });

  return changes;
}

// Helper: Get request metadata
function getRequestMetadata(req) {
  return {
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    source: req.body?.source || 'api'
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET: Retrieve audit logs with filters
    const {
      visitId,
      orderId,
      userId,
      action,
      dateFrom,
      dateTo,
      limit = '50',
      offset = '0'
    } = req.query;

    const auditData = readJSON(auditLogPath);
    if (!auditData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read audit logs'
      });
    }

    let logs = auditData.logs || [];

    // Apply filters
    if (visitId) {
      logs = logs.filter(log => log.visitId === visitId);
    }

    if (orderId) {
      logs = logs.filter(log => log.orderId === orderId);
    }

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    if (dateFrom) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
    }

    if (dateTo) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(dateTo));
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedLogs = logs.slice(offsetNum, offsetNum + limitNum);

    return res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        total: logs.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < logs.length
      }
    });

  } else if (req.method === 'POST') {
    // POST: Create new audit log entry
    const {
      visitId,
      orderId,
      userId,
      userName,
      action,
      entity = 'visit',
      changes = [],
      reason = '',
      oldState = null,
      newState = null
    } = req.body;

    // Validation
    if (!visitId || !userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: visitId, userId, action'
      });
    }

    // Calculate changes if states provided
    let calculatedChanges = changes;
    if (oldState && newState && changes.length === 0) {
      calculatedChanges = calculateDiff(oldState, newState);
    }

    // Create log entry
    const logEntry = {
      id: generateId('VLOG'),
      visitId,
      orderId: orderId || null,
      timestamp: new Date().toISOString(),
      userId,
      userName: userName || userId,
      action,
      entity,
      changes: calculatedChanges,
      reason,
      metadata: getRequestMetadata(req)
    };

    // Read current logs
    const auditData = readJSON(auditLogPath);
    if (!auditData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read audit logs'
      });
    }

    // Append new log
    auditData.logs = auditData.logs || [];
    auditData.logs.push(logEntry);

    // Save
    if (!writeJSON(auditLogPath, auditData)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save audit log'
      });
    }

    return res.status(201).json({
      success: true,
      log: logEntry,
      message: 'Audit log created successfully'
    });

  } else if (req.method === 'PUT' && req.url?.includes('/rollback')) {
    // POST /rollback: Rollback visit to previous state
    const { logId, visitId, userId, userName, reason } = req.body;

    if (!logId || !visitId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: logId, visitId, userId'
      });
    }

    // Read audit logs
    const auditData = readJSON(auditLogPath);
    if (!auditData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read audit logs'
      });
    }

    // Find the log entry
    const logEntry = auditData.logs.find(log => log.id === logId);
    if (!logEntry) {
      return res.status(404).json({
        success: false,
        error: 'Log entry not found'
      });
    }

    // Read orders
    const orders = readJSON(ordersPath);
    if (!orders) {
      return res.status(500).json({
        success: false,
        error: 'Failed to read orders'
      });
    }

    // Find and rollback the visit
    let visitFound = false;
    let rolledBackVisit = null;
    let currentState = null;

    for (let order of orders) {
      if (order.visits && Array.isArray(order.visits)) {
        const visitIndex = order.visits.findIndex(v => v.visitId === visitId);
        if (visitIndex !== -1) {
          currentState = { ...order.visits[visitIndex] };

          // Apply rollback (revert changes)
          logEntry.changes.forEach(change => {
            order.visits[visitIndex][change.field] = change.oldValue;
          });

          order.visits[visitIndex].updatedAt = new Date().toISOString();
          rolledBackVisit = order.visits[visitIndex];
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

    // Save orders
    if (!writeJSON(ordersPath, orders)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save orders'
      });
    }

    // Create rollback audit log
    const rollbackLog = {
      id: generateId('VLOG'),
      visitId,
      orderId: logEntry.orderId,
      timestamp: new Date().toISOString(),
      userId,
      userName: userName || userId,
      action: 'rollback',
      entity: 'visit',
      changes: logEntry.changes.map(ch => ({
        ...ch,
        oldValue: ch.newValue,
        newValue: ch.oldValue
      })),
      reason: reason || `Cofnięto zmiany z logu ${logId}`,
      metadata: {
        ...getRequestMetadata(req),
        rolledBackLogId: logId
      }
    };

    auditData.logs.push(rollbackLog);
    writeJSON(auditLogPath, auditData);

    return res.status(200).json({
      success: true,
      visit: rolledBackVisit,
      rollbackLog,
      message: 'Visit rolled back successfully'
    });

  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
