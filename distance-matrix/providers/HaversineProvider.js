// distance-matrix/providers/HaversineProvider.js
// Haversine formula - przybliżone odległości (linia prosta + mnożniki)

/**
 * 🧮 HaversineProvider - szybkie przybliżone odległości
 * 
 * Funkcjonalności:
 * - Odległość w linii prostej (haversine formula)
 * - Mnożniki dla rzeczywistych dróg (1.3x miasto, 1.5x międzymiastowe)
 * - Szacowany czas (odległość ÷ średnia prędkość)
 * - Całkowicie darmowe, bez API
 * - Natychmiastowe - brak opóźnień sieciowych
 */
export default class HaversineProvider {
  constructor(config = {}) {
    this.cityMultiplier = config.cityMultiplier || 1.3;
    this.intercityMultiplier = config.intercityMultiplier || 1.5;
    this.avgSpeedCity = config.avgSpeedCity || 40; // km/h
    this.avgSpeedIntercity = config.avgSpeedIntercity || 80; // km/h
    this.cityThresholdKm = config.cityThresholdKm || 15; // poniżej = miasto
    
    console.log('🧮 HaversineProvider initialized:', {
      cityMultiplier: this.cityMultiplier,
      intercityMultiplier: this.intercityMultiplier
    });
  }

  /**
   * 🎯 Oblicz odległość między dwoma punktami
   */
  async calculateSingleDistance(origin, destination, options = {}) {
    try {
      const originCoords = this.parseCoordinates(origin);
      const destCoords = this.parseCoordinates(destination);
      
      // 1. Oblicz odległość w linii prostej (haversine)
      const straightDistance = this.haversineDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
      
      // 2. Zastosuj mnożnik (drogi nie są proste)
      const isCity = straightDistance < this.cityThresholdKm;
      const multiplier = isCity ? this.cityMultiplier : this.intercityMultiplier;
      const roadDistance = straightDistance * multiplier;
      
      // 3. Oblicz czas dojazdu
      const avgSpeed = isCity ? this.avgSpeedCity : this.avgSpeedIntercity;
      const durationHours = roadDistance / avgSpeed;
      const durationMinutes = Math.round(durationHours * 60);
      const durationSeconds = Math.round(durationMinutes * 60);
      
      // 4. Format wyniku (kompatybilny z Google Distance Matrix)
      const result = {
        distance: {
          value: Math.round(roadDistance * 1000), // metry
          text: this.formatDistance(roadDistance * 1000),
          km: Math.round(roadDistance * 100) / 100
        },
        duration: {
          value: durationSeconds,
          text: this.formatDuration(durationSeconds),
          minutes: durationMinutes
        },
        status: 'OK',
        provider: 'haversine',
        metadata: {
          straightDistance: Math.round(straightDistance * 100) / 100,
          multiplier: multiplier,
          isCity: isCity,
          avgSpeed: avgSpeed
        }
      };
      
      console.log('✅ Haversine result:', {
        straightDistance: `${straightDistance.toFixed(1)} km`,
        roadDistance: result.distance.text,
        duration: result.duration.text,
        type: isCity ? 'city' : 'intercity'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Haversine error:', error.message);
      throw error;
    }
  }

  /**
   * 🎯 Oblicz macierz odległości
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    try {
      console.log(`🧮 Haversine matrix: ${origins.length} origins → ${destinations.length} destinations`);
      
      const results = {
        origins: origins.map(o => this.formatAddress(o)),
        destinations: destinations.map(d => this.formatAddress(d)),
        rows: [],
        provider: 'haversine'
      };
      
      // Oblicz wszystkie pary (bardzo szybkie - brak requestów API)
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
              destinationIndex: j,
              metadata: result.metadata
            });
          } catch (error) {
            console.warn(`⚠️ Haversine failed for [${i},${j}]:`, error.message);
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
      
      console.log('✅ Haversine matrix completed (instant!)');
      return results;
      
    } catch (error) {
      console.error('❌ Haversine matrix error:', error);
      throw error;
    }
  }

  /**
   * 🛠️ Haversine formula - odległość między dwoma punktami GPS
   * https://en.wikipedia.org/wiki/Haversine_formula
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Promień Ziemi w km
    
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c; // Odległość w km
    
    return distance;
  }

  /**
   * 🛠️ Konwersja stopni → radiany
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 🛠️ Parse współrzędnych
   */
  parseCoordinates(location) {
    if (typeof location === 'string') {
      const parts = location.split(',');
      return {
        lat: parseFloat(parts[0]),
        lng: parseFloat(parts[1])
      };
    }
    
    if (location.lat && location.lng) {
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      };
    }
    
    throw new Error('Invalid location format. Use {lat, lng} or "lat,lng" string');
  }

  /**
   * 🛠️ Format adresu
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
   * 🛠️ Format odległości
   */
  formatDistance(meters) {
    const km = meters / 1000;
    
    if (km < 1) {
      return `${Math.round(meters)} m`;
    }
    
    return `${km.toFixed(1)} km`;
  }

  /**
   * 🛠️ Format czasu
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
   * 📊 Statystyki
   */
  getUsageStats() {
    return {
      provider: 'haversine',
      cost: 0, // Darmowe!
      accuracy: 'approximate',
      features: {
        cityMultiplier: this.cityMultiplier,
        intercityMultiplier: this.intercityMultiplier,
        avgSpeedCity: this.avgSpeedCity,
        avgSpeedIntercity: this.avgSpeedIntercity
      },
      limits: {
        daily: 'unlimited',
        monthly: 'unlimited'
      }
    };
  }

  /**
   * 🧪 Test połączenia (zawsze działa - brak API)
   */
  async testConnection() {
    try {
      const start = Date.now();
      
      // Test: Kraków centrum → Warszawa centrum
      await this.calculateSingleDistance(
        { lat: 50.0614, lng: 19.9366 }, // Kraków Rynek
        { lat: 52.2297, lng: 21.0122 }  // Warszawa Centrum
      );
      
      const responseTime = Date.now() - start;
      
      return {
        success: true,
        provider: 'haversine',
        responseTime: `${responseTime}ms`,
        message: 'Haversine działa (brak API - zawsze dostępne!)',
        note: 'Przybliżone odległości - używaj jako fallback'
      };
    } catch (error) {
      return {
        success: false,
        provider: 'haversine',
        error: error.message
      };
    }
  }
}
