# 🎉 DZIEŃ 3 ZAKOŃCZONY - API Zamówień + Magazyny Osobiste

## ✅ CO ZOSTAŁO ZROBIONE:

### 📦 CZĘŚĆ A: API Zamówień Części (`/api/part-requests`)

#### 1. **GET /api/part-requests** - Lista zamówień
```javascript
GET /api/part-requests                              // Wszystkie
GET /api/part-requests?id=PR-2025-10-03-1234       // Konkretne zamówienie
GET /api/part-requests?requestedBy=EMP25189002     // Zamówienia utworzone przez
GET /api/part-requests?requestedFor=EMP25189002    // Zamówienia dla
GET /api/part-requests?status=pending              // Po statusie
GET /api/part-requests?status=pending,approved     // Wiele statusów
GET /api/part-requests?urgency=urgent              // Po pilności
GET /api/part-requests?limit=10                    // Limit
```

**Statusy:**
- `pending` - Oczekuje na zatwierdzenie
- `approved` - Zatwierdzone przez logistyka
- `rejected` - Odrzucone
- `ordered` - Zamówione u dostawcy
- `delivered` - Dostarczone
- `completed` - Zakończone (części użyte)

---

#### 2. **POST /api/part-requests** - Nowe zamówienie (serwisant)
```javascript
POST /api/part-requests
Body: {
  requestedBy: "EMP25189002",      // Serwisant
  requestedFor: "EMP25189002",     // Ten sam = zamawia dla siebie
  ocrId: "OCR-2025-10-001",        // Opcjonalnie: link do OCR
  deviceInfo: {                     // Lub ręcznie
    brand: "Samsung",
    model: "WW90T4540AE",
    serialNumber: "SW123456"
  },
  parts: [
    {
      partId: "PART001",
      quantity: 2,
      preferredSupplierId: "SUP001"
    }
  ],
  urgency: "standard",              // standard, tomorrow, urgent
  preferredDelivery: "paczkomat",   // paczkomat, office, technician-address
  paczkomatId: "KRA01M",
  notes: "Pilne - klient czeka"
}
```

**Funkcje:**
- ✅ Automatyczna detekcja **po deadline** (15:00 default)
- ✅ Express charge **+25zł** jeśli urgent po deadline
- ✅ Link do OCR (deviceInfo z rozpoznanej tabliczki)
- ✅ Notyfikacja do logistyka
- ✅ Specjalna notyfikacja 🚨 jeśli urgent po deadline

---

#### 3. **POST /api/part-requests/admin-order** - Admin zamawia dla serwisanta
```javascript
POST /api/part-requests/admin-order
Body: {
  adminId: "EMPADMIN001",          // Admin/logistyk
  technicianId: "EMP25189002",     // Serwisant dla którego zamawia
  orderId: "ORD1024",              // Opcjonalnie: ID zlecenia
  deviceInfo: {
    brand: "Samsung",
    model: "WW90T4540AE"
  },
  parts: [
    {
      partId: "PART001",
      quantity: 1
    }
  ],
  urgency: "urgent",
  preferredDelivery: "paczkomat",
  paczkomatId: "KRA01M",
  reason: "Serwisant zgubił część",
  autoApprove: true,               // ✅ Admin może od razu zatwierdzić!
  notes: "Express - klient czeka od wczoraj"
}
```

**Funkcje:**
- ✅ **isAdminOrder: true** - flagka że admin zamawia
- ✅ **autoApprove** - admin może od razu zatwierdzić (pominąć workflow)
- ✅ **adminOrderReason** - powód zamówienia przez admina
- ✅ Notyfikacja do serwisanta: "Admin zamówił dla Ciebie"
- ✅ Notyfikacja do innych logistyków (jeśli nie auto-approve)
- ✅ Sprawdzanie uprawnień (role: admin, logistyk)

---

#### 4. **PUT /api/part-requests/approve?requestId=...** - Zatwierdź zamówienie
```javascript
PUT /api/part-requests/approve?requestId=PR-2025-10-03-1234
Body: {
  approvedBy: "EMPLOGISTYK001",
  finalDelivery: "paczkomat",      // Ostateczna decyzja logistyka
  paczkomatId: "KRA01M",
  logisticianNotes: "Konsolidacja z zamówieniem Tomka",
  estimatedDelivery: "2025-10-05"
}
```

**Funkcje:**
- ✅ Status → `approved`
- ✅ Logistyk może zmienić metodę dostawy (finalDelivery != preferredDelivery)
- ✅ Notatki logistyka
- ✅ Notyfikacja do serwisanta: "✅ Zamówienie zatwierdzone"

---

