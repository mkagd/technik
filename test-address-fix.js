// Test naprawy sprzecznych adresów (kod pocztowy vs miasto)

class TestGeocoder {
  constructor() {
    // 📮 Baza polskich kodów pocztowych (identyczna jak w GoogleGeocoder)
    this.postalCodeRanges = {
      '31': 'Kraków', '30': 'Kraków', '39': 'Region podkarpacki',
    };
    
    this.specificPostalCodes = {
      '39-300': 'Mielec',
      '31-000': 'Kraków',
      '31-042': 'Kraków',
    };
  }

  fixConflictingAddress(address) {
    const postalCodeMatch = address.match(/(\d{2})-(\d{3})/);
    if (!postalCodeMatch) return address;

    const postalCode = postalCodeMatch[0];
    const postalPrefix = postalCodeMatch[1];
    const correctCity = this.specificPostalCodes[postalCode];
    
    if (correctCity) {
      const addressLower = address.toLowerCase();
      const correctCityLower = correctCity.toLowerCase();
      
      const commonCities = [
        'kraków', 'krakow', 'warszawa', 'mielec', 'tarnów', 'tarnow',
        'jasło', 'jaslo', 'dębica', 'debica'
      ];
      
      const foundCity = commonCities.find(city => addressLower.includes(city));
      
      if (foundCity && !correctCityLower.includes(foundCity) && !foundCity.includes(correctCityLower)) {
        console.log(`⚠️  SPRZECZNOŚĆ: Kod ${postalCode} → "${correctCity}", ale adres ma "${foundCity}"`);
        console.log(`✅  NAPRAWA: Zmieniam "${foundCity}" → "${correctCity}"`);
        
        const regex = new RegExp(`\\b${foundCity}\\b`, 'gi');
        return address.replace(regex, correctCity);
      }
    } else {
      const regionCity = this.postalCodeRanges[postalPrefix];
      
      if (postalPrefix === '39') {
        const addressLower = address.toLowerCase();
        const isMielecCode = postalCode.startsWith('39-3');
        if (isMielecCode && addressLower.includes('kraków')) {
          console.log(`⚠️  SPRZECZNOŚĆ: Kod ${postalCode} → Mielec, ale adres ma Kraków`);
          console.log(`✅  NAPRAWA: Zmieniam Kraków → Mielec`);
          return address.replace(/kraków|krakow/gi, 'Mielec');
        }
      }
    }
    
    return address;
  }
}

// 🧪 TESTY
console.log('═'.repeat(70));
console.log('🧪 TEST NAPRAWY SPRZECZNYCH ADRESÓW');
console.log('═'.repeat(70));

const geocoder = new TestGeocoder();

const testCases = [
  {
    name: 'PROBLEMATYCZNY ADRES Z BAZY',
    input: 'Gliniana 17/30, 39-300 Kraków',
    expected: 'Gliniana 17/30, 39-300 Mielec'
  },
  {
    name: 'Poprawny adres - bez zmian',
    input: 'Gliniana 17/30, 39-300 Mielec',
    expected: 'Gliniana 17/30, 39-300 Mielec'
  },
  {
    name: 'Kraków z poprawnym kodem - bez zmian',
    input: 'Rynek Główny 1, 31-042 Kraków',
    expected: 'Rynek Główny 1, 31-042 Kraków'
  },
  {
    name: 'Sprzeczność odwrotna',
    input: 'Floriańska 10, 31-000 Mielec',
    expected: 'Floriańska 10, 31-000 Kraków'
  },
  {
    name: 'Bez kodu pocztowego - bez zmian',
    input: 'Gliniana 17, Kraków',
    expected: 'Gliniana 17, Kraków'
  },
  {
    name: 'Małe litery "krakow"',
    input: 'Gliniana 17/30, 39-300 krakow',
    expected: 'Gliniana 17/30, 39-300 Mielec'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, i) => {
  console.log(`\n📍 Test ${i + 1}: ${test.name}`);
  console.log(`   Input:  "${test.input}"`);
  
  const result = geocoder.fixConflictingAddress(test.input);
  
  console.log(`   Output: "${result}"`);
  console.log(`   Expect: "${test.expected}"`);
  
  if (result === test.expected) {
    console.log(`   ✅ PASS`);
    passed++;
  } else {
    console.log(`   ❌ FAIL`);
    failed++;
  }
  
  console.log('─'.repeat(70));
});

console.log('\n📊 PODSUMOWANIE:');
console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
console.log(`   ❌ Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 Wszystkie testy przeszły! Algorytm działa poprawnie.');
  console.log('\n💡 Teraz geocoding dla "Gliniana 17/30, 39-300 Kraków" automatycznie:');
  console.log('   1. Wykryje sprzeczność (kod 39-300 = Mielec, ale miasto = Kraków)');
  console.log('   2. Naprawi adres → "Gliniana 17/30, 39-300 Mielec"');
  console.log('   3. Geocoduje poprawny adres → prawidłowe współrzędne w Mielcu!');
} else {
  console.log('\n⚠️  Niektóre testy nie przeszły - wymaga poprawek.');
}

console.log('\n═'.repeat(70));
