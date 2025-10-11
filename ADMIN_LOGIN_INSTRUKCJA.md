# 🔐 Instrukcja Logowania do Panelu Admina

**Data utworzenia:** 10 października 2025  
**Status:** ✅ Aktywne

---

## 📍 Adres logowania

```
http://localhost:3000/admin/login
```

---

## 👥 Domyślne konta użytkowników

### 1. Administrator Systemu (pełny dostęp)
```
Email:    admin@technik.pl
Hasło:    admin123
Rola:     admin
Uprawnienia: * (wszystkie)
```

### 2. Kierownik Serwisu (ograniczony dostęp)
```
Email:    manager@technik.pl
Hasło:    manager123
Rola:     manager
Uprawnienia:
  - orders.view (przeglądanie zleceń)
  - orders.edit (edycja zleceń)
  - clients.view (przeglądanie klientów)
  - clients.edit (edycja klientów)
  - reports.view (przeglądanie raportów)
```

---

## 🚀 Jak się zalogować?

### Krok 1: Otwórz stronę logowania
1. Uruchom serwer: `npm run dev`
2. Otwórz przeglądarkę
3. Wejdź na: `http://localhost:3000/admin/login`

### Krok 2: Wprowadź dane
1. Wpisz email (np. `admin@technik.pl`)
2. Wpisz hasło (np. `admin123`)
3. Kliknij "Zaloguj się"

### Krok 3: Po zalogowaniu
- Zostaniesz przekierowany do: `/admin`
- Token zostanie zapisany w localStorage
- Dane użytkownika będą dostępne w sesji

---

## 🔒 Zabezpieczenia

### Automatyczna blokada konta
- Po **5 nieudanych próbach logowania** konto zostanie **zablokowane na 15 minut**
- Blokada jest automatycznie zdejmowana po upływie czasu
- Administrator może ręcznie odblokować konto w pliku `data/accounts.json`

### Przechowywanie hasheł
- Hasła są hashowane algorytmem **bcrypt** (cost factor: 12)
- Hasła **NIE są przechowywane w formie jawnej**
- Zalecana zmiana domyślnych haseł po pierwszym logowaniu

### Token JWT
- Token ważny przez **24 godziny**
- Przechowywany w localStorage jako `authToken`
- Automatyczne wylogowanie po wygaśnięciu tokenu

---

## 🛠️ Zarządzanie kontami

### Plik konfiguracyjny
```
data/accounts.json
```

### Struktura konta użytkownika
```json
{
  "id": "admin-001",
  "email": "admin@technik.pl",
  "password": "$2b$12$...", // hash bcrypt
  "name": "Administrator Systemu",
  "role": "admin",
  "permissions": ["*"],
  "isActive": true,
  "createdAt": "2025-10-10T20:57:52.967Z",
  "lastLogin": null,
  "loginAttempts": 0,
  "lockedUntil": null
}
```

### Dostępne role
1. **admin** - pełny dostęp do wszystkich funkcji
2. **manager** - zarządzanie zleceniami i klientami
3. **employee** - podstawowe operacje
4. **logistyk** - zarządzanie magazynem

### Dostępne uprawnienia
- `*` - wszystkie uprawnienia (tylko admin)
- `orders.view` - przeglądanie zleceń
- `orders.edit` - edycja zleceń
- `orders.create` - tworzenie zleceń
- `orders.delete` - usuwanie zleceń
- `clients.view` - przeglądanie klientów
- `clients.edit` - edycja klientów
- `reports.view` - przeglądanie raportów
- `reports.export` - eksport raportów
- `warehouse.view` - przeglądanie magazynu
- `warehouse.edit` - zarządzanie magazynem

---

## 📝 Jak dodać nowe konto?

### Metoda 1: Ręcznie (wymaga Node.js)

```bash
node -e "
const bcrypt = require('bcryptjs');
const fs = require('fs');
const accounts = JSON.parse(fs.readFileSync('data/accounts.json', 'utf8'));

accounts.push({
  id: 'employee-001',
  email: 'pracownik@technik.pl',
  password: bcrypt.hashSync('haslo123', 12),
  name: 'Jan Kowalski',
  role: 'employee',
  permissions: ['orders.view', 'clients.view'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastLogin: null,
  loginAttempts: 0,
  lockedUntil: null
});

fs.writeFileSync('data/accounts.json', JSON.stringify(accounts, null, 2));
console.log('✅ Konto utworzone');
"
```

