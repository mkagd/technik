# 🧪 Plan Testów - System Finansowy i Auto-wypełnianie

**Data:** 13 października 2025  
**Tester:** System AI + User  
**URL:** http://localhost:3000  
**Status:** ⏳ DO WYKONANIA

---

## 📋 Przygotowanie testów

### Dane testowe:
- **Wizyta:** VIS251013001
- **Technik:** Mariusz Bielaszka (EMPA252780002)
- **Login:** mariusz.bielaszka@techserwis.pl / haslo123
- **Część testowa:** PART-LOD-001 (Pompa) - 50 zł
- **Część testowa 2:** PART-LOD-002 - 80 zł

---

## 🧪 TEST 1: Liczniki zdjęć completion

### Cel:
Sprawdzić czy PhotoUploader poprawnie aktualizuje liczniki po dodaniu wielu zdjęć

### Kroki:
```
1. Otwórz: http://localhost:3000/technician/visit/VIS251013001
2. Zaloguj jako: mariusz.bielaszka@techserwis.pl / haslo123
3. Kliknij: "Zakończ wizytę"
4. W CompletionWizard → Step 1 (Zdjęcia):
   - Dodaj 2-3 zdjęcia jednocześnie (Ctrl+A w oknie wyboru)
   - Wybierz kategorię: "Tabliczka znamionowa" lub "Completion"
5. Kliknij: "Dalej" → Step 2
```

### ✅ Oczekiwany rezultat:
- **Counter pokazuje:** "Zdjęć completion: 2/2 min" lub "3/2 min"
- **NIE pokazuje:** "Zdjęć completion: 1/2 min" ❌
- **Progress bar:** 100%+ (zielony)
- **Przycisk "Dalej":** Aktywny (niebieski)
- **Console log:** "📸 PhotoUploader: existingPhotos updated, count: 2" lub 3

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 🧪 TEST 2: Auto-obliczanie rozliczenia

### Cel:
Sprawdzić czy auto-kalkulacja sumy i kwoty do zapłaty działa poprawnie

### Kroki:
```
1. Kontynuuj z TEST 1 lub rozpocznij "Zakończ wizytę"
2. Step 1: Dodaj min 2 zdjęcia completion
3. Step 2: Wybierz "Naprawa zakończona"
4. Step 3: Sekcja "💰 Rozliczenie z klientem":
   - Koszt części: 50.00
   - Koszt robocizny: 150.00
   - Zaliczka: 30.00
5. Sprawdź auto-obliczenia w białym boxie
```

### ✅ Oczekiwany rezultat:
```
┌─────────────────────────────┐
│ Części:      50.00 zł       │ ✅
│ Robocizna:  150.00 zł       │ ✅
│ Suma:       200.00 zł       │ ✅ (50+150)
│ - Zaliczka:  30.00 zł       │ ✅
│ ═══════════════════════     │
│ DO ZAPŁATY: 170.00 zł       │ ✅ (200-30)
└─────────────────────────────┘
```

### Przypadki brzegowe:
- **Bez zaliczki (0):** Do zapłaty = 200 zł ✅
- **Zaliczka > Suma:** Do zapłaty = ujemna (np. -30 zł) ✅
- **Tylko części (brak robocizny):** Suma = 50 zł ✅
- **Tylko robocizna (brak części):** Suma = 150 zł ✅

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 🧪 TEST 3: Auto-wypełnianie części - Flow kompletny

### Cel:
Sprawdzić pełen workflow: zamów część → zakończ wizytę → auto-wypełnienie

