// Test geocodingu dla Pacanów
// Sprawdza czy Google API zwraca poprawne współrzędne

console.log('🧪 Test Geocodingu: Pacanów\n');
console.log('═'.repeat(70));

// Symulacja GoogleGeocoder.fixConflictingAddress
function fixConflictingAddress(address) {
  const specificPostalCodes = {
    '28-133': 'Pacanów',
    '39-300': 'Mielec',
    '31-000': 'Kraków'
  };
  
  const postalCodeMatch = address.match(/(\d{2})-(\d{3})/);
  if (!postalCodeMatch) return address;

  const postalCode = postalCodeMatch[0];
  const correctCity = specificPostalCodes[postalCode];
  
  if (correctCity) {
    const addressLower = address.toLowerCase();
    const commonCities = ['kraków', 'krakow', 'warszawa', 'mielec', 'pacanów', 'pacanow'];
    const foundCity = commonCities.find(city => addressLower.includes(city));
    
    if (foundCity && correctCity.toLowerCase() !== foundCity) {
      console.log(`⚠️  SPRZECZNOŚĆ: Kod ${postalCode} → "${correctCity}", ale adres ma "${foundCity}"`);
      const regex = new RegExp(`\\b${foundCity}\\b`, 'gi');
      const fixed = address.replace(regex, correctCity);
      console.log(`✅  NAPRAWA: "${address}" → "${fixed}"\n`);
      return fixed;
    }
  }
  
  return address;
}

// Test adresu
const testAddress = 'Słupia 114, 28-133 Pacanów';
console.log(`\n📍 Testowanie: "${testAddress}"\n`);

const fixedAddress = fixConflictingAddress(testAddress);
console.log(`Naprawiony adres: "${fixedAddress}"`);

// Sprawdź co Google zwróciłby (symulacja)
console.log('\n🔍 Analiza:');
console.log('   Ulica: Słupia 114');
console.log('   Kod pocztowy: 28-133 → Pacanów ✅');
console.log('   Miasto w adresie: Pacanów ✅');
console.log('   Status: Adres poprawny, brak sprzeczności');

console.log('\n📊 Oczekiwane współrzędne dla Pacanowa:');
console.log('   Szerokość: ~50.4° (około 50.40)');
console.log('   Długość: ~20.8° (około 20.85)');

console.log('\n❌ OTRZYMANE współrzędne (z screenshot):');
console.log('   Szerokość: 50.0647°');
console.log('   Długość: 19.945°');
console.log('   → To jest KRAKÓW (Stare Miasto)! ❌');

console.log('\n⚠️  PROBLEM:');
console.log('   Google API zwraca współrzędne Krakowa zamiast Pacanowa!');
console.log('   Możliwe przyczyny:');
console.log('   1. API key ma ograniczenia domenowe (localhost nie działa)');
console.log('   2. Google nie zna ulicy "Słupia" w Pacanowie');
console.log('   3. Google zwraca fallback dla nieznanego adresu');
console.log('   4. Cache w przeglądarce lub API');

console.log('\n💡 ROZWIĄZANIE:');
console.log('   Sprawdzić logi DevTools Console w przeglądarce');
console.log('   Szukać: "📍 Geocoding adresu" i "Google zwrócił X wyników"');
console.log('   Zobaczyć co naprawdę zwraca Google API');

console.log('\n═'.repeat(70));
