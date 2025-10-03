# 🔧 INTELLIGENT PLANNER - Plan Naprawy

## 📋 Wykryte Problemy

### 1. ❌ Problem z Google Maps API (KRYTYCZNY)
**Błąd:** `Error: getaddrinfo ENOTFOUND maps.googleapis.com`

**Przyczyna:**
- Brak połączenia z serwerami Google Maps
- Możliwe problemy z DNS lub firewall
- Klucz API może być nieprawidłowy lub nieaktywny

**Rozwiązanie:**

#### A. Sprawdź klucz API Google Maps
```javascript
// Sprawdź w pliku .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

// Upewnij się że klucz ma włączone API:
// 1. Distance Matrix API ✅
// 2. Geocoding API ✅
// 3. Maps JavaScript API ✅
```

#### B. Testuj połączenie manualnie
```powershell
# Test DNS
nslookup maps.googleapis.com

# Test połączenia
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=50.0647,19.9450&destinations=50.0648,19.9451&key=TWOJ_KLUCZ"
```

#### C. Dodaj fallback do lokalnego cache
```javascript
// W components/IntelligentWeekPlanner.js

const calculateTravelTimeWithCache = async (from, to) => {
  // 1. Sprawdź localStorage cache
  const cacheKey = `travel_${from.lat}_${from.lng}_${to.lat}_${to.lng}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) { // 24h
      return data.duration;
    }
  }
  
  // 2. Spróbuj API
  try {
    const result = await calculateTravelTime(from, to);
    localStorage.setItem(cacheKey, JSON.stringify({
      duration: result,
      timestamp: Date.now()
    }));
    return result;
  } catch (error) {
    // 3. Fallback do prostego obliczenia
    const distance = calculateDistance(from, to);
    return Math.round((distance / 40) * 60); // 40 km/h średnia
  }
};
```

---

### 2. 📦 Sztywno zakodowane dane (WYSOKIE PRIORITY)

**Problem:** Zlecenia i serwisanci są zapisane na stałe w pliku

**Gdzie to naprawić:**

#### Utwórz nowe API endpoints:

```javascript
// pages/api/intelligent-planner/get-data.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { servicemanId, week } = req.query;
    
    // Pobierz zlecenia z bazy danych
    const orders = await fetchOrdersFromDatabase({
      status: ['pending', 'in_progress'],
      assignedTo: servicemanId || null,
      week: week || getCurrentWeek()
    });
    
    // Pobierz serwisantów
    const servicemen = await fetchServicmenFromDatabase({
      isActive: true
    });
    
    // Pobierz wizyty
    const visits = await fetchVisitsFromDatabase({
      servicemanId,
      week
    });
    
    return res.status(200).json({
      success: true,
      data: {
        orders: orders.map(formatOrderForPlanner),
        servicemen: servicemen.map(formatServicemanForPlanner),
        visits: visits.map(formatVisitForPlanner)
      }
    });
    
  } catch (error) {
    console.error('Error fetching planner data:', error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
}

// Funkcje formatujące
function formatOrderForPlanner(order) {
  return {
    id: order.id,
    clientName: order.clientName,
    description: order.description,
    address: order.address,
    coordinates: {
      lat: order.latitude,
      lng: order.longitude
    },
    priority: order.priority || 'medium',
    estimatedDuration: order.estimatedDuration || 60,
    serviceCost: order.serviceCost || 150,
    preferredTimeSlots: order.preferredTimeSlots || [],
    unavailableDates: order.unavailableDates || [],
    deviceType: order.deviceType,
    brand: order.brand,
    model: order.model
  };
}

function formatServicemanForPlanner(serviceman) {
  return {
    id: serviceman.id,
    name: serviceman.name,
    phone: serviceman.phone,
    email: serviceman.email,
    specializations: serviceman.specializations || [],
    maxDailyOrders: serviceman.maxVisitsPerWeek || 15,
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    isActive: serviceman.isActive
  };
}

function formatVisitForPlanner(visit) {
  return {
    id: visit.id,
    orderId: visit.orderId,
    servicemanId: visit.employeeId,
    scheduledDate: visit.scheduledDate,
    scheduledTime: visit.scheduledTime,
    status: visit.status,
    estimatedDuration: visit.estimatedDuration || 60
  };
}
```

#### Zaktualizuj komponent aby używał API:

```javascript
// W components/IntelligentWeekPlanner.js

const loadRealDataFromAPI = useCallback(async () => {
  setIsLoading(true);
  try {
    // Pobierz rzeczywiste dane z bazy
    const response = await fetch(`/api/intelligent-planner/get-data?servicemanId=${currentServiceman}&week=${getCurrentWeekString()}`);
    const data = await response.json();
    
    if (data.success) {
      // Ustaw zlecenia
      setOrders(data.data.orders);
      
      // Ustaw serwisantów
      setAvailableServicemen(data.data.servicemen);
      
      // Ustaw istniejące wizyty
      setExistingVisits(data.data.visits);
      
      // Teraz wywołaj optymalizację z rzeczywistymi danymi
      await loadIntelligentPlan();
    }
  } catch (error) {
    console.error('Error loading real data:', error);
    showNotification('Błąd ładowania danych z bazy', 'error');
  } finally {
    setIsLoading(false);
  }
}, [currentServiceman]);

// Wywołaj przy montowaniu
useEffect(() => {
  loadRealDataFromAPI();
}, []);
```

---

### 3. 🎯 Dodaj API endpoint do zapisywania planu

```javascript
// pages/api/intelligent-planner/save-plan.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { servicemanId, weeklyPlan } = req.body;
    
    // Zapisz plan tygodniowy do bazy
    for (const [day, dayPlan] of Object.entries(weeklyPlan)) {
      for (const order of dayPlan.orders) {
        // Utwórz lub zaktualizuj wizytę
        await createOrUpdateVisit({
          orderId: order.id,
          employeeId: servicemanId,
          scheduledDate: getDayDate(day),
          scheduledTime: order.assignedTimeSlot?.start || '09:00',
          estimatedDuration: order.estimatedDuration,
          status: 'scheduled',
          type: 'diagnosis',
          autoAssigned: true,
          notes: `Automatycznie przydzielone przez Intelligent Planner - ${day}`
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Plan zapisany pomyślnie'
    });
    
  } catch (error) {
    console.error('Error saving plan:', error);
    return res.status(500).json({
      error: 'Failed to save plan',
      message: error.message
    });
  }
}
```

---

### 4. 🔍 Poprawa systemu Distance Matrix

#### Dodaj retry logic i lepszy error handling:

```javascript
// distance-matrix/providers/GoogleDistanceMatrixProvider.js

async calculateDistanceMatrix(origins, destinations, options = {}) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Distance Matrix attempt ${attempt}/${maxRetries}`);
      
      const url = this.buildUrl(origins, destinations, options);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TechnikApp/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        return this.parseResponse(data);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        // Poczekaj przed retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      } else {
        throw new Error(`Google API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Wszystkie próby failed - użyj fallback
  console.warn('⚠️ All retries failed, using fallback calculation');
  throw lastError;
}
```

---

### 5. 📊 Dodaj system monitorowania i debugowania

```javascript
// components/IntelligentWeekPlanner.js

