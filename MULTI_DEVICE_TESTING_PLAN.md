# 🧪 Plan Testów - System Wielourządzeniowy

## 📋 Informacje o Teście

**Data utworzenia:** 04.10.2025  
**Status:** ✅ Zamówienie testowe utworzone  
**Środowisko:** localhost:3000

---

## 🎯 Cel Testów

Sprawdzenie czy system wielourządzeniowy działa poprawnie end-to-end:
1. ✅ Panel admina pozwala zarządzać wieloma urządzeniami
2. ✅ Panel technika wyświetla zakładki dla każdego urządzenia
3. ⏳ Skanowanie tabliczek działa niezależnie per urządzenie
4. ⏳ Auto-fill aktualizuje tylko wybrany device
5. ⏳ Dane są prawidłowo zapisywane w structurze deviceModels[]

---

## 📦 Utworzone Zamówienie Testowe

### IDs
```
Order ID:      ORD-1759575823713-342
Order Number:  ORDA-2025-5285
Client ID:     CLI-1759575823713-874
Visit ID:      VIS-1759575823713-398
```

### Klient
```
Imię:          TEST - Jan Testowy
Telefon:       123456789
Email:         test@example.com
Adres:         ul. Testowa 123, 00-001 Warszawa
```

### Urządzenia
```json
{
  "devices": [
    {
      "deviceIndex": 0,
      "deviceType": "Pralka",
      "brand": "Samsung",
      "model": "WW90K6414QW",
      "serialNumber": "SN-TEST-PRALKA-001"
    },
    {
      "deviceIndex": 1,
      "deviceType": "Zmywarka",
      "brand": "Bosch",
      "model": "SMS46GI01E",
      "serialNumber": "SN-TEST-ZMYWARKA-001"
    }
  ]
}
```

### Wizyta
```
Visit ID:      VIS-1759575823713-398
Data:          2025-10-04
Godzina:       10:00
Typ:           diagnosis
Status:        scheduled
Technik:       Technik Testowy (EMP-001)
```

---

## 🔗 Łącza Testowe

### Panel Admina
```
http://localhost:3000/admin/zamowienia/ORD-1759575823713-342
```
**Do sprawdzenia:**
- ✅ Sekcja "Urządzenia (2)" wyświetla się poprawnie
- ✅ Przycisk "+ Dodaj urządzenie" jest widoczny
- ✅ Każde urządzenie ma swoją kartę z danymi
- ✅ Przycisk [X] do usuwania urządzenia działa
- ✅ Edycja pól zapisuje zmiany
- ✅ Licznik urządzeń aktualizuje się

### Panel Technika
```
http://localhost:3000/technician/visit/VIS-1759575823713-398
```
**Do sprawdzenia:**
- ✅ Zakładki urządzeń: "Pralka - Samsung" i "Zmywarka - Bosch"
- ⏳ Kliknięcie zakładki zmienia selectedDeviceIndex
- ⏳ Dane urządzenia (typ, marka, model, S/N) aktualizują się
- ⏳ Przycisk "Zeskanuj tabliczkę znamionową" otwiera modal
- ⏳ Modal pokazuje nazwę aktualnego urządzenia w tytule
- ⏳ Zapisane modele trafiają do deviceModels[deviceIndex]

---

## 📝 Scenariusze Testowe

### ✅ TEST 1: Przeglądanie w Panelu Admina

**Kroki:**
1. Otwórz: `http://localhost:3000/admin/zamowienia/ORD-1759575823713-342`
2. Przewiń do sekcji "Urządzenia"
3. Sprawdź czy widoczne są 2 karty urządzeń

**Oczekiwany rezultat:**
- Nagłówek: "Urządzenia (2)"
- Karta 1: "Urządzenie 1" - Pralka Samsung WW90K6414QW
- Karta 2: "Urządzenie 2" - Zmywarka Bosch SMS46GI01E
- Przycisk "+ Dodaj urządzenie" zielony, w prawym górnym rogu
- Każda karta ma przycisk [X] do usuwania

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 2: Dodanie Trzeciego Urządzenia (Admin)

**Kroki:**
1. W panelu admina kliknij "+ Dodaj urządzenie"
2. Wypełnij pola:
   - Typ: `Lodówka`
   - Marka: `LG`
   - Model: `GBB72MCEFN`
   - S/N: `SN-TEST-LODOWKA-001`
3. Kliknij "Zapisz" (góra strony)
4. Odśwież stronę

