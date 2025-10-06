# 🔍 DIAGNOZA: Problem Synchronizacji Harmonogramu Pracy

## 📅 Data Raportu
**6 października 2025**

---

## ❓ ZGŁOSZONY PROBLEM

**User Report:**
> "teraz zaaktualizowałem np poniedziałek że nie ma żadnych slotów pracy a w przydziale zlecen dalej ta praca jest"

**Opis Sytuacji:**
1. Technik wchodzi na: `http://localhost:3000/technician/schedule`
2. Usuwa wszystkie sloty pracy na poniedziałek (np. 7 października 2025)
3. Dane zapisują się do `data/work-schedules.json` ✅
4. **ALE:** W panelu przydziału (`/panel-przydzial-zlecen`) nadal widoczne są stare godziny pracy

---

## 🔬 ANALIZA TECHNICZNA

### System A: `work-schedules.json` (Technik ustawia harmonogram)
**Lokalizacja:** `data/work-schedules.json`

**Struktura:**
```json
[
  {
    "id": "SCH-1728...",
    "employeeId": "EMPA252780001",
    "weekStart": "2025-10-06",  ← Poniedziałek tygodnia
    "workSlots": [
      {
        "id": "SLOT-...",
        "dayOfWeek": 1,  ← 1=Poniedziałek, 2=Wtorek...
        "startTime": "08:00",
        "endTime": "16:00",
        "type": "work",
        "duration": 480
      }
    ],
    "breaks": [],
    "createdAt": "2025-10-06T...",
    "updatedAt": "2025-10-06T..."
  }
]
```

**API Endpoint:**
- **Write:** `POST /api/technician/work-schedule`
- **Read:** `GET /api/technician/work-schedule?weekStart=YYYY-MM-DD`

**Kiedy się zapisuje:**
- Technik dodaje/usuwa slot w `/technician/schedule`
- Automatycznie: `POST /api/technician/work-schedule`
- Natychmiastowy zapis do `work-schedules.json` ✅

---

### System B: `employee-calendar.js` (API dla panelu przydziału)
**Lokalizacja:** `pages/api/employee-calendar.js`

**Priorytet odczytu danych:**
```javascript
// PRIORYTET 1: work-schedules.json (ustawiony przez technika) ← NAJWAŻNIEJSZE
const workScheduleData = convertWorkScheduleToDaily(employeeId, date);

// PRIORYTET 2: employee-schedules.json (stary system, fallback)
const schedule = schedulesData.schedules[date]?.[employeeId];

// PRIORYTET 3: Auto-generacja z workingHours (employees.json)
const schedule = generateTimeSlotsFromWorkingHours(employee.workingHours);
```

**Funkcja `convertWorkScheduleToDaily`:**
```javascript
// Konwertuje tygodniowy harmonogram → dzienny format
const convertWorkScheduleToDaily = (employeeId, date) => {
  const workSchedules = readWorkSchedules(); // ← Odczyt z work-schedules.json
  
  // Oblicz poniedziałek tygodnia
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0=niedziela, 1=pon...
  const weekStart = calculateMonday(date); // np. "2025-10-06"
  
  // Znajdź harmonogram dla tego pracownika i tygodnia
  const schedule = workSchedules.find(
    s => s.employeeId === employeeId && s.weekStart === weekStart
  );
  
  // Znajdź sloty dla konkretnego dnia tygodnia
  const workSlotsForDay = schedule.workSlots.filter(
    slot => slot.dayOfWeek === dayOfWeek
  );
  
  // Generuj 15-minutowe sloty
  return generateTimeSlots(workSlotsForDay);
};
```

---

### Panel Przydziału: Frontend
**Lokalizacja:** `pages/panel-przydzial-zlecen.js`

**Kiedy ładuje harmonogramy:**
```javascript
const loadAllEmployeeSchedules = async (date) => {
  const response = await fetch(
    `/api/employee-calendar?action=get-all-schedules&date=${date}`
  );
  
  const data = await response.json();
  // Zwraca harmonogramy WSZYSTKICH pracowników na dany dzień
  return data.schedules; // { EMPA1: {...}, EMPA2: {...} }
};
```

**Problem: Brak auto-refresh!**
```javascript
useEffect(() => {
  if (auth) {
    refreshData();
  }
}, [auth]); // ← Tylko przy załadowaniu!

// refreshData() jest wywoływane:
// 1. Po zalogowaniu ✅
// 2. Ręcznie: przycisk "Odśwież" ✅
// 3. Po przydzieleniu zlecenia ✅
// ❌ NIE po zmianie harmonogramu przez technika!
```

---

## 🐛 GŁÓWNA PRZYCZYNA PROBLEMU

