# 🎉 Funkcja: Tworzenie Konta podczas Rezerwacji

## 📍 Lokalizacja
**Strona:** `http://localhost:3000/rezerwacja`  
**Krok:** 2 - Dane kontaktowe (po wypełnieniu adresu)

## 🎯 Cel
Umożliwić użytkownikom tworzenie konta bezpośrednio podczas rezerwacji, bez konieczności osobnej rejestracji.

---

## 🔄 Przepływ Użytkownika

### 1. **Użytkownik wypełnia dane kontaktowe:**
- Imię i nazwisko (opcjonalnie)
- Telefon (wymagane)
- Email (opcjonalnie, ale potrzebne do konta)

### 2. **System automatycznie sprawdza:**
```javascript
// Po wpisaniu email - sprawdzenie w tle
checkExistingAccount(email, 'email')
// Po wpisaniu telefonu - sprawdzenie w tle
checkExistingAccount(phone, 'phone')
```

### 3. **Jeśli użytkownik NIE ma konta:**
Pojawia się **gradient purple-blue** karta z propozycją:

```
🎉 Chcesz utworzyć konto?

Masz już email i telefon - możesz teraz utworzyć konto i zyskać:
✓ Dostęp do historii wszystkich napraw
✓ Śledzenie statusu online w czasie rzeczywistym
✓ Łatwe składanie kolejnych zgłoszeń
✓ Dostęp do faktur i dokumentów

[Pole: Ustaw hasło (minimum 6 znaków)]
[Pole: Powtórz hasło]

[Przycisk: ✨ Utwórz konto]  [Przycisk: Pomiń]
```

### 4. **Użytkownik klika "Utwórz konto":**
- Walidacja hasła (min. 6 znaków)
- Sprawdzenie czy hasła są identyczne
- Utworzenie konta przez API
- Wysłanie emaila powitalnego
- Automatyczne logowanie

### 5. **Komunikat sukcesu:**
```
✅ Konto utworzone pomyślnie!
Wysłaliśmy email powitalny na jan@example.com. 
Możesz teraz kontynuować rezerwację.
```

---

## 🔐 Bezpieczeństwo

### 1. **Hashowanie hasła**
```javascript
const passwordHash = await bcrypt.hash(password, 10);
```
- Używamy **bcrypt** z salt rounds = 10
- Hasło nigdy nie jest przechowywane w plain text

### 2. **Walidacja hasła**
```javascript
if (!accountPassword || accountPassword.length < 6) {
    setAccountCreationError('Hasło musi mieć minimum 6 znaków');
    return;
}

if (accountPassword !== accountPasswordConfirm) {
    setAccountCreationError('Hasła nie są identyczne');
    return;
}
```

### 3. **Sprawdzanie duplikatów**
```javascript
// API sprawdza czy email już istnieje
const existingEmail = clients.find(c => 
    c.email && c.email.toLowerCase() === email.toLowerCase()
);

// API sprawdza czy telefon już istnieje
const normalizedPhone = phone.replace(/[\s-]/g, '');
const existingPhone = clients.find(c => {
    if (!c.phone) return false;
    return c.phone.replace(/[\s-]/g, '') === normalizedPhone;
});
```

### 4. **Email powitalny**
Po utworzeniu konta użytkownik otrzymuje:
- Email z potwierdzeniem rejestracji
- Numer klienta (ID)
- Link do logowania
- Instrukcje korzystania z konta

---

## 📋 API Endpoints

### `POST /api/client/auth`

#### **Action: check**
Sprawdza czy użytkownik ma już konto.

**Request:**
```json
{
  "action": "check",
  "identifier": "jan@example.com",
  "type": "email"
}
```

**Response:**
```json
{
  "success": true,
  "found": false,
  "method": null,
  "message": "Nie znaleziono konta z tym identyfikatorem."
}
```

#### **Action: register**
Tworzy nowe konto użytkownika.

**Request:**
```json
{
  "action": "register",
  "type": "individual",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan@example.com",
  "phone": "+48 123 456 789",
  "mobile": "+48 123 456 789",
  "address": {
    "street": "ul. Główna 10",
    "buildingNumber": "10",
    "apartmentNumber": "",
    "city": "Kraków",
    "postalCode": "30-001",
    "voivodeship": "podkarpackie",
    "country": "Polska"
  },
  "password": "hasło123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ Konto zostało utworzone pomyślnie - email powitalny wysłany",
  "client": {
    "id": "CLI2025000001",
    "name": "Jan Kowalski",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "email": "jan@example.com",
    "phone": "+48 123 456 789",
    "mobile": "+48 123 456 789",
    "type": "individual",
    "address": { ... }
  },
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "emailSent": true,
  "emailError": null
}
```

