# 🗺️ MAPA API ENDPOINTS - SYSTEM TECHNIK

**Data:** 2025-06-01  
**Wersja:** 2.0  
**Łączna liczba endpointów:** ~120+

---

## 📚 SPIS TREŚCI

1. [Zamówienia (Orders)](#zamówienia-orders)
2. [Wizyty (Visits)](#wizyty-visits)
3. [Klienci (Clients)](#klienci-clients)
4. [Pracownicy (Employees)](#pracownicy-employees)
5. [Harmonogramy (Schedules)](#harmonogramy-schedules)
6. [Magazyn (Inventory)](#magazyn-inventory)
7. [Autentykacja (Auth)](#autentykacja-auth)
8. [Panel Admina (Admin)](#panel-admina-admin)
9. [Panel Technika (Technician)](#panel-technika-technician)
10. [Pomocnicze (Utils)](#pomocnicze-utils)

---

## 📦 ZAMÓWIENIA (ORDERS)

### **GET `/api/orders`**
**Opis:** Pobiera listę wszystkich zamówień  
**Plik źródłowy:** `pages/api/orders.js`  
**Plik danych:** `data/orders.json`  
**Parametry query:**
- `status` (opcjonalny) - Filtruj po statusie
- `clientId` (opcjonalny) - Filtruj po kliencie
- `technicianId` (opcjonalny) - Filtruj po techniku
- `dateFrom` (opcjonalny) - Data od
- `dateTo` (opcjonalny) - Data do

**Odpowiedź:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "ORD20250601001",
      "orderNumber": "2025/06/001",
      "clientName": "Jan Kowalski",
      "status": "pending",
      "createdAt": "2025-06-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Wykorzystywane przez:**
- `/panel-zgloszenia` (Admin)
- `/technician/orders` (Technik)

---

### **POST `/api/orders`**
**Opis:** Tworzy nowe zamówienie (admin)  
**Plik źródłowy:** `pages/api/orders.js`  
**Plik danych:** `data/orders.json` (ZAPIS)  
**Body:**
```json
{
  "clientId": "KL-2025-001",
  "deviceType": "Lodówka",
  "deviceBrand": "Samsung",
  "deviceModel": "RB37J5005SA",
  "problemDescription": "Nie chłodzi",
  "priority": "normal"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "order": { /* pełne dane zamówienia */ },
  "message": "Zamówienie utworzone pomyślnie"
}
```

---

### **GET `/api/orders/[id]`**
**Opis:** Pobiera szczegóły pojedynczego zamówienia  
**Plik źródłowy:** `pages/api/orders/[id]/index.js`  
**Plik danych:** `data/orders.json` (ODCZYT)  
**Parametry URL:** `id` - ID zamówienia

**Odpowiedź:**
```json
{
  "success": true,
  "order": {
    "id": "ORD20250601001",
    "orderNumber": "2025/06/001",
    "clientId": "KL-2025-001",
    "visits": [ /* wizyty */ ],
    "photos": [ /* zdjęcia */ ],
    "parts": [ /* użyte części */ ]
  }
}
```

---

### **PUT `/api/orders`**
**Opis:** Aktualizuje zamówienie  
**Plik źródłowy:** `pages/api/orders.js`  
**Plik danych:** `data/orders.json` (MODYFIKACJA)  
**Body:**
```json
{
  "id": "ORD20250601001",
  "status": "in-progress",
  "notes": "Część zamówiona"
}
```

---

### **DELETE `/api/orders/[id]`**
**Opis:** Usuwa zamówienie (z potwierdzeniem)  
**Plik źródłowy:** `pages/api/orders/[id]/index.js`  
**Plik danych:** `data/orders.json` (USUNIĘCIE)  
**Parametry URL:** `id` - ID zamówienia

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Zamówienie usunięte pomyślnie"
}
```

---

### **POST `/api/client/create-order`**
**Opis:** Klient tworzy zamówienie (portal klienta)  
**Plik źródłowy:** `pages/api/client/create-order.js`  
**Plik danych:** 
- `data/orders.json` (ZAPIS)
- `data/clients.json` (AKTUALIZACJA availabilitySlots)

**Body:**
```json
{
  "clientId": "KL-2025-001",
  "deviceType": "Lodówka",
  "availabilitySlots": [
    {
      "startDate": "2025-06-05",
      "endDate": "2025-06-05",
      "startTime": "08:00",
      "endTime": "16:00",
      "type": "available"
    }
  ]
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "orderId": "ORD20250601001",
  "message": "Zamówienie utworzone pomyślnie"
}
```

---

## 🚗 WIZYTY (VISITS)

### **GET `/api/visits`**
**Opis:** Pobiera listę wszystkich wizyt  
**Plik źródłowy:** `pages/api/visits/index.js`  
**Plik danych:** `data/orders.json` (czyta visits[] z zamówień)  
**Parametry query:**
- `technicianId` (opcjonalny)
- `status` (opcjonalny)
- `date` (opcjonalny)

**Odpowiedź:**
```json
{
  "success": true,
  "visits": [
    {
      "visitId": "VIS-001",
      "orderId": "ORD20250601001",
      "technicianId": "EMP001",
      "scheduledDate": "2025-06-05",
      "scheduledTime": "10:00",
      "status": "scheduled"
    }
  ]
}
```

---

### **POST `/api/visits/assign`**
**Opis:** Przypisuje wizytę do technika  
**Plik źródłowy:** `pages/api/visits/assign.js`  
**Plik danych:** `data/orders.json` (MODYFIKACJA visits[])  
**Walidacja:** Sprawdza dostępność technika w `work-schedules.json`

**Body:**
```json
{
  "orderId": "ORD20250601001",
  "technicianId": "EMP001",
  "scheduledDate": "2025-06-05",
  "scheduledTime": "10:00",
  "estimatedDuration": 60,
  "visitType": "diagnosis"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "visitId": "VIS-001",
  "message": "Wizyta przypisana pomyślnie"
}
```

---

### **GET `/api/technician/visits`**
**Opis:** Pobiera wizyty technika (aplikacja mobilna)  
**Plik źródłowy:** `pages/api/technician/visits.js`  
**Plik danych:** `data/orders.json` (filtruje po technicianId)  
**Parametry query:**
- `technicianId` (wymagany)
- `date` (opcjonalny) - Domyślnie dzisiaj

**Odpowiedź:**
```json
{
  "success": true,
  "visits": [ /* wizyty technika */ ],
  "statistics": {
    "totalVisits": 5,
    "completed": 2,
    "scheduled": 3
  }
}
```

---

### **PUT `/api/technician/visits/[visitId]`**
**Opis:** Technik aktualizuje wizytę (start, zakończenie, notatki)  
**Plik źródłowy:** `pages/api/technician/visits/[visitId].js`  
**Plik danych:** `data/orders.json` (MODYFIKACJA visits[])

**Body:**
```json
{
  "status": "in-progress",
  "checkInTime": "2025-06-05T10:00:00Z",
  "notes": "Rozpoczęto diagnostykę"
}
```

---

### **GET `/api/visits/audit-log`**
**Opis:** Historia zmian wizyt (audit trail)  
**Plik źródłowy:** `pages/api/visits/audit-log.js`  
**Plik danych:** `data/visit-audit-logs.json`

---

## 👥 KLIENCI (CLIENTS)

### **GET `/api/clients`**
**Opis:** Pobiera listę klientów  
**Plik źródłowy:** `pages/api/clients.js`  
**Plik danych:** `data/clients.json`  
**Parametry query:**
- `search` (opcjonalny) - Wyszukiwanie po nazwie/email/telefonie
- `isActive` (opcjonalny) - Filtruj aktywnych

---

### **POST `/api/clients`**
**Opis:** Tworzy nowego klienta  
**Plik źródłowy:** `pages/api/clients.js`  
**Plik danych:** `data/clients.json` (ZAPIS)

**Body:**
```json
{
  "name": "Jan Kowalski",
  "email": "jan@email.com",
  "phone": "+48 123 456 789",
  "address": {
    "street": "ul. Główna 1",
    "city": "Warszawa",
    "postalCode": "00-001"
  }
}
```

---

### **GET `/api/clients/[id]`**
**Opis:** Pobiera szczegóły klienta  
**Plik źródłowy:** `pages/api/clients/[id].js`  
**Plik danych:** `data/clients.json`

---

### **PUT `/api/clients/[id]`**
**Opis:** Aktualizuje dane klienta (admin)  
**Plik źródłowy:** `pages/api/clients/[id].js`  
**Plik danych:** `data/clients.json` (MODYFIKACJA)

---

### **POST `/api/client/update-profile`**
**Opis:** Klient aktualizuje swój profil (portal klienta)  
**Plik źródłowy:** `pages/api/client/update-profile.js`  
**Plik danych:** `data/clients.json` (MODYFIKACJA)

**Body:**
```json
{
  "clientId": "KL-2025-001",
  "phone": "+48 987 654 321",
  "address": { /* nowy adres */ }
}
```

---

## 👨‍💼 PRACOWNICY (EMPLOYEES)

### **GET `/api/employees`**
**Opis:** Pobiera listę pracowników  
**Plik źródłowy:** `pages/api/employees.js`  
**Plik danych:** `data/employees.json`  
**Parametry query:**
- `role` (opcjonalny) - Filtruj po roli
- `isActive` (opcjonalny) - Tylko aktywni

---

### **POST `/api/employees`**
**Opis:** Tworzy nowego pracownika  
**Plik źródłowy:** `pages/api/employees.js`  
**Plik danych:** `data/employees.json` (ZAPIS)

**Body:**
```json
{
  "name": "Adam Nowak",
  "email": "adam@firma.pl",
  "role": "technician",
  "specializations": ["lodówki", "pralki"],
  "visitRates": {
    "diagnosis": 50,
    "repair": 100
  }
}
```

---

### **GET `/api/employees/[id]`**
**Opis:** Pobiera szczegóły pracownika  
**Plik źródłowy:** `pages/api/employees/[id].js`  
**Plik danych:** `data/employees.json`

---

### **PUT `/api/employees`**
**Opis:** Aktualizuje dane pracownika  
**Plik źródłowy:** `pages/api/employees.js`  
**Plik danych:** `data/employees.json` (MODYFIKACJA)

---

### **GET `/api/technician/stats`**
**Opis:** Statystyki technika (wizyty, zarobki)  
**Plik źródłowy:** `pages/api/technician/stats.js`  
**Plik danych:** 
- `data/orders.json` (czyta visits[])
- `data/employees.json` (czyta visitRates)

**Parametry query:**
- `technicianId` (wymagany)
- `dateFrom` (opcjonalny)
- `dateTo` (opcjonalny)

**Odpowiedź:**
```json
{
  "success": true,
  "statistics": {
    "totalVisits": 25,
    "completedVisits": 20,
    "totalEarnings": 2500.00,
    "visitsByType": {
      "diagnosis": 10,
      "repair": 15
    },
    "earningsByType": {
      "diagnosis": 500.00,
      "repair": 2000.00
    }
  }
}
```

---

## 📅 HARMONOGRAMY (SCHEDULES) ✅ ZUNIFIKOWANE

### **GET `/api/employee-calendar`**
**Opis:** Pobiera harmonogram pracownika (zunifikowany)  
**Plik źródłowy:** `pages/api/employee-calendar.js`  
**Plik danych (priorytet):**
1. ✅ `data/work-schedules.json` (PRIORYTET 1 - autorytatywne)
2. ⚠️ `data/employee-schedules.json` (PRIORYTET 2 - fallback)
3. 🔄 `data/employees.json` (PRIORYTET 3 - auto-generate z workingHours)

**Parametry query:**
- `employeeId` (wymagany)
- `date` (wymagany) - Format: YYYY-MM-DD

**Odpowiedź:**
```json
{
  "success": true,
  "schedule": {
    "employeeId": "EMP001",
    "date": "2025-06-05",
    "timeSlots": [
      {
        "time": "08:00",
        "status": "available"
      },
      {
        "time": "12:00",
        "status": "break"
      },
      {
        "time": "14:00",
        "status": "busy",
        "visitId": "VIS-001"
      }
    ],
    "version": 2,
    "sourceSystem": "work-schedules.json"
  }
}
```

**Logika konwersji:**
```javascript
// Funkcja: convertWorkScheduleToDaily(employeeId, date)
// 1. Oblicz weekStart (poniedziałek tygodnia dla date)
// 2. Znajdź schedule w work-schedules.json dla (employeeId + weekStart)
// 3. Oblicz dayOfWeek dla date (0=Niedziela, 1=Poniedziałek, ..., 6=Sobota)
// 4. Filtruj workSlots[] po dayOfWeek
// 5. Dla każdego workSlot: generuj timeSlots[] co 15 minut
// 6. Dla każdego break: oznacz timeSlots jako status='break'
// 7. Zwróć: { employeeId, date, timeSlots, sourceSystem, version }
```

---

### **GET `/api/employee-calendar/availability`**
**Opis:** Sprawdza dostępność pracownika  
**Plik źródłowy:** `pages/api/employee-calendar.js` (funkcja checkAvailability)  
**Plik danych:** `data/work-schedules.json` (zunifikowany)

**Parametry query:**
- `employeeId` (wymagany)
- `date` (wymagany)
- `duration` (opcjonalny) - Domyślnie 60 minut

**Odpowiedź:**
```json
{
  "success": true,
  "isAvailable": true,
  "availableSlots": [
    {
      "startTime": "10:00",
      "endTime": "11:00",
      "duration": 60,
      "date": "2025-06-05"
    }
  ],
  "nextAvailableSlot": {
    "startTime": "10:00",
    "endTime": "11:00"
  },
  "sourceSystem": "work-schedules.json",
  "version": 2
}
```

---

### **GET `/api/employee-calendar/all`**
**Opis:** Pobiera harmonogramy wszystkich pracowników na dzień  
**Plik źródłowy:** `pages/api/employee-calendar.js` (funkcja getAllSchedules)  
**Plik danych:** `data/work-schedules.json` (zunifikowany)

**Parametry query:**
- `date` (wymagany)

**Odpowiedź:**
```json
{
  "success": true,
  "schedules": {
    "EMP001": {
      "employeeId": "EMP001",
      "employeeName": "Adam Nowak",
      "timeSlots": [ /* sloty */ ],
      "sourceSystem": "work-schedules.json",
      "visits": [ /* wizyty na ten dzień */ ]
    },
    "EMP002": { /* ... */ }
  }
}
```

**Wykorzystywane przez:**
- `/panel-przydzial-zlecen` (Admin: widok harmonogramów wszystkich techników)

---

### **POST `/api/technician/work-schedule`**
**Opis:** Technik ustawia swój harmonogram tygodniowy  
**Plik źródłowy:** `pages/api/technician/work-schedule.js`  
**Plik danych:** `data/work-schedules.json` (ZAPIS)

**Body:**
```json
{
  "employeeId": "EMP001",
  "weekStart": "2025-06-02",
  "workSlots": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "16:00",
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
  ]
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "scheduleId": "WS-001",
  "message": "Harmonogram zapisany pomyślnie"
}
```

**Wykorzystywane przez:**
- `/technician/schedule` (Technik: ustawianie harmonogramu)

---

### **GET `/api/technician/work-schedule`**
**Opis:** Pobiera harmonogram technika (format weekly)  
**Plik źródłowy:** `pages/api/technician/work-schedule.js`  
**Plik danych:** `data/work-schedules.json`

**Parametry query:**
- `employeeId` (wymagany)
- `weekStart` (opcjonalny) - Domyślnie bieżący tydzień

---

### **DELETE `/api/technician/work-schedule`**
**Opis:** Usuwa harmonogram tygodniowy  
**Plik źródłowy:** `pages/api/technician/work-schedule.js`  
**Plik danych:** `data/work-schedules.json` (USUNIĘCIE)

---

## 📦 MAGAZYN (INVENTORY)

### **GET `/api/inventory/parts`**
**Opis:** Pobiera listę części w głównym magazynie  
**Plik źródłowy:** `pages/api/inventory/parts.js`  
**Plik danych:** `data/parts-inventory.json`

---

### **POST `/api/inventory/parts`**
**Opis:** Dodaje nową część do magazynu  
**Plik źródłowy:** `pages/api/inventory/parts.js`  
**Plik danych:** `data/parts-inventory.json` (ZAPIS)

---

### **GET `/api/employees/[id]/inventory`**
**Opis:** Pobiera magazyn osobisty technika  
**Plik źródłowy:** `pages/api/employees/[id]/inventory.js`  
**Plik danych:** `data/personal-inventories.json`

---

### **POST `/api/inventory/transfer`**
**Opis:** Transfer części (magazyn główny → technik)  
**Plik źródłowy:** `pages/api/inventory/transfer.js`  
**Plik danych:** 
- `data/parts-inventory.json` (MODYFIKACJA - zmniejsz quantity)
- `data/personal-inventories.json` (MODYFIKACJA - zwiększ quantity)

**Body:**
```json
{
  "partId": "PART-001",
  "employeeId": "EMP001",
  "quantity": 3,
  "notes": "Do wizyt w terenie"
}
```

---

### **POST `/api/inventory/personal/use`**
**Opis:** Technik używa części z magazynu osobistego  
**Plik źródłowy:** `pages/api/inventory/personal/use.js`  
**Plik danych:**
- `data/personal-inventories.json` (MODYFIKACJA)
- `data/orders.json` (MODYFIKACJA - dodaj część do visits[].partsUsed[])

**Body:**
```json
{
  "employeeId": "EMP001",
  "partId": "PART-001",
  "quantity": 1,
  "visitId": "VIS-001",
  "orderId": "ORD20250601001"
}
```

---

## 🔐 AUTENTYKACJA (AUTH)

### **POST `/api/auth/login`**
**Opis:** Logowanie użytkownika (admin/technik)  
**Plik źródłowy:** `pages/api/auth/login.js`  
**Plik danych:** `data/accounts.json`

**Body:**
```json
{
  "email": "admin@firma.pl",
  "password": "haslo123"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "ACC-001",
    "email": "admin@firma.pl",
    "role": "admin"
  }
}
```

---

### **POST `/api/client/auth`**
**Opis:** Logowanie klienta (portal klienta)  
**Plik źródłowy:** `pages/api/client/auth.js`  
**Plik danych:** `data/clients.json`

---

### **POST `/api/technician/auth`**
**Opis:** Logowanie technika (aplikacja mobilna)  
**Plik źródłowy:** `pages/api/technician/auth.js`  
**Plik danych:** `data/employees.json`

---

### **POST `/api/auth/change-password`**
**Opis:** Zmiana hasła  
**Plik źródłowy:** `pages/api/auth/change-password.js`  
**Plik danych:** `data/accounts.json` (MODYFIKACJA)

---

### **POST `/api/auth/logout`**
**Opis:** Wylogowanie  
**Plik źródłowy:** `pages/api/auth/logout.js`

---

## 👑 PANEL ADMINA (ADMIN)

### **GET `/api/admin/employee-settlements`**
**Opis:** Rozliczenia pracowników (prowizje, zarobki)  
**Plik źródłowy:** `pages/api/admin/employee-settlements.js`  
**Plik danych:**
- `data/orders.json` (czyta visits[])
- `data/employees.json` (czyta visitRates)
- `data/settlements.json` (czyta historię rozliczeń)

**Parametry query:**
- `employeeId` (opcjonalny)
- `month` (opcjonalny) - Format: YYYY-MM
- `year` (opcjonalny) - Format: YYYY

**Odpowiedź:**
```json
{
  "success": true,
  "settlements": [
    {
      "employeeId": "EMP001",
      "employeeName": "Adam Nowak",
      "period": "2025-06",
      "totalVisits": 25,
      "totalEarnings": 2500.00,
      "visitsByType": {
        "diagnosis": { "count": 10, "earnings": 500.00 },
        "repair": { "count": 15, "earnings": 2000.00 }
      },
      "bonus": 100.00,
      "finalAmount": 2600.00
    }
  ]
}
```

**Wykorzystywane przez:**
- `/panel-rozliczenia` (Admin: rozliczenia pracowników)

---

### **POST `/api/admin/settlement-actions`**
**Opis:** Akcje rozliczeniowe (zatwierdź, płatność, eksport)  
**Plik źródłowy:** `pages/api/admin/settlement-actions.js`  
**Plik danych:** `data/settlements.json` (ZAPIS)

**Body:**
```json
{
  "action": "approve",
  "settlementId": "SETT-001",
  "employeeId": "EMP001",
  "amount": 2600.00
}
```

---

### **GET `/api/admin/tax-report`**
**Opis:** Raport podatkowy (VAT, PIT)  
**Plik źródłowy:** `pages/api/admin/tax-report.js`  
**Plik danych:** `data/orders.json`, `data/settlements.json`

---

### **GET `/api/admin/audit-logs`**
**Opis:** Logi audytowe (historia zmian)  
**Plik źródłowy:** `pages/api/admin/audit-logs.js`  
**Plik danych:** `data/visit-audit-logs.json`, `data/inventory-history.json`

---

## 🔧 PANEL TECHNIKA (TECHNICIAN)

### **GET `/api/technician/visits`**
**Opis:** Wizyty technika (dzisiaj)  
**Plik źródłowy:** `pages/api/technician/visits.js`  
**Plik danych:** `data/orders.json`

---

### **PUT `/api/technician/visits/[visitId]`**
**Opis:** Aktualizacja wizyty (start, stop, notatki)  
**Plik źródłowy:** `pages/api/technician/visits/[visitId].js`  
**Plik danych:** `data/orders.json` (MODYFIKACJA visits[])

---

### **POST `/api/technician/upload-photo`**
**Opis:** Upload zdjęcia z wizyty  
**Plik źródłowy:** `pages/api/technician/upload-photo.js`  
**Plik danych:** 
- `public/uploads/visits/` (zapis pliku)
- `data/orders.json` (MODYFIKACJA visits[].photos[])

---

### **POST `/api/technician/time-tracking`**
**Opis:** Tracking czasu pracy (check-in, check-out)  
**Plik źródłowy:** `pages/api/technician/time-tracking.js`  
**Plik danych:** `data/orders.json` (MODYFIKACJA visits[])

---

### **GET `/api/technician/stats`**
**Opis:** Statystyki technika (wizyty, zarobki, ranking)  
**Plik źródłowy:** `pages/api/technician/stats.js`  
**Plik danych:** `data/orders.json`, `data/employees.json`

---

## 🛠️ POMOCNICZE (UTILS)

### **GET `/api/health-check`**
**Opis:** Status systemu  
**Plik źródłowy:** `pages/api/health-check.js`

**Odpowiedź:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-01T10:00:00Z",
  "version": "2.0"
}
```

---

### **POST `/api/calculate-route`**
**Opis:** Optymalizacja trasy (Google Maps API)  
**Plik źródłowy:** `pages/api/calculate-route.js`  
**Zewnętrzne API:** Google Maps Distance Matrix

---

### **GET `/api/distance-matrix`**
**Opis:** Macierz odległości (Google Maps)  
**Plik źródłowy:** `pages/api/distance-matrix.js`  
**Zewnętrzne API:** Google Maps Distance Matrix

---

### **POST `/api/send-cost-alert`**
**Opis:** Wysyłanie alertów o kosztach  
**Plik źródłowy:** `pages/api/send-cost-alert.js`  
**Zewnętrzne API:** Resend (email)

---

### **POST `/api/ocr/device-plate`**
**Opis:** OCR tabliczki znamionowej (AI Vision)  
**Plik źródłowy:** `pages/api/ocr/device-plate.js`  
**Zewnętrzne API:** Google Vision API / OpenAI Vision

---

### **GET `/api/stats`**
**Opis:** Statystyki ogólne systemu  
**Plik źródłowy:** `pages/api/stats.js`  
**Plik danych:** Wszystkie JSON (read-only)

**Odpowiedź:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "activeOrders": 25,
    "completedVisits": 120,
    "totalRevenue": 50000.00,
    "activeEmployees": 5,
    "partsInStock": 250
  }
}
```

---

## 📊 PODSUMOWANIE ZALEŻNOŚCI

### Najczęściej modyfikowane pliki:
1. **`data/orders.json`** - ~40 endpointów (CRUD zamówień i wizyt)
2. **`data/work-schedules.json`** - ~8 endpointów (zunifikowany harmonogram)
3. **`data/employees.json`** - ~15 endpointów
4. **`data/clients.json`** - ~10 endpointów
5. **`data/parts-inventory.json`** - ~12 endpointów

### Endpointy z zewnętrznymi API:
- `/api/calculate-route` → Google Maps Distance Matrix
- `/api/distance-matrix` → Google Maps Distance Matrix
- `/api/ocr/device-plate` → Google Vision / OpenAI Vision
- `/api/send-cost-alert` → Resend (email)
- `/api/allegro/search` → Allegro API

### Krytyczne endpointy (wysoki priorytet):
- ✅ `/api/employee-calendar` - Zunifikowany (work-schedules.json)
- ✅ `/api/visits/assign` - Przypisywanie wizyt z walidacją harmonogramu
- ✅ `/api/technician/visits` - Wizyty w aplikacji mobilnej
- ✅ `/api/admin/employee-settlements` - Rozliczenia prowizyjne

---

**Ostatnia aktualizacja:** 2025-06-01  
**Status:** ✅ Aktualny po unifikacji harmonogramów
