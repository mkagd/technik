// geocoding/providers/GoogleGeocodingProvider.js
// Google Geocoding API - najwyższa jakość dla adresów polskich

/**
 * 🌍 Google Geocoding Provider
 * 
 * Zalety:
 * - Najwyższa dokładność dla Polski
 * - Rozpoznawanie skrótów (ul., al., pl.)
 * - Inteligentna korekta błędów
 * - Rozróżnienie building/street level
 * - Wsparcie dla kodów pocztowych
 */
export default class GoogleGeocodingProvider {
  constructor(config) {
    this.config = config;
    this.apiKey = config.googleApiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    if (!this.apiKey) {
      console.warn('⚠️ Google API key not provided');
    }
  }

  async geocode(address) {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        region: this.config.region || 'pl',
        language: this.config.language || 'pl',
        // Komponenty dla lepszej dokładności w Polsce
        components: 'country:PL'
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('🌐 Google Geocoding request:', address);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn('Google Geocoding status:', data.status);
        
        if (data.status === 'ZERO_RESULTS') {
          throw new Error('Nie znaleziono adresu');
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          throw new Error('Przekroczono limit zapytań Google');
        } else if (data.status === 'REQUEST_DENIED') {
          throw new Error('Google API - dostęp odmówiony');
        }
        
        throw new Error(`Google Geocoding error: ${data.status}`);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('Brak wyników');
      }

      // Wybierz najlepszy wynik
      const bestResult = this.selectBestResult(data.results, address);
      
      return this.formatResult(bestResult);

    } catch (error) {
      console.error('🚨 Google Geocoding error:', error);
      throw error;
    }
  }

  async reverseGeocode(lat, lng) {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        language: this.config.language || 'pl',
        result_type: 'street_address|route|locality'
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('🔄 Google Reverse Geocoding:', { lat, lng });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('Nie znaleziono adresu dla współrzędnych');
      }

      const bestResult = data.results[0]; // Pierwszy wynik jest zazwyczaj najlepszy
      return {
        address: bestResult.formatted_address,
        components: this.parseComponents(bestResult.address_components),
        accuracy: bestResult.geometry.location_type
      };

    } catch (error) {
      console.error('🚨 Google Reverse Geocoding error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Wybiera najlepszy wynik z listy wyników Google
   */
  selectBestResult(results, originalAddress) {
    // Jeśli tylko jeden wynik
    if (results.length === 1) {
      return results[0];
    }

    console.log(`🔍 Analyzing ${results.length} Google results`);

    // Scorowanie wyników
    const scoredResults = results.map((result, index) => {
      let score = 0;

      // Priorytet dla wyników z wysoką dokładnością
      const locationType = result.geometry.location_type;
      if (locationType === 'ROOFTOP') {
        score += 50;
      } else if (locationType === 'RANGE_INTERPOLATED') {
        score += 30;
      } else if (locationType === 'GEOMETRIC_CENTER') {
        score += 20;
      } else if (locationType === 'APPROXIMATE') {
        score += 10;
      }

      // Penalty za partial match
      if (result.partial_match) {
        score -= 20;
      }

      // Bonus za pełny adres
      const hasStreetNumber = result.address_components.some(
        component => component.types.includes('street_number')
      );
      if (hasStreetNumber) {
        score += 15;
      }

      // Bonus za locality w Polsce
      const hasPolishLocality = result.address_components.some(
        component => component.types.includes('locality') && 
                     component.long_name && 
                     this.isPolishCity(component.long_name)
      );
      if (hasPolishLocality) {
        score += 10;
      }

      // Penalty za pozycję w wynikach (pierwszy = lepszy)
      score -= index * 5;

      return { ...result, score, index };
    });

    // Sortuj po score
    scoredResults.sort((a, b) => b.score - a.score);

    console.log('🏆 Google results scored:', scoredResults.map(r => ({
      address: r.formatted_address.substring(0, 50),
      score: r.score,
      location_type: r.geometry.location_type,
      partial_match: r.partial_match || false
    })));

    return scoredResults[0];
  }

  /**
   * 📋 Formatuje wynik Google do standardowego formatu
   */
  formatResult(result) {
    const geometry = result.geometry;
    const components = this.parseComponents(result.address_components);

    return {
      lat: geometry.location.lat,
      lng: geometry.location.lng,
      address: result.formatted_address,
      components: components,
      accuracy: geometry.location_type,
      partial_match: result.partial_match || false,
      place_id: result.place_id,
      types: result.types,
      viewport: geometry.viewport,
      // Dodatkowe informacje dla Polski
      postal_code: components.postal_code,
      city: components.locality || components.administrative_area_level_2,
      street: components.route,
      street_number: components.street_number,
      country: components.country
    };
  }

  /**
   * 🧩 Parsuje komponenty adresu Google na obiekt
   */
  parseComponents(addressComponents) {
    const components = {};

    addressComponents.forEach(component => {
      component.types.forEach(type => {
        components[type] = component.long_name;
        
        // Dodaj short_name dla wybranych typów
        if (['country', 'administrative_area_level_1'].includes(type)) {
          components[`${type}_short`] = component.short_name;
        }
      });
    });

    return components;
  }

  /**
   * 🇵🇱 Sprawdza czy to polskie miasto (pomocnicza walidacja)
   */
  isPolishCity(cityName) {
    // Lista największych miast Polski dla quick check
    const majorPolishCities = [
      'warszawa', 'kraków', 'łódź', 'wrocław', 'poznań', 'gdańsk',
      'szczecin', 'bydgoszcz', 'lublin', 'białystok', 'katowice',
      'gdynia', 'częstochowa', 'radom', 'sosnowiec', 'toruń',
      'kielce', 'gliwice', 'zabrze', 'bytom', 'bielsko-biała',
      'olsztyn', 'rzeszów', 'ruda śląska', 'rybnik', 'tychy'
    ];

    const normalized = cityName.toLowerCase()
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ł/g, 'l')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ż/g, 'z')
      .replace(/ź/g, 'z');

    return majorPolishCities.some(city => 
      normalized.includes(city) || city.includes(normalized)
    );
  }

  /**
   * 📊 Statystyki provider
   */
  getStats() {
    return {
      provider: 'google',
      apiKey: this.apiKey ? 'configured' : 'missing',
      baseUrl: this.baseUrl
    };
  }
}