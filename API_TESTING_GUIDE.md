# 🔗 SYSTEM MAGAZYNOWY - PRZEWODNIK TESTOWANIA API

## 🚀 Quick Start

### 1. Uruchom serwer
```bash
npm run dev
```
Serwer: `http://localhost:3000`

### 2. Sprawdź czy działa
```bash
curl http://localhost:3000/api/config/ordering
```

---

## 📋 WSZYSTKIE ENDPOINTY Z PRZYKŁADAMI

### 🔧 **KONFIGURACJA SYSTEMU**

#### GET - Pobierz konfigurację
```bash
# Browser / Postman
http://localhost:3000/api/config/ordering

# PowerShell
curl http://localhost:3000/api/config/ordering 2>$null | ConvertFrom-Json | ConvertTo-Json -Depth 10

# curl (Git Bash)
curl http://localhost:3000/api/config/ordering | jq
```

#### PUT - Zmień deadline na 16:00
```bash
curl -X PUT http://localhost:3000/api/config/ordering `
  -H "Content-Type: application/json" `
  -d '{
    "updatedBy": "EMPADMIN001",
    "ordering": {
      "defaultDeadline": "16:00",
      "afterDeadlineCharge": 30
    }
  }'
```

---

### 📦 **KATALOG CZĘŚCI**

#### GET - Wszystkie części
```bash
http://localhost:3000/api/inventory/parts
```

#### GET - Części Samsung
```bash
http://localhost:3000/api/inventory/parts?brand=Samsung
```

#### GET - Tylko dostępne części
```bash
http://localhost:3000/api/inventory/parts?available=true
```

#### POST - Dodaj nową część
```bash
curl -X POST http://localhost:3000/api/inventory/parts `
  -H "Content-Type: application/json" `
  -d '{
    "id": "PART999",
    "name": "Test Part",
    "partNumber": "TEST-999",
    "price": 100,
    "category": "Pralka",
    "brand": "Samsung"
  }'
```

---

### 🔍 **INTELIGENTNE SUGESTIE CZĘŚCI**

#### POST - Sugestie dla Samsung WW90T4540AE (Adam)
```bash
curl -X POST http://localhost:3000/api/inventory/suggest-parts `
  -H "Content-Type: application/json" `
  -d '{
    "brand": "Samsung",
    "model": "WW90T4540AE",
    "employeeId": "EMP25189002",
    "symptoms": ["hałas", "wibracje"]
  }'
```

**Co zobaczymy:**
- ✅ Kompatybilność 0-100%
- ✅ `inPersonalInventory: true/false` (czy Adam MA w aucie)
- ✅ Top 3 dostawców
- ✅ Matching objawów

---

### 📸 **OCR TABLICZKI ZNAMIONOWEJ**

#### POST - OCR + auto-sugestie
```bash
curl -X POST http://localhost:3000/api/ocr/device-plate `
  -H "Content-Type: application/json" `
  -d '{
    "orderId": "ORD1024",
    "employeeId": "EMP25189002",
    "photoUrl": "/uploads/plate_123.jpg",
    "ocrResult": {
      "brand": "Samsung",
      "model": "WW90T4540AE",
      "serialNumber": "SW123456",
      "confidence": 0.95
    },
    "symptoms": ["hałas podczas wirowania"]
  }'
```

#### GET - Historia OCR dla Adama
```bash
http://localhost:3000/api/ocr/history?employeeId=EMP25189002
```

#### GET - Historia OCR dla zlecenia
```bash
http://localhost:3000/api/ocr/history?orderId=ORD1024
```

---

### 🛒 **ZAMÓWIENIA CZĘŚCI (SERWISANT)**

#### GET - Wszystkie zamówienia
```bash
http://localhost:3000/api/part-requests
```

#### GET - Zamówienia Adama
```bash
http://localhost:3000/api/part-requests?requestedBy=EMP25189002
```

#### GET - Pending zamówienia
```bash
http://localhost:3000/api/part-requests?status=pending
```

