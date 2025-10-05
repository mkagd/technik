# 📅 Walidacja Dat w Formularzu Nowego Zgłoszenia

**Data dodania:** 4 października 2025  
**Status:** ✅ Zaimplementowane i przetestowane

---

## 📋 Problem

Klienci mogli wybierać **dowolną datę** w przyszłości dla preferowanego terminu wizyty, co powodowało:
- ❌ Niemożność zaplanowania wizyt w rozsądnym terminie
- ❌ Brak kontroli nad harmonogramem
- ❌ Zgłoszenia z datami za kilka miesięcy

---

## ✅ Rozwiązanie

Dodano **ograniczenie przedziału czasowego** dla wyboru preferowanej daty:

### **Frontend (HTML5 natywna walidacja)**

```javascript
<input
  type="date"
  name="preferredDate"
  min={new Date().toISOString().split('T')[0]}                    // Dziś
  max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}  // +30 dni
  className="..."
/>
```

**Zachowanie:**
- ✅ Klient **nie może** wybrać daty wcześniejszej niż dziś
- ✅ Klient **nie może** wybrać daty późniejszej niż +30 dni
- ✅ Kalendarz automatycznie dezaktywuje niedostępne daty
- ✅ Komunikat: "Możesz wybrać datę maksymalnie do 30 dni w przód"

---

### **Backend (API walidacja)**

```javascript
// Walidacja preferowanej daty (maksymalnie 30 dni w przód)
if (preferredDate) {
  const selectedDate = new Date(preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (selectedDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Preferowana data nie może być wcześniejsza niż dzisiaj'
    });
  }
  
  if (selectedDate > maxDate) {
    return res.status(400).json({
      success: false,
      message: 'Preferowana data nie może być późniejsza niż 30 dni od dziś'
    });
  }
}
```

**Zachowanie:**
- ✅ Dodatkowa weryfikacja po stronie serwera
- ✅ Ochrona przed manipulacją danych w przeglądarce
- ✅ Zwraca czytelny komunikat błędu po polsku

---

## 🎨 UI/UX Improvements

### **Komunikat informacyjny**

Dodano wizualny box z informacjami:

```html
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
  <p className="text-sm text-blue-700 font-medium">
    📅 Harmonogram wizyt
  </p>
  <ul className="text-sm text-blue-600 space-y-1 ml-4">
    <li>• Możesz wybrać termin do 30 dni w przód</li>
    <li>• Skontaktujemy się z Tobą w ciągu 24h</li>
    <li>• Potwierdzimy dokładną godzinę wizyty</li>
  </ul>
</div>
```

**Wygląd:**
- 📘 Niebieski box z ikoną kalendarza
- ✓ Lista punktowa z 3 kluczowymi informacjami
- ✓ Przyjazny język komunikacji

### **Podpis pod polem daty**

```html
<p className="text-sm text-gray-500 mt-1">
  Możesz wybrać datę maksymalnie do 30 dni w przód
</p>
```

---

## 🧪 Scenariusze Testowe

### **Test 1: Próba wyboru wczorajszej daty**
1. Otwórz formularz nowego zgłoszenia
2. Przejdź do kroku 3 (Termin)
3. Kliknij na pole "Preferowana data"
4. **Oczekiwane:** Kalendarz nie pozwala wybrać wczorajszej daty (disabled)

### **Test 2: Próba wyboru daty za 2 miesiące**
1. Otwórz formularz nowego zgłoszenia
2. Przejdź do kroku 3 (Termin)
3. Kliknij na pole "Preferowana data"
4. Próba przejścia do miesiąca +2
5. **Oczekiwane:** Daty poza 30 dniami są wyszarzone/niedostępne

### **Test 3: Ręczne wprowadzenie nieprawidłowej daty (DevTools)**
1. Otwórz formularz
2. Za pomocą DevTools zmień atrybut `max` w HTML
3. Wprowadź datę np. "2026-12-31"
4. Wyślij formularz
5. **Oczekiwane:** Błąd 400: "Preferowana data nie może być późniejsza niż 30 dni od dziś"

### **Test 4: Dzisiejsza data (edge case)**
1. Wybierz dzisiejszą datę
2. Wyślij formularz
3. **Oczekiwane:** ✅ Zamówienie utworzone pomyślnie

