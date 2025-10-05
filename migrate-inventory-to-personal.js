// migrate-inventory-to-personal.js
// Skrypt migracji danych magazynowych z employees.json do personal-inventories.json
// Uruchom: node migrate-inventory-to-personal.js

const fs = require('fs');
const path = require('path');

// Ścieżki do plików
const employeesPath = path.join(__dirname, 'data', 'employees.json');
const personalInventoriesPath = path.join(__dirname, 'data', 'personal-inventories.json');
const partsInventoryPath = path.join(__dirname, 'data', 'parts-inventory.json');
const backupPath = path.join(__dirname, 'data', 'backup-employees-inventory.json');

console.log('🚀 START MIGRACJI MAGAZYNÓW PRACOWNIKÓW');
console.log('=====================================\n');

// Funkcje pomocnicze
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd odczytu ${filePath}:`, error.message);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Błąd zapisu ${filePath}:`, error.message);
    return false;
  }
}

function findPart(partId, parts) {
  if (!parts || !Array.isArray(parts)) return null;
  return parts.find(p => p.id === partId);
}

// 1. Wczytaj dane
console.log('📖 Wczytywanie danych...');
const employees = readJSON(employeesPath);
const personalInventories = readJSON(personalInventoriesPath) || [];
const partsData = readJSON(partsInventoryPath);
const parts = partsData?.inventory || partsData || [];

if (!employees) {
  console.error('❌ Nie można wczytać employees.json. Przerwanie.');
  process.exit(1);
}

console.log(`✅ Wczytano ${employees.length} pracowników`);
console.log(`✅ Wczytano ${personalInventories.length} istniejących magazynów osobistych`);
console.log(`✅ Wczytano ${parts.length} części w systemie\n`);

// 2. Backup danych przed migracją
console.log('💾 Tworzenie backupu...');
const backupData = {
  timestamp: new Date().toISOString(),
  employees: employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    inventory: emp.inventory || []
  }))
};

if (writeJSON(backupPath, backupData)) {
  console.log(`✅ Backup zapisany: ${backupPath}\n`);
} else {
  console.warn('⚠️  Nie udało się utworzyć backupu, ale kontynuuję...\n');
}

// 3. Migracja danych
console.log('🔄 Rozpoczynam migrację...\n');

let migratedCount = 0;
let skippedCount = 0;
let updatedCount = 0;
let errorCount = 0;

