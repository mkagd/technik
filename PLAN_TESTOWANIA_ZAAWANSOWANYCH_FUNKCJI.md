# 🧪 PLAN TESTOWANIA - 3 ZAAWANSOWANE FUNKCJE MAGAZYNU

**Data utworzenia:** 4 października 2025  
**Strona testowa:** http://localhost:3000/admin/magazyn/czesci  
**Status:** Gotowe do testowania

---

## 📋 PRZEGLĄD FUNKCJI DO PRZETESTOWANIA

### ✅ Funkcja #1: Smart Search z Autocomplete (Fuse.js)
**Status implementacji:** Ukończona  
**Biblioteka:** `fuse.js@7.1.0` ✅ Zainstalowana  
**Komponent:** `SmartSearchAutocomplete.js` ✅ Istnieje  
**Integracja:** `pages/admin/magazyn/czesci.js` ✅ Zaimplementowana

### ✅ Funkcja #2: Viewer 360° (react-360-view)
**Status implementacji:** Ukończona  
**Biblioteka:** `react-360-view@0.1.3` ✅ Zainstalowana  
**Komponent:** `Model360Viewer.js` ✅ Istnieje  
**Integracja:** `components/PhotoGallery.js` ✅ Zaimplementowana

### ✅ Funkcja #3: OCR Scanner (GPT-4o Mini Vision)
**Status implementacji:** Ukończona  
**API:** `/api/openai-vision` ✅ Wykorzystuje istniejący endpoint  
**Komponent:** `PartNameplateScanner.js` ✅ Istnieje  
**Integracja:** `pages/admin/magazyn/czesci.js` ✅ Zaimplementowana

---

## 🎯 TEST #1: SMART SEARCH Z AUTOCOMPLETE

### Lokalizacja
**URL:** http://localhost:3000/admin/magazyn/czesci  
**Element:** Pole wyszukiwania na górze strony (nad tabelą/gridem)

### Przygotowanie
1. Otwórz stronę magazynu części
2. Znajdź pole wyszukiwania z placeholderem: "Szukaj po nazwie, numerze, marce, modelu..."

### Test 1.1: Podstawowe wyszukiwanie
**Kroki:**
1. Wpisz: "pompa"
2. Obserwuj dropdown z sugestiami (pojawia się po 300ms)

**Oczekiwane rezultaty:**
- ✅ Dropdown pokazuje max 5 wyników
- ✅ Każdy wynik zawiera:
  - Miniaturkę zdjęcia (50x50px)
  - Nazwę części (bold)
  - Numer części (szary tekst)
  - Cenę (zielony tekst)
  - Stan magazynowy ("W magazynie: X szt")
  - Kategoria/Subcategoria
- ✅ Dopasowane fragmenty są **podświetlone** (bg-yellow-200)
- ✅ Wyniki pasują do zapytania "pompa":
  - "Pompa odpływowa uniwersalna"
  - "Pompa myjąca zmywarki"

### Test 1.2: Fuzzy Search (tolerancja na literówki)
**Kroki:**
1. Wyczyść pole (kliknij ✕)
2. Wpisz: "lozysko" (bez polskich znaków)

**Oczekiwane rezultaty:**
- ✅ Znajduje "Łożysko bębna Samsung" mimo braku "ż"
- ✅ Score/confidence jest wystarczająco wysoki (>0.6)
- ✅ Highlight pokazuje dopasowane fragmenty

### Test 1.3: Wyszukiwanie po numerze części
**Kroki:**
1. Wyczyść pole
2. Wpisz: "DC97-16151A"

**Oczekiwane rezultaty:**
- ✅ Natychmiastowe dopasowanie do "Łożysko bębna Samsung"
- ✅ Wysoki score (>0.9) dla dokładnego dopasowania
- ✅ partNumber jest podświetlony

### Test 1.4: Wyszukiwanie po marce
**Kroki:**
1. Wyczyść pole
2. Wpisz: "samsung"

