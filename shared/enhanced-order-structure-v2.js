/**
 * ENHANCED ORDER STRUCTURE v2.0
 * 
 * Połączenie najlepszych funkcji z aplikacji webowej i mobilnej
 * Bazuje na strukturze zlecenie-szczegoly.js (47 pól) + visit_orders (35 pól)
 * 
 * DODANE FUNKCJE Z MOBILE:
 * ✅ GPS i lokalizacja urządzenia  
 * ✅ Zdjęcia przed/po naprawie
 * ✅ Workflow statusów z visit context
 * ✅ System gwarancji serwisu  
 * ✅ Zalecenia prewencyjne
 * ✅ Push notifications & powiadomienia
 * ✅ Mobile helpers & formatowanie
 * ✅ Workflow wizyt (visit integration)
 */

const ENHANCED_ORDER_STRUCTURE_V2 = {
  tableName: "enhanced_orders_v2",
  displayName: "Zlecenia Enhanced v2.0",
  icon: "clipboard-check",
  
  fields: {
    // ========== PODSTAWOWE ID I POWIĄZANIA ==========
    id: { type: "ID", primaryKey: true, autoIncrement: true },
    orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // ORDA25272001
    orderSource: { type: "ENUM", values: ["web", "mobile", "api", "ai"], default: "web", label: "Źródło zlecenia" },
    
    // Powiązania (z istniejącej struktury web)
    clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
    employeeId: { type: "ID", foreignKey: "employees.id", nullable: true, label: "Pracownik" },
    
    // 🆕 NOWE: Integracja z wizytami (z mobile)
    visitId: { type: "ID", foreignKey: "serviceman_visits.id", nullable: true, label: "Wizyta serwisanta" },
    servicemanId: { type: "ID", foreignKey: "servicemen.id", nullable: true, label: "Serwisant" },
    
    // ========== INFORMACJE O URZĄDZENIU ==========
    deviceType: { type: "STRING", length: 50, required: true, label: "Typ urządzenia" },
    brand: { type: "STRING", length: 50, label: "Marka" },
    model: { type: "STRING", length: 100, label: "Model" },
    serialNumber: { type: "STRING", length: 100, label: "Numer seryjny" },
    
    // 🆕 NOWE: Lokalizacja urządzenia (z mobile)
    deviceLocation: { type: "STRING", length: 100, label: "Lokalizacja urządzenia" }, // "Sala 101, Stanowisko 5"
    deviceCoordinates: { type: "JSON", label: "Współrzędne GPS urządzenia" }, // { lat: 50.0647, lng: 19.9450 }
    
    // ========== OPIS PROBLEMU I DIAGNOZY ==========
    problemDescription: { type: "TEXT", required: true, label: "Opis problemu" },
    symptoms: { type: "JSON", label: "Objawy" }, // ["Brak zasilania", "Nie świeci display"]
    category: { type: "STRING", length: 50, label: "Kategoria problemu" },
    
    // 🆕 NOWE: Rozszerzona diagnoza (z mobile)
    diagnosis: { type: "TEXT", label: "Szczegółowa diagnoza" },
    solutionDescription: { type: "TEXT", label: "Wykonane czynności" },
    
    // ========== STATUS I PRIORYTETY ==========
    status: { 
      type: "ENUM", 
      values: ["pending", "in_progress", "waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"],
      default: "pending",
      label: "Status" 
    },
    priority: { 
      type: "ENUM", 
      values: ["low", "medium", "high", "critical"],
      default: "medium",
      label: "Priorytet" 
    },
    
    // 🆕 NOWE: Workflow statusów (z mobile)
    statusHistory: { type: "JSON", label: "Historia zmian statusu" }, // [{ status, timestamp, userId, notes }]
    canEdit: { type: "BOOLEAN", default: true, label: "Można edytować" },
    
    // ========== ZARZĄDZANIE CZASEM ==========
    estimatedDuration: { type: "INTEGER", label: "Szacowany czas (min)" },
    
    // Czasy (z web)
    isTimerRunning: { type: "BOOLEAN", default: false, label: "Timer włączony" },
    timerStartTime: { type: "DATETIME", nullable: true, label: "Start timera" },
    totalWorkTime: { type: "INTEGER", default: 0, label: "Całkowity czas pracy (sek)" },
    workSessions: { type: "JSON", label: "Sesje robocze" }, // [{ start, end, duration, notes }]
    
    // 🆕 NOWE: Czasy z mobile workflow
    actualStartTime: { type: "DATETIME", nullable: true, label: "Rzeczywisty start" },
    actualEndTime: { type: "DATETIME", nullable: true, label: "Rzeczywiste zakończenie" },
    timeSpentMinutes: { type: "INTEGER", nullable: true, label: "Czas pracy (min)" },
    
    // ========== KOSZTY I ROZLICZENIA ==========
    estimatedCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Szacowany koszt" },
    
    // Szczegółowe koszty (z web)
    laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
    partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
    travelCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt dojazdu" },
    totalCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt całkowity" },
    finalAmount: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Końcowa kwota" },
    
    // Płatności (z web)
    paymentMethod: { 
      type: "ENUM", 
      values: ["cash", "card", "transfer", "invoice"],
      default: "cash",
      label: "Metoda płatności" 
    },
    paymentReceived: { type: "BOOLEAN", default: false, label: "Płatność otrzymana" },
    isPaid: { type: "BOOLEAN", default: false, label: "Opłacone" },
    
    // ========== CZĘŚCI I MATERIAŁY ==========
    partsUsed: { type: "JSON", label: "Użyte części" }, 
    // [{ id, name, quantity, price, total, partNumber, supplier, modelInfo }]
    
    deviceModels: { type: "JSON", label: "Modele urządzeń" }, // Baza modeli z web
    
    // ========== 🆕 NOWE: DOKUMENTACJA WIZUALNA (Z MOBILE) ==========
    beforePhotos: { type: "JSON", label: "Zdjęcia przed naprawą" }, 
    // [{ url, description, timestamp, uploadedBy }]
    afterPhotos: { type: "JSON", label: "Zdjęcia po naprawie" },
    // [{ url, description, timestamp, uploadedBy }]
    
    // ========== NOTATKI I KOMUNIKACJA ==========
    workNotes: { type: "TEXT", label: "Notatki robocze" },
    technicianNotes: { type: "TEXT", label: "Notatki technika" },
    internalNotes: { type: "TEXT", label: "Notatki wewnętrzne" },
    clientFeedback: { type: "TEXT", label: "Opinia klienta" },
    
    // 🆕 NOWE: Zalecenia (z mobile)
    recommendations: { type: "TEXT", label: "Zalecenia" },
    preventiveMaintenance: { type: "TEXT", label: "Zalecenia prewencyjne" },
    
    // ========== PODPISY I POTWIERDZENIA ==========
    customerSignature: { type: "TEXT", label: "Podpis klienta" }, // Base64 z web
    
    // Dane do ukończenia (z web)
    completionPhotos: { type: "JSON", label: "Zdjęcia ukończenia" },
    
    // ========== 🆕 NOWE: GWARANCJA (Z MOBILE) ==========
    warrantyMonths: { type: "INTEGER", default: 3, label: "Gwarancja (miesiące)" },
    warrantyNotes: { type: "TEXT", label: "Uwagi do gwarancji" },
    warrantyStatus: { 
      type: "ENUM", 
      values: ["na_gwarancji", "gwarancja_wygasla", "bez_gwarancji"],
      label: "Status gwarancji producenta" 
    },
    
    // ========== USTAWIENIA CENOWE ==========
    pricingSettings: { type: "JSON", label: "Ustawienia cenowe" },
    // { serviceType, deviceCategory, distance, autoCalculateLaborCost, customRates }
    
    // ========== 🆕 NOWE: POWIADOMIENIA (Z MOBILE) ==========
    notificationsSent: { type: "JSON", label: "Wysłane powiadomienia" },
    // [{ type, recipient, timestamp, status }]
    
    pushNotificationsSent: { type: "JSON", label: "Push notifications" },
    // [{ message, recipient, timestamp, delivered }]
    
    // ========== HISTORIA SERWISU ==========
    serviceHistory: { type: "JSON", label: "Historia serwisu" },
    // [{ date, service, technician, notes }]
    
    // ========== METADANE ==========
    createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
    updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" },
    
    // 🆕 NOWE: Metadane mobile
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
    "employeeId", 
    "servicemanId",
    "visitId",
    "status", 
    "priority", 
    "createdAt",
    "deviceType",
    "brand"
  ],
  
  // ========== 🆕 NOWE: WORKFLOW STATUSÓW (Z MOBILE) ==========
  statusFlow: {
    pending: ["in_progress", "cancelled", "deferred"],
    in_progress: ["waiting_parts", "waiting_client", "testing", "completed", "cancelled", "deferred"],
    waiting_parts: ["in_progress", "cancelled", "deferred"],
    waiting_client: ["in_progress", "cancelled", "deferred"],
    testing: ["completed", "in_progress", "cancelled"],
    completed: [], // końcowy
    cancelled: [], // końcowy
    deferred: ["pending", "cancelled"] // przełożone
  },
  
  // ========== 🆕 NOWE: POWIADOMIENIA (Z MOBILE) ==========
  notificationTriggers: {
    order_created: "Zlecenie utworzone",
    order_assigned: "Zlecenie przypisane",
    order_started: "Rozpoczęto pracę",
    order_parts_needed: "Potrzebne części",
    order_waiting_client: "Oczekiwanie na klienta",
    order_completed: "Zlecenie ukończone",
    order_cancelled: "Zlecenie anulowane"
  },
  
  // ========== WALIDACJA ==========
  validation: {
    orderNumber: "required|unique",
    clientId: "required|exists:clients,id",
    deviceType: "required|min:2",
    problemDescription: "required|min:10",
    status: "required|in:pending,in_progress,waiting_parts,waiting_client,testing,completed,cancelled,deferred",
    priority: "required|in:low,medium,high,critical",
    estimatedCost: "numeric|min:0",
    totalCost: "numeric|min:0"
  },
  
  // ========== 🆕 NOWE: MOBILE FEATURES ==========
  mobileFeatures: {
    gpsTracking: "Śledzenie lokalizacji urządzenia",
    photoDocumentation: "Dokumentacja zdjęciowa przed/po",
    offlineMode: "Praca offline z synchronizacją",
    pushNotifications: "Powiadomienia push w czasie rzeczywistym",
    visitIntegration: "Integracja z wizytami serwisanta",
    warrantyTracking: "Śledzenie gwarancji serwisowych",
    preventiveTips: "Zalecenia prewencyjne",
    quickStatusUpdate: "Szybka aktualizacja statusu"
  }
};

