const fs = require('fs');
const path = require('path');

// Funkcja pomocnicza do generowania dat w przyszłości
function getDateInFuture(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

// Generowanie losowej godziny (8:00 - 17:00)
function randomTime() {
  const hours = 8 + Math.floor(Math.random() * 9); // 8-16
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

// Typy urządzeń AGD
const deviceTypes = [
  { type: 'Pralka', brands: ['Samsung', 'Bosch', 'Whirlpool', 'LG', 'Electrolux'] },
  { type: 'Zmywarka', brands: ['Bosch', 'Siemens', 'Whirlpool', 'Samsung', 'Beko'] },
  { type: 'Lodówka', brands: ['Samsung', 'LG', 'Bosch', 'Whirlpool', 'Amica'] },
  { type: 'Piekarnik', brands: ['Bosch', 'Amica', 'Electrolux', 'Whirlpool', 'Samsung'] },
  { type: 'Kuchenka mikrofalowa', brands: ['Samsung', 'LG', 'Whirlpool', 'Sharp', 'Panasonic'] },
  { type: 'Okap kuchenny', brands: ['Franke', 'Bosch', 'Electrolux', 'Faber', 'Amica'] }
];

// Opisy usterek
const issues = {
  'Pralka': [
    'Nie wiruje, dziwne dźwięki podczas prania',
    'Nie włącza się, brak reakcji na przyciski',
    'Przecieka woda podczas wirowania',
    'Nie grzeje wody, pranie zimną wodą',
    'Błąd E4 na wyświetlaczu',
    'Nie pobiera płynu do płukania'
  ],
  'Zmywarka': [
    'Nie myje naczyń dokładnie, zostają resztki',
    'Nie włącza się, migająca kontrolka',
    'Przecieka woda pod drzwiczkami',
    'Nie grzeje wody',
    'Błąd E15 na wyświetlaczu',
    'Zbyt głośna praca'
  ],
  'Lodówka': [
    'Nie chłodzi wystarczająco, temperatura za wysoka',
    'Zbyt głośna praca, dziwne dźwięki',
    'Zamarza komora chłodnicza',
    'Nie działa zamrażalnik',
    'Przecieka woda wewnątrz',
    'Nie świeci oświetlenie wewnętrzne'
  ],
  'Piekarnik': [
    'Nie nagrzewa się do odpowiedniej temperatury',
    'Nie włącza się, brak reakcji',
    'Nie działa termoobieg',
    'Pęknięta szyba w drzwiczkach',
    'Nie działa grill',
    'Błąd F2 na wyświetlaczu'
  ],
  'Kuchenka mikrofalowa': [
    'Nie grzeje, kręci się talerz ale brak grzania',
    'Nie włącza się',
    'Iskrzy wewnątrz podczas pracy',
    'Nie otwierają się drzwiczki',
    'Głośny hałas podczas pracy'
  ],
  'Okap kuchenny': [
    'Nie działa silnik, brak wyciągu',
    'Nie świeci oświetlenie',
    'Zbyt głośna praca',
    'Nie działa drugi bieg',
    'Nie wyłącza się automatycznie'
  ]
};

// Wczytanie klientów
const clients = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'clients.json'), 'utf-8'));

// Generowanie zleceń
const orders = [];
let orderSeq = 1;
let visitSeq = 1;

