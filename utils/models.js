// Modele danych - struktury tabel dla łatwej migracji do bazy danych

const models = {
  // Tabela zamówień/zleceń
  orders: {
    tableName: 'orders',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      clientId: { type: 'INTEGER', foreignKey: 'clients.id' },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true },
      serviceType: { type: 'VARCHAR', length: 100 }, // 'naprawa', 'serwis', 'instalacja'
      deviceType: { type: 'VARCHAR', length: 100 }, // 'laptop', 'komputer', 'drukarka'
      brand: { type: 'VARCHAR', length: 50 },
      model: { type: 'VARCHAR', length: 100 },
      description: { type: 'TEXT' },
      problemDescription: { type: 'TEXT' },
      status: { type: 'ENUM', values: ['pending', 'in_progress', 'completed', 'cancelled'] },
      priority: { type: 'ENUM', values: ['low', 'medium', 'high', 'urgent'] },
      estimatedCost: { type: 'DECIMAL', precision: 10, scale: 2 },
      finalCost: { type: 'DECIMAL', precision: 10, scale: 2, nullable: true },
      estimatedCompletionDate: { type: 'DATE', nullable: true },
      actualCompletionDate: { type: 'DATE', nullable: true },
      warranty: { type: 'INTEGER', nullable: true }, // miesięce gwarancji
      notes: { type: 'TEXT', nullable: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['clientId'] },
      { fields: ['employeeId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  },

  // Tabela klientów
  clients: {
    tableName: 'clients',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      firstName: { type: 'VARCHAR', length: 50 },
      lastName: { type: 'VARCHAR', length: 50 },
      email: { type: 'VARCHAR', length: 100, unique: true, nullable: true },
      phone: { type: 'VARCHAR', length: 20 },
      alternativePhone: { type: 'VARCHAR', length: 20, nullable: true },
      address: { type: 'TEXT', nullable: true },
      city: { type: 'VARCHAR', length: 50, nullable: true },
      postalCode: { type: 'VARCHAR', length: 10, nullable: true },
      company: { type: 'VARCHAR', length: 100, nullable: true },
      nip: { type: 'VARCHAR', length: 15, nullable: true },
      notes: { type: 'TEXT', nullable: true },
      preferredContact: { type: 'ENUM', values: ['phone', 'email', 'sms'] },
      isActive: { type: 'BOOLEAN', default: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['lastName', 'firstName'] }
    ]
  },

  // Tabela pracowników
  employees: {
    tableName: 'employees',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      firstName: { type: 'VARCHAR', length: 50 },
      lastName: { type: 'VARCHAR', length: 50 },
      email: { type: 'VARCHAR', length: 100, unique: true },
      phone: { type: 'VARCHAR', length: 20 },
      position: { type: 'VARCHAR', length: 100 },
      specialization: { type: 'VARCHAR', length: 100, nullable: true },
      hourlyRate: { type: 'DECIMAL', precision: 8, scale: 2, nullable: true },
      isActive: { type: 'BOOLEAN', default: true },
      canManageOrders: { type: 'BOOLEAN', default: false },
      isAdmin: { type: 'BOOLEAN', default: false },
      passwordHash: { type: 'VARCHAR', length: 255 },
      lastLogin: { type: 'TIMESTAMP', nullable: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['isActive'] }
    ]
  },

  // Tabela specjalizacji
  specializations: {
    tableName: 'specializations',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      name: { type: 'VARCHAR', length: 100, unique: true },
      description: { type: 'TEXT', nullable: true },
      isActive: { type: 'BOOLEAN', default: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    }
  },

  // Tabela rezerwacji/terminów
  appointments: {
    tableName: 'appointments',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      orderId: { type: 'INTEGER', foreignKey: 'orders.id', nullable: true },
      clientId: { type: 'INTEGER', foreignKey: 'clients.id' },
      employeeId: { type: 'INTEGER', foreignKey: 'employees.id' },
      appointmentDate: { type: 'DATETIME' },
      duration: { type: 'INTEGER' }, // minuty
      type: { type: 'ENUM', values: ['consultation', 'pickup', 'delivery', 'repair'] },
      status: { type: 'ENUM', values: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] },
      address: { type: 'TEXT', nullable: true },
      notes: { type: 'TEXT', nullable: true },
      createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['appointmentDate'] },
      { fields: ['employeeId', 'appointmentDate'] },
      { fields: ['status'] }
    ]
  },

  // Tabela ustawień systemu
  settings: {
    tableName: 'settings',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      key: { type: 'VARCHAR', length: 100, unique: true },
      value: { type: 'TEXT' },
      type: { type: 'ENUM', values: ['string', 'number', 'boolean', 'json'] },
      description: { type: 'TEXT', nullable: true },
      updatedAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    }
  },

  // Tabela logów/historii zmian
  audit_log: {
    tableName: 'audit_log',
    fields: {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      tableName: { type: 'VARCHAR', length: 50 },
      recordId: { type: 'INTEGER' },
      action: { type: 'ENUM', values: ['INSERT', 'UPDATE', 'DELETE'] },
      oldValues: { type: 'JSON', nullable: true },
      newValues: { type: 'JSON', nullable: true },
      userId: { type: 'INTEGER', foreignKey: 'employees.id', nullable: true },
      ipAddress: { type: 'VARCHAR', length: 45, nullable: true },
      userAgent: { type: 'TEXT', nullable: true },
      timestamp: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: [
      { fields: ['tableName', 'recordId'] },
      { fields: ['timestamp'] },
      { fields: ['userId'] }
    ]
  }
};

