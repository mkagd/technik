// 🏭 GENERATOR REALISTYCZNYCH KLIENTÓW
// Generuje klientów z pełnymi danymi dla Dębicy, Ropczyc i Mielca

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clients.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

console.log('🏭 GENERATOR REALISTYCZNYCH KLIENTÓW\n');
console.log('='.repeat(70));

// ===========================
// REALNE DANE DLA DĘBICY, ROPCZYC I MIELCA
// ===========================

const DEBICA_CLIENTS = [
  {
    name: 'Jan Kowalski',
    street: 'ul. Krakowska',
    buildingNumber: '15',
    apartmentNumber: '3',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146814523',
    mobile: '512345678',
    email: 'jan.kowalski@gmail.com',
    nip: '8721234567',
    type: 'individual'
  },
  {
    name: 'Anna Nowak',
    street: 'ul. Piłsudskiego',
    buildingNumber: '28',
    apartmentNumber: '',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146815234',
    mobile: '523456789',
    email: 'anna.nowak@wp.pl',
    nip: '8721234568',
    type: 'individual'
  },
  {
    name: 'Piotr Wiśniewski',
    street: 'ul. Rzeszowska',
    buildingNumber: '42',
    apartmentNumber: '12',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146816345',
    mobile: '534567890',
    email: 'piotr.wisniewski@interia.pl',
    nip: '8721234569',
    type: 'individual'
  },
  {
    name: 'Maria Wójcik',
    street: 'ul. Ogrodowa',
    buildingNumber: '7',
    apartmentNumber: '5',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146817456',
    mobile: '545678901',
    email: 'maria.wojcik@onet.pl',
    nip: '8721234570',
    type: 'individual'
  },
  {
    name: 'Firma TECH-AGD Sp. z o.o.',
    street: 'ul. Przemysłowa',
    buildingNumber: '10',
    apartmentNumber: '',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146818567',
    mobile: '556789012',
    email: 'biuro@tech-agd.pl',
    nip: '8721234571',
    companyName: 'TECH-AGD Sp. z o.o.',
    type: 'company'
  },
  {
    name: 'Tomasz Kamiński',
    street: 'ul. Słoneczna',
    buildingNumber: '22',
    apartmentNumber: '',
    city: 'Dębica',
    postalCode: '39-200',
    phone: '146819678',
    mobile: '567890123',
    email: 'tomasz.kaminski@gmail.com',
    nip: '8721234572',
    type: 'individual'
  }
];

const ROPCZYCE_CLIENTS = [
  {
    name: 'Katarzyna Lewandowska',
    street: 'ul. Rynek',
    buildingNumber: '5',
    apartmentNumber: '2',
    city: 'Ropczyce',
    postalCode: '39-100',
    phone: '171234567',
    mobile: '578901234',
    email: 'katarzyna.lewandowska@gmail.com',
    nip: '8131234567',
    type: 'individual'
  },
  {
    name: 'Marek Zieliński',
    street: 'ul. Kościuszki',
    buildingNumber: '18',
    apartmentNumber: '',
    city: 'Ropczyce',
    postalCode: '39-100',
    phone: '171235678',
    mobile: '589012345',
    email: 'marek.zielinski@wp.pl',
    nip: '8131234568',
    type: 'individual'
  },
  {
    name: 'Agnieszka Szymańska',
    street: 'ul. Dębicka',
    buildingNumber: '33',
    apartmentNumber: '7',
    city: 'Ropczyce',
    postalCode: '39-100',
    phone: '171236789',
    mobile: '590123456',
    email: 'agnieszka.szymanska@onet.pl',
    nip: '8131234569',
    type: 'individual'
  },
  {
    name: 'Restaurant "Pod Kogutem"',
    street: 'ul. Mickiewicza',
    buildingNumber: '12',
    apartmentNumber: '',
    city: 'Ropczyce',
    postalCode: '39-100',
    phone: '171237890',
    mobile: '601234567',
    email: 'kontakt@podkogutem.pl',
    nip: '8131234570',
    companyName: 'Restaurant "Pod Kogutem"',
    type: 'company'
  },
  {
    name: 'Paweł Dąbrowski',
    street: 'ul. Słowackiego',
    buildingNumber: '8',
    apartmentNumber: '',
    city: 'Ropczyce',
    postalCode: '39-100',
    phone: '171238901',
    mobile: '612345678',
    email: 'pawel.dabrowski@interia.pl',
    nip: '8131234571',
    type: 'individual'
  }
];

