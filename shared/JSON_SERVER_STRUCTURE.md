# 📊 STRUKTURA DANYCH JSON - DOKŁADNY SCHEMAT DLA SERWERA

## 🗂️ GŁÓWNE PLIKI DANYCH

### 1. 👥 **CLIENTS.JSON** - Klienci
```json
{
  "clients": [
    {
      "id": "CLI25186001",                    // 🔑 Unikalny ID klienta
      "personalInfo": {
        "firstName": "Jan",                   // Imię
        "lastName": "Kowalski",               // Nazwisko  
        "email": "jan.kowalski@email.com",    // Email główny
        "dateOfBirth": "1985-05-15",          // Data urodzenia (YYYY-MM-DD)
        "gender": "male"                      // male|female|other
      },
      "phones": [                             // 📞 TABLICA telefonów
        {
          "number": "+48123456789",           // Numer z kodem kraju
          "type": "mobile",                   // mobile|home|work|fax
          "isPrimary": true,                  // Czy główny numer
          "notes": "preferowany kontakt"      // Uwagi
        },
        {
          "number": "+48987654321", 
          "type": "home",
          "isPrimary": false,
          "notes": "telefon domowy"
        }
      ],
      "addresses": [                          // 🏠 TABLICA adresów
        {
          "street": "ul. Kowalska 123",       // Ulica z numerem
          "city": "Warszawa",                 // Miasto
          "zipCode": "00-001",                // Kod pocztowy
          "country": "Polska",                // Kraj
          "type": "home",                     // home|work|service|billing
          "isPrimary": true,                  // Czy główny adres
          "notes": "II piętro, mieszkanie 15", // Uwagi
          "coordinates": {                    // GPS (opcjonalne)
            "lat": 52.2297,
            "lng": 21.0122
          }
        }
      ],
      "company": {                            // 🏢 Info firmowe (opcjonalne)
        "name": "ACME Sp. z o.o.",           // Nazwa firmy
        "nip": "1234567890",                 // NIP
        "regon": "123456789",                // REGON
        "industry": "handel",                // Branża
        "position": "Dyrektor IT"            // Stanowisko kontaktu
      },
      "preferences": {                        // ⚙️ Preferencje
        "preferredContactMethod": "phone",    // phone|email|sms
        "preferredTimeSlots": [               // Preferowane godziny
          "09:00-12:00",
          "14:00-17:00"
        ],
        "communicationLanguage": "pl",        // pl|en|de
        "serviceReminders": true,             // Czy wysyłać przypomnienia
        "marketingConsent": false             // Zgoda na marketing
      },
      "serviceInfo": {                        // 🔧 Info serwisowe
        "customerSince": "2024-01-15",        // Klient od (YYYY-MM-DD)
        "totalOrders": 5,                     // Liczba zamówień
        "totalSpent": 1250.50,                // Łączna kwota wydana
        "lastServiceDate": "2025-08-20",      // Ostatnia usługa
        "paymentMethod": "cash",              // cash|card|transfer|invoice
        "creditLimit": 1000,                  // Limit kredytowy
        "discount": 5                         // Rabat (%)
      },
      "notes": [                              // 📝 TABLICA notatek
        {
          "id": "note001",
          "text": "Bardzo miły klient, zawsze płaci na czas",
          "type": "general",                  // general|technical|financial|warning
          "createdBy": "EMP25189001",         // ID pracownika
          "createdAt": "2025-09-15T10:30:00Z",
          "isImportant": false
        }
      ],
      "tags": [                               // 🏷️ TABLICA tagów
        "VIP",
        "płatność gotówka", 
        "szybki kontakt"
      ],
      "availability": {                       // 📅 Dostępność
        "monday": {
          "available": true,
          "timeSlots": ["08:00-16:00"]
        },
        "tuesday": {
          "available": true, 
          "timeSlots": ["08:00-16:00"]
        },
        "wednesday": {
          "available": false,
          "timeSlots": []
        },
        "thursday": {
          "available": true,
          "timeSlots": ["12:00-20:00"]
        },
        "friday": {
          "available": true,
          "timeSlots": ["08:00-16:00"]
        },
        "saturday": {
          "available": true,
          "timeSlots": ["10:00-14:00"]
        },
        "sunday": {
          "available": false,
          "timeSlots": []
        }
      },
      "contactHistory": [                     // 📞 Historia kontaktów
        {
          "id": "contact001",
          "date": "2025-09-20T14:30:00Z",
          "type": "phone",                    // phone|email|sms|visit
          "direction": "outgoing",            // incoming|outgoing
          "employeeId": "EMP25189001",
          "purpose": "potwierdzenie terminu",
          "notes": "Klient potwierdził wizytę na jutro",
          "duration": 120                     // Czas w sekundach (dla rozmów)
        }
      ],
      "metadata": {                           // 🔧 Metadane systemu
        "createdAt": "2024-01-15T09:00:00Z",
        "updatedAt": "2025-09-30T10:15:00Z",
        "createdBy": "system",
        "lastModifiedBy": "EMP25189001",
        "version": 3,                         // Wersja rekordu
        "isActive": true,                     // Czy aktywny klient
        "syncStatus": "synced"                // synced|pending|error
      }
    }
  ]
}
```

