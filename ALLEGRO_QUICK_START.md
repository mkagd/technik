# ⚡ Szybki Start - Allegro OAuth

## 🎯 Cel
Włączyć prawdziwe wyszukiwanie części z Allegro API

## ⏱️ Czas: ~30 minut

---

## Krok 1: Zarejestruj Aplikację w Allegro (20 min)

### 1.1 Przejdź do Allegro Developer Portal
```
https://apps.developer.allegro.pl/
```

### 1.2 Zaloguj się
- Użyj swojego konta Allegro
- Jeśli nie masz konta, najpierw załóż na allegro.pl

### 1.3 Utwórz Nową Aplikację
1. Kliknij: **"Utwórz nową aplikację"** (lub "Create new app")
2. Wybierz: **"REST API"**
3. Nazwa aplikacji: `Serwis AGD Manager` (lub dowolna nazwa)
4. **Redirect URI:** `http://localhost:3000`
   - To pole jest wymagane, ale dla Client Credentials flow nie jest używane
   - Możesz też wpisać: `http://localhost:3000/api/auth/callback`

### 1.4 Zapisz Aplikację
1. Zaakceptuj regulamin
2. Kliknij **"Zapisz"** / **"Save"**
3. Poczekaj na utworzenie aplikacji (~5 sekund)

### 1.5 Pobierz Dane OAuth
Po utworzeniu aplikacji zobaczysz:

```
Client ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Client Secret: ••••••••••••••••••••••••••••••••
```

**WAŻNE:** 
- Kliknij "Pokaż" przy Client Secret aby go skopiować
- **Zachowaj je w bezpiecznym miejscu!**
- Nie udostępniaj Client Secret nikomu!

---

## Krok 2: Skonfiguruj w Aplikacji (5 min)

### 2.1 Otwórz Panel Administracyjny
```
http://localhost:3000/admin
```

### 2.2 Przejdź do Ustawień Allegro
**Sposób 1:** Z menu lewego:
- Kliknij: **"Allegro (zakupy)"**
- Kliknij: **"⚙️ Ustawienia"** (przycisk w prawym górnym rogu)

**Sposób 2:** Bezpośredni link:
```
http://localhost:3000/admin/allegro/settings
```

### 2.3 Wprowadź Dane OAuth
1. **Client ID:** Wklej skopiowany Client ID
2. **Client Secret:** Wklej skopiowany Client Secret
3. Kliknij: **"💾 Zapisz konfigurację"**

Powinieneś zobaczyć:
```
✅ Konfiguracja zapisana pomyślnie!
```

### 2.4 Przetestuj Połączenie
1. Kliknij: **"🧪 Testuj połączenie"**
2. Poczekaj ~2 sekundy
3. Powinieneś zobaczyć:

```
✅ Test zakończony sukcesem!
Connection successful
```

### 2.5 Gotowe!
Kliknij: **"🎉 Przejdź do wyszukiwania →"**

---

## Krok 3: Sprawdź Działanie (5 min)

### 3.1 Wyszukaj Część
1. Wpisz: `pasek napędowy`
2. Kliknij: **"🔍 Szukaj"**
3. Poczekaj ~2 sekundy

### 3.2 Sprawdź Wyniki
- ✅ Powinieneś zobaczyć **prawdziwe oferty** z Allegro
- ✅ Zdjęcia produktów
- ✅ Prawdziwe ceny
- ✅ Informacje o dostawie
- ✅ Link do oferty na Allegro

### 3.3 Sprawdź Brak Komunikatu DEMO
- ❌ Nie powinno być żółtego banera "Tryb DEMO"
- ✅ Jeśli baner zniknął = działa prawdziwe API!

---

## ✅ Gotowe!

System teraz używa prawdziwego Allegro API z OAuth 2.0!

### Co się dzieje w tle:
1. Przy pierwszym wyszukiwaniu system pobiera token OAuth (zajmuje ~1s)
2. Token jest cachowany na **12 godzin** w pliku `data/allegro-token.json`
3. Kolejne wyszukiwania są **błyskawiczne** (używają cached tokenu)
4. Po 12 godzinach token jest automatycznie odświeżany

---

## 🔧 Rozwiązywanie Problemów

### Problem: "401 Unauthorized" po skonfigurowaniu

**Rozwiązanie:**
1. Przejdź do: **Ustawienia → Zaawansowane**
2. Kliknij: **"🗑️ Wyczyść cache"**
3. Spróbuj ponownie wyszukać

### Problem: "Client ID/Secret nieprawidłowe"

**Rozwiązanie:**
1. Sprawdź czy skopiowałeś **cały** Client ID i Secret
2. Sprawdź czy nie ma spacji na początku/końcu
3. W razie wątpliwości skopiuj ponownie z Allegro Developer Portal

### Problem: Nadal widzę "Tryb DEMO"

**Powody:**
1. Client ID lub Secret są nieprawidłowe → Sprawdź konfigurację
2. Nie kliknąłeś "Zapisz" → Zapisz ponownie
3. Cache jest nieaktualny → Wyczyść cache

---

## 📊 Weryfikacja Konfiguracji

Przejdź do: **Admin → Allegro → Ustawienia**

Sprawdź sekcję **"Status":**
```
✅ Konfiguracja: Skonfigurowane
🔐 Tryb: OAuth API
```

Jeśli widzisz:
```
❌ Konfiguracja: Brak
🎭 Tryb: DEMO
```

To znaczy że konfiguracja nie została zapisana poprawnie.

---

## 🎉 Sukces!

Gratulacje! Twój system Serwis AGD Manager jest teraz zintegrowany z prawdziwym Allegro API!

### Co dalej?
- Wyszukuj części dla swoich serwisantów
- Porównuj ceny z lokalnym magazynem
- Generuj listy zakupów
- Wszystko **za darmo**! (płacisz tylko gdy kupujesz)

---

## 📞 Pomoc

Jeśli coś nie działa:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi serwera (terminal gdzie uruchomiony jest `npm run dev`)
3. Zobacz plik: `ALLEGRO_API_STATUS.md` - pełna dokumentacja

---

**Ostatnia aktualizacja:** 2025-10-05
**Wersja:** 1.0.0
