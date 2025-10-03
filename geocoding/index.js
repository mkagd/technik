// geocoding/index.js
// Główny interfejs dla wysokiej jakości geocoding w Polsce

import GoogleGeocodingProvider from './providers/GoogleGeocodingProvider.js';
import AddressValidator from './utils/AddressValidator.js';
import GeocodingCache from './utils/GeocodingCache.js';

/**
 * 🗺️ Główna klasa GeocodingService - wysokiej jakości dekodowanie adresów polskich
 * 
 * Funkcjonalności:
 * - Google Maps API (maksymalna dokładność)
 * - Inteligentna walidacja polskich adresów
 * - Cache dla wydajności
 * - Normalizacja wyników
 * - Retry logic
 */
export class GeocodingService {
  constructor(config = {}) {
    this.config = {
      // Google Maps API key (najwyższa jakość dla Polski)
      googleApiKey: config.googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      
      // Preferencje regionalne
      region: config.region || 'pl', // Priorytet dla Polski
      language: config.language || 'pl',
      
      // Cache settings
      enableCache: config.enableCache !== false,
      cacheExpiry: config.cacheExpiry || 24 * 60 * 60 * 1000, // 24h
      
      // Timeout i retry
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 2,
      
      // Providers priority
      providers: config.providers || ['google']
    };

    // Inicjalizacja komponentów
    this.cache = new GeocodingCache(this.config.cacheExpiry);
    this.validator = new AddressValidator();
    
    // Inicjalizacja providerów
    this.providers = {};
    
    if (this.config.providers.includes('google') && this.config.googleApiKey) {
      this.providers.google = new GoogleGeocodingProvider(this.config);
    }

    console.log('🗺️ GeocodingService zainicjalizowany:', {
      providers: Object.keys(this.providers),
      cache: this.config.enableCache,
      region: this.config.region
    });
  }

  /**
   * 🎯 Główna metoda - dekoduje adres na współrzędne
   */
  async geocode(address) {
    try {
      // Walidacja input
      if (!address || typeof address !== 'string') {
        throw new Error('Niepoprawny adres');
      }

      const cleanAddress = address.trim();
      if (cleanAddress.length < 3) {
        throw new Error('Adres zbyt krótki');
      }

      console.log('🔍 Geocoding request:', cleanAddress);

      // Sprawdź cache
      if (this.config.enableCache) {
        const cached = this.cache.get(cleanAddress);
        if (cached) {
          console.log('💾 Cache hit:', cached);
          return this.normalizeResult(cached);
        }
      }

      // Walidacja i pre-processing polskiego adresu
      const validationResult = this.validator.validateAndEnhance(cleanAddress);
      console.log('✅ Walidacja adresu:', validationResult);

      let result = null;
      let lastError = null;

      // Próbuj providers w kolejności
      for (const providerName of this.config.providers) {
        const provider = this.providers[providerName];
        if (!provider) continue;

        try {
          console.log(`🌐 Próba provider: ${providerName}`);
          
          const providerResult = await this.withTimeout(
            provider.geocode(validationResult.enhanced || cleanAddress),
            this.config.timeout
          );

          if (providerResult && this.isValidResult(providerResult)) {
            result = providerResult;
            result.provider = providerName;
            result.confidence = this.calculateConfidence(result, validationResult);
            
            console.log(`✅ Sukces ${providerName}:`, result);
            break;
          }

        } catch (error) {
          console.warn(`❌ Provider ${providerName} failed:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!result) {
        throw lastError || new Error('Nie udało się znaleźć adresu');
      }

      // Normalizuj wynik
      const normalizedResult = this.normalizeResult(result);

      // Zapisz do cache
      if (this.config.enableCache) {
        this.cache.set(cleanAddress, normalizedResult);
      }

      return normalizedResult;

    } catch (error) {
      console.error('🚨 Geocoding error:', error);
      throw error;
    }
  }

  /**
   * 🔄 Reverse geocoding - współrzędne na adres
   */
  async reverseGeocode(lat, lng) {
    try {
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        throw new Error('Niepoprawne współrzędne');
      }

      console.log('🔄 Reverse geocoding:', { lat, lng });

      // Sprawdź cache
      const cacheKey = `reverse_${lat}_${lng}`;
      if (this.config.enableCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log('💾 Reverse cache hit:', cached);
          return cached;
        }
      }

      let result = null;
      let lastError = null;

      // Próbuj providers
      for (const providerName of this.config.providers) {
        const provider = this.providers[providerName];
        if (!provider || !provider.reverseGeocode) continue;

        try {
          const providerResult = await this.withTimeout(
            provider.reverseGeocode(lat, lng),
            this.config.timeout
          );

          if (providerResult && providerResult.address) {
            result = providerResult;
            result.provider = providerName;
            break;
          }

        } catch (error) {
          console.warn(`❌ Reverse ${providerName} failed:`, error.message);
          lastError = error;
        }
      }

      if (!result) {
        throw lastError || new Error('Nie udało się znaleźć adresu dla współrzędnych');
      }

      // Zapisz do cache
      if (this.config.enableCache) {
        this.cache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('🚨 Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Batch geocoding - wiele adresów na raz
   */
  async geocodeBatch(addresses, options = {}) {
    const { maxConcurrent = 3, delayBetween = 100 } = options;
    const results = [];
    
    console.log(`📦 Batch geocoding ${addresses.length} adresów`);

    // Przetwarzaj w grupach
    for (let i = 0; i < addresses.length; i += maxConcurrent) {
      const batch = addresses.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (address, index) => {
        try {
          // Opóźnienie dla rate limiting
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetween));
          }
          
          const result = await this.geocode(address);
          return { address, result, success: true };
        } catch (error) {
          return { address, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Opóźnienie między grupami
      if (i + maxConcurrent < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetween * 2));
      }
    }

    console.log(`✅ Batch completed: ${results.filter(r => r.success).length}/${results.length} success`);
    return results;
  }

  /**
   * 🛠️ Utility methods
   */
  isValidResult(result) {
    return result && 
           result.lat && 
           result.lng && 
           !isNaN(result.lat) && 
           !isNaN(result.lng) &&
           Math.abs(result.lat) <= 90 &&
           Math.abs(result.lng) <= 180;
  }

  calculateConfidence(result, validationResult) {
    let confidence = 0.5; // base confidence

    // Boost dla dokładnych dopasowań
    if (result.accuracy === 'ROOFTOP' || result.location_type === 'ROOFTOP') {
      confidence += 0.4;
    } else if (result.accuracy === 'RANGE_INTERPOLATED') {
      confidence += 0.2;
    }

    // Boost dla walidowanych adresów
    if (validationResult.isValid) {
      confidence += 0.1;
    }

    // Penalty dla niepewnych wyników
    if (result.partial_match) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  normalizeResult(result) {
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lng),
      address: result.address || result.formatted_address,
      components: result.components || {},
      accuracy: result.accuracy || 'APPROXIMATE',
      confidence: result.confidence || 0.5,
      provider: result.provider,
      timestamp: new Date().toISOString()
    };
  }

  async withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * 📊 Statystyki cache
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 🧹 Wyczyść cache
   */
  clearCache() {
    return this.cache.clear();
  }
}

// Singleton instance dla łatwego importu
let geocodingInstance = null;

export const getGeocodingService = (config) => {
  if (!geocodingInstance) {
    geocodingInstance = new GeocodingService(config);
  }
  return geocodingInstance;
};

export default GeocodingService;