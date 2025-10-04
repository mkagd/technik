# 🧪 TEST OCR SCANNER - Instrukcje Testowania

**Data:** 2025-10-04  
**Status:** ✅ Serwer uruchomiony, kod bez błędów  

---

## 🚀 KROK 1: Otwórz Stronę

```
http://localhost:3000/admin/magazyn/czesci
```

**Co powinieneś zobaczyć:**
- ✅ Smart Search (pole wyszukiwania)
- ✅ **OCR Button** - gradient purple→blue z ikoną kamery i badge "AI"
- ✅ Filtry zaawansowane
- ✅ Tabela/Grid z częściami

---

## 🔍 KROK 2: Sprawdź OCR Button

**Gdzie jest:**
- Obok pola Smart Search (na prawo)
- Gradient: `from-purple-600 to-blue-600`
- Tekst: "Skanuj OCR" (desktop) / "OCR" (mobile)
- Badge: "AI" (biały na przezroczystym tle)

**Kliknij button:**
- Powinien się otworzyć modal z kamerą

---

## 📸 KROK 3: Test Skanowania

### **Opcja A: Użyj kamery**
```
1. Kliknij "Skanuj OCR"
2. Modal się otwiera
3. Kliknij "📷 Użyj kamery"
4. Zezwól na dostęp do kamery
5. Zrób zdjęcie tabliczki znamionowej
```

### **Opcja B: Upload z galerii**
```
1. Kliknij "Skanuj OCR"
2. Modal się otwiera
3. Kliknij "🖼️ Wybierz z galerii"
4. Wybierz zdjęcie tabliczki (AMICA/Samsung/Bosch)
```

---

## ✅ KROK 4: Sprawdź Logi Console (F12)

**Oczekiwane logi:**

```javascript
// 1. Kompresja obrazu
🗜️ Kompresja: 4500KB → 250KB (5%)

// 2. Wywołanie GPT-4o Mini
🤖 GPT-4o Mini - analizuje tabliczkę znamionową...

// 3. Odpowiedź GPT-4o Mini
✅ GPT-4o Mini odpowiedział: Using GPT-4o Mini Vision

// 4. Smart Parsing (dla AMICA/WHIRLPOOL/CANDY/HOOVER)
🧠 Smart parsing: Model="PG6510ZTN", Type="Płyta gazowa"

// Lub dla AMICA:
🔍 AMICA: Znaleziono TYPE/TYP: "PG6510ZTN"
✅ AMICA: Ustawiam MODEL = "PG6510ZTN"
```

---

## 🎯 KROK 5: Sprawdź Wyniki

**Po analizie powinieneś zobaczyć:**

1. **Lista wykrytych części:**
   - Nazwy części
   - Numery części
   - Confidence score (%)
   - Source: "GPT-4o Mini - dokładne dopasowanie"

2. **Animacja scroll:**
   - Automatyczny scroll do wykrytej części
   - Zielony ring wokół części (ring-green-500)
   - Pulsacja (animate-pulse) przez 3 sekundy

3. **Toast notification:**
   - "✅ Znaleziono część: [nazwa] ([numer])"
   - Zielone tło, biały tekst
   - Automatycznie znika po 5 sekundach

---

## ❌ TROUBLESHOOTING

### **Problem: Nie widzę OCR button**

**Rozwiązanie:**
```powershell
# 1. Hard refresh przeglądarki
Ctrl + Shift + R (Chrome/Edge)
Ctrl + F5 (Firefox)

# 2. Wyczyść cache
F12 → Application → Clear storage → Clear site data

# 3. Zrestartuj serwer
taskkill /F /IM node.exe
npm run dev
```

### **Problem: Modal się nie otwiera**

**Sprawdź Console (F12):**
```javascript
// Szukaj błędów typu:
❌ ReferenceError: PartNameplateScanner is not defined
❌ Cannot read properties of undefined
```

**Rozwiązanie:**
```powershell
# Sprawdź import w czesci.js
grep "PartNameplateScanner" pages/admin/magazyn/czesci.js

# Powinno być:
import PartNameplateScanner from '../../../components/PartNameplateScanner';
```

### **Problem: Kamera się nie włącza**

**Sprawdź:**
- ✅ Uprawnienia przeglądarki (Settings → Privacy → Camera)
- ✅ HTTPS lub localhost (kamery wymagają secure context)
- ✅ Console error: "NotAllowedError: Permission denied"

**Rozwiązanie:**
```
1. Kliknij 🔒 ikonę w URL bar
2. Camera → Zezwól
3. Odśwież stronę
```

### **Problem: GPT-4o Mini nie odpowiada**

**Sprawdź Console:**
```javascript
❌ 401 Unauthorized
❌ API key missing or invalid
❌ Network error
```

