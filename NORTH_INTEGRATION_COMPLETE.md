# 🛒 North.pl Integration - Przeglądanie i zamawianie części

## ✨ Co zostało zaimplementowane?

System przeglądania i zamawiania części bezpośrednio z North.pl w formularzu "Zamów część".

---

## 🎯 Flow użytkownika:

```
1. Technik klika "Zamów część" z wizyty 📋
   ↓
2. Automatyczne wypełnienie: marka, model, typ urządzenia ✨
   ↓
3. Kliknięcie "🔍 Szukaj na North.pl" 🛒
   ↓
4. Otwiera się modal z North.pl (pełny ekran) 🖥️
   ↓
5. Technik przegląda części dla swojego urządzenia 👀
   ↓
6. Klikn "Dodaj część do zamówienia" ➕
   ↓
7. Wypełnia dane: nazwa, numer, cena, ilość 📝
   ↓
8. Część dodaje się do listy zamówienia 🎉
   ↓
9. Kontynuuje zamówienie ze złożonymi częściami ✅
```

---

## 📂 Nowe/Zmodyfikowane pliki:

### 1. **`components/NorthPartsBrowser.js`** (NOWY)

**Rola**: Modal do przeglądania North.pl i dodawania części

**Główne funkcje**:

#### A) Generowanie linków North.pl
```javascript
const generateNorthUrl = (type, brand) => {
  const baseUrl = 'https://north.pl/czesci-agd';
  
  // Mapowanie typów urządzeń
  const deviceCategories = {
    'Pralka': 'czesci-do-pralek',
    'Zmywarka': 'czesci-do-zmywarek',
    'Lodówka': 'czesci-do-lodowek',
    'Płyta indukcyjna': 'czesci-do-plyt-indukcyjnych',
    // ... więcej typów
  };
  
  // Mapowanie marek
  const brandSlugs = {
    'Bosch': 'bosch',
    'Samsung': 'samsung',
    'Amica': 'amica',
    // ... więcej marek
  };
  
  // ID kategorii North.pl
  const categoryIds = {
    'czesci-do-pralek/bosch': 'g55939',
    'czesci-do-pralek/samsung': 'g55943',
    // ... więcej kombinacji
  };
  
  return `${baseUrl}/${category}/${category}-${brandSlug},${categoryId}.html`;
};
```

**Przykładowe linki**:
- Pralka Bosch → `https://north.pl/czesci-agd/czesci-do-pralek/czesci-do-pralek-bosch,g55939.html`
- Lodówka Samsung → `https://north.pl/czesci-agd/czesci-do-lodowek/czesci-do-lodowek-samsung,g55963.html`
- Płyta indukcyjna Amica → `https://north.pl/czesci-agd/czesci-do-plyt-indukcyjnych/czesci-do-plyt-indukcyjnych-amica,g56009.html`

#### B) Iframe z North.pl
```javascript
<iframe
  src={northUrl}
  className="w-full h-full border-0"
  title="North.pl - Katalog części"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
/>
```

#### C) Modal dodawania części
```javascript
const handleAddPart = () => {
  const part = {
    partId: `NORTH-${Date.now()}`,
    name: partData.name,
    partNumber: partData.partNumber || '',
    quantity: parseInt(partData.quantity) || 1,
    price: parseFloat(partData.price),
    source: 'north.pl',
    notes: partData.notes
  };
  
  onAddPart(part);
};
```

**Props**:
- `deviceType` - Typ urządzenia (Pralka, Lodówka, etc.)
- `deviceBrand` - Marka (Bosch, Samsung, etc.)
- `onAddPart(part)` - Callback po dodaniu części
- `onClose()` - Callback zamknięcia modalu

---

### 2. **`pages/technician/magazyn/zamow.js`** (ZMODYFIKOWANY)

#### A) Nowy import
```javascript
import NorthPartsBrowser from '../../../components/NorthPartsBrowser';
```

#### B) Nowy state
```javascript
const [showNorthBrowser, setShowNorthBrowser] = useState(false);
const [deviceType, setDeviceType] = useState('');
```

