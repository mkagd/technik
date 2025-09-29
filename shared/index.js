/**
 * GŁÓWNY PLIK STRUKTURY DANYCH
 * 
 * Eksportuje wszystkie elementy struktury danych dla:
 * - Aplikacji webowej (Next.js)
 * - Aplikacji mobilnej (React Native/Flutter)
 * - Skryptów migracji bazy danych
 * - API dokumentacji
 * 
 * UŻYCIE:
 * 
 * // W aplikacji webowej
 * import { ENUMS, SCHEMAS, getEn  // STARY SYSTEM ID ZOSTAŁ PRZENIESIONY DO id-system-library/
  // Importuj z ../id-system-library/ jeśli potrzebneshared';
 * 
 * // W aplikacji mobilnej
 * import { SYSTEM_CONFIG, API_RESPONSES } from './shared';
 * 
 * // W backendzie
 * const { ALL_SCHEMAS, isValidStatus } = require('./shared');
 */

// Importy głównych modułów
const { 
  SYSTEM_CONFIG, 
  DATA_TYPES, 
  ENUMS, 
  SCHEMAS, 
  API_RESPONSES,
  getEnumLabel,
  getEnumColor,
  isValidStatus,
  getRequiredFields
} = require('./schema');

const { 
  EXTENDED_SCHEMAS, 
  ALL_SCHEMAS 
} = require('./extended-schemas');

const { 
  SEED_DATA, 
  generateOrderNumber, 
  generateEmployeeId 
} = require('./seed-data');

const { 
  SERVICEMAN_SCHEMAS, 
  SERVICEMAN_ENUMS, 
  ServicemanHelpers 
} = require('./serviceman-schemas');

const { 
  SERVICEMAN_SEED_DATA 
} = require('./serviceman-seed-data');

// STARY SYSTEM ID ZOSTAŁ PRZENIESIONY DO id-system-library/
// Importuj z ../id-system-library/ jeśli potrzebne

const {
  generatePastDate,
  generateFutureDate,
  generateTodayDate,
  getNextTestId,
  resetCounters,
  addAutoFields,
  CLEAN_SEED_DATA
} = require('./clean-seed-data');

// ========== FUNKCJE POMOCNICZE ==========

/**
 * Walidacja statusu zlecenia
 * @param {string} currentStatus - obecny status
 * @param {string} newStatus - nowy status
 * @param {string} userRole - rola użytkownika
 * @returns {boolean}
 */
function canChangeStatus(currentStatus, newStatus, userRole = 'technician') {
  const allowedFlow = SCHEMAS.orders.statusFlow[currentStatus] || [];
  
  // Admin może wszystko
  if (userRole === 'admin') return true;
  
  // Sprawdź czy przejście jest dozwolone
  if (!allowedFlow.includes(newStatus)) return false;
  
  // Dodatkowe reguły dla ról
  if (userRole === 'client') {
    // Klient może tylko anulować swoje zlecenia
    return newStatus === 'cancelled' && currentStatus === 'pending';
  }
  
  return true;
}

/**
 * Generuje kolor dla statusu zlecenia
 * @param {string} status - status zlecenia
 * @returns {string} - kod koloru hex
 */
function getStatusColor(status) {
  return getEnumColor('ORDER_STATUS', status.toUpperCase());
}

/**
 * Sprawdza czy użytkownik ma uprawnienia
 * @param {object} user - obiekt użytkownika
 * @param {string} permission - wymagane uprawnienie
 * @returns {boolean}
 */
function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  
  const rolePermissions = ENUMS.USER_ROLES[user.role.toUpperCase()]?.permissions || [];
  
  // Admin ma wszystkie uprawnienia
  if (rolePermissions.includes('full_access')) return true;
  
  return rolePermissions.includes(permission);
}

/**
 * Formatuje cenę dla wyświetlenia
 * @param {number} price - cena
 * @param {string} currency - waluta
 * @returns {string}
 */
function formatPrice(price, currency = 'PLN') {
  if (!price) return '0,00 PLN';
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Formatuje datę dla aplikacji mobilnej
 * @param {string|Date} date - data
 * @param {string} format - format ('short', 'long', 'time')
 * @returns {string}
 */
function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('pl-PL');
    case 'long': 
      return d.toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return d.toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case 'datetime':
      return `${formatDate(date, 'short')} ${formatDate(date, 'time')}`;
    default:
      return d.toLocaleDateString('pl-PL');
  }
}

/**
 * Generuje inicjały z imienia i nazwiska
 * @param {string} firstName - imię
 * @param {string} lastName - nazwisko
 * @returns {string}
 */
function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

/**
 * Sprawdza czy inwentarz jest na niskim poziomie
 * @param {object} item - element inwentarza
 * @returns {boolean}
 */
function isLowStock(item) {
  return item.quantity <= item.minQuantity;
}

