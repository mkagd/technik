# 📊 GŁĘBOKA ANALIZA: SYSTEM HARMONOGRAMÓW PRACOWNIKÓW

**Data analizy:** 6 października 2025  
**Pytanie:** Czy harmonogram czasu pracy każdego z pracowników zostaje gdzieś zapisywany?  
**Odpowiedź:** TAK - ale istnieją DWA NIEZALEŻNE SYSTEMY!

---

## ✅ ODPOWIEDŹ: TAK, HARMONOGRAMY SĄ ZAPISYWANE

### Główny plik zapisu:
```
data/work-schedules.json
```

### Struktura danych:
```json
{
  "id": "SCH-1759738781108-rj2zg8c1i",
  "employeeId": "EMPA252780002",
  "weekStart": "2025-10-06",
  "workSlots": [
    {
      "id": "SLOT-1759738781108-onnzbbxxu",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "16:00",
      "type": "work",
      "duration": 480,
      "notes": "",
      "createdAt": "2025-10-06T08:19:41.108Z"
    }
  ],
  "breaks": [
    {
      "id": "SLOT-...",
      "dayOfWeek": 3,
      "startTime": "13:45",
      "endTime": "14:30",
      "type": "break",
      "duration": 45,
      "notes": "Lunch",
      "createdAt": "..."
    }
  ],
  "createdAt": "2025-10-06T08:19:41.108Z",
  "updatedAt": "2025-10-06T08:19:48.523Z"
}
```

---

## 🏗️ ARCHITEKTURA SYSTEMU A (Panel Technika)

### Frontend:
**Plik:** `pages/technician/schedule.js`  
**URL:** `http://localhost:3000/technician/schedule`

### Funkcje:
- ✅ Timeline (oś czasu) z interwałami 15-minutowymi
- ✅ Drag & Drop - zaznacz myszką na osi czasu
- ✅ Dwa tryby: 💼 Praca vs ☕ Przerwa
- ✅ Kliknij slot aby usunąć (double-click confirmation)
- ✅ Kopiowanie poprzedniego tygodnia
- ✅ Statystyki tygodnia (godziny, dni, średnia)
- ✅ Gamifikacja (bonusy, odznaki, motywacja)

### Backend:
**Plik:** `pages/api/technician/work-schedule.js`

**Endpoints:**
```javascript
GET    /api/technician/work-schedule?weekStart=2025-10-06
       → Pobierz harmonogram tygodnia

POST   /api/technician/work-schedule
       Body: { slotData: {...}, weekStart: '2025-10-06' }
       → Dodaj work slot lub break

POST   /api/technician/work-schedule
       Body: { action: 'copy_previous_week', weekStart: '2025-10-06' }
       → Kopiuj poprzedni tydzień

DELETE /api/technician/work-schedule?slotId=SLOT-...&weekStart=2025-10-06
       → Usuń slot
```

### Dane zapisywane w:
```
data/work-schedules.json
```

### Kluczowe cechy:
1. **Tygodniowy format:** Każdy tydzień = osobny rekord
2. **weekStart:** Poniedziałek (YYYY-MM-DD)
3. **dayOfWeek:** 0 (niedziela) - 6 (sobota)
4. **15-minutowe interwały:** 08:00, 08:15, 08:30...
5. **Walidacja nakładania:** Sloty nie mogą się nakładać

---

## 🏗️ ARCHITEKTURA SYSTEMU B (Panel Admina)

### Frontend:
**Plik:** `pages/panel-przydzial-zlecen.js`  
**URL:** `http://localhost:3000/panel-przydzial-zlecen`

### Funkcje:
- ✅ Sprawdzanie dostępności pracownika
- ✅ Real-time status (available/busy)
- ✅ Następny wolny slot
- ✅ Procent wykorzystania czasu

### Backend:
**Plik:** `pages/api/employee-calendar.js`

**Endpoints:**
```javascript
GET /api/employee-calendar?action=check-availability&employeeId=EMP...&date=2025-10-06&duration=60
    → Sprawdź czy pracownik jest dostępny

GET /api/employee-calendar?action=get-schedule&employeeId=EMP...&date=2025-10-06
    → Pobierz harmonogram dnia

GET /api/employee-calendar?action=get-all-schedules&date=2025-10-06
    → Pobierz harmonogramy wszystkich pracowników
```

### Dane zapisywane w:
```
data/employee-schedules.json
```

### Kluczowe cechy:
1. **Dzienny format:** Każdy dzień = osobny rekord
2. **Automatyczna generacja:** Bazuje na `workingHours` z employees.json
3. **15-minutowe sloty:** Generowane dynamicznie
4. **Status slotów:** available, busy, break, travel

---

## ⚠️ PROBLEM: DWA NIEZALEŻNE SYSTEMY!

