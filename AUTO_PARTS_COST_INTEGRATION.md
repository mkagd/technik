# 💡 Auto-wypełnianie kosztów części z zamówień

## 📋 Opis problemu

**Scenariusz:**
1. Technik diagnozuje urządzenie
2. Zamawia część przez `/technician/magazyn/zamow`
3. Część przychodzi → naprawa
4. Kończąc wizytę musi **ręcznie wpisać koszt części**

**Problem:** 
- Duplikacja pracy ❌
- Ryzyko błędów (zapomni wpisać, źle przepisze) ❌
- Brak połączenia między zamówieniem a rozliczeniem ❌

---

## ✅ Rozwiązanie: Automatyczne powiązanie

### Architektura:

```
┌─────────────────────────────────────────────────┐
│ 1. WIZYTA → "Zamów część"                       │
│    - Przekazuje: visitId, orderNumber, device   │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 2. ZAMÓW CZĘŚĆ (magazyn/zamow)                  │
│    - Zapisuje: visitId w part-request           │
│    - Opcjonalnie: prepayment (zaliczka)         │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 3. CZĘŚĆ DOSTARCZONA → NAPRAWA                  │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 4. ZAKOŃCZ WIZYTĘ (CompletionWizard)           │
│    useEffect:                                   │
│    - GET /api/part-requests?visitId=X           │
│    - Pobiera wszystkie części dla wizyty        │
│    - Sumuje ceny: part.price * quantity         │
│    - Auto-wypełnia: partsCost                   │
│    - Auto-wypełnia: prepaidAmount (zaliczki)    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementacja krok po kroku

### 1. Dodano visitId do linku "Zamów część"

**Plik:** `pages/technician/visit/[visitId].js`

**Zmiana (linia 328):**
```javascript
<Link href={{
  pathname: '/technician/magazyn/zamow',
  query: {
    visitId: visit.visitId, // ✅ Nowe!
    orderNumber: visit.visitId,
    clientName: visit.client?.name || '',
    deviceBrand: visit.devices?.[0]?.brand || '',
    deviceModel: visit.devices?.[0]?.model || '',
    issueDescription: visit.description || ''
  }
}}>
```

**Efekt:** Przycisk "Zamów część" przekazuje visitId do formularza

---

### 2. Formularz zapisuje visitId w part-request

**Plik:** `pages/technician/magazyn/zamow.js`

**State (linia ~50):**
```javascript
const [visitId, setVisitId] = useState(''); // ✅ Nowy state
```

**Auto-wypełnianie z URL (linia ~68):**
```javascript
useEffect(() => {
  if (router.query.visitId) setVisitId(router.query.visitId); // ✅
  // ... inne pola
}, [router.query]);
```

**API call (linia ~255):**
```javascript
body: JSON.stringify({
  requestedBy: employeeId,
  parts: selectedParts,
  visitId: visitId || undefined, // ✅ Dodane do API
  orderNumber: orderNumber || undefined,
  prepayment: partPrepaid ? { ... } : undefined
})
```

**Efekt:** part-request zapisuje visitId dla powiązania

---

### 3. API part-requests obsługuje visitId

**Plik:** `pages/api/part-requests/index.js`

**POST - Tworzenie (linia ~243):**
```javascript
const newRequest = {
  requestId,
  requestedBy,
  requestedFor,
  visitId: req.body.visitId || null, // ✅ Zapisuje visitId
  orderNumber: req.body.orderNumber || null,
  clientName: req.body.clientName || null,
  deviceInfo: ocrData?.device || deviceInfo || null,
  parts: parts.map(p => ({ ... })),
  prepayment: req.body.prepayment || null, // ✅ Zaliczka
  // ...
};
```

**GET - Filtrowanie (linia ~122):**
```javascript
const { id, requestedBy, requestedFor, visitId, status } = req.query;