**Response (Error - Email zajęty):**
```json
{
  "success": false,
  "message": "Ten adres email jest już zarejestrowany"
}
```

**Response (Error - Telefon zajęty):**
```json
{
  "success": false,
  "message": "Ten numer telefonu jest już zarejestrowany"
}
```

---

## 🎨 UI/UX Design

### Kolory i Style
```jsx
// Karta propozycji
className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300"

// Ikona użytkownika
className="w-10 h-10 bg-purple-500 rounded-full"

// Przyciski
Utwórz konto: "bg-purple-600 hover:bg-purple-700"
Pomiń: "bg-gray-200 hover:bg-gray-300"
```

### Stany wizualne

**1. Oferta (offer)**
- Piękna gradient karta z ikonką użytkownika
- Lista 4 korzyści z checkmarkami
- Dwa pola hasła
- Dwa przyciski: "Utwórz konto" i "Pomiń"

**2. Tworzenie (creating)**
```jsx
<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600">
</div>
Tworzę konto...
```

**3. Sukces (success)**
```jsx
<FiCheck className="text-green-600" />
✅ Konto utworzone pomyślnie!
Wysłaliśmy email powitalny...
```

**4. Błąd (error)**
```jsx
<div className="bg-red-50 border border-red-200">
  ❌ {accountCreationError}
</div>
```

---

## 🧪 Testowanie

### Test 1: Nowy użytkownik
1. Otwórz: `http://localhost:3000/rezerwacja`
2. Wypełnij adres w kroku 1
3. W kroku 2 wpisz:
   - Imię: "Jan Testowy"
   - Telefon: "+48 999 888 777"
   - Email: "jan.testowy@example.com" (NOWY, nieistniejący)
4. **Oczekiwany rezultat:** Pojawia się propozycja utworzenia konta
5. Ustaw hasło: "test123"
6. Powtórz hasło: "test123"
7. Kliknij "Utwórz konto"
8. **Oczekiwany rezultat:** 
   - Komunikat sukcesu
   - Email powitalny wysłany
   - Konto utworzone w `data/clients.json`

### Test 2: Istniejący użytkownik
1. Wpisz email który już istnieje w systemie
2. **Oczekiwany rezultat:** Propozycja NIE pojawia się (użytkownik ma już konto)

### Test 3: Walidacja hasła
1. Spróbuj ustawić hasło krótsze niż 6 znaków
2. **Oczekiwany rezultat:** Błąd "Hasło musi mieć minimum 6 znaków"

### Test 4: Zgodność haseł
1. Wpisz różne hasła w obu polach
2. **Oczekiwany rezultat:** Błąd "Hasła nie są identyczne"

### Test 5: Email już zajęty
1. Spróbuj utworzyć konto z emailem który już istnieje
2. **Oczekiwany rezultat:** Błąd "Ten adres email jest już zarejestrowany"

---

## 📊 Stan aplikacji

### State Variables (React)
```javascript
const [showAccountCreation, setShowAccountCreation] = useState(false);
const [wantsAccount, setWantsAccount] = useState(false);
const [accountCreationStep, setAccountCreationStep] = useState(null); 
// 'offer', 'creating', 'success', 'error'
const [accountPassword, setAccountPassword] = useState('');
const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
const [accountCreationError, setAccountCreationError] = useState('');
```

### Przepływ stanów
```
null → 'offer' → 'creating' → 'success'
                            ↓
                         'error'
```

---

## 🔧 Pliki zmodyfikowane

### `pages/rezerwacja.js`
- ✅ Dodano state dla tworzenia konta
- ✅ Dodano funkcję `checkExistingAccount()`
- ✅ Dodano funkcję `handleCreateAccount()`
- ✅ Zmodyfikowano `handleChange()` - sprawdzanie konta
- ✅ Dodano UI dla propozycji utworzenia konta
- ✅ Dodano 4 stany wizualne: offer, creating, success, error

### `pages/api/client/auth.js`
- ✅ Endpoint już istniał
- ✅ Obsługuje `action: 'check'` - sprawdzanie konta
- ✅ Obsługuje `action: 'register'` - tworzenie konta
- ✅ Wysyła email powitalny przez Resend API

---

## 💡 Dlaczego to jest bezpieczne?