### 2. 📋 **ORDERS.JSON** - Zamówienia
```json
{
  "orders": [
    {
      "id": "ORD2025093000001",              // 🔑 Unikalny ID zamówienia
      "status": "new",                       // new|assigned|in-progress|completed|cancelled|on-hold
      "clientId": "CLI25186001",             // 🔗 REFERENCJA do klienta
      
      "service": {
        "category": "Serwis AGD",            // Kategoria główna
        "subcategory": "Pralki",             // Podkategoria
        "type": "Naprawa",                   // Naprawa|Montaż|Przegląd|Konserwacja
        "description": "Pralka nie wiruje i hałasuje", // Opis problemu
        "priority": "normal",                // low|normal|high|urgent
        "urgency": "normalny",               // normalny|pilny|bardzo pilny
        "complexity": "medium",              // low|medium|high (auto)
        "warranty": false,                   // Czy gwarancyjna
        "recurring": false                   // Czy cykliczna
      },
      
      "devices": [                           // 🔧 TABLICA urządzeń
        {
          "id": "device001",                 // ID urządzenia w zamówieniu
          "name": "Pralka Samsung",          // Nazwa
          "brand": "Samsung",                // Marka
          "model": "WW90T4540AE",           // Model
          "serialNumber": "ABC123456789",    // Numer seryjny
          "description": "Nie wiruje, hałasuje", // Opis problemu
          "category": "AGD",                 // AGD|Elektronika|Instalacje
          "type": "Pralka",                  // Typ standardowy
          "age": 3,                          // Wiek w latach
          "purchaseDate": "2022-05-15",      // Data zakupu
          "warrantyUntil": "2024-05-15",     // Gwarancja do
          
          "characteristics": {               // Charakterystyki
            "installationType": "freestanding", // built-in|freestanding|countertop
            "accessLevel": "easy",           // easy|standard|difficult
            "serviceComplexity": "medium",   // low|medium|high
            "requiresDisassembly": true,     // Czy wymaga demontażu
            "requiresAssembly": true,        // Czy wymaga montażu
            "powerSource": "electric",       // electric|gas|mixed
            "powerConsumption": "2000W",     // Pobór mocy
            "dimensions": {                  // Wymiary
              "width": 60,
              "height": 85,
              "depth": 55
            },
            "weight": 75                     // Waga (kg)
          },
          
          "serviceInfo": {                   // Info serwisowe
            "estimatedDuration": 120,        // Szacowany czas (minuty)
            "requiredTools": [               // Wymagane narzędzia
              "podstawowy zestaw narzędzi",
              "klucze do AGD",
              "multimetr"
            ],
            "safetyRequirements": [          // Wymagania bezpieczeństwa
              "wyłączenie zasilania",
              "sprawdzenie braku napięcia"
            ],
            "requiredParts": [               // Potencjalnie potrzebne części
              {
                "name": "Łożysko bębna",
                "partNumber": "DC97-16151A",
                "probability": 0.7,          // Prawdopodobieństwo potrzeby
                "estimatedPrice": 80
              }
            ]
          },
          
          "condition": {                     // Stan urządzenia
            "overall": "poor",               // excellent|good|fair|poor|critical
            "visual": "good",                // Stan wizualny
            "functional": "poor",            // Stan funkcjonalny
            "lastService": "2024-06-15",     // Ostatni serwis
            "serviceHistory": [              // Historia serwisów
              {
                "date": "2024-06-15",
                "type": "Przegląd",
                "description": "Rutynowa konserwacja",
                "cost": 120
              }
            ]
          }
        }
      ],
      
      "location": {                          // 📍 Lokalizacja wykonania
        "addressId": "addr001",              // ID adresu klienta (jeśli z listy)
        "address": {                         // Lub pełny adres
          "street": "ul. Kowalska 123",
          "city": "Warszawa", 
          "zipCode": "00-001",
          "country": "Polska"
        },
        "accessInfo": {                      // Info o dostępie
          "floor": 2,                        // Piętro
          "apartmentNumber": "15",           // Numer mieszkania
          "accessNotes": "Drzwi po lewej stronie", // Uwagi
          "parkingInfo": "Parking przed budynkiem", // Info o parkowaniu
          "keyLocation": "Pod wycieraczką",  // Gdzie klucze
          "contactBeforeArrival": true       // Czy dzwonić przed przyjazdem
        },
        "coordinates": {                     // GPS
          "lat": 52.2297,
          "lng": 21.0122
        }
      },
      
      "scheduling": {                        // 📅 Harmonogram
        "requestedDate": "2025-10-02",       // Żądana data (YYYY-MM-DD)
        "requestedTime": "po południu",      // Żądany czas (tekst)
        "preferredTimeSlots": [              // Preferowane sloty
          "14:00-16:00",
          "16:00-18:00"
        ],
        "scheduledDate": null,               // Ustalona data i czas (ISO)
        "assignedEmployeeId": null,          // 🔗 Przypisany pracownik
        "assignedTeam": [],                  // 🔗 Przypisany zespół (IDs)
        "estimatedDuration": 120,            // Szacowany czas (minuty)
        "actualStartTime": null,             // Rzeczywisty start
        "actualEndTime": null,               // Rzeczywisty koniec
        "actualDuration": null,              // Rzeczywisty czas
        "assignedAt": null,                  // Kiedy przypisano
        "assignmentReason": null,            // Powód przypisania
        "rescheduledCount": 0,               // Ile razy przełożono
        "lastRescheduledDate": null          // Ostatnie przełożenie
      },
      
      "pricing": {                           // 💰 Wycena
        "estimatedCost": 200,                // Szacowany koszt usługi
        "finalCost": null,                   // Końcowy koszt (po wykonaniu)
        "laborCost": 150,                    // Koszt robocizny
        "partsCost": 50,                     // Koszt części
        "travelCost": 50,                    // Koszt dojazdu
        "additionalCosts": [],               // Dodatkowe koszty
        "discount": 0,                       // Rabat (PLN)
        "discountPercent": 0,                // Rabat (%)
        "tax": 46,                           // Podatek (PLN)
        "taxRate": 23,                       // Stawka podatku (%)
        "totalCost": 250,                    // Całkowity koszt
        "currency": "PLN",                   // Waluta
        "paymentMethod": "cash",             // cash|card|transfer|invoice
        "paymentStatus": "pending",          // pending|paid|overdue
        "invoiceRequired": false,            // Czy wymagana faktura
        "paidAt": null,                      // Kiedy zapłacono
        "partsUsed": []                      // Użyte części (wypełniane po)
      },
      
      "communication": {                     // 📞 Komunikacja
        "initialContact": {                  // Pierwszy kontakt
          "method": "online",                // online|phone|email|walk-in
          "employeeId": "system",
          "timestamp": "2025-09-30T09:00:00Z"
        },
        "clientNotified": false,             // Czy klient powiadomiony
        "confirmationSent": null,            // Kiedy wysłano potwierdzenie
        "reminderSent": null,                // Kiedy wysłano przypomnienie
        "clientConfirmed": false,            // Czy klient potwierdził
        "lastContactDate": "2025-09-30T09:00:00Z", // Ostatni kontakt
        "contactAttempts": [],               // Próby kontaktu
        "notes": []                          // Notatki komunikacyjne
      },
      
      "workflow": {                          // 🔄 Przepływ pracy
        "currentStage": "intake",            // intake|planning|execution|completion|billing
        "nextActions": [                     // Następne akcje
          "assign_employee",
          "schedule_visit"
        ],
        "blockers": [],                      // Blokady
        "dependencies": [],                  // Zależności od innych zamówień
        "automations": {                     // Automatyzacje
          "autoAssign": true,                // Auto-przypisywanie
          "autoSchedule": false,             // Auto-planowanie
          "autoReminder": true               // Auto-przypomnienia
        }
      },
      
      "timeline": {                          // ⏰ Historia czasowa
        "createdAt": "2025-09-30T09:00:00Z", // Utworzono
        "updatedAt": "2025-09-30T09:00:00Z", // Zaktualizowano
        "completedAt": null,                 // Ukończono
        "statusHistory": [                   // Historia statusów
          {
            "id": "hist001",
            "status": "new",
            "timestamp": "2025-09-30T09:00:00Z",
            "employeeId": "system",
            "notes": "Zamówienie utworzone przez klienta online",
            "metadata": {
              "source": "web_form",
              "userAgent": "Mozilla/5.0...",
              "ipAddress": "192.168.1.100"
            }
          }
        ],
        "milestones": [                      // Kamienie milowe
          {
            "name": "order_created",
            "timestamp": "2025-09-30T09:00:00Z",
            "description": "Zamówienie utworzone"
          }
        ]
      },
      
      "documentation": {                     // 📄 Dokumentacja
        "photos": [],                        // Zdjęcia
        "documents": [],                     // Dokumenty
        "reports": [],                       // Raporty
        "certificates": [],                  // Certyfikaty
        "warranty": null                     // Gwarancja
      },
      
      "quality": {                           // 🌟 Jakość
        "customerSatisfaction": null,        // Ocena klienta (1-5)
        "employeeRating": null,              // Ocena pracownika (1-5)
        "qualityScore": null,                // Wynik jakości (1-100)
        "feedback": null,                    // Opinia klienta
        "complaints": [],                    // Reklamacje
        "improvements": []                   // Sugestie poprawy
      },
      
      "notes": {                             // 📝 Notatki
        "internal": "Nowy klient, sprawdzić dostępność części", // Wewnętrzne
        "customer": "Skontaktujemy się w sprawie terminu",       // Dla klienta
        "technical": "Sprawdzić amortyzatory i łożyska bębna",   // Techniczne
        "billing": null,                     // Rozliczeniowe
        "management": null                   // Zarządcze
      },
      
      "metadata": {                          // 🔧 Metadane
        "version": 1,                        // Wersja
        "source": "web",                     // web|phone|email|walk-in|mobile-app
        "channel": "website",                // Kanał pochodzenia
        "campaign": null,                    // Kampania marketingowa
        "referral": null,                    // Polecenie
        "tags": ["nowy-klient", "agd"],      // Tagi
        "flags": [],                         // Flagi specjalne
        "syncStatus": "synced",              // Status synchronizacji
        "lastSyncAt": "2025-09-30T09:01:00Z" // Ostatnia synchronizacja
      }
    }
  ]
}
```