#### C) Funkcja obsługi części z North
```javascript
const handleAddPartFromNorth = (northPart) => {
  console.log('🛒 Dodaję część z North.pl:', northPart);
  
  setSelectedParts([...selectedParts, {
    partId: northPart.partId,
    quantity: northPart.quantity,
    northData: northPart // Zachowaj dane z North
  }]);
  
  setShowNorthBrowser(false);
  alert(`✅ Dodano: ${northPart.name}\nCena: ${northPart.price} zł`);
};
```

#### D) Nowy przycisk "Szukaj na North.pl"
```javascript
<button
  type="button"
  onClick={() => setShowNorthBrowser(true)}
  className="text-sm px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
>
  <svg>🔍</svg>
  Szukaj na North.pl
</button>
```

#### E) Renderowanie North browser
```javascript
{showNorthBrowser && (
  <NorthPartsBrowser
    deviceType={deviceType || 'Pralka'}
    deviceBrand={deviceBrand || ''}
    onAddPart={handleAddPartFromNorth}
    onClose={() => setShowNorthBrowser(false)}
  />
)}
```

#### F) Wyświetlanie części z North (zmodyfikowane)
```javascript
{selectedParts.map((part, index) => (
  <div key={index}>
    {part.northData ? (
      // ✨ Część z North.pl - specjalna karta
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-orange-700 px-2 py-0.5 bg-orange-100 rounded">
            North.pl
          </span>
          <span className="text-sm font-medium">{part.northData.name}</span>
        </div>
        <div className="text-xs text-gray-600">
          Nr: {part.northData.partNumber} • 
          Cena: {part.northData.price} zł × {part.northData.quantity} szt.
        </div>
        {part.northData.notes && (
          <div className="text-xs text-gray-500 mt-1">
            💬 {part.northData.notes}
          </div>
        )}
      </div>
    ) : (
      // Standardowa część z magazynu
      <select>...</select>
    )}
  </div>
))}
```

---

### 3. **`pages/technician/visit/[visitId].js`** (ZMODYFIKOWANY)

#### Dodano deviceType do linku "Zamów część"
```javascript
<Link
  href={{
    pathname: '/technician/magazyn/zamow',
    query: {
      visitId: visit.visitId,
      orderNumber: visit.visitId,
      clientName: visit.client?.name || '',
      deviceType: visit.devices?.[0]?.deviceType || visitModels?.[0]?.type || '', // ✅ NOWE
      deviceBrand: visit.devices?.[0]?.brand || '',
      deviceModel: visit.devices?.[0]?.model || '',
      issueDescription: visit.description || ''
    }
  }}
>
  Zamów część
</Link>
```

---

## 🎨 UI/UX Features:

### 1. **Przycisk "Szukaj na North.pl"**
- Kolor: Pomarańczowy (odróżnia od standardowych części)
- Ikona: Lupa 🔍
- Pozycja: Obok przycisku "+ Dodaj część"

### 2. **North.pl Modal**
- **Pełny ekran** (max-w-7xl, max-h-90vh)
- **Iframe** z North.pl
- **Header** z informacjami o urządzeniu
- **Przycisk dodawania** - zawsze widoczny (zielony)
- **Instrukcja** w stopce

### 3. **Karta części z North.pl**
- **Badge "North.pl"** (pomarańczowy)
- **Nazwa** + numer katalogowy
- **Cena** × ilość = suma
- **Notatki** (opcjonalnie)
- **Edycja ilości** bezpośrednio na karcie
- **Przycisk usuń** (X)

### 4. **Rozróżnienie części**
- **Z magazynu** → biały select dropdown
- **Z North.pl** → pomarańczowa karta informacyjna

---

## 🔧 Przykłady użycia:

### Scenariusz 1: Zamówienie części dla pralki Bosch

1. **Wizyta**: VIS251013001, Pralka Bosch WAN28160BY
2. **Klik**: "Zamów część"
3. **Auto-fill**: 
   - Typ: Pralka
   - Marka: Bosch
   - Model: WAN28160BY
