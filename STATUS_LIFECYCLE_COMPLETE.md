# 🔄 Cykl życia statusów zamówień - Kompletna dokumentacja

**Data:** 12 października 2025  
**Wersja:** 2.0 (11 statusów)  
**Plik źródłowy:** `utils/orderStatusConstants.js`

---

## 📋 Wszystkie 11 statusów

### 1️⃣ **⏳ Oczekuje na kontakt** (`pending`)
- **Początek procesu** - nowa rezerwacja/zamówienie
- **Kolor:** 🟡 Żółty (`bg-yellow-100 text-yellow-800`)
- **Następne statusy:** contacted, unscheduled, scheduled, cancelled
- **Status aktywny:** ✅ TAK

### 2️⃣ **📞 Skontaktowano się** (`contacted`)
- Wstępny kontakt z klientem nawiązany
- **Kolor:** 🔵 Niebieski (`bg-blue-100 text-blue-800`)
- **Następne statusy:** scheduled, confirmed, cancelled
- **Status aktywny:** ✅ TAK

### 3️⃣ **📦 Nieprzypisane** (`unscheduled`)
- Zlecenie bez przypisania do technika/daty
- **Kolor:** 🟠 Pomarańczowy (`bg-orange-100 text-orange-800`)
- **Następne statusy:** scheduled, cancelled
- **Status aktywny:** ✅ TAK
- **Uwaga:** Status dodany w wersji 2.0 dla intelligent-planner

### 4️⃣ **📅 Umówiona wizyta** (`scheduled`)
- Przydzielony serwisant i termin wizyty
- **Kolor:** 🟣 Fioletowy (`bg-purple-100 text-purple-800`)
- **Następne statusy:** confirmed, unscheduled, in_progress, no_show, cancelled
- **Status aktywny:** ✅ TAK

### 5️⃣ **✅ Potwierdzona** (`confirmed`)
- Klient potwierdził wizytę
- **Kolor:** 🟢 Zielony (`bg-green-100 text-green-800`)
- **Następne statusy:** in_progress, no_show, cancelled
- **Status aktywny:** ✅ TAK

### 6️⃣ **🔧 W trakcie realizacji** (`in_progress`)
- Serwisant aktywnie pracuje nad zleceniem
- **Kolor:** 🔵 Indygo (`bg-indigo-100 text-indigo-800`)
- **Następne statusy:** waiting_parts, ready, completed, cancelled
- **Status aktywny:** ✅ TAK

### 7️⃣ **🔩 Oczekuje na części** (`waiting_parts`)
- Czeka na dostawę części zamiennych
- **Kolor:** 🟠 Pomarańczowy (`bg-orange-100 text-orange-800`)
- **Następne statusy:** in_progress, cancelled
- **Status aktywny:** ✅ TAK

### 8️⃣ **🎉 Gotowe do odbioru** (`ready`)
- Naprawa zakończona, czeka na odbiór przez klienta
- **Kolor:** 🟢 Teal (`bg-teal-100 text-teal-800`)
- **Następne statusy:** completed, cancelled
- **Status aktywny:** ❌ NIE (nie liczy się do obłożenia)

### 9️⃣ **✔️ Zakończone** (`completed`)
- Naprawa zakończona i odebrana przez klienta
- **Kolor:** 🟢 Zielony (`bg-green-100 text-green-800`)
- **Następne statusy:** BRAK (status końcowy)
- **Status aktywny:** ❌ NIE

### 🔟 **❌ Anulowane** (`cancelled`)
- Zlecenie/wizyta anulowana
- **Kolor:** 🔴 Czerwony (`bg-red-100 text-red-800`)
- **Następne statusy:** BRAK (status końcowy)
- **Status aktywny:** ❌ NIE

### 1️⃣1️⃣ **👻 Nie stawił się** (`no_show`)
- Klient nie przyszedł na umówioną wizytę
- **Kolor:** ⚫ Szary (`bg-gray-100 text-gray-800`)
- **Następne statusy:** scheduled (można umówić ponownie), cancelled
- **Status aktywny:** ❌ NIE

---

## 🔄 Diagram przepływu statusów

