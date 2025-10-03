// test-geocoding-system.js
// Test nowego systemu geocoding

const fs = require('fs');
const path = require('path');

console.log('🗺️ TESTOWANIE GEOCODING SYSTEM');
console.log('================================');

// Pokaż strukturę folderów
function showFolderStructure() {
  console.log('\n📁 Struktura folderów:');
  
  const geocodingPath = path.join(__dirname, 'geocoding');
  
  function listDir(dirPath, prefix = '') {
    try {
      const items = fs.readdirSync(dirPath);
      items.forEach((item, index) => {
        const fullPath = path.join(dirPath, item);
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        
        console.log(prefix + connector + item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          listDir(fullPath, newPrefix);
        }
      });
    } catch (error) {
      console.log(prefix + '❌ Error reading directory:', error.message);
    }
  }
  
  listDir(geocodingPath);
}

// Pokaż rozmiary plików
function showFileSizes() {
  console.log('\n📊 Rozmiary plików:');
  
  const files = [
    'geocoding/index.js',
    'geocoding/providers/GoogleGeocodingProvider.js',
    'geocoding/providers/NominatimProvider.js', 
    'geocoding/utils/GeocodingCache.js',
    'geocoding/utils/AddressValidator.js',
    'geocoding/examples/usage-examples.js',
    'geocoding/README.md'
  ];
  
  files.forEach(file => {
    try {
      const fullPath = path.join(__dirname, file);
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  ✅ ${file}: ${sizeKB} KB`);
    } catch (error) {
      console.log(`  ❌ ${file}: Not found`);
    }
  });
}

// Pokaż przykład konfiguracji
function showConfigExample() {
  console.log('\n⚙️ Przykład konfiguracji:');
  
  const config = `
// W Next.js component lub API route:
import GeocodingService from './geocoding/index.js';

const geocoding = new GeocodingService({
  googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  region: 'pl',
  language: 'pl',
  enableCache: true,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24h
  providers: ['google', 'nominatim']
});

// Użycie:
const result = await geocoding.geocode('ul. Floriańska 3, Kraków');
console.log(result.lat, result.lng);
`;
  
  console.log(config);
}

// Pokaż przykłady testowych adresów
function showTestAddresses() {
  console.log('\n🎯 Przykłady adresów do testowania:');
  
  const testCases = [
    {
      category: 'Poprawne adresy',
      addresses: [
        'ul. Floriańska 3, 31-021 Kraków',
        'al. Jerozolimskie 65, Warszawa',
        'Rynek Główny 1, Kraków',
        'os. Słowackiego 15/5, 30-001 Kraków'
      ]
    },
    {
      category: 'Adresy do korekty',
      addresses: [
        'ul. Florianska 3, krakow',  // błędna pisownia
        'warszawa',                   // tylko miasto
        'cracow',                     // angielska nazwa
        'ul Mickiewicza 30'          // brak kropki
      ]
    },
    {
      category: 'Edge cases',
      addresses: [
        'Zakopane',
        'Nowy Targ',
        'ul. Bardzo Długa Nazwa Ulicy 123/456',
        '30-001 Kraków'  // samo kod pocztowy
      ]
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n  📋 ${testCase.category}:`);
    testCase.addresses.forEach(addr => {
      console.log(`    • "${addr}"`);
    });
  });
}

// Pokaż features summary
function showFeaturesSummary() {
  console.log('\n✨ FUNKCJONALNOŚCI SYSTEMU:');
  
  const features = [
    '🌍 Multi-provider (Google + OpenStreetMap)',
    '🇵🇱 Specjalizacja dla adresów polskich', 
    '💾 Dual-layer cache (memory + localStorage)',
    '✅ Inteligentna walidacja i korekta błędów',
    '📦 Batch processing z rate limiting',
    '🔄 Automatic fallback między providerami',
    '📊 Statystyki i monitoring cache',
    '🎯 Wysokiej jakości accuracy scoring',
    '⚡ Performance optimizations',
    '🛠️ Easy integration z Next.js'
  ];
  
  features.forEach(feature => {
    console.log(`  ${feature}`);
  });
}

// Pokaż instrukcje setup
function showSetupInstructions() {
  console.log('\n🚀 INSTRUKCJE SETUP:');
  
  console.log(`
1. 📝 Dodaj Google API Key do .env.local:
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

2. 📥 Import w komponencie:
   import GeocodingService from './geocoding/index.js';

3. 🔧 Konfiguracja:
   const geocoding = new GeocodingService({
     googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   });

4. 🎯 Użycie:
   const result = await geocoding.geocode('ul. Floriańska 3, Kraków');

5. 📖 Zobacz więcej w: geocoding/examples/usage-examples.js
  `);
}

// Uruchom wszystkie testy
async function runTests() {
  showFolderStructure();
  showFileSizes();
  showConfigExample();
  showTestAddresses();
  showFeaturesSummary();
  showSetupInstructions();
  
  console.log('\n🎉 GEOCODING SYSTEM GOTOWY!');
  console.log('============================');
  console.log('📖 Pełna dokumentacja: geocoding/README.md');
  console.log('🔬 Przykłady użycia: geocoding/examples/usage-examples.js');
  console.log('⚠️  Pamiętaj: Ustaw Google API Key dla najlepszej dokładności!');
}

// Uruchom testy
runTests().catch(console.error);