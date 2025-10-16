// pages/api/rezerwacje/fix-conversions.js
// API endpoint to fix reservations that have status "contacted" but no orderId

import { 
  readClients, 
  addClient, 
  updateClient,
  readOrders, 
  addOrder,
  convertReservationToClientOrder 
} from '../../../utils/clientOrderStorage';
import { readReservations, updateReservation } from '../../../utils/dataStorage';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('🔧 FIX CONVERSIONS: Starting auto-heal for broken reservations');
    
    const reservations = readReservations();
    const orders = await readOrders();
    let clientsData = await readClients();
    
    // Fix: jeśli clients.json ma strukturę { clients: [] }, wyciągnij tablicę
    const clients = Array.isArray(clientsData) ? clientsData : (clientsData.clients || []);
    
    console.log('🔍 DEBUG: clients.length:', clients.length);
    
    // Znajdź rezerwacje ze statusem "contacted" bez orderId
    const brokenReservations = reservations.filter(r => 
      r.status === 'contacted' && !r.orderId && !r.orderNumber && !r.convertedToOrder
    );
    
    console.log(`📊 Found ${brokenReservations.length} broken reservations to fix`);
    
    const fixed = [];
    const errors = [];
    
    for (const reservation of brokenReservations) {
      try {
        console.log(`\n🔄 Processing reservation ID: ${reservation.id} (${reservation.name})`);
        
        // Konwertuj rezerwację na klienta i zamówienie
        const converted = await convertReservationToClientOrder(reservation);
        let clientData = converted.client;
        let orderData = converted.order;
        
        // Sprawdź czy klient już istnieje (po telefonie lub emailu)
        let existingClient = null;
        
        if (clientData.phone) {
          existingClient = clients.find(c => c.phone === clientData.phone);
        }
        
        if (!existingClient && clientData.email) {
          existingClient = clients.find(c => c.email === clientData.email);
        }
        
        let clientId;
        let client;
        
        if (existingClient) {
          console.log('  📋 Client already exists, using existing ID:', existingClient.id);
          clientId = existingClient.id;
          client = existingClient;
          
          // Aktualizuj dane istniejącego klienta
          const updatedClient = {
            ...existingClient,
            ...clientData,
            id: existingClient.id, // Zachowaj oryginalny ID
            updatedAt: new Date().toISOString()
          };
          await updateClient(updatedClient);
        } else {
          // Dodaj metadane o źródle
          clientData.source = 'reservation_conversion_fix';
          clientData.createdBy = 'auto_heal';
          clientData.originalReservationId = reservation.id;
          
          // Utwórz nowego klienta
          const newClient = await addClient(clientData);
          clientId = newClient.id;
          client = newClient;
          console.log('  ✅ New client created from reservation:', clientId);
        }
        
        // Sprawdź czy zamówienie dla tej rezerwacji już istnieje
        const existingOrder = orders.find(o => 
          o.originalReservationId === reservation.id || 
          o.reservationId === reservation.id ||
          (o.clientId === clientId && o.clientPhone === reservation.phone)
        );
        
        let order;
        
        if (existingOrder) {
          console.log('  📋 Order already exists for this reservation:', existingOrder.orderNumber);
          order = existingOrder;
        } else {
          // Połącz zamówienie z klientem
          orderData.clientId = clientId;
          orderData.source = 'reservation_conversion_fix';
          orderData.originalReservationId = reservation.id;
          orderData.reservationId = reservation.id;
          orderData.createdBy = 'auto_heal';
          orderData.createdFrom = 'reservation';
          
          console.log('  📝 Order data before creation:', JSON.stringify({
            clientId: orderData.clientId,
            clientName: orderData.clientName,
            deviceType: orderData.deviceType,
            devicesCount: orderData.devices?.length || 0
          }));
          
          // Utwórz zamówienie
          const newOrder = await addOrder(orderData, {
            source: 'reservation_conversion_fix',
            createdBy: 'auto_heal'
          });
          
          if (!newOrder || !newOrder.id) {
            console.error('  ❌ addOrder returned:', newOrder);
            throw new Error('Failed to create order - addOrder returned null or invalid object');
          }
          
          console.log('  ✅ Order created from reservation:', newOrder.orderNumber, 'ID:', newOrder.id);
          order = newOrder;
        }
        
        // Aktualizuj rezerwację ze statusem i numerem zamówienia
        const result = updateReservation(reservation.id, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientId: clientId,
          convertedToOrder: true,
          convertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'auto_heal'
        });
        
        console.log('  ✅ Reservation fixed successfully');
        
        fixed.push({
          reservationId: reservation.id,
          clientId: clientId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName: reservation.name
        });
        
      } catch (error) {
        console.error(`  ❌ Error fixing reservation ${reservation.id}:`, error);
        errors.push({
          reservationId: reservation.id,
          error: error.message
        });
      }
    }
    
    console.log(`\n📊 FIX SUMMARY:`);
    console.log(`   ✅ Fixed: ${fixed.length}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    return res.status(200).json({
      success: true,
      message: `Fixed ${fixed.length} broken reservations`,
      fixed: fixed,
      errors: errors,
      summary: {
        total: brokenReservations.length,
        fixed: fixed.length,
        errors: errors.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error in fix-conversions:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas naprawy rezerwacji',
      error: error.message
    });
  }
}
