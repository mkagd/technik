/**
 * Uniwersalny serwis do wyszukiwania miast po kodzie pocztowym
 * Hybrydowe podejście: OSM (darmowy) → Google (płatny backup)
 * 
 * @module lib/postal-code/service
 * @example
 * ```typescript
 * import { PostalCodeService } from '@/lib/postal-code/service';
 * 
 * const service = PostalCodeService.getInstance();
 * const result = await service.getCityFromPostalCode('00-001');
 * console.log(result.city); // "Warszawa"
 * ```
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { 
  PostalCodeResult, 
  PostalCodeServiceConfig, 
  PostalCodeStats 
} from './types';

export class PostalCodeService {
  private static instance: PostalCodeService;
  private cache: Map<string, PostalCodeResult> = new Map();
  private config: PostalCodeServiceConfig;
  
  private googleRequestCount = 0;
  private lastOsmRequest = 0;
  private lastResetDate = new Date().toDateString();
  
  private readonly CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'postal-codes.json');
  private readonly OSM_REQUEST_DELAY = 1000; // OSM wymaga 1s między requestami

  private constructor() {
    // Załaduj konfigurację z geo-config.json
    const geoConfigPath = path.join(process.cwd(), 'data', 'config', 'geo-config.json');
    let geoConfig: any = {};
    
    try {
      const configData = fs.readFileSync(geoConfigPath, 'utf-8');
      geoConfig = JSON.parse(configData);
    } catch (error) {
      console.warn('Nie można załadować geo-config.json, używam domyślnych ustawień');
    }

    this.config = {
      useGoogle: geoConfig.geocoding?.googleGeocoding?.enabled || false,
      useOSM: geoConfig.geocoding?.osmGeocoding?.enabled || true,
      googleApiKey: geoConfig.geocoding?.googleGeocoding?.apiKey,
      osmEndpoint: geoConfig.geocoding?.osmGeocoding?.endpoint || 'https://nominatim.openstreetmap.org',
      osmUserAgent: geoConfig.geocoding?.osmGeocoding?.userAgent || 'TechnikAGD/1.0',
      googleDailyLimit: geoConfig.geocoding?.googleGeocoding?.dailyLimit || 1000,
    };

    // Załaduj cache z pliku
    this.loadCacheFromFile();
  }

  static getInstance(): PostalCodeService {
    if (!PostalCodeService.instance) {
      PostalCodeService.instance = new PostalCodeService();
    }
    return PostalCodeService.instance;
  }

  /**
   * Główna metoda wyszukiwania miasta po kodzie pocztowym
   * @param postalCode - Kod pocztowy (format: "00-001" lub "00001")
   * @returns Obiekt z miastem i województwem lub null
   */
  async getCityFromPostalCode(postalCode: string): Promise<PostalCodeResult | null> {
    const cleanCode = postalCode.replace(/\s/g, '');
    
    // Walidacja formatu polskiego kodu pocztowego
    if (!/^\d{2}-?\d{3}$/.test(cleanCode)) {
      console.warn('Nieprawidłowy format kodu pocztowego:', postalCode);
      return null;
    }

    const formattedCode = cleanCode.replace(/^(\d{2})(\d{3})$/, '$1-$2');

    // Reset licznika jeśli nowy dzień
    this.resetDailyCounterIfNeeded();

    // Sprawdź cache
    if (this.cache.has(formattedCode)) {
      console.log(`🎯 Cache hit dla kodu: ${formattedCode}`);
      return this.cache.get(formattedCode)!;
    }

    // Strategia: najpierw OSM (darmowy), potem Google (płatny backup)
    let result: PostalCodeResult | null = null;

    // 1. Spróbuj OSM (jeśli włączony)
    if (this.config.useOSM) {
      console.log(`🔍 Szukam przez OSM: ${formattedCode}`);
      result = await this.tryOSM(formattedCode);
      
      if (result?.city) {
        console.log(`✅ OSM znalazł miasto: ${result.city}`);
        this.cache.set(formattedCode, result);
        this.saveCacheToFile();
        return result;
      }
    }

    // 2. Fallback do Google (jeśli OSM zawiódł i Google jest włączony)
    if (this.config.useGoogle && !result) {
      console.log(`🔍 Szukam przez Google: ${formattedCode}`);
      result = await this.tryGoogle(formattedCode);
      
      if (result?.city) {
        console.log(`✅ Google znalazł miasto: ${result.city} (Request #${this.googleRequestCount})`);
        this.cache.set(formattedCode, result);
        this.saveCacheToFile();
        return result;
      }
    }

    console.warn(`❌ Nie znaleziono miasta dla kodu: ${formattedCode}`);
    return null;
  }

  /**
   * Próba wyszukania przez OSM Nominatim (darmowy)
   */
  private async tryOSM(postalCode: string): Promise<PostalCodeResult | null> {
    // Przestrzegaj limitu 1 request/sekundę
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastOsmRequest;
    
    if (timeSinceLastRequest < this.OSM_REQUEST_DELAY) {
      const waitTime = this.OSM_REQUEST_DELAY - timeSinceLastRequest;
      console.log(`⏳ Czekam ${waitTime}ms (OSM rate limit)...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastOsmRequest = Date.now();

    try {
      const response = await axios.get(`${this.config.osmEndpoint}/search`, {
        params: {
          postalcode: postalCode,
          country: 'Poland',
          format: 'json',
          addressdetails: 1,
          limit: 1
        },
        headers: {
          'User-Agent': this.config.osmUserAgent
        },
        timeout: 5000
      });

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        const address = location.address;
        
        return {
          city: address?.city || 
                address?.town || 
                address?.village || 
                address?.municipality || '',
          voivodeship: address?.state,
          country: 'Polska'
        };
      }
    } catch (error: any) {
      console.error('OSM error:', error.message);
    }

    return null;
  }

  /**
   * Próba wyszukania przez Google Geocoding API (płatny)
   */
  private async tryGoogle(postalCode: string): Promise<PostalCodeResult | null> {
    // Sprawdź limit dzienny
    if (this.googleRequestCount >= this.config.googleDailyLimit) {
      console.warn(`⚠️ Osiągnięto dzienny limit Google API (${this.config.googleDailyLimit})`);
      return null;
    }

    if (!this.config.googleApiKey) {
      console.error('Brak klucza API Google');
      return null;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: `${postalCode}, Poland`,
            key: this.config.googleApiKey,
            language: 'pl',
            region: 'pl'
          },
          timeout: 5000
        }
      );

      this.googleRequestCount++;

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressComponents = result.address_components;

        const city = addressComponents.find((c: any) => 
          c.types.includes('locality') || c.types.includes('postal_town')
        )?.long_name || '';

        const voivodeship = addressComponents.find((c: any) => 
          c.types.includes('administrative_area_level_1')
        )?.long_name || '';

        return { city, voivodeship, country: 'Polska' };
      }

      if (response.data.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ Google API: Przekroczono limit zapytań');
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ Google API: Rate limit exceeded');
      } else {
        console.error('Google error:', error.message);
      }
    }

    return null;
  }

  /**
   * Zwraca statystyki użycia serwisu
   */
  getStats(): PostalCodeStats {
    const usagePercent = (this.googleRequestCount / this.config.googleDailyLimit) * 100;
    
    return {
      cacheSize: this.cache.size,
      googleRequests: this.googleRequestCount,
      googleLimit: this.config.googleDailyLimit,
      googleEnabled: this.config.useGoogle,
      osmEnabled: this.config.useOSM,
      googleUsagePercent: Math.round(usagePercent * 10) / 10
    };
  }

  /**
   * Resetuje licznik dzienny jeśli nowy dzień
   */
  private resetDailyCounterIfNeeded(): void {
    const currentDate = new Date().toDateString();
    
    if (currentDate !== this.lastResetDate) {
      console.log('🔄 Reset dziennego licznika Google API');
      this.googleRequestCount = 0;
      this.lastResetDate = currentDate;
    }
  }

  /**
   * Ładuje cache z pliku JSON
   */
  private loadCacheFromFile(): void {
    try {
      if (fs.existsSync(this.CACHE_FILE)) {
        const data = fs.readFileSync(this.CACHE_FILE, 'utf-8');
        const cacheData = JSON.parse(data);
        
        // Konwertuj obiekt na Map
        Object.entries(cacheData).forEach(([key, value]) => {
          this.cache.set(key, value as PostalCodeResult);
        });
        
        console.log(`📦 Załadowano ${this.cache.size} kodów pocztowych z cache`);
      }
    } catch (error) {
      console.warn('Nie można załadować cache z pliku:', error);
    }
  }

  /**
   * Zapisuje cache do pliku JSON
   */
  private saveCacheToFile(): void {
    try {
      // Upewnij się, że katalog istnieje
      const cacheDir = path.dirname(this.CACHE_FILE);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Konwertuj Map na obiekt
      const cacheObject = Object.fromEntries(this.cache);
      
      fs.writeFileSync(
        this.CACHE_FILE, 
        JSON.stringify(cacheObject, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Nie można zapisać cache do pliku:', error);
    }
  }

  /**
   * Czyści cache
   */
  clearCache(): void {
    this.cache.clear();
    
    try {
      if (fs.existsSync(this.CACHE_FILE)) {
        fs.unlinkSync(this.CACHE_FILE);
      }
    } catch (error) {
      console.error('Nie można usunąć pliku cache:', error);
    }
    
    console.log('🗑️ Cache wyczyszczony');
  }

  /**
   * Eksportuje cache jako obiekt
   */
  exportCache(): Record<string, PostalCodeResult> {
    return Object.fromEntries(this.cache);
  }

  /**
   * Importuje dane do cache
   */
  importCache(data: Record<string, PostalCodeResult>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.cache.set(key, value);
    });
    
    this.saveCacheToFile();
    console.log(`📥 Zaimportowano ${Object.keys(data).length} kodów pocztowych`);
  }
}

export default PostalCodeService;