4. **Klik**: "Szukaj na North.pl"
5. **North.pl**: Otwiera `north.pl/czesci-agd/czesci-do-pralek/czesci-do-pralek-bosch,g55939.html`
6. **Przegląda**: Grzałki, pompy, łożyska...
7. **Znajdzie**: "Grzałka do pralki Bosch 2000W"
8. **Klik**: "Dodaj część do zamówienia"
9. **Wypełnia**:
   - Nazwa: Grzałka do pralki Bosch 2000W
   - Nr: 00264697
   - Cena: 89.99 zł
   - Ilość: 1
   - Notatki: Z gwintami montażowymi
10. **Dodaje**: Część pojawia się na liście (karta pomarańczowa)
11. **Wysyła**: Zamówienie zawiera część z North.pl

---

### Scenariusz 2: Mix części (magazyn + North)

1. **Dodaje z magazynu**: Łożysko bębna PART-001 (50 zł)
2. **Klik**: "Szukaj na North.pl"
3. **Dodaje z North**: Pompa odpływowa (120 zł)
4. **Dodaje z magazynu**: Amortyzator PART-003 (30 zł)
5. **Wysyła**: 3 części (2 z magazynu + 1 z North.pl)

**Lista wygląda tak**:
```
┌─────────────────────────────────────────┐
│ Łożysko bębna (PART-001) - 50 zł       │ ← Biały select
├─────────────────────────────────────────┤
│ [North.pl] Pompa odpływowa              │ ← Pomarańczowa karta
│ Nr: 12345 • 120 zł × 1 = 120 zł        │
├─────────────────────────────────────────┤
│ Amortyzator (PART-003) - 30 zł         │ ← Biały select
└─────────────────────────────────────────┘
```

---

## 🚀 Zalety rozwiązania:

### 1. **Nie trzeba dodawać części do bazy**
- ✅ North.pl ma tysiące części
- ✅ Nie trzeba ręcznie wpisywać do systemu
- ✅ Technik przeglą da katalog i wybiera

### 2. **Kontekstowe wyszukiwanie**
- ✅ Automatyczny link dla Pralka Bosch
- ✅ Filtruje tylko odpowiednie części
- ✅ Oszczędność czasu technika

### 3. **Elastyczność**
- ✅ Można mieszać części z magazynu i North.pl
- ✅ Można dodawać notatki do części z North
- ✅ Przycisk dodawania zawsze widoczny

### 4. **Prosty workflow**
- ✅ 1 klik = otwarcie North.pl
- ✅ 1 klik = dodanie części
- ✅ Bez wielokrotnego przełączania zakładek

---

## 🔮 Możliwe rozszerzenia:

### 1. **Zapisywanie historii z North.pl**
Dodaj do bazy:
```javascript
// Po dodaniu części z North → zapisz do parts-inventory.json
if (part.source === 'north.pl') {
  await fetch('/api/inventory/parts', {
    method: 'POST',
    body: JSON.stringify({
      name: part.name,
      partNumber: part.partNumber,
      price: part.price,
      source: 'north.pl',
      popularity: 1
    })
  });
}
```

### 2. **Sugestie na podstawie North**
Analizuj zamówienia:
```javascript
// Najczęściej zamawiane z North dla Pralka Bosch:
const northSuggestions = await fetch('/api/north/popular-parts?type=Pralka&brand=Bosch');
```

### 3. **Integracja API North.pl**
Jeśli North ma API:
```javascript
// Automatyczne pobieranie cen
const northParts = await fetch(`https://api.north.pl/search?q=${partNumber}`);
```

### 4. **Porównywarka cen**
```javascript
// Porównaj ceny: magazyn vs North vs Allegro
<div>
  <span>Magazyn: 50 zł</span>
  <span>North.pl: 48 zł ✅ Taniej!</span>
  <span>Allegro: 52 zł</span>
