/**
 * PROSTA STRUKTURA ORDERS - KOMPLETNA ALE BEZ PRZESADY
 * 
 * ✅ Poprawiony clientId - używa prawdziwych ID z clients.json 
 * ✅ System wizyt - możliwość przypisywania wizyt do zleceń
 * ✅ Wszystko co potrzebne, nic więcej
 * ✅ Kompatybilność z serwerem
 * 
 * Brak: przesadzone funkcje Enhanced v3.0
 * Zachowane: nowy system ID (ORDA format)
 */

const SIMPLE_ORDER_STRUCTURE = {
  tableName: "orders",
  displayName: "Zlecenia - Prosta Struktura",
  icon: "clipboard-list",
  
  fields: {
    // ========== PODSTAWOWE ID ==========
    id: { type: "ID", primaryKey: true, autoIncrement: true },
    orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // ORDA25292001
    source: { type: "ENUM", values: ["web", "mobile", "api"], default: "web", label: "Źródło" },
    
    // ========== POPRAWIONY SYSTEM KLIENTÓW ==========
    clientId: { type: "STRING", length: 20, required: true, label: "ID klienta" }, // CLI25186001 (prawdziwe)
    clientName: { type: "STRING", length: 200, label: "Nazwa klienta" }, // Cache dla szybkości
    
    // ========== NOWY: SYSTEM WIZYT ==========
    visitId: { type: "STRING", length: 20, nullable: true, label: "ID wizyty" }, // VIS25292001
    appointmentDate: { type: "DATETIME", nullable: true, label: "Data wizyty" },
    appointmentTime: { type: "STRING", length: 10, nullable: true, label: "Godzina wizyty" }, // "14:30"
    visitStatus: { 
      type: "ENUM", 
      values: ["planned", "confirmed", "in_progress", "completed", "cancelled"],
      nullable: true,
      label: "Status wizyty" 
    },
    technicianId: { type: "STRING", length: 20, nullable: true, label: "ID technika" }, // EMP25292001
    technicianNotes: { type: "TEXT", nullable: true, label: "Notatki technika z wizyty" },
    
    // ========== DANE URZĄDZENIA ==========
    category: { type: "STRING", length: 100, required: true, label: "Kategoria" }, // "Naprawa laptopa", "Serwis AGD"
    deviceType: { type: "STRING", length: 100, label: "Typ urządzenia" }, // "Pralka", "Laptop"
    brand: { type: "STRING", length: 50, label: "Marka" }, // "Samsung", "Bosch"
    model: { type: "STRING", length: 100, label: "Model" }, // "WW70J5346MW"
    
    // ========== OPIS PROBLEMU ==========
    description: { type: "TEXT", required: true, label: "Opis problemu" },
    symptoms: { type: "JSON", label: "Lista objawów" }, // ["Nie wiruje", "Hałasuje"]
    diagnosis: { type: "TEXT", label: "Diagnoza" },
    solution: { type: "TEXT", label: "Rozwiązanie" },
    
    // ========== STATUS I WORKFLOW ==========
    status: { 
      type: "ENUM", 
      values: ["pending", "assigned", "in_progress", "waiting_parts", "waiting_client", "completed", "cancelled"],
      default: "pending",
      label: "Status" 
    },
    priority: { 
      type: "ENUM", 
      values: ["low", "medium", "high", "urgent"],
      default: "medium",
      label: "Priorytet" 
    },
    
    // ========== TERMINY ==========
    scheduledDate: { type: "DATETIME", label: "Planowana data" },
    estimatedDuration: { type: "INTEGER", label: "Szacowany czas (min)" },
    actualStartTime: { type: "DATETIME", nullable: true, label: "Rzeczywisty start" },
    actualEndTime: { type: "DATETIME", nullable: true, label: "Rzeczywiste zakończenie" },
    
    // ========== KOSZTY ==========
    estimatedCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Szacowany koszt" },
    partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
    laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
    totalCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt całkowity" },
    
    // ========== CZĘŚCI I MATERIAŁY ==========
    partsUsed: { type: "JSON", label: "Użyte części" },
    /* Format:
    [
      {
        name: "Pompa odpływowa",
        partNumber: "BSH-165261", 
        quantity: 1,
        unitCost: 80.00,
        totalCost: 80.00
      }
    ]
    */
    
    // ========== DOKUMENTACJA ==========
    photos: { type: "JSON", label: "Zdjęcia" },
    /* Format:
    [
      {
        url: "/photos/orders/ORDA25292001/before_1.jpg",
        type: "before", // before, after, problem, solution
        description: "Stan przed naprawą",
        timestamp: "2025-09-29T14:30:00Z"
      }
    ]
    */
    
    // ========== NOTATKI ==========
    clientNotes: { type: "TEXT", label: "Uwagi klienta" },
    internalNotes: { type: "TEXT", label: "Notatki wewnętrzne" },
    workNotes: { type: "TEXT", label: "Notatki robocze" },
    
    // ========== GWARANCJA ==========
    warrantyMonths: { type: "INTEGER", default: 3, label: "Gwarancja (miesiące)" },
    warrantyNotes: { type: "TEXT", label: "Uwagi do gwarancji" },
    
    // ========== DOSTĘPNOŚĆ KLIENTA ==========
    clientAvailability: { type: "TEXT", label: "Dostępność klienta" }, // "Poniedziałek-piątek po 17:00"
    preferredTime: { type: "STRING", length: 50, label: "Preferowany czas" }, // "Rano", "Po południu"
    
    // ========== HISTORIA ZMIAN (PROSTA) ==========
    statusHistory: { type: "JSON", label: "Historia statusów" },
    /* Format:
    [
      {
        status: "pending",
        timestamp: "2025-09-29T10:00:00Z",
        user: "system",
        note: "Zlecenie utworzone"
      },
      {
        status: "assigned", 
        timestamp: "2025-09-29T11:00:00Z",
        user: "EMP25292001",
        note: "Przypisano technika: Jan Kowalski"
      }
    ]
    */
    
    // ========== POWIADOMIENIA ==========
    notifications: { type: "JSON", label: "Wysłane powiadomienia" },
    clientNotified: { type: "BOOLEAN", default: false, label: "Klient powiadomiony" },
    
    // ========== METADANE ==========
    createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
    updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" },
    createdBy: { type: "STRING", length: 20, label: "Utworzone przez" }, // EMP25292001
    lastModifiedBy: { type: "STRING", length: 20, label: "Ostatnio modyfikowane przez" }
  },
  
  // ========== INDEKSY ==========
  indexes: [
    "orderNumber", 
    "clientId", 
    "visitId",
    "technicianId",
    "status", 
    "priority", 
    "scheduledDate",
    "createdAt"
  ],
  
  // ========== WORKFLOW STATUSÓW ==========
  statusFlow: {
    pending: ["assigned", "cancelled"],
    assigned: ["in_progress", "cancelled"],
    in_progress: ["waiting_parts", "waiting_client", "completed", "cancelled"],
    waiting_parts: ["in_progress", "cancelled"],
    waiting_client: ["in_progress", "cancelled"],
    completed: [], // końcowy
    cancelled: [] // końcowy
  },
  
  // ========== SYSTEM WIZYT ==========
  visitFlow: {
    planned: ["confirmed", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [], // końcowy
    cancelled: [] // końcowy
  },
  
  // ========== WALIDACJA ==========
  validation: {
    orderNumber: "required|unique|format:ORDA\\d{8}",
    clientId: "required|exists:clients,id",
    clientName: "required|min:2",
    category: "required",
    description: "required|min:10",
    status: "required|in:pending,assigned,in_progress,waiting_parts,waiting_client,completed,cancelled",
    priority: "required|in:low,medium,high,urgent"
  },
  
  // ========== FUNKCJE POMOCNICZE ==========
  helpers: {
    // Generuj numer zlecenia
    generateOrderNumber: () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      
      // Znajdź ostatni numer dziś
      const orders = require('../../data/orders.json');
      const todayPrefix = `ORDA${year}${month}${day}`;
      const todayOrders = orders.filter(o => o.orderNumber?.startsWith(todayPrefix));
      const lastNumber = todayOrders.length;
      
      return `${todayPrefix}${(lastNumber + 1).toString().padStart(3, '0')}`;
    },
    
    // Sprawdź czy można zmienić status
    canChangeStatus: (currentStatus, newStatus) => {
      return SIMPLE_ORDER_STRUCTURE.statusFlow[currentStatus]?.includes(newStatus) || false;
    },
    
    // Pobierz dane klienta
    getClientData: (clientId) => {
      const clients = require('../../data/clients.json');
      return clients.find(c => c.id === clientId);
    },
    
    // Sprawdź czy zlecenie ma wizytę
    hasVisit: (order) => {
      return !!(order.visitId && order.appointmentDate);
    },
    
    // Oblicz czas trwania
    calculateDuration: (startTime, endTime) => {
      if (!startTime || !endTime) return null;
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.round((end - start) / (1000 * 60)); // minuty
    }
  }
};

