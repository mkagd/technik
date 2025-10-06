# 🔴 AKTUALIZACJA: SLOTY NIEDOSTĘPNOŚCI

**Data:** 6 października 2025  
**Wersja:** 2.0  
**Nowa funkcja:** Oznaczanie kiedy klient NIE MA GO (niedostępność)

---

## 🎯 CO SIĘ ZMIENIŁO?

### Poprzednio:
- ✅ Tylko sloty **dostępności** (zielone)
- ❌ Brak możliwości oznaczenia urlopu/wyjazdu
- ❌ Brak rozróżnienia "jestem" vs "nie ma mnie"

### Teraz:
- ✅ Sloty **dostępności** (zielone ✓)
- ✅ Sloty **niedostępności** (czerwone ✗)
- ✅ Pełne rozróżnienie wizualne i funkcjonalne
- ✅ Toggle do przełączania typu
- ✅ Dwa przyciski dodawania

---

## 📦 ZAKTUALIZOWANA STRUKTURA SLOTU

```javascript
{
  id: 1728123456789,
  type: 'available',              // ← NOWE POLE!
  // 'available' = JEST dostępny (zielony ✓)
  // 'unavailable' = NIE MA GO (czerwony ✗)
  
  dateFrom: '2025-10-06',
  dateTo: '2025-10-08',
  timeFrom: '08:00',
  timeTo: '20:00',
  notes: 'Dostępny w te dni'
}
```

---

## 🎨 ZMIANY W UI

### 1. Dwa Przyciski Dodawania

**Zamiast jednego:**
```
[+ Dodaj termin]
```

**Mamy dwa:**
```
[✓ Jestem]  [✗ Nie ma mnie]
  (zielony)    (czerwony)
```

### 2. Karty Slotów z Typem

**Slot dostępności (zielony):**
```
┌─────────────────────────────────────┐
│ ✓ Dostępny                         │ ← Badge
│                                     │
│ 6-8 października 2025               │
│ 08:00 - 20:00                       │
│ "Dostępny weekend"                  │
│                                     │
│ [Jestem dostępny] [Nie ma mnie]    │ ← Toggle
│ [Edytuj] [Usuń]                    │
└─────────────────────────────────────┘
```

**Slot niedostępności (czerwony):**
```
┌─────────────────────────────────────┐
│ ✗ Niedostępny                      │ ← Badge
│                                     │
│ 10-15 października 2025             │
│ 00:00 - 23:59                       │
│ "Urlop - Hiszpania"                 │
│                                     │
│ [Jestem dostępny] [Nie ma mnie]    │ ← Toggle
│ [Edytuj] [Usuń]                    │
└─────────────────────────────────────┘
```

### 3. Info Box na Dole

```
💡 Wskazówka:
Zielone sloty (✓) oznaczają kiedy JESTEŚ dostępny.
Czerwone sloty (✗) oznaczają kiedy NIE MA CIĘ 
(np. wyjazd, urlop, zobowiązania).
```

---

## 📝 PRZYKŁADY UŻYCIA

### Przykład 1: Urlop

**Scenariusz:** Klient wyjeżdża na urlop 10-15 października

```javascript
[
  {
    id: 1,
    type: 'unavailable',  // ← Czerwony
    dateFrom: '2025-10-10',
    dateTo: '2025-10-15',
    timeFrom: '00:00',
    timeTo: '23:59',
    notes: 'Urlop - wyjazd zagraniczny'
  }
]
```

**Interpretacja:** System nie powinien planować wizyty w tym okresie.

---

### Przykład 2: Generalnie dostępny + wyjątek

**Scenariusz:** Klient jest w domu cały październik, oprócz urlopu

```javascript
[
  {
    id: 1,
    type: 'available',    // ← Zielony
    dateFrom: '2025-10-01',
    dateTo: '2025-10-31',
    timeFrom: '08:00',
    timeTo: '20:00',
    notes: 'Generalnie dostępny'
  },
  {
    id: 2,
    type: 'unavailable',  // ← Czerwony
    dateFrom: '2025-10-10',
    dateTo: '2025-10-15',
    timeFrom: '00:00',
    timeTo: '23:59',
    notes: 'Wyjątek: urlop'
  }
]
```

**Interpretacja:** 
- Dostępny cały październik 8-20
- OPRÓCZ 10-15 października (urlop)

---

### Przykład 3: Złożone zobowiązania

**Scenariusz:** Klient ma wyjazdy służbowe i wizyty

