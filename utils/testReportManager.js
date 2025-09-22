// utils/testReportManager.js
// Prosty skrypt testowy dla reportManager

import reportManager from './reportManager.js';

// Funkcja testowa
export function testReportManager() {
    console.log('=== TEST REPORT MANAGER ===');

    // Test 1: Generowanie numerów zgłoszeń
    console.log('\n1. Test generowania numerów:');
    const num1 = reportManager.generateReportNumber('ZG');
    const num2 = reportManager.generateReportNumber('US');
    const num3 = reportManager.generateReportNumber('RZ');

    console.log('ZG:', num1);
    console.log('US:', num2);
    console.log('RZ:', num3);

    // Test 2: Tworzenie zgłoszenia
    console.log('\n2. Test tworzenia zgłoszenia:');
    const testData = {
        phone: '123456789',
        email: 'test@example.com',
        address: 'ul. Testowa 123',
        city: 'Warszawa',
        description: 'Problem z drukarką',
        equipmentType: 'Drukarka',
        availability: 'Po 16:00',
        source: 'test'
    };

    const newReport = reportManager.createReport(testData, 'ZG');
    console.log('Utworzono zgłoszenie:', newReport.reportNumber);
    console.log('ID:', newReport.id);
    console.log('Status:', newReport.status);

    // Test 3: Zapisanie zgłoszenia
    console.log('\n3. Test zapisywania:');
    const savedReport = reportManager.saveReport(newReport);
    console.log('Zapisano zgłoszenie:', savedReport.reportNumber);

    // Test 4: Pobieranie zgłoszeń
    console.log('\n4. Test pobierania zgłoszeń:');
    const allReports = reportManager.getAllReports();
    console.log('Liczba zgłoszeń:', allReports.length);

    // Test 5: Aktualizacja statusu
    console.log('\n5. Test aktualizacji statusu:');
    const updated = reportManager.updateReportStatus(
        savedReport.reportNumber,
        'in-progress',
        'Test zmiany statusu'
    );
    if (updated) {
        console.log('Status zmieniony na:', updated.status);
        console.log('Historia statusów:', updated.statusHistory.length);
    }

    // Test 6: Statystyki
    console.log('\n6. Test statystyk:');
    const stats = reportManager.getStats();
    console.log('Statystyki:', stats);

    // Test 7: Liczniki
    console.log('\n7. Test liczników:');
    const counters = reportManager.getCounters();
    console.log('Liczniki:', counters);

    console.log('\n=== KONIEC TESTU ===');

    return {
        success: true,
        reportNumber: savedReport.reportNumber,
        stats: stats
    };
}

// Funkcja czyszcząca dla testów
export function clearTestData() {
    localStorage.removeItem('unified_reports');
    localStorage.removeItem('report_counters');
    localStorage.removeItem('quickReports');
    localStorage.removeItem('simpleBookings');
    console.log('Dane testowe wyczyszczone');
}

// Funkcja pokazująca obecny stan
export function showCurrentState() {
    console.log('=== OBECNY STAN ===');

    const unifiedReports = reportManager.getAllReports();
    const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
    const counters = reportManager.getCounters();

    console.log('Unified Reports:', unifiedReports.length);
    console.log('Quick Reports (legacy):', quickReports.length);
    console.log('Liczniki:', counters);

    if (unifiedReports.length > 0) {
        console.log('\nPrzykładowe zgłoszenie:');
        console.log('- Numer:', unifiedReports[0].reportNumber);
        console.log('- Typ:', unifiedReports[0].type);
        console.log('- Status:', unifiedReports[0].status);
        console.log('- Sync Status:', unifiedReports[0].syncStatus);
    }

    console.log('=== KONIEC STANU ===');
}
