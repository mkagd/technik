# 📦 SYSTEM MAGAZYNOWY V3 - FINALNA SPECYFIKACJA
## Uwzględnia: OCR gotowe ✅ + Multi-logistyk + Elastyczne dostawy + Multi-dostawcy

**Data:** 2025-10-03  
**Wersja:** 3.0 (FINALNA - gotowa do implementacji)

---

## 🎉 CO JUŻ MAMY GOTOWE

### ✅ OCR TABLICZKI ZNAMIONOWEJ - DZIAŁA!
```javascript
// Istniejące komponenty:
- SimpleAIScanner.js ✅
- ModelAIScanner.js ✅
- /api/openai-vision ✅ (GPT-4o Mini)
- /api/google-vision ✅ (backup)
- /api/ocr-space ✅ (darmowy backup)

// Funkcjonalność:
✅ Zdjęcie tabliczki → AI rozpoznaje model
✅ Parsing: brand, model, serialNumber, capacity
✅ Confidence score
✅ Fallback APIs (Google Vision, OCR.space)
```

**CO DODAMY:** Integracja z magazynem - po OCR → auto-sugestie części

---

## 👥 ROLE W SYSTEMIE (zaktualizowane)

### 1. **ADMIN** (Anna - Ty)
**Uprawnienia:**
- ✅ Pełny dostęp do wszystkiego
- ✅ **MOŻE ZAMAWIAĆ CZĘŚCI DLA INNYCH SERWISANTÓW**
- ✅ Zarządzanie pracownikami
- ✅ Raporty i analizy
- ✅ Konfiguracja systemu (deadline, dostawcy)
- ✅ **PRACUJE JAKO SERWISANT** - ma swój magazyn osobisty

**Konto:** role: `ADMIN` + magazyn osobisty

### 2. **LOGISTYK** (Jan, Marek, ...)
**Uprawnienia:**
- ✅ **KILKA OSÓB może mieć rolę logistyka**
- ✅ Odbiera zamówienia od serwisantów
- ✅ Zatwierdza/odrzuca zamówienia
- ✅ Konsoliduje i składa zbiorcze zamówienia
- ✅ Wybiera dostawcę i sposób dostawy
- ✅ Przydziela części do magazynów osobistych
- ✅ **RÓWNIEŻ PRZYJMUJE ZLECENIA** jako serwisant
- ✅ Ma swój magazyn osobisty (jeśli jeździ)

**Konta:** role: `LOGISTYK` + opcjonalnie magazyn osobisty

### 3. **SERWISANT** (Adam, Tomek, Marek...)
**Uprawnienia:**
- ✅ Ma swój magazyn osobisty (części w samochodzie)
- ✅ Robi OCR tabliczki znamionowej (OBOWIĄZEK)
- ✅ Zamawia części u logistyka
- ✅ Sugeruje preferowaną dostawę (adres/paczkomat)
- ✅ Dodaje części do zlecenia

**Konta:** role: `SERWISANT` + magazyn osobisty

---

## 📊 STRUKTURY DANYCH (zaktualizowane)

### 1. **PersonalInventory** (Magazyn osobisty)

```json
{
  "id": "PI-001",
  "employeeId": "EMP001",
  "employeeName": "Adam Nowak",
  "employeeRole": "SERWISANT", // SERWISANT, LOGISTYK, ADMIN
  "vehicle": "Ford Transit - KR 12345",
  "parts": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 2,
      "assignedDate": "2025-10-01T10:00:00Z",
      "assignedBy": "LOG001", // Kto przydzielił
      "assignedByName": "Jan Kowalski (Logistyk)",
      "location": "Schowek przedni", // Opcjonalne
      "status": "available" // available, used, damaged, returned
    }
  ],
  "totalValue": 650.00,
  "lastUpdated": "2025-10-03T09:00:00Z",
  "statistics": {
    "totalParts": 6,
    "totalTypes": 2,
    "usedThisMonth": 8,
    "valueUsedThisMonth": 720.00
  }
}
```

### 2. **PartRequest** (Zamówienie serwisanta)

