/**
 * ENHANCED ORDER STRUCTURE v3.0 - ULTIMATE EDITION
 * 
 * Połączenie najlepszych funkcji:
 * ✅ Enhanced Order v2.0 (GPS, zdjęcia, workflow, gwarancje, mobile helpers)
 * ✅ AGD Mobile App (system zabudowy, wykrywanie połączeń, Google Contacts, rozbudowane urządzenia)
 * ✅ Nowy system ID (ORDA25272001)
 * ✅ Przygotowane do JSON/Context i wdrożenia na serwerze
 * 
 * NOWE FUNKCJE z AGD Mobile:
 * 🏠 System zabudowy sprzętu AGD (demontaż, montaż, trudna zabudowa)
 * 📞 Wykrywanie połączeń telefonicznych podczas tworzenia zlecenia
 * 📧 Pełna integracja z Google Contacts z historią zleceń
 * 🔧 Profesjonalny system urządzeń AGD (8 typów + części)
 * 📝 Szczegółowa historia zmian z emoji i dokładnymi opisami
 * ⏰ Zaawansowane godziny dostępności klienta
 * 👥 System przypisywania pracowników z kontami Google
 */

const ENHANCED_ORDER_STRUCTURE_V3 = {
  tableName: "enhanced_orders_v3",
  displayName: "Zlecenia Enhanced v3.0 - Ultimate Edition",
  icon: "clipboard-check",
  
  fields: {
    // ========== PODSTAWOWE ID I POWIĄZANIA ==========
    id: { type: "ID", primaryKey: true, autoIncrement: true },
    orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // ORDA25272001 (nowy system)
    orderSource: { type: "ENUM", values: ["web", "mobile", "api", "ai"], default: "web", label: "Źródło zlecenia" },
    
    // Powiązania
    clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
    clientName: { type: "STRING", length: 200, required: true, label: "Nazwa klienta" }, // 🆕 z AGD Mobile
    employeeId: { type: "ID", foreignKey: "employees.id", nullable: true, label: "Pracownik" },
    
    // 🆕 NOWE: Integracja z wizytami i serwisantami
    visitId: { type: "ID", foreignKey: "serviceman_visits.id", nullable: true, label: "Wizyta serwisanta" },
    servicemanId: { type: "ID", foreignKey: "servicemen.id", nullable: true, label: "Serwisant" },
    
    // 🆕 NOWE: Przypisany pracownik z AGD Mobile
    selectedEmployee: { type: "STRING", length: 50, nullable: true, label: "ID wybranego pracownika" },
    selectedGoogleAccount: { type: "STRING", length: 100, nullable: true, label: "Email konta Google pracownika" },
    
    // ========== ADRES I LOKALIZACJA ==========
    address: { type: "STRING", length: 500, required: true, label: "Adres serwisu" }, // 🆕 z AGD Mobile
    phone: { type: "STRING", length: 20, required: true, label: "Telefon kontaktowy" }, // 🆕 z AGD Mobile
    
    // 🆕 NOWE: GPS i lokalizacja urządzenia (z Enhanced v2.0)
    deviceLocation: { type: "STRING", length: 100, label: "Lokalizacja urządzenia" },
    deviceCoordinates: { type: "JSON", label: "Współrzędne GPS urządzenia" },
    
    // ========== 🆕 NOWE: GODZINY DOSTĘPNOŚCI (z AGD Mobile) ==========
    hours: { type: "STRING", length: 10, label: "Preferowana godzina wizyty" }, // 08:00, 14:30
    orderHours: { type: "STRING", length: 10, label: "Godzina zlecenia" }, // 🆕 alias dla hours
    workHours: { type: "JSON", label: "Godziny dostępności klienta" }, 
    // [{ label, from, to }, { label: "cały dzień" }]
    clientWorkHours: { type: "JSON", label: "Szczegółowe godziny klienta" }, // 🆕 rozszerzone
    workHoursCustom: { type: "STRING", length: 200, label: "Niestandardowe godziny" }, // 🆕 z AGD Mobile
    
    // ========== 🆕 NOWE: ROZBUDOWANY SYSTEM URZĄDZEŃ AGD ==========
    devices: { type: "JSON", label: "Lista urządzeń do naprawy" },
    /* 🔥 NOWA STRUKTURA z AGD Mobile:
    [
      {
        deviceType: "Pralka|Zmywarka|Piekarnik|Lodówka|Kuchenka|Okap|Ekspres|Wyparzarka|Inne",
        issueDescription: "Nie wiruje|Nie pobiera wody|Nie grzeje|Hałasuje|Wyświetla błąd:",
        errorCode: "E24|F06|H20", // Kod błędu jeśli wybrano "Wyświetla błąd:"
        producer: "Bosch|Siemens|Samsung|LG|Whirlpool|Beko|Electrolux|Amica|Indesit|Candy|Zanussi|Inne",
        model: "Model urządzenia",
        parts: ["Pompa", "Grzałka", "Zawias", "Termostat", "Silnik", "Filtr", "Uszczelka"],
        notes: "Notatki do urządzenia",
        showParts: false, // UI state
        
        // 🏠 SYSTEM ZABUDOWY - NAJWAŻNIEJSZA FUNKCJA z AGD Mobile!
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
    
    // 🆕 NOWE: Główne parametry zabudowy (dla kompatybilności)
    builtInParams: { type: "JSON", label: "Parametry zabudowy głównego urządzenia" },
    
    // ========== OPIS PROBLEMU I DIAGNOZY ==========
    problemDescription: { type: "TEXT", label: "Główny opis problemu" }, // 🆕 dodane z AGD Mobile
    symptoms: { type: "JSON", label: "Lista objawów" },
    category: { type: "STRING", length: 50, label: "Kategoria problemu" },
    diagnosis: { type: "TEXT", label: "Szczegółowa diagnoza" },
    solutionDescription: { type: "TEXT", label: "Wykonane czynności" },
    
    // ========== STATUS I WORKFLOW ==========
    status: { 
      type: "ENUM", 
      values: ["Nowe", "W realizacji", "Zakończone", "pending", "in_progress", "waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"],
      default: "Nowe",
      label: "Status" 
    },
    priority: { 
      type: "ENUM", 
      values: ["low", "medium", "high", "critical"],
      default: "medium",
      label: "Priorytet" 
    },
    
    // 🆕 NOWE: Rozbudowana historia zmian z AGD Mobile
    history: { type: "JSON", label: "Historia zmian z emoji" },
    /* 🔥 NOWA STRUKTURA:
    [
      {
        date: "2025-01-27T16:00:00Z",
        action: "Utworzenie zlecenia", 
        details: "Zlecenie utworzone dla: Jan Kowalski (ID: CLI25272001)",
        description: "🆕 Nowe zlecenie\n📞 Automatycznie wykryto połączenie\n🏠 Sprzęt w zabudowie: demontaż + montaż"
      },
      {
        date: "2025-01-27T16:30:00Z", 
        action: "Edycja zlecenia",
        description: "🗓 Terminy: 2025-01-27 ➔ 2025-01-28\n📌 Status: Nowe ➔ W realizacji\n💰 Koszt: 200 ➔ 250\n🛠️ Urządzenie 1 typ: Pralka ➔ Zmywarka\n➕ Urządzenie 1 dodano część: Pompa"
      }
    ]
    */
    
    statusHistory: { type: "JSON", label: "Historia statusów" },
    canEdit: { type: "BOOLEAN", default: true, label: "Można edytować" },
    
    // ========== ZARZĄDZANIE CZASEM ==========
    estimatedDuration: { type: "INTEGER", label: "Szacowany czas (min)" },
    
    // Czasy z web
    isTimerRunning: { type: "BOOLEAN", default: false, label: "Timer włączony" },
    timerStartTime: { type: "DATETIME", nullable: true, label: "Start timera" },
    totalWorkTime: { type: "INTEGER", default: 0, label: "Całkowity czas pracy (sek)" },
    workSessions: { type: "JSON", label: "Sesje robocze" },
    
    // Czasy z mobile workflow
    actualStartTime: { type: "DATETIME", nullable: true, label: "Rzeczywisty start" },
    actualEndTime: { type: "DATETIME", nullable: true, label: "Rzeczywiste zakończenie" },
    timeSpentMinutes: { type: "INTEGER", nullable: true, label: "Czas pracy (min)" },
    
    // ========== KOSZTY I ROZLICZENIA ==========
    estimatedCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Szacowany koszt" },
    cost: { type: "STRING", length: 20, label: "Koszt naprawy" }, // 🆕 z AGD Mobile - "200", "350", "Inne"
    customCost: { type: "STRING", length: 20, label: "Niestandardowy koszt" }, // 🆕 z AGD Mobile
    
    // Szczegółowe koszty z web
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
    partsUsed: { type: "JSON", label: "Użyte części (szczegółowe)" },
    deviceModels: { type: "JSON", label: "Modele urządzeń" },
    
    // ========== 🆕 NOWE: DOKUMENTACJA WIZUALNA ==========
    beforePhotos: { type: "JSON", label: "Zdjęcia przed naprawą" },
    afterPhotos: { type: "JSON", label: "Zdjęcia po naprawie" },
    completionPhotos: { type: "JSON", label: "Zdjęcia ukończenia" },
    
    // ========== NOTATKI I KOMUNIKACJA ==========
    workNotes: { type: "TEXT", label: "Notatki robocze" },
    technicianNotes: { type: "TEXT", label: "Notatki technika" },
    internalNotes: { type: "TEXT", label: "Notatki wewnętrzne" },
    clientFeedback: { type: "TEXT", label: "Opinia klienta" },
    recommendations: { type: "TEXT", label: "Zalecenia" },
    preventiveMaintenance: { type: "TEXT", label: "Zalecenia prewencyjne" },
    
    // ========== PODPISY I POTWIERDZENIA ==========
    customerSignature: { type: "TEXT", label: "Podpis klienta" },
    
    // ========== 🆕 NOWE: SYSTEM GWARANCJI ==========
    warrantyMonths: { type: "INTEGER", default: 3, label: "Gwarancja (miesiące)" },
    warrantyNotes: { type: "TEXT", label: "Uwagi do gwarancji" },
    warrantyStatus: { 
      type: "ENUM", 
      values: ["na_gwarancji", "gwarancja_wygasla", "bez_gwarancji"],
      label: "Status gwarancji producenta" 
    },
    
    // ========== USTAWIENIA CENOWE ==========
    pricingSettings: { type: "JSON", label: "Ustawienia cenowe" },
    
    // ========== 🆕 NOWE: WYKRYWANIE POŁĄCZEŃ (z AGD Mobile) ==========
    detectedCall: { type: "JSON", label: "Wykryte połączenie" },
    /* 🔥 STRUKTURA:
    {
      phoneNumber: "+48 123 456 789",
      timestamp: 1643723400000,
      type: "INCOMING|MISSED",
      duration: 45,
      wasUsed: true // Czy numer został użyty w zleceniu
    }
    */
    entryTime: { type: "BIGINT", label: "Czas rozpoczęcia tworzenia zlecenia (timestamp)" }, // 🆕 z AGD Mobile
    
    // ========== 🆕 NOWE: GOOGLE CONTACTS INTEGRACJA ==========
    updateGoogleContact: { type: "BOOLEAN", default: false, label: "Aktualizuj Google Contact" }, // 🆕 z AGD Mobile
    createNewGoogleContact: { type: "BOOLEAN", default: false, label: "Utwórz nowy Google Contact" }, // 🆕 z AGD Mobile
    googleContactData: { type: "JSON", label: "Dane kontaktu Google" }, // 🆕 z AGD Mobile
    /* 🔥 STRUKTURA:
    {
      resourceName: "people/c12345",
      email: "bielaszkam2@gmail.com", 
      lastUpdated: "2025-01-27T16:00:00Z",
      biographyUpdated: true,
      ordersCount: 3
    }
    */
    
    // ========== 🆕 NOWE: DATY I KALENDARZ ==========
    dates: { type: "JSON", label: "Wybrane daty realizacji" }, // 🆕 z AGD Mobile - ["2025-01-27", "2025-01-28"]
    selectedDates: { type: "JSON", label: "Zaznaczone daty w kalendarzu" }, // 🆕 UI state
    
    // ========== POWIADOMIENIA ==========
    notificationsSent: { type: "JSON", label: "Wysłane powiadomienia" },
    pushNotificationsSent: { type: "JSON", label: "Push notifications" },
    
    // ========== HISTORIA SERWISU ==========
    serviceHistory: { type: "JSON", label: "Historia serwisu" },
    
    // ========== METADANE ==========
    dateAdded: { type: "DATETIME", default: "now", label: "Data dodania" }, // 🆕 z AGD Mobile
    createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
    updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" },
    createdBy: { type: "ID", nullable: true, label: "Utworzone przez" },
    lastModifiedBy: { type: "ID", nullable: true, label: "Ostatnio modyfikowane przez" },
    syncStatus: { 
      type: "ENUM", 
      values: ["synced", "pending", "offline", "conflict"],
      default: "synced",
      label: "Status synchronizacji" 
    }
  },
  
  // ========== INDEKSY ==========
  indexes: [
    "orderNumber", 
    "clientId", 
    "clientName",
    "employeeId", 
    "servicemanId",
    "visitId",
    "status", 
    "priority", 
    "createdAt",
    "dateAdded",
    "selectedEmployee",
    "phone"
  ],
  
  // ========== 🆕 NOWE: WORKFLOW STATUSÓW (rozszerzony) ==========
  statusFlow: {
    // AGD Mobile statuses
    "Nowe": ["W realizacji", "Zakończone"],
    "W realizacji": ["Zakończone", "Nowe"],
    "Zakończone": [], // końcowy
    
    // Enhanced v2.0 statuses  
    pending: ["in_progress", "cancelled", "deferred"],
    in_progress: ["waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"],
    waiting_parts: ["in_progress", "cancelled", "deferred"],
    waiting_client: ["in_progress", "cancelled", "deferred"],
    testing: ["completed", "in_progress", "cancelled"],
    completed: [], // końcowy
    cancelled: [], // końcowy
    deferred: ["pending", "cancelled"] // przełożone
  },
  
  // ========== 🆕 NOWE: OPCJE URZĄDZEŃ AGD ==========
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
  
  // ========== 🆕 NOWE: OPCJE ZABUDOWY ==========
  builtInOptions: [
    { key: 'demontaz', label: 'Demontaż', default: true },
    { key: 'montaz', label: 'Montaż', default: true },
    { key: 'trudna', label: 'Trudna zabudowa', default: false },
    { key: 'wolnostojacy', label: 'Sprzęt wolnostojący', default: false },
    { key: 'ograniczony', label: 'Ограniczony dostęp', default: false },
    { key: 'front', label: 'Front do demontażu', default: false },
    { key: 'czas', label: 'Dodaj czas (minuty)', default: false }
  ],
  
  // ========== POWIADOMIENIA ==========
  notificationTriggers: {
    order_created: "Zlecenie utworzone",
    order_assigned: "Zlecenie przypisane",
    order_started: "Rozpoczęto pracę",
    order_parts_needed: "Potrzebne części",
    order_waiting_client: "Oczekiwanie na klienta",
    order_completed: "Zlecenie ukończone",
    order_cancelled: "Zlecenie anulowane",
    // 🆕 z AGD Mobile
    call_detected: "Wykryto połączenie podczas tworzenia zlecenia",
    google_contact_updated: "Kontakt Google zaktualizowany",
    built_in_device_detected: "Wykryto sprzęt w zabudowie"
  },
  
  // ========== WALIDACJA ==========
  validation: {
    orderNumber: "required|unique",
    clientId: "required|exists:clients,id",
    clientName: "required|min:2",
    address: "required|min:5",
    phone: "required|phone_pl", 
    devices: "required|array|min:1",
    status: "required|in:Nowe,W realizacji,Zakończone,pending,in_progress,waiting_parts,waiting_client,testing,completed,cancelled,deferred",
    priority: "required|in:low,medium,high,critical"
  },
  
  // ========== 🆕 NOWE: MOBILE & AGD FEATURES ==========
  mobileFeatures: {
    // Z Enhanced v2.0
    gpsTracking: "Śledzenie lokalizacji urządzenia",
    photoDocumentation: "Dokumentacja zdjęciowa przed/po",
    offlineMode: "Praca offline z synchronizacją",
    pushNotifications: "Powiadomienia push w czasie rzeczywistym",
    visitIntegration: "Integracja z wizytami serwisanta",
    warrantyTracking: "Śledzenie gwarancji serwisowych",
    preventiveTips: "Zalecenia prewencyjne",
    quickStatusUpdate: "Szybka aktualizacja statusu",
    
    // 🆕 Nowe z AGD Mobile
    builtInDeviceSystem: "Profesjonalny system zabudowy sprzętu AGD",
    callDetection: "Automatyczne wykrywanie połączeń telefonicznych",
    googleContactsIntegration: "Pełna integracja z Google Contacts z historią",
    advancedDeviceTypes: "8 typów urządzeń AGD z dedykowanymi usterkami",
    detailedChangeHistory: "Szczegółowa historia zmian z emoji i opisami",
    smartWorkHours: "Zaawansowane godziny dostępności klienta",
    employeeGoogleAccounts: "System przypisywania pracowników z kontami Google",
    agdPartsManagement: "Profesjonalne zarządzanie częściami AGD"
  }
};

module.exports = {
  ENHANCED_ORDER_STRUCTURE_V3
};