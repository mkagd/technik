# 👥 STRUKTURA DANYCH KLIENTA - SZCZEGÓŁY

## 🎯 PEŁNA STRUKTURA KLIENTA

```json
{
  // === PODSTAWOWE DANE OSOBOWE ===
  "id": "CLI25186001",                   // 🔑 Unikalny ID klienta (automatyczny)
  "name": "Jan Kowalski",                // Imię i nazwisko / nazwa firmy
  "email": "jan@example.com",            // Email
  "phone": "123456789",                  // Główny telefon
  
  // === ADRES GŁÓWNY ===
  "address": "ul. Główna 123",           // Główny adres (pełny)
  "city": "Warszawa",                    // Miasto
  "street": "ul. Główna 123",            // Ulica z numerem
  
  // === METADATA SYSTEMU ===
  "dateAdded": "2025-09-30T10:00:00.000Z", // Data dodania do systemu
  "history": [],                         // Historia zmian (legacy)
  
  // === ROZSZERZONE TELEFONY ===
  "phones": [
    {
      "number": "123456789",             // Numer telefonu
      "label": "Komórka",                // Etykieta: Komórka|Dom|Praca|Główny
      "isPrimary": true,                 // Czy główny numer
      "notes": "Najlepszy kontakt"       // Notatki do numeru
    },
    {
      "number": "987654321",
      "label": "Praca", 
      "isPrimary": false,
      "notes": "Dostępny 8-16"
    }
  ],
  
  // === ROZSZERZONE ADRESY ===
  "addresses": [
    {
      "address": "ul. Główna 123",       // Pełny adres
      "label": "Dom",                    // Etykieta: Dom|Praca|Główny|Serwis
      "isPrimary": true,                 // Czy główny adres
      "coordinates": null,               // Współrzędne GPS (opcjonalne)
      "notes": "Główne miejsce zamieszkania"
    },
    {
      "address": "ul. Biurowa 456",
      "label": "Praca",
      "isPrimary": false,
      "coordinates": null,
      "notes": "Biuro, wejście od podwórka"
    }
  ],
  
  // === SYSTEM NOTATEK ===
  "notes": [
    {
      "id": "note1",                     // Unikalny ID notatki
      "content": "Stały klient, zawsze punktualny", // Treść notatki
      "type": "general",                 // Typ: general|technical|billing|contact
      "createdAt": "2025-09-30T10:00:00.000Z",
      "createdBy": "system"              // Kto utworzył: system|admin|employee_id
    },
    {
      "id": "note2",
      "content": "Preferuje kontakt po 17:00",
      "type": "contact",
      "createdAt": "2025-09-30T10:30:00.000Z", 
      "createdBy": "EMP001"
    }
  ],
  
  // === SYSTEM TAGÓW ===
  "tags": [
    "Stały klient",                      // Tagi do kategoryzacji
    "Punktualny",                        // Mogą być dowolne
    "VIP",
    "AGD",
    "Warszawa"
  ],
  
  // === DOSTĘPNOŚĆ I HARMONOGRAM ===
  "availability": {
    "workingHours": [                    // Dostępność w dni robocze
      {
        "dayOfWeek": "monday",           // monday|tuesday|wednesday|thursday|friday|saturday|sunday
        "periods": [
          {
            "from": "17:00",             // Godzina od (HH:MM)
            "to": "19:00",               // Godzina do (HH:MM)
            "label": "Po pracy"          // Opis okresu
          }
        ]
      },
      {
        "dayOfWeek": "saturday",
        "periods": [
          {
            "from": "09:00",
            "to": "15:00", 
            "label": "Weekendy"
          }
        ]
      }
    ],
    "specialAvailability": [             // Specjalne dostępności
      {
        "date": "2025-12-24",            // Konkretna data
        "periods": [
          {
            "from": "08:00",
            "to": "12:00",
            "label": "Wigilia - tylko rano"
          }
        ]
      }
    ],
    "unavailableDates": [                // Niedostępne daty
      "2025-12-25",                      // Boże Narodzenie
      "2025-01-01"                       // Nowy Rok
    ],
    "preferredContactTime": "Po 17:00",  // Preferowany czas kontaktu (tekst)
    "notes": "Najlepiej dzwonić wieczorem po pracy" // Uwagi do dostępności
  },
  
  // === INFORMACJE FIRMOWE ===
  "companyInfo": {
    "isCompany": false,                  // Czy to firma (true) czy osoba prywatna (false)
    "companyName": "",                   // Nazwa firmy (jeśli isCompany=true)
    "nip": "",                           // NIP (jeśli firma)
    "regon": "",                         // REGON (jeśli firma)  
    "krs": ""                            // KRS (jeśli spółka)
  },
  
  // === PREFERENCJE KLIENTA ===
  "preferences": {
    "preferredPaymentMethod": "cash",    // cash|card|transfer|invoice
    "invoiceRequired": false,            // Czy wymaga faktury
    "preferredCommunication": "phone",   // phone|email|sms
    "language": "pl"                     // pl|en|de (język komunikacji)
  },
  
  // === AUTOMATYCZNE STATYSTYKI ===
  "stats": {
    "totalOrders": 5,                    // Łączna liczba zamówień
    "completedOrders": 4,                // Ukończone zamówienia
    "cancelledOrders": 1,                // Anulowane zamówienia
    "averageOrderValue": 250,            // Średnia wartość zamówienia (PLN)
    "lastOrderDate": "2025-09-15T00:00:00.000Z", // Data ostatniego zamówienia
    "customerSince": "2025-07-01T00:00:00.000Z"  // Klient od (data dodania)
  },
  
  // === HISTORIA KONTAKTÓW ===
  "contactHistory": [
    {
      "id": "contact1",                  // Unikalny ID kontaktu
      "date": "2025-09-30T14:30:00.000Z", // Data i czas kontaktu
      "type": "phone_call",              // phone_call|email|sms|visit|meeting
      "direction": "outgoing",           // incoming|outgoing (kto inicjował)
      "duration": 180,                   // Czas trwania w sekundach (dla rozmów)
      "notes": "Umówienie wizyty serwisowej na jutro", // Notatki z kontaktu
      "result": "appointment_scheduled", // outcome kontaktu
      "employeeId": "EMP001"             // Kto prowadził kontakt
    },
    {
      "id": "contact2",
      "date": "2025-09-29T10:15:00.000Z",
      "type": "email",
      "direction": "incoming", 
      "subject": "Pytanie o naprawę pralki", // Temat (dla emaili)
      "notes": "Klient pyta o koszt naprawy",
      "result": "information_provided",
      "employeeId": "EMP002"
    }
  ],
  
  // === FLAGI SYSTEMU (opcjonalne) ===
  "enhanced": true,                      // Czy rekord został rozszerzony
  "enhancedDate": "2025-09-30T10:00:00.000Z", // Kiedy rozszerzono
  "enhancedVersion": "1.0"               // Wersja rozszerzenia
}
```

