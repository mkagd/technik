// Test dodawania zgłoszenia i sprawdzenia czy pojawia się na mapie
console.log('🧪 Test zgłoszenia na mapie');
console.log('========================');

async function testZgloszenie() {
    const baseUrl = 'http://localhost:3000';

    // 1. Sprawdź czy serwer jest uruchomiony
    console.log('\n1. 🔍 Sprawdzanie czy serwer jest uruchomiony...');
    try {
        const healthCheck = await fetch(`${baseUrl}/api/rezerwacje`);
        console.log(`   Status serwera: ${healthCheck.status}`);

        if (!healthCheck.ok) {
            console.log('   ❌ Serwer nie odpowiada poprawnie');
            console.log('   💡 Uruchom serwer: npm run dev');
            return;
        }

        const currentData = await healthCheck.json();
        console.log('   📊 Aktualne dane w systemie:', currentData);
        console.log(`   📈 Liczba istniejących zgłoszeń: ${currentData.rezerwacje?.length || 0}`);

    } catch (error) {
        console.log('   ❌ Błąd połączenia z serwerem:', error.message);
        console.log('   💡 Uruchom serwer: npm run dev');
        return;
    }

    // 2. Wyślij testowe zgłoszenie
    console.log('\n2. 📤 Wysyłanie testowego zgłoszenia...');
    const testZgloszenie = {
        name: 'Jan Testowy',
        phone: '+48 123 456 789',
        email: 'jan.testowy@example.com',
        fullAddress: 'ul. Testowa 123/45, 00-001 Warszawa',
        address: 'ul. Testowa 123/45, 00-001 Warszawa',
        category: 'Naprawa komputera',
        device: 'Dell Inspiron 15',
        problem: 'Komputer włącza się bardzo wolno',
        date: new Date().toISOString()
    };

    try {
        const response = await fetch(`${baseUrl}/api/rezerwacje`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testZgloszenie),
        });

        const result = await response.json();
        console.log(`   Status odpowiedzi: ${response.status}`);
        console.log('   📨 Odpowiedź API:', result);

        if (response.ok) {
            console.log('   ✅ Zgłoszenie zostało przyjęte!');
        } else {
            console.log('   ❌ Błąd podczas wysyłania:', result.message);
            return;
        }

    } catch (error) {
        console.log('   ❌ Błąd wysyłania zgłoszenia:', error.message);
        return;
    }

    // 3. Sprawdź czy zgłoszenie jest dostępne przez API
    console.log('\n3. 🔍 Sprawdzanie czy zgłoszenie jest dostępne...');
    try {
        const checkResponse = await fetch(`${baseUrl}/api/rezerwacje`);
        const afterData = await checkResponse.json();

        console.log('   📊 Dane po dodaniu zgłoszenia:', afterData);
        console.log(`   📈 Liczba zgłoszeń: ${afterData.rezerwacje?.length || 0}`);

        const foundTestEntry = afterData.rezerwacje?.find(r =>
            r.name === testZgloszenie.name && r.phone === testZgloszenie.phone
        );

        if (foundTestEntry) {
            console.log('   ✅ Testowe zgłoszenie znalezione w systemie!');
            console.log('   📍 Adres w systemie:', foundTestEntry.address);
        } else {
            console.log('   ❌ Testowe zgłoszenie nie zostało znalezione');
        }

    } catch (error) {
        console.log('   ❌ Błąd sprawdzania danych:', error.message);
    }

    // 4. Instrukcje dla użytkownika
    console.log('\n4. 📋 Następne kroki:');
    console.log('   1. Przejdź do przeglądarki: http://localhost:3000/mapa');
    console.log('   2. Otwórz konsolę deweloperską (F12)');
    console.log('   3. Sprawdź czy widzisz logi ładowania danych');
    console.log('   4. Sprawdź czy na mapie pojawił się marker');
    console.log('   5. Jeśli nie ma markera, sprawdź czy adres został poprawnie zgeokodowany');

    console.log('\n✅ Test zakończony!');
    console.log('🔧 Jeśli nie widzisz danych na mapie, sprawdź konsolę przeglądarki');
}

// Uruchom test
testZgloszenie().catch(console.error);
