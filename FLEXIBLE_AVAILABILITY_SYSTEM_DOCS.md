# 📅 NOWY SYSTEM DOSTĘPNOŚCI KLIENTA

**Data:** 5 października 2025  
**Typ:** Elastyczne sloty czasowe przy zamówieniu

---

## 🎯 CEL ZMIANY

Zmiana z **sztywnego harmonogramu tygodniowego** na **elastyczne sloty czasowe** przypisane do konkretnego zamówienia.

### Stary system:
- ❌ Dostępność w profilu klienta (`physicalAvailability`)
- ❌ Harmonogram tygodniowy (pon-nd + godziny)
- ❌ Skomplikowany komponent `AvailabilityScheduler`
- ❌ Oddzielnie od zamówienia

### Nowy system:
- ✅ Dostępność przy zamówieniu (`availabilitySlots`)
- ✅ Elastyczne przedziały dat + godzin
- ✅ Prosty komponent `FlexibleAvailabilitySelector`
- ✅ Zapisywane razem z zamówieniem

---

## 📦 STRUKTURA DANYCH

### Slot dostępności:
```javascript
{
  id: 1728123456789,              // Timestamp jako ID
  dateFrom: "2025-10-06",         // Data rozpoczęcia (YYYY-MM-DD)
  dateTo: "2025-10-08",           // Data zakończenia (YYYY-MM-DD)
  timeFrom: "08:00",              // Godzina od (HH:MM)
  timeTo: "20:00",                // Godzina do (HH:MM)
  notes: "Najlepiej przed 12:00"  // Dodatkowe uwagi (opcjonalne)
}
```

### W zamówieniu (orders.json):
```json
{
  "id": "ORD2025000123",
  "clientId": "CLI2025000001",
  "deviceType": "Pralka",
  "preferredDate": "2025-10-06",
  "preferredTime": "8:00-10:00",
  
  "availabilitySlots": [
    {
      "id": 1728123456789,
      "dateFrom": "2025-10-06",
      "dateTo": "2025-10-08",
      "timeFrom": "08:00",
      "timeTo": "20:00",
      "notes": "Najlepiej przed 12:00"
    },
    {
      "id": 1728123456890,
      "dateFrom": "2025-10-10",
      "dateTo": "2025-10-10",
      "timeFrom": "16:00",
      "timeTo": "20:00",
      "notes": "W piątek tylko wieczorem"
    }
  ],
  
  "status": "pending",
  "createdAt": "2025-10-05T22:30:00Z"
}
```

---

## 🧩 KOMPONENTY

### 1. FlexibleAvailabilitySelector

**Plik:** `components/FlexibleAvailabilitySelector.js`

**Props:**
```javascript
<FlexibleAvailabilitySelector
  value={[]}              // Tablica slotów
  onChange={(slots) => {}} // Callback ze zmianami
  minDate="2025-10-06"    // Minimalna data (domyślnie: dziś)
  compact={false}         // Tryb compact/full
/>
```

**Funkcje:**
- ✅ Dodawanie/usuwanie slotów
- ✅ Edycja zakresu dat (od-do)
- ✅ Edycja zakresu godzin (od-do)
- ✅ Szybkie presety czasowe (rano, popołudnie, wieczór, cały dzień)
- ✅ Pole na dodatkowe uwagi
- ✅ Walidacja dat (min/max)
- ✅ Dwa tryby: compact (dla formularzy) i full (dla dedykowanych stron)

**Presety czasowe:**
- 🌅 Rano: 08:00-12:00
- ☀️ Popołudnie: 12:00-16:00
- 🌆 Wieczór: 16:00-20:00
- 🏠 Cały dzień: 08:00-20:00

---

## 📝 INTEGRACJA

### 1. Formularz klienta (new-order.js)

**Lokalizacja:** `pages/client/new-order.js`

**Zmiany:**
```javascript
// Import
import FlexibleAvailabilitySelector from '../../components/FlexibleAvailabilitySelector';

// Stan
const [formData, setFormData] = useState({
  // ... inne pola
  availabilitySlots: []  // ← NOWE
});

// W formularzu (Step 3: Termin)
<FlexibleAvailabilitySelector
  value={formData.availabilitySlots}
  onChange={(slots) => setFormData({ ...formData, availabilitySlots: slots })}
  minDate={new Date().toISOString().split('T')[0]}
  compact={true}
/>
```