#### GET - Pilne zamówienia
```bash
http://localhost:3000/api/part-requests?urgency=urgent
```

#### POST - Nowe zamówienie (serwisant)
```bash
curl -X POST http://localhost:3000/api/part-requests `
  -H "Content-Type: application/json" `
  -d '{
    "requestedBy": "EMP25189002",
    "requestedFor": "EMP25189002",
    "ocrId": "OCR-2025-10-03-001",
    "parts": [
      {
        "partId": "PART001",
        "quantity": 2,
        "preferredSupplierId": "SUP001"
      }
    ],
    "urgency": "standard",
    "preferredDelivery": "paczkomat",
    "paczkomatId": "KRA01M",
    "notes": "Klient czeka"
  }'
```

---

### 👨‍💼 **ADMIN ZAMAWIA DLA SERWISANTA**

#### POST - Admin zamawia dla Adama (auto-approve!)
```bash
curl -X POST http://localhost:3000/api/part-requests/admin-order `
  -H "Content-Type: application/json" `
  -d '{
    "adminId": "EMPADMIN001",
    "technicianId": "EMP25189002",
    "deviceInfo": {
      "brand": "Samsung",
      "model": "WW90T4540AE"
    },
    "parts": [
      {
        "partId": "PART001",
        "quantity": 1
      }
    ],
    "urgency": "urgent",
    "preferredDelivery": "paczkomat",
    "paczkomatId": "KRA01M",
    "reason": "Serwisant zgubił część",
    "autoApprove": true
  }'
```

**Funkcje:**
- ✅ `autoApprove: true` - od razu zatwierdzone!
- ✅ Notyfikacja dla serwisanta
- ✅ `isAdminOrder: true`

---

### ✅ **ZATWIERDZANIE ZAMÓWIEŃ (LOGISTYK)**

#### PUT - Zatwierdź zamówienie
```bash
curl -X PUT "http://localhost:3000/api/part-requests/approve?requestId=PR-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "approvedBy": "EMPLOGISTYK001",
    "finalDelivery": "paczkomat",
    "paczkomatId": "KRA01M",
    "logisticianNotes": "Konsolidacja z Tomkiem"
  }'
```

#### PUT - Odrzuć zamówienie
```bash
curl -X PUT "http://localhost:3000/api/part-requests/reject?requestId=PR-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "rejectedBy": "EMPLOGISTYK001",
    "rejectionReason": "Część niedostępna, wybierz alternatywną"
  }'
```

#### PUT - Potwierdź dostawę
```bash
curl -X PUT "http://localhost:3000/api/part-requests/delivered?requestId=PR-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "confirmedBy": "EMPLOGISTYK001",
    "trackingNumber": "DPD1234567890",
    "notes": "Odebrano z paczkomatu"
  }'
```

---

### 📦 **MAGAZYNY OSOBISTE**

#### GET - Magazyn Adama
```bash
http://localhost:3000/api/inventory/personal?employeeId=EMP25189002
```

#### POST - Przypisz część do magazynu (po dostawie)
```bash
curl -X POST http://localhost:3000/api/inventory/personal `
  -H "Content-Type: application/json" `
  -d '{
    "employeeId": "EMP25189002",
    "partId": "PART001",
    "quantity": 2,
    "location": "Schowek boczny",
    "assignedBy": "EMPLOGISTYK001",
    "supplierOrderId": "SO-2025-10-03-001"
  }'
```

#### POST - Użyj części z magazynu (podczas serwisu)
```bash
curl -X POST http://localhost:3000/api/inventory/personal/use `
  -H "Content-Type: application/json" `
  -d '{
    "employeeId": "EMP25189002",
    "orderId": "ORD1024",
    "parts": [
      {
        "partId": "PART001",
        "quantity": 2,
        "installationNotes": "Wymiana łożyska - 90 minut"
      }
    ],
    "addToInvoice": true,
    "invoiceId": "INV-2025-10-123",
    "warranty": 12
  }'
```