const MIELEC_CLIENTS = [
  {
    name: 'Joanna Krawczyk',
    street: 'ul. Żeromskiego',
    buildingNumber: '25',
    apartmentNumber: '10',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171234590',
    mobile: '623456789',
    email: 'joanna.krawczyk@gmail.com',
    nip: '8171234567',
    type: 'individual'
  },
  {
    name: 'Michał Piotrowski',
    street: 'ul. Sienkiewicza',
    buildingNumber: '40',
    apartmentNumber: '',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171235601',
    mobile: '634567890',
    email: 'michal.piotrowski@wp.pl',
    nip: '8171234568',
    type: 'individual'
  },
  {
    name: 'Ewa Grabowska',
    street: 'ul. Obrońców Pokoju',
    buildingNumber: '15',
    apartmentNumber: '4',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171236612',
    mobile: '645678901',
    email: 'ewa.grabowska@onet.pl',
    nip: '8171234569',
    type: 'individual'
  },
  {
    name: 'Hotel PLAZA Mielec',
    street: 'ul. Legionów',
    buildingNumber: '55',
    apartmentNumber: '',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171237723',
    mobile: '656789012',
    email: 'recepcja@hotelplaza.pl',
    nip: '8171234570',
    companyName: 'Hotel PLAZA Mielec',
    type: 'company'
  },
  {
    name: 'Robert Pawlak',
    street: 'ul. Rejtana',
    buildingNumber: '30',
    apartmentNumber: '',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171238834',
    mobile: '667890123',
    email: 'robert.pawlak@gmail.com',
    nip: '8171234571',
    type: 'individual'
  },
  {
    name: 'Centrum Medyczne MEDYK',
    street: 'ul. Kościuszki',
    buildingNumber: '88',
    apartmentNumber: '',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171239945',
    mobile: '678901234',
    email: 'rejestracja@medyk-mielec.pl',
    nip: '8171234572',
    companyName: 'Centrum Medyczne MEDYK',
    type: 'company'
  },
  {
    name: 'Barbara Król',
    street: 'ul. Armii Krajowej',
    buildingNumber: '12',
    apartmentNumber: '8',
    city: 'Mielec',
    postalCode: '39-300',
    phone: '171240056',
    mobile: '689012345',
    email: 'barbara.krol@interia.pl',
    nip: '8171234573',
    type: 'individual'
  }
];

// ===========================
// FUNKCJE POMOCNICZE
// ===========================

const generateClientId = (index) => {
  const id = String(index + 1).padStart(6, '0');
  return `CLI2025${id}`;
};

const generatePasswordHash = async (password) => {
  return await bcrypt.hash(password, 10);
};

// ===========================
// GENEROWANIE KLIENTÓW
// ===========================

const generateClients = async () => {
  console.log('\n📝 Tworzenie klientów...\n');
  
  const allClients = [
    ...DEBICA_CLIENTS,
    ...ROPCZYCE_CLIENTS,
    ...MIELEC_CLIENTS
  ];

  const clients = [];
  
  for (let i = 0; i < allClients.length; i++) {
    const template = allClients[i];
    const clientId = generateClientId(i);
    
    // Generuj hasło (np. haslo123 dla wszystkich)
    const passwordHash = await generatePasswordHash('haslo123');
    
    const client = {
      id: clientId,
      name: template.name,
      phone: template.phone,
      email: template.email,
      nip: template.nip,
      address: {
        street: template.street,
        buildingNumber: template.buildingNumber,
        apartmentNumber: template.apartmentNumber,
        city: template.city,
        postalCode: template.postalCode,
        voivodeship: 'Podkarpackie',
        country: 'Polska'
      },
      type: template.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Dodatkowe pola
      mobile: template.mobile || template.phone,
      notes: `Klient z ${template.city}`,
      preferredContactMethod: 'phone',
      // Hasło
      passwordHash: passwordHash,
      passwordSetAt: new Date().toISOString(),
      requirePasswordChange: false,
      isLocked: false,
      failedLoginAttempts: 0
    };

    // Dodaj companyName jeśli firma
    if (template.type === 'company') {
      client.companyName = template.companyName;
    }

    clients.push(client);
    
    console.log(`✅ ${i + 1}. ${template.name} (${template.city})`);
    console.log(`   ├─ ID: ${clientId}`);
    console.log(`   ├─ Adres: ${template.street} ${template.buildingNumber}${template.apartmentNumber ? '/' + template.apartmentNumber : ''}, ${template.postalCode} ${template.city}`);
    console.log(`   ├─ Tel: ${template.phone} / Mob: ${template.mobile}`);
    console.log(`   ├─ Email: ${template.email}`);
    console.log(`   ├─ NIP: ${template.nip}`);
    console.log(`   └─ Typ: ${template.type === 'company' ? '🏢 Firma' : '👤 Osoba prywatna'}`);
    console.log('');
  }

  return clients;
};

// ===========================
// GŁÓWNA FUNKCJA
// ===========================

const main = async () => {
  try {
    // Generuj klientów
    const clients = await generateClients();
    
    console.log('='.repeat(70));
    console.log('\n💾 Zapisywanie do pliku...\n');
    
    // Zapisz klientów
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    console.log(`✅ Zapisano ${clients.length} klientów do: ${CLIENTS_FILE}`);
    
    // Wyczyść zlecenia
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
    console.log(`✅ Wyczyszczono zlecenia: ${ORDERS_FILE}`);
    
    console.log('\n📊 STATYSTYKI:');
    console.log(`   ├─ Dębica: ${DEBICA_CLIENTS.length} klientów`);
    console.log(`   ├─ Ropczyce: ${ROPCZYCE_CLIENTS.length} klientów`);
    console.log(`   ├─ Mielec: ${MIELEC_CLIENTS.length} klientów`);
    console.log(`   └─ RAZEM: ${clients.length} klientów`);
    
    const companies = clients.filter(c => c.type === 'company').length;
    const individuals = clients.filter(c => c.type === 'individual').length;
    
    console.log('\n   ├─ Firmy: ' + companies);
    console.log('   └─ Osoby prywatne: ' + individuals);
    
    console.log('\n🔐 HASŁA:');
    console.log('   Wszystkie klienci mają hasło: haslo123');
    console.log('   (zahashowane bcrypt, można się zalogować)');
    
    console.log('\n✅ GOTOWE! Możesz teraz dodać zlecenia dla tych klientów.\n');
    
  } catch (error) {
    console.error('❌ BŁĄD:', error);
    process.exit(1);
  }
};

// Uruchom
main();
