# 📋 DOKŁADNE STRUKTURY DANYCH ZE SZCZEGÓŁAMI
**Data:** 2025-09-29  
**Status:** ✅ FINALNE STRUKTURY

---

## 🎯 STRUKTURA ZAMÓWIEŃ (Orders)
**Plik:** `device-optimized-orders.json`  
**Format:** Array z 33 obiektami

### 📝 Pojedyncze Zamówienie:
```json
{
  // === IDENTYFIKACJA ===
  "id": "ORD1759176259704000",           // Unikalny ID zamówienia
  "status": "new",                       // Status: new|assigned|in-progress|on-hold|completed|cancelled
  "clientId": "CLI25186001",             // ✅ REFERENCJA do clients.json
  
  // === USŁUGA ===
  "service": {
    "category": "Serwis elektroniki",    // ✅ STANDARYZOWANA kategoria
    "type": "qwqw",                      // Oryginalny typ (do czyszczenia)
    "description": "qwe",                // Opis problemu
    "priority": "normal",                // normal|high|urgent
    "urgency": "normalny",               // normalny|pilny|bardzo pilny
    "deviceCategories": ["Nieznane"],    // ✅ NOWE: kategorie urządzeń
    "complexity": "medium"               // ✅ NOWE: low|medium|high
  },
  
  // === URZĄDZENIA (✅ NOWA ZOPTYMALIZOWANA STRUKTURA) ===
  "devices": [
    {
      "name": "qwqw",                    // Nazwa urządzenia
      "brand": "",                       // Marka
      "model": "",                       // Model
      "description": "qwe",              // Opis problemu
      "category": "Nieznane",            // ✅ NOWE: AGD|Elektronika|Instalacje|Nieznane
      "type": "Nieokreślone urządzenie", // ✅ NOWE: standaryzowany typ
      
      // ✅ NOWY SYSTEM CHARAKTERYSTYK (zastąpił builtInParams)
      "characteristics": {
        "installationType": "built-in",   // built-in|freestanding|countertop|fixed
        "accessLevel": "easy",           // easy|standard|difficult
        "serviceComplexity": "medium",   // low|medium|high
        "requiresDisassembly": false,    // bool
        "requiresAssembly": false,       // bool
        "powerSource": "electric",       // electric|gas|mixed
        "requiresDataBackup": true       // bool (dla elektroniki)
      },
      
      // ✅ OZNACZENIA SPECJALNE
      "requiresManualClassification": true,
      "classificationNotes": "Urządzenie wymaga ręcznej klasyfikacji przez administratora",
      
      // ✅ NOWE: AUTOMATYCZNE INFORMACJE SERWISOWE
      "serviceInfo": {
        "estimatedDuration": 60,         // minuty
        "requiredTools": [               // wymagane narzędzia
          "podstawowy zestaw narzędzi"
        ],
        "safetyRequirements": []         // wymagania bezpieczeństwa
      }
    }
  ],
  
  // === ADRES ===
  "address": {
    "street": "",                        // Ulica
    "city": "",                          // Miasto
    "zipCode": "",                       // Kod pocztowy
    "notes": ""                          // Uwagi do adresu
  },
  
  // === HARMONOGRAM ===
  "scheduling": {
    "preferredTime": "",                 // Preferowany czas (tekst)
    "preferredDate": null,               // Preferowana data (ISO string)
    "scheduledDate": "2025-07-20T08:14", // Zaplanowana data (ISO string)
    "assignedEmployeeId": "EMP25189001", // ✅ REFERENCJA do employees.json
    "estimatedDuration": 60,             // ✅ NOWE: suma czasu urządzeń (minuty)
    "actualDuration": null,              // Rzeczywisty czas (minuty)
    "assignedAt": "2025-09-29T20:21:10.255Z", // Kiedy przypisano
    "assignmentReason": "auto-assigned based on specialization", // Powód przypisania
    
    // ✅ NOWE: AUTOMATYCZNE LISTY
    "requiredTools": [                   // Wszystkie wymagane narzędzia
      "podstawowy zestaw narzędzi"
    ],
    "safetyRequirements": []             // Wszystkie wymagania bezpieczeństwa
  },
  
  // === CENY ===
  "pricing": {
    "estimatedCost": null,               // Szacowany koszt
    "finalCost": null,                   // Końcowy koszt
    "travelCost": 50,                    // Koszty dojazdu
    "partsUsed": [],                     // Użyte części
    "laborHours": 0                      // Godziny pracy
  },
  
  // === TIMELINE I HISTORIA (✅ NOWY SYSTEM ŚLEDZENIA) ===
  "timeline": {
    "createdAt": "2025-09-29T20:04:19.704Z",
    "updatedAt": "2025-09-29T20:28:22.006Z",
    "completedAt": null,
    "statusHistory": [                   // ✅ PEŁNA HISTORIA STATUSÓW
      {
        "status": "new",
        "timestamp": "2025-09-29T20:04:19.704Z",
        "employeeId": null,
        "notes": "Zamówienie zmigrowane z orders.json"
      },
      {
        "status": "new",
        "timestamp": "2025-09-29T20:21:10.255Z",
        "employeeId": "EMP25189001",
        "notes": "Automatycznie przypisano pracownika: Jan Kowalski"
      }
    ]
  },
  
  // === NOTATKI ===
  "notes": {
    "internal": "",                      // Notatki wewnętrzne
    "customer": "",                      // Notatki dla klienta
    "technical": ""                      // Notatki techniczne
  },
  
  // === INFORMACJE O STATUSIE (✅ NOWY SYSTEM WORKFLOW) ===
  "statusInfo": {
    "current": "new",                    // Aktualny status
    "label": "Nowe",                     // Czytelna nazwa
    "description": "Nowo utworzone zamówienie, oczekuje na weryfikację",
    "priority": 1,                       // Priorytet numeryczny
    "isFinal": false,                    // Czy status końcowy
    "possibleTransitions": [             // Możliwe przejścia
      "assigned",
      "cancelled"
    ]
  },
  
  // === INFORMACJE O OPTYMALIZACJI ===
  "optimizationInfo": {
    "optimizedAt": "2025-09-29T20:41:05.330Z",
    "devicesOptimized": 1,
    "builtInParamsConverted": 0,
    "version": "1.0"
  }
}
```

