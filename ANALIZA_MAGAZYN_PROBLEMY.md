# 🔍 SZCZEGÓŁOWA ANALIZA SYSTEMU MAGAZYNOWEGO - PROBLEMY I ROZWIĄZANIA

**Data analizy:** 2025-01-XX  
**Status:** KRYTYCZNE PROBLEMY ZIDENTYFIKOWANE

---

## 📊 EXECUTIVE SUMMARY

### ❌ Główny problem
**PRACOWNICY NIE WIDZĄ SWOICH MAGAZYNÓW**, ponieważ system używa DWÓCH RÓŻNYCH STRUKTUR DANYCH, które NIE SĄ ZSYNCHRONIZOWANE:

1. **employees.json** → używany przez panel admina (`/admin/magazyn/magazyny`)
2. **personal-inventories.json** → używany przez panele pracowników (`/technician/magazyn/moj-magazyn`, `/serwis/magazyn/moj-magazyn`)

### 🔥 Krytyczne konsekwencje
- ✅ Admin dodaje części → zapisuje do `employees.json`
- ❌ Pracownik otwiera swój magazyn → czyta z `personal-inventories.json`
- ❌ Dane NIE SĄ SYNCHRONIZOWANE → pracownik widzi pusty magazyn lub stare dane

---

## 🏗️ ARCHITEKTURA OBECNEGO SYSTEMU

### 1️⃣ ŹRÓDŁA DANYCH

#### A) `data/employees.json`
```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "inventory": [
    {
      "partId": "PART003",
      "quantity": 1,
      "addedAt": "2025-10-04T22:21:25.862Z"
    },
    {
      "partId": "PART007",
      "quantity": 1,
      "addedAt": "2025-10-04T22:21:25.862Z",
      "transferredFrom": "EMP25189001"
    }
  ]
}
```
**Struktura:**
- Proste pole `inventory` w obiekcie pracownika
- Minimalne dane: `partId`, `quantity`, `addedAt`, opcjonalnie `transferredFrom`
- BRAK szczegółów: lokalizacja w aucie, cena, status, historia

**Używane przez:**
- ✅ `/admin/magazyn/magazyny.js` - panel admina (lista magazynów pracowników)
- ✅ `/api/employees/[id]/inventory.js` - API admina (dodawanie części)

**Stan danych:**
- EMP25189001 (Jan Kowalski): 6 części
- EMP25092001 (Jan Serwisant): 1 część
- EMP25092002 (Anna Technik): 1 część
- Pozostali: brak danych lub puste

---

#### B) `data/personal-inventories.json`
```json
{
  "id": "PI-001",
  "employeeId": "EMP25189001",
  "employeeName": "Jan Kowalski",
  "employeeRole": "LOGISTYK",
  "vehicle": "Ford Transit Custom - KR 12345",
  "parts": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 3,
      "assignedDate": "2025-10-01T10:00:00Z",
      "assignedBy": "LOG001",
      "assignedByName": "Jan Kowalski (Logistyk)",
      "location": "Schowek przedni",
      "status": "available"
    }
  ],
  "totalValue": 610.00,
  "lastUpdated": "2025-10-01T10:00:00Z",
  "statistics": {
    "totalParts": 9,
    "totalTypes": 3,
    "usedThisMonth": 5,
    "valueUsedThisMonth": 425.00
  }
}
```
**Struktura:**
- Osobny obiekt inwentarza dla każdego pracownika
- Bogate dane: lokalizacja w aucie, kto przypisał, historia użycia
- Statystyki: wartość, liczba użyć, historia miesięczna
- Szczegóły części: nazwa, numer katalogowy, cena

**Używane przez:**
- ✅ `/technician/magazyn/moj-magazyn.js` - panel technika
- ✅ `/serwis/magazyn/moj-magazyn.js` - panel serwisanta
- ✅ `/api/inventory/personal/index.js` - API pracowników (GET/POST)
- ✅ `/api/inventory/personal/use.js` - zużycie części
- ✅ `/api/inventory/personal/adjust.js` - korekty stanów
- ✅ `/api/inventory/personal/stats.js` - statystyki

