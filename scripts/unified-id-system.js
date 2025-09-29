// scripts/unified-id-system.js - Elastyczny system ID z dniem roku
// Automatyczne skalowanie: 3→4→5 cyfr na końcu

const fs = require('fs');
const path = require('path');

// ===============================
// KONFIGURACJA SYSTEMU
// ===============================
const ID_CONFIG = {
  // Prefiksy dla różnych encji
  prefixes: {
    'CLI': 'Klienci',
    'ORD': 'Zamówienia', 
    'EMP': 'Pracownicy',
    'SRV': 'Usługi',
    'VIS': 'Wizyty',
    'PAY': 'Płatności',
    'INV': 'Faktury',
    'PAR': 'Części',
    'REP': 'Raporty',
    'NOT': 'Powiadomienia',
    'SCH': 'Harmonogram',
    'REV': 'Recenzje',
    'TIC': 'Bilety'
  },
  
  // Limity dla automatycznego skalowania
  limits: {
    3: 999,    // 3 cyfry: 001-999
    4: 9999,   // 4 cyfry: 0001-9999  
    5: 99999   // 5 cyfr: 00001-99999
  },
  
  // Domyślna długość sekwencji
  defaultSequenceLength: 3,
  
  // Plik z licznikami dziennymi
  countersFile: 'data/daily-counters.json'
};

// ===============================
// FUNKCJE POMOCNICZE
// ===============================

// Oblicz dzień roku
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Pobierz liczniki dzienne
function getDailyCounters() {
  try {
    if (fs.existsSync(ID_CONFIG.countersFile)) {
      return JSON.parse(fs.readFileSync(ID_CONFIG.countersFile, 'utf8'));
    }
  } catch (error) {
    console.log('⚠️ Błąd odczytu liczników:', error.message);
  }
  return {};
}