### 3. 👷 **EMPLOYEES.JSON** - Pracownicy
```json
{
  "employees": [
    {
      "id": "EMP25189001",                   // 🔑 Unikalny ID pracownika
      "personalInfo": {
        "firstName": "Jan",
        "lastName": "Kowalski", 
        "email": "jan.kowalski@firma.pl",
        "phone": "+48123456789",
        "dateOfBirth": "1985-03-20",
        "personalId": "85032012345",         // PESEL
        "address": {
          "street": "ul. Pracownicza 45",
          "city": "Warszawa",
          "zipCode": "00-002"
        }
      },
      "employment": {
        "position": "Technik serwisowy",     // Stanowisko
        "department": "Serwis",              // Dział
        "employmentType": "full-time",       // full-time|part-time|contract
        "startDate": "2023-01-15",           // Data zatrudnienia
        "endDate": null,                     // Data zakończenia (jeśli)
        "salary": 5000,                      // Wynagrodzenie (PLN)
        "salaryType": "monthly",             // monthly|hourly|commission
        "workingHours": 40,                  // Godziny tygodniowo
        "vacationDays": 26,                  // Dni urlopu
        "isActive": true                     // Czy aktywny
      },
      "specializations": [                   // 🔧 Specjalizacje
        {
          "category": "AGD",                 // Kategoria
          "level": "expert",                 // beginner|intermediate|advanced|expert
          "certifications": [                // Certyfikaty
            "Serwis Samsung AGD",
            "Bezpieczeństwo elektryczne"
          ],
          "experience": 5                    // Lata doświadczenia
        }
      ],
      "availability": {                      // 📅 Dostępność
        "monday": {
          "available": true,
          "workingHours": ["08:00-16:00"],
          "breaks": ["12:00-13:00"]
        },
        "tuesday": {
          "available": true,
          "workingHours": ["08:00-16:00"],
          "breaks": ["12:00-13:00"]
        },
        "wednesday": {
          "available": true,
          "workingHours": ["08:00-16:00"],
          "breaks": ["12:00-13:00"]
        },
        "thursday": {
          "available": true,
          "workingHours": ["08:00-16:00"],
          "breaks": ["12:00-13:00"]
        },
        "friday": {
          "available": true,
          "workingHours": ["08:00-16:00"],
          "breaks": ["12:00-13:00"]
        },
        "saturday": {
          "available": false,
          "workingHours": [],
          "breaks": []
        },
        "sunday": {
          "available": false,
          "workingHours": [],
          "breaks": []
        }
      },
      "performance": {                       // 📊 Wydajność
        "completedOrders": 150,              // Ukończone zamówienia
        "averageRating": 4.8,                // Średnia ocena (1-5)
        "onTimeCompletion": 95,              // Punktualność (%)
        "customerSatisfaction": 4.9,         // Zadowolenie klientów (1-5)
        "efficiency": 85                     // Efektywność (%)
      },
      "contact": {                           // 📞 Kontakt
        "preferredMethod": "phone",          // phone|email|sms
        "emergencyContact": {                // Kontakt awaryjny
          "name": "Anna Kowalska",
          "relationship": "żona",
          "phone": "+48987654321"
        }
      },
      "equipment": {                         // 🔧 Wyposażenie
        "tools": [                           // Narzędzia
          "Podstawowy zestaw narzędzi",
          "Multimetr Fluke 117",
          "Walizka narzędziowa"
        ],
        "vehicle": {                         // Pojazd
          "make": "Ford",
          "model": "Transit",
          "year": 2022,
          "licensePlate": "WA12345",
          "fuelType": "diesel"
        }
      },
      "metadata": {
        "createdAt": "2023-01-10T10:00:00Z",
        "updatedAt": "2025-09-30T08:00:00Z",
        "version": 2
      }
    }
  ]
}
```

