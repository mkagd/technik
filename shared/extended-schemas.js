/**
 * ROZSZERZENIE CENTRALNEJ STRUKTURY DANYCH
 * Dodatkowe tabele dla kompletnego systemu serwisu
 */

const { SCHEMAS } = require('./schema');

// Dodatkowe tabele
const EXTENDED_SCHEMAS = {
  
  // ========== TERMINY I WIZYTY ==========
  appointments: {
    tableName: "appointments",
    displayName: "Terminy",
    icon: "calendar",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      appointmentId: { type: "STRING", length: 20, unique: true, label: "ID wizyty" }, // APP-001, APP-002
      orderId: { type: "ID", foreignKey: "orders.id", label: "Zlecenie" },
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      employeeId: { type: "ID", foreignKey: "employees.id", required: true, label: "Pracownik" },
      
      appointmentDate: { type: "DATETIME", required: true, label: "Data i godzina" },
      duration: { type: "INTEGER", default: 60, label: "Czas trwania (min)" },
      
      type: { 
        type: "ENUM", 
        values: ["consultation", "pickup", "delivery", "on_site_repair", "follow_up"],
        required: true,
        label: "Typ wizyty"
      },
      status: { 
        type: "ENUM", 
        values: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
        default: "scheduled",
        label: "Status"
      },
      
      // Lokalizacja - ważne dla aplikacji mobilnej (GPS, mapy)
      location: { 
        type: "ENUM", 
        values: ["office", "client_address", "remote"],
        default: "office",
        label: "Lokalizacja" 
      },
      address: { type: "TEXT", label: "Adres wizyty" },
      coordinates: { type: "JSON", label: "Współrzędne GPS" }, // { lat, lng }
      
      // Powiadomienia mobilne
      reminderSent: { type: "BOOLEAN", default: false, label: "Przypomnienie wysłane" },
      clientNotified: { type: "BOOLEAN", default: false, label: "Klient powiadomiony" },
      
      notes: { type: "TEXT", label: "Notatki" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["appointmentDate", ["employeeId", "appointmentDate"], "status", "orderId"],
    
    // Dla aplikacji mobilnej - powiadomienia
    mobileNotifications: {
      reminder_24h: "Przypomnienie o wizycie za 24h",
      reminder_1h: "Wizyta za godzinę", 
      status_changed: "Zmiana statusu wizyty",
      location_sharing: "Udostępnij lokalizację technikowi"
    }
  },

  // ========== MAGAZYN ==========
  inventory: {
    tableName: "inventory",
    displayName: "Magazyn",
    icon: "package",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      itemId: { type: "STRING", length: 20, unique: true, label: "ID części" }, // ITM-001, ITM-002
      partNumber: { type: "STRING", length: 50, unique: true, required: true, label: "Numer części" },
      name: { type: "STRING", length: 200, required: true, label: "Nazwa" },
      description: { type: "TEXT", label: "Opis" },
      
      category: { type: "STRING", length: 50, required: true, label: "Kategoria" },
      brand: { type: "STRING", length: 50, label: "Marka" },
      model: { type: "STRING", length: 100, label: "Model" },
      
      // Stany magazynowe - ważne dla aplikacji mobilnej techników
      quantity: { type: "INTEGER", default: 0, label: "Ilość" },
      minQuantity: { type: "INTEGER", default: 0, label: "Min. ilość" },
      maxQuantity: { type: "INTEGER", default: 1000, label: "Max. ilość" },
      reservedQuantity: { type: "INTEGER", default: 0, label: "Zarezerwowano" }, // dla zleceń
      
      // Ceny
      purchasePrice: { type: "DECIMAL", precision: 10, scale: 2, label: "Cena zakupu" },
      sellPrice: { type: "DECIMAL", precision: 10, scale: 2, label: "Cena sprzedaży" },
      currency: { type: "STRING", length: 3, default: "PLN", label: "Waluta" },
      
      // Lokalizacja w magazynie
      location: { type: "STRING", length: 100, label: "Lokalizacja" },
      supplierId: { type: "ID", foreignKey: "suppliers.id", label: "Dostawca" },
      
      // QR/kod kreskowy - dla aplikacji mobilnej
      barcode: { type: "STRING", length: 100, label: "Kod kreskowy" },
      qrCode: { type: "STRING", length: 255, label: "Kod QR" },
      
      isActive: { type: "BOOLEAN", default: true, label: "Aktywny" },
      lastRestocked: { type: "DATETIME", label: "Ostatnie uzupełnienie" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["partNumber", "name", "category", "quantity", "barcode"],
    
    // Dla aplikacji mobilnej - alerty magazynowe
    mobileFeatures: {
      lowStockAlert: "Alert o niskim stanie",
      barcodeScanning: "Skanowanie kodów kreskowych",
      stockMovement: "Rejestracja ruchu magazynowego",
      quickInventory: "Szybka inwentaryzacja"
    }
  },

  // ========== FAKTURY ==========
  invoices: {
    tableName: "invoices",
    displayName: "Faktury",
    icon: "file-text",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      invoiceId: { type: "STRING", length: 20, unique: true, label: "ID faktury" }, // INV-001, INV-002
      invoiceNumber: { type: "STRING", length: 20, unique: true, required: true, label: "Numer faktury" },
      orderId: { type: "ID", foreignKey: "orders.id", required: true, label: "Zlecenie" },
      clientId: { type: "ID", foreignKey: "clients.id", required: true, label: "Klient" },
      
      // Kwoty
      subtotal: { type: "DECIMAL", precision: 10, scale: 2, required: true, label: "Netto" },
      taxRate: { type: "DECIMAL", precision: 5, scale: 2, default: 23.00, label: "Stawka VAT %" },
      taxAmount: { type: "DECIMAL", precision: 10, scale: 2, label: "Kwota VAT" },
      total: { type: "DECIMAL", precision: 10, scale: 2, required: true, label: "Brutto" },
      
      // Status
      status: { 
        type: "ENUM", 
        values: ["draft", "sent", "paid", "overdue", "cancelled"],
        default: "draft",
        label: "Status" 
      },
      
      // Terminy
      issueDate: { type: "DATE", required: true, label: "Data wystawienia" },
      dueDate: { type: "DATE", required: true, label: "Termin płatności" },
      paidDate: { type: "DATE", label: "Data płatności" },
      
      // Płatność
      paymentMethod: { 
        type: "ENUM", 
        values: ["cash", "card", "transfer", "blik", "other"],
        label: "Metoda płatności" 
      },
      
      // Plik PDF - dla aplikacji mobilnej
      pdfPath: { type: "STRING", length: 255, label: "Ścieżka do PDF" },
      
      notes: { type: "TEXT", label: "Notatki" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" },
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" }
    },
    
    indexes: ["invoiceNumber", "orderId", "clientId", "status", "dueDate"],
    
    // Dla aplikacji mobilnej
    mobileFeatures: {
      generatePDF: "Generowanie PDF",
      sendEmail: "Wysyłanie mailem",
      paymentReminder: "Przypomnienie o płatności",
      quickPayment: "Szybka płatność BLIK/karta"
    }
  },

  // ========== POWIADOMIENIA ==========
  notifications: {
    tableName: "notifications", 
    displayName: "Powiadomienia",
    icon: "bell",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      notificationId: { type: "STRING", length: 20, unique: true, label: "ID powiadomienia" }, // NOT-001, NOT-002
      
      // Odbiorca
      clientId: { type: "ID", foreignKey: "clients.id", label: "Klient" },
      employeeId: { type: "ID", foreignKey: "employees.id", label: "Pracownik" },
      
      // Treść
      type: { 
        type: "ENUM", 
        values: ["email", "sms", "push", "system"],
        required: true,
        label: "Typ"
      },
      title: { type: "STRING", length: 200, required: true, label: "Tytuł" },
      message: { type: "TEXT", required: true, label: "Treść" },
      
      // Status
      status: { 
        type: "ENUM", 
        values: ["pending", "sent", "delivered", "failed", "read"],
        default: "pending",
        label: "Status" 
      },
      
      // Powiązania
      orderId: { type: "ID", foreignKey: "orders.id", label: "Zlecenie" },
      appointmentId: { type: "ID", foreignKey: "appointments.id", label: "Termin" },
      
      // Dane techniczne - dla push notifications
      deviceToken: { type: "STRING", length: 255, label: "Token urządzenia" },
      platform: { type: "ENUM", values: ["android", "ios", "web"], label: "Platforma" },
      
      // Terminy
      scheduledAt: { type: "DATETIME", label: "Zaplanowano na" },
      sentAt: { type: "DATETIME", label: "Wysłano" },
      deliveredAt: { type: "DATETIME", label: "Dostarczono" },
      readAt: { type: "DATETIME", label: "Przeczytano" },
      
      // Błędy
      errorMessage: { type: "TEXT", label: "Błąd" },
      retryCount: { type: "INTEGER", default: 0, label: "Liczba prób" },
      
      createdAt: { type: "DATETIME", default: "now", label: "Utworzono" }
    },
    
    indexes: ["status", "scheduledAt", "clientId", "employeeId", "type"],
    
    // Szablony powiadomień
    templates: {
      order_created: {
        title: "Nowe zlecenie #{orderNumber}",
        message: "Zlecenie zostało przyjęte do realizacji"
      },
      status_changed: {
        title: "Zmiana statusu zlecenia #{orderNumber}",
        message: "Status zmieniony na: {status}"
      },
      ready_for_pickup: {
        title: "Urządzenie gotowe do odbioru",
        message: "Zlecenie #{orderNumber} - urządzenie gotowe"
      },
      appointment_reminder: {
        title: "Przypomnienie o wizycie",
        message: "Wizyta zaplanowana na {date} o {time}"
      }
    }
  },

  // ========== LOGI AKTYWNOŚCI ==========
  activity_log: {
    tableName: "activity_log",
    displayName: "Logi aktywności", 
    icon: "activity",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      
      // Powiązania
      orderId: { type: "ID", foreignKey: "orders.id", label: "Zlecenie" },
      clientId: { type: "ID", foreignKey: "clients.id", label: "Klient" },
      employeeId: { type: "ID", foreignKey: "employees.id", label: "Pracownik" },
      
      // Akcja
      action: { type: "STRING", length: 50, required: true, label: "Akcja" },
      description: { type: "TEXT", required: true, label: "Opis" },
      
      // Szczegóły zmiany
      tableName: { type: "STRING", length: 50, label: "Tabela" },
      recordId: { type: "INTEGER", label: "ID rekordu" },
      oldValue: { type: "JSON", label: "Stara wartość" },
      newValue: { type: "JSON", label: "Nowa wartość" },
      
      // Kontekst - ważne dla aplikacji mobilnej
      platform: { type: "ENUM", values: ["web", "mobile", "api"], label: "Platforma" },
      ipAddress: { type: "STRING", length: 45, label: "Adres IP" },
      userAgent: { type: "TEXT", label: "User Agent" },
      location: { type: "JSON", label: "Lokalizacja GPS" }, // { lat, lng }
      
      timestamp: { type: "DATETIME", default: "now", label: "Czas" }
    },
    
    indexes: ["orderId", "employeeId", "timestamp", "action", "platform"]
  },

  // ========== USTAWIENIA ==========
  settings: {
    tableName: "settings",
    displayName: "Ustawienia",
    icon: "settings",
    
    fields: {
      id: { type: "ID", primaryKey: true, autoIncrement: true },
      key: { type: "STRING", length: 100, unique: true, required: true, label: "Klucz" },
      value: { type: "TEXT", required: true, label: "Wartość" },
      type: { 
        type: "ENUM", 
        values: ["string", "number", "boolean", "json"],
        required: true,
        label: "Typ" 
      },
      category: { type: "STRING", length: 50, required: true, label: "Kategoria" },
      description: { type: "TEXT", label: "Opis" },
      isSystem: { type: "BOOLEAN", default: false, label: "Systemowe" },
      
      updatedAt: { type: "DATETIME", default: "now", onUpdate: "now", label: "Zaktualizowano" },
      updatedBy: { type: "ID", foreignKey: "employees.id", label: "Zaktualizowane przez" }
    },
    
    indexes: ["category", "key"]
  }
};

// Połącz wszystkie schematy
const ALL_SCHEMAS = {
  ...SCHEMAS,
  ...EXTENDED_SCHEMAS
};

module.exports = {
  EXTENDED_SCHEMAS,
  ALL_SCHEMAS
};