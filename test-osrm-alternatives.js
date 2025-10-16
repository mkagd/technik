// test-osrm-alternatives.js
// Test OSRM with alternatives parameter

async function testOSRMAlternatives() {
  console.log('🧪 Test OSRM z trasami alternatywnymi\n');
  
  const from = {
    name: 'Gliniana 17, Kraków',
    lat: 50.065579295426474,
    lng: 19.948038882909753
  };
  
  const to = {
    name: 'Słupia 114, Pacanów',
    lat: 50.3872331,
    lng: 21.0400855
  };
  
  console.log(`📍 Od: ${from.name}`);
  console.log(`📍 Do: ${to.name}`);
  console.log(`📊 Google Maps pokazuje: ~90 km\n`);
  
  // Test 1: BEZ alternatyw (stary sposób)
  console.log('═══ TEST 1: Bez alternatyw (stary sposób) ═══');
  try {
    const url1 = `https://router.project-osrm.org/route/v1/car/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&steps=false`;
    console.log(`🔗 URL: ${url1}\n`);
    
    const response1 = await fetch(url1, {
      headers: { 'User-Agent': 'TechnikAGD/1.0' }
    });
    
    const data1 = await response1.json();
    
    if (data1.code === 'Ok' && data1.routes && data1.routes[0]) {
      const route = data1.routes[0];
      const km = (route.distance / 1000).toFixed(1);
      const min = Math.round(route.duration / 60);
      console.log(`✅ Wynik: ${km} km, ${min} min`);
      console.log(`❌ Różnica: ${(parseFloat(km) - 90).toFixed(1)} km więcej niż Google\n`);
    }
  } catch (error) {
    console.log(`❌ Błąd: ${error.message}\n`);
  }
  
  // Czekaj żeby nie przekroczyć rate limit
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Test 2: Z alternatywami (nowy sposób)
  console.log('═══ TEST 2: Z trasami alternatywnymi (nowy sposób) ═══');
  try {
    const params = new URLSearchParams({
      overview: 'false',
      steps: 'false',
      alternatives: 'true',
      continue_straight: 'false',
      geometries: 'geojson'
    });
    
    const url2 = `https://router.project-osrm.org/route/v1/car/${from.lng},${from.lat};${to.lng},${to.lat}?${params}`;
    console.log(`🔗 URL: ${url2}\n`);
    
    const response2 = await fetch(url2, {
      headers: { 'User-Agent': 'TechnikAGD/1.0' }
    });
    
    const data2 = await response2.json();
    
    if (data2.code === 'Ok' && data2.routes) {
      console.log(`📊 OSRM zwrócił ${data2.routes.length} tras:\n`);
      
      // Sortuj po odległości
      const sorted = data2.routes.sort((a, b) => a.distance - b.distance);
      
      sorted.forEach((route, i) => {
        const km = (route.distance / 1000).toFixed(1);
        const min = Math.round(route.duration / 60);
        const diff = (parseFloat(km) - 90).toFixed(1);
        const diffText = parseFloat(diff) > 0 ? `+${diff}` : diff;
        
        console.log(`${i === 0 ? '✅' : '  '} Trasa ${i + 1}: ${km} km, ${min} min (${diffText} km vs Google)`);
      });
      
      console.log(`\n🎯 Najkrótsza trasa: ${(sorted[0].distance / 1000).toFixed(1)} km`);
      
      const bestDiff = (sorted[0].distance / 1000) - 90;
      if (Math.abs(bestDiff) < 10) {
        console.log(`✅ SUKCES! Różnica < 10 km (${bestDiff.toFixed(1)} km)`);
      } else {
        console.log(`⚠️  Wciąż duża różnica: ${bestDiff.toFixed(1)} km`);
      }
    }
  } catch (error) {
    console.log(`❌ Błąd: ${error.message}`);
  }
  
  console.log('\n\n═══════════════════════════════════════════');
  console.log('📝 WNIOSKI:');
  console.log('═══════════════════════════════════════════');
  console.log('1. Jeśli trasy alternatywne dają bliższy wynik - SUKCES!');
  console.log('2. Jeśli wciąż duża różnica - OSRM może nie znać krótsych dróg lokalnych');
  console.log('3. W takim przypadku rozważ Google Distance Matrix API dla krytycznych tras');
  console.log('4. OSRM jest darmowy ale może różnić się ±20-30% na trasach lokalnych');
}

// Run test
testOSRMAlternatives().catch(console.error);