### Scenariusz błędu:

```
KROK 1: Panel przydziału ładuje dane
├─ Godzina: 10:00
├─ API: GET /api/employee-calendar?action=get-all-schedules&date=2025-10-07
├─ Źródło: work-schedules.json (weekStart: 2025-10-06)
├─ Wynik: Mario ma sloty pracy 08:00-16:00 (8 godzin)
└─ Frontend: Zapisuje do state `employeeSchedules[EMPA1] = { timeSlots: [...] }`

⏰ CZAS UPŁYWA (30 sekund)

KROK 2: Technik usuwa harmonogram
├─ Godzina: 10:00:30
├─ Strona: /technician/schedule
├─ Akcja: Usuwa wszystkie sloty pracy na poniedziałek
├─ API: DELETE /api/technician/work-schedule?slotId=...&weekStart=2025-10-06
├─ Backend: ✅ work-schedules.json zaktualizowany
└─ Wynik: workSlots[] = PUSTE dla dayOfWeek=1

❌ PROBLEM: Panel przydziału nie wie o zmianie!

KROK 3: Panel nadal pokazuje stare dane
├─ Godzina: 10:05
├─ Frontend state: employeeSchedules[EMPA1] = { timeSlots: [08:00, 08:15, ...] }
├─ Backend realność: workSlots[] = PUSTE
└─ Użytkownik widzi: "Mario dostępny 08:00-16:00" ← BŁĘDNE!
```

---

## ✅ CO DZIAŁA POPRAWNIE

1. **✅ API `work-schedule` poprawnie zapisuje**
   - Technik usuwa sloty → backend aktualizowany natychmiast
   - File `work-schedules.json` zawiera aktualne dane

2. **✅ API `employee-calendar` poprawnie odczytuje**
   - Sprawdziłem: `convertWorkScheduleToDaily()` działa
   - Priorytet danych jest prawidłowy (work-schedules.json > inne)
   - Jeśli puste `workSlots[]` → zwraca `null` (brak harmonogramu)

3. **✅ Frontend panel MOŻE odświeżyć dane**
   - Przycisk "Odśwież" wywołuje `refreshData()`
   - `refreshData()` pobiera nowe dane z API
   - Po odświeżeniu harmonogramy się aktualizują

---

## ❌ CO NIE DZIAŁA

### Problem 1: Brak Real-Time Synchronizacji
**Opis:**
Panel przydziału nie wie kiedy technik zmienia harmonogram.

**Skutek:**
Operator widzi nieaktualne godziny pracy przez 30-60 sekund (lub więcej, jeśli nie odświeży ręcznie).

**Ryzyko:**
- Przydzielenie wizyty na slot, który już nie istnieje
- Technik się denerwuje: "Przecież usunąłem te godziny!"

### Problem 2: Cache w Frontendzie
**Opis:**
```javascript
const [employeeSchedules, setEmployeeSchedules] = useState({});

// Dane są ładowane raz i trzymane w state
// Brak automatycznego odświeżania
```

**Skutek:**
Stare dane mogą "przetrwać" przez długi czas.

### Problem 3: Brak Auto-Refresh przy Zmianie Danych
**Opis:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    refreshData(); // ← To odświeża ZLECENIA
  }, autoRefreshInterval * 1000);
}, [autoRefreshInterval]);
```

**Problem:**
`refreshData()` odświeża zlecenia, ale **NIE odświeża harmonogramów pracowników**!

---

## 🔧 ROZWIĄZANIA

### OPCJA A: Auto-Refresh Harmonogramów (PROSTE) ⭐ REKOMENDOWANE

**Opis:**
Dodaj automatyczne odświeżanie harmonogramów co 30 sekund.

**Implementacja:**
```javascript
// pages/panel-przydzial-zlecen.js

useEffect(() => {
  if (!auth) return;
  
  const refreshHarmonogramy = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(
        `/api/employee-calendar?action=get-all-schedules&date=${today}`
      );
      const data = await response.json();
      
      if (data.success) {
        setEmployeeSchedules(data.schedules); // Aktualizuj state
        console.log('🔄 Harmonogramy odświeżone automatycznie');
      }
    } catch (error) {
      console.error('❌ Błąd odświeżania harmonogramów:', error);
    }
  };
  
  // Odśwież co 30 sekund
  const interval = setInterval(refreshHarmonogramy, 30000);
  
  return () => clearInterval(interval);
}, [auth]);
```

**Zalety:**
- ✅ Proste w implementacji (10 linijek kodu)
- ✅ Działa bez modyfikacji backendu
- ✅ Technik widzi zmiany w panelu po max 30 sekundach

**Wady:**
- ❌ Opóźnienie do 30 sekund
- ❌ Zbędne requesty jeśli harmonogram się nie zmienił

---

### OPCJA B: WebSocket Real-Time (ZAAWANSOWANE)

**Opis:**
System powiadomień w czasie rzeczywistym.

**Implementacja:**
```javascript
// Backend: pages/api/socket.js
io.on('connection', (socket) => {
  socket.on('schedule-updated', (data) => {
    // Broadcast do wszystkich klientów
    io.emit('schedule-changed', {
      employeeId: data.employeeId,
      weekStart: data.weekStart,
      timestamp: Date.now()
    });
  });
});

