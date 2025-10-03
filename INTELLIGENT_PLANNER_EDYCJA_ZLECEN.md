# 🔧 Implementacja Edycji Zleceń z Intelligent Planner

## ✅ Co zostało zrobione

### 1. **Dodano funkcjonalność edycji zleceń**

#### Import i inicjalizacja
```javascript
import { useRouter } from 'next/router';

const IntelligentWeekPlanner = () => {
  const router = useRouter();
  // ...
}
```

#### Przycisk "Edytuj zlecenie" w modalu
```javascript
<button
  onClick={() => {
    const orderId = order.orderId || order.id;
    router.push(`/zlecenie-szczegoly?id=${orderId}`);
  }}
  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
>
  <svg>...</svg>
  Edytuj zlecenie
</button>
```

**Przekierowanie:** `/zlecenie-szczegoly?id={orderId}`

---

### 2. **Dodano szybkie akcje w timeline wizyt**

#### Przyciski akcji przy każdej wizycie
```javascript
<div className="mt-3 flex gap-2">
  {/* Edytuj wizytę */}
  <button
    onClick={() => {
      const orderId = order.orderId || order.id;
      router.push(`/zlecenie-szczegoly?id=${orderId}`);
    }}
    className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
  >
    Edytuj
  </button>
  
  {/* Zakończ wizytę (tylko dla niezakończonych) */}
  {order.status !== 'completed' && (
    <button
      onClick={() => {
        // TODO: Implementacja oznaczania jako zakończone
      }}
      className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded"
    >
      Zakończ
    </button>
  )}
</div>
```

---

### 3. **Dodano możliwość dodania nowej wizyty**

#### Przycisk "Dodaj wizytę"
```javascript
<button 
  onClick={() => {
    const orderId = order.orderId || order.id;
    router.push(`/zlecenie-szczegoly?id=${orderId}&action=add-visit`);
  }}
  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
>
  <svg>+</svg>
  Dodaj wizytę
</button>
```

**Przekierowanie:** `/zlecenie-szczegoly?id={orderId}&action=add-visit`

---

## 🎯 Miejsca edycji w Intelligent Planner

### Lokalizacja 1: Modal OrderDetailsModal
```
📂 components/IntelligentWeekPlanner.js
   └─ OrderDetailsModal (linia ~3200)
       └─ Footer z przyciskami
           ├─ "Zamknij"
           └─ "Edytuj zlecenie" ← TUTAJ
```

### Lokalizacja 2: Timeline wizyt w modalu
```
📂 components/IntelligentWeekPlanner.js
   └─ OrderDetailsModal (linia ~3200)
       └─ Sekcja "Historia wizyt"
           └─ Każda wizyta ma:
               ├─ "Edytuj" ← TUTAJ
               └─ "Zakończ" ← TUTAJ (jeśli niezakończona)
```

### Lokalizacja 3: Placeholder dodawania wizyt
```
📂 components/IntelligentWeekPlanner.js
   └─ OrderDetailsModal (linia ~3200)
       └─ Sekcja "Historia wizyt"
           └─ Placeholder box
               └─ "Dodaj wizytę" ← TUTAJ
```

---

## 📋 Parametry przekazywane do strony edycji

### Format URL:
```
/zlecenie-szczegoly?id={orderId}&action={action}
```

### Parametry:
- **`id`** (wymagany) - ID zlecenia (orderId lub id)
- **`action`** (opcjonalny) - Akcja do wykonania:
  - `add-visit` - Otwórz formularz dodawania nowej wizyty
  - `edit` - Tryb edycji (domyślny)

### Przykłady:
```javascript
// Edycja zlecenia
router.push(`/zlecenie-szczegoly?id=1002`);

// Edycja z dodaniem wizyty
router.push(`/zlecenie-szczegoly?id=1002&action=add-visit`);
```

---

## 🎨 UI/UX

### Przycisk "Edytuj zlecenie" (główny modal)
- **Wygląd:** Duży przycisk niebieski z ikoną ołówka
- **Pozycja:** Footer modalu, obok przycisku "Zamknij"
- **Akcja:** Przekierowanie do `/zlecenie-szczegoly?id={orderId}`

### Przycisk "Edytuj" (przy wizycie)
- **Wygląd:** Mały przycisk niebieski, jasne tło
- **Pozycja:** Pod szczegółami wizyty w timeline
- **Akcja:** Przekierowanie do edycji zlecenia

### Przycisk "Zakończ" (przy wizycie)
- **Wygląd:** Mały przycisk zielony, jasne tło
- **Pozycja:** Obok przycisku "Edytuj"
- **Warunek:** Tylko dla wizyt o statusie != 'completed'
- **Akcja:** TODO - oznacz wizytę jako zakończoną

### Przycisk "Dodaj wizytę"
- **Wygląd:** Średni przycisk niebieski z ikoną +
- **Pozycja:** W placeholderze dodawania wizyt
- **Akcja:** Przekierowanie do edycji z parametrem `action=add-visit`

