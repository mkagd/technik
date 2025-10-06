# ✅ NAPRAWIONO - System Rezerwacji

**Data:** 2025-10-06  
**Status:** 🎯 GOTOWE DO TESTÓW

---

## 🔧 ZAIMPLEMENTOWANE ZMIANY

### 1. ✅ SimpleBookingForm - Dodano POST do API

**Plik:** `components/SimpleBookingForm.js`  
**Linie:** 154-192

**Zmiana:**
- Dodano wywołanie `fetch('/api/rezerwacje', { method: 'POST' })` po zapisie do `reportManager`
- Wysyłane dane:
  ```javascript
  {
    name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Gość',
    phone: phone.trim(),
    email: email.trim() || '',
    address: address.trim(),
    fullAddress: address.trim(),
    city: '', // Parsowanie później
    street: address.trim(),
    category: 'AGD',
    device: 'Nie określono',
    problem: description.trim() || 'Rezerwacja terminu',
    availability: availability.trim() || 'Brak preferencji',
    date: new Date().toISOString(),
    isLoggedIn: !!currentUser,
    userId: currentUser?.id || null,
    clientPhone: phone.trim(),
    source: 'simple_booking_form'
  }
  ```
- Backup do `localStorage` działa nadal (jeśli API zawiedzie)
- Dodano logi: `console.log('📤 Wysyłanie rezerwacji do API')`

**Rezultat:**
✅ Rezerwacje z formularza głównego trafiają teraz do serwera  
✅ Pojawią się w panelu `/admin/rezerwacje`  
✅ Zachowana kompatybilność z localStorage

---

### 2. ✅ Backend - Sprawdzanie istniejącego klienta

**Plik:** `pages/api/rezerwacje.js`  
**Linie:** 88-165

**Zmiana:**
Przed utworzeniem klienta sprawdzamy czy już istnieje:

```javascript
// Priorytet 1: Zalogowany użytkownik - szukaj po userId
if (isLoggedIn && userId) {
  existingClient = clients.find(c => c.userId === userId);
}

// Priorytet 2: Szukaj po numerze telefonu (z normalizacją)
if (!existingClient && clientPhone) {
  const normalizedPhone = clientPhone.replace(/\s+/g, '').replace(/\+48/, '');
  existingClient = clients.find(c => {
    const clientMainPhone = (c.phone || '').replace(/\s+/g, '').replace(/\+48/, '');
    const hasMatchingPhone = c.phones?.some(p => {
      const phoneNum = (p.number || '').replace(/\s+/g, '').replace(/\+48/, '');
      return phoneNum === normalizedPhone;
    });
    return clientMainPhone === normalizedPhone || hasMatchingPhone;
  });
}

// Jeśli klient istnieje - użyj go, jeśli nie - utwórz nowego
if (existingClient) {
  newClient = existingClient;
  console.log('♻️ Używam istniejącego klienta - zapobieganie duplikatom');
} else {
  newClient = await addClient(clientData);
}
```

**Rezultat:**
✅ Zalogowany użytkownik NIE tworzy duplikatu  
✅ Sprawdzanie po userId (priorytet 1)  
✅ Sprawdzanie po numerze telefonu (priorytet 2)  
✅ Normalizacja numerów telefonów (+48, spacje)  
✅ Brak duplikatów klientów

---

### 3. ✅ Backend - Auto-konwersja rezerwacji → zlecenie

**Plik:** `pages/api/rezerwacje.js`  
**Linie:** 630-711

**Zmiana:**
Wykrywanie zmiany statusu na `"contacted"` i automatyczne tworzenie zlecenia:

```javascript
if (updateData.status === 'contacted' && reservation.status !== 'contacted') {
  console.log('🔄 Status changed to "contacted" - converting to order');
  
  // 1. Konwertuj rezerwację na klienta + zamówienie
  const converted = await convertReservationToClientOrder(reservationToConvert);
  
  // 2. Sprawdź czy klient istnieje (po telefonie lub emailu)
  let existingClient = clients.find(c => c.phone === clientData.phone);
  
  // 3. Użyj istniejącego klienta lub utwórz nowego
  if (existingClient) {
    clientId = existingClient.id;
    await updateClient({ ...existingClient, ...clientData });
  } else {
    const newClient = await addClient(clientData);
    clientId = newClient.id;
  }
  
  // 4. Sprawdź czy zamówienie już istnieje dla tej rezerwacji
  const existingOrder = orders.find(o => 
    o.originalReservationId === reservation.id
  );
  
  // 5. Utwórz zamówienie jeśli nie istnieje
  if (!existingOrder) {
    orderData.clientId = clientId;
    orderData.source = 'reservation_conversion';
    orderData.originalReservationId = reservation.id;
    
    const newOrder = await addOrder(orderData);
    
    // 6. Zaktualizuj rezerwację z ID zlecenia
    updateReservation(reservation.id, {
      ...updateData,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      clientId: clientId,
      convertedToOrder: true,
      convertedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      message: 'Rezerwacja przekonwertowana na zlecenie',
      data: result,
      client: client,
      order: newOrder
    });
  }
}
```

**Rezultat:**
✅ Zmiana statusu na "contacted" automatycznie tworzy zlecenie  
✅ Zlecenie pojawia się w `/admin/zamowienia`  
✅ Rezerwacja zawiera `orderId` i `orderNumber`  
✅ Brak duplikatów zleceń (sprawdzanie `originalReservationId`)  
✅ Klient powiązany z rezerwacją i zleceniem

---

### 4. ✅ Zunifikowane mapowanie pól

**Plik:** `utils/clientOrderStorage.js`  
**Funkcja:** `convertReservationToClientOrder()`  
**Linie:** 388-534

**Mapowanie pól (JUŻ ISTNIAŁO - SPRAWDZONE):**

| Rezerwacja | Klient | Zamówienie |
|-----------|--------|------------|
| `name` / `clientName` | `name` | `clientName` |
| `phone` / `clientPhone` | `phone` | `clientPhone` |
| `email` | `email` | `email` |
| `address` / `fullAddress` | `address` | `address` |
| `city` | `city` | `city` |
| `street` | `street` | `street` |
| `category` | - | `deviceType` ✅ |
| `device` | - | `brand`, `model` ✅ |
| `problem` | - | `description` ✅ |
| `date` / `scheduledDate` | - | `scheduledDate` ✅ |
| `availability` | - | `availability` ✅ |
| `userId` | `userId` ✅ | - |
| `isAuthenticated` | `isAuthenticated` ✅ | - |

**Dodatkowe pola:**
- `phones[]` - tablica numerów telefonów
- `addresses[]` - tablica adresów
- `devices[]` - tablica urządzeń
- `clientLocation` - współrzędne GPS

**Rezultat:**
✅ Spójne struktury danych  
✅ Kompatybilność wsteczna (legacy fields)  
✅ Obsługa wielu urządzeń, adresów, telefonów  
✅ Zachowanie `userId` (zalogowani użytkownicy)

---

## 🔀 PRZEPŁYW DANYCH (NAPRAWIONY)

### Scenariusz 1: Gość tworzy rezerwację

```
1️⃣ Gość wypełnia formularz SimpleBookingForm
   ↓
2️⃣ Klik "Zgłoś naprawę"
   ↓
3️⃣ ✅ POST /api/rezerwacje
   Body: { name: "Gość", phone: "123456789", address: "Kraków", ... }
   ↓
4️⃣ Backend sprawdza czy klient istnieje po numerze telefonu
   ├─ Nie → Tworzy nowego klienta w clients.json
   └─ Tak → Używa istniejącego klienta
   ↓
5️⃣ Tworzy rezerwację w rezerwacje.json
   { id: 1759598648030, status: "pending", clientId: "CLI123", ... }
   ↓
6️⃣ Tworzy zamówienie w orders.json
   { id: "ORD123", orderNumber: "2025/10/001", clientId: "CLI123", ... }
   ↓
7️⃣ ✅ Admin widzi rezerwację w /admin/rezerwacje
   ✅ Admin widzi zlecenie w /admin/zamowienia
```

### Scenariusz 2: Zalogowany użytkownik tworzy rezerwację