### Krok A: Zamów część z wizyty
```
1. Otwórz: http://localhost:3000/technician/visit/VIS251013001
2. Kliknij: "Zamów część" (niebieski przycisk obok statusu)
3. ✅ SPRAWDŹ URL: Powinien zawierać ?visitId=VIS251013001
4. Formularz zamów część:
   - Wybierz część: PART-LOD-001 (Pompa - 50 zł)
   - Ilość: 1
   - ☑️ Zaznacz: "Klient opłacił część z góry"
   - Kwota zaliczki: 30.00
   - Pilność: Standard
   - Dostawa: Paczkomat KRA01M
5. Kliknij: "Złóż zamówienie"
6. ✅ SPRAWDŹ: Alert "Zamówienie utworzone pomyślnie"
```

### Krok B: Weryfikacja zapisu
```
1. Otwórz plik: data/part-requests.json
2. Znajdź najnowsze zamówienie (ostatni obiekt)
3. ✅ SPRAWDŹ pola:
   - "visitId": "VIS251013001"
   - "orderNumber": "VIS251013001"
   - "parts": [{ "partId": "PART-LOD-001", "quantity": 1 }]
   - "prepayment": {
       "isPrepaid": true,
       "amount": 30,
       "note": "Klient opłacił część z góry podczas diagnozy"
     }
```

### Krok C: Zakończ wizytę - auto-wypełnienie
```
1. Wróć do wizyty: http://localhost:3000/technician/visit/VIS251013001
2. Kliknij: "Zakończ wizytę"
3. Step 1: Dodaj 2 zdjęcia completion
4. Step 2: Wybierz "Naprawa zakończona"
5. Step 3: Sekcja "💰 Rozliczenie z klientem"
6. ✅ SPRAWDŹ AUTO-WYPEŁNIENIE:
   - Koszt części: 50.00 (auto!) 🎉
   - Zaliczka: 30.00 (auto!) 🎉
7. ✅ SPRAWDŹ Console (F12):
   - "💰 Znaleziono part-requests dla wizyty: 1"
   - "✅ Auto-wypełniono koszt części: 50 zł"
   - "✅ Auto-wypełniono zaliczkę: 30 zł"
8. Wpisz ręcznie: Koszt robocizny: 120.00
9. ✅ SPRAWDŹ auto-obliczenie:
   - Suma: 170.00 zł (50+120)
   - Do zapłaty: 140.00 zł (170-30)
```

### ✅ Oczekiwany rezultat końcowy:
```
💰 Rozliczenie z klientem:
┌─────────────────────────────────┐
│ Koszt części:     50.00 zł      │ ✅ AUTO!
│ Koszt robocizny: 120.00 zł      │ (ręcznie)
│ Zaliczka:         30.00 zł      │ ✅ AUTO!
├─────────────────────────────────┤
│ Części:       50.00 zł          │
│ Robocizna:   120.00 zł          │
│ Suma:        170.00 zł          │
│ - Zaliczka:   30.00 zł          │
│ ═══════════════════════         │
│ DO ZAPŁATY:  140.00 zł          │ ✅
└─────────────────────────────────┘
```

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 🧪 TEST 4: Wiele części - suma kosztów

### Cel:
Sprawdzić czy system sumuje wiele zamówień części

### Kroki:
```
1. Otwórz wizytę: VIS251013001
2. Zamów część 1:
   - PART-LOD-001 (50 zł) × 2 = 100 zł
   - Bez zaliczki
3. Zamów część 2 (z tej samej wizyty!):
   - PART-LOD-002 (80 zł) × 1 = 80 zł
   - Zaliczka: 50 zł
4. Zakończ wizytę → Step 3
5. ✅ SPRAWDŹ:
   - Koszt części: 180.00 zł (100+80) ✅
   - Zaliczka: 50.00 zł ✅
   - Console: "💰 Znaleziono part-requests dla wizyty: 2"
```

### ✅ Oczekiwany rezultat:
- Suma części: 180 zł (2 zamówienia)
- Suma zaliczek: 50 zł (tylko z 2. zamówienia)
- Do zapłaty: 180 + robocizna - 50

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 🧪 TEST 5: Brak części - pola puste

### Cel:
Sprawdzić czy dla wizyty bez zamówień części pola pozostają puste