#### 5. **PUT /api/part-requests/reject?requestId=...** - Odrzuć zamówienie
```javascript
PUT /api/part-requests/reject?requestId=PR-2025-10-03-1234
Body: {
  rejectedBy: "EMPLOGISTYK001",
  rejectionReason: "Część niedostępna u dostawcy, zamów alternatywną"
}
```

**Funkcje:**
- ✅ Status → `rejected`
- ✅ Wymagany powód odrzucenia
- ✅ Notyfikacja do serwisanta: "❌ Zamówienie odrzucone. Powód: ..."

---

#### 6. **PUT /api/part-requests/delivered?requestId=...** - Potwierdź dostawę
```javascript
PUT /api/part-requests/delivered?requestId=PR-2025-10-03-1234
Body: {
  confirmedBy: "EMPLOGISTYK001",   // Lub sam serwisant
  trackingNumber: "DPD1234567890",
  actualDeliveryDate: "2025-10-05T10:30:00Z",
  notes: "Odebrano z paczkomatu"
}
```

**Funkcje:**
- ✅ Status → `delivered`
- ✅ Może potwierdzić logistyk LUB serwisant
- ✅ Notyfikacja wzajemna (kto potwierdził → notyfikacja dla drugiego)

---

### 📦 CZĘŚĆ B: API Magazynów Osobistych (`/api/inventory/personal`)

#### 1. **GET /api/inventory/personal?employeeId=...** - Magazyn pracownika
```javascript
GET /api/inventory/personal?employeeId=EMP25189002
```

**Response:**
```json
{
  "success": true,
  "inventory": {
    "inventoryId": "PI-001",
    "employeeId": "EMP25189002",
    "employeeName": "Adam Nowak",
    "vehicle": "VW Caddy (KR 12345)",
    "parts": [
      {
        "partId": "PART001",
        "partName": "Łożysko bębna Samsung",
        "partNumber": "DC97-16151A",
        "quantity": 0,
        "location": "Schowek boczny",
        "status": "available",
        "price": 85,
        "category": "Pralka",
        "assignedBy": "EMPLOGISTYK001",
        "assignedDate": "2025-10-01T10:00:00Z"
      }
    ],
    "statistics": {
      "totalParts": 0,
      "totalValue": 0,
      "lastUpdated": "2025-10-03T12:00:00Z"
    }
  }
}
```

**Funkcje:**
- ✅ Wzbogacone dane (partName, price, category z parts-inventory.json)
- ✅ Automatyczne utworzenie pustego magazynu jeśli nie istnieje
- ✅ Statystyki na żywo

---

#### 2. **POST /api/inventory/personal** - Przypisz część (po dostawie)
```javascript
POST /api/inventory/personal
Body: {
  employeeId: "EMP25189002",
  partId: "PART001",
  quantity: 2,
  location: "Schowek boczny",
  assignedBy: "EMPLOGISTYK001",
  supplierOrderId: "SO-2025-10-001",  // Opcjonalnie
  notes: "Z konsolidacji z Tomkiem"
}
```

**Funkcje:**
- ✅ Jeśli część już istnieje → **zwiększ ilość**
- ✅ Jeśli nowa → **dodaj do magazynu**
- ✅ Automatyczne przeliczanie statystyk (totalParts, totalValue)
- ✅ Notyfikacja do serwisanta: "📦 Nowe części w magazynie!"
- ✅ Historia restockowania (lastRestocked, restockedBy)

---

#### 3. **POST /api/inventory/personal/use** - Użyj części (podczas serwisu)
```javascript
POST /api/inventory/personal/use
Body: {
  employeeId: "EMP25189002",
  orderId: "ORD1024",
  parts: [
    {
      partId: "PART001",
      quantity: 2,
      installationNotes: "Wymiana łożyska - 90 minut pracy"
    }
  ],
  addToInvoice: true,               // Default: true
  invoiceId: "INV-2025-10-123",
  customerInfo: {
    name: "Jan Kowalski",
    address: "Kraków"
  },
  warranty: 12                       // Miesiące
}
```

**Funkcje:**
- ✅ **Sprawdzanie dostępności** przed użyciem (error jeśli za mało)
- ✅ **Automatyczne odejmowanie** z magazynu
- ✅ **Usuwanie części** jeśli quantity = 0
- ✅ **Zapis do part-usage.json** (historia użycia)
- ✅ **Low stock alert** → notyfikacja do logistyka jeśli 0!
- ✅ Obliczanie totalValue (quantity × price)
- ✅ Link do faktury

