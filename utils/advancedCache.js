/**
 * 🚀 ADVANCED CACHING SYSTEM
 * 
 * Inteligentny system cache'owania dla często używanych danych:
 * - Klienci (clients.json) - najczęściej odczytywane
 * - Zamówienia (orders.json) - często filtrowane i wyszukiwane  
 * - Automatyczne odświeżanie przy zmianach
 * - Memory cache + smart invalidation
 * - Request deduplication
 * 
 * Wersja: 1.0
 * Data: 2025-01-23
 */

// ========== KONFIGURACJA CACHE ==========
const CACHE_CONFIG = {
  // Czas życia cache (TTL)
  TTL: {
    clients: 5 * 60 * 1000,      // 5 minut - rzadko się zmieniają
    orders: 2 * 60 * 1000,       // 2 minuty - częściej aktualizowane
    stats: 10 * 60 * 1000,       // 10 minut - statystyki
    search: 30 * 1000            // 30 sekund - wyniki wyszukiwania
  },
  
  // Maksymalna wielkość cache (liczba wpisów)
  MAX_SIZE: {
    clients: 1000,               // Mało klientów, długo w cache
    orders: 2000,                // Więcej zamówień, średnio w cache
    search: 100,                 // Wyniki wyszukiwania, krótko w cache
    stats: 50                    // Różne statystyki
  },
  
  // Automatyczne odświeżanie
  AUTO_REFRESH: {
    enabled: true,
    interval: 60 * 1000,         // Co minutę sprawdź czy refresh potrzebny
    background: true             // Odświeżaj w tle
  }
};

