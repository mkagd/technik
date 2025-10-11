// distance-matrix/providerManager.js
// Zarządza wyborem i przełączaniem providerów distance matrix

import { loadGeoConfig, getActiveDistanceMatrixProvider } from '../utils/geo/geoConfig.js';
import OSRMProvider from './providers/OSRMProvider.js';
import HaversineProvider from './providers/HaversineProvider.js';
import GoogleDistanceMatrixProvider from './providers/GoogleDistanceMatrixProvider.js';
import fs from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'config', 'geo-stats.json');
const CACHE_FILE = path.join(process.cwd(), 'data', 'config', 'distance-cache.json');

export class DistanceMatrixManager {
  constructor() {
    this.config = loadGeoConfig();
    this.providers = this.initializeProviders();
    this.cache = this.loadCache();
    this.dailyUsage = this.loadDailyUsage();
  }

  initializeProviders() {
    return {
      osrm: new OSRMProvider(this.config.distanceMatrix.osrm),
      haversine: new HaversineProvider(this.config.distanceMatrix.haversine),
      google: new GoogleDistanceMatrixProvider(this.config.distanceMatrix.googleMatrix)
    };
  }

  /**
   * Główna metoda - oblicza odległość z automatycznym wyborem providera
   */
  async calculateDistance(origin, destination) {
    const cacheKey = this.getCacheKey(origin, destination);
    
    // 1. Sprawdź cache
    if (this.config.distanceMatrix.cacheEnabled) {
      const cached = this.cache[cacheKey];
      if (cached && this.isCacheValid(cached)) {
        this.recordUsage('distanceMatrix', 'cache', true);
        return { ...cached.data, fromCache: true };
      }
    }

    // 2. Wybierz providera na podstawie konfiguracji
    const primaryProvider = this.config.distanceMatrix.provider;
    
    try {
      // Sprawdź czy provider nie przekroczył limitów
      if (primaryProvider === 'google' && this.hasExceededDailyLimit('google')) {
        console.log('⚠️ Google Matrix limit exceeded, falling back to OSRM');
        return await this.calculateWithFallback(origin, destination, ['osrm', 'haversine']);
      }

      // Użyj głównego providera
      const result = await this.calculateWithProvider(primaryProvider, origin, destination);
      
      // Zapisz do cache
      if (this.config.distanceMatrix.cacheEnabled) {
        this.saveToCache(cacheKey, result);
      }
      
      this.recordUsage('distanceMatrix', primaryProvider, true);
      return result;
      
    } catch (error) {
      console.error(`❌ ${primaryProvider} failed:`, error.message);
      this.recordUsage('distanceMatrix', primaryProvider, false);
      
      // Fallback chain
      return await this.calculateWithFallback(origin, destination, this.getFallbackChain(primaryProvider));
    }
  }

