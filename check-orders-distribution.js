const orders = require('./data/orders.json');

const cities = {};
orders.forEach(o => {
  cities[o.city] = (cities[o.city] || 0) + 1;
});

console.log('📍 Rozkład zleceń po miastach:');
Object.entries(cities)
  .sort((a, b) => b[1] - a[1])
  .forEach(([city, count]) => {
    console.log(`   ${city}: ${count} zleceń`);
  });

console.log(`\n📊 Łącznie: ${orders.length} zleceń`);
console.log(`📊 Łącznie wizyt: ${orders.reduce((sum, o) => sum + o.visits.length, 0)}`);