**Oczekiwane rezultaty:**
- ✅ Lista części kompatybilnych z Samsung:
  - Łożysko bębna Samsung
  - Pompa odpływowa uniwersalna
  - Czujnik temperatury NTC
  - Moduł elektroniczny pralki
  - i inne...

### Test 1.5: Nawigacja klawiaturą
**Kroki:**
1. Wpisz: "pralka"
2. **Nie dotykaj myszki!**
3. Naciśnij: ↓ (strzałka w dół)
4. Naciśnij: ↓ jeszcze raz
5. Naciśnij: ↑ (strzałka w górę)
6. Naciśnij: Enter

**Oczekiwane rezultaty:**
- ✅ Pierwsza sugestia podświetla się na niebiesko (↓)
- ✅ Druga sugestia podświetla się (↓↓)
- ✅ Powrót do pierwszej (↑)
- ✅ Enter wybiera podświetloną część
- ✅ **Automatyczne scrollowanie** do części w tabeli/grid
- ✅ **Animacja highlight** - niebieska ramka (ring-4 ring-blue-500) przez 2 sekundy
- ✅ Smooth scroll z wyśrodkowaniem elementu

### Test 1.6: Wybór myszką
**Kroki:**
1. Wpisz: "termostat"
2. Kliknij myszką na sugestię "Termostat lodówki"

**Oczekiwane rezultaty:**
- ✅ Automatyczne scrollowanie do części
- ✅ Animacja highlight przez 2 sekundy
- ✅ Dropdown zamyka się po wyborze

### Test 1.7: Escape key
**Kroki:**
1. Wpisz cokolwiek aby otworzyć dropdown
2. Naciśnij: Escape

**Oczekiwane rezultaty:**
- ✅ Dropdown zamyka się
- ✅ Tekst w polu pozostaje

### Test 1.8: Clear button
**Kroki:**
1. Wpisz: "cokolwiek"
2. Kliknij: ✕ (przycisk X)

**Oczekiwane rezultaty:**
- ✅ Pole wyszukiwania czyści się
- ✅ Dropdown znika
- ✅ Focus pozostaje w polu

### Test 1.9: Brak wyników
**Kroki:**
1. Wpisz: "xyz123nonexistent"

**Oczekiwane rezultaty:**
- ✅ Dropdown pokazuje komunikat:
  ```
  🔍 Brak wyników
  Nie znaleziono części pasujących do zapytania
  ```
- ✅ Przyjazny UI (nie pusty dropdown)

### Test 1.10: Debounce (optymalizacja)
**Kroki:**
1. Wpisz bardzo szybko: "abcdefghijk"
2. Obserwuj Console (F12 → Console)

**Oczekiwane rezultaty:**
- ✅ Wyszukiwanie NIE uruchamia się po każdej literze
- ✅ Czeka 300ms od ostatniego znaku
- ✅ Brak lagów podczas szybkiego pisania

---

## 🔄 TEST #2: VIEWER 360°

### Lokalizacja
**URL:** http://localhost:3000/admin/magazyn/czesci  
**Element:** PhotoGallery modal (po kliknięciu na zdjęcie części)

### Przygotowanie
**WAŻNE:** Obecnie **żadna część NIE MA** modelu 360°!  
Dane pokazują: `"model3D": null` dla wszystkich części.

**Aby przetestować tę funkcję, musisz:**

#### Opcja A: Dodać model 360° do istniejącej części
1. Skopiuj folder z sekwencją zdjęć 360° (16-32 plików) do `/public/uploads/360/`
2. Edytuj `data/parts-inventory.json` dla wybranej części:
```json
{
  "id": "PART001",
  "name": "Łożysko bębna Samsung",
  ...
  "model3D": {
    "type": "360-sequence",
    "frames": [
      "/uploads/360/frame-001.jpg",
      "/uploads/360/frame-002.jpg",
      "/uploads/360/frame-003.jpg",
      // ... 16-32 frames
    ],
    "frameCount": 16,
    "createdAt": "2025-10-04T10:00:00Z"
  }
}
```