**Stan danych:**
- PI-001: EMP25189001 (Jan Kowalski) - 3 rodzaje części, 9 szt total
- PI-002: EMP25189002 (Adam Nowak) - 4 rodzaje, 6 szt total
- PI-003: EMP25189003 (Tomek Wiśniewski) - 3 rodzaje, 10 szt total
- PI-004: EMP25189004 (Marek Kowal) - 3 rodzaje, 7 szt total
- PI-005: ADM001 (Anna Admin) - 2 rodzaje, 5 szt total

---

### 2️⃣ PRZEPŁYW DANYCH (OBECNIE - ZEPSUTA)

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DODAJE CZĘŚĆ                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   /admin/magazyn/magazyny.js
                   (Wybiera pracownika + części)
                              │
                              ▼
                   POST /api/employees/[id]/inventory
                              │
                              ▼
                   ┌──────────────────────────┐
                   │   employees.json         │ ✅ ZAPISANE
                   │   inventory: [...]       │
                   └──────────────────────────┘
                              │
                              ▼
                   ❌ BRAK SYNCHRONIZACJI ❌
                              │
                              ▼
                   ┌──────────────────────────┐
                   │ personal-inventories.json │ ❌ NIE ZAKTUALIZOWANE
                   └──────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            PRACOWNIK SPRAWDZA SWÓJ MAGAZYN                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   /serwis/magazyn/moj-magazyn.js
                   (Pracownik loguje się)
                              │
                              ▼
                   GET /api/inventory/personal?employeeId=XXX
                              │
                              ▼
                   Czyta personal-inventories.json
                              │
                              ▼
                   🚨 ZWRACA STARE/PUSTE DANE 🚨
                   (Nowo dodane części NIE SĄ WIDOCZNE)
