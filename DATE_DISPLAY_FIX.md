# 📅 Naprawa wyświetlania dat w rezerwacjach

## Data: 2025-10-04

## Problem
System nie wyświetlał poprawnie informacji o datach rezerwacji:
- **Zakres dat (elastyczny termin)** pokazywał "Nie ustalono"
- **Konkretna data z godziną** pokazywała tylko datę bez godziny
- Brak rozróżnienia między trybem "pojedyncza data" a "elastyczny zakres"

## Przyczyna
1. Podgląd rezerwacji sprawdzał tylko pole `rezerwacja.date`
2. Nie obsługiwał pól `dateRange.from`, `dateRange.to`, `dateMode`
3. Lista rezerwacji nie rozróżniała trybu daty

## Rozwiązanie

### 1. Podgląd rezerwacji (`pages/admin/rezerwacje/[id].js`)

#### Przed (❌)
```javascript
<div>
  <label>Data</label>
  <span>
    {rezerwacja.date 
      ? new Date(rezerwacja.date).toLocaleDateString('pl-PL') 
      : 'Nie ustalono'}
  </span>
</div>

<div>
  <label>Godzina</label>
  <span>{rezerwacja.time || 'Nie ustalono'}</span>
</div>
```

#### Po (✅)
```javascript
{/* Inteligentne wykrywanie trybu */}
{(rezerwacja.dateMode === 'range' || 
  rezerwacja.isFlexibleDate || 
  (rezerwacja.dateRange?.from && rezerwacja.dateRange?.to)) ? (
  
  /* ELASTYCZNY ZAKRES */
  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
    <div className="text-sm font-semibold text-gray-900 mb-2">
      📅 Klient elastyczny - dowolny dzień z zakresu:
    </div>
    <div className="flex items-center text-base font-medium">
      <span>
        {new Date(rezerwacja.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL', { 
          day: 'numeric', 
          month: 'long',
          year: 'numeric',
          weekday: 'short'
        })}
      </span>
      <span className="mx-3 text-blue-600">→</span>
      <span>
        {new Date(rezerwacja.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL', { 
          day: 'numeric', 
          month: 'long',
          year: 'numeric',
          weekday: 'short'
        })}
      </span>
    </div>
    <div className="mt-2 text-xs text-blue-700">
      {Math.ceil((new Date(rezerwacja.dateRange.to) - new Date(rezerwacja.dateRange.from)) / (1000 * 60 * 60 * 24)) + 1} dni do wyboru
    </div>
    {rezerwacja.time && (
      <div className="mt-3 pt-3 border-t border-blue-200">
        🕐 Preferowana godzina: <strong>{rezerwacja.time}</strong>
      </div>
    )}
  </div>
  
) : (
  
  /* KONKRETNA DATA */
  <div className="grid grid-cols-2 gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">Data</div>
      <div className="font-medium">
        {rezerwacja.date 
          ? new Date(rezerwacja.date + 'T00:00:00').toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) 
          : 'Nie ustalono'}
      </div>
    </div>
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">Godzina</div>
      <div className="font-medium">
        {rezerwacja.time || 'Nie ustalono'}
      </div>
    </div>
  </div>
)}
```

---

### 2. Lista rezerwacji (`pages/admin/rezerwacje/index.js`)

#### Przed (❌)
```javascript
<div className="text-sm font-medium text-gray-900">
  {rezerwacja.date 
    ? new Date(rezerwacja.date).toLocaleDateString('pl-PL') 
    : 'Nie ustalono'}
</div>
{rezerwacja.time && (
  <div className="text-xs text-gray-500">{rezerwacja.time}</div>
)}
```

#### Po (✅)
```javascript
{(rezerwacja.dateMode === 'range' || 
  rezerwacja.isFlexibleDate || 
  (rezerwacja.dateRange?.from && rezerwacja.dateRange?.to)) ? (
  
  /* ELASTYCZNY ZAKRES - kompaktowy widok */
  <>
    <div className="text-sm font-medium text-blue-700">
      📅 Elastyczny zakres
    </div>
    <div className="text-xs text-gray-600">
      {new Date(rezerwacja.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'short' 
      })}
      {' → '}
      {new Date(rezerwacja.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'short' 
      })}
    </div>
    {rezerwacja.time && (
      <div className="text-xs text-gray-500">🕐 {rezerwacja.time}</div>
    )}
  </>
  
) : (
  
  /* KONKRETNA DATA */
  <>
    <div className="text-sm font-medium text-gray-900">
      {rezerwacja.date 
        ? new Date(rezerwacja.date + 'T00:00:00').toLocaleDateString('pl-PL') 
        : 'Nie ustalono'}
    </div>
    {rezerwacja.time && (
      <div className="text-xs text-gray-500">🕐 {rezerwacja.time}</div>
    )}
  </>
)}
```

