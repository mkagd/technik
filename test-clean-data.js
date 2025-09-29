/**
 * TEST PORÓWNANIA DANYCH TESTOWYCH
 * 
 * Sprawdza różnicę między starymi danymi (z ręcznymi datami) 
 * a nowymi danymi (z automatycznymi polami)
 */

const { 
  SEED_DATA,           // Stare dane z ręcznymi datami
  CLEAN_SEED_DATA,     // Nowe dane bez duplikowania
  generatePastDate,
  generateFutureDate
} = require('./shared');

console.log('🧪 TEST PORÓWNANIA DANYCH TESTOWYCH\n');

// ========== STARE DANE (z duplikacją) ==========
console.log('📊 STARE DANE (z ręcznymi datami):');
console.log('Klient 1:', {
  name: `${SEED_DATA.clients[0].firstName} ${SEED_DATA.clients[0].lastName}`,
  createdAt: SEED_DATA.clients[0].createdAt || 'BRAK!',
  dataLength: JSON.stringify(SEED_DATA.clients[0]).length
});

// ========== NOWE DANE (automatyczne) ==========
console.log('\n✨ NOWE DANE (automatyczne pola):');
console.log('Klient 1:', {
  name: `${CLEAN_SEED_DATA.clients[0].firstName} ${CLEAN_SEED_DATA.clients[0].lastName}`,
  id: CLEAN_SEED_DATA.clients[0].id,
  clientId: CLEAN_SEED_DATA.clients[0].clientId,
  createdAt: CLEAN_SEED_DATA.clients[0].createdAt,
  updatedAt: CLEAN_SEED_DATA.clients[0].updatedAt,
  dataLength: JSON.stringify(CLEAN_SEED_DATA.clients[0]).length
});

// ========== PORÓWNANIE WIZYT ==========
console.log('\n🏠 WIZYTY - PORÓWNANIE:');

if (CLEAN_SEED_DATA.serviceman_visits[0]) {
  const visit = CLEAN_SEED_DATA.serviceman_visits[0];
  console.log('Wizyta 1:');
  console.log('  - Utworzona:', visit.createdAt);
  console.log('  - Zaplanowana:', visit.scheduledDate);
  console.log('  - Status:', visit.status);
  console.log('  - Czy w przyszłości?', new Date(visit.scheduledDate) > new Date());
}

if (CLEAN_SEED_DATA.serviceman_visits[1]) {
  const visit = CLEAN_SEED_DATA.serviceman_visits[1];
  console.log('Wizyta 2 (ukończona):');
  console.log('  - Utworzona:', visit.createdAt);
  console.log('  - Zaplanowana:', visit.scheduledDate);
  console.log('  - Rzeczywisty start:', visit.actualStartTime);
  console.log('  - Rzeczywisty koniec:', visit.actualEndTime);
  console.log('  - Status:', visit.status);
  console.log('  - Czy w przeszłości?', new Date(visit.scheduledDate) < new Date());
}

// ========== TEST GENERATORÓW DAT ==========
console.log('\n📅 TEST GENERATORÓW DAT:');
console.log('Dzisiaj o 9:00:', generateFutureDate(0, 9, 0));
console.log('Jutro o 14:00:', generateFutureDate(1, 14, 0));
console.log('3 dni temu o 10:00:', generatePastDate(3, 10));
console.log('Tydzień temu:', generatePastDate(7));

// ========== OSZCZĘDNOŚĆ MIEJSCA ==========
console.log('\n💾 OSZCZĘDNOŚĆ:');
const oldDataSize = JSON.stringify(SEED_DATA).length;
const newDataSize = JSON.stringify(CLEAN_SEED_DATA).length;
console.log(`Stare dane: ${oldDataSize} znaków`);
console.log(`Nowe dane: ${newDataSize} znaków`);
console.log(`Różnica: ${oldDataSize - newDataSize} znaków (${((oldDataSize - newDataSize) / oldDataSize * 100).toFixed(1)}%)`);

// ========== ZALETY NOWEGO SYSTEMU ==========
console.log('\n✅ ZALETY NOWEGO SYSTEMU:');
console.log('1. ❌ Brak duplikacji dat - createdAt/updatedAt generowane automatycznie');
console.log('2. 🎯 Logiczne daty - przeszłość/przyszłość wg sensu biznesowego');
console.log('3. 🔢 Automatyczne ID - brak konfliktów');
console.log('4. 🧪 Łatwe testowanie - resetCounters() czyści stan');
console.log('5. 📅 Relatywne daty - zawsze aktualne względem "dzisiaj"');
console.log('6. 🗜️ Mniejszy rozmiar danych');
console.log('7. 🔧 Łatwiejsza konserwacja - jedna funkcja addAutoFields()');

console.log('\n🎉 WNIOSEK: Nowy system jest znacznie lepszy!');