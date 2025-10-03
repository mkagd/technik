// test-simple-geocoder.js
// Test prostego Google Geocoder

import GoogleGeocoder from './geocoding/simple/GoogleGeocoder.js';

console.log('🌍 TEST GOOGLE GEOCODER');
console.log('======================');

// Przykład użycia
async function testGeocoder() {
  // Użyj swojego Google API Key
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
  
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  Ustaw Google API Key w .env.local:');
    console.log('   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_real_key');
    return;
  }

  try {
    const geocoder = new GoogleGeocoder(API_KEY);

    // Test różnych formatów polskich adresów
    const testAddresses = [
      'ul. Floriańska 3, 31-021 Kraków',
      'Rynek Główny 1, Kraków',
      'al. Jerozolimskie 65, Warszawa', 
      'ul. Florianska 3, krakow',  // błędna pisownia
      'warszawa',                   // samo miasto
      'cracow'                      // angielska nazwa
    ];

    console.log(`\n🔍 Testowanie ${testAddresses.length} adresów:\n`);

    for (const address of testAddresses) {
      try {
        console.log(`📍 Input: "${address}"`);
        
        const result = await geocoder.geocode(address);
        
        console.log(`✅ Result:`);
        console.log(`   Lat/Lng: ${result.lat}, ${result.lng}`);
        console.log(`   Address: ${result.address}`);
        console.log(`   Accuracy: ${result.accuracy}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   City: ${result.components.city}`);
        console.log('');
        
        // Pauza żeby nie hit limitów
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
      }
    }

    // Test reverse geocoding
    console.log('🔄 Test Reverse Geocoding:');
    const lat = 50.0647;  // Kraków center
    const lng = 19.9450;
    
    const reverseResult = await geocoder.reverseGeocode(lat, lng);
    console.log(`📍 ${lat}, ${lng} → ${reverseResult.address}`);

  } catch (error) {
    console.error('🚨 Setup error:', error.message);
  }
}

// Przykład integracji z React component
function showReactExample() {
  console.log('\n⚛️  PRZYKŁAD W REACT COMPONENT:');
  
  const reactCode = `
// W komponencie React:
import GoogleGeocoder from './geocoding/simple/GoogleGeocoder.js';

function AddressInput() {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);

  const geocoder = new GoogleGeocoder(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  const handleGeocode = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const result = await geocoder.geocode(address);
      setCoordinates(result);
      console.log('Współrzędne:', result.lat, result.lng);
    } catch (error) {
      alert('Nie znaleziono adresu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Wpisz adres (np. ul. Floriańska 3, Kraków)"
      />
      <button onClick={handleGeocode} disabled={loading}>
        {loading ? 'Szukam...' : 'Znajdź współrzędne'}
      </button>
      
      {coordinates && (
        <div>
          <p>📍 {coordinates.address}</p>
          <p>🎯 {coordinates.lat}, {coordinates.lng}</p>
          <p>🎖️ Dokładność: {coordinates.accuracy}</p>
        </div>
      )}
    </div>
  );
}`;

  console.log(reactCode);
}

// Pokaż konfigurację .env
function showEnvConfig() {
  console.log('\n⚙️ KONFIGURACJA .env.local:');
  console.log('# Dodaj swój Google Maps API Key:');
  console.log('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC..._your_key_here');
  console.log('');
  console.log('💡 Jak uzyskać API Key:');
  console.log('1. Idź do: https://console.cloud.google.com/');
  console.log('2. Utwórz projekt lub wybierz istniejący');
  console.log('3. Włącz Geocoding API');
  console.log('4. Utwórz credentials (API Key)');
  console.log('5. Ogranicz key do Geocoding API dla bezpieczeństwa');
}

// Uruchom test
if (typeof window === 'undefined') {  // Node.js environment
  testGeocoder().then(() => {
    showReactExample();
    showEnvConfig();
    console.log('\n🎉 PROSTY GEOCODER GOTOWY!');
    console.log('========================');
    console.log('📁 Plik: geocoding/simple/GoogleGeocoder.js (3.5KB)');
    console.log('🌍 Tylko Google API - maksymalna dokładność');
    console.log('🇵🇱 Zoptymalizowany dla polskich adresów');
  });
}