```json
{
  "id": "PR-2025-10-001",
  "requestedBy": "EMP001", // Serwisant który zamawia
  "requestedByName": "Adam Nowak",
  "requestedFor": "EMP001", // Dla kogo (może być inny jeśli admin zamawia)
  "requestedForName": "Adam Nowak",
  "createdBy": "ADM001", // Kto utworzył (może być admin)
  "createdByName": "Anna Admin",
  
  "orderId": "ORD1024", // Zlecenie
  "client": "Pani Kowalska",
  "deviceInfo": {
    "brand": "Samsung",
    "model": "WW90T4540AE",
    "serialNumber": "1234567890ABC",
    "ocrId": "OCR-2025-10-001", // Link do OCR
    "detectedByAI": true
  },
  
  "urgency": "standard", // urgent (dziś!), tomorrow, standard (w tym tygodniu)
  "requestDate": "2025-10-03T11:30:00Z",
  
  "requestedParts": [
    {
      "partId": "PART002",
      "partNumber": "DC96-01414G",
      "name": "Pompa odpływowa",
      "quantity": 1,
      "reason": "Wymiana podczas naprawy pralki",
      "compatibilityConfirmed": true,
      "suggestedByAI": true
    }
  ],
  
  // PREFEROWANA DOSTAWA (wybiera serwisant)
  "preferredDelivery": {
    "type": "paczkomat", // home_address, work_address, paczkomat, pickup
    "address": "ul. Kwiatowa 12, 30-001 Kraków",
    "paczkomatId": "KRA01M", // Jeśli paczkomat
    "phone": "+48 123 456 789",
    "notes": "Najlepiej do paczkomatu obok domu"
  },
  
  "status": "pending", // pending, approved, ordered, consolidated, delivered, completed, rejected
  "notes": "Potrzebuję na jutro rano, wizyta o 10:00",
  
  // OBSŁUGA PRZEZ LOGISTYKA
  "reviewedBy": "LOG001",
  "reviewedByName": "Jan Kowalski",
  "reviewedAt": "2025-10-03T14:00:00Z",
  "approvalNotes": "OK, konsoliduję z zamówieniem Tomka",
  
  // KONSOLIDACJA
  "consolidatedWith": ["PR-2025-10-002", "PR-2025-10-003"], // Inne zamówienia w paczce
  "supplierOrderId": "SO-2025-10-003", // Zamówienie u dostawcy
  
  // FINALNA DOSTAWA (decyzja logistyka)
  "finalDelivery": {
    "type": "paczkomat", // Logistyk może zmienić!
    "address": "ul. Kwiatowa 12, 30-001 Kraków",
    "paczkomatId": "KRA01M",
    "consolidated": true, // Czy skonsolidowano z innymi
    "reason": "Konsolidacja z zamówieniem Tomka - oszczędność 15 zł"
  },
  
  "deliveredAt": "2025-10-04T08:00:00Z",
  "completedAt": "2025-10-04T10:15:00Z"
}
```

### 3. **SupplierOrder** (Zbiorcze zamówienie logistyka)

```json
{
  "id": "SO-2025-10-003",
  "orderedBy": "LOG001",
  "orderedByName": "Jan Kowalski (Logistyk)",
  "orderDate": "2025-10-03T15:30:00Z",
  
  // DOSTAWCA (różni dostawcy!)
  "supplier": {
    "id": "SUP001",
    "name": "ASWO Sp. z o.o.",
    "code": "ASWO-001",
    "contact": "zamowienia@aswo.pl",
    "phone": "+48 12 345 6789",
    "hasAPI": false, // Czy ma API czy email
    "apiEndpoint": null,
    "deliveryTime": "24h",
    "freeShippingThreshold": 500 // Darmowa dostawa >500 zł
  },
  
  "items": [
    {
      "partId": "PART002",
      "partNumber": "DC96-01414G",
      "name": "Pompa odpływowa",
      "quantity": 3, // Suma dla kilku serwisantów
      "unitPrice": 90.00,
      "totalPrice": 270.00,
      "requestIds": ["PR-2025-10-001", "PR-2025-10-002"], // Zamówienia serwisantów
      "assignTo": [
        { 
          "employeeId": "EMP001", 
          "employeeName": "Adam Nowak",
          "quantity": 1,
          "delivery": {
            "type": "paczkomat",
            "paczkomatId": "KRA01M",
            "address": "ul. Kwiatowa 12, Kraków"
          }
        },
        { 
          "employeeId": "EMP002", 
          "employeeName": "Tomek Wiśniewski",
          "quantity": 2,
          "delivery": {
            "type": "paczkomat",
            "paczkomatId": "KRA01M", // TEN SAM - konsolidacja!
            "address": "ul. Kwiatowa 12, Kraków"
          }
        }
      ]
    }
  ],
  
  "totalValue": 595.00,
  "totalValueWithVAT": 731.85,
  "shippingCost": 0, // Free shipping (>500 zł)
  
  // DOSTAWA
  "deliveryMethod": "consolidated_paczkomat", // single, multiple, consolidated_paczkomat
  "deliveryAddresses": [
    {
      "type": "paczkomat",
      "paczkomatId": "KRA01M",
      "address": "ul. Kwiatowa 12, Kraków",
      "employeeIds": ["EMP001", "EMP002"], // Kilku serwisantów
      "trackingNumber": "DPD123456789PL"
    }
  ],
  
  "status": "ordered", // draft, ordered, confirmed, shipped, partially_delivered, delivered, completed
  "expectedDelivery": "2025-10-04T08:00:00Z",
  "actualDelivery": null,
  
  "invoice": {
    "number": "FV/2025/10/45678",
    "amount": 731.85,
    "paid": false,
    "dueDate": "2025-10-17"
  },
  
  "notes": "Konsolidacja: Adam + Tomek → jeden paczkomat (oszczędność 15 zł na przesyłce)"
}
```

