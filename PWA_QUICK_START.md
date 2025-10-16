# 📱 PWA Quick Start

## ✅ PWA jest WŁĄCZONE!

Aplikacja Technik działa jako Progressive Web App z obsługą offline.

---

## 🚀 Szybki start

### 1. Build aplikacji
```bash
npm run build
```

### 2. Uruchom w trybie production
```bash
npm start
```

### 3. Otwórz w przeglądarce
```
https://localhost:3000
```

### 4. Zainstaluj PWA
- **Chrome/Edge:** Kliknij ikonę instalacji w pasku adresu
- **Android:** Menu → "Dodaj do ekranu głównego"
- **iOS:** Udostępnij → "Na ekran początkowy"

---

## 📁 Pliki PWA

```
public/
├── manifest.json           # ✅ Gotowe
├── icon-192.png           # ✅ Wygenerowane
├── icon-512.png           # ✅ Wygenerowane
└── offline-sync-worker.js # ✅ Gotowe

components/
├── PWAInstallPrompt.js    # ✅ Gotowe
└── PWAOfflineIndicator.js # ✅ Gotowe

pages/
├── _app.js                # ✅ Skonfigurowane
└── _document.js           # ✅ Skonfigurowane
```

---

## 🎯 Co działa offline?

✅ **Przeglądanie wizyt** - ostatnio załadowane  
✅ **Lista części** - z cache  
✅ **Zdjęcia** - cache'owane  
✅ **Nawigacja** - wszystkie strony  
✅ **Dark mode** - bez problemu  

❌ **API calls** - wymaga internetu (celowo)  
❌ **Nowe zamówienia** - wymaga połączenia  
❌ **North.pl scraping** - wymaga internetu  

---

## 🔧 Konfiguracja

### Development (PWA wyłączone)
```bash
npm run dev
```

### Production (PWA włączone)
```bash
npm run build && npm start
```

### Tylko generuj ikony
```bash
node scripts/generate-pwa-icons.js
```

---

## 📊 Lighthouse Score

Oczekiwany wynik: **90+ / 100**

Testuj:
```
DevTools (F12) → Lighthouse → Progressive Web App → Generate report
```

---

## 🐛 Problemy?

### Stara wersja się ładuje?
```bash
# Wyczyść cache
Remove-Item -Path ".next" -Recurse -Force
npm run build
```

### Install prompt nie działa?
```javascript
// Console:
localStorage.removeItem('pwa-install-dismissed');
location.reload();
```

### Więcej pomocy?
- [PWA_DOCUMENTATION.md](./PWA_DOCUMENTATION.md) - Pełna dokumentacja
- [PWA_TROUBLESHOOTING.md](./PWA_TROUBLESHOOTING.md) - Rozwiązywanie problemów

---

## ✨ Funkcje PWA

🎨 **Smart Install Prompt** - Elegancki prompt instalacji  
📡 **Offline Indicator** - Widoczny status połączenia  
⚡ **Fast Loading** - Inteligentne cache'owanie  
🔄 **Auto Sync** - Synchronizacja po powrocie online  
🌙 **Dark Mode** - Działa offline  

---

## 📝 Notatki

- PWA wymaga **HTTPS** (lub localhost)
- Service Worker aktywny tylko w **production**
- API routes **NIE** są cache'owane (celowo)
- Ikony są placeholder - możesz je zmienić

---

**Gotowe!** 🎉 Aplikacja jest teraz instalowalna jako PWA!
