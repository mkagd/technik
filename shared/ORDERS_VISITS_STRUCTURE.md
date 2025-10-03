# 📋 STRUKTURY ZAMÓWIEŃ I WIZYT - SZCZEGÓŁY

## 🎯 ZAMÓWIENIE (ORDER) - PEŁNA STRUKTURA

```json
{
  // === PODSTAWOWE IDENTYFIKATORY ===
  "id": "ORD2025093000001",             // 🔑 Unikalny ID zamówienia
  "status": "new",                      // Status: new|assigned|in-progress|completed|cancelled
  "clientId": "CLI25186001",            // 🔗 REFERENCJA do klienta (clients.json)
  
  // === OPIS USŁUGI ===
  "service": {
    "category": "Serwis AGD",           // Kategoria: Serwis AGD|Serwis elektroniki|Instalacje
    "type": "Naprawa pralki",           // Typ usługi
    "description": "Pralka nie wiruje, słychać dziwne dźwięki", // Opis problemu
    "priority": "normal",               // normal|high|urgent
    "urgency": "normalny",              // normalny|pilny|bardzo pilny
    "complexity": "medium"              // low|medium|high (automatycznie)
  },
  
  // === URZĄDZENIA DO NAPRAWY ===
  "devices": [
    {
      "name": "Pralka Samsung",          // Nazwa urządzenia
      "brand": "Samsung",               // Marka
      "model": "WW90T4540AE",           // Model
      "description": "Nie wiruje, hałasuje", // Opis problemu konkretnego urządzenia
      "category": "AGD",                // AGD|Elektronika|Instalacje
      "type": "Pralka",                 // Standaryzowany typ
      
      // CHARAKTERYSTYKI URZĄDZENIA
      "characteristics": {
        "installationType": "freestanding", // built-in|freestanding|countertop
        "accessLevel": "easy",          // easy|standard|difficult
        "serviceComplexity": "medium",  // low|medium|high
        "requiresDisassembly": true,    // Czy wymaga demontażu
        "requiresAssembly": true,       // Czy wymaga montażu
        "powerSource": "electric"       // electric|gas|mixed
      },
      
      // AUTOMATYCZNE INFORMACJE SERWISOWE
      "serviceInfo": {
        "estimatedDuration": 120,       // Szacowany czas naprawy (minuty)
        "requiredTools": [              // Wymagane narzędzia
          "podstawowy zestaw narzędzi",
          "klucze do AGD",
          "multimetr"
        ],
        "safetyRequirements": [         // Wymagania bezpieczeństwa
          "wyłączenie zasilania",
          "sprawdzenie braku napięcia"
        ]
      }
    }
  ],
  
  // === ADRES WYKONANIA ===
  "address": {
    "street": "ul. Kowalska 123",       // Ulica z numerem
    "city": "Warszawa",                 // Miasto  
    "zipCode": "00-001",                // Kod pocztowy
    "notes": "II piętro, drzwi po lewej" // Uwagi do adresu
  },
  
  // === HARMONOGRAM ===
  "scheduling": {
    "preferredTime": "po południu",     // Preferowany czas (tekst od klienta)
    "preferredDate": "2025-10-02",     // Preferowana data (YYYY-MM-DD)
    "scheduledDate": "2025-10-02T14:00:00Z", // Ustalona data i godzina (ISO)
    "assignedEmployeeId": "EMP25189001", // 🔗 REFERENCJA do pracownika
    "estimatedDuration": 120,           // Szacowany czas (minuty)
    "actualDuration": null,             // Rzeczywisty czas po zakończeniu
    "assignedAt": "2025-09-30T10:00:00Z", // Kiedy przypisano pracownika
    "assignmentReason": "specjalizacja w AGD" // Powód przypisania
  },
  
  // === CENY I KOSZTY ===
  "pricing": {
    "estimatedCost": 200,               // Szacowany koszt (PLN)
    "finalCost": null,                  // Końcowy koszt (po wykonaniu)
    "travelCost": 50,                   // Koszt dojazdu (PLN)
    "laborHours": 2,                    // Godziny pracy
    "partsUsed": [                      // Użyte części
      {
        "name": "Łożysko bębna",
        "quantity": 1,
        "unitPrice": 80,
        "totalPrice": 80
      }
    ]
  },
  
  // === HISTORIA I ŚLEDZENIE ===
  "timeline": {
    "createdAt": "2025-09-30T09:00:00Z", // Kiedy utworzono
    "updatedAt": "2025-09-30T10:00:00Z", // Ostatnia aktualizacja
    "completedAt": null,                // Kiedy ukończono (jeśli ukończone)
    "statusHistory": [                  // Historia zmian statusów
      {
        "status": "new",
        "timestamp": "2025-09-30T09:00:00Z",
        "employeeId": "system",
        "notes": "Zamówienie utworzone przez klienta online"
      },
      {
        "status": "assigned", 
        "timestamp": "2025-09-30T10:00:00Z",
        "employeeId": "EMP25189001",
        "notes": "Przypisano Jana Kowalskiego - specjalista AGD"
      }
    ]
  },
  
  // === NOTATKI ===
  "notes": {
    "internal": "Klient bardzo miły, płaci zawsze gotówką", // Wewnętrzne dla zespołu
    "customer": "Skontaktujemy się przed przyjazdem",        // Dla klienta
    "technical": "Sprawdzić amortyzatory i łożyska"         // Techniczne
  },
  
  // === INFORMACJE O STATUSIE ===
  "statusInfo": {
    "current": "assigned",              // Aktualny status
    "label": "Przypisane",              // Nazwa po polsku
    "description": "Zamówienie przypisane do technika",
    "priority": 2,                      // Priorytet liczbowy
    "isFinal": false,                   // Czy to status końcowy
    "possibleTransitions": [            // Możliwe następne statusy
      "in-progress", 
      "on-hold", 
      "cancelled"
    ]
  }
}
```

