# 🏪 SYSTEM MAGAZYNU DLA SERWISU AGD
## Kompletny projekt zarządzania częściami zamiennymi dla serwisantów

**Data:** 3 października 2025  
**Status:** PROJEKT - DO IMPLEMENTACJI  
**Priorytet:** WYSOKI

---

## 📋 SPIS TREŚCI
1. [Analiza potrzeb](#analiza-potrzeb)
2. [Architektura systemu](#architektura-systemu)
3. [Struktura danych](#struktura-danych)
4. [Interfejsy użytkownika](#interfejsy-użytkownika)
5. [Przepływy procesów](#przepływy-procesów)
6. [API Endpoints](#api-endpoints)
7. [Plan implementacji](#plan-implementacji)

---

## 🎯 ANALIZA POTRZEB

### 👥 UŻYTKOWNICY SYSTEMU

#### 1. **Administrator** (Panel Admin)
- Zarządzanie całym magazynem
- Dodawanie/edycja/usuwanie części
- Zarządzanie dostawcami
- Przeglądanie raportów i statystyk
- Zamawianie nowych części
- Ustawianie progów alarmowych

#### 2. **Serwisant** (Aplikacja mobilna/Panel pracownika)
- Przeglądanie dostępnych części
- Sprawdzanie kompatybilności z urządzeniami
- Rezerwowanie części do zlecenia
- Zgłaszanie zużycia części
- Zgłaszanie potrzeby zamówienia
- Historia używanych części

---

## 🏗️ ARCHITEKTURA SYSTEMU

### KOMPONENTY GŁÓWNE

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM MAGAZYNU                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   ADMIN      │  │  SERWISANT   │  │   MOBILE     │  │
│  │   PANEL      │  │    PANEL     │  │     APP      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │   API LAYER     │                     │
│                  │  /api/inventory │                     │
│                  │  /api/parts     │                     │
│                  │  /api/suppliers │                     │
│                  └────────┬────────┘                     │
│                           │                              │
│         ┌─────────────────┼─────────────────┐           │
│         │                 │                 │            │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐    │
│  │   PARTS     │  │  SUPPLIERS  │  │   ORDERS    │    │
│  │ INVENTORY   │  │  DATABASE   │  │  TRACKING   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 STRUKTURA DANYCH

### 1. **CZĘŚĆ ZAMIENNA** (Part)

```json
{
  "id": "PART001",
  "partNumber": "DC97-16151A",
  "ean": "8806092340565",
  
  "name": "Łożysko bębna Samsung",
  "description": "Łożysko bębna do pralek Samsung, wysokiej jakości zamiennik",
  "category": "AGD",
  "subcategory": "Pralka",
  
  "compatibility": {
    "brands": ["Samsung", "LG"],
    "models": ["WW90T4540AE", "WW80T4540AE"],
    "deviceTypes": ["Pralka"],
    "universalFit": false
  },
  
  "specifications": {
    "diameter": "35mm",
    "material": "Stal nierdzewna + uszczelka NBR",
    "weight": "0.35kg",
    "oem": true,
    "warranty": "12 miesięcy"
  },
  
  "pricing": {
    "purchasePrice": 65,
    "retailPrice": 85,
    "wholesalePrice": 75,
    "currency": "PLN",
    "taxRate": 23,
    "margin": 30.77
  },
  
  "inventory": {
    "inStock": 12,
    "minStock": 3,
    "maxStock": 20,
    "reserved": 2,
    "available": 10,
    "location": "A-12-03",
    "lastStockCheck": "2025-10-01T10:00:00Z"
  },
  
  "supplier": {
    "supplierId": "SUP001",
    "name": "Samsung Parts Europe",
    "partnerCode": "SPE-DC97",
    "deliveryTime": "24h",
    "minOrderQuantity": 1,
    "orderMultiple": 1,
    "lastOrderDate": "2025-09-25T10:30:00Z",
    "lastOrderPrice": 65
  },
  
  "installation": {
    "difficulty": "high",
    "estimatedTime": 120,
    "requiredTools": [
      "klucze do AGD",
      "ściągacz łożysk",
      "klucz dynamometryczny"
    ],
    "requiredSkills": ["mechanika AGD", "wymiana łożysk"],
    "specialRequirements": [
      "demontaż bębna",
      "wymiana jednoczesna z uszczelkami"
    ],
    "instructionsUrl": "https://docs.samsung.com/bearing-replacement"
  },
  
  "diagnostics": {
    "failureIndicators": [
      "hałas podczas wirowania",
      "wyciek wody pod pralką",
      "wibracje podczas prania",
      "zablokowany bęben"
    ],
    "relatedParts": ["PART004", "PART008"],
    "replacementFrequency": "co 5-7 lat"
  },
  
  "metadata": {
    "createdAt": "2025-09-30T12:00:00Z",
    "updatedAt": "2025-10-03T08:00:00Z",
    "createdBy": "admin",
    "popularityScore": 8.5,
    "usageCount": 145,
    "lastUsed": "2025-10-02T14:30:00Z",
    "seasonalDemand": "stable",
    "tags": ["popular", "seasonal-winter", "oem"]
  },
  
  "status": "active",
  "notes": "Zamiennik oryginalny, wysoka jakość"
}
```

### 2. **DOSTAWCA** (Supplier)

```json
{
  "id": "SUP001",
  "code": "SPE-001",
  "name": "Samsung Parts Europe",
  "fullName": "Samsung Parts Europe Distribution Sp. z o.o.",
  
  "contact": {
    "phone": "+48 22 123 45 67",
    "mobile": "+48 500 100 200",
    "email": "parts@samsung.pl",
    "website": "https://parts.samsung.pl",
    "primaryContact": {
      "name": "Jan Kowalski",
      "position": "Account Manager",
      "phone": "+48 500 100 200",
      "email": "jan.kowalski@samsung.pl"
    }
  },
  
  "address": {
    "street": "ul. Technologiczna 15",
    "city": "Warszawa",
    "postalCode": "02-234",
    "country": "Polska",
    "nip": "1234567890",
    "regon": "123456789"
  },
  
  "businessTerms": {
    "currency": "PLN",
    "paymentTerms": "30 dni",
    "paymentMethods": ["przelew", "karta", "gotówka"],
    "minOrderValue": 200,
    "deliveryFee": 15,
    "freeDeliveryFrom": 500,
    "returnPolicy": "14 dni",
    "warrantySupport": true
  },
  
  "delivery": {
    "standardDeliveryTime": "24h",
    "expressAvailable": true,
    "expressDeliveryTime": "4h",
    "deliveryDays": ["pon", "wt", "śr", "czw", "pt"],
    "cutoffTime": "14:00",
    "deliveryZones": ["cała Polska"],
    "courierServices": ["DPD", "InPost", "własny kurier"]
  },
  
  "discounts": {
    "volumeDiscounts": [
      { "from": 1000, "discount": 5 },
      { "from": 5000, "discount": 10 },
      { "from": 10000, "discount": 15 }
    ],
    "loyaltyDiscount": 3,
    "seasonalPromotions": []
  },
  
  "specialties": [
    "Samsung OEM parts",
    "części do pralek",
    "części do zmywarek",
    "szybka dostawa"
  ],
  
  "statistics": {
    "totalOrders": 245,
    "totalValue": 125000,
    "averageOrderValue": 510.20,
    "averageDeliveryTime": "22h",
    "reliabilityScore": 9.2,
    "lastOrderDate": "2025-10-01T10:00:00Z"
  },
  
  "metadata": {
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2025-10-03T08:00:00Z",
    "status": "active",
    "rating": 4.8,
    "notes": "Główny dostawca części Samsung"
  }
}
```

### 3. **ZAMÓWIENIE CZĘŚCI** (Parts Order)

```json
{
  "id": "PO-2025-10-001",
  "orderNumber": "ZC/2025/10/001",
  "type": "supplier_order",
  
  "supplier": {
    "id": "SUP001",
    "name": "Samsung Parts Europe"
  },
  
  "items": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 5,
      "unitPrice": 65,
      "totalPrice": 325,
      "expectedDelivery": "2025-10-04"
    },
    {
      "partId": "PART004",
      "partNumber": "DC63-00563A",
      "name": "Uszczelka drzwi pralki",
      "quantity": 10,
      "unitPrice": 45,
      "totalPrice": 450,
      "expectedDelivery": "2025-10-04"
    }
  ],
  
  "summary": {
    "subtotal": 775,
    "deliveryFee": 0,
    "tax": 178.25,
    "total": 953.25,
    "currency": "PLN"
  },
  
  "status": "pending",
  "statusHistory": [
    {
      "status": "draft",
      "timestamp": "2025-10-03T09:00:00Z",
      "user": "admin"
    },
    {
      "status": "pending",
      "timestamp": "2025-10-03T09:15:00Z",
      "user": "admin",
      "notes": "Zamówienie wysłane do dostawcy"
    }
  ],
  
  "dates": {
    "created": "2025-10-03T09:00:00Z",
    "sent": "2025-10-03T09:15:00Z",
    "expectedDelivery": "2025-10-04T10:00:00Z",
    "delivered": null
  },
  
  "deliveryInfo": {
    "method": "kurier",
    "address": "ul. Serwisowa 10, Kraków",
    "trackingNumber": null
  },
  
  "createdBy": "admin",
  "notes": "Pilne zamówienie - niski stan magazynowy",
  "internalReference": "ORDER-1024"
}
```

### 4. **REZERWACJA CZĘŚCI** (Part Reservation)

```json
{
  "id": "RES-2025-10-001",
  "partId": "PART001",
  "partNumber": "DC97-16151A",
  "quantity": 2,
  
  "order": {
    "orderId": "ORD1024",
    "orderNumber": "ORDA25271024",
    "deviceType": "Pralka Samsung",
    "clientName": "Jan Kowalski"
  },
  
  "employee": {
    "id": "EMP001",
    "name": "Adam Nowak"
  },
  
  "status": "reserved",
  "reservedAt": "2025-10-03T10:00:00Z",
  "reservedBy": "EMP001",
  "expiresAt": "2025-10-05T10:00:00Z",
  
  "usage": {
    "used": false,
    "usedQuantity": 0,
    "usedAt": null,
    "returned": false,
    "returnedQuantity": 0
  },
  
  "notes": "Części do wymiany łożyska"
}
```

### 5. **RUCH MAGAZYNOWY** (Stock Movement)

```json
{
  "id": "SM-2025-10-001",
  "type": "in",
  
  "part": {
    "partId": "PART001",
    "partNumber": "DC97-16151A",
    "name": "Łożysko bębna Samsung"
  },
  
  "quantity": 5,
  "previousStock": 7,
  "newStock": 12,
  
  "reason": "supplier_delivery",
  "reference": {
    "type": "supplier_order",
    "id": "PO-2025-10-001",
    "number": "ZC/2025/10/001"
  },
  
  "details": {
    "supplier": "Samsung Parts Europe",
    "unitPrice": 65,
    "totalValue": 325,
    "invoiceNumber": "FV/2025/10/12345"
  },
  
  "location": "A-12-03",
  "performedBy": "admin",
  "timestamp": "2025-10-03T14:30:00Z",
  "notes": "Dostawa zgodna z zamówieniem"
}
```

---

## 🖥️ INTERFEJSY UŻYTKOWNIKA

### 1. **PANEL ADMINA - Magazyn**

#### A. **Lista części** (`/admin/magazyn`)
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Magazyn części                                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [🔍 Szukaj...] [▼ Kategoria] [▼ Marka] [⚡ Niski stan]      │
│ [+ Dodaj część] [📥 Import] [📊 Raport] [🔄 Odśwież]        │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Nr    │ Nazwa              │ Stan │ Cena │ Dostawca  │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 001   │ Łożysko Samsung   │ 12/20│ 85zł │ SPE      │   │
│ │ ⚠️    │ (DC97-16151A)     │ ⚠️2  │      │ 24h      │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 002   │ Pompa uniwersalna │ 8/15 │ 120  │ UPL      │   │
│ │ ✅    │ (DC96-01414G)     │ ✅1  │      │ 48h      │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 003   │ Pasek HTD         │ 15/20│ 35zł │ UPL      │   │
│ │ ✅    │ (6PH1871)         │ ✅0  │      │ 48h      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ 📊 Statystyki:                                               │
│ • Części: 245 | Wartość: 45,780zł | Niski stan: 12         │
└───────────────────────────────────────────────────────────────┘

Stan:  12/20 = aktualne/maksymalne
Rezerwacje: ⚠️2 = 2 zarezerwowane
```

#### B. **Szczegóły części** (`/admin/magazyn/[id]`)
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Łożysko bębna Samsung                      [✏️ Edytuj]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─ PODSTAWOWE INFORMACJE ────────────────────────────────┐  │
│ │ • Nr katalogowy: DC97-16151A                           │  │
│ │ • EAN: 8806092340565                                   │  │
│ │ • Kategoria: AGD → Pralka                              │  │
│ │ • Marka: Samsung                                       │  │
│ │ • Typ: OEM (oryginalna)                                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ KOMPATYBILNOŚĆ ───────────────────────────────────────┐  │
│ │ ✅ Samsung WW90T4540AE, WW80T4540AE, WW70T4540AE       │  │
│ │ ✅ Samsung WW90T4040CE, WW80T4040CE                    │  │
│ │ [+ Dodaj model]                                         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ MAGAZYN ──────────────────────────────────────────────┐  │
│ │ Stan magazynowy:                                        │  │
│ │ ┌─────────────────────────────────┐                    │  │
│ │ │ ████████████░░░░░░░░ 12/20      │                    │  │
│ │ └─────────────────────────────────┘                    │  │
│ │                                                          │  │
│ │ • W magazynie: 12 szt                                   │  │
│ │ • Zarezerwowane: 2 szt  [Zobacz]                       │  │
│ │ • Dostępne: 10 szt                                      │  │
│ │ • Min/Max: 3/20 szt                                     │  │
│ │ • Lokalizacja: A-12-03                                  │  │
│ │                                                          │  │
│ │ [➕ Przyjmij] [➖ Wydaj] [📋 Historia ruchów]           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ CENY I MARŻA ─────────────────────────────────────────┐  │
│ │ • Cena zakupu: 65,00 zł                                 │  │
│ │ • Cena sprzedaży: 85,00 zł                              │  │
│ │ • Marża: 30,77% (20,00 zł)                              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ DOSTAWCA ─────────────────────────────────────────────┐  │
│ │ Samsung Parts Europe (SPE-001)                          │  │
│ │ • Czas dostawy: 24h                                     │  │
│ │ • Min. zamówienie: 1 szt                                │  │
│ │ • Ostatnie zamówienie: 2025-09-25 (65 zł/szt)          │  │
│ │ [📦 Zamów więcej]                                       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ MONTAŻ ───────────────────────────────────────────────┐  │
│ │ • Trudność: ⚠️ Wysoka                                   │  │
│ │ • Czas: ~120 min                                        │  │
│ │ • Narzędzia: klucze do AGD, ściągacz łożysk...          │  │
│ │ • Uwagi: wymiana jednoczesna z uszczelkami              │  │
│ │ [📄 Instrukcja montażu]                                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ DIAGNOSTYKA ──────────────────────────────────────────┐  │
│ │ Objawy usterki:                                         │  │
│ │ • hałas podczas wirowania                               │  │
│ │ • wyciek wody pod pralką                                │  │
│ │ • wibracje podczas prania                               │  │
│ │                                                          │  │
│ │ Powiązane części: Uszczelka drzwi, Amortyzatory         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ 📊 STATYSTYKI:                                              │
│ • Użyto: 145 razy | Ostatnio: 2025-10-02                   │
│ • Popularność: 8.5/10 | Popyt: Stabilny                    │
└───────────────────────────────────────────────────────────────┘
```

#### C. **Nowe zamówienie** (`/admin/magazyn/zamowienia/nowe`)
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Nowe zamówienie części                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 1️⃣ WYBIERZ DOSTAWCĘ                                         │
│ [▼ Samsung Parts Europe (SPE-001)]                           │
│ Min. wartość: 200 zł | Darmowa dostawa: 500 zł              │
│                                                               │
│ 2️⃣ DODAJ CZĘŚCI                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Część                    │ Stan │ Ilość │ Cena │ Suma │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ Łożysko Samsung         │ 12/20│  [5] │ 65zł │ 325zł│   │
│ │ ⚠️ Niski stan - rekomendacja: 8 szt                   │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ Uszczelka drzwi         │ 4/15 │ [10] │ 45zł │ 450zł│   │
│ │ ⚠️ Krytyczny stan!                                    │   │
│ └───────────────────────────────────────────────────────┘   │
│ [+ Dodaj część] [🤖 Sugeruj zamówienie]                     │
│                                                               │
│ 3️⃣ PODSUMOWANIE                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Wartość części:     775,00 zł                          │   │
│ │ Dostawa:              0,00 zł (darmowa >500zł)        │   │
│ │ ─────────────────────────────                          │   │
│ │ Netto:              775,00 zł                          │   │
│ │ VAT (23%):          178,25 zł                          │   │
│ │ ─────────────────────────────                          │   │
│ │ RAZEM:              953,25 zł                          │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ Oczekiwana dostawa: 2025-10-04 (24h)                        │
│ Notatki: [_________________________________]                 │
│                                                               │
│ [Anuluj] [Zapisz jako draft] [📧 Wyślij zamówienie]         │
└───────────────────────────────────────────────────────────────┘
```

### 2. **PANEL SERWISANTA - Części**

#### A. **Wyszukiwanie części** (Panel pracownika lub mobile)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Części do zlecenia #ORD1024                               │
│ Pralka Samsung WW90T4540AE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🔍 [Szukaj części...]                                        │
│ [📸 Scan kodu] [🤖 Sugeruj części]                          │
│                                                               │
│ 💡 SUGEROWANE CZĘŚCI (na podstawie usterki):                │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⭐ Łożysko bębna Samsung                                │ │
│ │ DC97-16151A | 85 zł                                     │ │
│ │ ✅ Dostępne: 10 szt | Lokalizacja: A-12-03              │ │
│ │ ⚠️ Trudny montaż (~120 min)                             │ │
│ │                                                          │ │
│ │ Objawy: hałas podczas wirowania, wibracje               │ │
│ │ [ℹ️ Instrukcja] [📦 Zarezerwuj] [✅ Użyto]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Uszczelka drzwi pralki                                  │ │
│ │ DC63-00563A | 45 zł                                     │ │
│ │ ⚠️ Niski stan: 4 szt | Czas dostawy: 24h               │ │
│ │ [📦 Zarezerwuj] [🔔 Zgłoś potrzebę]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ 📋 MOJE REZERWACJE:                                          │
│ • Pasek HTD (2 szt) - wygasa za 2 dni                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### B. **Zgłoszenie zużycia** (Po zakończeniu naprawy)
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Zakończenie zlecenia #ORD1024                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🔧 UŻYTE CZĘŚCI:                                             │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Łożysko bębna Samsung (DC97-16151A)                  │ │
│ │ Ilość: [2] szt × 85 zł = 170 zł                         │ │
│ │ Status: ✅ Wymienione                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Uszczelka drzwi (DC63-00563A)                        │ │
│ │ Ilość: [1] szt × 45 zł = 45 zł                          │ │
│ │ Status: ✅ Wymienione                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [+ Dodaj część]                                              │
│                                                               │
│ ❓ CZĘŚCI NIEZUŻYTE (zwrot do magazynu):                     │
│ Brak                                                          │
│                                                               │
│ RAZEM: 215 zł (części)                                       │
│                                                               │
│ Notatki: [Wymiana przebiegła pomyślnie]                     │
│                                                               │
│ [Anuluj] [💾 Zapisz i zakończ]                              │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 PRZEPŁYWY PROCESÓW

### PROCES 1: Zamawianie nowych części

```
ADMIN                          SYSTEM                    DOSTAWCA
  │                               │                          │
  │ 1. Sprawdza stan magazynu    │                          │
  │ ──────────────────────────>  │                          │
  │                               │                          │
  │ 2. Otrzymuje alerty           │                          │
  │ < ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │                          │
  │    "12 części z niskim sta │                          │
  │                               │                          │
  │ 3. Tworzy zamówienie          │                          │
  │ ──────────────────────────>  │                          │
  │    - Wybiera dostawcę         │                          │
  │    - Dodaje części            │                          │
  │    - Potwierdza               │                          │
  │                               │                          │
  │                               │ 4. Wysyła zamówienie     │
  │                               │ ──────────────────────> │
  │                               │    (email/API)           │
  │                               │                          │
  │                               │ 5. Otrzymuje potwierdzenie
  │                               │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │                               │                          │
  │ 6. Dostawa części             │                          │
  │ <─────────────────────────────────────────────────────── │
  │                               │                          │
  │ 7. Przyjmuje dostawę          │                          │
  │ ──────────────────────────>  │                          │
  │    - Skanuje kody             │                          │
  │    - Potwierdza ilości        │                          │
  │                               │                          │
  │                               │ 8. Aktualizuje stan      │
  │                               │ ──────────────>          │
  │                               │   magazynu               │
  │                               │                          │
  │ 9. Status: Dostarczone        │                          │
  │ <──────────────────────────   │                          │
```

### PROCES 2: Rezerwacja i użycie części przez serwisanta

```
SERWISANT                      SYSTEM                    MAGAZYN
  │                               │                          │
  │ 1. Otwiera zlecenie           │                          │
  │ ──────────────────────────>  │                          │
  │    #ORD1024                   │                          │
  │                               │                          │
  │ 2. System sugeruje części     │                          │
  │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │                          │
  │    (na podstawie usterki)     │                          │
  │                               │                          │
  │ 3. Rezerwuje części           │                          │
  │ ──────────────────────────>  │                          │
  │    - Łożysko × 2              │                          │
  │    - Uszczelka × 1            │                          │
  │                               │                          │
  │                               │ 4. Sprawdza dostępność   │
  │                               │ ──────────────────────> │
  │                               │                          │
  │                               │ 5. Rezerwuje fizycznie   │
  │                               │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │                               │                          │
  │ 6. Potwierdza rezerwację      │                          │
  │ <──────────────────────────   │                          │
  │    + kod do odbioru: A12-03   │                          │
  │                               │                          │
  │ 7. Odbiera części z magazynu  │                          │
  │ ───────────────────────────────────────────────────────> │
  │    (skan kodu QR)             │                          │
  │                               │                          │
  │ 8. Wykonuje naprawę           │                          │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ >  │                          │
  │                               │                          │
  │ 9. Zgłasza zużycie            │                          │
  │ ──────────────────────────>  │                          │
  │    - Użyto: Łożysko × 2       │                          │
  │    - Użyto: Uszczelka × 1     │                          │
  │                               │                          │
  │                               │ 10. Aktualizuje stan     │
  │                               │ ──────────────────────> │
  │                               │     magazynu             │
  │                               │                          │
  │                               │ 11. Dodaje do faktury    │
  │                               │ ──────────────>          │
  │                               │     zlecenia             │
  │                               │                          │
  │ 12. Zakończenie + raport      │                          │
  │ <──────────────────────────   │                          │
```

### PROCES 3: Automatyczne alertowanie o niskim stanie

```
SYSTEM (CRON JOB)              ADMIN                    EMAIL/NOTIF
  │                               │                          │
  │ 1. Sprawdza stan (codziennie │                          │
  │    o 8:00)                    │                          │
  │                               │                          │
  │ 2. Wykrywa niskie stany       │                          │
  │    - PART001: 2/20 (min: 3)   │                          │
  │    - PART004: 1/15 (min: 5)   │                          │
  │                               │                          │
  │ 3. Generuje alert             │                          │
  │ ──────────────────────────>  │                          │
  │                               │                          │
  │                               │ 4. Wysyła notyfikację    │
  │                               │ ──────────────────────> │
  │                               │    📧 Email              │
  │                               │    🔔 Push notification  │
  │                               │                          │
  │                               │ 5. Otwiera dashboard     │
  │                               │ <──────────────────────  │
  │                               │                          │
  │ 6. Pokazuje listę alertów     │                          │
  │ <──────────────────────────   │                          │
  │                               │                          │
  │                               │ 7. Tworzy zamówienie     │
  │                               │ ──────────────────────> │
  │                               │    lub oznacza jako      │
  │                               │    "do zamówienia"       │
```

---

## 🔌 API ENDPOINTS

### 1. **CZĘŚCI** (`/api/inventory/parts`)

#### GET `/api/inventory/parts`
Pobiera listę wszystkich części z filtrowaniem

**Query params:**
- `search` - wyszukiwanie po nazwie/nr katalogowym
- `category` - filtr po kategorii (AGD, IT, etc.)
- `subcategory` - podkategoria (Pralka, Zmywarka, etc.)
- `brand` - filtr po marce
- `lowStock` - tylko części z niskim stanem (boolean)
- `available` - tylko dostępne (boolean)
- `page`, `limit` - paginacja

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "category": "AGD",
      "inventory": {
        "inStock": 12,
        "available": 10,
        "reserved": 2
      },
      "pricing": {
        "retailPrice": 85
      },
      "supplier": {
        "name": "Samsung Parts Europe",
        "deliveryTime": "24h"
      }
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "pages": 13,
    "limit": 20
  }
}
```

#### GET `/api/inventory/parts/:id`
Pobiera szczegóły pojedynczej części

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "PART001",
    "partNumber": "DC97-16151A",
    "name": "Łożysko bębna Samsung",
    // ... pełna struktura części
  }
}
```

#### POST `/api/inventory/parts`
Dodaje nową część do magazynu

**Body:**
```json
{
  "partNumber": "NEW-PART-001",
  "name": "Nazwa części",
  "category": "AGD",
  "subcategory": "Pralka",
  "pricing": {
    "purchasePrice": 50,
    "retailPrice": 75
  },
  "inventory": {
    "inStock": 10,
    "minStock": 3,
    "maxStock": 20
  },
  "supplier": {
    "supplierId": "SUP001"
  }
}
```

#### PUT `/api/inventory/parts/:id`
Aktualizuje część

#### DELETE `/api/inventory/parts/:id`
Usuwa część (soft delete - zmienia status na inactive)

---

### 2. **REZERWACJE** (`/api/inventory/reservations`)

#### GET `/api/inventory/reservations`
Lista rezerwacji z filtrami

**Query params:**
- `employeeId` - rezerwacje konkretnego pracownika
- `orderId` - rezerwacje dla zlecenia
- `status` - reserved, used, expired, cancelled
- `partId` - rezerwacje konkretnej części

#### POST `/api/inventory/reservations`
Tworzy rezerwację części

**Body:**
```json
{
  "partId": "PART001",
  "quantity": 2,
  "orderId": "ORD1024",
  "employeeId": "EMP001",
  "notes": "Do wymiany łożyska",
  "expiresIn": 48
}
```

**Response:**
```json
{
  "success": true,
  "reservation": {
    "id": "RES-2025-10-001",
    "partId": "PART001",
    "quantity": 2,
    "status": "reserved",
    "expiresAt": "2025-10-05T10:00:00Z",
    "pickupCode": "A12-03-RES001"
  }
}
```

#### PUT `/api/inventory/reservations/:id/use`
Oznacza część jako użytą

**Body:**
```json
{
  "usedQuantity": 2,
  "returnedQuantity": 0,
  "notes": "Wymieniono pomyślnie"
}
```

---

### 3. **RUCHY MAGAZYNOWE** (`/api/inventory/movements`)

#### GET `/api/inventory/movements`
Historia ruchów magazynowych

**Query params:**
- `partId` - ruchy konkretnej części
- `type` - in, out, adjustment, reservation
- `dateFrom`, `dateTo` - zakres dat

#### POST `/api/inventory/movements`
Rejestruje ruch magazynowy

**Body:**
```json
{
  "type": "in",
  "partId": "PART001",
  "quantity": 5,
  "reason": "supplier_delivery",
  "reference": {
    "type": "supplier_order",
    "id": "PO-2025-10-001"
  },
  "details": {
    "supplier": "Samsung Parts Europe",
    "unitPrice": 65,
    "invoiceNumber": "FV/2025/10/12345"
  }
}
```

---

### 4. **ZAMÓWIENIA U DOSTAWCÓW** (`/api/inventory/supplier-orders`)

#### GET `/api/inventory/supplier-orders`
Lista zamówień

**Query params:**
- `supplierId`
- `status` - draft, pending, sent, delivered, cancelled

#### POST `/api/inventory/supplier-orders`
Tworzy nowe zamówienie

**Body:**
```json
{
  "supplierId": "SUP001",
  "items": [
    {
      "partId": "PART001",
      "quantity": 5
    },
    {
      "partId": "PART004",
      "quantity": 10
    }
  ],
  "notes": "Pilne zamówienie"
}
```

#### PUT `/api/inventory/supplier-orders/:id/status`
Zmienia status zamówienia

**Body:**
```json
{
  "status": "delivered",
  "deliveryDate": "2025-10-04T10:00:00Z",
  "receivedBy": "admin"
}
```

---

### 5. **DOSTAWCY** (`/api/inventory/suppliers`)

#### GET `/api/inventory/suppliers`
Lista dostawców

#### GET `/api/inventory/suppliers/:id`
Szczegóły dostawcy

#### POST `/api/inventory/suppliers`
Dodaje dostawcę

#### PUT `/api/inventory/suppliers/:id`
Aktualizuje dostawcę

---

### 6. **SUGESTIE** (`/api/inventory/suggestions`)

#### POST `/api/inventory/suggestions/parts`
Sugeruje części na podstawie usterki/urządzenia

**Body:**
```json
{
  "deviceType": "Pralka",
  "brand": "Samsung",
  "model": "WW90T4540AE",
  "symptoms": [
    "hałas podczas wirowania",
    "wibracje"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "partId": "PART001",
      "name": "Łożysko bębna Samsung",
      "confidence": 0.95,
      "reason": "Objawy pasują do uszkodzenia łożyska",
      "availability": "available",
      "inStock": 10
    },
    {
      "partId": "PART005",
      "name": "Amortyzator pralki",
      "confidence": 0.75,
      "reason": "Wibracje mogą wskazywać na amortyzatory"
    }
  ]
}
```

#### POST `/api/inventory/suggestions/reorder`
Sugeruje co zamówić (AI/algorytm)

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "currentStock": 2,
      "minStock": 3,
      "suggestedQuantity": 8,
      "reason": "Niski stan + wysoka popularność (użyto 15 razy w ostatnim miesiącu)",
      "estimatedCost": 520,
      "priority": "high"
    }
  ],
  "totalEstimatedCost": 1250,
  "recommendedSupplier": "SUP001"
}
```

---

## 📅 PLAN IMPLEMENTACJI

### FAZA 1: BACKEND (2-3 dni) ⭐ PRIORYTET

#### Dzień 1: Podstawowa struktura
- [ ] Utworzenie struktury bazy danych (rozszerzenie `parts-inventory.json`)
- [ ] API endpoints - CRUD dla części
- [ ] API endpoints - dostawcy
- [ ] Helper functions (obliczanie dostępności, marży, etc.)

#### Dzień 2: Logika biznesowa
- [ ] System rezerwacji części
- [ ] Ruchy magazynowe
- [ ] Zamówienia u dostawców
- [ ] Automatyczne alertowanie o niskim stanie

#### Dzień 3: Integracje
- [ ] Powiązanie z zamówieniami serwisowymi
- [ ] Dodawanie części do faktury
- [ ] System sugestii (AI - proste reguły)
- [ ] Raporty i statystyki

---

### FAZA 2: PANEL ADMINA (2-3 dni)

#### Dzień 4: Widoki podstawowe
- [ ] `/admin/magazyn` - lista części
- [ ] `/admin/magazyn/[id]` - szczegóły części
- [ ] `/admin/magazyn/nowa` - dodawanie części
- [ ] Filtrowanie i wyszukiwanie

#### Dzień 5: Zarządzanie
- [ ] Przyjmowanie dostaw
- [ ] Historia ruchów magazynowych
- [ ] Zarządzanie rezerwacjami
- [ ] Dashboard magazynu (statystyki)

#### Dzień 6: Zamówienia
- [ ] `/admin/magazyn/zamowienia` - lista zamówień
- [ ] `/admin/magazyn/zamowienia/nowe` - nowe zamówienie
- [ ] Zarządzanie dostawcami
- [ ] Auto-sugestie zamówień

---

### FAZA 3: PANEL SERWISANTA (1-2 dni)

#### Dzień 7: Funkcje dla pracowników
- [ ] Wyszukiwanie części w panelu pracownika
- [ ] Rezerwacja części do zlecenia
- [ ] Zgłaszanie zużycia części
- [ ] Historia używanych części

#### Dzień 8: Integracja mobilna
- [ ] Dodanie sekcji części w AGD Mobile
- [ ] Skanowanie kodów QR/EAN
- [ ] Sugestie części AI (inline w zleceniu)
- [ ] Quick actions (szybki dostęp)

---

### FAZA 4: ZAAWANSOWANE (1-2 dni - opcjonalne)

#### Dzień 9-10: Dodatkowe funkcje
- [ ] Generator kodów QR dla części
- [ ] Export raportów do PDF/Excel
- [ ] System powiadomień (email + push)
- [ ] Dashboard analityczny
- [ ] Integracja z dostawcami (API)
- [ ] Przewidywanie zapotrzebowania (ML)

---

## 🎯 KLUCZOWE FUNKCJE DO IMPLEMENTACJI

### 🔥 MUST HAVE (Faza 1-2)
1. ✅ Podstawowy CRUD części
2. ✅ System rezerwacji
3. ✅ Śledzenie stanów magazynowych
4. ✅ Zamówienia u dostawców
5. ✅ Powiązanie z zleceniami serwisowymi
6. ✅ Alerty o niskim stanie

### ⭐ NICE TO HAVE (Faza 3)
7. Sugestie części na podstawie usterki
8. Historia używanych części per serwisant
9. Raporty wykorzystania
10. Auto-reordering (sugestie co zamówić)

### 💡 FUTURE (Faza 4)
11. Integracja API z dostawcami
12. Machine Learning - przewidywanie zapotrzebowania
13. Mobilny skaner kodów kreskowych
14. System punktów magazynowych (lokalizacje fizyczne)

---

## 📊 METRYKI SUKCESU

Po wdrożeniu systemu magazynu:

1. **Efektywność operacyjna**
   - Czas wyszukania części: < 30 sek
   - Czas rezerwacji: < 2 min
   - Czas zamówienia u dostawcy: < 10 min

2. **Redukcja kosztów**
   - Redukcja brakujących części: -80%
   - Redukcja nadmiarowych zapasów: -30%
   - Optymalizacja zamówień: oszczędność 15-20%

3. **Zadowolenie użytkowników**
   - Serwisanci: szybki dostęp do części
   - Admin: pełna kontrola i widoczność
   - Klienci: szybsze naprawy (mniej czekania na części)

---

## 🚀 KOLEJNE KROKI

### DO ZATWIERDZENIA:
1. ✅ Czy struktura danych jest OK?
2. ✅ Czy interfejsy odpowiadają potrzebom?
3. ✅ Czy proces rezerwacji jest intuicyjny?
4. ✅ Jakie funkcje są najbardziej priorytetowe?

### DO USTALENIA:
1. Czy mamy fizyczne lokalizacje w magazynie (A-12-03)?
2. Czy będziemy skanować kody kreskowe (QR/EAN)?
3. Czy mamy już kody dostawców/umowy?
4. Jaki jest budżet na initial stock?

---

**Gotowe do implementacji!** 🎉

Co myślisz o tym projekcie? Czy mamy zacząć implementację? 
Które fazy są najważniejsze w pierwszej kolejności?
