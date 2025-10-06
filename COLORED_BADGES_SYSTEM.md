# System Kolorowych Badge'ów - Dokumentacja

## 🎨 Kolory Badge'ów według Typu Notyfikacji

### System 3 kolorów:

```
🔴 CZERWONY (error)   - PILNE / BŁĄD / WYMAGA NATYCHMIASTOWEJ UWAGI
🟡 ŻÓŁTY (info)       - INFORMACJA / DO ZROBIENIA / NORMALNA UWAGA
🟢 ZIELONY (success)  - SUKCES / UKOŃCZONE / POTWIERDZENIE
```

## 🎯 Priorytet Kolorów

Gdy w kategorii jest wiele notyfikacji różnych typów, badge przyjmuje kolor **najwyższego priorytetu**:

```
error > info > success
```

### Przykład:

```javascript
Kategoria: Magazyn
Notyfikacje:
  - 3x "Nowe zamówienie części" (type: info)
  - 1x "🔴 PILNE zamówienie części" (type: error)
  - 2x "✅ Zamówienie zrealizowane" (type: success)

Badge: 🔴 6  ← Czerwony, bo jest 1 notyfikacja error
```

## 📊 Implementacja

### 1. **Struktura Badge'a**

Badge to już nie liczba, ale **obiekt**:

```javascript
{
  count: 5,        // Liczba notyfikacji
  type: 'error'    // Typ określający kolor
}
```

### 2. **Helper Function - getBadgeColor**

```javascript
const getBadgeColor = (type) => {
  switch (type) {
    case 'error':
      return 'bg-red-500';    // 🔴 Czerwony
    case 'info':
      return 'bg-yellow-500'; // 🟡 Żółty
    case 'success':
      return 'bg-green-500';  // 🟢 Zielony
    default:
      return 'bg-blue-500';   // 🔵 Niebieski (fallback)
  }
};
```

### 3. **Algorytm Priorytetu**

```javascript
const getPriorityType = (notifs) => {
  if (notifs.some(n => n.type === 'error')) return 'error';
  if (notifs.some(n => n.type === 'info')) return 'info';
  if (notifs.some(n => n.type === 'success')) return 'success';
  return 'info';
};
```

### 4. **Renderowanie Badge'a**

```jsx
{item.badge && item.badge.count > 0 && (
  <span className={`
    ${getBadgeColor(item.badge.type)} 
    text-white text-xs font-bold 
    px-2 py-1 rounded-full 
    min-w-[1.5rem] text-center
  `}>
    {item.badge.count > 99 ? '99+' : item.badge.count}
  </span>
)}
```

## 🎭 Scenariusze Użycia

### Scenariusz 1: Pilne Zamówienie Części
```json
{
  "title": "🔴 PILNE Nowe zamówienie części",
  "type": "error",
  "link": "/admin/magazyn/zamowienia"
}
```
➡️ **Magazyn Badge:** 🔴 (Czerwony - wymaga natychmiastowej uwagi!)

---

### Scenariusz 2: Nowe Zgłoszenie
```json
{
  "title": "Nowa rezerwacja",
  "type": "info",
  "link": "/admin/rezerwacje"
}
```
➡️ **Zgłoszenia Badge:** 🟡 (Żółty - normalna informacja, do sprawdzenia)

---

### Scenariusz 3: Zamówienie Ukończone
```json
{
  "title": "✅ Zamówienie zrealizowane",
  "type": "success",
  "link": "/admin/magazyn/zamowienia"
}
```
➡️ **Magazyn Badge:** 🟢 (Zielony - wszystko OK, można sprawdzić w wolnej chwili)

---

### Scenariusz 4: Mix Typów
```javascript
Kategoria: Logistyka
Notyfikacje:
  - " Nowe zamówienie części" (type: info) 
  - "📦 Części zamówione" (type: success)
  - "🔴 PILNE zamówienie części" (type: error)
```
➡️ **Logistyka Badge:** 🔴 3 (Czerwony - priorytet error!)

## 💡 Zalety Systemu

### 1. **Intuicyjność** 🎯
Użytkownik od razu wie, co wymaga uwagi:
- 🔴 = "NATYCHMIAST!"
- 🟡 = "Zrób gdy masz czas"
- 🟢 = "Już zrobione, możesz sprawdzić"

### 2. **Priorytetyzacja** ⚡
System automatycznie pokazuje najważniejszy priorytet:
```
error > info > success
```

### 3. **Spójność** 🎨
Ten sam system kolorów co w notyfikacjach (dropdown):
```javascript
<div className={`w-2 h-2 rounded-full ${
  notif.type === 'error' ? 'bg-red-500' :
  notif.type === 'success' ? 'bg-green-500' :
  'bg-blue-500'
}`}></div>
```

## 🔄 Porównanie: PRZED vs PO

### PRZED:
```
📦 Magazyn  [🔴 5]  ← Zawsze czerwony, nawet jak OK
```
Użytkownik: *"O nie! Co się stało?!"* 😰

### PO:
```
📦 Magazyn  [🟢 3]  ← Zielony = wszystko OK
📦 Magazyn  [🟡 5]  ← Żółty = sprawdź jak masz czas
📦 Magazyn  [🔴 2]  ← Czerwony = PILNE!
```
Użytkownik: *"OK, wiem co robić!"* 😊

## 📋 Mapowanie Typów Notyfikacji

| Typ Notyfikacji | Przykład | Kolor Badge | Znaczenie |
|----------------|----------|-------------|-----------|
| `error` | 🔴 PILNE zamówienie części | 🔴 Czerwony | Wymaga natychmiastowej uwagi |
| `error` | 🚨 Express po deadline | 🔴 Czerwony | Błąd/problem do rozwiązania |
| `info` | Nowa rezerwacja | 🟡 Żółty | Normalna informacja |
| `info` | Nowe zamówienie części | 🟡 Żółty | Do sprawdzenia |
| `success` | ✅ Zamówienie zatwierdzone | 🟢 Zielony | Już zrobione |
| `success` | 📦 Części zamówione | 🟢 Zielony | Sukces operacji |

## 🛠️ Testowanie

### Test 1: Sprawdź kolory
```javascript
// Otwórz konsolę przeglądarki
const badge = { count: 5, type: 'error' };
console.log('Badge:', badge);
// Sprawdź czy wyświetla się czerwony
```

### Test 2: Priorytet
```javascript
// Dodaj notyfikacje różnych typów do tej samej kategorii
// Sprawdź czy badge przyjmuje kolor najwyższego priorytetu
```

### Test 3: Zmiana typu
```javascript
// Oznacz notyfikacje error jako przeczytane
// Sprawdź czy badge zmienia kolor na info/success
```

## 🐛 Troubleshooting

### Problem: Badge zawsze czerwony
**Przyczyna:** W kategorii jest notyfikacja typu `error`  
**Rozwiązanie:** Oznacz pilne notyfikacje jako przeczytane

### Problem: Badge nie zmienia koloru
**Przyczyna:** Cache przeglądarki  
**Rozwiązanie:** Ctrl+Shift+R (hard refresh)

### Problem: Badge nie wyświetla się
**Przyczyna:** `badge.count === 0`  
**Rozwiązanie:** Sprawdź czy są nieprzeczytane notyfikacje w kategorii

---

**Data utworzenia:** 2025-10-05  
**System:** Technik - Panel Administracyjny  
**Wersja:** 2.0 (Kolorowe Badge'y)
