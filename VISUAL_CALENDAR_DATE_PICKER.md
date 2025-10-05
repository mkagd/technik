# 📅 Wizualny Kalendarz Date Range Picker - Dokumentacja

## 🎯 Czym się różni od poprzedniej wersji?

### **Przed (v1 - checkbox + pola tekstowe):**
```
☑ Klient jest elastyczny - wybierz zakres dat

Data od: [____] Data do: [____]
```
- Trzeba kliknąć checkbox
- Wpisać daty ręcznie
- **2 kliknięcia + wpisywanie**

### **Teraz (v2 - wizualny kalendarz):**
```
┌─────────────────────────────────┐
│ [📆 Konkretna data] [📅 Elastyczny zakres] │
├─────────────────────────────────┤
│ 👆 Kliknij datę...              │
├─────────────────────────────────┤
│  Pon  Wt  Śr  Czw  Pt  Sob  Nie│
│   1   2   3   4   5   6   7    │
│   8   9  10  11  12  13  14    │
│  15  [16] 17  18  19  20  21    │ ← kliknięcie
│  22  23  24  25  26  27  28    │
│  29  30  31                     │
├─────────────────────────────────┤
│ Wybrana data: 16 października   │
└─────────────────────────────────┘
```
- Kalendarz zawsze widoczny
- Przełącznik na górze (2 przyciski)
- Kliknięcie dat bezpośrednio
- **1-2 kliknięcia, zero wpisywania**

---

## 🚀 Główne zalety

1. **Mniej kliknięć** - od razu widać kalendarz
2. **Wizualne** - widzisz cały miesiąc
3. **Intuicyjne** - zaznaczanie zakresu jak w hotelach
4. **Podgląd na żywo** - od razu widać wybór
5. **Bez błędów** - niemożliwe wpisać nieprawidłowej daty
6. **Mobile-friendly** - łatwiej kliknąć niż wpisać datę na telefonie

---

## 🎨 Komponenty

### **1. DateRangePicker.js** (nowy komponent)

**Lokalizacja:** `components/DateRangePicker.js`

**Props:**
```typescript
interface DateRangePickerProps {
  mode: 'single' | 'range';              // Tryb pracy
  onModeChange: (mode) => void;           // Callback zmiany trybu
  selectedDate: string;                   // Wybrana data (YYYY-MM-DD)
  selectedRange: { from, to };            // Wybrany zakres
  onDateChange: (date) => void;           // Callback pojedynczej daty
  onRangeChange: (range) => void;         // Callback zakresu
  minDate: Date;                          // Minimalna data (domyślnie dziś)
}
```

**Funkcje:**
- ✅ Renderowanie kalendarza miesiąca
- ✅ Nawigacja prev/next month
- ✅ Oznaczanie wybranych dni
- ✅ Blokowanie przeszłych dat
- ✅ Zaznaczanie zakresu (kolor tła)
- ✅ Podgląd na żywo pod kalendarzem
- ✅ Highlight dzisiejszego dnia (ring)

---

## 🎨 UI/UX

### **Przełącznik trybów (na górze)**

```
┌──────────────┬──────────────┐
│ 📆 Konkretna │ 📅 Elastyczny│
│    data      │    zakres    │
└──────────────┴──────────────┘
```

**Aktywny przycisk:**
- Tryb single: niebieski (`bg-blue-600 text-white`)
- Tryb range: zielony (`bg-green-600 text-white`)

**Nieaktywny:**
- Szary (`bg-gray-100 text-gray-700`)

### **Info box (podpowiedź)**

**Tryb single:**
```
┌────────────────────────────────┐
│ 👆 Kliknij datę, aby wybrać    │
│    konkretny termin wizyty     │
└────────────────────────────────┘
```

**Tryb range:**
```
┌────────────────────────────────┐
│ 👆 Kliknij pierwszą datę,      │
│    potem drugą, aby wybrać     │
│    zakres                      │
└────────────────────────────────┘
```

### **Kalendarz - kolory**

**Dzisiejsza data:**
- `ring-2 ring-blue-400` (niebieski pierścień)

**Data wybrana (single mode):**
- `bg-blue-600 text-white font-semibold`

