import { getServiceSupabase } from '../../../lib/supabase';

/**
 * 🔍 API endpoint do wyszukiwania zamówień dla klientów
 * GET /api/orders/search?orderNumber=ORDW252750001&phone=987654987
 * 
 * Pozwala klientom sprawdzić status swojego zamówienia po numerze i telefonie
 */
export default async function handler(req, res) {
    const supabase = getServiceSupabase();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Tylko metoda GET' });
    }

    const { orderNumber, phone, clientName, deviceType } = req.query;

    console.log('🔍 API search request:', { orderNumber, phone, clientName, deviceType });

    // Walidacja parametrów - wymagany przynajmniej orderNumber+phone LUB inne kryteria
    if (!orderNumber && !clientName && !deviceType) {
        return res.status(400).json({ 
            error: 'Brak wymaganych parametrów', 
            hint: 'Podaj orderNumber i phone, lub inne kryteria wyszukiwania'
        });
    }

    try {
        // Normalizacja danych
        const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : null;
        const cleanOrderNumber = orderNumber ? orderNumber.trim().toUpperCase() : null;

        console.log('🧹 Cleaned params:', { cleanOrderNumber, cleanPhone });

        // Build Supabase query
        let query = supabase
            .from('orders')
            .select(`
                *,
                client:clients(id, name, phone, email, address, city, postal_code),
                visits(*)
            `);

        // Search by order number
        if (cleanOrderNumber) {
            query = query.or(`order_number.eq.${cleanOrderNumber},id.eq.${cleanOrderNumber}`);
        }

        // Search by client name (fuzzy)
        if (clientName) {
            query = query.ilike('client_name', `%${clientName}%`);
        }

        // Search by device type
        if (deviceType) {
            query = query.ilike('device_type', `%${deviceType}%`);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ 
                error: 'Błąd serwera',
                details: error.message
            });
        }

        console.log(`📦 Found ${orders?.length || 0} orders`);

        // If searching by order number, expect single result
        if (cleanOrderNumber) {
            if (!orders || orders.length === 0) {
                console.log('❌ Order not found:', cleanOrderNumber);
                return res.status(404).json({ 
                    error: 'Nie znaleziono zamówienia o podanym numerze',
                    orderNumber: cleanOrderNumber 
                });
            }

            const order = orders[0];
            console.log('✅ Order found:', order.order_number || order.id);

            // Verify phone number if provided
            if (cleanPhone) {
                // Check order's metadata for phone, or client's phone
                const orderPhone = (order.metadata?.phone || order.client?.phone || '').replace(/[\s\-\(\)]/g, '');
                
                if (orderPhone !== cleanPhone) {
                    console.log('❌ Phone mismatch:', { orderPhone, cleanPhone });
                    return res.status(403).json({ 
                        error: 'Numer telefonu nie pasuje do zamówienia',
                        hint: 'Sprawdź czy podałeś ten sam numer telefonu co przy składaniu zamówienia'
                    });
                }

                console.log('✅ Phone verified');
            }

            const client = order.client;
            console.log('👤 Client found:', client ? client.id : 'no client');

            // Prepare single order response
            const response = {
                order: {
                    orderNumber: order.order_number || order.id,
                    orderId: order.id,
                    clientId: order.client_id,
                    clientName: order.metadata?.clientName || client?.name,
                    clientPhone: order.metadata?.phone || client?.phone,
                    email: order.metadata?.email || client?.email,
                    address: order.address,
                    city: order.city,
                    postalCode: order.postal_code,
                    
                    // Urządzenie
                    deviceType: order.device_type,
                    brand: order.brand,
                    model: order.model,
                    serialNumber: order.serial_number,
                    description: order.description,
                    
                    // Status i priorytety
                    status: order.status,
                    priority: order.priority,
                    
                    // Szczegóły
                    metadata: order.metadata || {},
                    
                    // Daty
                    dateAdded: order.created_at,
                    scheduledDate: order.scheduled_date,
                    createdAt: order.created_at,
                    updatedAt: order.updated_at,
                    completedDate: order.completed_date,
                    
                    // Koszty
                    estimatedCost: order.estimated_cost,
                    finalCost: order.final_cost,
                    partsCost: order.parts_cost,
                    laborCost: order.labor_cost,
                    
                    // Wizyty
                    visits: order.visits || [],
                    
                    // Zdjęcia
                    photos: order.photos || []
                },
                client: client ? {
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    address: client.address,
                    city: client.city,
                    postalCode: client.postal_code
                } : null
            };

            console.log('✅ Returning single order data');
            return res.status(200).json(response);
        }

        // If searching by other criteria, return multiple results
        const formattedOrders = orders.map(order => ({
            orderNumber: order.order_number || order.id,
            orderId: order.id,
            clientId: order.client_id,
            clientName: order.metadata?.clientName || order.client?.name,
            deviceType: order.device_type,
            brand: order.brand,
            model: order.model,
            status: order.status,
            priority: order.priority,
            scheduledDate: order.scheduled_date,
            createdAt: order.created_at,
            visits: order.visits || []
        }));

        console.log('✅ Returning multiple orders');
        return res.status(200).json({
            orders: formattedOrders,
            count: formattedOrders.length
        });

    } catch (error) {
        console.error('❌ Error searching order:', error);
        return res.status(500).json({ 
            error: 'Błąd serwera podczas wyszukiwania zamówienia',
            message: error.message 
        });
    }
}
