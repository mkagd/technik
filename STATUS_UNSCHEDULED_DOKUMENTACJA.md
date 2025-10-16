# 📦 Status UNSCHEDULED - Dokumentacja

## Opis
Status **`unscheduled`** (nieprzypisane) oznacza zlecenie, które:
- ✅ Jest gotowe do przypisania
- ❌ Nie ma przypisanego technika (`assignedTo = null`)
- ❌ Nie ma ustalonej daty wizyty (`scheduledDate = null`)
- ❌ Nie ma utworzonej wizyty (`visits = []`)

## Kiedy jest ustawiany?

### 1. Automatycznie przez API (`pages/api/orders/[id].js`)
Gdy wysyłany jest PATCH request z:
```javascript
{
  assignedTo: null,
  scheduledDate: null,
  scheduledTime: null
}
```

**Skutek:**
- `status` → `'unscheduled'`
- `visits` → `[]` (usunięcie wizyty)

### 2. Automatycznie przez frontend (`IntelligentWeekPlanner.js`)
Gdy użytkownik przeciąga zlecenie z kalendarza z powrotem do panelu "Niezaplanowane":

**Akcja użytkownika:**
```
[Kalendarz Monday] → przeciągnij → [Panel Niezaplanowane]
```

**Kod:**
```javascript
// moveOrderToUnscheduled()
body: JSON.stringify({ 
  scheduledDate: null,
  scheduledTime: null,
  assignedTo: null,
  status: 'unscheduled'
})
```

## Cykl życia zlecenia

```
📝 pending (nowa rezerwacja)
    ↓
📦 unscheduled (gotowe do przypisania)
    ↓ [przypisz technika + datę]
📅 scheduled (umówiona wizyta)
    ↓ [technik rozpoczyna]
🔧 in_progress (w trakcie naprawy)
    ↓ [naprawa zakończona]
✅ completed (gotowe)
```

### Możliwe cofnięcia:
- `scheduled` → `unscheduled` (użytkownik przeciąga z kalendarza)
- `unscheduled` → `cancelled` (anulowanie zlecenia)

## Właściwości statusu

### W `orderStatusConstants.js`:
```javascript
ORDER_STATUS.UNSCHEDULED = 'unscheduled'

STATUS_LABELS.unscheduled = 'Nieprzypisane'
STATUS_ICONS.unscheduled = '📦'
STATUS_COLORS.unscheduled = {
  bg: 'bg-orange-100',
  text: 'text-orange-800',
  border: 'border-orange-300',
  badge: 'bg-orange-500'
}
```

### Aktywność:
- ✅ Jest w `ACTIVE_STATUSES` (liczony do obciążenia systemu)
- ✅ Pokazywany w IntelligentWeekPlanner
- ❌ NIE pokazywany w panelu wizyt technika (brak `assignedTo`)

## Różnice między statusami

| Status | assignedTo | scheduledDate | visits[] | Widoczny w kalendarzu |
|--------|-----------|---------------|----------|----------------------|
| `pending` | ❌ | ❌ | ❌ | Panel Niezaplanowane |
| **`unscheduled`** | ❌ | ❌ | ❌ | Panel Niezaplanowane |
| `scheduled` | ✅ | ✅ | ✅ | Kalendarz technika |
| `in_progress` | ✅ | ✅ | ✅ | Kalendarz technika |
| `completed` | ✅ | ✅ | ✅ | Archiwum |

## Przykłady użycia

### Backend - automatyczne ustawienie
```javascript
// pages/api/orders/[id].js
if (updateData.assignedTo === null || !updateData.scheduledDate) {
  updateData.status = 'unscheduled';
  updateData.visits = [];
}
```

### Frontend - filtrowanie
```javascript
// IntelligentWeekPlanner.js
const unscheduledOrders = orders.filter(order => 
  order.status === 'unscheduled' || 
  !order.assignedTo || 
  !order.scheduledDate
);
```

### UI - wyświetlanie
```jsx
{order.status === 'unscheduled' && (
  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
    📦 Nieprzypisane
  </span>
)}
```

## Transakcje statusów

