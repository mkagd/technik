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
  console.log('🔵 [bulk-operations] Request received:', { method: req.method, operation: req.body?.operation, visitCount: req.body?.visitIds?.length });
  
  if (req.method !== 'POST') {
    console.log('❌ [bulk-operations] Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { operation, visitIds, data: operationData } = req.body;

  // Validation
  if (!operation) {
    console.log('❌ [bulk-operations] Missing operation');
    return res.status(400).json({
      success: false,
      error: 'Operation type is required'
    });
  }

  if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
    console.log('❌ [bulk-operations] Invalid visitIds:', visitIds);
    return res.status(400).json({
      success: false,
      error: 'visitIds array is required and must not be empty'
    });
  }

  console.log(`📋 [bulk-operations] Processing ${operation} for ${visitIds.length} visits`);


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

              case 'delete':
                // 🆕 Permanently delete visit from order
                console.log(`🗑️ [delete] Marking visit ${visit.visitId} for deletion`);
                if (!operationData.reason) {
                  console.log('❌ [delete] Missing reason');
                  throw new Error('Reason required for delete operation');
                }
                
                // Mark for deletion (we'll filter it out later)
                visit._markedForDeletion = true;
                visit._deleteReason = operationData.reason;
                visit._deletedBy = operationData.deletedBy || 'admin';
                visit._deletedAt = new Date().toISOString();
                updatedCount++;
                updatedVisits.push({...visit, visitId: visit.visitId, status: 'deleted'});
                console.log(`✅ [delete] Visit ${visit.visitId} marked for deletion`);
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

  // 🆕 If operation is delete, physically remove marked visits from orders
  if (operation === 'delete') {
    console.log('🗑️ [delete] Starting physical deletion phase...');
    let deletedCount = 0;
    for (const orderId in orders) {
      const order = orders[orderId];
      if (order.visits && Array.isArray(order.visits)) {
        const originalLength = order.visits.length;
        order.visits = order.visits.filter(visit => !visit._markedForDeletion);
        const removed = originalLength - order.visits.length;
        if (removed > 0) {
          console.log(`🗑️ [delete] Removed ${removed} visits from order ${orderId}`);
        }
        deletedCount += removed;
      }
    }
    console.log(`✅ [delete] Permanently deleted ${deletedCount} visits from orders`);
  }

  // Save updated orders
  if (updatedCount > 0) {
    console.log(`💾 [bulk-operations] Saving ${updatedCount} updated visits...`);
    if (!writeJSON(ordersPath, orders)) {
      console.log('❌ [bulk-operations] Failed to write orders file');
      return res.status(500).json({
        success: false,
        error: 'Failed to save updated visits'
      });
    }
    console.log('✅ [bulk-operations] Orders file saved successfully');
  }

  const response = {
    success: true,
    operation,
    updatedCount,
    deletedCount: operation === 'delete' ? updatedCount : undefined, // 🆕 dodano dla delete
    requestedCount: visitIds.length,
    updatedVisits,
    errors: errors.length > 0 ? errors : null,
    message: `Successfully ${operation === 'assign' ? 'assigned' : 
              operation === 'reschedule' ? 'rescheduled' : 
              operation === 'cancel' ? 'cancelled' : 
              operation === 'update-status' ? 'updated status of' :
              operation === 'add-note' ? 'added notes to' :
              operation === 'delete' ? 'deleted' : 'updated'} ${updatedCount} visit(s)`
  };
  
  console.log('✅ [bulk-operations] Returning success response:', response);
  return res.status(200).json(response);
}