```

---

### 3️⃣ SZCZEGÓŁY IMPLEMENTACJI

#### Panel Admina: `/admin/magazyn/magazyny.js`

**Co robi dobrze:**
- ✅ Wyświetla listę pracowników z ich magazynami
- ✅ Umożliwia dodawanie części do magazynów
- ✅ Ma modal "Dodaj części" z wyborem
- ✅ Zapisuje dane przez API

**Kod dodawania części:**
```javascript
const handleAddParts = async () => {
  // Iteruje przez wybrane części
  for (const partId of selectedParts) {
    const response = await fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partId, quantity: 1 })
    });
  }
};
```

**Problem:**
- ❌ Zapisuje do `employees.json` przez `/api/employees/[id]/inventory`
- ❌ NIE aktualizuje `personal-inventories.json`

---

#### API Admina: `/api/employees/[id]/inventory.js`

**Co robi:**
```javascript
export default async function handler(req, res) {
  const { id } = req.query;
  const { partId, quantity } = req.body;
  
  const employees = readEmployees();
  const employee = employees.find(emp => emp.id === id);
  
  // Inicjalizuj magazyn jeśli nie istnieje
  if (!employee.inventory) {
    employee.inventory = [];
  }
  
  // Sprawdź czy część już istnieje
  const existingItem = employee.inventory.find(item => item.partId === partId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    employee.inventory.push({
      partId,
      quantity,
      addedAt: new Date().toISOString()
    });
  }
  
  // Zapisz tylko do employees.json
  updateEmployee(id, { inventory: employee.inventory });
}
```

**Problem:**
- ❌ Zapisuje TYLKO do `employees.json`
- ❌ NIE synchronizuje z `personal-inventories.json`

---

#### Panel Pracownika: `/serwis/magazyn/moj-magazyn.js`

**Co robi dobrze:**
- ✅ Wyświetla magazyn pracownika z kartami części
- ✅ Pokazuje statystyki (total, wartość, low stock)
- ✅ Ma wyszukiwarkę części
- ✅ Ostrzega o niskich stanach

**Kod ładowania danych:**
```javascript
const loadInventory = async () => {
  setLoading(true);
  try {
    const res = await fetch(`/api/inventory/personal?employeeId=${employeeId}`);
    const data = await res.json();
    setInventory(data.inventory); // ← Bierze z personal-inventories.json
  } catch (error) {
    console.error('Error loading inventory:', error);
  } finally {
    setLoading(false);
  }
};
```

**Problem:**
- ❌ Czyta z `personal-inventories.json` przez `/api/inventory/personal`
- ❌ NIE ma dostępu do danych z `employees.json`
- ❌ Twardy kod employeeId w `/serwis/magazyn/moj-magazyn.js`:
  ```javascript
  const [employeeId] = useState('EMP25189002'); // TODO: Get from auth
  ```

---

#### API Pracownika: `/api/inventory/personal/index.js`

**Co robi:**
```javascript
export default function handler(req, res) {
  if (req.method === 'GET') {
    const { employeeId } = req.query;
    
    // Czyta personal-inventories.json
    const inventories = readJSON(personalInventoriesPath);
    const inventory = inventories.find(inv => inv.employeeId === employeeId);
    
    if (!inventory) {
      // Zwraca pusty magazyn jeśli nie znaleziono
      return res.status(200).json({ 
        success: true, 
        inventory: {
          inventoryId: `PI-${Date.now()}`,
          employeeId,
          employeeName: employee.name,
          parts: [],
          statistics: { totalParts: 0, totalValue: 0 }
        }
      });
    }
    
    return res.status(200).json({ success: true, inventory });
  }
}
```

**Problem:**
- ❌ Czyta TYLKO z `personal-inventories.json`
- ❌ NIE sprawdza `employees.json`
- ❌ Jeśli admin dodał części (do employees.json), API ich NIE WIDZI

---

## 🐛 ZIDENTYFIKOWANE PROBLEMY

### 🔴 PROBLEM #1: Brak synchronizacji danych
**Opis:** Dwa niezależne źródła danych nie komunikują się ze sobą

**Scenariusz:**
1. Admin otwiera `/admin/magazyn/magazyny`
2. Wybiera pracownika "Jan Kowalski"
3. Dodaje 5x "Pompa odpływowa" (PART002)
4. Dane zapisują się do `employees.json.inventory[]`
5. Jan Kowalski loguje się do `/serwis/magazyn/moj-magazyn`
6. System czyta `personal-inventories.json`
7. **Nowo dodane części NIE SĄ WIDOCZNE** 🚨

**Konsekwencje:**
- Pracownicy nie wiedzą co mają w magazynie
- Duplikują zamówienia
- Brak kontroli nad zapasami
- Chaos w planowaniu serwisu

---

### 🔴 PROBLEM #2: Twardo zakodowany employeeId w panelu serwisanta
**Lokalizacja:** `/serwis/magazyn/moj-magazyn.js:9`
```javascript
const [employeeId] = useState('EMP25189002'); // TODO: Get from auth
```

**Konsekwencje:**
- Każdy serwisant widzi magazyn pracownika EMP25189002 (Adam Nowak)
- Brak prawdziwej autoryzacji
- Niemożliwe przetestowanie dla innych pracowników

**Porównanie:**
- ✅ `/technician/magazyn/moj-magazyn.js` - pobiera z localStorage/auth token
- ❌ `/serwis/magazyn/moj-magazyn.js` - twardo zakodowane

---

### 🔴 PROBLEM #3: Niespójna struktura danych

**employees.json:**
```json
{
  "partId": "PART007",
  "quantity": 1,
  "addedAt": "2025-10-04T22:21:25.862Z"
}
```
- Brak: lokalizacji, ceny, nazwy części, statusu, kto przypisał

**personal-inventories.json:**
```json
{
  "partId": "PART007",
  "partNumber": "DC93-00155A",
  "name": "Grzałka pralki Samsung 2000W",
  "quantity": 2,
  "assignedDate": "2025-09-30T12:00:00Z",
  "assignedBy": "LOG001",
  "assignedByName": "Jan Kowalski (Logistyk)",
  "location": "Szuflada boczna",
  "status": "available"
}
```
- Kompletne dane: lokalizacja, historia, status, przypisanie

**Problem:**
- Panel admina nie zbiera wystarczających danych
- Migracja danych jest trudna bez metadanych

---

### 🟡 PROBLEM #4: Brak wsparcia dla lokalizacji w aucie

**Dla serwisu AGD KRYTYCZNE:**
- Pracownicy mają części w różnych miejscach w aucie (schowek przedni, boczny, bagażnik)
- Szybkie wyszukiwanie części wymaga wiedzy "gdzie w aucie"
- Panel admina NIE pyta o lokalizację przy dodawaniu

**Przykład:**
Adam Nowak ma w swoim magazynie:
- `PART001` → "Schowek przedni"
- `PART002` → "Schowek boczny"
- `PART003` → "Schowek przedni"
- `PART005` → "Tylny bagażnik"

Admin dodając nowe części NIE MOŻE określić lokalizacji → domyślnie trafia do "Schowek główny"

---

### 🟡 PROBLEM #5: Brak historii zmian i auditowania

**Co brakuje:**
- Kto dodał część (admin/logistyk)
- Kiedy dokładnie dodano
- Czy część pochodzi z zamówienia (supplierOrderId)
- Historia transferów między pracownikami
- Historia użycia (w jakiej naprawie)

**Obecny stan:**
- `employees.json` ma tylko `addedAt` i opcjonalnie `transferredFrom`
- `personal-inventories.json` ma `assignedBy`, `assignedDate`, `assignedByName`
- Brak szczegółowej historii zmian stanów

---

### 🟡 PROBLEM #6: Brak automatycznej synchronizacji przy dostawach

**Scenariusz biznesowy:**
1. Logistyk składa zamówienie do dostawcy (supplier-order)
2. Dostawa przyjeżdża → zmienia status na "DELIVERED"
3. System **powinien automatycznie** przypisać części do magazynów pracowników
4. **Obecnie:** trzeba ręcznie dodawać przez admin panel

**Kod istniejący (częściowy):**
`/api/supplier-orders/update-status.js` ma funkcję `autoAssignToEmployees()` która **powinna** aktualizować magazyny, ale:
- ❌ Najprawdopodobniej aktualizuje tylko `personal-inventories.json`
- ❌ NIE synchronizuje z `employees.json`

---

## 💡 REKOMENDOWANE ROZWIĄZANIA

### 🎯 ROZWIĄZANIE #1: Migracja do jednego źródła danych (LONG-TERM)

**Podejście:** Używaj TYLKO `personal-inventories.json`, usuń pole `inventory` z `employees.json`

**Zalety:**
- ✅ Jedno źródło prawdy (single source of truth)
- ✅ Bogatsza struktura danych
- ✅ Łatwiejsza konserwacja
- ✅ Mniejsze ryzyko rozsynchronizowania

**Wady:**
- ❌ Wymaga migracji istniejących danych
- ❌ Trzeba przepisać API admina
- ❌ Wszystkie moduły muszą używać tego samego API

**Kroki implementacji:**
1. Migruj dane z `employees.json.inventory` → `personal-inventories.json`
2. Przepisz `/api/employees/[id]/inventory` żeby używało `/api/inventory/personal`
3. Zaktualizuj `/admin/magazyn/magazyny.js` żeby czytało z personal-inventories
4. Usuń pole `inventory` z employees.json
5. Przetestuj wszystkie panele

**Priorytet:** ⭐⭐⭐⭐⭐ NAJLEPSZE ROZWIĄZANIE

---

### 🎯 ROZWIĄZANIE #2: Dwukierunkowa synchronizacja (MEDIUM-TERM)

**Podejście:** Utrzymaj oba pliki, ale synchronizuj przy każdej zmianie

**Implementacja:**
1. **Zmień `/api/employees/[id]/inventory.js`:**
```javascript
// Dodaj część do employees.json
updateEmployee(id, { inventory: employee.inventory });

