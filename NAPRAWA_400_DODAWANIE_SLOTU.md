# 🔧 NAPRAWA: Błąd 400 przy dodawaniu slotów myszką

## 📋 Problem

**Symptomy:**
```
POST /api/technician/work-schedule → 400 (Bad Request)
✅ Slot saved, schedule updated from server  ← Przed błędem
❌ 400 Bad Request  ← Następny slot
```

**Przyczyny:**
1. ❌ **Zbyt krótkie przeciągnięcie** - slot < 15 minut
2. ❌ **Identyczny czas** - startTime === endTime (po zaokrągleniu do 15 min)
3. ❌ **Nieprawidłowy zakres** - startTime >= endTime
4. ❌ **Nakładanie się** - słaba walidacja przed wysłaniem

---

## ✅ Rozwiązanie

### 1. Walidacja Przed Wysłaniem (handleMouseUp)

**Dodano:**
```javascript
const handleMouseUp = async (dayIndex) => {
  // ... konwersja pixelsToTime
  
  // ✅ WALIDACJA: Minimalna długość 15 minut
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  if (duration < 15) {
    console.log(`⚠️ Slot zbyt krótki: ${duration} minut (${startTime}-${endTime})`);
    return; // Pomijamy bez błędu
  }
  
  // Zapisz slot
  await saveDrawnSlot(dayIndex, startTime, endTime);
};
```

**Korzyści:**
- ✅ Filtruje zbyt krótkie sloty przed wysłaniem do API
- ✅ Brak niepotrzebnych requestów 400
- ✅ Przyjazne logowanie w console

### 2. Dodatkowa Walidacja w saveDrawnSlot

**Dodano:**
```javascript
const saveDrawnSlot = async (dayIndex, startTime, endTime) => {
  // ✅ LOGOWANIE: Co wysyłamy
  console.log(`📤 Saving slot: day=${dayIndex}, ${startTime}-${endTime}, type=${drawMode}`);
  
  // ✅ WALIDACJA: Sprawdź zakres czasu
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = timeToMinutes(endTime);
  
  if (newStartMinutes >= newEndMinutes) {
    console.error(`❌ INVALID TIME RANGE: ${startTime} >= ${endTime}`);
    showToast('❌ Nieprawidłowy czas: koniec nie może być przed początkiem', 'error');
    return;
  }
  
  // ... sprawdź nakładanie
  
  console.log('📦 Payload:', JSON.stringify(payload));
  
  // Wyślij do API
};
```

**Korzyści:**
- 🔍 Szczegółowe logowanie każdego slotu
- ✅ Walidacja przed wysłaniem do API
- 📦 Widać dokładny payload w console

### 3. Lepsze Logowanie Błędów

**Dodano:**
```javascript
const data = await res.json();

if (data.success) {
  console.log('✅ Slot saved, schedule updated from server');
} else {
  // ✅ LOGOWANIE BŁĘDU
  console.error(`❌ API Error: ${data.error}`, data);
  
  if (data.error === 'OVERLAP') {
    console.log('⚠️ Slot overlaps with existing slot - silently ignored');
  } else {
    showToast('❌ ' + data.message, 'error');
    await loadSchedule(token, currentWeekStart);
  }
}
```

**Korzyści:**
- 🔍 Widać dokładny błąd API w console
- ✅ Różne obsługi dla różnych błędów
- 📊 Łatwiejszy debugging

---

## 🧪 Scenariusze Testowe

### Test 1: Bardzo Krótkie Przeciągnięcie

**Krok 1:** Otwórz `/technician/schedule`

**Krok 2:** Kliknij i przeciągnij mysz o ~5 pikseli (< 15 minut)

**Oczekiwany rezultat:**
```
Console: ⚠️ Slot zbyt krótki: 0 minut (09:00-09:00)
UI: Slot NIE jest dodawany (pomijany)
API: Brak requestu (oszczędność)
```

### Test 2: Identyczny Czas (po zaokrągleniu)

**Krok 1:** Przeciągnij mysz tak, żeby po zaokrągleniu do 15 min był ten sam czas

**Oczekiwany rezultat:**
```
Console: ⚠️ Slot zbyt krótki: 0 minut (09:15-09:15)
UI: Slot NIE jest dodawany
```

### Test 3: Normalny Slot (15+ minut)

**Krok 1:** Przeciągnij mysz na większą odległość (np. 2 godziny)

**Oczekiwany rezultat:**
```
Console: 
  📤 Saving slot: day=1, 09:00-11:00, type=work
  📦 Payload: {"slotData":{...},"weekStart":"2025-10-06"}
  POST /api/technician/work-schedule → 201 Created
  ✅ Slot saved, schedule updated from server
  
UI: Slot pojawia się na timeline ✅
```

### Test 4: Nakładający Się Slot

**Krok 1:** Dodaj slot 09:00-12:00

**Krok 2:** Spróbuj dodać slot 10:00-11:00 (nakłada się)

**Oczekiwany rezultat:**
```
Console: 
  ⚠️ Slot nakłada się z 09:00-12:00 - pomijam zapis
  
UI: Drugi slot NIE jest dodawany (lokalna walidacja)
API: Brak requestu
```

### Test 5: Błąd 400 z API (edge case)

**Jeśli mimo walidacji frontend dostanie 400:**

**Oczekiwany rezultat:**
```
Console:
  📤 Saving slot: day=1, 09:00-11:00, type=work
  POST /api/technician/work-schedule → 400 Bad Request
  ❌ API Error: INVALID_TIME_FORMAT {error: "...", message: "..."}
  
Toast: ❌ Time must be in HH:MM format
UI: Automatyczne odświeżenie z serwera ✅
```

