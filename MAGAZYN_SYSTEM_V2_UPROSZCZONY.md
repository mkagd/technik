# 📦 SYSTEM MAGAZYNOWY V2 - MODEL UPROSZCZONY
## System dla serwisu AGD z logistykiem i magazynami osobistymi

**Data:** 2025-10-03  
**Wersja:** 2.0 (uproszczona - bez centralnego magazynu)

---

## 🎯 KLUCZOWE ZMIANY vs V1

### ❌ CO USUWAMY:
- ~~Centralny magazyn fizyczny z półkami~~
- ~~System rezerwacji części~~
- ~~Serwisant odbiera z magazynu~~
- ~~Wielokrotne zamówienia dziennie~~

### ✅ CO DODAJEMY:
- **Logistyk** - dedykowany pracownik zarządzający zamówieniami
- **Magazyny osobiste** - każdy serwisant ma części w swoim samochodzie
- **OCR tabliczki znamionowej** - AI automatycznie rozpoznaje model urządzenia
- **Zbiorcze zamówienie** - logistyk zamawia raz dziennie (15-16)
- **Integracja ze zleceniami** - serwisant dodaje części bezpośrednio podczas wizyty

---

## 👥 ROLE W SYSTEMIE

### 1. **LOGISTYK** (Jan Kowalski)
**Obowiązki:**
- ✅ Odbiera zamówienia od serwisantów (do ~15:00)
- ✅ Konsoliduje zamówienia i wysyła do dostawców (~15-16)
- ✅ Odbiera dostawy i przypisuje do serwisantów
- ✅ Zarządza stanem magazynów osobistych
- ✅ Monitoruje trendy i uzupełnia braki

**Konto:** `logistyk@firma.pl` - rola: `LOGISTYK`

### 2. **SERWISANT** (Adam, Tomek, Marek...)
**Obowiązki:**
- ✅ Ma swój magazyn osobisty (części w samochodzie)
- ✅ Podczas wizyty robi zdjęcie tabliczki znamionowej
- ✅ System AI rozpoznaje model i sugeruje części
- ✅ Zamawia brakujące części u logistyka
- ✅ Dodaje użyte części do zlecenia z własnego magazynu

**Konta:** role: `SERWISANT`

### 3. **ADMIN** (Anna)
**Obowiązki:**
- ✅ Pełny dostęp do systemu
- ✅ Raporty i analizy
- ✅ Zarządzanie pracownikami
- ✅ Konfiguracja systemu

---

## 📊 STRUKTURY DANYCH

### 1. **PersonalInventory** (Magazyn osobisty serwisanta)

