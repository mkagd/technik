import { getServiceSupabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';

// Helper: Generuj ID zamówienia dla pracownika
async function generateRequestId(employeeId) {
  const supabase = getServiceSupabase();
  
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  const dateTime = `${year}${month}${day}${hour}${minute}`;
  
  // Count employee's requests from Supabase
  const { count } = await supabase
    .from('part_requests')
    .select('*', { count: 'exact', head: true })
    .or(`employee_id.eq.${employeeId},requested_by.eq.${employeeId}`);
  
  const counter = (count || 0) + 1;
  
  return `ZC-${dateTime}-${String(counter).padStart(3, '0')}`;
}

// Helper: Sprawdź czy po deadline
async function isAfterDeadline() {
  const supabase = getServiceSupabase();
  
  const { data: config } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'ordering')
    .single();
  
  const deadline = config?.value?.defaultDeadline || '15:00';
  const [deadlineHour, deadlineMinute] = deadline.split(':').map(Number);
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (currentHour > deadlineHour) return true;
  if (currentHour === deadlineHour && currentMinute > deadlineMinute) return true;
  return false;
}

// Helper: Wyślij notyfikację (skipped for now - can be implemented later)
async function sendNotification(title, message, type, link, userId = null) {
  // TODO: Implement notifications table in Supabase
  logger.info(`Notification: ${title} - ${message}`);
}

// Helper: Znajdź pracownika
async function findEmployee(employeeId) {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('employees')
    .select()
    .eq('id', employeeId)
    .single();
  return data;
}