**Response:**
```json
{
  "success": true,
  "usage": {
    "usageId": "PU-2025-10-03-1234",
    "employeeId": "EMP25189002",
    "orderId": "ORD1024",
    "parts": [
      {
        "partId": "PART001",
        "partName": "Łożysko bębna Samsung",
        "quantity": 2,
        "unitPrice": 85,
        "totalPrice": 170
      }
    ],
    "totalValue": 170,
    "addedToInvoice": true,
    "invoiceId": "INV-2025-10-123"
  },
  "inventory": { /* zaktualizowany magazyn */ },
  "lowStockAlert": true,
  "outOfStockParts": ["Łożysko bębna Samsung"]
}
```

---

#### 4. **GET /api/inventory/personal/history** - Historia użycia
```javascript
GET /api/inventory/personal/history?employeeId=EMP25189002
GET /api/inventory/personal/history?orderId=ORD1024
GET /api/inventory/personal/history?usageId=PU-2025-10-03-1234
GET /api/inventory/personal/history?dateFrom=2025-10-01&dateTo=2025-10-03
GET /api/inventory/personal/history?limit=10
```

**Response:**
```json
{
  "success": true,
  "usageHistory": [
    {
      "usageId": "PU-2025-10-03-1234",
      "employeeId": "EMP25189002",
      "employeeName": "Adam Nowak",
      "orderId": "ORD1024",
      "usageDate": "2025-10-03T14:30:00Z",
      "parts": [...],
      "totalValue": 170,
      "addedToInvoice": true,
      "invoiceId": "INV-2025-10-123"
    }
  ],
  "statistics": {
    "totalUsages": 15,
    "totalParts": 45,
    "totalValue": 3850
  }
}
```

---

#### 5. **GET /api/inventory/personal/stats** - Statystyki magazynu
```javascript
GET /api/inventory/personal/stats?employeeId=EMP25189002
GET /api/inventory/personal/stats?employeeId=EMP25189002&period=month
GET /api/inventory/personal/stats?employeeId=EMP25189002&period=week
```

**Response:**
```json
{
  "success": true,
  "employeeId": "EMP25189002",
  "period": "month",
  "currentInventory": {
    "totalParts": 6,
    "totalValue": 355,
    "uniqueParts": 5
  },
  "usage": {
    "totalUsages": 8,
    "totalPartsUsed": 18,
    "totalValueUsed": 1520
  },
  "topUsedParts": [
    {
      "partId": "PART001",
      "partName": "Łożysko bębna Samsung",
      "timesUsed": 4,
      "quantityUsed": 8,
      "totalValue": 680
    }
  ],
  "lowStockParts": [
    {
      "partId": "PART001",
      "partName": "Łożysko bębna Samsung",
      "quantity": 0,
      "location": "Schowek boczny"
    }
  ],
  "lowStockAlert": true
}
```

---

#### 6. **PUT /api/inventory/personal/adjust** - Ręczna korekta magazynu
```javascript
PUT /api/inventory/personal/adjust
Body: {
  employeeId: "EMP25189002",
  partId: "PART001",
  adjustment: "add",              // 'add', 'remove', 'set'
  quantity: 2,                    // Ile dodać/odjąć/ustawić
  reason: "Uszkodzenie podczas montażu",  // WYMAGANY!
  adjustedBy: "EMPLOGISTYK001",
  location: "Schowek boczny",     // Opcjonalnie: zmień lokalizację
  notes: "Część uszkodzona - zwrot do dostawcy"
}
```

**Typy korekt:**
- `add` - Dodaj X sztuk
- `remove` - Odejmij X sztuk
- `set` - Ustaw na X sztuk (bezwzględna wartość)

**Funkcje:**
- ✅ Historia korekt (adjustmentHistory w każdej części)
- ✅ Wymagany powód (reason)
- ✅ Notyfikacja do serwisanta: "🔧 Korekta magazynu"
- ✅ Low stock alert jeśli nowy stan = 0
- ✅ Audit trail (kto, kiedy, dlaczego)

---

### 📦 CZĘŚĆ C: API Notyfikacji (`/api/notifications`)

#### 1. **GET /api/notifications** - Lista notyfikacji
```javascript
GET /api/notifications                          // Wszystkie
GET /api/notifications?userId=EMP25189002      // Dla konkretnego użytkownika + globalne
GET /api/notifications?userId=null             // Tylko globalne
GET /api/notifications?type=error              // Po typie
GET /api/notifications?read=false              // Tylko nieprzeczytane
GET /api/notifications?limit=20
```

**Typy:**
- `info` - Informacja
- `success` - Sukces
- `warning` - Ostrzeżenie
- `error` - Błąd / Pilne

---

#### 2. **PUT /api/notifications** - Oznacz jako przeczytane
```javascript
PUT /api/notifications
Body: {
  notificationIds: [1759467786996, 1759467787167],  // Array lub single
  markAll: false                                     // true = wszystkie
}
```

---