**Rozwiązanie:**
```powershell
# Sprawdź .env.local
cat .env.local | Select-String "OPENAI_API_KEY"

# Powinno być:
OPENAI_API_KEY=sk-...
```

### **Problem: Smart parsing nie działa dla AMICA**

**Sprawdź logi:**
```javascript
// Powinno być:
🔍 AMICA: Znaleziono TYPE/TYP: "PG6510ZTN"
✅ AMICA: Ustawiam MODEL = "PG6510ZTN"

// Jeśli nie ma:
❌ Brak smart parsingu
```

**Rozwiązanie:**
```powershell
# Sprawdź czy funkcja istnieje
grep "smartParseModelAndType" components/PartNameplateScanner.js

# Powinno zwrócić 4 matches
```

---

## 📊 Checklist Testów

### **✅ Podstawowe Funkcje**
- [ ] OCR button jest widoczny (gradient purple→blue)
- [ ] Modal otwiera się po kliknięciu
- [ ] Kamera działa (live preview)
- [ ] Upload z galerii działa
- [ ] Zdjęcie jest kompresowane (log: 🗜️ Kompresja)

### **✅ GPT-4o Mini**
- [ ] API jest wywoływane (log: 🤖 GPT-4o Mini)
- [ ] Odpowiedź przychodzi (log: ✅ GPT-4o Mini odpowiedział)
- [ ] force_openai_only = true (tylko GPT-4o Mini, bez fallback)
- [ ] JSON jest parsowany poprawnie

### **✅ Smart Parsing**
- [ ] smartParseModelAndType() jest wywoływana
- [ ] AMICA: TYPE/TYP pattern działa
- [ ] Zamiana model/type gdy potrzebna
- [ ] Automatyczne określanie typu (PI/PC/PG/WM)

### **✅ Dopasowanie Części**
- [ ] matchPartsFromDatabase() znajduje części
- [ ] Dokładne dopasowanie (confidence: 0.95)
- [ ] Częściowe dopasowanie (confidence: 0.75)
- [ ] Części nieznane pokazane (isUnknown: true)

### **✅ UI/UX**
- [ ] Scroll do wykrytej części
- [ ] Zielony ring + pulsacja (3 sekundy)
- [ ] Toast notification (5 sekund)
- [ ] Modal zamyka się po kliknięciu X lub Escape

---

## 🎯 Przykładowe Tabliczki do Testów

### **AMICA (Płyta gazowa)**
```
TYPE/TYP: PG6510ZTN
Model: PG6510ZTN (będzie w TYPE field)
Brand: AMICA
```
**Oczekiwany wynik:**
- Model: "PG6510ZTN"
- Type: "Płyta gazowa"
- Log: `🔍 AMICA: Znaleziono TYPE/TYP: "PG6510ZTN"`

### **Samsung (Pralka)**
```
Model: WF80F5E5U4W
Type: Pralka automatyczna
E-Nr: 453210
```
**Oczekiwany wynik:**
- Model: "WF80F5E5U4W"
- Type: "Pralka automatyczna"
- Part Numbers: ["453210", "WF80F5E5U4W"]

### **Bosch (Lodówka)**
```
Model: KGN39VL45
Type: Side-by-Side
P/N: 00647920
```
**Oczekiwany wynik:**
- Model: "KGN39VL45"
- Type: "Side-by-Side"
- Part Numbers: ["00647920", "KGN39VL45"]

---

## 📈 Metryki Sukcesu

### **Performance:**
- ✅ Kompresja: 4-5MB → 150-300KB (~80-90% redukcja)
- ✅ Czas przesyłania: < 2 sekundy
- ✅ Czas odpowiedzi GPT-4o Mini: 2-5 sekund
- ✅ Total time: < 10 sekund (od capture do wyników)

### **Accuracy:**
- ✅ AMICA parsing: 95%+ (TYPE/TYP pattern)
- ✅ Dokładne dopasowanie: 90%+
- ✅ Częściowe dopasowanie: 70%+

### **UX:**
- ✅ Animacje smooth (scroll, ring, pulse)
- ✅ Toast notifications widoczne
- ✅ Modal responsive (mobile/desktop)

---

## 🎉 Podsumowanie

Jeśli wszystkie checklist są ✅ - system działa idealnie! 🚀

**Następne kroki:**
1. Przetestuj z prawdziwymi tabliczkami AMICA
2. Sprawdź różne marki (Samsung, Bosch, LG)
3. Testuj edge cases (słabe oświetlenie, rozmyte zdjęcia)

---

**Pytania?** Sprawdź:
- `PART_SCANNER_REFACTOR_SIMPLE_AI.md` - szczegóły refaktoryzacji
- `RAPORT_ZAAWANSOWANE_FUNKCJE.md` - dokumentacja wszystkich 3 funkcji
