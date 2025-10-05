# 🚀 QUICK START - ModelAIScanner w 5 minut

## Panel Technika - Najszybsza Implementacja

### 1. Otwórz plik
```
pages/technician/visit/[visitId].js
```

### 2. Dodaj import (linia ~8)
```javascript
import ModelAIScanner from '../../../components/ModelAIScanner';
```

### 3. Dodaj state (linia ~24)
```javascript
const [showModelScanner, setShowModelScanner] = useState(false);
```

### 4. Skopiuj cały handler (linia ~150, po formatDateTime)
Otwórz: `TECHNICIAN_VISIT_SCANNER_READY_TO_PASTE.js`  
Skopiuj: Cały blok "3. DODAJ HANDLER" (60 linii)

### 5. Znajdź sekcję "Urządzenie" (linia ~330)
**ZAMIEŃ:**
```javascript
<h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
```

**NA:**
```javascript
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
```

I **DODAJ przycisk przed </div>:**
```javascript
  <button
    onClick={() => setShowModelScanner(true)}
    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    Zeskanuj tabliczkę
  </button>
</div>
```

### 6. Dodaj modal (na samym końcu przed zamknięciem </div>)
```javascript
      {/* ModelAIScanner Modal */}
      {showModelScanner && (
        <ModelAIScanner
          isOpen={showModelScanner}
          onClose={() => setShowModelScanner(false)}
          onModelDetected={handleModelDetected}
        />
      )}
    </div>
  );
}
```

### 7. Test!
```bash
npm run dev
```

Otwórz: `http://localhost:3000/technician/visit/123`  
Kliknij: "Zeskanuj tabliczkę"  
Zrób zdjęcie tabliczki AMICA

---

## ✅ Gotowe!

Teraz technik może:
- 📷 Skanować tabliczki podczas wizyty
- 🤖 AI automatycznie rozpozna:
  - Markę (AMICA, Samsung, Bosch...)
  - Model (PIC5512B3, WW90T4540AE...)
  - Typ (Płyta indukcyjna, Pralka, Piekarnik...)
  - Numer seryjny
- 💾 Dane zapisują się do wizyty

---

## 🔥 Specjalne wykrywanie AMICA:

- **PI...** → Płyta indukcyjna ✨
- **PC...** → Płyta ceramiczna
- **PG...** → Płyta gazowa
- **Piekarnik/Oven** → Piekarnik ✨
- **Kuchenka** → Kuchenka ✨
- **OKA/OKC** → Okap kuchenny

**To jest dokładnie to co chciałeś!** 🎉

---

## 📚 Więcej informacji:
- `MODEL_AI_SCANNER_INTEGRATION_GUIDE.md` - Pełna dokumentacja
- `MODEL_AI_SCANNER_SUMMARY.md` - Podsumowanie
- `TECHNICIAN_VISIT_SCANNER_READY_TO_PASTE.js` - Gotowy kod
