# 🏖️ NAPRAWA: Dzień Wolny zamiast Fallback do workingHours

## 📅 Data: 2025-10-06, 21:30
## 🎯 Problem
Panel przydziału zleceń pokazywał zielone sloty 9:00-17:00 dla Mariusza w poniedziałek, mimo że serwisant nie ustawił godzin pracy na ten dzień (slot został usunięty).

## 🔍 Root Cause
System miał 3-poziomowy system priorytetów:
1. **work-schedules.json** (set by technician)
2. **employee-schedules.json** (old admin system) 
3. **employees.json workingHours** (auto-generated fallback)

Gdy `convertWorkScheduleToDaily()` znalazł schedule w work-schedules.json, ale dzień miał 0 workSlots:
- Funkcja zwracała `null`
- System przechodził do Priority 2, a potem 3
- Generował harmonogram z `workingHours: "9:00-17:00"`
- Panel pokazywał sloty, jakby serwisant był dostępny

## 🔧 Rozwiązanie

### 1. API Backend (employee-calendar.js)

**Zmiana w `convertWorkScheduleToDaily()`:**
```javascript
// PRZED:
if (workSlotsForDay.length === 0) {
  return null; // ❌ Triggerował fallback
}

// PO:
if (workSlotsForDay.length === 0) {
  return {
    employeeId, date,
    timeSlots: [], // Pusty = dzień wolny
    isDayOff: true, // ✅ Nowa flaga
    sourceSystem: 'work-schedules.json',
    workSlotsCount: 0,
    breaksCount: 0
  };
}
```

**Zmiana w `getEmployeeSchedule()`:**
```javascript
// PRZED:
if (workScheduleData && workScheduleData.timeSlots && workScheduleData.timeSlots.length > 0) {
  // Use data
}
// Falls through to fallback

// PO:
if (workScheduleData) { // ✅ Nie sprawdzamy length
  if (workScheduleData.isDayOff) {
    return res.json({
      success: true,
      isAvailable: false,
      schedule: {
        workingHours: 'day-off',
        timeSlots: [],
        isDayOff: true,
        dailyNotes: 'Dzień wolny (serwisant nie ustawił godzin pracy)'
      }
    });
  }
  // Use normal schedule
}
// Only fallback if NO work-schedules.json entry
```

**Zmiana w `checkAvailability()`:**
```javascript
// PRZED:
if (workScheduleData && workScheduleData.timeSlots && workScheduleData.timeSlots.length > 0) {
  schedule = {timeSlots: workScheduleData.timeSlots};
}
// Falls through to fallback

// PO:
if (workScheduleData) {
  if (workScheduleData.isDayOff) {
    return res.json({
      success: true,
      isAvailable: false,
      message: 'Dzień wolny (serwisant nie ustawił godzin pracy)',
      isDayOff: true
    });
  }
  schedule = {timeSlots: workScheduleData.timeSlots};
}
```

**Zmiana w `getAllSchedules()`:**
```javascript
// PRZED:
if (workScheduleData && workScheduleData.timeSlots && workScheduleData.timeSlots.length > 0) {
  // Use data
} else {
  // Falls through to fallback
}

// PO:
if (workScheduleData) {
  if (workScheduleData.isDayOff) {
    schedule = {
      employeeId, employeeName, date,
      workingHours: 'day-off',
      timeSlots: [],
      isDayOff: true,
      dailyNotes: 'Dzień wolny (serwisant nie ustawił godzin pracy)',
      emergencyAvailable: false,
      maxOvertimeToday: 0,
      version: 2,
      sourceSystem: 'work-schedules.json'
    };
  } else {
    // Normal schedule
  }
}
```

### 2. Frontend Panel (panel-przydzial-zlecen.js)

**Zmiana w przetwarzaniu pracowników:**
```javascript
// PRZED:
if (schedule?.timeSlots) {
  // Group slots hourly
  schedule.timeSlots.forEach(slot => { ... });
}

// PO:
if (schedule?.isDayOff) {
  console.log(`⚠️ ${emp.name}: Dzień wolny - nie renderuję slotów`);
  // realTimeSchedule pozostaje pusty []
} else if (schedule?.timeSlots && schedule.timeSlots.length > 0) {
  // Group slots hourly
  schedule.timeSlots.forEach(slot => { ... });
}
```

**Zmiana w renderowaniu harmonogramu:**
```javascript
// PRZED:
{(employee.todaySchedule || []).map((slot, idx) => (
  <div>Slot...</div>
))}

// PO:
{(!employee.todaySchedule || employee.todaySchedule.length === 0) ? (
  <div className="bg-gray-100 text-center p-3 rounded">
    <span className="font-medium">🏖️ Dzień wolny</span>
    <div className="text-xs text-gray-500 mt-1">
      Serwisant nie ustawił godzin pracy
    </div>
  </div>
) : (
  (employee.todaySchedule || []).map((slot, idx) => (
    <div>Slot...</div>
  ))
)}
```

**Zmiana w synchronizacji harmonogramów:**
```javascript
// PRZED:
const changedEmployees = Object.keys(data.schedules).filter(empId => {
  const oldAvailable = oldSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
  const newAvailable = newSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
  return oldAvailable !== newAvailable;
});

// PO:
const changedEmployees = Object.keys(data.schedules).filter(empId => {
  // ✅ Wykryj zmianę z/do dnia wolnego
  if (oldSchedule.isDayOff !== newSchedule.isDayOff) return true;
  
  const oldAvailable = oldSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
  const newAvailable = newSchedule.timeSlots?.filter(s => s.status === 'available').length || 0;
  return oldAvailable !== newAvailable;
});
```

