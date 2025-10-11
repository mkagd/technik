/**
 * Typy dla serwisu kodów pocztowych
 * @module lib/postal-code/types
 */

export interface PostalCodeResult {
  /** Nazwa miasta */
  city: string;
  /** Województwo (opcjonalne) */
  voivodeship?: string;
  /** Kod kraju */
  country: string;
}

export interface PostalCodeServiceConfig {
  /** Czy używać Google Geocoding API */
  useGoogle: boolean;
  /** Czy używać OSM Nominatim */
  useOSM: boolean;
  /** Klucz API Google */
  googleApiKey?: string;
  /** Endpoint OSM */
  osmEndpoint: string;
  /** User-Agent dla OSM */
  osmUserAgent: string;
  /** Dzienny limit requestów Google */
  googleDailyLimit: number;
}

export interface PostalCodeStats {
  /** Rozmiar cache */
  cacheSize: number;
  /** Liczba requestów Google dzisiaj */
  googleRequests: number;
  /** Limit dzienny Google */
  googleLimit: number;
  /** Czy Google jest włączony */
  googleEnabled: boolean;
  /** Czy OSM jest włączony */
  osmEnabled: boolean;
  /** Procent wykorzystania limitu Google */
  googleUsagePercent: number;
}

export interface PostalCodeProvider {
  name: 'osm' | 'google';
  enabled: boolean;
  cost: 'free' | 'paid';
}
