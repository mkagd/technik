# 🚗 SERWIS MOBILNY - Dynamiczna zmiana lokalizacji startowej

> **Status**: ✅ **GOTOWE**  
> **Data**: 2025-10-12  
> **Wersja**: 1.0.0

---

## 🎯 Problem

**Scenario**: Prowadzisz serwis mobilny AGD. Jesteś u klienta w Tarnowie i chcesz zobaczyć najbliższe zlecenia **od Twojej aktualnej lokalizacji**, a nie od siedziby firmy w Krakowie.

**Przed**: System zawsze liczył odległości tylko z siedziby firmy.

**Teraz**: ✅ Możesz dynamicznie zmienić punkt startowy w panelu zamówień!

---

## 🚀 Jak używać?

### Krok 1: Włącz sortowanie po odległości

```
Panel Zamówień → Filtry → Sortuj: "🧭 Od najbliższych (GPS)"
```

### Krok 2: Wybierz punkt startowy

Po włączeniu sortowania GPS pojawi się **niebieski panel** z 3 opcjami:

```
┌─────────────────────────────────────────────────┐
│ 🚗 Serwis mobilny - wybierz punkt startowy:     │
├─────────────────────────────────────────────────┤
│                                                  │
│  [🏠 Siedziba firmy]  [🧭 Moja lokalizacja]     │
│                                                  │
│  [📍 Ostatni klient]                            │
│                                                  │
│  💡 Ustaw punkt startowy, aby zobaczyć          │
│     najbliższe zlecenia od miejsca, w którym     │
│     się znajdujesz                               │
└─────────────────────────────────────────────────┘
```

### Opcje lokalizacji:

#### 🏠 **Siedziba firmy** (domyślnie)
- Używa lokalizacji z ustawień firmy
- Np. Kraków (50.0647, 19.9450)
- **Kiedy używać**: Rano przed wyjazdem

#### 🧭 **Moja lokalizacja** (GPS w czasie rzeczywistym)
- Pobiera Twoją aktualną lokalizację GPS z przeglądarki
- Wymaga zgody na dostęp do lokalizacji
- **Kiedy używać**: Jesteś w trasie i chcesz wiedzieć co jest najbliżej

#### 📍 **Ostatni klient** (ostatnie zlecenie z GPS)
- Używa lokalizacji ostatniego zrealizowanego klienta
- Automatycznie znajduje najnowsze zlecenie z GPS
- **Kiedy używać**: Skończyłeś u klienta, szukasz kolejnego w okolicy

---

## 📋 Przykładowe Scenariusze

### Scenariusz 1: Rano przed wyjazdem
```
1. Otwórz panel zamówień
2. Sortuj: "Od najbliższych"
3. Punkt startowy: 🏠 Siedziba firmy
4. Widzisz: Zlecenia posortowane od Krakowa

Wynik:
- Kraków Nowa Huta - 7.8 km
- Skawina - 15.2 km
- Wieliczka - 18.5 km
- Tarnów - 85.3 km
```

### Scenariusz 2: W trasie (jesteś w Tarnowie)
```
1. Skończyłeś naprawę w Tarnowie
2. Sortuj: "Od najbliższych"
3. Punkt startowy: 🧭 Moja lokalizacja
4. Przeglądarka pyta o GPS → Akceptuj
5. System przelicza odległości od Tarnowa

Wynik:
- Brzesko - 22.4 km (było: 65 km od Krakowa)
- Dąbrowa Tarnowska - 30.1 km (było: 110 km)
- Bochnia - 35.8 km (było: 50 km)
- Kraków - 85.3 km (teraz najdalej!)
```

### Scenariusz 3: Ostatni klient
```
1. Skończone zlecenie w Mielcu
2. Sortuj: "Od najbliższych"
3. Punkt startowy: 📍 Ostatni klient
4. System używa GPS z ostatniego zlecenia (Mielec)

Wynik:
- Tarnów - 41.2 km
- Rzeszów - 60.8 km
- Dębica - 25.3 km
- Kraków - 130.2 km
```

---

## 🛠️ Implementacja Techniczna

### Nowe state variables:
```javascript
const [startLocation, setStartLocation] = useState({
  type: 'company',    // 'company' | 'current' | 'lastClient'
  lat: null,
  lng: null,
  name: 'Siedziba firmy'
});
const [loadingLocation, setLoadingLocation] = useState(false);
```

