/**
 * Test workflow rezerwacji:
 * 1. Sprawdź obecny stan danych
 * 2. Symuluj zmianę statusu rezerwacji na "contacted"
 * 3. Zweryfikuj utworzenie klienta i zamówienia
 */

const fs = require('fs');
const path = require('path');

const RESERVATIONS_PATH = path.join(__dirname, 'data', 'rezerwacje.json');
const CLIENTS_PATH = path.join(__dirname, 'data', 'clients.json');
const ORDERS_PATH = path.join(__dirname, 'data', 'orders.json');

console.log('📋 TEST WORKFLOW REZERWACJI\n');

// Odczytaj dane
const reservations = JSON.parse(fs.readFileSync(RESERVATIONS_PATH, 'utf8'));
const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf8'));
const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf8'));

console.log('📊 OBECNY STAN DANYCH:');
console.log(`- Rezerwacje: ${reservations.length}`);
console.log(`- Klienci: ${clients.length}`);
console.log(`- Zamówienia: ${orders.length}\n`);

// Pokaż rezerwacje z różnymi statusami
const statusCounts = reservations.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});

console.log('📌 STATUS REZERWACJI:');
Object.entries(statusCounts).forEach(([status, count]) => {
  console.log(`  - ${status}: ${count}`);
});
console.log();

// Znajdź rezerwacje "pending" do testowania
const pendingReservations = reservations.filter(r => r.status === 'pending');
console.log(`🔍 Rezerwacje "pending" do konwersji: ${pendingReservations.length}`);

if (pendingReservations.length > 0) {
  console.log('\n📋 PRZYKŁADOWA REZERWACJA DO KONWERSJI:');
  const example = pendingReservations[0];
  console.log(`  ID: ${example.id}`);
  console.log(`  Nazwa: ${example.name}`);
  console.log(`  Telefon: ${example.phone}`);
  console.log(`  Email: ${example.email || 'Brak'}`);
  console.log(`  Urządzenie: ${example.device || example.category}`);
  console.log(`  Status: ${example.status}`);
  console.log(`  userId: ${example.userId || 'Brak'}`);
  console.log(`  isAuthenticated: ${example.isAuthenticated || false}`);
}

// Sprawdź czy są rezerwacje "contacted" bez odpowiadających zamówień
const contactedReservations = reservations.filter(r => r.status === 'contacted');
console.log(`\n🔍 Rezerwacje "contacted": ${contactedReservations.length}`);

if (contactedReservations.length > 0) {
  console.log('\n⚠️  ANALIZA REZERWACJI "CONTACTED":');
  
  contactedReservations.forEach(res => {
    // Sprawdź czy istnieje zamówienie dla tej rezerwacji
    const hasOrder = orders.some(o => 
      o.originalReservationId === res.id || 
      o.reservationId === res.id ||
      o.orderId === res.orderId
    );
    
    // Sprawdź czy istnieje klient
    const client = clients.find(c => 
      c.phone === res.phone || 
      c.email === res.email ||
      c.id === res.clientId
    );
    
    console.log(`\n  📋 Rezerwacja ID: ${res.id}`);
    console.log(`     Nazwa: ${res.name}`);
    console.log(`     Telefon: ${res.phone}`);
    console.log(`     Status: ${res.status}`);
    console.log(`     Klient istnieje: ${client ? '✅ TAK (ID: ' + client.id + ')' : '❌ NIE'}`);
    console.log(`     Zamówienie istnieje: ${hasOrder ? '✅ TAK' : '❌ NIE - BŁĄD!'}`);
    console.log(`     orderNumber: ${res.orderNumber || 'Brak'}`);
    console.log(`     convertedToOrder: ${res.convertedToOrder || false}`);
  });
}

// Sprawdź duplikaty klientów (po telefonie)
console.log('\n🔍 ANALIZA DUPLIKATÓW KLIENTÓW:');
const phoneMap = {};
clients.forEach(client => {
  if (client.phone) {
    if (!phoneMap[client.phone]) {
      phoneMap[client.phone] = [];
    }
    phoneMap[client.phone].push(client);
  }
});

const duplicates = Object.entries(phoneMap).filter(([phone, clients]) => clients.length > 1);
if (duplicates.length > 0) {
  console.log(`⚠️  Znaleziono ${duplicates.length} numerów telefonów z duplikatami:`);
  duplicates.forEach(([phone, clients]) => {
    console.log(`\n  📞 ${phone} (${clients.length} klientów):`);
    clients.forEach(c => {
      console.log(`     - ID: ${c.id}, Nazwa: ${c.name}, Source: ${c.source || 'brak'}`);
    });
  });
} else {
  console.log('✅ Brak duplikatów klientów (sprawdzanie po telefonie)');
}

// Podsumowanie
console.log('\n' + '='.repeat(60));
console.log('📊 PODSUMOWANIE:');
console.log('='.repeat(60));
console.log(`✅ Rezerwacje PENDING: ${pendingReservations.length}`);
console.log(`✅ Rezerwacje CONTACTED: ${contactedReservations.length}`);

const contactedWithoutOrders = contactedReservations.filter(res => {
  return !orders.some(o => 
    o.originalReservationId === res.id || 
    o.reservationId === res.id
  );
}).length;

if (contactedWithoutOrders > 0) {
  console.log(`❌ Rezerwacje CONTACTED BEZ zamówień: ${contactedWithoutOrders} - PROBLEM!`);
} else {
  console.log(`✅ Wszystkie rezerwacje CONTACTED mają zamówienia`);
}

console.log(`\n💡 INSTRUKCJE TESTOWANIA:`);
console.log(`1. Otwórz panel admina: http://localhost:3000/admin/rezerwacje`);
console.log(`2. Zmień status rezerwacji "pending" na "contacted"`);
console.log(`3. Sprawdź czy:`)
console.log(`   - Utworzono klienta w clients.json`);
console.log(`   - Utworzono zamówienie w orders.json`);
console.log(`   - Nie ma duplikatów klientów (po telefonie)`);
console.log(`   - userId został zachowany (jeśli był)`);
console.log(`4. Uruchom ten skrypt ponownie: node test-reservation-workflow.js\n`);
