// check-client-availability.js
// Sprawdza stan dostępności klientów w bazie

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, 'data', 'clients.json');

function checkClientAvailability() {
  console.log('\n🔍 ANALIZA DOSTĘPNOŚCI KLIENTÓW\n');
  console.log('═'.repeat(60));
  
  const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
  const clients = JSON.parse(data);
  
  console.log(`\n📊 Łącznie klientów: ${clients.length}\n`);
  
  let withAvailability = 0;
  let withoutAvailability = 0;
  let withEmptyAvailability = 0;
  
  clients.forEach(client => {
    if (client.physicalAvailability === null || client.physicalAvailability === undefined) {
      withoutAvailability++;
    } else if (
      client.physicalAvailability && 
      client.physicalAvailability.timeWindows && 
      client.physicalAvailability.timeWindows.length > 0
    ) {
      withAvailability++;
      console.log(`✅ ${client.name} (${client.id || client.clientId})`);
      console.log(`   📅 Okna czasowe: ${client.physicalAvailability.timeWindows.length}`);
      console.log(`   🎯 Score: ${client.physicalAvailability.score || 0}`);
      console.log(`   📝 Kategoria: ${client.physicalAvailability.category || 'brak'}`);
      if (client.physicalAvailability.lastUpdated) {
        console.log(`   🕐 Ostatnia aktualizacja: ${new Date(client.physicalAvailability.lastUpdated).toLocaleString('pl-PL')}`);
      }
      console.log('');
    } else {
      withEmptyAvailability++;
      console.log(`⚠️  ${client.name} (${client.id || client.clientId}) - pusty obiekt availability`);
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📈 PODSUMOWANIE:\n');
  console.log(`  ✅ Z dostępnością: ${withAvailability}`);
  console.log(`  ⚠️  Pusty obiekt:   ${withEmptyAvailability}`);
  console.log(`  ❌ Bez dostępności: ${withoutAvailability}`);
  console.log(`  📊 Procent wypełnienia: ${((withAvailability / clients.length) * 100).toFixed(1)}%`);
  
  if (withoutAvailability > 0) {
    console.log('\n\n🔧 KLIENCI BEZ DOSTĘPNOŚCI:\n');
    clients
      .filter(c => c.physicalAvailability === null || c.physicalAvailability === undefined)
      .forEach(c => {
        console.log(`  • ${c.name} (${c.id || c.clientId})`);
        console.log(`    Tel: ${c.phone}, Email: ${c.email || 'brak'}`);
        console.log(`    Dodano: ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('pl-PL') : 'brak daty'}`);
        console.log('');
      });
  }
  
  console.log('\n💡 ZALECENIA:\n');
  
  if (withoutAvailability > withAvailability) {
    console.log('  ⚠️  Większość klientów nie ma ustawionej dostępności');
    console.log('  💡 Rozważ:');
    console.log('     - Domyślną wartość dostępności (8:00-20:00 cały tydzień)');
    console.log('     - Przypomnienie podczas tworzenia zlecenia');
    console.log('     - Import dostępności z historii wizyt');
  } else {
    console.log('  ✅ Większość klientów ma ustawioną dostępność - dobra robota!');
  }
  
  console.log('\n');
}

// Uruchom analizę
checkClientAvailability();
