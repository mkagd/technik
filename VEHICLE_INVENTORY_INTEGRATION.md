# 🚗 Integracja Magazynu Pojazdu z Wizytami - Dokumentacja

## 📋 Przegląd

System umożliwia serwisantom **bezpośrednie użycie części z magazynu pojazdu** podczas wizyty u klienta, bez konieczności zamawiania z magazynu centralnego.

---

## 🎯 Funkcjonalność

### Główne cechy:
- ✅ **Przeglądanie magazynu pojazdu** - dostęp do wszystkich części w aucie serwisanta
- ✅ **Wybór części** - możliwość wyboru jednej lub wielu części
- ✅ **Kontrola ilości** - ustawienie dokładnej ilości do użycia (nie więcej niż dostępne)
- ✅ **Automatyczne odliczanie** - stan magazynu pojazdu zmniejsza się automatycznie
- ✅ **Auto-fill kosztów** - koszty części automatycznie dodawane w CompletionWizard
- ✅ **Historia użycia** - pełna historia wykorzystanych części z pojazdu
- ✅ **Low stock alerts** - powiadomienia dla logistyka gdy stan = 0
- ✅ **Wyświetlanie w sidebar** - sekcja "🚗 Części z pojazdu" na stronie wizyty

---

## 🗂️ Struktura Plików

### Nowe pliki:
```
components/technician/
└── VehicleInventoryModal.js       ✅ Modal wyboru części z pojazdu

data/
├── personal-inventories.json      ✅ Magazyny osobiste serwisantów
└── part-usage.json                ✅ Historia użycia części

pages/api/inventory/personal/
├── index.js                       ✅ GET/POST magazynu osobistego
├── use.js                         ✅ POST użycie części z pojazdu
└── history.js                     ✅ GET historia użycia
```

### Zmodyfikowane pliki:
```
pages/technician/visit/[visitId].js
└── + przycisk "🚗 Użyj część z pojazdu"
└── + sekcja wyświetlania użytych części
└── + funkcja loadVehiclePartsUsage()

components/technician/CompletionWizard.js
└── + auto-fill kosztów z części z pojazdu
└── + useEffect ładujący dane z API history
```

---

## 🔄 Przepływ Danych

