# 🔧 BUGFIX: Part-Requests API - Format pliku

**Data:** 15 października 2025  
**Status:** ✅ NAPRAWIONO

---

## 🐛 Problem

### Objawy:
```
POST http://localhost:3000/api/part-requests 500 (Internal Server Error)
Error creating request: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Przyczyna:

Plik `data/part-requests.json` ma format **obiektu z kluczem `requests`**:
```json
{
  "requests": [...]
}
```

Ale API w `pages/api/part-requests/index.js` zapisywało **bezpośrednio tablicę**:
```javascript
// ❌ ŹLE (stary kod):
const requests = readJSON(partRequestsPath) || [];
requests.push(newRequest);
writeJSON(partRequestsPath, requests); // Zapisuje [...] zamiast {requests:[...]}
```

**Efekt:**
- Pierwsze zamówienie: OK (API tworzy `[]`)
- Drugie zamówienie: ❌ ERROR 500 (API nie może odczytać struktury)

---

## ✅ Rozwiązanie

### 1. POST Handler - Tworzenie zamówienia

**Poprawiony kod** (linie ~323-350):

```javascript
// Dodaj do listy - OBSŁUGA ZARÓWNO [] JAK I { requests: [] }
const data = readJSON(partRequestsPath);
let requests = [];

if (Array.isArray(data)) {
  // Stary format - tablica
  requests = data;
} else if (data && data.requests && Array.isArray(data.requests)) {
  // Nowy format - obiekt z kluczem requests
  requests = data.requests;
} else if (data === null || data === undefined) {
  // Brak pliku lub pusty
  requests = [];
} else {
  logger.error('❌ Nieprawidłowy format part-requests.json:', data);
  return res.status(500).json({ 
    success: false, 
    error: 'Nieprawidłowy format pliku zamówień' 
  });
}

requests.push(newRequest);

// Zapisz w odpowiednim formacie (zachowaj strukturę { requests: [] })
const saveData = data && typeof data === 'object' && !Array.isArray(data)
  ? { ...data, requests } // Zachowaj inne klucze jeśli istnieją
  : requests; // Stary format - sama tablica

if (!writeJSON(partRequestsPath, saveData)) {
  return res.status(500).json({ 
    success: false, 
    error: 'Nie można zapisać zamówienia' 
  });
}
```

**Logika:**
1. ✅ Odczyt: Rozpoznaj czy `[]` czy `{requests:[]}`
2. ✅ Dodanie: Dodaj nowe zamówienie do tablicy
3. ✅ Zapis: Zapisz w TYM SAMYM formacie co odczytano

---

### 2. PUT Handler - Aktualizacja zamówienia (zdjęcia)

**Poprawiony kod** (linie ~408-445):

```javascript
const data = readJSON(partRequestsPath);
if (!data) {
  return res.status(500).json({ success: false, error: 'Could not read requests' });
}

// Obsługa zarówno [] jak i { requests: [] }
let requests = Array.isArray(data) ? data : (data.requests || []);

const requestIndex = requests.findIndex(r => r.requestId === requestId);
if (requestIndex === -1) {
  return res.status(404).json({ success: false, error: 'Request not found' });
}

// Update attachedPhotos if provided
if (attachedPhotos) {
  requests[requestIndex].attachedPhotos = attachedPhotos;
}

// Update timestamp
requests[requestIndex].updatedAt = new Date().toISOString();

// Zapisz w tym samym formacie co odczytano
const saveData = data && typeof data === 'object' && !Array.isArray(data)
  ? { ...data, requests }
  : requests;