### 4. 📅 **VISITS.JSON** - Wizyty (jeśli osobny plik)
```json
{
  "visits": [
    {
      "id": "VIS2025093000001",             // 🔑 Unikalny ID wizyty
      "type": "service",                     // service|inspection|maintenance|consultation
      "clientId": "CLI25186001",             // 🔗 REFERENCJA do klienta
      "orderId": "ORD2025093000001",         // 🔗 REFERENCJA do zamówienia (opcjonalne)
      "employeeId": "EMP25189001",           // 🔗 REFERENCJA do pracownika
      
      "scheduling": {
        "scheduledDate": "2025-10-02T14:00:00Z", // Data i godzina
        "estimatedDuration": 120,            // Szacowany czas (minuty)
        "actualStartTime": null,             // Rzeczywisty start
        "actualEndTime": null,               // Rzeczywisty koniec
        "actualDuration": null               // Rzeczywisty czas
      },
      
      "status": "scheduled",                 // scheduled|confirmed|in-progress|completed|cancelled
      "location": {                          // Lokalizacja (może być skopiowana z zamówienia)
        "address": {
          "street": "ul. Kowalska 123",
          "city": "Warszawa",
          "zipCode": "00-001"
        },
        "accessNotes": "II piętro, drzwi po lewej"
      },
      
      "service": {
        "description": "Naprawa pralki Samsung - wymiana łożysk",
        "devices": ["Pralka Samsung WW90T4540AE"],
        "requiredTools": ["klucze do AGD", "multimetr"],
        "estimatedParts": ["łożysko bębna"]
      },
      
      "results": {                           // Wyniki (po wizycie)
        "summary": null,                     // Podsumowanie
        "workPerformed": [],                 // Wykonane prace
        "partsUsed": [],                     // Użyte części
        "findings": [],                      // Znaleziska
        "recommendations": [],               // Rekomendacje
        "followUpRequired": false,           // Czy potrzebna kolejna wizyta
        "nextVisitDate": null                // Data następnej wizyty
      },
      
      "documentation": {
        "photos": [],                        // Zdjęcia
        "reports": [],                       // Raporty
        "clientSignature": null,             // Podpis klienta
        "employeeSignature": null            // Podpis pracownika
      },
      
      "timeline": {
        "createdAt": "2025-09-30T10:00:00Z",
        "updatedAt": "2025-09-30T10:00:00Z",
        "completedAt": null,
        "statusHistory": [
          {
            "status": "scheduled",
            "timestamp": "2025-09-30T10:00:00Z",
            "employeeId": "EMP25189001",
            "notes": "Wizyta zaplanowana"
          }
        ]
      }
    }
  ]
}
```

