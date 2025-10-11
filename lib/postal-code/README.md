# 📮 Postal Code Service

Uniwersalny serwis do automatycznego wyszukiwania miast po kodzie pocztowym.

## 🎯 Funkcje

- ✅ **Hybrydowe podejście**: OSM (darmowy) → Google API (płatny backup)
- ✅ **Cache persistent**: Zapisuje wyniki do pliku, aby przetrwały restart
- ✅ **Rate limiting**: Automatyczne opóźnienia dla OSM (1 req/s)
- ✅ **Limity dzienne**: Monitorowanie użycia Google API
- ✅ **React Hook**: Łatwa integracja z komponentami React
- ✅ **TypeScript Support**: Pełne wsparcie typów

## 📦 Instalacja

Moduł jest już zainstalowany w `lib/postal-code/`.

## 🚀 Szybki start

### Backend (API Route)

```javascript
// pages/api/postal-code.js
import { PostalCodeService } from '@/lib/postal-code/service.ts';

export default async function handler(req, res) {
  const { postalCode } = req.query;
  
  try {
    const service = PostalCodeService.getInstance();
    const result = await service.getCityFromPostalCode(postalCode);
    
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: 'Nie znaleziono miasta' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Frontend (React Hook)

```javascript
// pages/rezerwacja.js
import { usePostalCode } from '@/lib/postal-code/usePostalCode';
import { useState } from 'react';

export default function Rezerwacja() {
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  const { getCityFromPostalCode, isLoading, error } = usePostalCode();

  const handlePostalCodeChange = async (e) => {
    const value = e.target.value;
    setPostalCode(value);

    // Sprawdź czy kod jest kompletny (format: 12-345 lub 12345)
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      const result = await getCityFromPostalCode(value);
      
      if (result && result.city) {
        setCity(result.city);
      }
    }
  };

  return (
    <div>
      <div className="form-group">
        <label>Kod pocztowy</label>
        <input
          type="text"
          value={postalCode}
          onChange={handlePostalCodeChange}
          placeholder="00-000"
          maxLength={6}
        />
        {isLoading && <span className="loading">🔍 Szukam miasta...</span>}
        {error && <span className="error">{error}</span>}
      </div>

      <div className="form-group">
        <label>Miasto</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Będzie uzupełnione automatycznie"
        />
      </div>
    </div>
  );
}
```

### Z Debounce (zalecane)

```javascript
import { usePostalCode } from '@/lib/postal-code/usePostalCode';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

export default function Rezerwacja() {
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  const { getCityFromPostalCode, isLoading } = usePostalCode();

  // Debounce wyszukiwania (czeka 500ms po przestaniu pisać)
  const debouncedLookup = useCallback(
    debounce(async (code) => {
      const result = await getCityFromPostalCode(code);
      if (result?.city) {
        setCity(result.city);
      }
    }, 500),
    []
  );

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    setPostalCode(value);
    
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      debouncedLookup(value);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={postalCode}
        onChange={handlePostalCodeChange}
        placeholder="00-000"
      />
      {isLoading && <span>⏳</span>}
      
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
    </div>
  );
}
```

## 📊 Statystyki użycia

```javascript
import { usePostalCode } from '@/lib/postal-code/usePostalCode';

function AdminPanel() {
  const { stats } = usePostalCode();

  return (
    <div className="stats-panel">
      <h3>Statystyki Geocoding</h3>
      <ul>
        <li>Cache: {stats.cacheSize} kodów</li>
        <li>Google API dzisiaj: {stats.googleRequests} / {stats.googleLimit}</li>
        <li>Wykorzystanie: {stats.googleUsagePercent}%</li>
        <li>OSM: {stats.osmEnabled ? '✅' : '❌'}</li>
        <li>Google: {stats.googleEnabled ? '✅' : '❌'}</li>
      </ul>
      
      {stats.googleUsagePercent > 80 && (
        <div className="alert">
          ⚠️ Zbliżasz się do dziennego limitu Google API!
        </div>
      )}
    </div>
  );
}
```

## ⚙️ Konfiguracja

Konfiguracja jest automatycznie ładowana z `data/config/geo-config.json`:

```json
{
  "geocoding": {
    "provider": "osm",
    "osmGeocoding": {
      "enabled": true,
      "endpoint": "https://nominatim.openstreetmap.org",
      "userAgent": "TechnikAGD/1.0",
      "requestDelay": 1000
    },
    "googleGeocoding": {
      "enabled": true,
      "apiKey": "YOUR_GOOGLE_API_KEY",
      "dailyLimit": 1000
    }
  }
}
```

## 🔄 Strategia działania

1. **Sprawdzenie cache** - jeśli kod był już sprawdzany, zwróć z pamięci (natychmiast)
2. **OSM Nominatim** - spróbuj darmowego API (1s opóźnienie między requestami)
3. **Google Geocoding** - jeśli OSM zawiódł, użyj Google (płatne, ale szybkie)
4. **Zapisz do cache** - zapisz wynik do pliku `data/cache/postal-codes.json`

## 💰 Koszty

### OSM Nominatim
- ✅ **100% DARMOWY**
- ⚠️ Wymaga 1s między requestami
- ⚠️ Czasem brak danych dla małych miejscowości

### Google Geocoding API
- 💰 **$200 kredytów/miesiąc** (gratis)
- 📊 ~**40,000 requestów/miesiąc** za darmo
- 💵 Potem: $5 za 1000 requestów

### Twoje ustawienia
- Dzienny limit Google: **1000 requestów**
- Cache persistent: **TAK**
- Strategia: **Najpierw OSM, potem Google**

Przy tej strategii **99% requestów** będzie przez OSM (darmowy), a Google tylko jako backup.

## 📂 Cache

Cache jest zapisywany w `data/cache/postal-codes.json`:

```json
{
  "00-001": {
    "city": "Warszawa",
    "voivodeship": "mazowieckie",
    "country": "Polska"
  },
  "30-001": {
    "city": "Kraków",
    "voivodeship": "małopolskie",
    "country": "Polska"
  }
}
```

### Operacje na cache

```javascript
import { PostalCodeService } from '@/lib/postal-code/service.ts';