// Dodaj panel debugowania (tylko w development)
const [showDebugPanel, setShowDebugPanel] = useState(process.env.NODE_ENV === 'development');

const renderDebugPanel = () => {
  if (!showDebugPanel) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md">
      <h3 className="font-bold mb-2">🐛 Debug Panel</h3>
      
      <div className="text-xs space-y-1">
        <div>📍 Start Location: {startLocation?.address || 'Not set'}</div>
        <div>🗺️ Coordinates: {startLocation?.coordinates ? 
          `${startLocation.coordinates.lat}, ${startLocation.coordinates.lng}` : 
          'Missing'}</div>
        <div>📦 Orders: {incomingOrders?.length || 0}</div>
        <div>👷 Servicemen: {availableServicemen?.length || 0}</div>
        <div>📅 Current Week: {currentWeekStart?.toLocaleDateString()}</div>
        <div>💾 Cache Size: {travelTimeCache?.size || 0} entries</div>
        <div>⏱️ Last Refresh: {lastRefresh?.toLocaleTimeString()}</div>
        <div className={`${weeklyPlan ? 'text-green-400' : 'text-red-400'}`}>
          🎯 Plan Status: {weeklyPlan ? 'Loaded' : 'Not loaded'}
        </div>
      </div>
      
      <button
        onClick={() => {
          console.log('📋 Full State Dump:', {
            startLocation,
            weeklyPlan,
            travelTimeCache: Array.from(travelTimeCache.entries()),
            realTimeSchedules
          });
        }}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Log State to Console
      </button>
    </div>
  );
};
```

---

## 🚀 Kroki Implementacji

### **Krok 1: Napraw Google Maps API**
```bash
# 1. Sprawdź czy masz klucz API
cat .env.local | grep GOOGLE_MAPS

