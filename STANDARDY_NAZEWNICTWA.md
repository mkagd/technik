# 📘 STANDARDY NAZEWNICTWA - PROJEKT TECHNIK

## ✅ **AKTUALNE STANDARDY (od 04.10.2025)**

### 🔧 **Nazewnictwo pracowników/techników:**

**✅ UŻYWAJ TYLKO:**
- `technicianId` - ID pracownika (np. `EMP25189001`)
- `technicianName` - Imię i nazwisko pracownika

**❌ NIE UŻYWAJ (DEPRECATED):**
- ~~`assignedTo`~~ → zamień na `technicianId`
- ~~`assignedToName`~~ → zamień na `technicianName`
- ~~`employeeId`~~ → zamień na `technicianId`
- ~~`servicemanId`~~ → zamień na `technicianId`

---

### 📊 **Statusy:**

**Backend (baza danych, API):**
Używaj **TYLKO angielskich** statusów:
```javascript
'pending'       // Oczekujące
'scheduled'     // Zaplanowane
'in-progress'   // W trakcie
'completed'     // Zakończone
'cancelled'     // Anulowane
'waiting-parts' // Oczekuje na części
'on-hold'       // Wstrzymane
'ready'         // Gotowe
```

**Frontend (UI):**
Wyświetlaj **polskie** tłumaczenia:
```javascript
import { statusToUI } from '@/utils/fieldMapping';

// W komponencie:
<span>{statusToUI(order.status)}</span> 
// Pokaże: "Oczekujące" zamiast "pending"
```

---

## 🛠️ **JAK UŻYWAĆ:**

### 1. **Odczyt (kompatybilność wsteczna):**
```javascript
import { getTechnicianId, getTechnicianName } from '@/utils/fieldMapping';

// Zamiast:
const techId = visit.technicianId || visit.assignedTo || visit.employeeId;

// Użyj:
const techId = getTechnicianId(visit);
const techName = getTechnicianName(visit);
```

### 2. **Zapis (normalizacja):**
```javascript
import { normalizeObject } from '@/utils/fieldMapping';

// Przed zapisem do bazy:
const newVisit = {
  visitId: 'VIS123',
  status: 'zaplanowane', // Polski status
  assignedTo: 'EMP001'   // Stare pole
};

const normalized = normalizeObject(newVisit);
// Wynik:
// {
//   visitId: 'VIS123',
//   status: 'scheduled',      // ← Angielski
//   technicianId: 'EMP001',   // ← Nowe pole
//   technicianName: null
// }

await saveToDatabase(normalized);
```

### 3. **Wyświetlanie statusów:**
```javascript
import { statusToUI } from '@/utils/fieldMapping';

// W komponencie React:
function OrderCard({ order }) {
  return (
    <div>
      <span>{statusToUI(order.status)}</span>
      {/* Pokaże: "Zakończone" zamiast "completed" */}
    </div>
  );
}
```

---

## 📁 **STRUKTURY DANYCH:**

### **Order (Zlecenie):**
```typescript
{
  id: string,
  orderNumber: string,
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled',
  technicianId: string | null,    // ← Używaj tego
  technicianName: string | null,  // ← Używaj tego
  // ... inne pola
}
```

### **Visit (Wizyta):**
```typescript
{
  visitId: string,
  type: 'diagnosis' | 'repair' | 'maintenance',
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled',
  technicianId: string,     // ← Używaj tego
  technicianName: string,   // ← Używaj tego
  scheduledDate: string,
  // ... inne pola
}
```

---

## ⚠️ **MIGRACJA ISTNIEJĄCYCH DANYCH:**

Jeśli masz stare dane ze starymi polami:

```javascript
// Skrypt migracji (uruchom raz):
import { normalizeObject } from '@/utils/fieldMapping';
import fs from 'fs';

const orders = JSON.parse(fs.readFileSync('data/orders.json'));
const normalized = orders.map(normalizeObject);
fs.writeFileSync('data/orders.json', JSON.stringify(normalized, null, 2));
```

---

## 📝 **CHECKLIST DLA NOWYCH FEATURE'ÓW:**

Przy dodawaniu nowego kodu sprawdź:

- [ ] Używam `technicianId` zamiast `assignedTo`
- [ ] Używam `technicianName` zamiast `assignedToName`
- [ ] Statusy w bazie są po angielsku
- [ ] Statusy w UI są po polsku (`statusToUI()`)
- [ ] Używam `normalizeObject()` przed zapisem
- [ ] Używam `getTechnicianId()` przy odczycie

---

## 🔍 **PRZYKŁADY DOBRYCH PRAKTYK:**

### ✅ DOBRZE:
```javascript
// API Endpoint
const newVisit = {
  visitId: generateVisitId(),
  status: 'scheduled',        // ← Angielski
  technicianId: req.body.technicianId,
  technicianName: getTechnicianName(technician)
};

// UI Component
<div className="status-badge">
  {statusToUI(visit.status)}  {/* Pokaże: "Zaplanowane" */}
</div>
```

### ❌ ŹLE:
```javascript
// API Endpoint
const newVisit = {
  visitId: generateVisitId(),
  status: 'zaplanowane',      // ← NIE! Polski w bazie
  assignedTo: req.body.employeeId,  // ← NIE! Stare pole
};

// UI Component
<div className="status-badge">
  {visit.status}  {/* Pokaże: "scheduled" - brzydko! */}
</div>
```

---

## 📞 **PYTANIA?**

Jeśli coś jest niejasne, sprawdź:
- `utils/fieldMapping.js` - Wszystkie funkcje pomocnicze
- Ten dokument - Standardy i przykłady
- Lub zapytaj na Slacku w kanale #dev-questions

---

**Ostatnia aktualizacja:** 04.10.2025  
**Autor:** System automatycznej refaktoryzacji