// Save updated requests
if (!writeJSON(partRequestsPath, saveData)) {
  return res.status(500).json({ success: false, error: 'Could not save updated request' });
}
```

---

### 3. GET Handler - Odczyt (już działał poprawnie)

**Kod** (linie ~135-140):

```javascript
// ✅ FIX: Pobierz tablicę z obiektu { requests: [...] }
let requests = Array.isArray(data) ? data : (data.requests || []);
```

---

## 🧪 Testowanie

### Test 1: Utworzenie pierwszego zamówienia

```bash
POST /api/part-requests
{
  "requestedBy": "EMPA252780002",
  "requestedFor": "EMPA252780002",
  "parts": [{ "partId": "NORTH-123", "quantity": 1 }],
  "urgency": "standard"
}
```

**Oczekiwany rezultat:**
```json
✅ Status: 201 Created
✅ Body: { "success": true, "request": {...}, "message": "Zamówienie ... utworzone" }
✅ Plik: {
  "requests": [
    { "requestId": "ZC-...", ... }
  ]
}
```

---

### Test 2: Utworzenie drugiego zamówienia

```bash
POST /api/part-requests (drugi raz)
```

**Oczekiwany rezultat:**
```json
✅ Status: 201 Created (nie 500!)
✅ Plik: {
  "requests": [
    { "requestId": "ZC-001", ... },
    { "requestId": "ZC-002", ... }  // ← Drugie zamówienie dodane
  ]
}
```

---

### Test 3: Aktualizacja zdjęć

```bash
PUT /api/part-requests
{
  "requestId": "ZC-001",
  "attachedPhotos": ["photo1.jpg", "photo2.jpg"]
}
```

**Oczekiwany rezultat:**
```json
✅ Status: 200 OK
✅ Format pliku zachowany: { requests: [...] }
```

---

## 📋 Pliki zmodyfikowane

| Plik | Linie | Zmiany |
|------|-------|--------|
| `pages/api/part-requests/index.js` | 323-350 | ✅ POST: Obsługa formatów + zachowanie struktury |
| `pages/api/part-requests/index.js` | 408-445 | ✅ PUT: Obsługa formatów + zachowanie struktury |
| `pages/api/part-requests/index.js` | 135-140 | ✅ GET: Już działało (nie zmieniono) |

---

## 🔒 Backward Compatibility

API teraz wspiera **OBA formaty**:

### Format 1: Tablica (stary)
```json
[
  { "requestId": "ZC-001", ... },
  { "requestId": "ZC-002", ... }
]
```

### Format 2: Obiekt (nowy)
```json
{
  "requests": [
    { "requestId": "ZC-001", ... },
    { "requestId": "ZC-002", ... }
  ]
}
```

**API automatycznie:**
1. ✅ Rozpoznaje format przy odczycie
2. ✅ Zapisuje w tym samym formacie
3. ✅ Wspiera migrację między formatami

---

## ⚠️ Znane problemy

### Problem: `GET /technician/magazyn/[object%20Object]`

**Objaw:** W logach konsoli pojawia się błąd 404 z URL zawierającym `[object Object]`

**Przyczyna:** Gdzieś w kodzie jest link który otrzymuje obiekt zamiast stringa:
```javascript
// ❌ ŹLE:
<Link href={someObject}>...</Link>

// ✅ DOBRZE:
<Link href={`/path/${someObject.id}`}>...</Link>
```

**Status:** 🔍 Do zbadania (nie krytyczny - nie blokuje funkcjonalności)

**Lokalizacja:** Prawdopodobnie w `pages/technician/magazyn/zamow.js` w sekcji historii zamówień lub podglądu części.

---

## 📝 Changelog

**v1.1.0 - 15.10.2025**
- ✅ Naprawiono POST: Zachowanie formatu `{requests:[]}`
- ✅ Naprawiono PUT: Zachowanie formatu `{requests:[]}`
- ✅ Dodano backward compatibility dla `[]` i `{requests:[]}`
- ✅ Dodano szczegółową walidację formatu pliku
- ✅ Dodano logi debug dla troubleshootingu

---

## 🚀 Wdrożenie

1. ✅ Kod został zaktualizowany w `pages/api/part-requests/index.js`
2. ⏳ **Tester musi:**
   - Hard refresh (Ctrl+Shift+R) w przeglądarce
   - Spróbować dodać część z North.pl
   - Wysłać zamówienie
   - Sprawdzić czy nie ma błędu 500
   - Dodać drugie zamówienie (test konsekwencji)

---

**Status końcowy:** ✅ **NAPRAWIONE - Gotowe do testów**
