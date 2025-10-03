// geocoding/examples/usage-examples.js
// Przykłady użycia systemu geocoding

import GeocodingService from '../index.js';

/**
 * 🚀 PRZYKŁADY UŻYCIA GEOCODING SERVICE
 * 
 * Ten plik pokazuje jak używać wysokiej jakości systemu geocoding
 * dla polskich adresów.
 */

// Przykład 1: Podstawowa konfiguracja
async function basicUsageExample() {
  console.log('\n🎯 PRZYKŁAD 1: Podstawowe użycie');
  
  const geocoding = new GeocodingService({
    googleApiKey: 'YOUR_GOOGLE_API_KEY', // Ustaw w .env.local
    enableCache: true,
    region: 'pl'
  });

  try {
    // Geocoding różnych formatów adresów
    const addresses = [
      'ul. Floriańska 3, 31-021 Kraków',
      'Rynek Główny 1, Kraków',
      'al. Mickiewicza 30, Warszawa',
      'os. Słowackiego 15/5, 30-001 Kraków',
      'Nowy Targ', // Samo miasto
    ];

    for (const address of addresses) {
      console.log(`\n📍 Geocoding: ${address}`);
      
      const result = await geocoding.geocode(address);
      
      console.log(`✅ Result:`, {
        lat: result.lat,
        lng: result.lng,
        address: result.address,
        accuracy: result.accuracy,
        confidence: result.confidence,
        provider: result.provider
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Przykład 2: Reverse geocoding
async function reverseGeocodingExample() {
  console.log('\n🔄 PRZYKŁAD 2: Reverse geocoding');
  
  const geocoding = new GeocodingService();

  try {
    // Współrzędne centrum Krakowa
    const lat = 50.0647;
    const lng = 19.9450;

    console.log(`📍 Reverse geocoding: ${lat}, ${lng}`);
    
    const result = await geocoding.reverseGeocode(lat, lng);
    
    console.log(`✅ Address found:`, result.address);
    console.log(`🏙️ Components:`, result.components);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Przykład 3: Batch geocoding
async function batchGeocodingExample() {
  console.log('\n📦 PRZYKŁAD 3: Batch geocoding');
  
  const geocoding = new GeocodingService();

  const addresses = [
    'ul. Grodzka 52, Kraków',
    'Wawel 5, Kraków', 
    'ul. Szeroka 24, Kraków',
    'Niepoprawny adres xyz',
    'ul. Mariacka 3, Gdańsk'
  ];

  try {
    console.log(`📦 Processing ${addresses.length} addresses...`);
    
    const results = await geocoding.geocodeBatch(addresses, {
      maxConcurrent: 2,
      delayBetween: 200
    });

    console.log('\n📊 Batch results:');
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`✅ ${index + 1}. ${result.address} → ${result.result.lat}, ${result.result.lng}`);
      } else {
        console.log(`❌ ${index + 1}. ${result.address} → Error: ${result.error}`);
      }
    });

  } catch (error) {
    console.error('❌ Batch error:', error.message);
  }
}

// Przykład 4: Cache i statystyki
async function cacheStatsExample() {
  console.log('\n💾 PRZYKŁAD 4: Cache i statystyki');
  
  const geocoding = new GeocodingService({
    enableCache: true,
    cacheExpiry: 10 * 60 * 1000 // 10 minut
  });

  try {
    const address = 'ul. Floriańska 3, Kraków';

    // Pierwsze wywołanie - cache miss
    console.log('🔍 First call (cache miss):');
    await geocoding.geocode(address);

    // Drugie wywołanie - cache hit
    console.log('🔍 Second call (cache hit):');
    await geocoding.geocode(address);

    // Trzecie wywołanie - cache hit
    console.log('🔍 Third call (cache hit):');
    await geocoding.geocode(address);

    // Pokaż statystyki
    const stats = geocoding.getCacheStats();
    console.log('\n📊 Cache Statistics:', {
      memoryHits: stats.memoryHits,
      storageHits: stats.storageHits,
      misses: stats.misses,
      hitRate: stats.hitRate + '%',
      totalRequests: stats.totalRequests
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Przykład 5: Tylko z fallback provider (bez Google API)
async function fallbackOnlyExample() {
  console.log('\n🗺️ PRZYKŁAD 5: Tylko OpenStreetMap (bez Google)');
  
  const geocoding = new GeocodingService({
    providers: ['nominatim'], // Tylko OSM
    googleApiKey: null
  });

  try {
    const addresses = [
      'Rynek Główny, Kraków',
      'ul. Długa 1, Gdańsk',
      'Zamek Królewski, Warszawa'
    ];

    for (const address of addresses) {
      console.log(`\n📍 OSM Geocoding: ${address}`);
      
      const result = await geocoding.geocode(address);
      
      console.log(`✅ Result:`, {
        lat: result.lat,
        lng: result.lng,
        address: result.address.substring(0, 80) + '...',
        provider: result.provider,
        confidence: result.confidence
      });
      
      // Pauza dla rate limiting OSM
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Przykład 6: Testowanie walidacji adresów
async function addressValidationExample() {
  console.log('\n✅ PRZYKŁAD 6: Walidacja polskich adresów');
  
  const geocoding = new GeocodingService();

  const testAddresses = [
    'ul. Florianska 3, 31-021 krakow', // Błędna pisownia miasta
    'ul Mickiewicza 30 Warszawa', // Brak kropek i kodów
    'al. Jerozolimskie 65/79, 00-697 Warszawa', // Poprawny
    'os Słowackiego 15/5, 30-001 Kraków', // Brak kropki
    'Rynek Główny, Cracow', // Angielska nazwa
  ];

  for (const address of testAddresses) {
    console.log(`\n🔍 Testing: "${address}"`);
    
    try {
      const result = await geocoding.geocode(address);
      console.log(`✅ Enhanced: "${result.address}"`);
      console.log(`📊 Confidence: ${result.confidence}`);
      console.log(`🌐 Provider: ${result.provider}`);
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }
}

// Export przykładów dla użycia
export {
  basicUsageExample,
  reverseGeocodingExample,
  batchGeocodingExample,
  cacheStatsExample,
  fallbackOnlyExample,
  addressValidationExample
};

// Uruchom wszystkie przykłady jeśli plik jest wykonywany bezpośrednio
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 GEOCODING SERVICE - DEMO EXAMPLES');
  console.log('=====================================');
  
  // Uwaga: Potrzebujesz Google API Key w .env.local dla pełnej funkcjonalności
  console.log('⚠️  Note: Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local for full features');
  
  try {
    await basicUsageExample();
    await reverseGeocodingExample();
    await batchGeocodingExample();
    await cacheStatsExample();
    await fallbackOnlyExample();
    await addressValidationExample();
    
    console.log('\n🎉 All examples completed!');
    
  } catch (error) {
    console.error('🚨 Demo error:', error);
  }
}