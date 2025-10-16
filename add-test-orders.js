const fs = require('fs');
const path = require('path');
const {generateOrderId} = require('./utils/id-generator.js');

const ordersFile = path.join(__dirname, 'data', 'orders.json');
let orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));

const now = new Date().toISOString();

// Zlecenie 1 - Tarnów (admin-panel)
const order1 = {
  id: generateOrderId(orders, new Date(), 'admin-panel'),
  clientId: 'CLI2025000025',
  clientName: 'Marek Wiśniewski',
  clientPhone: '146820123',
  clientEmail: 'marek.wisniewski@gmail.com',
  clientAddress: {
    street: 'ul. Krakowska',
    buildingNumber: '45',
    apartmentNumber: '12',
    city: 'Tarnów',
    postalCode: '33-100',
    voivodeship: 'Małopolskie',
    country: 'Polska'
  },
  serviceAddress: 'ul. Krakowska 45/12, 33-100 Tarnów',
  deviceType: 'Pralka',
  brand: 'Bosch',
  model: 'WAT28461PL',
  issueDescription: 'Pralka nie wiruje, tylko płucze',
  status: 'pending',
  priority: 'high',
  preferredDate: '2025-10-14',
  preferredTime: '10:00-12:00',
  notes: 'Nowe zlecenie z Tarnowa - admin panel',
  createdAt: now,
  updatedAt: now,
  source: 'admin-panel',
  statusHistory: [{ status: 'pending', changedAt: now, notes: 'Utworzone przez admina' }],
  devices: [{
    deviceIndex: 0,
    deviceType: 'Pralka',
    brand: 'Bosch',
    model: 'WAT28461PL',
    issueDescription: 'Pralka nie wiruje, tylko płucze',
    status: 'active'
  }]
};

// Zlecenie 2 - Dębica (web-form)
const order2 = {
  id: generateOrderId([...orders, order1], new Date(), 'web-form'),
  clientId: 'CLI2025000026',
  clientName: 'Joanna Kaczmarek',
  clientPhone: '146825678',
  clientEmail: 'joanna.kaczmarek@onet.pl',
  clientAddress: {
    street: 'ul. Słowackiego',
    buildingNumber: '78',
    city: 'Dębica',
    postalCode: '39-200',
    voivodeship: 'Podkarpackie',
    country: 'Polska'
  },
  serviceAddress: 'ul. Słowackiego 78, 39-200 Dębica',
  deviceType: 'Lodówka',
  brand: 'Samsung',
  model: 'RB37J5000SA',
  issueDescription: 'Nie chłodzi, słychać dziwne dźwięki',
  status: 'pending',
  priority: 'urgent',
  preferredDate: '2025-10-12',
  preferredTime: '14:00-16:00',
  notes: 'Zlecenie z Dębicy - formularz webowy',
  createdAt: now,
  updatedAt: now,
  source: 'web-form',
  statusHistory: [{ status: 'pending', changedAt: now, notes: 'Utworzone przez klienta' }],
  devices: [{
    deviceIndex: 0,
    deviceType: 'Lodówka',
    brand: 'Samsung',
    model: 'RB37J5000SA',
    issueDescription: 'Nie chłodzi, słychać dziwne dźwięki',
    status: 'active'
  }]
};

// Zlecenie 3 - Mielec (mobile-app)
const order3 = {
  id: generateOrderId([...orders, order1, order2], new Date(), 'mobile-app'),
  clientId: 'CLI2025000027',
  clientName: 'Andrzej Kowalczyk',
  clientPhone: '171234567',
  clientEmail: 'andrzej.kowalczyk@wp.pl',
  clientAddress: {
    street: 'ul. Żeromskiego',
    buildingNumber: '33',
    apartmentNumber: '5',
    city: 'Mielec',
    postalCode: '39-300',
    voivodeship: 'Podkarpackie',
    country: 'Polska'
  },
  serviceAddress: 'ul. Żeromskiego 33/5, 39-300 Mielec',
  deviceType: 'Zmywarka',
  brand: 'Whirlpool',
  model: 'WFC 3C26',
  issueDescription: 'Błąd F6, zmywarka nie pobiera wody',
  status: 'pending',
  priority: 'normal',
  preferredDate: '2025-10-13',
  preferredTime: '8:00-10:00',
  notes: 'Zlecenie z Mielca - aplikacja mobilna',
  createdAt: now,
  updatedAt: now,
  source: 'mobile-app',
  statusHistory: [{ status: 'pending', changedAt: now, notes: 'Utworzone przez technika' }],
  devices: [{
    deviceIndex: 0,
    deviceType: 'Zmywarka',
    brand: 'Whirlpool',
    model: 'WFC 3C26',
    issueDescription: 'Błąd F6, zmywarka nie pobiera wody',
    status: 'active'
  }]
};

orders.unshift(order3, order2, order1);
fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

console.log('✅ Dodano 3 nowe zlecenia:');
console.log('1️⃣', order1.id, '- Tarnów (admin) -', order1.clientName, '-', order1.deviceType, order1.brand);
console.log('2️⃣', order2.id, '- Dębica (web) -', order2.clientName, '-', order2.deviceType, order2.brand);
console.log('3️⃣', order3.id, '- Mielec (mobile) -', order3.clientName, '-', order3.deviceType, order3.brand);
console.log('\n📊 Teraz masz', orders.length, 'zleceń w sumie');
