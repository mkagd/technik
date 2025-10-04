import fs from 'fs';
import path from 'path';

/**
 * API endpoint for bulk visit operations
 * POST /api/visits/bulk-operations
 * Operations: assign, reschedule, cancel, update-status
 */

const ordersPath = path.join(process.cwd(), 'data', 'orders.json');

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { operation, visitIds, data: operationData } = req.body;

  // Validation
  if (!operation) {
    return res.status(400).json({
      success: false,
      error: 'Operation type is required'
    });
  }

  if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'visitIds array is required and must not be empty'
    });
  }

  // Read orders
  const orders = readJSON(ordersPath);
  if (!orders) {
    return res.status(500).json({
      success: false,
      error: 'Failed to read orders data'
    });
  }

  let updatedCount = 0;
  const updatedVisits = [];
  const errors = [];

  // Process each visit
  for (const orderId in orders) {
    const order = orders[orderId];
    
    if (order.visits && Array.isArray(order.visits)) {
      order.visits.forEach((visit, visitIndex) => {
        if (visitIds.includes(visit.visitId)) {
          try {
            switch (operation) {
              case 'assign':
                // Assign technician
                if (!operationData.technicianId || !operationData.technicianName) {
                  throw new Error('Technician ID and name required for assign operation');
                }
                order.visits[visitIndex] = {
                  ...visit,
                  technicianId: operationData.technicianId,
                  assignedTo: operationData.technicianId,
                  technicianName: operationData.technicianName,
                  updatedAt: new Date().toISOString(),
                  lastModifiedBy: operationData.modifiedBy || 'admin'
                };
                updatedCount++;
                updatedVisits.push(order.visits[visitIndex]);
                break;

              case 'reschedule':
                // Reschedule visit
                if (!operationData.newDate) {
                  throw new Error('New date required for reschedule operation');
                }
                
                const oldDate = visit.scheduledDate || visit.date;
                const oldTime = visit.scheduledTime || visit.time;
                
                order.visits[visitIndex] = {
                  ...visit,
                  scheduledDate: operationData.newDate,
                  date: operationData.newDate,
                  scheduledTime: operationData.newTime || visit.scheduledTime || visit.time,
                  time: operationData.newTime || visit.scheduledTime || visit.time,
                  status: visit.status === 'completed' ? visit.status : 'rescheduled',
                  previousSchedule: {
                    date: oldDate,
                    time: oldTime,
                    rescheduledAt: new Date().toISOString()
                  },
                  rescheduleReason: operationData.reason || null,
                  updatedAt: new Date().toISOString(),
                  lastModifiedBy: operationData.modifiedBy || 'admin'
                };
                updatedCount++;
                updatedVisits.push(order.visits[visitIndex]);
                break;

              case 'cancel':
                // Cancel visit
                if (visit.status === 'completed') {
                  errors.push({
                    visitId: visit.visitId,
                    error: 'Cannot cancel completed visit'
                  });
                  return;
                }
                
                order.visits[visitIndex] = {
                  ...visit,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  cancelReason: operationData.reason || 'Cancelled by admin',
                  cancelledBy: operationData.cancelledBy || 'admin',
                  updatedAt: new Date().toISOString(),
                  lastModifiedBy: operationData.modifiedBy || 'admin'
                };
                updatedCount++;
                updatedVisits.push(order.visits[visitIndex]);
                break;

              case 'update-status':
                // Update status
                if (!operationData.newStatus) {
                  throw new Error('New status required for update-status operation');
                }
                
                order.visits[visitIndex] = {
                  ...visit,
                  status: operationData.newStatus,
                  statusChangedAt: new Date().toISOString(),
                  statusChangedBy: operationData.modifiedBy || 'admin',
                  updatedAt: new Date().toISOString(),
                  lastModifiedBy: operationData.modifiedBy || 'admin'
                };
                
                // Set completedAt if status is completed
                if (operationData.newStatus === 'completed') {
                  order.visits[visitIndex].completedAt = new Date().toISOString();
                }
                
                updatedCount++;
                updatedVisits.push(order.visits[visitIndex]);
                break;

              case 'add-note':
                // Add note to visit
                if (!operationData.note) {
                  throw new Error('Note content required for add-note operation');
                }
                
                const existingNotes = visit.adminNotes || [];
                order.visits[visitIndex] = {
                  ...visit,
                  adminNotes: [
                    ...existingNotes,
                    {
                      text: operationData.note,
                      addedBy: operationData.modifiedBy || 'admin',
                      addedAt: new Date().toISOString()
                    }
                  ],
                  updatedAt: new Date().toISOString(),
                  lastModifiedBy: operationData.modifiedBy || 'admin'
                };
                updatedCount++;
                updatedVisits.push(order.visits[visitIndex]);
                break;

              default:
                throw new Error(`Unknown operation: ${operation}`);
            }
          } catch (error) {
            errors.push({
              visitId: visit.visitId,
              error: error.message
            });
          }
        }
      });
    }
  }

  // Save updated orders
  if (updatedCount > 0) {
    if (!writeJSON(ordersPath, orders)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save updated visits'
      });
    }
  }

  return res.status(200).json({
    success: true,
    operation,
    updatedCount,
    requestedCount: visitIds.length,
    updatedVisits,
    errors: errors.length > 0 ? errors : null,
    message: `Successfully ${operation === 'assign' ? 'assigned' : 
              operation === 'reschedule' ? 'rescheduled' : 
              operation === 'cancel' ? 'cancelled' : 
              operation === 'update-status' ? 'updated status of' :
              operation === 'add-note' ? 'added notes to' : 'updated'} ${updatedCount} visit(s)`
  });
}