### System A (work-schedules.json)
- **Używany przez:** Panel Technika
- **Edycja:** Technik sam ustawia harmonogram
- **Format:** Tygodniowy (weekStart)
- **Źródło danych:** Ręczne wprowadzanie przez technika

### System B (employee-schedules.json)
- **Używany przez:** Panel Admina
- **Edycja:** Automatyczna generacja
- **Format:** Dzienny (date)
- **Źródło danych:** `employees.json` → `workingHours`

### 🔥 Konsekwencje:
```
┌─────────────────────────────────────────────────────────┐
│  Technik ustawia harmonogram w Panel Technika          │
│  ↓                                                      │
│  Zapisuje do: work-schedules.json (System A)           │
│                                                         │
│  Admin sprawdza dostępność w Panel Przydziału          │
│  ↓                                                      │
│  Odczytuje z: employee-schedules.json (System B)       │
│                                                         │
│  ❌ NIE KOMUNIKUJĄ SIĘ!                                │
│  ❌ Różne źródła danych!                               │
│  ❌ Brak synchronizacji!                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 PORÓWNANIE SYSTEMÓW

| Cecha | System A (work-schedules.json) | System B (employee-schedules.json) |
|-------|-------------------------------|-----------------------------------|
| **Używany przez** | Panel Technika | Panel Admina |
| **URL** | /technician/schedule | /panel-przydzial-zlecen |
| **API** | /api/technician/work-schedule | /api/employee-calendar |
| **Format czasu** | Tygodniowy (weekStart) | Dzienny (date) |
| **Źródło danych** | Ręczne (technik) | Automatyczne (employees.json) |
| **Edycja** | Drag & Drop na timeline | Nie edytowalne bezpośrednio |
| **Granulacja** | 15 minut | 15 minut |
| **Typy slotów** | work, break | available, busy, break, travel |
| **dayOfWeek** | 0-6 (0=niedziela) | N/A (używa date) |

---

## 🔍 PRZYKŁADY DANYCH

### System A (work-schedules.json):
```json
[
  {
    "id": "SCH-1759738781108-rj2zg8c1i",
    "employeeId": "EMPA252780002",
    "weekStart": "2025-10-06",
    "workSlots": [
      {
        "id": "SLOT-1759738781108-onnzbbxxu",
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "16:00",
        "type": "work",
        "duration": 480,
        "notes": "",
        "createdAt": "2025-10-06T08:19:41.108Z"
      }
    ],
    "breaks": [],
    "createdAt": "2025-10-06T08:19:41.108Z",
    "updatedAt": "2025-10-06T08:19:48.523Z"
  }
]
```

### System B (employee-schedules.json):
```json
{
  "schedules": {
    "EMP25189001": {
      "2025-10-06": {
        "date": "2025-10-06",
        "employeeId": "EMP25189001",
        "timeSlots": [
          {
            "time": "08:00",
            "status": "available",
            "duration": 15,
            "activity": null,
            "canBeModified": true
          },
          {
            "time": "08:15",
            "status": "available",
            "duration": 15
          }
        ],
        "statistics": {
          "totalAvailableMinutes": 480,
          "usedMinutes": 120,
          "utilizationPercentage": 25
        }
      }
    }
  }
}
```

---

## 🎯 ZALETY I WADY

### System A (work-schedules.json)

#### ✅ Zalety:
- Technik ma pełną kontrolę nad swoim harmonogramem
- Intuicyjny UI (timeline, drag & drop)
- Gamifikacja motywuje do pracy (bonusy, odznaki)
- Tygodniowy widok - łatwo planować
- Kopiowanie poprzedniego tygodnia
- Statystyki i zarobki w czasie rzeczywistym

#### ❌ Wady:
- Nie jest używany przez Panel Admina
- Brak integracji z systemem przydziału zleceń
- Admin nie widzi prawdziwej dostępności technika
- Duplikacja danych harmonogramów

---

### System B (employee-schedules.json)

#### ✅ Zalety:
- Automatyczna generacja (mniej pracy)
- Integracja z Panelem Przydziału Zleceń
- Real-time dostępność
- Dzienny widok - łatwo sprawdzić konkretny dzień

#### ❌ Wady:
- Bazuje tylko na statycznym `workingHours` z employees.json
- Nie uwzględnia ręcznych zmian od technika
- Brak możliwości edycji przez technika
- Nie ma przerw ustawionych przez technika

---

## 🚨 CO TERAZ?

### Opcja 1: ZUNIFIKOWAĆ SYSTEMY ⭐ ZALECANE
Połącz oba systemy w jeden:
- Technik ustawia harmonogram w `/technician/schedule`
- Zapisuje do `work-schedules.json`
- API `/api/employee-calendar` **odczytuje z work-schedules.json**
- Panel Admina korzysta z prawdziwego harmonogramu technika

**Zalety:**
- Jeden system, jedna prawda
- Admin widzi prawdziwą dostępność
- Technik ma kontrolę
- Brak duplikacji

**Kroki implementacji:**
1. Zmień `/api/employee-calendar` aby odczytywał `work-schedules.json`
2. Konwertuj format tygodniowy → dzienny w locie
3. Zachowaj kompatybilność wsteczną
4. Migruj istniejące dane

---

### Opcja 2: SYNCHRONIZACJA
Utrzymaj oba systemy, ale synchronizuj:
- Technik zapisuje w System A
- Webhook/Job synchronizuje do System B
- Admin odczytuje z System B

**Zalety:**
- Zachowuje istniejącą architekturę
- Stopniowa migracja

**Wady:**
- Złożoność
- Opóźnienia w synchronizacji
- Możliwe konflikty

---

### Opcja 3: STATUS QUO (NIE ZALECANE)
Pozostaw jak jest:
- System A dla techników
- System B dla adminów
- Brak komunikacji

**Wady:**
- Admin nie widzi prawdziwej dostępności
- Technik może być przypisany w czasie gdy ma przerwę
- Konflikty w planowaniu

---

## 📝 REKOMENDACJA

### ⭐ OPCJA 1: ZUNIFIKOWAĆ SYSTEMY

**Powody:**
1. **Spójność danych:** Jedna prawda o dostępności
2. **Lepsza UX:** Technik kontroluje harmonogram, admin to widzi
3. **Mniej błędów:** Brak duplikacji = mniej konfliktów
4. **Prostota:** Mniej kodu do utrzymania

**Plan implementacji:**
1. Utwórz adapter w `/api/employee-calendar`
2. Konwertuj format z `work-schedules.json` na wymagany przez panel admina
3. Zachowaj dotychczasowe API dla kompatybilności
4. Stopniowo migruj kod aby używał zunifikowanego systemu

---

## 🔧 PRZYKŁAD KONWERSJI

### Z System A (tygodniowy) → System B (dzienny):

**Input (work-schedules.json):**
```json
{
  "employeeId": "EMP001",
  "weekStart": "2025-10-06",
  "workSlots": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "16:00"
    }
  ]
}
```

**Output (format dla employee-calendar):**
```json
{
  "date": "2025-10-07",
  "employeeId": "EMP001",
  "timeSlots": [
    { "time": "08:00", "status": "available", "duration": 15 },
    { "time": "08:15", "status": "available", "duration": 15 },
    ...
    { "time": "15:45", "status": "available", "duration": 15 }
  ]
}
```

**Algorytm:**
```javascript
function convertWeeklyToDaily(weekSchedule, targetDate) {
  const dayOfWeek = new Date(targetDate).getDay();
  const workSlot = weekSchedule.workSlots.find(s => s.dayOfWeek === dayOfWeek);
  
  if (!workSlot) return null;
  
  return generate15MinuteSlots(workSlot.startTime, workSlot.endTime);
}
```

---

## ✅ PODSUMOWANIE

### Odpowiedź na pytanie:

**Czy harmonogram czasu pracy każdego z pracowników zostaje gdzieś zapisywany?**

**TAK!** Harmonogramy są zapisywane w:
- **Głównie:** `data/work-schedules.json` (System A)
- **Dodatkowo:** `data/employee-schedules.json` (System B)

**ALE:** Istnieją dwa niezależne systemy które nie komunikują się ze sobą!

### Kluczowe punkty:
1. ✅ Technik może ustawić harmonogram na `/technician/schedule`
2. ✅ Harmonogram zapisuje się do `work-schedules.json`
3. ✅ Format: tygodniowy, 15-minutowe sloty, work + breaks
4. ❌ Panel Admina używa innego systemu (`employee-schedules.json`)
5. ❌ Admin nie widzi harmonogramu ustawionego przez technika
6. ⚠️ **ZALECENIE:** Zunifikować systemy dla spójności danych

---

## 📚 PLIKI DO PRZEJRZENIA

### Frontend:
- `pages/technician/schedule.js` - Panel technika (System A)
- `pages/panel-przydzial-zlecen.js` - Panel admina (System B)
- `pages/admin-kalendarz.js` - Stary kalendarz admina
- `pages/integracja-rezerwacji.js` - Rezerwacje (localStorage)
- `pages/kalendarz-pracownika-nowy.js` - Kalendarz pracownika (localStorage)

### Backend API:
- `pages/api/technician/work-schedule.js` - System A
- `pages/api/employee-calendar.js` - System B

### Data Files:
- `data/work-schedules.json` - System A (tygodniowy)
- `data/employee-schedules.json` - System B (dzienny)
- `data/employees.json` - Podstawowe dane + workingHours

---

**Status:** ✅ ANALIZA UKOŃCZONA  
**Data:** 6 października 2025, 23:45  
**Następny krok:** Decyzja czy zunifikować systemy czy pozostawić status quo