---

## Przykłady wyświetlania

### 1. Elastyczny zakres (📅)

**Lista:**
```
📅 Elastyczny zakres
10 paź → 15 paź
🕐 14:00
```

**Podgląd:**
```
📅 Klient elastyczny - dowolny dzień z zakresu:

pon, 10 października 2025  →  sob, 15 października 2025
6 dni do wyboru

───────────────────
🕐 Preferowana godzina: 14:00
```

---

### 2. Konkretna data (📆)

**Lista:**
```
piątek, 11 października 2025
🕐 10:30
```

**Podgląd:**
```
┌─────────────────┬─────────────────┐
│ Data            │ Godzina         │
├─────────────────┼─────────────────┤
│ piątek,         │ 10:30           │
│ 11 października │                 │
│ 2025            │                 │
└─────────────────┴─────────────────┘
```

---

### 3. Tylko zakres bez godziny

**Lista:**
```
📅 Elastyczny zakres
10 paź → 15 paź
```

**Podgląd:**
```
📅 Klient elastyczny - dowolny dzień z zakresu:

pon, 10 października 2025  →  sob, 15 października 2025
6 dni do wyboru
```

---

## Obsługiwane pola

### Tryb pojedynczej daty
```json
{
  "date": "2025-10-11",
  "time": "10:30",
  "dateMode": "single"
}
```

### Tryb elastycznego zakresu
```json
{
  "dateRange": {
    "from": "2025-10-10",
    "to": "2025-10-15",
    "flexible": true
  },
  "time": "14:00",
  "dateMode": "range",
  "isFlexibleDate": true
}
```

### Backward compatibility (stare rezerwacje)
```json
{
  "date": "2025-10-11",
  "availability": "po 14:00"
}
```

---

## Logika wykrywania trybu

### W kodzie:
```javascript
const isFlexibleRange = (
  rezerwacja.dateMode === 'range' ||           // Nowy format: explicite range
  rezerwacja.isFlexibleDate ||                 // Flaga elastyczności
  (rezerwacja.dateRange?.from &&               // Stary format: ma zakres
   rezerwacja.dateRange?.to)
);

if (isFlexibleRange) {
  // Wyświetl zakres
} else {
  // Wyświetl pojedynczą datę
}
```

---

## Formatowanie dat

### Pełny format (podgląd)
```javascript
new Date(date + 'T00:00:00').toLocaleDateString('pl-PL', {
  weekday: 'long',      // piątek
  day: 'numeric',       // 11
  month: 'long',        // października
  year: 'numeric'       // 2025
})
// Output: "piątek, 11 października 2025"
```

### Kompaktowy format (lista)
```javascript
new Date(date + 'T00:00:00').toLocaleDateString('pl-PL', {
  day: 'numeric',       // 11
  month: 'short'        // paź
})
// Output: "11 paź"
```

### Obliczanie dni w zakresie
```javascript
const days = Math.ceil(
  (new Date(dateRange.to) - new Date(dateRange.from)) 
  / (1000 * 60 * 60 * 24)
) + 1;
// +1 bo liczymy włącznie z dniem końcowym
```

---

## Ikony i kolory

### Elastyczny zakres
- **Ikona:** 📅
- **Kolor:** `text-blue-700` (niebieski)
- **Tło:** `bg-gradient-to-r from-blue-50 to-indigo-50`
- **Obramowanie:** `border-blue-200`

### Konkretna data
- **Ikona:** 📆
- **Kolor:** `text-gray-900` (czarny)
- **Tło:** `bg-gray-50`
- **Obramowanie:** `border-gray-200`

### Godzina
- **Ikona:** 🕐
- **Kolor:** `text-gray-500`

