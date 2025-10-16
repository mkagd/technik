# 📋 Struktura Danych Zleceń (Orders) - Przewodnik

**Data utworzenia:** 2025-10-12  
**Autor:** System dokumentacji automatycznej  
**Status:** ✅ Aktualny i zweryfikowany

---

## 🎯 Cel Dokumentu

Ten dokument wyjaśnia:
1. Jak system przechowuje zlecenia w `data/orders.json`
2. Jaka jest różnica między `id` a `orderNumber`
3. Jak tworzyć nowe zlecenia przez API
4. Jak system generuje numery zleceń

---

## 📁 Struktura Pliku `orders.json`

### Lokalizacja
```
data/orders.json
```

### Format
Plik zawiera **tablicę JSON** z obiektami zleceń:

```json
[
  {
    "id": 1760254680428,
    "orderNumber": "ORDZ252850001",
    "clientId": "CLIS252850002",
    "clientName": "Jan Kowalski",
    "status": "pending",
    "source": "reservation_conversion",
    ...
  },
  {
    "id": 1760254690123,
    "orderNumber": "ORDA252850002",
    "clientId": "CLIS252850003",
    ...
  }
]
```

---

## 🔑 Dwa Typy Identyfikatorów

### 1. `id` - Numeryczne ID (Wewnętrzne)
- **Typ:** Number (timestamp)
- **Format:** `1760254680428` (milliseconds since epoch)
- **Generowanie:** `Date.now()` jeśli nie podano
- **Użycie:** 
  - Wewnętrzne operacje systemowe
  - Relacje w bazie danych (np. linkowanie wizyt)
  - API endpoints: `/api/orders?id=1760254680428`

### 2. `orderNumber` - Tekstowe ID (Dla Użytkownika)
- **Typ:** String
- **Format:** `ORDX252850001` (13 znaków)
  - `ORD` - Prefix (3 znaki)
  - `X` - Kod źródła (1 znak)
  - `25` - Rok (2 cyfry)
  - `285` - Dzień roku (3 cyfry)
  - `0001` - Sekwencja (4 cyfry)
- **Generowanie:** `generateOrderId()` z `utils/id-generator.js`
- **Użycie:**
  - Wyświetlanie w interfejsie
  - Komunikacja z klientem
  - Drukowanie dokumentów
  - Tracking zleceń

---

## 🏷️ Kody Źródeł (Source Codes)

System oznacza skąd pochodzi zlecenie:

| Kod | Nazwa                   | Opis                                  |
|-----|-------------------------|---------------------------------------|
| **W** | web-form                | Formularz gościnny na stronie         |
| **U** | user-portal             | Zalogowany klient (portal użytkownika)|
| **A** | admin-panel             | Panel administracyjny                 |
| **T** | technician              | Dodane przez technika w terenie       |
| **M** | mobile-app              | Aplikacja mobilna AGD                 |
| **P** | phone                   | Przyjęte telefonicznie                |
| **E** | email                   | Email od klienta                      |
| **Z** | reservation_conversion  | Przekonwertowane z rezerwacji         |
| **X** | external-api            | API zewnętrzne (Allegro, itp.)        |
| **S** | system-auto             | Automatyczne (system)                 |

### Przykłady Numerów:

```
ORDA252850001 - Zlecenie z panelu admin, 12 października 2025, pierwsze tego dnia
ORDW252860003 - Zlecenie z formularza web, 13 października 2025, trzecie
ORDM252900015 - Zlecenie z mobilki, 17 października 2025, piętnaste
ORDZ252850001 - Zlecenie z rezerwacji, 12 października 2025, pierwsze
```

---

## 🔧 Jak System Tworzy Zlecenia

### 1. Proces w `pages/api/orders.js`

```javascript
// POST /api/orders
const source = orderData.source || 'admin-panel';
const orderNumber = generateOrderId(existingOrders, new Date(), source);

const newOrder = {
  id: Date.now(),
  orderNumber: orderNumber,  // np. "ORDA252850001"
  source: source,
  clientId: "...",
  clientName: "...",
  status: "pending",
  createdAt: new Date().toISOString(),
  // ... inne pola
};
```

