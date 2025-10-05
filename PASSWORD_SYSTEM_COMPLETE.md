# 🔐 SYSTEM ZARZĄDZANIA HASŁAMI - KOMPLETNA IMPLEMENTACJA

**Data:** 2025-10-04  
**Status:** ✅ ZAIMPLEMENTOWANO  
**Wersja:** 1.0

---

## 🎯 CO ZOSTAŁO ZAIMPLEMENTOWANE

### **1. API Zarządzania Hasłami PRACOWNIKÓW**
- ✅ `pages/api/admin/employee-password.js`
- Reset hasła
- Generowanie tymczasowego hasła  
- Wymuszanie zmiany hasła
- Odblokowywanie konta

### **2. API Zarządzania Hasłami KLIENTÓW**
- ✅ `pages/api/admin/client-password.js`
- Reset hasła
- Generowanie tymczasowego hasła
- Wysyłka hasła emailem (TODO: integracja)
- Wysyłka hasła SMS-em (TODO: integracja)

### **3. API Logowania KLIENTÓW**
- ✅ `pages/api/client/auth.js`
- **3 sposoby logowania:**
  1. EMAIL + HASŁO
  2. TELEFON + HASŁO
  3. NUMER ZAMÓWIENIA + HASŁO

### **4. Aktualizacja API Pracowników**
- ✅ `pages/api/technician/auth.js`
- Dodano bcrypt zamiast hardcoded hasła
- Fallback na `haslo123` dla wstecznej kompatybilności
- Blokada konta po 5 nieudanych próbach

### **5. Pliki danych**
- ✅ `data/client-sessions.json`

---

## 📋 STRUKTURA DANYCH

### **employees.json** (Pracownicy)

```json
{
  "id": "EMP25189001",
  "name": "Jan Kowalski",
  "email": "jan.kowalski@techserwis.pl",
  "phone": "+48 123 456 789",
  
  // ⭐ NOWE POLA BEZPIECZEŃSTWA:
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "passwordSetAt": "2025-10-04T12:00:00.000Z",
  "passwordChangedBy": "admin",
  "requirePasswordChange": false,
  "lastPasswordChange": "2025-10-04T12:00:00.000Z",
  "isLocked": false,
  "failedLoginAttempts": 0,
  "lastLoginAttempt": null,
  "lastLogin": "2025-10-04T12:30:00.000Z",
  "passwordHistory": [
    {
      "hash": "$2a$10$...",
      "changedAt": "2025-10-03T10:00:00.000Z",
      "changedBy": "admin"
    }
  ],
  
  // Reszta pól...
  "isActive": true,
  "specializations": ["Serwis AGD"]
}
```

### **clients.json** (Klienci)

```json
{
  "id": "CLI12345",
  "name": "Anna Nowak",
  "email": "anna.nowak@example.com",
  "phone": "+48 500 123 456",
  "address": "ul. Kwiatowa 5, Warszawa",
  
  // ⭐ NOWE POLA BEZPIECZEŃSTWA:
  "passwordHash": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM",
  "passwordSetAt": "2025-10-04T12:00:00.000Z",
  "passwordChangedBy": "admin",
  "lastPasswordChange": "2025-10-04T12:00:00.000Z",
  "isLocked": false,
  "failedLoginAttempts": 0,
  "lastLoginAttempt": null,
  "lastLogin": "2025-10-04T13:00:00.000Z",
  "lastLoginMethod": "email",
  "passwordHistory": [
    {
      "hash": "$2a$10$...",
      "changedAt": "2025-10-03T10:00:00.000Z",
      "changedBy": "admin"
    }
  ]
}
```

### **technician-sessions.json** (Sesje Pracowników)

```json
[
  {
    "token": "ddba751e-5c34-4e03-89fc-5b6d08f4e63f",
    "employeeId": "EMP25189001",
    "email": "jan.kowalski@techserwis.pl",
    "createdAt": "2025-10-04T12:00:00.000Z",
    "lastActivity": "2025-10-04T12:30:00.000Z",
    "isValid": true,
    "rememberMe": false,
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  }
]
```

### **client-sessions.json** (Sesje Klientów)

```json
[
  {
    "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clientId": "CLI12345",
    "email": "anna.nowak@example.com",
    "phone": "+48 500 123 456",
    "loginMethod": "email",
    "createdAt": "2025-10-04T13:00:00.000Z",
    "lastActivity": "2025-10-04T13:30:00.000Z",
    "isValid": true,
    "rememberMe": true,
    "ip": "192.168.0.100",
    "userAgent": "Mozilla/5.0..."
  }
]
```

