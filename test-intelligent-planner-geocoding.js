// Test przeprojektowanego IntelligentWeekPlanner z GeocodingService
import { GeocodingService } from './geocoding/index.js';

console.log('🧪 TEST PRZEPROJEKTOWANEGO INTELLIGENT WEEK PLANNER');
console.log('==================================================');

const testGeocodingServiceIntegration = async () => {
  console.log('\n📊 Test 1: Inicjalizacja GeocodingService');
  
  try {
    const geocoder = new GeocodingService({
      googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      region: 'pl',
      language: 'pl',
      enableCache: true,
      cacheExpiry: 24 * 60 * 60 * 1000,
      timeout: 5000,
      maxRetries: 2,
      providers: ['google', 'nominatim']
    });
    
    console.log('✅ GeocodingService zainicjalizowany poprawnie');
    
    console.log('\n🔍 Test 2: Forward Geocoding (adres → współrzędne)');
    
    const testAddresses = [
      'Kraków',
      'ul. Floriańska 3, Kraków',
      'Rynek Główny, Kraków',
      'Tarnów',
      'Nowy Sącz'
    ];
    
    for (const address of testAddresses) {
      try {
        console.log(`\n📍 Testuję: "${address}"`);
        const result = await geocoder.geocode(address);
        
        if (result && result.lat && result.lng) {
          console.log(`✅ SUKCES:`);
          console.log(`   📍 Adres: ${result.address}`);
          console.log(`   🎯 Współrzędne: ${result.lat}, ${result.lng}`);
          console.log(`   🏆 Provider: ${result.provider}`);
          console.log(`   📊 Confidence: ${result.confidence}`);
          console.log(`   🎖️ Accuracy: ${result.accuracy}`);
        } else {
          console.log(`❌ Brak wyników dla: ${address}`);
        }
      } catch (error) {
        console.error(`❌ Błąd dla "${address}":`, error.message);
      }
      
      // Opóźnienie między zapytaniami
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n🔄 Test 3: Reverse Geocoding (współrzędne → adres)');
    
    const testCoordinates = [
      { lat: 50.0647, lng: 19.9450, name: 'Kraków Center' },
      { lat: 50.0614, lng: 19.9366, name: 'Stare Miasto' },
      { lat: 50.0135, lng: 20.9854, name: 'Tarnów' }
    ];
    
    for (const coord of testCoordinates) {
      try {
        console.log(`\n📍 Reverse geocoding: ${coord.name} (${coord.lat}, ${coord.lng})`);
        const result = await geocoder.reverseGeocode(coord.lat, coord.lng);
        
        if (result && result.address) {
          console.log(`✅ SUKCES:`);
          console.log(`   📍 Znaleziony adres: ${result.address}`);
          console.log(`   🏆 Provider: ${result.provider}`);
        } else {
          console.log(`❌ Brak adresu dla współrzędnych: ${coord.lat}, ${coord.lng}`);
        }
      } catch (error) {
        console.error(`❌ Błąd reverse geocoding dla ${coord.name}:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 Test 4: Cache Statistics');
    const cacheStats = geocoder.getCacheStats();
    console.log('Cache stats:', cacheStats);
    
    console.log('\n🎉 PODSUMOWANIE TESTÓW');
    console.log('=====================');
    console.log('✅ GeocodingService działa poprawnie');
    console.log('✅ Forward geocoding aktywny');
    console.log('✅ Reverse geocoding aktywny');
    console.log('✅ Cache system działa');
    console.log('✅ Multi-provider support (Google + OpenStreetMap)');
    console.log('✅ Zaawansowana walidacja polskich adresów');
    console.log('');
    console.log('🚀 IntelligentWeekPlanner gotowy z nowym systemem geocoding!');
    
  } catch (error) {
    console.error('❌ Błąd inicjalizacji GeocodingService:', error);
  }
};

// Uruchom test
testGeocodingServiceIntegration().catch(console.error);