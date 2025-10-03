// distance-matrix/index.js
// Główny interfejs dla Google Distance Matrix API

import GoogleDistanceMatrixProvider from './providers/GoogleDistanceMatrixProvider.js';
import DistanceMatrixCache from './utils/DistanceMatrixCache.js';

/**
 * 🚗 DistanceMatrixService - rzeczywiste odległości i czasy dojazdu
 * 
 * Funkcjonalności:
 * - Google Distance Matrix API (rzeczywiste drogi)
 * - Uwzględnienie ruchu drogowego
 * - Inteligentny cache system
 * - Batch processing dla wydajności
 * - Fallback do prostych obliczeń
 */
export class DistanceMatrixService {
  constructor(config = {}) {
    this.config = {
      // Google API
      googleApiKey: config.googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      
      // Domyślne opcje
      mode: config.mode || 'driving', // driving, walking, bicycling, transit
      trafficModel: config.trafficModel || 'best_guess', // best_guess, pessimistic, optimistic
      avoid: config.avoid || [], // tolls, highways, ferries
      units: config.units || 'metric',
      language: config.language || 'pl',
      region: config.region || 'pl',
      
      // Cache
      enableCache: config.enableCache !== false,
      distanceExpiry: config.distanceExpiry || 7 * 24 * 60 * 60 * 1000, // 7 dni
      trafficExpiry: config.trafficExpiry || 30 * 60 * 1000, // 30 min
      
      // Batch processing
      batchSize: config.batchSize || 10,
      batchDelay: config.batchDelay || 200, // ms między requestami
      
      // Rate limiting
      rateLimitDelay: config.rateLimitDelay || 100 // ms
    };

    // Inicjalizacja komponentów
    this.cache = new DistanceMatrixCache({
      distanceExpiry: this.config.distanceExpiry,
      trafficExpiry: this.config.trafficExpiry,
      enableStats: true
    });

    this.provider = new GoogleDistanceMatrixProvider({
      googleApiKey: this.config.googleApiKey,
      mode: this.config.mode,
      trafficModel: this.config.trafficModel,
      avoid: this.config.avoid,
      units: this.config.units,
      language: this.config.language,
      region: this.config.region
    });

    console.log('🚗 DistanceMatrixService initialized:', {
      mode: this.config.mode,
      trafficModel: this.config.trafficModel,
      cache: this.config.enableCache,
      provider: 'google-only'
    });
  }

  /**
   * 🎯 Oblicz odległość i czas między dwoma punktami
   */
  async calculateDistance(origin, destination, options = {}) {
    try {
      // Sprawdź cache jeśli włączony
      if (this.config.enableCache) {
        const cached = this.cache.get(origin, destination, options);
        if (cached) {
          console.log('💾 Distance cache hit');
          return this.normalizeResult(cached);
        }
      }

      console.log('🚗 Calculating distance:', this.formatLocationForLog(origin), '→', this.formatLocationForLog(destination));

      // Użyj Google Distance Matrix API
      const result = await this.provider.calculateSingleDistance(origin, destination, {
        ...this.config,
        ...options
      });

      // Normalizuj wynik
      const normalizedResult = this.normalizeResult(result);

      // Zapisz do cache
      if (this.config.enableCache) {
        this.cache.set(origin, destination, result, options);
      }

      return normalizedResult;

    } catch (error) {
      console.error('❌ Distance calculation failed:', error.message);
      throw error;
    }
  }

