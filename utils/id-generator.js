/**
 * Uniwersalny generator ID dla systemu AGD
 * Format: PREFIX + ŹRÓDŁO(1) + ROK(2) + DZIEŃ_ROKU(3) + NUMER(4)
 * 
 * Kody źródeł (1 litera):
 * W = web-form           - Formularz rezerwacji (gość, bez konta)
 * U = user-portal        - Klient zalogowany na koncie
 * A = admin-panel        - Panel administratora
 * T = technician         - Technik/pracownik
 * C = chat-ai            - Chat AI
 * Q = quick-form         - Szybkie zapytanie
 * P = phone              - Telefoniczne
 * E = email              - Email
 * M = mobile-app         - Aplikacja mobilna
 * R = auto-assigned      - Automatycznie przydzielone
 * V = auto-visit         - Wizyta utworzona automatycznie
 * F = auto-followup      - Automatyczny follow-up
 * N = auto-notification  - Z automatycznej notyfikacji
 * S = system-auto        - System (automatyczne ogólne)
 * I = import             - Import danych
 * X = external-api       - Zewnętrzne API
 * 
 * Przykłady:
 * - CLIW252760001 - Client z Web formularza (276. dzień 2025, 1. klient)
 * - CLIU252760002 - Client zalogowany (User portal)
 * - ORDA252760001 - Order z Admin panelu (276. dzień 2025, 1. zamówienie)
 * - ORDW252760002 - Order z Web formularza (gość)
 * - ORDU252760003 - Order od zalogowanego klienta
 * - VIST252760001 - Visit od Technika (276. dzień 2025, 1. wizyta)
 * - VISR252760002 - Visit automatycznie przydzielona
 * - ORDC252760004 - Order z Chat AI
 */

/**
 * Kody źródeł dla ID (1 litera)
 */
const SOURCE_CODES = {
  W: 'web-form',           // Formularz rezerwacji (gość)
  U: 'user-portal',        // Klient zalogowany
  A: 'admin-panel',        // Panel administratora
  T: 'technician',         // Technik/pracownik
  C: 'chat-ai',            // Chat AI
  Q: 'quick-form',         // Szybkie zapytanie
  P: 'phone',              // Telefoniczne
  E: 'email',              // Email
  M: 'mobile-app',         // Aplikacja mobilna
  R: 'auto-assigned',      // Automatycznie przydzielone
  V: 'auto-visit',         // Wizyta automatyczna
  F: 'auto-followup',      // Automatyczny follow-up
  N: 'auto-notification',  // Auto notyfikacja
  S: 'system-auto',        // System ogólny
  I: 'import',             // Import danych
  X: 'external-api'        // Zewnętrzne API
};

/**
 * Mapowanie source string → kod litery
 */
const SOURCE_TO_CODE = {
  'web-form': 'W',
  'user-portal': 'U',
  'admin-panel': 'A',
  'technician': 'T',
  'chat-ai': 'C',
  'quick-form': 'Q',
  'phone': 'P',
  'email': 'E',
  'mobile-app': 'M',
  'auto-assigned': 'R',
  'auto-visit': 'V',
  'auto-followup': 'F',
  'auto-notification': 'N',
  'system-auto': 'S',
  'import': 'I',
  'external-api': 'X'
};

/**
 * Oblicza dzień roku dla danej daty
 * @param {Date} date - Data
 * @returns {number} Dzień roku (1-366)
 */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Generuje ID w formacie PREFIX + ŹRÓDŁO + ROK + DZIEŃ_ROKU + NUMER
 * @param {string} prefix - Prefix (CLI, ORD, VIS, EMP, etc.)
 * @param {Date} date - Data utworzenia (domyślnie: dziś)
 * @param {number} sequenceNumber - Numer sekwencyjny (1-9999)
 * @param {string} source - Źródło (web-form, admin-panel, etc.) lub kod (W, A, etc.)
 * @returns {string} Wygenerowane ID
 */
function generateId(prefix, date = new Date(), sequenceNumber = 1, source = 'S') {
  // Konwertuj source na kod jednej litery jeśli to pełny string
  const sourceCode = source.length === 1 ? source.toUpperCase() : (SOURCE_TO_CODE[source] || 'S');
  
  const year = date.getFullYear().toString().slice(-2); // Ostatnie 2 cyfry roku
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0'); // 3 cyfry
  const sequence = sequenceNumber.toString().padStart(4, '0'); // 4 cyfry
  
  return `${prefix}${sourceCode}${year}${dayOfYear}${sequence}`;
}

/**
 * Parsuje ID i zwraca jego składowe
 * @param {string} id - ID do parsowania
 * @returns {Object} Obiekt z prefix, sourceCode, source, year, dayOfYear, sequenceNumber
 */
function parseId(id) {
  // Format: PREFIX (3 znaki) + ŹRÓDŁO (1 znak) + ROK (2 cyfry) + DZIEŃ (3 cyfry) + NUMER (4 cyfry)
  const match = id.match(/^([A-Z]{3})([A-Z])(\d{2})(\d{3})(\d{4})$/);
  
  if (!match) {
    return null;
  }
  
  const sourceCode = match[2];
  const sourceName = SOURCE_CODES[sourceCode] || 'unknown';
  
  return {
    prefix: match[1],
    sourceCode: sourceCode,
    source: sourceName,
    year: parseInt(match[3], 10) + 2000, // Dodajemy 2000 do roku
    dayOfYear: parseInt(match[4], 10),
    sequenceNumber: parseInt(match[5], 10),
    fullYear: `20${match[3]}`
  };
}