#### Opcja B: Stworzyć testową sekwencję
Jeśli nie masz zdjęć 360°, mogę stworzyć mock images:
```bash
# W PowerShell
mkdir -Force public\uploads\360
```

### Test 2.1: Weryfikacja integracji (bez model3D)
**Kroki:**
1. Kliknij na dowolne zdjęcie części (np. PART003 - Pasek napędowy ma 4 zdjęcia)
2. Otwiera się PhotoGallery modal
3. Sprawdź górę modala

**Oczekiwane rezultaty (BEZ model3D):**
- ✅ Tylko jedna zakładka widoczna: "Zdjęcia (4)" lub ile jest zdjęć
- ✅ BRAK zakładki "Widok 360°"
- ✅ Normalna galeria zdjęć z nawigacją ←/→

### Test 2.2: Weryfikacja z model3D (po dodaniu danych)
**Kroki:**
1. Dodaj model3D do części (Opcja A powyżej)
2. Kliknij na zdjęcie tej części

**Oczekiwane rezultaty:**
- ✅ **DWA taby** widoczne:
  - "Zdjęcia (X)" - domyślnie aktywna
  - "Widok 360° 🔄" - z ikoną/badge
- ✅ Możesz przełączać między tabami

### Test 2.3: Ładowanie viewera 360°
**Kroki:**
1. W PhotoGallery kliknij zakładkę "Widok 360° 🔄"

**Oczekiwane rezultaty:**
- ✅ Pokazuje się **progress bar** (0-100%)
- ✅ Text: "Ładowanie klatek... 8/16" (lub ile frames)
- ✅ Po załadowaniu progress znika
- ✅ Widoczny komponent Model360Viewer

### Test 2.4: Interfejs viewera 360°
**Oczekiwane elementy:**
- ✅ **Główny obraz** (pierwsza klatka) w centrum
- ✅ **Badge 360°** w rogu z animacją spin-slow
- ✅ **Kontrolki na dole:**
  - ▶️/⏸️ Play/Pause button (border-gray-300)
  - 🎚️ Speed slider (5-30 FPS)
  - Text pokazujący prędkość: "15 FPS"
  - 🔢 Frame counter: "Frame 1/16"
  - ⛶ Fullscreen button (po prawej)
- ✅ **Overlay instrukcji:** "Przeciągnij, aby obrócić" (na początku, znika po 3s)

### Test 2.5: Rotacja myszką (Drag to Rotate)
**Kroki:**
1. Najedź myszką na obraz
2. Kliknij i przytrzymaj lewy przycisk myszy
3. Przeciągnij w lewo
4. Przeciągnij w prawo

**Oczekiwane rezultaty:**
- ✅ Kursor zmienia się na `cursor: grab` → `cursor: grabbing`
- ✅ Obraz **rotuje się** płynnie podczas przeciągania
- ✅ Przeciągnięcie w lewo → rotacja w lewo (mniejsze frame numbers)
- ✅ Przeciągnięcie w prawo → rotacja w prawo (większe frame numbers)
- ✅ Frame counter aktualizuje się: "Frame 5/16", "Frame 10/16" etc.
- ✅ Smooth transition między klatkami

### Test 2.6: Auto-play
**Kroki:**
1. Kliknij ▶️ Play button

**Oczekiwane rezultaty:**
- ✅ Ikona zmienia się na ⏸️ (Pause)
- ✅ Obraz automatycznie rotuje z ustawioną prędkością (domyślnie 15 FPS)
- ✅ Frame counter cyklicznie przechodzi 1→2→3→...→16→1→2...
- ✅ Płynna animacja rotacji
- ✅ Można nadal ręcznie rotować podczas play (pauza auto-play)

### Test 2.7: Pause
**Kroki:**
1. Podczas auto-play kliknij ⏸️ Pause