---

## 🔧 API ENDPOINTS

### **1. Zarządzanie hasłami PRACOWNIKÓW**

#### **POST /api/admin/employee-password**

**Reset hasła (admin podaje nowe):**
```json
{
  "action": "reset",
  "employeeId": "EMP25189001",
  "newPassword": "NoweHaslo123!",
  "adminId": "ADMIN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "employeeId": "EMP25189001",
    "passwordSetAt": "2025-10-04T12:00:00.000Z"
  }
}
```

**Wygeneruj tymczasowe hasło:**
```json
{
  "action": "generate",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Temporary password generated successfully",
  "data": {
    "employeeId": "EMP25189001",
    "temporaryPassword": "A7F3D2E1",
    "passwordSetAt": "2025-10-04T12:00:00.000Z",
    "requirePasswordChange": true
  }
}
```

**Wymaga zmiany hasła:**
```json
{
  "action": "require-change",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

**Odblokuj konto:**
```json
{
  "action": "unlock",
  "employeeId": "EMP25189001",
  "adminId": "ADMIN001"
}
```

#### **GET /api/admin/employee-password?employeeId=EMP25189001**

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPassword": true,
    "passwordSetAt": "2025-10-04T12:00:00.000Z",
    "requirePasswordChange": false,
    "lastPasswordChange": "2025-10-04T12:00:00.000Z",
    "passwordChangedBy": "admin",
    "isLocked": false,
    "failedLoginAttempts": 0,
    "lastLoginAttempt": null
  }
}
```

---

### **2. Zarządzanie hasłami KLIENTÓW**

#### **POST /api/admin/client-password**

**Reset hasła:**
```json
{
  "action": "reset",
  "clientId": "CLI12345",
  "newPassword": "NoweHaslo123",
  "adminId": "ADMIN001"
}
```

**Wygeneruj i wyślij emailem:**
```json
{
  "action": "send-email",
  "clientId": "CLI12345",
  "adminId": "ADMIN001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password generated and email sent",
  "data": {
    "clientId": "CLI12345",
    "temporaryPassword": "123456",
    "emailSent": "anna.nowak@example.com",
    "passwordSetAt": "2025-10-04T12:00:00.000Z"
  }
}
```

**Wygeneruj i wyślij SMS-em:**
```json
{
  "action": "send-sms",
  "clientId": "CLI12345",
  "adminId": "ADMIN001"
}
```

#### **GET /api/admin/client-password?clientId=CLI12345**

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPassword": true,
    "passwordSetAt": "2025-10-04T12:00:00.000Z",
    "lastPasswordChange": "2025-10-04T12:00:00.000Z",
    "passwordChangedBy": "admin",
    "lastLogin": "2025-10-04T13:00:00.000Z",
    "lastLoginMethod": "email"
  }
}
```

---

### **3. Logowanie KLIENTÓW**

#### **POST /api/client/auth**

**Metoda 1: EMAIL + HASŁO**
```json
{
  "action": "login",
  "identifier": "anna.nowak@example.com",
  "password": "123456",
  "rememberMe": true,
  "loginMethod": "email"
}
```

**Metoda 2: TELEFON + HASŁO**
```json
{
  "action": "login",
  "identifier": "+48 500 123 456",
  "password": "123456",
  "rememberMe": true,
  "loginMethod": "phone"
}
```

**Metoda 3: NUMER ZAMÓWIENIA + HASŁO**
```json
{
  "action": "login",
  "identifier": "ORD-2025-001",
  "password": "123456",
  "rememberMe": true,
  "loginMethod": "order"
}
```

**Response (wszystkie metody):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client": {
    "id": "CLI12345",
    "email": "anna.nowak@example.com",
    "phone": "+48 500 123 456",
    "name": "Anna Nowak",
    "firstName": "Anna",
    "lastName": "Nowak",
    "address": "ul. Kwiatowa 5, Warszawa",
    "loginMethod": "email"
  },
  "loginMethod": "email"
}
```

**Logout:**
```json
{
  "action": "logout"
}
```

Headers:
```
Authorization: Bearer a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Walidacja tokenu:**
```
GET /api/client/auth?action=validate
Authorization: Bearer a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Sprawdź czy konto istnieje (bez logowania):**
```json
{
  "action": "check",
  "identifier": "anna.nowak@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "found": true,
  "method": "email",
  "message": "Account found. You can login with email."
}
```

---

### **4. Logowanie PRACOWNIKÓW**

#### **POST /api/technician/auth**

