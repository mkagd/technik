// Test weryfikacji klucza Google Maps API i bibliotek
const testGoogleMapsAPI = () => {
  console.log('🔍 Test Google Maps API Configuration');
  
  // Test 1: Sprawdź czy klucz API jest ustawiony
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('1. API Key present:', apiKey ? '✅ YES' : '❌ NO');
  if (apiKey) {
    console.log('   API Key starts with:', apiKey.substring(0, 10) + '...');
  }
  
  // Test 2: Sprawdź czy Google Maps jest załadowany
  console.log('2. Google Maps loaded:', typeof window !== 'undefined' && window.google ? '✅ YES' : '❌ NO');
  
  if (typeof window !== 'undefined' && window.google) {
    console.log('3. Google Maps version:', window.google.maps.version || 'Unknown');
    console.log('4. Places library available:', window.google.maps.places ? '✅ YES' : '❌ NO');
    
    if (window.google.maps.places) {
      console.log('5. AutocompleteService available:', window.google.maps.places.AutocompleteService ? '✅ YES' : '❌ NO');
      console.log('6. PlacesService available:', window.google.maps.places.PlacesService ? '✅ YES' : '❌ NO');
    }
  }
  
  // Test 3: Spróbuj stworzyć prosty service
  if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
    try {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      console.log('7. AutocompleteService creation:', autocompleteService ? '✅ SUCCESS' : '❌ FAILED');
      
      const div = document.createElement('div');
      const placesService = new window.google.maps.places.PlacesService(div);
      console.log('8. PlacesService creation:', placesService ? '✅ SUCCESS' : '❌ FAILED');
      
    } catch (error) {
      console.log('7-8. Service creation error:', error);
    }
  }
  
  console.log('--- Test completed ---');
};

// Uruchom test po załadowaniu strony
if (typeof window !== 'undefined') {
  // Test natychmiast
  testGoogleMapsAPI();
  
  // Test po 3 sekundach (na wypadek opóźnionego ładowania)
  setTimeout(() => {
    console.log('\n🔄 Retry test after 3 seconds:');
    testGoogleMapsAPI();
  }, 3000);
} else {
  console.log('Running on server side, skipping Google Maps test');
}

export default testGoogleMapsAPI;