// Dla każdego klienta generuj 1-2 zlecenia
clients.forEach((client, index) => {
  const numOrders = Math.random() < 0.7 ? 1 : 2; // 70% ma jedno zlecenie, 30% ma dwa
  
  for (let i = 0; i < numOrders; i++) {
    // Losuj urządzenie
    const device = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const brand = device.brands[Math.floor(Math.random() * device.brands.length)];
    const issueList = issues[device.type];
    const description = issueList[Math.floor(Math.random() * issueList.length)];
    
    // Priorytet
    const priorities = ['low', 'medium', 'high'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Data utworzenia (ostatnie 2 tygodnie)
    const createdDaysAgo = Math.floor(Math.random() * 14);
    
    // Generuj wizyty dla tego zlecenia
    const visits = [];
    const numVisits = Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3; // 40% jedna wizyta, 30% dwie, 30% trzy
    
    // Pierwsza wizyta - diagnoza (zawsze)
    const diagnosisDate = getDateInFuture(Math.floor(Math.random() * 7) + 1); // 1-7 dni w przyszłości
    visits.push({
      visitId: `VIS2527${visitSeq.toString().padStart(5, '0')}`,
      visitNumber: 1,
      type: 'diagnosis',
      scheduledDate: diagnosisDate.split('T')[0],
      scheduledTime: randomTime(),
      estimatedDuration: 60,
      status: Math.random() < 0.3 ? 'completed' : 'scheduled',
      technicianId: 'EMP25189001',
      technicianName: 'Jan Nowak',
      notes: 'Pierwsza wizyta - diagnoza usterki'
    });
    visitSeq++;
    
    // Druga wizyta - naprawa (jeśli potrzeba)
    if (numVisits >= 2) {
      const repairDate = getDateInFuture(Math.floor(Math.random() * 10) + 8); // 8-17 dni w przyszłości
      visits.push({
        visitId: `VIS2527${visitSeq.toString().padStart(5, '0')}`,
        visitNumber: 2,
        type: 'repair',
        scheduledDate: repairDate.split('T')[0],
        scheduledTime: randomTime(),
        estimatedDuration: 90,
        status: visits[0].status === 'completed' && Math.random() < 0.5 ? 'scheduled' : 'pending',
        technicianId: 'EMP25189001',
        technicianName: 'Jan Nowak',
        notes: visits[0].status === 'completed' ? 'Naprawa po diagnozie' : 'Czeka na diagnozę',
        partsNeeded: visits[0].status === 'completed' ? ['Pompa odpływowa', 'Uszczelka'] : undefined
      });
      visitSeq++;
    }
    
    // Trzecia wizyta - kontrola (jeśli potrzeba)
    if (numVisits >= 3) {
      const controlDate = getDateInFuture(Math.floor(Math.random() * 10) + 18); // 18-27 dni w przyszłości
      visits.push({
        visitId: `VIS2527${visitSeq.toString().padStart(5, '0')}`,
        visitNumber: 3,
        type: 'control',
        scheduledDate: controlDate.split('T')[0],
        scheduledTime: randomTime(),
        estimatedDuration: 30,
        status: 'pending',
        technicianId: 'EMP25189001',
        technicianName: 'Jan Nowak',
        notes: 'Kontrola jakości naprawy'
      });
      visitSeq++;
    }
    
    // Tworzymy zlecenie
    const orderNumber = `ORDA2527${orderSeq.toString().padStart(4, '0')}`;
    const order = {
      id: 1000 + orderSeq,
      orderNumber: orderNumber,
      clientId: client.clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      phone: client.phone,
      email: client.email,
      address: `${client.address}, ${client.city}`,
      city: client.city,
      postalCode: client.postalCode,
      deviceType: device.type,
      brand: brand,
      model: `Model ${Math.floor(Math.random() * 900) + 100}`,
      serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      description: description,
      priority: priority,
      status: visits[0].status === 'completed' ? 'in_progress' : 'scheduled',
      visits: visits,
      createdAt: getDateInFuture(-createdDaysAgo),
      updatedAt: getDateInFuture(-Math.floor(createdDaysAgo / 2))
    };
    
    orders.push(order);
    orderSeq++;
  }
});

// Zapisz do pliku
const ordersPath = path.join(__dirname, 'data', 'orders.json');
fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf-8');

console.log(`✅ Wygenerowano ${orders.length} zleceń`);
console.log(`✅ Łącznie ${visitSeq - 1} wizyt`);
console.log(`✅ Zapisano do: ${ordersPath}`);

// Statystyki
const statusCount = {
  scheduled: 0,
  in_progress: 0,
  completed: 0,
  pending: 0
};

const visitTypeCount = {
  diagnosis: 0,
  repair: 0,
  control: 0
};

orders.forEach(order => {
  order.visits.forEach(visit => {
    statusCount[visit.status] = (statusCount[visit.status] || 0) + 1;
    visitTypeCount[visit.type] = (visitTypeCount[visit.type] || 0) + 1;
  });
});

console.log('\n📊 Statystyki wizyt:');
console.log(`   - Diagnoza: ${visitTypeCount.diagnosis}`);
console.log(`   - Naprawa: ${visitTypeCount.repair}`);
console.log(`   - Kontrola: ${visitTypeCount.control}`);
console.log('\n📊 Statystyki statusów:');
console.log(`   - Scheduled: ${statusCount.scheduled}`);
console.log(`   - In Progress: ${statusCount.in_progress}`);
console.log(`   - Completed: ${statusCount.completed}`);
console.log(`   - Pending: ${statusCount.pending}`);