### 1. **Nie ma tymczasowych haseł**
- Użytkownik SAM ustawia hasło od razu
- Nie ma generowania losowych haseł przez SMS/email
- Brak ryzyka przechwycenia tymczasowego hasła

### 2. **Hashowanie z bcrypt**
- Salt rounds = 10 (bardzo bezpieczne)
- Hasło nigdy nie jest w plain text
- Nie można odtworzyć hasła z hashu

### 3. **Walidacja po stronie serwera**
- Sprawdzanie duplikatów email/telefon
- Walidacja siły hasła
- Sprawdzanie poprawności danych

### 4. **Email potwierdzający**
- Użytkownik dostaje email powitalny
- Może zweryfikować czy to rzeczywiście jego konto
- Zawiera link do logowania

### 5. **Opcjonalność**
- Użytkownik może POMINĄĆ tworzenie konta
- Rezerwacja działa bez konta
- Zero presji

---

## 🎯 UX Best Practices

### ✅ CO ROBIMY DOBRZE:

1. **Moment propozycji jest idealny**
   - Użytkownik już podał wszystkie potrzebne dane
   - Nie przerywa głównego flow rezerwacji
   - Można pominąć jednym kliknięciem

2. **Jasne korzyści**
   - Lista 4 konkretnych korzyści
   - Użytkownik rozumie PO CO mu konto

3. **Minimalna ilość kroków**
   - Tylko 2 pola: hasło i potwierdzenie
   - Reszta danych już jest wypełniona

4. **Feedback w czasie rzeczywistym**
   - Loading state podczas tworzenia
   - Komunikat sukcesu
   - Jasne komunikaty błędów

5. **Opcjonalność**
   - Przycisk "Pomiń" zawsze widoczny
   - Nie blokuje rezerwacji

### ❌ MOŻLIWE ULEPSZENIA:

1. **Progress bar siły hasła**
   ```jsx
   {accountPassword.length > 0 && (
     <div className="h-1 bg-gray-200 rounded">
       <div className={`h-1 rounded ${getPasswordStrengthColor()}`} 
            style={{ width: `${getPasswordStrength()}%` }} />
     </div>
   )}
   ```

2. **Pokazywanie/ukrywanie hasła**
   ```jsx
   <button type="button" onClick={() => setShowPassword(!showPassword)}>
     {showPassword ? <FiEyeOff /> : <FiEye />}
   </button>
   ```

3. **Social login** (opcjonalnie)
   - "Lub zaloguj się przez Google/Facebook"
   - Jeszcze szybsze tworzenie konta

---

## 📈 Metryki do śledzenia

### Backend (logs)
```javascript
console.log('✅ New client registered:', newClient.id, newClient.email);
console.log('✅ Welcome email sent to:', newClient.email);
```

### Frontend (analytics)
```javascript
// Ile osób widzi propozycję?
analytics.track('account_creation_shown');

// Ile osób klika "Utwórz konto"?
analytics.track('account_creation_started');

// Ile kont jest faktycznie tworzonych?
analytics.track('account_creation_success');

// Ile osób klika "Pomiń"?
analytics.track('account_creation_skipped');
```

### Wskaźniki sukcesu
- **Conversion rate:** % użytkowników tworzących konto
- **Email delivery rate:** % wysłanych emaili powitalnych
- **Error rate:** % błędów podczas tworzenia
- **Skip rate:** % użytkowników pomijających

---

## 🚀 Wdrożenie

### Środowisko deweloperskie
```bash
# Serwer deweloperski
npm run dev

# Test lokalny
http://localhost:3000/rezerwacja
```

### Środowisko produkcyjne
```bash
# Build
npm run build

# Deploy na Vercel
vercel --prod
```

### Wymagane zmienne środowiskowe
```env
# Email service (Resend)
RESEND_API_KEY=re_xxx
RESEND_EMAIL_FROM=noreply@twojadomena.pl

# App URL (dla linków w emailach)
NEXT_PUBLIC_APP_URL=https://twojadomena.pl

# Contact info (dla emaili)
CONTACT_PHONE=123-456-789
```

---

## 🎉 Podsumowanie

**Funkcja jest GOTOWA i DZIAŁAJĄCA!**

✅ Bezpieczne hashowanie haseł (bcrypt)  
✅ Automatyczne sprawdzanie duplikatów  
✅ Piękny UI z gradient purple-blue  
✅ Email powitalny po rejestracji  
✅ Pełna walidacja po stronie serwera  
✅ Opcjonalność - można pominąć  
✅ Nie przerywa flow rezerwacji  

**Gotowe do testowania i użytkowania!** 🚀