```
┌─────────────────────────────────────────────────────────────┐
│                    1. PRZEGLĄD MAGAZYNU                      │
│  Serwisant otwiera wizytę → Klik "🚗 Użyj część z pojazdu" │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VehicleInventoryModal.loadInventory()           │
│  GET /api/inventory/personal?employeeId=EMP123              │
│  Response: { inventory: { parts: [...] } }                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    2. WYBÓR CZĘŚCI                           │
│  - Lista części z magazynu pojazdu                           │
│  - Wybór części (click)                                      │
│  - Ustawienie ilości (quantity slider)                       │
│  - Wyświetlenie wartości (unitPrice * quantity)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VehicleInventoryModal.handleSubmit()            │
│  POST /api/inventory/personal/use                            │
│  Body: {                                                     │
│    employeeId: "EMP123",                                     │
│    orderId: "VISIT-001",                                     │
│    parts: [                                                  │
│      { partId: "PART001", quantity: 2 }                      │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    3. BACKEND PROCESSING                     │
│  /api/inventory/personal/use.js:                             │
│  - Sprawdzenie dostępności części                            │
│  - Odejmowanie ilości z magazynu pojazdu                     │
│  - Usunięcie części jeśli quantity = 0                       │
│  - Zapis do part-usage.json (historia)                       │
│  - Low stock alert jeśli quantity = 0                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    4. FRONTEND UPDATE                        │
│  - Reload visit details (loadVisitDetails)                   │
│  - Reload vehicle parts usage (loadVehiclePartsUsage)        │
│  - Display alert: "✅ Użyto X części"                        │
│  - Show in sidebar: "🚗 Części z pojazdu"                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              5. AUTO-FILL W COMPLETIONWIZARD                 │
│  CompletionWizard useEffect:                                 │
│  - GET /api/part-requests?visitId=VISIT-001 (zamówienia)    │
│  - GET /api/inventory/personal/history?orderId=VISIT-001    │
│  - SUM(partsCost) = zamówienia + pojazd                      │
│  - Auto-fill pola "Koszt części"                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    6. ZAKOŃCZENIE WIZYTY                     │
│  Serwisant widzi pełne koszty:                               │
│  - Części z zamówień: 150 zł                                 │
│  - Części z pojazdu: 85 zł                                   │
│  - RAZEM części: 235 zł                                      │
│  + Robocizna: 100 zł                                         │
│  = DO ZAPŁATY: 335 zł                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modele Danych

### personal-inventories.json
```json
[
  {
    "inventoryId": "PI-001",
    "employeeId": "EMP25189001",
    "employeeName": "Jan Kowalski",
    "vehicle": "Ford Transit Custom - KR 12345",
    "parts": [
      {
        "partId": "PART001",
        "partNumber": "DC97-16151A",
        "name": "Łożysko bębna Samsung",
        "quantity": 2,
        "location": "Schowek przedni",
        "unitPrice": 85.00,
        "assignedDate": "2025-10-01T10:00:00Z",
        "lastRestocked": "2025-10-05T15:46:16Z"
      }
    ],
    "statistics": {
      "totalParts": 5,
      "totalValue": 450.00,
      "lastUpdated": "2025-10-05T15:46:16Z"
    }
  }
]
```

### part-usage.json
```json
[
  {
    "usageId": "PU-2025-10-004",
    "employeeId": "EMP25189001",
    "employeeName": "Jan Kowalski",
    "orderId": "VISIT-001",
    "usageDate": "2025-10-06T14:30:00Z",
    "parts": [
      {
        "partId": "PART001",
        "partName": "Łożysko bębna Samsung",
        "partNumber": "DC97-16151A",
        "quantity": 2,
        "unitPrice": 85.00,
        "totalPrice": 170.00,
        "installationNotes": "Użyto podczas wizyty VISIT-001"
      }
    ],
    "totalValue": 170.00,
    "addedToInvoice": true,
    "createdAt": "2025-10-06T14:32:00Z"
  }
]
```

---

## 🖥️ UI Components

### VehicleInventoryModal

**Lokalizacja:** `components/technician/VehicleInventoryModal.js`

**Props:**
- `visitId` (string) - ID wizyty
- `onPartsUsed` (function) - Callback po użyciu części: `(usage, parts) => void`
- `onClose` (function) - Zamknięcie modala: `() => void`

**Sekcje UI:**
1. **Header** - Tytuł + nazwa pojazdu
2. **Search** - Wyszukiwanie części (nazwa, ID, numer)
3. **Parts Grid** - Siatka części (2 kolumny MD)
4. **Part Card** - Karta pojedynczej części:
   - Nazwa + numer katalogowy
   - Dostępna ilość
   - Cena jednostkowa
   - Lokalizacja w pojeździe
   - Quantity selector (+ / - / input)
   - Przycisk "Usuń"
5. **Footer** - Podsumowanie + przyciski akcji

**States:**
- `inventory` - Magazyn pojazdu
- `selectedParts` - Wybrane części do użycia
- `searchQuery` - Fraza wyszukiwania
- `submitting` - Stan przesyłania

**Key Functions:**
- `loadEmployeeAndInventory()` - Ładuje dane pracownika i magazyn
- `handlePartSelect(part)` - Dodaje/usuwa część z wyboru
- `updateQuantity(partId, quantity)` - Zmienia ilość do użycia
- `handleSubmit()` - Wysyła request do API use

---

### Sidebar Section (visit/[visitId].js)

**Wyświetlanie użytych części z pojazdu:**

```jsx
{vehiclePartsUsage.length > 0 && (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h3>🚗 Części z pojazdu</h3>
    {vehiclePartsUsage.map(usage => (
      <div key={usage.usageId}>
        {usage.parts.map(part => (
          <div>
            <p>{part.partName}</p>
            <p>{part.quantity} szt - {part.totalPrice} zł</p>
          </div>
        ))}
        <p>Razem: {usage.totalValue} zł</p>
      </div>
    ))}
  </div>
)}
```

**Przycisk "Użyj część z pojazdu":**

```jsx
<button 
  onClick={() => setShowVehicleInventory(true)}
  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg"
>
  🚗 Użyj część z pojazdu