---

## 👥 STRUKTURA KLIENTÓW (Clients)
**Plik:** `updated-clients.json`  
**Format:** Array z 14 obiektami

### 📝 Pojedynczy Klient:
```json
{
  // === PODSTAWOWE DANE ===
  "id": "CLI25186001",                   // Unikalny ID klienta
  "name": "Mariusz Bielaszka",          // Imię i nazwisko
  "phone": "123123123",                 // Główny telefon
  "email": "bielaszkam2@gmail.com",     // Email
  "address": "Słupia, 114 Pacanów",     // Główny adres
  "city": "Pacanów",                    // Miasto
  "street": "Nie podano",               // Ulica
  
  // === METADATA ===
  "dateAdded": "2025-07-05T06:14:59.048Z",
  "history": [],
  "legacyId": "#0001",
  "newId": "OLD0001",
  
  // === ROZSZERZONE TELEFONY (✅ SYSTEM WIELU NUMERÓW) ===
  "phones": [
    {
      "number": "123123123",
      "label": "Komórka",
      "isPrimary": true,
      "notes": "Główny numer kontaktowy"
    }
  ],
  
  // === ROZSZERZONE ADRESY (✅ SYSTEM WIELU ADRESÓW) ===
  "addresses": [
    {
      "address": "Słupia, 114 Pacanów",
      "label": "Dom",
      "isPrimary": true,
      "coordinates": null,
      "notes": "Główne miejsce zamieszkania"
    }
  ],
  
  // === SYSTEM NOTATEK (✅ STRUKTURYZOWANE NOTATKI) ===
  "notes": [
    {
      "id": "note1",
      "content": "Stały klient serwisu AGD, zawsze punktualny",
      "type": "general",
      "createdAt": "2025-09-28T20:00:00.000Z",
      "createdBy": "system"
    }
  ],
  
  // === TAGI (✅ SYSTEM TAGOWANIA) ===
  "tags": [
    "Stały klient",
    "Punktualny", 
    "AGD"
  ],
  
  // === DOSTĘPNOŚĆ (✅ SYSTEM HARMONOGRAMÓW) ===
  "availability": {
    "workingHours": [
      {
        "dayOfWeek": "monday",
        "periods": [
          {
            "from": "17:00",
            "to": "19:00",
            "label": "Po pracy"
          }
        ]
      },
      {
        "dayOfWeek": "saturday",
        "periods": [
          {
            "from": "09:00", 
            "to": "15:00",
            "label": "Weekend"
          }
        ]
      }
    ],
    "specialAvailability": [],           // Specjalne dostępności
    "unavailableDates": [],              // Niedostępne daty
    "preferredContactTime": "Po 17:00",  // Preferowany czas kontaktu
    "notes": "Najlepiej dzwonić wieczorem po pracy"
  },
  
  // === INFORMACJE FIRMOWE ===
  "companyInfo": {
    "isCompany": false,
    "companyName": "",
    "nip": "",
    "regon": "",
    "krs": ""
  },
  
  // === PREFERENCJE (✅ SYSTEM PREFERENCJI) ===
  "preferences": {
    "preferredPaymentMethod": "cash",     // cash|card|transfer|invoice
    "invoiceRequired": false,
    "preferredCommunication": "phone",    // phone|email|sms
    "language": "pl"
  },
  
  // === STATYSTYKI (✅ AUTOMATYCZNE STATYSTYKI) ===
  "stats": {
    "totalOrders": 3,                    // Łączna liczba zamówień
    "completedOrders": 2,                // Ukończone zamówienia
    "cancelledOrders": 0,                // Anulowane zamówienia
    "averageOrderValue": 150,            // Średnia wartość zamówienia
    "lastOrderDate": "2025-07-05T00:00:00.000Z",
    "customerSince": "2025-07-05T06:14:59.048Z"
  },
  
  // === HISTORIA KONTAKTÓW (✅ LOG KOMUNIKACJI) ===
  "contactHistory": [
    {
      "id": "contact1",
      "date": "2025-07-05T18:30:00.000Z",
      "type": "phone_call",              // phone_call|email|sms|visit
      "direction": "outgoing",           // incoming|outgoing
      "duration": 180,                   // sekundy (dla rozmów)
      "notes": "Umówienie wizyty serwisowej",
      "employeeId": "EMP25189001"
    }
  ]
}
```

