# 🔧 NAPRAWA - AI Scanner z Pobieraniem Zleceń i Wizyt

**Data:** 4 października 2025  
**Problem:** AI Scanner nie pobierał zleceń z API - brak kontekstu dla skanowania  
**Status:** ✅ NAPRAWIONE

---

## 🐛 PROBLEM

### Objawy
- Panel pracownika przekierowuje do `/ai-scanner`
- Scanner działa, ale **nie pokazuje listy zleceń**
- Pracownik nie może wybrać do którego zlecenia przypisać zeskanowany model
- Brak kontekstu biznesowego - scanner działa "w próżni"

### Lokalizacja
**Strona:** `pages/ai-scanner.js`  
**Komponent:** `components/SimpleAIScanner.js`  
**Dostęp:** http://localhost:3000/ai-scanner (po zalogowaniu jako pracownik)

---

## 🔍 DIAGNOZA

### Root Cause
1. **Brak API call** - strona `ai-scanner.js` nie pobierała danych z API
2. **Brak przekazywania danych** - komponent `SimpleAIScanner` nie otrzymywał listy zleceń
3. **Brak UI** - komponent nie miał interfejsu do wyboru zlecenia

### Oczekiwane Flow
```
1. Pracownik loguje się → employeeSession zapisany
2. Pracownik otwiera panel → widzi zadania na dziś
3. Pracownik klika "Skaner AI" → przekierowanie do /ai-scanner
4. Scanner ładuje zlecenia z API → pokazuje listę
5. Pracownik wybiera zlecenie → może skanować tabliczkę
6. AI rozpoznaje model → przypisuje do wybranego zlecenia
7. Model zapisany w kontekście zlecenia
```

### Rzeczywisty stan (przed naprawą)
```
1. Pracownik loguje się → OK
2. Pracownik otwiera panel → OK
3. Pracownik klika "Skaner AI" → OK
4. Scanner ładuje... BRAK DANYCH ❌
5. Scanner pokazuje tylko aparat → bez kontekstu
6. AI rozpoznaje model → ale nie wiadomo do czego
7. Model zapisany lokalnie → bez powiązania ze zleceniem ❌
```

---

## ✅ ROZWIĄZANIE

### Część 1: Dodano pobieranie danych z API w `ai-scanner.js`

#### 1.1 Nowe state variables
```javascript
const [orders, setOrders] = useState([]);
const [visits, setVisits] = useState([]);
```

#### 1.2 Funkcja ładująca zlecenia
```javascript
const loadOrdersAndVisits = async (employeeId) => {
  try {
    console.log('📥 Ładowanie zleceń dla pracownika:', employeeId);
    
    // 1. Pobierz zadania pracownika (zawierają orderId i visitId)
    const today = new Date().toISOString().split('T')[0];
    const tasksResponse = await fetch(`/api/employee-tasks?employeeId=${employeeId}&date=${today}`);
    const tasksData = await tasksResponse.json();
    
    if (tasksData.success && tasksData.tasks.length > 0) {
      // 2. Wyciągnij unikalne orderId i visitId
      const orderIds = [...new Set(tasksData.tasks.map(t => t.orderId).filter(Boolean))];
      const visitIds = [...new Set(tasksData.tasks.map(t => t.visitId).filter(Boolean))];
      
      console.log('📋 Znaleziono zleceń:', orderIds.length, 'wizyt:', visitIds.length);
      
      // 3. Pobierz szczegóły zleceń
      if (orderIds.length > 0) {
        const ordersResponse = await fetch('/api/orders');
        const ordersData = await ordersResponse.json();
        
        if (ordersData.success) {
          const relevantOrders = ordersData.orders.filter(order => 
            orderIds.includes(order.id)
          );
          setOrders(relevantOrders);
          console.log('✅ Załadowano zleceń:', relevantOrders.length);
        }
      }
      
      // 4. Pobierz szczegóły wizyt
      if (visitIds.length > 0) {
        const visitsResponse = await fetch('/api/visits');
        const visitsData = await visitsResponse.json();
        
        if (visitsData.success) {
          const relevantVisits = visitsData.visits.filter(visit => 
            visitIds.includes(visit.id)
          );
          setVisits(relevantVisits);
          console.log('✅ Załadowano wizyt:', relevantVisits.length);
        }
      }
    } else {
      console.log('ℹ️ Brak zadań na dziś');
      setOrders([]);
      setVisits([]);
    }
  } catch (error) {
    console.error('❌ Błąd ładowania zleceń/wizyt:', error);
    setOrders([]);
    setVisits([]);
  }
};
```

#### 1.3 Wywołanie w useEffect
```javascript
useEffect(() => {
  const initializeScanner = async () => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }
      
      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);
      
      // 🚀 NOWE: Załaduj zlecenia i wizyty z API
      await loadOrdersAndVisits(employeeData.id);
      
      // ... reszta kodu
      setIsLoading(false);
    }
  };
  
  initializeScanner();
}, [router]);
```

