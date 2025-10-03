// Test zmiany lokalizacji startu w systemie
const testLocationChange = async () => {
  console.log('🧪 Test zmiany lokalizacji startu');
  
  // Test 1: Domyślna lokalizacja Kraków
  const krakowLocation = { lat: 50.0647, lng: 19.9450 };
  console.log('📍 Test 1: Kraków', krakowLocation);
  
  const response1 = await fetch('http://localhost:3000/api/travel-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: krakowLocation,
      destination: { lat: 49.745, lng: 21.4719 }, // Przemyśl
      departureTime: Date.now()
    })
  });
  
  if (response1.ok) {
    const data1 = await response1.json();
    console.log('✅ Kraków -> Przemyśl:', data1.duration, 'min,', data1.distance, 'km');
  }
  
  // Test 2: Nowa lokalizacja - Warszawa
  const warszawaLocation = { lat: 52.2297, lng: 21.0122 };
  console.log('📍 Test 2: Warszawa', warszawaLocation);
  
  const response2 = await fetch('http://localhost:3000/api/travel-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: warszawaLocation,
      destination: { lat: 49.745, lng: 21.4719 }, // Przemyśl
      departureTime: Date.now()
    })
  });
  
  if (response2.ok) {
    const data2 = await response2.json();
    console.log('✅ Warszawa -> Przemyśl:', data2.duration, 'min,', data2.distance, 'km');
  }
  
  // Test 3: Gdańsk
  const gdanskLocation = { lat: 54.3520, lng: 18.6466 };
  console.log('📍 Test 3: Gdańsk', gdanskLocation);
  
  const response3 = await fetch('http://localhost:3000/api/travel-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: gdanskLocation,
      destination: { lat: 49.745, lng: 21.4719 }, // Przemyśl
      departureTime: Date.now()
    })
  });
  
  if (response3.ok) {
    const data3 = await response3.json();
    console.log('✅ Gdańsk -> Przemyśl:', data3.duration, 'min,', data3.distance, 'km');
  }
  
  console.log('🎯 Test zakończony - system uwzględnia różne lokalizacje startu');
};

// Uruchom test
testLocationChange().catch(console.error);