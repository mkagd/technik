# 🔧 North.pl - Rozwiązania problemów z CSP

## ❌ Problem: "Refused to frame 'https://north.pl/'"

North.pl ma **Content Security Policy (CSP)** która **blokuje osadzanie** w iframe:
```
frame-src 'none'
```

---

## ✅ Rozwiązania:

### 1. **Otwórz w nowej karcie** (AKTUALNIE ZAIMPLEMENTOWANE)

**Plik**: `components/NorthPartsBrowser.js`

**Jak działa**:
- Przycisk "Otwórz North.pl" → nowa karta
- Technik przegląda katalog
- Kopiuje dane części
- Wraca do aplikacji i klika "Dodaj część"
- Wkleja dane

**Zalety**:
- ✅ Nie wymaga proxy
- ✅ Działa zawsze
- ✅ Proste i bezpieczne
- ✅ North.pl działa normalnie (koszyk, filtry, etc.)

**Wady**:
- ❌ Wymaga przełączania między kartami
- ❌ Trzeba ręcznie kopiować dane

---

### 2. **Proxy Server** (OPCJONALNE)

**Pliki**:
- `pages/api/proxy/north.js` - Proxy endpoint
- `components/NorthPartsBrowserWithProxy.js` - Komponent z iframe

**Jak działa**:
1. Frontend wysyła request do `/api/proxy/north?url=https://north.pl/...`
2. Proxy pobiera stronę z North.pl
3. Usuwa CSP headers
4. Zwraca HTML do iframe

**Użycie**:
```javascript
// Zamień w pages/technician/magazyn/zamow.js
import NorthPartsBrowser from '../../../components/NorthPartsBrowserWithProxy';
```

**Zalety**:
- ✅ North.pl w iframe (wewnątrz aplikacji)
- ✅ Nie trzeba przełączać kart
- ✅ Lepsze UX

**Wady**:
- ⚠️ Może nie działać wszystko (JavaScript, linki)
- ⚠️ Wymaga proxy
- ⚠️ Możliwe problemy z CORS
- ⚠️ Może złamać regulamin North.pl

---

### 3. **Electron / Native App** (DLA PRZYSZŁOŚCI)

Jeśli chcesz **prawdziwą przeglądarkę wewnątrz aplikacji** - użyj Electron:

**Electron BrowserView**:
```javascript
const { BrowserView } = require('electron');

const view = new BrowserView({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});

mainWindow.setBrowserView(view);
view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });
view.webContents.loadURL('https://north.pl');

// Komunikacja z aplikacją
view.webContents.on('did-finish-load', () => {
  // Możesz wstrzykiwać JavaScript
  view.webContents.executeJavaScript(`
    // Dodaj przycisk "Użyj tej części" na North.pl
    document.querySelectorAll('.product').forEach(product => {
      const btn = document.createElement('button');
      btn.textContent = '➕ Dodaj do zamówienia';
      btn.onclick = () => {
        const name = product.querySelector('.name').textContent;
        const price = product.querySelector('.price').textContent;
        // Wyślij do aplikacji
        window.postMessage({ type: 'ADD_PART', name, price }, '*');
      };
      product.appendChild(btn);
    });
  `);
});
```

**Zalety**:
- ✅ Pełna kontrola nad przeglądarką
- ✅ Możesz modyfikować stronę North.pl (dodać przyciski!)
- ✅ Prawdziwa izolacja
- ✅ Nie łamiesz CSP

**Wady**:
- ❌ Wymaga przepisania na Electron
- ❌ Większa aplikacja (≈100MB+)
- ❌ Więcej pracy developerskiej

---

## 🎯 Rekomendacja:

### **Dla web app (Next.js)**: Rozwiązanie 1 (nowa karta)
- Najprostsze
- Najbezpieczniejsze
- Działa zawsze
- North.pl ma wszystkie funkcje

### **Dla desktop app (Electron)**: Rozwiązanie 3 (BrowserView)
- Najlepsze UX
- Możesz dodać custom przyciski na North.pl
- Pełna integracja

### **Nie polecam**: Rozwiązanie 2 (Proxy)
- Może nie działać
- Możliwe problemy prawne
- North.pl może zablokować

---

## 🚀 Quick Fix - Dodaj "Kopiuj dane" do schowka

Możesz dodać funkcję kopiowania danych z North.pl:

```javascript
// W NorthPartsBrowser.js
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert('✅ Skopiowano do schowka!');
};

<button
  onClick={() => copyToClipboard(northUrl)}
  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
>
  📋 Kopiuj link
</button>
```

---

## 📝 Instrukcja dla techników:

1. **Kliknij** "🔍 Szukaj na North.pl"
2. **Kliknij** "Otwórz North.pl" (otworzy się nowa karta)
3. **Przeglądaj** katalog części
4. **Znajdź** odpowiednią część
5. **Skopiuj**:
   - Nazwę części
   - Numer katalogowy
   - Cenę
6. **Wróć** do aplikacji (ALT+TAB lub przełącz kartę)
7. **Kliknij** "Dodaj część do zamówienia"
8. **Wklej** dane (Ctrl+V)
9. **Zatwierdź** "✓ Dodaj część"

---

## 🔮 Możliwe rozszerzenie - Chrome Extension

Możesz stworzyć **rozszerzenie Chrome**, które:
1. Wykrywa że jesteś na North.pl
2. Dodaje przycisk "➕ Dodaj do zamówienia w Technik"
3. Po kliknięciu wysyła dane do Twojej aplikacji

**content-script.js**:
```javascript
// Wykryj czy jesteś na North.pl
if (window.location.hostname === 'north.pl') {
  // Dodaj przyciski na produktach
  document.querySelectorAll('.product-item').forEach(product => {
    const btn = document.createElement('button');
    btn.textContent = '➕ Dodaj do Technik';
    btn.className = 'technik-add-btn';
    
    btn.onclick = () => {
      const name = product.querySelector('.product-name').textContent;
      const price = product.querySelector('.price').textContent;
      const partNumber = product.querySelector('.sku').textContent;
      
      // Wyślij do aplikacji
      chrome.runtime.sendMessage({
        type: 'ADD_PART_TO_TECHNIK',
        data: { name, price, partNumber }
      });
      
      alert('✅ Dodano do zamówienia!');
    };
    
    product.appendChild(btn);
  });
}
```

**background.js**:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ADD_PART_TO_TECHNIK') {
    // Wyślij do Twojej aplikacji
    fetch('http://localhost:3000/api/parts/add-from-extension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data)
    });
  }
});
```

---

**Status**: ✅ Rozwiązanie 1 zaimplementowane (nowa karta)  
**Opcjonalnie**: Możesz przełączyć na Proxy lub Electron jeśli potrzebujesz
