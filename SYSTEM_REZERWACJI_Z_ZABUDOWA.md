# 📋 System Rezerwacji z Obsługą Zabudowy - Dokumentacja

## 🎯 Cel
Rozszerzenie systemu rezerwacji AGD o informacje dotyczące zabudowy urządzeń, co umożliwia:
- Automatyczne obliczanie czasu wizyty serwisowej
- Lepsze planowanie pracy serwisantów
- Dokładniejsze informacje dla klientów

---

## 📝 Zmiany w Systemie

### 1. **Formularz Rezerwacji** (`/rezerwacja`)

#### Nowe Pola w Kroku 1 (Szczegóły Urządzenia):

**Główny Checkbox:**
```
🔧 Sprzęt w zabudowie (+20 min: demontaż i montaż)
```

**Gdy zaznaczony, automatycznie:**
- ✅ Zaznacza "Demontaż zabudowy" (+10 min)
- ✅ Zaznacza "Montaż zabudowy" (+10 min)
- 📂 Rozwija dodatkową opcję:
  ```
  ⚠️ Trudna zabudowa (+30 min dodatkowego czasu)
  ```

**Logika:**
- Jeśli ODZNACZYSZ "Sprzęt w zabudowie" → automatycznie odznacza wszystkie pola
- Jeśli ZAZNACZYSZ "Sprzęt w zabudowie" → automatycznie zaznacza demontaż i montaż
- "Trudna zabudowa" jest widoczna TYLKO gdy zaznaczona zabudowa

---

### 2. **Struktura Danych**

#### Stan Formularza (`formData`):
```javascript
{
  // ... istniejące pola ...
  hasBuiltIn: [],         // Tablica boolean - czy urządzenie w zabudowie
  hasDemontaz: [],        // Tablica boolean - czy wymaga demontażu
  hasMontaz: [],          // Tablica boolean - czy wymaga montażu
  hasTrudnaZabudowa: []   // Tablica boolean - czy trudna zabudowa
}
```

#### Obiekt Wysyłany do API (`submitData`):
```javascript
{
  // ... istniejące pola ...
  hasBuiltIn: formData.hasBuiltIn[0] || false,
  hasDemontaz: formData.hasDemontaz[0] || false,
  hasMontaz: formData.hasMontaz[0] || false,
  hasTrudnaZabudowa: formData.hasTrudnaZabudowa[0] || false
}
```

#### Struktura Zamówienia w `orders.json`:
```json
{
  "id": 1029,
  "orderNumber": "ORDA25270029",
  "deviceType": "Pralka",
  "deviceDetails": {
    "deviceType": "pralka",
    "hasBuiltIn": true,
    "hasDemontaz": true,
    "hasMontaz": true,
    "hasTrudnaZabudowa": false,
    "manualAdditionalTime": 0
  },
  // ... inne pola ...
}
```

---