/**
 * Sprawdza czy ID ma prawidłowy format
 * @param {string} id - ID do sprawdzenia
 * @returns {boolean} True jeśli format jest prawidłowy
 */
function isValidId(id) {
  // Format: PREFIX(3) + ŹRÓDŁO(1) + ROK(2) + DZIEŃ(3) + NUMER(4) = 13 znaków
  return /^[A-Z]{3}[A-Z]\d{2}\d{3}\d{4}$/.test(id);
}

/**
 * Generuje następne ID w sekwencji na podstawie istniejącego
 * @param {string} lastId - Ostatnie ID
 * @returns {string} Następne ID w sekwencji
 */
function getNextId(lastId) {
  const parsed = parseId(lastId);
  
  if (!parsed) {
    throw new Error(`Invalid ID format: ${lastId}`);
  }
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayDayOfYear = getDayOfYear(today);
  
  // Jeśli to ten sam dzień, zwiększ numer sekwencyjny
  if (parsed.year === todayYear && parsed.dayOfYear === todayDayOfYear) {
    return generateId(parsed.prefix, today, parsed.sequenceNumber + 1);
  }
  
  // Jeśli to nowy dzień, zacznij od 1
  return generateId(parsed.prefix, today, 1);
}

/**
 * Znajduje największy numer sekwencyjny dla danego prefixu, źródła i daty
 * @param {Array} ids - Array istniejących ID
 * @param {string} prefix - Prefix do wyszukania (CLI, ORD, VIS, etc.)
 * @param {Date} date - Data (domyślnie: dziś)
 * @param {string} source - Źródło (opcjonalne - jeśli podane, szuka tylko tego źródła)
 * @returns {number} Największy numer sekwencyjny (0 jeśli nie znaleziono)
 */
function getMaxSequenceNumber(ids, prefix, date = new Date(), source = null) {
  const year = date.getFullYear().toString().slice(-2);
  const dayOfYear = getDayOfYear(date).toString().padStart(3, '0');
  
  // Jeśli source podane, dodaj do pattern
  let searchPattern = `${prefix}`;
  if (source) {
    const sourceCode = source.length === 1 ? source.toUpperCase() : (SOURCE_TO_CODE[source] || '');
    searchPattern += sourceCode;
  }
  searchPattern += `${year}${dayOfYear}`;
  
  const matchingIds = ids
    .filter(id => id && id.startsWith(searchPattern))
    .map(id => parseId(id))
    .filter(parsed => parsed !== null)
    .map(parsed => parsed.sequenceNumber);
  
  return matchingIds.length > 0 ? Math.max(...matchingIds) : 0;
}

/**
 * Generuje nowe ID dla wizyt
 * @param {Array} existingVisits - Istniejące wizyty w systemie
 * @param {Date} date - Data wizyty (domyślnie: dziś)
 * @param {string} source - Źródło (domyślnie: 'system-auto')
 * @returns {string} Nowe visitId
 */
function generateVisitId(existingVisits = [], date = new Date(), source = 'system-auto') {
  const visitIds = existingVisits.map(v => v.visitId).filter(Boolean);
  const maxSeq = getMaxSequenceNumber(visitIds, 'VIS', date, source);
  return generateId('VIS', date, maxSeq + 1, source);
}

/**
 * Generuje nowe ID dla zamówień
 * @param {Array} existingOrders - Istniejące zamówienia w systemie
 * @param {Date} date - Data zamówienia (domyślnie: dziś)
 * @param {string} source - Źródło (domyślnie: 'system-auto')
 * @returns {string} Nowe orderNumber
 */
function generateOrderId(existingOrders = [], date = new Date(), source = 'system-auto') {
  const orderIds = existingOrders.map(o => o.orderNumber).filter(Boolean);
  const maxSeq = getMaxSequenceNumber(orderIds, 'ORD', date, source);
  return generateId('ORD', date, maxSeq + 1, source);
}

/**
 * Generuje nowe ID dla klientów
 * @param {Array} existingClients - Istniejący klienci w systemie
 * @param {Date} date - Data rejestracji (domyślnie: dziś)
 * @param {string} source - Źródło (domyślnie: 'system-auto')
 * @returns {string} Nowe clientId
 */
function generateClientId(existingClients = [], date = new Date(), source = 'system-auto') {
  const clientIds = existingClients.map(c => c.clientId || c.id).filter(Boolean);
  const maxSeq = getMaxSequenceNumber(clientIds, 'CLI', date, source);
  return generateId('CLI', date, maxSeq + 1, source);
}

/**
 * Generuje nowe ID dla pracowników
 * @param {Array} existingEmployees - Istniejący pracownicy w systemie
 * @param {Date} date - Data zatrudnienia (domyślnie: dziś)
 * @param {string} source - Źródło (domyślnie: 'admin-panel')
 * @returns {string} Nowe employeeId
 */
function generateEmployeeId(existingEmployees = [], date = new Date(), source = 'admin-panel') {
  const employeeIds = existingEmployees.map(e => e.id || e.employeeId).filter(Boolean);
  const maxSeq = getMaxSequenceNumber(employeeIds, 'EMP', date, source);
  return generateId('EMP', date, maxSeq + 1, source);
}

module.exports = {
  generateId,
  parseId,
  isValidId,
  getNextId,
  getDayOfYear,
  getMaxSequenceNumber,
  generateVisitId,
  generateOrderId,
  generateClientId,
  generateEmployeeId,
  SOURCE_CODES,
  SOURCE_TO_CODE
};
