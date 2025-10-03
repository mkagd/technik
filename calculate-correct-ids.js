// Obliczanie prawidłowych identyfikatorów
const clients = require('./data/clients.json');
const orders = require('./data/orders.json');

// Funkcja do obliczania dnia roku
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Funkcja do formatowania ID z datą
function formatDateId(prefix, date, sequence) {
  const year = date.getFullYear().toString().substring(2);
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0');
  const seq = sequence.toString().padStart(3, '0');
  return `${prefix}${year}${dayOfYear}${seq}`;
}

console.log('=== OBLICZANIE PRAWIDŁOWYCH IDENTYFIKATORÓW ===\n');

console.log('KLIENCI - obecne vs prawidłowe:');
clients.forEach((client, index) => {
  const createdDate = new Date(client.createdAt);
  const currentId = client.id;
  const correctId = formatDateId('CLI', createdDate, index + 1);
  
  console.log(`${index + 1}. ${client.firstName} ${client.lastName}`);
  console.log(`   Obecny ID: ${currentId}`);
  console.log(`   Prawidłowy: ${correctId} (created: ${createdDate.toISOString().substring(0,10)})`);
  console.log(`   Zmiana: ${currentId !== correctId ? '❌ WYMAGA NAPRAWY' : '✅ OK'}`);
  console.log('');
});

console.log('ZAMÓWIENIA - obecne vs prawidłowe:');
orders.forEach((order, index) => {
  const createdDate = new Date(order.createdAt);
  const currentOrderNum = order.orderNumber;
  const correctOrderNum = formatDateId('ORDA', createdDate, index + 1);
  
  console.log(`${index + 1}. Order ID: ${order.id}`);
  console.log(`   Obecny orderNumber: ${currentOrderNum}`);
  console.log(`   Prawidłowy: ${correctOrderNum} (created: ${createdDate.toISOString().substring(0,10)})`);
  console.log(`   Zmiana: ${currentOrderNum !== correctOrderNum ? '❌ WYMAGA NAPRAWY' : '✅ OK'}`);
  console.log('');
});

console.log('WIZYTY - obecne vs prawidłowe:');
orders.forEach(order => {
  const orderCreatedDate = new Date(order.createdAt);
  console.log(`Zamówienie: ${order.orderNumber} (created: ${orderCreatedDate.toISOString().substring(0,10)})`);
  
  order.visits.forEach((visit, visitIndex) => {
    const currentVisitId = visit.visitId;
    // Zakładamy, że wizyty są tworzone w tym samym dniu co zamówienie (lub dzień później)
    const visitCreatedDate = orderCreatedDate; // Można dostosować logikę
    const correctVisitId = formatDateId('VIS', visitCreatedDate, visitIndex + 1);
    
    console.log(`  Wizyta ${visitIndex + 1}:`);
    console.log(`    Obecny visitId: ${currentVisitId}`);
    console.log(`    Prawidłowy: ${correctVisitId} (assumed created: ${visitCreatedDate.toISOString().substring(0,10)})`);
    console.log(`    Scheduled: ${visit.scheduledDate.substring(0,16)}`);
    console.log(`    Zmiana: ${currentVisitId !== correctVisitId ? '❌ WYMAGA NAPRAWY' : '✅ OK'}`);
    console.log('');
  });
  console.log('---');
});

// Export danych do naprawy
const fixData = {
  clients: clients.map((client, index) => ({
    currentId: client.id,
    correctId: formatDateId('CLI', new Date(client.createdAt), index + 1),
    needsFix: client.id !== formatDateId('CLI', new Date(client.createdAt), index + 1)
  })),
  orders: orders.map((order, index) => ({
    id: order.id,
    currentOrderNumber: order.orderNumber,
    correctOrderNumber: formatDateId('ORDA', new Date(order.createdAt), index + 1),
    needsFix: order.orderNumber !== formatDateId('ORDA', new Date(order.createdAt), index + 1)
  })),
  visits: []
};

orders.forEach(order => {
  const orderCreatedDate = new Date(order.createdAt);
  order.visits.forEach((visit, visitIndex) => {
    const correctVisitId = formatDateId('VIS', orderCreatedDate, visitIndex + 1);
    fixData.visits.push({
      orderNumber: order.orderNumber,
      currentVisitId: visit.visitId,
      correctVisitId: correctVisitId,
      needsFix: visit.visitId !== correctVisitId
    });
  });
});

console.log('\n=== PODSUMOWANIE ===');
console.log(`Klienci wymagający naprawy: ${fixData.clients.filter(c => c.needsFix).length}/${fixData.clients.length}`);
console.log(`Zamówienia wymagające naprawy: ${fixData.orders.filter(o => o.needsFix).length}/${fixData.orders.length}`);
console.log(`Wizyty wymagające naprawy: ${fixData.visits.filter(v => v.needsFix).length}/${fixData.visits.length}`);

// Zapisz dane do naprawy
require('fs').writeFileSync('./fix-data.json', JSON.stringify(fixData, null, 2));
console.log('\nDane do naprawy zapisane w fix-data.json');