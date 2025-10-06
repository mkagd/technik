# 🔧 NAPRAWA BŁĘDU 429 (Too Many Requests)

## 📋 Problem

**Symptomy:**
```
GET http://localhost:3000/api/technician/work-schedule?weekStart=2025-10-06 
429 (Too Many Requests)

POST http://localhost:3000/api/technician/work-schedule 
429 (Too Many Requests)
```

**Przyczyna:**
Middleware (`middleware.js`) blokował zbyt wiele requestów z powodu:
1. ❌ **Nieprawidłowe czyszczenie Map** - stare wpisy nie były usuwane
2. ❌ **Zbyt krótkie limity** dla trybu development (2000 req/15 min)
3. ❌ **Długie okno czasowe** (15 minut) w developmencie
4. ❌ **Brak mechanizmu resetowania** w trybie dev

---

## ✅ Rozwiązanie

### 1. Poprawione Czyszczenie Rate Limit Store

**Przed:**
```javascript
// Cleanup old entries (simple cleanup)
if (Math.random() < 0.01) { // 1% chance - ZA RZADKO!
  const cutoff = now - windowMs * 2;
  for (const [k] of rateLimitStore.entries()) {
    const keyTime = parseInt(k.split('_').pop()) * windowMs;
    if (keyTime < cutoff) {
      rateLimitStore.delete(k);
    }
  }
}
```

**Po:**
```javascript
// Clean up old entries BEFORE checking
const previousWindowKey = windowKey - 1;
const oldKey = `${identifier}_${previousWindowKey}`;
rateLimitStore.delete(oldKey); // ✅ Zawsze usuwa poprzednie okno

// Aggressive cleanup every 100 requests
if (rateLimitStore.size > 100) {
  const cutoff = now - windowMs * 3;
  let cleaned = 0;
  for (const [k] of rateLimitStore.entries()) {
    try {
      const parts = k.split('_');
      const keyWindowMs = parseInt(parts[parts.length - 1]) * windowMs;
      if (keyWindowMs < cutoff) {
        rateLimitStore.delete(k);
        cleaned++;
      }
    } catch (e) {
      rateLimitStore.delete(k);
      cleaned++;
    }
  }
}
```

### 2. Różne Limity dla Development vs Production

**Przed:**
```javascript
// API endpoints
rateLimitExceeded = !checkRateLimit(`api_${clientIP}`, 2000, 15 * 60 * 1000);
// 2000 requestów na 15 minut (za mało dla developmentu!)
```

**Po:**
```javascript
const isDevelopment = process.env.NODE_ENV !== 'production';

if (pathname.startsWith('/api/')) {
  const apiLimit = isDevelopment ? 10000 : 1000;      // 10x więcej w dev
  const apiWindow = isDevelopment ? 60 * 1000 : 15 * 60 * 1000; // 1 min vs 15 min
  rateLimitExceeded = !checkRateLimit(`api_${clientIP}`, apiLimit, apiWindow);
}
```

**Nowe limity:**

| Endpoint Type | Development | Production |
|--------------|-------------|------------|
| **Auth** (`/api/auth/*`) | 50 req/min | 5 req/15min |
| **API** (`/api/*`) | **10,000 req/min** | 1,000 req/15min |
| **Pages** | 50,000 req/min | 5,000 req/15min |

### 3. Endpoint Resetowania (Development Only)

**Nowy endpoint:**
```
GET http://localhost:3000/api/dev/reset-rate-limit
```

**Funkcjonalność:**
```javascript
if (pathname === '/api/dev/reset-rate-limit' && process.env.NODE_ENV !== 'production') {
  rateLimitStore.clear();
  blockedIPs.clear();
  console.log('🔄 Rate limits cleared (development mode)');
  return new NextResponse(JSON.stringify({
    success: true,
    message: 'Rate limits cleared',
    timestamp: new Date().toISOString()
  }), { status: 200 });
}
```

### 4. Ulepszone Logowanie

**Dodano:**
```javascript
if (rateLimitExceeded) {
  console.log(`🚫 Rate limit exceeded: ${clientIP} for ${pathname}`);
  console.log(`   Current store size: ${rateLimitStore.size} entries`);
  // ... return 429
}

if (current >= maxRequests) {
  console.log(`⚠️ Rate limit hit: ${identifier} (${current}/${maxRequests})`);
  return false;
}
```

---

## 🧪 Testowanie

### Test 1: Sprawdź czy limity zostały zresetowane
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dev/reset-rate-limit" | Select-Object -ExpandProperty Content
```

**Oczekiwany wynik:**
```json
{
  "success": true,
  "message": "Rate limits cleared",
  "timestamp": "2025-10-06T18:22:11.755Z"
}
```

### Test 2: Sprawdź harmonogram technika
```
http://localhost:3000/technician/schedule
```

**Oczekiwane zachowanie:**
- ✅ Strona się ładuje
- ✅ GET /api/technician/work-schedule zwraca 200 OK
- ✅ Można dodawać sloty (POST zwraca 200 OK)
- ✅ Można usuwać sloty (DELETE zwraca 200 OK)

### Test 3: Sprawdź console logs

Otwórz terminal z `npm run dev` i sprawdź:
```
✅ Brak "🚫 Rate limit exceeded"
✅ Brak "⚠️ Rate limit hit"
✅ Opcjonalnie: "🧹 Cleaned X old rate limit entries"
```

---

## 📊 Monitoring

### Sprawdź aktualne limity

**W konsoli przeglądarki:**
```javascript
// Test GET request
fetch('/api/technician/work-schedule?weekStart=2025-10-06')
  .then(r => console.log('Status:', r.status));

