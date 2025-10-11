// utils/geo/geoConfig.js
// Centralna konfiguracja dla geokodowania, map i distance matrix

import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'config', 'geo-config.json');

// Domyślna konfiguracja
const DEFAULT_CONFIG = {
  version: '1.0.0',
  lastUpdated: null,
  
  // 🌍 GEOCODING
  geocoding: {
    provider: 'hybrid', // google | osm | cache-first | hybrid
    mode: 'nightly', // on-demand | on-create | background | nightly
    cacheEnabled: true,
    cacheTTL: 30, // dni
    fallbackProvider: 'osm',
    
    // Google Geocoding
    googleGeocoding: {
      enabled: true,
      apiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      requestDelay: 200, // ms między requestami
      batchSize: 100,
      dailyLimit: 1000
    },
    
    // OSM/Nominatim
    osmGeocoding: {
      enabled: true,
      endpoint: 'https://nominatim.openstreetmap.org',
      userAgent: 'TechnikAGD/1.0',
      requestDelay: 1000, // Nominatim wymaga 1s
    }
  },
  
  // 🗺️ DISTANCE MATRIX
  distanceMatrix: {
    provider: 'osrm', // osrm | google | haversine | hybrid
    cacheEnabled: true,
    cacheTTL: 7, // dni
    fallbackProvider: 'haversine',
    
    // OSRM (Open Source Routing Machine)
    osrm: {
      enabled: true,
      endpoint: 'https://router.project-osrm.org',
      profile: 'car', // car | bike | foot
      maxRetries: 3,
      timeout: 5000
    },
    
    // Google Distance Matrix
    googleMatrix: {
      enabled: false, // Wyłączone domyślnie (kosztowne!)
      apiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      mode: 'driving', // driving | walking | bicycling | transit
      units: 'metric',
      avoid: [], // tolls | highways | ferries
      requestDelay: 100,
      batchSize: 25,
      dailyLimit: 500
    },
    
    // Haversine (fallback - darmowy)
    haversine: {
      enabled: true,
      cityMultiplier: 1.3, // drogi w mieście są ~30% dłuższe
      intercityMultiplier: 1.5,
      avgSpeedCity: 40, // km/h
      avgSpeedIntercity: 80
    }
  },
  
  // 🗺️ MAPS DISPLAY
  mapsDisplay: {
    provider: 'google', // google | osm | mapbox
    defaultZoom: 13,
    
    // Google Maps
    googleMaps: {
      enabled: true,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      mapType: 'roadmap', // roadmap | satellite | hybrid | terrain
      features: {
        streetView: true,
        traffic: true,
        transit: false,
        bicycling: false
      }
    },
    
    // OpenStreetMap / Leaflet
    osmMaps: {
      enabled: true,
      tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: true
    }
  },
  
  // ⚡ PERFORMANCE & CACHE
  performance: {
    cacheStrategy: 'aggressive', // aggressive | moderate | minimal
    preloadCommonRoutes: true,
    
    // Redis cache (opcjonalnie)
    redis: {
      enabled: false,
      host: 'localhost',
      port: 6379,
      ttl: 86400 // 24h w sekundach
    },
    
    // File cache (domyślnie)
    fileCache: {
      enabled: true,
      directory: './cache/geo',
      maxSize: 100 // MB
    }
  },
  
  // 🕐 BACKGROUND JOBS
  backgroundJobs: {
    enabled: true,
    
    // Geokodowanie w tle
    geocodingJob: {
      enabled: true,
      schedule: 'nightly', // nightly | hourly | disabled
      time: '02:00', // Godzina startu (dla nightly)
      batchSize: 50,
      prioritizeNew: true
    },
    
    // Odświeżanie cache
    cacheRefresh: {
      enabled: true,
      schedule: 'weekly',
      dayOfWeek: 0, // Niedziela
      time: '03:00'
    }
  },
  
  // 💰 COST OPTIMIZATION
  costOptimization: {
    // Monitoring kosztów
    monitoring: {
      enabled: true,
      alertThreshold: 100, // zł/miesiąc
      emailAlerts: true
    },
    
    // Limity API
    apiLimits: {
      dailyGoogleGeocoding: 100,
      dailyGoogleMatrix: 50,
      monthlyBudget: 200 // zł
    },
    
    // Strategie oszczędzania
    strategies: {
      preferFreeProviders: true,
      aggressiveCaching: true,
      batchRequests: true,
      avoidPeakHours: true
    }
  }
};

/**
 * Załaduj konfigurację z pliku
 */
export function loadGeoConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      
      // Merge z defaultami (na wypadek nowych pól)
      return deepMerge(DEFAULT_CONFIG, config);
    }
  } catch (error) {
    console.error('❌ Błąd ładowania geo config:', error.message);
  }
  
  // Zwróć domyślną konfigurację
  return { ...DEFAULT_CONFIG };
}

/**
 * Zapisz konfigurację do pliku
 */
export function saveGeoConfig(config) {
  try {
    // Upewnij się że katalog istnieje
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Dodaj timestamp
    config.lastUpdated = new Date().toISOString();
    
    // Zapisz do pliku
    const json = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_FILE, json, 'utf8');
    
    console.log('✅ Geo config zapisany:', CONFIG_FILE);
    return { success: true };
  } catch (error) {
    console.error('❌ Błąd zapisu geo config:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Deep merge obiektów
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Pobierz aktywny provider dla distance matrix
 */
export function getActiveDistanceMatrixProvider(config = null) {
  const cfg = config || loadGeoConfig();
  return cfg.distanceMatrix.provider;
}

/**
 * Pobierz aktywny provider dla geokodowania
 */
export function getActiveGeocodingProvider(config = null) {
  const cfg = config || loadGeoConfig();
  return cfg.geocoding.provider;
}

/**
 * Sprawdź czy provider jest włączony
 */
export function isProviderEnabled(type, provider, config = null) {
  const cfg = config || loadGeoConfig();
  
  if (type === 'geocoding') {
    if (provider === 'google') return cfg.geocoding.googleGeocoding.enabled;
    if (provider === 'osm') return cfg.geocoding.osmGeocoding.enabled;
  }
  
  if (type === 'distanceMatrix') {
    if (provider === 'google') return cfg.distanceMatrix.googleMatrix.enabled;
    if (provider === 'osrm') return cfg.distanceMatrix.osrm.enabled;
    if (provider === 'haversine') return cfg.distanceMatrix.haversine.enabled;
  }
  
  return false;
}

/**
 * Pobierz endpoint dla providera
 */
export function getProviderEndpoint(type, provider, config = null) {
  const cfg = config || loadGeoConfig();
  
  if (type === 'geocoding') {
    if (provider === 'osm') return cfg.geocoding.osmGeocoding.endpoint;
  }
  
  if (type === 'distanceMatrix') {
    if (provider === 'osrm') return cfg.distanceMatrix.osrm.endpoint;
  }
  
  return null;
}

export default {
  loadGeoConfig,
  saveGeoConfig,
  getActiveDistanceMatrixProvider,
  getActiveGeocodingProvider,
  isProviderEnabled,
  getProviderEndpoint,
  DEFAULT_CONFIG
};
