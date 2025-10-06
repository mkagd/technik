// fix-client-availability.js
// Ustawia domyślną dostępność dla klientów, którzy jej nie mają

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, 'data', 'clients.json');

// Domyślna dostępność: dni robocze 8:00-20:00, sobota 9:00-18:00
const DEFAULT_AVAILABILITY = {
  timeWindows: [
    {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeFrom: '08:00',
      timeTo: '20:00',
      label: 'Dni robocze'
    },
    {
      days: ['saturday'],
      timeFrom: '09:00',
      timeTo: '18:00',
      label: 'Sobota'
    }
  ],
  preferences: {
    flexibleSchedule: true,
    requiresAdvanceNotice: true,
    advanceNoticeHours: 24
  },
  presenceHistory: [],
  stats: {},
  score: 85,
  category: 'weekdays',
  notes: [],
  lastUpdated: new Date().toISOString()
};

function fixClientAvailability(dryRun = true) {
  console.log('\n🔧 NAPRAWA DOSTĘPNOŚCI KLIENTÓW\n');
  console.log('═'.repeat(60));
  
  if (dryRun) {
    console.log('⚠️  TRYB TESTOWY - żadne dane nie będą zmienione');
    console.log('   Uruchom z parametrem "fix" aby zapisać zmiany');
  } else {
    console.log('💾 TRYB ZAPISU - dane zostaną zmienione!');
  }
  
  console.log('');
  
  const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
  const clients = JSON.parse(data);
  
  let fixed = 0;
  let skipped = 0;
  
  clients.forEach((client, index) => {
    if (!client.physicalAvailability) {
      fixed++;
      console.log(`✅ Naprawiono: ${client.name} (${client.id || client.clientId})`);
      console.log(`   Ustawiono: Dni robocze 8-20, Sobota 9-18`);
      console.log(`   Score: 85, Kategoria: weekdays`);
      console.log('');
      
      if (!dryRun) {
        clients[index].physicalAvailability = DEFAULT_AVAILABILITY;
      }
    } else {
      skipped++;
    }
  });
  
  if (!dryRun && fixed > 0) {
    // Backup
    const backupFile = CLIENTS_FILE + '.backup-' + Date.now();
    fs.writeFileSync(backupFile, data);
    console.log(`💾 Backup utworzony: ${path.basename(backupFile)}\n`);
    
    // Zapisz zmiany
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    console.log(`✅ Zapisano ${fixed} zmian do pliku clients.json\n`);
  }
  
  console.log('═'.repeat(60));
  console.log('\n📊 PODSUMOWANIE:\n');
  console.log(`  ✅ Naprawiono:  ${fixed}`);
  console.log(`  ⏭️  Pominięto:   ${skipped}`);
  console.log(`  📊 Łącznie:     ${clients.length}`);
  console.log('');
  
  if (dryRun && fixed > 0) {
    console.log('\n💡 ABY ZAPISAĆ ZMIANY, URUCHOM:\n');
    console.log('   node fix-client-availability.js fix');
    console.log('');
  }
}

// Sprawdź parametry
const args = process.argv.slice(2);
const dryRun = !args.includes('fix');

fixClientAvailability(dryRun);
