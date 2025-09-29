/**
 * AKTUALNA STRUKTURA DANYCH ZLECEŃ - ANALIZA
 * 
 * 📂 Plik: data/orders.json
 * 📊 Rekordów: 14 zleceń
 * 🕐 Ostatnia aktualizacja: 2025-09-29
 * 
 * ✅ AKTUALNIE UŻYWANE POLA (z rzeczywistych danych):
 */

const CURRENT_ORDER_STRUCTURE = {
  // ========== IDENTYFIKATORY ==========
  
  // Główne ID (po migracji)
  id: "ORD25186001",                    // Format: ORD + rok + dzień + numer
  
  // Nowe ID (po unified-id-system)
  newId: "ORDW252710001",               // Format: ORDW + data + numer
  
  // Stare ID (przed migracją)
  oldId: "ORD25186001",                 // Zachowane dla kompatybilności
  
  // ========== KLIENT ==========
  
  // ID klienta (po fix-client-ids)
  clientId: "CLI25186001",              // Format: CLI + 8 cyfr
  
  // Nazwa klienta (dodana automatycznie)
  clientName: "Mariusz Bielaszka",      // Z pliku clients.json
  
  // Stare ID klienta (przed poprawką)
  oldClientId: "OLD0001",               // Zachowane dla historii
  
  // ========== OPIS ZLECENIA ==========
  
  // Kategoria (wymagana)
  category: "Naprawa laptopa",          // Możliwe wartości:
  /*
    "Naprawa laptopa"
    "Naprawa telefonu" 
    "serwis"
    "instalacja"
    "konsultacja"
    "Serwis AGD"
    "Zmywarka"
    "Pralka"
  */
  
  // Typ serwisu (opcjonalny)
  serviceType: "qwqw",                  // Często pusty string ""
  
  // Opis problemu (wymagany)
  description: "qwe",                   // Minimalna długość
  
  // ========== HARMONOGRAMOWANIE ==========
  
  // Data serwisu
  scheduledDate: "2025-07-20T08:14",    // ISO datetime format
  
  // Dostępność klienta (nowsze zlecenia)
  availability: "Nie określono",        // Dodane w nowszych rekordach
  
  // Możliwe daty (tablica)
  dates: ["2025-07-20T08:14"],          // Może być pusta []
  
  // Godziny (obecnie zawsze null)
  hours: null,
  
  // Koniec (obecnie zawsze null)  
  end: null,
  
  // ========== STATUS I PRIORYTET ==========
  
  // Status (wszystkie obecnie "pending")
  status: "pending",                    // Możliwe: pending, completed, cancelled
  
  // Priorytet (wszystkie obecnie "normal")
  priority: "normal",                   // Możliwe: low, normal, high, urgent
  
  // ========== URZĄDZENIA ==========
  
  // Lista urządzeń (wymagana, min 1)
  devices: [
    {
      // Nazwa urządzenia (może być pusta)
      name: "qwqw",                     // Często pusty string ""
      
      // Opis problemu urządzenia
      description: "qwe",               // Duplikuje główny description
      
      // System zabudowy (zawsze obecny)
      builtInParams: {
        demontaz: false,                // Zawsze false w danych
        montaz: false,                  // Zawsze false w danych
        trudna: false,                  // Zawsze false w danych
        wolnostojacy: false,            // Zawsze false w danych
        ograniczony: false,             // Zawsze false w danych
        front: false,                   // Zawsze false w danych
        czas: false                     // Zawsze false w danych
      },
      
      // Notatki do zabudowy (zawsze pusty)
      builtInParamsNotes: {}            // Zawsze pusty obiekt
    }
  ],
  
  // Główne parametry zabudowy (duplikuje devices[0].builtInParams)
  builtInParams: {
    demontaz: false,                    // Zawsze false
    montaz: false,                      // Zawsze false
    trudna: false,                      // Zawsze false
    wolnostojacy: false,                // Zawsze false
    ograniczony: false,                 // Zawsze false
    front: false,                       // Zawsze false
    czas: false                         // Zawsze false
  },
  
  // ========== METADANE ==========
  
  // Data dodania (oryginalna)
  dateAdded: "2025-07-05T06:14:59.051Z", // ISO datetime
  
  // Źródło zlecenia
  source: "W",                          // "W" = Web interface
  
  // ========== METADANE MIGRACJI ==========
  
  // Czy zmigrowane
  migrated: true,                       // Wszystkie true
  
  // Data migracji
  migrationDate: "2025-09-28T22:12:00.365Z",
  
  // Źródło migracji
  migrationSource: "unified-id-system", // System migracji
  
  // Czy ID zostało zaktualizowane
  idUpdated: true,                      // Wszystkie true
  
  // Data aktualizacji ID
  idUpdateDate: "2025-09-28T20:08:24.461Z",
  
  // Czy clientId zostało naprawione
  clientIdFixed: true,                  // Wszystkie true
  
  // Data naprawy clientId
  clientIdFixDate: "2025-09-29T19:05:30.433Z"
};

// ========== STATYSTYKI AKTUALNYCH DANYCH ==========

