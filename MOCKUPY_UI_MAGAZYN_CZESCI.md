# 🎨 MOCKUPY I WIZUALIZACJE UI - System Magazynu Części

**Data:** 2025-10-04  
**Status:** ✅ ZAIMPLEMENTOWANE

---

## 📸 ZRZUTY EKRANU FUNKCJONALNOŚCI

### 1. **Widok Tabeli z Miniaturkami Zdjęć**

```
┌─────────────────────────────────────────────────────────────────┐
│  Zarządzanie częściami                    [🌙] [← Wróć]         │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Szukaj...]  [Filtry 2]  [Wszystkie] [Niski] [Brak]        │
│  [📋] [🎴] [+ Dodaj część]                                      │
├─────────────────────────────────────────────────────────────────┤
│  Zdjęcie │ Część                    │ Stan    │ Cena   │ Akcje  │
├──────────┼──────────────────────────┼─────────┼────────┼────────┤
│  [IMG]   │ Łożysko bębna Samsung   │ ✅ 10   │ 85 zł  │ E | D  │
│    3     │ PART001 • DC97-16151A   │         │        │        │
├──────────┼──────────────────────────┼─────────┼────────┼────────┤
│  [IMG]   │ Pompa odpływowa univ.   │ ⚠️ 2    │ 120 zł │ E | D  │
│          │ PART002 • DC96-01414G   │         │        │        │
├──────────┼──────────────────────────┼─────────┼────────┼────────┤
│  [?]     │ Pasek napędowy HTD      │ ❌ 0    │ 45 zł  │ E | D  │
│          │ PART003 • 6PH1871       │         │        │        │
└─────────────────────────────────────────────────────────────────┘
```

**Elementy:**
- ✅ Miniaturka 50x50px w pierwszej kolumnie
- ✅ Badge z liczbą zdjęć (jeśli >1)
- ✅ Placeholder jeśli brak zdjęcia
- ✅ Statusy kolorowe: ✅ OK, ⚠️ Niski, ❌ Brak

---

### 2. **Widok Grid/Karty ze Zdjęciami**

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ [  ZDJĘCIE  ] │ [  ZDJĘCIE  ] │ [  ZDJĘCIE  ] │ [  ZDJĘCIE  ] │
│    3 📸       │    1 📸       │   [NO IMG]    │    5 📸       │
│  ✅ OK        │  ⚠️ NISKI     │  ❌ BRAK      │  ✅ OK        │
│               │               │               │               │
│ Łożysko bębna│ Pompa odpływ. │ Pasek napęd.  │ Kompresor     │
│ Samsung       │ uniwersalna   │ HTD 1871mm    │ lodówki       │
│ DC97-16151A   │ DC96-01414G   │ 6PH1871       │ R600a         │
│               │               │               │               │
│ [AGD] [Pralka]│ [AGD] [Univ.] │ [AGD] [Pralka]│ [AGD][Lodówka]│
│ Samsung, LG   │ Samsung, Bosch│ Whirlpool     │ Bosch, Siemens│
│               │               │               │               │
│  85.00 zł     │  120.00 zł    │   45.00 zł    │  280.00 zł    │
│  10 szt       │   2 szt       │   0 szt       │  15 szt       │
│               │               │               │               │
│ [✏️ Edytuj]   │ [✏️ Edytuj]   │ [✏️ Edytuj]   │ [✏️ Edytuj]   │
│ [🗑️]          │ [🗑️]          │ [🗑️]          │ [🗑️]          │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

**Elementy:**
- ✅ Duże zdjęcie (aspect-ratio 1:1)
- ✅ Badge ze statusem w rogu
- ✅ Licznik zdjęć (jeśli >1)
- ✅ Tagi kategorii i subcategorii
- ✅ Top 3 marki kompatybilne
- ✅ Cena retail i stan magazynowy
- ✅ Przyciski akcji (Edytuj/Usuń)

---

