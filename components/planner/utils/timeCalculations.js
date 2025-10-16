/**
 * timeCalculations.js
 * 
 * Automatyczne obliczanie czasu trwania naprawy (estimatedDuration)
 * na podstawie typu urzÄ…dzenia, pracownika i dodatkowych czynnikĂłw.
 * 
 * KaĹĽdy pracownik ma indywidualne czasy dla:
 * - repairTimes: podstawowy czas naprawy dla kaĹĽdego typu urzÄ…dzenia
 * - builtInWorkTimes: dodatkowe czasy dla urzÄ…dzeĹ„ w zabudowie
 */

import { logger } from '../../../utils/logger';

/**
 * GĹ‚Ăłwna funkcja obliczajÄ…ca szacowany czas naprawy
 * 
 * @param {Object} order - Zlecenie z danymi
 * @param {string} order.deviceType - Typ urzÄ…dzenia (np. "Pralka", "LodĂłwka")
 * @param {boolean} order.isBuiltIn - Czy urzÄ…dzenie jest w zabudowie
 * @param {boolean} order.isDifficultBuiltIn - Czy to trudna zabudowa
 * @param {string} order.visitType - Typ wizyty ('repair', 'diagnosis', 'installation', 'control')
 * 
 * @param {Object} employee - Dane pracownika
 * @param {Object} employee.repairTimes - Czasy naprawy dla typĂłw urzÄ…dzeĹ„
 * @param {Object} employee.builtInWorkTimes - Czasy dla zabudowy
 * 
 * @returns {number} Szacowany czas w minutach
 */
export function calculateEstimatedDuration(order, employee) {
  if (!order || !employee) {
    logger.warn('âš ď¸Ź calculateEstimatedDuration: brak danych order lub employee');
    return 60; // DomyĹ›lny fallback
  }

  let totalTime = 0;
  
  // 1ď¸ŹâŁ PODSTAWOWY CZAS NAPRAWY
  const deviceType = normalizeDeviceType(order.deviceType);
  const baseTime = getBaseRepairTime(deviceType, employee);
  
  logger.debug(`âŹ±ď¸Ź Obliczam czas dla ${order.deviceType}:`, {
    deviceType,
    baseTime,
    employee: employee.name,
    visitType: order.visitType
  });
  
  // 2ď¸ŹâŁ MODYFIKACJA NA PODSTAWIE TYPU WIZYTY
  if (order.visitType === 'diagnosis') {
    // Diagnoza jest krĂłtsza - 60% czasu naprawy
    totalTime = Math.round(baseTime * 0.6);
    logger.debug(`  đź”Ť Diagnoza: ${baseTime} * 0.6 = ${totalTime} min`);
  } else if (order.visitType === 'control') {
    // Kontrola jest najkrĂłtsza - 40% czasu naprawy
    totalTime = Math.round(baseTime * 0.4);
    logger.debug(`  âś… Kontrola: ${baseTime} * 0.4 = ${totalTime} min`);
  } else {
    // Naprawa lub instalacja - peĹ‚ny czas
    totalTime = baseTime;
    logger.debug(`  đź”§ Naprawa/Instalacja: ${baseTime} min`);
  }
  
  // 3ď¸ŹâŁ DODATKOWY CZAS DLA ZABUDOWY (tylko dla napraw i instalacji)
  if ((order.visitType === 'repair' || order.visitType === 'installation') && order.isBuiltIn) {
    const builtInTime = getBuiltInTime(order, employee);
    totalTime += builtInTime;
    logger.debug(`  đźŹ—ď¸Ź Zabudowa: +${builtInTime} min (razem: ${totalTime} min)`);
  }
  
  // 4ď¸ŹâŁ Minimum 15 minut (bezpieczeĹ„stwo)
  if (totalTime < 15) {
    logger.warn(`  âš ď¸Ź Czas ${totalTime}min za krĂłtki, ustawiam minimum 15min`);
    totalTime = 15;
  }
  
  logger.debug(`  âś… SUMA: ${totalTime} minut`);
  return totalTime;
}

/**
 * Normalizuje typ urzÄ…dzenia do formatu uĹĽywanego w employee.repairTimes
 * "Pralka" -> "pralka"
 * "PĹ‚yta indukcyjna" -> "pĹ‚yta indukcyjna"
 */
function normalizeDeviceType(deviceType) {
  if (!deviceType) return 'inne AGD';
  
  // Konwertuj do maĹ‚ych liter
  let normalized = deviceType.toLowerCase().trim();
  
  // đź”§ UsuĹ„ koĹ„cowe "i" (dopeĹ‚niacz liczby mnogiej) - "pralki" -> "pralk" -> "pralka"
  // Lista form dopeĹ‚niacza â†’ forma podstawowa
  const pluralToSingular = {
    'pralki': 'pralka',
    'lodĂłwki': 'lodĂłwka',
    'zmywarki': 'zmywarka',
    'piekarniki': 'piekarnik',
    'kuchenki': 'kuchenka',
    'pĹ‚yty indukcyjnej': 'pĹ‚yta indukcyjna',
    'pĹ‚yty indukcyjne': 'pĹ‚yta indukcyjna',
    'suszarki': 'suszarka',
    'zamraĹĽarki': 'zamraĹĽarka',
    'mikrofalĂłwki': 'mikrofalĂłwka',
    'okapy': 'okap'
  };
  
  // SprawdĹş czy to forma dopeĹ‚niacza
  if (pluralToSingular[normalized]) {
    normalized = pluralToSingular[normalized];
  }
  
  // Mapowanie aliasĂłw na standardowe nazwy
  const aliases = {
    'pralko-suszarka': 'pralko-suszarka',
    'pralka z suszarkÄ…': 'pralko-suszarka',
    'lodowka': 'lodĂłwka',
    'lodĂłwko-zamraĹĽarka': 'lodĂłwka',
    'kuchnia': 'kuchenka',
    'kuchnia gazowa': 'kuchenka',
    'kuchnia elektryczna': 'kuchenka',
    'plyta indukcyjna': 'pĹ‚yta indukcyjna',
    'plyta': 'pĹ‚yta indukcyjna',
    'zamrazarka': 'zamraĹĽarka',
    'zamraĹĽalnik': 'zamraĹĽarka',
    'mikrofalowka': 'mikrofalĂłwka',
    'mikrofala': 'mikrofalĂłwka',
    'sokowirĂłwka': 'sokowirĂłwka',
    'wyciskarka': 'sokowirĂłwka'
  };
  
  return aliases[normalized] || normalized;
}

