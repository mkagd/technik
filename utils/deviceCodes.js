// utils/deviceCodes.js
// 🏷️ System kodów skróconych dla typów urządzeń AGD
// Używane przez serwisantów do szybkiej identyfikacji typu zlecenia

/**
 * Mapowanie typów urządzeń na 2-3 literowe kody
 * Format: TYP → KOD (czytelny i intuicyjny)
 */
export const DEVICE_CODES = {
  // Pralki i suszarki
  'Pralka': 'PR',
  'Pralki': 'PR',
  'pralka': 'PR',
  'Pralka automatyczna': 'PR',
  'Suszarka': 'SU',
  'Suszarki': 'SU',
  'suszarka': 'SU',
  'Pralko-suszarka': 'PS',
  
  // Lodówki i zamrażarki
  'Lodówka': 'LO',
  'Lodówki': 'LO',
  'lodówka': 'LO',
  'Chłodziarka': 'LO',
  'Zamrażarka': 'ZA',
  'Zamrażarki': 'ZA',
  'zamrażarka': 'ZA',
  'Lodówko-zamrażarka': 'LZ',
  
  // Zmywarki
  'Zmywarka': 'ZM',
  'Zmywarki': 'ZM',
  'zmywarka': 'ZM',
  'Zmywarka do zabudowy': 'ZM',
  
  // Kuchenki i piekarniki
  'Piekarnik': 'PI',
  'Piekarniki': 'PI',
  'piekarnik': 'PI',
  'Kuchenka': 'KU',
  'Kuchenki': 'KU',
  'kuchenka': 'KU',
  'Kuchnia': 'KU',
  'Kuchnia gazowa': 'KU',
  'Kuchnia elektryczna': 'KU',
  
  // Płyty grzewcze
  'Płyta indukcyjna': 'PI',
  'Płyta ceramiczna': 'PC',
  'Płyta gazowa': 'PG',
  'Płyta elektryczna': 'PE',
  'Płyta': 'PL',
  
  // Okapy
  'Okap': 'OK',
  'Okapy': 'OK',
  'okap': 'OK',
  
  // Mikrofalówki
  'Mikrofalówka': 'MI',
  'Mikrofalówki': 'MI',
  'mikrofalówka': 'MI',
  'Kuchenka mikrofalowa': 'MI',
  
  // Inne AGD
  'Odkurzacz': 'OD',
  'Odkurzacz pionowy': 'OD',
  'Robot sprzątający': 'RO',
  'Ekspres do kawy': 'EK',
  'Czajnik': 'CZ',
  'Toster': 'TO',
  'Żelazko': 'ZE',
  'Parowar': 'PA',
  'Grill': 'GR',
  'Frytkownica': 'FR',
  'Maszynka do mięsa': 'MM',
  'Blender': 'BL',
  'Mikser': 'MX',
  
  // AGD klimatyzacja
  'Klimatyzator': 'KL',
  'Klimatyzacja': 'KL',
  'Pompa ciepła': 'PM',
  'Wentylator': 'WE',
  
  // AGD grzewcze
  'Bojler': 'BO',
  'Piecyk': 'PK',
  'Grzejnik': 'GZ',
  
  // Fallback
  'AGD': 'AG',
  'Inne': 'IN',
  'Nieznany': '??',
};

/**
 * Pobiera kod urządzenia na podstawie typu/nazwy
 * @param {string} deviceType - Typ/nazwa urządzenia
 * @returns {string} 2-3 literowy kod
 */
export const getDeviceCode = (deviceType) => {
  if (!deviceType) return '??';
  
  // Normalizuj input
  const normalized = String(deviceType).trim();
  
  // Dokładne dopasowanie
  if (DEVICE_CODES[normalized]) {
    return DEVICE_CODES[normalized];
  }
  
  // Dopasowanie case-insensitive
  const lowerInput = normalized.toLowerCase();
  for (const [key, code] of Object.entries(DEVICE_CODES)) {
    if (key.toLowerCase() === lowerInput) {
      return code;
    }
  }
  
  // Dopasowanie częściowe (zawiera słowo kluczowe)
  for (const [key, code] of Object.entries(DEVICE_CODES)) {
    if (lowerInput.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerInput)) {
      return code;
    }
  }
  
  // Fallback - pierwsze 2 litery uppercase
  return normalized.substring(0, 2).toUpperCase();
};

/**
 * Pobiera pełną nazwę urządzenia z kodu
 * @param {string} code - Kod urządzenia (np. 'PR')
 * @returns {string} Pełna nazwa
 */
