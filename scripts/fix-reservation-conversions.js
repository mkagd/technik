// scripts/fix-reservation-conversions.js
// Manual script to fix broken reservation conversions
// Run with: node scripts/fix-reservation-conversions.js

const fs = require('fs');
const path = require('path');

const RESERVATIONS_FILE = path.join(__dirname, '..', 'data', 'rezerwacje.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clients.json');

console.log('🔧 Starting reservation conversion fix...\n');

// Load data
const reservations = JSON.parse(fs.readFileSync(RESERVATIONS_FILE, 'utf8'));
const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));

console.log(`📊 Loaded data:
   - Reservations: ${reservations.length}
   - Orders: ${orders.length}
   - Clients: ${clients.length}\n`);

// Find broken reservations
const brokenReservations = reservations.filter(r => 
  r.status === 'contacted' && !r.orderId && !r.orderNumber && !r.convertedToOrder
);

console.log(`🔍 Found ${brokenReservations.length} broken reservations\n`);

if (brokenReservations.length === 0) {
  console.log('✅ No broken reservations found. All good!');
  process.exit(0);
}

// Counter for new IDs
let newOrdersCount = 0;
let newClientsCount = 0;
let linkedCount = 0;

// Process each broken reservation
brokenReservations.forEach((reservation, index) => {
  console.log(`\n[${index + 1}/${brokenReservations.length}] Processing: ${reservation.name} (ID: ${reservation.id})`);
  
  // Find or create client
  let client = clients.find(c => c.phone === reservation.phone);
  
  if (!client) {
    // Create new client
    client = {
      id: `CLI${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email || '',
      address: reservation.fullAddress || `${reservation.street}, ${reservation.city}`,
      city: reservation.city,
      street: reservation.street,
      postalCode: reservation.postalCode || '',
      dateAdded: new Date().toISOString(),
      history: [],
      source: 'reservation_manual_fix',
      originalReservationId: reservation.id
    };
    clients.push(client);
    newClientsCount++;
    console.log(`  ✅ Created new client: ${client.id}`);
  } else {
    console.log(`  📋 Found existing client: ${client.id}`);
  }
  
  // Check if order already exists for this client
  let order = orders.find(o => 
    o.clientId === client.id &&
    o.deviceType === reservation.category &&
    Math.abs(new Date(o.dateAdded) - new Date(reservation.created_at)) < 24 * 60 * 60 * 1000 // Same day
  );
  
  if (!order) {
    // Generate order number
    const year = new Date().getFullYear().toString().slice(-2);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const seq = (orders.length + newOrdersCount + 1).toString().padStart(5, '0');
    const orderNumber = `ORDS${year}${dayOfYear}${seq}`;
    
    // Create new order
    order = {
      id: `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
      orderNumber: orderNumber,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      email: client.email || '',
      address: client.address,
      city: client.city,
      street: client.street,
      postalCode: client.postalCode || '',
      deviceType: reservation.category || 'Nie określono',
      brand: reservation.brand || 'Nie określono',
      model: reservation.device || 'Nie określono',
      description: reservation.problem || 'Brak opisu',
      priority: 'medium',
      status: 'pending',
      visits: [],
      devices: [{
        name: reservation.category || 'Nie określono',
        brand: reservation.brand || '',
        model: reservation.device || '',
        description: reservation.problem || 'Brak opisu',
        hasBuiltIn: reservation.hasBuiltIn || false,
        builtInParams: {
          demontaz: false,
          montaz: false,
          trudna: false,
          wolnostojacy: false,
          ograniczony: false,
          front: false,
          czas: false
        }
      }],
      scheduledDate: reservation.date || null,
      scheduledTime: reservation.time || null,
      dateAdded: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'reservation_manual_fix',
      originalReservationId: reservation.id,
      reservationId: reservation.id,
      createdBy: 'manual_fix_script'
    };
    orders.push(order);
    newOrdersCount++;
    console.log(`  ✅ Created new order: ${order.orderNumber}`);
  } else {
    linkedCount++;
    console.log(`  📋 Found existing order: ${order.orderNumber || order.id}`);
  }
  
  // Update reservation with order info
  const resIndex = reservations.findIndex(r => r.id === reservation.id);
  if (resIndex !== -1) {
    reservations[resIndex] = {
      ...reservations[resIndex],
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
      clientId: client.id,
      convertedToOrder: true,
      convertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'manual_fix_script'
    };
    console.log(`  ✅ Updated reservation with order link`);
  }
});

// Save all files
console.log('\n💾 Saving changes...');

fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2));
console.log(`  ✅ Saved reservations (${reservations.length} total)`);

fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
console.log(`  ✅ Saved orders (${orders.length} total)`);

fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
console.log(`  ✅ Saved clients (${clients.length} total)`);

console.log(`\n📊 SUMMARY:
   ✅ Fixed reservations: ${brokenReservations.length}
   ➕ New orders created: ${newOrdersCount}
   ➕ New clients created: ${newClientsCount}
   🔗 Linked to existing: ${linkedCount}
   
✨ All done! Reservation conversions have been fixed.
`);