</div>
```

### 5. **Śledzenie zamówienia z North**
```javascript
// Zapisz link do zamówienia
order.northLink = 'https://north.pl/orders/12345';
```

---

## 🧪 Scenariusz testowy:

### Test 1: Otwarcie North.pl dla pralki Bosch

1. **Otwórz**: `/technician/visit/VIS251013001`
2. **Sprawdź**: Wizyta ma `deviceType: "Pralka"`, `deviceBrand: "Bosch"`
3. **Kliknij**: "Zamów część"
4. **Sprawdź**: URL zawiera `?deviceType=Pralka&deviceBrand=Bosch`
5. **Kliknij**: "🔍 Szukaj na North.pl"
6. **Sprawdź**: Otwiera się modal z North.pl
7. **Sprawdź**: URL w iframe to `north.pl/...pralek-bosch,g55939.html`

### Test 2: Dodanie części z North

1. **W modalu**: Kliknij "Dodaj część do zamówienia"
2. **Wypełnij**:
   - Nazwa: "Grzałka 2000W"
   - Nr: "00264697"
   - Cena: "89.99"
   - Ilość: "1"
3. **Kliknij**: "✓ Dodaj część"
4. **Sprawdź**: Modal się zamyka
5. **Sprawdź**: Alert: "✅ Dodano: Grzałka 2000W, Cena: 89.99 zł x 1 szt."
6. **Sprawdź**: Część pojawia się na liście (karta pomarańczowa)
7. **Sprawdź**: Badge "North.pl" widoczny
8. **Sprawdź**: Cena: "89.99 zł × 1 = 89.99 zł"

### Test 3: Mix części (magazyn + North)

1. **Dodaj**: Część z magazynu (PART-001)
2. **Dodaj**: Część z North.pl (Grzałka)
3. **Dodaj**: Część z magazynu (PART-002)
4. **Sprawdź**: 3 części na liście
5. **Sprawdź**: Różne kolory (białe selecty + pomarańczowa karta)
6. **Kliknij**: "Wyślij zamówienie"
7. **Sprawdź**: Zamówienie zawiera wszystkie 3 części

---

## 📊 Mapowanie kategorii North.pl:

### Urządzenia → Kategorie
| Typ urządzenia | Kategoria North.pl | Przykładowy link |
|----------------|-------------------|------------------|
| Pralka | `czesci-do-pralek` | `/czesci-agd/czesci-do-pralek/...` |
| Zmywarka | `czesci-do-zmywarek` | `/czesci-agd/czesci-do-zmywarek/...` |
| Lodówka | `czesci-do-lodowek` | `/czesci-agd/czesci-do-lodowek/...` |
| Zamrażarka | `czesci-do-zamrazarek` | `/czesci-agd/czesci-do-zamrazarek/...` |
| Płyta indukcyjna | `czesci-do-plyt-indukcyjnych` | `/czesci-agd/czesci-do-plyt-indukcyjnych/...` |
| Piekarnik | `czesci-do-piekarnikow` | `/czesci-agd/czesci-do-piekarnikow/...` |

### Marki → ID kategorii (przykłady)
| Marka | Typ | ID kategorii |
|-------|-----|--------------|
| Bosch | Pralka | g55939 |
| Samsung | Pralka | g55943 |
| LG | Pralka | g55941 |
| Whirlpool | Pralka | g55945 |
| Amica | Pralka | g55938 |
| Bosch | Zmywarka | g55949 |
| Samsung | Lodówka | g55963 |
| Amica | Płyta indukcyjna | g56009 |

💡 **Uwaga**: ID kategorii mogą się zmieniać - należy regularnie aktualizować mapowanie!

---

## ✅ Checklist implementacji:

- [x] Komponent `NorthPartsBrowser.js`
- [x] Generowanie linków North.pl
- [x] Iframe z North.pl
- [x] Modal dodawania części
- [x] Integracja z formularzem zamówień
- [x] Przekazywanie deviceType z wizyty
- [x] Przycisk "Szukaj na North.pl"
- [x] Rozróżnienie części (magazyn vs North)
- [x] Funkcja `handleAddPartFromNorth`
- [x] Wyświetlanie karty North.pl (pomarańczowa)
- [ ] Testy E2E
- [ ] Aktualizacja mapowania ID kategorii
- [ ] Zapisywanie historii North w bazie
- [ ] Instrukcja dla techników

---

**Status**: ✅ **GOTOWE DO TESTÓW**

**Następne kroki**:
1. Przetestuj z prawdziwymi danymi wizyt
2. Sprawdź czy linki North.pl działają poprawnie
3. Zaktualizuj ID kategorii jeśli potrzeba
4. Dodaj więcej typów urządzeń do mapowania
5. Rozważ API integrację z North.pl
