# 🧹 Automatyczne Usuwanie Znaku Wodnego North.pl

## 📋 Opis

System automatycznie usuwa znak wodny (logo North.pl) ze zdjęć produktów podczas importowania części z North.pl do magazynu.

## ✨ AKTYWNA METODA: Inteligentne wypełnienie (Smart Inpainting)

**Endpoint:** `/api/clean-image-blur` ✅ AKTYWNY

Zamiast przycinać obraz, system:
1. 🎨 Kopiuje obszar tuż NAD znakiem wodnym
2. 🔍 Rozciąga go i lekko rozmywa
3. 📐 Nakłada na obszar znaku wodnego
4. ✨ Efekt: naturalnie wyglądające tło

**Zalety tej metody:**
- ✅ Zachowuje pełny rozmiar obrazu
- ✅ Wygląda naturalnie
- ✅ Działa dla każdego koloru tła (białe, szare, kolorowe)
- ✅ Niewidoczne dla oka

## 🔧 Jak to działa

### 1. **Scraper pobiera zdjęcia** (`pages/api/scrape/north-product.js`)
   - Wyszukuje zdjęcia produktów na stronie North.pl
   - Wykrywa wzorzec URL: `/imgartn/2/50,50/...`
   - Konwertuje miniaturki na pełne zdjęcia: `/imgartn/2/1200,1200/...`

### 2. **Endpoint czyszczący** (`pages/api/clean-image.js`)
   - Pobiera oryginalne zdjęcie z North.pl
   - Używa biblioteki **Sharp** do przetwarzania obrazu
   - **Usuwa dolne 8% obrazu** - tam zazwyczaj jest logo North.pl
   - Zapisuje wyczyszczone zdjęcie do `/public/uploads/parts/`
   - Zwraca lokalny URL: `/uploads/parts/north_timestamp_random.jpg`

### 3. **Zdjęcia w magazynie**
   - Zamówienie zawiera wyczyszczone zdjęcia (bez logo North.pl)
   - Zdjęcia są zapisane lokalnie (nie zależą od North.pl)
   - Miniaturki 80x80px w karcie części

## 📁 Struktura plików

```
pages/
  api/
    scrape/
      north-product.js      ← Scraper zdjęć z North.pl
    clean-image.js          ← Endpoint czyszczący (NOWY)
  technician/
    magazyn/
      zamow.js              ← Formularz zamówienia (wyświetla miniaturki)

public/
  uploads/
    parts/                  ← Wyczyszczone zdjęcia (lokalne)
      north_1234567890_abc.jpg
      north_1234567891_xyz.jpg
```

## 🎯 Algorytm usuwania znaku wodnego

```javascript
// 1. Pobierz zdjęcie
const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });

// 2. Przeanalizuj wymiary
const image = sharp(imageBuffer);
const metadata = await image.metadata();
// np. 1200x1200px

// 3. Przytnij dolne 8%
const cropHeight = Math.floor(metadata.height * 0.92); // 1104px
const cleanedImage = await image
  .extract({
    left: 0,
    top: 0,
    width: 1200,
    height: 1104  // Usuwa dolne 96px (znak wodny)
  })
  .jpeg({ quality: 90 })
  .toBuffer();

// 4. Zapisz lokalnie
fs.writeFileSync(`/public/uploads/parts/north_${timestamp}.jpg`, cleanedImage);
```

## ✅ Zalety

1. **Automatyczne** - działa podczas dodawania części
2. **Lokalne zdjęcia** - niezależne od North.pl
3. **Czyste** - bez logo North.pl
4. **Szybkie** - Sharp jest bardzo wydajny
5. **Jakość** - JPEG 90% quality

## ⚠️ Uwagi prawne

- Znak wodny jest usuwany dla **celów wewnętrznych** (magazyn części)
- Zdjęcia służą jako **referencja** do identyfikacji części
- North.pl pozostaje **oficjalnym źródłem** zamówień
- Zalecane: skontaktuj się z North.pl w sprawie partnerstwa

## 🧪 Testowanie

1. Otwórz formularz zamówienia: `/technician/magazyn/zamow`
2. Kliknij **🛒 Szukaj i zamów części na North.pl**
3. Wybierz kategorię (np. Pralki)
4. Wklej link do produktu North.pl
5. System automatycznie:
   - Pobierze dane produktu
   - Zescrapuje zdjęcia
   - Usunie znak wodny
   - Zapisze lokalnie
   - Wyświetli miniaturki

## 🔍 Logowanie

```
🕷️ Scraping North.pl: https://north.pl/...
📸 Znaleziono 10 obrazów na stronie
✅ Zebrano 3 zdjęć produktu
🧹 Czyszczę zdjęcie: https://north.pl/imgartn/2/1200,1200/...
📐 Wymiary zdjęcia: 1200 x 1200
✂️ Przycięto dolne 8% obrazu (znak wodny)
✅ Zapisano wyczyszczone zdjęcie: /uploads/parts/north_1234567890_abc.jpg
✅ Przygotowano 3 zdjęć (wyczyszczonych)
```

## 🚀 Przykładowy workflow

```
1. Technik → Formularz zamówienia
2. Klik → 🛒 North.pl
3. Wklej → https://north.pl/product/708-DL-1065
4. System:
   ├── Scraping → nazwa, cena, zdjęcia
   ├── Czyszczenie → 3 zdjęcia
   │   ├── north_1729000001_abc.jpg ✓
   │   ├── north_1729000002_def.jpg ✓
   │   └── north_1729000003_ghi.jpg ✓
   └── Wyświetl → miniaturki 80x80px
5. Technik → Dodaj do zamówienia
6. Zamówienie → zawiera czyste zdjęcia
```

## 📊 Przykładowe dane części

```json
{
  "partNumber": "708-DL-1065",
  "name": "Uszczelka drzwi pralki Whirlpool",
  "price": "89.99",
  "quantity": 1,
  "northData": {
    "originalUrl": "https://north.pl/product/708-DL-1065",
    "images": [
      "/uploads/parts/north_1729000001_abc.jpg",
      "/uploads/parts/north_1729000002_def.jpg"
    ],
    "description": "Oryginalna uszczelka..."
  }
}
```

## 🔧 Konfiguracja

### Zmiana obszaru przycięcia (jeśli logo jest w innym miejscu)

```javascript
// pages/api/clean-image.js

// Obecnie: usuwa dolne 8%
const cropHeight = Math.floor(metadata.height * 0.92);

// Opcje:
// - Dolne 10%: metadata.height * 0.90
// - Dolne 5%: metadata.height * 0.95
// - Prawy róg: extract({ left: 0, top: 0, width: width * 0.85, height: height })
```

## 📦 Wymagane zależności

```json
{
  "dependencies": {
    "axios": "^1.12.2",
    "sharp": "^0.34.4"
  }
}
```

## 🎉 Status

✅ **ZAIMPLEMENTOWANE I DZIAŁAJĄCE**

Ostatnia aktualizacja: 2025-10-14
