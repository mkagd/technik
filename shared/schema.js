/**
 * CENTRALNA STRUKTURA DANYCH - SERWIS TECHNIK
 * 
 * Ten plik definiuje kompletną strukturę danych dla:
 * - Aplikacji webowej (Next.js)
 * - Aplikacji mobilnej 
 * - Bazy danych (MySQL/PostgreSQL)
 * - API endpoints
 * 
 * Wersja: 1.0
 * Data: 2024-09-26
 */

// ========== KONFIGURACJA SYSTEMU ==========
const SYSTEM_CONFIG = {
  version: "1.0.0",
  name: "Serwis Technik - System zarządzania",
  
  // Obsługiwane źródła danych
  dataSources: {
    development: "file", // pliki JSON
    production: "mysql", // baza danych
    mobile: "api" // REST API
  },
  
  // Ustawienia API
  api: {
    baseUrl: "http://192.168.0.9:3000/api", // dla sieci lokalnej
    version: "v1",
    timeout: 10000,
    
    // Endpoints dla aplikacji mobilnej
    endpoints: {
      auth: "/auth",
      orders: "/orders",
      clients: "/clients", 
      employees: "/employees",
      appointments: "/appointments",
      inventory: "/inventory",
      notifications: "/notifications"
    }
  },
  
  // Konfiguracja aplikacji mobilnej
  mobile: {
    supportedPlatforms: ["android", "ios"],
    minVersion: "1.0.0",
    
    // Funkcje dostępne dla różnych ról
    features: {
      client: [
        "view_my_orders",
        "create_order", 
        "upload_photos",
        "chat_support",
        "receive_notifications"
      ],
      technician: [
        "view_assigned_orders",
        "update_order_status",
        "add_notes",
        "upload_photos",
        "manage_appointments",
        "inventory_check"
      ],
      admin: [
        "view_all_orders",
        "manage_employees",
        "view_reports",
        "system_settings"
      ]
    }
  }
};

// ========== DEFINICJE TYPÓW DANYCH ==========

const DATA_TYPES = {
  // Typy podstawowe
  ID: "integer",
  STRING: "string", 
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  DATE: "date",
  DATETIME: "datetime",
  DECIMAL: "decimal",
  BOOLEAN: "boolean",
  ENUM: "enum",
  JSON: "json",
  
  // Typy złożone
  ADDRESS: {
    street: "string",
    city: "string", 
    postalCode: "string",
    country: "string"
  },
  
  MONEY: {
    amount: "decimal",
    currency: "string"
  },
  
  CONTACT: {
    type: "enum", // phone, email, sms
    value: "string",
    isPrimary: "boolean"
  }
};

// ========== SŁOWNIKI I ENUMS ==========

const ENUMS = {
  // Statusy zleceń - KLUCZOWE dla obu aplikacji
  ORDER_STATUS: {
    PENDING: { value: "pending", label: "Oczekuje", color: "#fbbf24", icon: "clock" },
    IN_PROGRESS: { value: "in_progress", label: "W trakcie", color: "#3b82f6", icon: "wrench" },
    WAITING_PARTS: { value: "waiting_parts", label: "Czeka na części", color: "#f59e0b", icon: "package" },
    WAITING_CLIENT: { value: "waiting_client", label: "Czeka na klienta", color: "#8b5cf6", icon: "user-clock" },
    TESTING: { value: "testing", label: "Testy", color: "#06b6d4", icon: "test-tube" },
    COMPLETED: { value: "completed", label: "Ukończone", color: "#10b981", icon: "check-circle" },
    CANCELLED: { value: "cancelled", label: "Anulowane", color: "#ef4444", icon: "x-circle" },
    RETURNED: { value: "returned", label: "Zwrócone", color: "#6b7280", icon: "return" }
  },
  
  // Priorytety
  PRIORITY: {
    LOW: { value: "low", label: "Niski", color: "#6b7280", order: 1 },
    MEDIUM: { value: "medium", label: "Średni", color: "#f59e0b", order: 2 },
    HIGH: { value: "high", label: "Wysoki", color: "#ef4444", order: 3 },
    URGENT: { value: "urgent", label: "Pilny", color: "#dc2626", order: 4 }
  },
  
  // Typy urządzeń
  DEVICE_TYPES: {
    LAPTOP: { value: "laptop", label: "Laptop", icon: "laptop" },
    DESKTOP: { value: "desktop", label: "Komputer", icon: "desktop" },
    PRINTER: { value: "printer", label: "Drukarka", icon: "printer" },
    TABLET: { value: "tablet", label: "Tablet", icon: "tablet" },
    PHONE: { value: "phone", label: "Telefon", icon: "smartphone" },
    MONITOR: { value: "monitor", label: "Monitor", icon: "monitor" },
    SERVER: { value: "server", label: "Serwer", icon: "server" },
    OTHER: { value: "other", label: "Inne", icon: "hardware" }
  },
  
  // Typy serwisu
  SERVICE_TYPES: {
    REPAIR: { value: "naprawa", label: "Naprawa", icon: "wrench" },
    MAINTENANCE: { value: "konserwacja", label: "Konserwacja", icon: "settings" },
    INSTALLATION: { value: "instalacja", label: "Instalacja", icon: "download" },
    DIAGNOSTICS: { value: "diagnostyka", label: "Diagnostyka", icon: "search" },
    UPGRADE: { value: "modernizacja", label: "Modernizacja", icon: "arrow-up" },
    CONSULTATION: { value: "konsultacja", label: "Konsultacja", icon: "message-circle" }
  },
  
  // Role użytkowników
  USER_ROLES: {
    CLIENT: { value: "client", label: "Klient", permissions: ["view_own_orders", "create_order"] },
    TECHNICIAN: { value: "technician", label: "Technik", permissions: ["view_orders", "update_orders"] },
    MANAGER: { value: "manager", label: "Kierownik", permissions: ["manage_orders", "view_reports"] },
    ADMIN: { value: "admin", label: "Administrator", permissions: ["full_access"] }
  },
  
  // Kategorie problemów
  CATEGORIES: {
    HARDWARE: { value: "Hardware", label: "Sprzęt", color: "#ef4444" },
    SOFTWARE: { value: "Software", label: "Oprogramowanie", color: "#3b82f6" },
    NETWORK: { value: "Network", label: "Sieć", color: "#10b981" },
    SECURITY: { value: "Security", label: "Bezpieczeństwo", color: "#f59e0b" },
    OTHER: { value: "Other", label: "Inne", color: "#6b7280" }
  }
};