### 2. API create-order

**Lokalizacja:** `pages/api/client/create-order.js`

**Zmiany:**
```javascript
const newOrder = {
  // ... inne pola
  
  // Elastyczna dostępność klienta - sloty czasowe
  availabilitySlots: req.body.availabilitySlots || [],
  
  // ... reszta
};

// Logging
console.log('📦 Creating order:', {
  id: newOrder.id,
  availabilitySlotsCount: newOrder.availabilitySlots.length  // ← NOWE
});
```

---

## 🎨 UI/UX

### Tryb Compact (compact={true})

Używany w formularzach zamówień:
- 📦 Mały footer z przyciskiem "Dodaj termin"
- 🎴 Karty slotów z podstawowymi polami
- 🔘 Szybkie presety jako małe przyciski
- 💬 Krótka wskazówka na dole

### Tryb Full (compact={false})

Używany na dedykowanych stronach dostępności:
- 🎯 Duży nagłówek z opisem
- 🃏 Rozbudowane karty slotów z ikonami
- 🎨 Większe presety z emoji
- 📋 Rozszerzone wskazówki i info boxy

---

## 🔄 FLOW UŻYTKOWNIKA

### Scenariusz 1: Klient z elastyczną dostępnością

1. Klient wypełnia formularz zamówienia
2. W kroku 3 (Termin) widzi sekcję "Kiedy jesteś dostępny?"
3. Klikając "Dodaj termin" tworzy slot:
   - Zakres dat: 6-8 października
   - Godziny: 8:00-20:00
   - Uwaga: "Najlepiej przed 12:00"
4. Dodaje drugi slot:
   - Data: 10 października
   - Godziny: 16:00-20:00
   - Uwaga: "W piątek tylko wieczorem"
5. Wysyła zamówienie

### Scenariusz 2: Klient bez specjalnych wymagań

1. Klient wypełnia formularz
2. W kroku 3 pomija sekcję dostępności (nie dodaje slotów)
3. Wysyła zamówienie z pustą tablicą `availabilitySlots: []`
4. Admin widzi, że klient nie określił dostępności

### Scenariusz 3: Klient ze zmienną dostępnością

1. Dodaje 3 sloty:
   - Poniedziałek-środa: 8:00-12:00 (tylko rano)
   - Czwartek: 16:00-20:00 (tylko wieczorem)
   - Weekend: 10:00-18:00 (cały dzień)
2. Każdy slot z własną uwagą
3. System zapisuje wszystkie sloty z zamówieniem

---

## 🎯 KORZYŚCI

### Dla klienta:
- ✅ Prostsze w użyciu niż harmonogram tygodniowy
- ✅ Elastyczność - różne godziny w różne dni
- ✅ Możliwość dodania wielu terminów
- ✅ Szybkie presety oszczędzają czas
- ✅ Uwagi do każdego slotu

### Dla admina/technika:
- ✅ Dokładniejsza informacja o dostępności
- ✅ Dostępność powiązana z zamówieniem (nie ginie)
- ✅ Łatwiejsze planowanie wizyt
- ✅ Widoczność uwag klienta

### Dla systemu:
- ✅ Prostsza struktura danych
- ✅ Łatwiejsza walidacja
- ✅ Możliwość algorytmicznego dopasowania terminu
- ✅ Historia dostępności z zamówieniem

---

## 📊 PRZYKŁADY UŻYCIA

### Przykład 1: Klient pracujący

```javascript
availabilitySlots: [
  {
    id: 1728123456789,
    dateFrom: "2025-10-06",
    dateTo: "2025-10-06",
    timeFrom: "18:00",
    timeTo: "20:00",
    notes: "Po pracy"
  },
  {
    id: 1728123456890,
    dateFrom: "2025-10-07",
    dateTo: "2025-10-07",
    timeFrom: "18:00",
    timeTo: "20:00",
    notes: "Po pracy"
  },
  {
    id: 1728123456991,
    dateFrom: "2025-10-09",
    dateTo: "2025-10-09",
    timeFrom: "10:00",
    timeTo: "18:00",
    notes: "Sobota - cały dzień"
  }
]
```