```json
{
  "id": "PI-001",
  "employeeId": "EMP001",
  "employeeName": "Adam Nowak",
  "vehicle": "Ford Transit - KR 12345",
  "parts": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 2,
      "assignedDate": "2025-10-01T10:00:00Z",
      "assignedBy": "LOG001", // Logistyk który przydzielił
      "location": "Schowek przedni", // Opcjonalne - gdzie w aucie
      "status": "available" // available, used, damaged
    },
    {
      "partId": "PART005",
      "partNumber": "DC66-00343A",
      "name": "Amortyzator pralki",
      "quantity": 4,
      "assignedDate": "2025-09-28T14:30:00Z",
      "assignedBy": "LOG001",
      "location": "Schowek boczny lewy",
      "status": "available"
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

### 2. **PartRequest** (Zamówienie serwisanta do logistyka)

```json
{
  "id": "PR-2025-10-001",
  "requestedBy": "EMP001", // Serwisant
  "requestedByName": "Adam Nowak",
  "orderId": "ORD1024", // Zlecenie dla którego potrzebna część
  "client": "Pani Kowalska",
  "urgency": "tomorrow", // today, tomorrow, this_week
  "requestDate": "2025-10-03T11:30:00Z",
  "requestedParts": [
    {
      "partId": "PART002",
      "partNumber": "DC96-01414G",
      "name": "Pompa odpływowa",
      "quantity": 1,
      "reason": "Wymiana podczas naprawy pralki",
      "deviceModel": "Samsung WW90T4540AE", // Z OCR tabliczki
      "detectedByAI": true, // Czy AI wykryło model
      "compatibilityConfirmed": true
    }
  ],
  "status": "pending", // pending, approved, ordered, delivered, completed
  "notes": "Potrzebuję na jutro rano, wizyta o 10:00",
  
  // Obsługa przez logistyka
  "reviewedBy": "LOG001",
  "reviewedAt": "2025-10-03T14:00:00Z",
  "approvalNotes": "Zamawiam dzisiaj o 15:30, dostawa jutro rano",
  
  // Realizacja
  "supplierOrderId": "SO-2025-10-003", // Zamówienie u dostawcy
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
  "supplier": {
    "id": "SUP001",
    "name": "Samsung Parts Europe",
    "code": "SPE-001",
    "contact": "parts@samsung.pl"
  },
  "items": [
    {
      "partId": "PART002",
      "partNumber": "DC96-01414G",
      "name": "Pompa odpływowa",
      "quantity": 3, // Suma dla 3 serwisantów
      "unitPrice": 90.00,
      "totalPrice": 270.00,
      "requestIds": ["PR-2025-10-001", "PR-2025-10-002"], // Które zamówienia serwisantów
      "assignTo": [
        { "employeeId": "EMP001", "quantity": 1 },
        { "employeeId": "EMP002", "quantity": 2 }
      ]
    },
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 5,
      "unitPrice": 65.00,
      "totalPrice": 325.00,
      "requestIds": ["PR-2025-10-003"],
      "assignTo": [
        { "employeeId": "EMP001", "quantity": 2 },
        { "employeeId": "EMP003", "quantity": 3 }
      ]
    }
  ],
  "totalValue": 595.00,
  "totalValueWithVAT": 731.85,
  "status": "ordered", // draft, ordered, confirmed, partially_delivered, delivered, completed
  "expectedDelivery": "2025-10-04T08:00:00Z",
  "actualDelivery": null,
  "invoice": {
    "number": "FV/2025/10/45678",
    "amount": 731.85,
    "paid": false
  }
}
```

### 4. **PartUsage** (Użycie części przez serwisanta)

```json
{
  "id": "PU-2025-10-001",
  "employeeId": "EMP001",
  "employeeName": "Adam Nowak",
  "orderId": "ORD1024",
  "client": "Pani Kowalska",
  "usageDate": "2025-10-03T14:30:00Z",
  "parts": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "quantity": 2,
      "unitPrice": 85.00,
      "totalPrice": 170.00,
      "fromPersonalInventory": true,
      "installedSuccessfully": true,
      "waranty": "12 months"
    }
  ],
  "totalValue": 170.00,
  "addedToInvoice": true,
  "invoiceId": "FV/2025/10/125"
}
```

### 5. **DevicePlateOCR** (Rozpoznana tabliczka znamionowa)

```json
{
  "id": "OCR-2025-10-001",
  "orderId": "ORD1024",
  "employeeId": "EMP001",
  "photoUrl": "/uploads/plates/ORD1024_plate.jpg",
  "capturedAt": "2025-10-03T11:00:00Z",
  
  // Dane rozpoznane przez AI
  "ocrResult": {
    "success": true,
    "confidence": 0.95,
    "brand": "Samsung",
    "model": "WW90T4540AE",
    "serialNumber": "1234567890ABC",
    "productionDate": "2023-05",
    "power": "2200W",
    "voltage": "230V",
    "capacity": "9 kg"
  },
  
  // Dane ręcznie poprawione (jeśli AI się pomyliło)
  "manualCorrection": null,
  
  // Sugerowane części na podstawie modelu
  "suggestedParts": [
    {
      "partId": "PART001",
      "partNumber": "DC97-16151A",
      "name": "Łożysko bębna Samsung",
      "compatibility": 100,
      "reason": "Kompatybilne z modelem WW90T4540AE",
      "inPersonalInventory": true, // Czy serwisant ma w aucie
      "quantity": 2
    },
    {
      "partId": "PART007",
      "partNumber": "DC93-00155A",
      "name": "Grzałka pralki Samsung 2000W",
      "compatibility": 95,
      "reason": "Pasuje do większości modeli WW90*",
      "inPersonalInventory": false,
      "needToOrder": true
    }
  ]
}
```

---

## 🔄 PRZEPŁYWY PROCESÓW

### PROCES 1: Serwisant w terenie - wymiana części

```
┌─────────────────────────────────────────────────────────┐
│ 1. SERWISANT NA MIEJSCU U KLIENTA                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. OTWIERA ZLECENIE #ORD1024 w AGD Mobile              │
│    • Pralka Samsung - hałas podczas wirowania           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. OBOWIĄZEK: Robi zdjęcie tabliczki znamionowej       │
│    📸 [Zrób zdjęcie tabliczki] <-- przycisk             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. AI ANALIZUJE ZDJĘCIE (OCR)                          │
│    ⏳ Rozpoznawanie modelu...                           │
│    ✅ Samsung WW90T4540AE (zaufanie: 95%)              │
│    [✓ Potwierdzam] [✏️ Popraw ręcznie]                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. SYSTEM SUGERUJE CZĘŚCI                              │
│    💡 Na podstawie modelu i objawów:                    │
│                                                         │
│    ⭐⭐⭐ Łożysko bębna Samsung                         │
│    • DC97-16151A | 85 zł                               │
│    • ✅ MASZ W AUCIE: 2 szt                            │
│    • Dopasowanie: 100%                                 │
│    [➕ Użyj z mojego magazynu]                         │
│                                                         │
│    ⭐⭐ Amortyzator pralki                             │
│    • DC66-00343A | 45 zł                               │
│    • ✅ MASZ W AUCIE: 4 szt                            │
│    [➕ Użyj]                                            │
│                                                         │
│    ⭐ Grzałka 2000W                                     │
│    • DC93-00155A | 120 zł                              │
│    • ❌ BRAK w Twoim magazynie                         │
│    [🛒 Zamów u logistyka]                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 6. SERWISANT DIAGNOZUJE I WYBIERA                      │
│    Stwierdza: "Potrzebuję łożysko"                     │
│    Klika: [➕ Użyj z mojego magazynu]                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 7. DODANIE DO ZLECENIA                                 │
│    ✅ Dodano do zlecenia:                              │
│    • Łożysko bębna Samsung × 2 szt = 170 zł           │
│    • Źródło: Twój magazyn osobisty                     │
│                                                         │
│    Twój magazyn po użyciu:                             │
│    • Łożysko: 2 → 0 szt (❌ brak)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 8. WYKONANIE NAPRAWY                                   │
│    Serwisant wymienia łożysko...                       │
│    Status: ✅ Wymienione pomyślnie                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 9. ZAKOŃCZENIE ZLECENIA                                │
│    Zlecenie #ORD1024                                   │
│    • Robocizna: 180 zł                                 │
│    • Części: 170 zł (Łożysko × 2)                      │
│    • Razem: 350 zł + VAT = 430,50 zł                   │
│                                                         │
│    [💾 Zakończ i wygeneruj fakturę]                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 10. SYSTEM AUTOMATYCZNIE:                              │
│     ✅ Odejmuje części z magazynu osobistego           │
│     ✅ Tworzy wpis PartUsage                           │
│     ✅ Dodaje do faktury                               │
│     ✅ Wysyła notyfikację do logistyka:                │
│        "Adam użył ostatnie 2 łożyska - uzupełnić!"    │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 2: Zamówienie brakującej części u logistyka

