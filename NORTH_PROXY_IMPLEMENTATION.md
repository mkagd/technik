# 🚀 North.pl Proxy - Implementacja Rozwiązania 3

## ✅ Co zostało zrobione:

### 1. **Przełączono na wersję z PROXY**

**Plik**: `pages/technician/magazyn/zamow.js`

**Zmiana**:
```javascript
// PRZED (nowa karta):
import NorthPartsBrowser from '../../../components/NorthPartsBrowser';

// PO (iframe z proxy):
import NorthPartsBrowserWithProxy from '../../../components/NorthPartsBrowserWithProxy';
```

---

### 2. **Ulepszone Proxy API**

**Plik**: `pages/api/proxy/north.js`

**Zmiany**:

#### A) Lepsze headers
```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
  'Accept-Language': 'pl-PL,pl;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive'
}
```

#### B) Modyfikacja HTML
```javascript
let modifiedHtml = html
  // Base URL dla relatywnych linków
  .replace('<head>', '<head><base href="https://north.pl/">')
  
  // Usuń CSP meta tags
  .replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
  
  // Usuń X-Frame-Options
  .replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, '')
  
  // Dodaj custom CSS dla iframe
  .replace('<head>', `
    <head>
    <style>
      body { margin: 0; padding: 0; }
      /* Możesz ukryć niepotrzebne elementy */
      /* #header { display: none; } */
    </style>
  `);
```

#### C) Response headers
```javascript
res.setHeader('Content-Type', 'text/html; charset=utf-8');
res.setHeader('X-Frame-Options', 'ALLOWALL');
res.setHeader('Content-Security-Policy', 'frame-ancestors *');
res.setHeader('Cache-Control', 'no-cache');
```

#### D) Logging
```javascript
console.log('🔗 Proxy request:', url);
console.log('📥 Fetching from North.pl...');
console.log('✅ Fetched HTML, length:', html.length);
console.log('✅ Sending proxied HTML');
```

---

### 3. **Komponent NorthPartsBrowserWithProxy**

**Plik**: `components/NorthPartsBrowserWithProxy.js`

**Główne funkcje**:

#### A) Proxy URL
```javascript
const proxyUrl = `/api/proxy/north?url=${encodeURIComponent(northUrl)}`;
```

#### B) Iframe z proxy
```javascript
<iframe
  src={proxyUrl}
  className="w-full h-full border-0"
  title="North.pl - Katalog części"
/>
```

#### C) Piękny header (pomarańczowy gradient)
```javascript
<div className="bg-gradient-to-r from-orange-500 to-orange-600">
  <h2 className="text-xl font-bold text-white">
    🛒 North.pl - Katalog części AGD
  </h2>
</div>
```

---

## 🎯 Jak to działa:

```
Użytkownik klika "Szukaj na North.pl"
    ↓
Otwiera się modal (pełny ekran)
    ↓
Frontend: /api/proxy/north?url=https://north.pl/czesci-agd/...
    ↓
Backend: Pobiera stronę z North.pl
    ↓
Backend: Usuwa CSP headers i meta tags
    ↓
Backend: Dodaje <base href="https://north.pl/">
    ↓
Backend: Zwraca zmodyfikowany HTML
    ↓
Iframe: Wyświetla North.pl (działa wewnątrz!)
    ↓
Użytkownik: Przegląda części
    ↓
Klik: "Dodaj część do zamówienia"
    ↓
Modal: Formularz z danymi części
    ↓
Część dodana do zamówienia! 🎉
```

---

## 🧪 Testy:

### Test 1: Podstawowe działanie

1. **Otwórz**: `/technician/magazyn/zamow`
2. **Kliknij**: "🔍 Szukaj na North.pl"
3. **Sprawdź**: Modal się otwiera (pełny ekran)
4. **Sprawdź**: Iframe ładuje North.pl
5. **Sprawdź**: Konsola pokazuje:
   ```
   🔗 Proxy request: https://north.pl/czesci-agd/...
   📥 Fetching from North.pl...
   ✅ Fetched HTML, length: 123456
   ✅ Sending proxied HTML
   ```

### Test 2: Dodanie części

1. **W iframe**: Przeglądaj części na North.pl
2. **Kliknij**: "Dodaj część do zamówienia" (przycisk w header)
3. **Wypełnij**:
   - Nazwa: "Grzałka 2000W Bosch"
   - Nr: "00264697"
   - Cena: "89.99"
   - Ilość: "1"
4. **Kliknij**: "✓ Dodaj część"
5. **Sprawdź**: Alert: "✅ Dodano: Grzałka 2000W Bosch, Cena: 89.99 zł"
6. **Sprawdź**: Część na liście (karta pomarańczowa)

### Test 3: Linki w iframe

1. **W iframe**: Kliknij na kategorię (np. "Grzałki")
2. **Sprawdź**: Czy strona się ładuje
3. **Sprawdź**: Czy URL w console się zmienia
4. **Problem?**: Jeśli linki nie działają:
   - Sprawdź `<base href="https://north.pl/">` w HTML
   - Sprawdź console browser (F12)

---

## ⚠️ Możliwe problemy:

### 1. **North.pl nie ładuje się**

