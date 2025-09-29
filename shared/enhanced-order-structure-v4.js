/**
 * ENHANCED ORDER STRUCTURE v4.0 - KOMPATYBILNA Z AGD MOBILE
 * 
 * 🎯 CEL: Zachować 100% kompatybilność z aplikacją mobilną AGD + dodać nowe funkcje
 * 
 * ✅ ZACHOWANE z AGD Mobile:
 * 🏠 System zabudowy (builtInParams, builtInParamsNotes)
 * 📞 Wykrywanie połączeń (detectedCall, entryTime) 
 * 📧 Google Contacts (updateGoogleContact, googleContactData)
 * 🔧 Urządzenia AGD (8 typów, kody błędów, części)
 * 📝 Historia z emoji (history z szczegółowymi opisami)
 * ⏰ Godziny pracy (workHours, workHoursCustom, clientWorkHours)
 * 
 * ✅ NOWE funkcje:
 * 🏥 System wizyt (visitId, appointmentDate, technicianNotes)
 * 🆔 Poprawne clientId (CLI25186001 zamiast OLD0001)
 * 📋 Nowy format orderNumber (ORDA25292001)
 * 🔄 Kompatybilność z serwerem (JSON/Context ready)
 * 
 * 📱 STRATEGIA MIGRACJI dla aplikacji mobilnej:
 * - Wszystkie istniejące pola AGD Mobile działają bez zmian
 * - Nowe pola są opcjonalne (nullable: true)
 * - Stare formaty ID są wspierane przez mapowanie
 * - Proces migracji stopniowy, bez przerw w działaniu
 */