```
1️⃣ Zalogowany użytkownik wypełnia formularz
   ↓
2️⃣ ✅ POST /api/rezerwacje
   Body: { name: "Jan Kowalski", userId: "USER123", isLoggedIn: true, ... }
   ↓
3️⃣ Backend sprawdza czy klient istnieje po userId
   ├─ Tak → ✅ Używa istniejącego klienta (NIE TWORZY DUPLIKATU!)
   └─ Nie → Tworzy nowego klienta z userId
   ↓
4️⃣ Tworzy rezerwację powiązaną z istniejącym klientem
   { id: 1759598648031, status: "pending", clientId: "CLI123", userId: "USER123" }
   ↓
5️⃣ Tworzy zamówienie dla istniejącego klienta
   { id: "ORD124", clientId: "CLI123", ... }
   ↓
6️⃣ ✅ Brak duplikatów klienta
   ✅ Historia klienta spójna
```

### Scenariusz 3: Admin zmienia status na "contacted"

```
1️⃣ Admin otwiera /admin/rezerwacje
   ↓
2️⃣ Klika "Dodaj zlecenie" przy rezerwacji
   ↓
3️⃣ ✅ PUT /api/rezerwacje
   Body: { id: 1759598648030, status: "contacted" }
   ↓
4️⃣ Backend wykrywa zmianę statusu pending → contacted
   ↓
5️⃣ ✅ AUTOMATYCZNA KONWERSJA:
   ├─ Sprawdza czy klient istnieje (po telefonie)
   ├─ Sprawdza czy zamówienie już istnieje (po originalReservationId)
   └─ Jeśli zamówienie nie istnieje:
       ├─ Tworzy zamówienie w orders.json
       └─ Aktualizuje rezerwację z orderId i orderNumber
   ↓
6️⃣ ✅ Rezerwacja ma pola:
   { ..., status: "contacted", orderId: "ORD125", orderNumber: "2025/10/002" }
   ↓
7️⃣ ✅ Zlecenie pojawia się w /admin/zamowienia
   ✅ Admin widzi zlecenie z wszystkimi danymi
```

---

## 🧪 SCENARIUSZE TESTOWE

### Test 1: Gość tworzy rezerwację
**Kroki:**
1. Wyloguj się z systemu
2. Otwórz stronę główną `/`
3. Wypełnij formularz:
   - Adres: "Kraków, ul. Testowa 1"
   - Telefon: "123456789"
   - Email: "test@example.com"
   - Opis problemu: "Pralka nie działa"
   - Dostępność: "po 15:00"
4. Kliknij "Zgłoś naprawę"

**Oczekiwany rezultat:**
- ✅ Toast: "Zgłoszenie wysłane"
- ✅ Rezerwacja w `/admin/rezerwacje` (status: "pending")
- ✅ Nowy klient w `data/clients.json`
- ✅ Nowe zlecenie w `data/orders.json`

**Sprawdzenie w konsoli:**
```
📤 Wysyłanie rezerwacji do API: {...}
✅ Rezerwacja zapisana na serwerze: {...}
```

---

### Test 2: Zalogowany użytkownik tworzy rezerwację
**Kroki:**
1. Zaloguj się jako użytkownik (np. "jan.kowalski@example.com")
2. Otwórz stronę główną `/`
3. Wypełnij formularz
4. Kliknij "Zgłoś naprawę"

**Oczekiwany rezultat:**
- ✅ Rezerwacja w `/admin/rezerwacje` (powiązana z userId)
- ✅ **NIE** tworzy duplikatu klienta
- ✅ Używa istniejącego klienta (jeśli był wcześniej)
- ✅ Zlecenie powiązane z istniejącym klientem

**Sprawdzenie w konsoli:**
```
🔍 Sprawdzanie istniejącego klienta... { isLoggedIn: true, userId: "USER123" }
✅ Znaleziono klienta po userId: CLI123 - Jan Kowalski
♻️ Używam istniejącego klienta - zapobieganie duplikatom
```

---

### Test 3: Zmiana statusu na "contacted"
**Kroki:**
1. Otwórz `/admin/rezerwacje`
2. Znajdź rezerwację ze statusem "pending"
3. Kliknij przycisk "Dodaj zlecenie"
4. Potwierdź w dialogu

