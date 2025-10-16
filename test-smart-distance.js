// test-smart-distance.js
// 🧪 Test SmartDistanceService (Hybrid OSRM + Google)

import SmartDistanceService from './distance-matrix/SmartDistanceService.js';

(async () => {
  console.log('🧪 Test SmartDistanceService - Hybrid OSRM + Google\n');
  console.log('='.repeat(60));
  
  // Inicjalizacja
  const service = new SmartDistanceService({
    companyLocation: {
      lat: 50.0647,
      lng: 19.9450,
      name: 'Kraków (siedziba)'
    }
  });
  
  console.log('\n📍 Lokalizacja firmy:', service.companyLocation.name);
  console.log('🔧 Google API:', service.googleEnabled ? '✅ Dostępny' : '❌ Niedostępny');
  console.log('\n' + '='.repeat(60));
  
  // Test 1: Podstawowa kalkulacja (OSRM)
  console.log('\n🧪 TEST 1: Odległość Kraków → Pacanów (OSRM)');
  console.log('-'.repeat(60));
  
  try {
    const result1 = await service.calculateDistance(
      { lat: 50.0647, lng: 19.9450 }, // Kraków
      { lat: 50.3872, lng: 21.0400 }  // Pacanów
    );
    
    console.log('✅ Wynik:');
    console.log(`   Odległość: ${result1.distance.text}`);
    console.log(`   Czas: ${result1.duration.text}`);
    console.log(`   Źródło: ${result1.source}`);
    console.log(`   Koszt: ${result1.cost} zł`);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
  
  // Test 2: Od firmy do klienta
  console.log('\n🧪 TEST 2: Od siedziby do Mielca (funkcja pomocnicza)');
  console.log('-'.repeat(60));
  
  try {
    const result2 = await service.calculateDistanceFromCompany(
      { lat: 50.2804, lng: 19.5598 } // Mielec
    );
    
    console.log('✅ Wynik:');
    console.log(`   Odległość: ${result2.distance.text}`);
    console.log(`   Czas: ${result2.duration.text}`);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
  
  // Test 3: Z aktualnym ruchem (Google, jeśli dostępny)
  console.log('\n🧪 TEST 3: Kraków → Rzeszów (z ruchem, jeśli Google dostępny)');
  console.log('-'.repeat(60));
  
  try {
    const result3 = await service.calculateDistance(
      { lat: 50.0647, lng: 19.9450 }, // Kraków
      { lat: 50.0412, lng: 21.9991 }, // Rzeszów
      { includeTraffic: true }
    );
    
    console.log('✅ Wynik:');
    console.log(`   Odległość: ${result3.distance.text}`);
    console.log(`   Czas (bez ruchu): ${result3.duration.text}`);
    
    if (result3.duration_in_traffic) {
      console.log(`   Czas (z ruchem): ${result3.duration_in_traffic.text}`);
      console.log(`   Opóźnienie: ${result3.traffic_delay.text}`);
      console.log(`   Źródło ruchu: ${result3.traffic_source}`);
    } else {
      console.log('   ℹ️  Dane o ruchu niedostępne (brak Google API)');
    }
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
  
  // Test 4: Sortowanie zleceń
  console.log('\n🧪 TEST 4: Sortowanie zleceń po odległości');
  console.log('-'.repeat(60));
  
  const testOrders = [
    {
      id: 'ORD001',
      city: 'Pacanów',
      clientLocation: { coordinates: { lat: 50.3872, lng: 21.0400 } }
    },
    {
      id: 'ORD002',
      city: 'Mielec',
      clientLocation: { coordinates: { lat: 50.2804, lng: 19.5598 } }
    },
    {
      id: 'ORD003',
      city: 'Rzeszów',
      clientLocation: { coordinates: { lat: 50.0412, lng: 21.9991 } }
    },
    {
      id: 'ORD004',
      city: 'Kraków Nowa Huta',
      clientLocation: { coordinates: { lat: 50.0707, lng: 20.0340 } }
    }
  ];
  
  try {
    console.log(`📦 Sortowanie ${testOrders.length} zleceń...`);
    
    const sorted = await service.sortOrdersByDistance(testOrders);
    
    console.log('\n✅ Kolejność od najbliższych:');
    sorted.forEach((order, index) => {
      if (order._distanceText) {
        console.log(`   ${index + 1}. ${order.city} - ${order._distanceText} (~${order._durationText})`);
      } else {
        console.log(`   ${index + 1}. ${order.city} - brak GPS`);
      }
    });
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
  
  // Test 5: Macierz odległości (2x2)
  console.log('\n🧪 TEST 5: Macierz odległości 2×2');
  console.log('-'.repeat(60));
  
  try {
    const origins = [
      { lat: 50.0647, lng: 19.9450 }, // Kraków
      { lat: 50.2804, lng: 19.5598 }  // Mielec
    ];
    
    const destinations = [
      { lat: 50.3872, lng: 21.0400 }, // Pacanów
      { lat: 50.0412, lng: 21.9991 }  // Rzeszów
    ];
    
    console.log('📊 Obliczanie macierzy...');
    
    const matrix = await service.calculateDistanceMatrix(origins, destinations);
    
    console.log('\n✅ Wyniki:');
    matrix.rows.forEach((row, i) => {
      row.elements.forEach((el, j) => {
        if (el.status === 'OK') {
          console.log(`   [${i}→${j}] ${el.distance.text}, ${el.duration.text}`);
        } else {
          console.log(`   [${i}→${j}] FAILED`);
        }
      });
    });
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
  
  // Test 6: Statystyki
  console.log('\n📊 STATYSTYKI UŻYCIA:');
  console.log('='.repeat(60));
  
  const stats = service.getStats();
  console.log(`   OSRM zapytania: ${stats.osrmCalls} (${stats.osrmPercent})`);
  console.log(`   Google zapytania: ${stats.googleCalls} (${stats.googlePercent})`);
  console.log(`   OSRM błędy: ${stats.osrmErrors}`);
  console.log(`   Google błędy: ${stats.googleErrors}`);
  console.log(`   Koszt Google: ${stats.googleCost}`);
  console.log(`   Zaoszczędzono: ${stats.totalSaved}`);
  console.log(`\n   ${stats.recommendation}`);
  
  // Test 7: Test połączenia
  console.log('\n🔌 TEST POŁĄCZENIA:');
  console.log('='.repeat(60));
  
  const connectionTest = await service.testConnection();
  
  console.log('\n🚗 OSRM:');
  if (connectionTest.osrm.success) {
    console.log(`   ✅ ${connectionTest.osrm.message}`);
    console.log(`   ⚡ Czas odpowiedzi: ${connectionTest.osrm.responseTime}`);
  } else {
    console.log(`   ❌ Błąd: ${connectionTest.osrm.error}`);
  }
  
  if (connectionTest.google.available) {
    console.log('\n🌐 Google Distance Matrix:');
    if (connectionTest.google.success) {
      console.log(`   ✅ ${connectionTest.google.message}`);
      console.log(`   ⚡ Czas odpowiedzi: ${connectionTest.google.responseTime}`);
    } else {
      console.log(`   ❌ Błąd: ${connectionTest.google.error}`);
    }
  } else {
    console.log('\n🌐 Google Distance Matrix:');
    console.log('   ℹ️  Niedostępny (brak API key)');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test zakończony!\n');
})();