## ✅ Rezultat

### API Response (get-schedule):
```json
{
  "success": true,
  "schedule": {
    "employeeId": "EMPA252780002",
    "employeeName": "Mariusz Bielaszka",
    "date": "2025-10-06",
    "workingHours": "day-off",
    "timeSlots": [],
    "isDayOff": true,
    "dailyNotes": "Dzień wolny (serwisant nie ustawił godzin pracy)",
    "emergencyAvailable": false,
    "maxOvertimeToday": 0,
    "version": 2,
    "sourceSystem": "work-schedules.json"
  }
}
```

### API Response (get-all-schedules):
```json
{
  "success": true,
  "schedules": {
    "EMPA252780002": {
      "workingHours": "day-off",
      "timeSlots": [],
      "isDayOff": true,
      "dailyNotes": "Dzień wolny (serwisant nie ustawił godzin pracy)"
    }
  }
}
```

### Panel Przydziału Display:
```
Harmonogram (real-time): v2
┌─────────────────────────────────┐
│   🏖️ Dzień wolny               │
│   Serwisant nie ustawił         │
│   godzin pracy                  │
└─────────────────────────────────┘
```

## 📊 Scenariusze Testowe

### Scenariusz 1: Pracownik ma harmonogram w work-schedules.json ale dzień jest pusty
- **Oczekiwane**: Pokaż "Dzień wolny" ✅
- **Poprzednie**: Pokazywało 9:00-17:00 z workingHours ❌

### Scenariusz 2: Pracownik NIE ma harmonogramu w work-schedules.json
- **Oczekiwane**: Fallback do employee-schedules.json → workingHours ✅
- **Zachowanie**: Bez zmian (poprawne) ✅

### Scenariusz 3: Pracownik ma sloty na wtorek-sobotę, pusty poniedziałek
- **Oczekiwane**: Poniedziałek = pusty, reszta = normalne sloty ✅
- **Test**: Mariusz - poniedziałek pusty, wtorek 11:00-20:15 ✅

### Scenariusz 4: Pracownik usuwa wszystkie sloty na dany dzień
- **Oczekiwane**: Natychmiastowa aktualizacja do "Dzień wolny" ✅
- **Mechanizm**: 30-sekundowa synchronizacja + isDayOff change detection ✅

## 🔄 3-Tier Priority System - Po Naprawie

```
┌─────────────────────────────────────────────────┐
│ PRIORYTET 1: work-schedules.json                │
├─────────────────────────────────────────────────┤
│ IF schedule exists:                             │
│   - workSlots.length > 0 → Use slots            │
│   - workSlots.length === 0 → Day off (NEW!)    │
│                                                 │
│ IF schedule doesn't exist → Go to Priority 2   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ PRIORYTET 2: employee-schedules.json            │
├─────────────────────────────────────────────────┤
│ IF schedule exists → Use it                     │
│ IF not exists → Go to Priority 3               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ PRIORYTET 3: employees.json workingHours        │
├─────────────────────────────────────────────────┤
│ Auto-generate schedule from workingHours field  │
└─────────────────────────────────────────────────┘
```

## 📁 Zmodyfikowane Pliki

1. **pages/api/employee-calendar.js** (902 lines)
   - `convertWorkScheduleToDaily()` - Lines 71-150
   - `getEmployeeSchedule()` - Lines 304-350
   - `checkAvailability()` - Lines 431-490
   - `getAllSchedules()` - Lines 533-610

2. **pages/panel-przydzial-zlecen.js** (2858 lines)
   - Employee processing - Lines 170-245
   - Schedule sync - Lines 370-405
   - Schedule rendering - Lines 2025-2120

## 🧪 Weryfikacja

```powershell
# Test API dla pojedynczego pracownika
curl "http://localhost:3000/api/employee-calendar?action=get-schedule&employeeId=EMPA252780002&date=2025-10-06"
# Expected: isDayOff=true, timeSlots=[], workingHours="day-off"

# Test API dla wszystkich pracowników
curl "http://localhost:3000/api/employee-calendar?action=get-all-schedules&date=2025-10-06"
# Expected: EMPA252780002 ma isDayOff=true

# Test availability
curl "http://localhost:3000/api/employee-calendar?action=check-availability&employeeId=EMPA252780002&date=2025-10-06&duration=60"
# Expected: isAvailable=false, isDayOff=true
```

## 🎯 User Acceptance Criteria

- [x] Panel nie pokazuje 9:00-17:00 gdy serwisant usunął sloty
- [x] Panel pokazuje "🏖️ Dzień wolny" dla pustych dni
- [x] API zwraca isDayOff=true dla pustych dni
- [x] Fallback do workingHours działa gdy brak work-schedules.json
- [x] Inne dni tygodnia pokazują normalne sloty
- [x] 30-sekundowa synchronizacja wykrywa zmiany isDayOff
- [x] checkAvailability zwraca isAvailable=false dla dni wolnych

## 📝 Dodatkowe Notatki

- Flaga `isDayOff` jest propagowana przez cały system (API → Frontend)
- Frontend nie renderuje żadnych slotów gdy `todaySchedule.length === 0`
- Console logi pokazują "Dzień wolny" dla debugowania
- Synchronizacja działa też dla zmiany z dnia wolnego na normalny dzień (i odwrotnie)

---
**Status**: ✅ **KOMPLETNY**
**Tested**: ✅ API verified with curl
**Ready for UAT**: ✅ Odśwież panel (Ctrl+Shift+R) aby zobaczyć zmiany