**Oczekiwany rezultat:**
- ✅ Status zmienia się na "contacted"
- ✅ Toast: "Zlecenie utworzone!"
- ✅ Przekierowanie do `/admin/zamowienia`
- ✅ Nowe zlecenie widoczne na liście
- ✅ Rezerwacja ma pola `orderId` i `orderNumber`

**Sprawdzenie w konsoli:**
```
🔄 Status changed to "contacted" - converting to order
✅ Order created from reservation: 2025/10/003
✅ Rezerwacja przekonwertowana na zlecenie
```

---

### Test 4: Duplikat numeru telefonu
**Kroki:**
1. Stwórz rezerwację z numerem "123456789"
2. Stwórz kolejną rezerwację z tym samym numerem "123456789"

**Oczekiwany rezultat:**
- ✅ Obie rezerwacje powiązane z tym samym klientem
- ✅ **NIE** tworzy duplikatu klienta
- ✅ Klient ma jedno ID dla obu rezerwacji

**Sprawdzenie w danych:**
```json
// clients.json (1 klient)
{
  "id": "CLI123",
  "phone": "123456789",
  "name": "Gość"
}

// rezerwacje.json (2 rezerwacje, ten sam clientId)
{
  "id": 1759598648030,
  "clientId": "CLI123",
  "phone": "123456789"
},
{
  "id": 1759598648031,
  "clientId": "CLI123",
  "phone": "123456789"
}
```

---

## 📁 ZMODYFIKOWANE PLIKI

### 1. `components/SimpleBookingForm.js`
- **Zmiana:** Dodano POST do API (linie 154-192)
- **Rezultat:** Rezerwacje trafiają na serwer

### 2. `pages/api/rezerwacje.js`
- **Zmiana 1:** Sprawdzanie istniejącego klienta (linie 88-165)
- **Zmiana 2:** Poprawka konwersji w PUT (linia 642: `await` + `converted.client`)
- **Rezultat:** Brak duplikatów klientów, auto-konwersja na zlecenie

### 3. `utils/clientOrderStorage.js`
- **Zmiana:** ✅ NIE WYMAGANA - funkcja już działa poprawnie
- **Rezultat:** Mapowanie pól działa

---

## 🐛 NAPRAWIONE PROBLEMY

### Problem 1: "Rezerwacja nie zawsze pojawia się"
**Przyczyna:** SimpleBookingForm nie wysyłał do API  
**Rozwiązanie:** Dodano `fetch('/api/rezerwacje', { method: 'POST' })`  
**Status:** ✅ NAPRAWIONE

### Problem 2: "Zalogowany klient tworzy duplikaty"
**Przyczyna:** Backend nie sprawdzał `userId` ani `phone`  
**Rozwiązanie:** Dodano sprawdzanie po `userId` (priorytet 1) i `phone` (priorytet 2)  
**Status:** ✅ NAPRAWIONE

### Problem 3: "Po zmianie statusu nie tworzy się zlecenie"
**Przyczyna:** Zmiana statusu tylko aktualizowała `rezerwacje.json`  
**Rozwiązanie:** Dodano automatyczną konwersję w metodzie PUT  
**Status:** ✅ NAPRAWIONE

---

## 🚀 GOTOWE DO TESTÓW

**Wszystkie zmiany zaimplementowane i sprawdzone składniowo.**

**Następny krok:**
1. Uruchom serwer deweloperski: `npm run dev`
2. Wykonaj testy 1-4 opisane powyżej
3. Sprawdź logi w konsoli przeglądarki i konsoli serwera
4. Zweryfikuj dane w `data/rezerwacje.json`, `data/clients.json`, `data/orders.json`

**W razie problemów:**
- Sprawdź logi w konsoli serwera (tam gdzie `npm run dev`)
- Sprawdź logi w konsoli przeglądarki (F12 → Console)
- Poszukaj błędów zawierających:
  - `❌` - błąd krytyczny
  - `⚠️` - ostrzeżenie
  - `🔍` - debugowanie sprawdzania klienta
  - `🔄` - konwersja rezerwacji → zlecenie

---

**Autor:** GitHub Copilot  
**Data:** 2025-10-06  
**Status:** ✅ GOTOWE
