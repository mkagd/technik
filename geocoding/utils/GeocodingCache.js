// geocoding/utils/GeocodingCache.js
// System cache dla geocoding - localStorage + memory cache

/**
 * 💾 GeocodingCache - wydajny cache dla wyników geocoding
 * 
 * Funkcjonalności:
 * - Dual-layer cache (memory + localStorage)
 * - Automatyczne expiry
 * - Kompresja danych
 * - Statystyki hit/miss
 * - Cleanup starych wpisów
 */
export default class GeocodingCache {
  constructor(defaultExpiry = 24 * 60 * 60 * 1000) { // 24h default
    this.defaultExpiry = defaultExpiry;
    this.memoryCache = new Map();
    this.storageKey = 'geocoding_cache_v1';
    this.statsKey = 'geocoding_stats_v1';
    
    // Statystyki
    this.stats = this.loadStats();
    
    // Cleanup przy inicjalizacji
    this.cleanup();
    
    console.log('💾 GeocodingCache initialized:', {
      defaultExpiry: `${defaultExpiry / 1000 / 60}min`,
      memoryEntries: this.memoryCache.size,
      storageEntries: this.getStorageSize()
    });
  }

  /**
   * 📥 Pobierz z cache
   */
  get(key) {
    const normalizedKey = this.normalizeKey(key);
    
    // Sprawdź memory cache najpierw (najszybszy)
    if (this.memoryCache.has(normalizedKey)) {
      const entry = this.memoryCache.get(normalizedKey);
      
      if (this.isExpired(entry)) {
        this.memoryCache.delete(normalizedKey);
      } else {
        this.stats.memoryHits++;
        console.log('🎯 Memory cache HIT:', normalizedKey);
        return entry.data;
      }
    }

    // Sprawdź localStorage
    try {
      const storageData = localStorage.getItem(this.storageKey);
      if (storageData) {
        const cache = JSON.parse(storageData);
        
        if (cache[normalizedKey]) {
          const entry = cache[normalizedKey];
          
          if (this.isExpired(entry)) {
            // Usuń wygasły wpis
            delete cache[normalizedKey];
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
          } else {
            // Dodaj do memory cache dla przyszłych odwołań
            this.memoryCache.set(normalizedKey, entry);
            this.stats.storageHits++;
            console.log('💾 Storage cache HIT:', normalizedKey);
            return entry.data;
          }
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * 📤 Zapisz do cache
   */
  set(key, data, customExpiry = null) {
    const normalizedKey = this.normalizeKey(key);
    const expiry = customExpiry || this.defaultExpiry;
    
    const entry = {
      data: data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      size: this.estimateSize(data)
    };

    // Zapisz do memory cache
    this.memoryCache.set(normalizedKey, entry);

    // Zapisz do localStorage
    try {
      const storageData = localStorage.getItem(this.storageKey);
      const cache = storageData ? JSON.parse(storageData) : {};
      
      cache[normalizedKey] = entry;
      
      // Sprawdź rozmiar i wyczyść jeśli za duży
      const cacheSize = JSON.stringify(cache).length;
      if (cacheSize > 5 * 1024 * 1024) { // 5MB limit
        console.log('🧹 Cache too large, cleaning up...');
        this.cleanupStorage(cache);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
      this.stats.writes++;
      
      console.log('💾 Cached:', normalizedKey, `(${entry.size} bytes)`);
      
    } catch (error) {
      console.warn('Cache write error:', error);
      
      // Jeśli localStorage jest pełny, wyczyść stare wpisy
      if (error.name === 'QuotaExceededError') {
        console.log('🧹 Storage quota exceeded, cleaning up...');
        this.forceCleanup();
      }
    }

    this.saveStats();
  }

  /**
   * 🧹 Wyczyść wygasłe wpisy
   */
  cleanup() {
    const now = Date.now();
    let cleanedMemory = 0;
    let cleanedStorage = 0;

    // Wyczyść memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleanedMemory++;
      }
    }

    // Wyczyść localStorage
    try {
      const storageData = localStorage.getItem(this.storageKey);
      if (storageData) {
        const cache = JSON.parse(storageData);
        const originalSize = Object.keys(cache).length;
        
        for (const key in cache) {
          if (this.isExpired(cache[key])) {
            delete cache[key];
            cleanedStorage++;
          }
        }
        
        if (cleanedStorage > 0) {
          localStorage.setItem(this.storageKey, JSON.stringify(cache));
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }

    if (cleanedMemory > 0 || cleanedStorage > 0) {
      console.log(`🧹 Cleanup: ${cleanedMemory} memory, ${cleanedStorage} storage entries removed`);
    }
  }

  /**
   * 🔥 Wymuś agresywne czyszczenie (gdy brak miejsca)
   */
  forceCleanup() {
    try {
      const storageData = localStorage.getItem(this.storageKey);
      if (storageData) {
        const cache = JSON.parse(storageData);
        const entries = Object.entries(cache);
        
        // Sortuj po timestamp (najstarsze pierwsze)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Zostaw tylko 50% najnowszych wpisów
        const keepCount = Math.floor(entries.length * 0.5);
        const newCache = {};
        
        for (let i = entries.length - keepCount; i < entries.length; i++) {
          const [key, entry] = entries[i];
          newCache[key] = entry;
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(newCache));
        console.log(`🔥 Force cleanup: kept ${keepCount}/${entries.length} entries`);
      }
    } catch (error) {
      // Ostateczność - wyczyść wszystko
      localStorage.removeItem(this.storageKey);
      console.log('🔥 Force cleanup: cleared all cache');
    }
    
    // Wyczyść też memory cache
    this.memoryCache.clear();
  }

  /**
   * 🧹 Wyczyść storage (pomocnicza)
   */
  cleanupStorage(cache) {
    const entries = Object.entries(cache);
    const now = Date.now();
    
    // Usuń wygasłe
    let cleaned = 0;
    for (const [key, entry] of entries) {
      if (this.isExpired(entry)) {
        delete cache[key];
        cleaned++;
      }
    }
    
    // Jeśli nadal za duży, usuń najstarsze
    if (JSON.stringify(cache).length > 4 * 1024 * 1024) { // 4MB
      const remaining = Object.entries(cache);
      remaining.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const keepCount = Math.floor(remaining.length * 0.7);
      const newCache = {};
      
      for (let i = remaining.length - keepCount; i < remaining.length; i++) {
        const [key, entry] = remaining[i];
        newCache[key] = entry;
      }
      
      Object.keys(cache).forEach(key => delete cache[key]);
      Object.assign(cache, newCache);
      
      console.log(`Cleanup: kept ${keepCount}/${remaining.length} entries`);
    }
  }

  /**
   * 📊 Pobierz statystyki
   */
  getStats() {
    return {
      ...this.stats,
      memorySize: this.memoryCache.size,
      storageSize: this.getStorageSize(),
      hitRate: this.getHitRate(),
      totalRequests: this.stats.memoryHits + this.stats.storageHits + this.stats.misses
    };
  }

  /**
   * 🔄 Resetuj statystyki
   */
  resetStats() {
    this.stats = {
      memoryHits: 0,
      storageHits: 0,
      misses: 0,
      writes: 0,
      created: Date.now()
    };
    this.saveStats();
  }

  /**
   * 🗑️ Wyczyść cały cache
   */
  clear() {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Clear cache error:', error);
    }
    this.resetStats();
    console.log('🗑️ Cache cleared');
  }

  // ========== HELPER METHODS ==========

  normalizeKey(key) {
    return key.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  isExpired(entry) {
    return Date.now() > entry.expiry;
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  getStorageSize() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? Object.keys(JSON.parse(data)).length : 0;
    } catch {
      return 0;
    }
  }

  getHitRate() {
    const total = this.stats.memoryHits + this.stats.storageHits + this.stats.misses;
    if (total === 0) return 0;
    return ((this.stats.memoryHits + this.stats.storageHits) / total * 100).toFixed(1);
  }

  loadStats() {
    try {
      const data = localStorage.getItem(this.statsKey);
      return data ? JSON.parse(data) : {
        memoryHits: 0,
        storageHits: 0,
        misses: 0,
        writes: 0,
        created: Date.now()
      };
    } catch {
      return {
        memoryHits: 0,
        storageHits: 0,
        misses: 0,
        writes: 0,
        created: Date.now()
      };
    }
  }

  saveStats() {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Save stats error:', error);
    }
  }
}