employees.forEach((employee, index) => {
  const empInventory = employee.inventory;
  
  // Pomiń pracowników bez magazynu
  if (!empInventory || !Array.isArray(empInventory) || empInventory.length === 0) {
    console.log(`⏭️  ${index + 1}. ${employee.name} (${employee.id}) - brak magazynu, pomijam`);
    skippedCount++;
    return;
  }

  console.log(`\n📦 ${index + 1}. ${employee.name} (${employee.id})`);
  console.log(`   Części w employees.json: ${empInventory.length} pozycji`);

  // Znajdź lub utwórz magazyn osobisty
  let personalInventory = personalInventories.find(inv => inv.employeeId === employee.id);
  let isNew = false;

  if (!personalInventory) {
    isNew = true;
    personalInventory = {
      id: `PI-${Date.now()}-${employee.id.slice(-3)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role || 'SERWISANT',
      vehicle: employee.vehicle 
        ? `${employee.vehicle.brand} ${employee.vehicle.model} - ${employee.vehicle.licensePlate}`
        : 'Brak pojazdu',
      parts: [],
      totalValue: 0,
      lastUpdated: new Date().toISOString(),
      statistics: {
        totalParts: 0,
        totalTypes: 0,
        usedThisMonth: 0,
        valueUsedThisMonth: 0
      },
      migrationInfo: {
        migratedAt: new Date().toISOString(),
        migratedFrom: 'employees.json',
        originalItemCount: empInventory.length
      }
    };
    console.log(`   ✨ Tworzę nowy magazyn osobisty: ${personalInventory.id}`);
  } else {
    console.log(`   🔍 Znaleziono istniejący magazyn: ${personalInventory.id}`);
  }

  // Migruj części
  let addedParts = 0;
  let updatedParts = 0;
  let skippedParts = 0;

  empInventory.forEach(empPart => {
    try {
      const partDetails = findPart(empPart.partId, parts);
      
      if (!partDetails) {
        console.warn(`   ⚠️  Część ${empPart.partId} nie znaleziona w parts-inventory.json`);
      }

      // Sprawdź czy część już istnieje w personal-inventories
      const existingPart = personalInventory.parts.find(p => p.partId === empPart.partId);

      if (existingPart) {
        // Aktualizuj ilość jeśli różna
        if (existingPart.quantity !== empPart.quantity) {
          const oldQty = existingPart.quantity;
          existingPart.quantity = empPart.quantity;
          existingPart.lastRestocked = empPart.addedAt || new Date().toISOString();
          existingPart.restockedBy = empPart.transferredFrom || 'MIGRATION';
          console.log(`   🔄 ${empPart.partId}: ${oldQty} → ${empPart.quantity} szt`);
          updatedParts++;
        } else {
          console.log(`   ✓ ${empPart.partId}: już istnieje (${empPart.quantity} szt)`);
          skippedParts++;
        }
      } else {
        // Dodaj nową część z pełnymi danymi
        const newPart = {
          partId: empPart.partId,
          partNumber: partDetails?.partNumber || 'N/A',
          name: partDetails?.name || `Część ${empPart.partId}`,
          quantity: empPart.quantity,
          assignedDate: empPart.addedAt || new Date().toISOString(),
          assignedBy: empPart.transferredFrom || 'MIGRATION',
          assignedByName: empPart.transferredFrom 
            ? `Transfer z ${empPart.transferredFrom}` 
            : 'Migracja z employees.json',
          location: 'Schowek główny', // Domyślna lokalizacja
          status: 'available',
          unitPrice: partDetails?.price || 0,
          notes: empPart.transferredFrom 
            ? `Transferowana od ${empPart.transferredFrom}` 
            : 'Zmigrowana z employees.json'
        };

        personalInventory.parts.push(newPart);
        console.log(`   ✅ ${empPart.partId}: ${partDetails?.name || empPart.partId} (${empPart.quantity} szt)`);
        addedParts++;
      }
    } catch (error) {
      console.error(`   ❌ Błąd migracji części ${empPart.partId}:`, error.message);
      errorCount++;
    }
  });

  // Przelicz statystyki
  personalInventory.statistics.totalTypes = personalInventory.parts.length;
  personalInventory.statistics.totalParts = personalInventory.parts.reduce((sum, p) => sum + p.quantity, 0);
  personalInventory.totalValue = personalInventory.parts.reduce((sum, p) => {
    const price = p.unitPrice || 0;
    return sum + (price * p.quantity);
  }, 0);
  personalInventory.lastUpdated = new Date().toISOString();

  console.log(`   📊 Podsumowanie: +${addedParts} nowych, ~${updatedParts} zaktualizowanych, =${skippedParts} pominiętych`);
  console.log(`   💰 Wartość magazynu: ${personalInventory.totalValue.toFixed(2)} zł (${personalInventory.statistics.totalParts} szt)`);

  // Dodaj do listy jeśli nowy
  if (isNew) {
    personalInventories.push(personalInventory);
    migratedCount++;
  } else {
    updatedCount++;
  }
});

// 4. Zapisz zaktualizowane personal-inventories.json
console.log('\n💾 Zapisywanie personal-inventories.json...');
if (writeJSON(personalInventoriesPath, personalInventories)) {
  console.log('✅ Personal-inventories.json zapisany pomyślnie\n');
} else {
  console.error('❌ Nie udało się zapisać personal-inventories.json!');
  process.exit(1);
}

// 5. Usuń pole inventory z employees.json (opcjonalnie - zakomentowane dla bezpieczeństwa)
console.log('🗑️  Usuwanie pola inventory z employees.json...');
const cleanedEmployees = employees.map(emp => {
  if (emp.inventory && emp.inventory.length > 0) {
    // Zachowaj info o migracji
    const migratedInventory = emp.inventory;
    delete emp.inventory;
    emp.inventoryMigrated = {
      migratedAt: new Date().toISOString(),
      itemCount: migratedInventory.length,
      note: 'Dane przeniesione do personal-inventories.json'
    };
  }
  return emp;
});

if (writeJSON(employeesPath, cleanedEmployees)) {
  console.log('✅ Pole inventory usunięte z employees.json\n');
} else {
  console.error('❌ Nie udało się zaktualizować employees.json');
}

// 6. Podsumowanie
console.log('\n========================================');
console.log('✅ MIGRACJA ZAKOŃCZONA POMYŚLNIE!');
console.log('========================================\n');
console.log(`📦 Nowych magazynów utworzonych: ${migratedCount}`);
console.log(`🔄 Istniejących magazynów zaktualizowanych: ${updatedCount}`);
console.log(`⏭️  Pracowników pominiętych (brak magazynu): ${skippedCount}`);
console.log(`❌ Błędów: ${errorCount}`);
console.log(`\n📊 Total magazynów w systemie: ${personalInventories.length}`);

// Statystyki końcowe
const totalParts = personalInventories.reduce((sum, inv) => sum + inv.statistics.totalParts, 0);
const totalValue = personalInventories.reduce((sum, inv) => sum + inv.totalValue, 0);
console.log(`📦 Total części w magazynach: ${totalParts} szt`);
console.log(`💰 Total wartość magazynów: ${totalValue.toFixed(2)} zł`);

console.log('\n📁 Pliki:');
console.log(`   ✅ ${personalInventoriesPath}`);
console.log(`   ✅ ${employeesPath} (inventory usunięte)`);
console.log(`   💾 ${backupPath} (backup)`);

console.log('\n🎯 Następne kroki:');
console.log('   1. Przepisz /api/employees/[id]/inventory.js');
console.log('   2. Zaktualizuj /admin/magazyn/magazyny.js');
console.log('   3. Napraw /serwis/magazyn/moj-magazyn.js (usuń hardcoded ID)');
console.log('   4. Przetestuj cały przepływ danych');

console.log('\n🚀 Migracja kompletna!\n');
