// 🧪 TEST SYSTEMU BLOKADY KONTA
// Skrypt testuje czy licznik nieudanych prób działa poprawnie

const fs = require('fs');
const path = require('path');

const EMPLOYEES_FILE = path.join(__dirname, '..', 'data', 'employees.json');

console.log('🧪 TEST SYSTEMU BLOKADY KONTA\n');
console.log('=' .repeat(60));

// Odczytaj employees.json
const employees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));

console.log(`\n📊 Znaleziono ${employees.length} pracowników:\n`);

employees.forEach((emp, index) => {
  const hasPassword = !!emp.passwordHash;
  const isLocked = emp.isLocked || false;
  const failedAttempts = emp.failedLoginAttempts || 0;
  const lastAttempt = emp.lastLoginAttempt || 'Nigdy';

  console.log(`${index + 1}. ${emp.name} (${emp.email})`);
  console.log(`   ├─ ID: ${emp.id}`);
  console.log(`   ├─ Ma hasło: ${hasPassword ? '✅ TAK' : '❌ NIE'}`);
  console.log(`   ├─ Status: ${isLocked ? '🔒 ZABLOKOWANE' : '✅ AKTYWNE'}`);
  console.log(`   ├─ Nieudane próby: ${failedAttempts} / 5`);
  
  if (failedAttempts >= 3) {
    console.log(`   ├─ ⚠️ UWAGA: ${failedAttempts} nieudanych prób! ${isLocked ? 'Konto zablokowane.' : 'Jeszcze ${5 - failedAttempts} próby do blokady.'}`);
  }
  
  console.log(`   └─ Ostatnia próba: ${lastAttempt}`);
  console.log('');
});

console.log('=' .repeat(60));

// Statystyki
const locked = employees.filter(e => e.isLocked).length;
const withPassword = employees.filter(e => e.passwordHash).length;
const withFailedAttempts = employees.filter(e => (e.failedLoginAttempts || 0) > 0).length;

console.log('\n📈 STATYSTYKI:');
console.log(`   ├─ Pracowników z hasłem: ${withPassword} / ${employees.length}`);
console.log(`   ├─ Zablokowanych kont: ${locked}`);
console.log(`   └─ Z nieudanymi próbami logowania: ${withFailedAttempts}`);

console.log('\n✅ Test zakończony!\n');
