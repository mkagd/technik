// scripts/migrate-employee-passwords.js
// 🔐 MIGRACJA: Dodaje bcrypt hash do wszystkich pracowników
// Uruchom tylko RAZ: node scripts/migrate-employee-passwords.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');
const BACKUP_FILE = path.join(process.cwd(), 'data', 'employees.backup.json');

// Domyślne hasło dla wszystkich pracowników
const DEFAULT_PASSWORD = 'haslo123';

async function migrateEmployeePasswords() {
  console.log('🔐 MIGRACJA HASEŁ PRACOWNIKÓW - START\n');

  try {
    // 1. Sprawdź czy plik istnieje
    if (!fs.existsSync(EMPLOYEES_FILE)) {
      console.error('❌ Błąd: Nie znaleziono pliku employees.json');
      console.error('   Ścieżka:', EMPLOYEES_FILE);
      process.exit(1);
    }

    // 2. Odczytaj pracowników
    console.log('📂 Odczytuję employees.json...');
    const dataRaw = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf-8'));
    
    // Sprawdź strukturę (array vs object)
    const employees = Array.isArray(dataRaw) ? dataRaw : (dataRaw.employees || []);
    
    console.log(`✅ Znaleziono ${employees.length} pracowników\n`);

    if (employees.length === 0) {
      console.log('⚠️  Brak pracowników do migracji');
      process.exit(0);
    }

    // 3. Backup przed migracją
    console.log('💾 Tworzę backup...');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(dataRaw, null, 2));
    console.log('✅ Backup zapisany:', BACKUP_FILE, '\n');

    // 4. Statystyki
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('🔄 Rozpoczynam migrację:\n');

    // 5. Przetwórz każdego pracownika
    for (const employee of employees) {
      const employeeName = employee.name || employee.id;
      
      try {
        // Sprawdź czy pracownik już ma passwordHash
        if (employee.passwordHash) {
          console.log(`⏭️  ${employeeName} - JUŻ MA HASŁO (pomijam)`);
          skippedCount++;
          continue;
        }

        // Wygeneruj hash dla domyślnego hasła
        console.log(`🔐 ${employeeName} - hashowanie hasła...`);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        // Dodaj pola bezpieczeństwa
        employee.passwordHash = passwordHash;
        employee.passwordSetAt = new Date().toISOString();
        employee.passwordChangedBy = 'migration-script';
        employee.requirePasswordChange = false;
        employee.lastPasswordChange = new Date().toISOString();
        employee.isLocked = false;
        employee.failedLoginAttempts = 0;
        employee.lastLoginAttempt = null;
        employee.lastLogin = null;
        employee.passwordHistory = [
          {
            hash: passwordHash,
            changedAt: new Date().toISOString(),
            changedBy: 'migration-script'
          }
        ];

        console.log(`✅ ${employeeName} - zmigrowany\n`);
        migratedCount++;

      } catch (err) {
        console.error(`❌ ${employeeName} - BŁĄD:`, err.message, '\n');
        errorCount++;
      }
    }

    // 6. Zapisz zmiany
    console.log('💾 Zapisuję zmiany do employees.json...');
    // Zapisz w tej samej strukturze co oryginał (array lub object)
    const dataToSave = Array.isArray(dataRaw) ? employees : { employees };
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('✅ Zmiany zapisane\n');

    // 7. Podsumowanie
    console.log('=' .repeat(60));
    console.log('📊 PODSUMOWANIE MIGRACJI');
    console.log('=' .repeat(60));
    console.log(`✅ Zmigrowano:     ${migratedCount} pracowników`);
    console.log(`⏭️  Pominięto:      ${skippedCount} pracowników (już mieli hasło)`);
    console.log(`❌ Błędy:          ${errorCount} pracowników`);
    console.log(`📁 Wszystkich:     ${employees.length} pracowników`);
    console.log('=' .repeat(60));

    // 8. Informacje końcowe
    console.log('\n📝 INFORMACJE:');
    console.log(`   • Domyślne hasło: "${DEFAULT_PASSWORD}"`);
    console.log('   • Hasła zostały zahashowane (bcrypt)');
    console.log('   • Backup: ' + BACKUP_FILE);
    console.log('   • Wszyscy pracownicy mogą teraz się logować\n');

    if (migratedCount > 0) {
      console.log('⚠️  WAŻNE:');
      console.log('   1. Zaleca się wymianę hasła dla każdego pracownika');
      console.log('   2. Możesz to zrobić w panelu admina: Pracownicy → [Edytuj] → Bezpieczeństwo');
      console.log('   3. Lub wymuś zmianę hasła przy następnym logowaniu\n');
    }

    console.log('✅ MIGRACJA ZAKOŃCZONA SUKCESEM!\n');

  } catch (error) {
    console.error('\n❌ KRYTYCZNY BŁĄD:', error.message);
    console.error('   Stack:', error.stack);
    console.error('\n💡 Przywróć backup jeśli potrzeba:');
    console.error('   cp', BACKUP_FILE, EMPLOYEES_FILE);
    process.exit(1);
  }
}

// Uruchom migrację
if (require.main === module) {
  migrateEmployeePasswords();
} else {
  module.exports = { migrateEmployeePasswords };
}
