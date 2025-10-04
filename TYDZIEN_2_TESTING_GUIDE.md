# 🧪 Week 2 Testing Guide - Visit Audit Log System

## Quick Test Procedure

### 1. **Start Dev Server**
```powershell
npm run dev
```
Otwórz: http://localhost:3000/admin/wizyty

---

### 2. **Test 1: Edit Visit & Create Audit Log**

**Kroki:**
1. Znajdź dowolną wizytę na liście
2. Kliknij ikonę oka 👁️ aby otworzyć szczegóły
3. Kliknij **"Edytuj"** w górnym rogu
4. Zmień **Status** (np. z "Zaplanowana" na "W trakcie")
5. Zmień **Datę** na inną
6. Dodaj **Notatki technika**: "Test audit log system"
7. Kliknij **"Zapisz zmiany"**

**Expected:**
✅ Toast: "Wizyta VIS_XXX zaktualizowana pomyślnie!"  
✅ Modal wraca do trybu podglądu  
✅ Nowa sekcja "Historia zmian" pojawia się na dole modalu  

---

### 3. **Test 2: Verify Audit Log Display**

**Kroki:**
1. W tym samym modalu przewiń na dół do sekcji **"Historia zmian"**
2. Sprawdź timeline z pionową linią i kropkami

**Expected:**
✅ Widoczny wpis z ikoną ✏️ (updated)  
✅ Niebieski badge "Zaktualizowano"  
✅ Timestamp w formacie DD.MM.RRRR HH:MM:SS  
✅ Użytkownik: "Administrator"  
✅ Reason: "Edycja wizyty przez panel administracyjny"  
✅ Lista zmian (3 pola):
   - ~~Status: Zaplanowana~~ → **W trakcie** (lub inna zmiana)
   - ~~Data: 2025-XX-XX~~ → **2025-YY-YY**
   - ~~Notatki: (puste)~~ → **Test audit log system**

---

### 4. **Test 3: Multiple Changes**

**Kroki:**
1. W tym samym modalu kliknij **"Edytuj"** ponownie
2. Zmień **Godzinę** na inną
3. Zmień **Technika** (jeśli dostępni inni)
4. Kliknij **"Zapisz zmiany"**
5. Przewiń do "Historia zmian"

**Expected:**
✅ **2 wpisy** w timeline (najnowszy na górze)  
✅ Drugi wpis pokazuje nowe zmiany (Godzina, Technik)  
✅ Pierwszy wpis (starszy) nadal widoczny poniżej  

---

### 5. **Test 4: Rollback (Przywracanie)**

**Kroki:**
1. W sekcji "Historia zmian" znajdź **pierwszy wpis** (najstarszy)
2. Kliknij przycisk **"↩️ Przywróć"**
3. Pojawi się druga opcja: **"✓ Potwierdź"** i **"✗ Anuluj"**
4. Kliknij **"✓ Potwierdź"**

**Expected:**
✅ Toast: "Zmiany zostały przywrócone"  
✅ Loading spinner na 1-2 sekundy  
✅ Timeline odświeża się automatycznie  
✅ **Nowy wpis** typu "rollback" (żółty badge ↩️) na górze  
✅ Wpis rollback zawiera odwrócone zmiany (old ↔ new)  
✅ Szczegóły wizyty w modalu aktualizują się do starego stanu  

---

### 6. **Test 5: Verify JSON Files**

**Kroki:**
1. Otwórz plik: `data/visit-audit-logs.json`
2. Sprawdź tablicę `logs[]`

**Expected:**
✅ Co najmniej 3 wpisy (2x updated, 1x rollback)  
✅ Każdy wpis ma:
   - Unikalny `id` (format: `VLOG_timestamp_random`)
   - `visitId` i `orderId`
   - `timestamp` (ISO 8601)
   - `userId: "admin"`, `userName: "Administrator"`
   - `action: "updated"` lub `"rollback"`
   - `changes[]` z polskimi nazwami pól (`displayName`)
   - `metadata` z IP i userAgent

**Przykład:**
```json
{
  "id": "VLOG_1696421234567_abc123de",
  "visitId": "VIS_001",
  "orderId": "ORD_123",
  "timestamp": "2025-10-04T10:30:00.000Z",
  "userId": "admin",
  "userName": "Administrator",
  "action": "updated",
  "entity": "visit",
  "changes": [
    {
      "field": "status",
      "oldValue": "scheduled",
      "newValue": "in_progress",
      "displayName": "Status"
    }
  ],
  "reason": "Edycja wizyty przez panel administracyjny",
  "metadata": {
    "ip": "::1",
    "userAgent": "Mozilla/5.0...",
    "source": "admin_panel"
  }
}
```

---

### 7. **Test 6: Empty State**

**Kroki:**
1. Znajdź wizytę, która **nigdy nie była edytowana** (stara wizyta z przed Week 2)
2. Otwórz jej szczegóły

**Expected:**
✅ Sekcja "Historia zmian" widoczna  
✅ Komunikat: "Brak historii zmian dla tej wizyty"  
✅ Szare tło, czytelny tekst  