</button>
```

---

## 🔌 API Endpoints

### 1. GET /api/inventory/personal

**Query params:**
- `employeeId` (required) - ID pracownika

**Response:**
```json
{
  "success": true,
  "inventory": {
    "inventoryId": "PI-001",
    "employeeId": "EMP123",
    "employeeName": "Jan Kowalski",
    "vehicle": "Ford Transit",
    "parts": [
      {
        "partId": "PART001",
        "partName": "Pompa",
        "partNumber": "DC96-01414G",
        "quantity": 3,
        "unitPrice": 90.00,
        "location": "Schowek boczny"
      }
    ],
    "statistics": {
      "totalParts": 10,
      "totalValue": 850.00
    }
  }
}
```

---

### 2. POST /api/inventory/personal/use

**Body:**
```json
{
  "employeeId": "EMP123",
  "orderId": "VISIT-001",
  "parts": [
    {
      "partId": "PART001",
      "quantity": 2,
      "installationNotes": "Użyto podczas wizyty VISIT-001"
    }
  ],
  "addToInvoice": true
}
```

**Response:**
```json
{
  "success": true,
  "usage": {
    "usageId": "PU-2025-10-004",
    "employeeId": "EMP123",
    "orderId": "VISIT-001",
    "parts": [
      {
        "partId": "PART001",
        "partName": "Pompa",
        "quantity": 2,
        "unitPrice": 90.00,
        "totalPrice": 180.00
      }
    ],
    "totalValue": 180.00
  },
  "inventory": {
    "parts": [ /* zaktualizowany magazyn */ ]
  },
  "lowStockAlert": false,
  "outOfStockParts": [],
  "message": "Użyto 1 części z magazynu (180zł)"
}
```

**Error cases:**
- `400` - Niewystarczająca ilość części:
  ```json
  {
    "success": false,
    "error": "Niewystarczająca ilość części w magazynie",
    "unavailableParts": [
      {
        "partId": "PART001",
        "name": "Pompa",
        "requested": 5,
        "available": 2
      }
    ]
  }
  ```

---

### 3. GET /api/inventory/personal/history

**Query params:**
- `employeeId` (optional) - Filtruj po pracowniku
- `orderId` (optional) - Filtruj po zleceniu/wizycie
- `usageId` (optional) - Konkretne użycie
- `dateFrom` (optional) - Data od (ISO)
- `dateTo` (optional) - Data do (ISO)
- `limit` (optional) - Max wyników

**Response:**
```json
{
  "success": true,
  "usageHistory": [
    {
      "usageId": "PU-2025-10-004",
      "employeeId": "EMP123",
      "orderId": "VISIT-001",
      "usageDate": "2025-10-06T14:30:00Z",
      "parts": [ /* części */ ],
      "totalValue": 180.00
    }
  ],
  "statistics": {
    "totalUsages": 15,
    "totalParts": 32,
    "totalValue": 2500.00
  },
  "count": 15
}
```

---

## 🔧 Integracja z CompletionWizard

### Auto-fill kosztów części

**Lokalizacja:** `components/technician/CompletionWizard.js` (lines 87-149)

```javascript
useEffect(() => {
  if (!visit?.visitId) return;

  const loadPartRequestsAndVehicleParts = async () => {
    let totalPartsCost = 0;
    let totalPrepaid = 0;

    // 1️⃣ Zamówienia z magazynu centralnego
    const partReqRes = await fetch(`/api/part-requests?visitId=${visit.visitId}`);
    if (partReqRes.ok) {
      const data = await partReqRes.json();
      // Suma kosztów zamówień + zaliczki
      totalPartsCost += calculatePartRequestsCost(data.requests);
      totalPrepaid += calculatePrepayments(data.requests);
    }

    // 2️⃣ Części z pojazdu
    const usageRes = await fetch(`/api/inventory/personal/history?orderId=${visit.visitId}`);
    if (usageRes.ok) {
      const data = await usageRes.json();
      if (data.success && data.usageHistory) {
        data.usageHistory.forEach(usage => {
          totalPartsCost += usage.totalValue || 0;
        });
      }
    }

    // Auto-fill
    setPartsCost(totalPartsCost.toFixed(2));
    setPrepaidAmount(totalPrepaid.toFixed(2));
  };

  loadPartRequestsAndVehicleParts();
}, [visit?.visitId]);
```

**Wynik:**
- Pole "Koszt części" automatycznie zawiera sumę: zamówienia + pojazd
- Pole "Zaliczka" automatycznie zawiera sumę przedpłat

---

## 🚀 Workflow Użytkownika

### Scenariusz A: Użycie części podczas wizyty

1. Serwisant otwiera wizytę `VISIT-001`
2. Widzi urządzenie wymagające naprawy
3. Klik **"🚗 Użyj część z pojazdu"**
4. Modal pokazuje magazyn pojazdu: 5 części dostępnych
5. Wybiera: **"Pompa odpływowa Samsung"** (dostępne: 2 szt)
6. Ustawia ilość: **1 szt**
7. Klik **"Użyj części"**
8. System:
   - Odejmuje 1 szt z magazynu pojazdu (pozostaje: 1 szt)
   - Zapisuje użycie w `part-usage.json`
   - Dodaje koszt 90 zł do wizyty
9. Sidebar wizyty pokazuje: **"🚗 Części z pojazdu: 1 szt - 90 zł"**
10. Przy zakończeniu wizyty CompletionWizard auto-fill:
    - Koszt części: **90 zł** (z pojazdu)
    - Robocizna: **100 zł** (ręcznie)
    - **RAZEM: 190 zł**

---

### Scenariusz B: Kombinacja zamówień + pojazd

1. Serwisant zamawia: **Filtr** z magazynu centralnego (150 zł)
2. Następnie używa: **Pompę** z pojazdu (90 zł)
3. Przy zakończeniu wizyty CompletionWizard auto-fill:
   - **Zamówienia:** 150 zł
   - **Pojazd:** 90 zł
   - **Koszt części RAZEM:** 240 zł
4. Dodaje robociznę: **120 zł**
5. **ŁĄCZNA KWOTA:** 360 zł

---

### Scenariusz C: Low stock alert

1. Serwisant ma **1 szt** pompy w pojeździe
2. Używa **1 szt** podczas wizyty
3. System:
   - Odejmuje → **pozostaje: 0 szt**
   - Usuwa część z magazynu pojazdu
   - **Wysyła notyfikację do logistyka:**
     ```
     ⚠️ Low stock alert!
     Jan Kowalski zużył ostatnie: Pompa odpływowa Samsung
     Stan magazynu: 0
     ```
4. Logistyk widzi alert w panelu i przypisuje nową partię

---

## ⚙️ Konfiguracja

### Wymagane pliki danych:

**1. personal-inventories.json**
```bash
# Lokalizacja
data/personal-inventories.json

