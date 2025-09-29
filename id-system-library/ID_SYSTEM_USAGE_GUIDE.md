# 📋 INSTRUKCJA UŻYCIA SYSTEMU ID

## 🎯 WPROWADZENIE

System Unified ID v1.0 to kompleksowe rozwiązanie do generowania unikalnych identyfikatorów dla wszystkich encji w aplikacji Technik (web + mobile).

### 📱 KOMPATYBILNOŚĆ
- ✅ Next.js (aplikacja webowa)
- ✅ React Native + Expo (aplikacja mobilna)
- ✅ Node.js (backend)
- ✅ Wszystkie nowoczesne przeglądarki

---

## 🚀 INSTALACJA I IMPORT

### 📁 Struktura plików:
```
shared/
  id-system.js         # Główny plik systemu
```

### 💻 APLIKACJA WEBOWA (Next.js):
```javascript
// Import w komponencie React/Next.js
import { 
  generateOrderId, 
  generateClientId, 
  decodeId 
} from '../shared/id-system.js';

// Lub import całości
import * as IDSystem from '../shared/id-system.js';
```

### 📱 APLIKACJA MOBILNA (React Native):
```javascript
// Import w React Native/Expo
import { 
  generateMobileOrderId, 
  generateVisitId, 
  isMobileId 
} from './shared/id-system.js';

// Lub przez global
const IDSystem = global.TechnikIDSystem;
```

### 🖥️ BACKEND (Node.js):
```javascript
// Import w Node.js
const { 
  generateOrderId, 
  generateCompleteId, 
  validateInput 
} = require('./shared/id-system.js');
```

---

## 📊 FORMAT ID

### 🎯 STRUKTURA OGÓLNA:
```
[PREFIX][ŹRÓDŁO?][DATECODE][NUMER]
```

### 📋 PRZYKŁADY:
```javascript
// Zamówienia (13 znaków)
"ORDA252710001"  // Zamówienie z AI Assistant, 28.09.2025, #1
"ORDM252710157"  // Zamówienie mobilne, #157
"ORDT252710999"  // Zamówienie telefoniczne, #999

// Klienci (12 znaków)
"CLI252710001"   // Klient dodany 28.09.2025, #1

// Pracownicy (12 znaków)
"EMP252710001"   // Pracownik zatrudniony 28.09.2025, #1

// Serzisanci (12 znaków)
"SRV252710001"   // Serwisant dodany 28.09.2025, #1

// Legacy (różne długości)
"OLD1696099051"  // Stare zlecenie z timestamp
"OLD123"         // Stare zlecenie z prostym ID
```

---

## 🛠️ PODSTAWOWE FUNKCJE

### 1️⃣ GENEROWANIE ZLECEŃ

```javascript
import { generateOrderId } from '../shared/id-system.js';

// Podstawowe użycie
const zlecenie1 = generateOrderId('A');          // "ORDA252710001"
const zlecenie2 = generateOrderId('M');          // "ORDM252710001"
const zlecenie3 = generateOrderId('W');          // "ORDW252710001"

// Z konkretną datą
const data = new Date('2025-12-25');
const zlecenie4 = generateOrderId('T', data, 1); // "ORDT253590001"

// Źródła zleceń:
// 'A' = AI Assistant (chatbot, OCR)
// 'M' = Mobile (aplikacja mobilna)
// 'W' = Website (strona internetowa)
// 'T' = Telefon (call center)
// 'E' = Email (zgłoszenia mailowe)
// 'R' = Ręczne (dodane przez admina)
```

### 2️⃣ GENEROWANIE KLIENTÓW

```javascript
import { generateClientId } from '../shared/id-system.js';

// Nowy klient
const klient1 = generateClientId();              // "CLI252710001"
const klient2 = generateClientId(new Date(), 5); // "CLI252710005"
```

### 3️⃣ GENEROWANIE PRACOWNIKÓW

```javascript
import { generateEmployeeId } from '../shared/id-system.js';

// Nowy pracownik
const pracownik = generateEmployeeId();          // "EMP252710001"
```

