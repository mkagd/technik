/**
 * UJEDNOLICONA STRUKTURA DANYCH ZLECEŃ
 * 
 * 🎯 CEL: Jedna struktura dla wszystkich aplikacji
 * - Web app
 * - Mobile app (AGD)
 * - API endpoints
 * - Raporty i analytics
 * 
 * 🔥 JEDEN PLIK: data/orders.json - jedyne źródło prawdy
 * 
 * ✅ ZAWIERA:
 * - Wszystkie dane z dotychczasowych systemów
 * - Kompatybilność z AGD Mobile
 * - System wizyt i harmonogramowania
 * - Rozszerzone metadane
 * - Backup i wersjonowanie
 */

const UNIFIED_ORDER_STRUCTURE = {
  tableName: "orders",
  displayName: "Zlecenia Serwisowe - Ujednolicone",
  description: "Jedna struktura dla wszystkich aplikacji",
  version: "1.0.0",
  
  // ========== POLA STRUKTURY ==========
  fields: {
    // ========== IDENTYFIKATORY ==========
    id: { 
      type: "STRING", 
      length: 20, 
      primaryKey: true, 
      required: true,
      format: "ORDW252710001",
      description: "Unikalny identyfikator zlecenia",
      example: "ORDW252710001"
    },
    
    // Legacy IDs dla kompatybilności
    oldId: { 
      type: "STRING", 
      length: 20, 
      nullable: true,
      description: "Stary ID dla kompatybilności" 
    },
    
    // ========== KLIENT ==========
    clientId: { 
      type: "STRING", 
      length: 20, 
      required: true,
      format: "CLI25186001",
      description: "ID klienta",
      example: "CLI25186001"
    },
    
    clientName: { 
      type: "STRING", 
      length: 200, 
      required: true,
      description: "Nazwa/imię i nazwisko klienta",
      example: "Jan Kowalski"
    },
    
    // Dane kontaktowe (cache z clients.json)
    customerPhone: { 
      type: "STRING", 
      length: 20, 
      nullable: true,
      description: "Telefon klienta" 
    },
    
    customerEmail: { 
      type: "STRING", 
      length: 100, 
      nullable: true,
      description: "Email klienta" 
    },
    
    // ========== LOKALIZACJA ==========
    address: { 
      type: "TEXT", 
      required: true,
      description: "Pełny adres serwisu",
      example: "ul. Marszałkowska 1, 00-001 Warszawa"
    },
    
    // Szczegółowe dane adresowe
    addressDetails: {
      type: "JSON",
      nullable: true,
      description: "Szczegółowe dane adresowe",
      structure: {
        street: "string",
        city: "string", 
        postalCode: "string",
        district: "string",
        coordinates: {
          lat: "number",
          lng: "number"
        }
      }
    },
    
    // ========== OPIS PROBLEMU ==========
    category: { 
      type: "STRING", 
      length: 100, 
      required: true,
      description: "Kategoria problemu",
      values: ["Naprawa laptopa", "Serwis AGD", "Instalacja", "Konserwacja", "Inna"],
      example: "Naprawa laptopa"
    },
    
    serviceType: { 
      type: "STRING", 
      length: 100, 
      nullable: true,
      description: "Typ serwisu",
      example: "Wymiana ekranu"
    },
    
    description: { 
      type: "TEXT", 
      required: true,
      description: "Szczegółowy opis problemu",
      example: "Laptop nie uruchamia się, czarny ekran"
    },
    
    // ========== URZĄDZENIA ==========
    devices: {
      type: "JSON",
      required: true,
      description: "Lista urządzeń do serwisu",
      structure: [{
        name: "string",                    // Nazwa urządzenia
        brand: "string",                   // Marka (Bosch, Samsung, etc.)
        model: "string",                   // Model
        serialNumber: "string",            // Numer seryjny
        description: "string",             // Opis problemu
        deviceType: "string",              // Typ (Pralka, Laptop, etc.)
        
        // System zabudowy (dla AGD)
        builtIn: "boolean",
        builtInParams: {
          demontaz: "boolean",
          montaz: "boolean", 
          trudna: "boolean",
          wolnostojacy: "boolean",
          ograniczony: "boolean",
          front: "boolean",
          czas: "boolean"
        },
        builtInParamsNotes: {
          czas: "string",                  // Czas w minutach
          demontaz: "string",              // Uwagi do demontażu
          trudna: "string"                 // Uwagi do trudnej zabudowy
        },
        
        // Części i naprawy
        parts: ["string"],                 // Lista potrzebnych części
        diagnosis: "string",               // Diagnoza
        repairDescription: "string",       // Opis wykonanej naprawy
        warrantyPeriod: "number"           // Gwarancja w miesiącach
      }],
      example: [{
        name: "Laptop Dell",
        brand: "Dell",
        model: "Inspiron 15",
        description: "Nie uruchamia się",
        deviceType: "Laptop"
      }]
    },
    
    // Główne parametry zabudowy (dla kompatybilności)
    builtInParams: {
      type: "JSON",
      nullable: true,
      description: "Parametry zabudowy głównego urządzenia"
    },
    
    // ========== STATUS I WORKFLOW ==========
    status: { 
      type: "ENUM", 
      values: [
        // Statusy podstawowe
        "new", "pending", "assigned", "in_progress", 
        "waiting_parts", "waiting_client", "testing", 
        "completed", "cancelled", "deferred",
        
        // Statusy AGD Mobile (kompatybilność)
        "Nowe", "W realizacji", "Zakończone"
      ],
      default: "new",
      required: true,
      description: "Status zlecenia"
    },
    
    priority: { 
      type: "ENUM", 
      values: ["low", "normal", "high", "urgent", "critical"],
      default: "normal",
      description: "Priorytet zlecenia"
    },
    
    // Historia statusów
    statusHistory: {
      type: "JSON",
      nullable: true,
      description: "Historia zmian statusu",
      structure: [{
        status: "string",
        timestamp: "ISO8601",
        user: "string",
        note: "string"
      }]
    },
    
    // ========== HARMONOGRAMOWANIE ==========
    scheduledDate: { 
      type: "DATETIME", 
      nullable: true,
      description: "Zaplanowana data realizacji"
    },
    
    preferredTime: { 
      type: "STRING", 
      length: 100, 
      nullable: true,
      description: "Preferowany czas (opis tekstowy)",
      example: "jutro popołudniu"
    },
    
    // Dostępność klienta
    dates: {
      type: "JSON",
      nullable: true,
      description: "Dostępne daty/godziny klienta",
      example: ["2025-01-28", "2025-01-29"]
    },
    
    hours: { 
      type: "STRING", 
      length: 50, 
      nullable: true,
      description: "Preferowane godziny"
    },
    
    // ========== PRZYPISANIE ==========
    assignedTechnician: { 
      type: "STRING", 
      length: 20, 
      nullable: true,
      description: "ID przypisanego technika"
    },
    
    // AGD Mobile compatibility
    selectedEmployee: { 
      type: "STRING", 
      length: 50, 
      nullable: true,
      description: "Wybrany pracownik (AGD Mobile)"
    },
    
    selectedGoogleAccount: { 
      type: "STRING", 
      length: 100, 
      nullable: true,
      description: "Konto Google pracownika"
    },
    
    // ========== CZAS PRACY ==========
    estimatedDuration: { 
      type: "INTEGER", 
      nullable: true,
      description: "Szacowany czas pracy (minuty)"
    },
    
    actualStartTime: { 
      type: "DATETIME", 
      nullable: true,
      description: "Rzeczywisty czas rozpoczęcia"
    },
    
    actualEndTime: { 
      type: "DATETIME", 
      nullable: true,
      description: "Rzeczywisty czas zakończenia"
    },
    
    // AGD Mobile timer system
    isTimerRunning: { 
      type: "BOOLEAN", 
      default: false,
      description: "Czy timer jest włączony"
    },
    
    timerStartTime: { 
      type: "DATETIME", 
      nullable: true,
      description: "Czas rozpoczęcia timera"
    },
    
    totalWorkTime: { 
      type: "INTEGER", 
      default: 0,
      description: "Całkowity czas pracy (sekundy)"
    },
    
    workSessions: {
      type: "JSON",
      nullable: true,
      description: "Sesje robocze",
      structure: [{
        startTime: "ISO8601",
        endTime: "ISO8601",
        duration: "number", // sekundy
        description: "string"
      }]
    },
    
    // ========== KOSZTY I ROZLICZENIA ==========
    estimatedCost: { 
      type: "DECIMAL", 
      precision: 10, 
      scale: 2, 
      default: 0,
      description: "Szacowany koszt"
    },
    
    finalCost: { 
      type: "DECIMAL", 
      precision: 10, 
      scale: 2, 
      default: 0,
      description: "Ostateczny koszt"
    },
    
    laborCost: { 
      type: "DECIMAL", 
      precision: 10, 
      scale: 2, 
      default: 0,
      description: "Koszt robocizny"
    },
    
    partsCost: { 
      type: "DECIMAL", 
      precision: 10, 
      scale: 2, 
      default: 0,
      description: "Koszt części"
    },
    
    travelCost: { 
      type: "DECIMAL", 
      precision: 10, 
      scale: 2, 
      default: 0,
      description: "Koszt dojazdu"
    },
    
    // AGD Mobile cost fields
    cost: { 
      type: "STRING", 
      length: 20, 
      nullable: true,
      description: "Koszt (AGD Mobile format)"
    },
    
    customCost: { 
      type: "STRING", 
      length: 20, 
      nullable: true,
      description: "Niestandardowy koszt"
    },
    
    // Płatności
    paymentMethod: { 
      type: "ENUM", 
      values: ["cash", "card", "transfer", "invoice"],
      default: "cash",
      description: "Metoda płatności"
    },
    
    paymentReceived: { 
      type: "BOOLEAN", 
      default: false,
      description: "Czy płatność została otrzymana"
    },
    
    // ========== CZĘŚCI I MATERIAŁY ==========
    partsUsed: {
      type: "JSON",
      nullable: true,
      description: "Użyte części",
      structure: [{
        name: "string",
        partNumber: "string",
        quantity: "number",
        unitCost: "number",
        totalCost: "number",
        supplier: "string"
      }]
    },
    
    // ========== DOKUMENTACJA ==========
    photos: {
      type: "JSON",
      nullable: true,
      description: "Zdjęcia",
      structure: [{
        url: "string",
        type: "string", // before, after, during, damage
        description: "string",
        timestamp: "ISO8601"
      }]
    },
    
    documents: {
      type: "JSON",
      nullable: true,
      description: "Dokumenty",
      structure: [{
        name: "string",
        url: "string",
        type: "string", // invoice, warranty, report
        uploadedAt: "ISO8601"
      }]
    },
    
    // ========== NOTATKI I KOMUNIKACJA ==========
    technicianNotes: { 
      type: "TEXT", 
      nullable: true,
      description: "Notatki technika"
    },
    
    internalNotes: { 
      type: "TEXT", 
      nullable: true,
      description: "Notatki wewnętrzne"
    },
    
    clientNotes: { 
      type: "TEXT", 
      nullable: true,
      description: "Uwagi od klienta"
    },
    
    clientFeedback: { 
      type: "TEXT", 
      nullable: true,
      description: "Opinia klienta po realizacji"
    },
    
    recommendations: { 
      type: "TEXT", 
      nullable: true,
      description: "Zalecenia dla klienta"
    },
    
    // ========== HISTORIA I KOMUNIKACJA ==========
    history: {
      type: "JSON",
      nullable: true,
      description: "Historia zmian z szczegółami",
      structure: [{
        date: "ISO8601",
        action: "string",
        details: "string",
        description: "string", // może zawierać emoji
        user: "string"
      }]
    },
    
    notifications: {
      type: "JSON",
      nullable: true,
      description: "Wysłane powiadomienia",
      structure: [{
        type: "string", // sms, email, push
        recipient: "string",
        message: "string",
        sentAt: "ISO8601",
        status: "string" // sent, delivered, failed
      }]
    },
    
    // ========== AGD MOBILE SPECIFIC ==========
    // Wykrywanie połączeń
    detectedCall: {
      type: "JSON",
      nullable: true,
      description: "Wykryte połączenie",
      structure: {
        phoneNumber: "string",
        timestamp: "number",
        type: "string", // INCOMING, MISSED
        duration: "number",
        wasUsed: "boolean"
      }
    },
    
    entryTime: { 
      type: "BIGINT", 
      nullable: true,
      description: "Timestamp rozpoczęcia tworzenia"
    },
    
    // Google Contacts integration
    updateGoogleContact: { 
      type: "BOOLEAN", 
      default: false,
      description: "Czy aktualizować Google Contact"
    },
    
    createNewGoogleContact: { 
      type: "BOOLEAN", 
      default: false,
      description: "Czy utworzyć nowy Google Contact"
    },
    
    googleContactData: {
      type: "JSON",
      nullable: true,
      description: "Dane kontaktu Google",
      structure: {
        resourceName: "string",
        email: "string",
        lastUpdated: "ISO8601",
        biographyUpdated: "boolean",
        ordersCount: "number"
      }
    },
    
    // Godziny pracy klienta
    workHours: {
      type: "JSON",
      nullable: true,
      description: "Godziny dostępności klienta"
    },
    
    clientWorkHours: {
      type: "JSON", 
      nullable: true,
      description: "Szczegółowe godziny klienta"
    },
    
    workHoursCustom: { 
      type: "STRING", 
      length: 200, 
      nullable: true,
      description: "Niestandardowe godziny"
    },
    
    // ========== GWARANCJA ==========
    warrantyMonths: { 
      type: "INTEGER", 
      default: 3,
      description: "Okres gwarancji (miesiące)"
    },
    
    warrantyNotes: { 
      type: "TEXT", 
      nullable: true,
      description: "Uwagi dotyczące gwarancji"
    },
    
    warrantyStartDate: { 
      type: "DATE", 
      nullable: true,
      description: "Data rozpoczęcia gwarancji"
    },
    
    // ========== METADANE ==========
    source: { 
      type: "ENUM", 
      values: ["web", "mobile", "api", "agd_mobile", "phone", "email"],
      default: "web",
      description: "Źródło zlecenia"
    },
    
    dateAdded: { 
      type: "DATETIME", 
      default: "now",
      description: "Data dodania"
    },
    
    createdAt: { 
      type: "DATETIME", 
      default: "now",
      description: "Data utworzenia"
    },
    
    updatedAt: { 
      type: "DATETIME", 
      default: "now", 
      onUpdate: "now",
      description: "Data ostatniej aktualizacji"
    },
    
    createdBy: { 
      type: "STRING", 
      length: 50, 
      nullable: true,
      description: "Kto utworzył"
    },
    
    lastModifiedBy: { 
      type: "STRING", 
      length: 50, 
      nullable: true,
      description: "Kto ostatnio modyfikował"
    },
    
    // Migracja i kompatybilność
    migrated: { 
      type: "BOOLEAN", 
      default: false,
      description: "Czy zmigrowane"
    },
    
    migrationDate: { 
      type: "DATETIME", 
      nullable: true,
      description: "Data migracji"
    },
    
    migrationSource: { 
      type: "STRING", 
      length: 50, 
      nullable: true,
      description: "Źródło migracji"
    },
    
    version: { 
      type: "STRING", 
      length: 10, 
      default: "1.0",
      description: "Wersja struktury"
    }
  },
  
  // ========== INDEKSY ==========
  indexes: [
    "id", "clientId", "clientName", "status", "priority", 
    "assignedTechnician", "selectedEmployee", "scheduledDate", 
    "dateAdded", "createdAt", "category", "source"
  ],
  
  // ========== WALIDACJA ==========
  validation: {
    id: "required|unique|format:ORD[A-Z]\\d{9}",
    clientId: "required|format:CLI\\d{8}",
    clientName: "required|min:2",
    category: "required",
    description: "required|min:10",
    devices: "required|array|min:1",
    status: "required|in:new,pending,assigned,in_progress,waiting_parts,waiting_client,testing,completed,cancelled,deferred,Nowe,W realizacji,Zakończone",
    priority: "required|in:low,normal,high,urgent,critical"
  },
  
  // ========== WARTOŚCI DOMYŚLNE ==========
  defaults: {
    status: "new",
    priority: "normal",
    paymentMethod: "cash",
    paymentReceived: false,
    warrantyMonths: 3,
    source: "web",
    version: "1.0",
    migrated: false
  },
  
  // ========== MAPOWANIE KOMPATYBILNOŚCI ==========
  compatibility: {
    // Mapowanie statusów
    statusMapping: {
      "Nowe": "new",
      "W realizacji": "in_progress",
      "Zakończone": "completed",
      "new": "Nowe",
      "in_progress": "W realizacji", 
      "completed": "Zakończone"
    },
    
    // Pola wymagane dla różnych źródeł
    requiredFields: {
      web: ["id", "clientId", "category", "description", "devices"],
      agd_mobile: ["id", "clientId", "clientName", "devices", "selectedEmployee"],
      api: ["clientId", "description", "status"]
    }
  }
};

module.exports = {
  UNIFIED_ORDER_STRUCTURE
};