---

### 8. **Test 7: API Endpoints (Opcjonalnie)**

**Test w przeglądarce lub Postman:**

#### GET - Pobranie logów
```
http://localhost:3000/api/visits/audit-log?visitId=VIS_001&limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "logs": [ /* tablica logów */ ],
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0
  }
}
```

#### POST - Utworzenie logu (manual test)
```http
POST http://localhost:3000/api/visits/audit-log
Content-Type: application/json

{
  "visitId": "VIS_001",
  "orderId": "ORD_123",
  "userId": "test_user",
  "userName": "Test User",
  "action": "updated",
  "reason": "Test manual log creation",
  "oldState": { "status": "scheduled" },
  "newState": { "status": "completed" }
}
```

**Expected Response:**
```json
{
  "success": true,
  "log": { /* utworzony log */ },
  "message": "Audit log created successfully"
}
```

---

## 🐛 Known Issues & Edge Cases

### ✅ Already Handled:
1. **Port 3000 zajęty** → Kill process: 
   ```powershell
   $process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1; if ($process) { Stop-Process -Id $process -Force }
   ```

2. **Brak pliku audit-logs.json** → Auto-create przy pierwszym zapisie

3. **Rollback logu rollback** → Przycisk "Przywróć" ukryty dla action: "rollback"

4. **Fetch error** → Pokazuje error message z przyciskiem "Spróbuj ponownie"

5. **Loading states** → Spinner + disabled buttons podczas operacji

### ⚠️ Current Limitations:
1. **userId hardcoded** - Zawsze "admin" (TODO: integracja z sesją)
2. **No pagination UI** - Timeline pokazuje max 100 logów (API wspiera pagination)
3. **No date range filter** - Timeline pokazuje wszystkie logi dla danego visitId

---

## 📊 Visual Checklist

Po wykonaniu testów 1-5, powinieneś zobaczyć:

```
┌─────────────────────────────────────────────┐
│ Historia zmian (3)              🔄 Odśwież  │
├─────────────────────────────────────────────┤
│                                             │
│  ↩️ [Przywrócono] 04.10.2025 10:45:23      │
│     Administrator: Przywrócono stan...      │
│     ┌─────────────────────────────────┐    │
│     │ Status                          │    │
│     │ W trakcie → Zaplanowana         │    │
│     └─────────────────────────────────┘    │
│                            [↩️ Przywróć]   │  ← UKRYTY dla rollback
│                                             │
│  ✏️ [Zaktualizowano] 04.10.2025 10:35:15  │
│     Administrator: Edycja wizyty...         │
│     ┌─────────────────────────────────┐    │
│     │ Godzina                         │    │
│     │ 10:00 → 14:00                   │    │
│     │                                 │    │
│     │ Technik                         │    │
│     │ Jan Kowalski → Piotr Nowak      │    │
│     └─────────────────────────────────┘    │
│                            [↩️ Przywróć]   │
│                                             │
│  ✏️ [Zaktualizowano] 04.10.2025 10:30:00  │
│     Administrator: Edycja wizyty...         │
│     ┌─────────────────────────────────┐    │
│     │ Status                          │    │
│     │ Zaplanowana → W trakcie         │    │
│     │                                 │    │
│     │ Data wizyty                     │    │
│     │ 2025-10-05 → 2025-10-06         │    │
│     │                                 │    │
│     │ Notatki                         │    │
│     │ — → Test audit log system       │    │
│     └─────────────────────────────────┘    │
│                            [Potwierdź]      │  ← Po kliknięciu "Przywróć"
│                            [Anuluj]         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

Week 2 jest uznany za **UKOŃCZONY** jeśli:

- ✅ Test 1: Edycja wizyty tworzy log w JSON
- ✅ Test 2: Timeline wyświetla logi z changes[]
- ✅ Test 3: Kolejne edycje dodają nowe wpisy
- ✅ Test 4: Rollback działa i tworzy nowy log
- ✅ Test 5: JSON zawiera poprawne struktury
- ✅ Test 6: Empty state pokazuje komunikat
- ✅ Brak błędów kompilacji (red squiggles)
- ✅ Brak błędów runtime w konsoli DevTools
- ✅ Toast notifications działają

---

## 🎯 Manual Regression Tests

Sprawdź, czy Week 1 nadal działa:

1. **Toast Notifications (Week 1)**
   - Edycja wizyty → Toast success
   - Błąd API → Toast error
   
2. **Fuzzy Search (Week 1)**
   - Wyszukiwanie "kowalski" → Znajduje "Jan Kowalski"
   - Wyszukiwanie "ładówka" → Znajduje "Lodówka"
   - Typo: "lodufka" → Nadal znajduje "Lodówka" (threshold 0.3)

---

## 🚀 Next Steps

Po pomyślnych testach Week 2:

**Ready for TYDZIEŃ 3: Advanced Filters + Saved Presets**

Estimated: 6-8h  
Features: Multi-select, range sliders, saved presets

---

**Testing Status:** ⏳ Pending manual verification  
**Automation:** TODO (Week 5 - Integration tests)
