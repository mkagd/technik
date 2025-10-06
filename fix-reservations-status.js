// fix-reservations-status.js - Dodaj status do rezerwacji które go nie mają
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'rezerwacje.json');

try {
  if (!fs.existsSync(filePath)) {
    console.log('❌ Plik reservations.json nie istnieje');
    process.exit(1);
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const reservations = JSON.parse(data);
  
  console.log(`📊 Znaleziono ${reservations.length} rezerwacji`);
  
  let updated = 0;
  reservations.forEach(r => {
    if (!r.status) {
      r.status = 'pending';
      updated++;
    }
  });
  
  if (updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(reservations, null, 2), 'utf8');
    console.log(`✅ Zaktualizowano ${updated} rezerwacji z brakującym statusem`);
  } else {
    console.log('✅ Wszystkie rezerwacje mają już status');
  }
  
  console.log('\n📋 Statusy rezerwacji:');
  const statusCounts = {};
  reservations.forEach(r => {
    statusCounts[r.status || 'brak'] = (statusCounts[r.status || 'brak'] || 0) + 1;
  });
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
} catch (error) {
  console.error('❌ Błąd:', error.message);
  process.exit(1);
}
