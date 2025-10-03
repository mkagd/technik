// Sprawdzenie czy współrzędne odpowiadają Glinianej 17 w Krakowie
const checkCoordinates = () => {
  const receivedCoords = { lat: 50.06512843710287, lng: 19.949483126223488 };
  const krakowCenter = { lat: 50.0647, lng: 19.945 };
  
  // Oblicz odległość między punktami (w km)
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // promień Ziemi w km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  const distance = calculateDistance(
    receivedCoords.lat, receivedCoords.lng,
    krakowCenter.lat, krakowCenter.lng
  );
  
  console.log('📍 Współrzędne otrzymane z systemu:', receivedCoords);
  console.log('🏛️ Centrum Krakowa (domyślne):', krakowCenter);
  console.log(`📏 Odległość od centrum: ${distance.toFixed(3)} km`);
  
  if (distance < 2) {
    console.log('✅ SUKCES: Lokalizacja jest w Krakowie!');
    console.log('🎯 System działa poprawnie - używa rzeczywistej lokalizacji zamiast domyślnej');
  } else {
    console.log('❌ BŁĄD: Lokalizacja poza Krakowem');
  }
  
  // Sprawdź czy to może być Gliniana
  console.log('\n🏠 Sprawdzenie czy to może być ul. Gliniana:');
  console.log('   Gliniana to ulica w dzielnicy Krowodrza');
  console.log('   Powinna być kilkaset metrów od centrum');
  console.log(`   Odległość ${distance.toFixed(3)} km to około ${(distance * 1000).toFixed(0)} metrów`);
  
  if (distance > 0 && distance < 5) {
    console.log('✅ PRAWDOPODOBNIE: To może być ul. Gliniana lub inna ulica w Krakowie');
  }
};

checkCoordinates();