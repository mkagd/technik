// test-osrm-distance.js
// Test OSRM distance calculations

async function testOSRMDistances() {
  console.log('🧪 Test OSRM Distance Calculations\n');
  
  // Test locations (real data from orders)
  const locations = {
    krakow: {
      name: 'Kraków (Gliniana 17)',
      lat: 50.065579295426474,
      lng: 19.948038882909753
    },
    pacanow: {
      name: 'Pacanów (Słupia 114)',
      lat: 50.3872331,
      lng: 21.0400855
    },
    companyKrakow: {
      name: 'Siedziba (Kraków centrum)',
      lat: 50.0647,
      lng: 19.9450
    }
  };
  
  // Test cases
  const tests = [
    {
      from: locations.companyKrakow,
      to: locations.krakow,
      expectedKm: 'około 2-5 km',
      description: 'Centrum Krakowa → Gliniana 17'
    },
    {
      from: locations.companyKrakow,
      to: locations.pacanow,
      expectedKm: 'około 130-150 km',
      description: 'Kraków → Pacanów'
    },
    {
      from: locations.krakow,
      to: locations.pacanow,
      expectedKm: 'około 130-150 km',
      description: 'Gliniana 17 → Pacanów'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📍 ${test.description}`);
    console.log(`   Od: ${test.from.name} (${test.from.lat}, ${test.from.lng})`);
    console.log(`   Do: ${test.to.name} (${test.to.lat}, ${test.to.lng})`);
    console.log(`   Oczekiwane: ${test.expectedKm}`);
    
    try {
      // Build OSRM URL
      const url = `https://router.project-osrm.org/route/v1/car/${test.from.lng},${test.from.lat};${test.to.lng},${test.to.lat}?overview=false`;
      
      console.log(`   🔗 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TechnikAGD/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
        throw new Error(`OSRM error: ${data.code || 'No route found'}`);
      }
      
      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationMin = Math.round(route.duration / 60);
      const durationText = durationMin >= 60 
        ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`
        : `${durationMin} min`;
      
      console.log(`   ✅ Wynik: ${distanceKm} km, ${durationText}`);
      
      // Wait to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1100));
      
    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
    }
  }
  
  console.log('\n\n🔍 Analiza:');
  console.log('Jeśli odległości są prawidłowe (Kraków-Pacanów ~130km), to problem jest gdzie indziej.');
  console.log('Jeśli odległości są błędne, to problem jest w OSRM lub formatowaniu współrzędnych.');
}

// Run tests
testOSRMDistances().catch(console.error);