```
┌─────────────────────────────────────────────────────────┐
│ 1. SERWISANT: "Nie mam tej części w aucie"            │
│    Klika: [🛒 Zamów u logistyka]                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. FORMULARZ ZAMÓWIENIA                                │
│    ┌─────────────────────────────────────────────┐    │
│    │ 🛒 ZAMÓWIENIE CZĘŚCI                        │    │
│    │                                             │    │
│    │ Część: Pompa odpływowa (DC96-01414G)       │    │
│    │ Ilość: [1] szt                             │    │
│    │                                             │    │
│    │ Kiedy potrzebujesz?                        │    │
│    │ ○ Dziś (pilne)                             │    │
│    │ ● Jutro rano ✓                             │    │
│    │ ○ W tym tygodniu                           │    │
│    │                                             │    │
│    │ Do zlecenia: #ORD1025                      │    │
│    │ Klient: Pan Nowak                          │    │
│    │                                             │    │
│    │ Notatka:                                   │    │
│    │ [Potrzebuję na jutro o 10, wizyta u...   ]│    │
│    │                                             │    │
│    │ [Anuluj] [📤 Wyślij do logistyka]         │    │
│    └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. POTWIERDZENIE                                       │
│    ✅ Zamówienie wysłane!                              │
│    Nr: PR-2025-10-001                                  │
│                                                         │
│    Logistyk zamówi dzisiaj ok. 15-16                   │
│    Dostawa: jutro rano                                 │
│                                                         │
│    [📋 Moje zamówienia]                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. LOGISTYK OTRZYMUJE NOTYFIKACJĘ                      │
│    🔔 Nowe zamówienie od Adam Nowak                    │
│    • Pompa odpływowa × 1 szt                           │
│    • Pilność: jutro rano                               │
│    • Do zlecenia: #ORD1025                             │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 3: Logistyk zbiera i składa zbiorcze zamówienie

```
┌─────────────────────────────────────────────────────────┐
│ LOGISTYK - PANEL GŁÓWNY (godz. 14:30)                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 📋 ZAMÓWIENIA OD SERWISANTÓW (Dzisiaj)                 │
│                                                         │
│ ⏰ Deadline: 15:00 (przyjmuję zamówienia)              │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ✅ PR-001 | Adam Nowak | 11:30                │     │
│ │    • Pompa odpływowa × 1                      │     │
│ │    • Pilność: jutro rano                      │     │
│ │    [✓ Zatwierdzone]                           │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ⏳ PR-002 | Tomek Wiśniewski | 13:15          │     │
│ │    • Pompa odpływowa × 2                      │     │
│ │    • Łożysko Samsung × 1                      │     │
│ │    • Pilność: dziś wieczorem (PILNE!)         │     │
│ │    [✓ Zatwierdź] [❌ Odrzuć]                  │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ ⏳ PR-003 | Marek Kowal | 14:00               │     │
│ │    • Grzałka 2000W × 1                        │     │
│ │    • Pilność: w tym tygodniu                  │     │
│ │    [✓ Zatwierdź]                              │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ Razem: 3 zamówienia | 6 części                        │
│                                                         │
│ [🛒 Utwórz zbiorcze zamówienie] <--- godz. ~15:30     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ SYSTEM AUTOMATYCZNIE KONSOLIDUJE                       │
│                                                         │
│ 📦 ZBIORCZE ZAMÓWIENIE - Draft                         │
│                                                         │
│ Dostawca: Samsung Parts Europe                         │
│ Data: 2025-10-03 15:30                                 │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ Część              │ Ilość │ Cena │ Dla kogo │     │
│ ├───────────────────────────────────────────────┤     │
│ │ Pompa odpływowa    │  3×   │ 270  │ Adam(1)  │     │
│ │ (DC96-01414G)      │       │      │ Tomek(2) │     │
│ │                                                │     │
│ │ Łożysko Samsung    │  1×   │  65  │ Tomek(1) │     │
│ │ (DC97-16151A)      │       │      │          │     │
│ │                                                │     │
│ │ Grzałka 2000W      │  1×   │ 120  │ Marek(1) │     │
│ │ (DC93-00155A)      │       │      │          │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ Wartość: 455 zł + VAT = 559,65 zł                      │
│ Dostawa: jutro 08:00                                   │
│                                                         │
│ 💡 Sugestia: Dodaj 2× łożyska na zapas (+130 zł)      │
│    Ostatnio zużycie: 5 szt/tydzień                     │
│                                                         │
│ [Edytuj] [📧 Wyślij do dostawcy]                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ ZAMÓWIENIE WYSŁANE!                                 │
│    SO-2025-10-003                                      │
│                                                         │
│    Email wysłany do: parts@samsung.pl                  │
│    Potwierdzenie: Oczekiwane za ~30 min               │
│    Dostawa: jutro 08:00                                │
│                                                         │
│    📧 Powiadomienia wysłane do serwisantów             │
└─────────────────────────────────────────────────────────┘
```

---

### PROCES 4: Odbiór i przydzielenie części

```
┌─────────────────────────────────────────────────────────┐
│ NASTĘPNEGO DNIA - 08:00                                │
│ 🚚 Dostawa od Samsung Parts Europe                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ LOGISTYK: PANEL PRZYJĘCIA DOSTAWY                      │
│                                                         │
│ 📦 SO-2025-10-003                                      │
│                                                         │
│ ┌───────────────────────────────────────────────┐     │
│ │ Część              │ Zamówione │ Dostarczone │     │
│ ├───────────────────────────────────────────────┤     │
│ │ Pompa odpływowa    │    3      │   [3]   ✅  │     │
│ │ Łożysko Samsung    │    1      │   [1]   ✅  │     │
│ │ Grzałka 2000W      │    1      │   [1]   ✅  │     │
│ └───────────────────────────────────────────────┘     │
│                                                         │
│ [✅ Potwierdź odbiór - Przydziel serwisantom]          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ AUTOMATYCZNE PRZYDZIELENIE                             │
│                                                         │
│ System przydziela części zgodnie z zamówieniami:       │
│                                                         │
│ ✅ Adam Nowak:                                         │
│    • Pompa odpływowa × 1 → Magazyn osobisty           │
│                                                         │
│ ✅ Tomek Wiśniewski:                                   │
│    • Pompa odpływowa × 2 → Magazyn osobisty           │
│    • Łożysko Samsung × 1 → Magazyn osobisty           │
│                                                         │
│ ✅ Marek Kowal:                                        │
│    • Grzałka 2000W × 1 → Magazyn osobisty             │
│                                                         │
│ 📧 Push notyfikacje wysłane do wszystkich              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ SERWISANCI ODBIERAJĄ (lub dostawa do aut)             │
│                                                         │
│ Adam otwiera AGD Mobile:                               │
│ 🔔 Nowa część w Twoim magazynie!                       │
│    • Pompa odpływowa × 1 szt                           │
│    • Do zlecenia: #ORD1025                             │
│    • Odbiór: Baza / Dostarczone do auta               │
│                                                         │
│ [📦 Zobacz mój magazyn]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🖥️ INTERFEJSY UŻYTKOWNIKA

