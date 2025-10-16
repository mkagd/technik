// geocoding/simple/GoogleGeocoder.js
// Nominatim (OpenStreetMap) Geocoding - 100% DARMOWE!

/**
 * 🌍 Nominatim Geocoder - darmowy geocoding przez OpenStreetMap
 * 
 * ✅ 100% darmowe - bez limitów dla rozumnego użycia
 * ✅ Bez karty kredytowej
 * ✅ Dobra jakość dla Polski/Europy
 * ⚠️ Rate limit: 1 request/sekundę
 */
export default class GoogleGeocoder {
  constructor(apiKey = null) {
    // Nominatim nie wymaga API key! 🎉
    this.baseUrl = 'https://nominatim.openstreetmap.org/search';
    this.reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
    this.userAgent = 'TechnikServiceApp/1.0'; // Wymagane przez Nominatim
    
    console.log('🌍 Nominatim (OpenStreetMap) Geocoder initialized - 100% FREE!');
    
    // 📮 Baza polskich kodów pocztowych (region → miasto)
    this.postalCodeRanges = {
      '31': 'Kraków',
      '30': 'Kraków',
      '32': 'Region krakowski',
      '33': 'Region małopolski',
      '34': 'Region małopolski',
      '35': 'Rzeszów',
      '36': 'Region podkarpacki',
      '37': 'Region podkarpacki',
      '38': 'Region podkarpacki',
      '39': 'Region podkarpacki', // 39-300 = Mielec
      '40': 'Katowice',
      '41': 'Region śląski',
      '42': 'Region śląski',
      '43': 'Region śląski',
      '44': 'Region śląski',
      '00': 'Warszawa',
      '01': 'Warszawa',
      '02': 'Warszawa',
      '50': 'Wrocław',
      '60': 'Poznań',
      '80': 'Gdańsk',
      '90': 'Łódź'
    };
    
    // 📍 Konkretne kody pocztowe → miasta
    this.specificPostalCodes = {
      '39-300': 'Mielec',
      '31-000': 'Kraków',
      '31-042': 'Kraków',
      '33-100': 'Tarnów',
      '38-200': 'Jasło',
      '39-400': 'Dębica',
      '33-300': 'Nowy Sącz'
    };
    
    console.log('🌍 Google Geocoder initialized');
  }