#### 3. **DELETE /api/notifications** - Usuń notyfikacje
```javascript
DELETE /api/notifications
Body: {
  notificationIds: [1759467786996],  // Konkretne
  deleteAll: true,                    // Wszystkie przeczytane
  olderThan: 30                       // Starsze niż 30 dni
}
```

---

## 🔔 SYSTEM NOTYFIKACJI

### Automatyczne notyfikacje wysyłane przez system:

#### **Part Requests:**
1. ✅ **Nowe zamówienie** → logistyk
   - `🔴 PILNE` jeśli urgent
   - `⚠️ NA JUTRO` jeśli tomorrow
   
2. ✅ **Express po deadline** → logistyk
   - `🚨 Express po deadline! (+25zł)`
   
3. ✅ **Admin zamawia dla serwisanta** → serwisant + logistyk
   - `🛒 Admin zamówił dla Ciebie części`
   
4. ✅ **Zamówienie zatwierdzone** → serwisant
   - `✅ Zamówienie zatwierdzone. Dostawa: paczkomat KRA01M`
   
5. ✅ **Zamówienie odrzucone** → serwisant
   - `❌ Zamówienie odrzucone. Powód: ...`
   
6. ✅ **Części dostarczone** → serwisant (lub logistyk)
   - `📦 Części dostarczone!`

#### **Personal Inventory:**
1. ✅ **Nowe części w magazynie** → serwisant
   - `📦 Nowe części w magazynie! (2 szt)`
   
2. ✅ **Low stock alert** → logistyk
   - `⚠️ Low stock alert! Stan magazynu: 0`
   
3. ✅ **Korekta magazynu** → serwisant
   - `🔧 Korekta magazynu: +2 szt. Powód: ...`

---

## 🎯 KLUCZOWE FEATURES

### 1. **Admin może zamawiać dla innych** ✅
```javascript
// Scenariusz: Serwisant dzwoni "Zgubłem część!"
POST /api/part-requests/admin-order
{
  adminId: "EMPADMIN001",
  technicianId: "EMP25189002",
  autoApprove: true,  // Od razu zatwierdzone!
  reason: "Serwisant zgubił część"
}
```

### 2. **Deadline + Express Charge** ✅
```javascript
// System automatycznie sprawdza godzinę:
const isAfterDeadline = currentTime > "15:00";
const expressCharge = (isAfterDeadline && urgency === 'urgent') ? 25 : 0;

// Notyfikacja:
"🚨 Express po deadline! (+25zł)"
```

### 3. **Low Stock Alert** ✅
```javascript
// Gdy serwisant użyje ostatnią część:
POST /api/inventory/personal/use
{
  parts: [{ partId: "PART001", quantity: 2 }]  // Ostatnie 2 szt
}

// Response:
{
  "lowStockAlert": true,
  "outOfStockParts": ["Łożysko bębna Samsung"]
}

// Automatyczna notyfikacja do logistyka:
"⚠️ Low stock alert! Adam Nowak zużył ostatnie: Łożysko bębna Samsung"
```

### 4. **Historia + Audit Trail** ✅
- ✅ `part-usage.json` - Każde użycie części zapisane
- ✅ `adjustmentHistory` - Historia wszystkich korekt magazynu
- ✅ `assignedBy`, `restockedBy` - Kto i kiedy
- ✅ Link do faktury (`invoiceId`)

### 5. **Integracja z OCR** ✅
```javascript
// Po OCR tabliczki:
POST /api/ocr/device-plate → ocrId: "OCR-2025-10-001"

// Zamówienie z linkiem do OCR:
POST /api/part-requests
{
  ocrId: "OCR-2025-10-001",  // Link do rozpoznanej tabliczki
  deviceInfo: null            // Pobrane z OCR
}
```

---

## 📊 STATYSTYKI

### Utworzone pliki:
- **9 nowych endpointów API** (part-requests: 5, personal inventory: 5, notifications: 1)
- **~1800 linii kodu**
- **Pełna integracja z notyfikacjami**

### Funkcje:
- ✅ Admin ordering dla innych serwisantów
- ✅ Auto-approve dla adminów
- ✅ Deadline detection + express charge
- ✅ Low stock alerts
- ✅ Audit trail + historia
- ✅ Statystyki magazynów
- ✅ Integracja z OCR

---

## 🚀 NASTĘPNY KROK: DZIEŃ 4

Teraz tworzymy najbardziej zaawansowaną część:
1. **Konsolidacja zamówień** (same paczkomat → oszczędność 15zł)
2. **Multi-delivery** (jedno zamówienie → wiele adresów)
3. **Auto-assign po dostawie** (automatyczne przypisanie do magazynów)
4. **API konfiguracji** (deadline, express charge, consolidation settings)

**Gotowy na Dzień 4?** 🎯
