# 🚀 INSTRUKCJA URUCHOMIENIA SYSTEMU HASEŁ

**Data:** 2025-10-04  
**Status:** ✅ GOTOWE DO URUCHOMIENIA

---

## ✅ CO ZOSTAŁO ZROBIONE

### **Backend (100% ✅)**
- ✅ API zarządzania hasłami pracowników (`employee-password.js`)
- ✅ API zarządzania hasłami klientów (`client-password.js`)
- ✅ API logowania klientów z 3 metodami (`client/auth.js`)
- ✅ Zaktualizowano auth pracowników o bcrypt (`technician/auth.js`)
- ✅ Utworzono `client-sessions.json`

### **Frontend (100% ✅)**
- ✅ Komponent `SecurityTab.js` (UI zarządzania hasłami)
- ✅ Integracja w `admin/pracownicy/[id].js` (zakładka Bezpieczeństwo)

### **Migracja (100% ✅)**
- ✅ Skrypt migracji pracowników (`migrate-employee-passwords.js`)
- ✅ Skrypt migracji klientów (`migrate-client-passwords.js`)

### **Dokumentacja (100% ✅)**
- ✅ `PASSWORD_SYSTEM_COMPLETE.md` - pełna dokumentacja API
- ✅ `INSTRUKCJA_MIGRACJI.md` - ta instrukcja

---

## 🔧 JAK URUCHOMIĆ SYSTEM

### **Krok 1: Migracja Pracowników** ⚠️ WYMAGANE

To doda `passwordHash` do wszystkich istniejących pracowników.

```powershell
# Uruchom skrypt migracji
node scripts/migrate-employee-passwords.js
```

**Co się stanie:**
- ✅ Tworzy backup: `data/employees.backup.json`
- ✅ Dla każdego pracownika bez hasła:
  - Hashuje domyślne hasło: `haslo123`
  - Dodaje pola: `passwordHash`, `passwordSetAt`, `isLocked`, etc.
- ✅ Wyświetla podsumowanie

**Po migracji:**
- Wszyscy pracownicy mogą się logować hasłem: `haslo123`
- System działa w trybie: **bcrypt hash** (jeśli istnieje) OR **fallback "haslo123"** (jeśli nie ma)

---

### **Krok 2: Migracja Klientów** (Opcjonalne)

To wygeneruje UNIKALNE hasła dla wszystkich klientów.

```powershell
# Uruchom skrypt migracji
node scripts/migrate-client-passwords.js
```

**Co się stanie:**
- ✅ Tworzy backup: `data/clients.backup.json`
- ✅ Dla każdego klienta bez hasła:
  - Generuje losowe 6-cyfrowe hasło (np. `123456`)
  - Hashuje hasło (bcrypt)
  - Dodaje pola: `passwordHash`, `passwordSetAt`, `isLocked`, etc.
- ✅ Zapisuje wszystkie hasła do CSV: `data/client-passwords-generated.csv`
- ✅ Wyświetla podsumowanie

**⚠️ UWAGA:**
- Plik CSV zawiera NIEZAHASHOWANE hasła klientów!
- **Musisz wysłać te hasła klientom** (email/SMS/telefon)
- **Usuń CSV po wysłaniu haseł** (bezpieczeństwo!)
- **NIE commituj CSV do gita!**

**Po migracji:**
- Klienci mogą się logować 3 sposobami:
  1. EMAIL + hasło
  2. TELEFON + hasło
  3. NUMER ZAMÓWIENIA + hasło

---

### **Krok 3: Testowanie Systemu**

#### **Test 1: Logowanie Pracownika**

1. Otwórz: http://localhost:3000/technician/login
2. Zaloguj się:
   - Email: `jan.kowalski@techserwis.pl` (lub inny z `employees.json`)
   - Hasło: `haslo123`
3. ✅ Powinno zalogować

#### **Test 2: Panel Admina - Zarządzanie Hasłem Pracownika**

