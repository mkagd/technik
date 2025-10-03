# 🕐 SYSTEM ZARZĄDZANIA CZASAMI NAPRAW - INSTRUKCJA UŻYTKOWNIKA

**Ostatnia aktualizacja:** 2 października 2025

---

## 📋 SPIS TREŚCI

1. [Wprowadzenie](#wprowadzenie)
2. [Dodawanie wizyty z czasem naprawy](#dodawanie-wizyty)
3. [Zarządzanie czasami pracowników](#zarzadzanie-czasami)
4. [Intelligent Planner](#intelligent-planner)
5. [Często zadawane pytania](#faq)

---

## 🎯 WPROWADZENIE

System automatycznie oblicza czas potrzebny na naprawę na podstawie:
- **Typu urządzenia** (np. pralka, lodówka)
- **Doświadczenia pracownika** (każdy ma swoje czasy)
- **Dodatkowych czynności** (demontaż, montaż, trudna zabudowa)
- **Ręcznie dodanego czasu** (na nietypowe sytuacje)

### Dlaczego to ważne?

✅ **Realistyczne plany** - nie więcej 60 min dla wszystkich napraw  
✅ **Lepsze szacowanie** - klient wie kiedy przyjdzie serwisant  
✅ **Efektywność** - mniej opóźnień i niezadowolonych klientów  
✅ **Sprawiedliwość** - doświadczeni pracownicy mają krótsze czasy

---

## 📝 DODAWANIE WIZYTY

### Krok 1: Otwórz szczegóły zlecenia

1. Przejdź do listy zleceń
2. Kliknij na zlecenie aby otworzyć szczegóły
3. Przewiń do sekcji "Wizyty"
4. Kliknij **"➕ Dodaj wizytę"**

### Krok 2: Wypełnij podstawowe dane

![Modal dodawania wizyty](docs/images/add-visit-modal.png)

**Data i godzina:**
- Wybierz datę (domyślnie jutro)
- Wybierz godzinę (np. 10:00)

**Typ wizyty:**
- 🔍 **Diagnoza** - pierwsza wizyta, sprawdzenie usterki
- 🔧 **Naprawa** - wykonanie naprawy
- ✅ **Kontrola** - sprawdzenie po naprawie
- 📦 **Montaż** - instalacja nowego urządzenia

**Serwisant:**
- Wybierz pracownika z listy
- System załaduje jego indywidualne czasy

### Krok 3: Wybierz typ urządzenia ⭐ NOWE

**16 dostępnych typów:**

| Ikona | Urządzenie | Średni czas |
|-------|------------|-------------|
| 🧺 | Pralka automatyczna | 25-35 min |
| 🧊 | Lodówka | 30-45 min |
| 🍽️ | Zmywarka | 30-40 min |
| 🔥 | Piekarnik | 40-50 min |
| 🍳 | Kuchenka elektryczna | 35-45 min |
| ⚡ | Płyta indukcyjna | 30-40 min |
| 🌬️ | Suszarka bębnowa | 30-40 min |
| ❄️ | Zamrażarka | 35-45 min |
| ☕ | Ekspres do kawy | 20-30 min |
| 🍲 | Robot kuchenny | 25-35 min |
| 🥤 | Blender | 15-25 min |
| 🍊 | Sokowirówka | 15-25 min |
| 📻 | Kuchenka mikrofalowa | 20-30 min |
| 💨 | Okap kuchenny | 25-35 min |
| 🔧 | Inne urządzenie AGD | 30 min |

**Wybierz urządzenie z listy rozwijanej.**

### Krok 4: Dodatkowe czynności ⭐ NOWE

Zaznacz checkboxy jeśli naprawa wymaga:

- ☑️ **Demontaż zabudowy** (+10 min)
  - Gdy urządzenie jest wbudowane w meble
  - Trzeba zdjąć fronty, boki, itp.

- ☑️ **Montaż zabudowy** (+10 min)
  - Ponowne wbudowanie po naprawie
  - Wyrównanie, dopasowanie

- ☑️ **Trudna zabudowa** (+30 min)
  - Skomplikowana konstrukcja
  - Trudny dostęp do urządzenia
  - Niestandardowe rozwiązania

### Krok 5: Dodatkowy czas (opcjonalnie) ⭐ NOWE

Jeśli spodziewasz się nietypowych problemów:
- Wpisz dodatkowe minuty (np. 15)
- Używaj zaokrąglenia do 5 minut (10, 15, 20, 25...)

**Przykłady:**
- Klient ma dużo mebli do przesunięcia → +15 min
- Miejsce parkingowe daleko od budynku → +10 min
- Stary budynek, wąskie schody → +20 min

### Krok 6: Szacowany czas ✨ AUTOMATYCZNIE

System automatycznie oblicza całkowity czas!

**Przykład obliczenia:**

```
Pracownik: Marek Pralkowski (Expert w pralki)
Urządzenie: Pralka
Czas bazowy: 22 min

+ Demontaż: 10 min
+ Montaż: 10 min
+ Dodatkowy czas: 18 min

= RAZEM: 60 min
```

Pole "Szacowany czas" pokazuje:
- 📊 Obliczony czas w formacie czytelnym (np. "1h 30min")
- ✨ Ikona "Auto" gdy czas jest automatyczny
- 💡 Wskazówka o źródle obliczenia

### Krok 7: Zapisz wizytę

1. Sprawdź czy wszystkie dane są poprawne
2. Kliknij **"✓ Dodaj wizytę"**
3. Wizyta zostanie zapisana z obliczonym czasem

---

## ⚙️ ZARZĄDZANIE CZASAMI

### Dostęp do panelu ustawień

**URL:** `/ustawienia-czasow`

**Uprawnienia:** Tylko administratorzy

### Sekcja 1: Czasy dodatkowe

![Panel czasów dodatkowych](docs/images/additional-times-panel.png)

Tutaj możesz zmienić standardowe czasy dla:
- **Demontaż zabudowy** (domyślnie 10 min)
- **Montaż zabudowy** (domyślnie 10 min)
- **Trudna zabudowa** (domyślnie 30 min)

**Jak zmienić:**
1. Wpisz nową wartość w minutach
2. Kliknij "Zapisz czasy dodatkowe"
3. Zmiany obowiązują od razu

### Sekcja 2: Czasy napraw pracownika

![Panel czasów pracownika](docs/images/employee-times-panel.png)

**Krok po kroku:**

1. **Wybierz pracownika** z listy rozwijanej
   - Widzisz jego specjalizacje
   - Widzisz urządzenia które obsługuje

2. **Sprawdź aktualne czasy**
   - Każde urządzenie ma swój czas
   - Porównaj z czasem domyślnym (pokazany obok)

3. **Zmień czasy** według potrzeb
   - Minimum: 5 minut
   - Maximum: 300 minut (5 godzin)
   - Używaj zaokrąglenia do 5 minut

4. **Zapisz zmiany**
   - Kliknij "Zapisz czasy napraw"
   - System zapisze i pokaże potwierdzenie

### Kiedy zmieniać czasy?

**Skróć czas gdy pracownik:**
- ✅ Przeszedł szkolenie (np. -5 min)
- ✅ Ma 2+ lata doświadczenia z urządzeniem
- ✅ Konsekwentnie kończy szybciej

**Wydłuż czas gdy:**
- ⚠️ Często przekracza szacowany czas
- ⚠️ Dopiero zaczyna z danym urządzeniem
- ⚠️ Pracuje bardzo dokładnie (wolniej ale lepiej)

### Przykłady dobrych praktyk

**Przykład 1: Nowy pracownik**
```
Anna - pierwsza naprawa pralek
Pralka: 30 min (domyślnie) → 35 min (+5 min)
Powód: Brak doświadczenia, potrzebuje więcej czasu
```

**Przykład 2: Expert**
```
Piotr - 12 lat z lodówkami
Lodówka: 40 min (domyślnie) → 29 min (-11 min)
Powód: Dużo doświadczenia, szybko diagnozuje
```

**Przykład 3: Specjalizacja**
```
Marek - specjalista od pralek
Pralka: 30 min → 22 min (-8 min)
Zmywarka: 35 min → 38 min (+3 min)
Powód: Expert w pralki, średnio w zmywarkach
```

---

## 🧠 INTELLIGENT PLANNER

### Jak działa automatyczne obliczanie?

Gdy generujesz plan tygodniowy i klikasz "Zapisz Plan":

1. **System analizuje każde zlecenie:**
   - Sprawdza czy ma zapisany typ urządzenia
   - Szuka w opisie wskazówek (np. "pralka Bosch")
   
2. **Pobiera pracownika:**
   - Jego indywidualne czasy
   - Specjalizacje i doświadczenie

3. **Oblicza inteligentnie:**
   - Czas bazowy dla tego pracownika i urządzenia
   - Dodaje czasy dodatkowe (jeśli są w zleceniu)
   - Dodaje ręczny czas (jeśli jest)

4. **Tworzy wizyty z realistycznymi czasami:**
   - Nie wszystkie wizyty po 60 min
   - Lepsze wykorzystanie czasu pracownika
   - Dokładniejsze szacowanie końca dnia

### Co widzisz w konsoli?

```
🧮 Obliczony czas naprawy: 32 min dla zlecenia ORDA25270005
✅ Creating new visit for order 1005
💾 Saving weekly plan...
✅ Plan zapisany! Utworzono 15 wizyt dla 12 zleceń
```

### Weryfikacja po zapisaniu

1. Otwórz `data/orders.json`
2. Znajdź nowo utworzone wizyty
3. Sprawdź pole `estimatedDuration`
4. Powinny być różne wartości (nie wszystkie 60)

**Przykład:**
```json
{
  "visitId": "VIS252700015",
  "employeeId": "EMP25092005",
  "employeeName": "Marek Pralkowski",
  "deviceType": "pralka",
  "estimatedDuration": 22,  // ← Czas dopasowany do Marka
  "type": "diagnosis"
}
```

---

## ❓ FAQ

### 1. Co jeśli nie wiem jakiego typu jest urządzenie?

**Opcja A:** Wybierz "Inne urządzenie AGD" (30 min domyślnie)  
**Opcja B:** Zostaw puste - system użyje 60 min  
**Opcja C:** Dodaj ręczny czas szacunkowy

### 2. Czy mogę zmienić czas po utworzeniu wizyty?

Tak! 
1. Otwórz szczegóły zlecenia
2. Kliknij "✏️" przy wizycie
3. Zmień dane (w tym szacowany czas)
4. Zapisz zmiany

### 3. Kto może zmieniać czasy pracowników?

Tylko administratorzy mają dostęp do `/ustawienia-czasow`.  
Pracownicy nie mogą zmieniać swoich czasów.

### 4. Jak często aktualizować czasy?

**Zalecamy:**
- 📅 Raz na kwartał - przegląd wszystkich pracowników
- 🎓 Po szkoleniu - zmniejsz czas dla przeszkolonych
- 📊 Po analizie - jeśli widzisz tendencję w przekraczaniu/skracaniu

### 5. Co jeśli pracownik często przekracza czas?

1. Sprawdź dane historyczne (średni rzeczywisty czas)
2. Porównaj z szacowanym czasem
3. Jeśli różnica > 20%, wydłuż czas w ustawieniach
4. Monitoruj przez miesiąc
5. Dostosuj ponownie jeśli trzeba

### 6. Czy system uczy się automatycznie?

**Obecnie: NIE** - musisz ręcznie aktualizować czasy  
**Przyszłość: TAK** - planujemy ML do automatycznego uczenia się

### 7. Co oznacza ikona "✨ Auto" przy czasie?

To znaczy że czas został:
- Obliczony automatycznie przez system
- Bazuje na danych pracownika i urządzenia
- Nie był ręcznie wpisany przez użytkownika

### 8. Jak dodać nowy typ urządzenia?

Obecnie musisz edytować `data/repair-time-settings.json`.  
Wkrótce: Panel admin do dodawania typów.

### 9. Czy mogę mieć różne czasy dodatkowe dla pracowników?

Obecnie czasy dodatkowe (demontaż, montaż) są globalne.  
Możesz to obejść używając pola "Dodatkowy czas (ręczny)".

### 10. Co jeśli zapomniałem zaznaczyć demontaż?

Możesz:
1. Edytować wizytę po utworzeniu
2. Dodać ręczny czas (+10 min)
3. Lub zostawić jak jest (jeśli czas wystarczy)

---

## 🎓 PRZYKŁADY UŻYCIA

### Przykład 1: Prosta naprawa pralki

```
Zlecenie: Pralka Samsung - nie odpompowuje wody
Pracownik: Marek Pralkowski (Expert w pralki - 22 min)
Urządzenie: Pralka
Dodatkowe czynności: Brak
Dodatkowy czas: 0 min

Obliczony czas: 22 min ✅
```

### Przykład 2: Zmywarka w zabudowie

```
Zlecenie: Zmywarka Bosch wbudowana - błąd E15
Pracownik: Anna Technik (Expert w zmywarkach - 27 min)
Urządzenie: Zmywarka
Dodatkowe czynności:
  ☑️ Demontaż zabudowy (+10 min)
  ☑️ Montaż zabudowy (+10 min)
Dodatkowy czas: 0 min

Obliczony czas: 47 min (27 + 10 + 10) ✅
```

### Przykład 3: Skomplikowana sytuacja

```
Zlecenie: Lodówka LG No Frost - nie chłodzi
Pracownik: Piotr Chłodnictwo (Expert - 29 min)
Urządzenie: Lodówka
Dodatkowe czynności:
  ☑️ Trudna zabudowa (+30 min)
Dodatkowy czas: 20 min (dostęp do agregatu trudny)

Obliczony czas: 79 min (29 + 30 + 20) ✅
Wyświetlane jako: "1h 19min"
```

### Przykład 4: Początkujący pracownik

```
Zlecenie: Piekarnik Electrolux - nie grzeje
Pracownik: Tomasz Nowak (Beginner - 48 min)
Urządzenie: Piekarnik
Dodatkowe czynności: Brak
Dodatkowy czas: 15 min (pierwszy raz z Electrolux)

Obliczony czas: 63 min (48 + 15) ✅
Wyświetlane jako: "1h 3min"
```

---

## 📞 KONTAKT I WSPARCIE

**Problemy techniczne:**
- Sprawdź Console (F12) w przeglądarce
- Zgłoś błąd z logami

**Pytania o użytkowanie:**
- Skontaktuj się z administratorem systemu
- Przeczytaj dokumentację techniczną

**Sugestie:**
- Jeśli masz pomysł na ulepszenie
- Podziel się feedback z zespołem

---

**Wersja dokumentu:** 1.0  
**Data:** 2 października 2025  
**Autor:** GitHub Copilot