### 2. Funkcja `generateOrderId()` w `utils/id-generator.js`

```javascript
function generateOrderId(orders, date, source) {
  const prefix = 'ORD';
  const sourceCode = SOURCE_TO_CODE[source] || 'S';  // W -> 'W', admin-panel -> 'A'
  const year = date.getFullYear().toString().slice(-2);  // 2025 -> '25'
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0');  // 285
  
  // Znajdź najwyższy numer sekwencji dla tego dnia
  const existingSequences = orders
    .filter(o => o.orderNumber?.startsWith(`${prefix}${sourceCode}${year}${dayOfYear}`))
    .map(o => parseInt(o.orderNumber.slice(-4), 10))
    .filter(n => !isNaN(n));
  
  const nextSequence = existingSequences.length > 0 
    ? Math.max(...existingSequences) + 1 
    : 1;
  
  const sequence = nextSequence.toString().padStart(4, '0');  // 1 -> '0001'
  
  return `${prefix}${sourceCode}${year}${dayOfYear}${sequence}`;
}
```

### 3. Zapisanie do `orders.json`

System używa `fileLocking.js` do bezpiecznego zapisu:

```javascript
await LockedFileOperations.updateJSON(ORDERS_FILE, async (orders) => {
  orders.push(orderToAdd);
  return orders;
}, []);
```

---

## 📝 Tworzenie Zlecenia przez API

### POST `/api/orders`

**Request Body (minimum):**
```json
{
  "source": "admin-panel",
  "clientName": "Jan Kowalski",
  "clientPhone": "123456789",
  "clientAddress": {
    "street": "Główna 10",
    "city": "Mielec",
    "postalCode": "39-300"
  },
  "deviceType": "Pralka",
  "issueDescription": "Nie wiruje",
  "status": "pending"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "order": {
    "id": 1760254680428,
    "orderNumber": "ORDA252850001",
    "source": "admin-panel",
    "clientId": "CLIS252850015",
    "clientName": "Jan Kowalski",
    "status": "pending",
    "createdAt": "2025-10-12T08:15:23.456Z"
  }
}
```

---

## 🔄 Konwersja Rezerwacji → Zlecenie

W `pages/api/rezerwacje.js` (linia 716):

```javascript
if (status === 'contacted') {
  // Ustaw źródło jako konwersja z rezerwacji
  orderData.source = 'reservation_conversion';
  
  const newOrder = await addOrder(orderData);
  // Wygeneruje ID: ORDZ252850001
}
```

---

## 🛠️ Ręczne Dodanie Zlecenia (Skrypt)

Przykład w `add-test-orders.js`:

```javascript
const { generateOrderId } = require('./utils/id-generator');

// Wczytaj istniejące zlecenia
const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf-8'));

// Generuj numer
const orderNumber = generateOrderId(orders, new Date(), 'admin-panel');

// Utwórz zlecenie
const newOrder = {
  id: Date.now(),
  orderNumber: orderNumber,  // "ORDA252850001"
  source: 'admin-panel',
  clientName: 'Jan Kowalski',
  clientPhone: '123456789',
  clientAddress: {
    city: 'Tarnów',
    street: 'Krakowska 10',
    postalCode: '33-100'
  },
  deviceType: 'Pralka',
  brand: 'Bosch',
  issueDescription: 'Nie wiruje',
  status: 'pending',
  createdAt: new Date().toISOString()
};

// Dodaj do tablicy
orders.push(newOrder);

// Zapisz
fs.writeFileSync('./data/orders.json', JSON.stringify(orders, null, 2), 'utf-8');
```

---

## ✅ Walidacja Danych

### Wymagane Pola (Minimum):
```javascript
{
  id: Number,              // Timestamp (wygenerowany automatycznie)
  orderNumber: String,     // ORDxYYDDDSSSS (wygenerowany automatycznie)
  source: String,          // Źródło (domyślnie: 'system-auto')
  clientName: String,      // Imię i nazwisko klienta
  clientPhone: String,     // Numer telefonu
  clientAddress: Object,   // Adres (z city, street, postalCode)
  deviceType: String,      // Typ urządzenia (Pralka, Lodówka, etc.)
  issueDescription: String,// Opis problemu
  status: String,          // Status (pending, in-progress, completed, etc.)
  createdAt: String        // ISO 8601 timestamp
}
```

