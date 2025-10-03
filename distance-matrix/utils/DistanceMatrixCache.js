// distance-matrix/utils/DistanceMatrixCache.js
// Cache system dla Google Distance Matrix API

/**
 * 🏎️ DistanceMatrixCache - cache dla odległości i czasów dojazdu
 * 
 * Funkcjonalności:
 * - Dual-layer cache (memory + localStorage)
 * - Inteligentne cache keys bazowane na współrzędnych
 * - Expiry dla różnych typów danych
 * - Statystyki cache hit/miss
 * - Batch cache operations
 */
export default class DistanceMatrixCache {
  constructor(config = {}) {
    this.config = {
      // Cache expiry times
      distanceExpiry: config.distanceExpiry || 7 * 24 * 60 * 60 * 1000, // 7 dni dla odległości
      trafficExpiry: config.trafficExpiry || 30 * 60 * 1000, // 30 min dla ruchu
      
      // Cache size limits
      maxMemoryEntries: config.maxMemoryEntries || 1000,
      maxLocalStorageEntries: config.maxLocalStorageEntries || 5000,
      
      // Keys
      memoryPrefix: 'dm_mem_',
      localStoragePrefix: 'dm_ls_',
      
      // Stats
      enableStats: config.enableStats !== false
    };

    // Memory cache
    this.memoryCache = new Map();
    
    // Stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      localStorageHits: 0,
      sets: 0,
      evictions: 0,
      errors: 0
    };

    // Periodic cleanup
    this.startCleanupTimer();

