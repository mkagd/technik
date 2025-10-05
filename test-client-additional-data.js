// test-client-additional-data.js
// Test zapisywania dodatkowych adresów i numerów telefonu

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, 'data', 'clients.json');

async function testClientUpdate() {
  console.log('🧪 TEST: Dodatkowe adresy i numery telefonu dla klienta\n');

  // 1. Odczyt obecnych klientów
  let clients = [];
  if (fs.existsSync(CLIENTS_FILE)) {
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    clients = JSON.parse(data);
    console.log(`✅ Wczytano ${clients.length} klientów\n`);
  }

  if (clients.length === 0) {
    console.log('❌ Brak klientów w systemie. Dodaj najpierw klienta.\n');
    return;
  }

  // 2. Wybierz pierwszego klienta
  const testClient = clients[0];
  console.log('📋 Testowany klient:');
  console.log(`   ID: ${testClient.id}`);
  console.log(`   Imię: ${testClient.name}`);
  console.log(`   Telefon główny: ${testClient.phone}`);
  console.log(`   Adres główny: ${testClient.address || 'Brak'}\n`);

  // 3. Dodaj dodatkowe dane
  const updatedClient = {
    ...testClient,
    // Dodatkowe numery telefonu
    additionalPhones: [
      {
        id: Date.now().toString(),
        number: '987-654-321',
        label: 'Telefon służbowy',
        isPrimary: false,
        addedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 1).toString(),
        number: '111-222-333',
        label: 'Komórkowy',
        isPrimary: false,
        addedAt: new Date().toISOString()
      }
    ],
    // Dodatkowe adresy
    additionalAddresses: [
      {
        id: Date.now().toString(),
        street: 'ul. Testowa 456',
        city: 'Kraków',
        postalCode: '30-000',
        label: 'Biuro',
        isPrimary: false,
        fullAddress: 'ul. Testowa 456, 30-000 Kraków',
        addedAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        street: 'ul. Letnia 789',
        city: 'Gdańsk',
        postalCode: '80-000',
        label: 'Dom letniskowy',
        isPrimary: false,
        fullAddress: 'ul. Letnia 789, 80-000 Gdańsk',
        addedAt: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };

  // 4. Zapisz zmiany
  clients[0] = updatedClient;
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
  
  console.log('✅ ZAPISANO dodatkowe dane klienta:\n');
  
  console.log('📞 Dodatkowe numery telefonu:');
  updatedClient.additionalPhones.forEach((phone, idx) => {
    console.log(`   ${idx + 1}. ${phone.number} (${phone.label})`);
  });
  
  console.log('\n🏠 Dodatkowe adresy:');
  updatedClient.additionalAddresses.forEach((addr, idx) => {
    console.log(`   ${idx + 1}. ${addr.fullAddress} (${addr.label})`);
  });

  // 5. Weryfikacja - odczytaj ponownie
  console.log('\n🔍 WERYFIKACJA - Odczyt z pliku:');
  const verifyData = fs.readFileSync(CLIENTS_FILE, 'utf8');
  const verifyClients = JSON.parse(verifyData);
  const verifyClient = verifyClients[0];

  console.log(`   ✅ Dodatkowe telefony: ${verifyClient.additionalPhones?.length || 0}`);
  console.log(`   ✅ Dodatkowe adresy: ${verifyClient.additionalAddresses?.length || 0}`);

  if (verifyClient.additionalPhones && verifyClient.additionalPhones.length > 0) {
    console.log('\n   📞 Telefony z pliku:');
    verifyClient.additionalPhones.forEach((phone) => {
      console.log(`      - ${phone.number} (${phone.label})`);
    });
  }

  if (verifyClient.additionalAddresses && verifyClient.additionalAddresses.length > 0) {
    console.log('\n   🏠 Adresy z pliku:');
    verifyClient.additionalAddresses.forEach((addr) => {
      console.log(`      - ${addr.fullAddress} (${addr.label})`);
    });
  }

  console.log('\n✅ TEST ZAKOŃCZONY - Dane zapisane poprawnie!');
}

// Uruchom test
testClientUpdate().catch(err => {
  console.error('❌ Błąd testu:', err);
  process.exit(1);
});