**Oczekiwane rezultaty:**
- ✅ Animacja zatrzymuje się
- ✅ Ikona zmienia się z powrotem na ▶️
- ✅ Frame pozostaje na aktualnym

### Test 2.8: Speed Control
**Kroki:**
1. Kliknij Play
2. Przesuń slider prędkości w lewo (wolniej)
3. Przesuń slider w prawo (szybciej)

**Oczekiwane rezultaty:**
- ✅ Slider działa płynnie (min: 5 FPS, max: 30 FPS)
- ✅ Text aktualizuje się: "5 FPS", "10 FPS", "20 FPS", "30 FPS"
- ✅ Rotacja rzeczywiście zwalnia/przyspiesza
- ✅ Przy 5 FPS - widać powolną, płynną rotację
- ✅ Przy 30 FPS - szybka rotacja (2x szybciej niż domyślne 15)

### Test 2.9: Fullscreen Mode
**Kroki:**
1. Kliknij ⛶ Fullscreen button (prawy dolny róg)

**Oczekiwane rezultaty:**
- ✅ Viewer rozszerza się na **cały ekran** (native fullscreen API)
- ✅ Ciemne tło (bg-black)
- ✅ Obraz większy, lepiej widoczny
- ✅ Kontrolki nadal dostępne (bottom bar)
- ✅ Dodatkowy **✕ Close button** w prawym górnym rogu
- ✅ **Escape key** również zamyka fullscreen

### Test 2.10: Wyjście z Fullscreen
**Kroki:**
1. W fullscreen naciśnij Escape
2. LUB kliknij ✕ Close button

**Oczekiwane rezultaty:**
- ✅ Powrót do normalnego widoku w PhotoGallery
- ✅ Stan viewera zachowany (frame, speed, play/pause)

### Test 2.11: Powrót do zakładki Zdjęcia
**Kroki:**
1. W trybie 360° kliknij zakładkę "Zdjęcia"

**Oczekiwane rezultaty:**
- ✅ Viewer 360° ukrywa się
- ✅ Normalna galeria zdjęć powraca
- ✅ Nawigacja ←/→ działa
- ✅ Zoom działa (kółko myszy)
- ✅ Thumbnails widoczne na dole

### Test 2.12: Przełączanie między tabami
**Kroki:**
1. Zdjęcia → 360° → Zdjęcia → 360°

**Oczekiwane rezultaty:**
- ✅ Płynne przełączanie bez błędów
- ✅ Stan 360° jest zachowany (frame, speed)
- ✅ Stan galerii zachowany (aktywne zdjęcie, zoom)
- ✅ Brak memory leaks

### Test 2.13: Error Handling (błędny URL klatki)
**Kroki:**
1. Edytuj `model3D.frames` aby zawierał nieistniejący URL:
```json
"frames": [
  "/uploads/360/NONEXISTENT.jpg",
  ...
]
```
2. Otwórz viewer 360°

**Oczekiwane rezultaty:**
- ✅ Pokazuje komunikat błędu:
  ```
  ⚠️ Błąd ładowania modelu 360°
  Nie udało się załadować wszystkich klatek
  ```
- ✅ Nie crashuje aplikacji
- ✅ Można wrócić do zakładki "Zdjęcia"

### Test 2.14: Walidacja minimum klatek
**Oczekiwane rezultaty (w kodzie):**
- ✅ Minimum 8 klatek wymagane
- ✅ Jeśli < 8 → pokazuje komunikat: "Sekwencja 360° wymaga minimum 8 klatek"

---

## 📸 TEST #3: OCR SCANNER (GPT-4o Mini Vision)

### Lokalizacja
**URL:** http://localhost:3000/admin/magazyn/czesci  
**Element:** Przycisk "📸 Skanuj tabliczkę" na górze strony

