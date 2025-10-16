# 🔧 PWA Troubleshooting - Rozwiązywanie problemów

## 🚨 Częste problemy

---

### 1. ❌ Aplikacja nie instaluje się jako PWA

#### Objawy:
- Brak ikony "Zainstaluj" w przeglądarce
- Menu "Dodaj do ekranu głównego" nieaktywne
- Install prompt się nie pokazuje

#### Diagnoza:
```javascript
// Otwórz DevTools (F12) → Console
// Sprawdź czy manifest jest poprawny:
fetch('/manifest.json')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Sprawdź Service Worker:
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length > 0));
```

#### Możliwe przyczyny i rozwiązania:

**A. Brak HTTPS**
- ✅ **Rozwiązanie:** PWA wymaga HTTPS (lub localhost)
- Deploy na hosting z SSL (Vercel, Netlify, własny serwer z certyfikatem)

**B. Niepoprawny manifest.json**
- ✅ **Rozwiązanie:** Sprawdź w DevTools → Application → Manifest
- Upewnij się że wszystkie pola są wypełnione
- `start_url` musi być prawidłowy
- Ikony muszą istnieć

**C. Service Worker nie zarejestrowany**
```javascript
// pages/_app.js - sprawdź czy jest:
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**D. Błędy w konsoli**
- Otwórz DevTools → Console
- Poszukaj czerwonych błędów związanych z PWA/SW
- Napraw wszystkie błędy przed instalacją

---

### 2. 🔄 Stara wersja aplikacji się ładuje

#### Objawy:
- Zmiany w kodzie nie są widoczne
- Stary CSS/JS się ładuje
- Nowe funkcje nie działają

#### Diagnoza:
```javascript
// DevTools → Application → Service Workers
// Sprawdź wersję SW i czy jest aktywny
```

#### Rozwiązania:

**A. Wymuś aktualizację Service Worker**
```javascript
// DevTools → Application → Service Workers
// Kliknij "Update" lub "Unregister"
```

**B. Wyczyść cache**
```javascript
// DevTools → Application → Cache Storage
// Usuń wszystkie cache (kliknij każdy i Delete)

// Lub w Console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  location.reload();
});
```

**C. Hard refresh**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**D. Przebuduj i wdróż ponownie**
```bash
# Wyczyść .next/
Remove-Item -Path ".next" -Recurse -Force

# Przebuduj
npm run build

# Uruchom
npm start
```

---

### 3. 📴 Offline mode nie działa

#### Objawy:
- Aplikacja nie ładuje się bez internetu
- Błąd "No internet connection"
- Biały ekran offline

#### Diagnoza:
```javascript
// Sprawdź czy SW jest aktywny:
navigator.serviceWorker.controller
  ? console.log('✅ SW active')
  : console.log('❌ SW not active');

// Sprawdź cache:
caches.keys().then(console.log);
```

#### Rozwiązania:

**A. Service Worker nie cache'uje**
- ✅ Sprawdź `next.config.js` - `disable: false` w production
- ✅ Zrestartuj aplikację w trybie production

**B. API routes nie działają offline** (to normalne!)
```javascript
// API routes są celowo NetworkOnly:
// - /api/orders → wymaga internetu
// - /api/part-requests → wymaga internetu
// - /api/scrape/* → wymaga internetu

// To jest ZAMIERZONE - nie można tworzyć zamówień offline
```

**C. Tylko statyczne zasoby offline**
```
✅ Strony HTML - cache'owane
✅ Obrazy - cache'owane
✅ JS/CSS - cache'owane
❌ API calls - NIE cache'owane (celowo)
```

---

### 4. 🔔 Install prompt się nie pokazuje

#### Objawy:
- Komponent `PWAInstallPrompt` niewidoczny
- Brak możliwości instalacji z poziomu aplikacji

#### Diagnoza:
```javascript
// Sprawdź localStorage:
localStorage.getItem('pwa-install-dismissed')
  ? console.log('❌ User dismissed prompt')
  : console.log('✅ Prompt not dismissed');

// Sprawdź czy już zainstalowano:
window.matchMedia('(display-mode: standalone)').matches
  ? console.log('✅ Already installed')
  : console.log('❌ Not installed');
```

#### Rozwiązania:

**A. Użytkownik odrzucił wcześniej**
```javascript
// Wyczyść localStorage:
localStorage.removeItem('pwa-install-dismissed');
location.reload();
```

**B. Aplikacja już zainstalowana**
- To normalne - prompt nie pokazuje się jeśli PWA już jest zainstalowana
- Sprawdź ekran główny telefonu/komputera

**C. Przeglądarka nie wspiera PWA**
```javascript
// Sprawdź wsparcie:
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('✅ PWA supported');
} else {
  console.log('❌ PWA not supported');
}
```

---

### 5. 🌐 Offline indicator nie działa

#### Objawy:
- Brak żółtego bannera gdy offline
- Status połączenia nie aktualizuje się

#### Diagnoza:
```javascript
// Sprawdź status:
console.log('Online:', navigator.onLine);