const CURRENT_DATA_STATS = {
  totalOrders: 14,
  
  // Rozkład kategorii
  categories: {
    "Naprawa laptopa": 2,
    "Naprawa telefonu": 1,
    "serwis": 3,
    "instalacja": 2,
    "konsultacja": 1,
    "Serwis AGD": 1,
    "Zmywarka": 1,
    "Pralka": 1,
    "undefined": 2  // Brak kategorii
  },
  
  // Wszytkie statusy
  statuses: {
    "pending": 14    // Wszystkie zlecenia w statusie pending
  },
  
  // Wszystkie priorytety  
  priorities: {
    "normal": 14     // Wszystkie zlecenia z priorytetem normal
  },
  
  // Klienci
  clients: {
    "CLI25186001": "Mariusz Bielaszka",
    "CLI25186002": "Kręgielnia Laguna", 
    "CLI25186003": "Marisz",
    "CLI25186004": "123",
    "CLI25186005": "Mariusz",
    "CLI25186006": "acsasc",
    "CLI25186007": "ada",
    "CLI25186008": "qwe",
    "CLI25186009": "Mariusz Bielaszka",
    "CLI25187010": "124",
    "CLI25187011": "Mariusz Bielaszka",
    "CLI25265012": "ad",
    "CLI25266013": "MAriusz Bielaszka",
    "CLI25266014": "MAriusz Bielaszka"
  },
  
  // Pola zawsze puste/null
  alwaysEmpty: [
    "hours",           // Zawsze null
    "end",             // Zawsze null
    "builtInParamsNotes", // Zawsze pusty {}
    "serviceType"      // Często pusty string
  ],
  
  // Pola zawsze false
  alwaysFalse: [
    "builtInParams.demontaz",
    "builtInParams.montaz", 
    "builtInParams.trudna",
    "builtInParams.wolnostojacy",
    "builtInParams.ograniczony",
    "builtInParams.front",
    "builtInParams.czas"
  ],
  
  // Pola zawsze true (po migracjach)
  alwaysTrue: [
    "migrated",
    "idUpdated", 
    "clientIdFixed"
  ],
  
  // Formaty ID
  idFormats: {
    originalId: "ORD + 8 cyfr",      // ORD25186001
    newId: "ORDW + 9 cyfr",          // ORDW252710001  
    clientId: "CLI + 8 cyfr",        // CLI25186001
    oldClientId: "OLD + 4 cyfry"     // OLD0001
  }
};

// ========== PROBLEMY I OBSERWACJE ==========

const CURRENT_ISSUES = {
  dataQuality: [
    "Większość opisów to placeholder text (qwe, qwqw, ad, 21, 24)",
    "Wszystkie builtInParams są false - prawdopodobnie nieużywane",
    "Duplikacja opisu w devices[0].description i głównym description",
    "Brak rzeczywistych dat serwisu - głównie daty z przeszłości",
    "Wszystkie zlecenia w statusie pending - brak workflow",
    "serviceType często pusty"
  ],
  
  structuralIssues: [
    "Redundancja: builtInParams powtarzane w urządzeniu i głównie",
    "Nieużywane pola: hours, end, builtInParamsNotes", 
    "Zbyt wiele pól migracyjnych w głównej strukturze",
    "Brak walidacji długości opisów",
    "Kategorie niespójne (mix polskich i angielskich nazw)"
  ],
  
  missingFeatures: [
    "Brak przypisanych techników", 
    "Brak kosztów i rozliczeń",
    "Brak historii zmian statusów",
    "Brak zdjęć/dokumentów",
    "Brak notatek technicznych",
    "Brak informacji kontaktowych klienta w zleceniu",
    "Brak części użytych do naprawy"
  ]
};

// ========== PROPOZYCJA OCZYSZCZENIA ==========

const CLEANED_STRUCTURE_PROPOSAL = {
  // Zachować obecne pola (działa)
  keep: [
    "id",                    // Główne ID
    "clientId",              // ID klienta (po fix)
    "clientName",            // Nazwa klienta
    "category",              // Kategoria
    "serviceType",           // Typ serwisu
    "description",           // Opis
    "scheduledDate",         // Data serwisu
    "status",                // Status
    "priority",              // Priorytet
    "devices",               // Urządzenia
    "dateAdded",             // Data dodania
    "source"                 // Źródło
  ],
  
  // Dodać nowe pola (potrzebne)
  add: [
    "assignedTechnician",    // Przypisany technik
    "estimatedCost",         // Szacowany koszt
    "actualCost",            // Rzeczywisty koszt
    "technicianNotes",       // Notatki technika
    "clientPhone",           // Telefon klienta
    "clientEmail",           // Email klienta
    "address",               // Adres serwisu
    "statusHistory",         // Historia statusów
    "partsUsed",             // Użyte części
    "photos",                // Zdjęcia
    "completedAt",           // Data ukończenia
    "workDuration",          // Czas pracy
    "clientFeedback"         // Opinia klienta
  ],
  
  // Przenieść do metadanych (archiwum)
  moveToMetadata: [
    "oldId",                 // Stare ID
    "newId",                 // Nowe ID (unused)
    "migrated",              // Flaga migracji
    "migrationDate",         // Data migracji
    "migrationSource",       // Źródło migracji
    "idUpdated",             // Flaga aktualizacji ID
    "idUpdateDate",          // Data aktualizacji ID
    "clientIdFixed",         // Flaga poprawki clientId
    "clientIdFixDate",       // Data poprawki clientId
    "oldClientId"            // Stare clientId
  ],
  
  // Usunąć (nieużywane/redundantne)
  remove: [
    "hours",                 // Zawsze null
    "end",                   // Zawsze null
    "builtInParamsNotes",    // Zawsze pusty
    "availability",          // Duplikuje scheduledDate
    "builtInParams"          // Zawsze false, redundantne z devices
  ]
};

module.exports = {
  CURRENT_ORDER_STRUCTURE,
  CURRENT_DATA_STATS,
  CURRENT_ISSUES,
  CLEANED_STRUCTURE_PROPOSAL
};