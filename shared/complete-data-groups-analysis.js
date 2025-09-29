/**
 * 📊 PEŁNA STRUKTURA WSZYSTKICH GRUP DANYCH
 * 
 * 🎯 KOMPLETNY PRZEGLĄD WSZYSTKICH DANYCH W SYSTEMIE
 * 
 * Data: 2025-09-29
 * Źródło: Rzeczywiste pliki data/*.json
 */

const COMPLETE_DATA_GROUPS = {

  // ========== 📋 GRUPA 1: ZLECENIA (orders.json) ==========
  ORDERS: {
    filename: "orders.json",
    count: 14,
    description: "Główne zlecenia serwisowe",
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "ORD25186001",                    // Format: ORD + 8 cyfr
      oldId: "ORD25186001",                 // Backup starego ID
      newId: "ORDW252710001",               // Nowe ID (nieużywane)
      
      // === KLIENT ===
      clientId: "CLI25186001",              // ID klienta (po naprawie)
      clientName: "Mariusz Bielaszka",      // Cache nazwy klienta
      oldClientId: "OLD0001",               // Stare clientId (backup)
      
      // === ZLECENIE ===
      category: "Naprawa laptopa",          // Kategoria serwisu
      serviceType: "qwqw",                  // Typ/nazwa serwisu
      description: "qwe",                   // Opis problemu
      
      // === HARMONOGRAM ===
      scheduledDate: "2025-07-20T08:14",   // Planowana data ISO
      availability: "Nie określono",        // Dostępność klienta (nowsze)
      dates: ["2025-07-20T08:14"],         // Array dostępnych dat
      hours: null,                          // Godziny (zawsze null)
      end: null,                           // Koniec (zawsze null)
      
      // === STATUS I PRIORYTET ===
      status: "pending",                    // Wszystkie "pending"
      priority: "normal",                   // Wszystkie "normal"
      
      // === URZĄDZENIA ===
      devices: [{
        name: "qwqw",                       // Nazwa urządzenia
        description: "qwe",                 // Opis problemu urządzenia
        builtInParams: {                    // System zabudowy (zawsze false)
          demontaz: false,
          montaz: false,
          trudna: false,
          wolnostojacy: false,
          ograniczony: false,
          front: false,
          czas: false
        },
        builtInParamsNotes: {}              // Notatki (zawsze puste)
      }],
      
      // === GŁÓWNE PARAMETRY ZABUDOWY (duplikuje devices) ===
      builtInParams: {                     // Identyczne jak devices[0].builtInParams
        demontaz: false,
        montaz: false,
        trudna: false,
        wolnostojacy: false,
        ograniczony: false,
        front: false,
        czas: false
      },
      
      // === METADANE ===
      dateAdded: "2025-07-05T06:14:59.051Z", // Data dodania ISO
      source: "W",                          // Źródło (W = Web)
      
      // === METADANE MIGRACJI ===
      migrated: true,                       // Wszystkie true
      migrationDate: "2025-09-28T22:12:00.365Z",
      migrationSource: "unified-id-system",
      idUpdated: true,                      // Wszystkie true
      idUpdateDate: "2025-09-28T20:08:24.461Z",
      clientIdFixed: true,                  // Wszystkie true
      clientIdFixDate: "2025-09-29T19:05:30.433Z"
    },
    
    // MOŻLIWE WARTOŚCI
    possibleValues: {
      category: [
        "Naprawa laptopa", "Naprawa telefonu", "serwis", 
        "instalacja", "konsultacja", "Serwis AGD", 
        "Zmywarka", "Pralka"
      ],
      status: ["pending"],                  // Tylko pending
      priority: ["normal"],                 // Tylko normal
      source: ["W"]                        // Tylko Web
    }
  },

  // ========== 👥 GRUPA 2: KLIENCI (clients.json) ==========
  CLIENTS: {
    filename: "clients.json", 
    count: "~100+",
    description: "Baza danych klientów z rozszerzonymi funkcjami",
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "CLI25186001",                    // Główne ID klienta
      legacyId: "#0001",                    // Stare ID systemu
      newId: "OLD0001",                     // ID przejściowe
      
      // === PODSTAWOWE DANE ===
      name: "Mariusz Bielaszka",            // Imię i nazwisko
      phone: "123123123",                   // Telefon główny
      email: "bielaszkam2@gmail.com",       // Email główny
      
      // === ADRES GŁÓWNY ===
      address: "Słupia, 114 Pacanów",       // Pełny adres
      city: "Pacanów",                      // Miasto
      street: "Nie podano",                 // Ulica
      
      // === ROZSZERZONE TELEFONY ===
      phones: [{
        number: "123123123",                // Numer telefonu
        label: "Komórka",                   // Etykieta
        isPrimary: true,                    // Czy główny
        notes: "Główny numer kontaktowy"    // Notatki
      }],
      
      // === ROZSZERZONE ADRESY ===
      addresses: [{
        address: "Słupia, 114 Pacanów",     // Pełny adres
        label: "Dom",                       // Etykieta
        isPrimary: true,                    // Czy główny
        coordinates: null,                  // Współrzędne GPS
        notes: "Główne miejsce zamieszkania" // Notatki
      }],
      
      // === NOTATKI ===
      notes: [{
        id: "note1",                        // ID notatki
        content: "Stały klient serwisu AGD, zawsze punktualny",
        type: "general",                    // Typ notatki
        createdAt: "2025-09-28T20:00:00.000Z",
        createdBy: "system"                 // Kto dodał
      }],
      
      // === TAGI ===
      tags: [
        "Stały klient",
        "Punktualny", 
        "AGD"
      ],
      
      // === DOSTĘPNOŚĆ ===
      availability: {
        workingHours: [{
          dayOfWeek: "monday",              // Dzień tygodnia
          startTime: "08:00",               // Godzina od
          endTime: "16:00",                 // Godzina do
          isAvailable: true                 // Czy dostępny
        }],
        preferredTime: "morning",           // Preferowany czas
        notes: "Dostępny rano"             // Uwagi
      },
      
      // === HISTORIA ===
      history: [],                          // Historia kontaktów (puste)
      
      // === METADANE ===
      dateAdded: "2025-07-05T06:14:59.048Z", // Data dodania
      migrated: true,
      migrationDate: "2025-09-28T22:12:00.353Z",
      migrationSource: "unified-id-system"
    },
    
    features: [
      "✅ Wielokrotne numery telefonów z etykietami",
      "✅ Wielokrotne adresy z GPS", 
      "✅ System notatek z typami",
      "✅ Tagi dla kategoryzacji",
      "✅ Harmonogram dostępności",
      "✅ Historia kontaktów"
    ]
  },

  // ========== 📅 GRUPA 3: WIZYTY (rezervacje.json) ==========
  VISITS: {
    filename: "rezervacje.json",
    count: "~50",
    description: "Zaplanowane wizyty serwisowe",
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "VIS25186001",                    // ID wizyty
      oldId: "VIS25186001",                 // Stare ID (backup)
      
      // === DANE KLIENTA (DUPLIKUJE clients.json) ===
      name: "Mariusz Bielaszka",            // Imię i nazwisko
      phone: "123123123",                   // Telefon
      email: "bielaszkam2@gmail.com",       // Email
      
      // === ADRES WIZYTY ===
      city: "Pacanów",                      // Miasto
      street: "Nie podano",                 // Ulica
      address: "Słupia, 114 Pacanów",       // Pełny adres
      
      // === SERWIS ===
      category: "Naprawa laptopa",          // Kategoria
      device: "qwqw",                       // Urządzenie
      problem: "qwe",                       // Opis problemu
      
      // === TERMIN ===
      date: "2025-07-20T08:14",            // Data i czas wizyty ISO
      
      // === METADANE ===
      created_at: "2025-07-05T06:14:59.047Z", // Data utworzenia
      migrationDate: "2025-09-28T22:12:00.373Z",
      migrationSource: "unified-id-system"
    },
    
    // PRZYKŁADY RÓŻNYCH WIZYT
    examples: [
      {
        id: "VIS25186001",
        name: "Mariusz Bielaszka",
        category: "Naprawa laptopa",
        device: "qwqw",
        problem: "qwe"
      },
      {
        id: "VIS25186002", 
        name: "Kręgielnia Laguna",
        category: "Naprawa telefonu",
        device: "sc",
        problem: "sdv"
      },
      {
        id: "VIS25186003",
        name: "Marisz",
        category: "serwis",
        device: "Nie określono",
        problem: "Brak opisu"
      }
    ],
    
    issues: [
      "❌ Duplikuje dane klientów z clients.json",
      "❌ Brak relacji z orders.json",
      "❌ Brak statusu wizyty (zaplanowana/w trakcie/ukończona)",
      "❌ Brak przypisanego technika",
      "❌ Brak kosztów wizyty"
    ]
  },

  // ========== 👨‍🔧 GRUPA 4: PRACOWNICY (employees.json) ==========
  EMPLOYEES: {
    filename: "employees.json",
    count: 5,
    description: "Baza pracowników/techników", 
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "EMP25189001",                    // ID pracownika
      oldId: "EMP25189001",                 // Stare ID (backup)
      
      // === DANE OSOBOWE ===
      name: "Jan Kowalski",                 // Imię i nazwisko
      email: "jan.kowalski@techserwis.pl", // Email służbowy
      phone: "+48 123 456 789",             // Telefon
      address: "Warszawa",                  // Adres zamieszkania
      
      // === SPECJALIZACJE ===
      specializations: [                    // Lista umiejętności
        "Serwis AGD",
        "Naprawa pralek"
      ],
      
      // === PRACA ===
      isActive: true,                       // Czy aktywny
      workingHours: "8:00-16:00",           // Godziny pracy
      experience: "5 lat",                  // Doświadczenie
      
      // === STATYSTYKI ===
      rating: 4.8,                          // Ocena (1.0-5.0)
      completedJobs: 245,                   // Ukończone zlecenia
      
      // === METADANE ===
      dateAdded: "2025-07-08T22:25:15.180Z", // Data dodania
      migrationDate: "2025-09-28T22:12:00.370Z",
      migrationSource: "unified-id-system"
    },
    
    // PRZYKŁADY PRACOWNIKÓW
    examples: [
      {
        id: "EMP25189001",
        name: "Jan Kowalski",
        specializations: ["Serwis AGD", "Naprawa pralek"],
        rating: 4.8,
        completedJobs: 245
      },
      {
        id: "EMP25189002", 
        name: "Anna Nowak",
        specializations: ["Serwis komputerowy", "Naprawa laptopów"],
        rating: 4.6,
        completedJobs: 189
      }
    ],
    
    features: [
      "✅ System specjalizacji technicznych",
      "✅ Oceny i statystyki wydajności",
      "✅ Godziny pracy i dostępność",
      "✅ Historia ukończonych zleceń"
    ]
  },

  // ========== ✅ GRUPA 5: TODO PRACOWNIKÓW (employee_todos.json) ==========
  EMPLOYEE_TODOS: {
    filename: "employee_todos.json",
    count: 1,
    description: "Zadania przypisane do pracowników",
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "TOD75017368978",                 // ID zadania
      employeeId: "TEST_EMP_001",           // ID pracownika → employees.json
      
      // === ZADANIE ===
      title: "Napraw laptop Dell",         // Tytuł zadania
      description: "Wymień ekran LCD w laptopie klienta", // Szczegóły
      
      // === KLASYFIKACJA ===
      priority: "high",                     // Priorytet (low/medium/high/urgent)
      category: "hardware",                 // Kategoria zadania
      
      // === TERMINY ===
      dueDate: "2024-12-31",               // Termin wykonania
      completed: true,                      // Czy ukończone
      
      // === CZAS PRACY ===
      estimatedHours: 2,                    // Szacowany czas (godziny)
      actualHours: 1.5,                    // Rzeczywisty czas
      
      // === POWIĄZANIA ===
      linkedOrderId: null,                  // ID powiązanego zlecenia → orders.json
      
      // === ORGANIZACJA ===
      tags: [                               // Tagi do wyszukiwania
        "pilne",
        "laptop", 
        "naprawa"
      ],
      attachments: [],                      // Załączniki (puste)
      
      // === METADANE ===
      createdAt: "2025-09-29T19:43:37.368Z", // Data utworzenia
      updatedAt: "2025-09-29T19:43:37.388Z"  // Data ostatniej aktualizacji
    },
    
    features: [
      "✅ Przypisywanie zadań do konkretnych pracowników",
      "✅ System priorytetów i kategorii",
      "✅ Śledzenie czasu pracy (szacowany vs rzeczywisty)",
      "✅ Powiązania ze zleceniami serwisowymi",
      "✅ Tagi dla łatwego wyszukiwania",
      "✅ Załączniki do zadań"
    ]
  },

  // ========== 📋 GRUPA 6: ZLECENIA SERWISOWE (service-orders.json) ==========
  SERVICE_ORDERS: {
    filename: "service-orders.json",
    count: "~100", 
    description: "Alternatywny system zleceń z rozszerzonymi funkcjami",
    
    // PEŁNA STRUKTURA Z RZECZYWISTYMI DANYMI
    fullStructure: {
      // === IDENTYFIKATORY ===
      id: "SRV25271002",                    // ID zlecenia serwisowego
      oldId: "ORD1758909200611",            // Stare ID przed migracją
      
      // === STATUS ===
      status: "new",                        // Status (new/in_progress/completed/cancelled)
      
      // === KLIENT ===
      customer: {
        name: "",                           // Nazwa klienta (często puste)
        email: "",                          // Email (często puste)
        phone: "",                          // Telefon (często puste)
        company: ""                         // Firma (często puste)
      },
      
      // === SERWIS ===
      service: {
        device: "piekarnik",                // Typ urządzenia
        brand: "Bosch",                     // Marka
        model: "",                          // Model (często puste)
        urgency: "normalny"                 // Pilność (normalny/pilny/bardzo pilny)
      },
      
      // === ADRES SERWISU ===
      address: {
        street: "mielec, sienkiewicza 4/7", // Ulica i numer
        city: "inne"                        // Miasto
      },
      
      // === HARMONOGRAMOWANIE ===
      scheduling: {
        preferredTime: "jutro popołudniu ", // Preferowany czas (tekst)
        assignedTechnician: null,           // Przypisany technik (puste)
        scheduledDate: null                 // Zaplanowana data (puste)
      },
      
      // === KOSZTY ===
      pricing: {
        estimated: null,                    // Szacowany koszt (puste)
        final: null,                        // Końcowy koszt (puste)
        travelCost: 50                      // Koszt dojazdu
      },
      
      // === METADANE ===
      migrationDate: "2025-09-28T22:13:14.011Z",
      migrationSource: "manual-cleanup"
    },
    
    // PRZYKŁADY ZLECEŃ
    examples: [
      {
        id: "SRV25271002",
        service: { device: "piekarnik", brand: "Bosch", urgency: "normalny" },
        address: { street: "mielec, sienkiewicza 4/7", city: "inne" },
        pricing: { travelCost: 50 }
      },
      {
        id: "SRV25271003", 
        service: { device: "lodówka", brand: "Samsung", urgency: "normalny" },
        address: { street: "dębica, sienkiewicza 4", city: "dębica" },
        pricing: { travelCost: 60 }
      }
    ],
    
    advantages: [
      "✅ Rozdzielenie danych klienta od zlecenia",
      "✅ Szczegółowe informacje o urządzeniu (marka, model)",
      "✅ System kosztów z dojazdami",
      "✅ Elastyczny harmonogram",
      "✅ Poziomy pilności"
    ],
    
    issues: [
      "❌ Często puste dane klientów",
      "❌ Brak przypisanych techników",
      "❌ Brak dat zaplanowanych",
      "❌ Duplikuje funkcjonalność orders.json"
    ]
  }
};

