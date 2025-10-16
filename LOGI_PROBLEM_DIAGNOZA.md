# 🔍 Diagnoza - Za dużo logów API

**Data:** 2025-10-15  
**Status:** ⚠️ PROBLEM ZIDENTYFIKOWANY

## Problem

Logi pokazują **setki requestów na sekundę**:
```
GET /api/rezerwacje 304 in 3ms
GET /api/notifications?read=false 304 in 3ms
GET /api/rezerwacje 304 in 3ms
GET /api/notifications?read=false 304 in 3ms
... (powtarza się co ~100ms!)
```

## Diagnostyka

### 1. Rate Limit Exceeded (429)

```
⚠️ Rate limit hit: api_unknown (10000/10000)
❌ 📥 GET /api/rezerwacje 429 in 6ms
❌ 📥 GET /api/part-requests 429 in 5ms
❌ 📥 GET /api/notifications 429 in 5ms
❌ 📥 GET /api/orders 429 in 5ms
```

**10000 requestów w 1 minutę** = **166 requestów/sekundę**!

### 2. Wzorzec requestów

Widzę cykliczne zapytania do:
- `/api/rezerwacje` - **co ~1 sekundę**
- `/api/notifications?read=false` - **co ~1 sekundę**  
- `/api/orders` - co kilka sekund
- `/api/part-requests?status=pending` - co kilka sekund

## Przyczyna

### Frontend odpytuje API w nieskończonej pętli!

Możliwe przyczyny:
1. **Wiele otwartych kart przeglądarki** z `/admin`
2. **Bug w AdminLayout** - interwał nie jest czyszczony
3. **useEffect bez dependencies** - tworzy nowe interwały przy każdym renderze
4. **React Strict Mode** - podwójne wykonanie efektów

## Rozwiązanie

### Opcja A: Zamknij wszystkie karty przeglądarki

```bash
# Sprawdź czy logi ustają po zamknięciu przeglądarki
```

### Opcja B: Zwiększ interwał w AdminLayout

**Obecny interwał:** 120 sekund (2 minuty) - ale prawdopodobnie działa niepoprawnie

**Plik:** `components/AdminLayout.js:207`

```javascript
const interval = setInterval(checkNotifications, 120000);
```

**Problem:** Prawdopodobnie `useEffect` tworzy nowy interwał przy każdym renderze!

### Opcja C: Całkowicie wyłącz auto-refresh dla development

```javascript
useEffect(() => {
  // Tylko w produkcji
  if (process.env.NODE_ENV === 'production') {
    const checkNotifications = async () => {
      // ...
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 120000);
    return () => clearInterval(interval);
  } else {
    // Development: tylko ręczne odświeżanie
    checkNotifications();
  }
}, []);
```

### Opcja D: Wyłącz logi 304 CAŁKOWICIE (tymczasowe)

**Już zrobione w `server.js`**, ale nie działa bo Next.js używa wbudowanego loggera.

## Rekomendacje

### 1. **PILNE: Zamknij przeglądarkę**

Zamknij wszystkie karty z `http://localhost:3000/admin`

### 2. **Popraw AdminLayout.js**

Sprawdź dependencies w `useEffect` - prawdopodobnie brakuje `[]`

### 3. **Dodaj debouncing**

Zamiast częstego odpytywania, użyj WebSocket lub Server-Sent Events

### 4. **Zwiększ interwały (tymczasowe)**

```javascript
// AdminLayout.js - linija 207
const interval = setInterval(checkNotifications, 300000); // 5 minut zamiast 2
```

### 5. **Wyłącz auto-refresh w development**

```javascript
const ENABLE_AUTO_REFRESH = process.env.NODE_ENV === 'production';

if (ENABLE_AUTO_REFRESH) {
  const interval = setInterval(checkNotifications, 120000);
  return () => clearInterval(interval);
}
```

## Następne kroki

1. ✅ **Zamknij przeglądarkę** - sprawdź czy problem ustąpi
2. ⏳ **Znajdź źródło pętli** - czy to AdminLayout czy inna strona?
3. ⏳ **Popraw useEffect** - dodaj proper cleanup i dependencies
4. ⏳ **Rozważ WebSocket** - real-time updates bez pollingu

## Status

⚠️ **CZĘŚCIOWO ROZWIĄZANE:**
- ✅ Custom server działa
- ✅ Emoji i logi są czytelne
- ❌ Logi 304 nadal widoczne (wymaga dodatkowej pracy)
- ⚠️ **Rate limit hit** - aplikacja odpytuje zbyt często!

---

**Wniosek:** Problem nie jest w logowaniu, ale w **zbyt częstym odpytywaniu API** przez frontend. Trzeba znaleźć i naprawić źródło pętli.