// Test events:
window.addEventListener('online', () => console.log('ONLINE'));
window.addEventListener('offline', () => console.log('OFFLINE'));
```

#### Rozwiązania:

**A. Komponent nie załadowany**
```javascript
// Sprawdź pages/_app.js:
import PWAOfflineIndicator from '../components/PWAOfflineIndicator'

// W return():
<PWAOfflineIndicator />
```

**B. Symuluj offline**
```
DevTools (F12) → Network → Throttling → Offline
```

**C. CSS nie załadowany**
- Sprawdź czy Tailwind CSS jest skonfigurowany
- Animacje: `animate-slide-down`, `animate-pulse`

---

### 6. 🎨 Ikony PWA nie działają

#### Objawy:
- Brak ikony po instalacji
- Domyślna ikona przeglądarki
- Błąd 404 dla icon-192.png

#### Diagnoza:
```bash
# Sprawdź czy ikony istnieją:
ls public/icon-*.png
```

#### Rozwiązania:

**A. Wygeneruj ikony**
```bash
node scripts/generate-pwa-icons.js
```

**B. Sprawdź manifest.json**
```json
{
  "icons": [
    {
      "src": "/icon-192.png",  // ✅ Ścieżka od roota
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**C. Własne ikony**
- Stwórz `icon-192.png` (192x192px)
- Stwórz `icon-512.png` (512x512px)
- Umieść w `public/`
- Format: PNG z przezroczystym tłem

---

### 7. ⚡ Wolne ładowanie PWA

#### Objawy:
- Długi czas ładowania
- Lighthouse PWA score < 90
- Opóźnienia w cache

#### Diagnoza:
```bash
# Uruchom Lighthouse audit:
# DevTools → Lighthouse → PWA
```

#### Rozwiązania:

**A. Optymalizuj obrazy**
```javascript
// Użyj next/image:
import Image from 'next/image';

<Image 
  src="/photo.jpg" 
  width={500} 
  height={300}
  loading="lazy"  // Lazy loading
  quality={75}    // Kompresja
/>
```

**B. Zmniejsz bundle size**
```bash
# Analiza bundle:
npm run build
# Sprawdź .next/analyze/client.html
```

**C. Lazy load komponentów**
```javascript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Spinner />,
  ssr: false
});
```

**D. Preload critical resources**
```javascript
// pages/_document.js
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/critical.js" as="script" />
```

---

## 🧪 Narzędzia diagnostyczne

### Chrome DevTools
```
F12 → Application → Service Workers
F12 → Application → Cache Storage
F12 → Application → Manifest
F12 → Lighthouse → Progressive Web App
```

### Firefox DevTools
```
F12 → Storage → Cache Storage
F12 → Application → Service Workers
```

### Edge DevTools
```
F12 → Application → Service Workers (same as Chrome)
```

---

## 🔍 Komendy debugowania

### Sprawdź czy PWA zainstalowane
```javascript
window.matchMedia('(display-mode: standalone)').matches
```

### Lista wszystkich Service Workers
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.table(regs.map(r => ({
    scope: r.scope,
    state: r.active?.state,
    scriptURL: r.active?.scriptURL
  })));
});
```

### Wyczyść wszystko
```javascript
// Service Workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});

// Cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// LocalStorage
localStorage.clear();

// Przeładuj
location.reload();
```

---

## 📞 Dalsze wsparcie

Jeśli problem nadal występuje:

1. **Sprawdź logi konsoli** - szukaj błędów
2. **Wyczyść wszystkie cache** - hard refresh
3. **Testuj w incognito** - wyklucz rozszerzenia
4. **Sprawdź HTTPS** - PWA wymaga SSL
5. **Zaktualizuj przeglądarkę** - stara wersja może nie wspierać PWA

---

## ✅ Checklist debugowania

- [ ] Console bez błędów
- [ ] manifest.json dostępny i poprawny
- [ ] Service Worker zarejestrowany
- [ ] HTTPS włączone (lub localhost)
- [ ] Ikony istnieją (icon-192.png, icon-512.png)
- [ ] Cache Storage zawiera pliki
- [ ] Lighthouse PWA score > 90
- [ ] Instalacja działa na urządzeniu testowym

---

**Pytania?** Sprawdź [PWA_DOCUMENTATION.md](./PWA_DOCUMENTATION.md) dla pełnej dokumentacji.
