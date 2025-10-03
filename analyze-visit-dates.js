// Analiza dat wizyt - utworzenie vs wykonanie
const orders = require('./data/orders.json');

console.log('=== ANALIZA DAT WIZYT ===\n');

orders.forEach(order => {
  console.log(`ZAMÓWIENIE: ${order.orderNumber} (utworzone: ${order.createdAt.substring(0,10)})`);
  
  order.visits.forEach(visit => {
    const visitId = visit.visitId;
    const dateStrInId = visitId.substring(3, 8); // 25092
    const scheduledDate = new Date(visit.scheduledDate);
    
    // Przypuszczalna data utworzenia wizyty (prawdopodobnie kiedy zamówienie zostało przypisane)
    const orderCreated = new Date(order.createdAt);
    const orderYear = orderCreated.getFullYear().toString().substring(2);
    const orderDayOfYear = Math.floor((orderCreated - new Date(orderCreated.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const expectedVisitIdDate = orderYear + orderDayOfYear.toString().padStart(3, '0');
    
    console.log(`  WIZYTA: ${visitId}`);
    console.log(`    ID dateStr: ${dateStrInId}`);
    console.log(`    Scheduled: ${scheduledDate.toISOString().substring(0,16)} (kiedy ma się odbyć)`);
    console.log(`    Order created: ${order.createdAt.substring(0,16)} (kiedy utworzono zamówienie)`);
    console.log(`    Expected visitId date: ${expectedVisitIdDate} (z daty utworzenia zamówienia)`);
    console.log(`    Czy ID pasuje do utworzenia zamówienia? ${dateStrInId === expectedVisitIdDate}`);
    console.log('');
  });
  console.log('---\n');
});