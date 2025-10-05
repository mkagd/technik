# Ulepszenie: Multi-Select dla Dodawania Części do Magazynu

## 📋 Podsumowanie

Zaimplementowano system **wielokrotnego wyboru części** przy dodawaniu do magazynu pracownika. Teraz można zaznaczyć wiele części naraz, dla każdej ustawić osobną ilość, i dodać wszystkie jednocześnie.

---

## 🎯 Cel Zmiany

**Problem:** Użytkownik chciał móc dodać kilka części do magazynu pracownika w jednym kroku, zamiast klikać "Dodaj" wielokrotnie dla każdej części osobno.

**Rozwiązanie:** Zmiana z single-select (radio button style) na multi-select z checkboxami i osobnymi inputami dla ilości każdej części.

---

## 🔧 Zmiany Techniczne

### 1. **Zmiana State Management**

**Przed:**
```javascript
const [addPartData, setAddPartData] = useState({ partId: '', quantity: 1 });
```

**Po:**
```javascript
const [selectedParts, setSelectedParts] = useState([]); 
// Array of { partId, quantity }
```

### 2. **Nowe Funkcje Helper**

#### `togglePartSelection(partId)`
```javascript
const togglePartSelection = (partId) => {
  setSelectedParts(prev => {
    const exists = prev.find(p => p.partId === partId);
    if (exists) {
      // Remove if already selected
      return prev.filter(p => p.partId !== partId);
    } else {
      // Add with default quantity 1
      return [...prev, { partId, quantity: 1 }];
    }
  });
};
```

- Dodaje/usuwa część z listy zaznaczonych
- Domyślna ilość: 1 sztuka
- Toggle behavior (klik ponownie = odznacz)

#### `updatePartQuantity(partId, quantity)`
```javascript
const updatePartQuantity = (partId, quantity) => {
  setSelectedParts(prev => 
    prev.map(p => 
      p.partId === partId 
        ? { ...p, quantity: Math.max(1, quantity) } 
        : p
    )
  );
};
```

- Aktualizuje ilość dla konkretnej części
- Minimum: 1 sztuka (zabezpieczenie)
- Immutable update pattern

### 3. **Zmiana Logiki Dodawania**

**Przed:** `handleAddPart()` - dodawał 1 część
```javascript
const handleAddPart = async () => {
  const res = await fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
    method: 'POST',
    body: JSON.stringify({
      partId: addPartData.partId,
      quantity: addPartData.quantity
    })
  });
  // ...
};
```

**Po:** `handleAddParts()` - dodaje wiele części równolegle
```javascript
const handleAddParts = async () => {
  if (!selectedEmployee || selectedParts.length === 0) {
    alert('Wybierz przynajmniej jedną część!');
    return;
  }

  try {
    // Add all selected parts in parallel
    const promises = selectedParts.map(part => 
      fetch(`/api/employees/${selectedEmployee.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: part.partId,
          quantity: part.quantity
        })
      })
    );

    const results = await Promise.all(promises);
    const allSucceeded = results.every(res => res.ok);

    if (allSucceeded) {
      alert(`✅ Dodano ${selectedParts.length} części do magazynu!`);
      setShowAddModal(false);
      setSelectedParts([]);
      setPartSearchQuery('');
      loadData();
    } else {
      alert('❌ Błąd podczas dodawania niektórych części');
    }
  } catch (error) {
    console.error('Error adding parts:', error);
    alert('❌ Błąd: ' + error.message);
  }
};
```

**Kluczowe zmiany:**
- `Promise.all()` - równoległe wykonanie wszystkich requestów
- Walidacja: minimum 1 część
- Dynamiczny komunikat: pokazuje liczbę dodanych części
- Czyszczenie state po sukcesie

---

## 🎨 Zmiany UI

### 1. **Header Modal - Licznik Zaznaczonych**

**Przed:**
```jsx
<div className="mt-2 text-sm text-gray-500">
  Znaleziono: {getFilteredParts().length} części
