// test-distance-matrix.js
// Test Google Distance Matrix API integration

import { DistanceMatrixService } from './distance-matrix/index.js';

async function testDistanceMatrixAPI() {
  console.log('🚗 Testing Google Distance Matrix API...\n');

  try {
    // Inicjalizacja Distance Matrix Service
    const distanceMatrix = new DistanceMatrixService({
      googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      trafficModel: 'best_guess',
      units: 'metric',
      language: 'pl',
      region: 'pl',
      enableCache: true,
      enableFallback: true
    });

    console.log('✅ DistanceMatrixService initialized\n');

    // Test 1: Pojedyncza odległość między miastami
    console.log('📍 Test 1: Kraków → Tarnów');
    const result1 = await distanceMatrix.calculateDistance(
      { lat: 50.0647, lng: 19.945 }, // Kraków
      { lat: 50.0121, lng: 20.9858 }  // Tarnów
    );

    console.log('🚗 Result:');
    console.log(`   Distance: ${result1.distance.km} km (${result1.distance.text})`);
    console.log(`   Duration: ${result1.duration.minutes} min (${result1.duration.text})`);
    if (result1.durationInTraffic) {
      console.log(`   With traffic: ${result1.durationInTraffic.minutes} min (${result1.durationInTraffic.text})`);
      console.log(`   Traffic delay: ${result1.trafficDelay.minutes} min`);
    }
    console.log(`   Provider: ${result1.provider}\n`);

    // Test 2: Odległość w obrębie miasta
    console.log('📍 Test 2: Rynek Główny → Wawel (Kraków)');
    const result2 = await distanceMatrix.calculateDistance(
      { lat: 50.0619, lng: 19.9368 }, // Rynek Główny
      { lat: 50.0541, lng: 19.9354 }  // Wawel
    );

    console.log('🚗 Result:');
    console.log(`   Distance: ${result2.distance.km} km (${result2.distance.text})`);
    console.log(`   Duration: ${result2.duration.minutes} min (${result2.duration.text})`);
    if (result2.durationInTraffic) {
      console.log(`   With traffic: ${result2.durationInTraffic.minutes} min (${result2.durationInTraffic.text})`);
    }
    console.log(`   Provider: ${result2.provider}\n`);

    // Test 3: Cache test - powtórz pierwsze zapytanie
    console.log('📍 Test 3: Cache test - Kraków → Tarnów (powtórka)');
    const startTime = Date.now();
    const result3 = await distanceMatrix.calculateDistance(
      { lat: 50.0647, lng: 19.945 }, // Kraków
      { lat: 50.0121, lng: 20.9858 }  // Tarnów
    );
    const endTime = Date.now();

    console.log('🚗 Cache result:');
    console.log(`   Distance: ${result3.distance.km} km`);
    console.log(`   Duration: ${result3.duration.minutes} min`);
    console.log(`   Response time: ${endTime - startTime}ms (powinno być <50ms dla cache hit)\n`);

    // Test 4: Distance Matrix dla wielu punktów
    console.log('📍 Test 4: Distance Matrix - Kraków okolicy');
    const origins = [
      { lat: 50.0647, lng: 19.945 },  // Kraków centrum
      { lat: 50.0619, lng: 19.9368 }  // Rynek Główny
    ];
    const destinations = [
      { lat: 50.0541, lng: 19.9354 }, // Wawel
      { lat: 50.0621, lng: 19.9396 }, // Floriańska
      { lat: 50.0121, lng: 20.9858 }  // Tarnów
    ];

    const matrix = await distanceMatrix.calculateDistanceMatrix(origins, destinations);
    
    console.log('🚗 Distance Matrix:');
    matrix.rows.forEach((row, originIndex) => {
      console.log(`   Origin ${originIndex}:`);
      row.elements.forEach((element, destIndex) => {
        if (element.status === 'OK') {
          console.log(`     → Dest ${destIndex}: ${element.distance.km}km, ${element.duration.minutes}min`);
        } else {
          console.log(`     → Dest ${destIndex}: ${element.status}`);
        }
      });
    });
    console.log();

    // Test 5: Route optimization
    console.log('📍 Test 5: Route Optimization - Kraków punkty');
    const waypoints = [
      { lat: 50.0647, lng: 19.945 },  // Start: Kraków centrum
      { lat: 50.0621, lng: 19.9396 }, // Floriańska
      { lat: 50.0541, lng: 19.9354 }, // Wawel
      { lat: 50.0619, lng: 19.9368 }  // Rynek Główny
    ];

    const optimized = await distanceMatrix.optimizeRoute(waypoints);
    
    console.log('🎯 Route Optimization:');
    console.log(`   Original order: 0 → 1 → 2 → 3`);
    console.log(`   Optimized order: ${optimized.originalIndices.join(' → ')}`);
    console.log(`   Total distance: ${(optimized.totalDistance / 1000).toFixed(2)} km`);
    console.log(`   Total time: ${Math.round(optimized.totalTime / 60)} min`);
    console.log(`   Optimized: ${optimized.optimized ? 'Yes' : 'No'}\n`);

    // Statystyki
    const stats = distanceMatrix.getStats();
    console.log('📊 Distance Matrix Statistics:');
    console.log('   Cache stats:', stats.cache);
    console.log('   Provider config:', stats.provider);

    console.log('\n🎉 All Distance Matrix tests completed successfully!');

  } catch (error) {
    console.error('🚨 Distance Matrix test failed:', error);
    
    // Test fallback
    console.log('\n🔄 Testing fallback mode...');
    try {
      const distanceMatrixFallback = new DistanceMatrixService({
        googleApiKey: 'invalid_key', // Celowo nieprawidłowy klucz
        enableFallback: true
      });

      const fallbackResult = await distanceMatrixFallback.calculateDistance(
        { lat: 50.0647, lng: 19.945 },
        { lat: 50.0121, lng: 20.9858 }
      );

      console.log('✅ Fallback works:');
      console.log(`   Distance: ${fallbackResult.distance.km} km`);
      console.log(`   Provider: ${fallbackResult.provider}`);

    } catch (fallbackError) {
      console.error('🚨 Even fallback failed:', fallbackError);
    }
  }
}

// Test różnych trybów transportu
async function testTransportModes() {
  console.log('\n🚌 Testing different transport modes...\n');

  const origin = { lat: 50.0647, lng: 19.945 }; // Kraków
  const dest = { lat: 50.0121, lng: 20.9858 };   // Tarnów

  const modes = ['driving', 'walking', 'bicycling'];
  
  for (const mode of modes) {
    try {
      console.log(`📍 Testing mode: ${mode}`);
      
      const service = new DistanceMatrixService({
        googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        mode: mode,
        enableCache: false // Wyłącz cache dla czystego testu
      });

      const result = await service.calculateDistance(origin, dest);
      
      console.log(`   Distance: ${result.distance.km} km`);
      console.log(`   Duration: ${result.duration.minutes} min`);
      console.log();

      // Krótka pauza między requestami
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`   ❌ ${mode} failed: ${error.message}\n`);
    }
  }
}

// Uruchom testy
console.log('🚀 Starting Distance Matrix API tests...\n');

testDistanceMatrixAPI()
  .then(() => testTransportModes())
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n🚨 Tests failed:', error);
    process.exit(1);
  });