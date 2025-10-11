# System Geolokalizacji i Map - Dokumentacja Techniczna

## 📋 Spis Treści

1. [Przegląd Systemu](#przegląd-systemu)
2. [Architektura](#architektura)
3. [Dostawcy (Providers)](#dostawcy-providers)
4. [Konfiguracja](#konfiguracja)
5. [API Endpoints](#api-endpoints)
6. [Panel Administracyjny](#panel-administracyjny)
7. [Instalacja i Migracja](#instalacja-i-migracja)
8. [Optymalizacja Kosztów](#optymalizacja-kosztów)

---

## 🎯 Przegląd Systemu

System geolokalizacji zapewnia:
- **Geokodowanie adresów** (adres → współrzędne GPS)
- **Obliczanie odległości** (distance matrix między punktami)
- **Wybór dostawców** (Google, OSM, OSRM, Haversine)
- **Zarządzanie kosztami** (limity dzienne, budżet miesięczny)
- **Cache i optymalizację** (minimalizacja kosztownych API calls)
- **Background jobs** (nocne geokodowanie wsadowe)

### Kluczowe Funkcje

✅ **3 providery Distance Matrix:**
- OSRM (OpenStreetMap) - darmowy, dokładny routing
- Google Distance Matrix - najbardziej dokładny, płatny
- Haversine - matematyczny, natychmiastowy, darmowy

✅ **2 providery Geocoding:**
- Google Geocoding API - najwyższa jakość, $5/1000 req
- OSM Nominatim - darmowy, limit 1 req/sek

✅ **Inteligentny fallback:**
- Automatyczne przełączanie przy błędach
- Respektowanie limitów dziennych
- Preferowanie darmowych providerów

✅ **Cache system:**
- Automatyczne cachowanie wyników
- Konfigurowalny TTL (czas ważności)
- Minimalizacja powtarzających się zapytań

---

## 🏗️ Architektura

```
📁 System Geolokalizacji
│
├── 📁 utils/geo/
│   └── geoConfig.js              # Centralna konfiguracja
│
├── 📁 distance-matrix/
│   ├── providerManager.js        # Manager wyboru providerów
│   └── providers/
│       ├── OSRMProvider.js       # Routing OpenStreetMap
│       ├── HaversineProvider.js  # Matematyczne obliczenia
│       └── GoogleDistanceMatrixProvider.js
│
├── 📁 pages/api/
│   ├── distance-matrix/
│   │   └── calculate.js          # Endpoint obliczeń odległości
│   └── admin/
│       ├── settings/
│       │   └── maps-geo.js       # GET/POST konfiguracji
│       ├── stats/
│       │   └── geo-usage.js      # Statystyki użycia
│       └── test-geo-connection.js # Test połączeń
│
├── 📁 pages/admin/settings/
│   └── maps-geo.js               # Panel administracyjny (UI)
│
├── 📁 data/config/
│   ├── geo-config.json           # Główna konfiguracja
│   ├── geo-stats.json            # Statystyki użycia API
│   └── distance-cache.json       # Cache odległości
│
└── 📁 scripts/
    └── add-coordinates-to-data.js # Migracja: dodaj coordinates
```

---

## 🌐 Dostawcy (Providers)

### 1. OSRM Provider (Zalecany dla Distance Matrix)

**Endpoint:** `https://router.project-osrm.org/route/v1/car/{coords}`

**Zalety:**
- ✅ Całkowicie darmowy
- ✅ Brak limitów zapytań (demo server)
- ✅ Dokładne routing po rzeczywistych drogach
- ✅ Retry logic i timeout protection

**Wady:**
- ⚠️ Demo server może być wolny w godzinach szczytu
- ⚠️ Wymaga formatu `lng,lat` (odwrotnie niż Google!)

**Użycie:**
```javascript
import OSRMProvider from './distance-matrix/providers/OSRMProvider';

const osrm = new OSRMProvider({ 
  endpoint: 'router.project-osrm.org' 
});

const result = await osrm.calculateSingleDistance(
  { lat: 50.0647, lng: 19.9450 }, // Kraków
  { lat: 52.2297, lng: 21.0122 }  // Warszawa
);
```

**Odpowiedź:**
```json
{
  "distance": {
    "value": 293000,
    "km": 293.0,
    "text": "293 km"
  },
  "duration": {
    "value": 10800,
    "minutes": 180,
    "text": "3 godz. 0 min"
  },
  "status": "OK",
  "provider": "osrm"
}
```

### 2. Haversine Provider (Fallback)

**Algorytm:** Wzór Haversine (odległość kuli ziemskiej)

**Zalety:**
- ✅ Natychmiastowy (<1ms)
- ✅ Całkowicie darmowy
- ✅ Brak wywołań sieciowych
- ✅ Zawsze dostępny

**Wady:**
- ⚠️ Przybliżony (±20-30% rzeczywistej drogi)
- ⚠️ Nie uwzględnia barier (rzek, gór)

**Mnożniki:**
- Miasto (<15km): 1.3x linii prostej
- Międzymiastowy (>15km): 1.5x linii prostej

**Użycie:**
```javascript
import HaversineProvider from './distance-matrix/providers/HaversineProvider';

const haversine = new HaversineProvider({ 
  cityMultiplier: 1.3,
  intercityMultiplier: 1.5 
});

const result = await haversine.calculateSingleDistance(
  { lat: 50.0647, lng: 19.9450 },
  { lat: 50.0700, lng: 19.9500 }
);
```

**Metadane:**
```json
{
  "metadata": {
    "straightDistance": 0.75,
    "multiplier": 1.3,
    "isCity": true
  }
}
```

### 3. Google Distance Matrix (Najdokładniejszy)

**Endpoint:** `https://maps.googleapis.com/maps/api/distancematrix/json`

**Zalety:**
- ✅ Najwyższa dokładność
- ✅ Rzeczywisty traffic data (opcjonalnie)
- ✅ Globalne pokrycie

**Wady:**
- 💰 $5 za 1000 zapytań
- ⚠️ Wymaga klucza API
- ⚠️ Limity dzienne i miesięczne

**Cennik:**
- 0-100,000 req/miesiąc: $5 za 1000
- 100,001+ req/miesiąc: $4 za 1000

### 4. Google Geocoding API

**Endpoint:** `https://maps.googleapis.com/maps/api/geocode/json`

**Zastosowanie:** Konwersja adresu → współrzędne GPS

**Cennik:** $5 za 1000 zapytań

### 5. OSM Nominatim (Darmowe Geocoding)

**Endpoint:** `https://nominatim.openstreetmap.org/search`

**Limity:**
- 1 zapytanie/sekundę
- Wymagany User-Agent header
- Brak klucza API

**Zastosowanie:** Darmowe geokodowanie z opóźnieniem 1s między zapytaniami

---

## ⚙️ Konfiguracja

### Struktura Konfiguracji

Plik: `data/config/geo-config.json`

```json
{
  "geocoding": {
    "provider": "hybrid",           // google | osm | hybrid
    "mode": "nightly",              // immediate | on-demand | nightly
    "cacheEnabled": true,
    "cacheTTL": 30,                 // dni
    "googleGeocoding": {
      "enabled": true,
      "apiKey": null,               // null = z .env.local
      "dailyLimit": 1000
    },
    "osmGeocoding": {
      "enabled": true,
      "requestDelay": 1000          // ms
    }
  },
  "distanceMatrix": {
    "provider": "osrm",             // osrm | google | haversine
    "cacheEnabled": true,
    "cacheTTL": 30,
    "osrm": {
      "enabled": true,
      "endpoint": "router.project-osrm.org",
      "maxRetries": 3,
      "timeout": 5000
    },
    "googleMatrix": {
      "enabled": false,
      "apiKey": null,
      "dailyLimit": 500
    },
    "haversine": {
      "enabled": true,
      "cityMultiplier": 1.3,
      "intercityMultiplier": 1.5
    }
  },
  "backgroundJobs": {
    "enabled": false,
    "scheduleHour": 3,              // 03:00
    "batchSize": 100,
    "onlyMissing": true             // tylko brakujące coords
  },
  "costOptimization": {
    "apiLimits": {
      "dailyGoogleGeocoding": 100,
      "dailyGoogleMatrix": 50,
      "monthlyBudget": 200          // zł
    },
    "strategies": {
      "preferFreeProviders": true,
      "aggressiveCaching": true
    }
  }
}
```

### Zmienne Środowiskowe

Plik: `.env.local`

```bash
# Google Maps API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo
GOOGLE_MAPS_API_KEY=AIzaSyDuTTA-1AtXyeHd6r-uu8CFWT6UUpxGByo
```

**UWAGA:** Upewnij się, że klucze są w **jednej linii** bez literalnych `\n`!

---

## 🔌 API Endpoints

### 1. Oblicz Odległość

**Endpoint:** `POST /api/distance-matrix/calculate`

**Request (pojedyncza odległość):**
```json
{
  "origin": { "lat": 50.0647, "lng": 19.9450 },
  "destination": { "lat": 52.2297, "lng": 21.0122 }
}
```

**Request (macierz):**
```json
{
  "origins": [
    { "lat": 50.0647, "lng": 19.9450 },
    { "lat": 51.1079, "lng": 17.0385 }
  ],
  "destinations": [
    { "lat": 52.2297, "lng": 21.0122 },
    { "lat": 54.3520, "lng": 18.6466 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "distance": { "value": 293000, "km": 293.0, "text": "293 km" },
    "duration": { "value": 10800, "minutes": 180, "text": "3 godz. 0 min" },
    "status": "OK",
    "provider": "osrm",
    "timestamp": "2025-01-15T14:30:00.000Z",
    "fromCache": false
  }
}
```

### 2. Zarządzaj Konfiguracją

**GET:** `/api/admin/settings/maps-geo`
```json
{
  "success": true,
  "config": { /* pełna konfiguracja */ }
}
```

**POST:** `/api/admin/settings/maps-geo`
```json
{
  "config": { /* zaktualizowana konfiguracja */ }
}
```

### 3. Testuj Połączenie

**POST:** `/api/admin/test-geo-connection`
```json
{
  "provider": "osrm",
  "config": { /* opcjonalna konfiguracja */ }
}
```

**Response:**
```json
{
  "success": true,
  "provider": "osrm",
  "responseTime": 450,
  "message": "✅ OSRM test passed: Kraków → Dworzec 5.2 km"
}
```

### 4. Statystyki Użycia

**GET:** `/api/admin/stats/geo-usage`
```json
{
  "success": true,
  "stats": {
    "todayGeocoding": 45,
    "todayMatrix": 120,
    "todayCache": 78,
    "cacheHitRate": 39,
    "monthlyCost": 85
  }
}
```

---

## 🎨 Panel Administracyjny

### URL
`http://localhost:3000/admin/settings/maps-geo`

### Sekcje Panelu

#### 1. **Statystyki (Dashboard)**
- Geokodowanie dziś
- Distance Matrix dziś
- Cache Hit Rate
- Szacunkowy koszt miesięczny

#### 2. **Ustawienia Geokodowania**
- Wybór providera: Google / OSM / Hybrid
- Tryb: Od razu / Na żądanie / Nocne zadania
- Cache: Włącz/wyłącz, TTL
- Klucze API i limity dzienne

#### 3. **Ustawienia Distance Matrix**
- Wybór providera: OSRM / Google / Haversine
- Konfiguracja OSRM (endpoint, retry, timeout)
- Konfiguracja Google (klucz, limit)
- Konfiguracja Haversine (mnożniki)
- Test połączenia dla każdego providera

#### 4. **Zadania w Tle**
- Włącz/wyłącz background jobs
- Godzina startu (np. 03:00)
- Wielkość batcha
- Tylko brakujące coords

#### 5. **Optymalizacja Kosztów**
- Dzienny limit Google Geocoding
- Dzienny limit Google Matrix
- Miesięczny budżet
- Preferuj darmowe API
- Agresywny caching

### Funkcje Panelu

✅ **Zapis konfiguracji** - Wszystkie zmiany zapisywane do `geo-config.json`
✅ **Test połączeń** - Sprawdź każdego providera przed użyciem
✅ **Live statystyki** - Aktualne użycie API
✅ **Ostrzeżenia** - Powiadomienia o przekroczeniu limitów

---

## 🚀 Instalacja i Migracja

### Krok 1: Migracja Danych

Dodaj pole `coordinates` do istniejących klientów i zleceń:

```bash
node scripts/add-coordinates-to-data.js
```

**Co robi skrypt:**
1. Tworzy backup: `data/backups/clients.json.TIMESTAMP.backup`
2. Dodaje do każdego klienta:
   ```json
   {
     "coordinates": null,
     "geocodingMeta": {
       "status": "pending",
       "provider": null,
       "lastAttempt": null,
       "error": null
     }
   }
   ```
3. Pokazuje statystyki

**Przykładowy output:**
```
✅ Backup utworzony: data/backups/clients.json.2025-01-15T14-30-00.backup
✅ Dodano pole coordinates do 150 klientów

📊 Statystyki danych:
📍 Klienci (150 total):
  ✅ Z koordynatami: 0
  ⏳ Do geokodowania: 150
  ❌ Błędy geokodowania: 0
```

### Krok 2: Konfiguracja Panelu

1. Otwórz: `http://localhost:3000/admin/settings/maps-geo`
2. Ustaw **Distance Matrix Provider: OSRM** (zalecane)
3. Ustaw **Geocoding Provider: OSM** lub **Hybrid**
4. Ustaw **Tryb geokodowania: Nocne zadania**
5. Włącz **Background Jobs**
6. Ustaw godzinę: **03:00** (noc)
7. Kliknij **"💾 Zapisz Konfigurację"**

### Krok 3: Test Połączeń

W panelu admin:
1. Sekcja OSRM → kliknij **"Test Połączenia"**
2. Sekcja OSM → kliknij **"Test Połączenia"**
3. Sprawdź czy wszystkie testy przeszły (zielone ✅)

### Krok 4: Restart Dev Server

```bash
# Zatrzymaj serwer
Ctrl+C

# Uruchom ponownie
npm run dev
```

---

## 💰 Optymalizacja Kosztów

### Strategia 1: "Darmowa" (Zalecana)

**Konfiguracja:**
- Distance Matrix: **OSRM**
- Geocoding: **OSM Nominatim**
- Tryb: **Nocne zadania wsadowe**
- Prefer Free Providers: **✅**

**Koszt:** ~0 zł/miesiąc

**Ograniczenia:**
- Nominatim: 1 req/sek (86,400 req/dzień)
- OSRM demo: może być wolny w szczycie

### Strategia 2: "Hybrydowa" (Zrównoważona)

**Konfiguracja:**
- Distance Matrix: **OSRM** (primary)
- Geocoding: **Hybrid** (OSM → Google)
- Tryb: **Nocne zadania**
- Dzienny limit Google: **100 req/dzień**

**Koszt:** ~15 zł/miesiąc

**Użycie:**
- 95% zapytań: OSRM + OSM (darmowe)
- 5% zapytań: Google (trudne adresy)

### Strategia 3: "Premium" (Najlepsza jakość)

**Konfiguracja:**
- Distance Matrix: **Google**
- Geocoding: **Google**
- Cache: **Agresywny**

**Koszt:** ~150-300 zł/miesiąc

**Zalety:**
- Najwyższa dokładność
- Real-time traffic
- Globalne pokrycie

### Redukcja Kosztów

#### 1. Cache (90% redukcji)
```json
{
  "cacheEnabled": true,
  "cacheTTL": 30,
  "aggressiveCaching": true
}
```

#### 2. Limity Dzienne
```json
{
  "dailyGoogleGeocoding": 100,  // max 100/dzień
  "dailyGoogleMatrix": 50       // max 50/dzień
}
```

#### 3. Background Jobs
```json
{
  "mode": "nightly",            // nie geokoduj od razu
  "scheduleHour": 3,            // geokoduj w nocy
  "batchSize": 100              // porcjami po 100
}
```

#### 4. Automatic Fallback
```json
{
  "preferFreeProviders": true   // użyj Google tylko jeśli OSM fail
}
```

---

## 📊 Monitoring

### Dashboard Stats

Panel pokazuje w czasie rzeczywistym:
- **Geocoding (dziś):** Liczba zapytań
- **Distance Matrix (dziś):** Liczba obliczeń
- **Cache Hit Rate:** % trafień w cache
- **Koszt miesięczny:** Szacunek na podstawie użycia

### Alerty

System automatycznie ostrzega gdy:
- ⚠️ Dzienny limit Google przekroczony
- ⚠️ Miesięczny budżet przekroczony o 80%
- ⚠️ Provider nie odpowiada (failover aktywny)
- ⚠️ Cache rozmiar > 100MB

### Logi

Wszystkie operacje logowane w konsoli:
```
✅ OSRM: Calculated Kraków → Warszawa: 293 km
⚠️ Google Matrix limit exceeded, falling back to OSRM
❌ OSM Nominatim failed: Rate limit, using cache
🔄 Trying fallback: haversine
```

---

## 🐛 Troubleshooting

### Problem: 500 Error na `/api/distance-matrix`

**Przyczyna:** Błędny format API key w `.env.local`

**Rozwiązanie:**
1. Otwórz `.env.local`
2. Upewnij się że klucz jest w **jednej linii**
3. Usuń literalne `\n` znaki
4. Restart dev server

### Problem: OSRM timeout

**Przyczyna:** Demo server przeciążony

**Rozwiązanie:**
1. Zwiększ timeout w config: `"timeout": 10000`
2. Lub użyj własnego OSRM server: `localhost:5000`
3. Lub przełącz na Haversine jako fallback

### Problem: OSM Nominatim rate limit

**Przyczyna:** Za dużo zapytań (>1/sek)

**Rozwiązanie:**
1. Zwiększ delay: `"requestDelay": 2000`
2. Włącz background jobs (nocne geokodowanie)
3. Użyj Google jako fallback

### Problem: Brak statystyk

**Przyczyna:** Brak pliku `geo-stats.json`

**Rozwiązanie:**
1. Wykonaj pierwsze zapytanie API
2. Plik zostanie utworzony automatycznie
3. Odśwież panel admin

---

## 📚 Przykłady Użycia

### Frontend: Oblicz odległość

```javascript
// pages/wizyta/[id].js

async function calculateDistance(clientAddress) {
  const response = await fetch('/api/distance-matrix/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 50.0647, lng: 19.9450 }, // biuro
      destination: clientAddress.coordinates
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log(`Odległość: ${data.result.distance.km} km`);
    console.log(`Czas: ${data.result.duration.minutes} min`);
    console.log(`Provider: ${data.result.provider}`);
  }
}
```

### Backend: Geokoduj adres

```javascript
// utils/geocoding/geocodeAddress.js

import { loadGeoConfig } from '../geo/geoConfig.js';

export async function geocodeAddress(address) {
  const config = loadGeoConfig();
  
  // Użyj providera z konfiguracji
  const provider = config.geocoding.provider;
  
  // ... logika geokodowania
  
  return {
    lat: 50.0647,
    lng: 19.9450,
    provider: 'osm'
  };
}
```

---

## 🔐 Bezpieczeństwo

### API Keys
- ✅ Nigdy nie commituj `.env.local`
- ✅ Użyj restricted API keys w Google Cloud
- ✅ Limit API keys do konkretnych domen
- ✅ Monitoruj użycie w Google Cloud Console

### Rate Limiting
- ✅ Implementuj server-side rate limiting
- ✅ Cache agresywnie aby minimalizować zapytania
- ✅ Użyj background jobs dla batch processing

---

## 📝 Changelog

### v1.0.0 (2025-01-15)

**Dodane:**
- ✅ OSRM Provider (darmowy routing)
- ✅ Haversine Provider (matematyczny fallback)
- ✅ Panel administracyjny (`/admin/settings/maps-geo`)
- ✅ System konfiguracji (`geo-config.json`)
- ✅ Cache system dla odległości
- ✅ Statystyki użycia API
- ✅ Test połączeń dla każdego providera
- ✅ Automatyczny fallback przy błędach
- ✅ Limity dzienne i miesięczne
- ✅ Skrypt migracji danych

**Naprawione:**
- 🐛 Błędny format API key w `.env.local` (literalne `\n`)
- 🐛 500 errors na `/api/distance-matrix`

---

## 🤝 Wsparcie

Problemy? Pytania?

1. Sprawdź [Troubleshooting](#troubleshooting)
2. Przejrzyj logi w konsoli
3. Sprawdź test połączeń w panelu admin
4. Sprawdź statystyki użycia

---

**Utworzono:** 2025-01-15  
**Wersja:** 1.0.0  
**Status:** ✅ Produkcyjny (Backend Complete, UI Complete)
