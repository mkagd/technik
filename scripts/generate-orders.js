// 📋 GENERATOR ZLECEŃ DLA KLIENTÓW
// Generuje realistyczne zlecenia AGD dla klientów z Dębicy, Ropczyc i Mielca

const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '..', 'data', 'clients.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const EMPLOYEES_FILE = path.join(__dirname, '..', 'data', 'employees.json');

console.log('📋 GENERATOR ZLECEŃ AGD\n');
console.log('='.repeat(70));

// ===========================
// DANE
// ===========================

const AGD_TYPES = [
  'Lodówka', 'Pralka', 'Zmywarka', 'Piekarnik', 'Kuchenka', 
  'Mikrofalówka', 'Okap', 'Płyta indukcyjna', 'Suszarka', 
  'Zamrażarka', 'Ekspres do kawy'
];

const BRANDS = {
  'Lodówka': ['Bosch', 'Samsung', 'LG', 'Whirlpool', 'Electrolux', 'Beko'],
  'Pralka': ['Bosch', 'Samsung', 'LG', 'Whirlpool', 'Electrolux', 'Beko', 'Amica'],
  'Zmywarka': ['Bosch', 'Siemens', 'Whirlpool', 'Electrolux', 'Beko'],
  'Piekarnik': ['Bosch', 'Siemens', 'Electrolux', 'Samsung', 'Whirlpool'],
  'Kuchenka': ['Bosch', 'Amica', 'Electrolux', 'Beko'],
  'Mikrofalówka': ['Samsung', 'LG', 'Whirlpool', 'Sharp'],
  'Okap': ['Bosch', 'Faber', 'Electrolux', 'Amica'],
  'Płyta indukcyjna': ['Bosch', 'Siemens', 'Electrolux', 'Samsung'],
  'Suszarka': ['Bosch', 'Samsung', 'LG', 'Whirlpool', 'Beko'],
  'Zamrażarka': ['Bosch', 'Samsung', 'LG', 'Whirlpool', 'Beko'],
  'Ekspres do kawy': ['Bosch', 'Siemens', 'DeLonghi', 'Philips', 'Krups']
};

const ISSUES = {
  'Lodówka': [
    'Nie chłodzi',
    'Hałasuje',
    'Lód w zamrażarce',
    'Nie działa oświetlenie',
    'Wyciek wody'
  ],
  'Pralka': [
    'Nie wiruje',
    'Wyciek wody',
    'Nie grzeje wody',
    'Hałasuje przy wirówce',
    'Nie kończy programu',
    'Błąd E15'
  ],
  'Zmywarka': [
    'Nie napełnia się wodą',
    'Nie grzeje',
    'Nie kończy cyklu',
    'Wyciek wody',
    'Nie otwiera pojemnik na tabletki'
  ],
  'Piekarnik': [
    'Nie grzeje',
    'Nie działa termoobieg',
    'Uszkodzone drzwi',
    'Błąd wyświetlacza',
    'Nie włącza się'
  ],
  'Kuchenka': [
    'Nie zapala się palnik',
    'Nie działa piekarnik',
    'Uszkodzona płyta',
    'Nie działa iskrownik'
  ],
  'Mikrofalówka': [
    'Nie grzeje',
    'Iskrzy w środku',
    'Nie obraca się talerz',
    'Nie włącza się',
    'Uszkodzone drzwi'
  ],
  'Okap': [
    'Nie działa wentylator',
    'Hałasuje',
    'Nie działa oświetlenie',
    'Słabe ssanie'
  ],
  'Płyta indukcyjna': [
    'Nie włącza się pole',
    'Błąd E0',
    'Nie rozpoznaje garnków',
    'Uszkodzony wyświetlacz'
  ],
  'Suszarka': [
    'Nie grzeje',
    'Nie obraca się bęben',
    'Hałasuje',
    'Błąd F01',
    'Nie kończy programu'
  ],
  'Zamrażarka': [
    'Nie zamraża',
    'Hałasuje',
    'Wyciek wody',
    'Nie działa oświetlenie'
  ],
  'Ekspres do kawy': [
    'Nie parzy kawy',
    'Wyciek wody',
    'Nie grzeje',
    'Błąd odkamieniania',
    'Słaba kawa'
  ]
};

const STATUSES = [
  { status: 'pending', weight: 3 },      // 30%
  { status: 'in-progress', weight: 2 },  // 20%
  { status: 'completed', weight: 3 },    // 30%
  { status: 'cancelled', weight: 1 },    // 10%
  { status: 'scheduled', weight: 1 }     // 10%
];

// ===========================
// FUNKCJE POMOCNICZE
// ===========================

const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomDate = (daysBack) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
};

const weightedRandom = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.status;
  }
  
  return items[0].status;
};

const generateOrderId = (index) => {
  const id = String(index + 1).padStart(6, '0');
  return `ORD2025${id}`;
};

// ===========================
// GENEROWANIE ZLECEŃ
// ===========================

