# 🧪 Allegro Sandbox - Przewodnik Szybkiego Startu

## Co to jest Sandbox?

Sandbox to **środowisko testowe** Allegro, które pozwala:
- ✅ Testować integrację API bez rejestracji biznesowej
- ✅ Eksperymentować bezpiecznie bez wpływu na dane produkcyjne
- ✅ Uczyć się API Allegro za darmo
- ✅ Szybko prototypować funkcje

**Uwaga:** Sandbox używa **testowych danych** - nie są to prawdziwe oferty Allegro!

---

## Krok 1: Rejestracja Aplikacji Sandbox

### 1.1 Otwórz Portal Sandbox
Przejdź na: https://apps.developer.allegro.pl.allegrosandbox.pl/

### 1.2 Załóż konto lub zaloguj się
- Możesz użyć swojego zwykłego konta Allegro
- Lub stworzyć nowe testowe konto

### 1.3 Utwórz nową aplikację
1. Kliknij **"Dodaj nową aplikację"**
2. Wypełnij formularz:
   - **Nazwa aplikacji:** np. "Moja Aplikacja Test"
   - **Redirect URI:** `http://localhost:3000/api/allegro/callback`
   - **Zakres uprawnień:** zaznacz `allegro:api:orders:read` (lub wszystkie do testów)
3. Zapisz aplikację

### 1.4 Pobierz dane OAuth
Po utworzeniu aplikacji otrzymasz:
- **Client ID** - długi identyfikator aplikacji
- **Client Secret** - tajny klucz (nie udostępniaj nikomu!)

**Skopiuj te dane** - będą potrzebne w następnym kroku.

---

## Krok 2: Konfiguracja w Aplikacji

### 2.1 Otwórz ustawienia
W swojej aplikacji przejdź do: **Admin Panel → Allegro → ⚙️ Ustawienia**

Lub bezpośrednio: http://localhost:3000/admin/allegro/settings

### 2.2 Zaznacz Sandbox
**WAŻNE:** Upewnij się że checkbox **"🧪 Używaj Sandbox (środowisko testowe)"** jest **ZAZNACZONY** ✅

### 2.3 Wklej dane OAuth
- **Client ID:** wklej Client ID z Sandbox
- **Client Secret:** wklej Client Secret z Sandbox

### 2.4 Zapisz i przetestuj
1. Kliknij **"💾 Zapisz Konfigurację"**
2. Kliknij **"🔍 Testuj Połączenie"**
3. Powinno pojawić się: **✅ Połączenie działa!**

---

## Krok 3: Testowanie Wyszukiwania

### 3.1 Otwórz wyszukiwarkę
Przejdź do: **Admin Panel → Allegro → 🛒 Wyszukiwanie Części**

Lub: http://localhost:3000/admin/allegro/search

### 3.2 Sprawdź wskaźnik Sandbox
W prawym górnym rogu powinieneś zobaczyć badge:
```
🧪 SANDBOX
```

To oznacza że korzystasz z trybu testowego!

### 3.3 Wyszukaj części
1. Wpisz nazwę części (np. "silnik", "termostat", "uszczelka")
2. Kliknij **"🔍 Szukaj"**
3. Zobaczysz wyniki z Sandbox API

**Uwaga:** Wyniki mogą być różne od produkcji - to testowe dane!

---

## Jak działa Sandbox?

### Automatyczne przełączanie URL
Gdy Sandbox jest włączony, system automatycznie używa:

**Zamiast produkcji:**
```
https://api.allegro.pl/offers/listing
https://allegro.pl/auth/oauth/token
```

**Używa Sandbox:**
```
https://api.allegro.pl.allegrosandbox.pl/offers/listing
https://allegro.pl.allegrosandbox.pl/auth/oauth/token
```

### Pliki z konfiguracją

**`.env.local`** - zmienne środowiskowe:
```bash
ALLEGRO_CLIENT_ID=your_sandbox_client_id_here
ALLEGRO_CLIENT_SECRET=your_sandbox_client_secret_here
ALLEGRO_SANDBOX=true
```

**`data/allegro-config.json`** - zapisana konfiguracja:
```json
{
  "clientId": "abc123...",
  "clientSecret": "xyz789...",
  "sandbox": true
}
```

---

## Migracja na Produkcję

Gdy będziesz gotowy na produkcję:

### Krok 1: Zarejestruj aplikację produkcyjną
https://apps.developer.allegro.pl/

**Uwaga:** Produkcja wymaga:
- Weryfikacji tożsamości
- Firmy/działalności gospodarczej (dla niektórych API)

### Krok 2: Zmień konfigurację
1. Otwórz: http://localhost:3000/admin/allegro/settings
2. **ODZNACZ** checkbox "🧪 Używaj Sandbox"
3. Wklej **produkcyjne** Client ID i Secret
4. Zapisz i przetestuj

### Krok 3: Sprawdź wskaźnik
Badge **"🧪 SANDBOX"** powinien **zniknąć** - jesteś w trybie produkcyjnym!

---

## FAQ

### ❓ Czy Sandbox jest darmowy?
**Tak!** Sandbox jest całkowicie darmowy - nie płacisz za API calls.

### ❓ Czy dane Sandbox są prawdziwe?
**Nie** - Sandbox używa testowych danych. To nie są prawdziwe oferty.

### ❓ Czy mogę testować płatności w Sandbox?
**Nie** - Sandbox jest tylko do testowania wyszukiwania ofert. Płatności działają tylko na produkcji.

### ❓ Czy token Sandbox działa na produkcji?
**Nie!** Tokeny Sandbox działają **tylko** w Sandbox. Musisz mieć osobne konto dla produkcji.

### ❓ Jak sprawdzić który tryb jest aktywny?
Sprawdź:
- Badge **"🧪 SANDBOX"** w prawym górnym rogu
- Logi konsoli: `[Allegro OAuth] (SANDBOX)` vs `(PRODUCTION)`
- Ustawienia: checkbox "🧪 Używaj Sandbox"

### ❓ Co jeśli widzę "Tryb DEMO"?
To znaczy że **nie masz skonfigurowanego OAuth** (ani Sandbox ani produkcja). System pokazuje przykładowe dane.

### ❓ Jak przełączyć się z powrotem na Sandbox?
1. Otwórz ustawienia
2. Zaznacz checkbox "🧪 Używaj Sandbox"
3. Wklej Sandbox credentials
4. Zapisz

---

## Techniczne szczegóły

### Pliki zmodyfikowane dla Sandbox

**lib/allegro-oauth.js**
- Funkcja `isSandbox()` - sprawdza tryb
- Przełączanie URL autoryzacji

**pages/api/allegro/search.js**
- Przełączanie URL API

**pages/admin/allegro/settings.js**
- Checkbox Sandbox
- Zapisywanie preferencji

**pages/api/allegro/config.js**
- Zapis/odczyt flagi sandbox

**pages/admin/allegro/search.js**
- Badge "🧪 SANDBOX"
- Sprawdzanie trybu

---

## Wsparcie

Jeśli masz problemy:

1. **Sprawdź logi konsoli** (`F12` → Console)
2. **Sprawdź tryb** (badge "🧪 SANDBOX")
3. **Przetestuj połączenie** w ustawieniach
4. **Sprawdź credentials** (Client ID/Secret)

---

## Następne kroki

Po udanym testowaniu Sandbox:
1. ✅ Przetestuj różne wyszukiwania
2. ✅ Sprawdź filtrowanie wyników
3. ✅ Przetestuj sortowanie
4. ✅ Gdy gotowe - przejdź na produkcję!

**Powodzenia! 🚀**