### PANEL LOGISTYKA `/admin/logistyk`

#### Widok główny:
```
┌──────────────────────────────────────────────────────────────┐
│ 👤 Jan Kowalski (Logistyk)                    [⚙️] [🔔] [👤]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📋 PANEL LOGISTYKA                                          │
│                                                              │
│ ┌─ DZISIEJSZE ZAMÓWIENIA ────────────────────────────────┐  │
│ │                                                         │  │
│ │ ⏰ Deadline: 15:00 (za 32 minuty)                      │  │
│ │                                                         │  │
│ │ Status: 🟢 3 zamówienia oczekujące | 2 zatwierdzone    │  │
│ │                                                         │  │
│ │ ┌─────────────────────────────────────────────────┐   │  │
│ │ │ ⏳ NOWE | 13:45 | Adam Nowak                    │   │  │
│ │ │ • Pompa odpływowa × 1                           │   │  │
│ │ │ • Pilność: jutro rano                           │   │  │
│ │ │ • Do: #ORD1025 - Pan Nowak                      │   │  │
│ │ │ [✓ Zatwierdź] [❌ Odrzuć] [💬 Komentarz]        │   │  │
│ │ └─────────────────────────────────────────────────┘   │  │
│ │                                                         │  │
│ │ ┌─────────────────────────────────────────────────┐   │  │
│ │ │ ⏳ NOWE | 14:10 | Tomek Wiśniewski              │   │  │
│ │ │ • Grzałka 2000W × 1 (🔴 PILNE - dziś!)         │   │  │
│ │ │ [✓ Zatwierdź] [❌ Odrzuć]                       │   │  │
│ │ └─────────────────────────────────────────────────┘   │  │
│ │                                                         │  │
│ │ [👁️ Zobacz wszystkie (5)] [🛒 Utwórz zamówienie]     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ ZAMÓWIENIA U DOSTAWCÓW ───────────────────────────────┐  │
│ │                                                         │  │
│ │ 🚚 W DOSTAWIE (1)                                      │  │
│ │ SO-2025-10-002 | Samsung | Dostawa: jutro 08:00       │  │
│ │ [👁️ Zobacz]                                            │  │
│ │                                                         │  │
│ │ ✅ DOSTARCZONE DZIŚ (2)                                │  │
│ │ SO-2025-10-001 | Bosch | 08:15 ✅ Przydzielone        │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ MAGAZYNY SERWISANTÓW ─────────────────────────────────┐  │
│ │                                                         │  │
│ │ ┌─────────────────────────────────────────┐            │  │
│ │ │ 👤 Adam Nowak | Ford Transit KR 12345  │            │  │
│ │ │ 📦 6 części | Wartość: 520 zł          │            │  │
│ │ │ ⚠️ Łożysko Samsung: 0 szt (UZUPEŁNIĆ!) │            │  │
│ │ │ [👁️ Zobacz magazyn]                    │            │  │
│ │ └─────────────────────────────────────────┘            │  │
│ │                                                         │  │
│ │ [👁️ Wszystkie magazyny (8)]                           │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ SZYBKIE AKCJE ────────────────────────────────────────┐  │
│ │ [🛒 Nowe zamówienie] [📊 Raporty] [⚙️ Dostawcy]       │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### PANEL SERWISANTA - Mój magazyn `/serwisant/magazyn`

```
┌──────────────────────────────────────────────────────────────┐
│ 👤 Adam Nowak                                 [🔔] [📋] [👤] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 📦 MÓJ MAGAZYN (Ford Transit - KR 12345)                    │
│                                                              │
│ ┌─ STATYSTYKI ────────────────────────────────────────────┐  │
│ │ Części: 6 szt | Wartość: 520 zł                         │  │
│ │ Użyto w tym miesiącu: 12 szt | 1,050 zł                 │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🔍 [Szukaj części...        ] [🔄] [📊 Historia]           │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✅ Pompa odpływowa (DC96-01414G)                       │  │
│ │    Ilość: 2 szt | Cena: 90 zł/szt                     │  │
│ │    Lokalizacja: Schowek przedni                        │  │
│ │    Przydzielona: 2025-10-01 przez Jan K.               │  │
│ │    [➕ Użyj w zleceniu] [ℹ️ Szczegóły]                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ✅ Amortyzator pralki (DC66-00343A)                    │  │
│ │    Ilość: 4 szt | Cena: 45 zł/szt                     │  │
│ │    [➕ Użyj] [ℹ️]                                       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Łożysko bębna Samsung (DC97-16151A)                │  │
│ │    Ilość: 0 szt | BRAK! Ostatnie użyte: dziś 14:30    │  │
│ │    [🛒 Zamów u logistyka]                              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ MOJE ZAMÓWIENIA ──────────────────────────────────────┐  │
│ │                                                         │  │
│ │ ⏳ PR-001 | Pompa × 1 | Oczekuje na zamówienie         │  │
│ │    Status: Logistyk zamówi dzisiaj o 15-16            │  │
│ │                                                         │  │
│ │ [Wszystkie zamówienia (3)]                             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### MOBILE - Podczas wizyty `/mobile/zlecenie/[id]`