### Funkcja zmiany lokalizacji:
```javascript
const handleLocationChange = async (type) => {
  if (type === 'company') {
    // Pobierz z API
    const response = await fetch('/api/settings/company-location');
    const data = await response.json();
    setStartLocation({ type: 'company', lat: data.lat, lng: data.lng, name: data.name });
  }
  
  else if (type === 'current') {
    // Geolocation API
    navigator.geolocation.getCurrentPosition((position) => {
      setStartLocation({
        type: 'current',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: 'Moja lokalizacja'
      });
      
      // Automatyczne przeliczenie
      if (filters.sortBy === 'distance') {
        sortOrdersByDistance(filteredOrders, {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }
    });
  }
  
  else if (type === 'lastClient') {
    // Znajdź ostatnie zlecenie z GPS
    const lastOrder = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .find(o => o.latitude && o.longitude);
    
    if (lastOrder) {
      setStartLocation({
        type: 'lastClient',
        lat: lastOrder.latitude,
        lng: lastOrder.longitude,
        name: `Ostatni klient: ${lastOrder.clientName}`
      });
      
      // Automatyczne przeliczenie
      if (filters.sortBy === 'distance') {
        sortOrdersByDistance(filteredOrders, {
          lat: lastOrder.latitude,
          lng: lastOrder.longitude
        });
      }
    }
  }
};
```

### Sortowanie z custom origin:
```javascript
const sortOrdersByDistance = async (ordersToSort, customOrigin = null) => {
  const distanceService = getSmartDistanceService();
  
  let sorted;
  if (customOrigin) {
    // 🚗 Użyj custom origin (serwis mobilny)
    sorted = await distanceService.sortOrdersByDistance(ordersToSort, customOrigin);
  } else {
    // Domyślnie: siedziba firmy
    sorted = await distanceService.sortOrdersByDistance(ordersToSort);
  }
  
  setFilteredOrders(sorted);
};
```

### SmartDistanceService support:
```javascript
// distance-matrix/SmartDistanceService.js
async sortOrdersByDistance(orders, fromLocation = null, options = {}) {
  const origin = fromLocation || this.companyLocation;
  // ... reszta logiki
}
```

---

## 🎨 UI Components

### Panel wyboru lokalizacji (pokazuje się gdy sortBy === 'distance'):

```jsx
{filters.sortBy === 'distance' && (
  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <FiMapPin className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-semibold text-gray-900">
          Serwis mobilny - wybierz punkt startowy:
        </span>
      </div>
      <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
        {startLocation.name}
      </span>
    </div>
    
    <div className="flex flex-wrap gap-2">
      {/* Przyciski: Siedziba / Moja lokalizacja / Ostatni klient */}
    </div>
    
    <p className="mt-3 text-xs text-gray-600">
      💡 <strong>Serwis mobilny:</strong> Ustaw punkt startowy...
    </p>
  </div>
)}
```

### Przyciski (active state):
- **Siedziba firmy**: Niebieski background gdy aktywny
- **Moja lokalizacja**: Zielony background gdy aktywny
- **Ostatni klient**: Fioletowy background gdy aktywny

---

## 📊 Przykład: Różnica w rankingu

### Od siedziby (Kraków):
```
1. Kraków Nowa Huta - 7.8 km
2. Skawina - 15.2 km
3. Wieliczka - 18.5 km
4. Bochnia - 50.3 km
5. Tarnów - 85.3 km
6. Mielec - 130.2 km
```

### Od aktualnej lokalizacji (Tarnów):
```
1. Brzesko - 22.4 km
2. Dąbrowa Tarnowska - 30.1 km
3. Bochnia - 35.8 km
4. Mielec - 41.2 km
5. Wieliczka - 65.8 km
6. Kraków - 85.3 km
```

**Wniosek**: Zmiana punktu startowego kompletnie zmienia ranking! Dla serwisu mobilnego to kluczowa funkcja.

---

## 🔧 Wymagania Techniczne

### Przeglądarki:
- **Geolocation API**: Chrome, Firefox, Safari, Edge (wszystkie nowoczesne)
- **HTTPS**: Geolocation działa tylko na HTTPS (lub localhost)

