# ✅ DODAWANIE WIZYT DO ZLECENIA - KOMPLETNA IMPLEMENTACJA

**Data:** 15 października 2025  
**Status:** ✅ ZAKOŃCZONE - Gotowe do testów

---

## 🎯 Problem do rozwiązania

1. **"wyswietla nie znaleziono zlecenia"** - Błąd 404 przy dodawaniu wizyty
2. **"musimy dodać wizyty do zlecen a nie do wizyt"** - Nieprawidłowa struktura
3. **"admin tez ma widziec te vizyty"** - Brak widoczności w panelu admina

---

## 🔍 Analiza przyczyny

### Zidentyfikowane problemy:

1. **Brak pola `orderId` w wizytach**
   - Wizyty w `orders.json` NIE MIAŁY pola `orderId`
   - Frontend wysyłał `orderId` ale API nie mogło znaleźć zlecenia

2. **API używało `order.id` zamiast `orderNumber`**
   - `order.id` = timestamp (np. 1760300276060)
   - `order.orderNumber` = prawidłowy ID (np. ORDW252850003)

3. **API `/api/visits` zwracało złe `orderId`**
   - Admin widział wizyty ale z nieprawidłowymi ID zleceń

---

## ✅ Zaimplementowane rozwiązania

### 1. Migracja danych - Dodanie `orderId` do wszystkich wizyt

**Plik:** `migrate-visits-add-orderId.js`

```javascript
// Dodaje pole orderId do każdej wizyty w zleceniu
orders.forEach(order => {
  const orderId = order.orderNumber || order.id;
  
  if (order.visits && Array.isArray(order.visits)) {
    order.visits.forEach(visit => {
      if (!visit.orderId) {
        visit.orderId = orderId;
      }
    });
  }
});
```

**Rezultat:**
```
✅ Dodano orderId do wizyty: VIS251013003 → ORDW252850001
✅ Dodano orderId do wizyty: VIS251013002 → ORDW252850002
✅ Dodano orderId do wizyty: VIS251014001 → ORDW252850003
✅ Dodano orderId do wizyty: VIS251013001 → ORDW252850004
```

---

### 2. Naprawa API `/api/technician/visit-details.js`

**Zmiany:**

```javascript
// PRZED:
orderId: order.id, // ❌ Timestamp

// PO:
orderId: visit.orderId || order.orderNumber || order.id, // ✅ orderNumber jako primary
```

**Rezultat:** Frontend teraz otrzymuje prawidłowy `orderId` (ORDW252850003) zamiast timestampa.

---

### 3. Naprawa API `/api/technician/add-visit-to-order.js`

**Zmiany:**

#### a) Wyszukiwanie zlecenia:
```javascript
// PRZED:
const orderIndex = orders.findIndex(o => o.orderId === orderId); // ❌ Nie działało

// PO:
const orderIndex = orders.findIndex(o => o.orderNumber === orderId || o.id === orderId); // ✅ Działa
```

#### b) Tworzenie nowej wizyty:
```javascript
const newVisit = {
  visitId: newVisitId,
  orderId: order.orderNumber || order.id, // ✅ Dodano orderId
  type: visitType,
  status: 'scheduled',
  scheduledDate: scheduledDate,
  description: description || '',
  technicianId: authenticatedEmployeeId,
  assignedTo: authenticatedEmployeeId, // ✅ Dodano assignedTo
  // ... inherit client, device, devices from order
  statusHistory: [{
    status: 'scheduled',
    timestamp: new Date().toISOString(),
    changedBy: authenticatedEmployeeId,
    reason: 'Wizyta utworzona przez serwisanta'
  }]
};
```

**Rezultat:** Nowe wizyty są automatycznie dodawane z:
- ✅ Prawidłowym `orderId`
- ✅ Przypisaniem do serwisanta (`assignedTo`)
- ✅ Historią statusów
- ✅ Odziedziczonymi danymi klienta i urządzenia

---

### 4. Naprawa API `/api/visits/index.js` (dla admina)

**Zmiany:**

```javascript
// PRZED:
const enrichedVisit = {
  ...visit,
  orderId: order.id, // ❌ Timestamp
};

// PO:
const enrichedVisit = {
  ...visit,
  orderId: visit.orderId || order.orderNumber || order.id, // ✅ orderNumber jako primary
  orderNumber: order.orderNumber, // ✅ Dodatkowe pole dla pewności
};
```

**Rezultat:** Admin widzi wizyty z prawidłowymi ID zleceń.

---

## 📊 Struktura danych po poprawkach

### Zlecenie (Order) z wizytami:

```json
{
  "id": 1760297941870,
  "orderNumber": "ORDW252850003",
  "clientName": "Jan Kowalski",
  "clientPhone": "123456789",
  "deviceType": "Pralka",
  "brand": "Samsung",
  "model": "WW80J5555",
  "visits": [
    {
      "visitId": "VIS251014001",
      "orderId": "ORDW252850003",  // ✅ NOWE POLE
      "type": "diagnosis",
      "status": "completed",
      "scheduledDate": "2025-10-14",
      "technicianId": "EMPA252780002",
      "assignedTo": "EMPA252780002",
      "client": { ... },
      "device": { ... },
      "devices": [ ... ]
    },
    {
      "visitId": "VIS251016001",  // ✅ NOWA WIZYTA DODANA PRZEZ SERWISANTA
      "orderId": "ORDW252850003",  // ✅ TEN SAM orderId
      "type": "repair",
      "status": "scheduled",
      "scheduledDate": "2025-10-16T14:00",
      "description": "Wymiana pompy po diagnozie",
      "technicianId": "EMPA252780002",
      "assignedTo": "EMPA252780002"
    }
  ]
}
```