// Frontend: panel-przydzial-zlecen.js
useEffect(() => {
  socket.on('schedule-changed', (data) => {
    // Natychmiast odśwież harmonogram tego pracownika
    refreshEmployeeSchedule(data.employeeId);
  });
}, []);

// Technician schedule: technician/schedule.js
const saveSlot = async () => {
  await fetch('/api/technician/work-schedule', ...);
  
  // Emituj event
  socket.emit('schedule-updated', {
    employeeId: employee.id,
    weekStart: currentWeekStart
  });
};
```

**Zalety:**
- ✅ Real-time (< 1 sekunda opóźnienia)
- ✅ Brak zbędnych requestów
- ✅ Profesjonalne rozwiązanie

**Wady:**
- ❌ Wymaga Socket.io
- ❌ Więcej kodu (backend + frontend)
- ❌ Dodatkowy serwer WebSocket

---

### OPCJA C: Polling z Etag (ŚREDNIE)

**Opis:**
Sprawdzaj czy plik `work-schedules.json` się zmienił (hash/timestamp).

**Implementacja:**
```javascript
// Backend: /api/employee-calendar-version
export default function handler(req, res) {
  const workSchedules = readWorkSchedules();
  const hash = crypto.createHash('md5')
    .update(JSON.stringify(workSchedules))
    .digest('hex');
  
  res.json({
    version: hash,
    lastModified: fs.statSync(WORK_SCHEDULES_FILE).mtime
  });
}

