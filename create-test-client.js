// create-test-client.js
// 🧪 Skrypt do utworzenia testowego klienta z hasłem

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const CLIENTS_FILE = path.join(__dirname, 'data', 'clients.json');

async function createTestClient() {
    console.log('🔧 Tworzenie testowego klienta...\n');

    // Sprawdź czy plik istnieje
    if (!fs.existsSync(CLIENTS_FILE)) {
        console.error('❌ Plik data/clients.json nie istnieje!');
        console.log('💡 Utwórz folder data/ i plik clients.json');
        return;
    }

    // Wczytaj istniejących klientów
    let clients = [];
    try {
        const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
        clients = JSON.parse(data);
    } catch (error) {
        console.log('⚠️  Nie można odczytać pliku, tworzę nową tablicę');
        clients = [];
    }

    // Sprawdź czy testowy klient już istnieje
    const existingTest = clients.find(c => c.email === 'test@example.com');
    if (existingTest) {
        console.log('✅ Testowy klient już istnieje:');
        console.log(`   ID: ${existingTest.id}`);
        console.log(`   Email: ${existingTest.email}`);
        console.log(`   Hasło: testowe123`);
        console.log('\n💡 Możesz go użyć do testowania');
        return;
    }

    // Generuj ID
    const lastClient = clients.length > 0 
        ? clients.sort((a, b) => {
            const idA = String(a.id || '');
            const idB = String(b.id || '');
            return idB.localeCompare(idA);
          })[0]
        : null;
    
    let newIdNumber = 1;
    if (lastClient && lastClient.id) {
        const idString = String(lastClient.id);
        const match = idString.match(/CLI2025(\d{6})/);
        if (match && match[1]) {
            const lastNumber = parseInt(match[1], 10);
            if (!isNaN(lastNumber) && lastNumber > 0) {
                newIdNumber = lastNumber + 1;
            }
        }
    }
    
    const newId = `CLI2025${String(newIdNumber).padStart(6, '0')}`;

    // Hash hasła
    const passwordHash = await bcrypt.hash('testowe123', 10);

    // Utwórz testowego klienta
    const testClient = {
        id: newId,
        name: 'Jan Testowy',
        firstName: 'Jan',
        lastName: 'Testowy',
        type: 'individual',
        email: 'test@example.com',
        phone: '+48 123 456 789',
        mobile: '+48 123 456 789',
        address: {
            street: 'Testowa',
            buildingNumber: '1',
            apartmentNumber: '10',
            city: 'Kraków',
            postalCode: '30-001',
            voivodeship: 'małopolskie',
            country: 'Polska'
        },
        passwordHash,
        status: 'active',
        failedLoginAttempts: 0,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Dodaj do tablicy
    clients.push(testClient);

    // Zapisz
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));

    console.log('✅ Utworzono testowego klienta:\n');
    console.log('╔═════════════════════════════════════════════╗');
    console.log('║  📋 DANE TESTOWEGO KLIENTA                 ║');
    console.log('╚═════════════════════════════════════════════╝');
    console.log(`   ID:        ${testClient.id}`);
    console.log(`   Imię:      ${testClient.name}`);
    console.log(`   Email:     ${testClient.email}`);
    console.log(`   Telefon:   ${testClient.phone}`);
    console.log(`   Hasło:     testowe123`);
    console.log(`   Status:    ${testClient.status}`);
    console.log('');
    console.log('💡 Możesz teraz:');
    console.log('   1. Zalogować się jako klient: http://localhost:3000/client/login');
    console.log(`   2. Zarządzać w panelu admin: http://localhost:3000/admin/klienci/${testClient.id}`);
    console.log('   3. Testować API z ID: ' + testClient.id);
    console.log('');

    // Utwórz również testowego klienta bez hasła (gość)
    const guestClient = {
        id: `CLI2025${String(newIdNumber + 1).padStart(6, '0')}`,
        name: 'Anna Gość',
        firstName: 'Anna',
        lastName: 'Gość',
        type: 'individual',
        email: 'gosc@example.com',
        phone: '+48 987 654 321',
        mobile: '+48 987 654 321',
        address: {
            street: 'Gości',
            buildingNumber: '2',
            apartmentNumber: '',
            city: 'Warszawa',
            postalCode: '00-001',
            voivodeship: 'mazowieckie',
            country: 'Polska'
        },
        // Brak passwordHash - to jest gość
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'phone-call'
    };

    clients.push(guestClient);
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));

    console.log('✅ Utworzono także klienta-gościa (bez hasła):\n');
    console.log(`   ID:        ${guestClient.id}`);
    console.log(`   Imię:      ${guestClient.name}`);
    console.log(`   Email:     ${guestClient.email}`);
    console.log(`   Telefon:   ${guestClient.phone}`);
    console.log(`   Status:    Gość (bez konta)`);
    console.log('');
    console.log('🎉 Gotowe! Masz teraz 2 testowych klientów do testowania!');
    console.log('');
}

// Uruchom
createTestClient().catch(error => {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
});