### 4️⃣ DEKODOWANIE ID

```javascript
import { decodeId } from '../shared/id-system.js';

const decoded = decodeId("ORDA252710001");
console.log(decoded);
/*
{
  isValid: true,
  type: 'order',
  entityType: 'orders',
  prefix: 'ORD',
  source: 'A',
  sourceName: 'AI Assistant',
  dateCode: '25271',
  date: 2025-09-28T00:00:00.000Z,
  number: '0001',
  sequenceNumber: 1,
  isLegacy: false
}
*/
```

### 5️⃣ WALIDACJA ID

```javascript
import { isValidId, getEntityType } from '../shared/id-system.js';

// Sprawdzenie prawidłowości
const isValid = isValidId("ORDA252710001");  // true
const isValid2 = isValidId("XYZ123");        // false

// Pobieranie typu
const typ = getEntityType("CLI252710001");   // "clients"
```

---

## 📱 FUNKCJE SPECJALNE DLA MOBILE

### 🚚 WIZYTY SERWISANTÓW

```javascript
import { 
  generateMobileVisitId, 
  generateMobileOrderId,
  isMobileId 
} from '../shared/id-system.js';

// Wizyta serwisanta
const wizyta = generateMobileVisitId();         // "VIS252710001"

// Zlecenie mobilne
const zlecenieMobile = generateMobileOrderId(); // "ORDM252710001"

// Sprawdzenie czy ID jest mobilne
const jestMobilne = isMobileId("ORDM252710001"); // true
const jestMobilne2 = isMobileId("VIS252710001"); // true
const jestMobilne3 = isMobileId("CLI252710001"); // false
```

### 🎯 SERWISANCI

```javascript
import { generateServicemanId } from '../shared/id-system.js';

const serwisant = generateServicemanId();       // "SRV252710001"
```

---

## 🏢 WSZYSTKIE DOSTĘPNE TYPY

### 📋 LISTA KOMPLETNA:

```javascript
import { generateGenericId } from '../shared/id-system.js';

// Podstawowe encje
const klient = generateGenericId('clients');        // "CLI252710001"
const zlecenie = generateGenericId('orders');       // Błąd! Użyj generateOrderId()
const pracownik = generateGenericId('employees');   // "EMP252710001"

// System serwisantów
const serwisant = generateGenericId('servicemen');  // "SRV252710001"
const wizyta = generateGenericId('visits');         // "VIS252710001"

// Biznesowe
const termin = generateGenericId('appointments');   // "APP252710001"
const magazyn = generateGenericId('inventory');     // "ITM252710001"
const faktura = generateGenericId('invoices');      // "INV252710001"

// Systemowe
const powiadomienie = generateGenericId('notifications'); // "NOT252710001"
const harmonogram = generateGenericId('schedule');        // "SCH252710001"
const raport = generateGenericId('reports');              // "RPT252710001"
const recenzja = generateGenericId('reviews');            // "REV252710001"
```

---

## 🔄 MIGRACJA STARYCH DANYCH

### 💾 LEGACY ORDERS

```javascript
import { generateLegacyOrderId, convertLegacyId } from '../shared/id-system.js';

// Konwersja starych zleceń
const stareZlecenie1 = generateLegacyOrderId("123");         // "OLD123"
const stareZlecenie2 = generateLegacyOrderId("1696099051");  // "OLD1696099051"

// Automatyczna konwersja
const converted = convertLegacyId("1696099051");             // "OLD1696099051"
```

### 🔍 DEKODOWANIE LEGACY

```javascript
const decodedLegacy = decodeId("OLD1696099051");
console.log(decodedLegacy);
/*
{
  isValid: true,
  type: 'legacy',
  prefix: 'OLD',
  originalId: '1696099051',
  date: 2023-09-30T17:50:51.000Z,  // Jeśli timestamp
  isLegacy: true
}
*/
```

---

## ⚡ FUNKCJE ZAAWANSOWANE

### 🎯 AUTOMATYCZNE GENEROWANIE Z BAZĄ DANYCH