**Problem**: Status 403 lub 503

**Rozwiązanie**:
```javascript
// Dodaj więcej headers w proxy/north.js
headers: {
  'User-Agent': '...',
  'Referer': 'https://north.pl/',
  'Origin': 'https://north.pl'
}
```

### 2. **JavaScript nie działa**

**Problem**: North.pl używa JavaScript który może nie działać w iframe

**Rozwiązanie**: Nic nie da się zrobić - użyj Rozwiązania 1 (nowa karta)

### 3. **Obrazki się nie ładują**

**Problem**: Relatywne ścieżki do obrazków

**Rozwiązanie**: `<base href="https://north.pl/">` powinno to naprawić

### 4. **CORS errors**

**Problem**: Requests z iframe do North.pl API

**Rozwiązanie**:
```javascript
// Dodaj proxy dla API requests też
// np. /api/proxy/north-api?url=...
```

---

## 🔧 Debugowanie:

### 1. **Sprawdź logi serwera**
```bash
# Terminal z npm run dev
🔗 Proxy request: https://north.pl/czesci-agd/czesci-do-pralek/czesci-do-pralek-bosch,g55939.html
📥 Fetching from North.pl...
✅ Fetched HTML, length: 245678
✅ Sending proxied HTML
```

### 2. **Sprawdź DevTools (F12)**
- **Network tab**: Czy proxy request się udaje?
- **Console tab**: Czy są błędy JavaScript?
- **Elements tab**: Czy HTML się załadował?

### 3. **Testuj bezpośrednio proxy**
Otwórz w przeglądarce:
```
http://localhost:3000/api/proxy/north?url=https://north.pl/czesci-agd/czesci-do-pralek/czesci-do-pralek-bosch,g55939.html
```

Sprawdź czy HTML się wyświetla.

---

## 🎨 Customizacja:

### 1. **Ukryj header North.pl** (więcej miejsca)
```javascript
// W proxy/north.js
.replace(
  '<head>',
  `<head>
  <style>
    #header, .header, .top-bar { display: none !important; }
    body { padding-top: 0 !important; }
  </style>
  `
)
```

### 2. **Zmień kolory**
```javascript
// W NorthPartsBrowserWithProxy.js
<div className="bg-gradient-to-r from-blue-500 to-blue-600">
  {/* Niebieski zamiast pomarańczowego */}
</div>
```

### 3. **Dodaj shortcuty**
```javascript
// Skróty klawiszowe
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      setShowAddModal(true);
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 🔄 Powrót do Rozwiązania 1 (nowa karta):

Jeśli proxy nie działa, łatwo wrócić:

```javascript
// W pages/technician/magazyn/zamow.js
import NorthPartsBrowser from '../../../components/NorthPartsBrowser';
// Zamiast: import NorthPartsBrowserWithProxy...

// I w JSX:
<NorthPartsBrowser
  deviceType={deviceType || 'Pralka'}
  deviceBrand={deviceBrand || ''}
  onAddPart={handleAddPartFromNorth}
  onClose={() => setShowNorthBrowser(false)}
/>
```

---

## 📊 Porównanie rozwiązań:

| Feature | Nowa karta | Proxy (iframe) | Electron |
|---------|------------|----------------|----------|
| **Setup** | ✅ Prosty | ⚠️ Średni | ❌ Trudny |
| **UX** | ⚠️ Przełączanie kart | ✅ Wszystko w aplikacji | ✅✅ Idealne |
| **North.pl funcje** | ✅✅ 100% | ⚠️ 70-80% | ✅✅ 100% |
| **Bezpieczeństwo** | ✅ Bezpieczne | ⚠️ Może łamać TOS | ✅ Bezpieczne |
| **Maintenance** | ✅ Niski | ⚠️ Średni | ❌ Wysoki |
| **Performance** | ✅ Szybki | ⚠️ Wolniejszy | ✅ Szybki |

---

## 🎉 Podsumowanie:

### ✅ ZROBIONE:
- [x] Proxy API endpoint (`/api/proxy/north`)
- [x] Komponent z iframe (`NorthPartsBrowserWithProxy`)
- [x] Przełączenie formularza na proxy
- [x] Logging dla debugowania
- [x] Modyfikacja HTML (usuń CSP)
- [x] Piękny UI z gradient header

### ⏳ DO PRZETESTOWANIA:
- [ ] Czy iframe się ładuje?
- [ ] Czy linki w iframe działają?
- [ ] Czy obrazki się pokazują?
- [ ] Czy JavaScript North.pl działa?
- [ ] Czy można dodawać części?

### 🔮 MOŻLIWE ROZSZERZENIA:
- [ ] Cache proxy responses (szybsze ładowanie)
- [ ] Proxy dla assets (CSS, JS, images)
- [ ] Custom injected buttons na North.pl
- [ ] Automatyczne rozpoznawanie części (OCR)
- [ ] Historia przeglądanych części

---

**Status**: ✅ **GOTOWE DO TESTÓW**

Teraz sprawdź czy North.pl się ładuje w iframe! Jeśli nie - zawsze możesz wrócić do Rozwiązania 1 (nowa karta). 🚀
