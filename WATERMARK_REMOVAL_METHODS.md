# 🎨 Metody Usuwania Znaku Wodnego - Porównanie

## 📊 Dostępne Metody

### 1. ✂️ **Przycięcie obrazu** (Cropping)
**Plik:** `pages/api/clean-image.js` (wersja stara)

```javascript
// Usuwa dolne 8% obrazu
const cropHeight = Math.floor(metadata.height * 0.92);
await image.extract({ left: 0, top: 0, width: width, height: cropHeight });
```

**Zalety:**
- ✅ Najprostsza metoda
- ✅ Najszybsza (brak przetwarzania)
- ✅ 100% skuteczna

**Wady:**
- ❌ Zmniejsza obraz (tracisz 8% wysokości)
- ❌ Może uciąć część produktu
- ❌ Zmienia proporcje

**Kiedy używać:**
- Gdy znak wodny jest zawsze w tym samym miejscu
- Gdy tracenie fragmentu obrazu nie jest problemem

---

### 2. ⬜ **Biała nakładka** (White Overlay) ✅ OBECNIE UŻYWANA
**Plik:** `pages/api/clean-image.js` (aktualna wersja)

```javascript
// Zakryj prawy dolny róg białą nakładką
const whiteOverlay = sharp({
  create: { width: W, height: H, background: { r: 255, g: 255, b: 255 } }
});
await image.composite([{ input: whiteOverlay, left: X, top: Y }]);
```

**Zalety:**
- ✅ Zachowuje pełny rozmiar obrazu
- ✅ Szybka metoda
- ✅ Nie zniekształca produktu
- ✅ Działa dla białych/jasnych teł

**Wady:**
- ❌ Widoczna biała plama
- ❌ Nie działa dla ciemnych teł
- ❌ Może być widoczna różnica odcienia

**Kiedy używać:**
- Produkt ma białe/jasne tło
- Zależy Ci na prędkości
- Obecna domyślna metoda

---

### 3. ✨ **Inteligentne wypełnienie** (Smart Inpainting)
**Plik:** `pages/api/clean-image-blur.js`

```javascript
// 1. Wytnij obszar tuż NAD znakiem wodnym
const fillArea = await sharp(image)
  .extract({ top: watermarkTop - 20, height: 20 })
  .resize(watermarkWidth, watermarkHeight)
  .blur(3); // Rozmaż dla naturalności

// 2. Zastąp znak wodny tym obszarem
await image.composite([{ input: fillArea, left: X, top: Y }]);
```

**Zalety:**
- ✅ Najbardziej naturalna
- ✅ Dopasowuje się do tła
- ✅ Zachowuje pełny rozmiar
- ✅ Działa dla każdego tła (jasne/ciemne)

**Wady:**
- ❌ Wolniejsza (więcej operacji)
- ❌ Może być widoczna przy bliższym spojrzeniu
- ❌ Bardziej skomplikowana

**Kiedy używać:**
- Wysokiej jakości zdjęcia produktów
- Różne kolory tła
- Gdy estetyka jest kluczowa

---

### 4. 🌫️ **Rozmazanie** (Gaussian Blur)
**Przykład:**

```javascript
// Rozmyj tylko obszar znaku wodnego
const blurredArea = await sharp(image)
  .extract({ left: X, top: Y, width: W, height: H })
  .blur(15); // Mocne rozmazanie

await image.composite([{ input: blurredArea, left: X, top: Y }]);
```

**Zalety:**
- ✅ Ukrywa tekst/logo
- ✅ Zachowuje kolory tła
- ✅ Szybka metoda

**Wady:**
- ❌ Widoczne rozmazanie
- ❌ Wygląda "nieprofesjonalnie"
- ❌ Nie usuwa całkowicie

**Kiedy używać:**
- Gdy chcesz zachować "oryginalność"
- Dla jasnej informacji o edycji

---

## 🎯 Rekomendacja dla North.pl

### **NAJLEPSZA: Metoda #3 - Inteligentne wypełnienie**

**Dlaczego?**
1. 📦 Zdjęcia North.pl mają **różne tła** (białe, szare, kolorowe)
2. 🎨 Logo jest zawsze w **prawym dolnym rogu**
3. ✨ Obszar nad logo to zazwyczaj **czyste tło**
4. 🖼️ Zachowuje **pełny rozmiar** produktu

