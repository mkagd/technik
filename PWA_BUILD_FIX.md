# 🔧 Fix: PWA Build Error na Vercel

## Problem
```
Error: ENOENT: no such file or directory, lstat '/vercel/path0/public/workbox-e43f5367.js.map'
```

## Przyczyna
- **PWA (next-pwa)** generuje Service Worker i workbox pliki
- Na Vercel (serverless) te pliki nie są dostępne podczas build
- Source maps dla workbox nie są kopiowane do build output
- Build failuje przy próbie dostępu do `.js.map` file

## Rozwiązanie (Commit 41bd3da)

### Zmiana w `next.config.js`:

**PRZED:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false, // ❌ PWA włączone zawsze
  register: true,
  skipWaiting: true,
  // ...
});
```

**PO:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1', // ✅ Wyłącz na Vercel
  register: true,
  skipWaiting: true,
  // ...
});
```

### Co to robi?

- `process.env.NODE_ENV === 'development'` - wyłącza PWA lokalnie (szybszy development)
- `process.env.VERCEL === '1'` - wyłącza PWA na Vercel (unika błędów buildu)
- PWA działa tylko w **production build lokalnie** (gdy zrobisz `npm run build`)

## Dlaczego PWA nie działa na Vercel?

1. **Serverless Environment** - Vercel używa serverless functions, nie statycznego hostingu
2. **Service Worker Issues** - Service Worker może konfliktować z Edge Functions
3. **File System** - Brak dostępu do filesystem podczas runtime
4. **Cache Strategy** - PWA cache może konfliktować z Vercel CDN cache

## Alternatywne rozwiązanie (jeśli KONIECZNIE potrzebujesz PWA):

### Opcja 1: Użyj Vercel Static Export
W `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ✅ Static export
  // ... rest
};
```
**UWAGA**: To wyłączy API routes i server-side features!

### Opcja 2: Hostuj na innej platformie
- **Netlify** - lepsze wsparcie dla PWA
- **Firebase Hosting** - native PWA support
- **GitHub Pages** - static hosting z PWA

### Opcja 3: Użyj innej biblioteki PWA
```bash
npm uninstall next-pwa
npm install next-offline
```

## Czy aplikacja nadal działa offline?

❌ **NIE** - Po tym fixie aplikacja NIE będzie działać offline na Vercel.

Ale to OK, ponieważ:
1. **API routes wymagają internetu** - nawet z PWA nie zadziałają offline
2. **Supabase wymaga internetu** - baza danych jest online
3. **Vercel Functions są serverless** - muszą łączyć się z serwerem

## Co dalej?

1. ✅ Build na Vercel powinien się udać
2. ✅ Login powinien działać (bez błędu 500)
3. ✅ Aplikacja działa normalnie (tylko bez offline mode)
4. ❌ PWA disabled (brak ikony "Zainstaluj aplikację" w przeglądarce)

## Jeśli potrzebujesz offline functionality:

Musisz użyć **innej architektury**:
- **LocalStorage** - cache danych w przeglądarce
- **IndexedDB** - lokalna baza danych w przeglądarce
- **React Query** - cache API responses
- **SWR** - cache z revalidation

Ale to wymaga **dużych zmian** w kodzie.

---

**Status**: Build powinien działać teraz! Sprawdź deployment. 🚀