**Logowanie:**
```json
{
  "action": "login",
  "email": "jan.kowalski@techserwis.pl",
  "password": "haslo123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "ddba751e-5c34-4e03-89fc-5b6d08f4e63f",
  "employee": {
    "id": "EMP25189001",
    "email": "jan.kowalski@techserwis.pl",
    "name": "Jan Kowalski",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "specializations": ["Serwis AGD"],
    "workingHours": "8:00-16:00",
    "phone": "+48 123 456 789",
    "address": "Warszawa",
    "rating": 4.8
  }
}
```

---

## 🔒 BEZPIECZEŃSTWO

### **Haszowanie Haseł (bcrypt)**

```javascript
import bcrypt from 'bcryptjs';

// Hashowanie (przy tworzeniu/zmianie hasła)
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);

// Weryfikacja (przy logowaniu)
const isValid = await bcrypt.compare(password, passwordHash);
```

**Przykład hash:**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Właściwości:**
- ✅ Nie można odwrócić (one-way)
- ✅ Każde hashowanie daje inny wynik (salt)
- ✅ Wolne (odporność na brute-force)
- ✅ Używane przez banki i wielkie firmy

---

### **Polityka Bezpieczeństwa**

#### **Pracownicy:**
- Minimalna długość hasła: **8 znaków**
- Blokada konta po: **5 nieudanych próbach**
- Ważność tokenu: **7 dni**
- Historia haseł: **5 ostatnich** (nie można użyć ponownie)

#### **Klienci:**
- Minimalna długość hasła: **6 znaków** (cyfry)
- Blokada konta po: **5 nieudanych próbach**
- Ważność tokenu: **30 dni**
- Historia haseł: **3 ostatnie**

---

## 📊 FUNKCJE

### **Blokada Konta**

Po 5 nieudanych próbach logowania:
```json
{
  "success": false,
  "message": "Account locked due to too many failed attempts. Contact administrator.",
  "isLocked": true
}
```

Admin może odblokować:
```json
{
  "action": "unlock",
  "employeeId": "EMP25189001"
}
```

---

### **Wymuszanie Zmiany Hasła**

Admin może wymusić zmianę hasła przy następnym logowaniu:
```json
{
  "action": "require-change",
  "employeeId": "EMP25189001"
}
```

Przy logowaniu pracownik dostanie:
```json
{
  "success": false,
  "message": "Password change required. Contact administrator.",
  "requirePasswordChange": true
}
```

---

### **Historia Haseł**

System zapamiętuje ostatnie hasła (hash):
```json
{
  "passwordHistory": [
    {
      "hash": "$2a$10$...",
      "changedAt": "2025-10-03T10:00:00.000Z",
      "changedBy": "admin"
    },
    {
      "hash": "$2a$10$...",
      "changedAt": "2025-10-02T15:00:00.000Z",
      "changedBy": "employee"
    }
  ]
}
```

**Pracownicy:** 5 ostatnich haseł  
**Klienci:** 3 ostatnie hasła

---

## 🧪 TESTOWANIE

### **1. Test Zarządzania Hasłami Pracownika**

```powershell
# Wygeneruj tymczasowe hasło
curl -X POST http://localhost:3000/api/admin/employee-password `
  -H "Content-Type: application/json" `
  -d '{
    "action": "generate",
    "employeeId": "EMP25189001",
    "adminId": "ADMIN001"
  }'
```

**Response:**
```json
{
  "success": true,
  "temporaryPassword": "A7F3D2E1"
}
```

```powershell
# Zaloguj się tym hasłem
curl -X POST http://localhost:3000/api/technician/auth `
  -H "Content-Type: application/json" `
  -d '{
    "action": "login",
    "email": "jan.kowalski@techserwis.pl",
    "password": "A7F3D2E1"
  }'
```

---

### **2. Test Logowania Klienta (3 metody)**

#### **Metoda 1: EMAIL**
```powershell
curl -X POST http://localhost:3000/api/client/auth `
  -H "Content-Type: application/json" `
  -d '{
    "action": "login",
    "identifier": "anna.nowak@example.com",
    "password": "123456"
  }'
```

#### **Metoda 2: TELEFON**
```powershell
curl -X POST http://localhost:3000/api/client/auth `
  -H "Content-Type: application/json" `
  -d '{
    "action": "login",
    "identifier": "+48 500 123 456",
    "password": "123456"
  }'
```

#### **Metoda 3: NUMER ZAMÓWIENIA**
```powershell
curl -X POST http://localhost:3000/api/client/auth `
  -H "Content-Type: application/json" `
  -d '{
    "action": "login",
    "identifier": "ORD-2025-001",
    "password": "123456"
  }'
```