```
┌───────────────────────────────────┐
│ ← Zlecenie #ORD1024              │
├───────────────────────────────────┤
│                                   │
│ 🔧 Pralka Samsung                │
│ Klient: Pani Kowalska             │
│ Adres: ul. Słoneczna 12           │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ 📸 TABLICZKA ZNAMIONOWA      │ │
│ │                               │ │
│ │ Status: ❌ Brak zdjęcia       │ │
│ │                               │ │
│ │ ⚠️ OBOWIĄZKOWE przed dodaniem│ │
│ │    części do zlecenia!        │ │
│ │                               │ │
│ │ [📸 Zrób zdjęcie tabliczki]  │ │
│ │                               │ │
│ └───────────────────────────────┘ │
│                                   │
│ --- DIAGNOZA ---                  │
│ Problem: Hałas podczas wirowania  │
│                                   │
│ [✏️ Dodaj notatkę]                │
│ [📦 Sprawdź części]               │
│ [✅ Zakończ zlecenie]             │
│                                   │
└───────────────────────────────────┘

Po zrobieniu zdjęcia:

┌───────────────────────────────────┐
│ ← Zlecenie #ORD1024              │
├───────────────────────────────────┤
│                                   │
│ ┌───────────────────────────────┐ │
│ │ ✅ TABLICZKA ROZPOZNANA      │ │
│ │                               │ │
│ │ 📸 [Zdjęcie tabliczki]        │ │
│ │                               │ │
│ │ 🤖 AI rozpoznał:              │ │
│ │ • Marka: Samsung              │ │
│ │ • Model: WW90T4540AE          │ │
│ │ • SN: 1234567890ABC           │ │
│ │ • Zaufanie: 95% ✅            │ │
│ │                               │ │
│ │ [✓ OK] [✏️ Popraw]            │ │
│ └───────────────────────────────┘ │
│                                   │
│ 💡 SUGEROWANE CZĘŚCI:             │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ ⭐⭐⭐ Łożysko bębna Samsung  │ │
│ │ DC97-16151A | 85 zł           │ │
│ │ ✅ MASZ: 2 szt w aucie        │ │
│ │ Dopasowanie: 100%             │ │
│ │                               │ │
│ │ [ℹ️ Info] [➕ Użyj (2 szt)]  │ │
│ └───────────────────────────────┘ │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ ⭐⭐ Grzałka 2000W            │ │
│ │ DC93-00155A | 120 zł          │ │
│ │ ❌ BRAK w magazynie           │ │
│ │                               │ │
│ │ [🛒 Zamów u logistyka]        │ │
│ └───────────────────────────────┘ │
│                                   │
│ [🔍 Szukaj innej części]          │
│                                   │
└───────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS

### 1. OCR Tabliczki Znamionowej

```javascript
// POST /api/ocr/device-plate
// Upload zdjęcia tabliczki