## 🔧 PLIKI KONFIGURACYJNE

### 5. 📊 **STATUS-DEFINITIONS.JSON** - Definicje statusów
```json
{
  "orderStatuses": {
    "new": {
      "label": "Nowe",
      "description": "Nowe zamówienie oczekuje na przypisanie",
      "priority": 1,
      "color": "#3B82F6",
      "icon": "plus-circle",
      "isFinal": false,
      "possibleTransitions": ["assigned", "cancelled"],
      "automations": ["autoAssign"],
      "notifications": ["newOrderAlert"]
    },
    "assigned": {
      "label": "Przypisane", 
      "description": "Zamówienie przypisane do technika",
      "priority": 2,
      "color": "#F59E0B",
      "icon": "user-check",
      "isFinal": false,
      "possibleTransitions": ["in-progress", "on-hold", "cancelled"],
      "automations": ["scheduleReminder"],
      "notifications": ["assignmentAlert"]
    },
    // ... więcej statusów
  },
  "visitStatuses": {
    // podobna struktura dla wizyt
  }
}
```

### 6. 🏷️ **DEVICE-CATEGORIES.JSON** - Kategorie urządzeń
```json
{
  "categories": {
    "AGD": {
      "label": "Sprzęt AGD",
      "subcategories": {
        "Pralki": {
          "defaultDuration": 120,
          "requiredTools": ["klucze do AGD", "multimetr"],
          "commonIssues": ["nie wiruje", "przecieka", "hałasuje"],
          "safetyRequirements": ["wyłączenie zasilania"]
        },
        "Zmywarki": {
          "defaultDuration": 90,
          "requiredTools": ["klucze hydrauliczne", "multimetr"],
          "commonIssues": ["nie myje", "nie grzeje wody"],
          "safetyRequirements": ["wyłączenie wody i prądu"]
        }
      }
    },
    "Elektronika": {
      "label": "Sprzęt elektroniczny",
      "subcategories": {
        "Telewizory": {
          "defaultDuration": 90,
          "requiredTools": ["multimetr", "oscyloskop"],
          "commonIssues": ["nie włącza się", "brak obrazu"],
          "safetyRequirements": ["ostrożność przy wysokim napięciu"]
        }
      }
    }
  }
}
```

