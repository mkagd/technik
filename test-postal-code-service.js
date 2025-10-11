/**
 * Test serwisu kodów pocztowych
 * 
 * Uruchom: node test-postal-code-service.js
 */

const { PostalCodeService } = require('./lib/postal-code/service.ts');

async function testPostalCodeService() {
  console.log('🧪 Test PostalCodeService\n');
  
  const service = PostalCodeService.getInstance();
  
  // Test 1: Warszawa
  console.log('📍 Test 1: Warszawa (00-001)');
  const result1 = await service.getCityFromPostalCode('00-001');
  console.log('Wynik:', result1);
  console.log('');
  
  // Test 2: Kraków
  console.log('📍 Test 2: Kraków (30-001)');
  const result2 = await service.getCityFromPostalCode('30-001');
  console.log('Wynik:', result2);
  console.log('');
  
  // Test 3: Gdańsk
  console.log('📍 Test 3: Gdańsk (80-001)');
  const result3 = await service.getCityFromPostalCode('80-001');
  console.log('Wynik:', result3);
  console.log('');
  
  // Test 4: Wrocław
  console.log('📍 Test 4: Wrocław (50-001)');
  const result4 = await service.getCityFromPostalCode('50-001');
  console.log('Wynik:', result4);
  console.log('');
  
  // Test 5: Ponowne wyszukanie (powinno być z cache)
  console.log('📍 Test 5: Warszawa ponownie (z cache)');
  const result5 = await service.getCityFromPostalCode('00-001');
  console.log('Wynik:', result5);
  console.log('');
  
  // Test 6: Nieprawidłowy format
  console.log('📍 Test 6: Nieprawidłowy format (abc-def)');
  const result6 = await service.getCityFromPostalCode('abc-def');
  console.log('Wynik:', result6);
  console.log('');
  
  // Statystyki
  console.log('📊 Statystyki:');
  const stats = service.getStats();
  console.log('  - Cache size:', stats.cacheSize, 'kodów');
  console.log('  - Google requests:', stats.googleRequests, '/', stats.googleLimit);
  console.log('  - Google usage:', stats.googleUsagePercent + '%');
  console.log('  - OSM enabled:', stats.osmEnabled ? '✅' : '❌');
  console.log('  - Google enabled:', stats.googleEnabled ? '✅' : '❌');
  console.log('');
  
  // Eksport cache
  console.log('💾 Eksportowany cache:');
  const cacheData = service.exportCache();
  console.log(JSON.stringify(cacheData, null, 2));
  
  console.log('\n✅ Test zakończony!');
}

// Uruchom test
testPostalCodeService().catch(error => {
  console.error('❌ Błąd podczas testu:', error);
  process.exit(1);
});