// ========== PEŁNE SCHEMATY TABEL ==========

const SCHEMAS = {
  // ========== UŻYTKOWNICY I KLIENCI ==========
  
  clients: {
    tableName: "clients",
    displayName: "Klienci",
    icon: "users",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      clientId: { type: "STRING", length: 20, unique: true, label: "ID klienta" }, // CLI-001, CLI-002
      
      // Dane podstawowe
      firstName: { type: "STRING", required: true, length: 50, label: "Imię" },
      lastName: { type: "STRING", required: true, length: 50, label: "Nazwisko" },
      email: { type: "EMAIL", unique: true, label: "E-mail" },
      phone: { type: "PHONE", required: true, label: "Telefon" },
      alternativePhone: { type: "PHONE", label: "Telefon alternatywny" },
      
      // Adres - ważne dla aplikacji mobilnej (pickup/delivery)
      address: { type: "TEXT", label: "Adres" },
      city: { type: "STRING", length: 50, label: "Miasto" },
      postalCode: { type: "STRING", length: 10, label: "Kod pocztowy" },
      country: { type: "STRING", length: 50, default: "Polska", label: "Kraj" },
      
      // Dane firmowe
      company: { type: "STRING", length: 100, label: "Firma" },
      nip: { type: "STRING", length: 15, label: "NIP" },
      regon: { type: "STRING", length: 14, label: "REGON" },
      
      // Preferencje - kluczowe dla powiadomień mobilnych
      customerType: { type: "ENUM", values: ["individual", "business"], default: "individual", label: "Typ klienta" },
      preferredContact: { type: "ENUM", values: ["phone", "email", "sms", "app"], default: "phone", label: "Preferowany kontakt" },
      allowNotifications: { type: "BOOLEAN", default: true, label: "Zgoda na powiadomienia" },
      allowSMS: { type: "BOOLEAN", default: false, label: "Zgoda na SMS" },
      
      // Aplikacja mobilna
      mobileAppInstalled: { type: "BOOLEAN", default: false, label: "Ma aplikację mobilną" },
      pushToken: { type: "STRING", length: 255, label: "Token push notifications" },
      
      // Dodatkowe
      notes: { type: "TEXT", label: "Notatki" },
      isActive: { type: "BOOLEAN", default: true, label: "Aktywny" },
      loyaltyPoints: { type: "INTEGER", default: 0, label: "Punkty lojalnościowe" },
      
      // Timestamps
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["email", "phone", ["lastName", "firstName"], "nip"],
    
    // Dla aplikacji mobilnej - jakie pola są wymagane przy rejestracji
    mobileRegistration: {
      required: ["firstName", "lastName", "phone", "email"],
      optional: ["address", "city", "company"]
    },
    
    // Walidacja dla obu aplikacji
    validation: {
      email: "email",
      phone: "phone_pl",
      nip: "nip_pl"
    }
  },

  orders: {
    tableName: "orders", 
    displayName: "Zlecenia",
    icon: "clipboard-list",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      orderId: { type: "STRING", length: 20, unique: true, label: "ID zlecenia" }, // ORD-001, ORD-002
      orderNumber: { type: "STRING", length: 20, unique: true, label: "Numer zlecenia" }, // SRV-2024-001
      
      // Powiązania
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      employeeId: { type: "ID", foreignKey: "employees.id", label: "Przypisany technik" },
      
      // Urządzenie - kluczowe dla aplikacji mobilnej
      deviceType: { type: "ENUM", values: Object.keys(ENUMS.DEVICE_TYPES), required: true, label: "Typ urządzenia" },
      brand: { type: "STRING", length: 50, label: "Marka" },
      model: { type: "STRING", length: 100, label: "Model" },
      serialNumber: { type: "STRING", length: 100, label: "Numer seryjny" },
      
      // Opis problemu
      serviceType: { type: "ENUM", values: Object.keys(ENUMS.SERVICE_TYPES), required: true, label: "Typ serwisu" },
      category: { type: "ENUM", values: Object.keys(ENUMS.CATEGORIES), required: true, label: "Kategoria" },
      problemDescription: { type: "TEXT", required: true, label: "Opis problemu" },
      diagnosis: { type: "TEXT", label: "Diagnoza" },
      solutionDescription: { type: "TEXT", label: "Opis rozwiązania" },
      
      // Status - najważniejsze dla śledzenia w aplikacji mobilnej
      status: { type: "ENUM", values: Object.keys(ENUMS.ORDER_STATUS), default: "pending", label: "Status" },
      priority: { type: "ENUM", values: Object.keys(ENUMS.PRIORITY), default: "medium", label: "Priorytet" },
      
      // Finansowe
      estimatedCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Szacowany koszt" },
      partsCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt części" },
      laborCost: { type: "DECIMAL", precision: 10, scale: 2, default: 0, label: "Koszt robocizny" },
      finalCost: { type: "DECIMAL", precision: 10, scale: 2, label: "Koszt końcowy" },
      
      // Terminy - ważne dla powiadomień mobilnych
      estimatedCompletionDate: { type: "DATETIME", label: "Przewidywany termin" },
      actualCompletionDate: { type: "DATETIME", label: "Rzeczywisty termin" },
      
      // Gwarancja
      warranty: { type: "INTEGER", label: "Gwarancja (miesiące)" },
      warrantyExpiresAt: { type: "DATE", label: "Gwarancja do" },
      
      // Dodatkowe opcje - ważne dla aplikacji mobilnej
      isUrgent: { type: "BOOLEAN", default: false, label: "Pilne" },
      requiresPickup: { type: "BOOLEAN", default: false, label: "Wymaga odbioru" },
      requiresDelivery: { type: "BOOLEAN", default: false, label: "Wymaga dostawy" },
      customerNotified: { type: "BOOLEAN", default: false, label: "Klient powiadomiony" },
      
      // Notatki
      notes: { type: "TEXT", label: "Notatki dla klienta" },
      internalNotes: { type: "TEXT", label: "Notatki wewnętrzne" },
      
      // Zdjęcia - istotne dla aplikacji mobilnej
      photos: { type: "JSON", label: "Zdjęcia" }, // [{ url, description, timestamp }]
      
      // Timestamps
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["orderNumber", "clientId", "employeeId", "status", "priority", "createdAt"],
    
    // Dla aplikacji mobilnej - jakie zmiany statusu są dozwolone
    statusFlow: {
      pending: ["in_progress", "cancelled"],
      in_progress: ["waiting_parts", "waiting_client", "testing", "completed", "cancelled"],
      waiting_parts: ["in_progress", "cancelled"],
      waiting_client: ["in_progress", "cancelled"],
      testing: ["completed", "in_progress"],
      completed: ["returned"], // tylko admin
      cancelled: [], // końcowy
      returned: [] // końcowy
    },
    
    // Powiadomienia mobilne - kiedy wysyłać
    notificationTriggers: {
      status_changed: true,
      estimated_date_changed: true,
      assigned_technician: true,
      ready_for_pickup: true
    }
  },

  employees: {
    tableName: "employees",
    displayName: "Pracownicy", 
    icon: "user-tie",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      employeeId: { type: "STRING", length: 20, unique: true, label: "ID pracownika" }, // EMP001
      
      // Dane osobowe
      firstName: { type: "STRING", length: 50, required: true, label: "Imię" },
      lastName: { type: "STRING", length: 50, required: true, label: "Nazwisko" },
      email: { type: "EMAIL", unique: true, required: true, label: "E-mail" },
      phone: { type: "PHONE", required: true, label: "Telefon" },
      
      // Praca
      position: { type: "STRING", length: 100, required: true, label: "Stanowisko" },
      department: { type: "STRING", length: 50, label: "Dział" },
      role: { type: "ENUM", values: Object.keys(ENUMS.USER_ROLES), required: true, label: "Rola" },
      hourlyRate: { type: "DECIMAL", precision: 8, scale: 2, label: "Stawka godzinowa" },
      
      // Uprawnienia - kluczowe dla aplikacji mobilnej
      isActive: { type: "BOOLEAN", default: true, label: "Aktywny" },
      canAccessMobile: { type: "BOOLEAN", default: false, label: "Dostęp do aplikacji mobilnej" },
      canAccessAdmin: { type: "BOOLEAN", default: false, label: "Dostęp do panelu admin" },
      canManageOrders: { type: "BOOLEAN", default: false, label: "Zarządzanie zleceniami" },
      canManageClients: { type: "BOOLEAN", default: false, label: "Zarządzanie klientami" },
      canViewReports: { type: "BOOLEAN", default: false, label: "Dostęp do raportów" },
      
      // Logowanie i bezpieczeństwo
      passwordHash: { type: "STRING", length: 255, label: "Hash hasła" },
      lastLogin: { type: "DATETIME", label: "Ostatnie logowanie" },
      mobileToken: { type: "STRING", length: 255, label: "Token aplikacji mobilnej" },
      pushToken: { type: "STRING", length: 255, label: "Token push notifications" },
      
      // Harmonogram pracy - dla aplikacji mobilnej
      workingHours: { type: "JSON", label: "Godziny pracy" },
      /*
      {
        monday: { start: "08:00", end: "16:00", isWorking: true },
        tuesday: { start: "08:00", end: "16:00", isWorking: true },
        ...
      }
      */
      
      notes: { type: "TEXT", label: "Notatki" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["employeeId", "email", "isActive", "role"],
    
    // Dla aplikacji mobilnej - domyślne uprawnienia ролей
    rolePermissions: {
      technician: {
        canAccessMobile: true,
        canManageOrders: true,
        canViewReports: false
      },
      manager: {
        canAccessMobile: true, 
        canManageOrders: true,
        canManageClients: true,
        canViewReports: true
      },
      admin: {
        canAccessMobile: true,
        canAccessAdmin: true,
        canManageOrders: true,
        canManageClients: true,
        canViewReports: true
      }
    }
  }

  // ... więcej tabel można dodać tutaj
};

// ========== API RESPONSES - struktury odpowiedzi dla aplikacji mobilnej ==========

const API_RESPONSES = {
  // Standardowa struktura odpowiedzi
  success: {
    success: true,
    data: "any",
    message: "string",
    timestamp: "datetime"
  },
  
  error: {
    success: false,
    error: {
      code: "string",
      message: "string",
      details: "any"
    },
    timestamp: "datetime"
  },
  
  // Lista z paginacją
  paginated: {
    success: true,
    data: "array",
    pagination: {
      page: "number",
      limit: "number", 
      total: "number",
      pages: "number"
    }
  },
  
  // Odpowiedź logowania - dla aplikacji mobilnej
  login: {
    success: true,
    data: {
      user: "employee_object",
      token: "string",
      expiresAt: "datetime",
      permissions: "array"
    }
  }
};

// ========== EKSPORT ==========

module.exports = {
  SYSTEM_CONFIG,
  DATA_TYPES,
  ENUMS,
  SCHEMAS,
  API_RESPONSES,
  
  // Funkcje pomocnicze
  getEnumLabel: (enumName, value) => {
    return ENUMS[enumName]?.[value]?.label || value;
  },
  
  getEnumColor: (enumName, value) => {
    return ENUMS[enumName]?.[value]?.color || "#6b7280";
  },
  
  isValidStatus: (currentStatus, newStatus) => {
    return SCHEMAS.orders.statusFlow[currentStatus]?.includes(newStatus) || false;
  },
  
  getRequiredFields: (tableName, context = "default") => {
    const schema = SCHEMAS[tableName];
    if (!schema) return [];
    
    if (context === "mobile" && schema.mobileRegistration) {
      return schema.mobileRegistration.required;
    }
    
    return Object.entries(schema.fields)
      .filter(([_, field]) => field.required)
      .map(([name, _]) => name);
  }
};

/**
 * PRZYKŁADY UŻYCIA:
 * 
 * // W aplikacji webowej Next.js:
 * import { SCHEMAS, ENUMS } from './shared-schema';
 * const statusLabel = ENUMS.ORDER_STATUS.IN_PROGRESS.label;
 * 
 * // W aplikacji mobilnej React Native:
 * import { SYSTEM_CONFIG, API_RESPONSES } from './shared-schema';
 * const apiUrl = SYSTEM_CONFIG.api.baseUrl + SYSTEM_CONFIG.api.endpoints.orders;
 * 
 * // W backendzie:
 * const { isValidStatus } = require('./shared-schema');
 * if (isValidStatus('pending', 'in_progress')) { ... }
 */