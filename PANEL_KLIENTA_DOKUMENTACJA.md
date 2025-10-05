# 👤 PANEL KLIENTA - DOKUMENTACJA

**Data:** 2025-10-04  
**Status:** ✅ GOTOWY

---

## 📍 LOKALIZACJA

### **Strony:**
- **Login:** http://localhost:3000/client/login
- **Dashboard:** http://localhost:3000/client/dashboard

### **Pliki:**
- `pages/client/login.js` - Strona logowania
- `pages/client/dashboard.js` - Panel klienta z listą zleceń
- `pages/api/client/auth.js` - API autoryzacji klientów (już istniejące)

---

## 🎨 FUNKCJE

### **Strona logowania (`/client/login`):**

✅ **Formularz logowania:**
- Email
- Hasło (z show/hide)
- Checkbox "Zapamiętaj mnie"
- Link "Zapomniałeś hasła?"

✅ **Animacje Framer Motion**

✅ **Walidacja:**
- Sprawdzanie pustych pól
- Błędy z API (nieprawidłowe dane, konto zablokowane)

✅ **Komunikaty błędów:**
- Nieprawidłowy email lub hasło
- Konto zablokowane
- Błąd połączenia z serwerem

✅ **Box z testowymi danymi:**
```
Email: jan.kowalski@gmail.com
Hasło: haslo123
```

✅ **Linki:**
- Rejestracja (TODO)
- Powrót do strony głównej

---

### **Dashboard (`/client/dashboard`):**

✅ **Header:**
- Logo + nazwa klienta
- Przycisk ustawień
- Przycisk wylogowania

✅ **Dane klienta:**
- Email
- Telefon
- Adres (pełny)

✅ **Lista zleceń:**
- ID zlecenia
- Urządzenie (typ + marka + model)
- Problem
- Status (badge z ikoną)
- Data utworzenia
- Przydzielony technik
- Szacowany koszt

✅ **Statusy zleceń:**
- ⏳ Oczekuje (`pending`)
- 🔧 W trakcie (`in-progress`)
- ✅ Zakończone (`completed`)
- 📅 Zaplanowane (`scheduled`)
- ❌ Anulowane (`cancelled`)

✅ **Pusty stan:**
- Komunikat gdy brak zleceń
- Ikona + tekst

---

## 🔐 AUTORYZACJA

### **Flow logowania:**

1. Klient wprowadza email + hasło
2. POST `/api/client/auth` z `action: 'login'`
3. API sprawdza dane w `clients.json`
4. Jeśli OK:
   - Zwraca `token` i `client`
   - Token zapisywany w `localStorage`
   - Redirect do `/client/dashboard`
5. Jeśli błąd:
   - Wyświetla komunikat błędu

### **Ochrona dashboard:**

```javascript
useEffect(() => {
  const token = localStorage.getItem('clientToken');
  const clientData = localStorage.getItem('clientData');

  if (!token || !clientData) {
    router.push('/client/login');
    return;
  }

  setClient(JSON.parse(clientData));
  loadOrders(JSON.parse(clientData).id);
}, []);
```

### **Wylogowanie:**

```javascript
const handleLogout = () => {
  localStorage.removeItem('clientToken');
  localStorage.removeItem('clientData');
  router.push('/client/login');
};
```

---

## 🧪 TESTOWANIE

### **Test 1: Logowanie z poprawnymi danymi**

1. Otwórz: http://localhost:3000/client/login
2. Email: `jan.kowalski@gmail.com`
3. Hasło: `haslo123`
4. Kliknij "Zaloguj się"

**Oczekiwany wynik:**
- ✅ Redirect do `/client/dashboard`
- ✅ Widoczny nagłówek z nazwą klienta
- ✅ Dane kontaktowe
- ✅ Lista zleceń klienta

---

### **Test 2: Logowanie ze złymi danymi**

1. Otwórz: http://localhost:3000/client/login
2. Email: `jan.kowalski@gmail.com`
3. Hasło: `zlehaslo123` (złe hasło)
4. Kliknij "Zaloguj się"

**Oczekiwany wynik:**
- ❌ Komunikat błędu: "❌ Nieprawidłowe hasło. Pozostało prób: 4."
- Formularz pozostaje otwarty

---

### **Test 3: Wylogowanie**

1. Zaloguj się jako klient
2. Kliknij przycisk "Wyloguj" w prawym górnym rogu

**Oczekiwany wynik:**
- ✅ Redirect do `/client/login`
- ✅ Token usunięty z localStorage

---

### **Test 4: Ochrona dashboard bez logowania**

1. Wyloguj się (lub otwórz incognito)
2. Spróbuj wejść bezpośrednio: http://localhost:3000/client/dashboard

**Oczekiwany wynik:**
- ✅ Redirect do `/client/login`

---

## 📊 TESTOWI KLIENCI

Z pliku `clients.json` (18 klientów):

| Klient | Email | Hasło | Miasto |
|--------|-------|-------|--------|
| Jan Kowalski | jan.kowalski@gmail.com | haslo123 | Dębica |
| Anna Nowak | anna.nowak@wp.pl | haslo123 | Dębica |
| Piotr Wiśniewski | piotr.wisniewski@interia.pl | haslo123 | Dębica |
| Maria Wójcik | maria.wojcik@onet.pl | haslo123 | Dębica |
| Katarzyna Lewandowska | katarzyna.lewandowska@gmail.com | haslo123 | Ropczyce |
| Marek Zieliński | marek.zielinski@wp.pl | haslo123 | Ropczyce |
| Joanna Krawczyk | joanna.krawczyk@gmail.com | haslo123 | Mielec |
| ... | ... | ... | ... |

**Wszystkie hasła:** `haslo123`

---

## 🎨 DESIGN

### **Kolory:**
- Główny: Blue 600 (#2563EB)
- Tło: Gray 50
- Karty: White
- Tekst: Gray 900 / Gray 600

### **Komponenty:**
- Framer Motion - animacje
- React Icons - ikony (FiUser, FiMail, FiLock, etc.)
- Tailwind CSS - stylowanie

### **Responsywność:**
- ✅ Mobile-first
- ✅ Grid layout dla danych
- ✅ Sticky header

---

## 💡 TODO (przyszłe features)

- [ ] Strona rejestracji (`/client/register`)
- [ ] Strona resetowania hasła (`/client/forgot-password`)
- [ ] Strona ustawień (`/client/settings`)
- [ ] Szczegóły zlecenia (`/client/order/[orderId]`)
- [ ] Historia zleceń
- [ ] Możliwość dodania nowego zlecenia
- [ ] Chat z technikiem
- [ ] Powiadomienia
- [ ] Płatności online

---

## 🚀 GOTOWE!

System panelu klienta jest gotowy do użycia:
- ✅ Logowanie
- ✅ Dashboard z listą zleceń
- ✅ Wylogowanie
- ✅ Ochrona routes
- ✅ Responsive design

**Testuj:** http://localhost:3000/client/login