// ========== PRZYKŁAD PROSTEGO ZLECENIA ==========
const SIMPLE_ORDER_EXAMPLE = {
  id: 1001,
  orderNumber: "ORDA25292001", // Nowy format
  source: "web",
  
  // POPRAWIONE clientId
  clientId: "CLI25186001", // ✅ Prawdziwe ID z clients.json
  clientName: "Mariusz Bielaszka", // Cache
  
  // NOWY: System wizyt
  visitId: "VIS25292001",
  appointmentDate: "2025-09-30T14:00:00Z",
  appointmentTime: "14:00",
  visitStatus: "confirmed",
  technicianId: "EMP25292001",
  technicianNotes: "Klient dostępny po 14:00, łatwy dostęp do urządzenia",
  
  // Dane urządzenia
  category: "Serwis AGD",
  deviceType: "Pralka",
  brand: "Samsung",
  model: "WW70J5346MW",
  
  // Problem
  description: "Pralka nie wiruje, pranie zostaje mokre. Problem wystąpił nagle wczoraj.",
  symptoms: ["Nie wiruje", "Mokre pranie", "Dziwny dźwięk podczas płukania"],
  diagnosis: "Prawdopodobnie uszkodzony silnik wirowania lub problem z programatorem",
  solution: "",
  
  // Status
  status: "assigned",
  priority: "medium",
  
  // Terminy
  scheduledDate: "2025-09-30T14:00:00Z",
  estimatedDuration: 90,
  actualStartTime: null,
  actualEndTime: null,
  
  // Koszty
  estimatedCost: 150.00,
  partsCost: 0,
  laborCost: 0,
  totalCost: 0,
  
  // Części
  partsUsed: [],
  
  // Dokumentacja
  photos: [
    {
      url: "/photos/orders/ORDA25292001/problem_1.jpg",
      type: "before",
      description: "Pralka - widok z przodu, wyświetlacz pokazuje program",
      timestamp: "2025-09-29T10:00:00Z"
    }
  ],
  
  // Notatki
  clientNotes: "Proszę dzwonić przed przyjazdem, mam psa",
  internalNotes: "Stały klient, zawsze punktualny",
  workNotes: "",
  
  // Gwarancja
  warrantyMonths: 6,
  warrantyNotes: "Gwarancja na naprawę i części",
  
  // Dostępność
  clientAvailability: "Poniedziałek-piątek po 17:00, weekendy cały dzień",
  preferredTime: "Po południu",
  
  // Historia
  statusHistory: [
    {
      status: "pending",
      timestamp: "2025-09-29T10:00:00Z",
      user: "system",
      note: "Zlecenie utworzone przez formularz web"
    },
    {
      status: "assigned",
      timestamp: "2025-09-29T11:30:00Z", 
      user: "EMP25292001",
      note: "Przypisano technika: Jan Kowalski, zaplanowano wizytę na 30.09 o 14:00"
    }
  ],
  
  // Powiadomienia
  notifications: [
    {
      type: "order_created",
      timestamp: "2025-09-29T10:05:00Z",
      method: "sms",
      status: "sent"
    },
    {
      type: "technician_assigned",
      timestamp: "2025-09-29T11:35:00Z",
      method: "sms", 
      status: "sent"
    }
  ],
  clientNotified: true,
  
  // Metadane
  createdAt: "2025-09-29T10:00:00Z",
  updatedAt: "2025-09-29T11:30:00Z",
  createdBy: "web_form",
  lastModifiedBy: "EMP25292001"
};

module.exports = {
  SIMPLE_ORDER_STRUCTURE,
  SIMPLE_ORDER_EXAMPLE
};