```javascript
[
  {
    id: 1,
    type: 'available',
    dateFrom: '2025-10-01',
    dateTo: '2025-10-31',
    timeFrom: '08:00',
    timeTo: '20:00',
    notes: 'Standardowo w domu'
  },
  {
    id: 2,
    type: 'unavailable',
    dateFrom: '2025-10-05',
    dateTo: '2025-10-07',
    timeFrom: '00:00',
    timeTo: '23:59',
    notes: 'Wyjazd służbowy - Warszawa'
  },
  {
    id: 3,
    type: 'unavailable',
    dateFrom: '2025-10-12',
    dateTo: '2025-10-12',
    timeFrom: '08:00',
    timeTo: '12:00',
    notes: 'Wizyta u lekarza rano'
  },
  {
    id: 4,
    type: 'unavailable',
    dateFrom: '2025-10-20',
    dateTo: '2025-10-22',
    timeFrom: '00:00',
    timeTo: '23:59',
    notes: 'Weekend poza miastem'
  }
]
```

**Interpretacja:**
- ✅ Dostępny: cały październik 8-20
- ❌ Niedostępny: 5-7 paź (wyjazd), 12 paź rano (lekarz), 20-22 paź (weekend)

---

### Przykład 4: Tylko konkretne dni

**Scenariusz:** Klient zazwyczaj pracuje, ale może w konkretne dni

```javascript
[
  {
    id: 1,
    type: 'available',
    dateFrom: '2025-10-06',
    dateTo: '2025-10-06',
    timeFrom: '08:00',
    timeTo: '12:00',
    notes: 'Sobota - rano wolne'
  },
  {
    id: 2,
    type: 'available',
    dateFrom: '2025-10-10',
    dateTo: '2025-10-10',
    timeFrom: '18:00',
    timeTo: '20:00',
    notes: 'Środa wieczorem'
  }
]
```

**Interpretacja:** Tylko w te konkretne momenty klient może przyjąć technika.

---

## 🔄 JAK UŻYWAĆ?

### Dodawanie slotu dostępności (zielony)

1. Kliknij **"✓ Jestem"** (zielony przycisk)
2. Wybierz zakres dat
3. Wybierz godziny lub użyj presetu
4. Dodaj notatkę (opcjonalnie)
5. Zapisz slot

→ Slot pojawi się z **zieloną ramką** i znaczkiem **"✓ Dostępny"**

---

### Dodawanie slotu niedostępności (czerwony)

1. Kliknij **"✗ Nie ma mnie"** (czerwony przycisk)
2. Wybierz zakres dat (np. 10-15 października)
3. Ustaw cały dzień (00:00-23:59) lub konkretne godziny
4. Dodaj notatkę (np. "Urlop - Hiszpania")
5. Zapisz slot

→ Slot pojawi się z **czerwoną ramką** i znaczkiem **"✗ Niedostępny"**

---

### Przełączanie typu slotu

1. Po dodaniu slotu znajdź sekcję toggle:
   ```
   [Jestem dostępny] [Nie ma mnie]
   ```
2. Kliknij odpowiedni przycisk
3. Slot zmieni kolor i typ automatycznie

---

## 🧪 SCENARIUSZE TESTOWE

### Test 1: Dodanie slotu dostępności
1. Otwórz `/client/new-order`
2. Krok 3: Termin
3. Kliknij zielony **"✓ Jestem"**
4. Wybierz: 6-8 paź, 8-20, "Dostępny weekend"
5. Zapisz
6. **Sprawdź:**
   - ✓ Zielona ramka
   - ✓ Badge "✓ Dostępny"
   - ✓ Poprawne dane

---

### Test 2: Dodanie slotu niedostępności
1. Kliknij czerwony **"✗ Nie ma mnie"**
2. Wybierz: 10-15 paź, 0-24, "Urlop - Hiszpania"
3. Zapisz
4. **Sprawdź:**
   - ✓ Czerwona ramka
   - ✓ Badge "✗ Niedostępny"
   - ✓ Poprawne dane

---

### Test 3: Toggle typu
1. Dodaj slot jako "Jestem" (zielony)
2. Po zapisaniu kliknij **"Nie ma mnie"**
3. **Sprawdź:**
   - ✓ Ramka zmieniła się na czerwoną
   - ✓ Badge zmienił się na "✗ Niedostępny"
4. Kliknij ponownie **"Jestem dostępny"**
5. **Sprawdź:**
   - ✓ Ramka wróciła do zielonej
   - ✓ Badge wrócił do "✓ Dostępny"

---

### Test 4: Mieszane sloty
1. Dodaj 4 sloty:
   - Zielony: 1-31 paź, 8-20
   - Czerwony: 10-15 paź, cały dzień
   - Czerwony: 20 paź, 8-12
   - Zielony: 25 paź, cały dzień
