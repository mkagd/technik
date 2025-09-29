// UNIFIED ORDERS STRUCTURE - Połączenie najlepszych cech orders.json i service-orders.json
// Stworzony: 2025-09-29
// Cel: Jednolity system zamówień eliminujący duplikację i poprawiający relacje

const UNIFIED_ORDER_STRUCTURE = {
  // Podstawowe informacje (z service-orders)
  id: "SRV25271234", // Format: SRV + YYMMDDHHMM
  status: "new", // new, assigned, in-progress, completed, cancelled, on-hold
  
  // Referencja do klienta (z orders.json)
  clientId: "CLI25186001", // Referencja do clients.json
  
  // Szczegóły usługi (połączenie obu systemów)
  service: {
    category: "Naprawa AGD", // z orders.json
    type: "piekarnik", // z service-orders jako device
    description: "Opis problemu z urządzeniem", // z orders.json
    priority: "normal", // normal, high, urgent (z orders.json)
    urgency: "normalny" // normalny, pilny, bardzo pilny (z service-orders)
  },
  
  // Urządzenia (uproszczona struktura z orders.json)
  devices: [
    {
      name: "Piekarnik Bosch", // nazwa urządzenia
      brand: "Bosch", // z service-orders
      model: "HBA5360S0", // z service-orders
      description: "Nie włącza się", // opis problemu
      // Usunięto skomplikowany builtInParams - zostanie zastąpiony prostszym systemem
      characteristics: {
        type: "built-in", // built-in, freestanding
        access: "easy", // easy, difficult, restricted
        requiresDisassembly: false,
        requiresAssembly: false
      }
    }
  ],
  
  // Adres (z service-orders ale rozszerzony)
  address: {
    street: "ul. Sienkiewicza 4/7",
    city: "Mielec",
    zipCode: "39-300", // dodane
    notes: "" // dodane dla specjalnych uwag
  },
  
  // Harmonogram (z service-orders rozszerzony)
  scheduling: {
    preferredTime: "jutro popołudniu",
    preferredDate: null, // ISO date string
    scheduledDate: "2025-07-20T08:14", // z orders.json
    assignedEmployeeId: null, // referencja do employees.json (poprawiona nazwa)
    estimatedDuration: 120, // w minutach
    actualDuration: null // faktyczny czas wykonania
  },
  
  // Finansowe (z service-orders)
  pricing: {
    estimatedCost: null,
    finalCost: null,
    travelCost: 50,
    partsUsed: [], // części użyte do naprawy
    laborHours: 0
  },
  
  // Historia i tracking (nowe)
  timeline: {
    createdAt: "2025-09-28T22:13:14.011Z",
    updatedAt: "2025-09-28T22:13:14.011Z",
    completedAt: null,
    statusHistory: [
      {
        status: "new",
        timestamp: "2025-09-28T22:13:14.011Z",
        employeeId: null,
        notes: "Zamówienie utworzone"
      }
    ]
  },
  
  // Notatki i komunikacja
  notes: {
    internal: "", // notatki wewnętrzne
    customer: "", // notatki dla klienta
    technical: "" // notatki techniczne
  },
  
  // USUNIĘTO niepotrzebne pola:
  // - migrated, clientIdFixed, idUpdated (metadata migracji)
  // - oldId, migrationDate, migrationSource (tylko w razie potrzeby konwersji)
  // - skomplikowany builtInParams system
};

// Status workflow
const STATUS_WORKFLOW = {
  new: ["assigned", "cancelled"],
  assigned: ["in-progress", "cancelled", "on-hold"],
  "in-progress": ["completed", "on-hold", "cancelled"],
  "on-hold": ["assigned", "in-progress", "cancelled"],
  completed: [], // końcowy status
  cancelled: [] // końcowy status
};

// Priorytety
const PRIORITY_LEVELS = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4
};

module.exports = {
  UNIFIED_ORDER_STRUCTURE,
  STATUS_WORKFLOW,
  PRIORITY_LEVELS
};