// ✅ Filtruj po visitId
if (visitId) {
  requests = requests.filter(r => r.visitId === visitId);
}
```

**Efekt:** 
- POST zapisuje visitId w bazie
- GET umożliwia pobieranie: `/api/part-requests?visitId=VIS251013001`

---

### 4. CompletionWizard auto-ładuje części

**Plik:** `components/technician/CompletionWizard.js`

**useEffect (linia ~78):**
```javascript
// 💰 Auto-wypełnianie kosztów części z part-requests
useEffect(() => {
  if (!visit?.visitId) return;

  const loadPartRequestsForVisit = async () => {
    try {
      // 1. Pobierz part-requests dla wizyty
      const res = await fetch(`/api/part-requests?visitId=${visit.visitId}`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (!data.requests || data.requests.length === 0) return;

      console.log('💰 Znaleziono part-requests dla wizyty:', data.requests.length);

      // 2. Załaduj bazę części (ceny)
      const partsRes = await fetch('/api/parts');
      if (!partsRes.ok) return;
      
      const partsData = await partsRes.json();
      const partsMap = new Map(partsData.parts.map(p => [p.id, p]));

      // 3. Oblicz sumę kosztów
      let totalPartsCost = 0;
      let totalPrepaid = 0;

      data.requests.forEach(request => {
        request.parts.forEach(part => {
          const partData = partsMap.get(part.partId);
          if (partData && partData.price) {
            totalPartsCost += partData.price * part.quantity;
          }
        });

        // Sumuj zaliczki
        if (request.prepayment?.isPrepaid && request.prepayment?.amount) {
          totalPrepaid += request.prepayment.amount;
        }
      });

      // 4. Auto-wypełnij pola
      if (totalPartsCost > 0) {
        setPartsCost(totalPartsCost.toFixed(2));
        console.log('✅ Auto-wypełniono koszt części:', totalPartsCost, 'zł');
      }

      if (totalPrepaid > 0) {
        setPrepaidAmount(totalPrepaid.toFixed(2));
        console.log('✅ Auto-wypełniono zaliczkę:', totalPrepaid, 'zł');
      }

    } catch (error) {
      console.error('❌ Błąd ładowania part-requests:', error);
    }
  };

  loadPartRequestsForVisit();
}, [visit?.visitId]);
```

**Efekt:**
- Przy otwarciu CompletionWizard automatycznie ładuje części
- Sumuje: `price * quantity` dla każdej części
- Wypełnia pola: **Koszt części** i **Zaliczka**

---

## 🎯 Przykładowy workflow

### Scenariusz: Naprawa lodówki Samsung

**Krok 1: Diagnoza**
```
Technik: Mariusz
Wizyta: VIS251013001
Urządzenie: Samsung RF23R62E3SR
Problem: Nie chłodzi
```

**Krok 2: Zamów część**
```
Mariusz klika "Zamów część"
→ Auto-wypełnia: visitId=VIS251013001
→ Wybiera: Pompa PART-LOD-001 (50 zł)
→ Zaznacza: ☑️ Klient opłacił z góry → 30 zł
→ Submit
```

**Zapisane w part-request:**
```json
{
  "requestId": "ZC-2510131645-005",
  "visitId": "VIS251013001",
  "parts": [{ "partId": "PART-LOD-001", "quantity": 1 }],
  "prepayment": { "isPrepaid": true, "amount": 30 }
}
```

**Krok 3: Część dostarczona → Naprawa**
```
Pompa przyjeżdża → Mariusz naprawia lodówkę
```

**Krok 4: Zakończ wizytę**
```
Mariusz klika "Zakończ wizytę"
→ Step 1: Dodaje 2 zdjęcia completion
→ Step 2: Wybiera "Naprawa zakończona"
→ Step 3: Summary
   
   🎉 AUTO-WYPEŁNIONE:
   ┌─────────────────────────────┐
   │ Koszt części:    50.00 zł   │ ← Z part-request!
   │ Koszt robocizny: [___] zł   │ ← Ręcznie wpisze
   │ Zaliczka:        30.00 zł   │ ← Z prepayment!
   └─────────────────────────────┘
```

Mariusz tylko wpisuje: **Robocizna: 150 zł**

**Auto-obliczenie:**
```
Części:      50.00 zł
Robocizna:  150.00 zł
Suma:       200.00 zł
- Zaliczka:  30.00 zł
═════════════════════
DO ZAPŁATY: 170.00 zł ✅
```

---

## 📊 Struktura danych

### part-requests.json (po zapisie)
```json
{
  "requestId": "ZC-2510131645-005",
  "requestedBy": "EMPA252780002",
  "requestedFor": "EMPA252780002",
  "visitId": "VIS251013001", // ✅ Powiązanie!
  "orderNumber": "VIS251013001",
  "clientName": "Jan Kowalski",
  "deviceInfo": {
    "brand": "Samsung",
    "model": "RF23R62E3SR"
  },
  "parts": [
    { "partId": "PART-LOD-001", "quantity": 1 }
  ],
  "prepayment": { // ✅ Zaliczka
    "isPrepaid": true,
    "amount": 30,
    "note": "Klient opłacił część z góry podczas diagnozy"
  },
  "status": "delivered",
  "createdAt": "2025-10-13T14:45:00Z"
}
```

### parts.json (baza cen)
```json
{
  "id": "PART-LOD-001",
  "name": "Pompa odprowadzająca",
  "category": "lodowki",
  "price": 50.00, // ✅ Cena używana do auto-sumy
  "currency": "PLN",
  "stock": 5
}
```

### CompletionWizard state (po auto-load)
```javascript
partsCost: "50.00"        // ✅ Auto-wypełnione!
laborCost: ""             // Ręcznie
prepaidAmount: "30.00"    // ✅ Auto-wypełnione!
```

---

## ✅ Korzyści

### Dla technika:
- ✅ **Zero duplikacji** - nie przepisuje kosztów
- ✅ **Brak błędów** - ceny pobrane automatycznie z bazy
- ✅ **Szybsze rozliczenie** - tylko robocizna do wpisania
- ✅ **Historia powiązań** - widać które części do której wizyty

### Dla firmy:
- ✅ **Precyzyjne rozliczenia** - każda część powiązana z wizytą
- ✅ **Raporty finansowe** - łatwo śledzić koszty części vs robocizna
- ✅ **Audyt** - łańcuch: zamówienie → dostawa → rozliczenie
- ✅ **Inwentaryzacja** - które części do których zleceń

### Dla klienta:
- ✅ **Transparentność** - widzi dokładnie co zapłacił
- ✅ **Zaliczka uwzględniona** - nie płaci podwójnie
- ✅ **Bez niespodzianek** - ceny zgodne z zamówieniem

---

## 🧪 Plan testów

### Test 1: Powiązanie visitId
```
1. Otwórz wizytę: VIS251013001
2. Kliknij "Zamów część"
3. ✅ SPRAWDŹ: URL zawiera ?visitId=VIS251013001
4. Wybierz część: PART-LOD-001 (50 zł)
5. Submit
6. ✅ SPRAWDŹ w data/part-requests.json:
   "visitId": "VIS251013001"
```

### Test 2: Auto-wypełnianie kosztów
```
1. Wykonaj Test 1 (zamów część)
2. Wróć do wizyty VIS251013001
3. Kliknij "Zakończ wizytę"
4. Dodaj 2 zdjęcia completion
5. Przejdź do step 3 (summary)
6. ✅ SPRAWDŹ:
   - Koszt części: 50.00 zł (auto!)
   - Zaliczka: 0 zł (jeśli nie było)
7. Console log: "💰 Znaleziono part-requests dla wizyty: 1"
8. Console log: "✅ Auto-wypełniono koszt części: 50 zł"
```

### Test 3: Auto-wypełnianie zaliczki
```
1. Otwórz wizytę: VIS251013002
2. Zamów część: PART-LOD-002 (80 zł)
3. ☑️ Zaznacz: Klient opłacił z góry → 50 zł
4. Submit
5. Zakończ wizytę VIS251013002
6. ✅ SPRAWDŹ w step 3:
   - Koszt części: 80.00 zł (auto!)
   - Zaliczka: 50.00 zł (auto!)
   - Do zapłaty: (80 + robocizna - 50) ✅
```

### Test 4: Wiele części
```
1. Otwórz wizytę: VIS251013003
2. Zamów część 1: PART-LOD-001 (50 zł) × 2 = 100 zł
3. Zamów część 2: PART-LOD-003 (30 zł) × 1 = 30 zł
4. Zakończ wizytę
5. ✅ SPRAWDŹ:
   - Koszt części: 130.00 zł (100 + 30) ✅
   - Console: "💰 Znaleziono part-requests dla wizyty: 2"
```

### Test 5: Brak części (default)
```
1. Otwórz nową wizytę bez zamówień części
2. Zakończ wizytę
3. ✅ SPRAWDŹ:
   - Koszt części: "" (puste)
   - Zaliczka: "" (puste)
   - Można ręcznie wpisać
```

---

## 🔄 Zgodność wsteczna

**Co się dzieje ze starymi wizytami?**

- ✅ Stare part-requests **bez visitId** → pole = null
- ✅ CompletionWizard dla starej wizyty → nie znajdzie części → pola puste
- ✅ Można **ręcznie wpisać** koszty (jak wcześniej)
- ✅ Nowe wizyty automatycznie wykorzystają system

**Nie trzeba migrować danych!** 🎉

---

## 📝 Status implementacji

- ✅ Dodano visitId do linku "Zamów część"
- ✅ Zapisywanie visitId w part-requests API
- ✅ Filtrowanie GET /api/part-requests?visitId=X
- ✅ Auto-ładowanie części w CompletionWizard useEffect
- ✅ Auto-sumowanie cen części
- ✅ Auto-sumowanie zaliczek
- ⏳ Testy end-to-end

---

**Utworzono:** 13 października 2025  
**Autor:** System AI  
**Wersja:** 1.0