1. Otwórz: http://localhost:3000/admin/pracownicy
2. Wybierz pracownika → **Edytuj**
3. Kliknij zakładkę: **🔐 Bezpieczeństwo**
4. Powinieneś zobaczyć:
   - Status hasła (ustawione/nie ustawione)
   - Formularz resetu hasła
   - Przycisk "Wygeneruj tymczasowe"
   - Przycisk "Wymaga zmiany"
   - Przycisk "Odblokuj konto"

#### **Test 3: Zmiana Hasła Pracownika**

1. W zakładce Bezpieczeństwo
2. Wpisz nowe hasło: `NoweHaslo123!`
3. Kliknij "Zmień hasło"
4. ✅ Powinien pokazać: "✅ Hasło zostało zmienione"
5. Wyloguj się i zaloguj ponownie nowym hasłem

#### **Test 4: Wygenerowanie Tymczasowego Hasła**

1. W zakładce Bezpieczeństwo
2. Kliknij "Wygeneruj tymczasowe"
3. ✅ Powinien pokazać 8-znakowe hasło (np. `A7F3D2E1`) w żółtym boxie
4. **Skopiuj to hasło!** (pokazane tylko raz)
5. Wyloguj się
6. Zaloguj się tym hasłem
7. System powinien wymagać zmiany hasła

#### **Test 5: Blokada Konta (5 nieudanych prób)**

1. Wyloguj się
2. Spróbuj zalogować się 5 razy ze złym hasłem
3. ✅ Po 5 próbie konto powinno się zablokować
4. Wejdź do admina → Pracownicy → [Edytuj] → Bezpieczeństwo
5. Powinieneś zobaczyć: "Status konta: ZABLOKOWANE"
6. Kliknij "Odblokuj konto"
7. ✅ Pracownik może się znowu logować

---

## 📊 CO MOŻESZ TERAZ ZROBIĆ

### **Dla Pracowników:**

✅ **Wyświetl status hasła**
- Panel admin → Pracownicy → [Edytuj] → Bezpieczeństwo
- Zobacz: czy ma hasło, kiedy ustawione, blokada, nieudane próby

✅ **Zmień hasło**
- Wpisz nowe hasło (min. 8 znaków)
- Kliknij "Zmień hasło"

✅ **Wygeneruj tymczasowe hasło**
- Kliknij "Wygeneruj tymczasowe"
- System wygeneruje losowe 8-znakowe hasło (hex, uppercase)
- Pokazane tylko RAZ (musisz skopiować!)
- Pracownik będzie musiał je zmienić przy logowaniu

✅ **Wymaga zmiany hasła**
- Kliknij "Wymaga zmiany"
- Pracownik będzie musiał zmienić hasło przy następnym logowaniu

✅ **Odblokuj konto**
- Jeśli pracownik się zablokował (5 nieudanych prób)
- Kliknij "Odblokuj konto"

---

### **Dla Klientów (TODO - Panel Admina):**

Funkcje są w API, ale brak UI w panelu admina. Możesz:

#### **Przez API:**

```powershell
# Wygeneruj hasło i wyślij emailem
curl -X POST http://localhost:3000/api/admin/client-password `
  -H "Content-Type: application/json" `
  -d '{
    "action": "send-email",
    "clientId": "CLI12345",
    "adminId": "ADMIN001"
  }'

# Wygeneruj hasło i wyślij SMS-em
curl -X POST http://localhost:3000/api/admin/client-password `
  -H "Content-Type: application/json" `
  -d '{
    "action": "send-sms",
    "clientId": "CLI12345",
    "adminId": "ADMIN001"
  }'
```

#### **Przez CSV:**

Po uruchomieniu migracji klientów:
1. Otwórz `data/client-passwords-generated.csv`
2. Wyślij hasła klientom ręcznie (email/telefon)
3. Usuń CSV!

---

## 🔒 BEZPIECZEŃSTWO

### **Hasła są BEZPIECZNE:**

✅ **Hashowane z bcrypt**
- Nie można odwrócić (one-way hash)
- Salt dla każdego hasła (losowy)
- Wolne (odporność na brute-force)

