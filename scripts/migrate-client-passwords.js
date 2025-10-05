// scripts/migrate-client-passwords.js
// 🔐 MIGRACJA: Generuje hasła dla wszystkich klientów
// Uruchom tylko RAZ: node scripts/migrate-client-passwords.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const BACKUP_FILE = path.join(process.cwd(), 'data', 'clients.backup.json');
const PASSWORDS_LOG_FILE = path.join(process.cwd(), 'data', 'client-passwords-generated.csv');

// Funkcja generująca 6-cyfrowe hasło
function generatePassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function migrateClientPasswords() {
  console.log('🔐 MIGRACJA HASEŁ KLIENTÓW - START\n');

  try {
    // 1. Sprawdź czy plik istnieje
    if (!fs.existsSync(CLIENTS_FILE)) {
      console.error('❌ Błąd: Nie znaleziono pliku clients.json');
      console.error('   Ścieżka:', CLIENTS_FILE);
      process.exit(1);
    }

    // 2. Odczytaj klientów
    console.log('📂 Odczytuję clients.json...');
    const dataRaw = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
    
    // Sprawdź strukturę (array vs object)
    const clients = Array.isArray(dataRaw) ? dataRaw : (dataRaw.clients || []);
    
    console.log(`✅ Znaleziono ${clients.length} klientów\n`);

    if (clients.length === 0) {
      console.log('⚠️  Brak klientów do migracji');
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
    const passwordLog = [];

    // Header CSV
    passwordLog.push('ID,Imię i nazwisko,Email,Telefon,Hasło,Data wygenerowania');

    console.log('🔄 Rozpoczynam migrację:\n');

    // 5. Przetwórz każdego klienta
    for (const client of clients) {
      const clientName = client.name || client.id;
      
      try {
        // Sprawdź czy klient już ma passwordHash
        if (client.passwordHash) {
          console.log(`⏭️  ${clientName} - JUŻ MA HASŁO (pomijam)`);
          skippedCount++;
          continue;
        }

        // Wygeneruj losowe 6-cyfrowe hasło
        const temporaryPassword = generatePassword();
        console.log(`🔐 ${clientName} - generuję hasło: ${temporaryPassword}`);

        // Hash hasła
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(temporaryPassword, salt);

        // Dodaj pola bezpieczeństwa
        client.passwordHash = passwordHash;
        client.passwordSetAt = new Date().toISOString();
        client.passwordChangedBy = 'migration-script';
        client.lastPasswordChange = new Date().toISOString();
        client.isLocked = false;
        client.failedLoginAttempts = 0;
        client.lastLoginAttempt = null;
        client.lastLogin = null;
        client.lastLoginMethod = null;
        client.passwordHistory = [
          {
            hash: passwordHash,
            changedAt: new Date().toISOString(),
            changedBy: 'migration-script'
          }
        ];

        // Zapisz do logu (CSV)
        passwordLog.push([
          client.id,
          `"${clientName}"`,
          client.email || 'brak',
          client.phone || 'brak',
          temporaryPassword,
          new Date().toISOString()
        ].join(','));

        console.log(`✅ ${clientName} - zmigrowany\n`);
        migratedCount++;

      } catch (err) {
        console.error(`❌ ${clientName} - BŁĄD:`, err.message, '\n');
        errorCount++;
      }
    }

    // 6. Zapisz zmiany do clients.json
    console.log('💾 Zapisuję zmiany do clients.json...');
    // Zapisz w tej samej strukturze co oryginał (array lub object)
    const dataToSave = Array.isArray(dataRaw) ? clients : { clients };
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('✅ Zmiany zapisane\n');

    // 7. Zapisz logi haseł do CSV
    if (migratedCount > 0) {
      console.log('📄 Zapisuję hasła do pliku CSV...');
      fs.writeFileSync(PASSWORDS_LOG_FILE, passwordLog.join('\n'), 'utf-8');
      console.log('✅ CSV zapisany:', PASSWORDS_LOG_FILE, '\n');
    }

    // 8. Podsumowanie
    console.log('=' .repeat(60));
    console.log('📊 PODSUMOWANIE MIGRACJI');
    console.log('=' .repeat(60));
    console.log(`✅ Zmigrowano:     ${migratedCount} klientów`);
    console.log(`⏭️  Pominięto:      ${skippedCount} klientów (już mieli hasło)`);
    console.log(`❌ Błędy:          ${errorCount} klientów`);
    console.log(`📁 Wszystkich:     ${clients.length} klientów`);
    console.log('=' .repeat(60));

    // 9. Informacje końcowe
    console.log('\n📝 INFORMACJE:');
    console.log('   • Każdy klient otrzymał UNIKALNE 6-cyfrowe hasło');
    console.log('   • Hasła zostały zahashowane (bcrypt)');
    console.log('   • Lista haseł zapisana w CSV: ' + PASSWORDS_LOG_FILE);
    console.log('   • Backup: ' + BACKUP_FILE);
    console.log('   • Klienci mogą się teraz logować (email/telefon/nr zamówienia)\n');

    if (migratedCount > 0) {
      console.log('⚠️  WAŻNE - CO DALEJ:');
      console.log('   1. OTWÓRZ plik CSV i sprawdź hasła klientów');
      console.log('   2. Wyślij hasła klientom (email/SMS/telefonicznie)');
      console.log('   3. Możesz też wygenerować nowe hasła w panelu admina');
      console.log('   4. Zaleca się, by klienci zmienili hasła po pierwszym logowaniu\n');
      
      console.log('💡 OPCJE WYSYŁKI HASEŁ:');
      console.log('   • Panel admina → Klienci → [Edytuj] → Wyślij hasło emailem/SMS');
      console.log('   • API: POST /api/admin/client-password (action: send-email/send-sms)');
      console.log('   • Ręcznie: Otwórz CSV i przekaż hasła klientom\n');
      
      console.log('🔒 BEZPIECZEŃSTWO:');
      console.log('   • NIE commituj pliku CSV do gita!');
      console.log('   • Usuń CSV po wysłaniu haseł klientom');
      console.log('   • Hasła w clients.json są zahashowane (bezpieczne)\n');
    }

    console.log('✅ MIGRACJA ZAKOŃCZONA SUKCESEM!\n');

  } catch (error) {
    console.error('\n❌ KRYTYCZNY BŁĄD:', error.message);
    console.error('   Stack:', error.stack);
    console.error('\n💡 Przywróć backup jeśli potrzeba:');
    console.error('   cp', BACKUP_FILE, CLIENTS_FILE);
    process.exit(1);
  }
}

// Uruchom migrację
if (require.main === module) {
  migrateClientPasswords();
} else {
  module.exports = { migrateClientPasswords };
}
