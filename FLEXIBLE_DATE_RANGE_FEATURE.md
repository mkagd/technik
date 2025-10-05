# 📅 Elastyczny zakres dat w rezerwacjach - Dokumentacja

## 📋 Spis treści
1. [Przegląd funkcji](#przegląd-funkcji)
2. [Jak działa](#jak-działa)
3. [Interfejs użytkownika](#interfejs-użytkownika)
4. [Struktura danych](#struktura-danych)
5. [Przykłady użycia](#przykłady-użycia)
6. [Walidacja](#walidacja)

---

## 🎯 Przegląd funkcji

**Problem:**
- Klienci często są elastyczni co do terminu wizyty
- Admin musiał wybierać konkretną datę, nawet jeśli klient mówił "dowolny dzień w tym tygodniu"
- Trudno było oznaczyć, że termin jest do ustalenia

**Rozwiązanie:**
- Checkbox "📅 Klient jest elastyczny - wybierz zakres dat"
- Możliwość wyboru zakresu dat (od - do)
- Automatyczne oznaczanie rezerwacji jako elastycznej
- Wizualne podglądy wybranego zakresu

---

## 🔧 Jak działa

### **Tryb 1: Konkretna data (domyślny)**
```
□ Klient jest elastyczny - wybierz zakres dat

Data wizyty *: [15.10.2025]
Preferowana godzina: [14:00]
```

Admin wybiera **konkretną datę** - standardowa rezerwacja.

### **Tryb 2: Zakres dat (elastyczny)**
```
☑ Klient jest elastyczny - wybierz zakres dat

Data od *: [15.10.2025]
Data do *: [20.10.2025]
Preferowana godzina: [14:00] (opcjonalna)
```

Admin wybiera **zakres dat** - klient akceptuje dowolny dzień z tego zakresu.

---

## 🎨 Interfejs użytkownika

### **1. Checkbox przełączający tryb**

```jsx
<label className="flex items-center gap-2">
  <input type="checkbox" checked={formData.useDateRange} />
  <span>📅 Klient jest elastyczny - wybierz zakres dat</span>
</label>
<p className="text-xs text-gray-500">
  {useDateRange 
    ? 'Klient może przyjąć technika w dowolnym dniu z wybranego zakresu' 
    : 'Wybierz konkretną datę wizyty'}
</p>
```

**Widok:**
```
□ 📅 Klient jest elastyczny - wybierz zakres dat
  Wybierz konkretną datę wizyty
```

Po zaznaczeniu:
```
☑ 📅 Klient jest elastyczny - wybierz zakres dat
  Klient może przyjąć technika w dowolnym dniu z wybranego zakresu
```

### **2. Pola dat (tryb normalny)**

```
┌─────────────────────────────┐
│ Data wizyty *               │
│ [dd.mm.rrrr]                │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Preferowana godzina         │
│ [--:--]                     │
└─────────────────────────────┘
```

### **3. Pola dat (tryb zakresowy)**

```
┌──────────────┐  ┌──────────────┐
│ Data od *    │  │ Data do *    │
│ [dd.mm.rrrr] │  │ [dd.mm.rrrr] │
└──────────────┘  └──────────────┘

┌────────────────────────────────────┐
│ Preferowana godzina                │
│ [--:--]                            │
│ Opcjonalnie: preferowana godzina   │
│ dla każdego dnia z zakresu         │
└────────────────────────────────────┘
```

### **4. Podgląd wybranego zakresu**

Po wybraniu obu dat pojawia się info box:

```
┌───────────────────────────────────────────┐
│ 📅 Zakres: 15 października 2025 -         │
│            20 października 2025 (6 dni)   │
└───────────────────────────────────────────┘
```

### **5. Sidebar - Preview**

W prawym panelu wyświetla się podgląd:

**Tryb normalny:**
```
┌────────────────────────────┐
│ 📆 Termin wizyty           │
│                            │
│ środa, 15 października     │
│ 2025                       │
│                            │
│ 🕐 Godzina: 14:00          │
└────────────────────────────┘
```

**Tryb elastyczny:**
```
┌────────────────────────────┐
│ 📅 Elastyczny termin       │
│                            │
│ 15 października 2025 →     │
│ 20 października 2025       │
│                            │
│ Klient elastyczny          │
│ (6 dni do wyboru)          │
│                            │
│ 🕐 Godzina: 14:00          │
└────────────────────────────┘
```

---

## 📊 Struktura danych

### **FormData State**

```javascript
const [formData, setFormData] = useState({
  // ... inne pola ...
  
  // Stare pole (dla kompatybilności)
  date: '',
  
  // Nowe pola
  dateFrom: '',
  dateTo: '',
  useDateRange: false,  // ← Checkbox
  
  time: '',
  // ... reszta pól ...
});
```

### **Submit Data**

**Tryb normalny (useDateRange = false):**
```json
{
  "date": "2025-10-15",
  "time": "14:00",
  "useDateRange": false,
  "dateRange": null,
  "isFlexibleDate": false
}
```

**Tryb elastyczny (useDateRange = true):**
```json
{
  "date": "",
  "dateFrom": "2025-10-15",
  "dateTo": "2025-10-20",
  "time": "14:00",
  "useDateRange": true,
  "dateRange": {
    "from": "2025-10-15",
    "to": "2025-10-20",
    "flexible": true
  },
  "isFlexibleDate": true
}
```

### **Zapis w rezerwacje.json**

```json
{
  "id": "REZ25001001",
  "clientName": "Jan Kowalski",
  "date": "2025-10-15",
  "time": "14:00",
  "dateRange": {
    "from": "2025-10-15",
    "to": "2025-10-20",
    "flexible": true
  },
  "isFlexibleDate": true,
  "status": "pending"
}
```

**Jak to interpretować:**
- Jeśli `isFlexibleDate === true` → klient elastyczny, patrz na `dateRange`
- Jeśli `isFlexibleDate === false` → konkretna data, patrz na `date`
- Pole `date` zawsze jest wypełnione (dla kompatybilności z starym API)

---

## 🎓 Przykłady użycia

### **Scenariusz 1: Klient z konkretnym terminem**

**Sytuacja:**
- Klient dzwoni: "Potrzebuję naprawy pralki 15 października o 14:00"
- Termin jest konkretny i ustalony

**Kroki:**
1. Admin wchodzi: `/admin/rezerwacje/nowa`
2. Wypełnia dane klienta
3. Dodaje urządzenie (pralka)
4. W sekcji "Szczegóły wizyty":
   - **NIE zaznacza** checkboxa
   - Data wizyty: `15.10.2025`
   - Preferowana godzina: `14:00`
5. Klika "Utwórz rezerwację"

**Rezultat:**
```json
{
  "date": "2025-10-15",
  "time": "14:00",
  "isFlexibleDate": false
}
```

### **Scenariusz 2: Klient elastyczny "w tym tygodniu"**

**Sytuacja:**
- Klient dzwoni: "Potrzebuję naprawy lodówki, dowolny dzień w tym tygodniu, najlepiej po południu"
- Klient jest bardzo elastyczny

**Kroki:**
1. Admin wchodzi: `/admin/rezerwacje/nowa`
2. Wypełnia dane klienta
3. Dodaje urządzenie (lodówka)
4. W sekcji "Szczegóły wizyty":
   - **ZAZNACZA** checkbox "Klient jest elastyczny"
   - Data od: `15.10.2025` (poniedziałek)
   - Data do: `20.10.2025` (sobota)
   - Preferowana godzina: `14:00`
5. Sidebar pokazuje: "📅 Elastyczny termin (6 dni do wyboru)"
6. Klika "Utwórz rezerwację"

**Rezultat:**
```json
{
  "date": "2025-10-15",
  "dateFrom": "2025-10-15",
  "dateTo": "2025-10-20",
  "time": "14:00",
  "isFlexibleDate": true,
  "dateRange": {
    "from": "2025-10-15",
    "to": "2025-10-20",
    "flexible": true
  }
}
```

**Co dalej:**
- Dispatcher widzi, że klient jest elastyczny
- Może zaplanować wizytę w dowolnym dniu z zakresu
- System może sugerować optymalne dni (na podstawie trasy innych wizyt)

### **Scenariusz 3: Klient "w przyszłym miesiącu"**

**Sytuacja:**
- Klient: "Potrzebuję przeglądu klimatyzacji, dowolny dzień w listopadzie"

**Kroki:**
1. Zaznacz checkbox elastyczny
2. Data od: `01.11.2025`
3. Data do: `30.11.2025`
4. Preferowana godzina: pusta (bez preferencji)

**Rezultat:**
```json
{
  "dateRange": {
    "from": "2025-11-01",
    "to": "2025-11-30",
    "flexible": true
  },
  "isFlexibleDate": true,
  "time": ""
}
```

Dispatcher ma **cały miesiąc** na zaplanowanie wizyty.

---

## ✅ Walidacja

### **Tryb normalny (useDateRange = false)**

```javascript
if (!formData.date) {
  errors.date = 'Data wizyty wymagana';
}
```

**Komunikaty błędów:**
- ❌ "Data wizyty wymagana" - pole puste

### **Tryb elastyczny (useDateRange = true)**

```javascript
if (!formData.dateFrom) {
  errors.dateFrom = 'Data początkowa wymagana';
}

if (!formData.dateTo) {
  errors.dateTo = 'Data końcowa wymagana';
}

if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
  errors.dateTo = 'Data końcowa musi być późniejsza niż początkowa';
}
```

**Komunikaty błędów:**
- ❌ "Data początkowa wymagana" - pole "Data od" puste
- ❌ "Data końcowa wymagana" - pole "Data do" puste
- ❌ "Data końcowa musi być późniejsza niż początkowa" - `dateTo < dateFrom`

### **Automatyczne ograniczenia**

```html
<!-- Data od -->
<input 
  type="date" 
  min={new Date().toISOString().split('T')[0]}
/>

<!-- Data do -->
<input 
  type="date" 
  min={formData.dateFrom || new Date().toISOString().split('T')[0]}
/>
```

**Efekty:**
- Nie można wybrać daty wcześniejszej niż dziś
- "Data do" nie może być wcześniejsza niż "Data od"
- Przeglądarki natywnie blokują nieprawidłowe wybory

---

## 🔮 Przyszłe rozszerzenia

### **Faza 1 (obecna)** ✅
- Checkbox przełączający tryb
- Wybór zakresu dat
- Walidacja
- Podglądy w sidebar

### **Faza 2 (TODO)** 🔄
- **Panel dyspatchera:** lista rezerwacji z oznaczeniem elastycznych
- **Filtry:** "Tylko elastyczne terminy" / "Tylko konkretne daty"
- **Sugestie AI:** "Najlepszy dzień z zakresu to 17.10 (mniej wizyt)"

### **Faza 3 (TODO)** 🔮
- **Kalendarz wizualizujący zakresy:** paski pokazujące elastyczne terminy
- **Automatyczne planowanie:** AI wybiera dzień z zakresu na podstawie trasy
- **Powiadomienia klientowi:** "Wybraliśmy 17.10 - czy pasuje?"

---

## 📚 Pliki zmienione

### **1. `pages/admin/rezerwacje/nowa.js`**

**Dodane:**
- `useDateRange`, `dateFrom`, `dateTo` w state
- Checkbox przełączający tryb
- Warunkowe renderowanie pól (pojedyncza data vs zakres)
- Walidacja dla obu trybów
- Podgląd w sidebar
- Info box z liczbą dni w zakresie

**Linie kodu:** ~900 linii (dodano ~150 linii)

### **2. `FLEXIBLE_DATE_RANGE_FEATURE.md`** ← TEN PLIK

Kompletna dokumentacja funkcji.

---

## 🧪 Jak przetestować

### **Test 1: Tryb normalny**
```
1. Otwórz: http://localhost:3000/admin/rezerwacje/nowa
2. NIE zaznaczaj checkboxa "Klient jest elastyczny"
3. Wypełnij formularz:
   - Imię: Jan Kowalski
   - Telefon: 123456789
   - Adres: ul. Testowa 1, Warszawa
   - Urządzenie: Pralka
   - Data: jutrzejsza
   - Godzina: 14:00
4. Sprawdź sidebar → powinno być "📆 Termin wizyty"
5. Kliknij "Utwórz rezerwację"
6. ✅ Rezerwacja utworzona z konkretną datą
```

### **Test 2: Tryb elastyczny**
```
1. Otwórz: http://localhost:3000/admin/rezerwacje/nowa
2. ZAZNACZ checkbox "Klient jest elastyczny"
3. Wypełnij formularz:
   - Imię: Anna Nowak
   - Telefon: 987654321
   - Adres: ul. Kwiatowa 5, Kraków
   - Urządzenie: Lodówka
   - Data od: jutro
   - Data do: jutro + 7 dni
   - Godzina: 15:00
4. Sprawdź:
   - Info box pod datami → "Zakres: ... (8 dni)"
   - Sidebar → "📅 Elastyczny termin (8 dni do wyboru)"
5. Kliknij "Utwórz rezerwację"
6. ✅ Rezerwacja utworzona z zakresem dat
```

### **Test 3: Walidacja**
```
1. Zaznacz checkbox elastyczny
2. Zostaw pola puste
3. Kliknij "Utwórz"
4. ✅ Błąd: "Data początkowa wymagana"

5. Wpisz "Data od: 20.10.2025"
6. Wpisz "Data do: 15.10.2025" (wcześniejsza!)
7. Kliknij "Utwórz"
8. ✅ Błąd: "Data końcowa musi być późniejsza niż początkowa"
```

### **Test 4: Przełączanie trybu**
```
1. Wpisz pojedynczą datę: 15.10.2025
2. Zaznacz checkbox elastyczny
3. ✅ Pole "Data wizyty" zostaje wyczyszczone
4. ✅ Pojawiają się pola "Data od" i "Data do"

5. Wpisz zakres: 15.10-20.10
6. Odznacz checkbox
7. ✅ Pola zakresu zostają wyczyszczone
8. ✅ Wraca pole "Data wizyty"
```

---

## ✅ Podsumowanie

**Co zostało dodane:**
- ✅ Checkbox przełączający tryb (konkretna vs elastyczna)
- ✅ Dwa pola dat (od-do) w trybie elastycznym
- ✅ Walidacja dla obu trybów
- ✅ Automatyczne czyszczenie pól przy przełączaniu
- ✅ Info box z liczbą dni w zakresie
- ✅ Sidebar z podglądem wybranego terminu
- ✅ Dodatkowe pola w `submitData`: `dateRange`, `isFlexibleDate`

**Korzyści:**
- 🎯 Lepsze odzwierciedlenie rzeczywistych scenariuszy
- 🤝 Większa elastyczność dla klientów
- 📊 Łatwiejsze planowanie dla dyspatcherów
- 🤖 Możliwość inteligentnej optymalizacji tras (przyszłość)

**Status:** ✅ **Ukończone i gotowe do użycia**

---

**Data stworzenia:** 2025-10-04  
**Wersja:** 1.0  
**Autor:** System AI + Developer
