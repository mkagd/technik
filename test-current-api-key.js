// Test czy aplikacja Next.js używa nowego Google API key
console.log('🔍 TEST KLUCZA API W NEXT.JS');
console.log('===========================');

const testInNextJS = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('Current API Key:', apiKey);
  
  if (apiKey === 'AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo') {
    console.log('✅ NOWY KLUCZ AKTYWNY!');
  } else if (apiKey === 'AIzaSyCEv6hiP1CMmAwynkRLhUmds6kId2TQxSI') {
    console.log('⚠️ Stary klucz - restart serwera');
  } else {
    console.log('❌ Nieznany klucz');
  }
  
  // Test bezpośredniego zapytania
  const testDirectRequest = async () => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Kraków&key=${apiKey}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('🎉 GOOGLE API DZIAŁA!');
        console.log('📍 Znaleziono:', data.results[0].formatted_address);
        console.log('🎯 Współrzędne:', data.results[0].geometry.location);
      } else {
        console.log('❌ Google API błąd:', data.status);
        if (data.error_message) {
          console.log('📝 Szczegóły:', data.error_message);
        }
      }
    } catch (error) {
      console.error('❌ Network error:', error);
    }
  };
  
  testDirectRequest();
};

testInNextJS();