---

### **3. Test Sprawdzenia Statusu Hasła**

```powershell
# Sprawdź status hasła pracownika
curl http://localhost:3000/api/admin/employee-password?employeeId=EMP25189001

# Sprawdź status hasła klienta
curl http://localhost:3000/api/admin/client-password?clientId=CLI12345
```

---

## 🚀 NASTĘPNE KROKI

### **Które TODO zostały zrobione:**
- ✅ Instalacja bcryptjs
- ✅ API zarządzania hasłami pracowników
- ✅ API zarządzania hasłami klientów
- ✅ API logowania klientów (3 metody)
- ✅ Aktualizacja auth.js pracowników (bcrypt)

### **Co jeszcze trzeba zrobić:**

#### **1. Komponent UI SecurityTab**
- Formularz resetowania hasła
- Przycisk generowania tymczasowego hasła
- Wyświetlanie statusu hasła
- Historia zmian

#### **2. Dodanie zakładki Security w edycji pracownika**
- `pages/admin/pracownicy/[id].js`
- Nowa zakładka "🔐 Bezpieczeństwo"
- Import SecurityTab

#### **3. Migracja danych**
- Skrypt dodający `passwordHash` do wszystkich pracowników
- Skrypt dodający `passwordHash` do wszystkich klientów
- Hash domyślnego hasła: `haslo123`

#### **4. Strona logowania klientów**
- `pages/client/login.js`
- 3 zakładki: EMAIL / TELEFON / ZAMÓWIENIE
- Responsywny design

#### **5. Integracja email/SMS**
- Wysyłka hasła emailem (Resend API - już masz)
- Wysyłka hasła SMS-em (Twilio)

---

## 📝 PLIKI UTWORZONE

| Plik | Status | Opis |
|------|--------|------|
| `pages/api/admin/employee-password.js` | ✅ | Zarządzanie hasłami pracowników |
| `pages/api/admin/client-password.js` | ✅ | Zarządzanie hasłami klientów |
| `pages/api/client/auth.js` | ✅ | Logowanie klientów (3 metody) |
| `pages/api/technician/auth.js` | ✅ | Zaktualizowano o bcrypt |
| `data/client-sessions.json` | ✅ | Sesje klientów |
| `PASSWORD_SYSTEM_COMPLETE.md` | ✅ | Ta dokumentacja |

---

## 💡 NAJWAŻNIEJSZE

### **1. Hasła są BEZPIECZNE**
- ✅ Hashowane (bcrypt)
- ✅ Nie można odwrócić
- ✅ Salt dla każdego hasła
- ✅ Historia (nie można użyć starego)

### **2. Logowanie KLIENTÓW - 3 sposoby**
- ✅ EMAIL + HASŁO
- ✅ TELEFON + HASŁO
- ✅ NUMER ZAMÓWIENIA + HASŁO

### **3. Admin ma KONTROLĘ**
- ✅ Reset hasła
- ✅ Generowanie tymczasowych haseł
- ✅ Wymuszanie zmiany
- ✅ Odblokowanie konta

### **4. Zabezpieczenia**
- ✅ Blokada po 5 nieudanych próbach
- ✅ Sesje z expiracją (7/30 dni)
- ✅ Historia haseł
- ✅ IP i User-Agent logging

---

## ⚠️ WAŻNE UWAGI

### **Fallback dla Pracowników**

System ma **wsteczną kompatybilność**:
- Jeśli pracownik **NIE MA** `passwordHash` → używa domyślnego `haslo123`
- Jeśli pracownik **MA** `passwordHash` → używa bcrypt

**Dlatego trzeba uruchomić migrację!**

### **Migracja (TODO)**

Skrypt który:
1. Czyta `employees.json`
2. Dla każdego pracownika BEZ `passwordHash`:
   - Hashuje `haslo123`
   - Dodaje `passwordHash`
   - Dodaje `passwordSetAt`
3. Zapisuje z powrotem

To samo dla `clients.json`.

---

## 🎯 GOTOWE DO UŻYCIA

System jest **FUNKCJONALNY**!

Możesz już:
- ✅ Zarządzać hasłami przez API
- ✅ Logować pracowników (haslo123 lub nowe hasła)
- ✅ Logować klientów (3 metody)

Co pozostało:
- 🔧 UI w panelu admina (SecurityTab)
- 🔧 Migracja danych (skrypt)
- 🔧 Strona logowania klientów

---

**Status:** ✅ Backend kompletny!  
**Priorytet następny:** UI + Migracja  
**Czas implementacji:** ~2-3 godziny

