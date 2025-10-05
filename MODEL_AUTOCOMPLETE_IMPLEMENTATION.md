# 🔍 Autocomplete Modeli Urządzeń - Dokumentacja

## 🎯 Cel

Dodanie **inteligentnego autocomplete** dla pola "Model" w formularzu admina `/admin/rezerwacje/nowa`. System pobiera modele z bazy danych na podstawie wybranej marki i kategorii.

---

## 📊 Przed i Po

### **PRZED** (text input):
```jsx
<input 
  type="text" 
  placeholder="np. WW70J5346MW"
/>
```

**Problemy:**
- ❌ User musi znać dokładny model
- ❌ Możliwe literówki
- ❌ Brak podpowiedzi
- ❌ Nie wykorzystujemy bazy modeli

### **PO** (autocomplete):
```jsx
<input 
  type="text"
  placeholder="Wpisz lub wybierz..."
  onFocus={() => pokazDropdown()}
/>
{/* Dropdown z sugestiami */}
<div className="suggestions">
  {models.map(model => (
    <button onClick={() => wypełnijModel(model)}>
      {model.model} - {model.name}
    </button>
  ))}
</div>
```

**Zalety:**
- ✅ Podpowiedzi z bazy danych
- ✅ Filtrowanie w czasie rzeczywistym
- ✅ Kliknięcie wypełnia pole
- ✅ Nadal można wpisać własny model

---

## 🗄️ Źródła Danych

### **1. `data/modelsDatabase.json`** (statyczna baza)

Struktura:
```json
{
  "brands": {
    "BOSCH": {
      "washing_machines": {
        "WAG28461BY": {
          "name": "Serie 6 WAG28461BY",
          "type": "Pralka ładowana od przodu",
          "capacity": "9 kg",
          "common_parts": [...]
        }
      }
    }
  }
}
```

**Przykładowe dane:**
- **BOSCH**: 6 modeli pralek, 2 suszarki
- **SAMSUNG**: 2 modele (pralka, lodówka)
- **LG**, **WHIRLPOOL**, **AMICA**: więcej modeli w production

### **2. `data/device-models.json`** (user-added)