**Dni w zakresie (range mode):**
- Tło: `bg-green-100 text-green-900`
- Początek/koniec: `bg-green-600 text-white font-semibold`

**Data zablokowana (przeszłość):**
- `text-gray-300 cursor-not-allowed`

**Data dostępna (hover):**
- `hover:bg-blue-50`

### **Podgląd pod kalendarzem**

**Single - wybrana data:**
```
Wybrana data: środa, 16 października 2025
```

**Range - wybieranie (tylko start):**
```
Data początkowa: 16 października
👆 Kliknij drugą datę, aby zakończyć zakres
```

**Range - wybrane obie:**
```
Zakres: 16 października → 20 października 2025
(5 dni)
```

---

## 🔧 Logika działania

### **Tryb Single (konkretna data)**

```javascript
1. Kliknięcie daty → onDateChange('2025-10-16')
2. Data zostaje podświetlona
3. Sidebar aktualizuje się
```

### **Tryb Range (zakres)**

```javascript
// Pierwszy klik
1. Kliknięcie daty → onRangeChange({ from: '2025-10-16', to: null })
2. Data podświetla się jako start
3. Komunikat: "Kliknij drugą datę..."

// Drugi klik
4. Kliknięcie daty → onRangeChange({ from: '2025-10-16', to: '2025-10-20' })
5. Cały zakres podświetla się zielonym
6. Komunikat: "Zakres: ... (5 dni)"

// Trzeci klik (reset)
7. Kliknięcie nowej daty → onRangeChange({ from: '2025-10-22', to: null })
8. Rozpoczyna się nowy zakres
```

**Smart logic:** Jeśli klikniesz datę wcześniejszą niż start, automatycznie się zamieni!

```javascript
// Start: 20.10
// Klik: 16.10 (wcześniej!)
// Result: { from: '16.10', to: '20.10' } ✅
```

---

## 📊 Integracja z formularzem

### **State (nowy)**

```javascript
const [formData, setFormData] = useState({
  // ... inne pola ...
  date: '',                    // Pojedyncza data
  dateRange: {                 // Zakres
    from: '',
    to: ''
  },
  dateMode: 'single',          // Tryb: 'single' | 'range'
  time: ''                     // Preferowana godzina
});
```

### **Użycie w JSX**

```jsx
<DateRangePicker
  mode={formData.dateMode}
  onModeChange={(mode) => {
    setFormData(prev => ({
      ...prev,
      dateMode: mode,
      // Wyczyść odpowiednie pola
      date: mode === 'range' ? '' : prev.date,
      dateRange: mode === 'single' ? { from: '', to: '' } : prev.dateRange
    }));
  }}
  selectedDate={formData.date}
  selectedRange={formData.dateRange}
  onDateChange={(date) => {
    setFormData(prev => ({ ...prev, date }));
  }}
  onRangeChange={(range) => {
    setFormData(prev => ({ ...prev, dateRange: range }));
  }}
  minDate={new Date()}
/>
```

### **Submit Data**

**Single mode:**
```json
{
  "date": "2025-10-16",
  "dateMode": "single",
  "isFlexibleDate": false,
  "dateRange": null
}
```

**Range mode:**
```json
{
  "date": "2025-10-16",
  "dateMode": "range",
  "isFlexibleDate": true,
  "dateRange": {
    "from": "2025-10-16",
    "to": "2025-10-20",
    "flexible": true
  }
}
```

---

## 🎓 Przykłady użycia

### **Scenariusz 1: Klient z konkretnym terminem**

```
1. Admin otwiera formularz
2. Kalendarz jest już widoczny
3. Tryb domyślny: "📆 Konkretna data" (niebieski)
4. Admin klika 16.10
5. ✅ Data podświetla się niebieskim
6. Sidebar pokazuje: "📆 Termin wizyty: środa, 16 października"
7. Klik "Utwórz rezerwację"
```

**Kliknięć:** 2 (data + submit)

### **Scenariusz 2: Klient elastyczny "w tym tygodniu"**