### 3. **Modal "Dodaj Część" z Upload Zdjęć**

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Dodaj nową część do magazynu                       [❌] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 Zdjęcia części (do 8 zdjęć)                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [IMG1]  [IMG2]  [IMG3]  [+]                          │ │
│  │ GŁÓWNE    2       3    Dodaj więcej                  │ │
│  │                                                       │ │
│  │ [Przeciągnij zdjęcia tutaj lub kliknij aby wybrać]  │ │
│  │ PNG, JPG, WEBP do 10MB (3/8)                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Nazwa części *                    Numer katalogowy *      │
│  [Łożysko bębna Samsung...]       [DC97-16151A      ]      │
│                                                             │
│  Kategoria                         Subcategoria            │
│  [AGD ▼]                          [🌀 Pralka ▼    ]      │
│                                                             │
│  Cena detaliczna (zł)             Cena hurtowa (zł)       │
│  [85.00              ]            [65.00           ]      │
│                                                             │
│  Stan magazynowy (szt)            Min stan                 │
│  [10                 ]            [3              ]      │
│                                                             │
│  Kompatybilne marki                                        │
│  [Samsung           ] [Dodaj]                              │
│  [Samsung ×] [LG ×] [Bosch ×]                             │
│                                                             │
│  Kompatybilne modele                                       │
│  [WW90T4540AE       ] [Dodaj]                              │
│  [WW90T4540AE ×] [WW80T4540AE ×] [+2]                     │
│                                                             │
│  Opis                                                      │
│  [Wysokiej jakości łożysko bębna do pralek Samsung...   ] │
│  [                                                        ] │
│                                                             │
│  [✅ Dodaj część]  [❌ Anuluj]                             │
└─────────────────────────────────────────────────────────────┘
```

**Funkcjonalności:**
- ✅ Drag & drop upload
- ✅ Preview miniatur
- ✅ Sortowanie zdjęć (drag to reorder)
- ✅ Oznaczanie głównego (pierwsze = main)
- ✅ Dynamiczne dodawanie marek/modeli
- ✅ Walidacja wymaganych pól

---

### 4. **Modal Edycji z Galerią Zdjęć**

```
┌─────────────────────────────────────────────────────────────┐
│  Edytuj część: PART001                                 [❌] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 Zdjęcia części                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [IMG1]  [IMG2]  [IMG3]  [+]                          │ │
│  │ GŁÓWNE    ↑↓      ↑↓   Dodaj                         │ │
│  │  🗑️       🗑️       🗑️                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Nazwa części                                              │
│  [Łożysko bębna Samsung                              ]    │
│                                                             │
│  Numer katalogowy                                          │
│  [DC97-16151A                                        ]    │
│                                                             │
│  Kategoria                                                 │
│  [AGD                                                ]    │
│                                                             │
│  Stan magazynowy    Cena jednostkowa (zł)                 │
│  [10            ]   [85.00                  ]             │
│                                                             │
│  [Zapisz zmiany]  [Anuluj]                                │
└─────────────────────────────────────────────────────────────┘
```

**Funkcjonalności:**
- ✅ Edycja istniejących zdjęć
- ✅ Upload dodatkowych
- ✅ Usuwanie pojedynczych
- ✅ Zmiana kolejności (↑↓)
- ✅ Re-assign głównego

---

### 5. **Zaawansowane Filtry (Expanded)**

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Szukaj...]  [🎛️ Filtry 3]  [Wszystkie][Niski][Brak]  │
├─────────────────────────────────────────────────────────────┤
│  🎛️ Zaawansowane filtry                [Wyczyść wszystkie] │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Kategoria          Subcategoria        Marka          │ │
│  │ [AGD ▼]           [🌀 Pralka ▼]      [Samsung ▼]     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Aktywne filtry:                                           │
│  [Kategoria: AGD ×] [🌀 Pralka ×] [Marka: Samsung ×]     │
└─────────────────────────────────────────────────────────────┘
```

**Dropdowny:**
- ✅ **Kategoria:** AGD, Elektronika, Ogrzewanie, Inne
- ✅ **Subcategoria:** 🌀 Pralka, 🧊 Lodówka, 💧 Zmywarka, 🔥 Piekarnik, 🍳 Kuchenka
- ✅ **Marka:** Samsung, Bosch, LG, Whirlpool, Amica, Candy, Electrolux (z danych)
- ✅ **Active filters chips** - click X to remove

---

### 6. **Lightbox Galerii Zdjęć**

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍]                  [3 / 8]                      [❌]     │
│                                                             │
│                                                             │
│                                                             │
│                    [   DUŻE ZDJĘCIE   ]                    │
│  [◀]                                              [▶]      │
│                      GŁÓWNE                                │
│                                                             │
│                                                             │
│                                                             │
│          "Widok ogólny łożyska bębna"                      │
│                                                             │
│  [📷] [📷] [📷] [📷] [📷] [📷] [📷] [📷]                  │
│   1    2    3    4    5    6    7    8                     │
│                                                             │
│  ← → klawisze strzałek | ESC zamknij | Kliknij powiększ   │
└─────────────────────────────────────────────────────────────┘
```

**Funkcjonalności:**
- ✅ Pełnoekranowy lightbox
- ✅ Nawigacja strzałkami (← →)
- ✅ Pasek miniatur na dole
- ✅ Zoom in/out (klik)
- ✅ Counter (3/8)
- ✅ Zamknięcie ESC lub X
- ✅ Badge "GŁÓWNE" dla main photo

---

### 7. **Toggle Widoku Tabela ↔ Grid**

```
[📋 Tabela] [🎴 Karty]  <-- Active state
   white       gray     (Tabela aktywna)