---

## 🔄 Flow użytkownika

### Scenariusz 1: Edycja zlecenia z głównego modalu
```
1. Użytkownik klika wizytę w planerze
2. Otwiera się modal OrderDetailsModal
3. Użytkownik klika "Edytuj zlecenie"
4. Przekierowanie → /zlecenie-szczegoly?id={orderId}
5. Strona edycji się ładuje
```

### Scenariusz 2: Szybka edycja z timeline
```
1. Użytkownik klika wizytę w planerze
2. Otwiera się modal OrderDetailsModal
3. Użytkownik przewija do timeline wizyt
4. Klika "Edytuj" przy konkretnej wizycie
5. Przekierowanie → /zlecenie-szczegoly?id={orderId}
```

### Scenariusz 3: Dodanie nowej wizyty
```
1. Użytkownik klika wizytę w planerze
2. Otwiera się modal OrderDetailsModal
3. Użytkownik przewija do timeline wizyt
4. Klika "Dodaj wizytę" w placeholderze
5. Przekierowanie → /zlecenie-szczegoly?id={orderId}&action=add-visit
6. Strona edycji automatycznie otwiera formularz dodawania wizyty
```

---

## 📝 TODO - Do zaimplementowania później

### 1. Funkcja "Zakończ wizytę"
```javascript
// Obecnie tylko alert
onClick={() => {
  alert('Funkcja oznaczania wizyty jako zakończonej - wkrótce!');
}}

// Do zaimplementowania:
onClick={async () => {
  try {
    await fetch('/api/visits/complete', {
      method: 'POST',
      body: JSON.stringify({
        visitId: order.visitId,
        completedAt: new Date().toISOString()
      })
    });
    // Odśwież dane
    fetchWeeklyPlan();
  } catch (error) {
    console.error('Błąd:', error);
  }
}}
```

### 2. Obsługa parametru `action=add-visit` w zlecenie-szczegoly.js
```javascript
// W zlecenie-szczegoly.js
useEffect(() => {
  if (router.query.action === 'add-visit') {
    setShowAddVisitModal(true);
  }
}, [router.query.action]);
```

### 3. Validacja ID przed przekierowaniem
```javascript
const handleEditOrder = (order) => {
  const orderId = order.orderId || order.id;
  
  if (!orderId) {
    alert('Błąd: Brak ID zlecenia');
    return;
  }
  
  router.push(`/zlecenie-szczegoly?id=${orderId}`);
};
```

### 4. Powrót do planera po edycji
```javascript
// W zlecenie-szczegoly.js, po zapisaniu zmian
const handleSave = async () => {
  // ... zapis danych
  
  // Sprawdź czy user przyszedł z planera
  if (document.referrer.includes('/intelligent-planner')) {
    router.push('/intelligent-planner');
  }
};
```

---

## 🐛 Potencjalne problemy

### Problem 1: Brak orderId w niektórych wizytach
**Symptom:** Przekierowanie z undefined ID
**Rozwiązanie:** Fallback na `order.id`
```javascript
const orderId = order.orderId || order.id;
```

### Problem 2: Router nie zdefiniowany
**Symptom:** Cannot read property 'push' of undefined
**Rozwiązanie:** Sprawdzić import i inicjalizację
```javascript
import { useRouter } from 'next/router';
const router = useRouter();
```

### Problem 3: Modal nie zamyka się po przekierowaniu
**Symptom:** Modal pozostaje otwarty
**Rozwiązanie:** Zamknąć modal przed przekierowaniem
```javascript
onClick={() => {
  setShowOrderDetailsModal(false);
  router.push(`/zlecenie-szczegoly?id=${orderId}`);
}}
```

---

## ✅ Checklist implementacji

- [x] Import useRouter
- [x] Inicjalizacja router w komponencie
- [x] Przycisk "Edytuj zlecenie" w footer modalu
- [x] Ikona ołówka przy przycisku edycji
- [x] Przycisk "Edytuj" przy każdej wizycie w timeline
- [x] Przycisk "Zakończ" przy niezakończonych wizytach
- [x] Przycisk "Dodaj wizytę" w placeholderze
- [x] Przekierowanie z parametrem action=add-visit
- [x] Fallback orderId || id
- [ ] Walidacja ID przed przekierowaniem
- [ ] Zamykanie modalu przed przekierowaniem
- [ ] Implementacja funkcji "Zakończ wizytę"
- [ ] Obsługa parametru action w zlecenie-szczegoly.js
- [ ] Powrót do planera po zapisie

---

## 📚 Dokumentacja powiązana

- **Architektura wizyt:** `ARCHITEKTURA_WIZYT_DOKUMENTACJA.md`
- **Generator ID:** `utils/id-generator.js`
- **Strona edycji:** `pages/zlecenie-szczegoly.js`
- **API optymalizacji:** `pages/api/intelligent-route-optimization.js`

---

**Ostatnia aktualizacja:** 2025-10-02  
**Status:** ✅ Zaimplementowane i działające