## 📊 DODATKOWE POLA (opcjonalne, rozszerzenia)

### 🔧 Dla serwisu technicznego:
```json
{
  "servicePreferences": {
    "preferredTechnician": "EMP001",     // Preferowany technik
    "specialRequirements": [             // Specjalne wymagania
      "Dostęp przez balkon",
      "Wymaga wcześniejszego telefonu"
    ],
    "equipmentNotes": "Ma starą instalację elektryczną" // Uwagi techniczne
  }
}
```

### 💰 Dla finansów:
```json
{
  "billing": {
    "creditLimit": 1000,                 // Limit kredytowy (PLN)
    "paymentTerms": 14,                  // Termin płatności (dni)
    "defaultDiscount": 5,                // Domyślny rabat (%)
    "vatNumber": "PL1234567890"          // Numer VAT UE
  }
}
```

### 📍 Dla logistyki:
```json
{
  "logistics": {
    "deliveryInstructions": "Dzwonić przed przyjazdem", // Instrukcje dostawy
    "accessCodes": "Kod bramy: 1234#",   // Kody dostępu
    "parkingInfo": "Parking za budynkiem" // Info o parkowaniu
  }
}
```

## 🔗 RELACJE Z INNYMI DANYMI

### Klient jest powiązany z:
- **Zamówienia** → `orders.json` przez `clientId`
- **Wizyty** → `visits.json` przez `clientId`  
- **Historia kontaktów** → przez `employeeId` z `employees.json`

### Przykład użycia w zapytaniach:
```javascript
// Znajdź wszystkie zamówienia klienta
const clientOrders = orders.filter(order => order.clientId === "CLI25186001");

// Znajdź wszystkie kontakty z klientem
const clientContacts = client.contactHistory;

// Sprawdź dostępność klienta w poniedziałek
const mondayHours = client.availability.workingHours
  .find(day => day.dayOfWeek === "monday");
```

## ✅ WYMAGANE POLA MINIMALNE

```json
{
  "id": "CLI_AUTO_GENERATED",           // ✅ WYMAGANE - generowane automatycznie
  "name": "Nazwa/Imię",                 // ✅ WYMAGANE - nie może być puste
  "phone": "123456789",                 // ✅ WYMAGANE - główny kontakt
  "email": "",                          // Opcjonalne - może być puste
  "address": "",                        // Opcjonalne - może być puste
  "city": "",                           // Opcjonalne
  "dateAdded": "AUTO_GENERATED"         // ✅ WYMAGANE - generowane automatycznie
}
```

## 🎯 PRZYKŁADY RÓŻNYCH TYPÓW KLIENTÓW

### 👤 Osoba prywatna:
```json
{
  "name": "Jan Kowalski",
  "companyInfo": { "isCompany": false },
  "tags": ["Osoba prywatna", "Stały klient"]
}
```

### 🏢 Firma:
```json
{
  "name": "Tech Solutions Sp. z o.o.",
  "companyInfo": {
    "isCompany": true,
    "companyName": "Tech Solutions Sp. z o.o.",
    "nip": "1234567890"
  },
  "tags": ["Firma", "B2B", "Duży klient"]
}
```

### 🏥 Klient instytucjonalny:
```json
{
  "name": "Szpital Wojewódzki",
  "companyInfo": { "isCompany": true },
  "tags": ["Instytucja", "Sektor publiczny", "Umowa roczna"]
}
```

**🎯 Ta struktura pozwala na pełne zarządzanie klientami z maksymalną elastycznością!**