**Co się stanie:**
- ✅ Magazyn: -2 części
- ✅ Historia użycia zapisana
- ✅ Jeśli 0 → Low stock alert!

#### GET - Historia użycia części (Adam)
```bash
http://localhost:3000/api/inventory/personal/history?employeeId=EMP25189002
```

#### GET - Historia ostatnich 7 dni
```bash
http://localhost:3000/api/inventory/personal/history?employeeId=EMP25189002&dateFrom=2025-09-26
```

#### GET - Statystyki magazynu (miesiąc)
```bash
http://localhost:3000/api/inventory/personal/stats?employeeId=EMP25189002&period=month
```

**Co zobaczymy:**
- ✅ Aktualny stan magazynu
- ✅ Top 5 najczęściej używanych części
- ✅ Low stock alert (< 2 szt)
- ✅ Statystyki użycia

#### PUT - Ręczna korekta magazynu
```bash
curl -X PUT http://localhost:3000/api/inventory/personal/adjust `
  -H "Content-Type: application/json" `
  -d '{
    "employeeId": "EMP25189002",
    "partId": "PART001",
    "adjustment": "add",
    "quantity": 1,
    "reason": "Zwrot od klienta",
    "adjustedBy": "EMPLOGISTYK001",
    "notes": "Część nieużyta"
  }'
```

**Typy korekt:**
- `add` - Dodaj X
- `remove` - Odejmij X
- `set` - Ustaw na X

---

### 🔥 **AUTO-DETEKCJA KONSOLIDACJI**

#### POST - Auto-detect (ostatnie 24h)
```bash
curl -X POST http://localhost:3000/api/supplier-orders/consolidate `
  -H "Content-Type: application/json" `
  -d '{"autoDetect": true}'
```

#### POST - Sprawdź wszystkie approved
```bash
curl -X POST http://localhost:3000/api/supplier-orders/consolidate `
  -H "Content-Type: application/json" `
  -d '{"checkAllApproved": true}'
```

#### POST - Sprawdź konkretne zamówienia
```bash
curl -X POST http://localhost:3000/api/supplier-orders/consolidate `
  -H "Content-Type: application/json" `
  -d '{
    "requestIds": ["PR-2025-10-03-1234", "PR-2025-10-03-5678"]
  }'
```

**Response pokażę:**
- ✅ Możliwości konsolidacji (type: paczkomat/office/address)
- ✅ Oszczędności (np. 15zł)
- ✅ Lista serwisantów w grupie
- ✅ Statystyki

---

### 🚚 **ZAMÓWIENIA U DOSTAWCÓW**

#### GET - Wszystkie zamówienia u dostawców
```bash
http://localhost:3000/api/supplier-orders
```

#### GET - Zamówienia ASWO
```bash
http://localhost:3000/api/supplier-orders?supplierId=SUP001
```

#### GET - Pending zamówienia
```bash
http://localhost:3000/api/supplier-orders?status=pending,shipped
```

#### GET - Zamówienia dla Adama
```bash
http://localhost:3000/api/supplier-orders?employeeId=EMP25189002
```

#### POST - Utwórz zamówienie u dostawcy (z konsolidacją!)
```bash
curl -X POST http://localhost:3000/api/supplier-orders/create `
  -H "Content-Type: application/json" `
  -d '{
    "createdBy": "EMPLOGISTYK001",
    "supplierId": "SUP001",
    "partRequestIds": ["PR-2025-10-03-1234", "PR-2025-10-03-5678"],
    "deliveryMethod": "consolidated",
    "consolidationInfo": {
      "type": "paczkomat",
      "location": "KRA01M",
      "savings": 15
    },
    "priority": "standard",
    "notes": "Konsolidacja Adam + Tomek"
  }'
```

**Co się stanie:**
- ✅ Supplier order utworzony
- ✅ Part requests → status `ordered`
- ✅ Konsolidacja zapisana
- ✅ Notyfikacje wysłane

#### PUT - Potwierdź zamówienie (dostawca)
```bash
curl -X PUT "http://localhost:3000/api/supplier-orders/update-status?orderId=SO-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "confirmed",
    "updatedBy": "EMPLOGISTYK001"
  }'
```