### 4. **Supplier** (Dostawcy części)

```json
{
  "id": "SUP001",
  "name": "ASWO Sp. z o.o.",
  "code": "ASWO-001",
  "type": "online_store", // online_store, manufacturer, distributor
  "contact": {
    "email": "zamowienia@aswo.pl",
    "phone": "+48 12 345 6789",
    "person": "Jan Kowalski",
    "website": "https://aswo.pl"
  },
  "integration": {
    "hasAPI": false,
    "apiEndpoint": null,
    "apiKey": null,
    "orderMethod": "email" // email, api, phone, manual
  },
  "delivery": {
    "standardTime": "24h",
    "expressTime": "4h",
    "freeShippingThreshold": 500,
    "shippingCost": 15,
    "acceptsPaczkomat": true,
    "acceptsPersonalPickup": false
  },
  "payment": {
    "methods": ["transfer", "invoice"],
    "invoiceDays": 14,
    "discount": 0 // % rabatu przy dużych zamówieniach
  },
  "categories": ["AGD", "Pralki", "Zmywarki", "Lodówki"],
  "isActive": true,
  "preferredFor": ["Samsung", "LG", "Bosch"], // Preferowany dla marek
  "notes": "Główny dostawca części Samsung i LG",
  "statistics": {
    "totalOrders": 142,
    "totalValue": 45230.50,
    "avgDeliveryTime": "26h",
    "reliability": 0.97 // 97% zamówień OK
  }
}
```

### 5. **SystemConfig** (Konfiguracja systemu)

```json
{
  "id": "CONFIG-001",
  "ordering": {
    "defaultDeadline": "15:00", // KONFIGUROWALNY!
    "deadlineEnabled": true,
    "allowAfterDeadline": true, // Pilne zamówienia po deadline
    "afterDeadlineCharge": 25, // Dopłata za express (zł)
    "consolidationEnabled": true, // Konsolidacja przesyłek
    "minConsolidationTime": 24, // Min. godzin między zamówieniami do konsolidacji
    "autoApprovalThreshold": 100 // Auto-zatwierdzanie zamówień <100 zł
  },
  "delivery": {
    "defaultMethod": "paczkomat",
    "allowedMethods": ["home_address", "work_address", "paczkomat", "pickup"],
    "consolidationSavings": 15, // Oszczędność przy konsolidacji (zł)
    "paczkomatProvider": "InPost", // InPost, Paczkomat24, DHL
    "preferPaczkomats": true // Priorytet dla paczkomatów
  },
  "suppliers": {
    "primarySupplierId": "SUP001", // ASWO
    "autoSelectSupplier": true, // Auto-wybór najtańszego
    "fallbackSuppliers": ["SUP002", "SUP003"]
  },
  "notifications": {
    "emailEnabled": true,
    "pushEnabled": true,
    "smsEnabled": false,
    "notifyDeadline": 30 // Przypomnienie X minut przed deadline
  }
}
```

---

## 🔄 PRZEPŁYWY PROCESÓW (zaktualizowane)

### PROCES 1: Serwisant zamawia część (standardowy)

