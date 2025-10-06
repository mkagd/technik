# 📅 Harmonogram Serwisantów - Synchronizacja Danych

## 👤 Pracownicy w Systemie

### EMPA252780002 - Mariusz Bielaszka
- **Rola**: Serwisant AGD
- **Specjalizacja**: Piekarniki, Płyty indukcyjne, Kuchenki, Okapy
- **Godziny pracy**: 9:00-17:00
- **Obszar**: Warszawa (Śródmieście, Wola, Ochota, Bemowo)
- **Doświadczenie**: 5 lat

### EMPA252780001 - Mario Średziński  
- **Rola**: Serwisant AGD
- **Specjalizacja**: Pralki, Lodówki, Zmywarki, Piekarniki
- **Godziny pracy**: 8:00-16:00
- **Obszar**: Warszawa (Mokotów, Ursynów, Wilanów, Włochy)
- **Doświadczenie**: 8 lat

---

## 📂 System Harmonogramów - 3 Źródła Danych

### 1. **work-schedules.json** (Najwyższy priorytet) ⭐
**Lokalizacja**: `data/work-schedules.json`

**Ustawiany przez**: Serwisanta (strona `/technician/schedule`)

**Struktura**: 
```json
{
  "id": "SCH-xxx",
  "employeeId": "EMPA252780002",
  "weekStart": "2025-10-06",
  "workSlots": [
    {
      "id": "SLOT-xxx",
      "dayOfWeek": 0,  // 0=niedziela, 1=pon, 2=wt, ..., 6=sob
      "startTime": "10:15",
      "endTime": "19:15",
      "type": "work",
      "duration": 540,
      "notes": "Praca"
    }
  ],
  "breaks": [
    {
      "id": "SLOT-yyy",
      "dayOfWeek": 1,
      "startTime": "13:00",
      "endTime": "14:00",
      "type": "break",
      "duration": 60
    }
  ]
}
```

**Operacje**:
- ✅ Dodawanie slotów (zielonych - praca)
- ✅ Dodawanie przerw (czerwonych - break)
- ✅ Usuwanie slotów (klik 2x)
- ✅ Kopiowanie tygodni
- ✅ Rysowanie myszką (drag & drop)

**API**: `/api/technician/work-schedule`
- GET - pobiera harmonogram na tydzień
- POST - dodaje slot/break
- DELETE - usuwa slot

---

### 2. **employee-schedules.json** (Średni priorytet) 🔄
**Lokalizacja**: `data/employee-schedules.json`

**Ustawiany przez**: Admin (stary system, fallback)

**Struktura**:
```json
{
  "schedules": {
    "2025-10-01": {
      "EMP25189001": {
        "employeeId": "EMP25189001",
        "date": "2025-10-01",
        "timeSlots": [
          {
            "time": "08:00",
            "status": "available",
            "duration": 15,
            "activity": null
          },
          {
            "time": "12:00",
            "status": "break",
            "duration": 15,
            "activity": "Przerwa"
          }
        ]
      }
    }
  }
}
```

**Używany gdy**: Brak danych w `work-schedules.json`

---

### 3. **employees.json workingHours** (Najniższy priorytet) 📄
**Lokalizacja**: `data/employees.json`

**Pole**: `workingHours: "9:00-17:00"`

**Używany gdy**: Brak danych w obu powyższych plikach - auto-generuje harmonogram

---

## 🔄 Jak Działa Panel Przydziału Zleceń?

**Strona**: `/panel-przydzial-zlecen`

**API używane**: `/api/employee-calendar`

### Priorytet wczytywania danych:

```javascript
// KROK 1: Sprawdź work-schedules.json
const workScheduleData = convertWorkScheduleToDaily(employeeId, date);
if (workScheduleData.timeSlots.length > 0) {
  return workScheduleData; // ✅ Użyj danych z technika
}

// KROK 2: Sprawdź employee-schedules.json
const schedule = schedulesData.schedules[date]?.[employeeId];
if (schedule) {
  return schedule; // ✅ Użyj danych admina
}

// KROK 3: Wygeneruj z employees.json
const employee = employees.find(emp => emp.id === employeeId);
return generateFromWorkingHours(employee.workingHours); // ✅ Auto-generate
```

---

## 🔍 Konwersja: work-schedules.json → Sloty 15-minutowe

**Funkcja**: `convertWorkScheduleToDaily(employeeId, date)`

**Co robi**:
1. Wczytuje `work-schedules.json`
2. Znajduje harmonogram dla pracownika i tygodnia
3. Oblicza `dayOfWeek` dla podanej daty
4. Filtruje sloty dla tego dnia
5. Konwertuje na 15-minutowe bloki (00:00-23:45)

**Przykład**:

**Input** (work-schedules.json):
```json
{
  "dayOfWeek": 0,  // niedziela
  "startTime": "10:15",
  "endTime": "19:15",
  "type": "work"
}
```

**Output** (timeSlots 15-min):
```javascript
[
  { time: "10:15", status: "available", duration: 15 },
  { time: "10:30", status: "available", duration: 15 },
  { time: "10:45", status: "available", duration: 15 },
  // ... (36 slotów)
  { time: "19:00", status: "available", duration: 15 }
]
```

---

## ✅ Aktualny Stan Danych (2025-10-06)

### Mariusz Bielaszka (EMPA252780002)

**Tydzień**: 2025-10-06 (niedziela) - 2025-10-12 (sobota)