# Struktura początkowa
[]
```

**2. part-usage.json**
```bash
# Lokalizacja
data/part-usage.json

# Struktura początkowa
[]
```

**3. notifications.json**
```bash
# Lokalizacja
data/notifications.json

# Struktura początkowa
[]
```

---

## 🧪 Testowanie

### Test 1: Podstawowe użycie części

```bash
# 1. Zaloguj się jako serwisant
# 2. Otwórz wizytę: http://localhost:3000/technician/visit/VISIT-001
# 3. Klik "🚗 Użyj część z pojazdu"
# 4. Wybierz część i ustaw ilość
# 5. Klik "Użyj części"
# 6. Sprawdź:
#    - Alert sukcesu
#    - Sekcja "🚗 Części z pojazdu" w sidebar
#    - Magazyn pojazdu zmniejszony (moj-magazyn.js)
```

**Expected result:**
- ✅ Modal zamyka się
- ✅ Alert: "✅ Użyto X części z magazynu pojazdu!"
- ✅ Sidebar pokazuje użyte części
- ✅ Magazyn pojazdu: ilość zmniejszona

---

### Test 2: Auto-fill w CompletionWizard

```bash
# 1. Użyj części z pojazdu (np. 90 zł)
# 2. Zamów część z magazynu (np. 150 zł)
# 3. Klik "✅ Zakończ wizytę"
# 4. Sprawdź CompletionWizard:
#    - Krok "Finanse"
#    - Pole "Koszt części"
```

**Expected result:**
- ✅ Pole "Koszt części" = 240 zł (90 + 150)
- ✅ Console log: "✅ Auto-wypełniono koszt części: 240 zł (zamówienia + pojazd)"

---

### Test 3: Low stock alert

```bash
# 1. Ustaw część w magazynie pojazdu: quantity = 1
# 2. Użyj 1 szt tej części
# 3. Sprawdź:
#    - Response API: lowStockAlert: true
#    - Plik notifications.json: nowa notyfikacja
#    - Magazyn pojazdu: część usunięta
```

**Expected result:**
- ✅ API response: `{ lowStockAlert: true, outOfStockParts: ["Pompa"] }`
- ✅ notifications.json: nowa notyfikacja z type: "warning"
- ✅ Magazyn pojazdu: część nie widoczna (quantity = 0)

---

### Test 4: Niewystarczająca ilość

```bash
# 1. Magazyn pojazdu: Pompa (2 szt dostępne)
# 2. Próba użycia: 5 szt
# 3. Klik "Użyj części"
```

**Expected result:**
- ❌ API error 400
- ❌ Alert: "Niewystarczająca ilość części w magazynie"
- ❌ Details: "Żądane: 5, Dostępne: 2"

---

## 📈 Statystyki i Raporty

### Możliwe rozszerzenia:

**1. Raport zużycia części z pojazdu:**
```javascript
GET /api/inventory/personal/history?employeeId=EMP123&dateFrom=2025-10-01&dateTo=2025-10-31