---

## 🧪 Instrukcja testowania

### Test 1: Dodawanie wizyty przez serwisanta

1. **Zaloguj się jako serwisant** (np. Mariusz Bielaszka - EMPA252780002)
2. **Otwórz wizytę**: `http://localhost:3000/technician/visit/VIS251014001`
3. **Kliknij zielony przycisk**: "Dodaj wizytę" (obok "Zamów część")
4. **Wypełnij formularz**:
   - Typ wizyty: `Naprawa`
   - Data: `16-10-2025 14:00`
   - Opis: `Wymiana pompy po diagnozie - część zamówiona`
5. **Kliknij**: "Dodaj wizytę"

**Oczekiwany rezultat:**
```
✅ Dodano nową wizytę!
ID: VIS251016XXX
Typ: repair

→ Przekierowanie na /technician/visit/VIS251016XXX
```

**Sprawdź w `orders.json`:**
```json
{
  "orderNumber": "ORDW252850003",
  "visits": [
    { "visitId": "VIS251014001", "orderId": "ORDW252850003" },
    { "visitId": "VIS251016XXX", "orderId": "ORDW252850003" }  // ✅ NOWA
  ]
}
```

---

### Test 2: Widoczność w panelu admina

1. **Zaloguj się jako admin**: `http://localhost:3000/admin`
2. **Przejdź do**: "Wizyty" → Panel wizyt
3. **Wyszukaj**: `VIS251016` (nowa wizyta)

**Oczekiwany rezultat:**
- ✅ Wizyta jest widoczna na liście
- ✅ Pokazuje prawidłowy `orderId` (ORDW252850003)
- ✅ Pokazuje klienta i urządzenie odziedziczone ze zlecenia
- ✅ Status: "Zaplanowana"
- ✅ Przypisany do: Mariusz Bielaszka

---

### Test 3: Struktura danych API

**Request:**
```bash
GET /api/technician/visit-details?visitId=VIS251016XXX
Authorization: Bearer {technicianToken}
```

**Expected Response:**
```json
{
  "success": true,
  "visit": {
    "visitId": "VIS251016XXX",
    "orderId": "ORDW252850003",  // ✅ orderNumber (nie timestamp)
    "orderNumber": "ORDW252850003",
    "type": "repair",
    "status": "scheduled",
    "client": {
      "name": "Jan Kowalski",
      "phone": "123456789",
      // ... inherited from order
    },
    "device": {
      "brand": "Samsung",
      "model": "WW80J5555",
      // ... inherited from order
    },
    "devices": [ /* array of devices */ ]
  }
}
```

---

## 📝 Pliki zmodyfikowane

| Plik | Linie | Zmiany |
|------|-------|--------|
| `pages/api/technician/visit-details.js` | 115, 245 | ✅ `orderId` używa `orderNumber` |
| `pages/api/technician/add-visit-to-order.js` | 89, 110-120, 157 | ✅ Szuka po `orderNumber`, dodaje `orderId` do nowej wizyty |
| `pages/api/visits/index.js` | 66-67 | ✅ `orderId` używa `visit.orderId` lub `orderNumber` |
| `data/orders.json` | All visits | ✅ Dodano pole `orderId` do wszystkich wizyt |

---

## 🔒 Bezpieczeństwo

Wszystkie zmiany zachowują istniejące zabezpieczenia:

- ✅ **Multi-auth token validation** (technician + employee sessions)
- ✅ **Ownership check** - tylko przypisany serwisant może dodać wizytę
- ✅ **Order reopening** - jeśli zlecenie było completed, zmienia na in_progress
- ✅ **Status history tracking** - zapisuje kto i kiedy utworzył wizytę

---

## 🚀 Kolejne kroki (opcjonalne)

### Potencjalne ulepszenia:

1. **Powiadomienia email/SMS**
   - Po dodaniu nowej wizyty → powiadomienie do klienta

2. **Synchronizacja kalendarza**
   - Automatyczne dodanie nowej wizyty do kalendarza serwisanta

3. **Walidacja dostępności**
   - Sprawdzenie czy serwisant jest wolny w wybranym terminie

4. **Bulk operations**
   - Możliwość dodania wielu wizyt naraz

---

## 📋 Changelog

**v1.0.0 - 15.10.2025**
- ✅ Dodano migrację danych (orderId do wizyt)
- ✅ Naprawiono API visit-details
- ✅ Naprawiono API add-visit-to-order
- ✅ Naprawiono API visits (dla admina)
- ✅ Nowe wizyty automatycznie dziedziczą dane ze zlecenia
- ✅ Admin widzi wszystkie wizyty z prawidłowymi ID

---

## ⚠️ Uwagi

1. **Migracja danych została wykonana JEDNORAZOWO**
   - Wszystkie istniejące wizyty mają teraz `orderId`
   - Nowe wizyty będą automatycznie tworzone z `orderId`

2. **Backward compatibility**
   - Kod obsługuje zarówno `orderNumber` jak i `id` jako fallback
   - Stare wizyty bez `orderId` nadal będą działać (API przypisze je automatycznie)

3. **Testowanie produkcyjne**
   - Przed wdrożeniem przetestuj na kopii danych produkcyjnych
   - Zweryfikuj wszystkie istniejące wizyty

---

**Status końcowy:** ✅ **GOTOWE DO UŻYCIA**  
**Tester:** Należy wykonać testy 1-3 z sekcji "Instrukcja testowania"
