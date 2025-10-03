# 🧪 INSTRUKCJA TESTOWANIA NAPRAW

## Jak przetestować wszystkie naprawy

---

## 1️⃣ Test pobierania pracowników

### Intelligent Planner
1. Otwórz: http://localhost:3000/panel-przydzial-zlecen
2. Sprawdź dropdown "Wybierz serwisanta" w prawym górnym rogu
3. **Oczekiwany rezultat:**
   - ✅ Lista 8 pracowników z employees.json:
     * Jan Kowalski
     * Anna Nowak
     * Jan Serwisant
     * Anna Technik
     * Piotr Chłodnictwo
     * Tomasz Elektryk
     * Marek Pralkowski
     * Karolina Kucharska
   - ✅ NIE MA sztywno zapisanych pracowników
   - ✅ Pierwszy pracownik wybrany domyślnie

---

## 2️⃣ Test dodawania wizyt

### Szczegóły zlecenia
1. Otwórz: http://localhost:3000/panel-przydzial-zlecen
2. Kliknij dowolne zlecenie z listy
3. W modalu kliknij "📝 Edytuj zlecenie"
4. Przejdź do sekcji "Wizyty"
5. Kliknij "➕ Dodaj wizytę"

### Sprawdź modal:
- ✅ Tytuł: "Nowa wizyta" z ikoną kalendarza
- ✅ Przycisk X w prawym górnym rogu
- ✅ Pola:
  * Data (input date)
  * Godzina (input time)
  * Typ wizyty - 4 przyciski w grid 2x2:
    - 🔍 Diagnoza (niebieski)
    - 🔧 Naprawa (zielony)
    - ✅ Kontrola (fioletowy)
    - 📦 Montaż (pomarańczowy)
  * Serwisant (dropdown z prawdziwymi pracownikami)
  * Szacowany czas (dropdown: 30min - 4h)
  * Notatka (textarea opcjonalny)

### Test dodawania:
1. Wybierz datę: jutro
2. Wybierz godzinę: 10:00
3. Kliknij typ: 🔍 Diagnoza
4. Wybierz serwisanta: Jan Kowalski
5. Wybierz czas: 1 godzina
6. Dodaj notatkę: "Test wizyta"
7. Kliknij "✓ Dodaj wizytę"

**Oczekiwany rezultat:**
- ✅ Notyfikacja: "Wizyta została dodana i zapisana"
- ✅ Nowa wizyta pojawia się na liście
- ✅ Widać: datę, godzinę, typ (🔍 Diagnoza), czas (60 min)
- ✅ Widać: "👨‍🔧 Jan Kowalski"
- ✅ Status: "Zaplanowana" (niebieski badge)

---

## 3️⃣ Test edycji wizyt

1. W liście wizyt znajdź właśnie dodaną wizytę
2. Kliknij ikonę ✏️ (Edytuj)
3. Zmień typ na: 🔧 Naprawa
4. Zmień serwisanta na: Anna Technik
5. Zmień czas na: 2 godziny
6. Kliknij "✓ Zapisz zmiany"

**Oczekiwany rezultat:**
- ✅ Notyfikacja: "Wizyta została zaktualizowana i zapisana"
- ✅ Wizyta zaktualizowana na liście
- ✅ Typ: 🔧 Naprawa
- ✅ Serwisant: 👨‍🔧 Anna Technik
- ✅ Czas: 120 min

---

## 4️⃣ Test usuwania wizyt

1. W liście wizyt znajdź wizytę testową
2. Kliknij ikonę 🗑️ (Usuń)
3. Potwierdź usunięcie w dialogu

**Oczekiwany rezultat:**
- ✅ Dialog potwierdzenia: "Czy na pewno chcesz usunąć tę wizytę?"
- ✅ Po potwierdzeniu notyfikacja: "Wizyta została usunięta i zapisana"
- ✅ Wizyta znika z listy
- ✅ Zapis w orders.json (wizyta usunięta z array)

---

## 5️⃣ Test przycisku "Zapisz Plan"

### Intelligent Planner
1. Otwórz: http://localhost:3000/panel-przydzial-zlecen
2. Wybierz serwisanta z dropdown
3. Kliknij "🔄 Załaduj Plan" (jeśli nie jest załadowany)
4. Poczekaj aż plan się wygeneruje
5. Sprawdź czy widzisz wizyty w kalendarzu tygodnia
6. Kliknij "💾 Zapisz Plan"

**Oczekiwany rezultat:**
- ✅ Loading indicator podczas zapisu
- ✅ Notyfikacja: "✅ Plan zapisany! Utworzono X wizyt dla Y zleceń"
- ✅ Automatyczne odświeżenie danych po 1 sekundzie
- ✅ W orders.json wizyty z `technicianId` wybranego serwisanta
- ✅ Wizyty mają pola:
  * `visitId` (format VIS...)
  * `technicianId` (EMP...)
  * `technicianName` (np. "Jan Kowalski")
  * `scheduledDate` (data z planu)
  * `scheduledTime` (godzina z planu)
  * `status: "scheduled"`

---

## 6️⃣ Test wszystkich typów wizyt

1. Dodaj 4 wizyty, każda innego typu:
   - Wizyta 1: 🔍 Diagnoza (jutro, 9:00)
   - Wizyta 2: 🔧 Naprawa (jutro, 11:00)
   - Wizyta 3: ✅ Kontrola (pojutrze, 10:00)
   - Wizyta 4: 📦 Montaż (pojutrze, 14:00)

