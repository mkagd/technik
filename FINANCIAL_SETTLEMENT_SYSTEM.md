# 💰 System Rozliczeń Finansowych - Dokumentacja

## 📋 Przegląd

System rozliczeń finansowych z klientem działa na **dwóch poziomach**:

### 1. 📦 Zamów część (Zaliczka z góry)
**Lokalizacja:** `/technician/magazyn/zamow`

**Cel:** Zapisanie informacji, że klient opłacił część z góry podczas diagnozy

**Pola:**
- ✅ Checkbox: "Klient opłacił część z góry"
- 💰 Kwota zaliczki (PLN)

**Zastosowanie:**
- Klient wpłaca zaliczkę na część podczas wizyty diagnostycznej
- Technik zamawia część i zaznacza że jest opłacona
- Kwota zostanie odjęta od końcowego rozliczenia

**API Endpoint:** `POST /api/part-requests`
```json
{
  "prepayment": {
    "isPrepaid": true,
    "amount": 50.00,
    "note": "Klient opłacił część z góry podczas diagnozy"
  }
}
```

---

### 2. ✅ Zakończ wizytę (Pełne rozliczenie)
**Lokalizacja:** `CompletionWizard` → Krok 3 (Summary)

**Cel:** Kompletne rozliczenie z klientem po zakończeniu naprawy

**Pola:**
- 🔧 Koszt użytych części (PLN)
- 💼 Koszt robocizny (PLN)
- 💵 Zaliczka wpłacona wcześniej (PLN) - jeśli była
- **AUTO-OBLICZANIE:**
  - Suma = Części + Robocizna
  - Do zapłaty = Suma - Zaliczka
- 💳 Sposób płatności:
  - Gotówka
  - Karta
  - Przelew
  - Odroczona
- ✅ Status zapłaty:
  - Nie zapłacono
  - Zapłacono
  - Częściowo
- 💰 Zapłacona kwota (jeśli paid/partial)

**API Endpoint:** `POST /api/technician/complete-visit`
```json
{
  "payment": {
    "partsCost": 50.00,
    "laborCost": 150.00,
    "prepaidAmount": 50.00,
    "totalCost": 200.00,
    "amountDue": 150.00,
    "paymentMethod": "cash",
    "paymentStatus": "paid",
    "paidAmount": 150.00
  }
}
```

---

## 🔄 Workflow krok po kroku

### Scenariusz 1: Bez zaliczki
```
1. Wizyta diagnostyczna → diagnoza
2. Technik zamawia część → NIE zaznacza prepaid
3. Część dostarczona → naprawa
4. Zakończ wizytę → Wpisz kwoty:
   - Części: 50 zł
   - Robocizna: 150 zł
   - Zaliczka: 0 zł
   → Do zapłaty: 200 zł ✅
5. Wybierz sposób płatności: Gotówka
6. Status: Zapłacono
7. Zapłacona kwota: 200 zł
```

### Scenariusz 2: Z zaliczką
```
1. Wizyta diagnostyczna → klient wpłaca 50 zł zaliczki na część
2. Technik zamawia część → Zaznacza "Opłacona z góry" + 50 zł
3. Część dostarczona → naprawa
4. Zakończ wizytę → Wpisz kwoty:
   - Części: 50 zł
   - Robocizna: 150 zł
   - Zaliczka: 50 zł (już wpłacona!)
   → Do zapłaty: 150 zł ✅
5. Wybierz sposób płatności: Karta
6. Status: Zapłacono
7. Zapłacona kwota: 150 zł
```

### Scenariusz 3: Płatność częściowa
```
1. Zakończ wizytę → Kwoty:
   - Części: 80 zł
   - Robocizna: 200 zł
   - Zaliczka: 50 zł
   → Do zapłaty: 230 zł
2. Klient płaci tylko: 100 zł gotówką
3. Status: Częściowo
4. Zapłacona kwota: 100 zł
5. Pozostało: 130 zł (ręcznie notuj w notatce)
```

---

## 📊 Podsumowanie visual w CompletionWizard

```
┌─────────────────────────────────┐
│ 💰 Rozliczenie z klientem       │
├─────────────────────────────────┤
│ Części:        50.00 zł         │
│ Robocizna:    150.00 zł         │
│ Suma:         200.00 zł         │
│ - Zaliczka:   -50.00 zł         │
├─────────────────────────────────┤
│ DO ZAPŁATY:   150.00 zł ✅      │
└─────────────────────────────────┘
```

---

## 🎯 Korzyści systemu

### Dla technika:
- ✅ Wszystko w jednym miejscu
- ✅ Auto-obliczanie (brak błędów)
- ✅ Uwzględnia zaliczki automatycznie
- ✅ Historia rozliczeń w systemie

### Dla firmy:
- ✅ Pełna kontrola nad finansami
- ✅ Tracking zaliczek
- ✅ Raporty płatności
- ✅ Mniej błędów księgowych

### Dla klienta:
- ✅ Transparentne rozliczenie
- ✅ Zaliczka odliczona od końcowej kwoty
- ✅ Paragon/potwierdzenie w systemie

---

## 🔧 Implementacja techniczna

### Frontend:
- `pages/technician/magazyn/zamow.js` - Sekcja zaliczki (linie 65-68, 750-780)
- `components/technician/CompletionWizard.js` - Pełne rozliczenie (linie 18-23, 508-650)

### Backend:
- `pages/api/part-requests/index.js` - Zapis zaliczki (linia 289)
- `pages/api/technician/complete-visit.js` - Zapis payment object

### State management:
```javascript
// Zaliczka (zamow.js)
const [partPrepaid, setPartPrepaid] = useState(false);
const [prepaidAmount, setPrepaidAmount] = useState('');

// Pełne rozliczenie (CompletionWizard)
const [partsCost, setPartsCost] = useState('');
const [laborCost, setLaborCost] = useState('');
const [prepaidAmount, setPrepaidAmount] = useState('');
const [paymentMethod, setPaymentMethod] = useState('');
const [paymentStatus, setPaymentStatus] = useState('unpaid');
const [paidAmount, setPaidAmount] = useState('');
```

---

## ✅ Status implementacji

- ✅ Sekcja zaliczki w zamów część
- ✅ Pełna sekcja finansowa w zakończ wizytę
- ✅ Auto-obliczanie sum
- ✅ API endpoints zaktualizowane
- ⏳ Testy (do wykonania)

---

## 🧪 Plan testów

### Test 1: Zaliczka w zamów część
1. Otwórz `/technician/magazyn/zamow`
2. Zaznacz "Klient opłacił część z góry"
3. Wpisz kwotę: 50 zł
4. Submit
5. ✅ Verify w `data/part-requests.json` → pole `prepayment`

### Test 2: Pełne rozliczenie
1. Otwórz wizytę in_progress
2. Kliknij "Zakończ wizytę"
3. Dodaj 2 zdjęcia completion
4. Wybierz typ completion
5. W summary wpisz:
   - Części: 50 zł
   - Robocizna: 150 zł
   - Zaliczka: 50 zł
6. ✅ Sprawdź: "Do zapłaty: 150 zł"
7. Wybierz płatność: Gotówka, Zapłacono, 150 zł
8. Submit
9. ✅ Verify w `data/orders.json` → visit.payment object

---

**Utworzono:** 13 października 2025  
**Autor:** System AI  
**Wersja:** 1.0
