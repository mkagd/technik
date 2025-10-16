// migrate-visits-add-orderId.js
// Dodaje pole orderId do każdej wizyty w zleceniu

const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'data', 'orders.json');

console.log('🔄 Migracja: Dodawanie orderId do wizyt...\n');

try {
  // Read orders
  const ordersData = fs.readFileSync(ordersPath, 'utf8');
  const orders = JSON.parse(ordersData);

  let updatedVisits = 0;
  let totalVisits = 0;

  // Process each order
  orders.forEach(order => {
    // Use orderNumber as orderId (main identifier)
    const orderId = order.orderNumber || order.id;
    
    if (!orderId) {
      console.warn(`⚠️  Zlecenie bez ID: ${JSON.stringify(order).substring(0, 100)}...`);
      return;
    }

    if (order.visits && Array.isArray(order.visits)) {
      order.visits.forEach(visit => {
        totalVisits++;
        
        // Add orderId if missing
        if (!visit.orderId) {
          visit.orderId = orderId;
          updatedVisits++;
          console.log(`✅ Dodano orderId do wizyty: ${visit.visitId} → ${orderId}`);
        } else {
          console.log(`⏭️  Wizyta ${visit.visitId} już ma orderId: ${visit.orderId}`);
        }
      });
    }
  });

  // Save updated orders
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

  console.log(`\n✅ MIGRACJA ZAKOŃCZONA!`);
  console.log(`📊 Statystyki:`);
  console.log(`   - Wszystkich wizyt: ${totalVisits}`);
  console.log(`   - Zaktualizowanych: ${updatedVisits}`);
  console.log(`   - Pominiętych (już miały orderId): ${totalVisits - updatedVisits}`);

} catch (error) {
  console.error('❌ Błąd podczas migracji:', error);
  process.exit(1);
}