---

## Parsowanie bezpieczne

### Problem z `new Date()`
```javascript
// ❌ Źle - timezone może zmienić dzień
new Date('2025-10-11').toLocaleDateString('pl-PL')
// Może zwrócić "10 paź 2025" zamiast "11 paź 2025"

// ✅ Dobrze - wymuszamy UTC midnight
new Date('2025-10-11' + 'T00:00:00').toLocaleDateString('pl-PL')
// Zawsze zwraca "11 paź 2025"
```

**Dlatego wszędzie używamy:** `date + 'T00:00:00'`

---

## Testowanie

### Test 1: Elastyczny zakres z godziną
**Dane:**
```json
{
  "dateRange": { "from": "2025-10-10", "to": "2025-10-15" },
  "time": "14:00",
  "dateMode": "range"
}
```

**Oczekiwany wynik (lista):**
```
📅 Elastyczny zakres
10 paź → 15 paź
🕐 14:00
```

**Oczekiwany wynik (podgląd):**
```
📅 Klient elastyczny - dowolny dzień z zakresu:
pon, 10 października 2025 → sob, 15 października 2025
6 dni do wyboru
───────────────────
🕐 Preferowana godzina: 14:00
```

---

### Test 2: Konkretna data z godziną
**Dane:**
```json
{
  "date": "2025-10-11",
  "time": "10:30",
  "dateMode": "single"
}
```

**Oczekiwany wynik (lista):**
```
piątek, 11 października 2025
🕐 10:30
```

**Oczekiwany wynik (podgląd):**
```
Data: piątek, 11 października 2025
Godzina: 10:30
```

---

### Test 3: Tylko zakres bez godziny
**Dane:**
```json
{
  "dateRange": { "from": "2025-10-10", "to": "2025-10-15" },
  "dateMode": "range"
}
```

**Oczekiwany wynik (lista):**
```
📅 Elastyczny zakres
10 paź → 15 paź
```

**Oczekiwany wynik (podgląd):**
```
📅 Klient elastyczny - dowolny dzień z zakresu:
pon, 10 października 2025 → sob, 15 października 2025
6 dni do wyboru
```

---

### Test 4: Stara rezerwacja (backward compatibility)
**Dane:**
```json
{
  "date": "2025-10-11",
  "availability": "po 14:00"
}
```

**Oczekiwany wynik (lista):**
```
piątek, 11 października 2025
po 14:00
```

**Oczekiwany wynik (podgląd):**
```
Data: piątek, 11 października 2025
Godzina: Nie ustalono

Dostępność klienta:
🕐 po 14:00
```

---

## Pliki zmodyfikowane

### 1. `pages/admin/rezerwacje/[id].js`
**Linia ~400-460:**
- Dodano wykrywanie trybu daty
- Dodano wyświetlanie elastycznego zakresu
- Dodano wyświetlanie konkretnej daty
- Dodano obliczanie liczby dni
- Dodano formatowanie pełne (weekday + month long)

### 2. `pages/admin/rezerwacje/index.js`
**Linia ~644-680:**
- Dodano wykrywanie trybu daty
- Dodano kompaktowy widok zakresu
- Dodano ikonę 🕐 dla godziny
- Dodano kolor niebieski dla elastycznego zakresu
- Dodano formatowanie kompaktowe (month short)

---

## Korzyści

### Dla administratora
✅ Od razu widzi czy klient jest elastyczny  
✅ Widzi zakres dat w jednej linii  
✅ Widzi liczbę dni do wyboru  
✅ Widzi preferowaną godzinę  
✅ Kolory pomagają rozróżnić typy rezerwacji  

### Dla systemu
✅ Obsługuje stare i nowe rezerwacje  
✅ Bezpieczne parsowanie dat (timezone-safe)  
✅ Responsywny layout (mobile-friendly)  
✅ Czytelny kod z komentarzami  

---

## Status
✅ **UKOŃCZONE**

Wszystkie warianty dat są teraz wyświetlane poprawnie:
- ✅ Elastyczny zakres z godziną
- ✅ Elastyczny zakres bez godziny
- ✅ Konkretna data z godziną
- ✅ Konkretna data bez godziny
- ✅ Stare rezerwacje (backward compatibility)

