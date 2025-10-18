// pages/api/rezerwacje/[id].js - API do zarządzania pojedynczą rezerwacją

import { createClient } from '@supabase/supabase-js';
import { 
    readReservations, 
    updateReservation, 
    deleteReservation
} from '../../../utils/dataStorage';
import {
    convertReservationToClientOrder,
    readClients,
    readOrders,
    updateOrder,
    writeClients,
    writeOrders
} from '../../../utils/clientOrderStorage';

// Inicjalizacja Supabase
let supabase = null;
try {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  
  if (supabaseUrl && supabaseKey && 
      !supabaseUrl.includes('twoj-projekt') && 
      !supabaseKey.includes('wtetrtvtblzkguoxfumx')) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase initialized in rezerwacje/[id].js');
  }
} catch (error) {
  console.error('❌ Supabase initialization error:', error);
}

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        // Pobierz pojedynczą rezerwację
        try {
            const rezerwacje = readReservations();
            const rezerwacja = rezerwacje.find(r => r.id.toString() === id.toString());

            if (!rezerwacja) {
                return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
            }

            return res.status(200).json(rezerwacja);
        } catch (error) {
            console.error('Błąd pobierania rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        // Aktualizuj rezerwację
        try {
            console.log(`📝 Aktualizacja rezerwacji ${id}:`, req.body);

            // 🚀 NAJPIERW: Jeśli zmiana statusu na "contacted", utwórz zlecenie!
            if (req.body.status === 'contacted') {
                console.log('🎯 Status zmieniony na "contacted" - tworzę zlecenie...');
                
                // Pobierz rezerwację z Supabase lub lokalnie
                let rezerwacja = null;
                if (supabase) {
                    const { data } = await supabase
                        .from('rezerwacje')
                        .select('*')
                        .eq('id', id)
                        .single();
                    rezerwacja = data;
                } else {
                    const rezerwacje = readReservations();
                    rezerwacja = rezerwacje.find(r => r.id.toString() === id.toString());
                }

                if (rezerwacja && rezerwacja.status !== 'contacted') {
                    // Sprawdź czy zamówienie już istnieje
                    const orders = await readOrders();
                    let existingOrder = orders.find(o => 
                        o.orderNumber === rezerwacja.orderNumber ||
                        o.orderNumber === rezerwacja.data?.orderNumber ||
                        o.originalReservationId === rezerwacja.id
                    );

                    if (!existingOrder) {
                        console.log('📦 Tworzę nowe zlecenie dla rezerwacji...');
                        
                        // Konwertuj rezerwację na klienta i zamówienie
                        const reservationData = rezerwacja.data || rezerwacja;
                        const converted = await convertReservationToClientOrder(reservationData);
                        
                        console.log(`✅ Zlecenie utworzone lokalnie: ${converted.order.orderNumber}`);
                        
                        // 🚀 Zapisz klienta do Supabase
                        if (supabase) {
                            console.log('💾 Zapisuję klienta do Supabase...');
                            const clientPayload = {
                                name: converted.client.name,
                                phone: converted.client.phone,
                                email: converted.client.email || '',
                                address: converted.client.address || '',
                                city: converted.client.city || '',
                                street: converted.client.street || '',
                                postal_code: converted.client.postalCode || '',
                                created_at: converted.client.createdAt || new Date().toISOString(),
                                data: converted.client // pełne dane w JSONB
                            };
                            
                            const { data: clientData, error: clientError } = await supabase
                                .from('clients')
                                .insert([clientPayload])
                                .select()
                                .single();
                            
                            if (!clientError && clientData) {
                                console.log(`✅ Klient zapisany w Supabase: ID ${clientData.id}`);
                                req.body.clientId = clientData.id;
                                
                                // 🚀 Zapisz zlecenie do Supabase
                                console.log('💾 Zapisuję zlecenie do Supabase...');
                                const orderPayload = {
                                    order_number: converted.order.orderNumber,
                                    client_id: clientData.id,
                                    category: converted.order.category,
                                    service_type: converted.order.serviceType,
                                    description: converted.order.description || '',
                                    status: converted.order.status || 'pending',
                                    priority: converted.order.priority || 'normal',
                                    scheduled_date: converted.order.scheduledDate || null,
                                    created_at: converted.order.createdAt || new Date().toISOString(),
                                    data: converted.order // pełne dane w JSONB
                                };
                                
                                const { data: orderData, error: orderError } = await supabase
                                    .from('orders')
                                    .insert([orderPayload])
                                    .select()
                                    .single();
                                
                                if (!orderError && orderData) {
                                    console.log(`✅ Zlecenie zapisane w Supabase: ID ${orderData.id}`);
                                    converted.order.id = orderData.id;
                                    converted.order.orderNumber = orderData.order_number || converted.order.orderNumber;
                                    req.body.orderId = orderData.id;
                                    req.body.orderNumber = orderData.order_number || converted.order.orderNumber;
                                } else {
                                    console.error('❌ Błąd zapisu zlecenia do Supabase:', orderError);
                                }
                            } else {
                                console.error('❌ Błąd zapisu klienta do Supabase:', clientError);
                            }
                        }
                        
                        // Aktualizuj req.body z informacjami o zleceniu
                        if (!req.body.orderId) {
                            req.body.orderId = converted.order.id;
                        }
                        if (!req.body.orderNumber) {
                            req.body.orderNumber = converted.order.orderNumber;
                        }
                        if (!req.body.clientId) {
                            req.body.clientId = converted.client.id;
                        }
                    } else {
                        console.log(`✅ Zlecenie już istnieje: ${existingOrder.orderNumber}`);
                        req.body.orderId = existingOrder.id;
                        req.body.orderNumber = existingOrder.orderNumber;
                    }
                }
            }

            // ✅ Teraz zaktualizuj Supabase
            if (supabase) {
                // Konwertuj camelCase → snake_case dla Supabase
                const toSnakeCase = (obj) => {
                    if (Array.isArray(obj)) return obj.map(toSnakeCase);
                    if (obj !== null && typeof obj === 'object') {
                        return Object.keys(obj).reduce((result, key) => {
                            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                            result[snakeKey] = toSnakeCase(obj[key]);
                            return result;
                        }, {});
                    }
                    return obj;
                };

                const updatePayload = {
                    ...toSnakeCase(req.body),
                    updated_at: new Date().toISOString()
                };

                console.log('📤 Supabase update payload:', Object.keys(updatePayload).join(', '));

                const { data, error } = await supabase
                    .from('rezerwacje')
                    .update(updatePayload)
                    .eq('id', id)
                    .select()
                    .single();

                if (!error && data) {
                    console.log('✅ Rezerwacja zaktualizowana w Supabase:', data);
                    return res.status(200).json({
                        message: 'Rezerwacja zaktualizowana',
                        data: data
                    });
                } else if (error) {
                    console.error('❌ Supabase update error:', error);
                    // Kontynuuj do lokalnego fallbacku
                }
            }

            // Fallback: lokalne pliki JSON
            const rezerwacje = readReservations();
            const index = rezerwacje.findIndex(r => r.id?.toString() === id?.toString());

            if (index === -1) {
                return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
            }

            // Zaktualizuj rezerwację lokalnie
            const updatedReservation = updateReservation(id, req.body);

            if (updatedReservation) {
                // Spróbuj też zaktualizować odpowiadające dane w systemie klient+zamówienie
                try {
                    const clients = await readClients();
                    const orders = await readOrders();

                    // Znajdź klienta po danych z rezerwacji
                    const clientIndex = clients.findIndex(c =>
                        c.name === updatedReservation.name || c.phone === updatedReservation.phone
                    );

                    if (clientIndex !== -1) {
                        // Aktualizuj dane klienta
                        clients[clientIndex] = {
                            ...clients[clientIndex],
                            name: updatedReservation.name,
                            phone: updatedReservation.phone,
                            email: updatedReservation.email,
                            address: updatedReservation.address,
                            city: updatedReservation.city,
                            street: updatedReservation.street
                        };

                        // Znajdź i zaktualizuj zamówienie
                        const orderIndex = orders.findIndex(o => o.clientId === clients[clientIndex].id);
                        if (orderIndex !== -1) {
                            orders[orderIndex] = {
                                ...orders[orderIndex],
                                category: updatedReservation.category,
                                serviceType: updatedReservation.device,
                                description: updatedReservation.description,
                                availability: updatedReservation.availability,
                                scheduledDate: updatedReservation.date,
                                status: updatedReservation.status,
                                priority: updatedReservation.priority || 'normal'
                            };
                        }

                        // Zapisz zmiany
                        await writeClients(clients);
                        await writeOrders(orders);
                        console.log('✅ Zaktualizowano powiązane dane klient+zamówienie');
                    }
                } catch (syncError) {
                    console.warn('⚠️ Nie udało się zsynchronizować z systemem klient+zamówienie:', syncError);
                }

                console.log('✅ Rezerwacja zaktualizowana lokalnie:', updatedReservation);
                return res.status(200).json({
                    message: 'Rezerwacja zaktualizowana',
                    data: updatedReservation
                });
            } else {
                return res.status(500).json({ message: 'Błąd aktualizacji rezerwacji' });
            }

        } catch (error) {
            console.error('Błąd aktualizacji rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'DELETE') {
        // Usuń rezerwację
        try {
            console.log(`🗑️ Usuwanie rezerwacji ${id}`);

            const success = deleteReservation(id);

            if (success) {
                console.log('✅ Rezerwacja usunięta');
                return res.status(200).json({ 
                    success: true,
                    message: 'Rezerwacja usunięta' 
                });
            } else {
                return res.status(404).json({ 
                    success: false,
                    message: 'Rezerwacja nie znaleziona' 
                });
            }

        } catch (error) {
            console.error('Błąd usuwania rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
