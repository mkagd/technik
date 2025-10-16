// 🧪 Test Nominatim API dla adresu Pacanów

async function testNominatim() {
  console.log('═'.repeat(70));
  console.log('🧪 TEST NOMINATIM (OpenStreetMap) - 100% DARMOWY');
  console.log('═'.repeat(70));

  const testAddresses = [
    'Słupia 114, 28-133 Pacanów, Polska',
    'Pacanów, Polska',
    'Gliniana 17, 39-300 Mielec, Polska',
    'Rynek Główny 1, Kraków, Polska'
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 Test: "${address}"`);
    console.log('─'.repeat(70));

    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: '3',
        countrycodes: 'pl',
        'accept-language': 'pl'
      });

      const url = `https://nominatim.openstreetmap.org/search?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TechnikServiceApp/1.0'
        }
      });

      const results = await response.json();

      if (!results || results.length === 0) {
        console.log('   ❌ Brak wyników');
        continue;
      }

      console.log(`   ✅ Znaleziono ${results.length} wyników:\n`);

      results.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.display_name}`);
        console.log(`      📍 Coords: ${r.lat}, ${r.lon}`);
        console.log(`      🏷️  Type: ${r.type} (${r.class})`);
        console.log(`      ⭐ Importance: ${r.importance}`);
        
        if (r.address) {
          console.log(`      🏠 Adres:`);
          if (r.address.house_number) console.log(`         Numer: ${r.address.house_number}`);
          if (r.address.road) console.log(`         Ulica: ${r.address.road}`);
          if (r.address.city || r.address.town) console.log(`         Miasto: ${r.address.city || r.address.town}`);
          if (r.address.postcode) console.log(`         Kod: ${r.address.postcode}`);
        }
        
        console.log(`      🔗 https://www.google.com/maps?q=${r.lat},${r.lon}`);
        console.log('');
      });

      // Ranking wyników
      console.log('   🎯 Ranking (który wybrałby algorytm):');
      const ranked = results.map((r, i) => {
        let score = 0;
        if (r.type === 'house') score += 100;
        else if (r.type === 'building') score += 80;
        else if (r.type === 'road') score += 60;
        else if (r.type === 'city' || r.type === 'town') score += 40;
        
        score += (r.importance || 0) * 50;
        
        if (r.address?.house_number) score += 20;
        if (r.address?.road) score += 15;
        if (r.address?.city || r.address?.town) score += 10;
        
        return { index: i + 1, score, name: r.display_name };
      });

      ranked.sort((a, b) => b.score - a.score);
      
      ranked.forEach((r, i) => {
        const marker = i === 0 ? '✅' : '  ';
        console.log(`      ${marker} #${r.index}: Score ${r.score} - ${r.name.substring(0, 60)}...`);
      });

    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 PODSUMOWANIE:');
  console.log('═'.repeat(70));
  console.log('✅ Nominatim (OpenStreetMap):');
  console.log('   • 100% DARMOWY - bez limitów (dla rozumnego użycia)');
  console.log('   • Bez karty kredytowej');
  console.log('   • Bez rejestracji / API key');
  console.log('   • Dobra jakość dla Polski');
  console.log('   • Rate limit: 1 request/sekundę (wystarczy!)');
  console.log('\n✅ Test zakończony!');
  console.log('═'.repeat(70));
}

// Uruchom test
testNominatim().catch(console.error);
