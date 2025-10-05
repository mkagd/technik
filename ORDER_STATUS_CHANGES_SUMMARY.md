# ✅ Ujednolicenie Statusów Zamówień - Podsumowanie

**Data:** 5 października 2025  
**Wersja:** 1.0.0

---

## 🎯 Cel zmian

Ujednolicenie statusów zamówień w całym systemie, aby zapewnić:
- ✅ Spójność danych
- ✅ Poprawne obliczanie dostępności w czasie rzeczywistym
- ✅ Jasny przepływ statusów w procesie rezerwacji → naprawa → ukończenie

---

## 📝 Zmiany w kodzie

### 1. **utils/clientOrderStorage.js** (linia 388)
```javascript
// PRZED:
status: reservationData.status || 'scheduled',

// PO:
status: reservationData.status || 'pending', // 📌 'pending' - nowa rezerwacja oczekująca na przydzielenie
```

**Powód:** Nowe rezerwacje powinny mieć status `'pending'` (oczekujące), a nie `'scheduled'` (zaplanowane).

---

### 2. **pages/api/availability.js**
**Dodano import:**
```javascript
import { ACTIVE_STATUSES } from '../../utils/orderStatusConstants';
```

**Zmieniono filtrowanie:**
```javascript
// PRZED:
const activeOrders = orders.filter(order => 
    ['pending', 'in_progress', 'scheduled'].includes(order.status)
);

// PO:
const activeOrders = orders.filter(order => 
    ACTIVE_STATUSES.includes(order.status)
);
```

**Powód:** Używamy stałych zamiast hardkodowanych stringów (łatwiejsza konserwacja).

---

## 📄 Nowe pliki

### 1. **ORDER_STATUS_DOCUMENTATION.md**
Pełna dokumentacja statusów zamówień zawierająca:
- Przepływ statusów (flow diagram)
- Szczegółowy opis każdego statusu
- Kiedy używać którego statusu
- Jak status wpływa na API availability
- Kolory statusów w UI
- Przyszłe rozszerzenia

### 2. **utils/orderStatusConstants.js**
Centralne miejsce dla wszystkich stałych związanych ze statusami:
- `ORDER_STATUS` - obiekt ze wszystkimi statusami
- `ACTIVE_STATUSES` - statusy aktywne (liczą się do obłożenia)
- `INACTIVE_STATUSES` - statusy nieaktywne
- `STATUS_LABELS` - etykiety w języku polskim
- `STATUS_COLORS` - kolory Tailwind CSS
- `STATUS_ICONS` - ikony emoji
- Funkcje pomocnicze: `isValidStatus()`, `canTransitionTo()`, etc.

---

## 🔄 Przepływ Statusów (po zmianach)

```
┌─────────────┐
│   pending   │  ← Nowa rezerwacja online (ZAMIAST 'scheduled')
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  scheduled  │  ← Admin przydzielił serwisanta + dokładny termin
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ in_progress │  ← Serwisant rozpoczął naprawę
└──────┬──────┘
       │
       ├──→ ┌─────────────┐
       │    │  completed  │  ← Naprawa zakończona
       │    └─────────────┘
       │
       └──→ ┌─────────────┐
            │  cancelled  │  ← Anulowane
            └─────────────┘
```

---

## 🎨 Statusy w UI

### Kolory (Tailwind CSS):

| Status | Kolor | Badge | Ikona |
|--------|-------|-------|-------|
| `pending` | Żółty | `bg-yellow-500` | ⏳ |
| `scheduled` | Niebieski | `bg-blue-500` | 📅 |
| `in_progress` | Fioletowy | `bg-purple-500` | 🔧 |
| `completed` | Zielony | `bg-green-500` | ✅ |
| `cancelled` | Czerwony | `bg-red-500` | ❌ |

---

## 🔍 Wpływ na API /api/availability

### Statusy AKTYWNE (liczą się do obłożenia):
```javascript
['pending', 'scheduled', 'in_progress']
```
Te zamówienia wpływają na obliczanie dostępności terminów.

### Statusy NIEAKTYWNE (nie liczą się):
```javascript
['completed', 'cancelled']
```
Te zamówienia są ignorowane przy obliczaniu dostępności.

---

## 📊 Przykład działania

### Scenariusz 1: Nowa rezerwacja
1. Klient wypełnia formularz na `/rezerwacja`
2. System tworzy zlecenie z **`status: 'pending'`** ✅
3. API `/api/availability` liczy je jako aktywne
4. Wpływa na obłożenie przedziałów czasowych

### Scenariusz 2: Przydzielenie terminu
1. Admin wchodzi do panelu `/admin/rezerwacje`
2. Przydziela serwisanta i ustawia datę
3. Zmienia status na **`'scheduled'`**
4. Zlecenie nadal jest aktywne w API

### Scenariusz 3: Zakończenie
1. Serwisant kończy naprawę
2. Status zmienia się na **`'completed'`**
3. ❌ Zlecenie przestaje być liczone w API availability
4. Nie wpływa już na obłożenie

---

## ✅ Weryfikacja

### Sprawdź czy działa:

1. **Utwórz nową rezerwację:**
   ```
   http://localhost:3000/rezerwacja
   ```
   - Wypełnij formularz i wyślij
   - Sprawdź w `data/orders.json` czy `status: "pending"`

2. **Sprawdź API availability:**
   ```bash
   curl -X POST http://localhost:3000/api/availability \
     -H "Content-Type: application/json" \
     -d '{"postalCode":"00-001","city":"Warszawa"}'
   ```
   - Powinna zwrócić realne czasy oczekiwania
   - Bazując na zleceniach z `status: pending, scheduled, in_progress`

3. **Sprawdź stałe:**
   ```javascript
   import { ORDER_STATUS, ACTIVE_STATUSES } from './utils/orderStatusConstants';
   console.log(ORDER_STATUS.PENDING); // 'pending'
   console.log(ACTIVE_STATUSES); // ['pending', 'scheduled', 'in_progress']
   ```

---

## 🚀 Następne kroki (opcjonalnie)

### Możliwe ulepszenia:

1. **Automatyczne przejścia statusów:**
   - Auto-zmiana `pending` → `scheduled` po przydzieleniu serwisanta
   - Auto-zmiana `scheduled` → `in_progress` w dniu wizyty

2. **Powiadomienia:**
   - Email/SMS przy zmianie statusu
   - Przypomnienia przed wizytą

3. **Walidacja w UI:**
   - Dropdown ze statusami pokazuje tylko dozwolone przejścia
   - Używa `canTransitionTo()` z `orderStatusConstants.js`

4. **Historia statusów:**
   - Zapisuj każdą zmianę statusu z timestamp
   - Kto zmienił i kiedy

5. **Dashboard analytics:**
   - Zlicz zamówienia po statusach
   - Średni czas w każdym statusie
   - Conversion rate `pending` → `completed`

---

## 📚 Linki do dokumentacji

- **Pełna dokumentacja:** `ORDER_STATUS_DOCUMENTATION.md`
- **Stałe i funkcje:** `utils/orderStatusConstants.js`
- **API Availability:** `pages/api/availability.js`
- **Tworzenie zamówień:** `utils/clientOrderStorage.js`

---

**✅ Wszystkie zmiany zostały wdrożone i przetestowane!**
