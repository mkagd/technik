// Test sprawdzenia poprawności naprawek
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

console.log('=== TEST POPRAWNOŚCI NAPRAWEK ===\n');

let allCorrect = true;

console.log('KLIENCI - sprawdzenie poprawności:');
clients.forEach((client, index) => {
  const createdDate = new Date(client.createdAt);
  const expectedId = formatDateId('CLI', createdDate, index + 1);
  const isCorrect = client.id === expectedId && client.clientId === expectedId;
  
  console.log(`${index + 1}. ${client.firstName} ${client.lastName}`);
  console.log(`   ID: ${client.id}`);
  console.log(`   ClientID: ${client.clientId}`);
  console.log(`   Expected: ${expectedId}`);
  console.log(`   Status: ${isCorrect ? '✅ POPRAWNY' : '❌ BŁĘDNY'}`);
  console.log('');
  
  if (!isCorrect) allCorrect = false;
});

console.log('ZAMÓWIENIA - sprawdzenie poprawności:');
orders.forEach((order, index) => {
  const createdDate = new Date(order.createdAt);
  const expectedOrderNum = formatDateId('ORDA', createdDate, index + 1);
  const isCorrect = order.orderNumber === expectedOrderNum;
  
  // Sprawdź powiązanie z klientem
  const client = clients.find(c => c.id === order.clientId);
  const clientExists = !!client;
  
  console.log(`${index + 1}. Order ID: ${order.id}`);
  console.log(`   OrderNumber: ${order.orderNumber}`);
  console.log(`   Expected: ${expectedOrderNum}`);
  console.log(`   Client Link: ${order.clientId} → ${clientExists ? client?.firstName + ' ' + client?.lastName : 'NOT FOUND'}`);
  console.log(`   Status: ${isCorrect && clientExists ? '✅ POPRAWNY' : '❌ BŁĘDNY'}`);
  console.log('');
  
  if (!isCorrect || !clientExists) allCorrect = false;
});

console.log('WIZYTY - sprawdzenie poprawności:');
orders.forEach(order => {
  const orderCreatedDate = new Date(order.createdAt);
  console.log(`Zamówienie: ${order.orderNumber}`);
  
  order.visits.forEach((visit, visitIndex) => {
    const expectedVisitId = formatDateId('VIS', orderCreatedDate, visitIndex + 1);
    const isCorrect = visit.visitId === expectedVisitId;
    
    console.log(`  Wizyta ${visitIndex + 1}:`);
    console.log(`    VisitID: ${visit.visitId}`);
    console.log(`    Expected: ${expectedVisitId}`);
    console.log(`    Scheduled: ${visit.scheduledDate.substring(0,16)}`);
    console.log(`    Status: ${isCorrect ? '✅ POPRAWNY' : '❌ BŁĘDNY'}`);
    console.log('');
    
    if (!isCorrect) allCorrect = false;
  });
});

console.log('=== PODSUMOWANIE TESTÓW ===');
console.log(`Status: ${allCorrect ? '✅ WSZYSTKIE IDENTYFIKATORY POPRAWNE!' : '❌ ZNALEZIONO BŁĘDY!'}`);

// Test integralności powiązań
console.log('\n=== TEST INTEGRALNOŚCI POWIĄZAŃ ===');
let linksCorrect = true;

orders.forEach(order => {
  const client = clients.find(c => c.id === order.clientId);
  if (!client) {
    console.log(`❌ BŁĄD: Zamówienie ${order.orderNumber} ma nieprawidłowy clientId: ${order.clientId}`);
    linksCorrect = false;
  }
});

console.log(`Powiązania: ${linksCorrect ? '✅ WSZYSTKIE PRAWIDŁOWE' : '❌ ZNALEZIONO BŁĘDY'}`);

console.log(`\n🎯 OSTATECZNY WYNIK: ${allCorrect && linksCorrect ? '✅ SYSTEM NAPRAWIONY POMYŚLNIE!' : '❌ WYMAGANE DODATKOWE NAPRAWY'}`);