Request:
{
  orderId: "ORD1024",
  employeeId: "EMP001",
  photo: File // multipart/form-data
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
    productionDate: "2023-05",
    specs: {
      power: "2200W",
      voltage: "230V",
      capacity: "9 kg"
    }
  },
  suggestedParts: [
    {
      partId: "PART001",
      name: "Łożysko bębna Samsung",
      compatibility: 100,
      inPersonalInventory: true,
      quantity: 2
    }
  ]
}

// GET /api/ocr/history/:employeeId
// Historia OCR dla serwisanta
```

### 2. Magazyn Osobisty

```javascript
// GET /api/inventory/personal/:employeeId
// Magazyn serwisanta
Response:
{
  employeeId: "EMP001",
  employeeName: "Adam Nowak",
  vehicle: "Ford Transit - KR 12345",
  parts: [...],
  totalValue: 650.00,
  statistics: {...}
}

// POST /api/inventory/personal/use
// Użycie części z magazynu osobistego
Request:
{
  employeeId: "EMP001",
  orderId: "ORD1024",
  partId: "PART001",
  quantity: 2
}

// GET /api/inventory/personal/:employeeId/history
// Historia użycia części
```

### 3. Zamówienia Serwisantów (PartRequest)

```javascript
// POST /api/part-requests
// Nowe zamówienie części przez serwisanta
Request:
{
  requestedBy: "EMP001",
  orderId: "ORD1024",
  urgency: "tomorrow",
  parts: [
    {
      partId: "PART002",
      quantity: 1,
      reason: "Wymiana podczas naprawy"
    }
  ],
  notes: "Potrzebuję na jutro rano"
}

