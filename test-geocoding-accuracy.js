/**
 * 🧪 Test skrypt do sprawdzenia dokładności geocodingu
 * Testuje problematyczny adres "Gliniana" i inne
 * 
 * Prosty test używający fetch API bezpośrednio
 */

async function testGeocoding() {
  console.log('🧪 Testowanie dokładności geocodingu\n');
  console.log('═══════════════════════════════════════════\n');

  // Prosty geocoder dla testu
  const apiKey = 'AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo';
  const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  async function geocodeAddress(address) {
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
      region: 'pl',
      language: 'pl',
      components: 'country:PL'
    });
    
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Google API error: ${data.status}`);
    }
    
    return data.results;
  }

  // Test case 1: Problematyczny adres "Gliniana" (user report)
  const testAddresses = [
    {
      name: 'Gliniana bez numeru (mało kontekstu)',
      address: 'Gliniana, Mielec'
    },
    {
      name: 'Gliniana z numerem (więcej kontekstu)',
      address: 'Gliniana 17, 39-300 Mielec'
    },
    {
      name: 'Gliniana pełny format (jak w systemie)',
      address: 'Gliniana 17/30, 39-300 Mielec'
    },
    {
      name: 'Inne miasto - test kontrolny',
      address: 'Rynek Główny 1, 31-042 Kraków'
    },
    {
      name: 'Ulica bez numeru - test',
      address: 'Floriańska, 31-019 Kraków'
    }
  ];

  for (const test of testAddresses) {
    console.log(`\n📍 Test: ${test.name}`);
    console.log(`   Adres: "${test.address}"\n`);

    try {
      const results = await geocodeAddress(test.address);
      
      console.log(`   📊 Google zwrócił ${results.length} wyników:\n`);
      
      results.slice(0, 3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.formatted_address}`);
        console.log(`      � Coords: ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
        console.log(`      🎯 Dokładność: ${result.geometry.location_type}`);
        console.log(`      ⚠️  Partial match: ${result.partial_match ? 'TAK' : 'NIE'}`);
        console.log(`      🔗 https://www.google.com/maps?q=${result.geometry.location.lat},${result.geometry.location.lng}`);
        console.log('');
      });

      // Pokaż który wynik wybierze nasz algorytm
      if (results.length > 1) {
        const best = results.find(r => r.geometry.location_type === 'ROOFTOP') || results[0];
        const bestIndex = results.indexOf(best);
        console.log(`   ✅ Algorytm wybierze wynik #${bestIndex + 1} (${best.geometry.location_type})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
    }

    console.log('\n' + '─'.repeat(60));
  }

  console.log('\n\n📊 PODSUMOWANIE:');
  console.log('═══════════════════════════════════════════');
  console.log('• Nowy algorytm wybiera najdokładniejszy wynik');
  console.log('• Preferuje ROOFTOP > RANGE_INTERPOLATED > inne');
  console.log('• Premiuje wyniki z pełnym adresem (numer, ulica, miasto)');
  console.log('• Karze wyniki z partial_match');
  console.log('\n✅ Test zakończony!\n');
}

// Uruchom test
testGeocoding().catch(error => {
  console.error('🚨 Test error:', error);
  process.exit(1);
});