---

## 📅 WIZYTA (VISIT) - PEŁNA STRUKTURA

```json
{
  // === PODSTAWOWE IDENTYFIKATORY ===
  "id": "VIS2025093000001",             // 🔑 Unikalny ID wizyty
  "clientId": "CLI25186001",            // 🔗 REFERENCJA do klienta (bez duplikacji!)
  "orderId": "ORD2025093000001",        // 🔗 REFERENCJA do powiązanego zamówienia (opcjonalne)
  
  // === OPIS USŁUGI ===
  "service": {
    "category": "Przegląd techniczny",  // Kategoria wizyty
    "type": "Przegląd roczny",          // Typ wizyty
    "description": "Rutynowy przegląd wszystkich urządzeń AGD", // Opis
    "devices": [                        // Lista urządzeń do przeglądu
      "Pralka Samsung",
      "Zmywarka Bosch", 
      "Piekarnik Electrolux"
    ]
  },
  
  // === HARMONOGRAM ===
  "scheduledDate": "2025-10-05T10:00:00Z", // Data i godzina wizyty
  "estimatedDuration": 180,             // Szacowany czas (minuty)
  "actualDuration": null,               // Rzeczywisty czas po zakończeniu
  "createdAt": "2025-09-30T08:00:00Z",  // Kiedy zaplanowano
  
  // === STATUS ===
  "status": "confirmed",                // scheduled|confirmed|in-progress|completed|cancelled
  
  // === PRZYPISANIE PRACOWNIKA ===
  "assignedEmployeeId": "EMP25189001",  // 🔗 REFERENCJA do pracownika
  "assignedAt": "2025-09-30T08:30:00Z", // Kiedy przypisano
  "assignmentDetails": {
    "reason": "dostępność w terminie",   // Powód przypisania
    "assignedBy": "admin",              // Kto przypisał
    "specialization": "Serwis AGD"      // Wymagana specjalizacja
  },
  
  // === LOKALIZACJA ===
  "location": {
    "address": "ul. Kowalska 123",      // Adres wizyty
    "city": "Warszawa",
    "zipCode": "00-001",
    "notes": "II piętro, mieszkanie 15",
    "parkingInfo": "Parking przed budynkiem", // Info o parkowaniu
    "accessNotes": "Dzwonić 5 min przed przyjazdem" // Uwagi o dostępie
  },
  
  // === WYNIKI WIZYTY (po wykonaniu) ===
  "results": {
    "summary": "Wszystkie urządzenia w dobrym stanie", // Podsumowanie
    "findings": [                       // Znalezione problemy/uwagi
      {
        "device": "Pralka Samsung",
        "issue": "Zużyty filtr",
        "severity": "low",              // low|medium|high|critical
        "recommendation": "Wymiana za 6 miesięcy"
      }
    ],
    "recommendations": [                // Rekomendacje
      "Czyszczenie filtrów co 3 miesiące",
      "Przegląd za rok"
    ],
    "followUpRequired": false,          // Czy potrzebna kolejna wizyta
    "nextVisitDate": "2026-10-05"      // Następny przegląd
  },
  
  // === MATERIAŁY I KOSZTY ===
  "materials": {
    "used": [                           // Użyte materiały
      {
        "name": "Filtr wody",
        "quantity": 1,
        "unitPrice": 25,
        "totalPrice": 25
      }
    ],
    "recommended": [                    // Polecane do zakupu
      {
        "name": "Odkamieniacz",
        "reason": "Profilaktyka",
        "estimatedPrice": 15
      }
    ]
  },
  
  // === ŚLEDZENIE STATUSÓW ===
  "tracking": {
    "createdAt": "2025-09-30T08:00:00Z",
    "updatedAt": "2025-09-30T08:30:00Z",
    "completedAt": null,                // Data ukończenia
    "statusHistory": [                  // Historia statusów
      {
        "status": "scheduled",
        "timestamp": "2025-09-30T08:00:00Z",
        "employeeId": "system",
        "notes": "Wizyta zaplanowana na żądanie klienta"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-09-30T08:30:00Z", 
        "employeeId": "EMP25189001",
        "notes": "Potwierdzono z klientem telefonicznie"
      }
    ]
  },
  
  // === KOMUNIKACJA Z KLIENTEM ===
  "communication": {
    "clientNotified": true,             // Czy klient został powiadomiony
    "confirmationSent": "2025-09-30T08:15:00Z", // Kiedy wysłano potwierdzenie
    "reminderSent": null,               // Kiedy wysłano przypomnienie
    "clientConfirmed": true,            // Czy klient potwierdził
    "contactAttempts": [                // Próby kontaktu
      {
        "timestamp": "2025-09-30T08:10:00Z",
        "method": "phone",              // phone|email|sms
        "result": "answered",           // answered|no_answer|busy|failed
        "notes": "Klient potwierdził wizytę"
      }
    ]
  },
  
  // === DOKUMENTACJA (po wizycie) ===
  "documentation": {
    "photos": [                         // Zdjęcia z wizyty
      "photo_001.jpg",
      "photo_002.jpg"
    ],
    "documents": [                      // Dokumenty
      "protokol_przegladu.pdf"
    ],
    "signature": {                      // Podpis klienta
      "signed": true,
      "timestamp": "2025-10-05T12:30:00Z",
      "method": "digital"               // digital|paper
    }
  }
}
```

