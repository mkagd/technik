/**
 * ========================================
 * TECHNIK - UNIFIED ID SYSTEM v1.0
 * ========================================
 * 
 * 🎯 GŁÓWNY SYSTEM IDENTYFIKATORÓW
 * 
 * Kompatybilny z:
 * - Next.js (aplikacja webowa)
 * - React Native + Expo (aplikacja mobilna)
 * - Node.js (backend)
 * 
 * Format ID: PREFIX[ŹRÓDŁO][DATECODE][NUMER]
 * Przykład: ORDA252710001
 * - ORD = zamówienie
 * - A = AI Assistant
 * - 25271 = 28.09.2025 (dzień 271)
 * - 0001 = pierwsze tego dnia
 * 
 * Data utworzenia: 28.09.2025
 * Autor: System Technik
 * Wersja: 1.0.0
 */

// ========================================
// 📋 KONFIGURACJA PODSTAWOWA
// ========================================

/**
 * Prefiksy dla różnych typów encji
 */
const ID_PREFIXES = {
  // Podstawowe encje
  clients: "CLI",           // Klienci
  orders: "ORD",           // Zamówienia/Zlecenia
  employees: "EMP",        // Pracownicy
  
  // System serwisantów
  servicemen: "SRV",       // Serwisanci mobilni
  visits: "VIS",           // Wizyty serwisantów
  
  // Biznesowe
  appointments: "APP",     // Terminy/Wizyty
  inventory: "ITM",        // Magazyn/Części
  invoices: "INV",         // Faktury
  
  // Systemowe
  notifications: "NOT",    // Powiadomienia
  schedule: "SCH",         // Harmonogramy
  reports: "RPT",          // Raporty
  reviews: "REV",          // Recenzje/Oceny
  
  // Legacy
  legacy: "OLD"            // Stare zlecenia (przed systemem)
};

/**
 * Źródła zleceń - tylko dla PREFIX 'ORD'
 */
const ORDER_SOURCES = {
  'A': 'AI Assistant',        // Chatbot, OCR, automatyczne
  'M': 'Mobile',              // Aplikacja mobilna serwisanta
  'W': 'Website',             // Strona internetowa, formularze
  'T': 'Telefon',             // Call center, rozmowy
  'E': 'Email',               // Zgłoszenia mailowe
  'R': 'Ręczne',              // Dodane ręcznie przez admina
  'OLD': 'Legacy'             // Stare zlecenia (zachowane)
};

/**
 * Maksymalne liczby na dzień
 */
const LIMITS = {
  ordersPerSourcePerDay: 9999,    // Max zleceń na źródło dziennie
  othersPerDay: 9999,             // Max innych ID dziennie
  totalOrdersPerDay: 59994        // Łącznie zleceń (6 źródeł × 9999)
};

// ========================================
// 🛠️ FUNKCJE POMOCNICZE
// ========================================

/**
 * Pobiera dzień roku z daty
 * @param {Date} date - Data
 * @returns {number} - Dzień roku (1-366)
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Koduje datę na 5-cyfrowy kod
 * @param {Date} date - Data do zakodowania
 * @returns {string} - Kod daty (np. "25271")
 */
function encodeDateCode(date) {
  const year = date.getFullYear() % 100;
  const dayOfYear = getDayOfYear(date);
  return `${year}${dayOfYear.toString().padStart(3, '0')}`;
}

/**
 * Dekoduje kod daty na obiekt Date
 * @param {string} dateCode - Kod daty (np. "25271")
 * @returns {Date} - Zdekodowana data
 */
function decodeDateCode(dateCode) {
  const yearSuffix = parseInt(dateCode.slice(0, 2));
  const dayOfYear = parseInt(dateCode.slice(2));
  
  // Zakładamy lata 2000-2099
  const year = yearSuffix < 50 ? 2000 + yearSuffix : 1900 + yearSuffix;
  
  const date = new Date(year, 0, 1);
  date.setDate(dayOfYear);
  return date;
}

