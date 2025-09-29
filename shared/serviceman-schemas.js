/**
 * STRUKTURA DANYCH DLA SERWISANTÓW
 * Model: Klient → Wizyty → Zlecenia
 * 
 * Jeden serwisant może mieć:
 * - Jednego głównego klienta (np. firma IT, szkoła, biuro)  
 * - Wiele wizyt u tego klienta
 * - Wiele zleceń podczas każdej wizyty
 */

const SERVICEMAN_SCHEMAS = {

  // ========== SERWISANCI ==========
  servicemen: {
    tableName: "servicemen",
    displayName: "Serwisanci",
    icon: "user-cog",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      servicemanId: { type: "STRING", length: 20, unique: true, label: "ID serwisanta" }, // SRV001
      
      // Dane osobowe
      firstName: { type: "STRING", length: 50, required: true, label: "Imię" },
      lastName: { type: "STRING", length: 50, required: true, label: "Nazwisko" },
      email: { type: "EMAIL", unique: true, label: "E-mail" },
      phone: { type: "PHONE", required: true, label: "Telefon" },
      
      // Podstawowy klient serwisanta
      primaryClientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Główny klient" },
      
      // Specjalizacje
      specializations: { type: "JSON", label: "Specjalizacje" }, // ["laptopy", "drukarki", "sieci"]
      
      // Dostępność
      isActive: { type: "BOOLEAN", default: true, label: "Aktywny" },
      workingHours: { type: "JSON", label: "Godziny pracy" },
      /*
      {
        monday: { start: "08:00", end: "16:00", available: true },
        tuesday: { start: "08:00", end: "16:00", available: true },
        // ...
      }
      */
      
      // Kontakt awaryjny
      emergencyPhone: { type: "PHONE", label: "Telefon awaryjny" },
      
      // Aplikacja mobilna
      canAccessMobile: { type: "BOOLEAN", default: true, label: "Dostęp do aplikacji mobilnej" },
      mobileToken: { type: "STRING", length: 255, label: "Token mobilny" },
      pushToken: { type: "STRING", length: 255, label: "Token push notifications" },
      
      // Lokalizacja (dla śledzenia)
      lastKnownLocation: { type: "JSON", label: "Ostatnia lokalizacja" }, // { lat, lng, timestamp }
      
      notes: { type: "TEXT", label: "Notatki" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["servicemanId", "primaryClientId", "isActive", "phone"],
    
    // Dla aplikacji mobilnej
    mobileFeatures: {
      gpsTracking: "Śledzenie lokalizacji podczas wizyt",
      offlineMode: "Praca offline z synchronizacją",
      quickVisitStart: "Szybkie rozpoczęcie wizyty",
      clientHistory: "Historia wizyt u klienta"
    }
  },

  // ========== WIZYTY SERWISANTA ==========
  serviceman_visits: {
    tableName: "serviceman_visits", 
    displayName: "Wizyty serwisanta",
    icon: "map-pin",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      visitNumber: { type: "STRING", length: 20, unique: true, label: "Numer wizyty" }, // VIS-2024-001
      
      // Powiązania
      servicemanId: { type: "ID", foreignKey: "servicemen.id", required: true, label: "Serwisant" },
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      
      // Planowanie wizyty
      scheduledDate: { type: "DATETIME", required: true, label: "Planowana data" },
      estimatedDuration: { type: "INTEGER", default: 120, label: "Szacowany czas (min)" },
      
      // Realizacja wizyty
      actualStartTime: { type: "DATETIME", label: "Rzeczywisty start" },
      actualEndTime: { type: "DATETIME", label: "Rzeczywisty koniec" },
      actualDuration: { type: "INTEGER", label: "Rzeczywisty czas (min)" },
      
      // Status wizyty
      status: { 
        type: "ENUM", 
        values: ["scheduled", "in_transit", "on_site", "completed", "cancelled", "postponed"],
        default: "scheduled",
        label: "Status" 
      },
      
      // Lokalizacja
      clientAddress: { type: "TEXT", required: true, label: "Adres klienta" },
      coordinates: { type: "JSON", label: "Współrzędne" }, // { lat, lng }
      
      // Typ wizyty
      visitType: { 
        type: "ENUM", 
        values: ["routine", "emergency", "follow_up", "installation", "maintenance"],
        default: "routine",
        label: "Typ wizyty" 
      },
      
      // Opis wizyty
      description: { type: "TEXT", label: "Opis wizyty" },
      
      // Podsumowanie
      summary: { type: "TEXT", label: "Podsumowanie wizyty" },
      nextVisitRecommended: { type: "BOOLEAN", default: false, label: "Zalecana kolejna wizyta" },
      nextVisitDate: { type: "DATE", label: "Zalecana data następnej wizyty" },
      
      // Koszty
      totalCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Całkowity koszt" },
      laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
      partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
      
      // Dokumentacja - ważne dla mobilnej
      photos: { type: "JSON", label: "Zdjęcia" }, // [{ url, description, timestamp, type: "before|after|problem" }]
      documents: { type: "JSON", label: "Dokumenty" }, // [{ url, name, type }]
      
      // Podpis klienta
      clientSignature: { type: "TEXT", label: "Podpis cyfrowy klienta" }, // base64
      clientName: { type: "STRING", length: 100, label: "Imię i nazwisko podpisującego" },
      
      // Ocena
      clientRating: { type: "INTEGER", label: "Ocena klienta (1-5)" },
      clientFeedback: { type: "TEXT", label: "Opinia klienta" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["visitNumber", "servicemanId", "clientId", "status", "scheduledDate"],
    
    // Workflow statusów
    statusFlow: {
      scheduled: ["in_transit", "cancelled", "postponed"],
      in_transit: ["on_site", "cancelled"],
      on_site: ["completed", "postponed"],
      completed: [], // końcowy
      cancelled: [], // końcowy
      postponed: ["scheduled", "cancelled"]
    },
    
    // Powiadomienia mobilne
    notificationTriggers: {
      visit_scheduled: "Wizyta zaplanowana",
      visit_starting: "Serwisant w drodze", 
      visit_arrived: "Serwisant na miejscu",
      visit_completed: "Wizyta zakończona"
    }
  },

  // ========== ZLECENIA W RAMACH WIZYTY ==========
  visit_orders: {
    tableName: "visit_orders",
    displayName: "Zlecenia wizyty",
    icon: "clipboard-list",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // ORD-VIS-001
      
      // Powiązania
      visitId: { type: "ID", foreignKey: "serviceman_visits.id", required: true, label: "Wizyta" },
      servicemanId: { type: "ID", foreignKey: "servicemen.id", required: true, label: "Serwisant" },
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      
      // Urządzenie/przedmiot naprawy
      deviceType: { type: "STRING", length: 50, required: true, label: "Typ urządzenia" },
      brand: { type: "STRING", length: 50, label: "Marka" },
      model: { type: "STRING", length: 100, label: "Model" },
      serialNumber: { type: "STRING", length: 100, label: "Numer seryjny" },
      location: { type: "STRING", length: 100, label: "Lokalizacja urządzenia" }, // "Sala 101", "Stanowisko 5"
      
      // Opis problemu
      problemDescription: { type: "TEXT", required: true, label: "Opis problemu" },
      diagnosis: { type: "TEXT", label: "Diagnoza" },
      solutionDescription: { type: "TEXT", label: "Wykonane czynności" },
      
      // Status zlecenia
      status: { 
        type: "ENUM", 
        values: ["pending", "in_progress", "waiting_parts", "completed", "deferred"],
        default: "pending",
        label: "Status" 
      },
      
      // Priorytety
      priority: { 
        type: "ENUM", 
        values: ["low", "medium", "high", "critical"],
        default: "medium",
        label: "Priorytet" 
      },
      
      // Czasy
      startTime: { type: "DATETIME", label: "Czas rozpoczęcia" },
      endTime: { type: "DATETIME", label: "Czas zakończenia" },
      timeSpentMinutes: { type: "INTEGER", label: "Czas pracy (min)" },
      
      // Części użyte
      partsUsed: { type: "JSON", label: "Użyte części" },
      /*
      [
        { name: "RAM 8GB", quantity: 1, cost: 150.00 },
        { name: "Kabel HDMI", quantity: 1, cost: 25.00 }
      ]
      */
      
      // Koszty
      laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
      partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
      totalCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt całkowity" },
      
      // Dokumentacja
      beforePhotos: { type: "JSON", label: "Zdjęcia przed naprawą" },
      afterPhotos: { type: "JSON", label: "Zdjęcia po naprawie" },
      
      // Zalecenia
      recommendations: { type: "TEXT", label: "Zalecenia" },
      preventiveMaintenance: { type: "TEXT", label: "Zalecenia prewencyjne" },
      
      // Gwarancja
      warrantyMonths: { type: "INTEGER", default: 3, label: "Gwarancja (miesiące)" },
      warrantyNotes: { type: "TEXT", label: "Uwagi do gwarancji" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["orderNumber", "visitId", "servicemanId", "status", "priority"],
    
    // Workflow
    statusFlow: {
      pending: ["in_progress", "deferred"],
      in_progress: ["waiting_parts", "completed", "deferred"],
      waiting_parts: ["in_progress", "deferred"],
      completed: [], // końcowy
      deferred: ["pending"] // przełożone na następną wizytę
    }
  },

  // ========== HARMONOGRAM SERWISANTA ==========
  serviceman_schedule: {
    tableName: "serviceman_schedule",
    displayName: "Harmonogram serwisanta",
    icon: "calendar-clock",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      servicemanId: { type: "ID", foreignKey: "servicemen.id", required: true, label: "Serwisant" },
      
      // Data i czas
      date: { type: "DATE", required: true, label: "Data" },
      startTime: { type: "TIME", required: true, label: "Czas rozpoczęcia" },
      endTime: { type: "TIME", required: true, label: "Czas zakończenia" },
      
      // Typ wpisu
      type: { 
        type: "ENUM", 
        values: ["work", "break", "travel", "unavailable", "vacation"],
        required: true,
        label: "Typ" 
      },
      
      // Powiązania
      visitId: { type: "ID", foreignKey: "serviceman_visits.id", label: "Wizyta" },
      
      // Opis
      description: { type: "TEXT", label: "Opis" },
      
      // Lokalizacja
      location: { type: "TEXT", label: "Lokalizacja" },
      
      isRecurring: { type: "BOOLEAN", default: false, label: "Cykliczne" },
      recurringPattern: { type: "STRING", length: 50, label: "Wzorzec cykliczny" }, // "weekly", "monthly"
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" }
    },
    
    indexes: ["servicemanId", "date", "type"]
  },

  // ========== RAPORTY SERWISANTA ==========
  serviceman_reports: {
    tableName: "serviceman_reports",
    displayName: "Raporty serwisanta", 
    icon: "file-text",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      reportNumber: { type: "STRING", length: 20, unique: true, label: "Numer raportu" }, // RPT-2024-001
      
      servicemanId: { type: "ID", foreignKey: "servicemen.id", required: true, label: "Serwisant" },
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      
      // Okres raportu
      periodStart: { type: "DATE", required: true, label: "Początek okresu" },
      periodEnd: { type: "DATE", required: true, label: "Koniec okresu" },
      
      // Statystyki
      totalVisits: { type: "INTEGER", default: 0, label: "Liczba wizyt" },
      totalOrders: { type: "INTEGER", default: 0, label: "Liczba zleceń" },
      totalHours: { type: "DECIMAL", precision: 5, scale: 2, default: 0, label: "Przepracowane godziny" },
      totalRevenue: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Przychód" },
      
      // Szczegóły
      summary: { type: "TEXT", label: "Podsumowanie" },
      issues: { type: "TEXT", label: "Problemy i uwagi" },
      recommendations: { type: "TEXT", label: "Zalecenia" },
      
      // Status
      status: { 
        type: "ENUM", 
        values: ["draft", "submitted", "approved", "archived"],
        default: "draft",
        label: "Status" 
      },
      
      // Plik PDF
      pdfPath: { type: "STRING", length: 255, label: "Ścieżka do PDF" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      submittedAt: { type: "DATETIME", label: "Data złożenia" },
      approvedAt: { type: "DATETIME", label: "Data zatwierdzenia" }
    },
    
    indexes: ["reportNumber", "servicemanId", "clientId", "periodStart", "status"]
  }
};

// ========== ENUMS DLA SERWISANTÓW ==========
const SERVICEMAN_ENUMS = {
  VISIT_STATUS: {
    SCHEDULED: { value: "scheduled", label: "Zaplanowana", color: "#6b7280", icon: "calendar" },
    IN_TRANSIT: { value: "in_transit", label: "W drodze", color: "#f59e0b", icon: "truck" },
    ON_SITE: { value: "on_site", label: "Na miejscu", color: "#3b82f6", icon: "map-pin" },
    COMPLETED: { value: "completed", label: "Ukończona", color: "#10b981", icon: "check-circle" },
    CANCELLED: { value: "cancelled", label: "Anulowana", color: "#ef4444", icon: "x-circle" },
    POSTPONED: { value: "postponed", label: "Przełożona", color: "#8b5cf6", icon: "clock" }
  },
  
  VISIT_TYPE: {
    ROUTINE: { value: "routine", label: "Rutynowa", icon: "refresh-cw" },
    EMERGENCY: { value: "emergency", label: "Awaryjna", icon: "alert-triangle" },
    FOLLOW_UP: { value: "follow_up", label: "Kontrolna", icon: "eye" },
    INSTALLATION: { value: "installation", label: "Instalacja", icon: "download" },
    MAINTENANCE: { value: "maintenance", label: "Konserwacja", icon: "settings" }
  },
  
  ORDER_STATUS_VISIT: {
    PENDING: { value: "pending", label: "Oczekuje", color: "#6b7280" },
    IN_PROGRESS: { value: "in_progress", label: "W trakcie", color: "#3b82f6" },
    WAITING_PARTS: { value: "waiting_parts", label: "Czeka na części", color: "#f59e0b" },
    COMPLETED: { value: "completed", label: "Ukończone", color: "#10b981" },
    DEFERRED: { value: "deferred", label: "Przełożone", color: "#8b5cf6" }
  }
};

// ========== FUNKCJE POMOCNICZE ==========
const ServicemanHelpers = {
  /**
   * Generuje numer wizyty
   */
  generateVisitNumber(year = new Date().getFullYear()) {
    // W rzeczywistości pobieraj ostatni numer z bazy
    const lastNumber = 1;
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `VIS-${year}-${nextNumber}`;
  },
  
  /**
   * Generuje numer zlecenia w wizycie
   */
  generateVisitOrderNumber(visitId) {
    const lastNumber = 1; // pobieraj z bazy dla danej wizyty
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `ORD-${visitId}-${nextNumber}`;
  },
  
  /**
   * Oblicza czas trwania wizyty
   */
  calculateVisitDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60)); // minuty
  },
  
  /**
   * Przygotowuje wizytę dla aplikacji mobilnej
   */
  prepareVisitForMobile(visit, client, orders = []) {
    return {
      ...visit,
      statusLabel: SERVICEMAN_ENUMS.VISIT_STATUS[visit.status.toUpperCase()]?.label || visit.status,
      statusColor: SERVICEMAN_ENUMS.VISIT_STATUS[visit.status.toUpperCase()]?.color || "#6b7280",
      typeLabel: SERVICEMAN_ENUMS.VISIT_TYPE[visit.visitType.toUpperCase()]?.label || visit.visitType,
      clientName: client ? `${client.firstName} ${client.lastName}` : '',
      clientCompany: client?.company || '',
      ordersCount: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      canStart: visit.status === 'scheduled',
      canComplete: visit.status === 'on_site' && orders.every(o => o.status === 'completed'),
      duration: visit.actualStartTime && visit.actualEndTime ? 
        this.calculateVisitDuration(visit.actualStartTime, visit.actualEndTime) : null
    };
  },
  
  /**
   * Sprawdza czy serwisant może rozpocząć wizytę
   */
  canStartVisit(visit, currentLocation = null) {
    if (visit.status !== 'scheduled') return false;
    
    // Sprawdź czy jest w pobliżu klienta (opcjonalnie)
    if (currentLocation && visit.coordinates) {
      const distance = this.calculateDistance(
        currentLocation.lat, currentLocation.lng,
        visit.coordinates.lat, visit.coordinates.lng
      );
      return distance <= 0.5; // 500m
    }
    
    return true;
  },
  
  /**
   * Oblicza odległość między punktami (km)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Promień Ziemi w km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};

module.exports = {
  SERVICEMAN_SCHEMAS,
  SERVICEMAN_ENUMS,
  ServicemanHelpers
};