// Helper: Znajdź OCR (placeholder - implement if OCR table exists)
async function findOCR(ocrId) {
  // TODO: Implement OCR table if needed
  return null;
}

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === 'GET') {
    try {
      // ============================================
      // GET: Lista zamówień części
      // ============================================
      const { 
        id, 
        requestedBy, 
        requestedFor,
        visitId,
        orderNumber,
        status, 
        urgency,
        supplierId,
        limit 
      } = req.query;
      
      // Build query
      let query = supabase
        .from('part_requests')
        .select(`
          *,
          order:orders(order_number, client_id),
          employee:employees(id, name, email, phone)
        `);
      
      // Apply filters
      if (id) {
        query = query.eq('id', id);
      }
      
      if (requestedBy) {
        query = query.eq('requested_by', requestedBy);
      }
      
      if (requestedFor) {
        query = query.eq('employee_id', requestedFor);
      }
      
      if (visitId) {
        query = query.eq('visit_id', visitId);
      }
      
      if (orderNumber) {
        query = query.eq('order_id', orderNumber);
      }
      
      if (status) {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }
      
      if (urgency) {
        query = query.eq('urgency', urgency);
      }
      
      // Order by newest first
      query = query.order('requested_at', { ascending: false });
      
      // Apply limit
      if (limit) {
        query = query.limit(parseInt(limit));
      }
      
      const { data: requests, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Nie można odczytać zamówień',
          details: error.message
        });
      }
      
      // If requesting single item by id
      if (id && requests.length === 1) {
        return res.status(200).json({ 
          success: true, 
          request: requests[0] 
        });
      }
      
      // Filter by supplier in memory (JSONB array filtering)
      let filteredRequests = requests;
      if (supplierId) {
        filteredRequests = requests.filter(r => {
          const metadata = r.metadata || {};
          const parts = metadata.parts || [];
          return parts.some(p => p.preferredSupplierId === supplierId);
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        requests: filteredRequests,
        count: filteredRequests.length
      });
      
    } catch (error) {
      console.error('Error in GET part-requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
    
  } else if (req.method === 'POST') {
    try {
      // ============================================
      // POST: Nowe zamówienie części
      // ============================================
      const {
        requestedBy,
        requestedFor,
        orderId,
        visitId,
        orderNumber,
        clientName,
        deviceInfo,
        parts,
        urgency,
        preferredDelivery,
        paczkomatId,
        deliveryAddress,
        alternativeAddress,
        paymentMethod,
        notes
      } = req.body;
      
      logger.debug('🔍 DEBUG parts received:', JSON.stringify(parts, null, 2));
      
      // Walidacja
      if (!requestedBy || !requestedFor || !parts || !Array.isArray(parts) || parts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Brak wymaganych pól: requestedBy, requestedFor, parts' 
        });
      }
      
      // Sprawdź czy pracownicy istnieją
      const requester = await findEmployee(requestedBy);
      const recipient = await findEmployee(requestedFor);
      
      if (!requester || !recipient) {
        return res.status(400).json({ 
          success: false, 
          error: 'Pracownik nie znaleziony' 
        });
      }
      
      // Sprawdź deadline i oblicz express charge
      const afterDeadline = await isAfterDeadline();
      const { data: config } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ordering')
        .single();
      
      const expressCharge = afterDeadline && urgency === 'urgent' 
        ? (config?.value?.afterDeadlineCharge || 25) 
        : 0;
      
      // Generuj ID
      const requestId = await generateRequestId(requestedFor);
      
      // Określ czy to admin ordering dla kogoś innego
      const isAdminOrder = requestedBy !== requestedFor;
      
      // Utwórz zamówienie w bazie danych
      const dbData = {
        id: requestId,
        order_id: orderId,
        employee_id: requestedFor,
        part_name: parts.map(p => p.name || p.partId).join(', '),
        quantity: parts.reduce((sum, p) => sum + (p.quantity || 1), 0),
        urgency: urgency || 'normal',
        status: 'pending',
        notes: notes,
        requested_at: new Date().toISOString(),
        fulfilled_at: null,
        metadata: {
          requestedBy,
          requestedByName: requester.name,
          requestedForName: recipient.name,
          isAdminOrder,
          visitId: visitId || null,
          orderNumber: orderNumber || null,
          clientName: clientName || null,
          deviceInfo: deviceInfo || null,
          parts: parts.map(part => ({
            partId: part.partId,
            name: part.name,
            quantity: part.quantity || 1,
            preferredSupplierId: part.preferredSupplierId || null,
            northData: part.northData || null
          })),
          afterDeadline,
          expressCharge,
          preferredDelivery: preferredDelivery || 'office',
          paczkomatId: paczkomatId || null,
          deliveryAddress: deliveryAddress || null,
          alternativeAddress: alternativeAddress || null,
          paymentMethod: paymentMethod || 'prepaid',
          pricing: req.body.pricing || {
            partsTotal: 0,
            laborCost: 0,
            totalCost: 0,
            paymentMethod: null,
            paymentStatus: 'unpaid',
            paidAmount: 0,
            clientCharged: false
          }
        }
      };
      
      logger.debug('💾 DEBUG dbData before insert:', JSON.stringify(dbData, null, 2));
      
      const { data: newRequest, error } = await supabase
        .from('part_requests')
        .insert([dbData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Nie można zapisać zamówienia',
          details: error.message
        });
      }
      
      // Wyślij notyfikacje
      const urgencyLabel = urgency === 'urgent' ? '🔴 PILNE' : urgency === 'tomorrow' ? '⚠️ NA JUTRO' : '';
      const expressLabel = expressCharge > 0 ? ` (+${expressCharge}zł express)` : '';
      const adminLabel = isAdminOrder ? ` [Admin zamawia dla ${recipient.name}]` : '';
      
      await sendNotification(
        `${urgencyLabel} Nowe zamówienie części`,
        `${requester.name} zamówił ${parts.length} części${expressLabel}${adminLabel}`,
        urgency === 'urgent' ? 'error' : 'info',
        `/admin/logistyk/zamowienia?id=${requestId}`,
        null
      );
      
      return res.status(201).json({ 
        success: true, 
        request: newRequest,
        message: `Zamówienie ${requestId} utworzone pomyślnie`
      });
      
    } catch (error) {
      console.error('Error in POST part-requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
    
  } else if (req.method === 'PUT') {
    try {
      // UPDATE REQUEST
      const { id, requestId, updates } = req.body;
      const updateId = id || requestId;
      
      if (!updateId) {
        return res.status(400).json({ 
          success: false, 
          error: 'id or requestId is required' 
        });
      }
      
      // Build update object
      const dbUpdates = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.urgency) dbUpdates.urgency = updates.urgency;
      if (updates.notes) dbUpdates.notes = updates.notes;
      if (updates.fulfilledAt) dbUpdates.fulfilled_at = updates.fulfilledAt;
      
      // Update metadata if provided
      if (updates.attachedPhotos || updates.metadata) {
        // Get current metadata first
        const { data: current } = await supabase
          .from('part_requests')
          .select('metadata')
          .eq('id', updateId)
          .single();
        
        dbUpdates.metadata = {
          ...(current?.metadata || {}),
          ...(updates.metadata || {}),
          attachedPhotos: updates.attachedPhotos || current?.metadata?.attachedPhotos
        };
      }
      
      const { data, error } = await supabase
        .from('part_requests')
        .update(dbUpdates)
        .eq('id', updateId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Could not update request',
          details: error.message
        });
      }
      
      if (!data) {
        return res.status(404).json({ 
          success: false, 
          error: 'Request not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        request: data,
        message: 'Request updated successfully'
      });
      
    } catch (error) {
      console.error('Error in PUT part-requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
    
  } else {
    return res.status(405).json({ 
      success: false, 
      error: 'Metoda niedozwolona' 
    });
  }
}
