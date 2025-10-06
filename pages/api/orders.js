// pages/api/orders.js
// API endpoint dla zarządzania zamówieniami - ENHANCED v4.0 + KOMPATYBILNOŚĆ AGD MOBILE
// ✅ 100% kompatybilność z AGD Mobile (builtInParams, detectedCall, googleContactData)
// ✅ Nowe funkcje: system wizyt, poprawne clientId (CLI), ORDA format
// ✅ Mapowanie statusów AGD Mobile ↔ Web
// ✅ Obsługa 74 pól Enhanced v4.0

import {
    readOrders,
    addOrder,
    updateOrder,
    patchOrder,
    deleteOrder,
    readClients
} from '../../utils/clientOrderStorage';

import { 
    generateOrderId, 
    generateVisitId,
    parseId 
} from '../../utils/id-generator';

import { ENHANCED_ORDER_STRUCTURE_V4 } from '../../shared/enhanced-order-structure-v4';
import { AGDMobileToV4Converter } from '../../shared/agd-mobile-to-v4-converter';

export default async function handler(req, res) {
    console.log(`📞 API ${req.method} /api/orders`);

    if (req.method === 'GET') {
        try {
            const { id, clientId } = req.query;
            const orders = await readOrders();
            
            // Jeśli podano ID, zwróć pojedyncze zamówienie
            if (id) {
                const order = orders.find(o => o.id == id || o.orderNumber == id);
                if (order) {
                    console.log(`✅ Returning order: ${order.orderNumber}`);
                    return res.status(200).json(order);
                } else {
                    console.log(`❌ Order not found: ${id}`);
                    return res.status(404).json({ message: 'Zamówienie nie znalezione' });
                }
            }
            
            // ✅ FIXED: Filtruj po clientId (dla dashboardu klienta)
            if (clientId) {
                const clientOrders = orders.filter(o => o.clientId === clientId);
                console.log(`✅ Returning ${clientOrders.length} orders for client: ${clientId}`);
                return res.status(200).json({ 
                    success: true,
                    orders: clientOrders 
                });
            }
            
            // Zwróć wszystkie zamówienia
            console.log(`✅ Returning ${orders.length} orders`);
            return res.status(200).json({ 
                success: true,
                orders 
            });
        } catch (error) {
            console.error('❌ Error reading orders:', error);
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
                console.log('📱 Detected AGD Mobile order, converting to Enhanced v4.0...');
                processedOrderData = converter.convertSingleOrder(orderData);
            } else {
                console.log('🌐 Processing web/API order as Enhanced v4.0...');
                processedOrderData = processWebOrder(orderData);
            }
            
            // ========== WALIDACJA ENHANCED v4.0 ==========
            const validationErrors = validateEnhancedV4Order(processedOrderData);
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
                ...processedOrderData,
                
                // Metadane
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: orderData.createdBy || orderData.selectedEmployee || 'admin',
                createdByName: orderData.createdByName || (isAGDMobile ? 'AGD Mobile App' : 'Panel Admina'),
                source: source,
                sourceDetails: orderData.sourceDetails || (isAGDMobile ? 'agd-mobile-app' : 'admin-panel'),
                userId: orderData.userId || null,
                isUserCreated: !!orderData.userId,
                createdFromIP: orderData.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
                version: '4.0'
            };

            const newOrder = addOrder(finalOrderData);
            if (newOrder) {
                console.log(`✅ Enhanced v4.0 order added: ${newOrder.orderNumber} for client: ${newOrder.clientName}`);
                
                if (newOrder.source === 'agd_mobile') {
                    console.log(`📱 AGD Mobile features preserved: builtInParams=${!!newOrder.builtInParams}, detectedCall=${!!newOrder.detectedCall}`);
                }
                
                if (newOrder.visitId) {
                    console.log(`📅 Visit assigned: ${newOrder.visitId} on ${newOrder.appointmentDate}`);
                }
                
                return res.status(201).json({ 
                    order: newOrder,
                    message: 'Zlecenie Enhanced v4.0 utworzone pomyślnie',
                    compatibility: {
                        source: newOrder.source,
                        version: newOrder.version,
                        agdMobileFieldsPreserved: isAGDMobile
                    }
                });
            } else {
                return res.status(500).json({ message: 'Błąd dodawania zamówienia Enhanced v4.0' });
            }
        } catch (error) {
            console.error('❌ Error adding Enhanced v4.0 order:', error);
            return res.status(500).json({ 
                message: 'Błąd serwera Enhanced v4.0',
                error: error.message 
            });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updatedOrder = req.body;
            console.log('🔧 PUT Request body:', JSON.stringify(updatedOrder, null, 2));

            if (!updatedOrder.id) {
                console.log('❌ Missing ID in order:', updatedOrder);
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            const result = updateOrder(updatedOrder);
            if (result) {
                console.log(`✅ Order updated: ${result.id}`);
                return res.status(200).json({ order: result });
            } else {
                console.log('❌ Order not found for update:', updatedOrder.id);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia', error: error.message });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const { id, ...patch } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            const result = patchOrder(id, patch);
            if (result) {
                console.log(`✅ Order patched: ${result.id}`);
                return res.status(200).json({ order: result });
            } else {
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error patching order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            console.log(`🗑️ DELETE request received for order:`, { id, type: typeof id });

            if (!id) {
                console.log('❌ No ID provided in query');
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            console.log(`🔄 Calling deleteOrder(${id})...`);
            const success = await deleteOrder(id);
            console.log(`📊 deleteOrder result:`, success);
            
            if (success) {
                console.log(`✅ Order deleted successfully: ${id}`);
                return res.status(200).json({ 
                    message: 'Zamówienie usunięte',
                    deletedId: id,
                    success: true
                });
            } else {
                console.log(`❌ deleteOrder returned false for: ${id}`);
                return res.status(500).json({ 
                    message: 'Błąd usuwania zamówienia - funkcja zwróciła false',
                    success: false 
                });
            }
        } catch (error) {
            console.error('❌ Error deleting order:', error);
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
function processWebOrder(orderData) {
    // Określ źródło zlecenia
    const source = orderData.source || 'admin-panel'; // admin tworzy przez ten endpoint
    const orders = readOrders();
    
    return {
        ...orderData,
        
        // Generuj ID jeśli brak (z nowym formatem ORDW/ORDA/ORDU itd.)
        orderNumber: orderData.orderNumber || generateOrderId(orders, new Date(), source),
        visitId: orderData.visitId || (orderData.appointmentDate ? generateVisitId(readOrders(), new Date(), source) : null),
        
        // Pobierz nazwę klienta
        clientName: orderData.clientName || getClientName(orderData.clientId),
        
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
function validateEnhancedV4Order(orderData) {
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
        const client = getClientById(orderData.clientId);
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
function getClientName(clientId) {
    if (!clientId) return null;
    
    const client = getClientById(clientId);
    return client?.name || null;
}

/**
 * Pobiera klienta po ID
 */
function getClientById(clientId) {
    try {
        const clients = readClients();
        return clients.find(c => c.id === clientId);
    } catch (error) {
        console.error('❌ Error reading clients:', error);
        return null;
    }
}
