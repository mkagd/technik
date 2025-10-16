// distance-matrix/SmartDistanceService.js
// 🎯 Smart Hybrid Distance Service - OSRM (darmowy) + Google (opcjonalnie)

import OSRMProvider from './providers/OSRMProvider.js';
import GoogleDistanceMatrixProvider from './providers/GoogleDistanceMatrixProvider.js';

/**
 * 🧠 SmartDistanceService - Inteligentny system odległości
 * 
 * Strategia:
 * 1. OSRM domyślnie (100% darmowy, bez limitów)
 * 2. Google tylko dla aktualnego ruchu (opcjonalnie)
 * 3. Fallback automatyczny jeśli OSRM nie działa
 * 
 * Koszty:
 * - OSRM: 0 zł (90% zapytań)
 * - Google: ~2-5 zł/mies (10% zapytań, tylko ruch)
 */
export default class SmartDistanceService {
  constructor(config = {}) {
    // Zawsze inicjalizuj OSRM (darmowy)
    this.osrm = new OSRMProvider({
      endpoint: config.osrmEndpoint || 'https://router.project-osrm.org',
      profile: config.profile || 'car',
      timeout: config.timeout || 5000
    });
    
    // Google tylko jeśli API key dostępny
    this.googleApiKey = config.googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.googleEnabled = !!this.googleApiKey;
    
    if (this.googleEnabled) {
      this.google = new GoogleDistanceMatrixProvider({
        apiKey: this.googleApiKey
      });
      console.log('🌍 SmartDistanceService: OSRM (primary) + Google (traffic)');
    } else {
      console.log('🌍 SmartDistanceService: OSRM only (100% FREE)');
    }
    
    // Statystyki użycia
    this.stats = {
      osrmCalls: 0,
      googleCalls: 0,
      osrmErrors: 0,
      googleErrors: 0,
      totalSaved: 0 // Zaoszczędzone $ dzięki OSRM
    };
    
    // Lokalizacja firmy (domyślnie Kraków, będzie załadowana z API)
    this.companyLocation = config.companyLocation || {
      lat: 50.0647,
      lng: 19.9450,
      name: 'Siedziba firmy'
    };

    // Załaduj lokalizację firmy z API (asynchronicznie)
    this.loadCompanyLocation();
  }

  /**
   * 🏢 Ładuje lokalizację firmy z API ustawień
   * Wywoływane automatycznie w konstruktorze
   */
  async loadCompanyLocation() {
    try {
      const response = await fetch('/api/settings/company-location');
      if (response.ok) {
        const data = await response.json();
        this.companyLocation = {
          lat: data.lat,
          lng: data.lng,
          name: data.name || 'Siedziba firmy'
        };
        console.log('✅ SmartDistanceService: Załadowano lokalizację firmy:', this.companyLocation);
      } else {
        console.warn('⚠️ SmartDistanceService: Nie można załadować lokalizacji z API, używam domyślnej');
      }
    } catch (error) {
      console.warn('⚠️ SmartDistanceService: Błąd ładowania lokalizacji firmy:', error.message);
      // Pozostaw domyślną lokalizację
    }
  }

  /**
   * 🎯 Oblicz odległość i czas dojazdu (podstawowa funkcja)
   * 
   * @param {Object} origin - Punkt startowy {lat, lng}
   * @param {Object} destination - Punkt końcowy {lat, lng}
   * @param {Object} options - Opcje
   * @param {boolean} options.includeTraffic - Czy uwzględnić aktualny ruch (wymaga Google)
   * @param {boolean} options.forceGoogle - Wymuś użycie Google (np. dla ważnych kalkulacji)
   * @returns {Object} Wynik z distance i duration
   */
  async calculateDistance(origin, destination, options = {}) {
    const { includeTraffic = false, forceGoogle = false } = options;
    
    try {
      // Strategia 1: Jeśli wymuszono Google i mamy API key
      if (forceGoogle && this.googleEnabled) {
        return await this._calculateWithGoogle(origin, destination, options);
      }
      
      // Strategia 2: OSRM domyślnie (darmowy)
      const osrmResult = await this._calculateWithOSRM(origin, destination);
      
      // Strategia 3: Dodaj ruch z Google jeśli potrzeba
      if (includeTraffic && this.googleEnabled) {
        try {
          const googleTraffic = await this._getGoogleTraffic(origin, destination);
          osrmResult.duration_in_traffic = googleTraffic.duration_in_traffic;
          osrmResult.traffic_delay = googleTraffic.traffic_delay;
          osrmResult.traffic_source = 'google';
        } catch (error) {
          console.warn('⚠️ Google traffic unavailable:', error.message);
          osrmResult.traffic_source = 'unavailable';
        }
      }
      
      return osrmResult;
      
    } catch (error) {
      // Fallback: Jeśli OSRM zawiedzie, spróbuj Google
      if (this.googleEnabled) {
        console.warn('⚠️ OSRM failed, falling back to Google');
        return await this._calculateWithGoogle(origin, destination, options);
      }
      
      throw error;
    }
  }