### Metoda 2: Edycja pliku (tylko do testów)

**⚠️ UWAGA:** Hasło musi być zahashowane bcrypt!

1. Otwórz `data/accounts.json`
2. Dodaj nowy obiekt z danymi użytkownika
3. Użyj zahashowanego hasła (nigdy jawnego tekstu!)

---

## ❓ Rozwiązywanie problemów

### Problem: "Invalid email or password"
**Rozwiązanie:**
1. Sprawdź czy wpisujesz prawidłowy email
2. Upewnij się że Caps Lock jest wyłączony
3. Sprawdź czy konto istnieje w `data/accounts.json`

### Problem: "Account is temporarily locked"
**Rozwiązanie:**
1. Odczekaj 15 minut
2. LUB edytuj `data/accounts.json` i usuń pole `lockedUntil`
3. Ustaw `loginAttempts: 0`

### Problem: "Account is deactivated"
**Rozwiązanie:**
1. Otwórz `data/accounts.json`
2. Znajdź swoje konto
3. Zmień `"isActive": false` na `"isActive": true`

### Problem: Brak pliku accounts.json
**Rozwiązanie:**
Plik jest automatycznie tworzony przy pierwszej próbie logowania. Jeśli nie istnieje, wykonaj:

```bash
node -e "const bcrypt = require('bcryptjs'); const fs = require('fs'); const path = require('path'); const file = path.join(process.cwd(), 'data', 'accounts.json'); const accounts = [{id: 'admin-001', email: 'admin@technik.pl', password: bcrypt.hashSync('admin123', 12), name: 'Administrator Systemu', role: 'admin', permissions: ['*'], isActive: true, createdAt: new Date().toISOString(), lastLogin: null, loginAttempts: 0, lockedUntil: null}]; fs.writeFileSync(file, JSON.stringify(accounts, null, 2));"
```

---

## 🔄 Zmiana hasła

### Dla użytkownika (TODO - funkcja w przygotowaniu)
Planowana funkcja "Zmień hasło" w panelu ustawień użytkownika.

### Ręcznie przez kod
```bash
node -e "
const bcrypt = require('bcryptjs');
const fs = require('fs');
const accounts = JSON.parse(fs.readFileSync('data/accounts.json', 'utf8'));

const user = accounts.find(a => a.email === 'admin@technik.pl');
if (user) {
  user.password = bcrypt.hashSync('nowe-haslo', 12);
  fs.writeFileSync('data/accounts.json', JSON.stringify(accounts, null, 2));
  console.log('✅ Hasło zmienione dla:', user.email);
}
"
```

---

## 📊 Monitoring logowań

### Lokalizacja logów
Logi logowań są wyświetlane w konsoli serwera:
- `🔐 Login success: admin@technik.pl (admin)`
- `🔐 Account locked: manager@technik.pl (5 attempts)`

### Ostatnie logowanie
Pole `lastLogin` w `data/accounts.json` zawiera timestamp ostatniego udanego logowania.

---

## 🔗 Powiązane endpointy API

### POST /api/auth/login
Endpoint do logowania użytkowników.

**Request:**
```json
{
  "email": "admin@technik.pl",
  "password": "admin123"
}
```

**Response (sukces):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "admin-001",
      "email": "admin@technik.pl",
      "name": "Administrator Systemu",
      "role": "admin",
      "permissions": ["*"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Response (błąd):**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

---

## 🎯 Najszybszy sposób na start

```bash
# 1. Uruchom serwer
npm run dev

# 2. Otwórz przeglądarkę
http://localhost:3000/admin/login

# 3. Zaloguj się
Email: admin@technik.pl
Hasło: admin123

# 4. Gotowe! 🎉
```

---

## ⚠️ WAŻNE UWAGI BEZPIECZEŃSTWA

1. **Zmień domyślne hasła** po pierwszym logowaniu!
2. **Nie commituj** pliku `data/accounts.json` do repozytorium
3. Dodaj `data/accounts.json` do `.gitignore`
4. W produkcji użyj **silnych haseł** (min. 12 znaków)
5. Rozważ **2FA (two-factor authentication)** dla kont admin
6. Regularnie **przeglądaj logi** logowań

---

**Ostatnia aktualizacja:** 10 października 2025  
**Autor:** GitHub Copilot  
**Status:** ✅ Dokumentacja kompletna