### 3. **Flow Danych**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FORMULARZ /rezerwacja                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☑ Sprzęt w zabudowie                                     │   │
│  │   ├─ Auto: ☑ Demontaż (+10 min)                         │   │
│  │   ├─ Auto: ☑ Montaż (+10 min)                           │   │
│  │   └─ Opcja: ☐ Trudna zabudowa (+30 min)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. POST /api/rezerwacje                                        │
│  {                                                              │
│    category: "Pralka",                                          │
│    hasBuiltIn: true,                                            │
│    hasDemontaz: true,                                           │
│    hasMontaz: true,                                             │
│    hasTrudnaZabudowa: false                                     │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. convertReservationToClientOrder()                           │
│  utils/clientOrderStorage.js                                    │
│                                                                 │
│  Tworzy:                                                        │
│  • client → clients.json                                        │
│  • order → orders.json (z deviceDetails)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. ZAPIS DO orders.json                                        │
│  {                                                              │
│    "deviceDetails": {                                           │
│      "deviceType": "pralka",                                    │
│      "hasBuiltIn": true,                                        │
│      "hasDemontaz": true,                                       │
│      "hasMontaz": true,                                         │
│      "hasTrudnaZabudowa": false,                                │
│      "manualAdditionalTime": 0                                  │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. SZCZEGÓŁY ZLECENIA → NOWA WIZYTA                            │
│  pages/zlecenie-szczegoly.js                                    │
│                                                                 │
│  detectDeviceTypeFromOrder():                                   │
│  • Odczytuje orderDetails.device.type → "Piekarnik"            │
│  • Normalizuje → "piekarnik"                                    │
│  • Zwraca deviceType                                            │
│                                                                 │
│  openVisitModal():                                              │
│  • deviceType = "piekarnik" (auto-select)                       │
│  • hasDemontaz = true (z orderDetails.deviceDetails)            │
│  • hasMontaz = true (z orderDetails.deviceDetails)              │
│  • hasTrudnaZabudowa = false                                    │
│                                                                 │
│  useEffect (auto-calculation):                                  │
│  • calculateRepairTime() → 22 + 10 + 10 = 42 min              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Zmodyfikowane Pliki

### 1. `pages/rezerwacja.js`
**Zmiany:**
- Dodano pola `hasBuiltIn`, `hasDemontaz`, `hasMontaz`, `hasTrudnaZabudowa` do `formData`
- Dodano sekcję "Dodatkowe informacje" z checkboxami
- Główny checkbox "Sprzęt w zabudowie" automatycznie zaznacza/odznacza podpola
- Rozwijalna sekcja "Trudna zabudowa" widoczna tylko gdy zaznaczona zabudowa
- Rozszerzone `submitData` o pola zabudowy

### 2. `utils/clientOrderStorage.js`
**Zmiany:**
- Funkcja `convertReservationToClientOrder()` dodaje obiekt `deviceDetails` do zamówienia:
  ```javascript
  deviceDetails: {
    deviceType: (reservationData.category || '').toLowerCase(),
    hasBuiltIn: reservationData.hasBuiltIn || false,
    hasDemontaz: reservationData.hasDemontaz || false,
    hasMontaz: reservationData.hasMontaz || false,
    hasTrudnaZabudowa: reservationData.hasTrudnaZabudowa || false,
    manualAdditionalTime: 0
  }
  ```

### 3. `pages/zlecenie-szczegoly.js`
**Istniejące funkcje wykorzystane:**
- `detectDeviceTypeFromOrder()` - odczytuje typ urządzenia z `orderDetails.device.type`
- `openVisitModal()` - automatycznie wypełnia pola wizyty z `orderDetails.deviceDetails`
- `useEffect` - automatycznie oblicza czas wizyty na podstawie zabudowy

---

## 📊 Obliczanie Czasu Wizyty

### Formuła:
```
Czas Całkowity = Czas Bazowy + Demontaż + Montaż + Trudna Zabudowa + Czas Ręczny
```

### Przykład 1: Pralka w zabudowie (standardowa)
```
Serwisant: Marek Pralkowski (ekspert, 22 min bazowo)
Urządzenie: Pralka
☑ Sprzęt w zabudowie
  ├─ ☑ Demontaż: +10 min
  └─ ☑ Montaż: +10 min

Obliczenia:
22 (bazowy) + 10 (demontaż) + 10 (montaż) = 42 minuty
```

### Przykład 2: Zmywarka w trudnej zabudowie
```
Serwisant: Jan Kowalski (początkujący, 38 min bazowo)
Urządzenie: Zmywarka
☑ Sprzęt w zabudowie
  ├─ ☑ Demontaż: +10 min
  ├─ ☑ Montaż: +10 min
  └─ ☑ Trudna zabudowa: +30 min

Obliczenia:
38 (bazowy) + 10 (demontaż) + 10 (montaż) + 30 (trudna) = 88 minut
```

---

## 🧪 Testowanie

### Test Case 1: Rezerwacja z zabudową
**Kroki:**
1. Otwórz http://localhost:3000/rezerwacja
2. Wybierz "Pralka"
3. ✅ Zaznacz "Sprzęt w zabudowie"
4. Sprawdź czy automatycznie zaznaczyły się: Demontaż i Montaż
5. Wypełnij resztę formularza (adres, dane kontaktowe, dostępność)
6. Wyślij zgłoszenie

**Oczekiwany wynik:**
- ✅ Zgłoszenie zapisane w `orders.json`
- ✅ Pole `deviceDetails.hasBuiltIn = true`
- ✅ Pole `deviceDetails.hasDemontaz = true`
- ✅ Pole `deviceDetails.hasMontaz = true`

### Test Case 2: Automatyczne wypełnianie wizyty
**Kroki:**
1. Znajdź nowo utworzone zlecenie w panelu
2. Otwórz szczegóły zlecenia
3. Kliknij "Nowa wizyta"

**Oczekiwany wynik:**
- ✅ Typ urządzenia: "Pralka" (automatycznie wybrany)
- ✅ Checkbox "Demontaż zabudowy": zaznaczony
- ✅ Checkbox "Montaż zabudowy": zaznaczony
- ✅ Szacowany czas: obliczony automatycznie (np. 42 min)

### Test Case 3: Trudna zabudowa
**Kroki:**
1. W formularzu rezerwacji zaznacz "Sprzęt w zabudowie"
2. Zaznacz również "Trudna zabudowa"
3. Wyślij zgłoszenie
4. Otwórz szczegóły → Dodaj wizytę

**Oczekiwany wynik:**
- ✅ `deviceDetails.hasTrudnaZabudowa = true`
- ✅ Checkbox "Trudna zabudowa": zaznaczony w wizytcie
- ✅ Czas wizyty: +30 min więcej

---

## 💡 UX - Doświadczenie Użytkownika

### Dla Klienta (Formularz Rezerwacji):
1. **Prostota** - jeden główny checkbox "Sprzęt w zabudowie"
2. **Inteligencja** - automatycznie zaznacza demontaż i montaż
3. **Opcjonalność** - rozwijana sekcja "Trudna zabudowa" tylko gdy potrzebna
4. **Transparentność** - widoczne czasy dodatkowe (+20 min, +30 min)

### Dla Serwisanta (Dodawanie Wizyty):
1. **Automatyzacja** - wszystkie pola wypełnione automatycznie
2. **Edytowalność** - możliwość zmiany jeśli coś się zmieniło
3. **Precyzja** - automatyczne obliczanie czasu wizyty
4. **Przejrzystość** - breakdown czasu (bazowy + dodatkowe)

---

## 🔄 Kompatybilność Wsteczna

### Stare Zlecenia (bez deviceDetails):
```javascript
// Funkcja detectDeviceTypeFromOrder() obsługuje 3 scenariusze:

// PRIORYTET 1: Nowe zlecenia z deviceDetails
if (orderDetails.deviceDetails?.deviceType) {
  return orderDetails.deviceDetails.deviceType;
}

// PRIORYTET 2: Zlecenia z device.type (z mapowania)
if (orderDetails.device?.type) {
  return normalize(orderDetails.device.type); // "Piekarnik" → "piekarnik"
}

// PRIORYTET 3: Wykrywanie z opisu (keyword matching)
return detectFromDescription(orderDetails.description);
```

**Wynik:** System działa zarówno dla nowych jak i starych zleceń! ✅

---

## 📈 Przyszłe Rozszerzenia

### Możliwe Ulepszenia:
1. **Historia zabudowy** - zapisywanie informacji o zabudowie dla klienta
   - "Ten klient zawsze ma trudną zabudowę w kuchni"
   
2. **Statystyki** - analiza czasu serwisów z zabudową vs bez
   - "Średni czas naprawy pralki w zabudowie: 45 min"
   
3. **Foto dokumentacja** - upload zdjęć zabudowy podczas zgłoszenia
   - "Prześlij zdjęcie zabudowy aby serwisant lepiej się przygotował"
   
4. **Inteligentne sugestie** - ML model przewidujący trudność zabudowy
   - "Na podstawie marki i modelu prawdopodobnie trudna zabudowa: 85%"

---

## ✅ Podsumowanie

### Co Dodano:
✅ Checkbox "Sprzęt w zabudowie" w formularzu rezerwacji
✅ Automatyczne zaznaczanie demontażu i montażu
✅ Opcjonalna "Trudna zabudowa" (rozwijalna)
✅ Pole `deviceDetails` w strukturze zamówienia
✅ Automatyczne wypełnianie pól wizyty z danych zlecenia
✅ Automatyczne obliczanie czasu wizyty z uwzględnieniem zabudowy

### Pliki Zmodyfikowane:
- ✅ `pages/rezerwacja.js` (formularz + logika)
- ✅ `utils/clientOrderStorage.js` (konwersja rezerwacji)
- 🔄 `pages/zlecenie-szczegoly.js` (wykorzystanie istniejącej funkcjonalności)

### Kompatybilność:
✅ Działa dla nowych zleceń (z `deviceDetails`)
✅ Działa dla starych zleceń (fallback do `device.type`)
✅ Nie psuje istniejących funkcjonalności

---

**Data utworzenia:** 2 października 2025
**Wersja:** 1.0
**Status:** ✅ Gotowe do testów
