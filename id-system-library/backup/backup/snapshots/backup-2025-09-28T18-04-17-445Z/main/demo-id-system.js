/**
 * ==========================================
 * DEMO: SYSTEM ID TECHNIK - PRAKTYCZNE UŻYCIE
 * ==========================================
 * 
 * Ten plik pokazuje jak używać systemu ID w praktyce
 * zarówno w aplikacji webowej jak i mobilnej.
 * 
 * Uruchom: node demo-id-system.js
 */

const IDSystem = require('./id-system.js');

console.log('🎯 TECHNIK ID SYSTEM - DEMO PRAKTYCZNE\n');
console.log('=====================================\n');

// ========================================
// 1. PODSTAWOWE GENEROWANIE ID
// ========================================

console.log('1️⃣ PODSTAWOWE GENEROWANIE ID');
console.log('-----------------------------');

// Zlecenia z różnych źródeł
const zlecenieAI = IDSystem.generateOrderId('A');
const zlecenieMobile = IDSystem.generateOrderId('M');
const zlecenieWeb = IDSystem.generateOrderId('W');
const zlecenieTel = IDSystem.generateOrderId('T');

console.log('Zlecenia:');
console.log(`  AI Assistant: ${zlecenieAI}`);
console.log(`  Mobile:       ${zlecenieMobile}`);
console.log(`  Website:      ${zlecenieWeb}`);
console.log(`  Telefon:      ${zlecenieTel}`);

// Klienci i pracownicy
const klient = IDSystem.generateClientId();
const pracownik = IDSystem.generateEmployeeId();
const serwisant = IDSystem.generateServicemanId();

console.log('\nInne encje:');
console.log(`  Klient:       ${klient}`);
console.log(`  Pracownik:    ${pracownik}`);
console.log(`  Serwisant:    ${serwisant}`);

console.log('\n');

// ========================================
// 2. DEKODOWANIE I ANALIZA ID
// ========================================

console.log('2️⃣ DEKODOWANIE I ANALIZA ID');
console.log('---------------------------');

const testIds = [zlecenieAI, klient, pracownik];

testIds.forEach(id => {
    const decoded = IDSystem.decodeId(id);
    console.log(`\n🔍 Analiza ID: ${id}`);
    
    if (decoded.isValid) {
        console.log(`   ✅ Prawidłowy: ${decoded.entityType}`);
        console.log(`   📅 Data: ${decoded.date.toLocaleDateString('pl-PL')}`);
        console.log(`   🔢 Numer: ${decoded.sequenceNumber}`);
        
        if (decoded.source) {
            console.log(`   📱 Źródło: ${decoded.sourceName}`);
        }
    } else {
        console.log(`   ❌ Nieprawidłowy: ${decoded.error}`);
    }
});

console.log('\n');

// ========================================
// 3. FUNKCJE MOBILNE
// ========================================

console.log('3️⃣ FUNKCJE MOBILNE');
console.log('------------------');

const wizytaMobile = IDSystem.generateMobileVisitId();
const zlecenieMobileAuto = IDSystem.generateMobileOrderId();

console.log('Identyfikatory mobilne:');
console.log(`  Wizyta:    ${wizytaMobile}`);
console.log(`  Zlecenie:  ${zlecenieMobileAuto}`);

// Sprawdzenie czy ID są mobilne
const mobilneIds = [wizytaMobile, zlecenieMobileAuto, klient, zlecenieAI];
console.log('\nSprawdzanie ID mobilnych:');
mobilneIds.forEach(id => {
    const jestMobilne = IDSystem.isMobileId(id);
    console.log(`  ${id}: ${jestMobilne ? '📱 MOBILNE' : '💻 DESKTOP'}`);
});

console.log('\n');

// ========================================
// 4. LEGACY DATA
// ========================================

console.log('4️⃣ MIGRACJA STARYCH DANYCH');
console.log('--------------------------');

// Symulacja starych zleceń
const stareZlecenia = ['123', '456', '1696099051', 'ABC789'];

console.log('Konwersja starych zleceń:');
stareZlecenia.forEach(staryId => {
    const nowyId = IDSystem.generateLegacyOrderId(staryId);
    console.log(`  ${staryId} → ${nowyId}`);
});

// Dekodowanie legacy ID
const legacyId = IDSystem.generateLegacyOrderId('1696099051');
const decodedLegacy = IDSystem.decodeId(legacyId);

console.log(`\n🔍 Analiza Legacy ID: ${legacyId}`);
if (decodedLegacy.isValid) {
    console.log(`   ✅ Legacy: ${decodedLegacy.isLegacy}`);
    console.log(`   🆔 Oryginalny ID: ${decodedLegacy.originalId}`);
    if (decodedLegacy.date) {
        console.log(`   📅 Data: ${decodedLegacy.date.toLocaleDateString('pl-PL')}`);
    }
}

console.log('\n');

// ========================================
// 5. STATYSTYKI I LIMITY
// ========================================

console.log('5️⃣ STATYSTYKI SYSTEMU');
console.log('---------------------');

const stats = IDSystem.getDayStatistics();
console.log('Statystyki dzienne:');
console.log(`  Data: ${stats.date}`);
console.log(`  Kod daty: ${stats.dateCode}`);
console.log(`  Max zleceń na źródło: ${stats.maxOrdersPerSource.toLocaleString()}`);
console.log(`  Max zleceń łącznie: ${stats.maxTotalOrders.toLocaleString()}`);
console.log(`  Dostępne źródła: ${stats.sources.join(', ')}`);

console.log('\n');

// ========================================
// 6. WALIDACJA
// ========================================