export const getDeviceNameFromCode = (code) => {
  const reverseMap = {
    'PR': 'Pralka',
    'SU': 'Suszarka',
    'PS': 'Pralko-suszarka',
    'LO': 'Lodówka',
    'ZA': 'Zamrażarka',
    'LZ': 'Lodówko-zamrażarka',
    'ZM': 'Zmywarka',
    'PI': 'Piekarnik',
    'KU': 'Kuchenka',
    'PC': 'Płyta ceramiczna',
    'PG': 'Płyta gazowa',
    'PE': 'Płyta elektryczna',
    'PL': 'Płyta',
    'OK': 'Okap',
    'MI': 'Mikrofalówka',
    'OD': 'Odkurzacz',
    'RO': 'Robot sprzątający',
    'EK': 'Ekspres do kawy',
    'CZ': 'Czajnik',
    'TO': 'Toster',
    'ZE': 'Żelazko',
    'PA': 'Parowar',
    'GR': 'Grill',
    'FR': 'Frytkownica',
    'MM': 'Maszynka do mięsa',
    'BL': 'Blender',
    'MX': 'Mikser',
    'KL': 'Klimatyzator',
    'PM': 'Pompa ciepła',
    'WE': 'Wentylator',
    'BO': 'Bojler',
    'PK': 'Piecyk',
    'GZ': 'Grzejnik',
    'AG': 'AGD',
    'IN': 'Inne',
    '??': 'Nieznany',
  };
  
  return reverseMap[code] || code;
};

/**
 * Generuje kompaktowy identyfikator zlecenia dla serwisanta
 * Format: [KOD] NUMER_ZLECENIA - ADRES
 * Przykład: [PR] ORD2025001234 - ul. Kwiatowa 15, Kraków
 * 
 * @param {Object} order - Obiekt zamówienia
 * @returns {string} Sformatowany identyfikator
 */
export const formatOrderForTechnician = (order) => {
  if (!order) return '';
  
  const deviceCode = getDeviceCode(order.deviceType || order.category);
  const orderNumber = order.orderNumber || order.id || '???';
  
  // Priorytet: address > fullAddress > city
  let location = '';
  if (order.address) {
    location = order.address;
    if (order.city) location += `, ${order.city}`;
  } else if (order.fullAddress) {
    location = order.fullAddress;
  } else if (order.city) {
    location = order.city;
  } else {
    location = 'Brak adresu';
  }
  
  return `[${deviceCode}] ${orderNumber} - ${location}`;
};

/**
 * Generuje badge z kodem urządzenia (komponent UI)
 * @param {string} deviceType - Typ urządzenia
 * @returns {Object} Props dla badge component
 */
export const getDeviceBadgeProps = (deviceType) => {
  const code = getDeviceCode(deviceType);
  
  // Kolory badge w zależności od kategorii urządzenia
  const colorMap = {
    // Pralki - niebieski
    'PR': 'bg-blue-100 text-blue-800 border-blue-300',
    'SU': 'bg-blue-100 text-blue-800 border-blue-300',
    'PS': 'bg-blue-100 text-blue-800 border-blue-300',
    
    // Lodówki - cyan
    'LO': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'ZA': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'LZ': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    
    // Zmywarki - teal
    'ZM': 'bg-teal-100 text-teal-800 border-teal-300',
    
    // Piekarniki/Kuchenki - pomarańczowy
    'PI': 'bg-orange-100 text-orange-800 border-orange-300',
    'KU': 'bg-orange-100 text-orange-800 border-orange-300',
    
    // Płyty - czerwony
    'PC': 'bg-red-100 text-red-800 border-red-300',
    'PG': 'bg-red-100 text-red-800 border-red-300',
    'PE': 'bg-red-100 text-red-800 border-red-300',
    'PL': 'bg-red-100 text-red-800 border-red-300',
    
    // Okapy - fioletowy
    'OK': 'bg-purple-100 text-purple-800 border-purple-300',
    
    // Mikrofalówki - różowy
    'MI': 'bg-pink-100 text-pink-800 border-pink-300',
    
    // Inne - szary
    'default': 'bg-gray-100 text-gray-800 border-gray-300',
  };
  
  return {
    code,
    label: getDeviceNameFromCode(code),
    className: colorMap[code] || colorMap['default'],
  };
};

/**
 * Sortuje zlecenia według priorytetu dla serwisanta
 * @param {Array} orders - Lista zleceń
 * @returns {Array} Posortowane zlecenia
 */
export const sortOrdersForTechnician = (orders) => {
  if (!Array.isArray(orders)) return [];
  
  return orders.sort((a, b) => {
    // 1. Priorytet (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
    if (priorityDiff !== 0) return priorityDiff;
    
    // 2. Status (scheduled > in_progress > completed)
    const statusOrder = { 
      scheduled: 5, 
      on_way: 4,
      in_progress: 3, 
      paused: 2,
      completed: 1,
      cancelled: 0
    };
    const statusDiff = (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
    if (statusDiff !== 0) return statusDiff;
    
    // 3. Data (wcześniejsze pierwsze)
    const dateA = new Date(a.scheduledDate || a.dateAdded || 0);
    const dateB = new Date(b.scheduledDate || b.dateAdded || 0);
    return dateA - dateB;
  });
};

export default {
  DEVICE_CODES,
  getDeviceCode,
  getDeviceNameFromCode,
  formatOrderForTechnician,
  getDeviceBadgeProps,
  sortOrdersForTechnician,
};