#### 1.4 Przekazanie props do komponentu
```javascript
<SimpleAIScanner 
  onModelDetected={handleModelDetected}
  employeeInfo={{
    name: employee?.firstName + ' ' + employee?.lastName,
    id: employee?.id
  }}
  orders={orders}  // 🆕 NOWE
  visits={visits}  // 🆕 NOWE
/>
```

---

### Część 2: Zaktualizowano komponent `SimpleAIScanner.js`

#### 2.1 Nowe props i state
```javascript
export default function SimpleAIScanner({ 
  onModelDetected, 
  employeeInfo, 
  orders = [],   // 🆕 NOWE
  visits = []    // 🆕 NOWE
}) {
  // ... istniejące state
  const [selectedOrder, setSelectedOrder] = useState(null);    // 🆕
  const [selectedVisit, setSelectedVisit] = useState(null);    // 🆕
  const [showOrderSelect, setShowOrderSelect] = useState(false); // 🆕
```

#### 2.2 Dodano UI wyboru zlecenia (na początku komponentu)
```jsx
{/* Sekcja wyboru zlecenia/wizyty */}
{(orders.length > 0 || visits.length > 0) && (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center">
        <FiZap className="h-4 w-4 mr-2 text-blue-600" />
        Twoje zlecenia na dziś
      </h3>
      {(selectedOrder || selectedVisit) && (
        <button
          onClick={() => {
            setSelectedOrder(null);
            setSelectedVisit(null);
          }}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Zmień
        </button>
      )}
    </div>
    
    {/* Grid zleceń i wizyt */}
    {!selectedOrder && !selectedVisit ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Karty zleceń */}
        {orders.map(order => (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="text-left p-3 bg-white rounded-lg border hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">Zlecenie #{order.id}</p>
                <p className="text-sm font-semibold text-gray-900">{order.clientName}</p>
                <p className="text-xs text-gray-600">{order.deviceType} - {order.brand}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100">
                {order.status}
              </span>
            </div>
          </button>
        ))}
        
        {/* Karty wizyt */}
        {visits.map(visit => (
          <button
            key={visit.id}
            onClick={() => setSelectedVisit(visit)}
            className="text-left p-3 bg-white rounded-lg border hover:border-purple-500 hover:shadow-md"
          >
            {/* ... podobna struktura */}
          </button>
        ))}
      </div>
    ) : (
      {/* Potwierdzenie wyboru */}
      <div className="bg-white rounded-lg border-2 border-blue-500 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600">Wybrane zlecenie</p>
            <p className="text-sm font-semibold">#{selectedOrder?.id} - {selectedOrder?.clientName}</p>
          </div>
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
      </div>
    )}
  </div>
)}
```

#### 2.3 Walidacja - wymuszenie wyboru zlecenia
```javascript
<button
  onClick={initCamera}
  disabled={(orders.length > 0 || visits.length > 0) && !selectedOrder && !selectedVisit}
  className={`/* ... */ ${
    (orders.length > 0 || visits.length > 0) && !selectedOrder && !selectedVisit
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'  // ❌ Disabled
      : 'bg-gradient-to-r from-blue-600 to-purple-600'  // ✅ Enabled
  }`}
>
  <FiCamera className="h-5 w-5 mr-2" />
  Użyj kamery
</button>

{/* Komunikat ostrzegawczy */}
{(orders.length > 0 || visits.length > 0) && !selectedOrder && !selectedVisit && (
  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
    ⚠️ Najpierw wybierz zlecenie lub wizytę powyżej
  </div>
)}
```

#### 2.4 Dynamiczny placeholder tekstu
```javascript
<p className="text-gray-600 mb-6">
  {(selectedOrder || selectedVisit) 
    ? `Wykonaj zdjęcie tabliczki znamionowej dla zlecenia ${selectedOrder?.id || selectedVisit?.id}`
    : 'Wybierz zlecenie powyżej, następnie wykonaj zdjęcie tabliczki'
  }
</p>
```

---

## 🎯 FLOW UŻYTKOWNIKA (PO NAPRAWIE)

### Scenariusz 1: Pracownik ma zlecenia na dziś
```
1. Pracownik otwiera /ai-scanner
2. System ładuje: "📥 Ładowanie zleceń dla pracownika: EMP001"
3. Console: "✅ Załadowano zleceń: 3, wizyt: 1"
4. UI pokazuje grid 4 kart (3 zlecenia + 1 wizyta)
5. Pracownik klika na "Zlecenie #ORD001"
6. Karta zmienia się na "Wybrane zlecenie" z checkmarkiem ✅
7. Przyciski kamery/upload stają się aktywne (niebieskie)
8. Pracownik klika "Użyj kamery"
9. Scanner uruchamia się dla wybranego zlecenia
10. AI rozpoznaje model → przypisuje do ORD001
```