// Zapisz liczniki dzienne
function saveDailyCounters(counters) {
  try {
    // Upewnij się że folder istnieje
    const dir = path.dirname(ID_CONFIG.countersFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(ID_CONFIG.countersFile, JSON.stringify(counters, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Błąd zapisu liczników:', error.message);
    return false;
  }
}

// Określ potrzebną długość sekwencji na podstawie licznika
function getSequenceLength(counter) {
  if (counter <= ID_CONFIG.limits[3]) return 3;
  if (counter <= ID_CONFIG.limits[4]) return 4;
  if (counter <= ID_CONFIG.limits[5]) return 5;
  
  // Jeśli przekroczymy 99999, zwiększ do 6 cyfr
  return 6;
}

// ===============================
// GENERATOR NOWYCH ID
// ===============================
function generateUnifiedID(prefix, date = new Date(), forceSequence = null) {
  // Walidacja prefiksu
  if (!ID_CONFIG.prefixes[prefix]) {
    throw new Error(`Nieznany prefiks: ${prefix}. Dostępne: ${Object.keys(ID_CONFIG.prefixes).join(', ')}`);
  }
  
  // Przygotuj komponenty
  const year = date.getFullYear().toString().slice(-2);
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0');
  
  // Klucz dla licznika dziennego
  const counterKey = `${prefix}_${year}${dayOfYear}`;
  
  // Pobierz liczniki
  const counters = getDailyCounters();
  
  // Ustaw licznik (następny numer lub wymuszona wartość)
  let sequence;
  if (forceSequence !== null) {
    sequence = forceSequence;
    counters[counterKey] = Math.max(counters[counterKey] || 0, sequence);
  } else {
    counters[counterKey] = (counters[counterKey] || 0) + 1;
    sequence = counters[counterKey];
  }
  
  // Określ długość sekwencji
  const sequenceLength = getSequenceLength(sequence);
  const paddedSequence = sequence.toString().padStart(sequenceLength, '0');
  
  // Zapisz liczniki
  saveDailyCounters(counters);
  
  // Zbuduj finalne ID
  const finalID = `${prefix}${year}${dayOfYear}${paddedSequence}`;
  
  return {
    id: finalID,
    prefix,
    year: `20${year}`,
    dayOfYear: parseInt(dayOfYear),
    sequence,
    sequenceLength,
    date: date.toLocaleDateString('pl-PL'),
    entityName: ID_CONFIG.prefixes[prefix]
  };
}

// ===============================
// DEKODER ID
// ===============================
function decodeUnifiedID(id) {
  if (typeof id !== 'string' || id.length < 8) {
    return { error: 'Nieprawidłowy format ID (za krótkie)' };
  }
  
  const prefix = id.slice(0, 3);
  
  if (!ID_CONFIG.prefixes[prefix]) {
    return { error: `Nieznany prefiks: ${prefix}` };
  }
  
  try {
    const year = `20${id.slice(3, 5)}`;
    const dayOfYear = parseInt(id.slice(5, 8));
    const sequencePart = id.slice(8);
    const sequence = parseInt(sequencePart);
    
    // Oblicz datę z dnia roku
    const yearStart = new Date(parseInt(year), 0, 1);
    const targetDate = new Date(yearStart.getTime() + (dayOfYear - 1) * 24 * 60 * 60 * 1000);
    
    return {
      id,
      prefix,
      year,
      dayOfYear,
      sequence,
      sequenceLength: sequencePart.length,
      date: targetDate.toLocaleDateString('pl-PL'),
      entityName: ID_CONFIG.prefixes[prefix],
      isValid: true
    };
  } catch (error) {
    return { error: `Błąd dekodowania: ${error.message}` };
  }
}

// ===============================
// MIGRACJA ISTNIEJĄCYCH DANYCH
// ===============================
function migrateToUnifiedSystem() {
  console.log('🔄 MIGRACJA DO UJEDNOLICONEGO SYSTEMU ID');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const migrations = [
    {
      name: 'Klienci',
      file: 'data/clients.json',
      prefix: 'CLI',
      dateField: 'dateAdded'
    },
    {
      name: 'Zamówienia', 
      file: 'data/orders.json',
      prefix: 'ORD',
      dateField: 'dateAdded'
    },
    {
      name: 'Pracownicy',
      file: 'data/employees.json', 
      prefix: 'EMP',
      dateField: 'dateAdded'
    },
    {
      name: 'Rezerwacje',
      file: 'data/rezervacje.json',
      prefix: 'VIS', 
      dateField: 'created_at'
    }
  ];
  
  const results = {
    migrated: 0,
    errors: 0,
    skipped: 0
  };
  
  migrations.forEach(migration => {
    console.log(`\\n📦 ${migration.name}:`);
    
    try {
      if (!fs.existsSync(migration.file)) {
        console.log('  ⚠️ Plik nie istnieje, pomijam');
        results.skipped++;
        return;
      }
      
      const data = JSON.parse(fs.readFileSync(migration.file, 'utf8'));
      console.log(`  📊 Rekordów do migracji: ${data.length}`);
      
      // Backup
      const backupFile = migration.file.replace('.json', `_backup_${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      console.log(`  🔒 Backup: ${backupFile}`);
      
      // Migruj każdy rekord
      const migratedData = data.map((record, index) => {
        try {
          // Pobierz datę z rekordu
          let recordDate = new Date();
          if (record[migration.dateField]) {
            recordDate = new Date(record[migration.dateField]);
          }
          
          // Wygeneruj nowe ID
          const newIdInfo = generateUnifiedID(migration.prefix, recordDate, index + 1);
          
          // Zachowaj stare ID dla kompatybilności
          const migratedRecord = {
            ...record,
            id: newIdInfo.id,
            oldId: record.id,
            migrationDate: new Date().toISOString(),
            migrationSource: 'unified-id-system'
          };
          
          return migratedRecord;
        } catch (error) {
          console.log(`  ❌ Błąd migracji rekordu ${index + 1}: ${error.message}`);
          results.errors++;
          return record; // Zwróć oryginalny rekord
        }
      });
      
      // Zapisz zmigrowane dane
      fs.writeFileSync(migration.file, JSON.stringify(migratedData, null, 2));
      console.log(`  ✅ Migracja ukończona: ${data.length} rekordów`);
      results.migrated += data.length;
      
    } catch (error) {
      console.log(`  ❌ Błąd migracji: ${error.message}`);
      results.errors++;
    }
  });
  
  console.log('\\n📊 PODSUMOWANIE MIGRACJI:');
  console.log('═'.repeat(50));
  console.log(`✅ Zmigrowano: ${results.migrated} rekordów`);
  console.log(`❌ Błędy: ${results.errors}`);
  console.log(`⚠️ Pominięto: ${results.skipped}`);
  
  return results;
}

// ===============================
// NARZĘDZIA DIAGNOSTYCZNE
// ===============================
function showSystemStatus() {
  console.log('📊 STATUS SYSTEMU ID');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const counters = getDailyCounters();
  
  console.log('📈 LICZNIKI DZIENNE:');
  if (Object.keys(counters).length === 0) {
    console.log('  Brak aktywnych liczników');
  } else {
    Object.entries(counters).forEach(([key, count]) => {
      const decoded = decodeCounterKey(key);
      console.log(`  ${key}: ${count} (${decoded})`);
    });
  }
  
  console.log('\\n🎯 PRZYKŁADY NOWYCH ID:');
  Object.keys(ID_CONFIG.prefixes).slice(0, 5).forEach(prefix => {
    try {
      const example = generateUnifiedID(prefix, new Date(), null);
      console.log(`  ${example.id} → ${example.entityName}, ${example.date}`);
    } catch (error) {
      console.log(`  ${prefix}: Błąd generowania`);
    }
  });
}

function decodeCounterKey(key) {
  const [prefix, yearDay] = key.split('_');
  const year = `20${yearDay.slice(0, 2)}`;
  const day = parseInt(yearDay.slice(2));
  
  const yearStart = new Date(parseInt(year), 0, 1);
  const date = new Date(yearStart.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
  
  return `${ID_CONFIG.prefixes[prefix]}, ${date.toLocaleDateString('pl-PL')}`;
}

// ===============================
// EKSPORT
// ===============================
module.exports = {
  generateUnifiedID,
  decodeUnifiedID,
  migrateToUnifiedSystem,
  showSystemStatus,
  ID_CONFIG
};

// Uruchom jeśli wywołany bezpośrednio
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--migrate')) {
    migrateToUnifiedSystem();
  } else if (args.includes('--status')) {
    showSystemStatus();
  } else {
    console.log('🚀 SYSTEM ID Z ELASTYCZNYM SKALOWANIEM');
    console.log('');
    console.log('Użycie:');
    console.log('  node unified-id-system.js --migrate   # Migruj dane');
    console.log('  node unified-id-system.js --status    # Pokaż status');
    console.log('');
    showSystemStatus();
  }
}