### Statusy Zleceń:
- `pending` - Oczekuje na przydzielenie
- `scheduled` - Zaplanowane (ma datę wizyty)
- `in-progress` - W trakcie realizacji
- `completed` - Zakończone
- `cancelled` - Anulowane
- `on-hold` - Wstrzymane

---

## 🔍 Wyszukiwanie Zleceń

### Po numerycznym ID:
```javascript
const order = orders.find(o => o.id === 1760254680428);
```

### Po tekstowym numerze:
```javascript
const order = orders.find(o => o.orderNumber === 'ORDA252850001');
```

### System wspiera OBA formaty w API:
```
GET /api/orders?id=1760254680428
GET /api/orders?id=ORDA252850001
```

---

## 🗑️ Usuwanie Zlecenia

**API Endpoint:**
```
DELETE /api/orders?id=ORDA252850001
```

**System usuwa zlecenie używając:**
```javascript
// Porównuje zarówno id (number) jak i orderNumber (string)
orders = orders.filter(order => 
  order.id !== orderIdNum && 
  order.id !== orderId && 
  order.orderNumber !== orderId
);
```

---

## 📊 Backup i Odzyskiwanie

System automatycznie tworzy backup przed każdym zapisem:
```
data/backups/orders-backup-YYYY-MM-DDTHH-mm-ss-SSSZ.json
```

### Przywracanie z backupu:
```powershell
Copy-Item "data/backups/orders-backup-2025-10-12T08-15-23-456Z.json" "data/orders.json"
```

---

## ⚠️ Częste Błędy i Rozwiązania

### 1. **Błąd: "Unexpected non-whitespace character"**
**Przyczyna:** Korupcja JSON (np. `[]` na początku pliku zamiast `[`)  
**Rozwiązanie:** Przywróć backup lub napraw strukturę ręcznie

### 2. **Duplikaty numerów zleceń**
**Przyczyna:** Równoczesne zapisy bez locka  
**Rozwiązanie:** System używa `fileLocking.js` - upewnij się że jest aktywny

### 3. **Brak ID w zleceniu**
**Przyczyna:** Stare zlecenia przed wdrożeniem systemu  
**Rozwiązanie:** Migracja - dodaj `id: Date.now()` do starych zleceń

---

## 📚 Powiązane Pliki

- `data/orders.json` - Dane zleceń
- `utils/id-generator.js` - Generowanie numerów
- `utils/clientOrderStorage.js` - Operacje CRUD na zleceniach
- `utils/fileLocking.js` - Bezpieczny zapis do plików
- `pages/api/orders.js` - API endpoints dla zleceń
- `pages/api/rezerwacje.js` - Konwersja rezerwacji → zlecenia

---

## 🎓 Najlepsze Praktyki

1. **Zawsze używaj API** zamiast bezpośredniej edycji `orders.json`
2. **Nie zmieniaj `id` ani `orderNumber`** po utworzeniu zlecenia
3. **Podawaj `source`** przy tworzeniu zlecenia dla lepszego trackingu
4. **Twórz backup** przed masowymi operacjami
5. **Używaj `orderNumber`** w komunikacji z użytkownikiem
6. **Używaj `id`** w relacjach między tabelami (wizyty, płatności, etc.)

---

## ✨ Podsumowanie

**System używa DWÓCH identyfikatorów:**
- **`id`** (Number) - dla systemu
- **`orderNumber`** (String) - dla ludzi

**Format numeru:** `ORD[SOURCE][YY][DDD][SSSS]`  
**Przykład:** `ORDA252850001` = Admin panel, 12 października 2025, pierwsze

**Tworzenie:** Zawsze przez API lub `addOrder()` z `clientOrderStorage.js`  
**Backup:** Automatyczny przy każdym zapisie  
**Bezpieczeństwo:** Blokady plików (`fileLocking.js`)  

---

**Ostatnia aktualizacja:** 2025-10-12  
**Status systemu:** ✅ Działający i zweryfikowany
