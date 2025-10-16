# 📱 PWA (Progressive Web App) - Dokumentacja

## ✅ Status: WŁĄCZONE

Aplikacja Technik jest teraz w pełni funkcjonalną Progressive Web App z obsługą offline.

---

## 🎯 Co to jest PWA?

Progressive Web App to aplikacja internetowa, która zachowuje się jak natywna aplikacja mobilna:
- ✅ Instalacja na ekranie głównym telefonu/komputera
- ✅ Praca bez połączenia internetowego (offline)
- ✅ Szybsze ładowanie dzięki cache'owaniu
- ✅ Powiadomienia push (opcjonalne)
- ✅ Pełnoekranowy tryb (bez paska przeglądarki)

---

## 🚀 Funkcje PWA w Technik

### 1. **Offline First**
```
✅ Statyczne zasoby (JS, CSS, obrazy) - cache'owane
✅ Dane wizyt - cache'owane lokalnie
✅ API endpoints - NetworkFirst (fallback do cache)
✅ Zdjęcia części - cache'owane
```

### 2. **Inteligentne cache'owanie**
```javascript
// Strategia cache'owania:
- Fonty Google → CacheFirst (365 dni)
- Obrazy statyczne → StaleWhileRevalidate (24h)
- Pliki JS/CSS → StaleWhileRevalidate (24h)
- API routes → NetworkOnly (NIE CACHE'UJ)
- Pozostałe strony → NetworkFirst (10s timeout)
```

### 3. **Automatyczna instalacja**
- Prompt instalacji pojawia się automatycznie
- Można odłożyć instalację na później
- Smart detection - nie pokazuje się jeśli już zainstalowano

### 4. **Offline indicator**
- Żółty banner gdy brak internetu
- Zielony banner gdy połączenie wraca
- Auto-hide po 3 sekundach

---

## 📦 Pliki PWA

### Struktura
```
public/
├── manifest.json          # Konfiguracja PWA
├── icon-192.png          # Ikona 192x192
├── icon-512.png          # Ikona 512x512
└── offline-sync-worker.js # Service Worker (offline sync)

components/
├── PWAInstallPrompt.js   # Komponent promptu instalacji
└── PWAOfflineIndicator.js # Wskaźnik statusu offline/online

pages/
├── _app.js               # Główny layout z komponentami PWA
└── _document.js          # Meta tagi PWA
```

---

## 🔧 Konfiguracja

