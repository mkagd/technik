// test-multi-device-order.js
// Skrypt do utworzenia testowego zamówienia z wieloma urządzeniami

const fs = require('fs');
const path = require('path');

// Funkcje pomocnicze z id-generator
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

function generateVisitId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `VIS-${timestamp}-${random}`;
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const sequential = Math.floor(Math.random() * 9999) + 1;
  return `ORDA-${year}-${sequential.toString().padStart(4, '0')}`;
}

function generateClientId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CLI-${timestamp}-${random}`;
}

async function createTestOrder() {
  console.log('🧪 Tworzenie testowego zamówienia z 2 urządzeniami...\n');

  const ordersPath = path.join(__dirname, 'data', 'orders.json');
  
  // Odczytaj istniejące zamówienia
  let orders = [];
  try {
    const data = fs.readFileSync(ordersPath, 'utf8');
    orders = JSON.parse(data);
    console.log(`✅ Załadowano ${orders.length} istniejących zamówień`);
  } catch (error) {
    console.error('❌ Błąd odczytu orders.json:', error);
    return;
  }

  // Utwórz ID
  const orderId = generateOrderId();
  const orderNumber = generateOrderNumber();
  const clientId = generateClientId();
  const visitId = generateVisitId();

  // Utwórz testowe zamówienie
  const testOrder = {
    id: orderId,
    orderNumber: orderNumber,
    clientId: clientId,
    clientName: 'TEST - Jan Testowy',
    clientPhone: '123456789',
    email: 'test@example.com',
    address: 'ul. Testowa 123',
    city: 'Warszawa',
    postalCode: '00-001',
    
    // ✅ DEVICES ARRAY - 2 urządzenia
    devices: [
      {
        deviceIndex: 0,
        deviceType: 'Pralka',
        brand: 'Samsung',
        model: 'WW90K6414QW',
        serialNumber: 'SN-TEST-PRALKA-001',
        productionYear: '2023',
        purchaseDate: '2023-01-15'
      },
      {
        deviceIndex: 1,
        deviceType: 'Zmywarka',
        brand: 'Bosch',
        model: 'SMS46GI01E',
        serialNumber: 'SN-TEST-ZMYWARKA-001',
        productionYear: '2022',
        purchaseDate: '2022-11-20'
      }
    ],
    
    // Backward compatibility (opcjonalnie - dla starszych części systemu)
    deviceType: 'Pralka',
    brand: 'Samsung',
    model: 'WW90K6414QW',
    serialNumber: 'SN-TEST-PRALKA-001',
    
    description: 'TEST - Zamówienie testowe systemu wielourządzeniowego. Pralka nie wiruje, zmywarka nie grzeje wody.',
    status: 'zaplanowane',
    priority: 'normal',
    source: 'web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // ✅ WIZYTA z deviceModels[]
    visits: [
      {
        visitId: visitId,
        date: new Date().toISOString().split('T')[0], // Dzisiejsza data
        time: '10:00',
        type: 'diagnosis',
        status: 'scheduled',
        employeeId: 'EMP-001', // Zakładam że istnieje
        employeeName: 'Technik Testowy',
        notes: 'TEST - Wizyta diagnostyczna dla obu urządzeń',
        createdAt: new Date().toISOString(),
        
        // ✅ Pusta tablica deviceModels - wypełniona podczas skanowania
        deviceModels: [
          {
            deviceIndex: 0,
            models: [] // Pusta - wypełniona po zeskanowaniu tabliczki
          },
          {
            deviceIndex: 1,
            models: [] // Pusta - wypełniona po zeskanowaniu tabliczki
          }
        ]
      }
    ],
    
    comments: [
      {
        id: 'COM-001',
        author: 'System',
        text: 'Testowe zamówienie utworzone automatycznie',
        timestamp: new Date().toISOString(),
        type: 'system'
      }
    ]
  };

  // Dodaj do tablicy
  orders.push(testOrder);

  // Zapisz
  try {
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');
    console.log('\n✅ SUKCES! Utworzono testowe zamówienie:\n');
    console.log(`📋 Order ID: ${orderId}`);
    console.log(`📋 Order Number: ${orderNumber}`);
    console.log(`👤 Client ID: ${clientId}`);
    console.log(`📅 Visit ID: ${visitId}`);
    console.log(`\n🔧 Urządzenia:`);
    console.log(`   1. ${testOrder.devices[0].deviceType} - ${testOrder.devices[0].brand} ${testOrder.devices[0].model}`);
    console.log(`   2. ${testOrder.devices[1].deviceType} - ${testOrder.devices[1].brand} ${testOrder.devices[1].model}`);
    console.log(`\n📍 Łącza testowe:`);
    console.log(`   Admin Panel: http://localhost:3000/admin/zamowienia/${orderId}`);
    console.log(`   Technik Panel: http://localhost:3000/technician/visit/${visitId}`);
    console.log(`\n🧪 Instrukcja testowania:`);
    console.log(`   1. Otwórz panel technika (link powyżej)`);
    console.log(`   2. Zobaczysz 2 zakładki: "Pralka - Samsung" i "Zmywarka - Bosch"`);
    console.log(`   3. Kliknij zakładkę "Pralka", następnie "Zeskanuj tabliczkę znamionową"`);
    console.log(`   4. Dodaj testowe modele dla pralki, zapisz`);
    console.log(`   5. Przełącz się na zakładkę "Zmywarka"`);
    console.log(`   6. Dodaj testowe modele dla zmywarki, zapisz`);
    console.log(`   7. Sprawdź w panelu admina że oba urządzenia mają oddzielne dane\n`);
    
    // Zapisz info do pliku
    const testInfoPath = path.join(__dirname, 'TEST_ORDER_INFO.txt');
    const testInfo = `
===========================================
TESTOWE ZAMÓWIENIE WIELOURZĄDZENIOWE
===========================================

Data utworzenia: ${new Date().toLocaleString('pl-PL')}

IDs:
- Order ID: ${orderId}
- Order Number: ${orderNumber}
- Client ID: ${clientId}
- Visit ID: ${visitId}

Urządzenia:
1. Pralka - Samsung WW90K6414QW (S/N: SN-TEST-PRALKA-001)
2. Zmywarka - Bosch SMS46GI01E (S/N: SN-TEST-ZMYWARKA-001)

Łącza:
- Admin: http://localhost:3000/admin/zamowienia/${orderId}
- Technik: http://localhost:3000/technician/visit/${visitId}

Status: zaplanowane
Wizyta: ${new Date().toISOString().split('T')[0]} o 10:00

===========================================
    `.trim();
    
    fs.writeFileSync(testInfoPath, testInfo, 'utf8');
    console.log(`💾 Zapisano informacje testowe do: TEST_ORDER_INFO.txt\n`);
    
  } catch (error) {
    console.error('❌ Błąd zapisu:', error);
  }
}

// Uruchom
createTestOrder().catch(console.error);