### Przygotowanie
**WYMAGANE:**
- ✅ Klucz OpenAI API zainstalowany (już działający w panelu pracownika)
- ✅ Aparat/kamera (telefon) LUB zdjęcia tabliczek znamionowych do uploadu
- ✅ Serwer dev uruchomiony (`npm run dev`)

### Przed testami: Weryfikacja przycisku
**Kroki:**
1. Otwórz: http://localhost:3000/admin/magazyn/czesci
2. Znajdź przycisk **"📸 Skanuj tabliczkę"** (obok wyszukiwania)

**Jeśli przycisku NIE MA:**
- Sprawdź Console (F12) - czy są błędy kompilacji?
- Zrób hard refresh: **Ctrl + Shift + R**
- Sprawdź czy `PartNameplateScanner` jest zaimportowany w `czesci.js`

### Test 3.1: Otwarcie skanera
**Kroki:**
1. Kliknij "📸 Skanuj tabliczkę"

**Oczekiwane rezultaty:**
- ✅ Otwiera się **modal fullscreen**
- ✅ Tytuł: "🔍 Skaner Tabliczek Znamionowych"
- ✅ Podtytuł: "Rozpoznaj numery części z tabliczki sprzętu AGD używając AI"
- ✅ Widoczne **2 opcje**:
  - "📷 Użyj kamery" (niebieski button)
  - "🖼️ Wybierz z galerii" (zielony button)
- ✅ Przycisk ✕ zamknięcia (prawy górny róg)

### Test 3.2: Zamknięcie modala
**Kroki:**
1. Kliknij ✕
2. LUB naciśnij Escape

**Oczekiwane rezultaty:**
- ✅ Modal zamyka się
- ✅ Powrót do magazynu części

### Test 3.3: Wybór z galerii (Upload)
**Kroki:**
1. Kliknij "🖼️ Wybierz z galerii"
2. Wybierz zdjęcie tabliczki znamionowej (JPG/PNG)

**Przygotuj testowe zdjęcie:**
- Samsung, LG, Bosch, Whirlpool tabliczka
- Z widocznym numerem części (np. DC97-16151A)
- Jasne, nierozmazane zdjęcie

**Oczekiwane rezultaty po wyborze:**
- ✅ Zdjęcie uploaduje się
- ✅ Pokazuje się **preview zdjęcia** (max-h-64)
- ✅ Przycisk "🔍 Analizuj zdjęcie" pojawia się
- ✅ Możliwość zmiany zdjęcia ("🖼️ Zmień zdjęcie")

### Test 3.4: Analiza zdjęcia (GPT-4o Mini)
**Kroki:**
1. Po uploadzif zdjęcia kliknij "🔍 Analizuj zdjęcie"

**Oczekiwane rezultaty - Etap 1 (Loading):**
- ✅ Button zmienia się na disabled
- ✅ Pokazuje spinner ⏳
- ✅ Text: "Analizowanie..." lub "Wysyłanie do AI..."

**Oczekiwane rezultaty - Etap 2 (Odpowiedź AI):**
- ✅ Czas odpowiedzi: ~3-8 sekund
- ✅ Loading znika
- ✅ Pokazuje się sekcja **"Wykryte numery części"**

### Test 3.5: Wyniki skanowania - Części znalezione w bazie
**Przykład:** Tabliczka Samsung z numerem DC97-16151A

**Oczekiwane rezultaty:**
- ✅ Sekcja: **"✅ Znalezione w magazynie (1)"**
- ✅ Karta części:
  ```
  [Miniaturka 80x80px]
  
  Łożysko bębna Samsung
  DC97-16151A
  
  85,00 PLN
  W magazynie: 10 szt
  
  Kategoria: AGD > Pralka
  
  Confidence: ⭐⭐⭐ Wysokie (95%)
  
  [📋 Pokaż szczegóły] [➕ Dodaj do zlecenia]
  ```