// Funkcja do generowania SQL CREATE TABLE (dla przyszłej migracji)
function generateCreateTableSQL(modelName, model) {
  const { tableName, fields, indexes = [] } = model;
  
  let sql = `CREATE TABLE \`${tableName}\` (\n`;
  
  // Pola
  const fieldDefinitions = Object.entries(fields).map(([fieldName, field]) => {
    let definition = `  \`${fieldName}\` ${field.type}`;
    
    if (field.length) definition += `(${field.length})`;
    if (field.precision && field.scale) definition += `(${field.precision},${field.scale})`;
    if (field.values) definition += `(${field.values.map(v => `'${v}'`).join(', ')})`;
    
    if (field.primaryKey) definition += ' PRIMARY KEY';
    if (field.autoIncrement) definition += ' AUTO_INCREMENT';
    if (field.unique) definition += ' UNIQUE';
    if (!field.nullable && !field.primaryKey) definition += ' NOT NULL';
    if (field.default) definition += ` DEFAULT ${field.default}`;
    
    return definition;
  });
  
  sql += fieldDefinitions.join(',\n');
  sql += '\n);';
  
  // Indeksy
  indexes.forEach(index => {
    const indexName = `idx_${tableName}_${index.fields.join('_')}`;
    sql += `\n\nCREATE INDEX \`${indexName}\` ON \`${tableName}\` (${index.fields.map(f => `\`${f}\``).join(', ')});`;
  });
  
  return sql;
}

// Funkcja do mapowania obecnych danych JSON na nowe struktury
function mapLegacyData(tableName, legacyData) {
  const mappers = {
    orders: (data) => data.map(item => ({
      id: item.id,
      clientId: item.clientId || null,
      employeeId: item.employeeId || null,
      serviceType: item.serviceType || 'naprawa',
      deviceType: item.deviceType || 'komputer',
      brand: item.brand || '',
      model: item.model || '',
      description: item.description || '',
      problemDescription: item.problemDescription || item.description || '',
      status: item.status || 'pending',
      priority: item.priority || 'medium',
      estimatedCost: parseFloat(item.estimatedCost) || 0,
      finalCost: item.finalCost ? parseFloat(item.finalCost) : null,
      estimatedCompletionDate: item.estimatedCompletionDate || null,
      actualCompletionDate: item.actualCompletionDate || null,
      warranty: item.warranty || null,
      notes: item.notes || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    })),
    
    clients: (data) => data.map(item => ({
      id: item.id,
      firstName: item.firstName || item.name?.split(' ')[0] || '',
      lastName: item.lastName || item.name?.split(' ').slice(1).join(' ') || '',
      email: item.email || null,
      phone: item.phone || '',
      alternativePhone: item.alternativePhone || null,
      address: item.address || null,
      city: item.city || null,
      postalCode: item.postalCode || null,
      company: item.company || null,
      nip: item.nip || null,
      notes: item.notes || null,
      preferredContact: item.preferredContact || 'phone',
      isActive: item.isActive !== false,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    }))
  };
  
  return mappers[tableName] ? mappers[tableName](legacyData) : legacyData;
}

module.exports = {
  models,
  generateCreateTableSQL,
  mapLegacyData
};