### Uprawnienia:
- Przeglądarka zapyta o dostęp do lokalizacji
- Użytkownik musi zaakceptować

### Fallback:
- Jeśli GPS niedostępny: Toast "Nie można pobrać lokalizacji"
- Jeśli brak zlecenia z GPS: Toast "Brak zlecenia z GPS"

---

## 🚨 Edge Cases

### 1. Brak uprawnień GPS
```
Problem: Użytkownik odrzuca dostęp do lokalizacji
Rozwiązanie: Toast error + pozostaje domyślna lokalizacja (siedziba)
```

### 2. Brak zleceń z GPS
```
Problem: Wszystkie zlecenia bez GPS
Rozwiązanie: Wyświetla "0 zleceń z GPS" + sortuje po dacie
```

### 3. Ostatni klient bez GPS
```
Problem: Kliknięcie "Ostatni klient" ale brak zlecenia z GPS
Rozwiązanie: Toast "Brak zlecenia z GPS" + pozostaje obecna lokalizacja
```

### 4. GPS timeout
```
Problem: Przeglądarkatime timeout na pobieranie GPS (>30s)
Rozwiązanie: Error callback + Toast "Nie można pobrać lokalizacji"
```

---

## 📈 Korzyści dla Serwisu Mobilnego

### 1. **Optymalizacja trasy** 🗺️
- Zawsze widzisz najbliższe zlecenia od miejsca, gdzie jesteś
- Mniej km = mniej paliwa = więcej zleceń dziennie

### 2. **Elastyczność** 🔄
- Zmiana lokalizacji w 1 kliknięcie
- Nie musisz planować trasy z wyprzedzeniem

### 3. **Szybsze decyzje** ⚡
- "Skończyłem w Tarnowie, co mam najbliżej?" → 1 kliknięcie

### 4. **Real-time** 📍
- Używasz GPS w czasie rzeczywistym
- Dokładna lokalizacja, nie szacunki

---

## 🎓 Best Practices

### Dla techników:
1. **Rano**: Użyj "Siedziba firmy" → planuj dzień
2. **W trasie**: Użyj "Moja lokalizacja" → znajdź następne
3. **Po zleceniu**: Użyj "Ostatni klient" → sprawdź co blisko

### Dla biura:
1. Upewnij się że zlecenia mają GPS coordinates
2. Ustaw poprawną lokalizację siedziby
3. Monitoruj użycie funkcji (logi)

---

## 🧪 Testowanie

### Test 1: Zmiana lokalizacji
```
1. Sortuj: "Od najbliższych"
2. Kliknij: "Siedziba firmy" → Sprawdź ranking
3. Kliknij: "Moja lokalizacja" → Zaakceptuj GPS → Sprawdź ranking
4. Kliknij: "Ostatni klient" → Sprawdź ranking
5. Sprawdź: czy ranking się zmienia
```

### Test 2: Geolocation permission
```
1. Kliknij: "Moja lokalizacja"
2. Przeglądarka: Zapyta o dostęp
3. Zaakceptuj → GPS pobrane
4. Odrzuć → Error message
```

### Test 3: Brak zleceń z GPS
```
1. Utwórz zlecenie BEZ GPS
2. Sortuj: "Od najbliższych"
3. Kliknij: "Ostatni klient"
4. Sprawdź: Toast "Brak zlecenia z GPS"
```

---

## 📝 Changelog

### v1.0.0 (2025-10-12)
- ✅ Dodano UI panel wyboru lokalizacji startowej
- ✅ Implementacja 3 opcji: Siedziba / GPS / Ostatni klient
- ✅ Integracja z SmartDistanceService (customOrigin)
- ✅ Automatyczne przeliczanie po zmianie lokalizacji
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

---

## 🚀 Gotowe do użycia!

System **serwisu mobilnego** jest kompletny i gotowy. Możesz teraz dynamicznie zmieniać punkt startowy i optymalizować swoje trasy w czasie rzeczywistym!

**Aby użyć**:
1. Przejdź do: `/admin/zamowienia`
2. Włącz sortowanie: "🧭 Od najbliższych (GPS)"
3. Wybierz punkt startowy: 🏠 Siedziba / 🧭 Moja lokalizacja / 📍 Ostatni klient
4. System automatycznie przelicz ranking!

---

**Dla serwisu mobilnego to game-changer!** 🎯🚗