- ✅ Confidence scoring:
  - **Wysokie (>80%)** - 3 gwiazdki ⭐⭐⭐ (zielony)
  - **Średnie (50-80%)** - 2 gwiazdki ⭐⭐ (żółty)
  - **Niskie (<50%)** - 1 gwiazdka ⭐ (czerwony)

### Test 3.6: Multiple matches (wiele części wykrytych)
**Przykład:** Tabliczka z kilkoma numerami części

**Oczekiwane rezultaty:**
- ✅ Sekcja: **"✅ Znalezione w magazynie (3)"**
- ✅ Lista 3 kart części (każda z innym numerem)
- ✅ Sortowanie: od najwyższego do najniższego confidence
- ✅ Scroll jeśli więcej niż 3 części

### Test 3.7: Części NIE znalezione w bazie
**Przykład:** Tabliczka z numerem BSH9999999 (nieistniejący)

**Oczekiwane rezultaty:**
- ✅ Sekcja: **"⚠️ Nie znaleziono w magazynie (1)"**
- ✅ Karta z wykrytym numerem:
  ```
  ❓ Numer części nieznany
  
  Wykryty numer: BSH9999999
  Źródło: Part Number (P/N)
  Confidence: Średnie
  
  Marka: Bosch (wykryta z tabliczki)
  Model: WMZ20490 (wykryty z tabliczki)
  
  [🔍 Wyszukaj online] [➕ Dodaj jako nową część]
  ```
- ✅ Sugestia dodania nowej części do bazy

### Test 3.8: Wykrycie marki i modelu
**Oczekiwane rezultaty:**
- ✅ Sekcja na górze wyników: **"📋 Informacje z tabliczki"**
- ✅ Dane wykryte przez AI:
  ```
  Marka: Samsung
  Model: WW90T4540AE
  E-Nr: WW90T4540AE/LE
  Type: WW90T4540AE
  ```
- ✅ Wszystkie dostępne dane z tabliczki

### Test 3.9: Raw text extraction
**Oczekiwane rezultaty:**
- ✅ Sekcja na dole: **"📝 Cały tekst z tabliczki"** (collapsible)
- ✅ Kliknięcie rozwija/zwija
- ✅ Pokazuje surowy tekst OCR:
  ```
  SAMSUNG
  WW90T4540AE/LE
  E-Nr: WW90T4540AE
  Type: AddWash
  P/N: DC97-16151A
  S/N: 12345ABCDE67890
  220-240V ~ 50Hz
  Max 2100W
  ...
  ```

### Test 3.10: Akcje na znalezionej części
**Kroki:**
1. Po znalezieniu części kliknij "📋 Pokaż szczegóły"

**Oczekiwane rezultaty:**
- ✅ **Automatyczne scrollowanie** do części w tabeli
- ✅ Animacja highlight (niebieska ramka) przez 2s
- ✅ Scanner modal zamyka się
- ✅ Część jest wyświetlona i podświetlona

### Test 3.11: Dodawanie do zlecenia
**Kroki:**
1. Kliknij "➕ Dodaj do zlecenia"

**Oczekiwane rezultaty:**
- ✅ Otwiera się modal tworzenia nowego zlecenia
- ✅ Część jest automatycznie dodana
- ✅ LUB (jeśli jest otwarte zlecenie) - część dodaje się do koszyka
- ✅ Toast notification: "✅ Dodano część do zlecenia"

### Test 3.12: Użycie kamery (mobile/laptop z kamerą)
**Kroki:**
1. W scannerze kliknij "📷 Użyj kamery"

**Oczekiwane rezultaty:**
- ✅ Przeglądarka prosi o **pozwolenie na kamerę**
- ✅ Po zaakceptowaniu pokazuje się **live preview** z kamery
- ✅ **Ramka celownicza** (overlay) pomaga w kadrowaniu
- ✅ Tekst: "Wykadruj tabliczkę w ramce"
- ✅ Przycisk "📸 Zrób zdjęcie" aktywny