// Frontend: panel-przydzial-zlecen.js
useEffect(() => {
  let lastVersion = null;
  
  const checkVersion = async () => {
    const response = await fetch('/api/employee-calendar-version');
    const { version } = await response.json();
    
    if (lastVersion && version !== lastVersion) {
      console.log('🔄 Wykryto zmianę harmonogramów!');
      await refreshAllSchedules();
    }
    
    lastVersion = version;
  };
  
  const interval = setInterval(checkVersion, 10000); // Co 10 sekund
  return () => clearInterval(interval);
}, []);
```

**Zalety:**
- ✅ Szybkie wykrywanie zmian (10 sekund)
- ✅ Lightweight (tylko hash/timestamp)
- ✅ Brak WebSocketów

**Wady:**
- ❌ Nadal polling (requesty co 10s)
- ❌ Wymaga nowego API endpoint

---

## 🎯 REKOMENDACJA

### ⭐ WYBÓR: OPCJA A - Auto-Refresh (30 sekund)

**Uzasadnienie:**
1. **Najprostsze** - 10 linijek kodu
2. **Wystarczająco szybkie** - 30 sekund to akceptowalne opóźnienie
3. **Bez dodatkowych dependencies** - nie wymaga Socket.io
4. **Działa teraz** - można wdrożyć w 5 minut

**Przypadki użycia:**
- Technik zmienia harmonogram → max 30s opóźnienie w panelu ✅
- Operator przydziela zlecenie → natychmiastowy feedback ✅
- Automatyczny przydział → działa na aktualnych danych ✅

---

## 📋 PLAN IMPLEMENTACJI (OPCJA A)

### Krok 1: Dodaj Auto-Refresh Harmonogramów

**Plik:** `pages/panel-przydzial-zlecen.js`

**Lokalizacja:** Po `useEffect` ładowania danych

**Kod:**
```javascript
// AUTO-REFRESH: Harmonogramy pracowników (co 30 sekund)
useEffect(() => {
  if (!auth) return;
  
  const refreshSchedulesAuto = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch(
        `/api/employee-calendar?action=get-all-schedules&date=${today}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Aktualizuj tylko jeśli są różnice
        const hasChanges = JSON.stringify(employeeSchedules) !== JSON.stringify(data.schedules);
        
        if (hasChanges) {
          setEmployeeSchedules(data.schedules);
          console.log('🔄 Harmonogramy zaktualizowane automatycznie');
          
          // Opcjonalnie: Pokaż notyfikację
          addNotification('🔄 Harmonogramy zaktualizowane', 'info');
        }
      }
    } catch (error) {
      console.error('❌ Auto-refresh harmonogramów błąd:', error);
      // Nie pokazuj błędu użytkownikowi - to tło działające
    }
  };
  
  // Wywołaj co 30 sekund
  const interval = setInterval(refreshSchedulesAuto, 30000);
  
  // Cleanup
  return () => clearInterval(interval);
}, [auth, employeeSchedules]); // Zależności
```

### Krok 2: Dodaj Wizualny Indicator

**Plik:** `pages/panel-przydzial-zlecen.js`

**Lokalizacja:** W headerze panelu

**Kod:**
```javascript
// Dodaj state dla ostatniego odświeżenia
const [lastScheduleRefresh, setLastScheduleRefresh] = useState(new Date());

// W funkcji refreshSchedulesAuto:
setLastScheduleRefresh(new Date());

// W UI:
<div className="text-xs text-gray-500">
  Harmonogramy: {new Date(lastScheduleRefresh).toLocaleTimeString()}
  <span className="ml-2 text-green-500">●</span> Auto-refresh aktywny
</div>
```

### Krok 3: Test

**Scenariusz testowy:**
```
1. Otwórz panel przydziału: http://localhost:3000/panel-przydzial-zlecen
2. Zaloguj się (admin123)
3. Sprawdź harmonogram Mario na poniedziałek (np. 08:00-16:00)
4. W NOWYM OKNIE: http://localhost:3000/technician/schedule
5. Zaloguj się jako Mario
6. Usuń wszystkie sloty pracy na poniedziałek
7. Wróć do panelu przydziału
8. Czekaj max 30 sekund
9. ✅ Harmonogram Mario powinien się zaktualizować (brak slotów)
```

---

## 🔍 DEBUG CHECKLIST

Jeśli problem nadal występuje:

### 1. Sprawdź czy dane zapisują się do pliku
```powershell
Get-Content "data/work-schedules.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 2. Sprawdź API bezpośrednio
```bash
# Sprawdź harmonogram na dzień
curl "http://localhost:3000/api/employee-calendar?action=get-schedule&employeeId=EMPA252780001&date=2025-10-07"

# Sprawdź wszystkie harmonogramy
curl "http://localhost:3000/api/employee-calendar?action=get-all-schedules&date=2025-10-07"
```

### 3. Sprawdź console logi
```javascript
// W employee-calendar.js - funkcja convertWorkScheduleToDaily
console.log(`🔄 Konwersja: employeeId=${employeeId}, date=${date}, weekStart=${weekStart}`);
console.log(`⚠️ Brak workSlots dla dayOfWeek=${dayOfWeek}`);
console.log(`✅ Wygenerowano ${timeSlots.length} slotów`);
```

### 4. Sprawdź Network tab w DevTools
```
Otwórz Chrome DevTools → Network → Filtruj "employee-calendar"
Sprawdź:
- Czy request jest wysyłany co 30s?
- Czy response zawiera aktualne dane?
- Czy są błędy (status 500/400)?
```

---

## 📊 PODSUMOWANIE

| Aspekt | Status | Notatka |
|--------|--------|---------|
| **Backend zapisuje dane** | ✅ DZIAŁA | `work-schedules.json` aktualizowany natychmiast |
| **API odczytuje dane** | ✅ DZIAŁA | `employee-calendar.js` czyta z właściwego źródła |
| **Frontend odświeża** | ❌ PROBLEM | Brak auto-refresh harmonogramów |
| **Synchronizacja** | ❌ PROBLEM | Opóźnienie do momentu ręcznego odświeżenia |

**Główny Problem:**
> Panel przydziału cache'uje harmonogramy w state i nie odświeża ich automatycznie.

**Rozwiązanie:**
> Dodaj auto-refresh harmonogramów co 30 sekund (10 linijek kodu).

---

## 📝 NEXT STEPS

1. ✅ **Implementuj OPCJA A** (Auto-Refresh)
2. ✅ **Testuj** scenariusz zmiany harmonogramu
3. ✅ **Dodaj visual indicator** ostatniego odświeżenia
4. ⏳ **Opcjonalnie:** Rozważ WebSocket dla instant sync (przyszłość)

---

## 🎯 EXPECTED RESULT

Po implementacji:

```
Technik usuwa slot → 30 sekund → Panel automatycznie odświeża harmonogram
```

**Bez** konieczności:
- ❌ Ręcznego klikania "Odśwież"
- ❌ Przeładowania strony (F5)
- ❌ Wylogowania/zalogowania

**Z** gwarancją:
- ✅ Max 30 sekund opóźnienia
- ✅ Automatyczna synchronizacja
- ✅ Aktualne dane w panelu

---

**Koniec Diagnozy** ✅
