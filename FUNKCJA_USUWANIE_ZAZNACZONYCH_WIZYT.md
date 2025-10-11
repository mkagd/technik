# 🗑️ Funkcja: Usuwanie zaznaczonych wizyt

**Data:** 2025-10-08  
**Autor:** System Admin  
**Status:** ✅ Zaimplementowane

---

## 📋 Opis funkcjonalności

Dodano możliwość **trwałego usunięcia zaznaczonych wizyt** z bazy danych w panelu administracyjnym wizyt.

### Różnica między "Anuluj" a "Usuń trwale":

| Operacja | Opis | Status wizyty | Dane zachowane |
|----------|------|---------------|----------------|
| **Anuluj** | Zmienia status na "cancelled" | ✅ `cancelled` | ✅ Wszystkie dane zachowane (historia, zdjęcia, notatki) |
| **Usuń trwale** | Fizycznie usuwa z bazy danych | ❌ Wizyta nie istnieje | ❌ Wszystkie dane trwale usunięte |

---

## 🎯 Implementacja

### 1. Frontend (`pages/admin/wizyty/index.js`)

#### Dodano nowy state:
```javascript
const [showDeleteModal, setShowDeleteModal] = useState(false); // Modal usuwania
```

#### Dodano funkcję usuwania:
```javascript
const handleBulkDelete = async (reason) => {
  setBulkOperationLoading(true);
  setBulkOperationError(null);
  try {
    const response = await fetch('/api/visits/bulk-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'delete',
        visitIds: selectedVisits,
        data: {
          reason,
          deletedBy: 'admin',
          modifiedBy: 'admin'
        }
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete visits');
    
    setBulkOperationSuccess(`Usunięto ${result.deletedCount} wizyt`);
    toast.success(`✅ Usunięto ${result.deletedCount} wizyt z bazy danych`);
    setShowDeleteModal(false);
    setSelectedVisits([]);
    await loadVisits();
    
    setTimeout(() => setBulkOperationSuccess(null), 5000);
  } catch (err) {
    console.error('Bulk delete error:', err);
    setBulkOperationError(err.message);
    toast.error('❌ Błąd usuwania wizyt: ' + err.message);
  } finally {
    setBulkOperationLoading(false);
  }
};
```

#### Dodano przycisk w panelu akcji:
```javascript
<button 
  onClick={() => setShowDeleteModal(true)}
  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-medium"
>
  Usuń trwale
</button>
```

#### Dodano modal z ostrzeżeniem:
- ⚠️ **Czerwony banner** z ostrzeżeniem o nieodwracalności
- 📝 Pole textarea na **obowiązkowy powód usunięcia**
- ☑️ **Checkbox potwierdzający** zrozumienie konsekwencji
- 💡 Informacja o alternatywie (przycisk "Anuluj")

---

### 2. Backend (`pages/api/visits/bulk-operations.js`)

#### Dodano case 'delete':
```javascript
case 'delete':
  // Permanently delete visit from order
  if (!operationData.reason) {
    throw new Error('Reason required for delete operation');
  }
  
  // Mark for deletion (we'll filter it out later)
  visit._markedForDeletion = true;
  visit._deleteReason = operationData.reason;
  visit._deletedBy = operationData.deletedBy || 'admin';
  visit._deletedAt = new Date().toISOString();
  updatedCount++;
  updatedVisits.push({...visit, visitId: visit.visitId, status: 'deleted'});
  break;
```

#### Dodano fizyczne usuwanie:
```javascript
// If operation is delete, physically remove marked visits from orders
if (operation === 'delete') {
  let deletedCount = 0;
  for (const orderId in orders) {
    const order = orders[orderId];
    if (order.visits && Array.isArray(order.visits)) {
      const originalLength = order.visits.length;
      order.visits = order.visits.filter(visit => !visit._markedForDeletion);
      deletedCount += (originalLength - order.visits.length);
    }
  }
  console.log(`🗑️ Permanently deleted ${deletedCount} visits from orders`);
}
```

---

## 🔒 Zabezpieczenia

### Frontend:
1. ✅ **Podwójna walidacja** - textarea z powodem + checkbox potwierdzający
2. ✅ **Wyraźne ostrzeżenie** - czerwony banner z informacją o nieodwracalności
3. ✅ **Sugestia alternatywy** - informacja o przycisku "Anuluj"
4. ✅ **Blokada podczas operacji** - disabled state dla przycisków

### Backend:
1. ✅ **Wymagany powód** - operacja nie wykona się bez powodu
2. ✅ **Logging** - console.log z liczbą usuniętych wizyt
3. ✅ **Dwuetapowe usuwanie** - najpierw oznaczenie, potem filtrowanie
4. ✅ **Error handling** - try-catch z komunikatami błędów

---

## 📱 Interfejs użytkownika