### Test 3.13: Robienie zdjęcia kamerą
**Kroki:**
1. Wykadruj tabliczkę w ramce
2. Kliknij "📸 Zrób zdjęcie"

**Oczekiwane rezultaty:**
- ✅ **Dźwięk migawki** (opcjonalnie)
- ✅ Zdjęcie zatrzymuje się (freeze frame)
- ✅ Pokazują się opcje:
  - "✅ Użyj tego zdjęcia"
  - "🔄 Zrób ponownie"
- ✅ Preview zdjęcia widoczny

### Test 3.14: Akceptacja/odrzucenie zdjęcia
**Kroki:**
1. Kliknij "✅ Użyj tego zdjęcia"

**Oczekiwane rezultaty:**
- ✅ Automatycznie rozpoczyna analizę AI
- ✅ Przejście do ekranu loading + wyniki
- ✅ Działanie jak w Test 3.4

**LUB:**
1. Kliknij "🔄 Zrób ponownie"

**Oczekiwane rezultaty:**
- ✅ Powrót do live preview kamery
- ✅ Możliwość zrobienia nowego zdjęcia

### Test 3.15: Error handling - brak kamery
**Scenariusz:** Desktop bez kamery

**Oczekiwane rezultaty:**
- ✅ Komunikat: "❌ Brak dostępu do kamery"
- ✅ Sugestia: "Użyj opcji 'Wybierz z galerii' lub udziel dostępu do kamery"
- ✅ Automatyczne przełączenie na opcję galerii

### Test 3.16: Error handling - AI error
**Scenariusz:** Brak klucza API / problem z OpenAI

**Oczekiwane rezultaty:**
- ✅ Komunikat błędu:
  ```
  ⚠️ Błąd analizy
  Nie udało się przetworzyć zdjęcia.
  Sprawdź połączenie internetowe i spróbuj ponownie.
  ```
- ✅ Przycisk "🔄 Spróbuj ponownie"
- ✅ Możliwość zmiany zdjęcia

### Test 3.17: Smart parsing - różne formaty numerów
**Testuj z różnymi tabliczkami:**

**Format 1: Standard**
```
Part Number: DC97-16151A
```
**Oczekiwane:** ✅ Wykrywa "DC97-16151A", źródło: "Part Number"

**Format 2: E-Nr**
```
E-Nr.: WW90T4540AE/LE
```
**Oczekiwane:** ✅ Wykrywa "WW90T4540AE", źródło: "E-Nr"

**Format 3: Type**
```
Type: WM60-145
```
**Oczekiwane:** ✅ Wykrywa "WM60-145", źródło: "Type"

**Format 4: Mixed (wiele na jednej tabliczce)**
```
Samsung
Type: AddWash
E-Nr: WW90T4540AE
P/N: DC97-16151A
S/N: 12345ABC
```
**Oczekiwane:** 
- ✅ Wykrywa WSZYSTKIE numery
- ✅ Każdy z prawidłowym źródłem
- ✅ Lista confidence scores

### Test 3.18: Specific brands parsing
**AMICA format:**
```
Model: AWK811L
Typ: 800005
```
**Oczekiwane:** ✅ `smartParseModelAndType` łączy w "AWK811L-800005"

**WHIRLPOOL format:**
```
Model: FSCR12441
Type: 859991584990
```
**Oczekiwane:** ✅ Parsuje oba jako osobne numery części

**CANDY/HOOVER format:**
```
Model: CO 1482D3/1-S
Cod: 31009248
```
**Oczekiwane:** ✅ Wykrywa "31009248" jako główny numer

### Test 3.19: Poor quality photo handling
**Scenariusz:** Rozmazane/ciemne/kąt zdjęcie

**Oczekiwane rezultaty:**
- ✅ AI próbuje odczytać (GPT-4o Vision jest dość dobry)
- ✅ Niższe confidence scores
- ✅ Może wykryć częściowo: "DC97-1615?" (niepełny numer)
- ✅ Komunikat: "⚠️ Zdjęcie może być niewyraźne - rozważ lepsze oświetlenie"