  /**
   * 🎯 Oblicz macierz odległości dla wielu punktów
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    try {
      console.log(`🚗 Distance matrix: ${origins.length} origins × ${destinations.length} destinations`);

      // Sprawdź cache dla każdej pary
      const cacheResults = [];
      const missingPairs = [];

      if (this.config.enableCache) {
        origins.forEach((origin, originIndex) => {
          destinations.forEach((destination, destIndex) => {
            const cached = this.cache.get(origin, destination, options);
            if (cached) {
              cacheResults.push({
                originIndex,
                destIndex,
                result: this.normalizeResult(cached)
              });
            } else {
              missingPairs.push({ origin, destination, originIndex, destIndex });
            }
          });
        });
      } else {
        // Bez cache - wszystkie pary są missing
        origins.forEach((origin, originIndex) => {
          destinations.forEach((destination, destIndex) => {
            missingPairs.push({ origin, destination, originIndex, destIndex });
          });
        });
      }

      console.log(`💾 Cache: ${cacheResults.length} hits, ${missingPairs.length} misses`);

      // Jeśli wszystko z cache, zwróć wyniki
      if (missingPairs.length === 0) {
        return this.buildMatrixFromCache(cacheResults, origins.length, destinations.length);
      }

      // Oblicz brakujące pary
      let apiResults = [];
      if (missingPairs.length <= this.config.batchSize) {
        // Mały batch - jeden request
        const missingOrigins = [...new Set(missingPairs.map(p => p.origin))];
        const missingDests = [...new Set(missingPairs.map(p => p.destination))];
        
        const matrixResult = await this.provider.calculateDistanceMatrix(
          missingOrigins, 
          missingDests, 
          { ...this.config, ...options }
        );

        apiResults = this.extractPairResultsFromMatrix(matrixResult, missingPairs, missingOrigins, missingDests);
      } else {
        // Duży batch - podziel na mniejsze
        apiResults = await this.calculateLargeBatch(missingPairs, options);
      }

      // Zapisz nowe wyniki do cache
      if (this.config.enableCache) {
        apiResults.forEach(result => {
          this.cache.set(result.origin, result.destination, result.data, options);
        });
      }

      // Scal wyniki z cache i API
      return this.buildFinalMatrix([...cacheResults, ...apiResults], origins.length, destinations.length);

    } catch (error) {
      console.error('❌ Distance matrix calculation failed:', error);
      throw error;
    }
  }

  /**
   * 🎯 Optymalizacja tras - znajdź najlepszą kolejność punktów
   */
  async optimizeRoute(waypoints, options = {}) {
    try {
      console.log(`🎯 Route optimization for ${waypoints.length} waypoints`);

      if (waypoints.length <= 2) {
        return { waypoints, totalDistance: 0, totalTime: 0, optimized: false };
      }

      // Oblicz macierz odległości między wszystkimi punktami
      const matrix = await this.calculateDistanceMatrix(waypoints, waypoints, options);

      // Użyj algorytmu nearest neighbor jako starting point
      const optimizedOrder = this.nearestNeighborOptimization(matrix);

      // Oblicz całkowite statystyki
      const stats = this.calculateRouteStats(optimizedOrder, matrix);

      return {
        waypoints: optimizedOrder.map(index => waypoints[index]),
        originalIndices: optimizedOrder,
        totalDistance: stats.totalDistance,
        totalTime: stats.totalTime,
        optimized: true,
        savings: stats.savings // vs original order
      };

    } catch (error) {
      console.error('🚨 Route optimization failed:', error);
      return { 
        waypoints, 
        totalDistance: 0, 
        totalTime: 0, 
        optimized: false, 
        error: error.message 
      };
    }
  }

  /**
   * 🛠️ Normalizacja wyników
   */
  normalizeResult(result) {
    return {
      distance: {
        meters: result.distance?.value || 0,
        km: result.distance?.km || (result.distance?.value ? Math.round(result.distance.value / 1000 * 100) / 100 : 0),
        text: result.distance?.text || '0 km'
      },
      duration: {
        seconds: result.duration?.value || 0,
        minutes: result.duration?.minutes || (result.duration?.value ? Math.round(result.duration.value / 60) : 0),
        text: result.duration?.text || '0 min'
      },
      durationInTraffic: result.durationInTraffic ? {
        seconds: result.durationInTraffic.value,
        minutes: result.durationInTraffic.minutes,
        text: result.durationInTraffic.text
      } : null,
      trafficDelay: result.trafficDelay ? {
        seconds: result.trafficDelay.seconds,
        minutes: result.trafficDelay.minutes
      } : null,
      status: result.status || 'OK',
      provider: 'google-distance-matrix'
    };
  }

  /**
   * 🛠️ Utility methods
   */
  formatLocationForLog(location) {
    if (typeof location === 'string') {
      return location.substring(0, 30) + (location.length > 30 ? '...' : '');
    }
    return `${location.lat?.toFixed(4)},${location.lng?.toFixed(4)}`;
  }