```
┌─────────────────────────────────────────────────────────────────────┐
│                          POCZĄTEK PROCESU                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ⏳ Oczekuje na kontakt (pending)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            📞 Skontaktowano  📦 Nieprzypisane   📅 Umówiona wizyta
                  się             (unscheduled)      (scheduled)
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                          ✅ Potwierdzona (confirmed)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              👻 Nie stawił   🔧 W trakcie      ❌ Anulowane
                  się          realizacji
                (no_show)     (in_progress)
                    │               │
                    │       ┌───────┼───────┐
                    │       ▼       ▼       ▼
                    │   🔩 Oczekuje  🎉 Gotowe  ✔️ Zakończone
                    │    na części  do odbioru  (completed)
                    │  (waiting_parts) (ready)
                    │       │           │
                    │       └───────────┘
                    │               │
                    └───────────────┼───────────────┐
                                    ▼               ▼
                              ✔️ Zakończone    ❌ Anulowane
                               (completed)      (cancelled)
                                    │               │
                                    ▼               ▼
                          ┌─────────────────────────┐
                          │     KONIEC PROCESU      │
                          └─────────────────────────┘
```

---

## 📊 Kategorie statusów

### ✅ **Statusy aktywne** (7 statusów)
Liczą się do obłożenia w API availability:
1. ⏳ `pending` - Oczekuje na kontakt
2. 📞 `contacted` - Skontaktowano się
3. 📦 `unscheduled` - Nieprzypisane
4. 📅 `scheduled` - Umówiona wizyta
5. ✅ `confirmed` - Potwierdzona
6. 🔧 `in_progress` - W trakcie realizacji
7. 🔩 `waiting_parts` - Oczekuje na części

### ❌ **Statusy nieaktywne** (4 statusy)
Nie liczą się do obłożenia:
1. 🎉 `ready` - Gotowe do odbioru
2. ✔️ `completed` - Zakończone
3. ❌ `cancelled` - Anulowane
4. 👻 `no_show` - Nie stawił się

---

## 🎯 Przykładowe przepływy

### Scenario 1: Happy Path (wszystko OK)
```
⏳ pending → 📞 contacted → 📅 scheduled → ✅ confirmed → 🔧 in_progress → 🎉 ready → ✔️ completed
```

### Scenario 2: Potrzebne części zamienne
```
⏳ pending → 📅 scheduled → 🔧 in_progress → 🔩 waiting_parts → 🔧 in_progress → ✔️ completed
```

### Scenario 3: Klient się nie stawił
```
⏳ pending → 📅 scheduled → ✅ confirmed → 👻 no_show → 📅 scheduled (ponownie) → ✔️ completed
```

### Scenario 4: Anulowanie
```
⏳ pending → 📞 contacted → 📅 scheduled → ❌ cancelled
```

### Scenario 5: Intelligent Planner
```
⏳ pending → 📦 unscheduled → 📅 scheduled (drag & drop) → 🔧 in_progress → ✔️ completed
```

---

## 💻 Przykłady kodu

### Sprawdzanie statusu
```javascript
import { ORDER_STATUS, isActiveStatus, isValidStatus } from '@/utils/orderStatusConstants';

// Sprawdź czy status jest aktywny
if (isActiveStatus(order.status)) {
  console.log('To zlecenie liczy się do obłożenia');
}

// Sprawdź czy status jest poprawny
if (!isValidStatus(order.status)) {
  console.error('Nieprawidłowy status!');
}
```

### Możliwe przejścia
```javascript
import { getNextStatuses, canTransitionTo } from '@/utils/orderStatusConstants';

// Pobierz dostępne następne statusy
const nextStatuses = getNextStatuses('scheduled');
// Zwraca: ['confirmed', 'unscheduled', 'in_progress', 'no_show', 'cancelled']

// Sprawdź czy można zmienić status
if (canTransitionTo('pending', 'completed')) {
  console.log('Można zmienić'); // ❌ FALSE - nie można od razu zakończyć
}

if (canTransitionTo('in_progress', 'completed')) {
  console.log('Można zmienić'); // ✅ TRUE - można zakończyć z w_trakcie
}
```

### Wyświetlanie statusu w UI
```javascript
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '@/utils/orderStatusConstants';

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status];
  const color = STATUS_COLORS[status];
  const icon = STATUS_ICONS[status];
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {icon} {label}
    </span>
  );
}

// Użycie:
<StatusBadge status="scheduled" />
// Renderuje: 🟣 "📅 Umówiona wizyta"
```