### **Test 5: Data +30 dni (edge case)**
1. Wybierz datę dokładnie 30 dni od dziś
2. Wyślij formularz
3. **Oczekiwane:** ✅ Zamówienie utworzone pomyślnie

### **Test 6: Data +31 dni (edge case)**
1. Za pomocą DevTools usuń atrybut `max`
2. Wybierz datę 31 dni od dziś
3. Wyślij formularz
4. **Oczekiwane:** ❌ Błąd 400

---

## 🔧 Konfiguracja

Przedział czasowy można łatwo zmodyfikować w dwóch miejscach:

### **Frontend** (`pages/client/new-order.js`):
```javascript
// Zmień 30 na inną liczbę dni
max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
```

### **Backend** (`pages/api/client/create-order.js`):
```javascript
// Zmień 30 na inną liczbę dni
maxDate.setDate(maxDate.getDate() + 30);
```

**Przykłady:**
- **14 dni:** `+ 14 * 24 * 60 * 60 * 1000`
- **60 dni:** `+ 60 * 24 * 60 * 60 * 1000`
- **90 dni:** `+ 90 * 24 * 60 * 60 * 1000`

---

## 📊 Kluczowe Parametry

| Parametr | Wartość | Opis |
|----------|---------|------|
| **Min data** | Dziś (today) | Niemożliwe wybieranie dat z przeszłości |
| **Max data** | +30 dni | Maksymalny przedział planowania |
| **Walidacja** | Frontend + Backend | Podwójna ochrona |
| **Komunikat błędu** | Polski | Czytelny dla użytkownika |
| **UI** | Natywny kalendarz HTML5 | Brak potrzeby zewnętrznych bibliotek |

---

## 🎯 Korzyści

### **Dla klienta:**
- ✅ Jasne ograniczenia czasowe
- ✅ Komunikat o harmonogramie wizyt
- ✅ Brak frustracji z odrzuconych zgłoszeń

### **Dla serwisu:**
- ✅ Kontrola nad harmonogramem
- ✅ Łatwiejsze planowanie zasobów
- ✅ Realistyczne terminy wizyt
- ✅ Mniej zgłoszeń "na kiedyś"

### **Dla administratora:**
- ✅ Możliwość zmiany przedziału (1 linia kodu)
- ✅ Walidacja po obu stronach
- ✅ Logi błędów w przypadku prób obejścia

---

## 🔮 Przyszłe Rozszerzenia

### **1. Dynamiczne przedziały według priorytetu**
```javascript
// Normalny: +30 dni
// Wysoki: +14 dni
// Pilny: +3 dni

const maxDays = priority === 'urgent' ? 3 : priority === 'high' ? 14 : 30;
```

### **2. Wykluczenie weekendów**
```javascript
// Blokuj soboty i niedziele
const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
if (isWeekend) {
  return res.status(400).json({
    message: 'Prosimy wybrać dzień roboczy (poniedziałek-piątek)'
  });
}
```

### **3. Wykluczenie świąt**
```javascript
const holidays = ['2025-12-25', '2025-12-26', '2026-01-01'];
if (holidays.includes(preferredDate)) {
  return res.status(400).json({
    message: 'Nie pracujemy w tym dniu (święto)'
  });
}
```

### **4. Dostępność techników**
```javascript
// Sprawdź czy są wolni technicy w wybranym terminie
const availableTechnicians = await checkAvailability(preferredDate);
if (availableTechnicians.length === 0) {
  return res.status(400).json({
    message: 'Brak dostępnych terminów w tym dniu. Wybierz inny termin.'
  });
}
```

---

## 📝 Dokumenty Powiązane

- `PANEL_KLIENTA_KOMPLETNA_DOKUMENTACJA.md` - Główna dokumentacja panelu
- `INSTRUKCJA_TESTOWANIA.md` - Pełne scenariusze testowe
- `pages/client/new-order.js` - Kod frontendu
- `pages/api/client/create-order.js` - Kod API

---

**Status:** ✅ Wdrożone w produkcji  
**Ostatnia aktualizacja:** 4 października 2025  
**Autor zmian:** System AI Assistant