Flat array modeli dodanych przez użytkowników:
```json
[
  {
    "id": "user-model-1",
    "brand": "LG",
    "model": "F4J6VY0W",
    "name": "Pralka AI DD™",
    "type": "Pralki",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

### **API Endpoint: `/api/device-models`**

**GET /api/device-models**

Query params:
- `brand` - filtruj po marce (BOSCH, Samsung, LG)
- `type` - filtruj po typie (Pralki, Lodówki)
- `search` - wyszukaj w model/name/serialNumber
- `sortBy` - sortuj (brand, model, type)
- `sortOrder` - asc/desc

**Przykład:**
```
GET /api/device-models?brand=BOSCH&type=Pralki
```

**Response:**
```json
{
  "success": true,
  "total": 4,
  "models": [
    {
      "id": "bosch-wag28461by",
      "brand": "BOSCH",
      "model": "WAG28461BY",
      "name": "Serie 6 WAG28461BY",
      "type": "Pralka ładowana od przodu",
      "capacity": "9 kg",
      "common_parts": [...]
    }
  ]
}
```

---

## 🔧 Implementacja

### **1. State Management**

**Lokalizacja:** `pages/admin/rezerwacje/nowa.js` (linia ~52)

```javascript
// Model suggestions dla autocomplete
const [modelSuggestions, setModelSuggestions] = useState({}); // { deviceIndex: [models] }
const [showModelSuggestions, setShowModelSuggestions] = useState(null); // index urządzenia
const [loadingModels, setLoadingModels] = useState(false);
```

**Dlaczego `modelSuggestions` to obiekt?**
- Formularz obsługuje **wiele urządzeń** (`devices` array)
- Każde urządzenie może mieć inną markę → inne modele
- `{ 0: [models dla urządzenia 0], 1: [models dla urządzenia 1] }`

---

### **2. Pobieranie Modeli** (`fetchModels`)

**Lokalizacja:** linia ~140

```javascript
const fetchModels = async (deviceIndex) => {
  const device = devices[deviceIndex];
  
  // Wymaga marki
  if (!device.brand) {
    setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
    return;
  }

  setLoadingModels(true);
  try {
    const params = new URLSearchParams();
    params.append('brand', device.brand);
    
    // Opcjonalnie: filtruj po typie urządzenia
    if (device.category) {
      params.append('type', device.category);
    }

    const response = await fetch(`/api/device-models?${params.toString()}`);
    const data = await response.json();

    if (data.success && data.models) {
      setModelSuggestions({ 
        ...modelSuggestions, 
        [deviceIndex]: data.models 
      });
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    setModelSuggestions({ ...modelSuggestions, [deviceIndex]: [] });
  } finally {
    setLoadingModels(false);
  }
};
```

**Trigger:** Wywoływane gdy zmienia się `brand` lub `category`:

```javascript
const updateDevice = (index, field, value) => {
  const updated = [...devices];
  updated[index][field] = value;
  setDevices(updated);

  // Jeśli zmienia się marka - pobierz nowe modele
  if (field === 'brand' || field === 'category') {
    fetchModels(index);
  }
};
```

---

### **3. Filtrowanie Lokalne**

**Lokalizacja:** linia ~167

```javascript
const getFilteredModels = (deviceIndex, searchTerm) => {
  const suggestions = modelSuggestions[deviceIndex] || [];
  
  if (!searchTerm) {
    return suggestions.slice(0, 10); // Pokaż max 10 bez filtrowania
  }

  const search = searchTerm.toLowerCase();
  return suggestions
    .filter(m => 
      m.model?.toLowerCase().includes(search) ||
      m.name?.toLowerCase().includes(search)
    )
    .slice(0, 10); // Limit 10 wyników
};
```

**Dlaczego lokalne filtrowanie?**
- Szybsze (bez request do serwera)
- Działa podczas wpisywania
- API już zwrócił wszystkie modele dla marki

---

### **4. UI - Autocomplete Input**

**Lokalizacja:** linia ~600

```jsx
<div className="relative">
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Model {device.brand && modelSuggestions[index]?.length > 0 && (
      <span className="text-blue-600 text-xs">
        ({modelSuggestions[index].length} dostępnych)
      </span>
    )}
  </label>
  
  <input
    type="text"
    value={device.model}
    onChange={(e) => {
      updateDevice(index, 'model', e.target.value);
      // Pokaż sugestie po wpisaniu
      if (device.brand && e.target.value) {
        setShowModelSuggestions(index);
      }
    }}
    onFocus={() => {
      if (device.brand) {
        setShowModelSuggestions(index);
      }
    }}
    onBlur={() => {
      // Delay aby kliknięcie w dropdown zdążyło się wykonać
      setTimeout(() => setShowModelSuggestions(null), 200);
    }}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
    placeholder={device.brand ? "Wpisz lub wybierz..." : "Najpierw wybierz markę"}
    disabled={!device.brand}
  />
  
  {/* Dropdown z sugestiami */}
  {showModelSuggestions === index && device.brand && (
    <div className="absolute z-20 w-full bg-white border shadow-lg mt-1 max-h-60 overflow-y-auto">
      {loadingModels ? (
        <div className="px-3 py-3 text-sm text-gray-500 text-center">
          ⏳ Ładowanie modeli...
        </div>
      ) : getFilteredModels(index, device.model).length > 0 ? (
        <>
          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 font-medium">
            💡 Modele z bazy danych
          </div>
          {getFilteredModels(index, device.model).map((model, mIdx) => (
            <button
              key={mIdx}
              type="button"
              onClick={() => handleModelSelect(index, model)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
            >
              <div className="font-medium text-gray-900">{model.model}</div>
              {model.name && (
                <div className="text-xs text-gray-500">{model.name}</div>
              )}
              {model.type && (
                <div className="text-xs text-blue-600">{model.type}</div>
              )}
            </button>
          ))}
        </>
      ) : (
        <div className="px-3 py-3 text-sm text-gray-500">
          {device.model ? (
            <>
              🔍 Brak dopasowań w bazie.
              <div className="text-xs mt-1">Możesz wpisać własny model.</div>
            </>
          ) : (
            <>
              📝 {modelSuggestions[index]?.length || 0} modeli dla marki {device.brand}
              <div className="text-xs mt-1">Zacznij wpisywać, aby filtrować...</div>
            </>
          )}
        </div>
      )}
    </div>
  )}
</div>
```

---

### **5. Handler Wyboru Modelu**

```javascript
const handleModelSelect = (deviceIndex, model) => {
  const updated = [...devices];
  updated[deviceIndex].model = model.model;
  
  // Opcjonalnie: wypełnij też serialNumber jeśli jest w bazie
  if (model.serialNumber) {
    updated[deviceIndex].serialNumber = model.serialNumber;
  }
  
  setDevices(updated);
  setShowModelSuggestions(null);
};
```

---

## 🎬 User Flow

### **Scenariusz 1: Wybór z listy**

```
1. User wybiera kategorię: "Pralki"
2. User wybiera markę: "BOSCH"
   → fetchModels(0) pobiera modele Bosch Pralki
   → modelSuggestions[0] = [4 modele]

3. User klika pole "Model"
   → Dropdown pokazuje 4 modele:
      • WAG28461BY - Serie 6 WAG28461BY
      • WAT28461BY - Serie 6 WAT28461BY
      • WAE28461BY - Serie 6 WAE28461BY
      • WAK28261PL - Serie 4 WAK28261PL

4. User klika "WAG28461BY"
   → Pole wypełnia się: "WAG28461BY"
   → Dropdown się zamyka
```

### **Scenariusz 2: Filtrowanie podczas wpisywania**

```
1. User wybiera: Pralki → Samsung
   → modelSuggestions[0] = [WW90T4540AE, WW80T4020EE]

2. User zaczyna wpisywać: "WW90"
   → getFilteredModels(0, "WW90") zwraca:
      [{ model: "WW90T4540AE", name: "... 9kg" }]

3. User widzi 1 dopasowanie
4. Klika lub dokończa wpisywanie
```

### **Scenariusz 3: Model nie w bazie**

```
1. User wybiera: Mikrofalówka → LG
   → API zwraca: [] (brak modeli LG Mikrofalówka)

2. User klika pole "Model"
   → Dropdown: "Brak modeli w bazie. Możesz wpisać własny."

3. User wpisuje: "MS2336GIH"
   → Zapisuje się jako custom model
```

---

## 🔍 Debugowanie

### **Problem: Nie pokazuje się dropdown**

**Sprawdź:**
1. Czy wybrano markę? (pole disabled bez marki)
2. Czy `fetchModels` zwróciło dane?
   ```javascript
   console.log('modelSuggestions:', modelSuggestions);
   ```
3. Czy `showModelSuggestions === index`?

### **Problem: Nie pobiera modeli**

**Sprawdź w konsoli:**
```
GET /api/device-models?brand=BOSCH&type=Pralki
```

**Testuj API ręcznie:**
```powershell
curl "http://localhost:3000/api/device-models?brand=BOSCH" | ConvertFrom-Json
```

### **Problem: Dropdown znika za szybko**

**Zwiększ delay w onBlur:**
```javascript
onBlur={() => {
  setTimeout(() => setShowModelSuggestions(null), 300); // 200 → 300
}}
```

---

## 📊 Statystyki Bazy

**Modele w `modelsDatabase.json`:**
- BOSCH: 8 modeli (pralki, suszarki)
- SAMSUNG: 2 modele (pralka, lodówka)
- Razem: ~20 modeli (demo data)

**W production:**
- Dodaj więcej modeli przez `/api/device-models` POST
- Import z plików CSV/Excel
- Skanowanie tabliczek AI → auto-dodawanie

---

## 🚀 Przyszłe Rozszerzenia

### **Faza 2** (możliwe):
1. **Import masowy**
   - Wczytaj CSV z 1000+ modeli
   - Parser plików producenta

2. **AI suggestions**
   - "Dla BOSCH pralek często wybierane: WAG28461BY (45%)"
   - Sortuj po popularności

3. **Rich preview**
   - Pokaż zdjęcie modelu
   - Specyfikacja (pojemność, klasa energetyczna)
   - Typowe usterki dla tego modelu

4. **Smart defaults**
   - Jeśli jest tylko 1 model dla marki → auto-wypełnij
   - Zapamiętaj ostatnio używane modele

5. **OCR integration**
   - Przycisk 📷 "Zeskanuj tabliczkę"
   - Auto-wypełnia model + serial number

---

## 📝 Przykłady API

### **Wszystkie modele BOSCH:**
```bash
GET /api/device-models?brand=BOSCH
```

### **BOSCH pralki:**
```bash
GET /api/device-models?brand=BOSCH&type=Pralki
```

### **Wyszukiwanie "WAG":**
```bash
GET /api/device-models?search=WAG
```

### **Samsung + sortowanie:**
```bash
GET /api/device-models?brand=SAMSUNG&sortBy=model&sortOrder=asc
```

---

## ✅ Testy

### **Test 1: Wybór marki**
```
1. Otwórz: /admin/rezerwacje/nowa
2. Kategoria: Pralki
3. Marka: BOSCH
4. Sprawdź DevTools: GET /api/device-models?brand=BOSCH&type=Pralki
5. ✅ modelSuggestions[0] zawiera modele
```

### **Test 2: Dropdown**
```
1. Kliknij pole "Model"
2. ✅ Dropdown się pokazuje
3. ✅ Widać modele BOSCH
4. Kliknij model
5. ✅ Pole wypełnia się
6. ✅ Dropdown znika
```

### **Test 3: Filtrowanie**
```
1. Pole "Model" - wpisz "WAG"
2. ✅ Lista filtruje się do WAG28461BY
3. Wpisz "xyz"
4. ✅ "Brak dopasowań" + można wpisać własny
```

### **Test 4: Wiele urządzeń**
```
1. Dodaj 2 urządzenia
2. Urządzenie 1: BOSCH → WAG28461BY
3. Urządzenie 2: SAMSUNG → WW90T4540AE
4. ✅ Każde ma niezależny dropdown
5. ✅ Modele nie mieszają się
```

### **Test 5: Bez marki**
```
1. Kategoria: Pralki
2. Marka: (puste)
3. Kliknij "Model"
4. ✅ Pole disabled
5. ✅ Placeholder: "Najpierw wybierz markę"
```

---

## 🔗 Powiązane Pliki

### **Modified:**
- `pages/admin/rezerwacje/nowa.js` - formularz z autocomplete
- `pages/api/device-models/index.js` - endpoint z parserem

### **Data Sources:**
- `data/modelsDatabase.json` - statyczna baza (hierarchiczna)
- `data/device-models.json` - user-added models (flat array)

### **Related Components:**
- `ModelAIScanner` - skanuje tabliczki, używa `modelsDatabase.json`
- `ModelManagerModal` - zarządza modelami w wizytach

---

## 📚 Zgodność z Systemem

**Ta sama baza w:**
- ✅ `ModelAIScanner` - skanowanie tabliczek
- ✅ `ModelOCRScanner` - OCR rozpoznawanie
- ✅ `/api/device-models` - REST API
- ✅ Admin formularz - autocomplete

**Jedna prawda, wiele interfejsów** ✨

---

## 🎯 Podsumowanie

### **Co się zmieniło:**
- ✅ Pole "Model" ma autocomplete
- ✅ Pobiera dane z API `/api/device-models`
- ✅ Filtrowanie w czasie rzeczywistym
- ✅ Można wybrać z listy lub wpisać własny

### **Korzyści:**
- 🚀 **Szybsze wypełnianie** (klik zamiast wpisywania)
- ✅ **Bez literówek** (wybór z listy)
- 📊 **Wykorzystanie bazy** (20+ modeli)
- 🎯 **Smart defaults** (filtrowanie po marce/kategorii)

### **Backward compatible:**
- ✅ Nadal można wpisać własny model
- ✅ Submit taki sam jak wcześniej
- ✅ Struktura danych bez zmian

**Status:** ✅ **GOTOWE i przetestowane!**

---

**Data:** 2025-10-04  
**Wersja:** 1.0  
**Autor:** AI + Developer