## 📡 API ENDPOINTS STRUCTURE

### GET /api/clients
```json
{
  "success": true,
  "data": {
    "clients": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 247,
      "totalPages": 5
    }
  },
  "timestamp": "2025-09-30T10:00:00Z"
}
```

### POST /api/orders
```json
{
  "success": true,
  "data": {
    "id": "ORD2025093000001",
    "status": "new",
    "message": "Zamówienie utworzone pomyślnie"
  },
  "timestamp": "2025-09-30T10:00:00Z"
}
```

## 🔑 KLUCZOWE ZASADY JSON

1. **Wszystkie daty w formacie ISO 8601**: `"2025-09-30T10:00:00Z"`
2. **ID zawsze stringi**: `"CLI25186001"`, `"ORD2025093000001"`
3. **Statusy zawsze lowercase**: `"new"`, `"in-progress"`
4. **Kwoty jako liczby**: `200`, `50.75` (nie stringi)
5. **Booleans jako true/false**: `true`, `false` (nie "true"/"false")
6. **Arrays zawsze jako []**: nawet jeśli puste `"tags": []`
7. **Null dla brakujących wartości**: `"completedAt": null`
8. **Spójne nazewnictwo**: camelCase dla pól JSON

**🎯 Ta struktura jest gotowa do użycia z dowolnym backendem JSON (Node.js, Python, PHP, .NET)!**