---

## 📅 STRUKTURA WIZYT (Visits)  
**Plik:** `optimized-visits.json`  
**Format:** Array z 14 obiektami

### 📝 Pojedyncza Wizyta:
```json
{
  // === IDENTYFIKACJA ===
  "id": "VIS25186001",                   // Unikalny ID wizyty
  "clientId": "CLI25186001",             // ✅ REFERENCJA do clients.json (bez duplikacji!)
  
  // === USŁUGA ===
  "service": {
    "category": "Naprawa laptopa",       // Kategoria usługi
    "device": "qwqw",                    // Urządzenie
    "problem": "qwe"                     // Opis problemu
  },
  
  // === HARMONOGRAM ===
  "scheduledDate": "2025-07-20T08:14",  // Data wizyty
  "createdAt": "2025-07-05T06:14:59.047Z",
  "status": "scheduled",                 // scheduled|confirmed|in-progress|completed|cancelled
  
  // === PRZYPISANIE PRACOWNIKA (✅ DODANE) ===
  "assignedEmployeeId": "EMP25189001",  // REFERENCJA do employees.json
  "assignedAt": "2025-09-29T20:21:10.260Z",
  "assignmentDetails": {
    "reason": "auto-assigned based on service category",
    "assignedBy": "system",
    "specialization": "Naprawa laptopa"
  },
  
  // === INFORMACJE O MIGRACJI (zachowane dla audytu) ===
  "migrationInfo": {
    "originalId": "VIS25186001",
    "migrationDate": "2025-09-28T22:12:00.373Z", 
    "migrationSource": "unified-id-system",
    
    // ✅ ORYGINALNE DANE KLIENTA (do celów auditowych)
    "originalClientData": {
      "name": "Mariusz Bielaszka",
      "phone": "123123123",
      "email": "bielaszkam2@gmail.com",
      "address": "Słupia, 114 Pacanów",
      "city": "Pacanów",
      "street": "Nie podano"
    }
  },
  
  // === ŚLEDZENIE (✅ DODANE dla wizyt) ===
  "tracking": {
    "createdAt": "2025-07-05T06:14:59.047Z",
    "updatedAt": "2025-09-29T20:21:10.260Z",
    "statusHistory": [
      {
        "status": "scheduled",
        "timestamp": "2025-09-29T20:21:10.260Z",
        "employeeId": "EMP25189001",
        "notes": "Status standaryzowany",
        "source": "status-standardization"
      }
    ]
  }
}
```

---

## 👷 STRUKTURA PRACOWNIKÓW (Employees)
**Plik:** `improved-employees.json`  
**Format:** Array z 3 obiektami

### 📝 Pojedynczy Pracownik:
```json
{
  // === IDENTYFIKACJA ===
  "id": "EMP25189001",                   // Unikalny ID pracownika
  "name": "Jan Kowalski",               // Imię i nazwisko
  "email": "jan.kowalski@techserwis.pl", // Email
  "phone": "+48 123 456 789",           // Telefon
  
  // === SPECJALIZACJE ===
  "specializations": [                  // Lista specjalizacji
    "Serwis AGD",
    "Naprawa pralek"
  ],
  
  // === STATUS I PODSTAWOWE DANE ===
  "isActive": true,                     // Czy aktywny
  "dateAdded": "2025-07-08T22:25:15.180Z",
  "address": "Warszawa",                // Miejsce zamieszkania
  "workingHours": "8:00-16:00",         // Godziny pracy
  "experience": "5 lat",                // Doświadczenie
  "rating": 4.8,                        // Ocena (0-5)
  "completedJobs": 245,                 // Ukończone prace
  
  // === STATYSTYKI (✅ AKTUALIZOWANE AUTOMATYCZNIE) ===
  "statistics": {
    "currentAssignments": 32,           // Aktualne przypisania
    "totalAssignments": 32,             // Łączne przypisania
    "lastAssignedAt": "2025-09-29T20:21:10.260Z" // Ostatnie przypisanie
  }
}
```

