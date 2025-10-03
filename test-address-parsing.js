// Test parsowania adresu "gliniana 17, kraków"
console.log('🧪 Test parsowania adresu');

const normalizeAddress = (addr) => {
  return addr.toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .trim();
};

const polishLocations = {
  'krakow': { lat: 50.0647, lng: 19.9450, address: 'Kraków, Polska' },
  'kraków': { lat: 50.0647, lng: 19.9450, address: 'Kraków, Polska' },
};

const parsePolishAddress = (addr) => {
  const normalized = normalizeAddress(addr);
  console.log('🔍 parsePolishAddress - adres:', addr, 'znormalizowany:', normalized);
  
  // Sprawdź czy zawiera nazwę miasta
  for (const [city, data] of Object.entries(polishLocations)) {
    if (normalized.includes(city)) {
      console.log('✅ Znaleziono miasto:', city, 'dla adresu:', normalized);
      // Jeśli to pełny adres z ulicą (np. "gliniana 17, krakow")
      if (normalized.includes(',') || /\d/.test(normalized)) {
        console.log('🏠 Tworzę pełny adres z ulicą');
        return {
          ...data,
          address: addr + ', ' + data.address.split(',')[1],
          coordinates: {
            lat: data.lat + (Math.random() - 0.5) * 0.01,
            lng: data.lng + (Math.random() - 0.5) * 0.01
          }
        };
      }
      return data;
    }
  }
  return null;
};

// Test różnych wersji adresu
const testAddresses = [
  'gliniana 17, kraków',
  'gliniana 17, krakow',
  'Gliniana 17, Kraków',
  'kraków',
  'krakow'
];

testAddresses.forEach(addr => {
  console.log('\n--- Test dla:', addr, '---');
  const result = parsePolishAddress(addr);
  if (result) {
    console.log('✅ Sukces:', result);
  } else {
    console.log('❌ Brak wyników');
  }
});