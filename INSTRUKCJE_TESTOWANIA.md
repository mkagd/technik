# Instrukcje testowania systemu zgłoszeń

## Problem rozwiązany ✅

**Problem**: Po zgłoszeniu szybkiego zgłoszenia nie było widać zgłoszenia w "sprawdź status zgłoszenia".

**Przyczyna**: Strona `/moje-zamowienie` szukała danych w starych lokalizacjach (`bookings`, `zlecenia`), ale nowe zgłoszenia zapisywane są w `unified_reports` i `quickReports`.

**Rozwiązanie**: Zaktualizowano funkcje wyszukiwania, aby obejmowały wszystkie źródła danych.

## Jak przetestować

### 1. Utwórz nowe zgłoszenie
1. Idź na stronę główną `/`
2. Wybierz "Szybkie zgłoszenie" (naprawa.pl lub usterka.pl)
3. Wypełnij formularz i wyślij
4. **Zapamiętaj numer zgłoszenia** (np. `ZG-2025-0001`)

### 2. Sprawdź status w systemie sprawdzania
1. Idź na `/moje-zamowienie`
2. Wybierz "Sprawdź po numerze zamówienia"
3. Wpisz numer zgłoszenia (np. `ZG-2025-0001`)
4. Wpisz numer telefonu z zgłoszenia
5. Kliknij "Sprawdź status"

### 3. Sprawdź w wyszukiwaniu
1. Na stronie `/moje-zamowienie` w wyszukiwaniu wpisz:
   - Numer zgłoszenia (np. `ZG-2025-0001`)
   - Numer telefonu
   - Część opisu
   - Typ sprzętu

### 4. Panel administracyjny
1. Idź na `/zgloszenia-admin`
2. Zaloguj się jako admin
3. Kliknij przycisk "Zarządzaj"
4. Sprawdź statystyki i uruchom migrację jeśli potrzeba

### 5. Strona testowa
1. Idź na `/test-reports`
2. Sprawdź statystyki systemu
3. Utwórz testowe zgłoszenie
4. Sprawdź czy wszystko działa

## Nowe funkcje

### ✅ Ujednolicone numery zgłoszeń
- **ZG-2025-0001** - Zgłoszenia serwisowe
- **US-2025-0001** - Usterki (pilne)
- **RZ-2025-0001** - Rezerwacje

### ✅ Rozszerzone wyszukiwanie
Teraz można szukać po:
- Numerze zgłoszenia (ZG-2025-0001)
- Numerze telefonu
- Adresie e-mail
- Opisie problemu
- Typie sprzętu
- Statusie

### ✅ Automatyczna migracja
- System automatycznie konwertuje stare dane
- Zachowuje kompatybilność
- Dodaje numery do starych zgłoszeń

### ✅ Panel zarządzania
- Statystyki w czasie rzeczywistym
- Kontrola migracji
- Narzędzia testowe
- Przygotowanie do synchronizacji

## Sprawdź czy działają:

### Scenariusz 1: Nowe zgłoszenie
1. ✅ Formularz generuje numer ZG-YYYY-NNNN
2. ✅ Zgłoszenie zapisuje się w unified_reports
3. ✅ Zgłoszenie widać w panelu admin
4. ✅ Zgłoszenie można znaleźć w sprawdź status

### Scenariusz 2: Wyszukiwanie
1. ✅ Wyszukiwanie po numerze zgłoszenia
2. ✅ Wyszukiwanie po numerze telefonu
3. ✅ Wyszukiwanie po opisie
4. ✅ Logowanie przez numer zgłoszenia

### Scenariusz 3: Kompatybilność
1. ✅ Stare zgłoszenia dalej widoczne
2. ✅ Migracja automatyczna
3. ✅ Zachowane funkcje

## W przypadku problemów

### Jeśli nie widać zgłoszenia:
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź localStorage:
   ```javascript
   console.log('Unified:', JSON.parse(localStorage.getItem('unified_reports') || '[]'));
   console.log('Quick:', JSON.parse(localStorage.getItem('quickReports') || '[]'));
   ```

### Jeśli błędy migracji:
1. Idź na `/zgloszenia-admin`
2. Kliknij "Zarządzaj"
3. Kliknij "Wymuś migrację"

### Reset systemu:
1. Idź na `/test-reports`
2. Kliknij "Pokaż stan" (sprawdź konsole)
3. W konsoli wykonaj:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Logi testowe

Sprawdź w konsoli przeglądarki:
- Logi tworzenia zgłoszeń
- Logi migracji
- Błędy synchronizacji
- Stan localStorage

---

**Status**: ✅ Gotowe do testowania  
**Data**: 2025-07-02  
**Kolejny krok**: Test produkcyjny
