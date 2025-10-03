// Test Google Geocoding API po włączeniu billing
import GoogleGeocoder from './geocoding/simple/GoogleGeocoder.js';

const testGoogleAPIAfterBilling = async () => {
  console.log('🧪 TEST GOOGLE API PO WŁĄCZENIU BILLING');
  console.log('=====================================');

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('API Key:', apiKey ? 'Obecny ✅' : 'Brak ❌');

  if (!apiKey) {
    console.log('❌ Brak API key');
    return;
  }

  try {
    const geocoder = new GoogleGeocoder({
      apiKey: apiKey,
      region: 'pl'
    });

    console.log('\n🇵🇱 Testování polskich adresów z Google API:');
    
    const testAddresses = [
      'Kraków',
      'ul. Floriańska 3, Kraków', 
      'Rynek Główny, Kraków',
      'Tarnów',
      'ul. Gliniana 17, Kraków',
      'Nowy Sącz',
      'Zakopane'
    ];

    for (const address of testAddresses) {
      console.log(`\n🔍 Testuję: "${address}"`);
      
      try {
        const result = await geocoder.geocode(address);
        
        if (result.success && result.data) {
          const data = result.data;
          console.log(`✅ SUKCES - Google API:`);
          console.log(`   📍 ${data.address}`);
          console.log(`   🎯 ${data.lat}, ${data.lng}`);
          console.log(`   🏆 Dokładność: ${data.accuracy}`);
          console.log(`   📊 Pewność: ${data.confidence}`);
          console.log(`   🏷️ Place ID: ${data.place_id || 'brak'}`);
          
          // Sprawdź czy to prawdziwe Google API czy fallback
          if (data.place_id) {
            console.log(`   🎉 PRAWDZIWE GOOGLE API! (nie fallback)`);
          } else {
            console.log(`   ⚠️ To nadal fallback - sprawdź billing`);
          }
        } else {
          console.log(`❌ Nie znaleziono: ${address}`);
        }
      } catch (error) {
        console.error(`❌ Błąd dla "${address}":`, error.message);
        
        if (error.message.includes('REQUEST_DENIED')) {
          console.log('   💡 Porada: Sprawdź czy billing jest włączony');
          console.log('   🔗 https://console.cloud.google.com/billing');
        }
        if (error.message.includes('API key')) {
          console.log('   💡 Porada: Sprawdź czy Geocoding API jest włączony');
          console.log('   🔗 https://console.cloud.google.com/apis/library');
        }
      }
      
      // Opóźnienie między zapytaniami
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n📊 PODSUMOWANIE:');
    console.log('================');
    console.log('✅ Jeśli widzisz Place ID - Google API działa!');
    console.log('⚠️ Jeśli brak Place ID - to fallback (billing problem)');
    console.log('💡 Po włączeniu billing może potrwać 5-10 minut');
    
  } catch (error) {
    console.error('❌ Błąd testowania:', error);
  }
};

// Uruchom test
testGoogleAPIAfterBilling().catch(console.error);