### Przykład 2: Klient na urlopie

```javascript
availabilitySlots: [
  {
    id: 1728123456789,
    dateFrom: "2025-10-06",
    dateTo: "2025-10-13",
    timeFrom: "08:00",
    timeTo: "20:00",
    notes: "Jestem na urlopie - każdy dzień OK"
  }
]
```

### Przykład 3: Klient elastyczny

```javascript
availabilitySlots: [
  {
    id: 1728123456789,
    dateFrom: "2025-10-06",
    dateTo: "2025-10-15",
    timeFrom: "08:00",
    timeTo: "20:00",
    notes: "Jestem w domu, proszę tylko zadzwonić 30 min przed"
  }
]
```

---

## 🔧 ROZSZERZENIA (TODO)

### Funkcje do dodania:
- [ ] Kopiowanie slotu (duplikuj z edycją)
- [ ] Szablon slotów (zapisz jako preset)
- [ ] Powtarzające się sloty (np. każdy poniedziałek)
- [ ] Import z kalendarza (Google Calendar, iCal)
- [ ] Wykrywanie konfliktów (overlapping slots)
- [ ] Sugestie oparte na historii

### Integracje:
- [ ] Panel admina - wyświetlanie slotów przy planowaniu
- [ ] Panel technika - widoczność dostępności
- [ ] Algorytm dopasowania - automatyczne sugerowanie
- [ ] Powiadomienia - przypomnienie klientowi o wizycie

---

## 📁 PLIKI ZMODYFIKOWANE

### Utworzone:
1. `components/FlexibleAvailabilitySelector.js` (nowy komponent)

### Zmodyfikowane:
1. `pages/client/new-order.js`
   - Import komponentu
   - Zmiana stanu: `availabilitySlots: []`
   - Zastąpienie starej sekcji nowym komponentem

2. `pages/api/client/create-order.js`
   - Dodanie `availabilitySlots` do obiektu zamówienia
   - Logging liczby slotów

---

## ✅ STATUS IMPLEMENTACJI

- ✅ Komponent FlexibleAvailabilitySelector utworzony
- ✅ Integracja z formularzem new-order.js
- ✅ API zapisuje availabilitySlots
- ✅ Logging w konsoli
- ⏳ Panel admina (TODO)
- ⏳ Panel technika (TODO)
- ⏳ Algorytm dopasowania (TODO)

---

## 🧪 TESTOWANIE

### Scenariusze testowe:

1. **Test 1: Brak slotów**
   - Złóż zamówienie bez dodawania slotów
   - Sprawdź: `availabilitySlots: []` w orders.json

2. **Test 2: Jeden slot**
   - Dodaj jeden slot (jutro, 8-20)
   - Sprawdź: slot zapisany poprawnie

3. **Test 3: Wiele slotów**
   - Dodaj 3 sloty z różnymi datami/godzinami
   - Sprawdź: wszystkie 3 sloty w orders.json

4. **Test 4: Presety czasowe**
   - Użyj presetów (rano, popołudnie, etc.)
   - Sprawdź: godziny ustawione poprawnie

5. **Test 5: Uwagi**
   - Dodaj uwagi do slotów
   - Sprawdź: uwagi zapisane w orders.json

6. **Test 6: Edycja slotu**
   - Zmień daty/godziny slotu
   - Sprawdź: zmiany zapisane

7. **Test 7: Usuwanie slotu**
   - Usuń slot
   - Sprawdź: slot usunięty z listy

---

## 📞 WSPARCIE

W razie problemów:
1. Sprawdź konsolę przeglądarki (błędy JS)
2. Sprawdź logi serwera (terminal z `npm run dev`)
3. Sprawdź `orders.json` - czy `availabilitySlots` są zapisane

**Status:** ✅ GOTOWE DO TESTOWANIA  
**Data wdrożenia:** 5 października 2025, 22:45