  /**
   * 🚗 Oblicz odległość od siedziby firmy
   * Najczęściej używana funkcja w systemie!
   */
  async calculateDistanceFromCompany(destination, options = {}) {
    return await this.calculateDistance(this.companyLocation, destination, options);
  }

  /**
   * 📊 Oblicz macierz odległości (wiele punktów)
   * Używa tylko OSRM (Google byłby bardzo drogi!)
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    console.log(`📊 Matrix: ${origins.length} origins × ${destinations.length} destinations`);
    
    try {
      // Zawsze używaj OSRM dla macierzy (koszt Google byłby wysoki)
      const result = await this.osrm.calculateDistanceMatrix(origins, destinations, options);
      
      this.stats.osrmCalls += origins.length * destinations.length;
      this.stats.totalSaved += origins.length * destinations.length * 0.02; // $0.005 per req
      
      return result;
      
    } catch (error) {
      console.error('❌ Matrix calculation failed:', error);
      throw error;
    }
  }

  /**
   * 🔄 Sortuj zlecenia po odległości od punktu
   */
  async sortOrdersByDistance(orders, fromLocation = null, options = {}) {
    const origin = fromLocation || this.companyLocation;
    const maxConcurrent = options.maxConcurrent || 5; // Limit równoległych requestów
    
    console.log(`🔄 Sorting ${orders.length} orders by distance from ${origin.name || 'origin'}`);
    
    // Filtruj zlecenia z GPS
    const ordersWithGPS = orders.filter(o => 
      o.clientLocation?.coordinates || (o.latitude && o.longitude)
    );
    
    const ordersWithoutGPS = orders.filter(o => 
      !o.clientLocation?.coordinates && !(o.latitude && o.longitude)
    );
    
    if (ordersWithGPS.length === 0) {
      console.warn('⚠️ No orders with GPS coordinates');
      return orders;
    }
    
    // Oblicz odległości w batches (żeby nie przytłoczyć API)
    const enrichedOrders = [];
    
    for (let i = 0; i < ordersWithGPS.length; i += maxConcurrent) {
      const batch = ordersWithGPS.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(async (order) => {
          try {
            const destination = order.clientLocation?.coordinates || {
              lat: order.latitude,
              lng: order.longitude
            };
            
            const result = await this.calculateDistance(origin, destination, {
              includeTraffic: false // Bez ruchu dla sortowania (szybsze)
            });
            
            return {
              ...order,
              _distance: result.distance.km,
              _duration: result.duration.minutes,
              _distanceText: result.distance.text,
              _durationText: result.duration.text,
              _alternatives: result.alternatives || 1, // Ile tras OSRM znalazł
              _routeProvider: result.source || 'osrm' // Skąd pochodzi trasa
            };
          } catch (error) {
            console.warn(`⚠️ Distance calculation failed for order ${order.id}`);
            return {
              ...order,
              _distance: Infinity,
              _duration: Infinity,
              _distanceText: 'N/A',
              _durationText: 'N/A'
            };
          }
        })
      );
      
      enrichedOrders.push(...batchResults);
      
      // Małe opóźnienie między batches
      if (i + maxConcurrent < ordersWithGPS.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Sortuj po odległości
    enrichedOrders.sort((a, b) => a._distance - b._distance);
    
    // Dodaj zlecenia bez GPS na końcu
    const result = [...enrichedOrders, ...ordersWithoutGPS];
    
    console.log(`✅ Sorted: nearest ${enrichedOrders[0]?.city || 'N/A'} (${enrichedOrders[0]?._distanceText})`);
    
    return result;
  }

  /**
   * 🗺️ Optymalizuj trasę dla wielu punktów (TSP - Traveling Salesman Problem)
   * Znajduje najkrótszą/najszybszą kolejność odwiedzenia wszystkich klientów
   * 
   * @param {Array} orders - Zlecenia do optymalizacji
   * @param {Object} startPoint - Punkt startowy {lat, lng, name}
   * @param {Object} options - Opcje
   * @param {string} options.mode - 'shortest' (km) lub 'fastest' (czas)
   * @param {boolean} options.returnToStart - Czy wrócić do punktu startowego
   * @param {Object} options.destination - Punkt końcowy (jeśli inny niż start) {lat, lng, name}
   * @returns {Object} Zoptymalizowana trasa z kolejnością, odległością i czasem
   */
  async optimizeRoute(orders, startPoint = null, options = {}) {
    const { mode = 'shortest', returnToStart = false, destination = null } = options;
    const origin = startPoint || this.companyLocation;
    const endPoint = destination || origin; // Jeśli nie podano destination, użyj origin
    
    console.log(`🗺️ Optymalizacja trasy dla ${orders.length} zleceń (tryb: ${mode})`);
    
    // Filtruj zlecenia z GPS
    const ordersWithGPS = orders.filter(o => 
      o.clientLocation?.coordinates || (o.latitude && o.longitude)
    );
    
    if (ordersWithGPS.length === 0) {
      throw new Error('Brak zleceń z GPS do optymalizacji');
    }
    
    if (ordersWithGPS.length === 1) {
      // Tylko jedno zlecenie - nie ma co optymalizować
      const order = ordersWithGPS[0];
      const destination = order.clientLocation?.coordinates || {
        lat: order.latitude,
        lng: order.longitude
      };
      
      const result = await this.calculateDistance(origin, destination);
      
      return {
        orders: [order],
        totalDistance: result.distance.km,
        totalDuration: result.duration.minutes,
        totalDistanceText: result.distance.text,
        totalDurationText: result.duration.text,
        segments: [{
          from: origin.name || 'Start',
          to: order.clientName || order.city,
          distance: result.distance.km,
          duration: result.duration.minutes,
          order: order
        }]
      };
    }
    
    // Dla 2-5 zleceń: użyj algorytmu brute force (sprawdź wszystkie permutacje)
    // Dla 6+: użyj algorytmu nearest neighbor (szybszy ale może nie być optymalny)
    if (ordersWithGPS.length <= 5) {
      return await this._optimizeRouteExact(ordersWithGPS, origin, mode, returnToStart, endPoint);
    } else {
      return await this._optimizeRouteGreedy(ordersWithGPS, origin, mode, returnToStart, endPoint);
    }
  }

  /**
   * 🎯 Algorytm dokładny (brute force) - dla małej liczby punktów (2-5)
   */
  async _optimizeRouteExact(orders, origin, mode, returnToStart, endPoint) {
    console.log('🔍 Używam algorytmu dokładnego (sprawdzam wszystkie permutacje)');
    
    // ⚡ Cache dla odległości między punktami
    const distanceCache = new Map();
    
    const getCachedDistance = async (from, to) => {
      const key = `${from.lat},${from.lng}-${to.lat},${to.lng}`;
      if (distanceCache.has(key)) {
        return distanceCache.get(key);
      }
      
      const result = await this.calculateDistance(from, to);
      distanceCache.set(key, result);
      return result;
    };
    
    // Generuj wszystkie permutacje
    const permutations = this._generatePermutations(orders);
    console.log(`📊 Sprawdzam ${permutations.length} możliwych tras (z cache'owaniem)...`);
    
    let bestRoute = null;
    let bestScore = Infinity;
    let checkedCount = 0;
    
    // Sprawdź każdą permutację
    for (let i = 0; i < permutations.length; i++) {
      const perm = permutations[i];
      const routeData = await this._calculateRouteMetricsWithCache(perm, origin, returnToStart, getCachedDistance, endPoint);
      
      const score = mode === 'shortest' ? routeData.totalDistance : routeData.totalDuration;
      
      if (score < bestScore) {
        bestScore = score;
        bestRoute = routeData;
      }
      
      checkedCount++;
      
      // Progress info co 5 tras
      if (checkedCount % 5 === 0 || checkedCount === permutations.length) {
        console.log(`⏳ Sprawdzono ${checkedCount}/${permutations.length} tras... (najlepsza: ${this._formatDistance(bestScore * 1000)})`);
      }
    }
    
    console.log(`✅ Znaleziono optymalną trasę: ${bestRoute.totalDistanceText}, ${bestRoute.totalDurationText}`);
    console.log(`💾 Użyto cache: ${distanceCache.size} unikalnych połączeń (zamiast ${permutations.length * orders.length} żądań)`);
    return bestRoute;
  }

  /**
   * 🚀 Algorytm zachłanny (nearest neighbor) - dla większej liczby punktów (6+)
   */
  async _optimizeRouteGreedy(orders, origin, mode, returnToStart, endPoint) {
    console.log('🚀 Używam algorytmu zachłannego (nearest neighbor)');
    
    const orderedOrders = [];
    const remaining = [...orders];
    let currentPoint = origin;
    
    // Zawsze wybieraj najbliższy następny punkt
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      let nearestResult = null;
      
      // Znajdź najbliższy punkt
      for (let i = 0; i < remaining.length; i++) {
        const order = remaining[i];
        const destination = order.clientLocation?.coordinates || {
          lat: order.latitude,
          lng: order.longitude
        };
        
        const result = await this.calculateDistance(currentPoint, destination);
        const score = mode === 'shortest' ? result.distance.km : result.duration.minutes;
        
        if (score < nearestDistance) {
          nearestDistance = score;
          nearestIndex = i;
          nearestResult = result;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Dodaj najbliższy punkt do trasy
      const nearestOrder = remaining[nearestIndex];
      orderedOrders.push(nearestOrder);
      currentPoint = nearestOrder.clientLocation?.coordinates || {
        lat: nearestOrder.latitude,
        lng: nearestOrder.longitude
      };
      remaining.splice(nearestIndex, 1);
    }
    
    // Oblicz metryki dla finalnej trasy
    const routeData = await this._calculateRouteMetrics(orderedOrders, origin, returnToStart, endPoint);
    console.log(`✅ Znaleziono trasę: ${routeData.totalDistanceText}, ${routeData.totalDurationText}`);
    
    return routeData;
  }

  /**
   * 📊 Oblicz metryki z cache'owaniem (dla brute force)
   */
  async _calculateRouteMetricsWithCache(orders, origin, returnToStart, getCachedDistance, endPoint) {
    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let currentPoint = origin;
    
    // Segmenty do klientów
    for (const order of orders) {
      const destination = order.clientLocation?.coordinates || {
        lat: order.latitude,
        lng: order.longitude
      };
      
      const result = await getCachedDistance(currentPoint, destination);
      
      segments.push({
        from: currentPoint.name || currentPoint.city || 'Punkt',
        to: order.clientName || order.city,
        distance: result.distance.km,
        duration: result.duration.minutes,
        distanceText: result.distance.text,
        durationText: result.duration.text,
        order: order
      });
      
      totalDistance += result.distance.km;
      totalDuration += result.duration.minutes;
      currentPoint = destination;
    }
    
    // Powrót do punktu końcowego (opcjonalnie)
    if (returnToStart && endPoint) {
      const result = await getCachedDistance(currentPoint, endPoint);
      
      segments.push({
        from: currentPoint.name || currentPoint.city || 'Ostatni klient',
        to: endPoint.name || 'Powrót',
        distance: result.distance.km,
        duration: result.duration.minutes,
        distanceText: result.distance.text,
        durationText: result.duration.text,
        order: null,
        isReturn: true // 🏠 Oznacz jako segment powrotu
      });
      
      totalDistance += result.distance.km;
      totalDuration += result.duration.minutes;
    }
    
    return {
      orders,
      segments,
      totalDistance,
      totalDuration,
      totalDistanceText: this._formatDistance(totalDistance * 1000),
      totalDurationText: this._formatDuration(totalDuration * 60)
    };
  }

  /**
   * 📊 Oblicz metryki dla danej kolejności zleceń (bez cache)
   */
  async _calculateRouteMetrics(orders, origin, returnToStart, endPoint) {
    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let currentPoint = origin;
    
    // Segmenty do klientów
    for (const order of orders) {
      const destination = order.clientLocation?.coordinates || {
        lat: order.latitude,
        lng: order.longitude
      };
      
      const result = await this.calculateDistance(currentPoint, destination);
      
      segments.push({
        from: currentPoint.name || currentPoint.city || 'Punkt',
        to: order.clientName || order.city,
        distance: result.distance.km,
        duration: result.duration.minutes,
        distanceText: result.distance.text,
        durationText: result.duration.text,
        order: order
      });
      
      totalDistance += result.distance.km;
      totalDuration += result.duration.minutes;
      currentPoint = destination;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Powrót do punktu końcowego (opcjonalnie)
    if (returnToStart && endPoint) {
      const result = await this.calculateDistance(currentPoint, endPoint);
      
      segments.push({
        from: currentPoint.name || currentPoint.city || 'Ostatni klient',
        to: endPoint.name || 'Powrót',
        distance: result.distance.km,
        duration: result.duration.minutes,
        distanceText: result.distance.text,
        durationText: result.duration.text,
        order: null,
        isReturn: true // 🏠 Oznacz jako segment powrotu
      });
      
      totalDistance += result.distance.km;
      totalDuration += result.duration.minutes;
    }
    
    return {
      orders: orders,
      segments: segments,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(totalDuration),
      totalDistanceText: this._formatDistance(totalDistance * 1000),
      totalDurationText: this._formatDuration(totalDuration * 60)
    };
  }

  /**
   * 🔄 Generuj wszystkie permutacje tablicy
   */
  _generatePermutations(array) {
    if (array.length <= 1) return [array];
    
    const permutations = [];
    
    for (let i = 0; i < array.length; i++) {
      const current = array[i];
      const remaining = array.slice(0, i).concat(array.slice(i + 1));
      const remainingPerms = this._generatePermutations(remaining);
      
      for (const perm of remainingPerms) {
        permutations.push([current].concat(perm));
      }
    }
    
    return permutations;
  }

  /**
   * 🛠️ Format odległości (pomocnicza)
   */
  _formatDistance(meters) {
    const km = meters / 1000;
    if (km < 1) return `${Math.round(meters)} m`;
    return `${km.toFixed(1)} km`;
  }

  /**
   * 🛠️ Format czasu (pomocnicza)
   */
  _formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} godz. ${mins} min`;
  }

  /**
   * �🛠️ Prywatne: Użyj OSRM
   */
  async _calculateWithOSRM(origin, destination) {
    try {
      const result = await this.osrm.calculateSingleDistance(origin, destination);
      
      this.stats.osrmCalls++;
      this.stats.totalSaved += 0.02; // Zaoszczędziliśmy ~$0.005
      
      return {
        ...result,
        source: 'osrm',
        cost: 0
      };
    } catch (error) {
      this.stats.osrmErrors++;
      throw error;
    }
  }

  /**
   * 🛠️ Prywatne: Użyj Google
   */
  async _calculateWithGoogle(origin, destination, options = {}) {
    if (!this.googleEnabled) {
      throw new Error('Google Distance Matrix not available (no API key)');
    }
    
    try {
      const result = await this.google.calculateDistance(origin, destination, {
        departure_time: options.departureTime || 'now',
        traffic_model: options.trafficModel || 'best_guess'
      });
      
      this.stats.googleCalls++;
      
      return {
        ...result,
        source: 'google',
        cost: 0.005 // USD per request
      };
    } catch (error) {
      this.stats.googleErrors++;
      throw error;
    }
  }

  /**
   * 🛠️ Prywatne: Pobierz tylko ruch z Google
   */
  async _getGoogleTraffic(origin, destination) {
    const result = await this.google.calculateDistance(origin, destination, {
      departure_time: 'now',
      traffic_model: 'best_guess'
    });
    
    this.stats.googleCalls++;
    
    return {
      duration_in_traffic: result.duration_in_traffic,
      traffic_delay: {
        value: result.duration_in_traffic.value - result.duration.value,
        text: this._formatSeconds(result.duration_in_traffic.value - result.duration.value)
      }
    };
  }

  /**
   * 📊 Statystyki użycia
   */
  getStats() {
    const totalCalls = this.stats.osrmCalls + this.stats.googleCalls;
    const osrmPercent = totalCalls > 0 ? ((this.stats.osrmCalls / totalCalls) * 100).toFixed(1) : 0;
    const googleCost = this.stats.googleCalls * 0.02; // PLN (~$0.005 per req)
    
    return {
      ...this.stats,
      totalCalls,
      osrmPercent: `${osrmPercent}%`,
      googlePercent: `${(100 - osrmPercent).toFixed(1)}%`,
      googleCost: `${googleCost.toFixed(2)} zł`,
      totalSaved: `${this.stats.totalSaved.toFixed(2)} zł`,
      recommendation: this._getRecommendation()
    };
  }

  /**
   * 📝 Rekomendacja optymalizacji
   */
  _getRecommendation() {
    const googlePercent = (this.stats.googleCalls / (this.stats.osrmCalls + this.stats.googleCalls)) * 100;
    
    if (googlePercent > 50) {
      return '⚠️ Używasz Google w >50% zapytań. Rozważ częstsze użycie OSRM.';
    }
    
    if (this.stats.osrmErrors > 10) {
      return '⚠️ Wiele błędów OSRM. Sprawdź połączenie internetowe.';
    }
    
    if (googlePercent < 10) {
      return '✅ Świetna optymalizacja! OSRM pokrywa >90% zapytań.';
    }
    
    return '✅ Dobry balans OSRM/Google.';
  }

  /**
   * 🔧 Ustaw lokalizację firmy
   */
  setCompanyLocation(lat, lng, name = 'Siedziba firmy') {
    this.companyLocation = { lat, lng, name };
    console.log(`📍 Company location set: ${name} (${lat}, ${lng})`);
  }

  /**
   * 🧪 Test połączenia
   */
  async testConnection() {
    console.log('🧪 Testing SmartDistanceService...\n');
    
    const results = {
      osrm: { success: false },
      google: { success: false, available: this.googleEnabled }
    };
    
    // Test OSRM
    try {
      const osrmStart = Date.now();
      await this.osrm.calculateSingleDistance(
        { lat: 50.0615, lng: 19.9364 }, // Kraków
        { lat: 50.2804, lng: 19.5598 }  // Mielec
      );
      results.osrm = {
        success: true,
        responseTime: `${Date.now() - osrmStart}ms`,
        message: 'OSRM działa poprawnie!'
      };
    } catch (error) {
      results.osrm = {
        success: false,
        error: error.message
      };
    }
    
    // Test Google (jeśli dostępny)
    if (this.googleEnabled) {
      try {
        const googleStart = Date.now();
        await this.google.calculateDistance(
          { lat: 50.0615, lng: 19.9364 },
          { lat: 50.2804, lng: 19.5598 }
        );
        results.google = {
          success: true,
          available: true,
          responseTime: `${Date.now() - googleStart}ms`,
          message: 'Google Distance Matrix działa!'
        };
      } catch (error) {
        results.google = {
          success: false,
          available: true,
          error: error.message
        };
      }
    }
    
    return results;
  }

  /**
   * 🧪 Testuj połączenie z providerami
   * Używane w panelu ustawień do diagnostyki
   */
  async testConnection() {
    const results = {
      osrm: { success: false, available: true },
      google: { success: false, available: this.googleEnabled }
    };

    // Test OSRM
    try {
      const testOrigin = { lat: 50.0647, lng: 19.9450 }; // Kraków
      const testDestination = { lat: 52.2297, lng: 21.0122 }; // Warszawa
      
      const result = await this._calculateWithOSRM(testOrigin, testDestination);
      
      results.osrm = {
        success: true,
        available: true,
        distance: result.distance.text,
        duration: result.duration.text,
        message: 'OSRM działa poprawnie!'
      };
    } catch (error) {
      results.osrm = {
        success: false,
        available: true,
        error: error.message
      };
    }

    // Test Google (jeśli dostępny)
    if (this.googleEnabled) {
      try {
        const testOrigin = { lat: 50.0647, lng: 19.9450 };
        const testDestination = { lat: 52.2297, lng: 21.0122 };
        
        const result = await this._calculateWithGoogle(testOrigin, testDestination);
        
        results.google = {
          success: true,
          available: true,
          distance: result.distance.text,
          duration: result.duration.text,
          message: 'Google Distance Matrix działa!'
        };
      } catch (error) {
        results.google = {
          success: false,
          available: true,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * 🛠️ Format sekund na tekst
   */
  _formatSeconds(seconds) {
    const minutes = Math.round(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours} godz. ${mins} min`;
  }

  /**
   * 🧹 Resetuj statystyki
   */
  resetStats() {
    this.stats = {
      osrmCalls: 0,
      googleCalls: 0,
      osrmErrors: 0,
      googleErrors: 0,
      totalSaved: 0
    };
    console.log('🧹 Statistics reset');
  }
}

/**
 * 🏭 Factory function - łatwe tworzenie instancji
 */
export function createSmartDistanceService(config = {}) {
  return new SmartDistanceService(config);
}

/**
 * 🌐 Singleton - jedna instancja dla całej aplikacji
 */
let _instance = null;

export function getSmartDistanceService(config = {}) {
  if (!_instance) {
    _instance = new SmartDistanceService(config);
  }
  return _instance;
}
