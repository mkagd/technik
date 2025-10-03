// Dokładna analiza formatów ID vs dat
const clients = require('./data/clients.json');
const orders = require('./data/orders.json');

console.log('=== ANALIZA FORMATÓW ID vs DATY ===\n');

console.log('KLIENCI - analiza formatu ID:');
clients.forEach(client => {
  const id = client.id; // CLI25186001
  const prefix = id.substring(0, 3); // CLI
  const dateStr = id.substring(3, 8); // 25186
  const seqNum = id.substring(8); // 001
  
  const createdAt = new Date(client.createdAt);
  const year = createdAt.getFullYear().toString().substring(2); // 25
  const dayOfYear = Math.floor((createdAt - new Date(createdAt.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)); // dzień roku
  
  console.log(`ID: ${id}`);
  console.log(`  Prefix: ${prefix} | DateStr: ${dateStr} | SeqNum: ${seqNum}`);
  console.log(`  Created: ${createdAt.toISOString().substring(0,10)} | Year: ${year} | DayOfYear: ${dayOfYear}`);
  console.log(`  Czy dateStr = year+dayOfYear? ${dateStr} == ${year}${dayOfYear.toString().padStart(3, '0')} = ${dateStr === year + dayOfYear.toString().padStart(3, '0')}`);
  console.log('');
});

console.log('ZAMÓWIENIA - analiza formatu orderNumber:');
orders.forEach(order => {
  const orderNum = order.orderNumber; // ORDA25092001
  const prefix = orderNum.substring(0, 4); // ORDA
  const dateStr = orderNum.substring(4, 9); // 25092
  const seqNum = orderNum.substring(9); // 001
  
  const createdAt = new Date(order.createdAt);
  const year = createdAt.getFullYear().toString().substring(2); // 25
  const month = (createdAt.getMonth() + 1).toString().padStart(2, '0'); // 09
  const day = createdAt.getDate().toString().padStart(2, '0'); // 20
  const dayOfYear = Math.floor((createdAt - new Date(createdAt.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  console.log(`OrderNum: ${orderNum}`);
  console.log(`  Prefix: ${prefix} | DateStr: ${dateStr} | SeqNum: ${seqNum}`);
  console.log(`  Created: ${createdAt.toISOString().substring(0,10)}`);
  console.log(`  Year: ${year} | Month: ${month} | Day: ${day} | DayOfYear: ${dayOfYear}`);
  console.log(`  Możliwe formaty:`);
  console.log(`    YearMonthDay: ${year}${month}${day} = ${year + month + day}`);
  console.log(`    YearDayOfYear: ${year}${dayOfYear.toString().padStart(3, '0')} = ${year + dayOfYear.toString().padStart(3, '0')}`);
  console.log(`  Które pasuje? dateStr=${dateStr}`);
  console.log('');
});

console.log('WIZYTY - analiza formatu visitId:');
orders.forEach(order => {
  order.visits.forEach(visit => {
    const visitId = visit.visitId; // VIS25092001
    const prefix = visitId.substring(0, 3); // VIS
    const dateStr = visitId.substring(3, 8); // 25092
    const seqNum = visitId.substring(8); // 001
    
    const scheduledDate = new Date(visit.scheduledDate);
    const year = scheduledDate.getFullYear().toString().substring(2); // 25
    const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0'); // 09
    const day = scheduledDate.getDate().toString().padStart(2, '0'); // 20
    const dayOfYear = Math.floor((scheduledDate - new Date(scheduledDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    console.log(`VisitID: ${visitId} (Order: ${order.orderNumber})`);
    console.log(`  Prefix: ${prefix} | DateStr: ${dateStr} | SeqNum: ${seqNum}`);
    console.log(`  Scheduled: ${scheduledDate.toISOString().substring(0,10)}`);
    console.log(`  Year: ${year} | Month: ${month} | Day: ${day} | DayOfYear: ${dayOfYear}`);
    console.log(`  YearMonthDay: ${year + month + day} | YearDayOfYear: ${year + dayOfYear.toString().padStart(3, '0')}`);
    console.log(`  Które pasuje? dateStr=${dateStr}`);
    console.log('');
  });
});