✅ **Historia haseł**
- Pracownicy: 5 ostatnich haseł (nie można użyć ponownie)
- Klienci: 3 ostatnie hasła

✅ **Blokada konta**
- Po 5 nieudanych próbach logowania
- Admin może odblokować

✅ **Sesje z expiracją**
- Pracownicy: 7 dni
- Klienci: 30 dni

✅ **Audit trail**
- Kto zmienił hasło i kiedy
- IP i User-Agent w sesji

---

## ⚠️ WAŻNE UWAGI

### **1. Hasła domyślne**

Po migracji pracowników:
- Wszyscy używają hasła: `haslo123`
- **Zaleca się zmianę hasła dla każdego pracownika**
- Możesz wymusić zmianę hasła przy następnym logowaniu

### **2. Plik CSV z hasłami klientów**

Po migracji klientów:
- `data/client-passwords-generated.csv` - ZAWIERA HASŁA!
- **Wyślij hasła klientom**
- **Usuń plik CSV**
- **Dodaj do .gitignore**

```bash
# Dodaj do .gitignore
echo "data/client-passwords-generated.csv" >> .gitignore
echo "data/*.backup.json" >> .gitignore
```

### **3. Backup**

Migracje tworzą backupy automatycznie:
- `data/employees.backup.json`
- `data/clients.backup.json`

Jeśli coś pójdzie nie tak:
```powershell
# Przywróć pracowników
copy data/employees.backup.json data/employees.json

# Przywróć klientów
copy data/clients.backup.json data/clients.json
```

### **4. Email/SMS (TODO)**

API ma gotowe endpointy:
- `POST /api/admin/client-password` (action: send-email)
- `POST /api/admin/client-password` (action: send-sms)

Ale brakuje integracji:
- **Resend API** - do wysyłki emaili (już używasz w projekcie)
- **Twilio** - do wysyłki SMS-ów (trzeba dodać)

---

## 📝 KOLEJNE KROKI (Opcjonalne)

### **1. Odzyskiwanie hasła dla klientów**

Możesz dodać stronę:
- `pages/client/forgot-password.js`
- Klient podaje email/telefon
- System wysyła link resetujący (email) lub kod (SMS)

### **2. Panel zarządzania hasłami klientów**

Dodać podobny komponent jak SecurityTab:
- W `pages/admin/klienci/[id].js`
- Zakładka "Bezpieczeństwo"
- Możliwość wysyłki hasła emailem/SMS

### **3. Zmiana hasła przez pracownika**

Dodać stronę:
- `pages/technician/change-password.js`
- Pracownik może sam zmienić hasło (stare → nowe)

### **4. Wymuszanie silnych haseł**

Dodać walidację:
- Minimum 12 znaków
- Przynajmniej 1 wielka litera
- Przynajmniej 1 cyfra
- Przynajmniej 1 znak specjalny

---

## 🎯 STATUS KOŃCOWY

| Funkcja | Status |
|---------|--------|
| Backend API (pracownicy) | ✅ GOTOWE |
| Backend API (klienci) | ✅ GOTOWE |
| Backend API (logowanie klientów) | ✅ GOTOWE |
| UI - SecurityTab (pracownicy) | ✅ GOTOWE |
| UI - Panel klientów | ⏳ TODO |
| Migracja pracowników | ✅ GOTOWE |
| Migracja klientów | ✅ GOTOWE |
| Email/SMS integracja | ⏳ TODO |
| Odzyskiwanie hasła | ⏳ TODO |

---

## 📞 WSPARCIE

Jeśli masz problem:

1. Sprawdź logi w konsoli
2. Sprawdź czy migracja się udała
3. Sprawdź backup files
4. Sprawdź błędy w przeglądarce (F12 → Console)

Jeśli nadal nie działa - przywróć backup i uruchom migrację ponownie.

---

**✅ System jest GOTOWY do użycia!**

Uruchom migrację pracowników i możesz zacząć zarządzać hasłami w panelu admina! 🎉