  nearestNeighborOptimization(matrix) {
    const n = matrix.rows.length;
    if (n <= 2) return [0, 1].slice(0, n);

    const visited = new Array(n).fill(false);
    const route = [0]; // Start from first point
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      const currentIndex = route[route.length - 1];
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && matrix.rows[currentIndex]?.elements[j]?.distance?.meters) {
          const distance = matrix.rows[currentIndex].elements[j].distance.meters;
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = j;
          }
        }
      }

      if (nearestIndex !== -1) {
        route.push(nearestIndex);
        visited[nearestIndex] = true;
      }
    }

    return route;
  }

  calculateRouteStats(route, matrix) {
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      const element = matrix.rows[from]?.elements[to];
      
      if (element?.distance?.meters) {
        totalDistance += element.distance.meters;
        totalTime += element.duration?.seconds || 0;
      }
    }

    return {
      totalDistance,
      totalTime,
      savings: 0 // TODO: Calculate vs original order
    };
  }

  /**
   * �️ Extract pair results from matrix response
   */
  extractPairResultsFromMatrix(matrixResult, missingPairs, missingOrigins, missingDests) {
    const apiResults = [];
    
    missingPairs.forEach(pair => {
      const originIdx = missingOrigins.findIndex(origin => 
        this.compareLocations(origin, pair.origin)
      );
      const destIdx = missingDests.findIndex(dest => 
        this.compareLocations(dest, pair.destination)
      );
      
      if (originIdx >= 0 && destIdx >= 0 && 
          matrixResult.rows[originIdx] && 
          matrixResult.rows[originIdx].elements[destIdx]) {
        
        const element = matrixResult.rows[originIdx].elements[destIdx];
        
        apiResults.push({
          origin: pair.origin,
          destination: pair.destination,
          originIndex: pair.originIndex,
          destIndex: pair.destIndex,
          data: element
        });
      }
    });
    
    return apiResults;
  }

  /**
   * 🛠️ Compare two locations
   */
  compareLocations(loc1, loc2) {
    if (typeof loc1 === 'string' && typeof loc2 === 'string') {
      return loc1.toLowerCase().trim() === loc2.toLowerCase().trim();
    }
    
    if (loc1.lat && loc1.lng && loc2.lat && loc2.lng) {
      // Compare coordinates with tolerance
      const tolerance = 0.0001; // ~11m
      return Math.abs(loc1.lat - loc2.lat) < tolerance && 
             Math.abs(loc1.lng - loc2.lng) < tolerance;
    }
    
    return false;
  }

  /**
   * 🛠️ Calculate large batch processing
   */
  async calculateLargeBatch(missingPairs, options = {}) {
    const results = [];
    const batchSize = this.config.batchSize;
    
    console.log(`📦 Processing ${missingPairs.length} pairs in batches of ${batchSize}`);
    
    for (let i = 0; i < missingPairs.length; i += batchSize) {
      const batch = missingPairs.slice(i, i + batchSize);
      
      try {
        // Add delay between batches for rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
        }
        
        // Process batch sequentially to avoid overwhelming API
        for (const pair of batch) {
          try {
            const result = await this.provider.calculateSingleDistance(
              pair.origin, 
              pair.destination, 
              { ...this.config, ...options }
            );
            
            results.push({
              origin: pair.origin,
              destination: pair.destination,
              originIndex: pair.originIndex,
              destIndex: pair.destIndex,
              data: result
            });
            
            // Small delay between individual requests
            await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
            
          } catch (pairError) {
            console.warn(`⚠️ Pair failed: ${this.formatLocationForLog(pair.origin)} → ${this.formatLocationForLog(pair.destination)}:`, pairError.message);
          }
        }
        
      } catch (batchError) {
        console.warn(`⚠️ Batch ${i}-${i + batchSize} failed:`, batchError.message);
      }
    }
    
    return results;
  }

  /**
   * 🛠️ Build matrix from cache results
   */
  buildMatrixFromCache(cacheResults, originCount, destCount) {
    const matrix = {
      rows: Array(originCount).fill(null).map(() => ({
        elements: Array(destCount).fill(null)
      }))
    };
    
    cacheResults.forEach(result => {
      if (result.originIndex < originCount && result.destIndex < destCount) {
        matrix.rows[result.originIndex].elements[result.destIndex] = {
          status: 'OK',
          distance: result.result.distance,
          duration: result.result.duration,
          durationInTraffic: result.result.durationInTraffic,
          trafficDelay: result.result.trafficDelay
        };
      }
    });
    
    return matrix;
  }

  /**
   * 🛠️ Build final matrix from mixed results
   */
  buildFinalMatrix(allResults, originCount, destCount) {
    const matrix = {
      rows: Array(originCount).fill(null).map(() => ({
        elements: Array(destCount).fill(null).map(() => ({ status: 'FAILED' }))
      })),
      summary: {
        totalElements: originCount * destCount,
        successfulElements: 0,
        failedElements: 0
      }
    };
    
    allResults.forEach(result => {
      if (result.originIndex < originCount && result.destIndex < destCount) {
        const normalizedResult = this.normalizeResult(result.data || result.result);
        
        matrix.rows[result.originIndex].elements[result.destIndex] = {
          status: 'OK',
          distance: normalizedResult.distance,
          duration: normalizedResult.duration,
          durationInTraffic: normalizedResult.durationInTraffic,
          trafficDelay: normalizedResult.trafficDelay,
          originIndex: result.originIndex,
          destinationIndex: result.destIndex
        };
        
        matrix.summary.successfulElements++;
      }
    });
    
    matrix.summary.failedElements = matrix.summary.totalElements - matrix.summary.successfulElements;
    
    return matrix;
  }

  /**
   * 📊 Statystyki
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      provider: this.provider.getUsageStats(),
      config: this.config
    };
  }

  /**
   * 🧹 Clear cache
   */
  clearCache() {
    return this.cache.clear();
  }
}

// Singleton instance
let distanceMatrixInstance = null;

export const getDistanceMatrixService = (config) => {
  if (!distanceMatrixInstance) {
    // 💡 Konfiguracja: TYLKO Google Distance Matrix API
    const defaultConfig = {
      provider: 'google',
      googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      enableCache: true,
      distanceExpiry: 7 * 24 * 60 * 60 * 1000, // 7 dni cache
      trafficExpiry: 30 * 60 * 1000 // 30 min dla ruchu
    };
    
    distanceMatrixInstance = new DistanceMatrixService({
      ...defaultConfig,
      ...config // Pozwól na override jeśli potrzeba
    });
  }
  return distanceMatrixInstance;
};

export default DistanceMatrixService;