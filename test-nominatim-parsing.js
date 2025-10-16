// test-nominatim-parsing.js
// Test parsowania display_name z Nominatim

const testCases = [
  {
    input: 'Gliniana 17, Kraków',
    display_name: '17, Gliniana, Rogatka, Płaszów, Podgórze, Kraków, województwo małopolskie, 30-732, Polska',
    expected: 'Gliniana 17, Kraków'
  },
  {
    input: 'Rynek Główny, Kraków',
    display_name: 'Rynek Główny, Stare Miasto, Śródmieście, Kraków, województwo małopolskie, 31-008, Polska',
    expected: 'Rynek Główny, Stare Miasto'
  },
  {
    input: 'Tarnów',
    display_name: 'Tarnów, województwo małopolskie, Polska',
    expected: 'Tarnów, województwo małopolskie'
  },
  {
    input: 'Mielec',
    display_name: 'Mielec, powiat mielecki, województwo podkarpackie, 39-300, Polska',
    expected: 'Mielec, powiat mielecki'
  }
];

function parseDisplayName(display_name) {
  const parts = display_name.split(',').map(p => p.trim());
  
  let shortName;
  if (parts.length >= 2) {
    const firstPart = parts[0];
    const secondPart = parts[1];
    
    if (!isNaN(firstPart) && secondPart) {
      // Format: "17, Gliniana" → "Gliniana 17"
      shortName = `${secondPart} ${firstPart}`;
    } else {
      // Format normalny: weź pierwsze 2 części
      shortName = parts.slice(0, 2).join(', ');
    }
    
    // Dodaj miasto jeśli nie ma go w krótkiej nazwie
    const cityPart = parts.find(p => 
      p.includes('Kraków') || 
      p.includes('Tarnów') || 
      p.includes('Mielec') ||
      p.includes('Rzeszów')
    );
    
    if (cityPart && !shortName.includes(cityPart)) {
      shortName = `${shortName}, ${cityPart}`;
    }
  } else {
    shortName = display_name;
  }
  
  return shortName;
}

console.log('🧪 Test parsowania Nominatim display_name:\n');

testCases.forEach((test, index) => {
  const result = parseDisplayName(test.display_name);
  const passed = result === test.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Nominatim: "${test.display_name}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log('');
});

// Test rzeczywisty dla "Gliniana 17, Kraków"
const realTest = parseDisplayName('17, Gliniana, Rogatka, Płaszów, Podgórze, Kraków, województwo małopolskie, 30-732, Polska');
console.log('🎯 Rzeczywisty przypadek:');
console.log(`  Input: "Gliniana 17, Kraków"`);
console.log(`  Wynik: "${realTest}"`);
console.log(`  Oczekiwane: "Gliniana 17, Kraków"`);
console.log(`  Status: ${realTest === 'Gliniana 17, Kraków' ? '✅ OK!' : '❌ Wymaga poprawki'}`);