// ========== GŁÓWNA KLASA CACHE ==========
class AdvancedCache {
  
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.requestQueue = new Map(); // Dla request deduplication
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      backgroundRefreshes: 0
    };
    
    // Automatyczne czyszczenie co minutę
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
    
    // Automatyczne odświeżanie w tle
    if (CACHE_CONFIG.AUTO_REFRESH.enabled) {
      this.refreshInterval = setInterval(() => {
        this.backgroundRefresh();
      }, CACHE_CONFIG.AUTO_REFRESH.interval);
    }
  }
  
  /**
   * Pobiera dane z cache lub ładuje jeśli brak
   */
  async get(key, loaderFunction, ttl = null) {
    const cacheKey = this.normalizeKey(key);
    
    // Sprawdź czy dane są w cache i świeże
    if (this.isValid(cacheKey, ttl)) {
      this.stats.hits++;
      return this.cache.get(cacheKey);
    }
    
    // Request deduplication - jeśli już ładujemy te dane, poczekaj
    if (this.requestQueue.has(cacheKey)) {
      return await this.requestQueue.get(cacheKey);
    }
    
    // Załaduj dane
    this.stats.misses++;
    const loadPromise = this.loadData(cacheKey, loaderFunction, ttl);
    this.requestQueue.set(cacheKey, loadPromise);
    
    try {
      const data = await loadPromise;
      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }
  
  /**
   * Ustawia dane w cache
   */
  set(key, data, ttl = null) {
    const cacheKey = this.normalizeKey(key);
    const category = this.getCategory(cacheKey);
    
    // Sprawdź limit wielkości cache dla kategorii
    if (this.cache.size >= (CACHE_CONFIG.MAX_SIZE[category] || 100)) {
      this.evictOldest(category);
    }
    
    this.cache.set(cacheKey, data);
    this.timestamps.set(cacheKey, Date.now());
    
    return data;
  }
  
  /**
   * Usuwa dane z cache (invalidation)
   */
  invalidate(key) {
    const cacheKey = this.normalizeKey(key);
    
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.timestamps.delete(cacheKey);
      this.stats.invalidations++;
      return true;
    }
    
    return false;
  }
  
  /**
   * Usuwa wszystkie dane konkretnej kategorii
   */
  invalidateCategory(category) {
    let deletedCount = 0;
    
    for (const [key] of this.cache) {
      if (key.startsWith(`${category}:`)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.invalidations += deletedCount;
    return deletedCount;
  }
  
  /**
   * Czyszczenie przestarzałych danych
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, timestamp] of this.timestamps) {
      const category = this.getCategory(key);
      const ttl = CACHE_CONFIG.TTL[category] || 5 * 60 * 1000;
      
      if (now - timestamp > ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cache cleanup: usunięto ${expiredKeys.length} przestarzałych wpisów`);
    }
  }
  
  /**
   * Odświeżanie w tle (proactive refresh)
   */
  async backgroundRefresh() {
    if (!CACHE_CONFIG.AUTO_REFRESH.background) return;
    
    const now = Date.now();
    const toRefresh = [];
    
    // Znajdź dane bliskie wygaśnięciu
    for (const [key, timestamp] of this.timestamps) {
      const category = this.getCategory(key);
      const ttl = CACHE_CONFIG.TTL[category] || 5 * 60 * 1000;
      const age = now - timestamp;
      
      // Odśwież jeśli zostało 25% czasu do wygaśnięcia
      if (age > ttl * 0.75) {
        toRefresh.push(key);
      }
    }
    
    // Odśwież wybrane klucze
    for (const key of toRefresh) {
      try {
        if (key.startsWith('clients:')) {
          await this.get(key, () => this.loadClients());
          this.stats.backgroundRefreshes++;
        } else if (key.startsWith('orders:')) {
          await this.get(key, () => this.loadOrders());
          this.stats.backgroundRefreshes++;
        }
      } catch (error) {
        console.error(`❌ Błąd background refresh dla ${key}:`, error.message);
      }
    }
  }
  
  /**
   * Statystyki wydajności cache
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(1) : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      categories: this.getCategoryStats()
    };
  }
  
  /**
   * Reset statystyk
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      backgroundRefreshes: 0
    };
  }
  
  /**
   * Zamknij cache i wyczyść interwały
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.cache.clear();
    this.timestamps.clear();
    this.requestQueue.clear();
  }
  
  // ========== METODY POMOCNICZE ==========
  
  normalizeKey(key) {
    return typeof key === 'string' ? key : JSON.stringify(key);
  }
  
  getCategory(key) {
    return key.split(':')[0] || 'general';
  }
  
  isValid(key, customTtl = null) {
    if (!this.cache.has(key)) return false;
    
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    
    const category = this.getCategory(key);
    const ttl = customTtl || CACHE_CONFIG.TTL[category] || 5 * 60 * 1000;
    
    return (Date.now() - timestamp) < ttl;
  }
  
  async loadData(key, loaderFunction, ttl) {
    try {
      const data = await loaderFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`❌ Błąd ładowania danych dla ${key}:`, error.message);
      throw error;
    }
  }
  
  evictOldest(category) {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, timestamp] of this.timestamps) {
      if (key.startsWith(`${category}:`) && timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.timestamps.delete(oldestKey);
    }
  }
  
  getCategoryStats() {
    const categories = {};
    
    for (const key of this.cache.keys()) {
      const category = this.getCategory(key);
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    }
    
    return categories;
  }
  
  // Metody ładowania danych (do nadpisania)
  async loadClients() {
    const { readClients } = await import('./clientOrderStorage.js');
    return await readClients();
  }
  
  async loadOrders() {
    const { readOrders } = await import('./clientOrderStorage.js');
    return await readOrders();
  }
}

// ========== INSTANCJA GLOBALNA ==========
let globalCache = null;

function getCache() {
  if (!globalCache) {
    globalCache = new AdvancedCache();
  }
  return globalCache;
}

// ========== CACHE HELPERS - GOTOWE FUNKCJE ==========
class CacheHelpers {
  
  /**
   * Pobiera wszystkich klientów (cached)
   */
  static async getClients() {
    const cache = getCache();
    return await cache.get('clients:all', async () => {
      const { readClients } = await import('./clientOrderStorage.js');
      return await readClients();
    });
  }
  
  /**
   * Pobiera wszystkie zamówienia (cached)
   */
  static async getOrders() {
    const cache = getCache();
    return await cache.get('orders:all', async () => {
      const { readOrders } = await import('./clientOrderStorage.js');
      return await readOrders();
    });
  }
  
  /**
   * Pobiera klienta po ID (cached)
   */
  static async getClientById(clientId) {
    const cache = getCache();
    return await cache.get(`clients:id:${clientId}`, async () => {
      const clients = await this.getClients();
      return clients.find(c => c.id === clientId) || null;
    });
  }
  
  /**
   * Pobiera zamówienia klienta (cached)
   */
  static async getOrdersByClient(clientId) {
    const cache = getCache();
    return await cache.get(`orders:client:${clientId}`, async () => {
      const orders = await this.getOrders();
      return orders.filter(o => o.clientId === clientId);
    });
  }
  
  /**
   * Wyszukuje klientów (cached na krótko)
   */
  static async searchClients(query) {
    const cache = getCache();
    const searchKey = `search:clients:${query.toLowerCase()}`;
    
    return await cache.get(searchKey, async () => {
      const clients = await this.getClients();
      const searchTerm = query.toLowerCase();
      
      return clients.filter(client => 
        client.name?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.phone?.includes(query) ||
        client.address?.toLowerCase().includes(searchTerm)
      );
    }, CACHE_CONFIG.TTL.search);
  }
  
  /**
   * Filtruje zamówienia (cached)
   */
  static async filterOrders(filters) {
    const cache = getCache();
    const filterKey = `orders:filter:${JSON.stringify(filters)}`;
    
    return await cache.get(filterKey, async () => {
      const orders = await this.getOrders();
      
      return orders.filter(order => {
        // Status
        if (filters.status && order.status !== filters.status) {
          return false;
        }
        
        // Priorytet
        if (filters.priority && order.priority !== filters.priority) {
          return false;
        }
        
        // Kategoria
        if (filters.category && order.category !== filters.category) {
          return false;
        }
        
        // Klient
        if (filters.clientId && order.clientId !== filters.clientId) {
          return false;
        }
        
        // Data od-do
        if (filters.dateFrom || filters.dateTo) {
          const orderDate = new Date(order.dateAdded);
          if (filters.dateFrom && orderDate < new Date(filters.dateFrom)) {
            return false;
          }
          if (filters.dateTo && orderDate > new Date(filters.dateTo)) {
            return false;
          }
        }
        
        return true;
      });
    }, CACHE_CONFIG.TTL.search);
  }
  
  /**
   * Pobiera statystyki (cached długo)
   */
  static async getStats() {
    const cache = getCache();
    return await cache.get('stats:dashboard', async () => {
      const [clients, orders] = await Promise.all([
        this.getClients(),
        this.getOrders()
      ]);
      
      // Oblicz statystyki
      const clientsCount = clients.length;
      const ordersCount = orders.length;
      
      const ordersByStatus = {};
      const ordersByPriority = {};
      const ordersByCategory = {};
      
      orders.forEach(order => {
        // Status
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        
        // Priorytet
        ordersByPriority[order.priority] = (ordersByPriority[order.priority] || 0) + 1;
        
        // Kategoria
        ordersByCategory[order.category] = (ordersByCategory[order.category] || 0) + 1;
      });
      
      return {
        clients: clientsCount,
        orders: ordersCount,
        ordersByStatus,
        ordersByPriority,
        ordersByCategory,
        lastUpdated: new Date().toISOString()
      };
    }, CACHE_CONFIG.TTL.stats);
  }
  
  /**
   * Invaliduje cache po zmianach danych
   */
  static invalidateClients() {
    const cache = getCache();
    const deletedCount = cache.invalidateCategory('clients');
    console.log(`🔄 Invalidated ${deletedCount} client cache entries`);
  }
  
  static invalidateOrders() {
    const cache = getCache();
    const deletedCount = cache.invalidateCategory('orders');
    console.log(`🔄 Invalidated ${deletedCount} order cache entries`);
  }
  
  static invalidateStats() {
    const cache = getCache();
    const deletedCount = cache.invalidateCategory('stats');
    console.log(`🔄 Invalidated ${deletedCount} stats cache entries`);
  }
  
  static invalidateAll() {
    const cache = getCache();
    cache.cache.clear();
    cache.timestamps.clear();
    console.log('🔄 Cache completely invalidated');
  }
}

// ========== AUTO-INVALIDATION HOOKS ==========
class CacheInvalidationHooks {
  
  /**
   * Hook dla operacji na klientach
   */
  static onClientChange(operation, clientData) {
    console.log(`🔄 Client ${operation}: invalidating cache`);
    CacheHelpers.invalidateClients();
    CacheHelpers.invalidateStats();
    
    // Invaliduj też powiązane zamówienia
    if (clientData?.id) {
      const cache = getCache();
      cache.invalidate(`orders:client:${clientData.id}`);
    }
  }
  
  /**
   * Hook dla operacji na zamówieniach
   */
  static onOrderChange(operation, orderData) {
    console.log(`🔄 Order ${operation}: invalidating cache`);
    CacheHelpers.invalidateOrders();
    CacheHelpers.invalidateStats();
    
    // Invaliduj cache klienta
    if (orderData?.clientId) {
      const cache = getCache();
      cache.invalidate(`orders:client:${orderData.clientId}`);
    }
  }
}

// ========== MONITORING I DEBUG ==========
class CacheMonitor {
  
  /**
   * Wyświetla statystyki cache
   */
  static displayStats() {
    const cache = getCache();
    const stats = cache.getStats();
    
    console.log('\n📊 STATYSTYKI CACHE:');
    console.log(`🎯 Hit Rate: ${stats.hitRate} (${stats.hits}/${stats.totalRequests})`);
    console.log(`📝 Cache Size: ${stats.cacheSize} entries`);
    console.log(`🔄 Invalidations: ${stats.invalidations}`);
    console.log(`🔃 Background Refreshes: ${stats.backgroundRefreshes}`);
    
    console.log('\n📋 Entries by Category:');
    Object.entries(stats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} entries`);
    });
  }
  
  /**
   * Test wydajności cache
   */
  static async performanceTest() {
    console.log('\n🚀 TEST WYDAJNOŚCI CACHE\n');
    
    // Test 1: Pierwsze załadowanie (miss)
    console.log('📥 Test 1: Cold cache (miss)');
    const start1 = Date.now();
    const clients1 = await CacheHelpers.getClients();
    const time1 = Date.now() - start1;
    console.log(`   Clients loaded in ${time1}ms (${clients1.length} records)`);
    
    // Test 2: Drugie załadowanie (hit)
    console.log('⚡ Test 2: Warm cache (hit)');
    const start2 = Date.now();
    const clients2 = await CacheHelpers.getClients();
    const time2 = Date.now() - start2;
    console.log(`   Clients loaded in ${time2}ms (speedup: ${(time1/time2).toFixed(1)}x)`);
    
    // Test 3: Multiple concurrent requests
    console.log('🔄 Test 3: Concurrent requests (deduplication)');
    const start3 = Date.now();
    const promises = Array(10).fill().map(() => CacheHelpers.getClients());
    await Promise.all(promises);
    const time3 = Date.now() - start3;
    console.log(`   10 concurrent requests in ${time3}ms`);
    
    // Wyświetl statystyki
    this.displayStats();
  }
}

// ========== EXPORT ==========
export {
  AdvancedCache,
  CacheHelpers,
  CacheInvalidationHooks,
  CacheMonitor,
  getCache
};