/**
 * GENERATOR UNIKALNYCH ID
 * 
 * System generowania unikalnych identyfikatorów dla wszystkich tabel
 * w formacie: PREFIX-XXX (np. CLI-001, ORD-123, SRV-007)
 * 
 * Kompatybilny z aplikacją webową i mobilną
 */

// ========== PREFIKSY ID ==========
const ID_PREFIXES = {
  // Podstawowe tabele
  clients: "CLI",        // CLI-001, CLI-002
  orders: "ORD",         // ORD-001, ORD-002  
  employees: "EMP",      // EMP-001, EMP-002
  
  // Tabele rozszerzone
  appointments: "APP",   // APP-001, APP-002
  inventory: "ITM",      // ITM-001, ITM-002
  invoices: "INV",       // INV-001, INV-002
  notifications: "NOT",  // NOT-001, NOT-002
  
  // System serwisantów
  servicemen: "SRV",              // SRV-001, SRV-002
  serviceman_visits: "VIS",       // VIS-001, VIS-002
  visit_orders: "VOR",            // VOR-001, VOR-002 (Visit ORder)
  serviceman_schedule: "SCH",     // SCH-001, SCH-002
  serviceman_reports: "RPT"       // RPT-001, RPT-002
};

// ========== FORMATY SPECJALNE ==========
const SPECIAL_FORMATS = {
  // Numery zleceń z datą
  orderNumber: (year = new Date().getFullYear()) => {
    return `SRV-${year}-{counter}`;
  },
  
  // Numery wizyt z datą
  visitNumber: (year = new Date().getFullYear()) => {
    return `VIS-${year}-{counter}`;
  },
  
  // Numery faktur z miesiącem/rokiem
  invoiceNumber: (year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    const monthStr = month.toString().padStart(2, '0');
    return `FV-${year}${monthStr}-{counter}`;
  },
  
  // Identyfikatory pracowników z działem
  employeeId: (department = "GEN") => {
    return `${department}-{counter}`;
  }
};

// ========== GENERATOR FUNCTIONS ==========

/**
 * Generuje następny ID dla tabeli
 * @param {string} tableName - nazwa tabeli
 * @param {number} currentMax - obecny najwyższy numer (opcjonalnie)
 * @returns {string} - nowy ID
 */