// GET /api/part-requests/pending
// Wszystkie oczekujące zamówienia (dla logistyka)

// GET /api/part-requests/employee/:employeeId
// Zamówienia konkretnego serwisanta

// PUT /api/part-requests/:id/approve
// Zatwierdzenie przez logistyka
```

### 4. Zamówienia Zbiorcze (SupplierOrder)

```javascript
// POST /api/supplier-orders/create-batch
// Utworzenie zbiorczego zamówienia przez logistyka
Request:
{
  orderedBy: "LOG001",
  supplierId: "SUP001",
  requestIds: ["PR-001", "PR-002", "PR-003"], // Konsolidacja
  items: [
    {
      partId: "PART002",
      quantity: 3,
      assignTo: [
        { employeeId: "EMP001", quantity: 1 },
        { employeeId: "EMP002", quantity: 2 }
      ]
    }
  ]
}

// PUT /api/supplier-orders/:id/receive
// Potwierdzenie odbioru i auto-przydzielenie

// GET /api/supplier-orders/pending
// Zamówienia w dostawie
```

---

## 📅 PLAN IMPLEMENTACJI V2

### FAZA 1: Backend + OCR (3-4 dni)

#### Dzień 1: Struktury danych
- ✅ PersonalInventory model
- ✅ PartRequest model
- ✅ SupplierOrder model
- ✅ DevicePlateOCR model
- ✅ PartUsage model
- ✅ Seed data (magazyny testowe)

#### Dzień 2: OCR System
- ✅ Integracja OpenAI Vision API
- ✅ Endpoint: POST /api/ocr/device-plate
- ✅ Upload zdjęć
- ✅ Parsing tabliczki (brand, model, SN)
- ✅ Matching części na podstawie modelu

#### Dzień 3: API Magazynów
- ✅ /api/inventory/personal/* (CRUD)
- ✅ /api/part-requests/* (zamówienia serwisantów)
- ✅ Logika: użycie części, odejmowanie ze stanu
- ✅ Auto-notyfikacje (niski stan)

#### Dzień 4: API Logistyka
- ✅ /api/supplier-orders/* (zamówienia zbiorcze)
- ✅ Konsolidacja zamówień serwisantów
- ✅ Auto-przydzielanie po dostawie
- ✅ Notyfikacje push/email

---

### FAZA 2: Panel Logistyka (2-3 dni)

#### Dzień 5: Widoki podstawowe
- ✅ /admin/logistyk - dashboard
- ✅ Lista zamówień od serwisantów
- ✅ Zatwierdzanie/odrzucanie
- ✅ Status deadline (15:00)

#### Dzień 6: Zamówienia zbiorcze
- ✅ /admin/logistyk/zamowienia
- ✅ Kreator zbiorczego zamówienia
- ✅ Auto-konsolidacja
- ✅ Sugestie AI (co zamówić na zapas)
- ✅ Email do dostawcy

#### Dzień 7: Magazyny serwisantów
- ✅ /admin/logistyk/magazyny
- ✅ Widok wszystkich magazynów osobistych
- ✅ Przydzielanie części ręcznie
- ✅ Historia użycia
- ✅ Alerty o niskim stanie

---

### FAZA 3: Panel Serwisanta + Mobile (3-4 dni)

#### Dzień 8: Magazyn osobisty
- ✅ /serwisant/magazyn - lista części w aucie
- ✅ Statystyki użycia
- ✅ Historia
- ✅ Zamówienia u logistyka

#### Dzień 9: Mobile - OCR
- ✅ Kamera w AGD Mobile
- ✅ Upload zdjęcia tabliczki (OBOWIĄZEK!)
- ✅ Wyświetlanie wyników OCR
- ✅ Korekta ręczna
- ✅ Sugerowane części

#### Dzień 10: Mobile - Użycie części
- ✅ Lista sugerowanych części (po OCR)
- ✅ Przycisk "Użyj z mojego magazynu"
- ✅ Zamów u logistyka (jeśli brak)
- ✅ Dodanie do zlecenia
- ✅ Auto-integracja z fakturą

#### Dzień 11: Finalizacja
- ✅ Testy E2E całego flow
- ✅ Optymalizacja OCR
- ✅ Poprawa UX/UI
- ✅ Dokumentacja

---

### FAZA 4: Zaawansowane (opcjonalne, 2-3 dni)

#### Funkcje dodatkowe:
- 📊 Dashboard analityczny dla logistyka
- 🤖 ML predykcja zapotrzebowania
- 📱 QR kody dla części
- 📧 Auto-emailing do dostawców (integracja API)
- 💰 Rozliczenia: koszty vs marże
- 📈 Raporty: ROI magazynów osobistych

---

## 🎯 METRYKI SUKCESU

### KPI dla Logistyka:
- ✅ Czas reakcji: <2h (od zamówienia do zatwierdzenia)
- ✅ Deadline 15:00: 95% zamówień w terminie
- ✅ Wykorzystanie dostaw: >500 zł (free shipping)
- ✅ Dokładność dostaw: >98%

### KPI dla Serwisantów:
- ✅ Czas dodania części: <2 min (dzięki OCR + sugestie)
- ✅ Dokładność OCR: >90%
- ✅ Wykorzystanie magazynu: >80% części używanych
- ✅ Satisfaction score: >4.5/5

### KPI Biznesowe:
- 💰 Redukcja kosztów dostaw: -30% (zbiorcze zamówienia)
- ⏱️ Czas realizacji napraw: -20% (części dostępne od razu)
- 📦 Rotacja magazynów: <14 dni
- 💵 Marża na częściach: >25%

---

## ❓ PYTANIA DO ZATWIERDZENIA

1. **OCR - OpenAI Vision** - OK? Czy preferujesz inne rozwiązanie (Google Vision, Tesseract)?
2. **Logistyk** - 1 osoba czy może kilka? (role: LOGISTYK)
3. **Deadline** - 15:00 sztywno czy konfigurowalne?
4. **Dostawa części** - Logistyk dostarcza do aut czy serwisanci odbierają z bazy?
5. **Pilne zamówienia** - Możliwość zamówienia poza deadlinem (express)?
6. **Email/API** - Zamówienia do dostawców: email czy integracja API?

---

**GOTOWY DO IMPLEMENTACJI!** 🚀

Czekam na Twoje ✅ lub uwagi do projektu V2.
