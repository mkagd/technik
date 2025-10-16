// test-client-security-api.js
// 🧪 Skrypt testowy do API zarządzania kontami klientów

const API_URL = 'http://localhost:3000/api/admin/client-accounts';

// ===========================
// HELPER FUNCTIONS
// ===========================

async function testAPI(action, data = {}, method = 'POST') {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST: ${action}`);
    console.log(`${'='.repeat(60)}`);

    const url = method === 'GET' 
        ? `${API_URL}?${new URLSearchParams(data)}`
        : API_URL;

    try {
        const response = await fetch(url, {
            method,
            headers: method === 'POST' ? {
                'Content-Type': 'application/json'
            } : undefined,
            body: method === 'POST' ? JSON.stringify(data) : undefined
        });

        const result = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`✅ Odpowiedź:`, JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.error(`❌ Błąd:`, error.message);
        return null;
    }
}

// ===========================
// TESTY
// ===========================

async function runTests() {
    console.log('\n🚀 Rozpoczynam testy API zarządzania kontami klientów\n');

    // Użyj istniejącego ID klienta z Twojej bazy
    const TEST_CLIENT_ID = 'CLI2025000001'; // ⚠️ ZMIEŃ NA PRAWIDŁOWY ID

    // Test 1: Pobierz informacje bezpieczeństwa
    console.log('\n📋 Test 1: Pobieranie informacji bezpieczeństwa');
    const securityInfo = await testAPI('getSecurityInfo', {
        action: 'getSecurityInfo',
        clientId: TEST_CLIENT_ID
    }, 'GET');

    if (securityInfo && securityInfo.success) {
        console.log('✅ Test 1 PASSED');
        console.log(`   - Ma hasło: ${securityInfo.securityInfo.hasPassword ? 'TAK' : 'NIE'}`);
        console.log(`   - Jest zablokowany: ${securityInfo.securityInfo.isLocked ? 'TAK' : 'NIE'}`);
        console.log(`   - Nieudane próby: ${securityInfo.securityInfo.failedLoginAttempts}/${securityInfo.securityInfo.maxFailedAttempts}`);
        console.log(`   - Aktywne sesje: ${securityInfo.securityInfo.activeSessions}`);
    } else {
        console.log('❌ Test 1 FAILED');
        return;
    }

    // Test 2: Reset hasła
    console.log('\n🔑 Test 2: Reset hasła');
    const resetResult = await testAPI('resetPassword', {
        action: 'resetPassword',
        clientId: TEST_CLIENT_ID,
        newPassword: 'testowe123',
        adminId: 'test-admin',
        adminName: 'Test Administrator'
    });

    if (resetResult && resetResult.success) {
        console.log('✅ Test 2 PASSED - Hasło zresetowane');
    } else {
        console.log('❌ Test 2 FAILED:', resetResult?.message);
    }

    // Poczekaj chwilę
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Zablokuj konto
    console.log('\n🔒 Test 3: Blokada konta');
    const lockResult = await testAPI('lockAccount', {
        action: 'lockAccount',
        clientId: TEST_CLIENT_ID,
        reason: 'Test blokady - automatyczny test',
        adminId: 'test-admin',
        adminName: 'Test Administrator'
    });

    if (lockResult && lockResult.success) {
        console.log('✅ Test 3 PASSED - Konto zablokowane');
    } else {
        console.log('❌ Test 3 FAILED:', lockResult?.message);
    }

    // Poczekaj chwilę
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Sprawdź status po blokadzie
    console.log('\n🔍 Test 4: Sprawdzenie statusu po blokadzie');
    const securityInfo2 = await testAPI('getSecurityInfo', {
        action: 'getSecurityInfo',
        clientId: TEST_CLIENT_ID
    }, 'GET');

    if (securityInfo2 && securityInfo2.securityInfo.isLocked) {
        console.log('✅ Test 4 PASSED - Konto jest zablokowane');
    } else {
        console.log('❌ Test 4 FAILED - Konto powinno być zablokowane');
    }

    // Test 5: Odblokuj konto
    console.log('\n🔓 Test 5: Odblokowanie konta');
    const unlockResult = await testAPI('unlockAccount', {
        action: 'unlockAccount',
        clientId: TEST_CLIENT_ID,
        adminId: 'test-admin',
        adminName: 'Test Administrator'
    });

    if (unlockResult && unlockResult.success) {
        console.log('✅ Test 5 PASSED - Konto odblokowane');
    } else {
        console.log('❌ Test 5 FAILED:', unlockResult?.message);
    }

    // Poczekaj chwilę
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 6: Sprawdź status po odblokowaniu
    console.log('\n🔍 Test 6: Sprawdzenie statusu po odblokowaniu');
    const securityInfo3 = await testAPI('getSecurityInfo', {
        action: 'getSecurityInfo',
        clientId: TEST_CLIENT_ID
    }, 'GET');

    if (securityInfo3 && !securityInfo3.securityInfo.isLocked) {
        console.log('✅ Test 6 PASSED - Konto jest odblokowane');
    } else {
        console.log('❌ Test 6 FAILED - Konto powinno być odblokowane');
    }

    // Test 7: Pobierz logi bezpieczeństwa
    console.log('\n📜 Test 7: Pobieranie logów bezpieczeństwa');
    const logsResult = await testAPI('getSecurityLog', {
        action: 'getSecurityLog',
        limit: 10,
        clientId: TEST_CLIENT_ID
    }, 'GET');

    if (logsResult && logsResult.success) {
        console.log('✅ Test 7 PASSED');
        console.log(`   - Liczba logów: ${logsResult.logs.length}`);
        if (logsResult.logs.length > 0) {
            console.log(`   - Ostatnie zdarzenie: ${logsResult.logs[0].type}`);
            console.log(`   - Data: ${logsResult.logs[0].timestamp}`);
        }
    } else {
        console.log('❌ Test 7 FAILED');
    }

    // PODSUMOWANIE
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTY ZAKOŃCZONE');
    console.log('='.repeat(60));
    console.log('\n📋 Sprawdź:');
    console.log('   1. Plik data/clients.json - czy klient ma zaktualizowane dane');
    console.log('   2. Plik data/client-security-log.json - czy logi są zapisane');
    console.log('   3. Plik data/client-sessions.json - czy sesje są unieważnione');
    console.log('\n✅ Wszystkie testy zakończone!\n');
}

// ===========================
// RUN
// ===========================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 TEST API ZARZĄDZANIA KONTAMI KLIENTÓW               ║
║                                                           ║
║   Endpoint: ${API_URL}        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log('⚠️  UWAGA: Upewnij się że:');
console.log('   1. Serwer działa na http://localhost:3000');
console.log('   2. Masz klienta z ID: CLI2025000001 w bazie');
console.log('   3. Klient ma ustawione hasło (passwordHash)');
console.log('\n💡 Możesz zmienić TEST_CLIENT_ID w skrypcie\n');

runTests().catch(error => {
    console.error('❌ Krytyczny błąd:', error);
    process.exit(1);
});