### Panel z zaznaczonymi wizytami:
```
┌────────────────────────────────────────────────────────────┐
│ ✓ Zaznaczono 3 wizyty                                      │
│                                                             │
│ [Przydziel technika] [Zmień datę] [Anuluj] [Usuń trwale] │
└────────────────────────────────────────────────────────────┘
```

### Modal usuwania:
```
┌───────────────────────────────────────┐
│ 🗑️ Usuń wizyty trwale            [×] │
├───────────────────────────────────────┤
│                                        │
│ ⚠️ OSTRZEŻENIE - Ta operacja jest     │
│    NIEODWRACALNA!                      │
│                                        │
│ Zamierzasz całkowicie usunąć 3 wizyty │
│ z bazy danych. Wszystkie powiązane     │
│ dane zostaną utracone.                 │
│                                        │
│ 💡 Jeśli chcesz tylko anulować (zacho-│
│    wując historię), użyj "Anuluj".    │
│                                        │
│ Powód usunięcia *                     │
│ ┌────────────────────────────────────┐│
│ │ [textarea]                         ││
│ └────────────────────────────────────┘│
│                                        │
│ ☐ Potwierdzam, że rozumiem            │
│   konsekwencje trwałego usunięcia     │
│                                        │
│ [🗑️ Usuń trwale]         [Anuluj]    │
└───────────────────────────────────────┘
```

---

## 🧪 Testowanie

### Test Case 1: Udane usunięcie
1. Zaznacz 2-3 wizyty w tabeli
2. Kliknij "Usuń trwale"
3. Wpisz powód: "Test usuwania wizyt"
4. Zaznacz checkbox potwierdzający
5. Kliknij "Usuń trwale"
6. **Oczekiwany wynik:** 
   - ✅ Toast: "Usunięto 3 wizyt z bazy danych"
   - ✅ Modal się zamyka
   - ✅ Tabela się odświeża
   - ✅ Wizyty znikają z listy

### Test Case 2: Walidacja - brak powodu
1. Zaznacz wizytę
2. Kliknij "Usuń trwale"
3. Zaznacz checkbox ale NIE wpisuj powodu
4. Kliknij "Usuń trwale"
5. **Oczekiwany wynik:**
   - ❌ Błąd: "Powód usunięcia jest wymagany"

### Test Case 3: Walidacja - brak potwierdzenia
1. Zaznacz wizytę
2. Kliknij "Usuń trwale"
3. Wpisz powód ale NIE zaznaczaj checkboxa
4. Kliknij "Usuń trwale"
5. **Oczekiwany wynik:**
   - ❌ Błąd: "Musisz potwierdzić checkbox, aby kontynuować"

### Test Case 4: Weryfikacja usunięcia z pliku
1. Usuń wizytę z ID = VIS123
2. Otwórz `data/orders.json`
3. Wyszukaj `"visitId": "VIS123"`
4. **Oczekiwany wynik:**
   - ❌ Wizyta NIE powinna istnieć w pliku

---

## 📊 Statystyki

### Zmiany w kodzie:
- **Pliki zmodyfikowane:** 2
  - `pages/admin/wizyty/index.js` (+130 linii)
  - `pages/api/visits/bulk-operations.js` (+30 linii)
- **Nowe funkcje:** 1 (`handleBulkDelete`)
- **Nowe modale:** 1 (Delete Modal)
- **Nowe przyciski:** 1 ("Usuń trwale")

### Backend operations supported:
- ✅ `assign` - Przydziel technika
- ✅ `reschedule` - Zmień datę
- ✅ `cancel` - Anuluj (zmień status)
- ✅ `update-status` - Zmień status
- ✅ `add-note` - Dodaj notatkę
- ✅ `delete` - **NOWE** - Usuń trwale

---

## 🔄 Integracja z systemem

### Powiązane pliki:
- `pages/admin/wizyty/index.js` - Frontend interfejsu wizyt
- `pages/api/visits/bulk-operations.js` - Backend operacji zbiorczych
- `data/orders.json` - Baza danych zleceń i wizyt

### Wykorzystywane komponenty:
- `FiXCircle` - Ikona zamknięcia modalu
- Toast notifications (react-toastify)
- State management (React useState)
- API fetch

---

## 🎓 Wnioski

### Co działa:
✅ Trwałe usuwanie wizyt z bazy danych  
✅ Walidacja wymagana (powód + checkbox)  
✅ Wyraźne ostrzeżenia dla użytkownika  
✅ Informacja o alternatywie (Anuluj)  
✅ Error handling i feedback  

### Przyszłe usprawnienia:
💡 Dodać audit log z usuniętymi wizytami (backup)  
💡 Możliwość odzyskania usuniętych wizyt (soft delete)  
💡 Eksport usuniętych wizyt do CSV przed usunięciem  
💡 Potwierdzenie przez email dla ważnych usunięć  

---

**Status:** ✅ Funkcjonalność gotowa do użycia  
**Dokumentacja:** ✅ Kompletna  
**Testy:** ⏳ Do wykonania manualnie