### Filtrowanie aktywnych zleceń
```javascript
import { ACTIVE_STATUSES } from '@/utils/orderStatusConstants';

// Pobierz tylko aktywne zlecenia
const activeOrders = orders.filter(order => 
  ACTIVE_STATUSES.includes(order.status)
);
```

---

## 🚀 API Integration

### Endpoint availability (obłożenie)
```javascript
// pages/api/availability.js
import { ACTIVE_STATUSES } from '@/utils/orderStatusConstants';

// Zliczaj tylko zlecenia z aktywnym statusem
const activeOrders = orders.filter(order => 
  ACTIVE_STATUSES.includes(order.status)
);
```

### Endpoint update status
```javascript
// pages/api/orders/[id].js
import { canTransitionTo, isValidStatus } from '@/utils/orderStatusConstants';

if (!isValidStatus(newStatus)) {
  return res.status(400).json({ error: 'Nieprawidłowy status' });
}

if (!canTransitionTo(currentStatus, newStatus)) {
  return res.status(400).json({ 
    error: `Nie można zmienić z ${currentStatus} na ${newStatus}` 
  });
}
```

---

## 🔍 Walidacja statusów

### Dozwolone przejścia (transitions)
| Z → Do | Możliwe przejścia |
|--------|------------------|
| `pending` → | contacted, unscheduled, scheduled, cancelled |
| `contacted` → | scheduled, confirmed, cancelled |
| `unscheduled` → | scheduled, cancelled |
| `scheduled` → | confirmed, unscheduled, in_progress, no_show, cancelled |
| `confirmed` → | in_progress, no_show, cancelled |
| `in_progress` → | waiting_parts, ready, completed, cancelled |
| `waiting_parts` → | in_progress, cancelled |
| `ready` → | completed, cancelled |
| `completed` → | *(brak - status końcowy)* |
| `cancelled` → | *(brak - status końcowy)* |
| `no_show` → | scheduled, cancelled |

---

## 📚 Powiązane pliki

### Plik źródłowy
- `utils/orderStatusConstants.js` - **JEDYNE ŹRÓDŁO PRAWDY** dla statusów

### Pliki używające statusów
- `pages/admin/zamowienia/index.js`
- `pages/admin/zamowienia/[id].js`
- `pages/admin/zamowienia/nowe.js`
- `pages/admin/rezerwacje/index.js`
- `pages/admin/rezerwacje/[id].js`
- `pages/admin/rezerwacje/nowa.js`
- `pages/admin/rezerwacje/nowa-compact.js`
- `pages/admin/rezerwacje/edytuj/[id].js`
- `components/planner/IntelligentWeekPlanner.js`
- `pages/api/orders/[id].js`

---

## 🐛 Troubleshooting

### Problem: Status nie przechodzi validacji
**Przyczyna:** Próba nielegalnego przejścia (np. `pending` → `completed`)  
**Rozwiązanie:** Użyj `getNextStatuses()` aby zobaczyć dozwolone przejścia

### Problem: Niewłaściwy kolor statusu
**Przyczyna:** Używasz starego hardcoded koloru  
**Rozwiązanie:** Importuj `STATUS_COLORS` z `orderStatusConstants.js`

### Problem: Brak ikony przy statusie
**Przyczyna:** Nie używasz `STATUS_ICONS`  
**Rozwiązanie:** Dodaj `{STATUS_ICONS[status]}` w komponencie

---

## ✅ Checklist przy dodawaniu nowego statusu

- [ ] Dodaj do `ORDER_STATUS` enum
- [ ] Dodaj do `ACTIVE_STATUSES` lub `INACTIVE_STATUSES`
- [ ] Dodaj label do `STATUS_LABELS`
- [ ] Dodaj kolor do `STATUS_COLORS`
- [ ] Dodaj ikonę do `STATUS_ICONS`
- [ ] Dodaj reguły przejść w `getNextStatuses()`
- [ ] Przetestuj w dropdown menu
- [ ] Zaktualizuj dokumentację
- [ ] Sprawdź kompilację (HTTP 200)

---

**Ostatnia aktualizacja:** 12 października 2025  
**Status:** ✅ Kompletny system 11 statusów wdrożony