[gray] [white]  <-- Grid aktywny
```

**Stan zapisywany w localStorage:**
```javascript
localStorage.setItem('partsViewMode', 'table'); // lub 'grid'
```

---

## 🎨 PALETA KOLORÓW

### Status Badges:
- ✅ **OK (Dostępne):** `bg-green-500 text-white`
- ⚠️ **NISKI (<5):** `bg-yellow-500 text-white`
- ❌ **BRAK (0):** `bg-red-500 text-white`

### Category Tags:
- **Kategoria:** `bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300`
- **Subcategoria:** `bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300`
- **Marka:** `bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`
- **Model:** `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`

### Action Buttons:
- **Edytuj:** `bg-blue-600 hover:bg-blue-700 text-white`
- **Usuń:** `bg-red-600 hover:bg-red-700 text-white`
- **Dodaj:** `bg-green-600 hover:bg-green-700 text-white`
- **Anuluj:** `bg-gray-200 dark:bg-gray-700 hover:bg-gray-300`

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
- sm: 640px   → 1 kolumna w grid
- md: 768px   → 2 kolumny w grid
- lg: 1024px  → 3 kolumny w grid
- xl: 1280px  → 4 kolumny w grid
```

**Grid Layout:**
```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

---

## 🔄 INTERAKCJE I ANIMACJE

### Hover Effects:
- **Karty:** `hover:shadow-xl` + `scale-105` na zdjęciu
- **Buttony:** `hover:bg-*-700` transitions
- **Tabela:** `hover:bg-gray-50 dark:hover:bg-gray-700`

### Transitions:
```css
transition-all duration-200  // Karty
transition-transform duration-300  // Zdjęcia
transition-colors  // Buttony
```

### Loading States:
```html
<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
```

---

## ✅ ZAIMPLEMENTOWANE FUNKCJE

### A) Podstawowe (FAZA 1) ✅
- [x] Modal "Dodaj część" działa
- [x] Upload zdjęć (PhotoUploadZone)
- [x] Kolumna ze zdjęciem w tabeli
- [x] Auto-generowanie ID części
- [x] Walidacja formularza
- [x] Toast notifications (sukces/błąd)

### B) Średnio-zaawansowane (FAZA 2) ✅
- [x] Widok Grid/Karty (PartCard)
- [x] Toggle Tabela ↔ Grid
- [x] Zapisywanie preferencji (localStorage)
- [x] Zaawansowane filtry (kategoria, subcategoria, marka)
- [x] Active filter chips z możliwością usunięcia
- [x] Galeria wielu zdjęć (images array)
- [x] Lightbox PhotoGallery z nawigacją
- [x] Zoom in/out w lightboxie
- [x] Keyboard navigation (← → ESC)

### C) Zaawansowane (FAZA 3) 🔄
- [ ] Smart search z autocomplete
- [ ] Bulk operations (zaznacz wiele)
- [ ] PartDetailModal (szczegółowy widok)
- [ ] Statystyki magazynu
- [ ] Viewer 360° (opcjonalnie)

---

## 🎯 USER FLOW

### Dodawanie nowej części:
1. Klik "Dodaj część" → Modal otwiera się
2. Upload 1-8 zdjęć (drag&drop lub klik)
3. Wypełnienie formularza (nazwa, numer, kategoria)
4. Dodanie marek/modeli (Enter po wpisaniu)
5. Klik "Dodaj część" → API POST
6. Toast sukcesu + odświeżenie listy
7. Modal zamyka się, form resetuje

### Edycja istniejącej części:
1. Klik "Edytuj" w tabeli lub karcie
2. Modal z danymi części
3. Edycja zdjęć (dodaj/usuń/zmień kolejność)
4. Zmiana pól formularza
5. Klik "Zapisz zmiany" → API PUT
6. Toast sukcesu + odświeżenie
7. Modal zamyka się

### Przeglądanie galerii:
1. Klik na zdjęciu w karcie
2. Lightbox otwiera pełnoekranowo
3. Nawigacja: ← → strzałki lub miniaturki
4. Zoom: Klik na zdjęciu
5. Zamknięcie: ESC lub przycisk X

### Filtrowanie:
1. Klik "Filtry" → Expand panel
2. Wybór kategorii, subcategorii, marki
3. Lista filtruje się on-the-fly
4. Active chips pokazują aktywne filtry
5. Klik X na chipie → usuwa filtr
6. "Wyczyść wszystkie" → reset

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### Lazy Loading:
```javascript
// Zdjęcia w grid ładowane lazy
<img loading="lazy" />
```

### Debounce Search:
```javascript
// TODO: Dodać debounce do search inputa
useEffect(() => {
  const timeout = setTimeout(() => filterParts(), 300);
  return () => clearTimeout(timeout);
}, [searchQuery]);
```

### Virtual Scrolling (dla dużych list):
```javascript
// TODO: react-window dla >100 części
import { FixedSizeGrid } from 'react-window';
```

---

## 🔮 PRZYSZŁE ULEPSZENIA (Nice to Have)

### 1. OCR dla Tabliczek Znamionowych
- Zdjęcie tabliczki → rozpoznanie modelu
- Automatyczne wyszukanie części

### 2. AR Preview
- WebXR do przeglądania części w 3D
- "Zobacz w swoim otoczeniu"

### 3. AI Suggestions
- "Ludzie którzy kupili X, kupili też Y"
- Predykcja zapotrzebowania

### 4. Bulk Import/Export
- CSV import części
- Excel export raportów

### 5. QR Codes
- Generowanie QR dla części
- Skanowanie → szczegóły

---

**Koniec mockupów**
