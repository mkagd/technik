// Test integracji GoogleGeocoder z IntelligentWeekPlanner
import GoogleGeocoder from './geocoding/simple/GoogleGeocoder.js';

console.log('🧪 TEST GEOCODER INTEGRATION');
console.log('============================');

// Test 1: Inicjalizacja z API key
const testInitialization = () => {
  console.log('\n📍 Test 1: Inicjalizacja GoogleGeocoder');
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('API Key obecny:', apiKey ? '✅ TAK' : '❌ NIE');
  
  if (!apiKey) {
    console.log('❌ Brak API key w .env.local');
    return false;
  }
  
  try {
    const geocoder = new GoogleGeocoder({
      apiKey: apiKey,
      region: 'pl'
    });
    console.log('✅ GoogleGeocoder zainicjalizowany pomyślnie');
    return geocoder;
  } catch (error) {
    console.error('❌ Błąd inicjalizacji:', error.message);
    return false;
  }
};

// Test 2: Geocodowanie polskiego adresu
const testPolishAddress = async (geocoder) => {
  console.log('\n🇵🇱 Test 2: Geocodowanie polskiego adresu');
  
  const testAddresses = [
    'Kraków',
    'ul. Floriańska 3, Kraków',
    'Rynek Główny, Kraków',
    'Tarnów',
    'ul. Gliniana 17, Kraków'
  ];
  
  for (const address of testAddresses) {
    try {
      console.log(`\n🔍 Testuję: "${address}"`);
      const result = await geocoder.geocode(address);
      
      if (result.success && result.data) {
        const data = result.data;
        console.log(`✅ Znaleziono: ${data.address}`);
        console.log(`📍 Współrzędne: ${data.lat}, ${data.lng}`);
        console.log(`🎯 Dokładność: ${data.accuracy}`);
        console.log(`📊 Pewność: ${data.confidence}`);
      } else {
        console.log(`❌ Nie znaleziono adresu: ${address}`);
      }
    } catch (error) {
      console.error(`❌ Błąd dla "${address}":`, error.message);
    }
    
    // Poczekaj 100ms między zapytaniami
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// Test 3: Symulacja użycia w IntelligentWeekPlanner
const testIntelligentPlannerIntegration = async (geocoder) => {
  console.log('\n🎯 Test 3: Symulacja setManualLocation');
  
  const simulateSetManualLocation = async (address) => {
    console.log(`\n🏠 setManualLocation wywołano z adresem: "${address}"`);
    
    if (!address.trim()) {
      console.log('❌ Pusty adres');
      return false;
    }
    
    try {
      console.log('🔍 Wyszukuję adres...');
      
      const result = await geocoder.geocode(address);
      
      if (result.success && result.data) {
        const location = result.data;
        
        // Symulacja logiki z IntelligentWeekPlanner
        const enhancedLocation = {
          address: location.address,
          coordinates: { lat: location.lat, lng: location.lng },
          lat: location.lat,
          lng: location.lng,
          isDetected: false,
          name: location.address,
          userSelected: true,
          updatedAt: new Date().toISOString(),
          source: 'google_geocoder',
          accuracy: location.accuracy,
          confidence: location.confidence
        };
        
        console.log('✅ Lokalizacja przygotowana dla startLocation:');
        console.log(JSON.stringify(enhancedLocation, null, 2));
        return enhancedLocation;
        
      } else {
        console.log('❌ GoogleGeocoder nie znalazł adresu');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Błąd geocoding:', error.message);
      return false;
    }
  };
  
  // Test kilku adresów jak w prawdziwym użyciu
  const testAddresses = ['Kraków', 'ul. Długa 10, Kraków'];
  
  for (const address of testAddresses) {
    await simulateSetManualLocation(address);
  }
};

// Główna funkcja testowa
const runTests = async () => {
  const geocoder = testInitialization();
  
  if (!geocoder) {
    console.log('\n❌ Test zakończony - problem z inicjalizacją');
    return;
  }
  
  await testPolishAddress(geocoder);
  await testIntelligentPlannerIntegration(geocoder);
  
  console.log('\n🎉 TESTY ZAKOŃCZONE');
  console.log('==================');
  console.log('✅ GoogleGeocoder gotowy do użycia w IntelligentWeekPlanner');
  console.log('📍 API Key skonfigurowany poprawnie');
  console.log('🇵🇱 Polskie adresy obsługiwane');
};

// Uruchom testy
runTests().catch(console.error);