// ========== 🆕 NOWE: MOBILE HELPERS ==========
const EnhancedOrderHelpers = {
  /**
   * Przygotowuje zlecenie dla aplikacji mobilnej z wszystkimi dodatkowymi informacjami
   */
  prepareOrderForMobile(order, client, employee, serviceman = null) {
    return {
      ...order,
      // Formatowanie statusu
      statusLabel: this.getStatusLabel(order.status),
      statusColor: this.getStatusColor(order.status),
      priorityLabel: this.getPriorityLabel(order.priority),
      
      // Formatowanie dat i kosztów
      formattedCost: this.formatPrice(order.totalCost || order.estimatedCost),
      formattedDate: this.formatDate(order.createdAt),
      
      // Informacje o osobach
      clientName: client ? `${client.firstName} ${client.lastName}` : '',
      technicianName: employee ? `${employee.firstName} ${employee.lastName}` : 'Nieprzypisany',
      servicemanName: serviceman ? `${serviceman.firstName} ${serviceman.lastName}` : null,
      
      // Możliwości akcji
      canEdit: order.status !== 'completed' && order.status !== 'cancelled',
      canStart: order.status === 'pending',
      canComplete: order.status === 'in_progress' || order.status === 'testing',
      canCancel: !['completed', 'cancelled'].includes(order.status),
      
      // Statystyki
      photosCount: (order.beforePhotos?.length || 0) + (order.afterPhotos?.length || 0),
      hasWarranty: order.warrantyMonths > 0,
      isOverdue: this.isOrderOverdue(order),
      
      // 🆕 GPS i lokalizacja
      hasLocation: !!(order.deviceLocation || order.deviceCoordinates),
      locationInfo: order.deviceLocation || 'Lokalizacja nie określona',
      
      // 🆕 Workflow info  
      availableStatusChanges: this.getAvailableStatusChanges(order.status),
      nextRecommendedAction: this.getNextRecommendedAction(order.status)
    };
  },
  
  /**
   * Zwraca dostępne zmiany statusu dla danego stanu
   */
  getAvailableStatusChanges(currentStatus) {
    return ENHANCED_ORDER_STRUCTURE_V2.statusFlow[currentStatus] || [];
  },
  
  /**
   * Zwraca następną zalecaną akcję
   */
  getNextRecommendedAction(status) {
    const actions = {
      pending: "Rozpocznij pracę nad zleceniem",
      in_progress: "Kontynuuj prace lub oznacz jako ukończone",
      waiting_parts: "Zamów części lub czekaj na dostawę",
      waiting_client: "Skontaktuj się z klientem",
      testing: "Przetestuj urządzenie i finalizuj",
      completed: "Zlecenie ukończone",
      cancelled: "Zlecenie anulowane",
      deferred: "Zaplanuj ponownie lub anuluj"
    };
    return actions[status] || "Brak akcji";
  },
  
  /**
   * Sprawdza czy zlecenie jest opóźnione
   */
  isOrderOverdue(order) {
    if (!order.estimatedDuration) return false;
    const now = new Date();
    const created = new Date(order.createdAt);
    const estimatedFinish = new Date(created.getTime() + order.estimatedDuration * 60000);
    return now > estimatedFinish && !['completed', 'cancelled'].includes(order.status);
  },
  
  /**
   * Formatuje cenę
   */
  formatPrice(amount) {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  },
  
  /**
   * Formatuje datę
   */
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * Zwraca etykietę statusu
   */
  getStatusLabel(status) {
    const labels = {
      pending: "Oczekujące",
      in_progress: "W trakcie",
      waiting_parts: "Oczekiwanie na części",
      waiting_client: "Oczekiwanie na klienta",
      testing: "Testowanie",
      completed: "Ukończone",
      cancelled: "Anulowane",
      deferred: "Przełożone"
    };
    return labels[status] || status;
  },
  
  /**
   * Zwraca kolor statusu
   */
  getStatusColor(status) {
    const colors = {
      pending: "#f59e0b",      // amber
      in_progress: "#3b82f6",  // blue
      waiting_parts: "#f97316", // orange
      waiting_client: "#8b5cf6", // violet
      testing: "#06b6d4",      // cyan
      completed: "#10b981",    // emerald
      cancelled: "#ef4444",    // red
      deferred: "#6b7280"      // gray
    };
    return colors[status] || "#6b7280";
  },
  
  /**
   * Zwraca etykietę priorytetu
   */
  getPriorityLabel(priority) {
    const labels = {
      low: "Niski",
      medium: "Średni", 
      high: "Wysoki",
      critical: "Krytyczny"
    };
    return labels[priority] || priority;
  },
  
  /**
   * Tworzy powiadomienie push
   */
  createPushNotification(orderId, type, recipientId, customMessage = null) {
    const messages = {
      order_created: "Nowe zlecenie zostało utworzone",
      order_assigned: "Zlecenie zostało Ci przypisane",
      order_started: "Rozpoczęto pracę nad zleceniem",
      order_completed: "Zlecenie zostało ukończone",
      order_cancelled: "Zlecenie zostało anulowane"
    };
    
    return {
      orderId,
      type,
      recipientId,
      message: customMessage || messages[type] || "Aktualizacja zlecenia",
      timestamp: new Date().toISOString(),
      delivered: false
    };
  }
};

module.exports = {
  ENHANCED_ORDER_STRUCTURE_V2,
  EnhancedOrderHelpers
};