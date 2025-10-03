// Test Google-only Geocoding w IntelligentWeekPlanner
import { GeocodingService } from './geocoding/index.js';

console.log('🔍 TEST GOOGLE-ONLY GEOCODING SERVICE');
console.log('====================================');

const testGoogleOnlyGeocoding = async () => {
  console.log('\n🎯 Test 1: Inicjalizacja Google-only GeocodingService');
  
  try {
    // Identyczna konfiguracja jak w IntelligentWeekPlanner
    const geocoder = new GeocodingService({
      googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      region: 'pl',
      language: 'pl',
      enableCache: true,
      cacheExpiry: 24 * 60 * 60 * 1000,
      timeout: 8000,
      maxRetries: 3,
      providers: ['google'] // TYLKO Google
    });
    
    console.log('✅ Google-only GeocodingService zainicjalizowany');
    
    console.log('\n🇵🇱 Test 2: Polskie adresy przez Google Maps API');
    
    const testAddresses = [
      'Kraków',
      'ul. Floriańska 3, Kraków',
      'Rynek Główny, Kraków', 
      'Wawel, Kraków',
      'ul. Szewska 2, Kraków',
      'Tarnów',
      'ul. Krakowska 1, Tarnów',
      'Nowy Sącz',
      'Jasło',
      'Mielec'
    ];
    
    let googleSuccesses = 0;
    let totalTests = testAddresses.length;
    
    for (const address of testAddresses) {
      try {
        console.log(`\n📍 Google Maps API test: "${address}"`);
        const result = await geocoder.geocode(address);
        
        if (result && result.lat && result.lng && result.provider === 'google') {
          googleSuccesses++;
          console.log(`✅ GOOGLE SUCCESS:`);
          console.log(`   📍 Address: ${result.address}`);
          console.log(`   🎯 Coords: ${result.lat}, ${result.lng}`);
          console.log(`   🏆 Accuracy: ${result.accuracy}`); 
          console.log(`   📊 Confidence: ${result.confidence}`);
          console.log(`   🆔 Place ID: ${result.place_id || 'N/A'}`);
          
          // Sprawdź jakość wyniku
          if (result.accuracy === 'ROOFTOP') {
            console.log(`   🎖️ ROOFTOP ACCURACY - Najwyższa jakość!`);
          } else if (result.accuracy === 'RANGE_INTERPOLATED') {
            console.log(`   🎖️ RANGE_INTERPOLATED - Bardzo dobra jakość`);
          } else if (result.accuracy === 'GEOMETRIC_CENTER') {
            console.log(`   🎖️ GEOMETRIC_CENTER - Dobra jakość`);
          }
          
        } else {
          console.log(`❌ Niepowodzenie Google API dla: ${address}`);
          if (result && result.provider !== 'google') {
            console.log(`   ⚠️ Używa provider: ${result.provider} (nie Google!)`);
          }
        }
      } catch (error) {
        console.error(`❌ Błąd Google API dla "${address}":`, error.message);
      }
      
      // Rate limiting dla Google API
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n🔄 Test 3: Reverse Geocoding przez Google');
    
    const testCoordinates = [
      { lat: 50.0647, lng: 19.945, name: 'Kraków Center' },
      { lat: 50.0621763, lng: 19.9395986, name: 'ul. Floriańska 3' },
      { lat: 50.0618971, lng: 19.936756, name: 'Rynek Główny' }
    ];
    
    let reverseSuccesses = 0;
    
    for (const coord of testCoordinates) {
      try {
        console.log(`\n🔄 Reverse Google API: ${coord.name} (${coord.lat}, ${coord.lng})`);
        const result = await geocoder.reverseGeocode(coord.lat, coord.lng);
        
        if (result && result.address && result.provider === 'google') {
          reverseSuccesses++;
          console.log(`✅ REVERSE GOOGLE SUCCESS:`);
          console.log(`   📍 Found address: ${result.address}`);
        } else {
          console.log(`❌ Reverse geocoding failed`);
        }
      } catch (error) {
        console.error(`❌ Reverse error for ${coord.name}:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n📊 WYNIKI GOOGLE-ONLY TESTÓW');
    console.log('============================');
    console.log(`✅ Forward Geocoding: ${googleSuccesses}/${totalTests} successes`);
    console.log(`✅ Reverse Geocoding: ${reverseSuccesses}/${testCoordinates.length} successes`);
    console.log(`📈 Success Rate: ${((googleSuccesses + reverseSuccesses) / (totalTests + testCoordinates.length) * 100).toFixed(1)}%`);
    
    if (googleSuccesses === totalTests && reverseSuccesses === testCoordinates.length) {
      console.log('\n🎉 DOSKONAŁE! 100% SUCCESS RATE z Google Maps API');
      console.log('🚀 IntelligentWeekPlanner używa TYLKO Google - maksymalna dokładność!');
    } else {
      console.log('\n⚠️ Niektóre testy nie powiodły się - sprawdź Google API key i billing');
    }
    
  } catch (error) {
    console.error('❌ Błąd inicjalizacji Google-only GeocodingService:', error);
  }
};

// Uruchom test
testGoogleOnlyGeocoding().catch(console.error);