/**
 * Pobiera podstawowy czas naprawy z danych pracownika
 */
function getBaseRepairTime(deviceType, employee) {
  // đź”Ť DEBUG: Co zawiera obiekt pracownika?
  logger.debug(`đź”Ť DEBUG employee:`, {
    id: employee.id,
    name: employee.name,
    hasRepairTimes: !!employee.repairTimes,
    repairTimesKeys: employee.repairTimes ? Object.keys(employee.repairTimes) : 'BRAK',
    fullEmployee: employee
  });
  
  if (!employee.repairTimes) {
    logger.warn(`âš ď¸Ź Pracownik ${employee.name} nie ma zdefiniowanych repairTimes`);
    return 60; // DomyĹ›lny fallback
  }
  
  // Szukaj dokĹ‚adnego dopasowania
  if (employee.repairTimes[deviceType]) {
    return employee.repairTimes[deviceType];
  }
  
  // Szukaj czÄ™Ĺ›ciowego dopasowania (np. "pralka automatyczna" -> "pralka")
  for (const [key, value] of Object.entries(employee.repairTimes)) {
    if (deviceType.includes(key) || key.includes(deviceType)) {
      logger.debug(`  đź“Ś CzÄ™Ĺ›ciowe dopasowanie: "${deviceType}" -> "${key}"`);
      return value;
    }
  }
  
  // Fallback na "inne AGD"
  const fallback = employee.repairTimes['inne AGD'] || employee.repairTimes['inne'] || 60;
  logger.warn(`  âš ď¸Ź Brak czasu dla "${deviceType}", uĹĽywam fallback: ${fallback}min`);
  return fallback;
}

/**
 * Oblicza dodatkowy czas dla urzÄ…dzeĹ„ w zabudowie
 */
function getBuiltInTime(order, employee) {
  if (!employee.builtInWorkTimes) {
    logger.warn(`âš ď¸Ź Pracownik ${employee.name} nie ma zdefiniowanych builtInWorkTimes`);
    return 20; // DomyĹ›lny fallback: 10min demontaĹĽ + 10min montaĹĽ
  }
  
  let builtInTime = 0;
  
  // DemontaĹĽ
  builtInTime += employee.builtInWorkTimes.demontaĹĽ || employee.builtInWorkTimes['demontaz'] || 10;
  
  // MontaĹĽ
  builtInTime += employee.builtInWorkTimes.montaĹĽ || employee.builtInWorkTimes['montaz'] || 10;
  
  // Trudna zabudowa (np. kuchnia pod blatem, wbudowana lodĂłwka)
  if (order.isDifficultBuiltIn) {
    builtInTime += employee.builtInWorkTimes.trudnaZabudowa || employee.builtInWorkTimes['trudna zabudowa'] || 20;
    logger.debug(`  đź”Ą Trudna zabudowa: +${employee.builtInWorkTimes.trudnaZabudowa || 20}min`);
  }
  
  return builtInTime;
}

/**
 * Pobiera pracownika z API lub cache
 * Helper do uĹĽycia w komponentach
 */
export async function fetchEmployeeData(employeeId) {
  if (!employeeId) return null;
  
  try {
    const response = await fetch('/api/employees');
    if (!response.ok) throw new Error('Failed to fetch employees');
    
    const data = await response.json();
    const employee = data.employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      logger.warn(`âš ď¸Ź Nie znaleziono pracownika: ${employeeId}`);
      return null;
    }
    
    return employee;
  } catch (error) {
    console.error('âťŚ BĹ‚Ä…d pobierania danych pracownika:', error);
    return null;
  }
}

/**
 * Oblicza i aktualizuje estimatedDuration dla zlecenia
 * UĹĽywane przy przypisywaniu pracownika
 */
export async function updateOrderEstimatedDuration(order, employeeId) {
  const employee = await fetchEmployeeData(employeeId);
  if (!employee) {
    logger.warn('âš ď¸Ź Nie moĹĽna obliczyÄ‡ czasu - brak danych pracownika');
    return order.estimatedDuration || 60;
  }
  
  return calculateEstimatedDuration(order, employee);
}

/**
 * Formatuje czas dla wyĹ›wietlenia
 * 65min -> "1h 5min"
 * 45min -> "45min"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

/**
 * Eksportowane dla testĂłw i debugowania
 */
export const __testing__ = {
  normalizeDeviceType,
  getBaseRepairTime,
  getBuiltInTime
};