**Oczekiwany rezultat:**
- Licznik zmienia się na "Urządzenia (3)"
- Nowa karta "Urządzenie 3" pojawia się na dole
- Dane lodówki są zapisane w `order.devices[2]`

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 3: Usunięcie Urządzenia (Admin)

**Kroki:**
1. Kliknij [X] przy "Urządzenie 3" (Lodówka)
2. Potwierdź usunięcie w oknie dialogowym
3. Kliknij "Zapisz"
4. Odśwież stronę

**Oczekiwany rezultat:**
- Licznik wraca do "Urządzenia (2)"
- Karta lodówki znika
- Pozostają tylko Pralka i Zmywarka
- deviceIndex'y są przenumerowane: 0, 1

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 4: Przełączanie Zakładek Urządzeń (Technik)

**Kroki:**
1. Otwórz: `http://localhost:3000/technician/visit/VIS-1759575823713-398`
2. Sprawdź czy widoczne są 2 zakładki
3. Kliknij zakładkę "Pralka - Samsung"
4. Sprawdź dane urządzenia (Typ, Marka, Model, S/N)
5. Kliknij zakładkę "Zmywarka - Bosch"
6. Sprawdź dane urządzenia

**Oczekiwany rezultat:**
- Zakładka "Pralka - Samsung" jest aktywna (niebieska)
- Dane pokazują: Typ=Pralka, Marka=Samsung, Model=WW90K6414QW
- Po kliknięciu "Zmywarka" - zakładka zmienia kolor
- Dane aktualizują się: Typ=Zmywarka, Marka=Bosch, Model=SMS46GI01E

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 5: Skanowanie Tabliczki - Urządzenie 1 (Pralka)

**Kroki:**
1. W panelu technika kliknij zakładkę "Pralka - Samsung"
2. Kliknij "📸 Zeskanuj tabliczkę znamionową"
3. Sprawdź tytuł modala
4. Dodaj testowy model manualnie:
   - Model Number: `TEST-MODEL-PRALKA-001`
   - Serial Number: `AUTO-FILL-TEST-PRALKA`
   - Brand: `Samsung`
5. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Modal otwiera się
- Tytuł: "Pralka - Samsung" lub podobny (z deviceName)
- Context zawiera `deviceIndex: 0`
- Po zapisaniu pojawia się alert: "Zapisano 1 model dla Pralka"
- Model zapisuje się do `visit.deviceModels[0].models[]`

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 6: Skanowanie Tabliczki - Urządzenie 2 (Zmywarka)

**Kroki:**
1. Przełącz zakładkę na "Zmywarka - Bosch"
2. Kliknij "📸 Zeskanuj tabliczkę znamionową"
3. Sprawdź tytuł modala
4. Dodaj testowy model:
   - Model Number: `TEST-MODEL-ZMYWARKA-001`
   - Serial Number: `AUTO-FILL-TEST-ZMYWARKA`
   - Brand: `Bosch`
5. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Modal otwiera się z nazwą "Zmywarka - Bosch"
- Context zawiera `deviceIndex: 1`
- Po zapisaniu alert: "Zapisano 1 model dla Zmywarka"
- Model zapisuje się do `visit.deviceModels[1].models[]`
- Modele pralki (deviceIndex=0) pozostają nietknięte!

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 7: Weryfikacja Auto-Fill dla Pralki

**Kroki:**
1. W panelu technika, zakładka "Pralka"
2. Sprawdź obecne wartości pól (przed auto-fill):
   - Model: `WW90K6414QW`
   - S/N: `SN-TEST-PRALKA-001`
3. Otwórz modal, dodaj model z nowymi danymi:
   - Model Number: `NEW-MODEL-AUTO-FILL`
   - Serial Number: `NEW-SN-AUTO-FILL-PRALKA`
4. Zapisz
5. Sprawdź czy pola urządzenia się zaktualizowały

**Oczekiwany rezultat:**
- API endpoint `/api/technician/visits/[visitId]` otrzymuje:
  ```json
  {
    "models": [...],
    "deviceIndex": 0
  }
  ```
- Backend aktualizuje `order.devices[0].model` i `order.devices[0].serialNumber`
- Frontend pokazuje zaktualizowane wartości
- `order.devices[1]` (Zmywarka) pozostaje bez zmian!

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 8: Weryfikacja Auto-Fill dla Zmywarki

**Kroki:**
1. Przełącz zakładkę na "Zmywarka"
2. Sprawdź obecne wartości
3. Dodaj model z nowymi danymi:
   - Model Number: `DISHWASHER-NEW-MODEL`
   - Serial Number: `NEW-SN-ZMYWARKA`