```
1. Admin otwiera formularz
2. Klika "📅 Elastyczny zakres" (zmiana na zielony)
3. Klika 16.10 (poniedziałek)
4. ✅ Data podświetla się zielonym
5. Komunikat: "Kliknij drugą datę..."
6. Klika 20.10 (piątek)
7. ✅ Cały zakres 16-20.10 jest zielony
8. Podgląd: "Zakres: 16 października → 20 października (5 dni)"
9. Sidebar: "📅 Elastyczny termin (5 dni do wyboru)"
10. Klik "Utwórz rezerwację"
```

**Kliknięć:** 4 (tryb + start + end + submit)

### **Scenariusz 3: Zmiana miesiąca**

```
1. Obecny miesiąc: październik
2. Klient chce listopad
3. Klik strzałka → (next month)
4. ✅ Kalendarz pokazuje listopad
5. Wybór dat jak normalnie
```

### **Scenariusz 4: Kliknięcie przeszłej daty**

```
1. Próba kliknięcia 10.10 (przeszłość)
2. ❌ Data wyszarzona (text-gray-300)
3. ❌ Kursor: not-allowed
4. ❌ Nic się nie dzieje
```

---

## ✅ Walidacja

```javascript
// Tryb range
if (formData.dateMode === 'range') {
  if (!formData.dateRange.from) {
    errors.date = 'Data początkowa wymagana';
  }
  if (!formData.dateRange.to) {
    errors.date = 'Data końcowa wymagana';
  }
}

// Tryb single
if (formData.dateMode === 'single') {
  if (!formData.date) {
    errors.date = 'Data wizyty wymagana';
  }
}
```

**Błędy wyświetlają się pod kalendarzem:**
```
┌───────────────────────────┐
│ Kalendarz...              │
└───────────────────────────┘
  ❌ Data wizyty wymagana
```

---

## 🎨 Responsive Design

### **Desktop (≥768px)**

```
┌─────────────────────────────────┐
│  Pon  Wt  Śr  Czw  Pt  Sob  Nie│
│   1   2   3   4   5   6   7    │
│   8   9  10  11  12  13  14    │
│  15  16  17  18  19  20  21    │
└─────────────────────────────────┘
```

**Grid:** `grid-cols-7` (pełne nazwy dni)

### **Mobile (<768px)**

```
┌──────────────────────┐
│ P  W  Ś  C  P  S  N │
│ 1  2  3  4  5  6  7 │
│ 8  9 10 11 12 13 14 │
│15 16 17 18 19 20 21 │
└──────────────────────┘
```

**Grid:** `grid-cols-7` (skrócone nazwy)  
**Touch-friendly:** większe klikalne obszary

---

## 🆚 Porównanie z poprzednią wersją

| Feature | v1 (Checkbox) | v2 (Kalendarz) |
|---------|---------------|----------------|
| **Widoczność** | Ukryty (checkbox) | Zawsze widoczny |
| **Kliknięć** | 3-4 | 1-2 |
| **Wpisywanie** | Tak (dd.mm.rrrr) | Nie |
| **Wizualizacja** | Brak | Cały miesiąc |
| **Mobilność** | Trudne | Łatwe (touch) |
| **Błędy** | Możliwe (format) | Niemożliwe |
| **UX** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 📈 Przewaga nowego rozwiązania

### **Dla Admina:**
- ✅ **Szybciej** - mniej kliknięć
- ✅ **Wygodniej** - nie trzeba wpisywać
- ✅ **Mniej błędów** - niemożliwe wpisać zły format
- ✅ **Lepszy UX** - wizualny feedback

### **Dla Klienta (jeśli dodasz w przyszłości):**
- ✅ **Mobile-friendly** - łatwiej kliknąć niż wpisać
- ✅ **Intuicyjne** - jak w hotelach/lotach
- ✅ **Przyjemne** - ładny design

### **Dla Biznesu:**
- ✅ **Mniej support tickets** - intuicyjny interface
- ✅ **Szybsze rezerwacje** - mniej friction
- ✅ **Profesjonalny wygląd** - jak duże systemy

---

## 🔮 Przyszłe rozszerzenia (TODO)

### **Faza 1** ✅ DONE
- Podstawowy kalendarz
- Single/range mode
- Walidacja

### **Faza 2** (możliwe)
- 📅 **Multi-month view** - 2 miesiące obok siebie
- 🎨 **Presety** - "Ten tydzień", "Przyszły tydzień", "W tym miesiącu"
- 🔴 **Zaznaczenie zajętych dni** - czerwone X na dniach z innymi wizytami
- 💡 **Smart suggestions** - zielone kropki na "dobrych" dniach
- ⌨️ **Keyboard navigation** - strzałki, Enter, Escape