---

## 📊 Flow Danych

### Przed Naprawą:

```
User: Przeciągnij mysz (1 piksel)
  ↓
handleMouseUp()
  ↓
pixelsToTime(0.1%) → "00:00"
pixelsToTime(0.2%) → "00:00" (zaokrąglone do 15 min)
  ↓
startTime === endTime → if (startTime !== endTime) ❌ FALSE
  ↓
❌ Slot NIE jest wysyłany (pomijany w handleMouseUp)
  
---

ALTERNATYWNIE (jeśli małe przeciągnięcie daje różne czasy):

User: Przeciągnij mysz (10 pikseli = 10 minut)
  ↓
pixelsToTime(1%) → "00:00"
pixelsToTime(2%) → "00:00" (zaokrąglone)
  ↓
startTime === endTime → false (przechodzi)
  ↓
saveDrawnSlot("00:00", "00:00")
  ↓
POST → API
  ↓
Backend: timeToMinutes("00:00") >= timeToMinutes("00:00") → TRUE
  ↓
Response: 400 Bad Request { error: "INVALID_TIME_RANGE" }
  ↓
Frontend: ❌ Błąd, ale brak szczegółów w console
```

### Po Naprawie:

```
User: Przeciągnij mysz (10 pikseli = 10 minut)
  ↓
handleMouseUp()
  ↓
pixelsToTime() → startTime="09:00", endTime="09:00"
  ↓
✅ WALIDACJA: duration = 0 minut
  ↓
if (duration < 15) → TRUE
  ↓
console.log("⚠️ Slot zbyt krótki: 0 minut")
return; ← ZATRZYMAJ przed wysłaniem
  ↓
❌ Brak requestu do API (oszczędność)
✅ Brak błędu 400
✅ Przyjazne logowanie

---

NORMALNY SLOT (60 minut):

User: Przeciągnij mysz (większa odległość)
  ↓
handleMouseUp()
  ↓
pixelsToTime() → startTime="09:00", endTime="10:00"
  ↓
✅ WALIDACJA: duration = 60 minut → OK
  ↓
saveDrawnSlot("09:00", "10:00")
  ↓
console.log("📤 Saving slot: day=1, 09:00-10:00, type=work")
  ↓
✅ WALIDACJA: newStartMinutes (540) < newEndMinutes (600) → OK
  ↓
console.log("📦 Payload: {...}")
  ↓
POST → API
  ↓
Backend: Wszystkie walidacje OK
  ↓
Response: 201 Created { success: true, schedule: {...} }
  ↓
console.log("✅ Slot saved, schedule updated from server")
  ↓
UI: Slot pojawia się na timeline ✅
```

---

## 🎯 Kluczowe Zmiany

### 1. Walidacja Długości Slotu

**Przed:**
```javascript
if (startTime !== endTime) {
  await saveDrawnSlot(...);
}
// ❌ Nie sprawdza minimalnej długości (15 min)
```

**Po:**
```javascript
const duration = endMinutes - startMinutes;
if (duration < 15) {
  console.log(`⚠️ Slot zbyt krótki: ${duration} minut`);
  return;
}
await saveDrawnSlot(...);
// ✅ Filtruje sloty < 15 minut
```

### 2. Walidacja Zakresu Czasu

**Przed:**
```javascript
// Brak walidacji - wysyła do API
const slotData = { startTime, endTime, ... };
```

**Po:**
```javascript
if (newStartMinutes >= newEndMinutes) {
  console.error(`❌ INVALID TIME RANGE: ${startTime} >= ${endTime}`);
  showToast('❌ Nieprawidłowy czas', 'error');
  return;
}
// ✅ Walidacja przed wysłaniem
```

### 3. Szczegółowe Logowanie

**Przed:**
```javascript
// Brak logów - trudny debugging
await fetch('/api/technician/work-schedule', { ... });
```

**Po:**
```javascript
console.log(`📤 Saving slot: day=${dayIndex}, ${startTime}-${endTime}`);
console.log('📦 Payload:', JSON.stringify(payload));
await fetch('/api/technician/work-schedule', { ... });
// ✅ Widać dokładnie co jest wysyłane
```

---

## 📁 Zmienione Pliki

**pages/technician/schedule.js:**
- `handleMouseUp()` - walidacja długości slotu (< 15 min)
- `saveDrawnSlot()` - walidacja zakresu czasu, szczegółowe logowanie
- Response handling - lepsze logowanie błędów API

---

## 🎉 Rezultat

### Przed Naprawą:
```
❌ Błędy 400 przy małych przeciągnięciach
❌ Brak informacji dlaczego slot nie został dodany
❌ Niepotrzebne requesty do API
❌ Trudny debugging
```

### Po Naprawie:
```
✅ Walidacja przed wysłaniem do API
✅ Przyjazne logi w console
✅ Brak niepotrzebnych requestów 400
✅ Łatwy debugging (widać payload i błędy)
✅ Auto-refresh przy innych błędach
```

---

## 🚀 Wdrożenie

**Zmiany już w kodzie** ✅

**Testowanie:**
1. Odśwież stronę: `http://localhost:3000/technician/schedule`
2. Otwórz DevTools Console (F12)
3. Spróbuj dodać:
   - Bardzo krótki slot (< 15 min) → powinien być pomijany
   - Normalny slot (> 15 min) → powinien być dodany
4. Sprawdź logi w console - powinny być szczegółowe

**Status:** 🟢 **PROBLEM ROZWIĄZANY**

Data naprawy: 2025-10-06