// DODAJ: Synchronizuj z personal-inventories.json
await syncToPersonalInventories(employeeId, partId, quantity, {
  assignedBy: req.body.assignedBy || 'ADMIN',
  location: req.body.location || 'Schowek główny'
});
```

2. **Dodaj funkcję synchronizacji:**
```javascript
function syncToPersonalInventories(employeeId, partId, quantity, metadata) {
  const inventories = readJSON(personalInventoriesPath) || [];
  let inventory = inventories.find(inv => inv.employeeId === employeeId);
  
  if (!inventory) {
    // Utwórz nowy magazyn
    inventory = {
      inventoryId: `PI-${Date.now()}`,
      employeeId,
      employeeName: getEmployeeName(employeeId),
      vehicle: getEmployeeVehicle(employeeId),
      parts: [],
      statistics: { totalParts: 0, totalValue: 0 }
    };
    inventories.push(inventory);
  }
  
  // Znajdź lub dodaj część
  const existingPart = inventory.parts.find(p => p.partId === partId);
  
  if (existingPart) {
    existingPart.quantity += quantity;
    existingPart.lastRestocked = new Date().toISOString();
  } else {
    inventory.parts.push({
      partId,
      quantity,
      location: metadata.location,
      status: 'available',
      assignedBy: metadata.assignedBy,
      assignedDate: new Date().toISOString()
    });
  }
  
  // Przelicz statystyki
  updateStatistics(inventory);
  
  // Zapisz
  writeJSON(personalInventoriesPath, inventories);
}
```

3. **Zmień `/api/inventory/personal/index.js`:**
```javascript
// Przy zużyciu części → synchronizuj z employees.json
await syncToEmployeesJson(employeeId, partId, -quantity);
```

**Zalety:**
- ✅ Szybkie do wdrożenia
- ✅ Nie wymaga migracji danych
- ✅ Zachowuje kompatybilność wsteczną

**Wady:**
- ❌ Duplikacja danych
- ❌ Ryzyko rozsynchronizowania jeśli sync zawiedzie
- ❌ Większe zużycie dysku/pamięci

**Priorytet:** ⭐⭐⭐⭐ SZYBKIE ROZWIĄZANIE

---

### 🎯 ROZWIĄZANIE #3: Proxy API + Lazy Migration (QUICK FIX)

**Podejście:** Utrzymaj oba pliki, ale API czyta z OBUDWU i scala dane

**Implementacja `/api/inventory/personal/index.js`:**
```javascript
export default function handler(req, res) {
  if (req.method === 'GET') {
    const { employeeId } = req.query;
    
    // 1. Czytaj z personal-inventories.json
    const inventories = readJSON(personalInventoriesPath) || [];
    let inventory = inventories.find(inv => inv.employeeId === employeeId);
    
    // 2. Czytaj RÓWNIEŻ z employees.json
    const employees = readJSON(employeesPath) || [];
    const employee = employees.find(emp => emp.id === employeeId);
    
    // 3. Scal dane (employees.json ma pierwszeństwo dla nowszych)
    if (employee?.inventory && employee.inventory.length > 0) {
      if (!inventory) {
        // Utwórz magazyn z danych employees.json
        inventory = {
          inventoryId: `PI-${Date.now()}`,
          employeeId,
          employeeName: employee.name,
          vehicle: employee.vehicle || 'Brak pojazdu',
          parts: [],
          statistics: { totalParts: 0, totalValue: 0 }
        };
      }
      
      // Dodaj części z employees.json jeśli nie istnieją w personal-inventories
      employee.inventory.forEach(empPart => {
        const existingPart = inventory.parts.find(p => p.partId === empPart.partId);
        
        if (!existingPart) {
          // Nowa część z employees.json → dodaj z domyślnymi wartościami
          const partDetails = findPart(empPart.partId);
          inventory.parts.push({
            partId: empPart.partId,
            partNumber: partDetails?.partNumber || '',
            name: partDetails?.name || 'Nieznana część',
            quantity: empPart.quantity,
            assignedDate: empPart.addedAt,
            assignedBy: empPart.transferredFrom || 'ADMIN',
            location: 'Schowek główny',
            status: 'available'
          });
        } else {
          // Część istnieje → zaktualizuj ilość jeśli różnica
          if (empPart.quantity > existingPart.quantity) {
            existingPart.quantity = empPart.quantity;
          }
        }
      });
      
      // Przelicz statystyki
      updateStatistics(inventory);
    }
    
    return res.status(200).json({ success: true, inventory });
  }
}
```

**Zalety:**
- ✅ Natychmiastowa naprawa bez zmiany struktury
- ✅ Panel pracownika widzi WSZYSTKIE dane
- ✅ Łatwe do cofnięcia
- ✅ Nie wymaga zmian w innych API

**Wady:**
- ❌ Dane nadal są w dwóch miejscach
- ❌ Logika scalania może być skomplikowana
- ❌ Wolniejsze (czyta z dwóch plików)

**Priorytet:** ⭐⭐⭐ SZYBKA ŁATKA

---

### 🎯 ROZWIĄZANIE #4: Napraw autoryzację w panelu serwisanta

**Problem:** Twardo zakodowany employeeId

**Fix w `/serwis/magazyn/moj-magazyn.js`:**
```javascript
// PRZED:
const [employeeId] = useState('EMP25189002'); // TODO: Get from auth