### Kroki:
```
1. Otwórz nową wizytę (bez zamówień części)
   Alternatywnie: VIS251013002 (jeśli nie ma zamówień)
2. Zakończ wizytę → Step 3
3. ✅ SPRAWDŹ:
   - Koszt części: "" (puste)
   - Zaliczka: "" (puste)
   - Console: Brak logów o part-requests
4. Wpisz ręcznie:
   - Części: 70.00
   - Robocizna: 130.00
   - Zaliczka: 0
5. ✅ SPRAWDŹ:
   - Suma: 200.00 zł
   - Do zapłaty: 200.00 zł
```

### ✅ Oczekiwany rezultat:
- Pola puste domyślnie ✅
- Można ręcznie wpisać (backward compatibility) ✅
- Auto-obliczenia działają z ręcznymi wartościami ✅

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 🧪 TEST 6: Offline mode - queue

### Cel:
Sprawdzić czy completion działa offline i sync po reconnect

### Kroki:
```
1. Otwórz wizytę
2. Zakończ wizytę → Step 3
3. W Dev Tools (F12) → Network → Throttling: Offline
4. Wypełnij formularz:
   - Części: 50.00
   - Robocizna: 150.00
   - Sposób: Gotówka
   - Status: Zapłacono
5. Kliknij: "Zakończ wizytę"
6. ✅ SPRAWDŹ:
   - Alert: "📴 Jesteś offline. Zapisano lokalnie"
   - IndexedDB: pending-completions zawiera dane
7. Przełącz Network → Online
8. Odśwież stronę
9. ✅ SPRAWDŹ:
   - Auto-sync po reconnect
   - Alert: "✅ Wizyta zakończona"
```

### ✅ Oczekiwany rezultat:
- Offline: Dane w IndexedDB ✅
- Online: Auto-sync z alertem ✅
- Visit status: completed ✅

### 📊 Status: ⏳ PENDING

### Notatki:
```
[Tutaj wpisz wyniki testu]
```

---

## 📊 Podsumowanie testów

| Test | Status | Rezultat | Notatki |
|------|--------|----------|---------|
| 1. Liczniki zdjęć | ⏳ | - | - |
| 2. Auto-obliczenia | ⏳ | - | - |
| 3. Auto-wypełnianie części | ⏳ | - | - |
| 4. Wiele części | ⏳ | - | - |
| 5. Brak części | ⏳ | - | - |
| 6. Offline mode | ⏳ | - | - |

### Legenda:
- ⏳ Pending - Do wykonania
- 🔄 In Progress - W trakcie
- ✅ Passed - Zaliczony
- ❌ Failed - Nie zaliczony
- ⚠️ Partial - Częściowo

---

## 🐛 Znalezione bugi

### Bug #1: [Tytuł]
**Opis:**
```
[Opis problemu]
```

**Kroki reprodukcji:**
```
1. ...
2. ...
```

**Oczekiwane:** ...  
**Rzeczywiste:** ...  
**Priorytet:** 🔴 High / 🟡 Medium / 🟢 Low

---

## ✅ Checklisty przed deploy

### Frontend:
- [ ] Wszystkie testy passed
- [ ] Brak błędów w console
- [ ] Responsywność mobile
- [ ] Offline mode działa
- [ ] Auto-obliczenia poprawne

### Backend:
- [ ] API zwraca poprawne dane
- [ ] visitId zapisywane w part-requests
- [ ] Filtrowanie GET działa
- [ ] Ceny części aktualne

### Dokumentacja:
- [x] FINANCIAL_SETTLEMENT_SYSTEM.md
- [x] AUTO_PARTS_COST_INTEGRATION.md
- [x] TEST_PLAN_FINANCIAL_SYSTEM.md

---

**Rozpoczęto:** [Data/Godzina]  
**Zakończono:** [Data/Godzina]  
**Tester:** [Imię]  
**Wersja:** 1.0