```
┌─────────────────────────────────────────────────────────┐
│ 1. SERWISANT u klienta                                  │
│    Otwiera zlecenie #ORD1024                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. OBOWIĄZEK: Zdjęcie tabliczki                        │
│    📸 Używa SimpleAIScanner (już istnieje!) ✅         │
│    AI: Samsung WW90T4540AE (95% confidence)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. SYSTEM SUGERUJE CZĘŚCI (NOWE!)                      │
│    💡 Na podstawie OCR + baza kompatybilności:         │
│                                                         │
│    ⭐⭐⭐ Łożysko bębna Samsung                         │
│    • DC97-16151A | 85 zł                               │
│    • ✅ MASZ W AUCIE: 2 szt                            │
│    • Kompatybilność: 100%                              │
│    [➕ Użyj] [ℹ️ Info]                                  │
│                                                         │
│    ⭐⭐ Pompa odpływowa                                 │
│    • DC96-01414G | 90 zł                               │
│    • ❌ BRAK w magazynie                               │
│    [🛒 Zamów u logistyka]                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. KLIKAM [🛒 Zamów u logistyka]                       │
│                                                         │
│    ┌────────────────────────────────────────────┐     │
│    │ 🛒 ZAMÓWIENIE CZĘŚCI                       │     │
│    │                                            │     │
│    │ Część: Pompa odpływowa                    │     │
│    │ Ilość: [1] szt × 90 zł                    │     │
│    │                                            │     │
│    │ ⏰ Kiedy potrzebujesz?                    │     │
│    │ ○ DZIŚ (pilne +25 zł)                     │     │
│    │ ● JUTRO ✓                                 │     │
│    │ ○ W tym tygodniu                          │     │
│    │                                            │     │
│    │ 📦 Gdzie dostarczyć?                      │     │
│    │ ○ Mój adres domowy                        │     │
│    │ ● Paczkomat (najlepszy) ✓                │     │
│    │   [KRA01M - ul. Kwiatowa 12___] 🔍       │     │
│    │ ○ Odbiór osobisty (baza)                 │     │
│    │                                            │     │
│    │ 💡 Logistyk może zmienić dostawę aby      │     │
│    │    połączyć z innymi zamówieniami         │     │
│    │                                            │     │
│    │ Notatka:                                  │     │
│    │ [Potrzebuję na jutro, wizyta o 10_____]  │     │
│    │                                            │     │
│    │ [Anuluj] [📤 Wyślij (90 zł)]             │     │
│    └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. ✅ ZAMÓWIENIE WYSŁANE                               │
│    Nr: PR-2025-10-001                                  │
│                                                         │
│    📧 Notyfikacja do logistyka                         │
│    Deadline: dziś 15:00 (4h 32min)                     │
│                                                         │
│    Status: ⏳ Oczekuje na zatwierdzenie                │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 2: Admin zamawia część DLA INNEGO serwisanta

```
┌─────────────────────────────────────────────────────────┐
│ ADMIN (Anna) widzi że Adam potrzebuje części           │
│ ale nie zamówił (zapomniał / nie ma czasu)             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Anna otwiera: /admin/logistyk/nowe-zamowienie          │
│                                                         │
│    ┌────────────────────────────────────────────┐     │
│    │ 🛒 NOWE ZAMÓWIENIE (jako admin)           │     │
│    │                                            │     │
│    │ DLA KOGO?                                  │     │
│    │ [Adam Nowak ▼] <-- wybiera serwisanta     │     │
│    │                                            │     │
│    │ ZLECENIE (opcjonalnie):                   │     │
│    │ [#ORD1024 - Pani Kowalska___] 🔍         │     │
│    │                                            │     │
│    │ CZĘŚĆ:                                     │     │
│    │ [Pompa odpływowa DC96-01414G___] 🔍       │     │
│    │ Ilość: [2] × 90 zł = 180 zł               │     │
│    │                                            │     │
│    │ ⏰ Kiedy: [Jutro ▼]                       │     │
│    │                                            │     │
│    │ 📦 Dostawa:                               │     │
│    │ [Paczkomat KRA01M ▼] (preferencja Adama) │     │
│    │                                            │     │
│    │ [Anuluj] [📤 Zamów dla Adam]             │     │
│    └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ ZAMÓWIENIE UTWORZONE                                │
│    PR-2025-10-005                                      │
│                                                         │
│    Zamówione przez: Anna Admin                         │
│    Dla: Adam Nowak                                     │
│                                                         │
│    📧 Adam dostaje notyfikację:                        │
│    "Anna zamówiła dla Ciebie pompę × 2 szt"           │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 3: Logistyk konsoliduje zamówienia

```
┌─────────────────────────────────────────────────────────┐
│ LOGISTYK - PANEL (godz. 14:45 - przed deadline!)      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 📋 ZAMÓWIENIA DZISIAJ                                  │
│                                                         │
│ ⏰ Deadline: 15:00 (za 15 minut!)                      │
│ ⚙️ [Zmień deadline]                                     │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ⏳ PR-001 | Adam | 11:30 | JUTRO               │     │
│ │    • Pompa odpływowa × 1 | 90 zł              │     │
│ │    • Preferowana dostawa: Paczkomat KRA01M    │     │
│ │    [✓ Zatwierdź] [❌] [💬]                     │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ⏳ PR-002 | Tomek | 13:20 | W TYM TYGODNIU    │     │
│ │    • Pompa odpływowa × 2 | 180 zł             │     │
│ │    • Preferowana dostawa: Paczkomat KRA01M    │     │
│ │    💡 TEN SAM PACZKOMAT co Adam!              │     │
│ │    [✓ Zatwierdź] [🔗 Konsoliduj z PR-001]     │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ⏳ PR-003 | Marek | 14:00 | DZIŚ (PILNE!)     │     │
│ │    • Grzałka 2000W × 1 | 120 zł               │     │
│ │    • Dopłata express: +25 zł                  │     │
│ │    • Dostawa: Adres domowy Marka              │     │
│ │    [✓ Zatwierdź PILNE] [❌]                    │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ Razem: 3 zamówienia | 390 zł + 25 zł (express)        │
│                                                         │
│ 💡 SUGESTIA KONSOLIDACJI:                              │
│    Adam + Tomek → jeden paczkomat KRA01M               │
│    Oszczędność: 15 zł na przesyłce                     │
│                                                         │
│ [🛒 Utwórz zbiorcze zamówienie] <--- klika            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ KREATOR ZBIORCZEGO ZAMÓWIENIA                          │
│                                                         │
│    ┌────────────────────────────────────────────┐     │
│    │ 📦 ZAMÓWIENIE U DOSTAWCY                  │     │
│    │                                            │     │
│    │ Dostawca: [ASWO Sp. z o.o. ▼]            │     │
│    │ 💰 Darmowa dostawa >500 zł ✅             │     │
│    │                                            │     │
│    │ ┌──────────────────────────────────────┐  │     │
│    │ │ CZĘŚĆ | ILOŚĆ | CENA | DLA KOGO     │  │     │
│    │ ├──────────────────────────────────────┤  │     │
│    │ │ Pompa | 3×    | 270  | Adam(1)+    │  │     │
│    │ │ odpł. |       |      | Tomek(2)    │  │     │
│    │ │                                      │  │     │
│    │ │ Grzałka| 1×   | 120  | Marek(1)    │  │     │
│    │ │ 2000W |       |      | EXPRESS!    │  │     │
│    │ └──────────────────────────────────────┘  │     │
│    │                                            │     │
│    │ WARTOŚĆ: 390 zł                           │     │
│    │ VAT 23%: 89,70 zł                         │     │
│    │ ─────────────────                         │     │
│    │ RAZEM: 479,70 zł                          │     │
│    │                                            │     │
│    │ 📦 DOSTAWA:                               │     │
│    │ • Paczkomat KRA01M (Adam + Tomek)        │     │
│    │   Koszt: 15 zł → GRATIS (konsolidacja) ✅│     │
│    │                                            │     │
│    │ • Kurier do domu (Marek - PILNE!)        │     │
│    │   Koszt: 25 zł (express)                  │     │
│    │                                            │     │
│    │ OSZCZĘDNOŚĆ: 15 zł ✅                     │     │
│    │                                            │     │
│    │ [Edytuj] [📧 Wyślij zamówienie]          │     │
│    └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ ZAMÓWIENIE WYSŁANE DO ASWO                          │
│    SO-2025-10-003                                      │
│                                                         │
│    📧 Email wysłany: zamowienia@aswo.pl                │
│    Potwierdzenie: ~30 min                              │
│    Dostawa: jutro 08:00 + DZIŚ 18:00 (Marek express)  │
│                                                         │
│    📧 Notyfikacje do serwisantów:                      │
│    • Adam: "Część zamówiona, dostawa jutro paczkomat" │
│    • Tomek: "Część zamówiona, paczka wspólna z Adam"  │
│    • Marek: "Express! Dostawa dziś 18:00 kurier"      │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 4: Pilne zamówienie PO DEADLINE

```
┌─────────────────────────────────────────────────────────┐
│ Godz. 16:30 (PO DEADLINE!)                             │
│ Adam u klienta - odkrył że potrzebuje część DZIŚ!      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Adam próbuje zamówić część                             │
│                                                         │
│    ⚠️ UWAGA: Po godzinie zamówień (15:00)             │
│                                                         │
│    Możesz złożyć PILNE zamówienie:                     │
│    • Dopłata: +25 zł (kurier express)                  │
│    • Dostawa: DZIŚ wieczorem (~4h)                     │
│                                                         │
│    [Anuluj] [🚨 PILNE - Zamów teraz (+25 zł)]         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ PILNE ZAMÓWIENIE WYSŁANE                            │
│    PR-2025-10-010 (URGENT)                             │
│                                                         │
│    📧 NATYCHMIASTOWA notyfikacja do logistyka          │
│    🔴 Priorytet: PILNE - wymaga szybkiej reakcji       │
│                                                         │
│    Logistyk dzwoni do dostawcy lub zamawia online      │
│    Express: Dostawa w 4h (kurier +25 zł)               │
└─────────────────────────────────────────────────────────┘
```

---

## 🖥️ INTERFEJSY (kluczowe nowości)

### ADMIN: Zamówienie dla innego `/admin/logistyk/zamow-dla`

```
┌──────────────────────────────────────────────────────────────┐
│ 👤 Anna Admin                                 [🔔] [📋] [👤] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🛒 NOWE ZAMÓWIENIE (jako admin)                             │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 👤 DLA KOGO?                                           │  │
│ │ ┌──────────────────────────────────────────┐          │  │
│ │ │ [Adam Nowak                       ▼]     │          │  │
│ │ │ • Ford Transit KR 12345                  │          │  │
│ │ │ • Magazyn: 6 części | 520 zł             │          │  │
│ │ │ • Ostatnie zamówienie: 2 dni temu        │          │  │
│ │ └──────────────────────────────────────────┘          │  │
│ │                                                         │  │
│ │ 🔍 ZLECENIE (opcjonalnie):                            │  │
│ │ [#ORD1024 - Pani Kowalska - Pralka________] 🔍       │  │
│ │ 📸 OCR tabliczki: Samsung WW90T4540AE ✅              │  │
│ │                                                         │  │
│ │ 🔧 CZĘŚĆ:                                              │  │
│ │ [Pompa odpływowa DC96-01414G______________] 🔍        │  │
│ │ Ilość: [2] × 90 zł = 180 zł                           │  │
│ │ Dostawca: ASWO (dostawa 24h)                          │  │
│ │                                                         │  │
│ │ 💡 SUGEROWANE CZĘŚCI (z OCR):                         │  │
│ │ ┌──────────────────────────────────────────┐          │  │
│ │ │ ⭐ Łożysko Samsung DC97-16151A | 85 zł  │          │  │
│ │ │ [+ Dodaj]                                │          │  │
│ │ └──────────────────────────────────────────┘          │  │
│ │                                                         │  │
│ │ ⏰ KIEDY:                                              │  │
│ │ ○ Dziś (pilne +25 zł)                                 │  │
│ │ ● Jutro ✓                                             │  │
│ │ ○ W tym tygodniu                                      │  │
│ │                                                         │  │
│ │ 📦 DOSTAWA (preferencja Adam):                        │  │
│ │ [Paczkomat KRA01M - ul. Kwiatowa 12 ▼]               │  │
│ │ 💡 Logistyk może zmienić dla konsolidacji             │  │
│ │                                                         │  │
│ │ 📝 NOTATKA:                                            │  │
│ │ [Adam prosił na jutro, wizyta o 10____________]       │  │
│ │                                                         │  │
│ │ [Anuluj] [📤 Zamów dla Adam (180 zł)]                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### LOGISTYK: Konfiguracja deadline `/admin/logistyk/ustawienia`

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ USTAWIENIA SYSTEMU ZAMÓWIEŃ                              │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⏰ DEADLINE ZAMÓWIEŃ                                   │  │
│ │                                                         │  │
│ │ Godzina zamknięcia: [15:00 ▼]                         │  │
│ │                                                         │  │
│ │ ☑️ Włącz deadline                                      │  │
│ │ ☑️ Zezwól na pilne zamówienia po deadline             │  │
│ │ ☑️ Przypomnienie 30 min przed deadline                │  │
│ │                                                         │  │
│ │ Dopłata za express: [25] zł                            │  │
│ │ Czas dostawy express: [4] godzin                       │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📦 KONSOLIDACJA PRZESYŁEK                             │  │
│ │                                                         │  │
│ │ ☑️ Włącz automatyczną konsolidację                    │  │
│ │                                                         │  │
│ │ Min. czas między zamówieniami: [24] godzin            │  │
│ │ Oszczędność przy konsolidacji: [15] zł                │  │
│ │                                                         │  │
│ │ ☑️ Preferuj paczkomaty (tańsze)                       │  │
│ │ ☑️ Sugeruj konsolidację w tym samym mieście           │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ [💾 Zapisz ustawienia]                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS (zaktualizowane)

### 1. OCR + Sugestie części (INTEGRACJA Z ISTNIEJĄCYM)

```javascript
// Istniejący endpoint rozszerzamy:
// POST /api/ocr/device-plate

Request:
{
  orderId: "ORD1024",
  employeeId: "EMP001",
  photo: File // base64 lub multipart
}

Response:
{
  success: true,
  ocrId: "OCR-2025-10-001",
  confidence: 0.95,
  device: {
    brand: "Samsung",
    model: "WW90T4540AE",
    serialNumber: "1234567890ABC",
    // ... (jak już mamy w SimpleAIScanner)
  },
  
  // NOWE! Sugestie części:
  suggestedParts: [
    {
      partId: "PART001",
      partNumber: "DC97-16151A",
      name: "Łożysko bębna Samsung",
      price: 85.00,
      compatibility: 100,
      reason: "Kompatybilne z modelem WW90T4540AE",
      suppliers: [
        {
          supplierId: "SUP001",
          name: "ASWO",
          price: 85.00,
          deliveryTime: "24h",
          inStock: true
        }
      ],
      // NOWE! Czy serwisant ma w aucie:
      inPersonalInventory: true,
      personalInventoryQuantity: 2,
      needToOrder: false
    },
    {
      partId: "PART002",
      name: "Pompa odpływowa",
      compatibility: 85,
      inPersonalInventory: false, // BRAK!
      needToOrder: true,
      suppliers: [...]
    }
  ]
}
```

### 2. Zamówienie przez admina dla innego

```javascript
// POST /api/part-requests (rozszerzony)

Request:
{
  requestedBy: "EMP001", // Dla kogo
  createdBy: "ADM001", // Kto tworzy (admin)
  orderId: "ORD1024",
  parts: [...],
  urgency: "tomorrow",
  preferredDelivery: {
    type: "paczkomat",
    paczkomatId: "KRA01M"
  },
  notes: "Zamówione przez Annę dla Adama"
}

Response:
{
  success: true,
  requestId: "PR-2025-10-005",
  message: "Zamówienie utworzone dla Adam Nowak",
  notifications: {
    employee: "Wysłano notyfikację do Adam",
    logistyk: "Wysłano do logistyka"
  }
}
```

### 3. Konsolidacja zamówień

```javascript
// POST /api/supplier-orders/consolidate

Request:
{
  requestIds: ["PR-001", "PR-002"], // Które zamówienia
  supplierId: "SUP001",
  consolidation: {
    enabled: true,
    deliveryType: "paczkomat",
    paczkomatId: "KRA01M",
    employeeIds: ["EMP001", "EMP002"],
    savings: 15 // Oszczędność (zł)
  }
}

Response:
{
  success: true,
  supplierOrderId: "SO-2025-10-003",
  consolidated: {
    requests: 2,
    employees: ["Adam Nowak", "Tomek Wiśniewski"],
    totalValue: 270.00,
    savings: 15.00,
    delivery: {
      type: "paczkomat",
      paczkomatId: "KRA01M",
      trackingNumber: null // Po wysyłce
    }
  }
}
```

### 4. Konfiguracja systemu

```javascript
// GET/PUT /api/config/ordering

GET Response:
{
  ordering: {
    defaultDeadline: "15:00",
    deadlineEnabled: true,
    allowAfterDeadline: true,
    afterDeadlineCharge: 25,
    // ...
  },
  delivery: {...},
  suppliers: {...}
}

PUT Request:
{
  ordering: {
    defaultDeadline: "16:00", // Zmiana deadline!
    // ...
  }
}
```

---

## 📅 PLAN IMPLEMENTACJI FINAL (9-11 dni)

### FAZA 1: Backend (3-4 dni)

#### Dzień 1: Rozszerzenie struktur danych
- ✅ PersonalInventory (nowe pola: role, multi-logistyk)
- ✅ PartRequest (+ createdBy dla admin, finalDelivery)
- ✅ SupplierOrder (+ konsolidacja, multi-delivery)
- ✅ Supplier (ASWO + inne, API/email)
- ✅ SystemConfig (deadline konfigurowalny)
- ✅ Seed data

#### Dzień 2: Integracja OCR → Magazyn
- ✅ Rozszerzenie `/api/ocr/device-plate`
- ✅ Matching części z kompatybilnością
- ✅ Check czy serwisant ma w aucie (inPersonalInventory)
- ✅ Multi-dostawcy (ASWO, inne)
- ✅ Sugestie części po OCR

#### Dzień 3: API Zamówień
- ✅ /api/part-requests/* (+ admin zamawia dla innych)
- ✅ /api/inventory/personal/* (CRUD magazynów)
- ✅ Logika użycia części z magazynu
- ✅ Notyfikacje (niski stan, nowe zamówienie)

#### Dzień 4: API Logistyka + Konsolidacja
- ✅ /api/supplier-orders/* (zbiorcze zamówienia)
- ✅ Auto-konsolidacja (ten sam paczkomat!)
- ✅ Express (po deadline)
- ✅ Multi-delivery (paczkomat + kurier)
- ✅ /api/config/ordering (konfiguracja deadline)

---

### FAZA 2: Panel Logistyka (2-3 dni)

#### Dzień 5: Widoki podstawowe
- ✅ /admin/logistyk - dashboard
- ✅ Lista zamówień pending (z deadline countdown)
- ✅ Zatwierdzanie/odrzucanie
- ✅ Sugestie konsolidacji (wykrywa ten sam paczkomat)

#### Dzień 6: Zamówienia zbiorcze
- ✅ Kreator zamówienia u dostawcy
- ✅ Wybór dostawcy (ASWO, inne)
- ✅ Konsolidacja delivery (auto-sugestie)
- ✅ Kalkulacja oszczędności
- ✅ Email do dostawcy (template)

#### Dzień 7: Konfiguracja + Raporty
- ✅ /admin/logistyk/ustawienia (deadline, konsolidacja)
- ✅ Magazyny serwisantów (overview)
- ✅ Historia zamówień
- ✅ Statystyki (oszczędności, rotacja)

---

### FAZA 3: Panel Serwisanta + Mobile (2-3 dni)

#### Dzień 8: Magazyn osobisty
- ✅ /serwisant/magazyn (lista części w aucie)
- ✅ Historia użycia
- ✅ Moje zamówienia (pending, delivered)
- ✅ Szybki dostęp do zamówienia

#### Dzień 9: Integracja OCR → Zamówienie
- ✅ Po OCR → sugestie części (NOWE!)
- ✅ Przycisk "Użyj z mojego magazynu" (jeśli ma)
- ✅ Przycisk "Zamów u logistyka" (jeśli nie ma)
- ✅ Formularz zamówienia (preferowana dostawa)
- ✅ Mobile UI (AGD Mobile integration)

#### Dzień 10: Admin zamawia dla innych
- ✅ /admin/logistyk/zamow-dla (nowy widok)
- ✅ Wybór serwisanta
- ✅ Link do zlecenia (auto-OCR jeśli jest)
- ✅ Sugestie części
- ✅ Notyfikacje do serwisanta

---

### FAZA 4: Zaawansowane (opcjonalne, 1-2 dni)

#### Dzień 11: Finalizacja
- ✅ Express po deadline (UI + flow)
- ✅ Multi-dostawcy (porównanie cen)
- ✅ Optymalizacja konsolidacji (ML?)
- ✅ Dashboard analityczny
- ✅ Testy E2E
- ✅ Dokumentacja

---

## 🎯 METRYKI SUKCESU

### Logistyk:
- ✅ Deadline przestrzegany: >95%
- ✅ Konsolidacja: >60% zamówień
- ✅ Oszczędności: ~15 zł/konsolidacja

### Serwisant:
- ✅ Czas zamówienia: <3 min (z OCR!)
- ✅ OCR accuracy: >90%
- ✅ Magazyn wykorzystany: >80%

### Biznes:
- 💰 Koszty dostaw: -40% (konsolidacja)
- ⏱️ Czas napraw: -25% (części dostępne)
- 📦 Rotacja magazynów: <10 dni

---

## ✅ GOTOWE DO STARTU?

**Potwierdzenie:**
1. ✅ OCR mamy - SimpleAIScanner, OpenAI Vision API
2. ✅ Multi-logistyk + admin może zamawiać dla innych
3. ✅ Deadline konfigurowalny (15:00 domyślnie)
4. ✅ Elastyczna dostawa (paczkomat preferred, konsolidacja!)
5. ✅ Express możliwy (po deadline +25 zł)
6. ✅ Multi-dostawcy (ASWO + inne, email)

**MOŻEMY ZACZYNAĆ IMPLEMENTACJĘ!** 🚀

Zaczynam od **Dzień 1** - struktury danych?
