/**
 * 📊 KOMPLETNA STRUKTURA DANYCH CAŁEGO SYSTEMU
 * 
 * 🎯 WSZYSTKIE PLIKI I STRUKTURY W SYSTEMIE TECHNIK
 * 
 * Data: 2025-09-29
 * Lokalizacja: data/*.json
 */

const COMPLETE_SYSTEM_STRUCTURE = {

  // ========== 📋 ZLECENIA (orders.json) ==========
  ORDERS: {
    filename: "orders.json",
    records: 14,
    description: "Główne zlecenia serwisowe",
    structure: {
      // Identyfikatory
      id: "ORD25186001",                    // Główne ID zlecenia
      oldId: "ORD25186001",                 // Stare ID (backup)
      newId: "ORDW252710001",               // Nowe ID (nieużywane)
      
      // Klient
      clientId: "CLI25186001",              // ID klienta (po fix)
      clientName: "Mariusz Bielaszka",      // Nazwa klienta (cache)
      oldClientId: "OLD0001",               // Stare clientId (backup)
      
      // Zlecenie
      category: "Naprawa laptopa",          // Kategoria serwisu
      serviceType: "qwqw",                  // Typ serwisu (opcjonalny)
      description: "qwe",                   // Opis problemu
      
      // Harmonogram
      scheduledDate: "2025-07-20T08:14",    // Planowana data
      availability: "Nie określono",        // Dostępność klienta
      dates: ["2025-07-20T08:14"],          // Możliwe daty
      hours: null,                          // Godziny (nieużywane)
      end: null,                            // Koniec (nieużywane)
      
      // Status
      status: "pending",                    // Status zlecenia
      priority: "normal",                   // Priorytet
      
      // Urządzenia
      devices: [{
        name: "qwqw",                       // Nazwa urządzenia
        description: "qwe",                 // Opis problemu urządzenia
        builtInParams: {                    // System zabudowy
          demontaz: false,
          montaz: false,
          trudna: false,
          wolnostojacy: false,
          ograniczony: false,
          front: false,
          czas: false
        },
        builtInParamsNotes: {}              // Notatki zabudowy (puste)
      }],
      
      // Główne parametry zabudowy (duplikuje devices)
      builtInParams: { /* jak wyżej */ },
      
      // Metadane
      dateAdded: "2025-07-05T06:14:59.051Z", // Data dodania
      source: "W",                          // Źródło (W=Web)
      
      // Migracja
      migrated: true,
      migrationDate: "2025-09-28T22:12:00.365Z",
      migrationSource: "unified-id-system",
      idUpdated: true,
      idUpdateDate: "2025-09-28T20:08:24.461Z",
      clientIdFixed: true,
      clientIdFixDate: "2025-09-29T19:05:30.433Z"
    },
    
    // Możliwe wartości
    possibleValues: {
      category: [
        "Naprawa laptopa", "Naprawa telefonu", "serwis", 
        "instalacja", "konsultacja", "Serwis AGD", 
        "Zmywarka", "Pralka"
      ],
      status: ["pending"],  // Tylko pending w danych
      priority: ["normal"], // Tylko normal w danych
      source: ["W"]         // Tylko Web
    }
  },

  // ========== 👥 KLIENCI (clients.json) ==========
  CLIENTS: {
    filename: "clients.json", 
    records: "~100+",
    description: "Baza klientów",
    structure: {
      // Identyfikatory
      id: "CLI25186001",                    // Główne ID klienta
      legacyId: "#0001",                    // Stare ID systemu
      newId: "OLD0001",                     // ID przejściowe
      
      // Podstawowe dane
      name: "Mariusz Bielaszka",            // Imię i nazwisko
      phone: "123123123",                   // Telefon główny
      email: "bielaszkam2@gmail.com",       // Email
      
      // Adres
      address: "Słupia, 114 Pacanów",       // Pełny adres
      city: "Pacanów",                      // Miasto
      street: "Nie podano",                 // Ulica
      
      // Telefony (rozszerzone)
      phones: [{
        number: "123123123",                // Numer telefonu
        label: "Komórka",                   // Etykieta
        isPrimary: true,                    // Czy główny
        isActive: true,                     // Czy aktywny
        addedAt: "2025-07-05T06:14:59.048Z" // Data dodania
      }],
      
      // Historia
      history: [],                          // Historia kontaktów
      dateAdded: "2025-07-05T06:14:59.048Z", // Data dodania
      
      // Migracja
      migrated: true,
      migrationDate: "2025-09-28T22:12:00.353Z",
      migrationSource: "unified-id-system"
    },
    
    features: [
      "Wielokrotne numery telefonów",
      "Historia kontaktów", 
      "Pełne dane adresowe",
      "System migracji ID"
    ]
  },

  // ========== 👨‍🔧 PRACOWNICY (employees.json) ==========
  EMPLOYEES: {
    filename: "employees.json",
    records: "~5",
    description: "Pracownicy/Technicy",
    structure: {
      // Identyfikatory
      id: "EMP25189001",                    // ID pracownika
      oldId: "EMP25189001",                 // Stare ID (backup)
      
      // Podstawowe dane
      name: "Jan Kowalski",                 // Imię i nazwisko
      email: "jan.kowalski@techserwis.pl", // Email służbowy
      phone: "+48 123 456 789",             // Telefon
      address: "Warszawa",                  // Adres
      
      // Specjalizacje
      specializations: [                    // Lista specjalizacji
        "Serwis AGD",
        "Naprawa pralek"
      ],
      
      // Praca
      isActive: true,                       // Czy aktywny
      workingHours: "8:00-16:00",           // Godziny pracy
      experience: "5 lat",                  // Doświadczenie
      
      // Statystyki
      rating: 4.8,                          // Ocena (1-5)
      completedJobs: 245,                   // Ukończone zlecenia
      
      // Metadane
      dateAdded: "2025-07-08T22:25:15.180Z", // Data dodania
      migrationDate: "2025-09-28T22:12:00.370Z",
      migrationSource: "unified-id-system"
    },
    
    features: [
      "Specjalizacje techniczne",
      "System ocen i statystyk",
      "Godziny pracy",
      "Historia zleceń"
    ]
  },

  // ========== ✅ TODO PRACOWNIKÓW (employee_todos.json) ==========
  EMPLOYEE_TODOS: {
    filename: "employee_todos.json",
    records: "~10",
    description: "Zadania dla pracowników",
    structure: {
      // Identyfikatory
      id: "TOD75017368978",                 // ID zadania
      employeeId: "TEST_EMP_001",           // ID pracownika
      
      // Zadanie
      title: "Napraw laptop Dell",         // Tytuł zadania
      description: "Wymień ekran LCD w laptopie klienta", // Opis
      
      // Klasyfikacja
      priority: "high",                     // Priorytet (low/medium/high)
      category: "hardware",                 // Kategoria
      
      // Terminy
      dueDate: "2024-12-31",               // Termin wykonania
      completed: true,                      // Czy ukończone
      
      // Czas
      estimatedHours: 2,                    // Szacowany czas
      actualHours: 1.5,                    // Rzeczywisty czas
      
      // Powiązania
      linkedOrderId: "ORD123",             // ID powiązanego zlecenia
      
      // Organizacja
      tags: ["pilne", "laptop", "naprawa"], // Tagi
      attachments: [],                      // Załączniki
      
      // Metadane
      createdAt: "2025-09-29T19:43:37.368Z", // Data utworzenia
      updatedAt: "2025-09-29T19:43:37.388Z"  // Data aktualizacji
    },
    
    features: [
      "Przypisywanie do pracowników",
      "System priorytetów",
      "Śledzenie czasu pracy", 
      "Powiązania ze zleceniami",
      "Tagi i kategoryzacja"
    ]
  },

  // ========== 📅 WIZYTY/REZERWACJE (rezervacje.json) ==========
  VISITS: {
    filename: "rezervacje.json",
    records: "~50",
    description: "Zaplanowane wizyty serwisowe",
    structure: {
      // Identyfikatory  
      id: "VIS25186001",                    // ID wizyty
      oldId: "VIS25186001",                 // Stare ID (backup)
      
      // Klient (duplikuje dane z clients.json)
      name: "Mariusz Bielaszka",            // Imię klienta
      phone: "123123123",                   // Telefon
      email: "bielaszkam2@gmail.com",       // Email
      city: "Pacanów",                      // Miasto
      street: "Nie podano",                 // Ulica
      address: "Słupia, 114 Pacanów",       // Pełny adres
      
      // Serwis
      category: "Naprawa laptopa",          // Kategoria
      device: "qwqw",                       // Urządzenie
      problem: "qwe",                       // Problem
      
      // Termin
      date: "2025-07-20T08:14",            // Data i czas wizyty
      
      // Metadane  
      created_at: "2025-07-05T06:14:59.047Z", // Data utworzenia
      migrationDate: "2025-09-28T22:12:00.373Z",
      migrationSource: "unified-id-system"
    },
    
    issues: [
      "Duplikuje dane klientów",
      "Brak powiązania ze zleceniami", 
      "Brak statusu wizyty",
      "Brak przypisanego technika"
    ]
  },

  // ========== 📋 ZLECENIA SERWISOWE (service-orders.json) ==========
  SERVICE_ORDERS: {
    filename: "service-orders.json", 
    records: "~100",
    description: "Alternatywny system zleceń",
    structure: {
      // Identyfikatory
      id: "SRV25271002",                    // ID zlecenia serwisowego
      oldId: "ORD1758909200611",            // Stare ID
      
      // Status
      status: "new",                        // Status (new/in_progress/completed)
      
      // Klient
      customer: {
        name: "",                           // Nazwa klienta
        email: "",                          // Email  
        phone: "",                          // Telefon
        company: ""                         // Firma
      },
      
      // Serwis
      service: {
        device: "piekarnik",                // Urządzenie
        brand: "Bosch",                     // Marka
        model: "",                          // Model
        urgency: "normalny"                 // Pilność
      },
      
      // Adres
      address: {
        street: "mielec, sienkiewicza 4/7", // Ulica
        city: "inne"                        // Miasto
      },
      
      // Harmonogram
      scheduling: {
        preferredTime: "jutro popołudniu",  // Preferowany czas
        assignedTechnician: null,           // Przypisany technik
        scheduledDate: null                 // Zaplanowana data
      },
      
      // Koszty
      pricing: {
        estimated: null,                    // Szacowany koszt
        final: null,                        // Końcowy koszt
        travelCost: 50                      // Koszt dojazdu
      }
    },
    
    purpose: "Alternatywny system zleceń z rozszerzonymi funkcjami"
  },

  // ========== ⚙️ KONFIGURACJA I POMOCNICZE ==========
  
  SPECIALIZATIONS: {
    filename: "specializations.json",
    description: "Lista specjalizacji technicznych",
    examples: ["Serwis AGD", "Naprawa laptopów", "Instalacje"]
  },
  
  DOCUMENT_NUMBERS: {
    filename: "documentNumbers.json", 
    description: "Liczniki numerów dokumentów",
    structure: {
      orders: { current: 15, prefix: "ORD" },
      invoices: { current: 1, prefix: "FV" }
    }
  },
  
  PRICING_RULES: {
    filename: "pricingRules.json",
    description: "Zasady wyceny usług",
    structure: {
      baseRates: {},
      travelCosts: {},
      specializations: {}
    }
  },
  
  DISTANCE_SETTINGS: {
    filename: "distanceSettings.json", 
    description: "Ustawienia kosztów dojazdu"
  },
  
  EMPLOYEE_SETTINGS: {
    filename: "employeeSettings.json",
    description: "Ustawienia pracowników"
  },
  
  AI_SETTINGS: {
    filename: "ai-settings.json",
    description: "Konfiguracja AI/ML"
  },
  
  ACCOUNTS: {
    filename: "accounts.json",
    description: "Konta użytkowników systemu"
  },
  
  MODELS_DATABASE: {
    filename: "modelsDatabase.json", 
    description: "Baza modeli urządzeń"
  },
  
  DAILY_COUNTERS: {
    filename: "daily-counters.json",
    description: "Liczniki dzienne"
  },
  
  AUTO_SERVICE_ORDERS: {
    filename: "auto-service-orders.json",
    description: "Automatyczne zlecenia serwisowe"
  }
};

