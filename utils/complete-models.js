// Kompletne modele danych dla systemu serwisu technicznego
// utils/complete-models.js

const completeModels = {
  // ========== PODSTAWOWE TABALE ==========
  
  clients: {
    tableName: 'clients',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      firstName: { type: 'VARCHAR', length: 50 },
      lastName: { type: 'VARCHAR', length: 50 },
      email: { type: 'VARCHAR', length: 100, unique: true, nullable: true },
      phone: { type: 'VARCHAR', length: 20 },
      alternativePhone: { type: 'VARCHAR', length: 20, nullable: true },
      
      // ADRES
      address: { type: 'TEXT', nullable: true },
      city: { type: 'VARCHAR', length: 50, nullable: true },
      postalCode: { type: 'VARCHAR', length: 10, nullable: true },
      country: { type: 'VARCHAR', length: 50, default: "'Polska'" },
      
      // FIRMA (dla klientów biznesowych)
      company: { type: 'VARCHAR', length: 100, nullable: true },
      nip: { type: 'VARCHAR', length: 15, nullable: true },
      regon: { type: 'VARCHAR', length: 14, nullable: true },
      
      // PREFERENCJE
      customerType: { type: 'ENUM', values: ['individual', 'business'], default: "'individual'" },
      preferredContact: { type: 'ENUM', values: ['phone', 'email', 'sms'], default: "'phone'" },
      
      // DODATKOWE
      notes: { type: 'TEXT', nullable: true },
      isActive: { type: 'BOOLEAN', default: true },
      loyaltyPoints: { type: 'INTEGER', default: 0 },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['lastName', 'firstName'] },
      { fields: ['nip'] }
    ]
  },

  orders: {
    tableName: 'orders',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      orderNumber: { type: 'VARCHAR', length: 20, unique: true }, // SRV-2024-001
      
      // POWIĄZANIA
      clientId: { type: 'INTEGER', foreignKey: 'clients.id' },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true },
      
      // SPRZĘT
      deviceType: { type: 'VARCHAR', length: 50 }, // laptop, komputer, drukarka
      brand: { type: 'VARCHAR', length: 50, nullable: true },
      model: { type: 'VARCHAR', length: 100, nullable: true },
      serialNumber: { type: 'VARCHAR', length: 100, nullable: true },
      
      // OPIS PROBLEMU
      serviceType: { type: 'ENUM', values: ['naprawa', 'konserwacja', 'instalacja', 'diagnostyka', 'modernizacja'] },
      category: { type: 'ENUM', values: ['Hardware', 'Software', 'Network', 'Security', 'Other'] },
      problemDescription: { type: 'TEXT' },
      diagnosis: { type: 'TEXT', nullable: true },
      solutionDescription: { type: 'TEXT', nullable: true },
      
      // STATUS
      status: { 
        type: 'ENUM', 
        values: ['pending', 'in_progress', 'waiting_parts', 'waiting_client', 'testing', 'completed', 'cancelled', 'returned'] 
      },
      priority: { type: 'ENUM', values: ['low', 'medium', 'high', 'urgent'] },
      
      // FINANSOWE
      estimatedCost: { type: 'DECIMAL', precision: 10, scale: 2, default: 0 },
      partsCost: { type: 'DECIMAL', precision: 10, scale: 2, default: 0 },
      laborCost: { type: 'DECIMAL', precision: 10, scale: 2, default: 0 },
      finalCost: { type: 'DECIMAL', precision: 10, scale: 2, nullable: true },
      
      // TERMINY
      estimatedCompletionDate: { type: 'DATETIME', nullable: true },
      actualCompletionDate: { type: 'DATETIME', nullable: true },
      
      // GWARANCJA
      warranty: { type: 'INTEGER', nullable: true }, // miesięcy
      warrantyExpiresAt: { type: 'DATE', nullable: true },
      
      // DODATKOWE
      isUrgent: { type: 'BOOLEAN', default: false },
      customerNotified: { type: 'BOOLEAN', default: false },
      requiresPickup: { type: 'BOOLEAN', default: false },
      requiresDelivery: { type: 'BOOLEAN', default: false },
      
      notes: { type: 'TEXT', nullable: true },
      internalNotes: { type: 'TEXT', nullable: true }, // tylko dla pracowników
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['orderNumber'] },
      { fields: ['clientId'] },
      { fields: ['employeeId'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['createdAt'] },
      { fields: ['estimatedCompletionDate'] }
    ]
  },

  employees: {
    tableName: 'employees',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      employeeId: { type: 'VARCHAR', length: 20, unique: true }, // EMP001
      
      // DANE OSOBOWE
      firstName: { type: 'VARCHAR', length: 50 },
      lastName: { type: 'VARCHAR', length: 50 },
      email: { type: 'VARCHAR', length: 100, unique: true },
      phone: { type: 'VARCHAR', length: 20 },
      
      // PRACA
      position: { type: 'VARCHAR', length: 100 },
      department: { type: 'VARCHAR', length: 50 },
      role: { type: 'ENUM', values: ['admin', 'manager', 'technician', 'receptionist'] },
      hourlyRate: { type: 'DECIMAL', precision: 8, scale: 2, nullable: true },
      
      // UPRAWNIENIA
      isActive: { type: 'BOOLEAN', default: true },
      canAccessAdmin: { type: 'BOOLEAN', default: false },
      canManageOrders: { type: 'BOOLEAN', default: false },
      canManageClients: { type: 'BOOLEAN', default: false },
      canManageInventory: { type: 'BOOLEAN', default: false },
      canViewReports: { type: 'BOOLEAN', default: false },
      
      // LOGOWANIE
      passwordHash: { type: 'VARCHAR', length: 255 },
      lastLogin: { type: 'TIMESTAMP', nullable: true },
      
      // HARMONOGRAM PRACY
      workingHours: { type: 'JSON', nullable: true }, // { monday: { start: '08:00', end: '16:00' } }
      
      notes: { type: 'TEXT', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['employeeId'] },
      { fields: ['email'] },
      { fields: ['isActive'] },
      { fields: ['role'] }
    ]
  },

  // ========== SPECJALIZACJE I CERTYFIKATY ==========
  
  specializations: {
    tableName: 'specializations',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      name: { type: 'VARCHAR', length: 100, unique: true },
      description: { type: 'TEXT', nullable: true },
      category: { type: 'VARCHAR', length: 50 }, // Hardware, Software, Network
      isActive: { type: 'BOOLEAN', default: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    }
  },

  employee_specializations: {
    tableName: 'employee_specializations',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id' },
      specializationId: { type: 'INTEGER', foreignKey: 'specializations.id' },
      level: { type: 'ENUM', values: ['beginner', 'intermediate', 'advanced', 'expert'] },
      certifiedAt: { type: 'DATE', nullable: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['employeeId', 'specializationId'], unique: true }
    ]
  },

  // ========== TERMINY I WIZYTY ==========
  
  appointments: {
    tableName: 'appointments',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      orderId: { type: 'INTEGER', foreignKey: 'orders.id', nullable: true },
      clientId: { type: 'INTEGER', foreignKey: 'clients.id' },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id' },
      
      appointmentDate: { type: 'DATETIME' },
      duration: { type: 'INTEGER' }, // minuty
      
      type: { type: 'ENUM', values: ['consultation', 'pickup', 'delivery', 'on_site_repair', 'follow_up'] },
      status: { type: 'ENUM', values: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] },
      
      // LOKALIZACJA
      location: { type: 'ENUM', values: ['office', 'client_address', 'remote'] },
      address: { type: 'TEXT', nullable: true },
      
      // POWIADOMIENIA
      reminderSent: { type: 'BOOLEAN', default: false },
      clientNotified: { type: 'BOOLEAN', default: false },
      
      notes: { type: 'TEXT', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['appointmentDate'] },
      { fields: ['employeeId', 'appointmentDate'] },
      { fields: ['status'] },
      { fields: ['orderId'] }
    ]
  },

  // ========== MAGAZYN I CZĘŚCI ==========
  
  inventory: {
    tableName: 'inventory',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      partNumber: { type: 'VARCHAR', length: 50, unique: true },
      name: { type: 'VARCHAR', length: 200 },
      description: { type: 'TEXT', nullable: true },
      
      category: { type: 'VARCHAR', length: 50 }, // RAM, HDD, SSD, GPU, etc.
      brand: { type: 'VARCHAR', length: 50, nullable: true },
      model: { type: 'VARCHAR', length: 100, nullable: true },
      
      // STANY MAGAZYNOWE
      quantity: { type: 'INTEGER', default: 0 },
      minQuantity: { type: 'INTEGER', default: 0 },
      maxQuantity: { type: 'INTEGER', default: 1000 },
      
      // CENY
      purchasePrice: { type: 'DECIMAL', precision: 10, scale: 2 },
      sellPrice: { type: 'DECIMAL', precision: 10, scale: 2 },
      currency: { type: 'VARCHAR', length: 3, default: "'PLN'" },
      
      // LOKALIZACJA
      location: { type: 'VARCHAR', length: 100, nullable: true },
      supplierId: { type: 'INTEGER', foreignKey: 'suppliers.id', nullable: true },
      
      isActive: { type: 'BOOLEAN', default: true },
      lastRestocked: { type: 'DATETIME', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['partNumber'] },
      { fields: ['name'] },
      { fields: ['category'] },
      { fields: ['quantity'] }
    ]
  },

  order_parts: {
    tableName: 'order_parts',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      orderId: { type: 'INTEGER', foreignKey: 'orders.id' },
      inventoryId: { type: 'INTEGER', foreignKey: 'inventory.id' },
      
      quantity: { type: 'INTEGER' },
      unitPrice: { type: 'DECIMAL', precision: 10, scale: 2 },
      totalPrice: { type: 'DECIMAL', precision: 10, scale: 2 },
      
      status: { type: 'ENUM', values: ['ordered', 'available', 'used', 'returned'] },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['orderId'] },
      { fields: ['inventoryId'] }
    ]
  },

  suppliers: {
    tableName: 'suppliers',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      name: { type: 'VARCHAR', length: 100 },
      email: { type: 'VARCHAR', length: 100, nullable: true },
      phone: { type: 'VARCHAR', length: 20, nullable: true },
      address: { type: 'TEXT', nullable: true },
      nip: { type: 'VARCHAR', length: 15, nullable: true },
      
      paymentTerms: { type: 'INTEGER', default: 30 }, // dni
      isActive: { type: 'BOOLEAN', default: true },
      
      notes: { type: 'TEXT', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    }
  },

  // ========== FAKTURY I PŁATNOŚCI ==========
  
  invoices: {
    tableName: 'invoices',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      invoiceNumber: { type: 'VARCHAR', length: 20, unique: true }, // FV-2024-001
      orderId: { type: 'INTEGER', foreignKey: 'orders.id' },
      clientId: { type: 'INTEGER', foreignKey: 'clients.id' },
      
      // KWOTY
      subtotal: { type: 'DECIMAL', precision: 10, scale: 2 },
      taxRate: { type: 'DECIMAL', precision: 5, scale: 2 }, // 23.00 dla VAT 23%
      taxAmount: { type: 'DECIMAL', precision: 10, scale: 2 },
      total: { type: 'DECIMAL', precision: 10, scale: 2 },
      
      // STATUS
      status: { type: 'ENUM', values: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
      
      // TERMINY
      issueDate: { type: 'DATE' },
      dueDate: { type: 'DATE' },
      paidDate: { type: 'DATE', nullable: true },
      
      // PŁATNOŚĆ
      paymentMethod: { type: 'ENUM', values: ['cash', 'card', 'transfer', 'other'] },
      
      notes: { type: 'TEXT', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['invoiceNumber'] },
      { fields: ['orderId'] },
      { fields: ['clientId'] },
      { fields: ['status'] },
      { fields: ['dueDate'] }
    ]
  },

  // ========== LOGI I HISTORIA ==========
  
  activity_log: {
    tableName: 'activity_log',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      
      // POWIĄZANIA
      orderId: { type: 'INTEGER', foreignKey: 'orders.id', nullable: true },
      clientId: { type: 'INTEGER', foreignKey: 'clients.id', nullable: true },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true },
      
      // AKCJA
      action: { type: 'VARCHAR', length: 50 }, // created, status_changed, note_added, etc.
      description: { type: 'TEXT' },
      
      // SZCZEGÓŁY ZMIANY
      tableName: { type: 'VARCHAR', length: 50, nullable: true },
      recordId: { type: 'INTEGER', nullable: true },
      oldValue: { type: 'TEXT', nullable: true },
      newValue: { type: 'TEXT', nullable: true },
      
      // KONTEKST
      ipAddress: { type: 'VARCHAR', length: 45, nullable: true },
      userAgent: { type: 'TEXT', nullable: true },
      
      timestamp: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['orderId'] },
      { fields: ['employeeId'] },
      { fields: ['timestamp'] },
      { fields: ['action'] }
    ]
  },

  // ========== USTAWIENIA SYSTEMU ==========
  
  settings: {
    tableName: 'settings',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      key: { type: 'VARCHAR', length: 100, unique: true },
      value: { type: 'TEXT' },
      type: { type: 'ENUM', values: ['string', 'number', 'boolean', 'json'] },
      category: { type: 'VARCHAR', length: 50 }, // company, service, system, email
      description: { type: 'TEXT', nullable: true },
      isSystem: { type: 'BOOLEAN', default: false }, // czy można edytować przez UI
      
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      updatedBy: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true }
    },
    indexes: [
      { fields: ['category'] }
    ]
  },

  // ========== POWIADOMIENIA ==========
  
  notifications: {
    tableName: 'notifications',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      
      // ODBIORCA
      clientId: { type: 'INTEGER', foreignKey: 'clients.id', nullable: true },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true },
      
      // TREŚĆ
      type: { type: 'ENUM', values: ['email', 'sms', 'push', 'system'] },
      title: { type: 'VARCHAR', length: 200 },
      message: { type: 'TEXT' },
      
      // STATUS
      status: { type: 'ENUM', values: ['pending', 'sent', 'delivered', 'failed'] },
      
      // POWIĄZANIA
      orderId: { type: 'INTEGER', foreignKey: 'orders.id', nullable: true },
      appointmentId: { type: 'INTEGER', foreignKey: 'appointments.id', nullable: true },
      
      // TERMINY
      scheduledAt: { type: 'DATETIME', nullable: true },
      sentAt: { type: 'DATETIME', nullable: true },
      
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['clientId'] },
      { fields: ['employeeId'] }
    ]
  }
};

// Domyślne ustawienia systemu
const defaultSettings = [
  { key: 'company_name', value: 'Serwis Technik', type: 'string', category: 'company' },
  { key: 'company_address', value: '', type: 'string', category: 'company' },
  { key: 'company_phone', value: '', type: 'string', category: 'company' },
  { key: 'company_email', value: '', type: 'string', category: 'company' },
  { key: 'company_nip', value: '', type: 'string', category: 'company' },
  
  { key: 'default_warranty_months', value: '12', type: 'number', category: 'service' },
  { key: 'default_priority', value: 'medium', type: 'string', category: 'service' },
  { key: 'auto_assign_technician', value: 'false', type: 'boolean', category: 'service' },
  
  { key: 'email_smtp_host', value: '', type: 'string', category: 'email' },
  { key: 'email_smtp_port', value: '587', type: 'number', category: 'email' },
  { key: 'email_username', value: '', type: 'string', category: 'email' },
  { key: 'email_password', value: '', type: 'string', category: 'email' },
  
  { key: 'low_inventory_threshold', value: '5', type: 'number', category: 'inventory' },
  { key: 'auto_order_parts', value: 'false', type: 'boolean', category: 'inventory' }
];

module.exports = {
  completeModels,
  defaultSettings
};