**Sloty pracy**:
- 🟢 **Niedziela 06.10**: 10:15-19:15 (9h)
- 🟢 **Poniedziałek 07.10**: 06:00-09:15 (3h 15min)
- 🟢 **Środa 09.10**: 13:15-15:45 (2h 30min)
- 🟢 **Sobota 12.10**: 09:30-18:15 (8h 45min)

**Przerwy**: Brak

**Łącznie**: 23h 30min pracy w tygodniu

---

## 🔧 Operacje - Instrukcje

### Dodawanie Slotów Pracy (Zielone)

**Metoda 1: Przycisk "Dodaj slot"**
1. Kliknij "Dodaj slot pracy"
2. Wybierz dzień tygodnia
3. Podaj godziny (HH:MM)
4. Zapisz

**Metoda 2: Rysowanie myszką** (NOWE!)
1. Kliknij i przytrzymaj LPM na timeline
2. Przeciągnij w dół (minimum 15 minut)
3. Puść LPM
4. ✅ Slot zapisuje się automatycznie

**Walidacja**:
- ✅ Format czasu: HH:MM
- ✅ Wielokrotność 15 minut
- ✅ Minimalna długość: 15 minut
- ✅ Maksymalna długość: 12 godzin
- ✅ Bez nakładania się

---

### Dodawanie Przerw (Czerwone)

**Sposób**:
1. Zmień tryb na "Przerwa" (przełącznik)
2. Użyj przycisku lub myszki (jak powyżej)

---

### Usuwanie Slotów

**Sposób**:
1. **Pierwszy klik** na slot → Toast: "⚠️ Kliknij ponownie aby usunąć"
2. **Drugi klik** (w ciągu 3 sek) → Usuwa slot

**Co się dzieje**:
```javascript
DELETE /api/technician/work-schedule?slotId=SLOT-xxx&weekStart=2025-10-06
```

**Obsługa błędów**:
- 404 (slot nie istnieje) → Auto-refresh z serwera
- 200 (sukces) → Płynna aktualizacja UI

---

## 🐛 Typowe Problemy

### Problem: "Panel przydziału pokazuje sloty, ale w harmonogramie technika nie widać"

**Przyczyna**: Patrzysz na różne tygodnie lub różnych pracowników

**Rozwiązanie**:
1. Sprawdź `weekStart` w work-schedules.json
2. Upewnij się że jesteś zalogowany jako ten sam employeeId
3. Sprawdź zakładkę "Bieżący tydzień" w obu panelach

---

### Problem: "Błąd 400 Bad Request przy dodawaniu slotu"

**Przyczyny**:
- ❌ StartTime >= EndTime (za krótkie przeciągnięcie)
- ❌ Nieprawidłowy format czasu
- ❌ Czas nie jest wielokrotnością 15 min
- ❌ Nakładanie się z innym slotem

**Rozwiązanie**: Sprawdź console - są teraz szczegółowe logi:
```
📤 Saving slot: day=0, 10:15-19:15, type=work
📦 Payload: {...}
✅ Slot saved
```

---

### Problem: "Błąd 404 Not Found przy usuwaniu"

**Przyczyna**: Slot już został usunięty (przez inną sesję/okno)

**Obsługa**: Automatyczne odświeżenie harmonogramu z serwera

---

## 📊 Synchronizacja z Panelem Admina

**Częstotliwość**: Auto-refresh co 30 sekund

**Maksymalne opóźnienie**: 29 sekund między aktualizacją technika a widokiem w panelu przydziału

**Nie wymaga**: Ręcznego odświeżania strony

---

## 🔒 Bezpieczeństwo

**Autoryzacja**: Bearer Token
- Przechowywany w `localStorage.getItem('technicianToken')`
- Wysyłany w nagłówku `Authorization: Bearer ${token}`
- Walidowany przez middleware

**Rate Limiting**:
- Development: 10,000 req/min
- Production: 1,000 req/15min

---

## 📈 Statystyki

**Obliczane automatycznie**:
- Łączna liczba slotów pracy
- Łączna liczba przerw
- Łączny czas pracy (minuty)
- Średni czas pracy na dzień
- Wykorzystanie tygodnia (%)

**Widoczne**:
- Na stronie `/technician/schedule` (panel serwisanta)
- W API response (każdy request)

---

## 🚀 Następne Kroki

### Zalecane usprawnienia:

1. **Migracja na bazę danych** (Supabase/PostgreSQL)
   - Obecnie: Pliki JSON
   - Przyszłość: Relacyjna baza danych
   - Korzyści: Transakcje, współbieżność, performance

2. **Real-time synchronizacja** (WebSocket/Socket.io)
   - Obecnie: Auto-refresh co 30s
   - Przyszłość: Instant updates
   - Korzyści: Natychmiastowa synchronizacja między panelami

3. **Historia zmian** (Audit log)
   - Kto? Co? Kiedy?
   - Cofanie zmian
   - Raportowanie

---

## 📞 Support

**Problem z harmonogramami?**

1. Sprawdź console (F12) - szczegółowe logi
2. Sprawdź terminal `npm run dev` - logi backendu
3. Sprawdź pliki:
   - `data/work-schedules.json`
   - `data/employee-schedules.json`
   - `data/employees.json`

**Kontakt**: Zobacz dokumentację w repo

---

**Status**: ✅ System działa poprawnie  
**Data**: 2025-10-06  
**Wersja**: 2.0 (work-schedules.json priority)