// ========== 📊 PODSUMOWANIE SYSTEMU ==========

const SYSTEM_SUMMARY = {
  totalFiles: 15,
  mainDataFiles: 5,  // orders, clients, employees, employee_todos, rezervacje
  configFiles: 10,
  
  dataRelationships: {
    // Główne połączenia między danymi
    "orders.clientId": "clients.id",           // Zlecenie → Klient
    "employee_todos.employeeId": "employees.id", // TODO → Pracownik  
    "employee_todos.linkedOrderId": "orders.id", // TODO → Zlecenie
    "rezervacje.name": "clients.name",         // Wizyta → Klient (słabe)
  },
  
  duplicatedData: [
    // Dane które się powtarzają w różnych plikach
    "Dane klientów w orders.json i clients.json",
    "Dane klientów w rezervacje.json i clients.json", 
    "builtInParams w orders.devices i orders.builtInParams",
    "ID w różnych formatach (id, oldId, newId)"
  ],
  
  unusedFields: [
    // Pola które są zawsze puste/null
    "orders.hours", "orders.end", "orders.builtInParamsNotes",
    "service-orders.customer.* (często puste)",
    "clients.history (zawsze puste)"
  ],
  
  migrationFields: [
    // Pola związane z migracjami
    "migrated", "migrationDate", "migrationSource", 
    "idUpdated", "idUpdateDate", "clientIdFixed", "clientIdFixDate",
    "oldId", "newId", "legacyId", "oldClientId"
  ],
  
  recommendations: [
    "🔄 Znormalizować dane klientów - usunąć duplikaty",
    "🧹 Oczyścić nieużywane pola (hours, end, builtInParamsNotes)",
    "📝 Przenieść metadane migracji do osobnej tabeli",
    "🔗 Stworzyć jasne relacje między tabelami",
    "✅ Zunifikować systemy zleceń (orders vs service-orders)", 
    "🗑️ Usunąć redundantne builtInParams",
    "📊 Dodać brakujące pola (koszty, status history, przypisania)"
  ]
};

module.exports = {
  COMPLETE_SYSTEM_STRUCTURE,
  SYSTEM_SUMMARY
};