# 📱🌐 Centralna Struktura Danych - Serwis Technik

## 🎯 Cel

Jednolita struktura danych współdzielona między:
- **🌐 Aplikacją webową** (Next.js)
- **📱 Aplikacją mobilną** (React Native/Flutter)
- **🗄️ Bazą danych** (MySQL/PostgreSQL)
- **🔌 API** (REST/GraphQL)

## 📁 Struktura plików

```
shared/
├── index.js                    # Główny plik eksportujący wszystko
├── schema.js                   # Podstawowe schematy (clients, orders, employees)
├── extended-schemas.js         # Dodatkowe tabele (appointments, inventory, invoices)
├── serviceman-schemas.js       # System serwisantów (wizyty, zlecenia)
├── seed-data.js                # Dane inicjalizacyjne/przykładowe
├── serviceman-seed-data.js     # Przykładowe dane serwisantów
├── serviceman-api-examples.js  # Przykłady API dla serwisantów
├── SERVICEMAN_SYSTEM_DOCS.md   # Dokumentacja systemu serwisantów
└── README.md                  # Ta dokumentacja
```

## 🚀 Użycie

### W aplikacji webowej (Next.js)
```javascript
import { ENUMS, SCHEMAS, formatPrice, getStatusColor } from '@/shared';

// Wyświetlanie statusu zlecenia
const statusLabel = ENUMS.ORDER_STATUS.IN_PROGRESS.label; // "W trakcie"
const statusColor = getStatusColor('in_progress'); // "#3b82f6"

// Formatowanie ceny
const formattedPrice = formatPrice(299.99); // "299,99 PLN"
```

### W aplikacji mobilnej
```javascript
import { 
  SYSTEM_CONFIG, 
  MobileHelpers, 
  MOBILE_CONSTANTS 
} from './shared';

// Konfiguracja API
const apiConfig = SYSTEM_CONFIG.api;
const apiUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.orders}`;

// Przygotowanie danych dla UI
const orderForMobile = MobileHelpers.prepareOrderForMobile(order, client, employee);

// Dostępne zmiany statusu
const statusOptions = MobileHelpers.getAvailableStatusChanges('pending', 'technician');
```

### W backendzie (API)
```javascript
const { ALL_SCHEMAS, validateData, canChangeStatus } = require('./shared');

// Walidacja danych
const validation = validateData('orders', orderData);
if (!validation.isValid) {
  return res.status(400).json({ errors: validation.errors });
}

// Sprawdzenie uprawnień do zmiany statusu
if (!canChangeStatus(currentStatus, newStatus, userRole)) {
  return res.status(403).json({ error: 'Unauthorized status change' });
}
```

## 📊 Kluczowe struktury

### 🔄 Statusy zleceń (ORDER_STATUS)
```javascript
{
  PENDING: { value: "pending", label: "Oczekuje", color: "#fbbf24" },
  IN_PROGRESS: { value: "in_progress", label: "W trakcie", color: "#3b82f6" },
  COMPLETED: { value: "completed", label: "Ukończone", color: "#10b981" },
  // ... więcej statusów
}
```

### 📱 Konfiguracja aplikacji mobilnej
```javascript
{
  api: {
    baseUrl: "http://192.168.0.9:3000/api",
    endpoints: {
      orders: "/orders",
      clients: "/clients",
      appointments: "/appointments"
    }
  },
  mobile: {
    features: {
      client: ["view_my_orders", "create_order", "chat_support"],
      technician: ["view_assigned_orders", "update_order_status", "manage_appointments"]
    }
  }
}
```

## 🗄️ Główne tabele

### 👥 Klienci (clients)
- Dane osobowe i firmowe
- Preferencje kontaktu
- Wsparcie dla powiadomień mobilnych
- Zgody na SMS/push notifications

### 🔧 Zlecenia (orders)
- Pełny cykl życia zlecenia
- Śledzenie statusu
- Powiązania z klientami i pracownikami
- Wsparcie dla zdjęć (mobilne)

### 👷 Pracownicy (employees)
- Role i uprawnienia
- Dostęp do aplikacji mobilnej
- Harmonogramy pracy
- Specjalizacje

### � Serwisanci (servicemen)
- Przypisani do głównych klientów
- Specjalizacje techniczne
- GPS tracking i aplikacja mobilna
- Harmonogram wizyt

### 🏠 Wizyty serwisanta (serviceman_visits)
- Wizyty u klientów (scheduled → in_transit → on_site → completed)
- GPS lokalizacja i czas dojazdu
- Podpisy cyfrowe klientów
- Dokumentacja zdjęciowa

### 📝 Zlecenia w wizycie (visit_orders)
- Konkretne naprawy/prace podczas wizyty
- Użyte części i koszty
- Zdjęcia przed/po naprawie
- Gwarancje i zalecenia

### �📅 Terminy (appointments)
- Wizyty i odbiory
- Lokalizacje GPS
- Powiadomienia mobilne
- Śledzenie statusu

### 📦 Magazyn (inventory)
- Części zamienne
- Kody kreskowe/QR (mobilne)
- Alerty o niskim stanie
- Śledzenie ruchu magazynowego

### 💰 Faktury (invoices)
- Płatności i rozliczenia
- Generowanie PDF
- Wysyłanie emailem
- Historia płatności

## 📱 Funkcje mobilne

### 🔔 Powiadomienia push
```javascript
// Utworzenie powiadomienia
const notification = MobileHelpers.createPushNotification('status_changed', {
  orderNumber: 'SRV-2024-001',
  status: 'W trakcie realizacji'
});
```

### 📍 Lokalizacja GPS
- Współrzędne w appointments
- Śledzenie techników
- Nawigacja do klienta

### 📷 Obsługa zdjęć
- Dokumentacja przed/po naprawie
- Zdjęcia problemów
- Podpisy cyfrowe

### 🔧 Tryb offline
- Synchronizacja danych
- Lokalna baza SQLite
- Queue dla operacji

## 🔧 Funkcje pomocnicze

### Formatowanie
```javascript
formatPrice(299.99, 'PLN')     // "299,99 PLN"
formatDate(new Date())         // "26.09.2024"
formatDate(date, 'datetime')   // "26.09.2024 14:30"
getInitials('Jan', 'Kowalski') // "JK"
```

### Walidacja
```javascript
validateData('orders', orderData)           // { isValid: true/false, errors: [] }
canChangeStatus('pending', 'in_progress')   // true/false
hasPermission(user, 'manage_orders')        // true/false
isLowStock(inventoryItem)                   // true/false
```

### Enum helpers
```javascript
getEnumLabel('ORDER_STATUS', 'pending')     // "Oczekuje"
getEnumColor('PRIORITY', 'high')            // "#ef4444"
getStatusColor('completed')                 // "#10b981"
```

## 🌐 API Responses

### Standardowa odpowiedź sukcesu
```json
{
  "success": true,
  "data": { ... },
  "message": "Operacja wykonana pomyślnie",
  "timestamp": "2024-09-26T14:30:00Z"
}
```

### Odpowiedź z błędem  
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowe dane",
    "details": ["Field 'phone' is required"]
  },
  "timestamp": "2024-09-26T14:30:00Z"
}
```