/**
 * Generuje konfigurację API dla aplikacji mobilnej
 * @param {string} environment - środowisko ('development', 'production')
 * @returns {object}
 */
function getMobileAPIConfig(environment = 'development') {
  const config = SYSTEM_CONFIG.api;
  
  if (environment === 'production') {
    return {
      ...config,
      baseUrl: 'https://yourdomain.com/api', // zmień na swoją domenę
      timeout: 15000
    };
  }
  
  return config;
}

/**
 * Waliduje dane według schematu
 * @param {string} tableName - nazwa tabeli
 * @param {object} data - dane do walidacji
 * @returns {object} - { isValid: boolean, errors: array }
 */
function validateData(tableName, data) {
  const schema = ALL_SCHEMAS[tableName];
  if (!schema) {
    return { isValid: false, errors: [`Schema for ${tableName} not found`] };
  }
  
  const errors = [];
  const requiredFields = getRequiredFields(tableName);
  
  // Sprawdź wymagane pola
  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors.push(`Field ${field} is required`);
    }
  });
  
  // TODO: Dodać więcej walidacji (email, telefon, itp.)
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ========== HELPERY DLA APLIKACJI MOBILNEJ ==========

const MobileHelpers = {
  /**
   * Przygotowuje dane zlecenia dla aplikacji mobilnej
   */
  prepareOrderForMobile(order, client, employee) {
    return {
      ...order,
      statusLabel: getEnumLabel('ORDER_STATUS', order.status),
      statusColor: getStatusColor(order.status),
      priorityLabel: getEnumLabel('PRIORITY', order.priority),
      deviceTypeLabel: getEnumLabel('DEVICE_TYPES', order.deviceType),
      serviceTypeLabel: getEnumLabel('SERVICE_TYPES', order.serviceType),
      formattedCost: formatPrice(order.finalCost || order.estimatedCost),
      formattedDate: formatDate(order.createdAt),
      clientName: client ? `${client.firstName} ${client.lastName}` : '',
      technicianName: employee ? `${employee.firstName} ${employee.lastName}` : 'Nieprzypisany',
      canEdit: order.status !== 'completed' && order.status !== 'cancelled'
    };
  },

  /**
   * Przygotowuje listę statusów dostępnych do zmiany
   */
  getAvailableStatusChanges(currentStatus, userRole) {
    const flow = SCHEMAS.orders.statusFlow[currentStatus] || [];
    return flow.map(status => ({
      value: status,
      label: getEnumLabel('ORDER_STATUS', status),
      color: getStatusColor(status)
    })).filter(status => canChangeStatus(currentStatus, status.value, userRole));
  },

  /**
   * Generuje powiadomienie push
   */
  createPushNotification(type, data) {
    const templates = EXTENDED_SCHEMAS.notifications.templates;
    const template = templates[type];
    
    if (!template) return null;
    
    return {
      title: template.title.replace(/\{(\w+)\}/g, (match, key) => data[key] || match),
      message: template.message.replace(/\{(\w+)\}/g, (match, key) => data[key] || match),
      data: data
    };
  }
};

// ========== EKSPORT ==========

module.exports = {
  // Podstawowe struktury
  SYSTEM_CONFIG,
  DATA_TYPES,
  ENUMS,
  SCHEMAS,
  EXTENDED_SCHEMAS,
  ALL_SCHEMAS,
  SERVICEMAN_SCHEMAS,
  SERVICEMAN_ENUMS,
  API_RESPONSES,
  SEED_DATA,
  SERVICEMAN_SEED_DATA,
  CLEAN_SEED_DATA,
  
  // Funkcje pomocnicze
  getEnumLabel,
  getEnumColor,
  isValidStatus,
  getRequiredFields,
  canChangeStatus,
  getStatusColor,
  hasPermission,
  formatPrice,
  formatDate,
  getInitials,
  isLowStock,
  getMobileAPIConfig,
  validateData,
  
  // Generatory ID
  ID_PREFIXES,
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
  parseId,
  isValidId,
  getNextNumber,
  
  // Funkcje dat i czystych danych
  generatePastDate,
  generateFutureDate,
  generateTodayDate,
  getNextTestId,
  resetCounters,
  addAutoFields,
  
  // Helpery mobilne i serwisantów
  MobileHelpers,
  ServicemanHelpers,
  
  // Stałe dla aplikacji mobilnej
  MOBILE_CONSTANTS: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_FILE_SIZE_MB: 10,
    SUPPORTED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'webp'],
    DEFAULT_PAGINATION_LIMIT: 20,
    MAP_DEFAULT_ZOOM: 15,
    GPS_ACCURACY_METERS: 10
  }
};

// Dla ES6 modules (aplikacje mobilne)
if (typeof window !== 'undefined') {
  window.TechnikSharedSchema = module.exports;
}