```javascript
import { generateCompleteId } from '../shared/id-system.js';

// UWAGA: Wymaga implementacji getNextSequenceNumber() z bazą danych
const noweZlecenie = await generateCompleteId('orders', 'A');
const nowyKlient = await generateCompleteId('clients');
```

### 📊 STATYSTYKI

```javascript
import { getDayStatistics } from '../shared/id-system.js';

const stats = getDayStatistics();
console.log(stats);
/*
{
  dateCode: '25271',
  date: '2025-09-28',
  maxOrdersPerSource: 9999,
  maxTotalOrders: 59994,
  sources: ['A', 'M', 'W', 'T', 'E', 'R']
}
*/
```

### 🔒 WALIDACJA ZAAWANSOWANA

```javascript
import { validateInput } from '../shared/id-system.js';

const validation = validateInput('orders', 'A', new Date(), 1);
console.log(validation);
/*
{
  isValid: true,
  errors: [],
  sanitizedData: {
    entityType: 'orders',
    source: 'A',
    date: 2025-09-28T00:00:00.000Z,
    sequenceNumber: 1
  }
}
*/

// Nieprawidłowe dane
const badValidation = validateInput('orders', 'X', 'invalid', 'not-number');
console.log(badValidation);
/*
{
  isValid: false,
  errors: [
    'Nieprawidłowe źródło zamówienia: X',
    'Nieprawidłowa data',
    'Numer sekwencyjny musi być liczbą całkowitą między 1 a 9999'
  ]
}
*/
```

---

## 🎯 PRZYKŁADY UŻYCIA W PRAKTYCE

### 📋 FORMULARZ NOWEGO ZLECENIA

```javascript
import { generateOrderId, validateInput } from '../shared/id-system.js';

function createNewOrder(source, customerData) {
  // Walidacja
  const validation = validateInput('orders', source, new Date(), 1);
  if (!validation.isValid) {
    throw new Error(`Błąd walidacji: ${validation.errors.join(', ')}`);
  }
  
  // TODO: Pobierz następny numer z bazy danych
  const sequenceNumber = 1; // W praktyce z bazy
  
  // Generuj ID
  const orderId = generateOrderId(source, new Date(), sequenceNumber);
  
  // Zapisz do bazy
  const order = {
    id: orderId,
    source: source,
    customer: customerData,
    createdAt: new Date(),
    status: 'pending'
  };
  
  return order;
}

// Użycie
const newOrder = createNewOrder('W', { name: 'Jan Kowalski' });
console.log(newOrder.id); // "ORDW252710001"
```

### 📱 APLIKACJA MOBILNA - WIZYTA

```javascript
import { generateMobileVisitId, generateMobileOrderId } from '../shared/id-system.js';

function startServiceVisit(servicemanId, customerLocation) {
  const visitId = generateMobileVisitId();
  
  const visit = {
    id: visitId,
    servicemanId: servicemanId,
    location: customerLocation,
    startTime: new Date(),
    status: 'in_progress'
  };
  
  return visit;
}

function createMobileOrder(visitId, serviceDetails) {
  const orderId = generateMobileOrderId();
  
  const order = {
    id: orderId,
    visitId: visitId,
    details: serviceDetails,
    source: 'M',
    createdAt: new Date()
  };
  
  return order;
}
```

### 🔍 WYSZUKIWANIE I FILTROWANIE

```javascript
import { decodeId, getEntityType } from '../shared/id-system.js';

function analyzeId(id) {
  const decoded = decodeId(id);
  
  if (!decoded.isValid) {
    return { error: decoded.error };
  }
  
  const analysis = {
    id: id,
    type: decoded.entityType,
    date: decoded.date,
    isLegacy: decoded.isLegacy
  };
  
  if (decoded.type === 'order') {
    analysis.source = decoded.source;
    analysis.sourceName = decoded.sourceName;
  }
  
  return analysis;
}

// Filtrowanie zleceń mobilnych
function filterMobileOrders(orderIds) {
  return orderIds.filter(id => {
    const decoded = decodeId(id);
    return decoded.isValid && 
           decoded.type === 'order' && 
           decoded.source === 'M';
  });
}
```