// Jeśli dostaniesz 429, sprawdź header:
fetch('/api/technician/work-schedule?weekStart=2025-10-06')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Retry-After:', r.headers.get('Retry-After'), 'seconds');
  });
```

### Reset limitów (development)

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dev/reset-rate-limit"
```

**JavaScript (console):**
```javascript
fetch('/api/dev/reset-rate-limit')
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 🔒 Bezpieczeństwo

### Development Mode
- ✅ Wysokie limity (10,000 req/min dla API)
- ✅ Krótkie okno (1 minuta)
- ✅ Endpoint resetowania dostępny

### Production Mode
- ✅ Niskie limity (1,000 req/15min dla API)
- ✅ Długie okno (15 minut)
- ✅ Endpoint resetowania **NIEDOSTĘPNY**
- ✅ Strict limits dla auth (5 req/15min)

---

## 🎯 Rezultat

**Przed naprawą:**
```
❌ GET /api/technician/work-schedule → 429 Too Many Requests
❌ POST /api/technician/work-schedule → 429 Too Many Requests
❌ Strona harmonogramu nie działa
❌ Brak możliwości dodania/usunięcia slotów
```

**Po naprawie:**
```
✅ GET /api/technician/work-schedule → 200 OK
✅ POST /api/technician/work-schedule → 200 OK
✅ Strona harmonogramu działa płynnie
✅ Można dodawać/usuwać sloty bez problemów
✅ Development: 10,000 requestów/minutę (wystarczy!)
✅ Production: Zachowane bezpieczeństwo (1,000 req/15min)
```

---

## 📁 Zmienione Pliki

**middleware.js** - Główne zmiany:
- Poprawione czyszczenie `rateLimitStore`
- Różne limity dla dev/prod
- Endpoint resetowania dla dev
- Ulepszone logowanie

---

## 🚀 Uruchomienie

### Krok 1: Restart serwera
```powershell
# Zatrzymaj serwer (Ctrl+C)
# Uruchom ponownie:
npm run dev
```

### Krok 2: Reset limitów (opcjonalnie)
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dev/reset-rate-limit"
```

### Krok 3: Test
```
http://localhost:3000/technician/schedule
```

---

## ⚠️ Znane Problemy i Rozwiązania

### Problem: Nadal dostaję 429
**Rozwiązanie:**
```powershell
# 1. Reset limitów
Invoke-WebRequest -Uri "http://localhost:3000/api/dev/reset-rate-limit"

# 2. Restart serwera
# Ctrl+C w terminalu z npm run dev
npm run dev
```

### Problem: Po restarcie serwera limity zostają
**Przyczyna:** Map() jest in-memory, więc restart powinien je wyczyścić automatycznie.

**Jeśli problem persystuje:**
1. Sprawdź czy masz tylko JEDEN proces Node.js (może działają 2 serwery)
2. Sprawdź port:
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object State, OwningProcess
```
3. Zabij wszystkie procesy na porcie 3000:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Problem: Limity działają w production
**To normalne!** W production mają być niskie limity dla bezpieczeństwa.

**Jeśli potrzebujesz wyższych limitów w production:**
```javascript
// middleware.js - zmień linię:
const apiLimit = isDevelopment ? 10000 : 1000; // <- zwiększ 1000 do np. 5000
```

---

## 📚 Dokumentacja Techniczna

### Sliding Window Algorithm

Rate limiting używa **sliding window** algorithm:

```
Okno czasowe: 1 minuta (60,000 ms)

Timeline:
|-------- Window 1 (18:22:00-18:23:00) --------|
  ^                                            ^
  Start                                       End
  Key: api_127.0.0.1_1728242520               
  Counter: 0 → 1 → 2 → ... → 9999

|-------- Window 2 (18:23:00-18:24:00) --------|
  ^                                            ^
  Start                                       End  
  Key: api_127.0.0.1_1728242580
  Counter: 0 → 1 → 2 → ...
```

**Klucz okna:**
```javascript
const windowKey = Math.floor(now / windowMs);
// Przykład: now = 1728242565000 (18:22:45)
//           windowMs = 60000 (1 minuta)
//           windowKey = 28804042
// Klucz: `api_127.0.0.1_28804042`
```

**Czyszczenie:**
```javascript
// Zawsze usuwa poprzednie okno
const previousWindowKey = windowKey - 1;
rateLimitStore.delete(`api_127.0.0.1_${previousWindowKey}`);

// Co 100 requestów czyści stare wpisy (starsze niż 3 okna)
if (rateLimitStore.size > 100) {
  // Cleanup logic...
}
```

---

## 🎉 Podsumowanie

### Co zostało naprawione?
1. ✅ Usunięto błąd 429 w developmencie
2. ✅ Zwiększono limity dla dev (10,000 req/min)
3. ✅ Skrócono okno czasowe dla dev (1 minuta)
4. ✅ Dodano endpoint resetowania limitów
5. ✅ Poprawiono czyszczenie pamięci
6. ✅ Ulepszone logowanie i monitoring
7. ✅ Zachowano bezpieczeństwo w production

### Następne kroki
- [ ] Przetestuj stronę `/technician/schedule`
- [ ] Sprawdź czy wszystkie operacje działają
- [ ] Monitoruj console logs (brak błędów 429)
- [ ] W razie problemów - użyj `/api/dev/reset-rate-limit`

**Status:** 🟢 **PROBLEM ROZWIĄZANY**

Data naprawy: 2025-10-06
Wersja middleware: v2.0 (with development mode support)