#### PUT - Wysłane (z trackingiem)
```bash
curl -X PUT "http://localhost:3000/api/supplier-orders/update-status?orderId=SO-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "shipped",
    "updatedBy": "EMPLOGISTYK001",
    "trackingNumbers": "DPD1234567890"
  }'
```

#### PUT - ✨ Dostarczone + AUTO-ASSIGN! ✨
```bash
curl -X PUT "http://localhost:3000/api/supplier-orders/update-status?orderId=SO-2025-10-03-1234" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "delivered",
    "updatedBy": "EMPLOGISTYK001",
    "autoAssign": true,
    "deliveryNotes": "Odebrano z paczkomatu KRA01M"
  }'
```

**🔥 AUTO-ASSIGN:**
- ✅ Części automatycznie dodane do magazynów osobistych!
- ✅ Part requests → delivered
- ✅ Notyfikacje wysłane
- ✅ ZERO ręcznej pracy!

---

### 🔔 **NOTYFIKACJE**

#### GET - Wszystkie notyfikacje
```bash
http://localhost:3000/api/notifications
```

#### GET - Nieprzeczytane notyfikacje
```bash
http://localhost:3000/api/notifications?read=false
```

#### GET - Notyfikacje dla Adama
```bash
http://localhost:3000/api/notifications?userId=EMP25189002
```

#### GET - Tylko pilne (error)
```bash
http://localhost:3000/api/notifications?type=error
```

#### PUT - Oznacz jako przeczytane
```bash
curl -X PUT http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{
    "notificationIds": [1759467786996, 1759467787167]
  }'
```

#### PUT - Oznacz wszystkie jako przeczytane
```bash
curl -X PUT http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{"markAll": true}'
```

#### DELETE - Usuń przeczytane
```bash
curl -X DELETE http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{"deleteAll": true}'
```

#### DELETE - Usuń starsze niż 30 dni
```bash
curl -X DELETE http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{"olderThan": 30}'
```

---

## 🎯 SCENARIUSZE TESTOWE

### 📋 **Scenariusz 1: Podstawowy workflow (bez konsolidacji)**

```bash
# 1. Serwisant tworzy zamówienie
curl -X POST http://localhost:3000/api/part-requests `
  -H "Content-Type: application/json" `
  -d '{
    "requestedBy": "EMP25189002",
    "requestedFor": "EMP25189002",
    "parts": [{"partId": "PART001", "quantity": 2}],
    "urgency": "standard",
    "preferredDelivery": "paczkomat",
    "paczkomatId": "KRA01M"
  }'

# Zapisz requestId z response!

# 2. Logistyk zatwierdza
curl -X PUT "http://localhost:3000/api/part-requests/approve?requestId=PR-XXX" `
  -H "Content-Type: application/json" `
  -d '{
    "approvedBy": "EMPLOGISTYK001",
    "finalDelivery": "paczkomat",
    "paczkomatId": "KRA01M"
  }'

# 3. Logistyk składa zamówienie u dostawcy
curl -X POST http://localhost:3000/api/supplier-orders/create `
  -H "Content-Type: application/json" `
  -d '{
    "createdBy": "EMPLOGISTYK001",
    "supplierId": "SUP001",
    "partRequestIds": ["PR-XXX"],
    "deliveryMethod": "multi-address",
    "priority": "standard"
  }'

# Zapisz orderId!

# 4. Oznacz jako dostarczone + auto-assign
curl -X PUT "http://localhost:3000/api/supplier-orders/update-status?orderId=SO-XXX" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "delivered",
    "updatedBy": "EMPLOGISTYK001",
    "autoAssign": true
  }'

# 5. Sprawdź magazyn Adama (powinny być +2 części!)
http://localhost:3000/api/inventory/personal?employeeId=EMP25189002

# 6. Adam używa części
curl -X POST http://localhost:3000/api/inventory/personal/use `
  -H "Content-Type: application/json" `
  -d '{
    "employeeId": "EMP25189002",
    "orderId": "ORD1024",
    "parts": [{"partId": "PART001", "quantity": 2}]
  }'

# Sprawdź czy low stock alert! (powinien być jeśli 0)
```

