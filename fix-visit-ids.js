/**
 * Skrypt migracyjny do naprawy formatów visitId
 * 
 * Ten skrypt:
 * 1. Wczytuje wszystkie zamówienia
 * 2. Znajduje wizyty z nieprawidłowym formatem ID (timestamp zamiast VIS25271001)
 * 3. Generuje nowe visitId w prawidłowym formacie
 * 4. Zapisuje naprawione dane
 */

const fs = require('fs');
const path = require('path');
const {
  generateVisitId,
  parseId,
  isValidId,
  getDayOfYear
} = require('./utils/id-generator');

// Ścieżki do plików
const ordersPath = path.join(__dirname, 'data', 'orders.json');
const backupPath = path.join(__dirname, 'data', 'orders-backup-' + Date.now() + '.json');

console.log('🔧 Rozpoczynam migrację visitId...\n');

// Wczytaj zamówienia
let orders;
try {
  const ordersData = fs.readFileSync(ordersPath, 'utf8');
  orders = JSON.parse(ordersData);
  console.log(`✅ Wczytano ${orders.length} zamówień\n`);
} catch (error) {
  console.error('❌ Błąd wczytywania orders.json:', error.message);
  process.exit(1);
}

// Utwórz backup
try {
  fs.writeFileSync(backupPath, JSON.stringify(orders, null, 2), 'utf8');
  console.log(`✅ Utworzono backup: ${backupPath}\n`);
} catch (error) {
  console.error('❌ Błąd tworzenia backupu:', error.message);
  process.exit(1);
}

// Statystyki
let stats = {
  totalVisits: 0,
  fixedVisits: 0,
  validVisits: 0,
  addedVisitIds: 0,
  ordersWithoutVisits: 0,
  visitsWithoutId: 0
};

// Zbierz wszystkie istniejące visitId, aby uniknąć duplikatów
const allExistingVisitIds = new Set();
orders.forEach(order => {
  if (order.visits && Array.isArray(order.visits)) {
    order.visits.forEach(visit => {
      if (visit.visitId && isValidId(visit.visitId)) {
        allExistingVisitIds.add(visit.visitId);
      }
    });
  }
});

console.log(`📊 Znaleziono ${allExistingVisitIds.size} prawidłowych visitId\n`);

// Funkcja do generowania unikalnego visitId
function generateUniqueVisitId(date, existingIds) {
  let attempt = 0;
  let newId;
  
  do {
    attempt++;
    // Pobierz maksymalny numer sekwencyjny dla danej daty
    const year = date.getFullYear().toString().slice(-2);
    const dayOfYear = getDayOfYear(date).toString().padStart(3, '0');
    const searchPattern = `VIS${year}${dayOfYear}`;
    
    const matchingIds = Array.from(existingIds)
      .filter(id => id.startsWith(searchPattern))
      .map(id => {
        const parsed = parseId(id);
        return parsed ? parsed.sequenceNumber : 0;
      });
    
    const maxSeq = matchingIds.length > 0 ? Math.max(...matchingIds) : 0;
    
    // Generuj nowe ID z kolejnym numerem
    const { generateId } = require('./utils/id-generator');
    newId = generateId('VIS', date, maxSeq + attempt);
  } while (existingIds.has(newId) && attempt < 1000);
  
  if (attempt >= 1000) {
    throw new Error('Nie można wygenerować unikalnego visitId');
  }
  
  return newId;
}

// Przetwórz zamówienia
orders.forEach((order, orderIndex) => {
  if (!order.visits || !Array.isArray(order.visits)) {
    stats.ordersWithoutVisits++;
    return;
  }
  
  order.visits.forEach((visit, visitIndex) => {
    stats.totalVisits++;
    
    // Określ datę wizyty
    let visitDate = new Date();
    if (visit.scheduledDate) {
      visitDate = new Date(visit.scheduledDate);
    } else if (visit.date) {
      visitDate = new Date(visit.date);
    } else if (order.visitDate) {
      visitDate = new Date(order.visitDate);
    }
    
    // Sprawdź czy wizyta ma visitId
    if (!visit.visitId) {
      // Brak visitId - dodaj nowe
      const newVisitId = generateUniqueVisitId(visitDate, allExistingVisitIds);
      visit.visitId = newVisitId;
      allExistingVisitIds.add(newVisitId);
      stats.addedVisitIds++;
      
      console.log(`➕ Dodano visitId: ${newVisitId} dla wizyty ${visitIndex + 1} w zamówieniu ${order.orderNumber || order.id}`);
    } else if (!isValidId(visit.visitId)) {
      // Nieprawidłowy format - napraw
      const oldVisitId = visit.visitId;
      const newVisitId = generateUniqueVisitId(visitDate, allExistingVisitIds);
      visit.visitId = newVisitId;
      allExistingVisitIds.add(newVisitId);
      stats.fixedVisits++;
      
      console.log(`🔧 Naprawiono: ${oldVisitId} → ${newVisitId}`);
    } else {
      // Prawidłowy format
      stats.validVisits++;
    }
    
    // Dodaj visitNumber jeśli nie ma
    if (!visit.visitNumber) {
      visit.visitNumber = visitIndex + 1;
    }
  });
});

// Zapisz naprawione dane
try {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');
  console.log('\n✅ Zapisano naprawione dane do orders.json\n');
} catch (error) {
  console.error('❌ Błąd zapisu danych:', error.message);
  console.log('💾 Przywróć dane z backupu:', backupPath);
  process.exit(1);
}

// Pokaż statystyki
console.log('📊 STATYSTYKI MIGRACJI:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Wszystkie wizyty:        ${stats.totalVisits}`);
console.log(`Naprawione visitId:      ${stats.fixedVisits}`);
console.log(`Dodane visitId:          ${stats.addedVisitIds}`);
console.log(`Prawidłowe visitId:      ${stats.validVisits}`);
console.log(`Zamówienia bez wizyt:    ${stats.ordersWithoutVisits}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n✅ Migracja zakończona pomyślnie!`);
console.log(`💾 Backup: ${backupPath}\n`);

// Pokaż przykłady nowych ID
console.log('📝 PRZYKŁADY WYGENEROWANYCH ID:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const sampleVisits = [];
orders.forEach(order => {
  if (order.visits && order.visits.length > 0) {
    order.visits.forEach(visit => {
      if (visit.visitId && sampleVisits.length < 5) {
        sampleVisits.push({
          orderId: order.orderNumber || order.id,
          visitId: visit.visitId,
          type: visit.type,
          date: visit.scheduledDate || visit.date
        });
      }
    });
  }
});

sampleVisits.forEach(sample => {
  const parsed = parseId(sample.visitId);
  console.log(`${sample.visitId} - ${sample.type} (${sample.orderId})`);
  if (parsed) {
    console.log(`  └─ Rok: 20${parsed.year.toString().slice(-2)}, Dzień: ${parsed.dayOfYear}, Numer: ${parsed.sequenceNumber}`);
  }
});

console.log('\n🎉 Wszystko gotowe! Możesz teraz używać systemu z prawidłowymi visitId.');