function generateNextId(tableName, currentMax = 0) {
  const prefix = ID_PREFIXES[tableName];
  
  if (!prefix) {
    throw new Error(`Nieznana tabela: ${tableName}. Dostępne: ${Object.keys(ID_PREFIXES).join(', ')}`);
  }
  
  const nextNumber = (currentMax + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNumber}`;
}

/**
 * Generuje ID klienta
 * @param {number} currentMax 
 * @returns {string} CLI-001, CLI-002, ...
 */
function generateClientId(currentMax = 0) {
  return generateNextId('clients', currentMax);
}

/**
 * Generuje ID zlecenia (proste)
 * @param {number} currentMax 
 * @returns {string} ORD-001, ORD-002, ...
 */
function generateOrderId(currentMax = 0) {
  return generateNextId('orders', currentMax);
}

/**
 * Generuje numer zlecenia z datą
 * @param {number} year 
 * @param {number} currentMax 
 * @returns {string} SRV-2024-001, SRV-2024-002, ...
 */
function generateOrderNumber(year = new Date().getFullYear(), currentMax = 0) {
  const nextNumber = (currentMax + 1).toString().padStart(3, '0');
  return `SRV-${year}-${nextNumber}`;
}

/**
 * Generuje ID pracownika
 * @param {number} currentMax 
 * @returns {string} EMP-001, EMP-002, ...
 */
function generateEmployeeId(currentMax = 0) {
  return generateNextId('employees', currentMax);
}

/**
 * Generuje ID serwisanta
 * @param {number} currentMax 
 * @returns {string} SRV-001, SRV-002, ...
 */
function generateServicemanId(currentMax = 0) {
  return generateNextId('servicemen', currentMax);
}

/**
 * Generuje ID wizyty serwisanta
 * @param {number} currentMax 
 * @returns {string} VIS-001, VIS-002, ...
 */
function generateVisitId(currentMax = 0) {
  return generateNextId('serviceman_visits', currentMax);
}

/**
 * Generuje numer wizyty z datą
 * @param {number} year 
 * @param {number} currentMax 
 * @returns {string} VIS-2024-001, VIS-2024-002, ...
 */
function generateVisitNumber(year = new Date().getFullYear(), currentMax = 0) {
  const nextNumber = (currentMax + 1).toString().padStart(3, '0');
  return `VIS-${year}-${nextNumber}`;
}

/**
 * Generuje ID zlecenia w wizycie
 * @param {number} currentMax 
 * @returns {string} VOR-001, VOR-002, ...
 */
function generateVisitOrderId(currentMax = 0) {
  return generateNextId('visit_orders', currentMax);
}

/**
 * Generuje ID części magazynowej
 * @param {number} currentMax 
 * @returns {string} ITM-001, ITM-002, ...
 */
function generateItemId(currentMax = 0) {
  return generateNextId('inventory', currentMax);
}

/**
 * Generuje ID faktury
 * @param {number} currentMax 
 * @returns {string} INV-001, INV-002, ...
 */
function generateInvoiceId(currentMax = 0) {
  return generateNextId('invoices', currentMax);
}

/**
 * Generuje numer faktury z datą
 * @param {number} year 
 * @param {number} month 
 * @param {number} currentMax 
 * @returns {string} FV-202412-001, FV-202412-002, ...
 */
function generateInvoiceNumber(year = new Date().getFullYear(), month = new Date().getMonth() + 1, currentMax = 0) {
  const monthStr = month.toString().padStart(2, '0');
  const nextNumber = (currentMax + 1).toString().padStart(3, '0');
  return `FV-${year}${monthStr}-${nextNumber}`;
}

/**
 * Generuje ID terminu/wizyty
 * @param {number} currentMax 
 * @returns {string} APP-001, APP-002, ...
 */
function generateAppointmentId(currentMax = 0) {
  return generateNextId('appointments', currentMax);
}

/**
 * Generuje ID powiadomienia
 * @param {number} currentMax 
 * @returns {string} NOT-001, NOT-002, ...
 */
function generateNotificationId(currentMax = 0) {
  return generateNextId('notifications', currentMax);
}

// ========== FUNKCJE POMOCNICZE ==========

/**
 * Parsuje ID i zwraca informacje
 * @param {string} id - np. "CLI-001", "VIS-2024-123"
 * @returns {object} { prefix, number, isValid }
 */
function parseId(id) {
  if (!id || typeof id !== 'string') {
    return { prefix: null, number: null, isValid: false };
  }
  
  // Prosty format: PREFIX-XXX
  const simpleMatch = id.match(/^([A-Z]{3})-(\d{3})$/);
  if (simpleMatch) {
    return {
      prefix: simpleMatch[1],
      number: parseInt(simpleMatch[2]),
      isValid: true,
      type: 'simple'
    };
  }
  
  // Format z datą: PREFIX-YYYY-XXX
  const dateMatch = id.match(/^([A-Z]{3})-(\d{4})-(\d{3})$/);
  if (dateMatch) {
    return {
      prefix: dateMatch[1],
      year: parseInt(dateMatch[2]),
      number: parseInt(dateMatch[3]),
      isValid: true,
      type: 'dated'
    };
  }
  
  // Format faktury: FV-YYYYMM-XXX
  const invoiceMatch = id.match(/^(FV)-(\d{4})(\d{2})-(\d{3})$/);
  if (invoiceMatch) {
    return {
      prefix: invoiceMatch[1],
      year: parseInt(invoiceMatch[2]),
      month: parseInt(invoiceMatch[3]),
      number: parseInt(invoiceMatch[4]),
      isValid: true,
      type: 'invoice'
    };
  }
  
  return { prefix: null, number: null, isValid: false };
}

/**
 * Sprawdza czy ID jest prawidłowy
 * @param {string} id 
 * @param {string} expectedTable - opcjonalnie sprawdź czy ID pasuje do tabeli
 * @returns {boolean}
 */
function isValidId(id, expectedTable = null) {
  const parsed = parseId(id);
  
  if (!parsed.isValid) return false;
  
  if (expectedTable) {
    const expectedPrefix = ID_PREFIXES[expectedTable];
    return parsed.prefix === expectedPrefix;
  }
  
  return true;
}

/**
 * Pobiera następny numer dla tabeli z bazy danych
 * @param {string} tableName 
 * @param {string} idField - nazwa pola z ID (np. 'clientId', 'orderId')
 * @param {object} db - instancja bazy danych
 * @returns {Promise<number>}
 */
async function getNextNumber(tableName, idField, db) {
  try {
    // Pobierz ostatni ID z bazy
    const result = await db.queryOne(
      `SELECT ${idField} FROM ${tableName} WHERE ${idField} IS NOT NULL ORDER BY id DESC LIMIT 1`
    );
    
    if (!result || !result[idField]) {
      return 1; // Pierwszy rekord
    }
    
    const parsed = parseId(result[idField]);
    return parsed.isValid ? parsed.number + 1 : 1;
    
  } catch (error) {
    console.error(`Błąd pobierania następnego numeru dla ${tableName}:`, error);
    return 1;
  }
}

// ========== PRZYKŁADY UŻYCIA ==========
const USAGE_EXAMPLES = {
  // W aplikacji webowej (Next.js)
  web: `
    import { generateClientId, generateOrderNumber } from '@/shared/id-generator';
    
    // Nowy klient
    const clientId = generateClientId(lastClientNumber); // CLI-001
    
    // Nowe zlecenie
    const orderNumber = generateOrderNumber(2024, lastOrderNumber); // SRV-2024-001
  `,
  
  // W aplikacji mobilnej
  mobile: `
    import { generateVisitId, parseId } from './shared/id-generator';
    
    // Nowa wizyta
    const visitId = generateVisitId(lastVisitNumber); // VIS-001
    
    // Sprawdź ID
    const parsed = parseId('CLI-001');
    console.log(parsed); // { prefix: 'CLI', number: 1, isValid: true }
  `,
  
  // W backendzie z bazą danych
  backend: `
    const { getNextNumber, generateClientId } = require('./shared/id-generator');
    
    // Pobierz następny numer z bazy
    const nextNumber = await getNextNumber('clients', 'clientId', db);
    const newClientId = generateClientId(nextNumber - 1); // CLI-005
  `
};

module.exports = {
  // Prefiksy i formaty
  ID_PREFIXES,
  SPECIAL_FORMATS,
  
  // Funkcje generowania
  generateNextId,
  generateClientId,
  generateOrderId,
  generateOrderNumber,
  generateEmployeeId,
  generateServicemanId,
  generateVisitId,
  generateVisitNumber,
  generateVisitOrderId,
  generateItemId,
  generateInvoiceId,
  generateInvoiceNumber,
  generateAppointmentId,
  generateNotificationId,
  
  // Funkcje pomocnicze
  parseId,
  isValidId,
  getNextNumber,
  
  // Przykłady
  USAGE_EXAMPLES
};