// ========== 🔗 RELACJE MIĘDZY GRUPAMI ==========

const DATA_RELATIONSHIPS = {
  // Istniejące relacje
  existing: {
    "orders.clientId": "clients.id",           // Zlecenie → Klient
    "employee_todos.employeeId": "employees.id", // TODO → Pracownik
    "employee_todos.linkedOrderId": "orders.id", // TODO → Zlecenie
  },
  
  // Słabe relacje (przez nazwy/teksty)
  weak: {
    "rezervacje.name": "clients.name",         // Wizyta → Klient (nazwa)
    "rezervacje.phone": "clients.phone",       // Wizyta → Klient (telefon)
  },
  
  // Brakujące relacje (powinny być)
  missing: {
    "orders.assignedTechnicianId": "employees.id", // Zlecenie → Technik
    "rezervacje.clientId": "clients.id",           // Wizyta → Klient (ID)
    "rezervacje.assignedTechnicianId": "employees.id", // Wizyta → Technik
    "service-orders.assignedTechnician": "employees.id", // Serwis → Technik
  }
};

// ========== 📊 STATYSTYKI SYSTEMU ==========

const SYSTEM_STATISTICS = {
  totalRecords: {
    orders: 14,
    clients: "~100+",
    visits: "~50", 
    employees: 5,
    todos: 1,
    serviceOrders: "~100"
  },
  
  dataQuality: {
    orders: "Niska - głównie placeholder text",
    clients: "Wysoka - pełne dane z rozszerzeniami",
    visits: "Średnia - duplikuje dane klientów",
    employees: "Wysoka - kompletne profile",
    todos: "Wysoka - jeden przykład pełny",
    serviceOrders: "Niska - głównie puste pola klientów"
  },
  
  usagePatterns: {
    orders: "Wszystkie pending, brak workflow",
    clients: "Bogata struktura, dobra normalizacja",
    visits: "Redundantne z orders",
    employees: "Gotowe do użycia",
    todos: "Nowa funkcjonalność, mało danych",
    serviceOrders: "Alternatywny system, duplikuje orders"
  }
};

module.exports = {
  COMPLETE_DATA_GROUPS,
  DATA_RELATIONSHIPS,
  SYSTEM_STATISTICS
};