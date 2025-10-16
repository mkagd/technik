// pages/api/orders.js
// API endpoint dla zarządzania zamówieniami - SUPABASE + ENHANCED v4.0 + KOMPATYBILNOŚĆ AGD MOBILE
// ✅ Migracja do Supabase PostgreSQL
// ✅ 100% kompatybilność z AGD Mobile (builtInParams, detectedCall, googleContactData)
// ✅ Nowe funkcje: system wizyt, poprawne clientId (CLI), ORDA format
// ✅ Mapowanie statusów AGD Mobile ↔ Web
// ✅ Obsługa 74 pól Enhanced v4.0

import { getServiceSupabase } from '../../lib/supabase';

import { 
    generateOrderId, 
    generateVisitId,
    parseId 
} from '../../utils/id-generator';

import { ENHANCED_ORDER_STRUCTURE_V4 } from '../../shared/enhanced-order-structure-v4';
import { AGDMobileToV4Converter } from '../../shared/agd-mobile-to-v4-converter';
import { apiLogger, logger } from '../../utils/logger';

export default async function handler(req, res) {
    const supabase = getServiceSupabase();
    
    if (req.method === 'GET') {
        try {
            const { id, clientId } = req.query;
            
            // Jeśli podano ID, zwróć pojedyncze zamówienie
            if (id) {
                const { data: order, error } = await supabase
                    .from('orders')
                    .select('*')
                    .or(`id.eq.${id},order_number.eq.${id}`)
                    .single();
                
                if (error || !order) {
                    return res.status(404).json({ message: 'Zamówienie nie znalezione' });
                }
                return res.status(200).json(order);
            }
            
            // ✅ FIXED: Filtruj po clientId (dla dashboardu klienta)
            if (clientId) {
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('client_id', clientId);
                
                if (error) {
                    console.error('Error fetching client orders:', error);
                    return res.status(500).json({ success: false, message: 'Błąd odczytu zamówień' });
                }
                
                return res.status(200).json({ 
                    success: true,
                    orders: orders || []
                });
            }
            
            // Zwróć wszystkie zamówienia
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching orders:', error);
                return res.status(500).json({ success: false, message: 'Błąd odczytu zamówień' });
            }
            
            return res.status(200).json(orders || []);
        } catch (error) {
            console.error('Error in GET /api/orders:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd odczytu zamówień' 
            });
        }
    }

    if (req.method === 'POST') {
        try {
            const orderData = req.body;
            const converter = new AGDMobileToV4Converter();
            
            // ========== WYKRYJ ŹRÓDŁO ZLECENIA ==========
            const isAGDMobile = detectAGDMobileOrder(orderData);
            let processedOrderData;
            
            if (isAGDMobile) {
                processedOrderData = converter.convertSingleOrder(orderData);
            } else {
                processedOrderData = await processWebOrder(orderData, supabase);
            }
            
            // ========== WALIDACJA ENHANCED v4.0 ==========
            const validationErrors = await validateEnhancedV4Order(processedOrderData, supabase);
            if (validationErrors.length > 0) {
                return res.status(400).json({ 
                    message: 'Błędy walidacji Enhanced v4.0',
                    errors: validationErrors,
                    source: isAGDMobile ? 'agd_mobile' : 'web'
                });
            }
            
            // ========== FINALNE UZUPEŁNIENIE ==========
            const source = isAGDMobile ? 'mobile-app' : (orderData.source || 'admin-panel');
            
            const finalOrderData = {
                id: processedOrderData.id || processedOrderData.orderNumber,
                order_number: processedOrderData.orderNumber,
                client_id: processedOrderData.clientId,
                employee_id: processedOrderData.assignedTo || null,
                
                // Device info
                device_type: processedOrderData.deviceType || processedOrderData.deviceDetails?.deviceType,
                brand: processedOrderData.brand,
                model: processedOrderData.model,
                serial_number: processedOrderData.serialNumber,
                
                // Order details
                description: processedOrderData.description || processedOrderData.problemDescription,
                status: processedOrderData.status || 'new',
                priority: processedOrderData.priority || 'normal',
                
                // Dates
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                scheduled_date: processedOrderData.appointmentDate || processedOrderData.scheduledDate,
                completed_date: processedOrderData.completedAt,
                
                // Location
                address: processedOrderData.serviceAddress || processedOrderData.clientAddress,
                city: processedOrderData.city,
                postal_code: processedOrderData.postalCode,
                latitude: processedOrderData.latitude,
                longitude: processedOrderData.longitude,
                
                // Pricing
                estimated_cost: processedOrderData.estimatedCost,
                final_cost: processedOrderData.finalCost,
                parts_cost: processedOrderData.partsCost,
                labor_cost: processedOrderData.laborCost,
                
                // Additional data (JSONB)
                photos: processedOrderData.photos || [],
                notes: processedOrderData.notes,
                internal_notes: processedOrderData.internalNotes,
                metadata: {
                    source: source,
                    sourceDetails: orderData.sourceDetails || (isAGDMobile ? 'agd-mobile-app' : 'admin-panel'),
                    createdBy: orderData.createdBy || orderData.selectedEmployee || 'admin',
                    createdByName: orderData.createdByName || (isAGDMobile ? 'AGD Mobile App' : 'Panel Admina'),
                    userId: orderData.userId || null,
                    isUserCreated: !!orderData.userId,
                    createdFromIP: orderData.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
                    version: '4.0',
                    visitId: processedOrderData.visitId,
                    devices: processedOrderData.devices || [],
                    symptoms: processedOrderData.symptoms || [],
                    partsUsed: processedOrderData.partsUsed || [],
                    statusHistory: processedOrderData.statusHistory || [],
                    history: processedOrderData.history || [],
                    deviceDetails: processedOrderData.deviceDetails,
                    builtInParams: processedOrderData.builtInParams,
                    detectedCall: processedOrderData.detectedCall,
                    googleContactData: processedOrderData.googleContactData,
                    ...processedOrderData.metadata
                }
            };

            const { data: newOrder, error } = await supabase
                .from('orders')
                .insert([finalOrderData])
                .select()
                .single();
            
            if (error) {
                console.error('Error creating order:', error);
                return res.status(500).json({ message: 'Błąd dodawania zamówienia Enhanced v4.0', error: error.message });
            }
            
            return res.status(201).json({ 
                order: newOrder,
                message: 'Zlecenie Enhanced v4.0 utworzone pomyślnie',
                compatibility: {
                    source: source,
                    version: '4.0',
                    agdMobileFieldsPreserved: isAGDMobile
                }
            });
        } catch (error) {
            console.error('Error in POST /api/orders:', error);
            return res.status(500).json({ 
                message: 'Błąd serwera Enhanced v4.0',
                error: error.message 
            });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updatedOrder = req.body;

            if (!updatedOrder.id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            // Map fields to database schema
            const updateData = {
                employee_id: updatedOrder.assignedTo || updatedOrder.employee_id,
                device_type: updatedOrder.deviceType || updatedOrder.device_type,
                brand: updatedOrder.brand,
                model: updatedOrder.model,
                serial_number: updatedOrder.serialNumber || updatedOrder.serial_number,
                description: updatedOrder.description || updatedOrder.problemDescription,
                status: updatedOrder.status,
                priority: updatedOrder.priority,
                scheduled_date: updatedOrder.scheduledDate || updatedOrder.scheduled_date,
                completed_date: updatedOrder.completedAt || updatedOrder.completed_date,
                address: updatedOrder.serviceAddress || updatedOrder.address,
                city: updatedOrder.city,
                postal_code: updatedOrder.postalCode || updatedOrder.postal_code,
                estimated_cost: updatedOrder.estimatedCost || updatedOrder.estimated_cost,
                final_cost: updatedOrder.finalCost || updatedOrder.final_cost,
                parts_cost: updatedOrder.partsCost || updatedOrder.parts_cost,
                labor_cost: updatedOrder.laborCost || updatedOrder.labor_cost,
                photos: updatedOrder.photos,
                notes: updatedOrder.notes,
                internal_notes: updatedOrder.internalNotes || updatedOrder.internal_notes,
                metadata: {
                    ...updatedOrder.metadata,
                    lastUpdatedBy: 'admin',
                    lastUpdatedAt: new Date().toISOString()
                }
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => 
                updateData[key] === undefined && delete updateData[key]
            );

            const { data: result, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', updatedOrder.id)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating order:', error);
                return res.status(500).json({ message: 'Błąd aktualizacji zamówienia', error: error.message });
            }
            
            if (!result) {
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
            
            return res.status(200).json({ order: result });
        } catch (error) {
            console.error('Error in PUT /api/orders:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia', error: error.message });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const { id, ...patch } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            // Add updated_at to patch
            patch.updated_at = new Date().toISOString();

            const { data: result, error } = await supabase
                .from('orders')
                .update(patch)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Error patching order:', error);
                return res.status(500).json({ message: 'Błąd aktualizacji zamówienia', error: error.message });
            }
            
            if (!result) {
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
            
            return res.status(200).json({ order: result });
        } catch (error) {
            console.error('Error in PATCH /api/orders:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }
            
            // Get order before deleting for response
            const { data: order } = await supabase
                .from('orders')
                .select('id, order_number')
                .eq('id', id)
                .single();
            
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error deleting order:', error);
                return res.status(500).json({ 
                    message: 'Błąd usuwania zamówienia',
                    error: error.message,
                    success: false 
                });
            }
            
            return res.status(200).json({ 
                message: 'Zamówienie usunięte',
                deletedId: id,
                deleted: order,
                success: true
            });
        } catch (error) {
            console.error('Error in DELETE /api/orders:', error);
            return res.status(500).json({ 
                message: 'Błąd serwera',
                error: error.message 
            });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}

// ========== FUNKCJE POMOCNICZE ==========

/**
 * 🔍 Wykrywa czy zlecenie pochodzi z AGD Mobile
 */
function detectAGDMobileOrder(orderData) {
    // Charakterystyczne pola AGD Mobile
    const agdMobileIndicators = [
        'builtInParams',      // System zabudowy
        'detectedCall',       // Wykrywanie połączeń
        'googleContactData',  // Google Contacts
        'selectedEmployee',   // Wybrany pracownik AGD
        'entryTime',         // Timestamp rozpoczęcia
        'workSessions'       // Sesje robocze
    ];
    
    // Statusy typowe dla AGD Mobile
    const agdMobileStatuses = ['Nowe', 'W realizacji', 'Zakończone'];
    
    // Sprawdź czy ma charakterystyczne pola
    const hasAGDFields = agdMobileIndicators.some(field => orderData[field] !== undefined);
    
    // Sprawdź status AGD Mobile
    const hasAGDStatus = agdMobileStatuses.includes(orderData.status);
    
    // Sprawdź stary format clientId
    const hasOldClientId = orderData.clientId && orderData.clientId.startsWith('OLD');
    
    return hasAGDFields || hasAGDStatus || hasOldClientId;
}

/**
 * 🌐 Przetwarza zlecenie webowe na Enhanced v4.0
 */
async function processWebOrder(orderData, supabase) {
    // Określ źródło zlecenia
    const source = orderData.source || 'admin-panel'; // admin tworzy przez ten endpoint
    
    // Get all orders to generate proper ID
    const { data: orders } = await supabase.from('orders').select('order_number');
    
    return {
        ...orderData,
        
        // Generuj ID jeśli brak (z nowym formatem ORDW/ORDA/ORDU itd.)
        orderNumber: orderData.orderNumber || generateOrderId(orders || [], new Date(), source),
        visitId: orderData.visitId || (orderData.appointmentDate ? generateVisitId(orders || [], new Date(), source) : null),
        
        // Pobierz nazwę klienta
        clientName: orderData.clientName || await getClientName(orderData.clientId, supabase),
        
        // Mapuj clientId jeśli stary format
        clientId: mapClientIdFormat(orderData.clientId),
        clientId_legacy: orderData.clientId?.startsWith('OLD') ? orderData.clientId : null,
        
        // Domyślne wartości
        source: 'web',
        status: mapStatusToEnhanced(orderData.status) || 'pending',
        priority: orderData.priority || 'medium',
        warrantyMonths: orderData.warrantyMonths || 3,
        
        // Szczegóły urządzenia i czasu naprawy
        deviceDetails: orderData.deviceDetails || {
            deviceType: orderData.deviceType || null,
            hasDemontaz: orderData.hasDemontaz || false,
            hasMontaz: orderData.hasMontaz || false,
            hasTrudnaZabudowa: orderData.hasTrudnaZabudowa || false,
            manualAdditionalTime: orderData.manualAdditionalTime || 0
        },
        
        // Inicjalizacja struktur
        devices: orderData.devices || [],
        symptoms: orderData.symptoms || [],
        partsUsed: orderData.partsUsed || [],
        photos: orderData.photos || [],
        notifications: orderData.notifications || [],
        
        // Historia statusów
        statusHistory: orderData.statusHistory || [{
            status: orderData.status || 'pending',
            timestamp: new Date().toISOString(),
            user: orderData.createdBy || 'system',
            note: 'Zlecenie utworzone przez web'
        }],
        
        // Historia zmian
        history: orderData.history || [{
            date: new Date().toISOString(),
            action: 'Utworzenie zlecenia',
            details: `Zlecenie utworzone przez web dla: ${orderData.clientName || 'klient'}`,
            description: `🌐 Zlecenie webowe\n📋 Status: ${orderData.status || 'pending'}\n🆔 ID: ${orderData.clientId}`
        }],
        
        // Metadane Enhanced v4.0
        migratedFrom: null,
        migrationDate: null,
        version: '4.0'
    };
}

/**
 * 🔍 Waliduje zlecenie Enhanced v4.0
 */
async function validateEnhancedV4Order(orderData, supabase) {
    const errors = [];
    const structure = ENHANCED_ORDER_STRUCTURE_V4;
    
    // Sprawdź wymagane pola podstawowe
    if (!orderData.clientId) {
        errors.push('clientId jest wymagane');
    } else if (!orderData.clientId.match(/^CLI[WUATCQPEMRVFNSIX]\d{9}$/)) {
        errors.push('clientId musi mieć nowy format CLIW252750001 (13 znaków) lub stary CLI12345678');
    }
    
    if (!orderData.orderNumber) {
        errors.push('orderNumber jest wymagane');
    } else if (!orderData.orderNumber.match(/^ORD[WUATCQPEMRVFNSIX]\d{9}$/)) {
        errors.push('orderNumber musi mieć nowy format ORDW252750001 (13 znaków) lub stary ORDA12345678');
    }
    
    // Sprawdź opis (fallback na description lub problemDescription)
    const hasDescription = orderData.description || orderData.problemDescription;
    if (!hasDescription || hasDescription.length < 10) {
        errors.push('description lub problemDescription musi mieć min. 10 znaków');
    }
    
    // Sprawdź czy klient istnieje (tylko dla nowych clientId)
    if (orderData.clientId && !orderData.clientId.startsWith('OLD')) {
        const client = await getClientById(orderData.clientId, supabase);
        if (!client) {
            // Warning, nie error - może być nowy klient
            console.warn(`⚠️ Client ${orderData.clientId} not found in database`);
        }
    }
    
    // Walidacja wizyt
    if (orderData.visitId) {
        if (!orderData.visitId.match(/^VIS[WUATCQPEMRVFNSIX]\d{9}$/)) {
            errors.push('visitId musi mieć nowy format VISW252750001 (13 znaków) lub stary VIS12345678');
        }
        
        if (orderData.appointmentDate) {
            const appointmentDate = new Date(orderData.appointmentDate);
            if (isNaN(appointmentDate.getTime())) {
                errors.push('appointmentDate musi być prawidłową datą');
            }
        }
    }
    
    // Walidacja statusów (Enhanced v4.0 obsługuje AGD Mobile + Web)
    const validStatuses = [
        // AGD Mobile
        'Nowe', 'W realizacji', 'Zakończone',
        // Web
        'pending', 'assigned', 'in_progress', 'waiting_parts', 'waiting_client', 'testing', 'completed', 'cancelled', 'deferred'
    ];
    if (orderData.status && !validStatuses.includes(orderData.status)) {
        errors.push(`status musi być jednym z: ${validStatuses.join(', ')}`);
    }
    
    const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (orderData.priority && !validPriorities.includes(orderData.priority)) {
        errors.push(`priority musi być jednym z: ${validPriorities.join(', ')}`);
    }
    
    // Walidacja urządzeń (jeśli podane)
    if (orderData.devices && Array.isArray(orderData.devices)) {
        orderData.devices.forEach((device, index) => {
            if (!device.deviceType) {
                errors.push(`devices[${index}].deviceType jest wymagane`);
            }
        });
    }
    
    // Walidacja AGD Mobile specyficznych pól
    if (orderData.builtInParams && typeof orderData.builtInParams !== 'object') {
        errors.push('builtInParams musi być obiektem');
    }
    
    if (orderData.detectedCall && typeof orderData.detectedCall !== 'object') {
        errors.push('detectedCall musi być obiektem');
    }
    
    return errors;
}

// Funkcje generateOrderNumber() i generateVisitId() zostały zastąpione
// przez nowy system z utils/id-generator.js który obsługuje 16 źródeł (W, U, A, T, C, Q, P, E, M, R, V, F, N, S, I, X)
// i format: PREFIX(3) + SOURCE(1) + YEAR(2) + DAY(3) + SEQUENCE(4) = 13 znaków
// Przykład: ORDW252750001 = ORD + W(web-form) + 25(2025) + 275(day) + 0001(sequence)

/**
 * 🗂️ Mapuje clientId do nowego formatu
 */
function mapClientIdFormat(clientId) {
    if (!clientId) return null;
    
    const mapping = {
        'OLD0001': 'CLI25186001',
        'OLD0002': 'CLI25186002',
        'OLD0003': 'CLI25186003',
        'OLD0004': 'CLI25186004',
        'OLD0005': 'CLI25186005',
        'OLD0006': 'CLI25186006',
        'OLD0007': 'CLI25186007',
        'OLD0008': 'CLI25186008',
        'OLD0009': 'CLI25186009',
        'OLD0010': 'CLI25186010',
        'OLD0011': 'CLI25186011',
        'OLD0012': 'CLI25186012',
        'OLD0013': 'CLI25186013',
        'OLD0014': 'CLI25186014'
    };
    
    return mapping[clientId] || clientId;
}

/**
 * 🔄 Mapuje status na Enhanced v4.0
 */
function mapStatusToEnhanced(status) {
    if (!status) return null;
    
    const mapping = {
        // AGD Mobile → Web
        'Nowe': 'pending',
        'W realizacji': 'in_progress',
        'Zakończone': 'completed',
        
        // Web → bez zmian
        'pending': 'pending',
        'assigned': 'assigned',
        'in_progress': 'in_progress',
        'waiting_parts': 'waiting_parts',
        'waiting_client': 'waiting_client',
        'testing': 'testing',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'deferred': 'deferred'
    };
    
    return mapping[status] || status;
}

/**
 * Pobiera nazwę klienta po ID
 */
async function getClientName(clientId, supabase) {
    if (!clientId) return null;
    
    const client = await getClientById(clientId, supabase);
    return client?.name || null;
}

/**
 * Pobiera klienta po ID
 */
async function getClientById(clientId, supabase) {
    try {
        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        return error ? null : client;
    } catch (error) {
        return null;
    }
}

