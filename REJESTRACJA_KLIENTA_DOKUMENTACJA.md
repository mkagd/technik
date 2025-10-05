# 📝 System Rejestracji Klientów - Dokumentacja

**Data utworzenia:** 4 października 2025  
**Status:** ✅ Kompletny i działający

---

## 📋 Spis Treści

1. [Przegląd](#przegląd)
2. [Funkcjonalności](#funkcjonalności)
3. [Struktura Techniczna](#struktura-techniczna)
4. [Proces Rejestracji](#proces-rejestracji)
5. [Walidacja Danych](#walidacja-danych)
6. [Bezpieczeństwo](#bezpieczeństwo)
7. [Testowanie](#testowanie)

---

## 🎯 Przegląd

System rejestracji klientów umożliwia:
- ✅ Tworzenie nowych kont klientów (osoby prywatne i firmy)
- ✅ Trójstopniowy proces rejestracji z walidacją
- ✅ Automatyczne logowanie po rejestracji
- ✅ Bezpieczne przechowywanie haseł (bcrypt)
- ✅ Sprawdzanie unikalności email/telefonu/NIP

---

## 🚀 Funkcjonalności

### **1. Wybór Typu Konta**
- **Osoba prywatna** - dla indywidualnych klientów
- **Firma** - wymagane dodatkowe dane (nazwa firmy, NIP)

### **2. Trójstopniowy Formularz**

#### **Krok 1: Dane Osobowe**
- Imię i nazwisko (wymagane)
- Nazwa firmy (tylko dla firm)
- NIP (tylko dla firm, 10 cyfr)
- Email (walidacja formatu)
- Telefon stacjonarny (wymagany)
- Telefon komórkowy (opcjonalny)

#### **Krok 2: Adres**
- Ulica
- Numer budynku
- Numer mieszkania (opcjonalny)
- Miasto
- Kod pocztowy (format XX-XXX)
- Województwo (automatycznie: podkarpackie)

#### **Krok 3: Hasło**
- Hasło (min. 6 znaków)
- Potwierdzenie hasła
- Wizualna walidacja wymagań
- Toggle pokazywania/ukrywania hasła

### **3. Walidacja w Czasie Rzeczywistym**
- ✅ Format email
- ✅ Długość hasła
- ✅ Zgodność haseł
- ✅ Format NIP (10 cyfr)
- ✅ Format kodu pocztowego
- ✅ Wypełnienie wymaganych pól

### **4. Sprawdzanie Unikalności**
Backend sprawdza:
- Email (czy już zarejestrowany)
- Telefon (czy już używany)
- NIP (dla firm, czy już istnieje)

### **5. Automatyczne Logowanie**
Po pomyślnej rejestracji:
- Utworzenie sesji
- Zapisanie tokenu w localStorage
- Przekierowanie na `/client/dashboard`

---

## 🏗️ Struktura Techniczna

### **Pliki**

```
pages/
├── client/
│   ├── register.js          # Strona rejestracji (3 kroki)
│   └── login.js             # Link do rejestracji
│
api/
└── client/
    └── auth.js              # Endpoint rejestracji (action=register)
```

### **API Endpoint**

**URL:** `/api/client/auth`  
**Metoda:** `POST`  
**Action:** `register`

**Request Body:**
```json
{
  "action": "register",
  "type": "individual",  // lub "company"
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan@example.com",
  "phone": "123-456-789",
  "mobile": "987-654-321",
  "address": {
    "street": "ul. Krakowska",
    "buildingNumber": "15",
    "apartmentNumber": "3",
    "city": "Dębica",
    "postalCode": "39-200",
    "voivodeship": "podkarpackie",
    "country": "Polska"
  },
  "password": "haslo123",
  
  // Tylko dla firm:
  "companyName": "TECH-AGD Sp. z o.o.",
  "nip": "1234567890"
}
```

**Response (sukces):**
```json
{
  "success": true,
  "message": "✅ Konto zostało utworzone pomyślnie",
  "client": {
    "id": "CLI2025000019",
    "name": "Jan Kowalski",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "email": "jan@example.com",
    "phone": "123-456-789",
    "mobile": "987-654-321",
    "type": "individual",
    "address": { ... }
  },
  "token": "uuid-token-here"
}
```

**Response (błąd):**
```json
{
  "success": false,
  "message": "Ten adres email jest już zarejestrowany"
}
```

---

## 🔄 Proces Rejestracji

### **Frontend Flow:**

```
1. Użytkownik otwiera /client/register
   ↓
2. Wybiera typ konta (osoba/firma)
   ↓
3. KROK 1: Wypełnia dane osobowe
   - Walidacja po kliknięciu "Dalej"
   - Jeśli OK → przejście do kroku 2
   ↓
4. KROK 2: Wypełnia adres
   - Walidacja po kliknięciu "Dalej"
   - Jeśli OK → przejście do kroku 3
   ↓
5. KROK 3: Ustawia hasło
   - Wizualna walidacja wymagań
   - Kliknięcie "Utwórz konto"
   ↓
6. Wysłanie POST do /api/client/auth
   ↓
7. Backend:
   - Waliduje wszystkie dane
   - Sprawdza unikalność email/telefon/NIP
   - Hashuje hasło (bcrypt, 10 rund)
   - Generuje ID (CLI2025XXXXXX)
   - Zapisuje do clients.json
   - Tworzy sesję
   ↓
8. Sukces:
   - Wyświetlenie komunikatu "Rejestracja zakończona"
   - Zapisanie tokenu w localStorage
   - Automatyczne przekierowanie na /client/dashboard
```

### **Backend Flow:**

```javascript
// 1. Walidacja wymaganych pól
if (!firstName || !lastName || !email || !phone || !address || !password) {
  return error "Wszystkie pola oznaczone * są wymagane";
}

// 2. Walidacja formatu email
if (!emailRegex.test(email)) {
  return error "Nieprawidłowy format email";
}

// 3. Walidacja długości hasła
if (password.length < 6) {
  return error "Hasło musi mieć minimum 6 znaków";
}

// 4. Sprawdzenie unikalności email
if (clients.find(c => c.email === email)) {
  return error "Ten adres email jest już zarejestrowany";
}

// 5. Sprawdzenie unikalności telefonu
if (clients.find(c => c.phone === normalizedPhone)) {
  return error "Ten numer telefonu jest już zarejestrowany";
}

// 6. Dla firm: sprawdzenie unikalności NIP
if (type === 'company' && clients.find(c => c.nip === nip)) {
  return error "Ten NIP jest już zarejestrowany";
}

// 7. Generowanie ID
const newId = `CLI2025${String(newIdNumber).padStart(6, '0')}`;

// 8. Hashowanie hasła
const passwordHash = await bcrypt.hash(password, 10);

// 9. Utworzenie obiektu klienta
const newClient = {
  id: newId,
  name: `${firstName} ${lastName}`,
  firstName,
  lastName,
  type,
  email,
  phone,
  mobile,
  address,
  passwordHash,
  status: 'active',
  failedLoginAttempts: 0,
  isLocked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// 10. Zapis do pliku
clients.push(newClient);
saveClients(clients);

// 11. Utworzenie sesji
const token = generateToken();
const newSession = {
  token,
  clientId: newClient.id,
  loginMethod: 'email',
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  isValid: true
};
sessions.push(newSession);
saveSessions(sessions);

// 12. Zwrócenie tokenu i danych klienta
return { success: true, client, token };
```

---

## ✅ Walidacja Danych

### **Frontend (Krok 1 - Dane Osobowe)**

| Pole | Walidacja | Komunikat błędu |
|------|-----------|----------------|
| Imię | Niepuste | "Imię jest wymagane" |
| Nazwisko | Niepuste | "Nazwisko jest wymagane" |
| Email | Niepuste + Regex | "Email jest wymagany" / "Nieprawidłowy format email" |
| Telefon | Niepuste | "Numer telefonu jest wymagany" |
| Nazwa firmy* | Niepuste (tylko firmy) | "Nazwa firmy jest wymagana" |
| NIP* | 10 cyfr (tylko firmy) | "NIP jest wymagany" / "NIP musi składać się z 10 cyfr" |

### **Frontend (Krok 2 - Adres)**

| Pole | Walidacja | Komunikat błędu |
|------|-----------|----------------|
| Ulica | Niepuste | "Ulica jest wymagana" |
| Nr budynku | Niepuste | "Numer budynku jest wymagany" |
| Miasto | Niepuste | "Miasto jest wymagane" |
| Kod pocztowy | Format XX-XXX | "Kod pocztowy jest wymagany" / "Format XX-XXX" |

### **Frontend (Krok 3 - Hasło)**

| Pole | Walidacja | Komunikat błędu |
|------|-----------|----------------|
| Hasło | Min. 6 znaków | "Hasło jest wymagane" / "Min. 6 znaków" |
| Potwierdź hasło | Zgodne z hasłem | "Hasła nie są identyczne" |

### **Backend (Wszystkie)**

| Sprawdzenie | Komunikat błędu |
|-------------|----------------|
| Wymagane pola | "Wszystkie pola oznaczone * są wymagane" |
| Format email | "Nieprawidłowy format adresu email" |
| Długość hasła | "Hasło musi mieć minimum 6 znaków" |
| Email istnieje | "Ten adres email jest już zarejestrowany" |
| Telefon istnieje | "Ten numer telefonu jest już zarejestrowany" |
| NIP istnieje | "Ten NIP jest już zarejestrowany" |

---

## 🔒 Bezpieczeństwo

### **1. Hashowanie Haseł**
- Algorytm: **bcrypt**
- Salt rounds: **10**
- Hasło nigdy nie jest przechowywane w czystej postaci
```javascript
const passwordHash = await bcrypt.hash(password, 10);
```

### **2. Walidacja po Stronie Serwera**
- Wszystkie dane walidowane ponownie na backendzie
- Nie można ominąć walidacji frontendowej

### **3. Unikalność Danych**
- Email: tylko jeden klient na adres
- Telefon: tylko jeden klient na numer
- NIP: tylko jedna firma na NIP

### **4. Automatyczna Sesja**
- Token generowany przez `crypto.randomUUID()`
- Sesja ważna 30 dni
- Token przechowywany w localStorage

### **5. Dane Wrażliwe**
- Hasło NIE jest zwracane w response
- Token jest zwracany tylko raz (przy rejestracji/logowaniu)

---

## 🧪 Testowanie

### **Test 1: Rejestracja Osoby Prywatnej**

**Kroki:**
1. Otwórz: http://localhost:3000/client/register
2. Wybierz: **Osoba prywatna**
3. Wypełnij dane:
   ```
   Imię: Tomasz
   Nazwisko: Wiśniewski
   Email: tomasz.wisniewski@gmail.com
   Telefon: 123-456-789
   ```
4. Kliknij **Dalej**
5. Wypełnij adres:
   ```
   Ulica: ul. Rynek
   Nr budynku: 10
   Miasto: Ropczyce
   Kod: 39-100
   ```
6. Kliknij **Dalej**
7. Ustaw hasło:
   ```
   Hasło: haslo123
   Potwierdź: haslo123
   ```
8. Kliknij **Utwórz konto**

**Oczekiwany rezultat:**
- ✅ Wyświetlenie komunikatu "Rejestracja zakończona!"
- ✅ Automatyczne przekierowanie na /client/dashboard
- ✅ Klient zapisany w `data/clients.json`
- ✅ Token zapisany w localStorage
- ✅ Sesja utworzona w `data/client-sessions.json`

### **Test 2: Rejestracja Firmy**

**Kroki:**
1. Otwórz: http://localhost:3000/client/register
2. Wybierz: **Firma**
3. Wypełnij dane:
   ```
   Imię: Marek
   Nazwisko: Kwiatkowski
   Nazwa firmy: AUTO-SERWIS Kwiatkowski
   NIP: 8123456789
   Email: auto.serwis@wp.pl
   Telefon: 143-567-890
   ```
4. Kontynuuj proces jak w Test 1

**Oczekiwany rezultat:**
- ✅ Klient zapisany z `type: "company"`
- ✅ Pole `companyName` i `nip` wypełnione
- ✅ Reszta jak w Test 1

### **Test 3: Walidacja - Duplikat Email**

**Kroki:**
1. Spróbuj zarejestrować konto z emailem: `anna.nowak@wp.pl` (już istnieje)

**Oczekiwany rezultat:**
- ❌ Błąd: "Ten adres email jest już zarejestrowany"

### **Test 4: Walidacja - Słabe Hasło**

**Kroki:**
1. W kroku 3 wpisz hasło: `abc` (za krótkie)

**Oczekiwany rezultat:**
- ❌ Błąd: "Hasło musi mieć minimum 6 znaków"

### **Test 5: Walidacja - Niezgodne Hasła**

**Kroki:**
1. Hasło: `haslo123`
2. Potwierdź: `haslo456`

**Oczekiwany rezultat:**
- ❌ Błąd: "Hasła nie są identyczne"

### **Test 6: Walidacja - Nieprawidłowy Kod Pocztowy**

**Kroki:**
1. W kroku 2 wpisz kod: `39200` (bez myślnika)

**Oczekiwany rezultat:**
- ❌ Błąd: "Kod pocztowy musi być w formacie XX-XXX"

### **Test 7: Walidacja - Nieprawidłowy NIP**

**Kroki:**
1. Wybierz Firmę
2. Wpisz NIP: `123` (za krótki)

**Oczekiwany rezultat:**
- ❌ Błąd: "NIP musi składać się z 10 cyfr"

---

## 📊 Struktura Danych

### **Nowy Klient w `clients.json`:**

```json
{
  "id": "CLI2025000019",
  "name": "Tomasz Wiśniewski",
  "firstName": "Tomasz",
  "lastName": "Wiśniewski",
  "type": "individual",
  "email": "tomasz.wisniewski@gmail.com",
  "phone": "123-456-789",
  "mobile": "123-456-789",
  "address": {
    "street": "ul. Rynek",
    "buildingNumber": "10",
    "apartmentNumber": "",
    "city": "Ropczyce",
    "postalCode": "39-100",
    "voivodeship": "podkarpackie",
    "country": "Polska"
  },
  "passwordHash": "$2a$10$...",
  "status": "active",
  "failedLoginAttempts": 0,
  "isLocked": false,
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

### **Nowa Sesja w `client-sessions.json`:**

```json
{
  "token": "uuid-v4-token",
  "clientId": "CLI2025000019",
  "loginMethod": "email",
  "createdAt": "2025-10-04T12:00:00.000Z",
  "lastActivity": "2025-10-04T12:00:00.000Z",
  "isValid": true
}
```

---

## 🎨 UI/UX

### **Design:**
- ✅ 3-krokowy wizard z wizualnym progress bar
- ✅ Animacje przejść między krokami (Framer Motion)
- ✅ Responsywny design (mobile-first)
- ✅ Ikony dla lepszej czytelności (React Icons)
- ✅ Toggle pokazywania/ukrywania hasła
- ✅ Wizualna walidacja hasła (checkmarki w czasie rzeczywistym)
- ✅ Loading state podczas rejestracji
- ✅ Success screen z auto-redirect

### **Kolory:**
- Niebieski: `#2563eb` (przyciski, aktywne elementy)
- Zielony: `#16a34a` (sukces, "Utwórz konto")
- Czerwony: `#dc2626` (błędy)
- Szary: `#6b7280` (tekst pomocniczy)

---

## 📝 Kolejne Kroki (Future)

1. **Email Weryfikacja**
   - Wysyłka linku aktywacyjnego
   - Potwierdzenie adresu email

2. **SMS Weryfikacja**
   - Kod SMS przy rejestracji
   - Dwuetapowa weryfikacja (2FA)

3. **Captcha**
   - Google reCAPTCHA v3
   - Ochrona przed botami

4. **Social Login**
   - Rejestracja przez Google
   - Rejestracja przez Facebook

5. **Regulamin**
   - Checkbox akceptacji regulaminu
   - Link do polityki prywatności

6. **Newsletter**
   - Opcjonalny checkbox subskrypcji
   - Zgoda na marketing

---

## 🔗 Powiązane Strony

- `/client/login` - Logowanie klientów
- `/client/dashboard` - Panel klienta (po rejestracji)
- `/client/forgot-password` - Reset hasła (TODO)

---

## 📞 Support

W razie problemów sprawdź:
1. Czy serwer działa na porcie 3000
2. Czy pliki `clients.json` i `client-sessions.json` istnieją w folderze `data/`
3. Czy bcrypt jest zainstalowany (`npm list bcryptjs`)
4. Console w przeglądarce (F12) - błędy JavaScript
5. Terminal serwera - błędy API

---

**Status:** ✅ Gotowe do użycia  
**Ostatnia aktualizacja:** 4 października 2025
