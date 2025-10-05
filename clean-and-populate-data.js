// clean-and-populate-data.js
// Skrypt do wyczyszczenia danych i utworzenia 5 klientów z Dębicy + 8 rezerwacji

const fs = require('fs');
const path = require('path');

// Funkcje pomocnicze z id-generator
function generateClientId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CLI-${timestamp}-${random}`;
}

function generateReservationId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REZ-${timestamp}-${random}`;
}

function generateVisitId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `VIS-${timestamp}-${random}`;
}

function cleanAndPopulateData() {
  console.log('🧹 Czyszczenie i wypełnianie danych...\n');

  // Ścieżki plików
  const clientsPath = path.join(__dirname, 'data', 'clients.json');
  const ordersPath = path.join(__dirname, 'data', 'orders.json');
  const rezervacjePath = path.join(__dirname, 'data', 'rezervacje.json');
  const visitsPath = path.join(__dirname, 'data', 'visits.json');

  // Backup przed czyszczeniem
  const backupSuffix = `-backup-${Date.now()}.json`;
  console.log('💾 Tworzenie backupów...');
  
  try {
    if (fs.existsSync(clientsPath)) {
      fs.copyFileSync(clientsPath, clientsPath.replace('.json', backupSuffix));
      console.log('✅ Backup: clients.json');
    }
    if (fs.existsSync(ordersPath)) {
      fs.copyFileSync(ordersPath, ordersPath.replace('.json', backupSuffix));
      console.log('✅ Backup: orders.json');
    }
    if (fs.existsSync(rezervacjePath)) {
      fs.copyFileSync(rezervacjePath, rezervacjePath.replace('.json', backupSuffix));
      console.log('✅ Backup: rezervacje.json');
    }
    if (fs.existsSync(visitsPath)) {
      fs.copyFileSync(visitsPath, visitsPath.replace('.json', backupSuffix));
      console.log('✅ Backup: visits.json');
    }
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia backupów:', error);
    return;
  }

  console.log('\n📝 Tworzenie 5 nowych klientów z Dębicy...\n');

  // Hasło testowe dla wszystkich klientów (prosty hash bez bcrypt)
  const passwordHash = '$2b$10$test123hashfordemopurposes';

  // 5 klientów z Dębicy z prawdziwymi adresami
  const clients = [
    {
      id: generateClientId(),
      name: 'Jan Kowalski',
      phone: '146812345',
      mobile: '501234567',
      email: 'jan.kowalski@gmail.com',
      nip: '8721234567',
      address: {
        street: 'ul. Kopernika',
        buildingNumber: '15',
        apartmentNumber: '3',
        city: 'Dębica',
        postalCode: '39-200',
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: 'individual',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Stały klient, preferuje kontakt telefoniczny',
      preferredContactMethod: 'phone',
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0,
      additionalPhones: [],
      additionalEmails: []
    },
    {
      id: generateClientId(),
      name: 'Anna Nowak',
      phone: '146823456',
      mobile: '512345678',
      email: 'anna.nowak@interia.pl',
      nip: '8721234568',
      address: {
        street: 'ul. Mickiewicza',
        buildingNumber: '28',
        apartmentNumber: '12',
        city: 'Dębica',
        postalCode: '39-200',
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: 'individual',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Preferuje kontakt emailowy',
      preferredContactMethod: 'email',
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0,
      additionalPhones: [],
      additionalEmails: []
    },
    {
      id: generateClientId(),
      name: 'Piotr Wiśniewski',
      phone: '146834567',
      mobile: '523456789',
      email: 'piotr.wisniewski@wp.pl',
      nip: '8721234569',
      address: {
        street: 'ul. Słowackiego',
        buildingNumber: '7',
        apartmentNumber: '',
        city: 'Dębica',
        postalCode: '39-200',
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: 'individual',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Dom jednorodzinny, ogródek z tyłu',
      preferredContactMethod: 'phone',
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0,
      additionalPhones: [],
      additionalEmails: []
    },
    {
      id: generateClientId(),
      name: 'Maria Lewandowska',
      phone: '146845678',
      mobile: '534567890',
      email: 'maria.lewandowska@onet.pl',
      nip: '8721234570',
      address: {
        street: 'ul. Sienkiewicza',
        buildingNumber: '42',
        apartmentNumber: '5',
        city: 'Dębica',
        postalCode: '39-200',
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: 'individual',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Klientka bardzo punktualna',
      preferredContactMethod: 'phone',
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0,
      additionalPhones: [],
      additionalEmails: []
    },
    {
      id: generateClientId(),
      name: 'Tomasz Wójcik',
      phone: '146856789',
      mobile: '545678901',
      email: 'tomasz.wojcik@gmail.com',
      nip: '8721234571',
      address: {
        street: 'ul. Rynek',
        buildingNumber: '3',
        apartmentNumber: '8',
        city: 'Dębica',
        postalCode: '39-200',
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: 'individual',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Mieszka w centrum miasta',
      preferredContactMethod: 'email',
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0,
      additionalPhones: [],
      additionalEmails: []
    }
  ];

  console.log('📝 Tworzenie 8 rezerwacji...\n');

  // 8 rezerwacji dla tych klientów
  const today = new Date();
  const reservations = [];
  
  for (let i = 0; i < 8; i++) {
    const client = clients[i % 5]; // Rotacja między klientami
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i + 1); // Każda rezerwacja kolejnego dnia
    
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const deviceTypes = ['Pralka', 'Zmywarka', 'Lodówka', 'Piekarnik', 'Płyta indukcyjna'];
    const brands = ['Samsung', 'Bosch', 'Whirlpool', 'LG', 'Electrolux'];
    
    reservations.push({
      id: generateReservationId(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
      address: `${client.address.street} ${client.address.buildingNumber}${client.address.apartmentNumber ? '/' + client.address.apartmentNumber : ''}, ${client.address.postalCode} ${client.address.city}`,
      city: client.address.city,
      deviceType: deviceTypes[i % deviceTypes.length],
      brand: brands[i % brands.length],
      model: '',
      serialNumber: '',
      issueDescription: `Problem z urządzeniem nr ${i + 1}`,
      preferredDate: futureDate.toISOString().split('T')[0],
      preferredTime: hours[i % hours.length],
      status: i < 3 ? 'confirmed' : (i < 6 ? 'pending' : 'completed'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Rezerwacja testowa ${i + 1}`,
      source: 'web'
    });
  }

  // Zapisz dane
  try {
    // Zapisz klientów
    fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2), 'utf8');
    console.log(`✅ Zapisano ${clients.length} klientów do clients.json`);

    // Wyczyść zamówienia
    fs.writeFileSync(ordersPath, JSON.stringify([], null, 2), 'utf8');
    console.log('✅ Wyczyszczono orders.json');

    // Zapisz rezerwacje
    fs.writeFileSync(rezervacjePath, JSON.stringify(reservations, null, 2), 'utf8');
    console.log(`✅ Zapisano ${reservations.length} rezerwacji do rezervacje.json`);

    // Wyczyść wizyty
    fs.writeFileSync(visitsPath, JSON.stringify([], null, 2), 'utf8');
    console.log('✅ Wyczyszczono visits.json');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUKCES! Dane zostały wyczyszczone i wypełnione\n');
    
    console.log('👥 KLIENCI (5):');
    clients.forEach((client, idx) => {
      console.log(`${idx + 1}. ${client.name}`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Tel: ${client.phone} / ${client.mobile}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Adres: ${client.address.street} ${client.address.buildingNumber}${client.address.apartmentNumber ? '/' + client.address.apartmentNumber : ''}`);
      console.log(`          ${client.address.postalCode} ${client.address.city}`);
      console.log('');
    });

    console.log('\n📅 REZERWACJE (8):');
    reservations.forEach((rez, idx) => {
      console.log(`${idx + 1}. ${rez.clientName} - ${rez.deviceType} ${rez.brand}`);
      console.log(`   ID: ${rez.id}`);
      console.log(`   Data: ${rez.preferredDate} o ${rez.preferredTime}`);
      console.log(`   Status: ${rez.status}`);
      console.log(`   Adres: ${rez.address}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n💡 UWAGA: Wizyty są puste - możesz dodać je ręcznie\n');
    console.log('🔗 Linki:');
    console.log('   Admin Panel: http://localhost:3000/admin/klienci');
    console.log('   Rezerwacje: http://localhost:3000/admin/rezerwacje');
    console.log('   Wizyty: http://localhost:3000/admin/wizyty');
    console.log('\n📝 Hasło dla wszystkich klientów: test123\n');

  } catch (error) {
    console.error('❌ Błąd podczas zapisywania danych:', error);
  }
}

// Uruchom
try {
  cleanAndPopulateData();
} catch (error) {
  console.error('❌ Błąd:', error);
}
