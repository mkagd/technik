# 🗺️ Geocoding System - Wysokiej Jakości Dekodowanie Adresów Polskich

System do bardzo dokładnego dekodowania adresów polskich na współrzędne geograficzne z inteligentnym fallback i cache.

## 🎯 Funkcjonalności

### ✨ Core Features
- **Multi-provider architecture** - Google Geocoding + OpenStreetMap Nominatim fallback
- **Wysokiej jakości** - Specjalnie zoptymalizowany dla adresów polskich
- **Inteligentna walidacja** - Automatyczna korekta błędów pisowni i normalizacja
- **Cache system** - Dual-layer cache (memory + localStorage) dla wydajności
- **Batch processing** - Przetwarzanie wielu adresów na raz z rate limiting
- **Retry logic** - Automatyczny fallback między providerami

### 🇵🇱 Specjalizacja Polska
- Rozpoznawanie polskich skrótów ulic (ul., al., pl., os.)
- Korekta błędów pisowni miast (krakow → Kraków, warszawa → Warszawa)
- Walidacja polskich kodów pocztowych (XX-XXX)
- Normalizacja polskich znaków diakrytycznych
- Prioritet dla wyników z Polski

## 📁 Struktura

```
geocoding/
├── index.js                    # Główny interfejs GeocodingService
├── providers/
│   ├── GoogleGeocodingProvider.js   # Google Maps Geocoding API
│   └── NominatimProvider.js         # OpenStreetMap Nominatim
├── utils/
│   ├── GeocodingCache.js           # System cache (memory + localStorage)
│   └── AddressValidator.js         # Walidacja polskich adresów
└── examples/
    └── usage-examples.js           # Przykłady użycia
```

## 🚀 Szybki Start

### 1. Konfiguracja

```javascript
import GeocodingService from './geocoding/index.js';

const geocoding = new GeocodingService({
  googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  region: 'pl',
  language: 'pl',
  enableCache: true,
  providers: ['google', 'nominatim'] // Google first, OSM fallback
});
```

### 2. Podstawowe geocoding

```javascript
// Dekodowanie adresu na współrzędne
const result = await geocoding.geocode('ul. Floriańska 3, 31-021 Kraków');

console.log(result);
// {
//   lat: 50.0647,
//   lng: 19.9372,
//   address: "Floriańska 3, 31-021 Kraków, Polska",
//   accuracy: "ROOFTOP",
//   confidence: 0.95,
//   provider: "google"
// }
```

### 3. Reverse geocoding

```javascript
// Współrzędne na adres
const address = await geocoding.reverseGeocode(50.0647, 19.9450);

console.log(address);
// {
//   address: "Rynek Główny 1, Kraków, Polska",
//   components: { city: "Kraków", street: "Rynek Główny", ... }
// }
```

### 4. Batch processing

```javascript
const addresses = [
  'ul. Grodzka 52, Kraków',
  'Wawel 5, Kraków', 
  'ul. Mariacka 3, Gdańsk'
];

const results = await geocoding.geocodeBatch(addresses, {
  maxConcurrent: 3,
  delayBetween: 100
});
```

## 🔧 Konfiguracja Szczegółowa

### Parametry GeocodingService

```javascript
const config = {
  // Google Maps API
  googleApiKey: 'YOUR_API_KEY',
  
  // Regionalne ustawienia
  region: 'pl',           // Priorytet dla Polski
  language: 'pl',         // Język wyników
  
  // Cache
  enableCache: true,      // Włącz cache
  cacheExpiry: 24*60*60*1000, // 24h expiry
  
  // Performance
  timeout: 5000,          // 5s timeout
  maxRetries: 2,          // Retry count
  
  // Providers
  providers: ['google', 'nominatim'] // Kolejność prób
};
```

### Zmienne środowiskowe (.env.local)

```bash
# Google Maps API Key (opcjonalne - bez tego działa tylko OSM)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

## 📊 Dokładność i Quality

### Provider Comparison

| Provider | Dokładność | Szybkość | Limit | Koszt |
|----------|------------|----------|-------|-------|
| **Google** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | API Key | Płatny |
| **Nominatim** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 1 req/s | Darmowy |

### Accuracy Levels

- **ROOFTOP** - Dokładny adres budynku (najwyższa jakość)
- **RANGE_INTERPOLATED** - Interpolacja między numerami
- **GEOMETRIC_CENTER** - Centrum obszaru
- **APPROXIMATE** - Przybliżona lokalizacja

## 🛠️ Zaawansowane Użycie

### Custom Provider Priority

```javascript
// Tylko Google (gdy masz API key i chcesz najwyższą jakość)
const geocoding = new GeocodingService({
  providers: ['google'],
  googleApiKey: 'YOUR_KEY'
});

