# 📱 Instrukcja testowania geolokalizacji na telefonie

## ✅ Krok 1: Upewnij się że GPS jest włączony

### Android:
1. Ustawienia → Lokalizacja
2. Włącz "Używaj lokalizacji"
3. Ustaw dokładność na "Wysoka dokładność"

### iOS:
1. Ustawienia → Prywatność i bezpieczeństwo → Usługi lokalizacji
2. Włącz "Usługi lokalizacji"
3. Przewiń w dół do Safari → Wybierz "Podczas korzystania z aplikacji"

---

## ✅ Krok 2: Otwórz stronę na telefonie

### Opcja A: QR Code (najszybsze)
1. Na komputerze otwórz: `http://localhost:3000/qr-code-local.html`
2. Zeskanuj kod telefonem
3. Lub użyj URL: `http://192.168.0.2:3000/index-serwis-agd`

### Opcja B: Wpisz ręcznie
```
http://192.168.0.2:3000/index-serwis-agd
```

⚠️ **WAŻNE:** Telefon musi być w tej samej sieci Wi-Fi co komputer!

---

## ✅ Krok 3: Sprawdź czy działa

### Co powinno się stać:

1. **Strona się ładuje** ✅
2. **Przeglądarka pyta:** "Zezwolić stronie na dostęp do lokalizacji?" 
3. **Kliknij: "Zezwól"** / "Allow" ✅
4. **Modal się pojawia:**
   ```
   🎯 Wykryto lokalizację!
   Rzeszów (lub inne miasto)
   Przekierowujemy Cię na stronę z lokalną ofertą...
   [====== progress bar ======]
   ```
5. **Po 1.5 sekundy:** Automatyczne przekierowanie na `/serwis/rzeszow` ✅

---

## 🐛 Jeśli NIE działa - rozwiązania:

### Problem 1: Przeglądarka nie pyta o lokalizację

**Przyczyna:** Lokalizacja zablokowana dla tej strony

**Rozwiązanie Android (Chrome):**
1. Kliknij ikonę **🔒** (kłódka) obok adresu
2. Kliknij "Uprawnienia"
3. Lokalizacja → Zmień na **"Zezwól"**
4. Odśwież stronę (F5)

**Rozwiązanie iOS (Safari):**
1. Ustawienia → Safari → Zaawansowane → Dane witryn
2. Usuń dane dla `192.168.0.2`
3. Wróć do Safari i odśwież stronę

---

### Problem 2: Modal się nie pojawia

**Przyczyna:** Geolokalizacja nie zwraca współrzędnych

**Rozwiązanie:**
1. Sprawdź czy GPS jest włączony (krok 1)
2. Wyjdź na zewnątrz (GPS lepiej działa poza budynkiem)
3. Odśwież stronę

**Tryb testowy (bez GPS):**
Dodaj `?test=rzeszow` do URL:
```
http://192.168.0.2:3000/index-serwis-agd?test=rzeszow
```
To zasymuluje wykrycie Rzeszowa bez prawdziwego GPS!

Inne miasta: `?test=debica`, `?test=tarnow`, `?test=krakow`, `?test=jaslo`

---

### Problem 3: Przekierowanie nie działa

**Przyczyna:** JavaScript może być wyłączony

**Rozwiązanie:**
1. Sprawdź czy JavaScript jest włączony w przeglądarce
2. Spróbuj innej przeglądarki (Chrome zamiast Safari)

---

## 🧪 Test bez prawdziwego GPS (symulacja)

Jeśli chcesz przetestować **bez włączania GPS**, użyj trybu testowego:

### Wszystkie miasta:
- `?test=debica` → Przekieruje na Dębicę
- `?test=rzeszow` → Przekieruje na Rzeszów
- `?test=tarnow` → Przekieruje na Tarnów
- `?test=krakow` → Przekieruje na Kraków
- `?test=jaslo` → Przekieruje na Jasło

**Przykład:**
```
http://192.168.0.2:3000/index-serwis-agd?test=krakow
```
Zobaczysz modal "Wykryto lokalizację! Kraków" i przekierowanie na `/serwis/krakow`

---

## 📊 Jak system wybiera miasto?

System używa **wzoru Haversine** (geograficzna odległość w km):

```
1. Telefon daje GPS: 50.0412°N, 21.9991°E (przykład: centrum Rzeszowa)

2. System liczy odległość do każdego miasta:
   - Dębica:  45 km
   - Rzeszów: 2 km  ← NAJMNIEJSZA!
   - Tarnów:  70 km
   - Kraków:  150 km
   - Jasło:   50 km

3. Wybiera najbliższe: Rzeszów ✅

4. Przekierowuje na: /serwis/rzeszow
```

**To prawdziwa odległość w linii prostej!** Nie na sztywno - system dynamicznie liczy gdzie użytkownik jest najbliżej.

---

## 🌍 Zasięg wykrywania

System wybierze najbliższe miasto **niezależnie od odległości**. 

Przykłady:
- Użytkownik w **Dębicy** → `/serwis/debica`
- Użytkownik w **Mielcu** (20km od Dębicy) → `/serwis/debica` (najbliżej)
- Użytkownik w **Sędziszowie** (między Dębicą a Rzeszowem) → wybierze bliższe
- Użytkownik w **Warszawie** → wybierze najbliższe z 5 miast (prawdopodobnie Kraków)

---

## ✅ Checklist testowania:

- [ ] GPS włączony w telefonie
- [ ] Telefon w tej samej sieci Wi-Fi (192.168.0.x)
- [ ] Otwarto: `http://192.168.0.2:3000/index-serwis-agd`
- [ ] Przeglądarka zapytała o lokalizację
- [ ] Kliknięto "Zezwól"
- [ ] Modal się pojawił z nazwą miasta
- [ ] Progress bar animowany
- [ ] Po 1.5s nastąpiło przekierowanie
- [ ] Strona miasta załadowała się z lokalnym telefonem

---

## 🚀 Gotowe do produkcji?

Przed wdrożeniem na prawdziwą domenę:

1. **Kup domenę:** np. `serwis-agd-debica.pl`
2. **Włącz HTTPS:** Let's Encrypt (darmowe)
3. **Zmień URL w kodzie** z `192.168.0.2` na prawdziwą domenę
4. **Uzupełnij prawdziwe telefony** w `/config/cities.js`
5. **Skonfiguruj email forwarding:** debica@, rzeszow@, etc.
6. **Dodaj Google Analytics** do śledzenia konwersji

Po wdrożeniu geolokalizacja będzie działać na 100% bo HTTPS! 🔒✅