2. Sprawdź listę wizyt

**Oczekiwany rezultat:**
- ✅ Wszystkie 4 wizyty widoczne
- ✅ Każda ma właściwą ikonę i nazwę
- ✅ Kolory przycisków w modalu odpowiadają typom
- ✅ Lista pokazuje prawidłowy typ dla każdej wizyty

---

## 7️⃣ Test zmian statusu

1. Dla wizyty "Zaplanowana" kliknij ▶️ (Rozpocznij)
2. Status zmieni się na "W trakcie" (żółty badge)
3. Kliknij ✓ (Zakończ)
4. Status zmieni się na "Zakończona" (zielony badge)

**Oczekiwany rezultat:**
- ✅ Każda zmiana statusu zapisana do bazy
- ✅ Notyfikacje potwierdzające
- ✅ Badge zmienia kolor:
  * Zaplanowana - niebieski
  * W trakcie - żółty
  * Zakończona - zielony
  * Anulowana - czerwony

---

## 8️⃣ Test anulowania wizyty

1. Dla wizyty "Zaplanowana" lub "W trakcie" kliknij ✕ (Anuluj)
2. Potwierdź anulowanie

**Oczekiwany rezultat:**
- ✅ Dialog: "Czy na pewno chcesz anulować tę wizytę?"
- ✅ Notyfikacja: "Wizyta anulowana i zapisana"
- ✅ Status: "Anulowana" (czerwony badge)
- ✅ Brak możliwości zmiany statusu (brak przycisków akcji)

---

## 9️⃣ Test danych w orders.json

Po każdym teście sprawdź plik `data/orders.json`:

```json
{
  "id": 1001,
  "visits": [
    {
      "visitId": "VIS1727875320123",
      "type": "diagnosis",
      "scheduledDate": "2025-10-03",
      "scheduledTime": "10:00",
      "estimatedDuration": 60,
      "status": "scheduled",
      "assignedTo": "EMP25189001",
      "notes": "Test wizyta",
      "createdAt": "2025-10-02T...",
      "updatedAt": "2025-10-02T..."
    }
  ]
}
```

**Sprawdź:**
- ✅ Wszystkie wizyty mają `visitId` (nie `id`)
- ✅ `assignedTo` to ID pracownika (EMP...)
- ✅ `type` to jeden z: diagnosis, repair, control, installation
- ✅ Daty są w formacie ISO
- ✅ `estimatedDuration` to liczba minut

---

## 🔟 Test pracowników w dropdown

### W modal dodawania wizyty:
1. Kliknij dropdown "Serwisant"
2. Sprawdź listę

**Oczekiwany rezultat:**
- ✅ Placeholder: "Wybierz serwisanta"
- ✅ 8 opcji z prawdziwymi pracownikami:
  1. 👨‍🔧 Jan Kowalski
  2. 👨‍🔧 Anna Nowak
  3. 👨‍🔧 Jan Serwisant
  4. 👨‍🔧 Anna Technik
  5. 👨‍🔧 Piotr Chłodnictwo
  6. 👨‍🔧 Tomasz Elektryk
  7. 👨‍🔧 Marek Pralkowski
  8. 👨‍🔧 Karolina Kucharska
- ✅ NIE MA starych pracowników (jan_kowalski, anna_nowak, itp.)
- ✅ Jeśli employees.json jest pusty: "Ładowanie pracowników..."

---

## ✅ Checklist testów

Zaznacz po każdym udanym teście:

- [ ] 1. Pracownicy z API w Intelligent Planner
- [ ] 2. Dodawanie nowej wizyty
- [ ] 3. Edycja istniejącej wizyty
- [ ] 4. Usuwanie wizyty
- [ ] 5. Zapisywanie planu tygodniowego
- [ ] 6. Wszystkie 4 typy wizyt
- [ ] 7. Zmiana statusu wizyty
- [ ] 8. Anulowanie wizyty
- [ ] 9. Poprawność danych w orders.json
- [ ] 10. Pracownicy w dropdown modala

---

## 🐛 Zgłaszanie błędów

Jeśli coś nie działa:

1. Otwórz Console (F12)
2. Sprawdź błędy w zakładce "Console"
3. Sprawdź Network (zakładka "Network") - czy API zwraca 200 OK
4. Sprawdź orders.json - czy dane się zapisują
5. Sprawdź employees.json - czy pracownicy są dostępni

### Typowe problemy:

**Problem:** Brak pracowników w dropdown
- **Rozwiązanie:** Sprawdź czy employees.json ma pracowników z `"isActive": true`

**Problem:** Wizyty się nie zapisują
- **Rozwiązanie:** Sprawdź API `/api/orders` - czy PATCH działa

**Problem:** Błąd "Cannot read visitId"
- **Rozwiązanie:** Sprawdź czy wszystkie wizyty w orders.json mają `visitId` zamiast `id`

---

## 📊 Metryki sukcesu

Po wszystkich testach:
- ✅ 10/10 testów przeszło pomyślnie
- ✅ Brak błędów w konsoli
- ✅ Wszystkie API zwracają 200 OK
- ✅ orders.json ma poprawną strukturę
- ✅ UI jest responsywny i intuicyjny

---

**Powodzenia w testowaniu! 🚀**
