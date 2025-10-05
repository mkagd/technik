// Skrypt naprawy ID zamówień
// Naprawia zepsute ID w formacie ORD2025XXXXXX

const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

console.log('🔧 Naprawa ID zamówień...\n');

// Wczytaj zamówienia
const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
console.log(`📦 Wczytano ${orders.length} zamówień`);

// Znajdź zepsute ID
const brokenOrders = orders.filter(o => {
  const id = o.id;
  // Prawidłowy format: ORD2025XXXXXX (ORD + 2025 + 6 cyfr)
  const isValid = /^ORD2025\d{6}$/.test(id);
  return !isValid;
});

console.log(`❌ Znaleziono ${brokenOrders.length} zepsutych ID:`);
brokenOrders.forEach(o => {
  console.log(`   - ${o.id} (${o.deviceType}, ${o.clientName})`);
});

// Znajdź największy prawidłowy numer
let maxNumber = 0;
orders.forEach(o => {
  const match = o.id.match(/^ORD2025(\d{6})$/);
  if (match) {
    const num = parseInt(match[1]);
    if (num > maxNumber) {
      maxNumber = num;
    }
  }
});

console.log(`\n✅ Największy prawidłowy numer: ${maxNumber}`);

// Usuń duplikaty (te same ID)
const seenIds = new Set();
const uniqueOrders = [];
const duplicates = [];

orders.forEach(o => {
  if (seenIds.has(o.id)) {
    duplicates.push(o);
    console.log(`🗑️  Usuwam duplikat: ${o.id}`);
  } else {
    seenIds.add(o.id);
    uniqueOrders.push(o);
  }
});

console.log(`\n🗑️  Usunięto ${duplicates.length} duplikatów`);

// Przepisz zepsute ID
let newNumber = maxNumber;
const fixedOrders = uniqueOrders.map(o => {
  const isValid = /^ORD2025\d{6}$/.test(o.id);
  
  if (!isValid) {
    newNumber++;
    const oldId = o.id;
    const newId = `ORD2025${String(newNumber).padStart(6, '0')}`;
    console.log(`🔄 ${oldId} → ${newId}`);
    
    return {
      ...o,
      id: newId
    };
  }
  
  return o;
});

// Zapisz naprawione zamówienia
fs.writeFileSync(
  ORDERS_FILE,
  JSON.stringify(fixedOrders, null, 2),
  'utf8'
);

console.log(`\n✅ Naprawiono! Zapisano ${fixedOrders.length} zamówień`);
console.log(`📊 Statystyki:`);
console.log(`   - Oryginalne zamówienia: ${orders.length}`);
console.log(`   - Usunięte duplikaty: ${duplicates.length}`);
console.log(`   - Naprawione ID: ${brokenOrders.length}`);
console.log(`   - Końcowe zamówienia: ${fixedOrders.length}`);
console.log(`   - Następny ID: ORD2025${String(newNumber + 1).padStart(6, '0')}`);
