# 🚀 QUICK START - Smart Visit Completion
## Szybkie uruchomienie w 5 minut

---

## 📦 1. Instalacja zależności (30 sek)

```bash
cd D:\Projekty\Technik\Technik
npm install tesseract.js
```

**Uwaga:** `formidable` jest już w projekcie (używany przez PhotoUploader)

---

## 📂 2. Sprawdź folder dla zdjęć (5 sek)

```bash
# Folder już istnieje dla PhotoUploader, ale sprawdź:
dir public\uploads\visits
```

Jeśli nie istnieje:
```bash
mkdir public\uploads\visits
```

---

## ⚙️ 3. Integruj w visit details page (2 min)

Otwórz `pages/technician/visit/[visitId].js` i dodaj:

### Import na górze:
```javascript
import CompletionWizard from '../../components/technician/CompletionWizard';
```

### State:
```javascript
const [showCompletionWizard, setShowCompletionWizard] = useState(false);
```

### Przycisk "Zakończ wizytę" (zastąp istniejący):
```javascript
<button
  onClick={() => setShowCompletionWizard(true)}
  disabled={visit.status !== 'in_progress'}
  className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  ✅ Zakończ wizytę
</button>
```

### Modal na końcu JSX:
```javascript
{/* Completion Wizard */}
{showCompletionWizard && (
  <CompletionWizard
    visit={visit}
    onComplete={async (result) => {
      console.log('✅ Visit completed:', result);
      setShowCompletionWizard(false);
      
      // Reload visit data
      await loadVisit();
      
      // Optionally redirect to visit list
      // router.push('/technician');
    }}
    onCancel={() => setShowCompletionWizard(false)}
  />
)}
```

---

## 🔄 4. Zarejestruj Service Worker (1 min)

Otwórz `pages/_app.js` i dodaj w `useEffect`:

```javascript
useEffect(() => {
  // Service Worker registration for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/offline-sync-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Listen for sync messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_SUCCESS') {
            console.log(`✅ Visit ${event.data.visitId} synced from offline!`);
            // Optional: Show toast notification
          } else if (event.data.type === 'SYNC_ERROR') {
            console.error(`❌ Sync failed for visit ${event.data.visitId}`);
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });

    // Request notification permission for offline sync alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }
}, []);
```

---

## 🎨 5. Dodaj ikony PWA (1 min)

Skopiuj lub stwórz ikony aplikacji:

- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)

**Quick placeholder:**
Użyj emoji jako tymczasowej ikony:
1. Wejdź na https://favicon.io/emoji-favicons/wrench/
2. Pobierz i skopiuj do `/public`

---

## ✅ 6. Test (1 min)

### Test online:
```bash
npm run dev
```

1. Zaloguj się jako technik
2. Otwórz wizytę
3. Kliknij "Zakończ wizytę"
4. Dodaj 2 zdjęcia
5. Wybierz typ (np. Naprawa zakończona)
6. Zatwierdź
7. ✅ Sprawdź czy status = "completed"

### Test offline:
1. W Chrome DevTools → Network → Throttling → **Offline**
2. Kliknij "Zakończ wizytę"
3. Dodaj zdjęcia (powinna być badge "📴 OFFLINE")
4. Zakończ wizytę → Alert "Zsynchronizuje się"
5. Wróć online (throttling → Online)
6. 🔄 Automatyczna synchronizacja (sprawdź console)
7. ✅ Wizyta powinna być zaktualizowana

---

## 🧪 7. Verify (30 sek)

### Sprawdź:
- [ ] Folder `/public/uploads/visits` istnieje
- [ ] Zdjęcia zapisują się w `/public/uploads/visits/visit_*.jpg`
- [ ] AI wykrywa model (sprawdź console: "🤖 AI wykrył model")
- [ ] Status wizyty = "completed"
- [ ] Service Worker zarejestrowany (sprawdź console)
- [ ] Offline mode działa (badge widoczny, queue zapisana)

### Console logs:
```
✅ Service Worker registered
📸 Uploaded 2 photos for visit VIS251009001
🤖 AI updated order model: SAMSUNG WW90K6414QW
✅ Visit VIS251009001 completed successfully
```

---

## 🆘 Troubleshooting

### Błąd: "Cannot find module 'tesseract.js'"
```bash
npm install tesseract.js
```

### Błąd: "Cannot find module 'formidable'"
```bash
npm install formidable
```

### Błąd: "ENOENT: no such file or directory 'uploads/visits'"
```bash
mkdir public\uploads\visits
```

### AI nie wykrywa modelu
- Sprawdź jakość zdjęcia (jasne, wyraźne)
- Tabliczka znamionowa musi być czytelna
- OCR działa w tle - nie blokuje workflow

### Service Worker nie rejestruje się
- Sprawdź czy plik `/public/offline-sync-worker.js` istnieje
- HTTPS wymagane w production (localhost OK)
- Otwórz Chrome DevTools → Application → Service Workers

### Offline nie działa
- Sprawdź czy Service Worker jest active
- IndexedDB musi być włączone w przeglądarce
- Sprawdź quota (może być pełna)

---

## 📝 Następne kroki

Po uruchomieniu podstawowej wersji:

1. **Dodaj ikony PWA** - Lepsze niż placeholder
2. **Skonfiguruj env variables** - MAX_PHOTO_SIZE, etc.
3. **Test z prawdziwymi tabliczkami** - Sprawdź accuracy AI
4. **Train technicians** - Pokaż jak używać
5. **Monitor logs** - Sprawdź success rate

---

## 📚 Więcej info

Pełna dokumentacja: `SMART_VISIT_COMPLETION_DOCS.md`

---

**Gotowe w 5 minut! 🚀**