const service = PostalCodeService.getInstance();

// Wyczyść cache
service.clearCache();

// Eksportuj cache
const cacheData = service.exportCache();
console.log(cacheData);

// Importuj dane
service.importCache({
  "00-001": { city: "Warszawa", country: "Polska" },
  "30-001": { city: "Kraków", country: "Polska" }
});

// Statystyki
const stats = service.getStats();
console.log(`Cache size: ${stats.cacheSize}`);
```

## 🧪 Testowanie

```javascript
// test-postal-code.js
import { PostalCodeService } from './lib/postal-code/service.ts';

async function test() {
  const service = PostalCodeService.getInstance();
  
  console.log('Test 1: Warszawa');
  const result1 = await service.getCityFromPostalCode('00-001');
  console.log(result1); // { city: "Warszawa", voivodeship: "mazowieckie", country: "Polska" }
  
  console.log('\nTest 2: Kraków');
  const result2 = await service.getCityFromPostalCode('30-001');
  console.log(result2);
  
  console.log('\nStatystyki:');
  console.log(service.getStats());
}

test();
```

Uruchom:
```bash
node test-postal-code.js
```

## 🐛 Debugowanie

Serwis loguje wszystkie operacje do konsoli:

- `🎯 Cache hit` - znaleziono w cache
- `🔍 Szukam przez OSM` - próba przez OSM
- `✅ OSM znalazł miasto` - sukces OSM
- `🔍 Szukam przez Google` - próba przez Google
- `✅ Google znalazł miasto` - sukces Google
- `❌ Nie znaleziono miasta` - nie znaleziono w żadnym źródle
- `⚠️ Osiągnięto limit` - przekroczono dzienny limit Google

## 📝 API Reference

### PostalCodeService

#### `getInstance()`
Zwraca singleton instancję serwisu.

#### `getCityFromPostalCode(postalCode: string)`
Wyszukuje miasto po kodzie pocztowym.
- **Parametry**: `postalCode` - kod pocztowy (format: "00-001" lub "00001")
- **Zwraca**: `Promise<{city, voivodeship, country} | null>`

#### `getStats()`
Zwraca statystyki użycia.
- **Zwraca**: Obiekt ze statystykami

#### `clearCache()`
Czyści cache z pamięci i pliku.

#### `exportCache()`
Eksportuje cache jako obiekt.

#### `importCache(data)`
Importuje dane do cache.

### usePostalCode Hook

#### Zwracane wartości:
- `getCityFromPostalCode(postalCode)` - funkcja wyszukująca
- `isLoading` - czy trwa wyszukiwanie
- `error` - komunikat błędu (jeśli wystąpił)
- `stats` - statystyki użycia
- `lastResult` - ostatni wynik
- `clearCache()` - funkcja czyszcząca cache

## 🔐 Bezpieczeństwo

- ✅ Klucz API Google jest przechowywany w `geo-config.json` (nie commituj do git!)
- ✅ Rate limiting dla OSM
- ✅ Dzienny limit dla Google API
- ✅ Cache zapobiega nadmiernym requestom

## 📱 Użycie w różnych miejscach

Serwis jest uniwersalny i może być użyty w:

1. ✅ **Formularzu rezerwacji** (`/rezerwacja`)
2. ✅ **Panelu admina** (dodawanie klientów)
3. ✅ **API endpoints** (walidacja danych)
4. ✅ **Panelu pracownika** (wizyty)
5. ✅ **Migracje danych** (uzupełnianie brakujących miast)

## 🎉 Gotowe!

Teraz możesz używać serwisu w dowolnym miejscu w aplikacji. Cache zapewni szybkie działanie, a hybrydowe podejście - niezawodność i oszczędność kosztów.
