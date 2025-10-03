// Naprawa visitId w trzecim zamówieniu
const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'data', 'orders.json');
const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));

console.log('Naprawienie visitId w zamówieniu Kręgielnia Laguna...\n');

// Znajdź zamówienie CLI25166003 (data: 16.06.2025)
const orderToFix = orders.find(order => order.clientId === "CLI25166003");

if (orderToFix && orderToFix.visits) {
  console.log(`Zamówienie: ${orderToFix.orderNumber}`);
  console.log(`Klient: ${orderToFix.clientName}`);
  console.log(`ClientId: ${orderToFix.clientId} (data: 16.06.2025)`);
  
  orderToFix.visits.forEach((visit, index) => {
    const oldVisitId = visit.visitId;
    // Format: VIS + 25166 (z clientId) + numeracja
    const newVisitId = `VIS25166${String(index + 1).padStart(3, '0')}`;
    visit.visitId = newVisitId;
    
    console.log(`✅ Wizyta ${index + 1}: ${oldVisitId} → ${newVisitId}`);
  });
}

// Zapisz poprawione dane
fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

console.log(`\n🎉 Poprawiono visitId w zamówieniu Kręgielnia Laguna!`);

// Sprawdź wszystkie visitId
console.log(`\n=== SPRAWDZENIE WSZYSTKICH VISITID ===`);
orders.forEach(order => {
  console.log(`\n${order.orderNumber} (${order.clientId}):`);
  if (order.visits) {
    order.visits.forEach(visit => {
      const expectedPrefix = "VIS" + order.clientId.substring(3, 8);
      const isCorrect = visit.visitId.startsWith(expectedPrefix);
      console.log(`  ${isCorrect ? '✅' : '❌'} ${visit.visitId}`);
    });
  } else {
    console.log(`  ⚠️ Brak wizyt`);
  }
});