4. Zapisz
5. Sprawdź aktualizację pól

**Oczekiwany rezultat:**
- API otrzymuje `deviceIndex: 1`
- Backend aktualizuje tylko `order.devices[1]`
- Pola zmywarki się zmieniają
- Pola pralki (deviceIndex=0) NIE zmieniają się!

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 9: Weryfikacja w Danych JSON

**Kroki:**
1. Otwórz `data/orders.json`
2. Znajdź zamówienie `ORD-1759575823713-342`
3. Sprawdź strukturę `devices[]`
4. Sprawdź strukturę `visits[0].deviceModels[]`

**Oczekiwany rezultat:**
```json
{
  "id": "ORD-1759575823713-342",
  "devices": [
    {
      "deviceIndex": 0,
      "deviceType": "Pralka",
      "model": "NEW-MODEL-AUTO-FILL",
      "serialNumber": "NEW-SN-AUTO-FILL-PRALKA"
    },
    {
      "deviceIndex": 1,
      "deviceType": "Zmywarka",
      "model": "DISHWASHER-NEW-MODEL",
      "serialNumber": "NEW-SN-ZMYWARKA"
    }
  ],
  "visits": [
    {
      "visitId": "VIS-1759575823713-398",
      "deviceModels": [
        {
          "deviceIndex": 0,
          "models": ["TEST-MODEL-PRALKA-001"]
        },
        {
          "deviceIndex": 1,
          "models": ["TEST-MODEL-ZMYWARKA-001"]
        }
      ]
    }
  ]
}
```

**Status:** ⏳ Do wykonania

---

### ⏳ TEST 10: Kompatybilność Wsteczna

**Kroki:**
1. Znajdź stare zamówienie w `data/orders.json` (bez `devices[]`)
2. Otwórz je w panelu admina
3. Sprawdź czy sekcja "Urządzenie" działa
4. Kliknij "Konwertuj na nowy system wielourządzeniowy"
5. Zapisz i odśwież

**Oczekiwany rezultat:**
- Stare zamówienie wyświetla pola normalnie
- Po konwersji powstaje `devices[0]` z danymi ze starych pól
- Po odświeżeniu widać nowy format z przyciskiem "+ Dodaj urządzenie"

**Status:** ⏳ Do wykonania

---

## 📊 Podsumowanie Testów

| Test | Komponent | Status | Notatki |
|------|-----------|--------|---------|
| 1 | Admin - Przeglądanie | ⏳ | - |
| 2 | Admin - Dodanie urządzenia | ⏳ | - |
| 3 | Admin - Usunięcie urządzenia | ⏳ | - |
| 4 | Technik - Zakładki | ⏳ | - |
| 5 | Technik - Skanowanie Pralka | ⏳ | - |
| 6 | Technik - Skanowanie Zmywarka | ⏳ | - |
| 7 | API - Auto-fill Pralka | ⏳ | - |
| 8 | API - Auto-fill Zmywarka | ⏳ | - |
| 9 | Data - Weryfikacja JSON | ⏳ | - |
| 10 | Backward compatibility | ⏳ | - |

**Postęp:** 0/10 testów zakończonych

---

## 🐛 Znalezione Błędy

### Brak błędów (na razie)
_Sekcja do aktualizacji podczas testowania_

---

## 📝 Notatki Testowe

### Uwagi z testowania:
_Do uzupełnienia podczas testów_

---

## ✅ Kryteria Akceptacji

System jest gotowy do produkcji jeśli:
- [ ] Wszystkie 10 testów przechodzą pomyślnie
- [ ] Nie ma błędów w konsoli przeglądarki
- [ ] Nie ma błędów w konsoli serwera
- [ ] Auto-fill działa niezależnie dla każdego urządzenia
- [ ] Dane zapisują się w poprawnej strukturze JSON
- [ ] Kompatybilność wsteczna działa
- [ ] UI jest responsywny i intuicyjny

---

## 🚀 Następne Kroki

1. ✅ Utworzono zamówienie testowe
2. ⏳ Przeprowadzić testy manualne (1-10)
3. ⏳ Udokumentować wyniki
4. ⏳ Naprawić znalezione błędy
5. ⏳ Ponownie przetestować po poprawkach
6. ⏳ Oznaczyć jako gotowe do produkcji

---

**Aktualizacja:** 04.10.2025
**Status implementacji:** 90% (9/10 zadań zakończonych)
**Status testów:** 0% (0/10 testów przeprowadzonych)
