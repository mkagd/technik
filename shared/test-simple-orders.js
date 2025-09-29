/**
 * TEST PROSTEJ STRUKTURY ORDERS + WIZYT
 * 
 * Test API /api/orders z nową prostą strukturą:
 * ✅ Poprawne clientId (CLI25186001)
 * ✅ System wizyt (visitId, appointmentDate)
 * ✅ Nowy format ID (ORDA)
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test cases
const TEST_ORDERS = [
  {
    name: "Zwykłe zlecenie bez wizyty",
    data: {
      clientId: "CLI25186001", // Mariusz Bielaszka
      category: "Serwis AGD",
      deviceType: "Pralka",
      brand: "Samsung",
      model: "WW70J5346MW",
      description: "Pralka nie wiruje, pranie zostaje mokre. Problem wystąpił nagle wczoraj.",
      symptoms: ["Nie wiruje", "Mokre pranie"],
      priority: "medium",
      estimatedCost: 150.00,
      clientNotes: "Proszę dzwonić przed przyjazdem",
      scheduledDate: "2025-09-30T14:00:00Z"
    }
  },
  {
    name: "Zlecenie z wizytą",
    data: {
      clientId: "CLI25186002", // Kręgielnia Laguna
      category: "Naprawa sprzętu",
      deviceType: "Komputer",
      brand: "Dell",
      model: "OptiPlex",
      description: "Komputer nie uruchamia się, tylko mruga dioda zasilania.",
      symptoms: ["Nie uruchamia się", "Mruga dioda", "Brak obrazu"],
      priority: "high",
      estimatedCost: 200.00,
      
      // NOWY: System wizyt
      visitId: "VIS25292001",
      appointmentDate: "2025-09-30T10:00:00Z",
      appointmentTime: "10:00",
      visitStatus: "planned",
      technicianId: "EMP25292001",
      technicianNotes: "Wizyta w firmie, dostęp przez recepcję",
      
      clientAvailability: "Poniedziałek-piątek 8:00-18:00",
      preferredTime: "Rano",
      internalNotes: "Firma - wystawić fakturę VAT"
    }
  },
  {
    name: "Pilne zlecenie AGD",
    data: {
      clientId: "CLI25186001", // Mariusz Bielaszka ponownie
      category: "Serwis AGD",
      deviceType: "Lodówka",
      brand: "Bosch",
      model: "KGN39VL35",
      description: "Lodówka przestała chłodzić, wszystkie produkty się psują!",
      symptoms: ["Nie chłodzi", "Ciepło w środku", "Kompresor nie pracuje"],
      priority: "urgent",
      estimatedCost: 300.00,
      
      // Wizyta pilna
      visitId: "VIS25292002", 
      appointmentDate: "2025-09-29T16:00:00Z",
      appointmentTime: "16:00",
      visitStatus: "confirmed",
      technicianId: "EMP25292001",
      technicianNotes: "PILNE! Klient ma małe dziecko, produkty się psują",
      
      clientNotes: "Bardzo pilne, mam niemowlę!",
      warrantyMonths: 12
    }
  }
];

async function testOrdersAPI() {
  console.log('🧪 TESTOWANIE PROSTEJ STRUKTURY ORDERS + WIZYT');
  console.log('=' .repeat(60));
  
  let createdOrders = [];
  
  // Test 1: Tworzenie zleceń
  console.log('\n📝 TEST 1: Tworzenie nowych zleceń');
  for (const testCase of TEST_ORDERS) {
    try {
      console.log(`\n⏳ Tworzę: ${testCase.name}`);
      
      const response = await axios.post(`${API_BASE}/orders`, testCase.data);
      
      if (response.status === 201) {
        const order = response.data.order;
        createdOrders.push(order);
        
        console.log(`✅ Utworzono: ${order.orderNumber}`);
        console.log(`   📋 Klient: ${order.clientName} (${order.clientId})`);
        console.log(`   🔧 Urządzenie: ${order.brand} ${order.model}`);
        console.log(`   📅 Status: ${order.status} (${order.priority})`);
        
        if (order.visitId) {
          console.log(`   🏠 Wizyta: ${order.visitId} na ${order.appointmentDate}`);
          console.log(`   👨‍🔧 Technik: ${order.technicianId}`);
          console.log(`   📝 Notatki: ${order.technicianNotes}`);
        }
        
        console.log(`   💰 Koszt: ${order.estimatedCost} zł`);
      }
      
    } catch (error) {
      console.log(`❌ Błąd: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err}`);
        });
      }
    }
  }
  
  // Test 2: Pobieranie zleceń
  console.log('\n📄 TEST 2: Pobieranie wszystkich zleceń');
  try {
    const response = await axios.get(`${API_BASE}/orders`);
    const orders = response.data.orders;
    
    console.log(`✅ Pobrano ${orders.length} zleceń`);
    
    // Statystyki
    const stats = {
      total: orders.length,
      withVisits: orders.filter(o => o.visitId).length,
      byStatus: {},
      byPriority: {},
      byClient: {}
    };
    
    orders.forEach(order => {
      // Status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      
      // Priorytet  
      stats.byPriority[order.priority] = (stats.byPriority[order.priority] || 0) + 1;
      
      // Klient
      const clientKey = `${order.clientName} (${order.clientId})`;
      stats.byClient[clientKey] = (stats.byClient[clientKey] || 0) + 1;
    });
    
    console.log('\n📊 STATYSTYKI:');
    console.log(`   📋 Wszystkich zleceń: ${stats.total}`);
    console.log(`   🏠 Z wizytami: ${stats.withVisits}`);
    
    console.log('\n   📌 Według statusu:');
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });
    
    console.log('\n   ⚡ Według priorytetu:');
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      console.log(`     ${priority}: ${count}`);
    });
    
    console.log('\n   👥 Według klientów:');
    Object.entries(stats.byClient).forEach(([client, count]) => {
      console.log(`     ${client}: ${count} zleceń`);
    });
    
  } catch (error) {
    console.log(`❌ Błąd pobierania: ${error.message}`);
  }
  
  // Test 3: Walidacja błędnych danych
  console.log('\n❌ TEST 3: Walidacja błędnych danych');
  
  const invalidTests = [
    {
      name: "Brak clientId",
      data: { category: "Test", description: "Test bez clientId" }
    },
    {
      name: "Niepoprawny format clientId", 
      data: { clientId: "WRONG123", category: "Test", description: "Zły format ID" }
    },
    {
      name: "Nieistniejący klient",
      data: { clientId: "CLI99999999", category: "Test", description: "Nieistniejący klient" }
    },
    {
      name: "Za krótki opis",
      data: { clientId: "CLI25186001", category: "Test", description: "Krótki" }
    }
  ];
  
  for (const invalidTest of invalidTests) {
    try {
      console.log(`\n⏳ Test: ${invalidTest.name}`);
      await axios.post(`${API_BASE}/orders`, invalidTest.data);
      console.log(`❌ Powinien być błąd!`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`✅ Prawidłowo odrzucone: ${error.response.data.message}`);
        if (error.response.data.errors) {
          error.response.data.errors.forEach(err => {
            console.log(`   - ${err}`);
          });
        }
      } else {
        console.log(`❌ Nieoczekiwany błąd: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎉 TESTY ZAKOŃCZONE!');
  console.log(`📊 Utworzono ${createdOrders.length} nowych zleceń z prostą strukturą + wizytami`);
}

// Uruchom testy
if (require.main === module) {
  testOrdersAPI().catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testOrdersAPI };