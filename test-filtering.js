// test-filtering.js - Skrypt do testowania filtrowania zamówień

// Funkcja do testowania filtrowania zamówień
function testOrderFiltering() {
    console.log('🧪 TESTOWANIE FILTROWANIA ZAMÓWIEŃ');
    console.log('==================================');

    // Import reportManager (w prawdziwej aplikacji to będzie dostępne globalnie)
    if (typeof reportManager === 'undefined') {
        console.error('❌ reportManager nie jest dostępny. Uruchom w kontekście aplikacji.');
        return;
    }

    // 1. Wyczyść poprzednie dane testowe
    console.log('🧹 Czyszczenie poprzednich danych testowych...');
    localStorage.removeItem('unified_reports');
    localStorage.removeItem('quickReports');
    localStorage.removeItem('technikUsers');

    // 2. Utwórz testowych użytkowników
    console.log('👥 Tworzenie testowych użytkowników...');
    const testUsers = [
        {
            id: 'USER-TEST-001',
            email: 'jan.kowalski@example.com',
            password: 'test123',
            name: 'Jan Kowalski',
            createdAt: new Date().toISOString(),
            isActive: true
        },
        {
            id: 'USER-TEST-002',
            email: 'anna.nowak@example.com',
            password: 'test456',
            name: 'Anna Nowak',
            createdAt: new Date().toISOString(),
            isActive: true
        }
    ];
    localStorage.setItem('technikUsers', JSON.stringify(testUsers));

    // 3. Utwórz testowe zamówienia dla różnych użytkowników
    console.log('📋 Tworzenie testowych zamówień...');

    // Zamówienia dla jan.kowalski@example.com
    const order1 = reportManager.createReport({
        userId: 'USER-TEST-001',
        email: 'jan.kowalski@example.com',
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '+48123456789',
        address: 'ul. Testowa 1, Warszawa',
        city: 'Warszawa',
        description: 'Nie włącza się komputer Dell Inspiron',
        equipmentType: 'Komputer stacjonarny',
        availability: 'Rano (8:00-12:00)',
        urgency: 'normal',
        source: 'test_script'
    }, 'ZG');

    const order2 = reportManager.createReport({
        userId: 'USER-TEST-001',
        email: 'jan.kowalski@example.com',
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '+48123456789',
        address: 'ul. Testowa 1, Warszawa',
        city: 'Warszawa',
        description: 'Drukarka nie drukuje w kolorze',
        equipmentType: 'Drukarka',
        availability: 'Popołudnie (12:00-18:00)',
        urgency: 'high',
        source: 'test_script'
    }, 'US');

    // Zamówienia dla anna.nowak@example.com
    const order3 = reportManager.createReport({
        userId: 'USER-TEST-002',
        email: 'anna.nowak@example.com',
        firstName: 'Anna',
        lastName: 'Nowak',
        phone: '+48987654321',
        address: 'ul. Przykładowa 5, Kraków',
        city: 'Kraków',
        description: 'Laptop się przegrzewa i wyłącza',
        equipmentType: 'Laptop',
        availability: 'Wieczorem (18:00-20:00)',
        urgency: 'normal',
        source: 'test_script'
    }, 'ZG');

    // Zapisz zamówienia
    reportManager.saveReport(order1);
    reportManager.saveReport(order2);
    reportManager.saveReport(order3);

    // 4. Dodaj także do starych systemów dla testowania kompatybilności
    const legacyOrders = [
        {
            id: 'LEGACY-001',
            timestamp: new Date().toISOString(),
            email: 'jan.kowalski@example.com',
            phone: '+48123456789',
            description: 'Stare zamówienie - monitor',
            finalEquipment: 'Monitor',
            status: 'new'
        },
        {
            id: 'LEGACY-002',
            timestamp: new Date().toISOString(),
            email: 'anna.nowak@example.com',
            phone: '+48987654321',
            description: 'Stare zamówienie - klawiatura',
            finalEquipment: 'Klawiatura',
            status: 'completed'
        }
    ];
    localStorage.setItem('quickReports', JSON.stringify(legacyOrders));

    // 5. Testuj filtrowanie
    console.log('🔍 Testowanie filtrowania...');

    // Test 1: Pobieranie wszystkich zamówień
    const allReports = reportManager.getAllReports();
    console.log(`📊 Wszystkie zamówienia w systemie: ${allReports.length}`);

    // Test 2: Filtrowanie dla jan.kowalski@example.com
    const janOrders = reportManager.getReportsByUser('jan.kowalski@example.com');
    console.log(`👤 Zamówienia dla jan.kowalski@example.com: ${janOrders.length}`);
    janOrders.forEach(order => {
        console.log(`  - ${order.reportNumber}: ${order.reportDetails.description}`);
    });

    // Test 3: Filtrowanie dla anna.nowak@example.com
    const annaOrders = reportManager.getReportsByUser('anna.nowak@example.com');
    console.log(`👤 Zamówienia dla anna.nowak@example.com: ${annaOrders.length}`);
    annaOrders.forEach(order => {
        console.log(`  - ${order.reportNumber}: ${order.reportDetails.description}`);
    });

    // 6. Test statystyk
    console.log('📈 Statystyki systemu:');
    const stats = reportManager.getStats();
    console.log(`  - Łączna liczba zamówień: ${stats.total}`);
    console.log(`  - Nowe: ${stats.byStatus.new}`);
    console.log(`  - W trakcie: ${stats.byStatus['in-progress']}`);
    console.log(`  - Zakończone: ${stats.byStatus.resolved}`);

    console.log('✅ Test zakończony pomyślnie!');
    console.log('');
    console.log('🎯 KOLEJNE KROKI:');
    console.log('1. Otwórz http://localhost:3000/moje-zamowienie');
    console.log('2. Zaloguj się jako jan.kowalski@example.com (hasło: test123)');
    console.log('3. Sprawdź czy widzisz tylko swoje zamówienia (powinny być 2)');
    console.log('4. Wyloguj się i zaloguj jako anna.nowak@example.com (hasło: test456)');
    console.log('5. Sprawdź czy widzisz tylko swoje zamówienie (powinno być 1)');
}

// Uruchom test jeśli jesteś w konsoli przeglądarki
if (typeof window !== 'undefined') {
    // Dodaj funkcję do window żeby była dostępna w konsoli
    window.testOrderFiltering = testOrderFiltering;
    console.log('🚀 Funkcja testOrderFiltering() została dodana do window.');
    console.log('Uruchom: testOrderFiltering() w konsoli przeglądarki');
}

// Export dla Node.js (jeśli potrzebny)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testOrderFiltering };
}