  /**
   * Oblicz z konkretnym providerem
   */
  async calculateWithProvider(providerName, origin, destination) {
    const provider = this.providers[providerName];
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const result = await provider.calculateSingleDistance(origin, destination);
    
    return {
      ...result,
      provider: providerName,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Próbuj kolejne providery z fallback chain
   */
  async calculateWithFallback(origin, destination, fallbackChain) {
    for (const providerName of fallbackChain) {
      try {
        console.log(`🔄 Trying fallback: ${providerName}`);
        const result = await this.calculateWithProvider(providerName, origin, destination);
        this.recordUsage('distanceMatrix', providerName, true);
        
        // Zapisz do cache
        if (this.config.distanceMatrix.cacheEnabled) {
          const cacheKey = this.getCacheKey(origin, destination);
          this.saveToCache(cacheKey, result);
        }
        
        return result;
        
      } catch (error) {
        console.error(`❌ Fallback ${providerName} failed:`, error.message);
        this.recordUsage('distanceMatrix', providerName, false);
        continue;
      }
    }

    throw new Error('All distance matrix providers failed');
  }

  /**
   * Określ fallback chain na podstawie konfiguracji
   */
  getFallbackChain(primaryProvider) {
    const preferFree = this.config.costOptimization.strategies.preferFreeProviders;

    if (preferFree) {
      // Strategia oszczędna: darmowe najpierw
      return ['osrm', 'haversine', 'google'].filter(p => p !== primaryProvider);
    } else {
      // Strategia jakościowa: Google najpierw, potem darmowe
      return ['google', 'osrm', 'haversine'].filter(p => p !== primaryProvider);
    }
  }

  /**
   * Oblicz macierz odległości (wiele origin × wiele destinations)
   */
  async calculateDistanceMatrix(origins, destinations) {
    const results = [];

    for (const origin of origins) {
      const row = [];
      for (const destination of destinations) {
        const result = await this.calculateDistance(origin, destination);
        row.push(result);
      }
      results.push(row);
    }

    return {
      rows: results,
      originCount: origins.length,
      destinationCount: destinations.length,
      provider: this.config.distanceMatrix.provider,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache Management
   */
  getCacheKey(origin, destination) {
    const lat1 = parseFloat(origin.lat).toFixed(4);
    const lng1 = parseFloat(origin.lng).toFixed(4);
    const lat2 = parseFloat(destination.lat).toFixed(4);
    const lng2 = parseFloat(destination.lng).toFixed(4);
    
    return `${lat1},${lng1}|${lat2},${lng2}`;
  }

  isCacheValid(cached) {
    if (!cached.timestamp) return false;
    
    const cacheTTL = this.config.distanceMatrix.cacheTTL || 30; // days
    const cacheDate = new Date(cached.timestamp);
    const now = new Date();
    const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
    
    return daysDiff < cacheTTL;
  }

  saveToCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: new Date().toISOString()
    };
    
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('❌ Error saving cache:', error);
    }
  }

  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error loading cache:', error);
    }
    return {};
  }

  /**
   * Usage Tracking
   */
  hasExceededDailyLimit(provider) {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.dailyUsage[today]?.[provider] || 0;
    
    if (provider === 'google') {
      const limit = this.config.costOptimization.apiLimits.dailyGoogleMatrix || 500;
      return usage >= limit;
    }
    
    return false;
  }

  recordUsage(type, provider, success) {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.dailyUsage[today]) {
      this.dailyUsage[today] = {};
    }
    
    if (!this.dailyUsage[today][provider]) {
      this.dailyUsage[today][provider] = { requests: 0, failures: 0 };
    }
    
    this.dailyUsage[today][provider].requests += 1;
    if (!success) {
      this.dailyUsage[today][provider].failures += 1;
    }
    
    this.saveDailyUsage();
  }

  loadDailyUsage() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const data = fs.readFileSync(STATS_FILE, 'utf8');
        const stats = JSON.parse(data);
        
        // Extract distance matrix usage
        const usage = {};
        for (const [date, dayStats] of Object.entries(stats)) {
          usage[date] = {
            google: dayStats.distanceMatrix?.google || 0,
            osrm: dayStats.distanceMatrix?.osrm || 0,
            haversine: dayStats.distanceMatrix?.haversine || 0
          };
        }
        
        return usage;
      }
    } catch (error) {
      console.error('❌ Error loading daily usage:', error);
    }
    return {};
  }

  saveDailyUsage() {
    // Daily usage jest zapisywany przez stats API
    // Ta metoda może być używana do lokalnej synchronizacji
  }

  /**
   * Utilities
   */
  async testAllProviders() {
    const results = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        const result = await provider.testConnection();
        results[name] = result;
      } catch (error) {
        results[name] = {
          success: false,
          message: error.message,
          error: error.stack
        };
      }
    }
    
    return results;
  }

  getProviderStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.dailyUsage[today] || {};
    
    return {
      activeProvider: this.config.distanceMatrix.provider,
      todayUsage,
      cacheSize: Object.keys(this.cache).length,
      providers: Object.keys(this.providers),
      config: this.config.distanceMatrix
    };
  }
}

// Singleton instance
let managerInstance = null;

export function getDistanceMatrixManager() {
  if (!managerInstance) {
    managerInstance = new DistanceMatrixManager();
  }
  return managerInstance;
}

// Reset instance (useful for config changes)
export function resetDistanceMatrixManager() {
  managerInstance = null;
}

export default DistanceMatrixManager;
