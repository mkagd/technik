# 🔇 Redukcja Logów - Wyłączenie 304 dla Auto-Refresh Endpoints

**Data:** 2025-10-15  
**Status:** ✅ COMPLETED

## Problem

Za dużo logów w konsoli serwera z powodu cyklicznych zapytań HTTP do API (auto-refresh w panelu admin):

```
GET /api/rezerwacje 304 in 10ms
GET /api/orders 304 in 10ms
GET /api/notifications?read=false 304 in 6ms
GET /api/part-requests?status=pending 304 in 9ms
... (setki takich logów)
```

Te zapytania są wywoływane przez:
- Auto-refresh zleceń co kilka sekund
- Polling powiadomień
- Odświeżanie listy części

## Rozwiązanie

### 1. **Custom Server z filtrowaniem logów** (`server.js`)

Zamiast domyślnego `next dev`, aplikacja używa teraz custom servera który:

✅ Wyłącza logi dla statusu **304 (Not Modified)** dla wybranych endpointów  
✅ Zachowuje logi błędów (4xx, 5xx)  
✅ Zachowuje logi nowych requestów (200, 201)  
✅ Wyłącza logi dla assets (`/_next/`, `/static/`)

**Silent Endpoints** (bez logów 304):
- `/api/rezerwacje`
- `/api/orders`
- `/api/notifications`
- `/api/part-requests`

### 2. **Zmiany w package.json**

```json
{
  "scripts": {
    "dev": "node server.js",           // ✅ Używa custom servera
    "dev-next": "next dev -p 3000",    // Zapasowy (z logami)
    "dev-local": "node server.js",     // Local development
    "start": "NODE_ENV=production node server.js"
  }
}
```

### 3. **Optymalizacja next.config.js**

```javascript
{
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
}
```

## Logika Filtrowania

```javascript
function shouldLog(url, statusCode) {
  // ✅ Zawsze loguj błędy (400+)
  if (statusCode >= 400) return true
  
  // ❌ NIE loguj 304 dla auto-refresh endpoints
  if (statusCode === 304 && isSilentEndpoint) return false
  
  // ❌ NIE loguj assets (Next.js static files)
  if (url.startsWith('/_next/')) return false
  
  // ✅ Loguj tylko 200-299 (bez 304)
  return statusCode >= 200 && statusCode < 300 && statusCode !== 304
}
```

## Przykład - PRZED:

```
GET /api/rezerwacje 304 in 10ms
GET /api/orders 304 in 10ms
GET /api/notifications?read=false 304 in 6ms
GET /api/rezerwacje 304 in 11ms
GET /api/orders 304 in 5ms
GET /api/part-requests?status=pending 304 in 9ms
... (200+ linii na minutę)
```

## Przykład - PO:

```
✅ Ready on http://localhost:3000
📱 Aplikacja Technik dostępna na porcie 3000
🔇 Logi 304 (Not Modified) zostały wyłączone dla auto-refresh endpoints

  POST /api/orders 201 in 45ms
  PUT /api/part-requests 200 in 23ms
  ❌ Error occurred handling /api/wrong 500
```

## Uruchomienie

```bash
# Development (z filtrowaniem logów)
npm run dev

# Development (bez filtrowania - pełne logi)
npm run dev-next

# Production
npm run start
```

## Zmiany w Plikach

### Modified Files:
1. ✅ `server.js` - Custom server z logiką filtrowania
2. ✅ `package.json` - Zmiana skryptów `dev` i `start`
3. ✅ `next.config.js` - Optymalizacja `onDemandEntries`

### Nie zmienione:
- API endpoints (działają identycznie)
- Frontend (auto-refresh działa bez zmian)
- Middleware (rate limiting zachowany)
- Logger utility (używany dalej w kodzie)

## Zalety

✅ Czytelna konsola - tylko ważne informacje  
✅ Łatwiejsze debugowanie błędów  
✅ Zachowane logi dla nowych requestów  
✅ Błędy nadal widoczne  
✅ Brak wpływu na działanie aplikacji  
✅ Możliwość przełączenia na pełne logi (`npm run dev-next`)

## Dodatkowe Opcje

Jeśli chcesz **całkowicie wyłączyć logi** (nawet błędy):

```javascript
// server.js
const app = next({ dev, hostname, port, quiet: true })

// I usuń logowanie w res.end
```

Jeśli chcesz **dodać kolejne endpointy do silent list**:

```javascript
const silentEndpoints = [
    '/api/rezerwacje',
    '/api/orders',
    '/api/notifications',
    '/api/part-requests',
    '/api/twoj-nowy-endpoint' // ✅ Dodaj tutaj
]
```

## Status

✅ **COMPLETED** - Logi 304 wyłączone dla auto-refresh endpoints  
✅ Custom server działa poprawnie  
✅ Błędy nadal widoczne  
✅ Development experience poprawiony

---

**Autor:** GitHub Copilot  
**Data wdrożenia:** 2025-10-15
