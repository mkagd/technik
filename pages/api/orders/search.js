import LockedFileOperations from '../../../utils/fileLocking';
import path from 'path';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

/**
 * 🔍 API endpoint do wyszukiwania zamówień dla klientów
 * GET /api/orders/search?orderNumber=ORDW252750001&phone=987654987
 * 
 * Pozwala klientom sprawdzić status swojego zamówienia po numerze i telefonie
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Tylko metoda GET' });
    }

    const { orderNumber, phone } = req.query;

    console.log('🔍 API search request:', { orderNumber, phone });

    // Walidacja parametrów
    if (!orderNumber || !phone) {
        return res.status(400).json({ 
            error: 'Brak wymaganych parametrów', 
            required: ['orderNumber', 'phone'] 
        });
    }

    // Normalizacja numeru telefonu (usuń spacje, myślniki, nawiasy)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    console.log('🧹 Cleaned params:', { cleanOrderNumber, cleanPhone });

    try {
        // 1. Pobierz wszystkie zamówienia
        const orders = await LockedFileOperations.readJSON(ORDERS_FILE, []);
        console.log(`📦 Loaded ${orders.length} orders from database`);

        // 2. Znajdź zamówienie po orderNumber
        const order = orders.find(o => {
            const matchOrderNumber = o.orderNumber === cleanOrderNumber;
            const matchId = o.id === cleanOrderNumber; // Fallback dla starych ID
            return matchOrderNumber || matchId;
        });

        if (!order) {
            console.log('❌ Order not found:', cleanOrderNumber);
            return res.status(404).json({ 
                error: 'Nie znaleziono zamówienia o podanym numerze',
                orderNumber: cleanOrderNumber 
            });
        }

        console.log('✅ Order found:', order.orderNumber || order.id);

        // 3. Weryfikuj numer telefonu
        const orderPhone = (order.clientPhone || order.phone || '').replace(/[\s\-\(\)]/g, '');
        
        if (orderPhone !== cleanPhone) {
            console.log('❌ Phone mismatch:', { orderPhone, cleanPhone });
            return res.status(403).json({ 
                error: 'Numer telefonu nie pasuje do zamówienia',
                hint: 'Sprawdź czy podałeś ten sam numer telefonu co przy składaniu zamówienia'
            });
        }

        console.log('✅ Phone verified');

        // 4. Pobierz dane klienta
        const clients = await LockedFileOperations.readJSON(CLIENTS_FILE, []);
        const client = clients.find(c => 
            c.id === order.clientId || 
            c.clientId === order.clientId
        );

        console.log('👤 Client found:', client ? client.id : 'no client');

        // 5. Przygotuj odpowiedź
        const response = {
            order: {
                orderNumber: order.orderNumber || order.id,
                orderId: order.id,
                clientId: order.clientId,
                clientName: order.clientName,
                clientPhone: order.clientPhone || order.phone,
                email: order.email,
                address: order.address,
                city: order.city,
                street: order.street,
                postalCode: order.postalCode,
                
                // Urządzenie
                deviceType: order.deviceType || order.category,
                brand: order.brand,
                model: order.model,
                serialNumber: order.serialNumber,
                description: order.description,
                
                // Status i priorytety
                status: order.status,
                priority: order.priority,
                
                // Szczegóły zabudowy
                builtInParams: order.builtInParams,
                deviceDetails: order.deviceDetails,
                devices: order.devices,
                
                // Daty
                dateAdded: order.dateAdded || order.createdAt,
                scheduledDate: order.scheduledDate,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                
                // Wizyty
                visits: order.visits || [],
                
                // Metadata
                source: order.source,
                sourceDetails: order.sourceDetails,
                createdBy: order.createdBy,
                createdByName: order.createdByName
            },
            client: client ? {
                id: client.id || client.clientId,
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address,
                city: client.city,
                street: client.street
            } : null
        };

        console.log('✅ Returning order data');
        return res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error searching order:', error);
        return res.status(500).json({ 
            error: 'Błąd serwera podczas wyszukiwania zamówienia',
            message: error.message 
        });
    }
}