2. **Sprawdź:**
   - ✓ Pierwsze i czwarty są zielone
   - ✓ Drugi i trzeci są czerwone
   - ✓ Wszystkie są na liście

---

### Test 5: Zapis w orders.json
1. Dodaj 2-3 sloty (mix typów)
2. Złóż zamówienie
3. Otwórz `data/orders.json`
4. **Sprawdź:**
   - ✓ Pole `availabilitySlots` istnieje
   - ✓ Każdy slot ma pole `type`
   - ✓ Wartości: 'available' lub 'unavailable'

---

## 🎯 KIEDY UŻYWAĆ?

### Używaj slotów DOSTĘPNOŚCI (zielony ✓) gdy:
- ✅ Chcesz zaznaczyć kiedy **JESTEŚ** w domu
- ✅ Określasz konkretne godziny dostępności
- ✅ Podajesz preferowane terminy

### Używaj slotów NIEDOSTĘPNOŚCI (czerwony ✗) gdy:
- ❌ Jesteś na urlopie
- ❌ Masz wyjazd służbowy
- ❌ Masz ważne zobowiązanie (lekarz, spotkanie)
- ❌ Wyjeżdżasz poza miasto
- ❌ Definitywnie NIE możesz przyjąć technika

---

## 🔧 TECHNICZNE SZCZEGÓŁY

### Dodane funkcje w FlexibleAvailabilitySelector.js

1. **Funkcja addSlot() z typem:**
```javascript
const addSlot = (type = 'available') => {
  const newSlot = {
    id: Date.now(),
    type: type,  // ← NOWE
    dateFrom: newSlotData.dateFrom,
    dateTo: newSlotData.dateTo,
    timeFrom: newSlotData.timeFrom,
    timeTo: newSlotData.timeTo,
    notes: newSlotData.notes
  };
  // ...
};
```

2. **Toggle typu slotu:**
```javascript
const toggleSlotType = (slotId, newType) => {
  const updated = value.map(slot =>
    slot.id === slotId ? { ...slot, type: newType } : slot
  );
  onChange(updated);
};
```

3. **Warunkowy styling:**
```javascript
{slot.type === 'available' ? (
  <div className="border-green-200 bg-green-50">...</div>
) : (
  <div className="border-red-200 bg-red-50">...</div>
)}
```

---

## 📊 ALGORYTM DOPASOWANIA (TODO)

### Przyszła logika:

```javascript
function canScheduleVisit(orderSlots, proposedDate, proposedTime) {
  // 1. Sprawdź sloty niedostępności
  const unavailableSlots = orderSlots.filter(s => s.type === 'unavailable');
  const isUnavailable = unavailableSlots.some(slot => 
    isDateTimeInSlot(proposedDate, proposedTime, slot)
  );
  
  if (isUnavailable) {
    return { canSchedule: false, reason: 'Klient niedostępny w tym terminie' };
  }
  
  // 2. Sprawdź sloty dostępności
  const availableSlots = orderSlots.filter(s => s.type === 'available');
  
  if (availableSlots.length === 0) {
    return { canSchedule: true, confidence: 'unknown' };
  }
  
  const isAvailable = availableSlots.some(slot =>
    isDateTimeInSlot(proposedDate, proposedTime, slot)
  );
  
  if (isAvailable) {
    return { canSchedule: true, confidence: 'high' };
  }
  
  return { canSchedule: true, confidence: 'low', warning: 'Poza deklarowaną dostępnością' };
}
```

---

## ✅ STATUS

- ✅ Pole `type` dodane do struktury slotu
- ✅ UI z dwoma przyciskami dodawania
- ✅ Toggle typu w kartach slotów
- ✅ Kolorystyka zielona/czerwona
- ✅ Info box z wyjaśnieniem
- ✅ Tryb compact
- ✅ Tryb full
- ✅ Zapis w orders.json
- ⏳ Panel admina - integracja (TODO)
- ⏳ Algorytm dopasowania (TODO)
- ⏳ Wykrywanie konfliktów (TODO)

---

## 📞 POTRZEBNA POMOC?

### Sprawdź:
1. Konsolę przeglądarki (F12)
2. Logi serwera (terminal)
3. `data/orders.json` - pole `type` w slotach

### Debug:
```javascript
// W komponencie FlexibleAvailabilitySelector
console.log('Current slots:', value);

// Każdy slot powinien mieć:
// - id: number
// - type: 'available' | 'unavailable'
// - dateFrom, dateTo, timeFrom, timeTo: string
// - notes: string
```

---

**Status:** ✅ GOTOWE DO TESTOWANIA  
**Data aktualizacji:** 6 października 2025, 23:00  
**Wersja:** 2.0 - Dual Type Slots
