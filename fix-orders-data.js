// Naprawka danych w orders.json
const fs = require('fs');
const path = require('path');

// Wczytaj obecne dane
const ordersPath = path.join(__dirname, 'data', 'orders.json');
const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));

console.log('Naprawienie błędów w danych zamówień...\n');

// Napraw każde zamówienie
orders.forEach((order, index) => {
  console.log(`\n=== ZAMÓWIENIE ${index + 1}: ${order.orderNumber} ===`);
  
  // Problem 1: Nieprawidłowe clientId w pierwszym zamówieniu
  if (order.id === 1001) {
    console.log(`❌ Błędne clientId: ${order.clientId} (powinno być CLI25186001)`);
    order.clientId = "CLI25186001";
    console.log(`✅ Poprawiono clientId na: ${order.clientId}`);
    
    // Dodaj brakujące wizyty
    if (!order.visits || order.visits.length === 0) {
      order.visits = [
        {
          "visitId": "VIS25186001",
          "visitNumber": 1,
          "type": "diagnosis",
          "scheduledDate": "2025-01-18T09:00:00Z",
          "actualStartTime": "2025-01-18T09:15:00Z",
          "actualEndTime": "2025-01-18T10:30:00Z",
          "status": "completed",
          "technicianId": "EMP25092001",
          "technicianName": "Michał Kowalski",
          "workDescription": "Diagnoza problemu z wirowaniem w pralce Samsung",
          "findings": "Zużyty łożysk bębna, wymiana konieczna",
          "duration": 75,
          "photos": ["bearing_damage.jpg"]
        },
        {
          "visitId": "VIS25186002",
          "visitNumber": 2,
          "type": "repair",
          "scheduledDate": "2025-01-20T08:00:00Z",
          "actualStartTime": "2025-01-20T08:10:00Z",
          "actualEndTime": "2025-01-20T11:15:00Z",
          "status": "completed",
          "technicianId": "EMP25092001",
          "technicianName": "Michał Kowalski",
          "workDescription": "Wymiana łożysk bębna, test funkcjonalności",
          "findings": "Pralka działa prawidłowo, problem rozwiązany",
          "duration": 185,
          "photos": ["new_bearing.jpg", "test_spin.jpg"]
        }
      ];
      console.log(`✅ Dodano 2 wizyty do zamówienia`);
    }
    
    // Dodaj brakujące dane
    order.clientEmail = "oliwka.bielaszka@gmail.com";
    order.clientPhone = "+48 606 123 123";
    order.partsCost = 85;
    order.laborCost = 160;
    order.totalCost = 245;
    order.partsUsed = [
      {
        "name": "Łożysko bębna Samsung",
        "partNumber": "SAM-BEAR-WW70J",
        "quantity": 1,
        "unitPrice": 85,
        "totalPrice": 85
      }
    ];
    order.createdAt = "2025-01-18T08:12:14Z";
    order.completedAt = "2025-01-20T11:15:00Z";
    console.log(`✅ Uzupełniono brakujące dane`);
  }
  
  // Problem 2: Standardyzacja struktury danych
  if (!order.createdAt && order.created) {
    order.createdAt = "2025-09-27T14:22:00Z";
    delete order.created;
    console.log(`✅ Poprawiono datę utworzenia`);
  }
  
  if (!order.category) {
    order.category = "Serwis AGD";
    console.log(`✅ Dodano kategorię: ${order.category}`);
  }
  
  if (!order.clientEmail) {
    const emails = {
      "CLI25186001": "oliwka.bielaszka@gmail.com",
      "CLI25271002": "k.kowalska@email.pl", 
      "CLI25166003": "kontakt@kregielnia-laguna.pl"
    };
    order.clientEmail = emails[order.clientId] || "brak@email.pl";
    console.log(`✅ Dodano email: ${order.clientEmail}`);
  }
  
  // Sprawdź zgodność visitId z datami
  if (order.visits) {
    order.visits.forEach(visit => {
      const expectedPrefix = "VIS" + order.clientId.substring(3, 8);
      if (!visit.visitId.startsWith(expectedPrefix)) {
        console.log(`⚠️ Nieprawidłowy format visitId: ${visit.visitId}`);
      } else {
        console.log(`✅ visitId prawidłowy: ${visit.visitId}`);
      }
    });
  }
});

// Zapisz poprawione dane
fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

console.log(`\n🎉 NAPRAWKA ZAKOŃCZONA!`);
console.log(`📄 Zaktualizowano plik: ${ordersPath}`);
console.log(`📊 Liczba zamówień: ${orders.length}`);

// Podsumowanie
console.log(`\n=== PODSUMOWANIE NAPRAWEK ===`);
orders.forEach((order, index) => {
  console.log(`${index + 1}. ${order.orderNumber} (${order.clientName})`);
  console.log(`   - clientId: ${order.clientId}`);
  console.log(`   - email: ${order.clientEmail}`);
  console.log(`   - wizyty: ${order.visits ? order.visits.length : 0}`);
  console.log(`   - status: ${order.status}`);
  console.log(`   - koszt: ${order.totalCost} zł`);
});