const ENHANCED_ORDER_STRUCTURE_V4 = {
  tableName: "enhanced_orders_v4",
  displayName: "Zlecenia Enhanced v4.0 - Kompatybilne z AGD Mobile",
  icon: "clipboard-check",
  version: "4.0.0",
  compatibility: {
    agdMobile: "100%",
    webApp: "100%", 
    server: "100%"
  },
  
  fields: {
    // ========== PODSTAWOWE ID (ROZSZERZONE) ==========
    id: { type: "ID", primaryKey: true, autoIncrement: true },
    
    // 🆕 NOWY: Ujednolicony system numerów
    orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // ORDA25292001
    
    // 🔄 KOMPATYBILNOŚĆ: Stare pola AGD Mobile (zachowane)
    id_legacy: { type: "STRING", length: 20, nullable: true, label: "Stare ID AGD Mobile" }, // Np. ORD001
    
    // Źródło zlecenia
    source: { type: "ENUM", values: ["web", "mobile", "api", "agd_mobile"], default: "web", label: "Źródło" },
    
    // ========== KLIENT (POPRAWIONY + KOMPATYBILNY) ==========
    // 🆕 NOWY: Poprawny format clientId
    clientId: { type: "STRING", length: 20, required: true, label: "ID klienta" }, // CLI25186001
    
    // 🔄 KOMPATYBILNOŚĆ: Stare pole z AGD Mobile (zachowane)
    clientId_legacy: { type: "STRING", length: 20, nullable: true, label: "Stare clientId AGD Mobile" }, // OLD0001
    
    // Cache nazwy klienta (z AGD Mobile)
    clientName: { type: "STRING", length: 200, required: true, label: "Nazwa klienta" },
    
    // Podstawowe dane kontaktowe (z AGD Mobile)
    address: { type: "STRING", length: 500, required: true, label: "Adres" },
    phone: { type: "STRING", length: 20, required: true, label: "Telefon" },
    
    // ========== 🆕 NOWY: SYSTEM WIZYT ==========
    visitId: { type: "STRING", length: 20, nullable: true, label: "ID wizyty" }, // VIS25292001
    appointmentDate: { type: "DATETIME", nullable: true, label: "Data wizyty" },
    appointmentTime: { type: "STRING", length: 10, nullable: true, label: "Godzina wizyty" },
    visitStatus: { 
      type: "ENUM", 
      values: ["planned", "confirmed", "in_progress", "completed", "cancelled"],
      nullable: true,
      label: "Status wizyty" 
    },
    technicianId: { type: "STRING", length: 20, nullable: true, label: "ID technika" }, // EMP25292001
    technicianNotes: { type: "TEXT", nullable: true, label: "Notatki technika z wizyty" },
    
    // ========== POWIĄZANIA (z AGD Mobile) ==========
    employeeId: { type: "STRING", length: 20, nullable: true, label: "Pracownik" },
    
    // 🆕 NOWY: Przypisany pracownik z AGD Mobile (zachowane)
    selectedEmployee: { type: "STRING", length: 50, nullable: true, label: "ID wybranego pracownika" },
    selectedGoogleAccount: { type: "STRING", length: 100, nullable: true, label: "Email konta Google pracownika" },
    
    // ========== GODZINY DOSTĘPNOŚCI (z AGD Mobile - ZACHOWANE) ==========
    hours: { type: "STRING", length: 10, nullable: true, label: "Preferowana godzina wizyty" }, // 08:00, 14:30
    orderHours: { type: "STRING", length: 10, nullable: true, label: "Godzina zlecenia" }, // alias
    workHours: { type: "JSON", nullable: true, label: "Godziny dostępności klienta" },
    clientWorkHours: { type: "JSON", nullable: true, label: "Szczegółowe godziny klienta" },
    workHoursCustom: { type: "STRING", length: 200, nullable: true, label: "Niestandardowe godziny" },
    
    // ========== 🏠 SYSTEM URZĄDZEŃ AGD (z AGD Mobile - ZACHOWANY 100%) ==========
    devices: { type: "JSON", required: true, label: "Lista urządzeń do naprawy" },
    /* 🔥 STRUKTURA z AGD Mobile (ZACHOWANA):
    [
      {
        deviceType: "Pralka|Zmywarka|Piekarnik|Lodówka|Kuchenka|Okap|Ekspres|Wyparzarka|Inne",
        issueDescription: "Nie wiruje|Nie pobiera wody|Nie grzeje|Hałasuje|Wyświetla błąd:",
        errorCode: "E24|F06|H20", // Kod błędu
        producer: "Bosch|Siemens|Samsung|LG|Whirlpool|Beko|Electrolux|Amica|Inne",
        model: "Model urządzenia",
        parts: ["Pompa", "Grzałka", "Zawias", "Termostat", "Silnik", "Inne"],
        notes: "Notatki do urządzenia",
        showParts: false, // UI state
        
        // 🏠 SYSTEM ZABUDOWY - ZACHOWANY z AGD Mobile!
        builtIn: false, // Czy sprzęt w zabudowie
        builtInParams: {
          demontaz: true,        // Wymagany demontaż
          montaz: true,          // Wymagany montaż  
          trudna: false,         // Trudna zabudowa
          wolnostojacy: false,   // Sprzęt wolnostojący
          ograniczony: false,    // Ограniczony dostęp
          front: false,          // Front do demontażu
          czas: false            // Dodatkowy czas (minuty)
        },
        builtInParamsNotes: {
          czas: "30", // Dodatkowy czas w minutach
          demontaz: "Uwaga na przewody",
          trudna: "Bardzo wąska przestrzeń"
        }
      }
    ]
    */
    
    // Główne parametry zabudowy (dla kompatybilności - zachowane z AGD Mobile)
    builtInParams: { type: "JSON", nullable: true, label: "Parametry zabudowy głównego urządzenia" },
    
    // ========== OPIS PROBLEMU ==========
    // Główny opis (z AGD Mobile - zachowany)
    problemDescription: { type: "TEXT", nullable: true, label: "Główny opis problemu" },
    
    // Rozszerzone (nowe i stare)
    description: { type: "TEXT", required: true, label: "Opis problemu" }, // Fallback
    symptoms: { type: "JSON", nullable: true, label: "Lista objawów" },
    category: { type: "STRING", length: 50, nullable: true, label: "Kategoria problemu" },
    diagnosis: { type: "TEXT", nullable: true, label: "Szczegółowa diagnoza" },
    solutionDescription: { type: "TEXT", nullable: true, label: "Wykonane czynności" },
    solution: { type: "TEXT", nullable: true, label: "Rozwiązanie" }, // Alias
    
    // ========== STATUS I WORKFLOW ==========
    status: { 
      type: "ENUM", 
      values: [
        // AGD Mobile statusy (zachowane)
        "Nowe", "W realizacji", "Zakończone",
        // Web statusy (dodane)
        "pending", "assigned", "in_progress", "waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"
      ],
      default: "Nowe",
      label: "Status" 
    },
    priority: { 
      type: "ENUM", 
      values: ["low", "medium", "high", "critical", "urgent"],
      default: "medium",
      label: "Priorytet" 
    },
    
    // 🆕 ROZBUDOWANA HISTORIA ZMIAN (z AGD Mobile - ZACHOWANA)
    history: { type: "JSON", nullable: true, label: "Historia zmian z emoji" },
    /* 🔥 STRUKTURA z AGD Mobile (ZACHOWANA):
    [
      {
        date: "2025-01-27T16:00:00Z",
        action: "Utworzenie zlecenia", 
        details: "Zlecenie utworzone dla: Jan Kowalski (ID: CLI25272001)",
        description: "🆕 Nowe zlecenie\n📞 Automatycznie wykryto połączenie\n🏠 Sprzęt w zabudowie"
      }
    ]
    */
    
    statusHistory: { type: "JSON", nullable: true, label: "Historia statusów" },
    canEdit: { type: "BOOLEAN", default: true, label: "Można edytować" },
    
    // ========== ZARZĄDZANIE CZASEM ==========
    estimatedDuration: { type: "INTEGER", nullable: true, label: "Szacowany czas (min)" },
    
    // Czasy z web
    scheduledDate: { type: "DATETIME", nullable: true, label: "Planowana data" },
    actualStartTime: { type: "DATETIME", nullable: true, label: "Rzeczywisty start" },
    actualEndTime: { type: "DATETIME", nullable: true, label: "Rzeczywiste zakończenie" },
    timeSpentMinutes: { type: "INTEGER", nullable: true, label: "Czas pracy (min)" },
    
    // Czasy z AGD Mobile (zachowane)
    isTimerRunning: { type: "BOOLEAN", default: false, label: "Timer włączony" },
    timerStartTime: { type: "DATETIME", nullable: true, label: "Start timera" },
    totalWorkTime: { type: "INTEGER", default: 0, label: "Całkowity czas pracy (sek)" },
    workSessions: { type: "JSON", nullable: true, label: "Sesje robocze" },
    
    // ========== KOSZTY I ROZLICZENIA ==========
    // Z AGD Mobile (zachowane)
    cost: { type: "STRING", length: 20, nullable: true, label: "Koszt naprawy" }, // "200", "350", "Inne"
    customCost: { type: "STRING", length: 20, nullable: true, label: "Niestandardowy koszt" },
    
    // Z web (rozszerzone)
    estimatedCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Szacowany koszt" },
    laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
    partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
    travelCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt dojazdu" },
    totalCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt całkowity" },
    finalAmount: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Końcowa kwota" },
    
    // Płatności
    paymentMethod: { 
      type: "ENUM", 
      values: ["cash", "card", "transfer", "invoice"],
      default: "cash",
      label: "Metoda płatności" 
    },
    paymentReceived: { type: "BOOLEAN", default: false, label: "Płatność otrzymana" },
    isPaid: { type: "BOOLEAN", default: false, label: "Opłacone" },
    
    // ========== CZĘŚCI I MATERIAŁY ==========
    partsUsed: { type: "JSON", nullable: true, label: "Użyte części (szczegółowe)" },
    deviceModels: { type: "JSON", nullable: true, label: "Modele urządzeń" },
    
    // ========== DOKUMENTACJA WIZUALNA ==========
    beforePhotos: { type: "JSON", nullable: true, label: "Zdjęcia przed naprawą" },
    afterPhotos: { type: "JSON", nullable: true, label: "Zdjęcia po naprawie" },
    completionPhotos: { type: "JSON", nullable: true, label: "Zdjęcia ukończenia" },
    photos: { type: "JSON", nullable: true, label: "Wszystkie zdjęcia" }, // Alias
    
    // ========== NOTATKI I KOMUNIKACJA ==========
    workNotes: { type: "TEXT", nullable: true, label: "Notatki robocze" },
    technicianNotes_old: { type: "TEXT", nullable: true, label: "Stare notatki technika" }, // Konflikt nazw
    internalNotes: { type: "TEXT", nullable: true, label: "Notatki wewnętrzne" },
    clientFeedback: { type: "TEXT", nullable: true, label: "Opinia klienta" },
    clientNotes: { type: "TEXT", nullable: true, label: "Uwagi klienta" },
    recommendations: { type: "TEXT", nullable: true, label: "Zalecenia" },
    preventiveMaintenance: { type: "TEXT", nullable: true, label: "Zalecenia prewencyjne" },
    
    // ========== PODPISY I POTWIERDZENIA ==========
    customerSignature: { type: "TEXT", nullable: true, label: "Podpis klienta" },
    clientNotified: { type: "BOOLEAN", default: false, label: "Klient powiadomiony" },
    
    // ========== SYSTEM GWARANCJI ==========
    warrantyMonths: { type: "INTEGER", default: 3, label: "Gwarancja (miesiące)" },
    warrantyNotes: { type: "TEXT", nullable: true, label: "Uwagi do gwarancji" },
    warrantyStatus: { 
      type: "ENUM", 
      values: ["na_gwarancji", "gwarancja_wygasla", "bez_gwarancji"],
      nullable: true,
      label: "Status gwarancji producenta" 
    },
    
    // ========== USTAWIENIA CENOWE ==========
    pricingSettings: { type: "JSON", nullable: true, label: "Ustawienia cenowe" },
    
    // ========== 📞 WYKRYWANIE POŁĄCZEŃ (z AGD Mobile - ZACHOWANE) ==========
    detectedCall: { type: "JSON", nullable: true, label: "Wykryte połączenie" },
    /* 🔥 STRUKTURA z AGD Mobile (ZACHOWANA):
    {
      phoneNumber: "+48 123 456 789",
      timestamp: 1643723400000,
      type: "INCOMING|MISSED",
      duration: 45,
      wasUsed: true
    }
    */
    entryTime: { type: "BIGINT", nullable: true, label: "Czas rozpoczęcia tworzenia (timestamp)" },
    
    // ========== 📧 GOOGLE CONTACTS INTEGRACJA (z AGD Mobile - ZACHOWANE) ==========
    updateGoogleContact: { type: "BOOLEAN", default: false, label: "Aktualizuj Google Contact" },
    createNewGoogleContact: { type: "BOOLEAN", default: false, label: "Utwórz nowy Google Contact" },
    googleContactData: { type: "JSON", nullable: true, label: "Dane kontaktu Google" },
    /* 🔥 STRUKTURA z AGD Mobile (ZACHOWANA):
    {
      resourceName: "people/c12345",
      email: "bielaszkam2@gmail.com", 
      lastUpdated: "2025-01-27T16:00:00Z",
      biographyUpdated: true,
      ordersCount: 3
    }
    */
    
    // ========== DATY I KALENDARZ (z AGD Mobile - ZACHOWANE) ==========
    dates: { type: "JSON", nullable: true, label: "Wybrane daty realizacji" }, // ["2025-01-27", "2025-01-28"]
    selectedDates: { type: "JSON", nullable: true, label: "Zaznaczone daty w kalendarzu" },
    
    // ========== POWIADOMIENIA ==========
    notificationsSent: { type: "JSON", nullable: true, label: "Wysłane powiadomienia" },
    pushNotificationsSent: { type: "JSON", nullable: true, label: "Push notifications" },
    notifications: { type: "JSON", nullable: true, label: "Wszystkie powiadomienia" }, // Alias
    
    // ========== HISTORIA SERWISU ==========
    serviceHistory: { type: "JSON", nullable: true, label: "Historia serwisu" },
    
    // ========== METADANE ==========
    dateAdded: { type: "DATETIME", default: "now", label: "Data dodania" }, // z AGD Mobile
    createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
    updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" },
    createdBy: { type: "STRING", length: 20, nullable: true, label: "Utworzone przez" },
    lastModifiedBy: { type: "STRING", length: 20, nullable: true, label: "Ostatnio modyfikowane przez" },
    
    // Synchronizacja
    syncStatus: { 
      type: "ENUM", 
      values: ["synced", "pending", "offline", "conflict"],
      default: "synced",
      label: "Status synchronizacji" 
    },
    
    // 🆕 NOWE: Migracja i kompatybilność
    migratedFrom: { 
      type: "ENUM", 
      values: ["agd_mobile", "simple_structure", "legacy", "manual"],
      nullable: true,
      label: "Zmigrowane z" 
    },
    migrationDate: { type: "DATETIME", nullable: true, label: "Data migracji" },
    version: { type: "STRING", length: 10, default: "4.0", label: "Wersja struktury" }
  },
  
  // ========== INDEKSY ==========
  indexes: [
    "orderNumber", 
    "clientId", 
    "clientId_legacy", // Dla kompatybilności
    "clientName",
    "visitId", // Nowy
    "technicianId", // Nowy
    "employeeId", 
    "selectedEmployee",
    "status", 
    "priority", 
    "createdAt",
    "dateAdded",
    "phone",
    "appointmentDate" // Nowy
  ],
  
  // ========== WORKFLOW STATUSÓW (ROZSZERZONY) ==========
  statusFlow: {
    // AGD Mobile statusy (zachowane)
    "Nowe": ["W realizacji", "Zakończone", "assigned"], // + mapowanie na web
    "W realizacji": ["Zakończone", "Nowe", "in_progress"], // + mapowanie  
    "Zakończone": [], // końcowy
    
    // Web statusy (rozszerzone)
    pending: ["assigned", "in_progress", "cancelled", "deferred"],
    assigned: ["in_progress", "waiting_parts", "waiting_client", "cancelled"],
    in_progress: ["waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"],
    waiting_parts: ["in_progress", "cancelled", "deferred"],
    waiting_client: ["in_progress", "cancelled", "deferred"],
    testing: ["completed", "in_progress", "cancelled"],
    completed: [], // końcowy
    cancelled: [], // końcowy
    deferred: ["pending", "cancelled"] // przełożone
  },
  
  // ========== MAPOWANIE KOMPATYBILNOŚCI ==========
  compatibilityMapping: {
    // Mapowanie statusów AGD Mobile <-> Web
    statusMapping: {
      "Nowe": "pending",
      "W realizacji": "in_progress", 
      "Zakończone": "completed",
      "pending": "Nowe",
      "in_progress": "W realizacji",
      "completed": "Zakończone"
    },
    
    // Mapowanie pól AGD Mobile -> v4.0
    fieldMapping: {
      "id": "id_legacy",           // Stare ID -> legacy
      "clientId": "clientId_legacy", // OLD0001 -> legacy
      "address": "address",         // Bez zmian
      "phone": "phone",            // Bez zmian
      "clientName": "clientName",   // Bez zmian
      "devices": "devices",        // Bez zmian
      "builtInParams": "builtInParams", // Bez zmian
      "history": "history",        // Bez zmian
      "status": "status",          // Mapowanie przez statusMapping
      "cost": "cost",              // Bez zmian
      "dateAdded": "dateAdded"     // Bez zmian
    }
  },
  
  // ========== OPCJE URZĄDZEŃ AGD (z AGD Mobile - ZACHOWANE) ==========
  deviceOptions: {
    "Pralka": ["Nie wiruje", "Nie pobiera wody", "Nie grzeje", "Hałasuje", "Wyświetla błąd:"],
    "Zmywarka": ["Nie domywa naczyń", "Nie pobiera wody", "Wycieka", "Wyświetla błąd:"],
    "Piekarnik": ["Nie grzeje", "Błąd temperatury", "Wyświetla błąd:"],
    "Lodówka": ["Nie chłodzi", "Głośna praca", "Wyświetla błąd:"],
    "Kuchenka": ["Nie zapala palnika", "Brak gazu", "Wyświetla błąd:"],
    "Okap": ["Brak ciągu", "Nie działa oświetlenie", "Wyświetla błąd:"],
    "Ekspres": ["Nie zaparza kawy", "Wyciek wody", "Wyświetla błąd:"],
    "Wyparzarka": ["Nie grzeje", "Nie wypompowuje wody", "Wyświetla błąd:"],
    "Inne": []
  },
  
  producerOptions: [
    "Bosch", "Siemens", "Samsung", "LG", "Whirlpool", "Beko",
    "Electrolux", "Amica", "Indesit", "Candy", "Zanussi", "Inne"
  ],
  
  partOptions: [
    "Pompa", "Grzałka", "Zawias", "Termostat", "Silnik", "Filtr", "Uszczelka", "Inne"
  ],
  
  costOptions: ["100", "150", "200", "250", "350", "400", "Inne"],
  
  // ========== OPCJE ZABUDOWY (z AGD Mobile - ZACHOWANE) ==========
  builtInOptions: [
    { key: 'demontaz', label: 'Demontaż', default: true },
    { key: 'montaz', label: 'Montaż', default: true },
    { key: 'trudna', label: 'Trudna zabudowa', default: false },
    { key: 'wolnostojacy', label: 'Sprzęt wolnostojący', default: false },
    { key: 'ograniczony', label: 'Ограniczony dostęp', default: false },
    { key: 'front', label: 'Front do demontażu', default: false },
    { key: 'czas', label: 'Dodaj czas (minuty)', default: false }
  ],
  
  // ========== POWIADOMIENIA (ROZSZERZONE) ==========
  notificationTriggers: {
    // Z AGD Mobile (zachowane)
    call_detected: "Wykryto połączenie podczas tworzenia zlecenia",
    google_contact_updated: "Kontakt Google zaktualizowany",
    built_in_device_detected: "Wykryto sprzęt w zabudowie",
    
    // Z web (dodane)
    order_created: "Zlecenie utworzone",
    order_assigned: "Zlecenie przypisane",
    visit_scheduled: "Wizyta zaplanowana", // 🆕
    technician_assigned: "Technik przypisany", // 🆕
    order_started: "Rozpoczęto pracę",
    order_parts_needed: "Potrzebne części",
    order_waiting_client: "Oczekiwanie na klienta",
    order_completed: "Zlecenie ukończone",
    order_cancelled: "Zlecenie anulowane"
  },
  
  // ========== WALIDACJA (ROZSZERZONA) ==========
  validation: {
    // Podstawowe (zachowane z AGD Mobile)
    orderNumber: "required|unique|format:ORDA\\d{8}",
    clientId: "required|format:CLI\\d{8}",
    clientName: "required|min:2",
    address: "required|min:5",
    phone: "required|phone_pl", 
    devices: "required|array|min:1",
    description: "required|min:10",
    
    // Status (rozszerzony)
    status: "required|in:Nowe,W realizacji,Zakończone,pending,assigned,in_progress,waiting_parts,waiting_client,testing,completed,cancelled,deferred",
    priority: "required|in:low,medium,high,critical,urgent",
    
    // 🆕 Nowe (wizyty)
    visitId: "nullable|format:VIS\\d{8}",
    technicianId: "nullable|format:EMP\\d{8}",
    appointmentDate: "nullable|date|after:now"
  }
};

module.exports = {
  ENHANCED_ORDER_STRUCTURE_V4
};