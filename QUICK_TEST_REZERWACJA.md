# 🧪 QUICK START - Testowanie ulepszeń rezerwacji

## 🚀 Szybki test (5 minut)

### 1. Uruchom aplikację
```bash
npm run dev
```

### 2. Otwórz panel administracyjny
```
http://localhost:3000/admin/rezerwacje
```

### 3. Kliknij "+ Nowa rezerwacja"

### 4. Sprawdź co się zmieniło:

#### ✅ KROK 1: LOKALIZACJA (było: Urządzenie)
- Kod pocztowy
- Miasto  
- Ulica i numer

#### ✅ KROK 2: KONTAKT (było: Lokalizacja)
- Imię i nazwisko - **OPCJONALNE** (nowy tekst: "opcjonalnie")
- Telefon - wymagany
- Email - opcjonalny

#### ✅ KROK 3: URZĄDZENIE (było: Kontakt)
- Wybór kategorii AGD
- Marka, model, problem

#### ✅ KROK 4: DOSTĘPNOŚĆ (bez zmian)
- Terminy wizyt

---

## 🎯 Co zobaczyć w 30 sekund

### Na górze ekranu (sticky):
```
┌─────────────────────────────────────────┐
│ [✕ Anuluj]  🛠️ Nowe zgłoszenie AGD     │ ← Fixed gradient header
└─────────────────────────────────────────┘
```

### W prawym dolnym rogu:
```
                     ┌────────────────────┐
                     │ 🟢 Zapisano 10:30  │ ← Auto-save indicator
                     └────────────────────┘
```

### Progress bar (nowa kolejność):
```
[1●]──[2○]──[3○]──[4○]──[5○]
Lokalizacja  Kontakt  Urządzenie  Termin  Podsumowanie
```

---

## 🧪 Test auto-save (1 minuta)

1. **Zaloguj się** jako admin
2. **Rozpocznij** wypełnianie formularza:
   - Wpisz kod pocztowy: `00-001`
   - Wpisz miasto: `Warszawa`
   - Wpisz ulicę: `ul. Testowa 1`
3. **Poczekaj 5 sekund**
4. **Obserwuj** prawy dolny róg:
   - `Zapisuję...` (spinner)
   - `Zapisano 10:30:15` (zielona kropka)
5. **Odśwież stronę** (F5)
6. **Kliknij OK** w pytaniu o przywrócenie
7. ✅ **Dane przywrócone!**

---

## 🎨 Test przycisku Anuluj (30 sekund)

1. Wypełnij część formularza
2. Kliknij **"Anuluj"** (lewy górny róg)
3. Zobaczysz:
   ```
   ⚠️ Czy na pewno chcesz anulować?
   
   Twoje dane są automatycznie zapisywane co 5 sekund.
   Możesz wrócić do tego formularza później.
   ```
4. Kliknij **"Anuluj"** → zostaniesz na stronie
5. Kliknij ponownie, wybierz **"OK"** → przekierowanie

---

## 🔍 Test opcjonalnego imienia (1 minuta)

1. Przejdź do **Kroku 2: Kontakt**
2. **NIE WPISUJ** imienia/nazwiska (zostaw puste)
3. Wpisz tylko telefon: `123456789`
4. Przejdź dalej, wypełnij resztę
5. Wyślij formularz
6. Sprawdź w bazie - powinno być: `Klient #582394`

---

## 📊 Sprawdź w developer tools

### localStorage:
```javascript
// W konsoli przeglądarki (F12)
JSON.parse(localStorage.getItem('reservationDraft'))
```

### API:
```
GET http://localhost:3000/api/drafts?adminId=USER-XXX
```

---

## ✅ Wszystko działa gdy:

- [x] Progress bar pokazuje: Lokalizacja → Kontakt → Urządzenie
- [x] Pole "Imię" ma tekst "(opcjonalnie)"
- [x] Sticky header widoczny na górze
- [x] Przycisk "Anuluj" w lewym rogu
- [x] Wskaźnik auto-save w prawym dolnym rogu
- [x] Po 5 sekundach pojawia się "Zapisano HH:MM:SS"
- [x] Po odświeżeniu pojawia się pytanie o przywrócenie
- [x] Wysłanie formularza bez imienia generuje "Klient #XXXXXX"

---

## 🐛 Błędy? Sprawdź:

### 1. Auto-save nie działa
- Czy jesteś zalogowany?
- Czy w konsoli są błędy?
- Czy plik `data/drafts.json` istnieje?

### 2. Nie ma sticky header
- Czy jesteś w podsumowaniu? (tam jest ukryty)
- Sprawdź console: błędy React?

### 3. Redirect nie działa
- Sprawdź czy plik `pages/admin/rezerwacje/nowa.js` został zastąpiony
- Powinien mieć tylko ~24 linie kodu

---

## 📁 Pliki do sprawdzenia

```
✅ pages/rezerwacja.js (1620 linii)
✅ pages/api/drafts.js (162 linie)
✅ pages/admin/rezerwacje/nowa.js (24 linie - przekierowanie)
✅ data/drafts.json (pusta tablica)
✅ pages/admin/rezerwacje/nowa.js.backup (backup - 1179 linii)
```

---

## 🎉 Gotowe!

Jeśli wszystko działa - **gratuluję!** 

Wszystkie 5 ulepszeń + bonus (przekierowanie) zostały pomyślnie wdrożone.

📖 Pełna dokumentacja: `REZERWACJA_ULEPSZENIA_WDROZONE.md`

---

**Status:** ✅ READY FOR PRODUCTION  
**Data:** 6 października 2025