---

## 🔄 DEFINICJE STATUSÓW
**Plik:** `status-definitions.json`

### 📝 Statusy Zamówień:
```json
{
  "orders": {
    "new": {
      "label": "Nowe",
      "description": "Nowo utworzone zamówienie, oczekuje na weryfikację",
      "nextStates": ["assigned", "cancelled"],
      "priority": 1
    },
    "assigned": {
      "label": "Przypisane", 
      "description": "Zamówienie przypisane do technika",
      "nextStates": ["in-progress", "on-hold", "cancelled"],
      "priority": 2
    },
    "in-progress": {
      "label": "W realizacji",
      "description": "Zamówienie jest obecnie realizowane", 
      "nextStates": ["completed", "on-hold", "cancelled"],
      "priority": 3
    },
    "completed": {
      "label": "Ukończone",
      "description": "Zamówienie zostało ukończone",
      "nextStates": [],
      "priority": 5,
      "final": true
    }
  }
}
```

### 📝 Statusy Wizyt:
```json
{
  "visits": {
    "scheduled": {
      "label": "Zaplanowane",
      "description": "Wizyta została zaplanowana",
      "nextStates": ["confirmed", "rescheduled", "cancelled"],
      "priority": 1
    },
    "confirmed": {
      "label": "Potwierdzone",
      "description": "Wizyta potwierdzona przez klienta",
      "nextStates": ["in-progress", "rescheduled", "cancelled"], 
      "priority": 2
    },
    "completed": {
      "label": "Ukończone",
      "description": "Wizyta została ukończona",
      "nextStates": [],
      "priority": 5,
      "final": true
    }
  }
}
```

---

## 🔧 KATEGORIE URZĄDZEŃ
**Plik:** `device-categories.json`

### 📝 Definicje Kategorii:
```json
{
  "categories": {
    "AGD": {
      "types": ["piekarnik", "lodówka", "pralka", "zmywarka", "mikrofalówka"],
      "commonCharacteristics": {
        "powerSource": "electric",
        "installationType": "built-in", 
        "accessLevel": "standard",
        "serviceComplexity": "medium"
      }
    },
    "Elektronika": {
      "types": ["laptop", "komputer", "telefon", "tablet", "monitor"],
      "commonCharacteristics": {
        "portability": "portable",
        "accessLevel": "easy",
        "serviceComplexity": "medium",
        "requiresDataBackup": true
      }
    }
  },
  
  "typeMapping": {
    "piekarnik": {
      "category": "AGD",
      "standardName": "Piekarnik",
      "installationType": "built-in"
    },
    "laptop": {
      "category": "Elektronika", 
      "standardName": "Laptop",
      "portability": "portable"
    }
  }
}
```

---

## 🔗 RELACJE MIĘDZY DANYMI

### ✅ Poprawne Referencje:
- **Zamówienia** → `clientId` → **Klienci**
- **Zamówienia** → `assignedEmployeeId` → **Pracownicy**  
- **Wizyty** → `clientId` → **Klienci**
- **Wizyty** → `assignedEmployeeId` → **Pracownicy**

### ✅ Brak Duplikacji:
- Dane klientów **tylko** w `clients.json`
- Wizyty używają **referencji** zamiast duplikacji
- Ujednolicona struktura zamówień

### ✅ Integralność:
- Wszystkie referencje są **walidowane**
- **100% pokrycie** przypisań pracowników
- **Pełna historia** zmian statusów

---

## 📈 STATYSTYKI SYSTEMU

| Element | Ilość | Status |
|---------|-------|--------|
| **Zamówienia** | 33 | ✅ Ujednolicone |
| **Klienci** | 14 | ✅ Rozszerzeni |
| **Wizyty** | 14 | ✅ Zoptymalizowane |
| **Pracownicy** | 3 | ✅ Ze statystykami |
| **Statusy** | 12 | ✅ Standaryzowane |
| **Kategorie urządzeń** | 3 główne | ✅ Zdefiniowane |

**🎯 System jest gotowy do użycia w aplikacji!**