// Sprawdź aktualny stan danych po wszystkich zmianach
const orders = require('./data/orders.json');
const clients = require('./data/clients.json');

console.log('=== ANALIZA SYSTEMU AGD ===\n');

console.log('1. KLIENCI:');
console.log(`Liczba klientów: ${clients.length}`);
clients.forEach(client => {
  console.log(`  ${client.id} - ${client.firstName} ${client.lastName}`);
});

console.log('\n2. ZAMÓWIENIA:');
console.log(`Liczba zamówień: ${orders.length}`);
orders.forEach(order => {
  console.log(`\nZAMÓWIENIE ${order.orderNumber}:`);
  console.log(`  ID: ${order.id}`);
  console.log(`  ClientId: ${order.clientId}`);
  console.log(`  Client: ${order.clientName}`);
  console.log(`  Device: ${order.brand} ${order.model} (${order.deviceType})`);
  console.log(`  Serial: ${order.serialNumber || 'BRAK'}`);
  console.log(`  Status: ${order.status}`);
  console.log(`  Category: ${order.category || 'BRAK'}`);
  
  if (order.visits && order.visits.length > 0) {
    console.log(`  WIZYTY (${order.visits.length}):`);
    order.visits.forEach(visit => {
      console.log(`    ${visit.visitId} - ${visit.type} - ${visit.scheduledDate.substring(0,10)}`);
    });
  } else {
    console.log(`  ❌ BRAK WIZYT!`);
  }
});

console.log('\n3. ANALIZA DANYCH URZĄDZEŃ:');
orders.forEach(order => {
  console.log(`${order.orderNumber}:`);
  console.log(`  ✅ Brand: ${order.brand || '❌ BRAK'}`);
  console.log(`  ✅ Model: ${order.model || '❌ BRAK'}`);
  console.log(`  ✅ Type: ${order.deviceType || '❌ BRAK'}`);
  console.log(`  ✅ Serial: ${order.serialNumber || '❌ BRAK'}`);
  console.log(`  Category: ${order.category || '❌ BRAK'}`);
  console.log(`  Symptoms: ${order.symptoms ? order.symptoms.length : 0} objawów`);
  console.log(`  Diagnosis: ${order.diagnosis ? 'JEST' : '❌ BRAK'}`);
  console.log(`  Solution: ${order.solution ? 'JEST' : '❌ BRAK'}`);
  console.log('');
});

console.log('\n4. SPRAWDZENIE ID WIZYT:');
let totalVisits = 0;
let correctVisitIds = 0;
orders.forEach(order => {
  if (order.visits) {
    order.visits.forEach(visit => {
      totalVisits++;
      const orderCreatedDate = new Date(order.createdAt || '2025-09-18');
      const year = orderCreatedDate.getFullYear().toString().substring(2);
      const dayOfYear = Math.floor((orderCreatedDate - new Date(orderCreatedDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const expectedPattern = `VIS${year}${dayOfYear.toString().padStart(3, '0')}`;
      
      if (visit.visitId && visit.visitId.startsWith(expectedPattern)) {
        correctVisitIds++;
        console.log(`✅ ${visit.visitId} - OK`);
      } else {
        console.log(`❌ ${visit.visitId} - NIEPRAWIDŁOWY (expected: ${expectedPattern}xxx)`);
      }
    });
  }
});

console.log(`\nWIZYTY: ${correctVisitIds}/${totalVisits} poprawnych ID`);

console.log('\n=== REKOMENDACJE DLA SERWISU AGD ===');
console.log('✅ MAMY: Brand, Model, DeviceType, SerialNumber');
console.log('❓ POTRZEBUJEMY DODATKOWO:');
console.log('  - Rok produkcji urządzenia');
console.log('  - Gwarancja (data zakupu, okres gwarancji)');
console.log('  - Historia serwisowa urządzenia');
console.log('  - Specyfikacja techniczna (moc, pojemność, etc.)');
console.log('  - Kod błędu urządzenia (jeśli wyświetla)');
console.log('  - Akcesoria/części zamienne potrzebne');