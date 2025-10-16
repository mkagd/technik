# 🔍 DEBUG: Problem z autoryzacją 401

## Problem
```
Failed to load resource: 401 (Unauthorized)
- /api/technician/visits
- /api/technician/complete-visit
```

## 🎯 Przyczyny i rozwiązania

### 1. **Token nie istnieje w localStorage**

**Sprawdź w Console (F12):**
```javascript
localStorage.getItem('technicianToken')
localStorage.getItem('employeeToken')
localStorage.getItem('technicianEmployee')
localStorage.getItem('employeeSession')
```

**Jeśli wszystkie są `null`:**
- ❌ Nie jesteś zalogowany!
- ✅ **ROZWIĄZANIE:** Zaloguj się ponownie

---

### 2. **Token wygasł (7 dni)**

**Sprawdź wiek tokenu:**
```javascript
// Otwórz: data/employee-sessions.json
// Znajdź swój token (EMPA252780002)
// Sprawdź: createdAt
```

**Jeśli starszy niż 7 dni:**
- ❌ Token wygasł
- ✅ **ROZWIĄZANIE:** Zaloguj się ponownie

---

### 3. **Brak employeeId w sesji**

**Sprawdź strukturę:**
```javascript
// data/employee-sessions.json
{
  "token": "abc123...",
  "employeeId": "EMPA252780002",  // ← MUSI ISTNIEĆ!
  "isValid": true,                 // ← MUSI BYĆ true!
  "createdAt": "2025-10-13T..."
}
```

---

## 🔧 SZYBKIE ROZWIĄZANIE

### Krok 1: Wyloguj się
```
Ctrl+Shift+C (Console)
localStorage.clear()
location.reload()
```

### Krok 2: Zaloguj ponownie
```
http://localhost:3000/pracownik-logowanie
Email: mariusz.bielaszka@techserwis.pl
Hasło: haslo123
```

### Krok 3: Sprawdź czy token jest ustawiony
```javascript
// W Console po zalogowaniu:
localStorage.getItem('employeeToken')
// Powinno zwrócić długi string, np: "eyJhbGc..."
```

### Krok 4: Sprawdź czy API widzi token
```javascript
// W Console:
fetch('/api/technician/visits', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
  }
}).then(r => r.json()).then(console.log)

// Powinno zwrócić: { success: true, visits: [...] }
// NIE powinno: { error: "Nieprawidłowy lub wygasły token" }
```

---

## 🐛 Debugging krok po kroku

### Test 1: Czy token istnieje?
```javascript
console.log('Token:', localStorage.getItem('employeeToken'));
```
- ✅ Zwraca string → OK, token istnieje
- ❌ Zwraca null → ZALOGUJ SIĘ PONOWNIE

### Test 2: Czy API otrzymuje token?
Otwórz: **Network tab (F12) → Headers**

Kliknij na request: `/api/technician/visits`

Sprawdź **Request Headers:**
```
Authorization: Bearer eyJhbGc...
```

- ✅ Jest nagłówek Authorization → OK
- ❌ Brak nagłówka → Problem w frontend (sprawdź fetch)

### Test 3: Czy backend akceptuje token?
Sprawdź **Response:**
```json
{
  "error": "Nieprawidłowy lub wygasły token"
}
```

**Jeśli tak:**
1. Otwórz: `data/employee-sessions.json`
2. Znajdź token (Ctrl+F wklej token z localStorage)
3. Sprawdź:
   - `isValid: true` ✅
   - `employeeId: "EMPA252780002"` ✅
   - `createdAt` nie starszy niż 7 dni ✅

---

## 🔨 Manualny fix (jeśli nic nie działa)

### Utwórz nową sesję ręcznie:

**Plik:** `data/employee-sessions.json`

**Dodaj:**
```json
{
  "token": "DEBUG-TOKEN-12345",
  "employeeId": "EMPA252780002",
  "email": "mariusz.bielaszka@techserwis.pl",
  "fullName": "Mariusz Bielaszka",
  "isValid": true,
  "createdAt": "2025-10-13T10:00:00.000Z"
}
```

**Następnie w Console:**
```javascript
localStorage.setItem('employeeToken', 'DEBUG-TOKEN-12345');
localStorage.setItem('employeeSession', JSON.stringify({
  id: 'EMPA252780002',
  email: 'mariusz.bielaszka@techserwis.pl',
  fullName: 'Mariusz Bielaszka'
}));
location.reload();
```

---

## ✅ Checklisty

### Frontend sprawdzenie:
- [ ] localStorage ma 'employeeToken'
- [ ] fetch() wysyła nagłówek Authorization
- [ ] Token nie jest null/undefined

### Backend sprawdzenie:
- [ ] employee-sessions.json istnieje
- [ ] Token istnieje w pliku
- [ ] isValid = true
- [ ] employeeId istnieje
- [ ] createdAt < 7 dni temu

### API sprawdzenie:
- [ ] validateToken() sprawdza employee-sessions.json
- [ ] fs.existsSync() znajduje plik
- [ ] JSON.parse() nie rzuca błędu
- [ ] employeeId jest zwracany

---

## 🚨 Najczęstsze problemy

### 1. "401 pomimo zalogowania"
**Przyczyna:** Token w localStorage ≠ token w employee-sessions.json

**Fix:** Wyloguj + zaloguj ponownie

### 2. "401 tylko na niektórych endpointach"
**Przyczyna:** Niektóre API nie mają multi-auth fallback

**Fix:** Sprawdź czy wszystkie mają:
```javascript
// employee-sessions.json fallback
const employeeSessionsPath = path.join(process.cwd(), 'data', 'employee-sessions.json');
if (fs.existsSync(employeeSessionsPath)) {
  const empSessions = JSON.parse(fs.readFileSync(employeeSessionsPath, 'utf-8'));
  const empSession = empSessions.find(s => s.token === token && s.isValid);
  if (empSession) return empSession.employeeId;
}
```

### 3. "Network error / CORS"
**Przyczyna:** Serwer nie działa lub port zajęty

**Fix:** Restart serwera: `npm run dev`

---

**Data utworzenia:** 13 października 2025  
**Autor:** System AI  
**Status:** DEBUG GUIDE