### next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Tylko w production
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // ... konfiguracja cache'owania
  ]
});
```

### manifest.json
```json
{
  "name": "Technik - Panel Serwisanta",
  "short_name": "Technik",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

---

## 🎨 Ikony PWA

### Wymagania
- **192x192px** - Minimalna wielkość (Android Chrome)
- **512x512px** - Optymalna wielkość (splash screen)
- Format: PNG z przezroczystym tłem
- Purpose: "any maskable" (adaptacyjne dla Android)

### Generowanie ikon
```bash
node scripts/generate-pwa-icons.js
```

---

## 📱 Instalacja PWA

### Android (Chrome)
1. Otwórz aplikację w Chrome
2. Kliknij menu (⋮) → "Dodaj do ekranu głównego"
3. Potwierdź instalację
4. Ikona pojawi się na ekranie głównym

### iOS (Safari)
1. Otwórz aplikację w Safari
2. Kliknij "Udostępnij" (⬆️)
3. Wybierz "Na ekran początkowy"
4. Potwierdź instalację

### Windows/Mac (Chrome/Edge)
1. Otwórz aplikację
2. Kliknij ikonę instalacji w pasku adresu
3. Lub: Menu → "Zainstaluj Technik"
4. Aplikacja otworzy się w osobnym oknie

---

## 🔌 Praca Offline

### Co działa offline?
✅ **Przeglądanie wizyt** - dane z cache
✅ **Lista części** - ostatnio załadowane
✅ **Zdjęcia** - cache'owane lokalnie
✅ **Nawigacja** - wszystkie strony dostępne
✅ **Dark mode** - przełączanie motywu

### Co NIE działa offline?
❌ **Tworzenie nowych wizyt** - wymaga API
❌ **Zamówienia części** - wymaga API North.pl
❌ **Synchronizacja danych** - wymaga internetu
❌ **Allegro integration** - wymaga API

### Synchronizacja offline
Gdy użytkownik wróci online, aplikacja automatycznie:
1. Synchronizuje zmiany z serwera
2. Aktualizuje cache
3. Pokazuje powiadomienie o synchronizacji

---

## 🧪 Testowanie PWA

### Development
```bash
npm run dev
# PWA wyłączone w dev mode dla szybszego developmentu
```

### Production
```bash
npm run build
npm start
# PWA włączone, Service Worker aktywny
```

### Lighthouse Audit
1. Otwórz DevTools (F12)
2. Zakładka "Lighthouse"
3. Wybierz "Progressive Web App"
4. Kliknij "Generate report"

**Oczekiwany wynik:** 90+ / 100

---

## 🐛 Debugowanie

### Service Worker
```javascript
// Console DevTools
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Active Service Workers:', regs);
});
```

### Cache
```javascript
// Sprawdź zawartość cache
caches.keys().then(names => {
  console.log('Cache names:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(name, 'contains', keys.length, 'items');
      });
    });
  });
});
```

### Wyczyść wszystkie cache
```javascript
// Console DevTools
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Lub w DevTools:
// Application → Cache Storage → Delete
```

---

## 📊 Monitoring

### Metryki do śledzenia
- **Install Rate** - ile użytkowników instaluje PWA
- **Offline Usage** - ile czasu spędza się offline
- **Cache Hit Rate** - % requestów z cache
- **Service Worker Errors** - błędy SW

### Logi
```javascript
// Service Worker logs
console.log('✅ SW: Resource cached');
console.log('❌ SW: Network error, fallback to cache');
console.log('🔄 SW: Syncing data...');
```

---

## 🔐 Bezpieczeństwo

### HTTPS Required
PWA **wymaga HTTPS** (lub localhost w dev).

### Content Security Policy
```javascript
// next.config.js - WYŁĄCZONE dla iframe North.pl
headers: [{
  key: 'Content-Security-Policy',
  value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *;"
}]
```

### Permissions
- **Notifications** - Opcjonalne (offline sync alerts)
- **Storage** - Wymagane (cache)
- **Background Sync** - Opcjonalne (future feature)

---

## 🚀 Optymalizacje

### 1. Zmniejsz rozmiar bundle
```bash
# Analiza bundle
npm run build
# Sprawdź .next/analyze/
```

### 2. Lazy loading
```javascript
// Załaduj komponenty dynamicznie
const Heavy = dynamic(() => import('../components/Heavy'), {
  ssr: false,
  loading: () => <Spinner />
});
```

### 3. Image optimization
```javascript
// Użyj next/image
import Image from 'next/image';

<Image src="/photo.jpg" width={500} height={300} />
```

---

## 📝 Checklist przed deploymentem

- [ ] PWA włączone (`disable: false` w next.config.js)
- [ ] Ikony wygenerowane (192px, 512px)
- [ ] manifest.json poprawnie skonfigurowany
- [ ] Service Worker zarejestrowany
- [ ] HTTPS włączone
- [ ] Lighthouse audit > 90/100
- [ ] Testowano instalację na Android/iOS
- [ ] Offline mode testowany
- [ ] Cache strategies zoptymalizowane

---

## 🆘 Problemy i rozwiązania

### "PWA nie instaluje się"
**Przyczyna:** Brak HTTPS lub niepoprawny manifest.json  
**Rozwiązanie:** Sprawdź DevTools → Application → Manifest

### "Service Worker nie działa"
**Przyczyna:** Błąd w kodzie SW lub cache konflikt  
**Rozwiązanie:** Wyczyść cache, zrestartuj przeglądarkę

### "Offline nie działa"
**Przyczyna:** API routes nie są cache'owane (celowo)  
**Rozwiązanie:** To normalne - API wymaga połączenia

### "Stara wersja się ładuje"
**Przyczyna:** Service Worker cache'uje stare pliki  
**Rozwiązanie:** `skipWaiting: true` w konfiguracji

---

## 📚 Zasoby

- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://web.dev/add-manifest/)

---

## 🎉 Gratulacje!

Twoja aplikacja Technik jest teraz w pełni funkcjonalną PWA! 🚀

### Co dalej?
1. Testuj instalację na różnych urządzeniach
2. Monitoruj użycie offline
3. Optymalizuj cache strategies
4. Dodaj push notifications (opcjonalnie)
5. Zbieraj feedback od użytkowników

**Pytania?** Sprawdź [PWA_TROUBLESHOOTING.md](./PWA_TROUBLESHOOTING.md)
