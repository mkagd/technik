// Test ustawiania lokalizacji - symulacja całego procesu
// Ten test symuluje proces który zachodzi po wpisaniu adresu i kliknięciu Enter

const testLocationSetting = async () => {
  console.log('🧪 Test ustawiania lokalizacji: gliniana 17, kraków');
  
  // KROK 1: Normalizacja adresu (kopiuję funkcję z komponentu)
  function normalizeAddress(address) {
    if (!address) return '';
    
    return address
      .toLowerCase()
      .trim()
      .replace(/ul\./gi, '')
      .replace(/ulica/gi, '')
      .replace(/\s+/g, ' ')
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
  }

  // KROK 2: Parsowanie adresu polskiego (kopiuję funkcję z komponentu)
  function parsePolishAddress(address) {
    const normalizedAddress = normalizeAddress(address);
    console.log(`🔍 parsePolishAddress - adres: ${address} znormalizowany: ${normalizedAddress}`);
    
    const polishCities = {
      'krakow': { lat: 50.0647, lng: 19.945 },
      'warszawa': { lat: 52.2297, lng: 21.0122 },
      'gdansk': { lat: 54.3520, lng: 18.6466 },
      'wroclaw': { lat: 51.1079, lng: 17.0385 },
      'poznan': { lat: 52.4064, lng: 16.9252 },
      'lodz': { lat: 51.7592, lng: 19.4560 },
      'katowice': { lat: 50.2649, lng: 19.0238 },
      'lublin': { lat: 51.2465, lng: 22.5684 },
      'bialystok': { lat: 53.1325, lng: 23.1688 },
      'czestochowa': { lat: 50.7964, lng: 19.1202 },
      'radom': { lat: 51.4027, lng: 21.1471 },
      'tarnow': { lat: 50.0135, lng: 20.9866 },
      'rzeszow': { lat: 50.0414, lng: 21.9991 },
      'jaslo': { lat: 49.7450, lng: 21.4719 }
    };

    // Znajdź miasto w adresie
    let cityFound = null;
    let cityCoords = null;
    
    for (const [city, coords] of Object.entries(polishCities)) {
      if (normalizedAddress.includes(city)) {
        cityFound = city;
        cityCoords = coords;
        console.log(`✅ Znaleziono miasto: ${city} dla adresu: ${normalizedAddress}`);
        break;
      }
    }

    if (cityFound && cityCoords) {
      // Jeśli to tylko miasto
      if (normalizedAddress.trim() === cityFound) {
        return {
          lat: cityCoords.lat,
          lng: cityCoords.lng,
          address: cityFound.charAt(0).toUpperCase() + cityFound.slice(1) + ', Polska'
        };
      }
      
      // Jeśli to adres z ulicą
      console.log('🏠 Tworzę pełny adres z ulicą');
      const streetAddress = address.trim();
      // Generuj losowe współrzędne w okolicy miasta (symulacja geocodingu)
      const randomLat = cityCoords.lat + (Math.random() - 0.5) * 0.02;
      const randomLng = cityCoords.lng + (Math.random() - 0.5) * 0.02;
      
      return {
        lat: cityCoords.lat, // Miasto dla tras
        lng: cityCoords.lng,
        address: streetAddress + ', Polska',
        coordinates: { lat: randomLat, lng: randomLng } // Dokładny adres
      };
    }

    console.log('❌ Nie znaleziono miasta w adresie');
    return null;
  }

  // Test parsowania
  const testAddress = 'gliniana 17, kraków';
  const result = parsePolishAddress(testAddress);
  
  if (result) {
    console.log('✅ Parsing result:', result);
    
    // KROK 3: Symulacja ustawienia startLocation
    const startLocation = {
      address: result.address,
      coordinates: result.coordinates || { lat: result.lat, lng: result.lng },
      isDetected: false // ręcznie ustawione
    };
    
    console.log('📍 StartLocation state będzie ustawiony na:', startLocation);
    
    // KROK 4: Symulacja optimizationPreferences update
    const optimizationPreferences = {
      priorityMode: 'balanced',
      startLocation: startLocation.coordinates
    };
    
    console.log('🎯 OptimizationPreferences będą:', optimizationPreferences);
    
    // KROK 5: Symulacja wywołania API
    console.log('🚀 API zostanie wywołane z preferences:', JSON.stringify({
      servicemanId: 'USER_001',
      timeframe: 'week',
      preferences: optimizationPreferences
    }, null, 2));
    
    return startLocation;
  } else {
    console.log('❌ Parsowanie nieudane');
    return null;
  }
};

// Uruchom test
testLocationSetting()
  .then(result => {
    if (result) {
      console.log('\n🎉 Test zakończony sukcesem!');
      console.log('🏁 Finalne startLocation:', result);
    } else {
      console.log('\n❌ Test nieudany');
    }
  })
  .catch(error => {
    console.error('🚫 Błąd testu:', error);
  });