### Lista z paginacją
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 🔐 Bezpieczeństwo

### Role użytkowników
- **client** - tylko swoje zlecenia
- **technician** - przypisane zlecenia
- **manager** - wszystkie zlecenia + raporty  
- **admin** - pełny dostęp

### Uprawnienia mobilne
```javascript
const rolePermissions = {
  technician: {
    canAccessMobile: true,
    canManageOrders: true,
    canViewReports: false
  }
};
```

## 📊 Dane przykładowe (SEED_DATA)

Gotowe dane do uruchomienia systemu:
- 3 przykładowych pracowników
- 2 klientów (indywidualny + firma)
- 4 części w magazynie
- 2 przykładowe zlecenia
- Kompletne ustawienia systemu

### System serwisantów (SERVICEMAN_SEED_DATA)
- 2 serwisantów (Jan Kowalski, Anna Nowak)
- 3 wizyty z różnymi statusami
- 4 zlecenia w ramach wizyt
- Harmonogram i przykładowe raporty
- Pełna integracja mobilna z GPS

## 🚀 Wdrożenie

### 1. Aplikacja webowa
```bash
# Skopiuj folder shared/ do projektu Next.js
cp -r shared/ /path/to/nextjs/app/

# Importuj w komponencie
import { ENUMS, formatPrice } from '@/shared';
```

### 2. Aplikacja mobilna
```bash
# Skopiuj shared/ do projektu mobilnego
cp -r shared/ /path/to/mobile/app/src/

# Importuj
import { SYSTEM_CONFIG, MobileHelpers } from '../shared';
```

### 3. Baza danych
```bash
# Uruchom migrację
node scripts/migrate-data.js

# Setup bazy danych
node scripts/setup-database.js
```

### 3. System serwisantów
```javascript
// Import systemu serwisantów
import { 
  SERVICEMAN_SCHEMAS, 
  SERVICEMAN_ENUMS, 
  ServicemanHelpers,
  SERVICEMAN_SEED_DATA 
} from '@/shared';

// Przykład użycia w aplikacji mobilnej
const visit = ServicemanHelpers.prepareVisitForMobile(visitData, clientData);
const canStart = ServicemanHelpers.canStartVisit(visit, currentLocation);

// Rozpocznij wizytę
await startVisit(visitId, currentLocation);
```

## 📝 Rozszerzenia

### Dodanie nowej tabeli
1. Dodaj schemat do `extended-schemas.js`
2. Dodaj przykładowe dane do `seed-data.js`  
3. Dodaj do `ALL_SCHEMAS` w `index.js`
4. Uaktualnij dokumentację

### Nowy enum
1. Dodaj do `ENUMS` w `schema.js`
2. Dodaj label i kolor
3. Uaktualnij helper functions

## 🐛 Troubleshooting

### Problem z importami
```javascript
// Jeśli nie działają ES6 imports:
const { SCHEMAS } = require('./shared');

// Jeśli ścieżka nie działa:
const { SCHEMAS } = require('../shared/index.js');
```

### Błędy walidacji
```javascript
// Sprawdź czy schemat istnieje
console.log(Object.keys(ALL_SCHEMAS));

// Sprawdź wymagane pola
console.log(getRequiredFields('orders'));
```

---

**🎯 Cel osiągnięty:** Jedna struktura danych, wiele aplikacji, zero duplikacji kodu! 🚀