// PO:
const [employee, setEmployee] = useState(null);

useEffect(() => {
  // Pobierz z localStorage (jak w /technician/magazyn/moj-magazyn.js)
  const employeeData = localStorage.getItem('serwisEmployee');
  
  if (!employeeData) {
    router.push('/serwis/login');
    return;
  }
  
  try {
    const emp = JSON.parse(employeeData);
    setEmployee(emp);
    loadInventory(emp.id);
  } catch (err) {
    console.error('Błąd parsowania danych pracownika:', err);
    router.push('/serwis/login');
  }
}, []);

const loadInventory = async (employeeId) => {
  // Reszta bez zmian...
};
```

**Priorytet:** ⭐⭐⭐⭐⭐ KRYTYCZNE (bezpieczeństwo)

---

### 🎯 ROZWIĄZANIE #5: Rozszerz panel admina o metadane

**Dodaj pola w modalu "Dodaj części" w `/admin/magazyn/magazyny.js`:**

```javascript
const [partMetadata, setPartMetadata] = useState({
  location: 'Schowek główny',
  notes: ''
});

// W modalu:
<div className="space-y-4">
  {/* Istniejący wybór części */}
  
  {/* NOWE: Lokalizacja */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Lokalizacja w aucie
    </label>
    <select
      value={partMetadata.location}
      onChange={(e) => setPartMetadata({...partMetadata, location: e.target.value})}
      className="w-full px-3 py-2 border rounded-lg"
    >
      <option>Schowek główny</option>
      <option>Schowek przedni</option>
      <option>Schowek boczny lewy</option>
      <option>Schowek boczny prawy</option>
      <option>Tylny bagażnik</option>
      <option>Szuflada główna</option>
      <option>Szuflada boczna</option>
    </select>
  </div>
  
  {/* NOWE: Notatki */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Notatki (opcjonalne)
    </label>
    <textarea
      value={partMetadata.notes}
      onChange={(e) => setPartMetadata({...partMetadata, notes: e.target.value})}
      className="w-full px-3 py-2 border rounded-lg"
      rows={3}
      placeholder="Np. 'Priorytet - brakuje w magazynie głównym'"
    />
  </div>
</div>
```

**Zaktualizuj API call:**
```javascript
const handleAddParts = async () => {
  for (const partId of selectedParts) {
    await fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partId,
        quantity: 1,
        location: partMetadata.location,  // NOWE
        notes: partMetadata.notes,        // NOWE
        assignedBy: 'ADMIN'                // NOWE
      })
    });
  }
};
```

**Priorytet:** ⭐⭐⭐⭐ WAŻNE (UX)

---

## 📋 PLAN NAPRAWY (REKOMENDOWANY)

### 🚨 FAZA 1: QUICK FIXES (1-2 godziny)

#### ✅ Task 1.1: Napraw autoryzację w panelu serwisanta
- **Plik:** `/serwis/magazyn/moj-magazyn.js`
- **Zmiana:** Usuń twardo zakodowany employeeId, pobierz z localStorage
- **Test:** Zaloguj się jako różni pracownicy, sprawdź czy każdy widzi swój magazyn

#### ✅ Task 1.2: Dodaj proxy w API (lazy sync)
- **Plik:** `/api/inventory/personal/index.js`
- **Zmiana:** Czytaj z employees.json ORAZ personal-inventories.json, scalaj dane
- **Test:** Admin dodaje część → pracownik od razu widzi w swoim panelu

---

### ⚙️ FAZA 2: MEDIUM FIXES (2-4 godziny)

#### ✅ Task 2.1: Dodaj synchronizację w API admina
- **Plik:** `/api/employees/[id]/inventory.js`
- **Zmiana:** Po zapisie do employees.json → automatycznie aktualizuj personal-inventories.json
- **Test:** Dodaj część przez admin → sprawdź czy oba pliki są zaktualizowane

#### ✅ Task 2.2: Rozszerz panel admina o metadane
- **Plik:** `/admin/magazyn/magazyny.js`
- **Zmiana:** Dodaj pola: lokalizacja, notatki, assignedBy
- **Test:** Dodaj część z lokalizacją → sprawdź czy pracownik widzi lokalizację

#### ✅ Task 2.3: Napraw panel admina żeby czytał z personal-inventories
- **Plik:** `/admin/magazyn/magazyny.js`
- **Zmiana:** Zamień `employee.inventory` na wywołanie `/api/inventory/personal?employeeId=XXX`
- **Test:** Admin widzi TĘ SAMĄ listę co pracownik w swoim panelu

---

### 🏗️ FAZA 3: LONG-TERM REFACTOR (4-8 godzin)

#### ✅ Task 3.1: Migruj dane
- **Skrypt:** Nowy plik `migrate-inventory-to-personal.js`
- **Działanie:**
  1. Czytaj `employees.json`
  2. Dla każdego pracownika z inventory:
     - Znajdź/utwórz w `personal-inventories.json`
     - Przenieś części z employees.inventory → personal-inventories.parts
     - Uzupełnij metadane (assignedDate = addedAt, location = "Schowek główny")
     - Przelicz statystyki
  3. Zapisz zaktualizowane personal-inventories.json
  4. Usuń pole `inventory` z employees.json

#### ✅ Task 3.2: Przepisz API admina
- **Plik:** `/api/employees/[id]/inventory.js`
- **Zmiana:** Zamiast pisać do employees.json → używaj `/api/inventory/personal` (POST)
- **Test:** Wszystkie operacje działają jak wcześniej

#### ✅ Task 3.3: Dodaj auditowanie i historię
- **Nowy plik:** `data/inventory-history.json`
- **Struktura:**
```json
{
  "id": "HIST-001",
  "employeeId": "EMP25189001",
  "partId": "PART002",
  "action": "ADD",
  "quantity": 3,
  "performedBy": "ADMIN",
  "timestamp": "2025-10-05T10:00:00Z",
  "metadata": {
    "location": "Schowek przedni",
    "supplierOrderId": "SO-123",
    "notes": "Dostawa z zamówienia SO-123"
  }
}
```

#### ✅ Task 3.4: Automatyzacja przy dostawach
- **Plik:** `/api/supplier-orders/update-status.js`
- **Zmiana:** W funkcji `autoAssignToEmployees()`:
  1. Wywołaj `/api/inventory/personal` (POST) dla każdej części
  2. Dodaj `supplierOrderId` do metadanych
  3. Wyślij notyfikację do pracownika
  4. Zapisz do inventory-history.json

---

## 🧪 TESTY DO PRZEPROWADZENIA

### Test Case 1: Admin dodaje część → pracownik widzi natychmiast
1. Zaloguj się jako admin
2. Otwórz `/admin/magazyn/magazyny`
3. Wybierz pracownika "Jan Kowalski"
4. Dodaj część: PART002 (Pompa odpływowa), qty=3, lokalizacja="Schowek przedni"
5. Zaloguj się jako Jan Kowalski (serwisant)
6. Otwórz `/serwis/magazyn/moj-magazyn`
7. ✅ **OCZEKIWANE:** Część PART002 (3 szt) jest widoczna z lokalizacją "Schowek przedni"

### Test Case 2: Pracownik zużywa część → admin widzi zmniejszenie
1. Zaloguj się jako Jan Kowalski
2. Użyj API `/api/inventory/personal/use` → zużyj 1x PART002
3. Zaloguj się jako admin
4. Otwórz `/admin/magazyn/magazyny` → wybierz Jana Kowalskiego
5. ✅ **OCZEKIWANE:** PART002 ma teraz 2 szt (było 3)

### Test Case 3: Multi-user jednoczesne zmiany
1. Admin dodaje część do magazynu EMP001
2. JEDNOCZEŚNIE pracownik EMP001 używa części
3. ✅ **OCZEKIWANE:** Brak race condition, poprawna kolejność operacji

### Test Case 4: Dostawa → auto-assign
1. Logistyk składa zamówienie SO-123
2. Zmienia status na "DELIVERED"
3. System automatycznie przypisuje części do magazynów pracowników
4. ✅ **OCZEKIWANE:** Części widoczne w personal-inventories.json z supplierOrderId="SO-123"

### Test Case 5: Panel admina pokazuje aktualne stany
1. Pracownik ma 5x PART001 w personal-inventories.json
2. Admin otwiera `/admin/magazyn/magazyny`
3. ✅ **OCZEKIWANE:** Widzi 5x PART001, nie stare dane z employees.json

---

## 📊 PRIORYTETYZACJA

### 🔴 CRITICAL (Do naprawy NATYCHMIAST)
1. ✅ **Synchronizacja danych** → proxy w API (Task 1.2)
2. ✅ **Autoryzacja serwisant** → localStorage (Task 1.1)

### 🟠 HIGH (Do naprawy w tym tygodniu)
3. ✅ **Dwukierunkowa synchronizacja** → sync function (Task 2.1)
4. ✅ **Metadane w admin panel** → lokalizacja, notatki (Task 2.2)

### 🟡 MEDIUM (Do naprawy w tym miesiącu)
5. ✅ **Migracja do jednego źródła** → tylko personal-inventories (Task 3.1-3.2)
6. ✅ **Historia zmian** → auditowanie (Task 3.3)

### 🟢 LOW (Nice to have)
7. ✅ **Automatyzacja dostaw** → auto-assign (Task 3.4)
8. ✅ **Dashboard dla logistyki** → przegląd wszystkich magazynów
9. ✅ **Raporty i eksport** → CSV/PDF

---

## 🎯 SUKCES BĘDZIE OZNACZAŁ

✅ Pracownik widzi WSZYSTKIE części które admin dodał  
✅ Admin widzi AKTUALNY stan magazynu pracownika  
✅ Brak duplikacji danych między plikami  
✅ Każda zmiana jest auditowana (kto, kiedy, dlaczego)  
✅ System automatycznie przypisuje części z dostaw  
✅ Pracownicy wiedzą GDZIE w aucie mają części  
✅ Logistyka ma pełen przegląd wszystkich magazynów osobistych  

---

## 📞 NASTĘPNE KROKI

**PYTANIE DO KLIENTA:**

1. **Który plan naprawy preferujesz?**
   - A) Quick fix (proxy + lazy sync) → 1-2h
   - B) Medium (dwukierunkowa sync) → 2-4h
   - C) Long-term (migracja do personal-inventories) → 4-8h
   - D) Wszystkie po kolei (faza 1 → 2 → 3)

2. **Priorytet funkcjonalności:**
   - Czy lokalizacja w aucie jest MUST-HAVE czy NICE-TO-HAVE?
   - Czy automatyzacja dostaw jest pilna?
   - Czy historia zmian jest wymagana teraz czy później?

3. **Testy:**
   - Czy masz konta testowe dla różnych pracowników?
   - Czy mogę testować na produkcji czy jest środowisko dev?

**Zacznę implementację po twojej decyzji!** 🚀

