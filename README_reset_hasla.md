# 🛡️ Funkcjonalność "Zapomniałeś hasła" - Przewodnik testowania

## ✅ Co zostało zaimplementowane

### 1. **Strony użytkownika**
- **`/zapomniane-haslo`** - Formularz żądania resetowania hasła
- **`/reset-hasla?token=xxx`** - Formularz ustawiania nowego hasła
- Integracja z istniejącą stroną logowania (`/logowanie`)

### 2. **Panel administratora**
- **`/admin-bezpieczenstwo`** - Zarządzanie tokenami i logami bezpieczeństwa
- Link w głównym panelu admina (`/admin`)

### 3. **Funkcjonalność backend**
- **`utils/dataManager.js`** - Centralne zarządzanie danymi
- **`api/server-endpoints.js`** - Gotowe endpointy API
- **`database/schema.sql`** - Struktura bazy danych

### 4. **Strona testowa**
- **`/test-setup`** - Konfiguracja danych testowych i testowanie

---

## 🧪 Jak przetestować

### Krok 1: Przygotowanie danych testowych
1. Otwórz: **http://localhost:3000/test-setup**
2. Kliknij **"Utwórz użytkowników testowych"**
3. Kliknij **"Test resetowania hasła"** (opcjonalnie)

### Krok 2: Test procesu resetowania
1. Przejdź do: **http://localhost:3000/logowanie**
2. Kliknij **"Zapomniałeś hasła?"**
3. Wprowadź email: `reset.test@example.com`
4. Kliknij **"Wyślij link resetowania"**
5. W konsoli przeglądarki znajdź wygenerowany link
6. Skopiuj token z linka i przejdź do: `/reset-hasla?token=TWÓJ_TOKEN`
7. Ustaw nowe hasło (min. 8 znaków, litery i cyfra)

### Krok 3: Test panelu administratora
1. Przejdź do: **http://localhost:3000/admin-bezpieczenstwo**
2. Sprawdź zakładkę **"Tokeny resetowania"**
3. Sprawdź zakładkę **"Logi bezpieczeństwa"**

---

## 📋 Dostępni użytkownicy testowi

| Email | Hasło | Rola |
|-------|-------|------|
| `test@example.com` | `Test123!` | Klient |
| `admin@technik.com` | `Admin123!` | Administrator |
| `pracownik@technik.com` | `Work123!` | Pracownik |
| `reset.test@example.com` | `OldPassword123!` | Klient (do testów) |

---

## 🔧 Kluczowe funkcje

### Bezpieczeństwo
- ✅ Tokeny wygasają po 1 godzinie
- ✅ Tokeny są jednorazowe (nie można użyć ponownie)
- ✅ Walidacja siły hasła
- ✅ Logowanie zdarzeń bezpieczeństwa
- ✅ Automatic cleanup wygasłych tokenów

### UX/UI
- ✅ Responsywny design
- ✅ Wskaźnik siły hasła
- ✅ Informacje zwrotne użytkownikowi
- ✅ Loading states
- ✅ Error handling

### Funkcjonalność techniczna
- ✅ localStorage jako storage (gotowe na migrację na serwer)
- ✅ Abstrakcja dataManager (łatwa zmiana na API)
- ✅ Kompatybilność z istniejącym systemem
- ✅ Przygotowane endpointy API
- ✅ Struktura bazy danych

---

## 🚀 Migracja na serwer

Gdy będziesz gotowy na migrację:

1. **Zmień flagę w dataManager.js:**
   ```javascript
   this.apiMode = true; // false = localStorage, true = server API
   ```

2. **Ustaw URL serwera:**
   ```javascript
   this.serverUrl = 'https://twoj-serwer.com/api';
   ```

3. **Zaimplementuj endpointy** z `api/server-endpoints.js`

4. **Utwórz bazę danych** z `database/schema.sql`

---

## 🔍 Debugowanie

### Sprawdzenie danych w localStorage
1. F12 → Console
2. `localStorage` - zobacz wszystkie klucze
3. `JSON.parse(localStorage.getItem('technik_app_users'))` - użytkownicy
4. `JSON.parse(localStorage.getItem('technik_app_resetTokens'))` - tokeny

### Logi bezpieczeństwa
Wszystkie akcje związane z resetowaniem hasła są logowane w `securityLog`.

---

## ⚠️ Uwagi dotyczące produkcji

1. **Email sending** - W produkcji dodaj prawdziwą wysyłkę emaili
2. **Password hashing** - Używaj bcrypt lub podobnego
3. **Rate limiting** - Ogranicz liczbę żądań resetowania
4. **HTTPS** - Wymagane dla tokenów resetowania
5. **Environment variables** - Przechowuj konfigurację w zmiennych środowiskowych

---

## 📞 Pomoc

W razie problemów sprawdź:
- Konsolę przeglądarki (F12)
- Terminal z Next.js
- Dane w localStorage
- Panel `/test-setup` do debugowania