---

### 🔥 **Scenariusz 2: Konsolidacja (Adam + Tomek)**

```bash
# 1. Adam zamawia części (paczkomat KRA01M)
curl -X POST http://localhost:3000/api/part-requests `
  -H "Content-Type: application/json" `
  -d '{
    "requestedBy": "EMP25189002",
    "requestedFor": "EMP25189002",
    "parts": [{"partId": "PART001", "quantity": 2}],
    "preferredDelivery": "paczkomat",
    "paczkomatId": "KRA01M"
  }'
# Zapisz: PR-Adam

# 2. Tomek zamawia części (TEN SAM paczkomat KRA01M!)
curl -X POST http://localhost:3000/api/part-requests `
  -H "Content-Type: application/json" `
  -d '{
    "requestedBy": "EMP25189003",
    "requestedFor": "EMP25189003",
    "parts": [{"partId": "PART002", "quantity": 1}],
    "preferredDelivery": "paczkomat",
    "paczkomatId": "KRA01M"
  }'
# Zapisz: PR-Tomek

# 3. Logistyk zatwierdza OBA
curl -X PUT "http://localhost:3000/api/part-requests/approve?requestId=PR-Adam" ...
curl -X PUT "http://localhost:3000/api/part-requests/approve?requestId=PR-Tomek" ...

# 4. AUTO-DETEKCJA KONSOLIDACJI! 🔥
curl -X POST http://localhost:3000/api/supplier-orders/consolidate `
  -H "Content-Type: application/json" `
  -d '{"autoDetect": true}'

# Response pokaże:
# ✅ 2 zamówienia → paczkomat KRA01M
# ✅ Oszczędność: 15zł!

# 5. Logistyk składa SKONSOLIDOWANE zamówienie
curl -X POST http://localhost:3000/api/supplier-orders/create `
  -H "Content-Type: application/json" `
  -d '{
    "createdBy": "EMPLOGISTYK001",
    "supplierId": "SUP001",
    "partRequestIds": ["PR-Adam", "PR-Tomek"],
    "deliveryMethod": "consolidated",
    "consolidationInfo": {
      "type": "paczkomat",
      "location": "KRA01M",
      "savings": 15
    }
  }'

# 6. Dostawa + auto-assign (OBA dostają części!)
curl -X PUT "http://localhost:3000/api/supplier-orders/update-status?orderId=SO-XXX" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "delivered",
    "updatedBy": "EMPLOGISTYK001",
    "autoAssign": true
  }'

# 7. Sprawdź magazyny (Adam +2, Tomek +1)
http://localhost:3000/api/inventory/personal?employeeId=EMP25189002
http://localhost:3000/api/inventory/personal?employeeId=EMP25189003

# SUKCES! Oszczędność 15zł + auto-assign! 🎉
```

---

### 👨‍💼 **Scenariusz 3: Admin ordering**

```bash
# Admin zamawia PILNE części dla Adama (zgubił!)
curl -X POST http://localhost:3000/api/part-requests/admin-order `
  -H "Content-Type: application/json" `
  -d '{
    "adminId": "EMPADMIN001",
    "technicianId": "EMP25189002",
    "parts": [{"partId": "PART001", "quantity": 1}],
    "urgency": "urgent",
    "preferredDelivery": "office",
    "reason": "Serwisant zgubił część - klient czeka!",
    "autoApprove": true
  }'

# ✅ autoApprove = true → od razu approved!
# ✅ isAdminOrder = true
# ✅ Notyfikacja dla Adama

# Zamówienie od razu u dostawcy (bo approved)
curl -X POST http://localhost:3000/api/supplier-orders/create ...
```

---

## 🔍 POSTMAN COLLECTION

### Import do Postmana:

