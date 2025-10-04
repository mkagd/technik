# 🌍 Instrukcja: Auto-detekcja Lokalizacji na Stronie Głównej

## 📋 Co zostało zrobione?

Dodano funkcjonalność automatycznego wykrywania lokalizacji użytkownika na stronie głównej `index.js` i przekierowanie do odpowiedniej wersji lokalnej serwisu.

## ✨ Jak to działa?

### 1. **Auto-detekcja GPS** 🛰️
Gdy użytkownik wejdzie na stronę główną (`http://localhost:3000`), aplikacja:
- Pyta przeglądarkę o pozwolenie na dostęp do lokalizacji
- Jeśli użytkownik zaakceptuje → wykrywa najbliższe miasto
- Pokazuje komunikat "Wykryto lokalizację: **[Miasto]**"
- Po 1.5 sekundy przekierowuje na `/serwis/[miasto]`

### 2. **Fallback: Selektor Miast** 📍
Jeśli lokalizacja nie jest dostępna (użytkownik odmówił lub przeglądarka nie wspiera GPS):
- Po 1 sekundzie pojawia się modal z listą miast
- Użytkownik może ręcznie wybrać swoje miasto
- Po wyborze następuje przekierowanie

### 3. **Tryb Testowy** 🧪
Możesz przetestować wykrywanie bez GPS:
```
http://localhost:3000?test=rzeszow
http://localhost:3000?test=debica
http://localhost:3000?test=krakow
http://localhost:3000?test=warszawa
```

## 🎨 Interfejs Użytkownika

### Ekran Przekierowania
```
┌─────────────────────────────┐
│   🗺️ (animowana ikona)      │
│                              │
│  Wykryto lokalizację:        │
│     RZESZÓW                  │
│                              │
│  Przekierowanie do wersji    │
│  dla Twojego miasta...       │
│                              │
│  ⏳ Ładowanie...             │
└─────────────────────────────┘
```

### Modal Wyboru Miasta
```
┌─────────────────────────────────┐
│  📍 Wybierz swoje miasto        │
│  Aby pokazać Ci najlepsze       │
│  oferty w Twojej okolicy        │
│                                 │
│  ┌─────────────┐ ┌───────────┐│
│  │ 📍 Dębica   │ │ 📍 Rzeszów││
│  │ podkarpackie│ │ podkarpackie│
│  └─────────────┘ └───────────┘│
│  ┌─────────────┐ ┌───────────┐│
│  │ 📍 Kraków   │ │ 📍 Warszawa│
│  │ małopolskie │ │ mazowieckie│
│  └─────────────┘ └───────────┘│
│                                 │
│  [ Zamknij i zostań tutaj ]    │
└─────────────────────────────────┘
```

## 🔧 Pliki Zmodyfikowane

### `pages/index.js`
- Dodano import: `import { CITY_LIST, findNearestCity, DEFAULT_CITY, getCityBySlug } from '../config/cities'`
- Dodano stany: `detectedCity`, `isRedirecting`, `showCitySelector`
- Dodano logikę wykrywania lokalizacji w `useEffect`
- Dodano ekran przekierowania
- Dodano modal wyboru miast

### `config/cities.js` (bez zmian)
Wykorzystuje istniejące funkcje:
- `CITY_LIST` - lista wszystkich miast
- `findNearestCity(lat, lng)` - znajduje najbliższe miasto na podstawie współrzędnych GPS
- `getCityBySlug(slug)` - pobiera dane miasta po slug
- `DEFAULT_CITY` - domyślne miasto (Dębica)

## 📱 Testowanie

### Test 1: Auto-detekcja GPS
1. Otwórz `http://localhost:3000`
2. W przeglądarce zaakceptuj pozwolenie na lokalizację
3. Poczekaj 1.5 sekundy
4. Sprawdź czy następuje przekierowanie

### Test 2: Odmowa GPS
1. Otwórz `http://localhost:3000`
2. Odmów dostępu do lokalizacji
3. Po 1 sekundzie powinien pojawić się modal wyboru miasta
4. Wybierz miasto i sprawdź przekierowanie

### Test 3: Tryb testowy
```bash
# Testuj różne miasta
http://localhost:3000?test=rzeszow    # -> /serwis/rzeszow
http://localhost:3000?test=debica     # -> /serwis/debica
http://localhost:3000?test=krakow     # -> /serwis/krakow
http://localhost:3000?test=warszawa   # -> /serwis/warszawa
```

## 🚀 Wdrożenie na Vercel

Funkcja działa również na produkcji:
```
https://twoja-domena.vercel.app          → Auto-detekcja
https://twoja-domena.vercel.app?test=rzeszow → Test
```

## 🔍 Konsola Developerska

Możesz śledzić działanie w konsoli przeglądarki:
```
📍 Próba wykrycia lokalizacji...
📍 Otrzymano współrzędne: 50.0413, 21.9991
🌍 Wykryto lokalizację: Rzeszów
🚀 Przekierowanie na: /serwis/rzeszow
```

lub w przypadku błędu:
```
❌ Lokalizacja niedostępna: User denied Geolocation
```

## 💡 Uwagi

1. **Bezpieczeństwo**: Geolokalizacja działa tylko przez HTTPS (lub localhost)
2. **Prywatność**: Użytkownik ZAWSZE musi wyrazić zgodę na dostęp do lokalizacji
3. **Fallback**: Jeśli GPS nie działa, zawsze pokazuje się selektor miast
4. **Wydajność**: Przekierowanie następuje po 1.5 sekundy, aby użytkownik widział co się dzieje
5. **SEO**: Strona główna jest nadal indeksowana, a przekierowanie działa tylko po stronie klienta

## 🎯 Korzyści

✅ Lepsze doświadczenie użytkownika (automatyczne dopasowanie do lokalizacji)
✅ Wyższe konwersje (użytkownik od razu widzi ofertę dla swojego miasta)
✅ Local SEO (każde miasto ma dedykowaną stronę)
✅ Łatwe testowanie (tryb ?test=miasto)
✅ Przyjazny UX (modal wyboru jeśli GPS nie działa)

## 🔗 Powiązane Pliki

- `pages/index.js` - Strona główna z auto-detekcją
- `pages/index-serwis-agd.js` - Alternatywna wersja z tą samą funkcjonalnością
- `config/cities.js` - Konfiguracja miast i funkcje geolokalizacji
- `pages/serwis/[city].js` - Dynamiczne strony dla każdego miasta

---

**Data utworzenia**: 3 października 2025
**Status**: ✅ Zaimplementowane i gotowe do użycia