# 2. Testuj połączenie
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Krakow&key=TWOJ_KLUCZ"

# 3. Jeśli nie działa, wygeneruj nowy klucz w Google Cloud Console
```

### **Krok 2: Stwórz API endpoints**
```bash
# Utwórz folder
mkdir -p pages/api/intelligent-planner

# Stwórz pliki
touch pages/api/intelligent-planner/get-data.js
touch pages/api/intelligent-planner/save-plan.js
touch pages/api/intelligent-planner/update-visit.js
```

### **Krok 3: Zaktualizuj komponent**
- Usuń mock data
- Dodaj wywołania do API
- Dodaj loading states
- Dodaj error handling

### **Krok 4: Testuj**
```bash
# Uruchom serwer
npm run dev

# Otwórz w przeglądarce
http://localhost:3000/intelligent-planner

# Sprawdź console
# - Powinny być logi z API calls
# - Sprawdź czy dane się ładują
# - Sprawdź czy obliczenia dystansów działają
```

---

## 📝 Checklist Implementacji

### Faza 1: API Infrastructure
- [ ] Stwórz `/api/intelligent-planner/get-data.js`
- [ ] Stwórz `/api/intelligent-planner/save-plan.js`
- [ ] Dodaj funkcje do pobierania zleceń z bazy
- [ ] Dodaj funkcje do pobierania serwisantów z bazy
- [ ] Dodaj funkcje do pobierania wizyt z bazy
- [ ] Testuj endpoints w Postman/Insomnia

### Faza 2: Frontend Integration
- [ ] Usuń mock data z `IntelligentWeekPlanner.js`
- [ ] Dodaj `loadRealDataFromAPI()` function
- [ ] Zaktualizuj `useEffect` hooks
- [ ] Dodaj loading indicators
- [ ] Dodaj error boundaries
- [ ] Dodaj retry logic

### Faza 3: Distance Matrix Improvements
- [ ] Dodaj retry logic do Google API calls
- [ ] Dodaj localStorage cache dla dystansów
- [ ] Poprawa fallback calculations
- [ ] Dodaj monitoring wydajności
- [ ] Optymalizuj liczbę API calls

### Faza 4: Testing & Debug
- [ ] Dodaj debug panel
- [ ] Dodaj comprehensive logging
- [ ] Testuj z rzeczywistymi danymi
- [ ] Sprawdź wydajność
- [ ] Sprawdź accuracy dystansów

### Faza 5: User Experience
- [ ] Dodaj tooltips z wyjaśnieniami
- [ ] Dodaj wizualne feedback dla długich operacji
- [ ] Dodaj "Zapisz plan" button
- [ ] Dodaj "Eksportuj do PDF" funkcję
- [ ] Dodaj powiadomienia email dla serwisantów

---

## 🎯 Oczekiwane Rezultaty

Po implementacji powyższych zmian:

✅ **System będzie:**
- Pobierał rzeczywiste zlecenia z bazy danych
- Pobierał rzeczywistych serwisantów z bazy danych
- Obliczał precyzyjne czasy dojazdów (Google API + cache)
- Zapisywał plany tygodniowe do bazy
- Automatycznie tworzył wizyty w systemie
- Monitorował wydajność i błędy

✅ **Użytkownik będzie mógł:**
- Zobaczyć real-time plan dla każdego serwisanta
- Przeciągać zlecenia między dniami
- Zapisać plan i automatycznie utworzyć wizyty
- Eksportować plan do PDF
- Zobaczyć precyzyjne czasy dojazdów i harmonogramy

✅ **System będzie odporny na:**
- Błędy Google Maps API (fallback + retry)
- Brak połączenia sieciowego (localStorage cache)
- Nieprawidłowe dane (validation)
- Wysokie obciążenie (rate limiting + queuing)

---

## 💡 Dodatkowe Ulepszenia (Opcjonalne)

### A. Integracja z kalendarzami serwisantów
```javascript
// Synchronizuj plan z kalendarzami pracowników
const syncWithEmployeeCalendars = async (weeklyPlan) => {
  for (const [day, dayPlan] of Object.entries(weeklyPlan.weeklyPlan)) {
    for (const order of dayPlan.orders) {
      await fetch('/api/employee-calendar', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reserve-slot',
          employeeId: currentServiceman,
          date: getDayDate(day),
          startTime: order.assignedTimeSlot.start,
          duration: order.estimatedDuration,
          activity: `Wizyta: ${order.clientName}`,
          orderId: order.id
        })
      });
    }
  }
};
```

### B. Machine Learning dla lepszej optymalizacji
```javascript
// Ucz się z historycznych danych
const learnFromHistory = async () => {
  // Pobierz historyczne wizyty
  const historicalVisits = await fetchHistoricalVisits({
    employeeId: currentServiceman,
    period: 'last_3_months'
  });
  
  // Analizuj:
  // - Rzeczywiste czasy dojazdów vs przewidywane
  // - Rzeczywiste czasy napraw vs szacowane
  // - Skuteczność różnych strategii optymalizacji
  
  // Dostosuj algorytm optymalizacji
  adjustOptimizationWeights(historicalAnalysis);
};
```

### C. Powiadomienia i alerty
```javascript
// Wysyłaj powiadomienia do serwisantów
const notifyServicememAboutPlan = async (weeklyPlan) => {
  await fetch('/api/notifications/send', {
    method: 'POST',
    body: JSON.stringify({
      type: 'weekly_plan_ready',
      recipientId: currentServiceman,
      message: `Twój plan na tydzień ${getCurrentWeekString()} jest gotowy`,
      data: weeklyPlan
    })
  });
};
```

---

## 🆘 Troubleshooting

### Problem: "Maps API still not working"
**Rozwiązanie:**
1. Sprawdź firewall/antivirus
2. Sprawdź czy VPN nie blokuje
3. Użyj proxy lub alternatywnego providera (Nominatim OpenStreetMap)

### Problem: "Database queries are slow"
**Rozwiązanie:**
1. Dodaj indeksy do tabel orders, employees, visits
2. Używaj pagination dla dużych zbiorów danych
3. Cache częste zapytania w Redis

### Problem: "Plans are not optimal"
**Rozwiązanie:**
1. Dostosuj wagi w algorytmie optymalizacji
2. Zwiększ liczbę iteracji algorytmu
3. Dodaj więcej constraintów (max dystans, preferencje klientów)

---

## 📚 Dodatkowe Zasoby

- [Google Distance Matrix API Docs](https://developers.google.com/maps/documentation/distance-matrix)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vehicle Routing Problem Algorithms](https://en.wikipedia.org/wiki/Vehicle_routing_problem)

---

**Autor:** AI Assistant  
**Data:** October 1, 2025  
**Wersja:** 1.0