1. Utwórz nową Collection: "System Magazynowy"
2. Dodaj Environment:
   - `baseUrl`: `http://localhost:3000`
   - `employeeId`: `EMP25189002`
   - `adminId`: `EMPADMIN001`

3. Przykładowe requesty:

```json
{
  "name": "Suggest Parts",
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/api/inventory/suggest-parts",
    "body": {
      "mode": "raw",
      "raw": "{\"brand\":\"Samsung\",\"model\":\"WW90T4540AE\",\"employeeId\":\"{{employeeId}}\"}"
    }
  }
}
```

---

## 📊 STATYSTYKI DO SPRAWDZENIA

```bash
# Sprawdź wszystkie zamówienia u dostawców + statystyki
http://localhost:3000/api/supplier-orders

# Response pokaże:
# - totalOrders
# - totalValue
# - totalSavings (ile oszczędziliśmy!)
# - consolidationRate (% skonsolidowanych)

# Statystyki magazynu Adama (miesiąc)
http://localhost:3000/api/inventory/personal/stats?employeeId=EMP25189002&period=month

# Response pokaże:
# - Top 5 używanych części
# - Low stock parts
# - Total usage value
```

---

## 🎉 QUICK TEST - Sprawdź czy działa!

```bash
# 1. Konfiguracja
curl http://localhost:3000/api/config/ordering 2>$null

# 2. Lista części
curl http://localhost:3000/api/inventory/parts 2>$null

# 3. Sugestie
curl -X POST http://localhost:3000/api/inventory/suggest-parts `
  -H "Content-Type: application/json" `
  -d '{"brand":"Samsung","model":"WW90T4540AE","employeeId":"EMP25189002"}' 2>$null

# 4. Magazyn Adama
curl http://localhost:3000/api/inventory/personal?employeeId=EMP25189002 2>$null

# 5. Auto-detekcja konsolidacji
curl -X POST http://localhost:3000/api/supplier-orders/consolidate `
  -H "Content-Type: application/json" `
  -d '{"autoDetect":true}' 2>$null

# Wszystko działa? ✅
```

---

## 🐛 TROUBLESHOOTING

### Błąd 404?
```bash
# Sprawdź czy serwer działa
curl http://localhost:3000/api/config/ordering

# Sprawdź port
netstat -ano | findstr :3000
```

### Błąd 500?
```bash
# Sprawdź logi serwera (terminal z npm run dev)
# Sprawdź czy pliki JSON istnieją w data/
```

### Brak danych?
```bash
# Sprawdź seed data:
Get-Content data/part-requests.json
Get-Content data/personal-inventories.json
Get-Content data/supplier-orders.json
```

---

## 📚 DOKUMENTACJA

- `MAGAZYN_SYSTEM_V3_FINAL.md` - Pełna specyfikacja
- `DZIEN_2_COMPLETED.md` - OCR integration
- `DZIEN_3_COMPLETED.md` - Zamówienia + magazyny
- `DZIEN_4_COMPLETED.md` - Konsolidacja
- `SYSTEM_MAGAZYNOWY_FINAL.md` - Podsumowanie

---

## 🎯 NAJWAŻNIEJSZE LINKI

### 🔥 Must-Try:
```
1. Auto-detect konsolidacji:
   POST http://localhost:3000/api/supplier-orders/consolidate
   {"autoDetect": true}

2. Auto-assign po dostawie:
   PUT http://localhost:3000/api/supplier-orders/update-status?orderId=SO-XXX
   {"status": "delivered", "autoAssign": true}

3. Sugestie części (sprawdź inPersonalInventory!):
   POST http://localhost:3000/api/inventory/suggest-parts
   {"brand": "Samsung", "model": "WW90T4540AE", "employeeId": "EMP25189002"}

4. Admin ordering dla serwisanta:
   POST http://localhost:3000/api/part-requests/admin-order
   {"adminId": "ADMIN", "technicianId": "TECH", "autoApprove": true}
```

---

**Miłego testowania! 🚀**

Masz pytania o jakiś endpoint? Pytaj! 😊