Response:
{
  statistics: {
    totalUsages: 25,      // 25 razy używano części
    totalParts: 58,       // 58 sztuk części
    totalValue: 4500.00   // Wartość: 4500 zł
  }
}
```

**2. Top używane części:**
```javascript
// Group by partId, count quantity
const topParts = usageHistory
  .flatMap(u => u.parts)
  .reduce((acc, p) => {
    acc[p.partId] = (acc[p.partId] || 0) + p.quantity;
    return acc;
  }, {});
```

**3. Koszt części vs. Robocizna:**
```javascript
// Porównanie przychodów z części i robocizny
const partsCost = visits.reduce((sum, v) => sum + v.payment?.partsCost, 0);
const laborCost = visits.reduce((sum, v) => sum + v.payment?.laborCost, 0);
```

---

## 🔐 Bezpieczeństwo

### Autoryzacja:

**1. Universal Token:**
```javascript
// VehicleInventoryModal używa tokenHelper
import { getUniversalToken } from '../utils/tokenHelper';

const token = getUniversalToken();
fetch('/api/inventory/personal/use', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**2. Backend validation:**
```javascript
// API sprawdza token pracownika
const session = sessions.find(s => s.token === token && s.isValid);
if (!session) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**3. Walidacja danych:**
- Sprawdzenie dostępności części (quantity >= requested)
- Weryfikacja pracownika (employee exists)
- Walidacja części (part exists)

---

## 🐛 Znane Ograniczenia

1. **Brak Multi-Vehicle Support:**
   - Aktualnie: 1 serwisant = 1 pojazd
   - TODO: Rozszerzenie na wiele pojazdów

2. **Brak Bulk Operations:**
   - Można użyć tylko pojedyncze części (1 API call)
   - TODO: Batch use (wiele części jednocześnie)

3. **Brak Photo Upload w Modal:**
   - Brak możliwości zrobienia zdjęcia użytej części
   - TODO: Integracja z PhotoUploader

4. **Brak Gwarancji Tracking:**
   - Brak systemu śledzenia gwarancji części z pojazdu
   - TODO: Warranty management

---

## 📝 Changelog

### v1.0.0 (2025-10-06)
- ✅ VehicleInventoryModal component
- ✅ Integration with visit page
- ✅ Auto-fill in CompletionWizard
- ✅ Sidebar display of used parts
- ✅ Low stock alerts
- ✅ Full API implementation
- ✅ Documentation

---

## 🎓 Dalsze Kroki

### Faza 1: Podstawowa funkcjonalność ✅
- [x] Modal wyboru części
- [x] API use części
- [x] Auto-fill kosztów
- [x] Wyświetlanie w sidebar

### Faza 2: Rozszerzenia (TODO)
- [ ] Multi-vehicle support
- [ ] Bulk operations
- [ ] Photo upload
- [ ] Warranty tracking
- [ ] Advanced statistics
- [ ] Export do Excel/PDF

### Faza 3: Optymalizacja (TODO)
- [ ] Offline support (Service Worker)
- [ ] Predictive stocking (AI)
- [ ] Smart reordering
- [ ] Integration with suppliers

---

## 📞 Kontakt i Wsparcie

**Dokumentacja:** VEHICLE_INVENTORY_INTEGRATION.md  
**API Docs:** SYSTEM_MAGAZYNOWY_FINAL.md  
**Code Location:**
- Frontend: `components/technician/VehicleInventoryModal.js`
- Backend: `pages/api/inventory/personal/*.js`
- Integration: `pages/technician/visit/[visitId].js`

**Status:** ✅ PRODUCTION READY

---

## ✅ Podsumowanie

System integracji magazynu pojazdu z wizytami jest **w pełni funkcjonalny** i gotowy do użytku produkcyjnego. Umożliwia serwisantom:

- 🚗 Szybkie użycie części z pojazdu
- 💰 Automatyczne obliczanie kosztów
- 📊 Pełną historię użycia
- ⚠️ Alerty o niskich stanach
- 🔄 Integrację z CompletionWizard

**Next:** Test w środowisku produkcyjnym i zbieranie feedbacku od serwisantów!
