// Test API po naprawkach danych AGD
const fs = require('fs');
const path = require('path');

console.log('🧪 TEST API PO NAPRAWKACH DANYCH AGD\n');

// Test 1: Sprawdzenie integralności danych
console.log('=== TEST 1: INTEGRALNOŚĆ DANYCH ===');

const clientsPath = path.join(__dirname, 'data', 'clients.json');
const ordersPath = path.join(__dirname, 'data', 'orders.json');
const employeesPath = path.join(__dirname, 'data', 'employees.json');

let clients, orders, employees;

try {
  clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
  orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
  console.log('✅ Wszystkie pliki JSON wczytane poprawnie');
} catch (error) {
  console.log('❌ Błąd wczytywania plików:', error.message);
  process.exit(1);
}

// Test 2: Sprawdzenie relacji clientId
console.log('\n=== TEST 2: RELACJE CLIENT-ORDER ===');
let allRelationsCorrect = true;

orders.forEach(order => {
  const client = clients.find(c => c.id === order.clientId);
  if (client) {
    const clientName = client.firstName && client.lastName 
      ? `${client.firstName} ${client.lastName}` 
      : (client.name || 'Brak nazwy');
    console.log(`✅ ${order.orderNumber} → ${clientName} (${order.clientId})`);
  } else {
    console.log(`❌ ${order.orderNumber} → BRAK KLIENTA (${order.clientId})`);
    allRelationsCorrect = false;
  }
});

// Test 3: Sprawdzenie formatów visitId
console.log('\n=== TEST 3: FORMATY VISIT ID ===');
let allVisitIdsCorrect = true;

orders.forEach(order => {
  if (order.visits && order.visits.length > 0) {
    const expectedPrefix = "VIS" + order.clientId.substring(3, 8);
    order.visits.forEach(visit => {
      const isCorrect = visit.visitId.startsWith(expectedPrefix);
      console.log(`${isCorrect ? '✅' : '❌'} ${visit.visitId} (oczekiwane: ${expectedPrefix}...)`);
      if (!isCorrect) allVisitIdsCorrect = false;
    });
  }
});

// Test 4: Sprawdzenie kompletności danych AGD
console.log('\n=== TEST 4: KOMPLETNOŚĆ DANYCH AGD ===');

const requiredFields = ['brand', 'model', 'deviceType', 'serialNumber'];
let allOrdersComplete = true;

orders.forEach(order => {
  console.log(`\n📋 ${order.orderNumber} (${order.clientName}):`);
  
  requiredFields.forEach(field => {
    if (order[field] && order[field] !== 'Brak daty') {
      console.log(`  ✅ ${field}: ${order[field]}`);
    } else {
      console.log(`  ❌ ${field}: BRAK DANYCH`);
      allOrdersComplete = false;
    }
  });
  
  // Sprawdź wizyty
  if (order.visits && order.visits.length > 0) {
    console.log(`  ✅ wizyty: ${order.visits.length}`);
  } else {
    console.log(`  ❌ wizyty: BRAK`);
    allOrdersComplete = false;
  }
  
  // Sprawdź status i koszty dla ukończonych
  if (order.status === 'completed') {
    if (order.totalCost > 0) {
      console.log(`  ✅ koszt: ${order.totalCost} zł`);
    } else {
      console.log(`  ⚠️ koszt: 0 zł (ukończone bez kosztu)`);
    }
  }
});

// Test 5: Sprawdzenie techników AGD
console.log('\n=== TEST 5: TECHNICY AGD ===');

const agdTechnicians = employees.filter(emp => 
  emp.specializations?.some(spec => spec.toLowerCase().includes('agd')) ||
  emp.name?.toLowerCase().includes('agd') ||
  emp.expertise?.some(exp => exp.toLowerCase().includes('agd'))
);

console.log(`✅ Technicy AGD: ${agdTechnicians.length}/${employees.length}`);
agdTechnicians.forEach(tech => {
  console.log(`  • ${tech.name} - ${tech.specialization || 'Brak specjalizacji'}`);
});

// PODSUMOWANIE
console.log('\n' + '='.repeat(50));
console.log('🎯 PODSUMOWANIE TESTÓW API');
console.log('='.repeat(50));

console.log(`📊 Klienci: ${clients.length}`);
console.log(`📋 Zamówienia: ${orders.length}`);
console.log(`👨‍🔧 Pracownicy: ${employees.length}`);
console.log(`🔧 Technicy AGD: ${agdTechnicians.length}`);

const totalVisits = orders.reduce((sum, order) => sum + (order.visits?.length || 0), 0);
console.log(`📅 Łącznie wizyt: ${totalVisits}`);

const completedOrders = orders.filter(o => o.status === 'completed').length;
console.log(`✅ Ukończone zamówienia: ${completedOrders}/${orders.length}`);

const totalRevenue = orders
  .filter(o => o.status === 'completed')
  .reduce((sum, order) => sum + (order.totalCost || 0), 0);
console.log(`💰 Łączny przychód: ${totalRevenue} zł`);

console.log('\n🔍 STATUS SYSTEMU:');
console.log(`${allRelationsCorrect ? '✅' : '❌'} Relacje klient-zamówienie`);
console.log(`${allVisitIdsCorrect ? '✅' : '❌'} Formaty visitId`);
console.log(`${allOrdersComplete ? '✅' : '⚠️'} Kompletność danych AGD`);

if (allRelationsCorrect && allVisitIdsCorrect && allOrdersComplete) {
  console.log('\n🎉 SYSTEM GOTOWY DO PRACY!');
  console.log('Wszystkie dane są poprawne i spójne.');
} else {
  console.log('\n⚠️ SYSTEM WYMAGA POPRAWEK');
  console.log('Niektóre dane wymagają uzupełnienia.');
}