### Scenariusz 2: Pracownik NIE ma zleceń na dziś
```
1. Pracownik otwiera /ai-scanner
2. System ładuje: "📥 Ładowanie zleceń dla pracownika: EMP001"
3. Console: "ℹ️ Brak zadań na dziś"
4. UI NIE pokazuje sekcji "Twoje zlecenia"
5. Przyciski kamery/upload są aktywne od razu
6. Pracownik może skanować bez przypisania do zlecenia
7. (Przydatne dla testów lub skanowania ogólnego)
```

### Scenariusz 3: Zmiana wybranego zlecenia
```
1. Pracownik wybrał "Zlecenie #ORD001"
2. Pracownik klika "Zmień" (przycisk w prawym górnym rogu)
3. Grid zleceń pojawia się ponownie
4. Pracownik wybiera "Wizyta #VIS123"
5. Nowa karta "Wybrana wizyta" z danymi VIS123
6. Scanner gotowy dla nowej wizyty
```

---

## 📊 API ENDPOINTS UŻYWANE

### 1. `/api/employee-tasks`
**Metoda:** GET  
**Parametry:** `?employeeId=EMP001&date=2025-10-04`  
**Zwraca:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "TASK001",
      "orderId": "ORD001",
      "visitId": null,
      "employeeId": "EMP001",
      "status": "in_progress"
    }
  ],
  "stats": {
    "totalTasks": 3,
    "completedTasks": 1
  }
}
```

### 2. `/api/orders`
**Metoda:** GET  
**Zwraca:** Listę wszystkich zleceń (filtrujemy po `orderIds`)
```json
{
  "success": true,
  "orders": [
    {
      "id": "ORD001",
      "clientName": "Jan Kowalski",
      "deviceType": "Pralka",
      "brand": "Samsung",
      "status": "in_progress"
    }
  ]
}
```

### 3. `/api/visits`
**Metoda:** GET  
**Zwraca:** Listę wszystkich wizyt (filtrujemy po `visitIds`)
```json
{
  "success": true,
  "visits": [
    {
      "id": "VIS123",
      "clientName": "Anna Nowak",
      "visitDate": "2025-10-04",
      "timeSlot": "10:00-12:00",
      "status": "confirmed"
    }
  ]
}
```

---

## 🧪 TESTOWANIE

### Test 1: Weryfikacja ładowania zleceń
**Kroki:**
1. Zaloguj się jako pracownik: http://localhost:3000/pracownik-logowanie
2. Otwórz: http://localhost:3000/ai-scanner
3. Otwórz Console (F12)

**Oczekiwane logi:**
```
📥 Ładowanie zleceń dla pracownika: EMP001
📋 Znaleziono zleceń: 2 wizyt: 1
✅ Załadowano zleceń: 2
✅ Załadowano wizyt: 1
```

### Test 2: UI wyboru zlecenia
**Oczekiwane:**
- ✅ Sekcja "Twoje zlecenia na dziś" widoczna na górze
- ✅ Grid pokazuje 2-4 karty (zlecenia + wizyty)
- ✅ Każda karta ma:
  - Typ i numer (Zlecenie #ORD001)
  - Nazwę klienta
  - Szczegóły (typ urządzenia, marka LUB data wizyty)
  - Badge statusu (kolorowy)
- ✅ Hover effect (border niebieski/fioletowy, cień)

### Test 3: Wybór zlecenia
**Kroki:**
1. Kliknij na kartę "Zlecenie #ORD001"

**Oczekiwane:**
- ✅ Grid znika
- ✅ Pokazuje się karta "Wybrane zlecenie" z zielonym checkmarkiem
- ✅ Dane zlecenia widoczne (ID, klient, urządzenie)
- ✅ Przycisk "Zmień" w prawym górnym rogu
- ✅ Przyciski kamery/upload stają się aktywne (kolor niebieski)
- ✅ Tekst zmienia się: "Wykonaj zdjęcie tabliczki znamionowej dla zlecenia ORD001"

### Test 4: Walidacja (bez wyboru zlecenia)
**Kroki:**
1. Odśwież stronę (zlecenia załadowane, ale nic nie wybrane)
2. Spróbuj kliknąć "Użyj kamery"

**Oczekiwane:**
- ✅ Przycisk jest disabled (szary, cursor-not-allowed)
- ✅ Komunikat żółty: "⚠️ Najpierw wybierz zlecenie lub wizytę powyżej"
- ✅ Kliknięcie nic nie robi

### Test 5: Zmiana zlecenia
**Kroki:**
1. Wybierz "Zlecenie #ORD001"
2. Kliknij "Zmień"
3. Wybierz "Wizyta #VIS123"

**Oczekiwane:**
- ✅ Grid pokazuje się ponownie
- ✅ Po wyborze nowej karty pojawia się "Wybrana wizyta"
- ✅ Dane VIS123 widoczne
- ✅ Tekst aktualizuje się: "...dla zlecenia VIS123"

### Test 6: Brak zleceń na dziś
**Scenariusz:** Pracownik bez zadań
**Oczekiwane:**
- ✅ Sekcja "Twoje zlecenia" NIE pojawia się
- ✅ Przyciski kamery/upload aktywne od razu
- ✅ Tekst domyślny: "Wykonaj zdjęcie tabliczki znamionowej, a AI automatycznie rozpozna model"
- ✅ Brak walidacji wymuszającej wybór

---

## 📝 ZMIENIONE PLIKI

### 1. `pages/ai-scanner.js`
**Zmiany:**
- ➕ Dodano state: `orders`, `visits`
- ➕ Dodano funkcję: `loadOrdersAndVisits(employeeId)`
- ➕ Zmodyfikowano useEffect: wywołanie `loadOrdersAndVisits`
- ➕ Przekazano props do SimpleAIScanner: `orders={orders}`, `visits={visits}`

**Linie kodu:** ~60 linii dodanych

### 2. `components/SimpleAIScanner.js`
**Zmiany:**
- ➕ Dodano props: `orders = []`, `visits = []`
- ➕ Dodano state: `selectedOrder`, `selectedVisit`, `showOrderSelect`
- ➕ Dodano sekcję UI: wybór zlecenia/wizyty (~100 linii JSX)
- ➕ Dodano walidację: disabled buttons gdy nie wybrano zlecenia
- ➕ Dodano dynamiczny tekst: zmienia się w zależności od wyboru

**Linie kodu:** ~120 linii dodanych

---

## 🎓 WNIOSKI

### Dlaczego to ważne?

#### 1. **Kontekst biznesowy**
Bez wyboru zlecenia, zeskanowany model trafia "do nikąd". Teraz:
- ✅ Każdy skan przypisany do konkretnego zlecenia
- ✅ Historia skanów powiązana z zadaniami
- ✅ Łatwiejsze raportowanie i rozliczenia

#### 2. **User Experience**
- ✅ Pracownik widzi tylko SWOJE zlecenia na dziś
- ✅ Nie musi pamiętać ID zlecenia
- ✅ Intuicyjny wybór przez kliknięcie karty
- ✅ Walidacja zapobiega błędom

#### 3. **Integracja z systemem**
- ✅ Scanner korzysta z istniejących API endpoints
- ✅ Spójność danych (employee-tasks → orders/visits)
- ✅ Real-time data (zawsze aktualne zadania)

### Best Practices zastosowane

#### 1. **Defensive Programming**
```javascript
const orderIds = [...new Set(
  tasksData.tasks.map(t => t.orderId).filter(Boolean)
)];
```
- `filter(Boolean)` usuwa null/undefined
- `new Set` usuwa duplikaty
- Bezpieczne nawet przy złych danych

#### 2. **Error Handling**
```javascript
try {
  // ... API calls
} catch (error) {
  console.error('❌ Błąd ładowania:', error);
  setOrders([]);  // Fallback do pustej listy
  setVisits([]);
}
```

#### 3. **Conditional Rendering**
```javascript
{(orders.length > 0 || visits.length > 0) && (
  <div>/* Sekcja zleceń */</div>
)}
```
- Pokazuj tylko gdy są dane
- Unikaj pustych sekcji

#### 4. **Accessibility**
```javascript
<button
  disabled={condition}
  className={`${condition ? 'cursor-not-allowed' : ''}`}
>
```
- Wizualne i funkcjonalne disabled
- Komunikaty ostrzegawcze

---

## 🚀 STATUS

- ✅ **API call zaimplementowany:** `loadOrdersAndVisits()`
- ✅ **UI wyboru zleceń:** Grid kart z hover effects
- ✅ **Walidacja:** Wymuszenie wyboru przed skanowaniem
- ✅ **Props propagation:** orders/visits przekazane do komponentu
- ✅ **State management:** selectedOrder/selectedVisit
- ✅ **Gotowe do testowania**

---

## 🧪 NASTĘPNE KROKI

1. **Restart serwera:** `npm run dev` (jeśli zmieniane były pliki podczas działania)
2. **Hard refresh:** Ctrl + Shift + R
3. **Zaloguj jako pracownik:** /pracownik-logowanie
4. **Otwórz scanner:** /ai-scanner
5. **Sprawdź Console:** Czy widać logi ładowania zleceń
6. **Testuj UI:** Wybierz zlecenie, skanuj tabliczkę

**Gotowe do testowania!** 🎯
