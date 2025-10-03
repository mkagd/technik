// Test podstawowych API po naprawkach
const clients = require('./data/clients.json');
const orders = require('./data/orders.json');

console.log('=== TEST API DANYCH PO NAPRAWKACH ===\n');

console.log(`✅ KLIENCI (${clients.length} rekordów):`);
clients.forEach(client => {
  console.log(`  ${client.id} - ${client.firstName} ${client.lastName}`);
});

console.log(`\n✅ ZAMÓWIENIA (${orders.length} rekordów):`);
orders.forEach(order => {
  console.log(`  ${order.orderNumber} - ${order.clientName} (clientId: ${order.clientId})`);
});

console.log(`\n✅ WIZYTY (${orders.reduce((sum, o) => sum + o.visits.length, 0)} rekordów):`);
orders.forEach(order => {
  order.visits.forEach(visit => {
    console.log(`  ${visit.visitId} - ${visit.type} (${visit.scheduledDate.substring(0,10)})`);
  });
});

console.log('\n=== SPRAWDZENIE POWIĄZAŃ ===');
let linksOK = true;
orders.forEach(order => {
  const client = clients.find(c => c.id === order.clientId);
  if (!client) {
    console.log(`❌ BŁĄD: Zamówienie ${order.orderNumber} nie ma klienta ${order.clientId}`);
    linksOK = false;
  } else {
    console.log(`✅ ${order.orderNumber} → ${client.firstName} ${client.lastName}`);
  }
});

console.log(`\n🎯 WYNIK: ${linksOK ? 'WSZYSTKIE POWIĄZANIA OK!' : 'BŁĘDY W POWIĄZANIACH!'}`);

console.log('\n=== PODSUMOWANIE FORMATÓW ===');
console.log('KLIENCI:');
clients.forEach(client => {
  const dateStr = client.id.substring(3, 8);
  const createdDate = new Date(client.createdAt);
  console.log(`  ${client.id} → created: ${createdDate.toISOString().substring(0,10)} (${dateStr})`);
});

console.log('\nZAMÓWIENIA:');
orders.forEach(order => {
  const dateStr = order.orderNumber.substring(4, 9);
  const createdDate = new Date(order.createdAt);
  console.log(`  ${order.orderNumber} → created: ${createdDate.toISOString().substring(0,10)} (${dateStr})`);
});

console.log('\nWIZYTY:');
orders.forEach(order => {
  const orderCreatedDate = new Date(order.createdAt);
  order.visits.forEach(visit => {
    const dateStr = visit.visitId.substring(3, 8);
    console.log(`  ${visit.visitId} → order created: ${orderCreatedDate.toISOString().substring(0,10)} | scheduled: ${visit.scheduledDate.substring(0,10)} (${dateStr})`);
  });
});