### Dozwolone przejścia:
```javascript
getNextStatuses('unscheduled')
// → ['scheduled', 'cancelled']

getNextStatuses('scheduled')
// → ['unscheduled', 'in_progress', 'cancelled']
```

### Niedozwolone przejścia:
- ❌ `unscheduled` → `in_progress` (musi najpierw być `scheduled`)
- ❌ `unscheduled` → `completed` (musi przejść przez cały proces)
- ❌ `completed` → `unscheduled` (nie można cofnąć zakończonego)

## Testowanie

### Test 1: Przeciągnij zlecenie na kalendarz
```
1. Masz zlecenie ze statusem 'unscheduled' w panelu Niezaplanowane
2. Przeciągnij je na Monday 10:00
3. ✅ Status zmienia się na 'scheduled'
4. ✅ Tworzy się wizyta w visits[]
5. ✅ Ustawia się assignedTo, scheduledDate, scheduledTime
```

### Test 2: Cofnij zlecenie z kalendarza
```
1. Masz zlecenie ze statusem 'scheduled' w kalendarzu Monday
2. Przeciągnij je z powrotem do panelu Niezaplanowane
3. ✅ Status zmienia się na 'unscheduled'
4. ✅ Usuwa się wizyta z visits[]
5. ✅ Zerują się assignedTo, scheduledDate, scheduledTime
```

### Test 3: Sprawdź w bazie danych
```powershell
$orders = Get-Content "data\orders.json" -Raw | ConvertFrom-Json
$orders | Where-Object { $_.status -eq 'unscheduled' } | 
  Select-Object id, clientName, status, assignedTo, scheduledDate
```

## Integracja z innymi systemami

### Panel Wizyt (`/api/visits`)
- Zlecenia z statusem `unscheduled` **NIE są zwracane** (brak wizyt)
- Tylko zlecenia z `visits.length > 0` są widoczne

### Dashboard Statystyk
- Zlecenia `unscheduled` liczą się do "Oczekujących na planowanie"
- NIE liczą się do obciążenia konkretnego technika

### Panel Pracowników
- Zlecenia `unscheduled` **NIE są pokazywane** w harmonogramie technika
- Pokazywane dopiero po przypisaniu (`scheduled`)

## Migracja starych danych

Jeśli masz stare zlecenia bez statusu, ustaw je na `unscheduled`:

```javascript
// migrate-to-unscheduled.js
const fs = require('fs');
const orders = JSON.parse(fs.readFileSync('data/orders.json', 'utf8'));

orders.forEach(order => {
  if (!order.status && !order.assignedTo && !order.scheduledDate) {
    order.status = 'unscheduled';
    console.log(`Zmieniono ${order.id} na unscheduled`);
  }
});

fs.writeFileSync('data/orders.json', JSON.stringify(orders, null, 2));
```

## FAQ

**Q: Jaka różnica między `pending` a `unscheduled`?**
A: 
- `pending` = Nowa rezerwacja, jeszcze nie potwierdzona
- `unscheduled` = Potwierdzone zlecenie, gotowe do przypisania

**Q: Czy mogę ręcznie ustawić status na `unscheduled`?**
A: Tak, przez API lub edycję zlecenia, ale upewnij się że:
- `assignedTo = null`
- `scheduledDate = null`
- `visits = []`

**Q: Co jeśli zlecenie ma wizytę ale status = `unscheduled`?**
A: To niespójność! API automatycznie usuwa wizytę gdy ustawia `unscheduled`.

## Changelog

**2025-10-12:** Dodano status `unscheduled`
- ✅ Dodano do `orderStatusConstants.js`
- ✅ Dodano automatyczne ustawianie w API
- ✅ Dodano obsługę w IntelligentWeekPlanner
- ✅ Dodano kolory i ikony
- ✅ Dodano transakcje statusów

## Zobacz też

- `orderStatusConstants.js` - Definicje statusów
- `pages/api/orders/[id].js` - API dla zleceń
- `components/planner/IntelligentWeekPlanner.js` - Planner wizualny
- `ORDER_STATUS_DOCUMENTATION.md` - Dokumentacja wszystkich statusów
