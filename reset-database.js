/**
 * 🧹 RESET BAZY DANYCH - CZYSZCZENIE SYSTEMU
 * Czyści wszystkie dane klientów, zleceń i przywraca system do stanu początkowego
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 ===== RESET BAZY DANYCH =====');
console.log('');
console.log('⚠️  UWAGA: Ta operacja wyczyści wszystkie dane!');
console.log('📋 Co zostanie wyczyszczone:');
console.log('   • Wszyscy klienci (clients.json)');
console.log('   • Wszystkie zlecenia (orders.json)');
console.log('   • Liczniki dokumentów (daily-counters.json, documentNumbers.json)');
console.log('   • Konta użytkowników (accounts.json)');
console.log('   • Todos pracowników (employee_todos.json, enhanced_employee_todos.json)');
console.log('');
console.log('✅ Co zostanie zachowane:');
console.log('   • Pracownicy (employees.json)');
console.log('   • Specjalizacje (specializations.json)');
console.log('   • Ustawienia cenowe (pricingRules.json)');
console.log('   • Baza części (parts-inventory.json)');
console.log('   • Wszystkie pliki konfiguracyjne');
console.log('');

// Funkcja do tworzenia backupu
function createBackup() {
  const backupDir = path.join(__dirname, 'data', 'backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `reset-backup-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.mkdirSync(backupPath, { recursive: true });
  
  console.log(`💾 Tworzę backup w: ${backupPath}`);
  
  // Lista plików do backupu
  const filesToBackup = [
    'clients.json',
    'orders.json',
    'accounts.json',
    'daily-counters.json',
    'documentNumbers.json',
    'employee_todos.json',
    'enhanced_employee_todos.json'
  ];
  
  filesToBackup.forEach(file => {
    const sourcePath = path.join(__dirname, 'data', file);
    const backupFilePath = path.join(backupPath, file);
    
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupFilePath);
        console.log(`   ✅ ${file} - backup utworzony`);
      } else {
        console.log(`   ⚠️  ${file} - plik nie istnieje`);
      }
    } catch (error) {
      console.log(`   ❌ ${file} - błąd backup: ${error.message}`);
    }
  });
  
  return backupPath;
}

// Funkcja do czyszczenia pliku
function resetFile(filename, emptyContent) {
  const filePath = path.join(__dirname, 'data', filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(emptyContent, null, 2));
    console.log(`   ✅ ${filename} - wyczyszczony`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${filename} - błąd: ${error.message}`);
    return false;
  }
}

// GŁÓWNA FUNKCJA RESETOWANIA
function performReset() {
  console.log('🔄 ROZPOCZYNAM RESET...');
  console.log('');
  
  // 1. Tworzenie backupu
  const backupPath = createBackup();
  console.log('');
  
  // 2. Resetowanie plików
  console.log('🧹 Czyszczę dane...');
  
  // Klienci - pusta tablica
  resetFile('clients.json', []);
  
  // Zlecenia - pusta tablica
  resetFile('orders.json', []);
  
  // Konta użytkowników - pusta tablica
  resetFile('accounts.json', []);
  
  // Liczniki dzienne - reset do domyślnych wartości
  resetFile('daily-counters.json', {
    lastUpdate: new Date().toISOString().split('T')[0],
    counters: {
      orders: 0,
      clients: 0,
      employees: 0,
      appointments: 0,
      visits: 0,
      invoices: 0,
      protocols: 0
    }
  });
  
  // Numery dokumentów - reset
  const currentDate = new Date();
  resetFile('documentNumbers.json', {
    invoices: {
      currentNumber: 1,
      format: "FV-{number:04d}/{month:02d}/{year:02d}",
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    },
    protocols: {
      currentNumber: 1,
      format: "PROT-{number:04d}/{month:02d}/{year:02d}",
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    },
    lastReset: currentDate.toISOString()
  });
  
  // Employee todos - reset
  resetFile('employee_todos.json', []);
  resetFile('enhanced_employee_todos.json', []);
  
  console.log('');
  console.log('🎯 RESET ZAKOŃCZONY!');
  console.log('');
  console.log('📊 NOWY STAN SYSTEMU:');
  console.log('   👥 Klienci: 0');
  console.log('   📋 Zlecenia: 0');
  console.log('   👤 Konta: 0');
  console.log('   📄 Liczniki: zresetowane');
  console.log('');
  console.log('💾 Backup zapisany w:');
  console.log(`   ${backupPath}`);
  console.log('');
  console.log('🚀 System gotowy do nowego startu!');
  console.log('✨ Możesz teraz dodawać nowych klientów i zlecenia');
}

// Uruchomienie resetowania
performReset();