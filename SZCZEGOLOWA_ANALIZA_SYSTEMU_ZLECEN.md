# 🔬 SZCZEGÓŁOWA ANALIZA SYSTEMU ZLECEŃ - KOMPLETNA DOKUMENTACJA

**Data analizy:** 5 października 2025  
**Autor:** GitHub Copilot  
**Status:** ✅ KOMPLETNA ANALIZA ZAKOŃCZONA

---

## 📋 SPIS TREŚCI

1. [Architektura Systemu](#architektura-systemu)
2. [Przepływ Danych: Od Rezerwacji do Realizacji](#przepływ-danych)
3. [Struktura Danych](#struktura-danych)
4. [API Endpoints](#api-endpoints)
5. [Interfejsy Użytkownika](#interfejsy-użytkownika)
6. [Workflow Krok po Kroku](#workflow-krok-po-kroku)
7. [System ID i Numeracji](#system-id-i-numeracji)
8. [Brakujące Funkcje](#brakujące-funkcje)
9. [Rekomendacje](#rekomendacje)

---

## 🏗️ ARCHITEKTURA SYSTEMU

### **Trzy główne encje:**

```
┌─────────────────┐
│   REZERWACJA    │  ← Zgłoszenie klienta (Request)
│  (Reservation)  │
└────────┬────────┘
         │
         │ convertReservationToClientOrder()
         ▼
┌─────────────────┐     ┌─────────────────┐
│     KLIENT      │────▶│    ZAMÓWIENIE   │  ← Zlecenie serwisowe (Order)
│    (Client)     │     │     (Order)     │
└─────────────────┘     └────────┬────────┘
                                 │
                                 │ Może mieć wiele wizyt
                                 ▼
                        ┌─────────────────┐
                        │     WIZYTA      │  ← Wykonanie w terenie (Visit)
                        │     (Visit)     │
                        └─────────────────┘
```

### **Pliki danych:**
- `data/rezerwacje.json` - Zgłoszenia klientów (LEGACY, zastępowane przez clients+orders)
- `data/clients.json` - Baza klientów
- `data/orders.json` - Zlecenia serwisowe
- `data/employees.json` - Serwisanci

---

## 🔄 PRZEPŁYW DANYCH: OD REZERWACJI DO REALIZACJI

### **KROK 1: Klient składa rezerwację** 📝

**Formularz:** `/admin/rezerwacje/nowa`

**Pola wymagane:**
- Dane klienta: imię, telefon, email
- Adresy (wielokrotne możliwe)
- Telefony (wielokrotne możliwe)
- Urządzenia (wielokrotne możliwe):
  - Kategoria (pralka, lodówka, zmywarka...)
  - Marka
  - Model
  - Problem/opis
  - Zabudowa (tak/nie)
  - Typ zabudowy (demontaż, montaż, trudna)
- Data preferowana (single lub flexible range)
- Dostępność klienta

**Co się dzieje przy POST na `/api/rezerwacje`:**

```javascript
// Linia 76 w pages/api/rezerwacje.js
const converted = await convertReservationToClientOrder(reservationData);

// Funkcja tworzy 2 obiekty:
{
  client: {
    id: "CLIS252770001",          // ← AUTO-GENERATED
    name: "Jan Kowalski",
    phone: "123456789",
    email: "jan@example.com",
    phones: [...],                // ← Wszystkie numery
    addresses: [...],             // ← Wszystkie adresy
    source: "system-auto",        // ← Źródło pochodzenia
    createdAt: "2025-10-05...",
  },
  order: {
    id: 1728123456789,            // ← Timestamp
    orderNumber: "ORDS252770001", // ← AUTO-GENERATED
    clientId: "CLIS252770001",    // ← RELACJA!
    devices: [                    // ← Lista urządzeń
      {
        name: "Pralka",
        brand: "Bosch",
        model: "WAW28560PL",
        description: "Nie wiruje",
        hasBuiltIn: true,
        builtInParams: {
          demontaz: true,
          montaz: true,
          trudna: false
        }
      }
    ],
    status: "scheduled",          // ← Status początkowy
    visits: [],                   // ← Puste na start
    // ... więcej pól
  }
}
```

**Sekwencja zapisu:**

```javascript
// 1. Dodaj klienta
newClient = await addClient(clientData);
// → Zapisuje do data/clients.json
// → ID: CLIS252770001

// 2. Dodaj zamówienie z ID klienta
newOrder = await addOrder({
  ...orderData,
  clientId: newClient.id  // ← LINK!
});
// → Zapisuje do data/orders.json
// → orderNumber: ORDS252770001

// 3. Wyślij email potwierdzający (opcjonalnie)
// 4. Utwórz notyfikację w systemie
```

---

### **KROK 2: Admin zarządza zleceniem** 🖥️

**Interfejs:** `/admin/zamowienia`

**Funkcje dostępne:**

1. **Lista wszystkich zleceń** (`/admin/zamowienia/index.js`)
   - Filtrowanie: status, typ urządzenia, data, klient
   - Wyszukiwanie: numer zlecenia, telefon, imię
   - Sortowanie: data, priorytet, status
   - Statystyki: liczba zleceń wg statusu

2. **Szczegóły zlecenia** (`/admin/zamowienia/[id].js`)
   - Dane klienta (imię, telefony, adresy)
   - Dane urządzeń (lista, zabudowa, modele)
   - Status i priorytet
   - Historia zmian statusu
   - **➕ Dodaj wizytę** (KLUCZOWA FUNKCJA!)
   - Komentarze
   - Edycja wszystkich pól

**Struktura statusów zlecenia:**

```javascript
const orderStatuses = [
  { value: 'nowe', label: 'Nowe' },              // ← Start
  { value: 'zaplanowane', label: 'Zaplanowane' }, // ← Po dodaniu wizyty
  { value: 'w-trakcie', label: 'W trakcie' },    // ← Serwisant rozpoczął
  { value: 'oczekuje-na-czesci', label: 'Oczekuje na części' },
  { value: 'zakonczone', label: 'Zakończone' },  // ← Finał
  { value: 'anulowane', label: 'Anulowane' }
];
```

---

### **KROK 3: Tworzenie wizyty** 🚗

**WAŻNE:** Zlecenie (Order) ≠ Wizyta (Visit)

**Relacja:**
- 1 Zlecenie może mieć **wiele wizyt**
- Przykład: Diagnoza → Czekanie na części → Naprawa → Kontrola

**Dodawanie wizyty w `/admin/zamowienia/[id].js`:**

```javascript
// Formularz dodawania wizyty:
{
  type: 'diagnosis',      // diagnosis, repair, control, installation
  employeeId: 'EMP001',   // ← Przypisany serwisant
  scheduledDate: '2025-10-10',
  scheduledTime: '10:00',
  notes: 'Diagnoza pralki w zabudowie'
}

// POST do /api/orders z action: 'add-visit'
```

**Struktura wizyty w zamówieniu:**

```javascript
order.visits = [
  {
    visitId: "VIS252770001",      // ← AUTO-GENERATED
    visitNumber: "VIS252770001",
    type: "diagnosis",            // Typ wizyty
    employeeId: "EMP001",
    employeeName: "Jan Serwisant",
    scheduledDate: "2025-10-10",
    scheduledTime: "10:00",
    status: "scheduled",          // scheduled → on_way → in_progress → completed
    startedAt: null,
    completedAt: null,
    duration: null,
    notes: "",
    photos: [],
    usedParts: [],
    workDescription: "",
    // GPS lokalizacja (zbierana w terenie)
    startLocation: null,
    endLocation: null,
    travelDistance: null
  }
];
```

---

### **KROK 4: Kalendarz i planowanie** 📅

**Interfejs:** `/admin/kalendarz.js`

**Funkcje:**
- Widok wszystkich wizyt na osi czasu
- Filtrowanie po serwisancie
- Statystyki:
  - Wszystkie wizyty
  - Ten tydzień
  - Zaplanowane
  - Zakończone
- Pobiera dane z `/api/orders` i wyciąga `order.visits[]`

**Inteligentne planowanie tras:** (jeśli włączone)
- API: `/api/intelligent-route-optimization`
- Optymalizuje kolejność wizyt według:
  - Geolokalizacji (najkrótsza trasa)
  - Priorytetu zlecenia
  - Szacowanego czasu wizyty
  - Dostępności serwisanta

---

### **KROK 5: Serwisant w terenie** 📱

**Panel serwisanta:** `/technician/*`

**Workflow serwisanta:**

1. **Login** (`/technician/login`)
   - Email + hasło
   - Token JWT w localStorage

2. **Dashboard** (`/technician/dashboard`)
   - Statystyki: wizyty dzisiaj, zakończone, pending
   - Szybki dostęp do wizyt

3. **Lista wizyt** (`/technician/visits`)
   - Filtrowanie: data, status, typ
   - Status:
     - `scheduled` - Zaplanowana
     - `on_way` - W drodze (GPS tracking)
     - `in_progress` - W trakcie realizacji
     - `paused` - Wstrzymana
     - `completed` - Zakończona
   
4. **Szczegóły wizyty** (`/technician/visit/[visitId]`)
   - Dane klienta (telefon do dzwonienia)
   - Dane urządzenia
   - Mapa z nawigacją
   - **Przycisk "Rozpocznij wizytę"**
   - **Przycisk "W drodze"** (GPS tracking)
   
5. **Realizacja wizyty:**
   ```javascript
   // Rozpoczęcie
   PUT /api/orders → status: 'in_progress'
   visit.startedAt = now()
   
   // Dodawanie zdjęć
   POST /api/technician/upload-photo
   - Typ: before, after, damage, part, serial
   - GPS location
   - Upload do /public/uploads/photos/
   
   // Używanie części
   POST /api/part-requests → usedParts.push(...)
   
   // Opis pracy
   visit.workDescription = "Wymieniono pompę, sprawdzono..."
   
   // Zakończenie
   PUT /api/orders → status: 'completed'
   visit.completedAt = now()
   visit.duration = completedAt - startedAt
   ```

6. **Offline Mode:**
   - Dane cached w localStorage
   - Sync po powrocie online

---

## 📊 STRUKTURA DANYCH

### **1. CLIENT (Klient)**

```json
{
  "id": "CLIS252770001",
  "clientId": "CLIS252770001",
  "name": "Jan Kowalski",
  "phone": "123456789",
  "email": "jan@example.com",
  
  "phones": [
    { "number": "123456789", "type": "mobile", "primary": true },
    { "number": "987654321", "type": "home", "primary": false }
  ],
  
  "addresses": [
    {
      "street": "Mickiewicza 10/5",
      "city": "Kraków",
      "postalCode": "30-059",
      "fullAddress": "Mickiewicza 10/5, 30-059 Kraków",
      "coordinates": {
        "lat": 50.0647,
        "lng": 19.9450
      },
      "primary": true
    }
  ],
  
  "source": "system-auto",
  "sourceDetails": null,
  "createdBy": "system",
  "createdByName": "System",
  "userId": null,
  "isAuthenticated": false,
  
  "dateAdded": "2025-10-05T10:30:00.000Z",
  "createdAt": "2025-10-05T10:30:00.000Z",
  "updatedAt": "2025-10-05T10:30:00.000Z",
  "updatedBy": null,
  
  "history": [
    {
      "date": "2025-10-05T10:30:00.000Z",
      "note": "📞 CALL z ekranu WebApp"
    }
  ]
}
```

**Kluczowe pola:**
- `id` - Unikalny identyfikator (format: `CLIS` + rok + dzień + sekwencja)
- `phones[]` - Wiele numerów telefonu
- `addresses[]` - Wiele adresów z GPS
- `source` - Źródło pochodzenia (system-auto, web, mobile, api)
- `history[]` - Historia kontaktów

---

### **2. ORDER (Zamówienie)**

```json
{
  "id": 1728123456789,
  "orderNumber": "ORDS252770001",
  "clientId": "CLIS252770001",
  
  "clientName": "Jan Kowalski",
  "clientPhone": "123456789",
  "email": "jan@example.com",
  "address": "Mickiewicza 10/5, 30-059 Kraków",
  "city": "Kraków",
  "street": "Mickiewicza 10/5",
  "postalCode": "30-059",
  
  "phones": [...],
  "addresses": [...],
  
  "clientLocation": {
    "formatted_address": "Mickiewicza 10/5, 30-059 Kraków",
    "coordinates": {
      "lat": 50.0647,
      "lng": 19.9450
    }
  },
  "latitude": 50.0647,
  "longitude": 19.9450,
  
  "deviceType": "Pralka",
  "brand": "Bosch",
  "model": "WAW28560PL",
  "serialNumber": "",
  "description": "Pralka nie wiruje po praniu",
  
  "devices": [
    {
      "name": "Pralka",
      "brand": "Bosch",
      "model": "WAW28560PL",
      "serialNumber": "",
      "description": "Pralka nie wiruje po praniu",
      "hasBuiltIn": true,
      "builtInParams": {
        "demontaz": true,
        "montaz": true,
        "trudna": false,
        "wolnostojacy": false,
        "ograniczony": false,
        "front": false,
        "czas": false
      },
      "builtInParamsNotes": {}
    }
  ],
  
  "priority": "medium",
  "status": "scheduled",
  
  "visits": [
    {
      "visitId": "VIS252770001",
      "visitNumber": "VIS252770001",
      "type": "diagnosis",
      "employeeId": "EMP001",
      "employeeName": "Jan Serwisant",
      "scheduledDate": "2025-10-10",
      "scheduledTime": "10:00",
      "status": "scheduled",
      "notes": "",
      "photos": [],
      "usedParts": [],
      "workDescription": "",
      "startedAt": null,
      "completedAt": null,
      "duration": null
    }
  ],
  
  "source": "system-auto",
  "sourceDetails": null,
  "createdBy": "system",
  "createdByName": "System",
  
  "dateAdded": "2025-10-05T10:30:00.000Z",
  "createdAt": "2025-10-05T10:30:00.000Z",
  "updatedAt": "2025-10-05T10:30:00.000Z",
  "updatedBy": null,
  
  "category": "Naprawa",
  "serviceType": "Pralka",
  "scheduledDate": "2025-10-10",
  "scheduledTime": "10:00",
  "availability": "Poniedziałek 8:00-16:00",
  "dates": ["2025-10-10"],
  "hours": null,
  "end": null
}
```

**Kluczowe pola:**
- `orderNumber` - Numer zlecenia (format: `ORDS` + rok + dzień + sekwencja)
- `clientId` - **RELACJA** do klienta
- `devices[]` - Lista urządzeń do naprawy
- `visits[]` - **Lista wizyt serwisanta**
- `status` - Status zamówienia (nowe, zaplanowane, w-trakcie, zakończone)

---

### **3. VISIT (Wizyta)**

Wizyta jest **częścią zamówienia** (`order.visits[]`):

```json
{
  "visitId": "VIS252770001",
  "visitNumber": "VIS252770001",
  "orderId": 1728123456789,
  "orderNumber": "ORDS252770001",
  
  "type": "diagnosis",
  "employeeId": "EMP001",
  "employeeName": "Jan Serwisant",
  
  "scheduledDate": "2025-10-10",
  "scheduledTime": "10:00",
  "estimatedDuration": 60,
  
  "status": "scheduled",
  "startedAt": null,
  "arrivedAt": null,
  "completedAt": null,
  "duration": null,
  
  "clientId": "CLIS252770001",
  "clientName": "Jan Kowalski",
  "clientPhone": "123456789",
  "clientAddress": "Mickiewicza 10/5, 30-059 Kraków",
  
  "coordinates": {
    "lat": 50.0647,
    "lng": 19.9450
  },
  
  "deviceType": "Pralka",
  "brand": "Bosch",
  "model": "WAW28560PL",
  
  "priority": "medium",
  "notes": "",
  
  "workDescription": "",
  "diagnosis": "",
  "actionsTaken": "",
  
  "photos": [
    {
      "id": "PHOTO123",
      "type": "before",
      "url": "/uploads/photos/VIS252770001/before_123.jpg",
      "timestamp": "2025-10-10T10:30:00.000Z",
      "location": {
        "lat": 50.0647,
        "lng": 19.9450
      }
    }
  ],
  
  "usedParts": [
    {
      "partId": "PART001",
      "name": "Pompa odpływowa",
      "quantity": 1,
      "cost": 80.00,
      "warrantyMonths": 12
    }
  ],
  
  "startLocation": {
    "lat": 50.0000,
    "lng": 19.0000
  },
  "endLocation": {
    "lat": 50.0647,
    "lng": 19.9450
  },
  "travelDistance": 5.2,
  
  "createdAt": "2025-10-05T10:30:00.000Z",
  "updatedAt": "2025-10-10T12:00:00.000Z"
}
```

**Kluczowe pola:**
- `visitId` - Unikalny ID wizyty (format: `VIS` + rok + dzień + sekwencja)
- `orderId` - **RELACJA** do zamówienia
- `employeeId` - **RELACJA** do serwisanta
- `status` - scheduled → on_way → in_progress → completed
- `photos[]` - Zdjęcia z wizyty
- `usedParts[]` - Użyte części

---

## 🔌 API ENDPOINTS

### **1. Rezerwacje**

#### `POST /api/rezerwacje`
**Opis:** Tworzy nową rezerwację + automatycznie tworzy klienta i zamówienie

**Body:**
```json
{
  "name": "Jan Kowalski",
  "phone": "123456789",
  "email": "jan@example.com",
  "address": "Mickiewicza 10/5, 30-059 Kraków",
  "category": "Pralka",
  "device": "Bosch WAW28560PL",
  "problem": "Nie wiruje",
  "date": "2025-10-10",
  "availability": "Poniedziałek 8:00-16:00"
}
```

**Response:**
```json
{
  "message": "Rezerwacja przyjęta",
  "data": { ...rezerwacja... },
  "client": { ...nowy klient... },
  "order": { 
    "orderNumber": "ORDS252770001",
    "id": 1728123456789
  },
  "emailSent": true
}
```

**Proces wewnętrzny:**
```javascript
1. convertReservationToClientOrder(data) 
   → { client, order }
   
2. addClient(client)
   → newClient (ID: CLIS252770001)
   
3. addOrder({ ...order, clientId: newClient.id })
   → newOrder (orderNumber: ORDS252770001)
   
4. sendEmail(email, data)
   
5. createNotification(...)
```

---

#### `GET /api/rezerwacje`
**Opis:** Pobiera wszystkie rezerwacje (combo: rezerwacje + klienci + zamówienia)

**Query params:**
- `id` - Pobierz pojedynczą rezerwację

**Response:**
```json
{
  "rezerwacje": [
    {
      "id": "CLIS252770001",
      "name": "Jan Kowalski",
      "phone": "123456789",
      "address": "...",
      "serviceType": "Pralka",
      "scheduledDate": "2025-10-10",
      "status": "pending",
      "orderId": 1728123456789,
      "orderNumber": "ORDS252770001"
    }
  ]
}
```

---

#### `PUT /api/rezerwacje`
**Opis:** Aktualizuje rezerwację (modyfikuje klienta + zamówienie)

**Body:**
```json
{
  "id": "CLIS252770001",
  "name": "Jan Kowalski",
  "status": "scheduled",
  ...
}
```

**Proces:**
1. Znajdź klienta po ID
2. Zaktualizuj dane klienta
3. Znajdź zamówienie dla tego klienta
4. Zaktualizuj dane zamówienia

---

#### `DELETE /api/rezerwacje?id=...`
**Opis:** Usuwa rezerwację + zamówienie + klienta

**Proces:**
1. Znajdź zamówienia klienta
2. Usuń wszystkie zamówienia
3. Usuń klienta

---

### **2. Zamówienia**

#### `GET /api/orders`
**Opis:** Pobiera wszystkie zamówienia

**Query params:**
- `id` - Pobierz pojedyncze zamówienie
- `clientId` - Zamówienia konkretnego klienta
- `status` - Filtruj po statusie
- `employeeId` - Zamówienia przypisane do serwisanta

**Response:**
```json
{
  "orders": [
    {
      "id": 1728123456789,
      "orderNumber": "ORDS252770001",
      "clientId": "CLIS252770001",
      "status": "scheduled",
      "visits": [...]
    }
  ]
}
```

---

#### `POST /api/orders`
**Opis:** Tworzy nowe zamówienie (ręcznie, bez rezerwacji)

**Body:**
```json
{
  "clientId": "CLIS252770001",
  "deviceType": "Pralka",
  "description": "Naprawa",
  "priority": "medium",
  "status": "pending"
}
```

**❌ UWAGA:** Ta funkcja może NIE być zaimplementowana!
Obecnie zamówienia powstają TYLKO przez `/api/rezerwacje`.

---

#### `PUT /api/orders`
**Opis:** Aktualizuje zamówienie

**Actions:**
- `update` - Zaktualizuj dane
- `add-visit` - Dodaj wizytę
- `update-visit` - Zaktualizuj wizytę
- `complete-visit` - Zakończ wizytę

**Body (add-visit):**
```json
{
  "id": 1728123456789,
  "action": "add-visit",
  "visit": {
    "type": "diagnosis",
    "employeeId": "EMP001",
    "scheduledDate": "2025-10-10",
    "scheduledTime": "10:00"
  }
}
```

---

### **3. Serwisant (Technician)**

#### `GET /api/technician/visits`
**Headers:** `Authorization: Bearer <token>`

**Query params:**
- `date` - all, today, week, month
- `status` - all, scheduled, on_way, in_progress, completed
- `type` - all, diagnosis, repair, control

**Response:**
```json
{
  "visits": [...],
  "statistics": {
    "total": 45,
    "today": 3,
    "thisWeek": 12,
    "byStatus": {
      "scheduled": 5,
      "completed": 40
    }
  }
}
```

---

#### `PUT /api/orders` (z tokena serwisanta)
**Opis:** Serwisant aktualizuje status wizyty

**Body:**
```json
{
  "action": "update-visit",
  "visitId": "VIS252770001",
  "status": "in_progress",
  "startedAt": "2025-10-10T10:00:00.000Z"
}
```

---

#### `POST /api/technician/upload-photo`
**Opis:** Upload zdjęcia z wizyty

**Body (FormData):**
```
photo: <file>
visitId: "VIS252770001"
orderId: 1728123456789
type: "before" | "after" | "damage" | "part" | "serial"
location: { lat, lng }
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": "PHOTO123",
    "url": "/uploads/photos/VIS252770001/before_123.jpg"
  }
}
```

---

## 🖥️ INTERFEJSY UŻYTKOWNIKA

### **1. Panel Admina** (`/admin/*`)

#### **Dashboard** (`/admin/index.js`)
- Statystyki systemowe
- Szybki podgląd zleceń

#### **Rezerwacje** (`/admin/rezerwacje/*`)
- `index.js` - Lista rezerwacji
- `nowa.js` - Formularz nowej rezerwacji
- `[id].js` - Podgląd rezerwacji (READ-ONLY)
- `edytuj/[id].js` - Edycja rezerwacji

**Funkcje:**
- Tworzenie rezerwacji → AUTO tworzy klienta + zamówienie
- Filtrowanie (status, data, klient)
- Geocoding adresów (Google Maps API)
- Multi-phone, multi-address, multi-device
- Zabudowa urządzeń (demontaż, montaż, trudna)
- Elastyczne daty (single or range)

---

#### **Zamówienia** (`/admin/zamowienia/*`)
- `index.js` - Lista zleceń
- `[id].js` - Szczegóły + edycja zlecenia

**Funkcje `index.js`:**
- Filtrowanie: status, urządzenie, data
- Wyszukiwanie: klient, telefon, numer
- Sortowanie: data, priorytet
- Statystyki

**Funkcje `[id].js`:**
- Dane klienta (wszystkie telefony/adresy)
- Dane urządzeń (lista z zabudową)
- **➕ Dodaj wizytę**
  - Wybór serwisanta
  - Typ wizyty (diagnosis, repair, control)
  - Data i godzina
- Historia wizyt
- Edycja statusu
- Komentarze
- Model Manager (zarządzanie modelami urządzeń)

---

#### **Kalendarz** (`/admin/kalendarz.js`)
- Widok wszystkich wizyt na osi czasu
- Filtrowanie po serwisancie
- Statystyki tygodniowe

---

#### **Klienci** (`/admin/klienci/*`)
- Lista klientów
- Historia zamówień klienta
- Kontakty (call/SMS/email logging)

---

### **2. Panel Serwisanta** (`/technician/*`)

#### **Login** (`/technician/login.js`)
- Email + hasło
- JWT token w localStorage

#### **Dashboard** (`/technician/dashboard.js`)
- Statystyki dzisiejsze
- Szybki dostęp do wizyt

#### **Wizyty** (`/technician/visits.js`)
- Lista wizyt
- Filtrowanie: data, status, typ
- Status badging:
  - 🔵 Scheduled
  - 🟡 On way
  - 🟠 In progress
  - 🟢 Completed

#### **Szczegóły wizyty** (`/technician/visit/[visitId].js`)
- Dane klienta (call button)
- Dane urządzenia
- Mapa z nawigacją (Google Maps)
- **Przyciski akcji:**
  - "W drodze" → GPS tracking
  - "Rozpocznij" → status: in_progress
  - "Zakończ" → status: completed
- **Upload zdjęć** (before, after, damage, part, serial)
- **Dodaj części** (link do magazynu)
- **Opis pracy** (textarea)

---

## 🚀 WORKFLOW KROK PO KROKU

### **SCENARIUSZ A: Nowa rezerwacja przez formularz**

```
1. Klient wypełnia formularz /admin/rezerwacje/nowa
   ↓
2. POST /api/rezerwacje
   ↓
3. convertReservationToClientOrder()
   ↓
4. addClient() → CLIS252770001
   ↓
5. addOrder() → ORDS252770001
   ↓
6. sendEmail()
   ↓
7. createNotification()
   ↓
8. Response: { client, order, emailSent: true }
```

---

### **SCENARIUSZ B: Admin planuje wizytę**

```
1. Admin otwiera /admin/zamowienia/[id]
   ↓
2. Klika "Dodaj wizytę"
   ↓
3. Wypełnia formularz:
   - Typ: diagnosis
   - Serwisant: Jan Kowalski (EMP001)
   - Data: 2025-10-10
   - Czas: 10:00
   ↓
4. PUT /api/orders
   action: "add-visit"
   ↓
5. Generuje visitId: VIS252770001
   ↓
6. order.visits.push(newVisit)
   ↓
7. order.status = "zaplanowane"
   ↓
8. writeOrders(orders)
   ↓
9. Serwisant widzi wizytę w /technician/visits
```

---

### **SCENARIUSZ C: Serwisant wykonuje wizytę**

```
1. Serwisant loguje się /technician/login
   ↓
2. Widzi listę wizyt /technician/visits
   ↓
3. Klika wizytę VIS252770001
   ↓
4. /technician/visit/[visitId]
   ↓
5. Klika "W drodze"
   → PUT /api/orders (status: on_way)
   → GPS tracking start
   ↓
6. Dociera na miejsce
   ↓
7. Klika "Rozpocznij"
   → PUT /api/orders (status: in_progress)
   → visit.startedAt = now()
   ↓
8. Wykonuje pracę:
   - Dodaje zdjęcia "before"
   - Diagnozuje problem
   - Wymienia części
   - Dodaje zdjęcia "after"
   ↓
9. Wypełnia opis pracy
   ↓
10. Klika "Zakończ"
   → PUT /api/orders (status: completed)
   → visit.completedAt = now()
   → visit.duration = completedAt - startedAt
   ↓
11. Wizyta zakończona!
```

---

## 🔢 SYSTEM ID I NUMERACJI

### **Format ID:**

```
CLIS252770001  ← Client ID
│   │││││ │
│   │││││ └─ Sekwencja (00001, 00002, ...)
│   ││││└── Dzień roku (277 = 4 października)
│   │││└─── Tydzień (opcjonalnie)
│   ││└──── Rok (25 = 2025)
│   │└───── Prefix typu
│   └────── S = System Auto (może być W = Web, M = Mobile, A = API)
└────────── Typ (CLI = Client)

ORDS252770001  ← Order Number
│
└── ORD = Order

VIS252770001   ← Visit ID
│
└── VIS = Visit

EMP001         ← Employee ID
│
└── EMP = Employee
```

### **Generatory ID:**

Znajdują się w `utils/id-generator.js`:

```javascript
export function generateClientId(clients, date, source) {
  // Format: CLI + S/W/M/A + YY + DDD + sekwencja
  const sourceCode = source[0].toUpperCase(); // S, W, M, A
  const year = date.getFullYear().toString().slice(-2); // 25
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0'); // 277
  const sequence = getNextSequence(clients, prefix).toString().padStart(5, '0');
  
  return `CLI${sourceCode}${year}${dayOfYear}${sequence}`;
}
```

**Źródła (source):**
- `S` - System Auto (automatyczne z formularza)
- `W` - Web (ręczne przez admin panel)
- `M` - Mobile (aplikacja mobilna)
- `A` - API (zewnętrzny system)

---

## ❌ BRAKUJĄCE FUNKCJE

### **1. Brak ręcznego tworzenia zleceń**

**Problem:**
- `/admin/zamowienia/index.js` NIE MA przycisku "Nowe zlecenie"
- Zlecenia można tworzyć TYLKO przez rezerwacje

**Rozwiązanie:**
```javascript
// Dodaj w /admin/zamowienia/index.js:
<Link href="/admin/zamowienia/nowe">
  <button>➕ Nowe zlecenie</button>
</Link>

// Stwórz /admin/zamowienia/nowe.js:
// - Wybór klienta (lub dodaj nowego)
// - Dane urządzenia
// - Priorytet
// - Status początkowy
```

---

### **2. Brak masowego zarządzania**

**Problem:**
- Nie można zaznaczyć wielu zleceń
- Brak akcji grupowych (zmiana statusu, przypisanie serwisanta)

**Rozwiązanie:**
- Dodaj checkboxy w liście
- Akcje: Masowa zmiana statusu, Usuń zaznaczone

---

### **3. Brak powiadomień push**

**Problem:**
- System nie wysyła powiadomień do serwisanta
- Brak alertów o nowych wizytach

**Rozwiązanie:**
- Implementuj Web Push API
- Dodaj `/api/notifications`
- Subscribe serwisantów

---

### **4. Brak historii zmian**

**Problem:**
- Nie ma logowania kto i kiedy zmienił status
- Brak auditu

**Rozwiązanie:**
```javascript
// Dodaj do zamówienia:
statusHistory: [
  {
    status: "nowe",
    changedAt: "2025-10-05T10:00:00.000Z",
    changedBy: "admin",
    changedByName: "Jan Kowalski",
    notes: "Zlecenie utworzone"
  },
  {
    status: "zaplanowane",
    changedAt: "2025-10-05T11:00:00.000Z",
    changedBy: "admin",
    changedByName: "Jan Kowalski",
    notes: "Dodano wizytę diagnostyczną"
  }
]
```

---

### **5. Brak systemu fakturowania**

**Problem:**
- Nie ma generowania faktur
- Brak rozliczeń finansowych

**Rozwiązanie:**
- Dodaj moduł `/admin/faktury`
- Integracja z systemem księgowym
- PDF generator (react-pdf lub jsPDF)

---

## 💡 REKOMENDACJE

### **1. PRIORYTET 1: Dodaj przycisk "Nowe zlecenie"**

```javascript
// pages/admin/zamowienia/index.js
// Dodaj w headerze:

<div className="flex items-center space-x-3">
  <Link href="/admin/zamowienia/nowe">
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      <FiPlus className="mr-2 h-4 w-4" />
      Nowe zlecenie
    </button>
  </Link>
  
  <button onClick={loadOrders}>
    <FiRefreshCw className="mr-2 h-4 w-4" />
    Odśwież
  </button>
</div>
```

**Utwórz `/admin/zamowienia/nowe.js`:**
- Formularz podobny do `/admin/rezerwacje/nowa.js`
- Ale BEZ automatycznego tworzenia klienta
- Wybór istniejącego klienta z listy
- LUB dodanie nowego klienta inline

---

### **2. PRIORYTET 2: Usprawnij workflow wizyt**

**Dodaj statusy pośrednie:**
```javascript
const visitStatuses = [
  'scheduled',      // Zaplanowana
  'confirmed',      // Potwierdzona (klient potwierdził)
  'on_way',         // W drodze
  'arrived',        // Dotarł na miejsce
  'in_progress',    // Trwa realizacja
  'paused',         // Wstrzymana (oczekiwanie na części)
  'completed',      // Zakończona
  'cancelled'       // Anulowana
];
```

---

### **3. PRIORYTET 3: Dodaj moduł raportów**

**Raporty potrzebne:**
- Dzienny raport wizyt (PDF)
- Miesięczny raport serwisanta
- Raport przychodów
- Raport użytych części

**Implementacja:**
```
/admin/raporty
  ├── dzienny.js
  ├── miesięczny.js
  ├── serwisant.js
  └── finanse.js
```

---

### **4. PRIORYTET 4: Mobile App (opcjonalnie)**

**Jeśli potrzebna dedykowana apka:**
- React Native (Expo)
- Sync z API
- Offline mode
- GPS tracking w tle
- Camera API

---

## 📝 PODSUMOWANIE

### **✅ CO DZIAŁA:**

1. ✅ Tworzenie rezerwacji → auto-tworzenie klienta + zamówienia
2. ✅ Zarządzanie zleceniami (lista, szczegóły, edycja)
3. ✅ Dodawanie wizyt do zleceń
4. ✅ Panel serwisanta (lista wizyt, szczegóły)
5. ✅ Upload zdjęć z wizyt
6. ✅ GPS tracking
7. ✅ Kalendarz wizyt
8. ✅ System ID (CLIS, ORDS, VIS)
9. ✅ Email potwierdzający rezerwację
10. ✅ Notyfikacje systemowe

### **❌ CZEGO BRAKUJE:**

1. ❌ Przycisk "Nowe zlecenie" w `/admin/zamowienia`
2. ❌ Historia zmian statusu
3. ❌ Powiadomienia push dla serwisanta
4. ❌ Masowe operacje na zleceniach
5. ❌ System fakturowania
6. ❌ Raporty (PDF exports)
7. ❌ Dashboard analityczny (wykresy, KPI)

### **🎯 ODPOWIEDŹ NA PYTANIE:**

**"Jak mogę dodać zlecenia?"**

**Odpowiedź:**
1. **Obecnie:** Zlecenia powstają AUTOMATYCZNIE gdy tworzysz rezerwację przez `/admin/rezerwacje/nowa`
2. **Potem:** Możesz zarządzać nimi w `/admin/zamowienia`
3. **Aby dodać wizytę:** Wejdź w zlecenie `/admin/zamowienia/[id]` → Kliknij "Dodaj wizytę"

**Jeśli chcesz RĘCZNIE tworzyć zlecenia (bez rezerwacji):**
- Potrzebujesz nowej strony `/admin/zamowienia/nowe.js`
- Mogę ją dla Ciebie stworzyć! 🚀

---

**🎉 ANALIZA ZAKOŃCZONA!**

Masz teraz **kompletną wiedzę** o systemie:
- Jak działa flow od rezerwacji do realizacji
- Jakie są relacje między danymi
- Gdzie są interfejsy
- Czego brakuje

**Czy chcesz, abym teraz dodał brakującą funkcję "Nowe zlecenie"?** 😊