    console.log('🏎️ DistanceMatrixCache initialized:', {
      distanceExpiry: this.config.distanceExpiry / (60 * 60 * 1000) + 'h',
      trafficExpiry: this.config.trafficExpiry / (60 * 1000) + 'min',
      maxMemoryEntries: this.config.maxMemoryEntries
    });
  }

  /**
   * 🎯 Pobierz z cache
   */
  get(origin, destination, options = {}) {
    try {
      const key = this.generateKey(origin, destination, options);
      
      // Sprawdź memory cache
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult && !this.isExpired(memoryResult)) {
        this.stats.hits++;
        this.stats.memoryHits++;
        console.log('💾 Memory cache hit:', key);
        return memoryResult.data;
      }

      // Sprawdź localStorage
      if (typeof localStorage !== 'undefined') {
        const lsKey = this.config.localStoragePrefix + key;
        const lsData = localStorage.getItem(lsKey);
        
        if (lsData) {
          const parsed = JSON.parse(lsData);
          if (!this.isExpired(parsed)) {
            // Przenieś do memory cache
            this.memoryCache.set(key, parsed);
            
            this.stats.hits++;
            this.stats.localStorageHits++;
            console.log('💿 LocalStorage cache hit:', key);
            return parsed.data;
          } else {
            // Usuń expired z localStorage
            localStorage.removeItem(lsKey);
          }
        }
      }

      // Cache miss
      this.stats.misses++;
      return null;

    } catch (error) {
      console.warn('⚠️ Cache get error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * 🎯 Zapisz do cache
   */
  set(origin, destination, data, options = {}) {
    try {
      const key = this.generateKey(origin, destination, options);
      const hasTraffic = data.durationInTraffic !== undefined;
      const expiry = hasTraffic ? this.config.trafficExpiry : this.config.distanceExpiry;
      
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiry,
        hasTraffic,
        key
      };

      // Zapisz do memory cache
      this.memoryCache.set(key, cacheEntry);
      
      // Cleanup memory cache jeśli za duży
      if (this.memoryCache.size > this.config.maxMemoryEntries) {
        this.evictOldestMemoryEntries();
      }

      // Zapisz do localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          const lsKey = this.config.localStoragePrefix + key;
          localStorage.setItem(lsKey, JSON.stringify(cacheEntry));
          this.cleanupLocalStorage();
        } catch (lsError) {
          console.warn('⚠️ localStorage set error:', lsError);
        }
      }

      this.stats.sets++;
      console.log('💾 Cache set:', key, hasTraffic ? '(with traffic)' : '(distance only)');

    } catch (error) {
      console.warn('⚠️ Cache set error:', error);
      this.stats.errors++;
    }
  }

  /**
   * 🎯 Batch cache operations
   */
  getBatch(pairs) {
    const results = [];
    const misses = [];

    pairs.forEach((pair, index) => {
      const cached = this.get(pair.origin, pair.destination, pair.options);
      if (cached) {
        results[index] = cached;
      } else {
        misses.push({ ...pair, originalIndex: index });
      }
    });

    return { results, misses };
  }

  setBatch(pairs, dataArray) {
    pairs.forEach((pair, index) => {
      if (dataArray[index]) {
        this.set(pair.origin, pair.destination, dataArray[index], pair.options);
      }
    });
  }

  /**
   * 🛠️ Generowanie kluczy cache
   */
  generateKey(origin, destination, options = {}) {
    // Normalizuj współrzędne do 6 miejsc po przecinku dla consistency
    const normalizeCoord = (coord) => {
      if (typeof coord === 'string') return coord.toLowerCase().trim();
      return `${Math.round(coord * 1000000) / 1000000}`;
    };

    const originKey = typeof origin === 'string' 
      ? origin.toLowerCase().trim()
      : `${normalizeCoord(origin.lat)},${normalizeCoord(origin.lng)}`;
      
    const destKey = typeof destination === 'string'
      ? destination.toLowerCase().trim()  
      : `${normalizeCoord(destination.lat)},${normalizeCoord(destination.lng)}`;

    // Uwzględnij ważne opcje w kluczu
    const mode = options.mode || 'driving';
    const trafficModel = options.trafficModel || 'best_guess';
    const avoid = options.avoid ? options.avoid.sort().join(',') : '';

    return `${originKey}|${destKey}|${mode}|${trafficModel}|${avoid}`;
  }

  /**
   * 🛠️ Sprawdzanie expiry
   */
  isExpired(cacheEntry) {
    return Date.now() > cacheEntry.expiry;
  }

  /**
   * 🛠️ Cleanup methods
   */
  evictOldestMemoryEntries() {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toEvict = entries.length - this.config.maxMemoryEntries + 100; // Remove extra 100
    for (let i = 0; i < toEvict; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.stats.evictions++;
    }

    console.log(`🧹 Evicted ${toEvict} old memory cache entries`);
  }

  cleanupLocalStorage() {
    if (typeof localStorage === 'undefined') return;

    try {
      const keys = [];
      const prefix = this.config.localStoragePrefix;
      
      // Znajdź wszystkie klucze naszego cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }

      // Usuń expired entries
      let removedExpired = 0;
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (this.isExpired(data)) {
            localStorage.removeItem(key);
            removedExpired++;
          }
        } catch (e) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
          removedExpired++;
        }
      });

      // Jeśli nadal za dużo, usuń najstarsze
      if (keys.length - removedExpired > this.config.maxLocalStorageEntries) {
        const remaining = keys.filter(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return !this.isExpired(data);
          } catch (e) {
            return false;
          }
        });

        remaining.sort((a, b) => {
          try {
            const dataA = JSON.parse(localStorage.getItem(a));
            const dataB = JSON.parse(localStorage.getItem(b));
            return dataA.timestamp - dataB.timestamp;
          } catch (e) {
            return 0;
          }
        });

        const toRemove = remaining.length - this.config.maxLocalStorageEntries;
        for (let i = 0; i < toRemove; i++) {
          localStorage.removeItem(remaining[i]);
        }

        console.log(`🧹 Cleaned up ${removedExpired + toRemove} localStorage entries`);
      }

    } catch (error) {
      console.warn('⚠️ localStorage cleanup error:', error);
    }
  }

  startCleanupTimer() {
    // Cleanup co 30 minut
    setInterval(() => {
      this.cleanupExpired();
    }, 30 * 60 * 1000);
  }

  cleanupExpired() {
    // Memory cache cleanup
    let expiredMemory = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        expiredMemory++;
      }
    }

    // localStorage cleanup (już zaimplementowane w cleanupLocalStorage)
    this.cleanupLocalStorage();

    if (expiredMemory > 0) {
      console.log(`🧹 Cleaned ${expiredMemory} expired memory cache entries`);
    }
  }

  /**
   * 📊 Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      config: this.config
    };
  }

  /**
   * 🧹 Clear cache
   */
  clear() {
    this.memoryCache.clear();
    
    if (typeof localStorage !== 'undefined') {
      const keys = [];
      const prefix = this.config.localStoragePrefix;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key));
    }

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      localStorageHits: 0,
      sets: 0,
      evictions: 0,
      errors: 0
    };

    console.log('🧹 Distance Matrix cache cleared');
  }
}