  /**
   * 🎯 Geocode adres na współrzędne (Nominatim API)
   */
  async geocode(address) {
    try {
      // ⚠️ NAJPIERW: Sprawdź i napraw sprzeczności kod pocztowy vs miasto
      const fixedAddress = this.fixConflictingAddress(address);
      const enhancedAddress = this.enhancePolishAddress(fixedAddress);
      
      // 🌍 Nominatim API parameters
      const params = new URLSearchParams({
        q: enhancedAddress,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'pl', // Tylko Polska
        'accept-language': 'pl'
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('🔍 Geocoding (Nominatim):');
      console.log('  📥 Original:', address);
      if (fixedAddress !== address) {
        console.log('  ⚠️  Fixed:', fixedAddress);
      }
      console.log('  ✨ Enhanced:', enhancedAddress);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent // Wymagane przez Nominatim
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        throw new Error('Nie znaleziono adresu');
      }

      // 📊 Loguj wszystkie wyniki
      console.log(`  📍 Nominatim zwrócił ${results.length} wyników:`);
      results.slice(0, 3).forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.display_name}`);
        console.log(`       Typ: ${r.type} (${r.class})`);
        console.log(`       Coords: ${r.lat}, ${r.lon}`);
        console.log(`       Importance: ${r.importance}`);
      });

      // ✅ Wybierz najlepszy wynik (najdokładniejszy)
      const bestResult = this.selectBestNominatimResult(results);
      console.log(`  ✅ Wybrano: ${bestResult.display_name}`);
      
      return {
        success: true,
        data: {
          lat: parseFloat(bestResult.lat),
          lng: parseFloat(bestResult.lon),
          address: bestResult.display_name,
          accuracy: this.getNominatimAccuracy(bestResult),
          place_id: bestResult.place_id,
          components: this.parseNominatimComponents(bestResult),
          confidence: this.calculateNominatimConfidence(bestResult)
        }
      };

    } catch (error) {
      console.error('🚨 Geocoding error:', error);
      throw error;
    }
  }

  /**
   * 🔄 Reverse geocoding - współrzędne na adres (Nominatim)
   */
  async reverseGeocode(lat, lng) {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'pl'
      });

      const url = `${this.reverseUrl}?${params}`;
      console.log('🔄 Reverse geocoding (Nominatim):', { lat, lng });

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      const result = await response.json();

      if (!result || result.error) {
        throw new Error('Nie znaleziono adresu');
      }

      return {
        address: result.display_name,
        components: this.parseNominatimComponents(result)
      };

    } catch (error) {
      console.error('🚨 Reverse error:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Napraw sprzeczności: kod pocztowy vs miasto
   * Przykład: "39-300 Kraków" → "39-300 Mielec" (kod 39-300 należy do Mielca!)
   */
  fixConflictingAddress(address) {
    // Wyciągnij kod pocztowy i miasto z adresu
    const postalCodeMatch = address.match(/(\d{2})-(\d{3})/);
    if (!postalCodeMatch) {
      return address; // Brak kodu pocztowego - nic nie rób
    }

    const postalCode = postalCodeMatch[0]; // np. "39-300"
    const postalPrefix = postalCodeMatch[1]; // np. "39"
    
    // Sprawdź czy to konkretny kod który znamy
    const correctCity = this.specificPostalCodes[postalCode];
    
    if (correctCity) {
      // Znamy dokładne miasto dla tego kodu
      // Sprawdź czy w adresie jest inne miasto
      const addressLower = address.toLowerCase();
      const correctCityLower = correctCity.toLowerCase();
      
      // Lista miast do sprawdzenia
      const commonCities = [
        'kraków', 'krakow', 'warszawa', 'warsaw', 'wrocław', 'wroclaw',
        'poznań', 'poznan', 'gdańsk', 'gdansk', 'łódź', 'lodz',
        'katowice', 'rzeszów', 'rzeszow', 'lublin', 'białystok', 'bialystok',
        'szczecin', 'tarnów', 'tarnow', 'mielec', 'jasło', 'jaslo',
        'dębica', 'debica', 'nowy sącz', 'nowy sacz'
      ];
      
      // Sprawdź czy w adresie jest jakieś miasto
      const foundCity = commonCities.find(city => addressLower.includes(city));
      
      if (foundCity && !correctCityLower.includes(foundCity) && !foundCity.includes(correctCityLower)) {
        // Jest sprzeczność! Kod mówi jedno, miasto drugie
        console.warn(`⚠️  SPRZECZNOŚĆ: Kod ${postalCode} należy do "${correctCity}", ale w adresie jest "${foundCity}"`);
        console.warn(`⚠️  Naprawiam: używam miasta z kodu pocztowego (${correctCity})`);
        
        // Zamień błędne miasto na poprawne
        const regex = new RegExp(`\\b${foundCity}\\b`, 'gi');
        return address.replace(regex, correctCity);
      }
    } else {
      // Nie znamy konkretnego kodu, sprawdź region (2 pierwsze cyfry)
      const regionCity = this.postalCodeRanges[postalPrefix];
      
      if (regionCity && regionCity !== 'Region') {
        // Mamy przypuszczalne miasto dla tego regionu
        const addressLower = address.toLowerCase();
        
        // Sprawdź czy nie ma sprzeczności z głównym miastem regionu
        if (regionCity === 'Kraków' && !addressLower.includes('krakow') && !addressLower.includes('kraków')) {
          // OK, może być inna miejscowość w regionie
        } else if (regionCity === 'Mielec' || postalPrefix === '39') {
          // Kod 39-xxx to region podkarpacki, głównie Mielec
          const isMielecCode = postalCode.startsWith('39-3'); // 39-300 do 39-399 to Mielec
          if (isMielecCode && addressLower.includes('kraków')) {
            console.warn(`⚠️  SPRZECZNOŚĆ: Kod ${postalCode} należy do Mielca, ale w adresie jest Kraków`);
            console.warn(`⚠️  Naprawiam: zmieniam Kraków → Mielec`);
            return address.replace(/kraków|krakow/gi, 'Mielec');
          }
        }
      }
    }
    
    return address; // Brak sprzeczności lub nie udało się wykryć
  }

  /**
   * 🇵🇱 Popraw polski adres dla lepszego geocoding
   */
  enhancePolishAddress(address) {
    let enhanced = address.trim();

    // Podstawowe poprawki pisowni miast
    const cityCorrections = {
      'krakow': 'Kraków',
      'cracow': 'Kraków', 
      'warszawa': 'Warszawa',
      'warsaw': 'Warszawa',
      'lodz': 'Łódź',
      'wroclaw': 'Wrocław',
      'poznan': 'Poznań',
      'gdansk': 'Gdańsk'
    };

    // Rozwiń skróty ulic
    enhanced = enhanced.replace(/\bul\b\.?/gi, 'ulica');
    enhanced = enhanced.replace(/\bal\b\.?/gi, 'aleja');
    enhanced = enhanced.replace(/\bpl\b\.?/gi, 'plac');
    enhanced = enhanced.replace(/\bos\b\.?/gi, 'osiedle');

    // Popraw miasta
    Object.entries(cityCorrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      enhanced = enhanced.replace(regex, correct);
    });

    // Dodaj Polskę jeśli nie ma
    if (!enhanced.toLowerCase().includes('polska') && 
        !enhanced.toLowerCase().includes('poland')) {
      enhanced += ', Polska';
    }

    return enhanced;
  }

  /**
   * 📋 Parse Nominatim address components
   */
  parseNominatimComponents(result) {
    const addr = result.address || {};
    
    return {
      street_number: addr.house_number,
      street: addr.road || addr.street,
      city: addr.city || addr.town || addr.village || addr.municipality,
      postal_code: addr.postcode,
      country: addr.country,
      county: addr.county,
      state: addr.state
    };
  }

  /**
   * 🎯 Określ dokładność wyniku Nominatim
   */
  getNominatimAccuracy(result) {
    const type = result.type;
    const addressType = result.addresstype;
    
    if (type === 'house' || addressType === 'house') {
      return 'ROOFTOP'; // Dokładny adres budynku
    } else if (type === 'building' || type === 'residential') {
      return 'RANGE_INTERPOLATED';
    } else if (type === 'road' || type === 'street') {
      return 'GEOMETRIC_CENTER';
    } else {
      return 'APPROXIMATE';
    }
  }

  /**
   * 📊 Oblicz confidence na podstawie Nominatim data
   */
  calculateNominatimConfidence(result) {
    let confidence = 0.5;

    // Bonus za importance (Nominatim scoring)
    const importance = result.importance || 0;
    confidence += importance * 0.3; // importance 0-1

    // Bonus za dokładność typu
    const type = result.type;
    if (type === 'house') {
      confidence = 0.95;
    } else if (type === 'building' || type === 'residential') {
      confidence = 0.85;
    } else if (type === 'road' || type === 'street') {
      confidence = 0.75;
    } else if (type === 'city' || type === 'town') {
      confidence = 0.70;
    } else {
      confidence = 0.65;
    }

    // Bonus za obecność numeru domu
    if (result.address?.house_number) {
      confidence += 0.05;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 🎯 Wybierz najlepszy wynik z wielu wyników Nominatim
   * Preferuje: house > building > road > city
   */
  selectBestNominatimResult(results) {
    if (results.length === 1) {
      return results[0];
    }

    // Ranking wyników Nominatim
    const ranked = results.map(result => {
      let score = 0;

      // ⭐ Najważniejsze: Typ lokalizacji
      const type = result.type;
      if (type === 'house') {
        score += 100; // Najlepsze - dokładny adres domu
      } else if (type === 'building' || type === 'residential') {
        score += 80; // Dobre - budynek
      } else if (type === 'road' || type === 'street') {
        score += 60; // Średnie - ulica
      } else if (type === 'city' || type === 'town' || type === 'village') {
        score += 40; // Niskie - tylko miasto
      } else {
        score += 20; // Bardzo niskie - region/kraj
      }

      // ⭐ Importance score (Nominatim własny ranking)
      const importance = result.importance || 0;
      score += importance * 50; // importance 0-1 → 0-50 punktów

      // ⭐ Kompletność adresu
      const addr = result.address || {};
      if (addr.house_number) score += 20; // Numer domu
      if (addr.road || addr.street) score += 15; // Ulica
      if (addr.city || addr.town) score += 10; // Miasto
      if (addr.postcode) score += 10; // Kod pocztowy

      // ⭐ Class preferowany (miejsce zamieszkania)
      if (result.class === 'place') score += 10;
      if (result.class === 'building') score += 15;

      return { result, score };
    });

    // Sortuj malejąco po score
    ranked.sort((a, b) => b.score - a.score);

    console.log('  🎯 Ranking wyników:');
    ranked.slice(0, 3).forEach((r, i) => {
      console.log(`    ${i + 1}. Score ${r.score}: ${r.result.display_name}`);
    });

    return ranked[0].result;
  }

}

// Helper do szybkiego użycia
export const createGeocoder = (apiKey) => {
  return new GoogleGeocoder(apiKey);
};

// Singleton dla całej aplikacji
let geocoderInstance = null;

export const getGeocoder = (apiKey) => {
  if (!geocoderInstance && apiKey) {
    geocoderInstance = new GoogleGeocoder(apiKey);
  }
  return geocoderInstance;
};