---

## 🔄 STATUSY I PRZEJŚCIA

### 📋 Statusy Zamówień:
```
new → assigned → in-progress → completed
 ↓        ↓           ↓
cancelled ← on-hold ←---
```

1. **new** - Nowe zamówienie, czeka na przypisanie
2. **assigned** - Przypisane do technika
3. **in-progress** - W trakcie realizacji
4. **on-hold** - Wstrzymane (brak części, oczekiwanie na klienta)
5. **completed** - Ukończone ✅
6. **cancelled** - Anulowane ❌

### 📅 Statusy Wizyt:
```
scheduled → confirmed → in-progress → completed
    ↓           ↓            ↓
cancelled ← rescheduled → postponed
```

1. **scheduled** - Zaplanowana
2. **confirmed** - Potwierdzona przez klienta
3. **in-progress** - Trwa wizyta
4. **completed** - Ukończona ✅
5. **rescheduled** - Przełożona na inny termin
6. **postponed** - Przerwana, do kontynuacji
7. **cancelled** - Anulowana ❌

---

## 🔗 RELACJE MIĘDZY DANYMI

### Zamówienie ↔ Klient:
```javascript
// Znajdź klienta dla zamówienia
const client = clients.find(c => c.id === order.clientId);

// Znajdź zamówienia klienta
const clientOrders = orders.filter(o => o.clientId === client.id);
```

### Wizyta ↔ Klient:
```javascript
// Znajdź klienta dla wizyty
const client = clients.find(c => c.id === visit.clientId);

// Znajdź wizyty klienta
const clientVisits = visits.filter(v => v.clientId === client.id);
```

### Zamówienie ↔ Pracownik:
```javascript
// Znajdź pracownika przypisanego do zamówienia
const employee = employees.find(e => e.id === order.scheduling.assignedEmployeeId);

// Znajdź zamówienia pracownika
const employeeOrders = orders.filter(o => o.scheduling.assignedEmployeeId === employee.id);
```

---

## ✅ MINIMALNE WYMAGANE POLA

### Zamówienie:
```json
{
  "id": "AUTO_GENERATED",              // ✅ Wymagane
  "clientId": "CLI123",                // ✅ Wymagane
  "service": {
    "description": "Opis problemu"     // ✅ Wymagane
  },
  "status": "new",                     // ✅ Wymagane (domyślnie)
  "timeline": {
    "createdAt": "AUTO_GENERATED"      // ✅ Wymagane
  }
}
```

### Wizyta:
```json
{
  "id": "AUTO_GENERATED",              // ✅ Wymagane
  "clientId": "CLI123",                // ✅ Wymagane
  "scheduledDate": "2025-10-05T10:00:00Z", // ✅ Wymagane
  "service": {
    "description": "Cel wizyty"       // ✅ Wymagane
  },
  "status": "scheduled"                // ✅ Wymagane (domyślnie)
}
```

**🎯 Obie struktury są w pełni elastyczne i pozwalają na kompletne zarządzanie serwisem!**