---

## 🔧 INTEGRACJA Z BAZĄ DANYCH

### 💾 IMPLEMENTACJA getNextSequenceNumber

```javascript
// Przykład implementacji z bazą danych (PostgreSQL)
async function getNextSequenceNumber(entityType, source = null, date = new Date()) {
  const dateCode = encodeDateCode(date);
  
  let query;
  let params;
  
  if (entityType === 'orders' && source) {
    // Dla zleceń z określonym źródłem
    query = `
      SELECT COALESCE(MAX(CAST(RIGHT(id, 4) AS INTEGER)), 0) + 1 as next_num
      FROM orders 
      WHERE id LIKE $1
    `;
    params = [`ORD${source}${dateCode}%`];
  } else {
    // Dla innych encji
    const prefix = ID_PREFIXES[entityType];
    query = `
      SELECT COALESCE(MAX(CAST(RIGHT(id, 4) AS INTEGER)), 0) + 1 as next_num
      FROM ${entityType} 
      WHERE id LIKE $1
    `;
    params = [`${prefix}${dateCode}%`];
  }
  
  const result = await db.query(query, params);
  return result.rows[0].next_num;
}
```

### 🎯 INDEKSY BAZY DANYCH

```sql
-- Indeksy dla szybkiego wyszukiwania
CREATE INDEX idx_orders_id_prefix ON orders (LEFT(id, 3));
CREATE INDEX idx_orders_date_code ON orders (SUBSTRING(id, 5, 5));
CREATE INDEX idx_orders_source ON orders (SUBSTRING(id, 4, 1)) WHERE LEFT(id, 3) = 'ORD';

-- Indeksy dla innych tabel
CREATE INDEX idx_clients_date_code ON clients (SUBSTRING(id, 4, 5));
CREATE INDEX idx_employees_date_code ON employees (SUBSTRING(id, 4, 5));
```

---

## 🚨 LIMITY I OGRANICZENIA

### 📊 DZIENNE LIMITY:
- **Zlecenia na źródło**: 9,999 dziennie
- **Łączne zlecenia**: 59,994 dziennie (6 źródeł)
- **Inne encje**: 9,999 dziennie każda

### 🗓️ OBSŁUGA LAT:
- **Aktualny zakres**: 2000-2099
- **Kod roku**: Ostatnie 2 cyfry (25 = 2025)
- **Dzień roku**: 1-366 (z obsługą lat przestępnych)

### ⚡ WYDAJNOŚĆ:
- **Długość ID**: 12-13 znaków
- **Format**: Kompaktowy, bez myślników
- **Sortowanie**: Chronologiczne naturalne

---

## 🐛 NAJCZĘSTSZE BŁĘDY

### ❌ BŁĘDNE UŻYCIE:

```javascript
// ❌ ŹLE
const id1 = generateOrderId();           // Brak źródła!
const id2 = generateOrderId('X');        // Nieprawidłowe źródło!
const id3 = generateGenericId('orders'); // Użyj generateOrderId()!

// ✅ DOBRZE
const id1 = generateOrderId('A');        // Prawidłowe źródło
const id2 = generateClientId();          // Dla klientów
const id3 = generateGenericId('clients'); // Dla innych niż orders
```

### 🔍 DEBUGOWANIE:

```javascript
import { decodeId } from '../shared/id-system.js';

function debugId(id) {
  console.log('Debugowanie ID:', id);
  const decoded = decodeId(id);
  
  if (!decoded.isValid) {
    console.error('BŁĄD:', decoded.error);
    return;
  }
  
  console.log('✅ ID prawidłowy:');
  console.log('  Typ:', decoded.entityType);
  console.log('  Data:', decoded.date.toLocaleDateString());
  console.log('  Numer:', decoded.sequenceNumber);
  
  if (decoded.source) {
    console.log('  Źródło:', decoded.sourceName);
  }
}

// Użycie
debugId("ORDA252710001");
debugId("NIEPRAWIDLOWY");
```

---

## 🚀 GOTOWE WZORCE