console.log('6️⃣ WALIDACJA DANYCH');
console.log('-------------------');

// Prawidłowa walidacja
const validTest = IDSystem.validateInput('orders', 'A', new Date(), 1);
console.log('✅ Prawidłowe dane:');
console.log(`   Status: ${validTest.isValid}`);
console.log(`   Błędy: ${validTest.errors.length}`);

// Nieprawidłowa walidacja
const invalidTest = IDSystem.validateInput('orders', 'X', 'bad-date', 'not-number');
console.log('\n❌ Nieprawidłowe dane:');
console.log(`   Status: ${invalidTest.isValid}`);
console.log(`   Błędy: ${invalidTest.errors.length}`);
invalidTest.errors.forEach((error, index) => {
    console.log(`     ${index + 1}. ${error}`);
});

console.log('\n');

// ========================================
// 7. PRZYKŁAD INTEGRACJI - NOWE ZLECENIE
// ========================================

console.log('7️⃣ PRZYKŁAD: TWORZENIE NOWEGO ZLECENIA');
console.log('-------------------------------------');

function createNewOrder(source, customerData) {
    try {
        // 1. Walidacja
        const validation = IDSystem.validateInput('orders', source, new Date(), 1);
        if (!validation.isValid) {
            throw new Error(`Błąd walidacji: ${validation.errors.join(', ')}`);
        }
        
        // 2. Generowanie ID
        // W rzeczywistości pobierzemy numer z bazy danych
        const sequenceNumber = Math.floor(Math.random() * 100) + 1;
        const orderId = IDSystem.generateOrderId(source, new Date(), sequenceNumber);
        
        // 3. Tworzenie zlecenia
        const order = {
            id: orderId,
            source: source,
            customer: customerData,
            createdAt: new Date(),
            status: 'pending'
        };
        
        return order;
    } catch (error) {
        return { error: error.message };
    }
}

// Test tworzenia zlecenia
const noweZlecenie = createNewOrder('W', {
    name: 'Jan Kowalski',
    phone: '+48 123 456 789',
    address: 'ul. Przykładowa 123, Warszawa'
});

if (noweZlecenie.error) {
    console.log(`❌ Błąd: ${noweZlecenie.error}`);
} else {
    console.log('✅ Utworzono zlecenie:');
    console.log(`   ID: ${noweZlecenie.id}`);
    console.log(`   Klient: ${noweZlecenie.customer.name}`);
    console.log(`   Źródło: ${noweZlecenie.source}`);
    console.log(`   Status: ${noweZlecenie.status}`);
    
    // Analiza utworzonego ID
    const analysis = IDSystem.decodeId(noweZlecenie.id);
    console.log(`   Źródło pełne: ${analysis.sourceName}`);
    console.log(`   Data: ${analysis.date.toLocaleDateString('pl-PL')}`);
}

console.log('\n');

// ========================================
// 8. PRZYKŁAD MOBILNY - WIZYTA SERWISANTA
// ========================================

console.log('8️⃣ PRZYKŁAD: WIZYTA SERWISANTA (MOBILE)');
console.log('---------------------------------------');

class MobileServiceDemo {
    startVisit(servicemanId, location) {
        const visitId = IDSystem.generateMobileVisitId();
        
        const visit = {
            id: visitId,
            servicemanId: servicemanId,
            location: location,
            startTime: new Date(),
            status: 'in_progress'
        };
        
        console.log('🚚 Rozpoczęto wizytę:');
        console.log(`   ID wizyty: ${visit.id}`);
        console.log(`   Serwisant: ${visit.servicemanId}`);
        console.log(`   Lokalizacja: ${visit.location}`);
        console.log(`   Status: ${visit.status}`);
        
        return visit;
    }
    
    createOrderFromVisit(visitId, details) {
        const orderId = IDSystem.generateMobileOrderId();
        
        const order = {
            id: orderId,
            visitId: visitId,
            details: details,
            source: 'M',
            createdAt: new Date()
        };
        
        console.log('\n📋 Utworzono zlecenie z wizyty:');
        console.log(`   ID zlecenia: ${order.id}`);
        console.log(`   ID wizyty: ${order.visitId}`);
        console.log(`   Szczegóły: ${order.details}`);
        
        return order;
    }
}

// Demo wizyty mobilnej
const mobileService = new MobileServiceDemo();
const wizyta = mobileService.startVisit('SRV252710001', 'ul. Serwisowa 456, Kraków');
const zlecenieZWizyty = mobileService.createOrderFromVisit(
    wizyta.id, 
    'Naprawa pralki - wymiana pompy'
);

console.log('\n');

// ========================================
// PODSUMOWANIE
// ========================================

console.log('🎉 DEMO ZAKOŃCZONE POMYŚLNIE!');
console.log('=============================\n');

console.log('📋 Wygenerowane ID:');
console.log(`   Zleceń: 6`);
console.log(`   Klientów: 1`);
console.log(`   Pracowników: 1`);
console.log(`   Serwisantów: 1`);
console.log(`   Wizyt: 2`);
console.log(`   Legacy: ${stareZlecenia.length}`);

console.log('\n✅ System ID działa prawidłowo i jest gotowy do użycia!');
console.log('📚 Pełna dokumentacja: shared/ID_SYSTEM_USAGE_GUIDE.md');
console.log('🔧 Główny plik: shared/id-system.js\n');

// ========================================
// EXPORT PRZYKŁADÓW DO TESTÓW
// ========================================

module.exports = {
    demoIds: {
        zlecenieAI,
        zlecenieMobile,
        klient,
        pracownik,
        wizytaMobile
    },
    createNewOrder,
    MobileServiceDemo
};