/**
 * Formatuje numer na 4 cyfrowy string
 * @param {number} number - Numer do sformatowania
 * @returns {string} - Sformatowany numer (np. "0001")
 */
function formatNumber(number) {
  return number.toString().padStart(4, '0');
}

// ========================================
// 🎯 GŁÓWNE FUNKCJE GENEROWANIA ID
// ========================================

/**
 * ========================================
 * GENERATOR ZLECEŃ (ORDERS)
 * ========================================
 */

/**
 * Generuje ID zlecenia
 * @param {string} source - Źródło zlecenia (A, M, W, T, E, R)
 * @param {Date} date - Data zlecenia (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID zlecenia (np. "ORDA252710001")
 */
function generateOrderId(source, date = new Date(), sequenceNumber = 1) {
  if (!ORDER_SOURCES[source]) {
    throw new Error(`Nieprawidłowe źródło zlecenia: ${source}. Dostępne: ${Object.keys(ORDER_SOURCES).join(', ')}`);
  }
  
  if (sequenceNumber < 1 || sequenceNumber > LIMITS.ordersPerSourcePerDay) {
    throw new Error(`Numer kolejny musi być między 1 a ${LIMITS.ordersPerSourcePerDay}`);
  }
  
  const prefix = ID_PREFIXES.orders;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${source}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR KLIENTÓW (CLIENTS)
 * ========================================
 */

/**
 * Generuje ID klienta
 * @param {Date} date - Data dodania klienta (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID klienta (np. "CLI252710001")
 */
function generateClientId(date = new Date(), sequenceNumber = 1) {
  if (sequenceNumber < 1 || sequenceNumber > LIMITS.othersPerDay) {
    throw new Error(`Numer kolejny musi być między 1 a ${LIMITS.othersPerDay}`);
  }
  
  const prefix = ID_PREFIXES.clients;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR PRACOWNIKÓW (EMPLOYEES)
 * ========================================
 */

/**
 * Generuje ID pracownika
 * @param {Date} date - Data zatrudnienia (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID pracownika (np. "EMP252710001")
 */
function generateEmployeeId(date = new Date(), sequenceNumber = 1) {
  if (sequenceNumber < 1 || sequenceNumber > LIMITS.othersPerDay) {
    throw new Error(`Numer kolejny musi być między 1 a ${LIMITS.othersPerDay}`);
  }
  
  const prefix = ID_PREFIXES.employees;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR SERWISANTÓW (SERVICEMEN)
 * ========================================
 */

/**
 * Generuje ID serwisanta
 * @param {Date} date - Data dodania (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID serwisanta (np. "SRV252710001")
 */
function generateServicemanId(date = new Date(), sequenceNumber = 1) {
  const prefix = ID_PREFIXES.servicemen;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR WIZYT (VISITS)
 * ========================================
 */

/**
 * Generuje ID wizyty
 * @param {Date} date - Data wizyty (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID wizyty (np. "VIS252710001")
 */
function generateVisitId(date = new Date(), sequenceNumber = 1) {
  const prefix = ID_PREFIXES.visits;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR TERMINÓW (APPOINTMENTS)
 * ========================================
 */

/**
 * Generuje ID terminu
 * @param {Date} date - Data terminu (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - ID terminu (np. "APP252710001")
 */
function generateAppointmentId(date = new Date(), sequenceNumber = 1) {
  const prefix = ID_PREFIXES.appointments;
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR POZOSTAŁYCH ID
 * ========================================
 */

/**
 * Generuje ID dla różnych typów encji
 * @param {string} type - Typ encji (inventory, invoices, notifications, etc.)
 * @param {Date} date - Data (default: dzisiaj)
 * @param {number} sequenceNumber - Numer kolejny (1-9999)
 * @returns {string} - Wygenerowane ID
 */
function generateGenericId(type, date = new Date(), sequenceNumber = 1) {
  if (!ID_PREFIXES[type]) {
    throw new Error(`Nieznany typ encji: ${type}. Dostępne: ${Object.keys(ID_PREFIXES).join(', ')}`);
  }
  
  const prefix = ID_PREFIXES[type];
  const dateCode = encodeDateCode(date);
  const number = formatNumber(sequenceNumber);
  
  return `${prefix}${dateCode}${number}`;
}

/**
 * ========================================
 * GENERATOR STARYCH ZLECEŃ (LEGACY)
 * ========================================
 */

/**
 * Generuje ID dla starych zleceń
 * @param {number|string} originalId - Oryginalny ID/timestamp
 * @returns {string} - Legacy ID (np. "OLD1751696099051")
 */
function generateLegacyOrderId(originalId) {
  return `${ID_PREFIXES.legacy}${originalId}`;
}

// ========================================
// 🔍 FUNKCJE DEKODOWANIA I WALIDACJI
// ========================================

/**
 * Dekoduje ID na komponenty
 * @param {string} id - ID do zdekodowania
 * @returns {object} - Zdekodowane komponenty
 */
function decodeId(id) {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Nieprawidłowy format ID' };
  }
  
  // Legacy orders
  if (id.startsWith('OLD')) {
    const originalId = id.slice(3);
    const timestamp = parseInt(originalId);
    const date = isNaN(timestamp) ? null : new Date(timestamp);
    
    return {
      isValid: true,
      type: 'legacy',
      prefix: 'OLD',
      originalId: originalId,
      date: date,
      isLegacy: true
    };
  }
  
  // Standard format validation
  const prefixMatch = Object.entries(ID_PREFIXES).find(([key, prefix]) => 
    id.startsWith(prefix) && key !== 'legacy'
  );
  
  if (!prefixMatch) {
    return { isValid: false, error: 'Nieznany prefiks' };
  }
  
  const [entityType, prefix] = prefixMatch;
  
  // Orders (with source)
  if (prefix === 'ORD') {
    if (id.length !== 13) {
      return { isValid: false, error: 'Nieprawidłowa długość ID zamówienia' };
    }
    
    const source = id[3];
    const dateCode = id.slice(4, 9);
    const number = id.slice(9);
    
    if (!ORDER_SOURCES[source]) {
      return { isValid: false, error: 'Nieprawidłowe źródło zamówienia' };
    }
    
    try {
      const date = decodeDateCode(dateCode);
      return {
        isValid: true,
        type: 'order',
        entityType: entityType,
        prefix: prefix,
        source: source,
        sourceName: ORDER_SOURCES[source],
        dateCode: dateCode,
        date: date,
        number: number,
        sequenceNumber: parseInt(number),
        isLegacy: false
      };
    } catch (error) {
      return { isValid: false, error: 'Nieprawidłowy kod daty' };
    }
  }
  
  // Other entities (without source)
  else {
    if (id.length !== 12) {
      return { isValid: false, error: `Nieprawidłowa długość ID dla ${entityType}` };
    }
    
    const dateCode = id.slice(3, 8);
    const number = id.slice(8);
    
    try {
      const date = decodeDateCode(dateCode);
      return {
        isValid: true,
        type: 'standard',
        entityType: entityType,
        prefix: prefix,
        dateCode: dateCode,
        date: date,
        number: number,
        sequenceNumber: parseInt(number),
        isLegacy: false
      };
    } catch (error) {
      return { isValid: false, error: 'Nieprawidłowy kod daty' };
    }
  }
}

/**
 * Sprawdza czy ID jest prawidłowy
 * @param {string} id - ID do sprawdzenia
 * @returns {boolean} - Czy ID jest prawidłowy
 */
function isValidId(id) {
  const decoded = decodeId(id);
  return decoded.isValid;
}

/**
 * Pobiera typ encji z ID
 * @param {string} id - ID
 * @returns {string|null} - Typ encji lub null
 */
function getEntityType(id) {
  const decoded = decodeId(id);
  return decoded.isValid ? decoded.entityType : null;
}

// ========================================
// 📊 FUNKCJE POMOCNICZE BIZNESOWE
// ========================================

/**
 * Pobiera następny numer sekwencyjny dla danego dnia
 * (Ta funkcja powinna być zaimplementowana z połączeniem do bazy danych)
 * @param {string} entityType - Typ encji
 * @param {string} source - Źródło (tylko dla zleceń)
 * @param {Date} date - Data
 * @returns {Promise<number>} - Następny numer sekwencyjny
 */
async function getNextSequenceNumber(entityType, source = null, date = new Date()) {
  // UWAGA: To jest placeholder - należy zaimplementować z bazą danych
  console.warn('getNextSequenceNumber: Placeholder - zaimplementuj z bazą danych');
  
  // Przykładowa implementacja (zwraca losowy numer)
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * Generuje kompletne ID z automatycznym numerem sekwencyjnym
 * @param {string} entityType - Typ encji
 * @param {string} source - Źródło (tylko dla zleceń)
 * @param {Date} date - Data
 * @returns {Promise<string>} - Wygenerowane ID
 */
async function generateCompleteId(entityType, source = null, date = new Date()) {
  const sequenceNumber = await getNextSequenceNumber(entityType, source, date);
  
  if (entityType === 'orders') {
    return generateOrderId(source, date, sequenceNumber);
  } else {
    return generateGenericId(entityType, date, sequenceNumber);
  }
}

// ========================================
// 📱 FUNKCJE DLA APLIKACJI MOBILNEJ
// ========================================

/**
 * Generuje ID wizyty serwisanta (mobile)
 * @param {Date} date - Data wizyty
 * @param {number} sequenceNumber - Numer kolejny
 * @returns {string} - ID wizyty
 */
function generateMobileVisitId(date = new Date(), sequenceNumber = 1) {
  return generateVisitId(date, sequenceNumber);
}

/**
 * Generuje ID zlecenia mobilnego
 * @param {Date} date - Data zlecenia
 * @param {number} sequenceNumber - Numer kolejny
 * @returns {string} - ID zlecenia mobilnego
 */
function generateMobileOrderId(date = new Date(), sequenceNumber = 1) {
  return generateOrderId('M', date, sequenceNumber);
}

/**
 * Sprawdza czy ID należy do aplikacji mobilnej
 * @param {string} id - ID do sprawdzenia
 * @returns {boolean} - Czy ID jest mobilne
 */
function isMobileId(id) {
  const decoded = decodeId(id);
  if (!decoded.isValid) return false;
  
  return (decoded.type === 'order' && decoded.source === 'M') ||
         (decoded.entityType === 'visits') ||
         (decoded.entityType === 'servicemen');
}

// ========================================
// 📊 FUNKCJE STATYSTYCZNE
// ========================================

/**
 * Pobiera statystyki ID dla danego dnia
 * @param {Date} date - Data
 * @returns {object} - Statystyki
 */
function getDayStatistics(date = new Date()) {
  const dateCode = encodeDateCode(date);
  
  return {
    dateCode: dateCode,
    date: date.toISOString().split('T')[0],
    maxOrdersPerSource: LIMITS.ordersPerSourcePerDay,
    maxTotalOrders: LIMITS.totalOrdersPerDay,
    sources: Object.keys(ORDER_SOURCES).filter(s => s !== 'OLD')
  };
}

// ========================================
// ⚡ FUNKCJE WALIDACJI I SANITYZACJI
// ========================================

/**
 * Waliduje i sanityzuje dane wejściowe
 * @param {string} entityType - Typ encji
 * @param {string} source - Źródło
 * @param {Date} date - Data
 * @param {number} sequenceNumber - Numer sekwencyjny
 * @returns {object} - Zwalidowane dane
 */
function validateInput(entityType, source, date, sequenceNumber) {
  const errors = [];
  
  // Walidacja typu encji
  if (!ID_PREFIXES[entityType]) {
    errors.push(`Nieznany typ encji: ${entityType}`);
  }
  
  // Walidacja źródła dla zleceń
  if (entityType === 'orders' && !ORDER_SOURCES[source]) {
    errors.push(`Nieprawidłowe źródło zamówienia: ${source}`);
  }
  
  // Walidacja daty
  if (!(date instanceof Date) || isNaN(date)) {
    errors.push('Nieprawidłowa data');
  }
  
  // Walidacja numeru sekwencyjnego
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1 || sequenceNumber > 9999) {
    errors.push('Numer sekwencyjny musi być liczbą całkowitą między 1 a 9999');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitizedData: {
      entityType,
      source,
      date: new Date(date),
      sequenceNumber: parseInt(sequenceNumber)
    }
  };
}

// ========================================
// 🔧 FUNKCJE NARZĘDZIOWE
// ========================================

/**
 * Konwertuje legacy ID na nowy format (jeśli to możliwe)
 * @param {string} legacyId - Stary ID
 * @returns {string} - Nowy format ID
 */
function convertLegacyId(legacyId) {
  // Dla timestamp ID
  const timestamp = parseInt(legacyId);
  if (!isNaN(timestamp)) {
    return generateLegacyOrderId(timestamp);
  }
  
  // Dla innych formatów
  return generateLegacyOrderId(legacyId);
}

/**
 * Pobiera wszystkie dostępne prefiksy
 * @returns {object} - Dostępne prefiksy
 */
function getAvailablePrefixes() {
  return { ...ID_PREFIXES };
}

/**
 * Pobiera wszystkie dostępne źródła zleceń
 * @returns {object} - Dostępne źródła
 */
function getAvailableSources() {
  return { ...ORDER_SOURCES };
}

// ========================================
// 📤 EXPORT/MODULE EXPORTS
// ========================================

// Dla Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Konfiguracja
    ID_PREFIXES,
    ORDER_SOURCES,
    LIMITS,
    
    // Funkcje pomocnicze
    getDayOfYear,
    encodeDateCode,
    decodeDateCode,
    formatNumber,
    
    // Generatory główne
    generateOrderId,
    generateClientId,
    generateEmployeeId,
    generateServicemanId,
    generateVisitId,
    generateAppointmentId,
    generateGenericId,
    generateLegacyOrderId,
    
    // Dekodowanie i walidacja
    decodeId,
    isValidId,
    getEntityType,
    
    // Funkcje biznesowe
    getNextSequenceNumber,
    generateCompleteId,
    
    // Funkcje mobilne
    generateMobileVisitId,
    generateMobileOrderId,
    isMobileId,
    
    // Statystyki
    getDayStatistics,
    
    // Walidacja
    validateInput,
    
    // Narzędzia
    convertLegacyId,
    getAvailablePrefixes,
    getAvailableSources
  };
}

// Dla ES6 modules (React Native/Expo)
const IDSystem = {
  // Konfiguracja
  ID_PREFIXES,
  ORDER_SOURCES,
  LIMITS,
  
  // Funkcje pomocnicze
  getDayOfYear,
  encodeDateCode,
  decodeDateCode,
  formatNumber,
  
  // Generatory główne
  generateOrderId,
  generateClientId,
  generateEmployeeId,
  generateServicemanId,
  generateVisitId,
  generateAppointmentId,
  generateGenericId,
  generateLegacyOrderId,
  
  // Dekodowanie i walidacja
  decodeId,
  isValidId,
  getEntityType,
  
  // Funkcje biznesowe
  getNextSequenceNumber,
  generateCompleteId,
  
  // Funkcje mobilne
  generateMobileVisitId,
  generateMobileOrderId,
  isMobileId,
  
  // Statystyki
  getDayStatistics,
  
  // Walidacja
  validateInput,
  
  // Narzędzia
  convertLegacyId,
  getAvailablePrefixes,
  getAvailableSources
};

// Export dla ES6
if (typeof exports !== 'undefined') {
  Object.assign(exports, IDSystem);
}

// Global dla browser/React Native
if (typeof global !== 'undefined') {
  global.TechnikIDSystem = IDSystem;
}
if (typeof window !== 'undefined') {
  window.TechnikIDSystem = IDSystem;
}