### 📋 COMPLETE ORDER CREATOR

```javascript
import { 
  generateOrderId, 
  generateClientId, 
  validateInput 
} from '../shared/id-system.js';

async function createCompleteOrder(orderData) {
  // 1. Walidacja danych wejściowych
  const validation = validateInput(
    'orders', 
    orderData.source, 
    new Date(), 
    1
  );
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // 2. Generacja ID klienta (jeśli nowy)
  let clientId = orderData.clientId;
  if (!clientId) {
    // TODO: Pobierz następny numer klienta z bazy
    clientId = generateClientId();
  }
  
  // 3. Generacja ID zlecenia
  // TODO: Pobierz następny numer zlecenia z bazy
  const orderId = generateOrderId(orderData.source);
  
  // 4. Utworzenie kompletnego zlecenia
  const completeOrder = {
    id: orderId,
    clientId: clientId,
    source: orderData.source,
    description: orderData.description,
    address: orderData.address,
    phone: orderData.phone,
    email: orderData.email,
    priority: orderData.priority || 'normal',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return completeOrder;
}
```

### 📱 MOBILE SERVICE MANAGER

```javascript
import { 
  generateMobileVisitId,
  generateMobileOrderId,
  generateServicemanId,
  isMobileId
} from '../shared/id-system.js';

class MobileServiceManager {
  async startService(servicemanId, location) {
    const visitId = generateMobileVisitId();
    
    const visit = {
      id: visitId,
      servicemanId: servicemanId,
      location: location,
      startTime: new Date(),
      status: 'started'
    };
    
    // TODO: Zapisz do bazy lokalnej/sync
    return visit;
  }
  
  async createOrderFromVisit(visitId, orderDetails) {
    const orderId = generateMobileOrderId();
    
    const order = {
      id: orderId,
      visitId: visitId,
      details: orderDetails,
      source: 'M',
      createdAt: new Date(),
      status: 'created'
    };
    
    // TODO: Zapisz i synchronizuj z serwerem
    return order;
  }
  
  getMobileEntities(allIds) {
    return allIds.filter(id => isMobileId(id));
  }
}
```

---

## 📚 DODATKOWE ZASOBY

### 📄 PLIKI SYSTEMU:
- `shared/id-system.js` - Główny plik systemu
- `shared/ID_SYSTEM_USAGE_GUIDE.md` - Ta instrukcja

### 🔗 POWIĄZANE FUNKCJE:
- Baza danych: Implementacja `getNextSequenceNumber()`
- API: Endpointy do generowania ID
- Synchronizacja: Mobile ↔ Server sync

### 📞 WSPARCIE:
- Dokumentacja: Ten plik
- Testy: `test-*-ids.js` pliki
- Przykłady: Sekcja "Przykłady użycia"

---

## ✅ CHECKLISTA IMPLEMENTACJI

### 🎯 BACKEND:
- [ ] Zaimplementuj `getNextSequenceNumber()` z bazą danych
- [ ] Utwórz indeksy w bazie danych
- [ ] Skonfiguruj API endpointy dla generowania ID
- [ ] Zaimplementuj migrację starych danych

### 💻 FRONTEND (Web):
- [ ] Zaimportuj system ID do komponentów
- [ ] Zintegruj z formularzami
- [ ] Dodaj walidację po stronie klienta
- [ ] Przetestuj generowanie i dekodowanie

### 📱 MOBILE:
- [ ] Zaimportuj system do React Native
- [ ] Skonfiguruj funkcje mobilne
- [ ] Zaimplementuj offline sync
- [ ] Przetestuj na urządzeniu

### 🧪 TESTING:
- [ ] Unit testy dla wszystkich funkcji
- [ ] Integration testy z bazą danych
- [ ] Performance testy dla dużych wolumenów
- [ ] Mobile compatibility testy

---

**🎉 System ID jest gotowy do użycia!** 

Wszystkie funkcje są w pełni kompatybilne z aplikacją webową i mobilną. W razie pytań sprawdź sekcję "Najczęstsze błędy" lub przeanalizuj przykłady użycia.