</div>
```

**Po:**
```jsx
<div className="mt-2 flex items-center justify-between text-sm">
  <span className="text-gray-500">
    Znaleziono: {getFilteredParts().length} części
  </span>
  <span className="text-blue-600 font-medium">
    Zaznaczono: {selectedParts.length} części
  </span>
</div>
```

**Efekt:**
```
Znaleziono: 156 części          Zaznaczono: 3 części
```

### 2. **Grid Części - Checkboxy + Inline Quantity**

**Przed:** Click na card = select (radio behavior)
```jsx
<div onClick={() => setAddPartData({ ...addPartData, partId })}>
  {/* Card content */}
  {isSelected && <CheckmarkIcon />}
</div>
```

**Po:** Checkbox + input dla ilości
```jsx
<div className={isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}>
  <div className="flex space-x-4">
    {/* Checkbox */}
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => togglePartSelection(partId)}
      className="w-5 h-5 text-blue-600"
    />

    {/* Image - clickable */}
    <div onClick={() => togglePartSelection(partId)}>
      <img src={partImage} />
    </div>

    {/* Info */}
    <div>
      <div onClick={() => togglePartSelection(partId)}>
        {partName}
      </div>
      {/* ... inne info ... */}

      {/* Quantity input - only when selected */}
      {isSelected && (
        <div className="mt-3 flex items-center space-x-2">
          <label>Ilość:</label>
          <input
            type="number"
            min="1"
            value={selectedPart.quantity}
            onChange={(e) => updatePartQuantity(partId, parseInt(e.target.value) || 1)}
            onClick={(e) => e.stopPropagation()}
            className="w-20 px-3 py-1.5"
          />
          <span>szt</span>
        </div>
      )}
    </div>
  </div>