const generateOrders = (clients, employees) => {
  console.log('\n📝 Tworzenie zleceń...\n');
  
  const orders = [];
  const ordersPerClient = 2; // Każdy klient dostanie 2-3 zlecenia
  
  clients.forEach((client, clientIndex) => {
    const numOrders = Math.random() > 0.5 ? 3 : 2;
    
    for (let i = 0; i < numOrders; i++) {
      const orderIndex = orders.length;
      const orderId = generateOrderId(orderIndex);
      
      const agdType = randomItem(AGD_TYPES);
      const brand = randomItem(BRANDS[agdType]);
      const issue = randomItem(ISSUES[agdType]);
      const status = weightedRandom(STATUSES);
      
      // Losowy pracownik
      const assignedEmployee = randomItem(employees);
      
      // Data zlecenia (ostatnie 30 dni)
      const createdAt = randomDate(30);
      
      // Priority (80% normalny, 15% wysoki, 5% pilny)
      let priority = 'normal';
      const rand = Math.random();
      if (rand > 0.95) priority = 'urgent';
      else if (rand > 0.80) priority = 'high';
      
      const order = {
        id: orderId,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        clientAddress: client.address,
        
        // Dane urządzenia
        deviceType: agdType,
        brand: brand,
        model: `${brand} ${Math.floor(Math.random() * 9000) + 1000}`,
        serialNumber: `SN${Math.floor(Math.random() * 900000) + 100000}`,
        
        // Opis problemu
        issueDescription: issue,
        detailedDescription: `${issue}. Klient zgłasza problem z urządzeniem ${agdType} ${brand}.`,
        
        // Status
        status: status,
        priority: priority,
        
        // Przydzielenie
        assignedTo: status === 'pending' ? null : assignedEmployee.id,
        assignedToName: status === 'pending' ? null : assignedEmployee.name,
        
        // Daty
        createdAt: createdAt,
        updatedAt: createdAt,
        scheduledDate: status === 'scheduled' ? randomDate(7) : null,
        completedAt: status === 'completed' ? randomDate(7) : null,
        
        // Koszty (dla completed)
        estimatedCost: Math.floor(Math.random() * 300) + 100,
        finalCost: status === 'completed' ? Math.floor(Math.random() * 350) + 120 : null,
        
        // Inne
        warranty: Math.random() > 0.7,
        source: randomItem(['phone', 'email', 'website', 'walk-in']),
        notes: `Zlecenie z ${client.address.city}`,
        
        // Historia statusów
        statusHistory: [
          {
            status: 'pending',
            timestamp: createdAt,
            note: 'Zlecenie utworzone'
          }
        ]
      };
      
      // Dodaj historię statusów dla nie-pending
      if (status !== 'pending') {
        order.statusHistory.push({
          status: 'in-progress',
          timestamp: randomDate(20),
          note: `Przydzielono do ${assignedEmployee.name}`,
          changedBy: assignedEmployee.id
        });
      }
      
      if (status === 'completed') {
        order.statusHistory.push({
          status: 'completed',
          timestamp: order.completedAt,
          note: 'Naprawa zakończona',
          changedBy: assignedEmployee.id
        });
      }
      
      orders.push(order);
      
      const statusEmoji = {
        'pending': '⏳',
        'in-progress': '🔧',
        'completed': '✅',
        'cancelled': '❌',
        'scheduled': '📅'
      };
      
      console.log(`${orderIndex + 1}. ${orderId} - ${client.name}`);
      console.log(`   ├─ Urządzenie: ${agdType} ${brand}`);
      console.log(`   ├─ Problem: ${issue}`);
      console.log(`   ├─ Status: ${statusEmoji[status]} ${status}`);
      console.log(`   ├─ Priorytet: ${priority}`);
      console.log(`   └─ Przydzielone: ${order.assignedToName || 'Brak'}`);
      console.log('');
    }
  });
  
  return orders;
};

// ===========================
// GŁÓWNA FUNKCJA
// ===========================

const main = () => {
  try {
    // Wczytaj klientów
    const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
    console.log(`\n📊 Wczytano ${clients.length} klientów`);
    
    // Wczytaj pracowników
    const employees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));
    console.log(`📊 Wczytano ${employees.length} pracowników`);
    
    // Generuj zlecenia
    const orders = generateOrders(clients, employees);
    
    console.log('='.repeat(70));
    console.log('\n💾 Zapisywanie do pliku...\n');
    
    // Zapisz zlecenia
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log(`✅ Zapisano ${orders.length} zleceń do: ${ORDERS_FILE}`);
    
    // Statystyki
    const byStatus = {};
    const byCity = {};
    const byPriority = {};
    
    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      byCity[order.clientAddress.city] = (byCity[order.clientAddress.city] || 0) + 1;
      byPriority[order.priority] = (byPriority[order.priority] || 0) + 1;
    });
    
    console.log('\n📊 STATYSTYKI ZLECEŃ:');
    console.log('\n   Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ├─ ${status}: ${count}`);
    });
    
    console.log('\n   Miasto:');
    Object.entries(byCity).forEach(([city, count]) => {
      console.log(`   ├─ ${city}: ${count}`);
    });
    
    console.log('\n   Priorytet:');
    Object.entries(byPriority).forEach(([priority, count]) => {
      console.log(`   ├─ ${priority}: ${count}`);
    });
    
    console.log('\n✅ GOTOWE! System jest gotowy do testowania.\n');
    
  } catch (error) {
    console.error('❌ BŁĄD:', error);
    process.exit(1);
  }
};

// Uruchom
main();