### **Faza 3** (advanced)
- 🤖 **AI sugestie** - "Najlepszy dzień: 16.10 (mniej wizyt)"
- 📊 **Heat map** - kolor intensywności (ile wizyt tego dnia)
- 📱 **Swipe gestures** - mobile prev/next month
- 🌐 **i18n** - inne języki

---

## 📚 Pliki zmienione

### **1. `components/DateRangePicker.js`** ← NOWY!
- 280 linii
- Pełna logika kalendarza
- Standalone component (reusable)

### **2. `pages/admin/rezerwacje/nowa.js`**
- Import DateRangePicker
- Zmieniony state (dateMode, dateRange)
- Usunięte stare pola (checkbox + 2 inputy)
- Zaktualizowana walidacja
- Zaktualizowany submit

### **3. `VISUAL_CALENDAR_DATE_PICKER.md`** ← TEN PLIK
- Kompletna dokumentacja

---

## 🧪 Jak przetestować

```bash
1. Odśwież: http://localhost:3000/admin/rezerwacje/nowa

2. TEST 1 - Single mode (domyślny):
   - Kalendarz jest już widoczny (✅)
   - Tryb: "📆 Konkretna data" (niebieski)
   - Kliknij dowolną datę
   - ✅ Data podświetla się niebieskim
   - ✅ Podgląd pod kalendarzem: "Wybrana data: ..."
   - ✅ Sidebar: "📆 Termin wizyty: ..."
   
3. TEST 2 - Range mode:
   - Kliknij "📅 Elastyczny zakres"
   - ✅ Przycisk zmienia się na zielony
   - ✅ Info: "Kliknij pierwszą datę..."
   - Kliknij datę A (np. 16.10)
   - ✅ Data A podświetla się zielonym
   - ✅ Komunikat: "Kliknij drugą datę..."
   - Kliknij datę B (np. 20.10)
   - ✅ Zakres A-B cały zielony
   - ✅ Podgląd: "Zakres: ... (X dni)"
   - ✅ Sidebar: "📅 Elastyczny termin (X dni)"
   
4. TEST 3 - Nawigacja:
   - Kliknij strzałkę → (next month)
   - ✅ Kalendarz przechodzi do następnego miesiąca
   - Kliknij strzałkę ← (prev month)
   - ✅ Wraca do poprzedniego
   
5. TEST 4 - Blokowanie przeszłości:
   - Spróbuj kliknąć wczorajszą datę
   - ✅ Data wyszarzona
   - ✅ Kursor: not-allowed
   - ✅ Nic się nie dzieje
   
6. TEST 5 - Przełączanie trybu:
   - Wybierz datę w single mode
   - Przełącz na range mode
   - ✅ Wybrana data znika (pole czyści się)
   - Wybierz zakres
   - Przełącz na single mode
   - ✅ Zakres znika
   
7. TEST 6 - Walidacja:
   - NIE wybieraj daty
   - Kliknij "Utwórz rezerwację"
   - ✅ Błąd: "Data wizyty wymagana"
```

---

## ✅ Podsumowanie

**Zmienione:**
- ✅ DateRangePicker component (NOWY)
- ✅ Formularz rezerwacji (zamienione pola)
- ✅ State structure (dateMode, dateRange)
- ✅ Walidacja (dostosowana)
- ✅ Submit logic (dateRange object)

**Korzyści:**
- 🚀 **Szybciej** - mniej kliknięć (2 zamiast 4)
- 🎨 **Wizualnie** - widać cały miesiąc
- 📱 **Mobile-friendly** - łatwiej kliknąć
- ✅ **Bez błędów** - niemożliwe wpisać zły format
- 😊 **UX** - jak w hotelach/lotach

**Status:** ✅ **GOTOWE i przetestowane!**

---

**Data stworzenia:** 2025-10-04  
**Wersja:** 2.0 (Wizualny kalendarz)  
**Poprzednia wersja:** 1.0 (Checkbox + pola tekstowe)  
**Autor:** System AI + Developer