### Test 3.20: Performance - multiple scans
**Kroki:**
1. Skanuj tabliczkę #1
2. Przycisk "🔄 Skanuj kolejną"
3. Skanuj tabliczkę #2
4. Powtórz 3-5 razy

**Oczekiwane rezultaty:**
- ✅ Każde skanowanie działa płynnie
- ✅ Brak memory leaks
- ✅ Historia skanowań (opcjonalnie)
- ✅ Czas odpowiedzi stabilny (~3-8s każde)

---

## 📊 CHECKLIST FINALNY

### Smart Search ✅
- [ ] Podstawowe wyszukiwanie działa
- [ ] Fuzzy search toleruje literówki
- [ ] Wyszukiwanie po numerze części działa
- [ ] Wyszukiwanie po marce działa
- [ ] Nawigacja klawiaturą (↑↓ Enter Escape)
- [ ] Wybór myszką działa
- [ ] Automatyczne scrollowanie + animacja highlight
- [ ] Clear button (✕) działa
- [ ] Brak wyników - przyjazny komunikat
- [ ] Debounce 300ms - brak lagów

### Viewer 360° ✅
- [ ] Weryfikacja integracji (tabs pokazują się)
- [ ] Ładowanie progress bar
- [ ] Interfejs viewera kompletny
- [ ] Rotacja myszką (drag to rotate)
- [ ] Auto-play działa
- [ ] Pause działa
- [ ] Speed control (5-30 FPS)
- [ ] Fullscreen mode działa
- [ ] Escape/Close zamyka fullscreen
- [ ] Przełączanie między Zdjęcia ↔ 360°
- [ ] Error handling dla błędnych URL

### OCR Scanner ✅
- [ ] Przycisk "Skanuj tabliczkę" widoczny
- [ ] Modal otwiera/zamyka się
- [ ] Upload z galerii działa
- [ ] Analiza AI działa (3-8s)
- [ ] Części znalezione wyświetlają się prawidłowo
- [ ] Części NIE znalezione - komunikat
- [ ] Multiple matches sortowane po confidence
- [ ] Marka i model wykrywane
- [ ] Raw text extraction
- [ ] Akcja "Pokaż szczegóły" - scrollowanie
- [ ] Akcja "Dodaj do zlecenia"
- [ ] Kamera działa (mobile/laptop)
- [ ] Robienie zdjęcia kamerą
- [ ] Error handling (brak kamery, AI error)
- [ ] Smart parsing - różne formaty
- [ ] Specific brands (AMICA, WHIRLPOOL, CANDY)
- [ ] Słabe zdjęcie - AI próbuje odczytać
- [ ] Multiple scans - brak lagów

---

## 🎯 NASTĘPNE KROKI

### Po ukończeniu testów:
1. **Utwórz listę bugów** (jeśli jakieś znajdziesz)
2. **Screenshot'y działających funkcji** (opcjonalnie)
3. **Raport z testów:**
   - Co działa ✅
   - Co nie działa ❌
   - Co wymaga poprawy ⚠️

### Jeśli wszystko działa:
- ✅ **Funkcje gotowe do produkcji**
- 📝 **Dokumentacja kompletna** (RAPORT_ZAAWANSOWANE_FUNKCJE.md)
- 🚀 **Możemy przejść do kolejnych features** (Dashboard, System zamówień)

### Jeśli znajdziesz bugi:
- 🐛 **Zgłoś konkretny błąd** z opisem jak go odtworzyć
- 💡 **Naprawię natychmiast** - wszystkie komponenty są gotowe

---

## 📞 WSPARCIE

Jeśli masz pytania podczas testowania:
- "Jak dokładnie przetestować X?"
- "Czy to jest poprawne zachowanie?"
- "Znalazłem błąd: [opis]"

**Powiedz mi i pomogę!** 🚀
