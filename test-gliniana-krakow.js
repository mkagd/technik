// Test Google API dla "Gliniana 17, Kraków"

async function testGlinianaKrakow() {
  const apiKey = 'AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo';
  
  console.log('🔍 Testowanie: "Gliniana 17, Kraków"\n');
  console.log('═'.repeat(60));
  
  const testAddresses = [
    'Gliniana 17, Kraków',
    'Gliniana 17, 31-000 Kraków',
    'ulica Gliniana 17, Kraków',
    'Gliniana, Kraków'
  ];
  
  for (const address of testAddresses) {
    console.log(`\n📍 Test: "${address}"`);
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=pl&language=pl&components=country:PL`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`   Status: ${data.status}`);
      
      if (data.status === 'OK' && data.results) {
        console.log(`   📊 Znaleziono ${data.results.length} wyników:\n`);
        
        data.results.slice(0, 3).forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.formatted_address}`);
          console.log(`      📍 Coords: ${r.geometry.location.lat}, ${r.geometry.location.lng}`);
          console.log(`      🎯 Type: ${r.geometry.location_type}`);
          console.log(`      ⚠️  Partial: ${r.partial_match ? 'TAK' : 'NIE'}`);
          console.log(`      🔗 https://www.google.com/maps?q=${r.geometry.location.lat},${r.geometry.location.lng}`);
          
          // Sprawdź czy to ta sama lokalizacja co w zgłoszeniu
          if (Math.abs(r.geometry.location.lat - 50.0628185) < 0.0001 && 
              Math.abs(r.geometry.location.lng - 19.9424747) < 0.0001) {
            console.log(`      ⚠️⚠️⚠️  TO TEN BŁĘDNY WYNIK! (Lubicz zamiast Glinianej)`);
          }
          console.log('');
        });
      } else {
        console.log(`   ❌ Error: ${data.error_message || data.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
}

testGlinianaKrakow().catch(console.error);