</div>
```

**Ważne szczegóły:**
- `onClick={(e) => e.stopPropagation()` - zapobiega toggle przy wpisywaniu liczby
- Input pojawia się **tylko gdy checkbox zaznaczony**
- Width: `w-20` (80px) - wystarczająco dla 3-4 cyfr
- Min: `1` - zabezpieczenie przed wartościami ≤ 0

### 3. **Footer - Podsumowanie Wyboru**

**Przed:** Jeden globalny input dla ilości
```jsx
<div className="flex items-end space-x-4">
  <div className="flex-1">
    <label>Ilość sztuk</label>
    <input type="number" value={addPartData.quantity} />
  </div>
  <button onClick={handleAddPart}>✓ Dodaj część</button>
  <button>Anuluj</button>
</div>
```

**Po:** Podsumowanie + przycisk z licznikiem
```jsx
<div className="p-6 border-t bg-gray-50">
  {/* Summary box - only when parts selected */}
  {selectedParts.length > 0 && (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-blue-900">
          Wybrane części ({selectedParts.length}):
        </span>
        <button onClick={() => setSelectedParts([])}>
          Wyczyść wszystkie
        </button>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {selectedParts.map(sp => {
          const partName = /* get name from parts array */;
          return (
            <div key={sp.partId} className="flex justify-between text-sm">
              <span className="truncate">{partName}</span>
              <span className="font-medium ml-2">
                {sp.quantity} szt
              </span>
            </div>
          );
        })}
      </div>
    </div>
  )}

  <div className="flex justify-end space-x-4">
    <button>Anuluj</button>
    <button 
      onClick={handleAddParts}
      disabled={selectedParts.length === 0}
    >
      ✓ Dodaj części ({selectedParts.length})
    </button>
  </div>
</div>
```

**Funkcje:**
- Lista wybranych części z ilościami
- "Wyczyść wszystkie" - szybkie odznaczenie
- Scroll: `max-h-32 overflow-y-auto` - gdy wiele części
- Przycisk disabled gdy nic nie zaznaczono
- Licznik na przycisku pokazuje ile części zostanie dodanych

---

## 📊 Przykład Użycia

### Scenariusz: Dodanie 3 części do magazynu Jana Kowalskiego

**Krok 1:** Kliknij "Dodaj" przy pracowniku
```
┌─────────────────────────────────────────────────┐
│ Dodaj część do magazynu                      [X]│
│ Serwisant: Jan Kowalski (EMP25189001)          │
│                                                 │
│ 🔍 [Szukaj części po nazwie, ID...]            │
│ Znaleziono: 156 części    Zaznaczono: 0 części │
└─────────────────────────────────────────────────┘
```

**Krok 2:** Zaznacz część 1 - Pasek napędowy
```
┌─────────────────────────────────────────────┐
│ [✓] 🖼️  Pasek napędowy HTD 3M            │
│         PAR202503001 • HTD-3M-450          │
│         [Pasy] [Napędowe]                  │
│         129 zł              ✓ 15 szt       │
│         Ilość: [3] szt                     │
└─────────────────────────────────────────────┘
```
- Checkbox ✓ zaznaczony
- Input "Ilość" pojawił się
- Border niebieski + tło niebieskie

**Krok 3:** Zaznacz część 2 - Filtr powietrza
```
┌─────────────────────────────────────────────┐
│ [✓] 🖼️  Filtr powietrza HEPA              │
│         PAR202503045                       │
│         [Filtry] [Powietrze]               │
│         89 zł               ✓ 23 szt       │
│         Ilość: [1] szt                     │
└─────────────────────────────────────────────┘
```

**Krok 4:** Zaznacz część 3 - Sprężyna drzwi
```
┌─────────────────────────────────────────────┐
│ [✓] 🖼️  Sprężyna drzwi uniwersalna        │
│         PAR202503089 • SPR-DZ-001          │
│         [Sprężyny]                         │
│         45 zł               ✓ 8 szt        │
│         Ilość: [2] szt                     │
└─────────────────────────────────────────────┘
```

**Krok 5:** Footer pokazuje podsumowanie
```
┌─────────────────────────────────────────────────┐
│ Wybrane części (3):         [Wyczyść wszystkie] │
│ ┌─────────────────────────────────────────────┐ │
│ │ Pasek napędowy HTD 3M            3 szt      │ │
│ │ Filtr powietrza HEPA             1 szt      │ │
│ │ Sprężyna drzwi uniwersalna       2 szt      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│           [Anuluj]  [✓ Dodaj części (3)]       │
└─────────────────────────────────────────────────┘
```

**Krok 6:** Kliknij "Dodaj części (3)"
```javascript
// 3 równoległe requesty:
POST /api/employees/EMP25189001/inventory
{ partId: "PAR202503001", quantity: 3 }

POST /api/employees/EMP25189001/inventory
{ partId: "PAR202503045", quantity: 1 }

POST /api/employees/EMP25189001/inventory
{ partId: "PAR202503089", quantity: 2 }

// Alert:
✅ Dodano 3 części do magazynu!
```

---

## ⚙️ Mechanizm Działania

### Toggle Część
```
User Action: Click checkbox OR click image OR click name
                        ↓
            togglePartSelection(partId)
                        ↓
        Sprawdź: czy część już zaznaczona?
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
         TAK: usuń             NIE: dodaj
    filter(p => p !== id)      [...prev, {id, qty: 1}]
            ↓                       ↓
     Checkbox unchecked      Checkbox checked
     Input znika             Input się pojawia
     Border szary            Border niebieski
```

### Update Ilość
```
User Action: Wpisz liczbę w input
                ↓
    updatePartQuantity(partId, value)
                ↓
    map przez selectedParts
                ↓
    Znajdź część po partId
                ↓
    Update quantity (min: 1)
                ↓
    Re-render input z nową wartością
```

### Dodaj Wszystkie
```
User Action: Click "Dodaj części (3)"
                    ↓
          handleAddParts()
                    ↓
    selectedParts.map(part => 
      fetch POST /api/employees/.../inventory
    )
                    ↓
        Promise.all(promises)
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
  Wszystkie OK             Niektóre błędy
    ↓                               ↓
  Alert sukces             Alert błąd
  Close modal              Modal pozostaje
  Clear state              State pozostaje
  Reload data              -
```

---

## 🎭 Interakcje Użytkownika

### Sposoby Zaznaczania Części

1. **Checkbox** - bezpośrednie kliknięcie
2. **Miniatura** - klik na obrazek
3. **Nazwa** - klik na nazwę części

Wszystkie 3 wywołują `togglePartSelection()`.

### Edycja Ilości

- Input pojawia się **tylko** gdy część zaznaczona
- `onClick={e => e.stopPropagation()}` - zapobiega odznaczeniu przy focus
- `onChange` natychmiast aktualizuje state
- Min: 1, Max: brak ograniczenia (może być 999+)

### Szybkie Akcje

- **Wyczyść wszystkie** - odznacza wszystkie części jednym klikiem
- **Licznik na przycisku** - pokazuje ile części zostanie dodanych
- **Lista wybranych** - widoczne podsumowanie przed zatwierdzeniem

---

## 🚀 Performance

### Równoległe Requesty

**Dlaczego Promise.all()?**
- 3 części = 3 requesty w ~100-200ms
- Sekwencyjnie: 3 × 100ms = 300ms
- Równolegle: max(100, 100, 100) = 100ms

**Trade-off:**
- ✅ Szybsze (3x)
- ❌ Wszystkie wykonują się nawet jeśli jeden fail
- ✅ `results.every(res => res.ok)` - sprawdza wszystkie wyniki

### Re-renders

**Optymalizacje:**
- `selectedParts.find(p => p.partId === partId)` - O(n) ale n małe (10-20 max)
- Checkbox `checked={isSelected}` - prosty boolean
- Input renderuje się **tylko** gdy zaznaczony
- Footer summary renderuje się **tylko** gdy są części

---

## 🐛 Edge Cases

### 1. Brak części zaznaczonych
```javascript
if (selectedParts.length === 0) {
  alert('Wybierz przynajmniej jedną część!');
  return;
}
```
+ Button disabled: `disabled={selectedParts.length === 0}`

### 2. Ilość < 1
```javascript
updatePartQuantity(partId, Math.max(1, quantity));
```
+ Input ma `min="1"` attribute

### 3. Niektóre requesty failują
```javascript
const allSucceeded = results.every(res => res.ok);
if (!allSucceeded) {
  alert('❌ Błąd podczas dodawania niektórych części');
  // Modal pozostaje otwarty - user może spróbować ponownie
}
```

### 4. Close modal bez save
```javascript
onClick={() => {
  setShowAddModal(false);
  setSelectedEmployee(null);
  setSelectedParts([]); // Clear selection
  setPartSearchQuery('');
}}
```
State czyszczony nawet jeśli user anuluje.

---

## 📱 Responsywność

### Desktop (≥ 1024px)
- Grid: `grid-cols-2` - 2 części obok siebie
- Checkbox + Image + Info + Quantity w jednym wierszu
- Footer summary: pełna szerokość

### Mobile (< 1024px)
- Grid: `grid-cols-1` - 1 część na wiersz
- Wszystkie elementy układają się pionowo
- Input "Ilość" zajmuje mniej miejsca: `w-20` (80px)

---

## 🔄 State Flow

### Initial State
```javascript
selectedParts = []
partSearchQuery = ""
showAddModal = false
selectedEmployee = null
```

### Po kliknięciu "Dodaj" (przy pracowniku)
```javascript
selectedParts = []
partSearchQuery = ""
showAddModal = true
selectedEmployee = { id: "EMP25189001", name: "Jan Kowalski", ... }
```

### Po zaznaczeniu 3 części
```javascript
selectedParts = [
  { partId: "PAR202503001", quantity: 3 },
  { partId: "PAR202503045", quantity: 1 },
  { partId: "PAR202503089", quantity: 2 }
]
```

### Po kliknięciu "Dodaj części"
```javascript
// Requesty wykonują się...
// Po sukcesie:
selectedParts = []
partSearchQuery = ""
showAddModal = false
selectedEmployee = null
// loadData() - odświeża listę
```

---

## ✅ Zalety Rozwiązania

1. **Szybkość** - dodanie 10 części w 1 operacji zamiast 10
2. **Wygoda** - widać wszystkie wybory przed zatwierdzeniem
3. **Kontrola** - każda część ma osobną ilość
4. **Feedback** - licznik pokazuje ile części jest zaznaczonych
5. **Bezpieczeństwo** - walidacja minimum 1 szt
6. **UX** - checkbox + klik na obrazek/nazwę
7. **Performance** - równoległe requesty (Promise.all)

---

## 📝 Notatki Implementacyjne

### Dlaczego Array zamiast Object?

**Rozważano:**
```javascript
// Option 1: Object
selectedParts = {
  "PAR001": { quantity: 3 },
  "PAR002": { quantity: 1 }
}

// Option 2: Array (WYBRANE)
selectedParts = [
  { partId: "PAR001", quantity: 3 },
  { partId: "PAR002", quantity: 1 }
]
```

**Wybrano Array bo:**
- ✅ Łatwe `.map()` do API calls
- ✅ Naturalny `.length` dla licznika
- ✅ Prosty `.filter()` do usuwania
- ✅ Kompatybilne z `.map()` w JSX
- ❌ Object wymaga `Object.entries()` etc.

### Dlaczego nie pojedynczy input?

**Poprzednie rozwiązanie:**
- Jeden input "Ilość" w footerze
- Dotyczyło wszystkich zaznaczonych części
- Problem: różne ilości dla różnych części

**Nowe rozwiązanie:**
- Każda część ma swój input
- Pojawia się tylko gdy zaznaczona
- Nie przeszkadza gdy niezaznaczona

---

## 🎬 Demo Flow

```
1. Admin otwiera /admin/magazyn/magazyny
2. Widzi listę 18 pracowników
3. Klik "Dodaj" przy "Jan Kowalski"
   → Modal się otwiera
4. Widzi 156 części w grid
5. Wpisuje "pasek" w search
   → Filtruje do 8 części
6. Zaznacza checkbox przy "Pasek HTD"
   → Border niebieski, input "Ilość" się pojawia
7. Wpisuje "3" w input
8. Zaznacza "Filtr HEPA"
   → Zostaje domyślna ilość: 1
9. Footer pokazuje:
   "Wybrane części (2):
    Pasek HTD - 3 szt
    Filtr HEPA - 1 szt"
10. Klik "Dodaj części (2)"
    → 2 requesty POST wykonują się
    → Alert: "✅ Dodano 2 części do magazynu!"
    → Modal zamyka się
    → Lista odświeża - Jan ma +3 paska, +1 filtr
```

---

## 🔗 Pliki Zmodyfikowane

1. **pages/admin/magazyn/magazyny.js** (862 linie)
   - State: `addPartData` → `selectedParts`
   - Funkcje: `handleAddPart` → `handleAddParts` + `togglePartSelection` + `updatePartQuantity`
   - UI: Single select → Multi-select checkboxy
   - Footer: Global input → Per-part inputs + summary

---

## 📚 API Pozostaje Bez Zmian

Endpoint: `POST /api/employees/[id]/inventory`

**Request:**
```json
{
  "partId": "PAR202503001",
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "inventory": [...]
}
```

Aplikacja wywołuje ten endpoint **wiele razy** (Promise.all), nie zmienia się API contract.

---

## 🎯 Rezultat

System magazynów pracowników jest teraz **znacznie wygodniejszy** dla użytkowników, którzy często muszą dodawać wiele części naraz (np. po odbiorze zamówienia z hurtowni). Zamiast 10 kliknięć → 1 operacja z podsumowaniem.

---

*Autor: AI Assistant*  
*Data: 2025-10-05*  
*Wersja: 1.0*
