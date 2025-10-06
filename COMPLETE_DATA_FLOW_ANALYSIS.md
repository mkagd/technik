# 📊 KOMPLEKSOWA ANALIZA PRZEPŁYWU DANYCH - SYSTEM TECHNIK

**Data analizy:** 2025-06-01  
**Wersja:** 2.0 (po unifikacji systemów harmonogramów)  
**Status:** ✅ Zunifikowano systemy harmonogramów

---

## 📋 SPIS TREŚCI

1. [Architektura Ogólna](#architektura-ogólna)
2. [Systemy Danych](#systemy-danych)
3. [Pliki JSON - Źródła Prawdy](#pliki-json)
4. [API Endpoints - Przepływ Danych](#api-endpoints)
5. [Komponenty Frontend](#komponenty-frontend)
6. [Krytyczne Relacje Danych](#krytyczne-relacje)
7. [Zidentyfikowane Problemy](#problemy)
8. [Rekomendacje](#rekomendacje)

---

## 🏗️ ARCHITEKTURA OGÓLNA

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Admin     │  │  Technician │  │      Client         │ │
│  │   Panel     │  │    Panel    │  │      Portal         │ │
│  └─────┬───────┘  └──────┬──────┘  └──────┬──────────────┘ │
└────────┼──────────────────┼─────────────────┼────────────────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            ▼
         ┌─────────────────────────────────────┐
         │       API LAYER (pages/api/)        │
         │  ┌──────────┐  ┌───────────────┐   │
         │  │  Orders  │  │   Employees   │   │
         │  │  Visits  │  │   Schedules   │   │
         │  │  Clients │  │   Inventory   │   │
         │  └──────────┘  └───────────────┘   │
         └────────┬──────────┬─────────────────┘
                  │          │
                  ▼          ▼
         ┌────────────────────────────────┐
         │     DATA LAYER (data/*.json)   │
         │  ┌──────────────────────────┐  │
         │  │  SINGLE SOURCE OF TRUTH  │  │
         │  │  - orders.json           │  │
         │  │  - clients.json          │  │
         │  │  - employees.json        │  │
         │  │  - work-schedules.json ✅│  │
         │  └──────────────────────────┘  │
         └────────────────────────────────┘
```

**Kluczowe Zasady:**
- ✅ **Jeden plik = jedno źródło prawdy** (Single Source of Truth)
- ✅ **API = jedyny sposób modyfikacji danych** (Backend kontrola)
- ✅ **Unifikacja systemów** (work-schedules.json jest autorytatywne)
- ⚠️ **Brak bezpośrednich modyfikacji JSON z frontendu**

---

## 🗂️ SYSTEMY DANYCH

### 1️⃣ SYSTEM ZAMÓWIEŃ (Orders)

**Źródło prawdy:** `data/orders.json`

```javascript
{
  "orders": [
    {
      "id": "ORD20250601001",
      "orderNumber": "2025/06/001",
      "clientId": "KL-2025-001",
      "clientName": "Jan Kowalski",
      "deviceType": "Lodówka",
      "deviceBrand": "Samsung",
      "deviceModel": "RB37J5005SA",
      "problemDescription": "Nie chłodzi",
      "status": "pending",
      "createdAt": "2025-06-01T10:00:00Z",
      "visits": [
        {
          "visitId": "VIS-001",
          "type": "diagnosis",
          "scheduledDate": "2025-06-05",
          "scheduledTime": "10:00",
          "technicianId": "EMP001",
          "status": "scheduled",
          "estimatedDuration": 60
        }
      ],
      "photos": [],
      "parts": [],
      "totalCost": 0
    }
  ]
}
```

**API Endpoints:**
- `POST /api/orders` - Tworzenie zamówienia
- `GET /api/orders` - Lista zamówień
- `GET /api/orders/[id]` - Szczegóły zamówienia
- `PUT /api/orders` - Aktualizacja zamówienia
- `DELETE /api/orders/[id]` - Usuwanie zamówienia
- `POST /api/client/create-order` - Klient tworzy zamówienie

**Frontend Components:**
- `/panel-zgloszenia` - Admin: Lista zamówień
- `/panel-szczegoly` - Admin: Szczegóły zamówienia
- `/client/new-order` - Klient: Nowe zamówienie
- `/client/orders` - Klient: Moje zamówienia

**Relacje:**
- `clientId` → `clients.json`
- `visits[].technicianId` → `employees.json`
- `parts[].partId` → `parts-inventory.json`

---

### 2️⃣ SYSTEM WIZYT (Visits)

**⚠️ UWAGA:** Wizyty są przechowywane w **dwóch miejscach:**

1. **`data/orders.json` - GŁÓWNE ŹRÓDŁO**
   - Pole: `orders[].visits[]`
   - Kompletne dane wizyt z historią
   - Powiązane z zamówieniami

2. **`data/visits.json` - POMOCNICZE (opcjonalne)**
   - Płaska struktura dla szybkiego wyszukiwania
   - Może być niezsynchronizowane!

**Struktura wizyty:**
```javascript
{
  "visitId": "VIS-001",
  "orderId": "ORD20250601001",
  "type": "diagnosis", // diagnosis | repair | warranty | followup
  "scheduledDate": "2025-06-05",
  "scheduledTime": "10:00",
  "technicianId": "EMP001", // lub employeeId (legacy)
  "status": "scheduled", // scheduled | in-progress | completed | cancelled
  "estimatedDuration": 60,
  "actualDuration": null,
  "checkInTime": null,
  "checkOutTime": null,
  "notes": "",
  "photos": [],
  "partsUsed": []
}
```

**API Endpoints:**
- `GET /api/visits` - Lista wszystkich wizyt
- `POST /api/visits/assign` - Przypisanie wizyty do technika
- `GET /api/technician/visits` - Wizyty technika (mobilne)
- `PUT /api/technician/visits/[visitId]` - Aktualizacja wizyty
- `GET /api/visits/audit-log` - Historia zmian wizyt

**Frontend Components:**
- `/panel-przydzial-zlecen` - Admin: Przypisywanie wizyt
- `/technician/visits` - Technik: Moje wizyty
- `/technician/visit/[visitId]` - Technik: Szczegóły wizyty

---

### 3️⃣ SYSTEM HARMONOGRAMÓW (Schedules) ✅ ZUNIFIKOWANY

**🔧 PRZED UNIFIKACJĄ (PROBLEM):**
```
System A: work-schedules.json (Technik ustawia)
System B: employee-schedules.json (Admin sprawdza)
❌ Brak synchronizacji → konflikty
```

**✅ PO UNIFIKACJI (ROZWIĄZANIE):**

**Źródło prawdy:** `data/work-schedules.json` (AUTORYTATYWNE)

```javascript
{
  "schedules": [
    {
      "id": "WS-001",
      "employeeId": "EMP001",
      "weekStart": "2025-06-02", // Poniedziałek tygodnia
      "workSlots": [
        {
          "dayOfWeek": 1, // 0=Niedziela, 1=Poniedziałek, ..., 6=Sobota
          "startTime": "08:00",
          "endTime": "16:00",
          "type": "work"
        },
        {
          "dayOfWeek": 2,
          "startTime": "09:00",
          "endTime": "17:00",
          "type": "work"
        }
      ],
      "breaks": [
        {
          "dayOfWeek": 1,
          "startTime": "12:00",
          "endTime": "12:30",
          "type": "lunch"
        }
      ],
      "createdAt": "2025-06-01T08:00:00Z",
      "updatedAt": "2025-06-01T08:00:00Z"
    }
  ]
}
```

**Fallback:** `data/employee-schedules.json` (TYLKO ODCZYT)
- Format dzienny: `{ "2025-06-05": { "EMP001": { timeSlots: [] } } }`
- Używany tylko gdy brak w work-schedules.json

**API Endpoints:**
- `GET /api/employee-calendar?employeeId=X&date=Y` 
  - **Priorytet 1:** Konwertuje `work-schedules.json` (weekly → daily)
  - **Priorytet 2:** Sprawdza `employee-schedules.json`
  - **Priorytet 3:** Generuje z `employees.json` workingHours
  
- `POST /api/technician/work-schedule` - Technik ustawia harmonogram
- `GET /api/employee-calendar/availability` - Sprawdź dostępność
- `GET /api/employee-calendar/all?date=X` - Wszystkie harmonogramy na dzień

**Konwersja formatu (weekly → daily):**
```javascript
// Funkcja: convertWorkScheduleToDaily(employeeId, date)
// INPUT: weekStart="2025-06-02", dayOfWeek=1, workSlot="08:00-16:00"
// OUTPUT: date="2025-06-03", timeSlots=[{time:"08:00",status:"available"}...]
```

**Frontend Components:**
- `/technician/schedule` - Technik: Ustawianie harmonogramu (weekly)
- `/panel-przydzial-zlecen` - Admin: Widok harmonogramów (daily, zunifikowany)

**Schemat przepływu:**
```
Technik ustawia harmonogram
         ▼
   work-schedules.json (ZAPIS)
         ▼
   API konwertuje weekly → daily
         ▼
   Admin widzi harmonogram (ODCZYT zunifikowany)
```

---

### 4️⃣ SYSTEM KLIENTÓW (Clients)

**Źródło prawdy:** `data/clients.json`

```javascript
{
  "clients": [
    {
      "id": "KL-2025-001",
      "name": "Jan Kowalski",
      "email": "jan.kowalski@email.com",
      "phone": "+48 123 456 789",
      "address": {
        "street": "ul. Główna 1",
        "city": "Warszawa",
        "postalCode": "00-001",
        "coordinates": {
          "lat": 52.2297,
          "lng": 21.0122
        }
      },
      "accountType": "individual", // individual | business
      "nip": null,
      "companyName": null,
      "availabilitySlots": [ // Dostępność klienta
        {
          "startDate": "2025-06-05",
          "endDate": "2025-06-05",
          "startTime": "08:00",
          "endTime": "16:00",
          "type": "available"
        }
      ],
      "createdAt": "2025-01-15T10:00:00Z",
      "isActive": true
    }
  ]
}
```

**API Endpoints:**
- `GET /api/clients` - Lista klientów
- `POST /api/clients` - Nowy klient
- `GET /api/clients/[id]` - Szczegóły klienta
- `PUT /api/clients/[id]` - Aktualizacja klienta
- `POST /api/client/update-profile` - Klient aktualizuje profil

**Frontend Components:**
- `/panel-klienci` - Admin: Lista klientów
- `/client/profile` - Klient: Mój profil
- `/client/new-order` - Klient: Formularz dostępności

**Relacje:**
- Klient → Zamówienia (`orders.json`)
- `availabilitySlots` → Wykorzystywane przy przydziale wizyt

---

### 5️⃣ SYSTEM PRACOWNIKÓW (Employees)

**Źródło prawdy:** `data/employees.json`

```javascript
{
  "employees": [
    {
      "id": "EMP001",
      "name": "Adam Nowak",
      "email": "adam.nowak@firma.pl",
      "phone": "+48 987 654 321",
      "role": "technician", // technician | admin | manager
      "specializations": ["lodówki", "pralki"],
      "workingHours": "8:00-16:00", // Domyślne godziny (fallback)
      "location": {
        "lat": 52.2297,
        "lng": 21.0122
      },
      "isActive": true,
      "visitRates": { // System prowizji ✅
        "diagnosis": 50, // Prowizja za wizytę diagnostyczną
        "repair": 100,   // Prowizja za naprawę
        "warranty": 80,  // Prowizja za wizytę gwarancyjną
        "followup": 30   // Prowizja za wizytę kontrolną
      },
      "bonus": 0, // Dodatkowe bonusy
      "personalInventory": [] // Prywatny magazyn technika
    }
  ]
}
```

**API Endpoints:**
- `GET /api/employees` - Lista pracowników
- `POST /api/employees` - Nowy pracownik
- `GET /api/employees/[id]` - Szczegóły pracownika
- `PUT /api/employees` - Aktualizacja pracownika
- `GET /api/technician/stats` - Statystyki technika

**Frontend Components:**
- `/panel-pracownicy` - Admin: Lista pracowników
- `/technician/dashboard` - Technik: Panel główny
- `/technician/stats` - Technik: Statystyki i zarobki

**Relacje:**
- Pracownik → Harmonogramy (`work-schedules.json`)
- Pracownik → Wizyty (`orders.json[].visits[]`)
- Pracownik → Magazyn osobisty (`personal-inventories.json`)

---

### 6️⃣ SYSTEM MAGAZYNU (Inventory)

**Główny magazyn:** `data/parts-inventory.json`

```javascript
{
  "parts": [
    {
      "id": "PART-001",
      "name": "Termostat lodówki",
      "category": "części chłodnicze",
      "manufacturer": "Samsung",
      "model": "DA47-00244C",
      "quantity": 15,
      "unit": "szt",
      "purchasePrice": 45.00,
      "sellingPrice": 89.99,
      "minStockLevel": 5,
      "location": "Magazyn A, Półka 3",
      "supplier": "SUP-001"
    }
  ]
}
```

**Magazyny osobiste techników:** `data/personal-inventories.json`

```javascript
{
  "inventories": [
    {
      "employeeId": "EMP001",
      "parts": [
        {
          "partId": "PART-001",
          "quantity": 3,
          "takenDate": "2025-06-01T08:00:00Z",
          "notes": "Do wizyt w terenie"
        }
      ]
    }
  ]
}
```

**API Endpoints:**
- `GET /api/inventory/parts` - Główny magazyn
- `POST /api/inventory/parts` - Dodaj część
- `GET /api/employees/[id]/inventory` - Magazyn technika
- `POST /api/inventory/transfer` - Transfer części
- `POST /api/inventory/personal/use` - Użycie części z magazynu technika

**Frontend Components:**
- `/panel-magazyn` - Admin: Główny magazyn
- `/technician/inventory` - Technik: Mój magazyn

**Relacje:**
- Część → Zamówienie (`orders.json[].parts[]`)
- Część → Wizyta (`orders.json[].visits[].partsUsed[]`)
- Część → Dostawcy (`suppliers.json`)

---

## 🔑 KRYTYCZNE RELACJE DANYCH

### Relacja 1: Zamówienie ↔ Wizyty ↔ Technik

```
orders.json
  └─ orders[].visits[]
       ├─ technicianId → employees.json
       ├─ scheduledDate → work-schedules.json (sprawdzenie dostępności)
       └─ partsUsed[] → parts-inventory.json
```

**Przepływ:**
1. Admin tworzy wizytę w zamówieniu
2. API sprawdza dostępność technika: `/api/employee-calendar/availability`
3. API pobiera harmonogram z `work-schedules.json` (zunifikowane)
4. Jeśli dostępny → przypisanie wizyty
5. Zapis do `orders.json[].visits[]`

### Relacja 2: Klient ↔ Dostępność ↔ Przydzielanie

```
clients.json
  └─ clients[].availabilitySlots[]
       └─ używane w /api/order-assignment
```

**Przepływ:**
1. Klient ustawia dostępność w formularzu zamówienia
2. Zapisywane do `clients.json[].availabilitySlots[]`
3. Admin przydziela wizytę → API porównuje:
   - `clients[].availabilitySlots` (kiedy klient może)
   - `work-schedules.json` (kiedy technik może)
4. Znajdź wspólny czas → przypisz wizytę

### Relacja 3: Technik ↔ Harmonogram ↔ Wizyty

```
work-schedules.json (Technik ustawia)
  ↓ konwersja weekly → daily
employee-calendar API (Admin czyta)
  ↓ sprawdzenie dostępności
orders.json[].visits[] (Przypisanie wizyty)
```

**✅ Zunifikowany przepływ:**
1. Technik ustawia harmonogram: `POST /api/technician/work-schedule`
2. Zapis do `work-schedules.json` (format weekly)
3. Admin sprawdza dostępność: `GET /api/employee-calendar?employeeId=X&date=Y`
4. API konwertuje: `convertWorkScheduleToDaily()` (weekly → daily)
5. Admin widzi harmonogram technika w czasie rzeczywistym
6. Przypisanie wizyty uwzględnia przerwy technika

---

## ⚠️ ZIDENTYFIKOWANE PROBLEMY

### ✅ ROZWIĄZANE

1. **Duplikacja systemów harmonogramów** ✅
   - Problem: `work-schedules.json` vs `employee-schedules.json`
   - Rozwiązanie: Zunifikowano - `work-schedules.json` jest autorytatywne
   - Status: **NAPRAWIONE** (2025-06-01)

### 🔴 WYMAGAJĄCE NAPRAWY

2. **Duplikacja wizyt w dwóch plikach** ❌
   - Problem: `orders.json[].visits[]` vs `visits.json`
   - Ryzyko: Desynchronizacja danych
   - Priorytet: **WYSOKI**
   - Rekomendacja: Usunąć `visits.json`, używać tylko `orders.json`

3. **Brak transakcyjności przy modyfikacji danych** ❌
   - Problem: Awaria podczas zapisu → częściowa aktualizacja
   - Przykład: Wizyta zapisana, harmonogram nie zaktualizowany
   - Priorytet: **ŚREDNI**
   - Rekomendacja: Implementacja backup + rollback

4. **Niespójne nazewnictwo ID** ⚠️
   - Problem: `technicianId` vs `employeeId` w wizytach
   - Ryzyko: Błędy wyszukiwania
   - Priorytet: **NISKI**
   - Rekomendacja: Migracja do `technicianId` (konsekwentnie)

5. **Brak walidacji relacji** ⚠️
   - Problem: Można przypisać wizytę do nieistniejącego technika
   - Ryzyko: Wizyty "sierocych" techników
   - Priorytet: **ŚREDNI**
   - Rekomendacja: Walidacja Foreign Keys w API

---

## 💡 REKOMENDACJE

### Krótkoterminowe (1-2 tygodnie)

1. **Usunąć `visits.json`** ✅ Priorytet: WYSOKI
   - Migrować wszystkie wizyty do `orders.json`
   - Aktualizować API do czytania tylko z `orders.json`
   - Backupować przed zmianami

2. **Dodać walidację relacji** ⚠️ Priorytet: ŚREDNI
   - Walidacja `technicianId` przed przypisaniem wizyty
   - Walidacja `clientId` przed utworzeniem zamówienia
   - Walidacja `partId` przed użyciem części

3. **Ustandaryzować nazewnictwo** ⚠️ Priorytet: NISKI
   - Migracja `employeeId` → `technicianId` w wizytach
   - Dokumentacja standardów nazewnictwa

### Długoterminowe (1-3 miesiące)

4. **Migracja do bazy danych** 🔄
   - Przejście z JSON → PostgreSQL/MongoDB
   - Prawdziwe relacje + Foreign Keys
   - Transakcje ACID
   - Backup automatyczny

5. **API versioning** 🔄
   - `/api/v1/...` → `/api/v2/...`
   - Backward compatibility
   - Deprecation warnings

6. **Real-time synchronizacja** 🔄
   - WebSockets dla harmonogramów
   - Live updates wizyt
   - Collaborative editing

---

## 📊 STATYSTYKI SYSTEMU

**Pliki JSON (główne):**
- ✅ `orders.json` - Źródło prawdy dla zamówień i wizyt
- ✅ `clients.json` - Źródło prawdy dla klientów
- ✅ `employees.json` - Źródło prawdy dla pracowników
- ✅ `work-schedules.json` - Źródło prawdy dla harmonogramów (zunifikowane)
- ⚠️ `employee-schedules.json` - Fallback (tylko odczyt)
- ❌ `visits.json` - Deprecated (do usunięcia)
- ✅ `parts-inventory.json` - Źródło prawdy dla magazynu
- ✅ `personal-inventories.json` - Magazyny osobiste techników

**API Endpoints:** ~120+ endpointów

**Frontend Components:** ~50+ komponentów

**Stan unifikacji:** 
- ✅ Harmonogramy: 100% zunifikowane
- ⚠️ Wizyty: 50% (wymaga migracji)
- ✅ Klienci: 100%
- ✅ Pracownicy: 100%

---

## 🔗 POWIĄZANE DOKUMENTY

- [ANALIZA_HARMONOGRAMY_SYSTEM.md](./ANALIZA_HARMONOGRAMY_SYSTEM.md) - Szczegóły unifikacji harmonogramów
- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - Plan migracji do bazy danych
- [README.md](./README.md) - Dokumentacja główna projektu

---

**Ostatnia aktualizacja:** 2025-06-01  
**Autor:** AI Assistant (GitHub Copilot)  
**Status dokumentu:** ✅ Aktualny
