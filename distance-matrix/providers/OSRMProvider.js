// distance-matrix/providers/OSRMProvider.js
// OSRM (Open Source Routing Machine) - darmowy routing

/**
 * 🚗 OSRMProvider - darmowy routing z OpenStreetMap
 * 
 * Funkcjonalności:
 * - Rzeczywiste trasy drogowe (nie linia prosta)
 * - Całkowicie darmowe (open source)
 * - Brak limitów API
 * - Można hostować własny serwer
 */
export default class OSRMProvider {
  constructor(config = {}) {
    this.endpoint = config.endpoint || 'https://router.project-osrm.org';
    this.profile = config.profile || 'car'; // car, bike, foot
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 5000; // ms
    
    console.log('🚗 OSRMProvider initialized:', {
      endpoint: this.endpoint,
      profile: this.profile
    });
  }

  /**
   * 🎯 Oblicz odległość między dwoma punktami
   */
  async calculateSingleDistance(origin, destination, options = {}) {
    try {
      // Format współrzędnych dla OSRM: lng,lat (odwrotnie niż Google!)
      const originCoords = this.formatCoordinates(origin);
      const destCoords = this.formatCoordinates(destination);
      
      // URL: /route/v1/{profile}/{coordinates}
      const url = `${this.endpoint}/route/v1/${this.profile}/${originCoords};${destCoords}?overview=false&steps=false`;
      
      console.log('🚗 OSRM request:', url);
      
      // Wykonaj request z retry
      const data = await this.fetchWithRetry(url);
      
      if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
        throw new Error(`OSRM error: ${data.code || 'No route found'}`);
      }
      
      const route = data.routes[0];
      
      // Normalizuj wynik do formatu Google Distance Matrix
      const result = {
        distance: {
          value: Math.round(route.distance), // metry
          text: this.formatDistance(route.distance),
          km: Math.round(route.distance / 1000 * 100) / 100
        },
        duration: {
          value: Math.round(route.duration), // sekundy
          text: this.formatDuration(route.duration),
          minutes: Math.round(route.duration / 60)
        },
        status: 'OK',
        provider: 'osrm'
      };
      
      console.log('✅ OSRM result:', {
        distance: result.distance.text,
        duration: result.duration.text
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ OSRM error:', error.message);
      throw error;
    }
  }

  /**
   * 🎯 Oblicz macierz odległości (wiele do wielu)
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    try {
      console.log(`🚗 OSRM matrix: ${origins.length} origins → ${destinations.length} destinations`);
      
      const results = {
        origins: origins.map(o => this.formatAddress(o)),
        destinations: destinations.map(d => this.formatAddress(d)),
        rows: [],
        provider: 'osrm'
      };
      
      // OSRM Table API dla macierzy
      // Ale demo server może mieć limity, więc robimy pojedyncze requesty
      for (let i = 0; i < origins.length; i++) {
        const row = { elements: [] };
        
        for (let j = 0; j < destinations.length; j++) {
          try {
            const result = await this.calculateSingleDistance(origins[i], destinations[j], options);
            row.elements.push({
              status: 'OK',
              distance: result.distance,
              duration: result.duration,
              originIndex: i,
              destinationIndex: j
            });
            
            // Małe opóźnienie między requestami
            if (j < destinations.length - 1 || i < origins.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.warn(`⚠️ OSRM failed for [${i},${j}]:`, error.message);
            row.elements.push({
              status: 'FAILED',
              error: error.message,
              originIndex: i,
              destinationIndex: j
            });
          }
        }
        
        results.rows.push(row);
      }
      
      console.log('✅ OSRM matrix completed');
      return results;
      
    } catch (error) {
      console.error('❌ OSRM matrix error:', error);
      throw error;
    }
  }

  /**
   * 🛠️ Format współrzędnych dla OSRM (lng,lat)
   */
  formatCoordinates(location) {
    if (typeof location === 'string') {
      // Jeśli to string, zakładamy że to już "lng,lat"
      return location;
    }
    
    if (location.lng && location.lat) {
      // OSRM wymaga lng,lat (odwrotnie niż Google!)
      return `${location.lng},${location.lat}`;
    }
    
    throw new Error('Invalid location format for OSRM. Use {lat, lng} or "lng,lat" string');
  }

  /**
   * 🛠️ Format adresu dla logów
   */
  formatAddress(location) {
    if (typeof location === 'string') {
      return location;
    }
    
    if (location.lat && location.lng) {
      return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    }
    
    return 'Unknown location';
  }

  /**
   * 🛠️ Format odległości (metry → tekst)
   */
  formatDistance(meters) {
    const km = meters / 1000;
    
    if (km < 1) {
      return `${Math.round(meters)} m`;
    }
    
    return `${km.toFixed(1)} km`;
  }

  /**
   * 🛠️ Format czasu (sekundy → tekst)
   */
  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours} godz. ${mins} min`;
  }

  /**
   * 🛠️ Fetch z retry
   */
  async fetchWithRetry(url, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'TechnikAGD/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
      } catch (error) {
        console.warn(`⚠️ OSRM retry ${i + 1}/${retries}:`, error.message);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  /**
   * 📊 Statystyki
   */
  getUsageStats() {
    return {
      provider: 'osrm',
      endpoint: this.endpoint,
      profile: this.profile,
      cost: 0, // Darmowe!
      limits: {
        daily: 'unlimited',
        monthly: 'unlimited'
      }
    };
  }

  /**
   * 🧪 Test połączenia
   */
  async testConnection() {
    try {
      const start = Date.now();
      
      // Test: Kraków centrum → Dworzec Główny
      await this.calculateSingleDistance(
        { lat: 50.0614, lng: 19.9366 }, // Rynek Główny
        { lat: 50.0668, lng: 19.9449 }  // Dworzec
      );
      
      const responseTime = Date.now() - start;
      
      return {
        success: true,
        provider: 'osrm',
        endpoint: this.endpoint,
        responseTime: `${responseTime}ms`,
        message: 'Połączenie działa poprawnie!'
      };
    } catch (error) {
      return {
        success: false,
        provider: 'osrm',
        endpoint: this.endpoint,
        error: error.message,
        message: 'Nie można połączyć z OSRM'
      };
    }
  }
}