// Tylko OSM (gdy nie masz API key lub testowanie)
const geocoding = new GeocodingService({
  providers: ['nominatim']
});
```

### Address Validation

```javascript
import { AddressValidator } from './geocoding/utils/AddressValidator.js';

const validator = new AddressValidator();
const result = validator.validateAndEnhance('ul. Florianska 3, krakow');
// {
//   original: "ul. Florianska 3, krakow",
//   enhanced: "ulica Floriańska 3, Kraków, Polska",
//   isValid: true,
//   issues: ["City corrected: krakow → Kraków"],
//   confidence: 0.85
// }
```

### Cache Management

```javascript
// Statystyki cache
const stats = geocoding.getCacheStats();
console.log(`Hit rate: ${stats.hitRate}%`);

// Wyczyść cache
geocoding.clearCache();
```

## 🔍 Przykłady Formatów Adresów

System rozpoznaje różne formaty polskich adresów:

```javascript
// ✅ Obsługiwane formaty
const examples = [
  // Pełne adresy
  'ul. Floriańska 3, 31-021 Kraków',
  'al. Jerozolimskie 65/79, 00-697 Warszawa',
  'os. Słowackiego 15/5, 30-001 Kraków',
  
  // Bez kodów pocztowych
  'ul. Grodzka 52, Kraków',
  'Rynek Główny 1, Kraków',
  
  // Tylko miasta
  'Kraków',
  'Nowy Targ',
  
  // Błędne pisownie (będą poprawione)
  'ul. Florianska 3, krakow',
  'warszawa',
  'cracow',
  
  // Różne skróty
  'ul Mickiewicza 30',  // bez kropki
  'al. Solidarności 15',
  'pl. Szczepański 3'
];
```

## ⚡ Performance Tips

### 1. Cache Optimization
```javascript
// Długi cache dla stabilnych adresów
const geocoding = new GeocodingService({
  cacheExpiry: 7 * 24 * 60 * 60 * 1000 // 7 dni
});
```

### 2. Batch Processing
```javascript
// Optymalne ustawienia dla dużych list
const results = await geocoding.geocodeBatch(addresses, {
  maxConcurrent: 3,    // Nie za dużo żeby nie hit limitów
  delayBetween: 200    // 200ms między żądaniami
});
```

### 3. Rate Limiting
```javascript
// Dla Nominatim (1 req/sec limit)
if (provider === 'nominatim') {
  await new Promise(resolve => setTimeout(resolve, 1100));
}
```

## 🚨 Error Handling

```javascript
try {
  const result = await geocoding.geocode(address);
} catch (error) {
  switch (error.message) {
    case 'Nie znaleziono adresu':
      // Adres nie istnieje
      break;
    case 'Przekroczono limit zapytań Google':
      // Google API limit
      break;
    case 'Google API key not configured':
      // Brak API key
      break;
    default:
      console.error('Geocoding error:', error);
  }
}
```

## 📈 Monitoring

```javascript
// Regularnie sprawdzaj statystyki
setInterval(() => {
  const stats = geocoding.getCacheStats();
  console.log('Geocoding stats:', {
    hitRate: stats.hitRate,
    totalRequests: stats.totalRequests,
    cacheSize: stats.memorySize + stats.storageSize
  });
}, 60000); // co minutę
```

## 🔐 Security

- **API Keys**: Przechowuj Google API key w zmiennych środowiskowych
- **Rate Limiting**: System automatycznie przestrzega limitów providers
- **Cache**: Cache jest local-only (localStorage + memory)

## 🤝 Contributing

1. Testuj z różnymi formatami polskich adresów
2. Dodawaj nowe provider jeśli potrzebne
3. Rozwijaj walidację dla edge cases
4. Optymalizuj performance i cache

## 📝 License

MIT License - Zobacz szczegóły w pliku głównym projektu.

---

**💡 Tip**: Dla najlepszych wyników ustaw Google API Key, ale system będzie działał także bez niego używając tylko OpenStreetMap.