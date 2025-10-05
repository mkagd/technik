# 🧪 Instrukcja Testowania Model AI Scanner

## 📋 Spis Treści
1. [Przygotowanie do testów](#przygotowanie)
2. [Lokalizacje do testowania](#lokalizacje)
3. [Scenariusze testowe](#scenariusze)
4. [Przykładowe tabliczki AMICA](#tabliczki-amica)
5. [Rozwiązywanie problemów](#problemy)

---

## 🔧 Przygotowanie do testów

### 1. Upewnij się że serwer działa
```bash
npm run dev
```
Aplikacja powinna być dostępna na: **http://localhost:3000**

### 2. Wymagania
- ✅ OpenAI API Key w `.env.local`
- ✅ Klucz musi mieć dostęp do GPT-4o Mini Vision
- ✅ Przeglądarka z obsługą kamery (Chrome/Edge zalecane)
- ✅ Zdjęcia tabliczek znamionowych AGD (lub fizyczne urządzenia)

### 3. Sprawdź konfigurację
```env
OPENAI_API_KEY=sk-proj-...
```

---

## 📍 Lokalizacje do testowania

### **1. Panel Admin - Szczegóły Zamówienia**
**URL:** `http://localhost:3000/zlecenie-szczegoly`

**Jak testować:**
1. Zaloguj się jako admin
2. Wejdź w szczegóły dowolnego zamówienia
3. W sekcji "Akcje" kliknij **"🤖 Skanuj AI (AMICA Detection)"**
4. Zeskanuj tabliczkę
5. Sprawdź czy dane wypełniły się w zamówieniu

**Co powinno się stać:**
- ✅ Modal skanera się otwiera
- ✅ Możesz wybrać: kamera / upload pliku
- ✅ Po skanowaniu pojawia się alert z rozpoznanymi danymi
- ✅ Dane zapisują się do zamówienia

---

### **2. Formularz Rezerwacji Klienta**
**URL:** `http://localhost:3000/rezerwacja-nowa`

**Jak testować:**
1. Otwórz formularz nowej rezerwacji
2. Przejdź do Kroku 1 (wybór urządzeń)
3. Wybierz typ urządzenia (np. "Pralka")
4. Przewiń do sekcji z marką i modelem
5. Kliknij **"🤖 Zeskanuj tabliczkę AI"**
6. Zeskanuj tabliczkę
7. Sprawdź czy marka i model się wypełniły

**Co powinno się stać:**
- ✅ Przycisk skanera pojawia się dla każdego urządzenia
- ✅ Po skanowaniu wypełnia się **tylko to konkretne urządzenie**
- ✅ Jeśli dodasz 3 urządzenia, każde ma swój przycisk
- ✅ Alert pokazuje: markę, model, typ

---

### **3. Dodawanie Klienta z Mapy**
**URL:** `http://localhost:3000/mapa`

**Jak testować:**
1. Otwórz mapę klientów
2. Kliknij "➕ Dodaj klienta"
3. Wypełnij podstawowe dane (imię, telefon, adres)
4. W sekcji "Urządzenie/Sprzęt" kliknij **"🤖 Zeskanuj tabliczkę AI"**
5. Zeskanuj tabliczkę
6. Sprawdź pole "Urządzenie/Sprzęt"

**Co powinno się stać:**
- ✅ Po skanowaniu pole wypełnia się: "Samsung WW80T4020EE (Pralka)"
- ✅ Format: `{marka} {model} ({typ})`
- ✅ Można edytować po wypełnieniu

---

### **4. Panel Serwisanta - Szczegóły Wizyty**
**URL:** `http://localhost:3000/technician/visit/{visitId}`

**Jak testować:**
1. Zaloguj się jako serwisant
2. Wejdź w szczegóły wizyty
3. W sekcji "Urządzenie" kliknij **"🤖 Zeskanuj tabliczkę AI"**
4. Zeskanuj tabliczkę
5. Sprawdź czy dane się zapisały (odświeżenie strony)

**Co powinno się stać:**
- ✅ Dane zapisują się przez API do bazy
- ✅ Alert z rozpoznanymi danymi
- ✅ Strona odświeża dane wizyty automatycznie
- ✅ Typ, marka, model, serial number aktualizują się

---

## 🧪 Scenariusze testowe

### **Scenariusz 1: AMICA Płyta indukcyjna**
**Tabliczka:** `TYPE: PIC5512B3` + słowo "indukcyjna"

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
AMICA PIC5512B3
Typ: Płyta indukcyjna
```

**Logika:** Scanner wykrywa prefix `PI...` LUB słowo "indukcyj" → automatycznie przypisuje typ "Płyta indukcyjna"

---

### **Scenariusz 2: AMICA Piekarnik**
**Tabliczka:** `MODEL: EB81005A` + słowo "oven" lub "piekarnik"

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
AMICA EB81005A
Typ: Piekarnik
```

**Logika:** Scanner wykrywa słowo "piekarnik" lub "oven" → typ "Piekarnik"

---

### **Scenariusz 3: AMICA Płyta ceramiczna**
**Tabliczka:** `TYPE: PC6140W` + słowo "ceramiczna"

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
AMICA PC6140W
Typ: Płyta ceramiczna
```

**Logika:** Prefix `PC...` LUB "ceramiczn" → "Płyta ceramiczna"

---

### **Scenariusz 4: AMICA Kuchenka**
**Tabliczka:** Słowo "kuchenka" + model

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
AMICA [model]
Typ: Kuchenka
```

**Logika:** Słowo "kuchenka" → typ "Kuchenka"

---

### **Scenariusz 5: AMICA Okap**
**Tabliczka:** Prefix `OKA` lub `OKC` + model

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
AMICA OKA[...]
Typ: Okap kuchenny
```

**Logika:** Prefix `OKA/OKC` lub słowo "okap" → "Okap kuchenny"

---

### **Scenariusz 6: Samsung Pralka**
**Tabliczka:** Standard bez AMICA

**Oczekiwany rezultat:**
```
✅ Rozpoznano:
Samsung WW80T4020EE
Typ: Washing Machine (lub z GPT)
```

**Logika:** Normalna detekcja GPT-4o Vision bez specjalnej logiki AMICA

---

### **Scenariusz 7: Błąd - Brak tabliczki**
**Akcja:** Zeskanuj puste zdjęcie lub słaby obraz

**Oczekiwany rezultat:**
```
❌ Nie wykryto modelu na tabliczce
```

---

### **Scenariusz 8: Upload pliku vs. Kamera**
**Akcja:** 
1. Test z uploadem pliku
2. Test z aparatem (jeśli dostępny)

**Oczekiwany rezultat:**
- ✅ Oba tryby działają
- ✅ Po wybraniu trybu można wrócić przyciskiem "Wróć"
- ✅ Preview zdjęcia przed analizą

---

## 📸 Przykładowe tabliczki AMICA

### **Płyta indukcyjna PIC5512B3**
```
AMICA
TYPE: PIC5512B3
Płyta indukcyjna
230V 50Hz 7200W
S/N: 12345678
```
→ Wykrywa: `PI...` prefix → **Płyta indukcyjna**

---

### **Piekarnik EB81005A**
```
AMICA
MODEL: EB81005A
Piekarnik elektryczny / Electric oven
230V 50Hz 2800W
S/N: 87654321
```
→ Wykrywa: "piekarnik" lub "oven" → **Piekarnik**

---

### **Płyta ceramiczna PC6140W**
```
AMICA
TYPE: PC6140W
Płyta ceramiczna
230V 50Hz 6000W
Made in EU
```
→ Wykrywa: `PC...` prefix → **Płyta ceramiczna**

---

### **Kuchenka**
```
AMICA
Kuchenka elektryczna
MODEL: KE1234
230V 50Hz
```
→ Wykrywa: "kuchenka" → **Kuchenka**

---

### **Okap kuchenny OKA900**
```
AMICA
TYPE: OKA900
Okap kuchenny
230V 50Hz 150W
```
→ Wykrywa: `OKA` prefix → **Okap kuchenny**

---

## 🔍 Jak działa detekcja AMICA?

Kod w `ModelAIScanner.js` (linie 556-570):

```javascript
// AMICA special detection
if (detectedBrand?.toUpperCase() === 'AMICA') {
  const modelUpper = detectedModel?.toUpperCase() || '';
  const typeUpper = detectedType?.toUpperCase() || '';
  
  // Płyta indukcyjna
  if (modelUpper.startsWith('PI') || typeUpper.includes('INDUKCYJ')) {
    finalType = 'Płyta indukcyjna';
  }
  // Płyta ceramiczna
  else if (modelUpper.startsWith('PC') || typeUpper.includes('CERAMICZN')) {
    finalType = 'Płyta ceramiczna';
  }
  // Płyta gazowa
  else if (modelUpper.startsWith('PG') || typeUpper.includes('GAZOW')) {
    finalType = 'Płyta gazowa';
  }
  // Piekarnik
  else if (typeUpper.includes('PIEKARNIK') || typeUpper.includes('OVEN')) {
    finalType = 'Piekarnik';
  }
  // Kuchenka
  else if (typeUpper.includes('KUCHENKA')) {
    finalType = 'Kuchenka';
  }
  // Okap
  else if (modelUpper.startsWith('OKA') || modelUpper.startsWith('OKC') || typeUpper.includes('OKAP')) {
    finalType = 'Okap kuchenny';
  }
}
```

---

## ⚠️ Rozwiązywanie problemów

### **Problem 1: Modal się nie otwiera**
**Przyczyna:** Brak importu lub błąd w state

**Rozwiązanie:**
1. Sprawdź console (F12) czy są błędy JavaScript
2. Upewnij się że `ModelAIScanner` jest zaimportowany
3. Sprawdź czy state `showAIScanner` istnieje

---

### **Problem 2: Błąd OpenAI API**
**Komunikat:** `"OpenAI API error"` lub `"Invalid API key"`

**Rozwiązanie:**
1. Sprawdź plik `.env.local`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   ```
2. Zrestartuj serwer: `npm run dev`
3. Sprawdź czy klucz ma dostęp do GPT-4o Mini
4. Sprawdź console przeglądarki i terminal

---

### **Problem 3: Nie rozpoznaje tabliczki**
**Komunikat:** `"❌ Nie wykryto modelu na tabliczce"`

**Możliwe przyczyny:**
- Zdjęcie niewyraźne / za ciemne
- Tabliczka nieczytelna
- Brak wyraźnych napisów "TYPE", "MODEL", "SERIAL"

**Rozwiązanie:**
1. Zrób lepsze zdjęcie (więcej światła)
2. Zbliż się do tabliczki
3. Upewnij się że tabliczka jest czytelna
4. Spróbuj upload pliku zamiast kamery

---

### **Problem 4: Błąd CORS lub 404**
**Komunikat:** Console pokazuje błędy sieciowe

**Rozwiązanie:**
1. Sprawdź czy endpoint `/api/openai-vision.js` istnieje
2. Sprawdź czy serwer Next.js działa
3. Odśwież stronę (Ctrl+Shift+R)

---

### **Problem 5: Dane się nie zapisują**
**Lokalizacja:** `technician/visit/[visitId].js`

**Rozwiązanie:**
1. Sprawdź czy endpoint API działa: `/api/technician/visits/${visitId}`
2. Sprawdź network tab (F12 → Network)
3. Sprawdź token autoryzacji w localStorage
4. Zobacz logi w terminalu

---

## 📊 Checklist testowania

### **Przed testem:**
- [ ] Serwer uruchomiony (`npm run dev`)
- [ ] OpenAI API key skonfigurowany
- [ ] Przygotowane zdjęcia tabliczek
- [ ] Przeglądarka z obsługą kamery

### **Testy funkcjonalne:**
- [ ] Otwieranie modala skanera
- [ ] Upload pliku działa
- [ ] Kamera działa (jeśli dostępna)
- [ ] Preview zdjęcia
- [ ] Przycisk "Analizuj" aktywny
- [ ] Loader podczas analizy
- [ ] Alert z wynikami
- [ ] Dane wypełniają pola formularza
- [ ] Zamykanie modala

### **Testy AMICA:**
- [ ] Płyta indukcyjna (PI prefix)
- [ ] Płyta ceramiczna (PC prefix)
- [ ] Płyta gazowa (PG prefix)
- [ ] Piekarnik ("oven"/"piekarnik")
- [ ] Kuchenka ("kuchenka")
- [ ] Okap (OKA/OKC prefix)

### **Testy w 4 lokalizacjach:**
- [ ] zlecenie-szczegoly.js
- [ ] rezerwacja-nowa.js
- [ ] mapa.js
- [ ] technician/visit/[visitId].js

### **Testy błędów:**
- [ ] Puste zdjęcie
- [ ] Nieczytelna tabliczka
- [ ] Brak połączenia z API
- [ ] Anulowanie przed analizą

---

## 🎯 Kryteria sukcesu

Scanner działa poprawnie jeśli:

✅ **Modal otwiera się bez błędów**  
✅ **Można wybrać upload lub kamerę**  
✅ **GPT-4o Vision rozpoznaje tabliczki**  
✅ **AMICA detection działa dla 6 typów urządzeń**  
✅ **Dane wypełniają się w polach formularza**  
✅ **Alert pokazuje rozpoznane dane**  
✅ **Brak błędów w console**  
✅ **Działa we wszystkich 4 lokalizacjach**  

---

## 📝 Raportowanie błędów

Jeśli znajdziesz błąd, zapisz:

1. **Lokalizacja:** Która strona/plik?
2. **Akcja:** Co zrobiłeś?
3. **Oczekiwany rezultat:** Co powinno się stać?
4. **Rzeczywisty rezultat:** Co się stało?
5. **Console log:** Błędy z konsoli (F12)
6. **Zdjęcie:** Screenshot problemu
7. **Tabliczka:** Jaką tabliczkę skanowałeś?

---

## 🚀 Następne kroki po testach

Po pomyślnych testach możesz:

1. ✅ Ukryć przycisk w `rezerwacja-nowa.js` (jeśli zbędny)
2. ✅ Dostosować style przycisków
3. ✅ Dodać tooltips z instrukcjami
4. ✅ Rozszerzyć bazę danych modeli AGD
5. ✅ Dodać historię skanowań
6. ✅ Zintegrować z systemem części zamiennych

---

## 🎓 Przykładowy przepływ testu

### **Test kompleksowy - 10 minut:**

1. **Uruchom serwer** (1 min)
2. **Przejdź do rezerwacja-nowa** (1 min)
3. **Dodaj urządzenie** (1 min)
4. **Kliknij scanner button** (0.5 min)
5. **Upload zdjęcia AMICA PIC5512B3** (1 min)
6. **Kliknij "Analizuj"** (0.5 min)
7. **Czekaj na wynik** (~10-20 sek)
8. **Sprawdź alert** (0.5 min)
9. **Sprawdź wypełnione pola** (0.5 min)
10. **Powtórz dla innego typu** (4 min)

**Całkowity czas:** ~10 minut na pełny test

---

## 📞 Pomoc

Jeśli potrzebujesz pomocy:

1. Sprawdź [QUICK_START_MODEL_SCANNER.md](./QUICK_START_MODEL_SCANNER.md)
2. Zobacz [MODEL_AI_SCANNER_INTEGRATION_GUIDE.md](./MODEL_AI_SCANNER_INTEGRATION_GUIDE.md)
3. Przejrzyj kod w `components/ModelAIScanner.js`
4. Sprawdź logi w terminalu (`npm run dev`)
5. Zobacz console przeglądarki (F12)

---

**Powodzenia z testami! 🎉**

System jest gotowy do rozpoznawania tabliczek znamionowych ze specjalną obsługą urządzeń AMICA!