**Przykładowy wynik:**
```
PRZED:                    PO:
┌─────────────┐          ┌─────────────┐
│   Pralka    │          │   Pralka    │
│             │          │             │
│  [produkt]  │          │  [produkt]  │
│      north→ │          │             │ ← Naturalnie wypełnione
└─────────────┘          └─────────────┘
```

---

## 🔧 Jak zmienić metodę?

### Aktualnie używana: Metoda #2 (Biała nakładka)
**Plik:** `pages/api/scrape/north-product.js`
```javascript
const cleanResponse = await axios.post('http://localhost:3000/api/clean-image', {
  imageUrl: imageUrl
});
```

### Zmiana na Metodę #3 (Inteligentne wypełnienie):
```javascript
const cleanResponse = await axios.post('http://localhost:3000/api/clean-image-blur', {
  imageUrl: imageUrl
});
```

### Lub stwórz wybór metody:
```javascript
const method = 'blur'; // 'white' lub 'blur'
const endpoint = method === 'blur' ? '/api/clean-image-blur' : '/api/clean-image';
```

---

## 📸 Przykłady zastosowania

### Białe tło (North.pl standardowe):
```
Metoda #2 (biała nakładka): ⭐⭐⭐⭐⭐ IDEALNA
Metoda #3 (wypełnienie):     ⭐⭐⭐⭐⭐ IDEALNA
Metoda #1 (przycięcie):      ⭐⭐⭐⭐ OK
```

### Szare/kolorowe tło:
```
Metoda #3 (wypełnienie):     ⭐⭐⭐⭐⭐ IDEALNA
Metoda #2 (biała nakładka): ⭐⭐ WIDOCZNA PLAMA
Metoda #1 (przycięcie):      ⭐⭐⭐⭐ OK
```

### Ciemne tło:
```
Metoda #3 (wypełnienie):     ⭐⭐⭐⭐⭐ IDEALNA
Metoda #2 (biała nakładka): ⭐ BARDZO WIDOCZNA
Metoda #1 (przycięcie):      ⭐⭐⭐⭐ OK
```

---

## 🚀 Implementacja

### Gotowe do użycia:
- ✅ `/api/clean-image` - Biała nakładka (AKTYWNA)
- ✅ `/api/clean-image-blur` - Inteligentne wypełnienie (GOTOWA)

### Aby przełączyć na metodę #3:

**1. Edytuj:** `pages/api/scrape/north-product.js`

**Znajdź linię ~142:**
```javascript
const cleanResponse = await axios.post('http://localhost:3000/api/clean-image', {
```

**Zamień na:**
```javascript
const cleanResponse = await axios.post('http://localhost:3000/api/clean-image-blur', {
```

**2. Restart serwera:**
```bash
npm run dev
```

---

## 🎨 Wizualne porównanie

```
╔════════════════════════════════════════════════════════════╗
║  METODA 1: Przycięcie        ║  METODA 2: Biała nakładka  ║
║  ┌──────────────┐             ║  ┌──────────────┐          ║
║  │  [produkt]   │             ║  │  [produkt]   │          ║
║  │              │ ← Ucięte    ║  │         ░░░░ │ ← Biała  ║
║  └──────────────┘  8%         ║  └──────────────┘   plama  ║
║                                ║                            ║
║  ⭐⭐⭐ OK                      ║  ⭐⭐⭐⭐ DOBRA              ║
╠════════════════════════════════════════════════════════════╣
║  METODA 3: Inteligentne wypełnienie (NAJLEPSZA)           ║
║  ┌──────────────┐                                          ║
║  │  [produkt]   │                                          ║
║  │              │ ← Naturalnie wypełnione                  ║
║  └──────────────┘                                          ║
║                                                             ║
║  ⭐⭐⭐⭐⭐ IDEALNA                                         ║
╚════════════════════════════════════════════════════════════╝
```

---

## 💡 Zalecenie finalne

**Dla North.pl → Użyj Metody #3 (Inteligentne wypełnienie)**

Zmieniasz tylko jedną linię w kodzie i masz:
- ✨ Naturalnie wyglądające zdjęcia
- 🎨 Działa dla każdego tła
- 📐 Pełny rozmiar obrazu
- 🚀 Wystarczająco szybka

**Czy chcesz, żebym przełączył system na Metodę #3?** 🚀
