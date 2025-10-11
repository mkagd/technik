/**
 * Kalkulator czasu naprawy AGD (Client-side version)
 * 
 * Oblicza szacowany czas naprawy na podstawie:
 * - Typu urządzenia
 * - Indywidualnych czasów pracownika
 * - Dodatkowych czynności (montaż/demontaż zabudowy)
 * - Ręcznie wprowadzonego dodatkowego czasu
 * 
 * UWAGA: Ta wersja używa API endpoint zamiast bezpośredniego dostępu do fs
 */

let repairTimeSettings = null;

// Load settings from API
const loadSettings = async () => {
  if (!repairTimeSettings) {
    try {
      const response = await fetch('/api/repair-time/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-settings' })
      });
      const data = await response.json();
      repairTimeSettings = data.settings;
    } catch (error) {
      console.error('Failed to load repair time settings:', error);
      repairTimeSettings = { additionalTimes: {}, deviceDefaults: {}, deviceTypes: [] };
    }
  }
  return repairTimeSettings;
};

/**
 * Pobiera czas bazowy naprawy dla pracownika i typu urządzenia
 * @param {Object} employee - Obiekt pracownika z repairTimes
 * @param {string} deviceType - Typ urządzenia (np. "pralka", "lodówka")
 * @returns {Promise<number>} Czas w minutach
 */
async function getBaseRepairTime(employee, deviceType) {
  if (!employee) {
    // Jeśli brak pracownika, użyj czasu domyślnego z konfiguracji
    const settings = await loadSettings();
    const device = settings.deviceTypes?.find(d => d.id === deviceType);
    return device ? device.defaultTime : 30;
  }

  // Pobierz czas z ustawień pracownika
  if (employee.repairTimes && employee.repairTimes[deviceType]) {
    return employee.repairTimes[deviceType];
  }

  // Fallback do czasu domyślnego
  const settings = await loadSettings();
  const device = settings.deviceTypes?.find(d => d.id === deviceType);
  return device ? device.defaultTime : 30;
}

/**
 * Oblicza dodatkowy czas za czynności montażowe
 * @param {Object} additionalWork - Obiekt z flagami czynności dodatkowych
 * @param {boolean} additionalWork.hasDemontaz - Czy wymaga demontażu
 * @param {boolean} additionalWork.hasMontaz - Czy wymaga montażu
 * @param {boolean} additionalWork.hasTrudnaZabudowa - Czy trudna zabudowa
 * @param {number} additionalWork.manualAdditionalTime - Ręcznie dodany czas (minuty)
 * @returns {Promise<number>} Dodatkowy czas w minutach
 */
async function calculateAdditionalTime(additionalWork = {}) {
  let additionalTime = 0;
  const settings = await loadSettings();

  if (additionalWork.hasDemontaz) {
    additionalTime += settings.additionalTimes?.demontaż?.time || 0;
  }

  if (additionalWork.hasMontaz) {
    additionalTime += settings.additionalTimes?.montaż?.time || 0;
  }

  if (additionalWork.hasTrudnaZabudowa) {
    additionalTime += settings.additionalTimes?.trudnaZabudowa?.time || 0;
  }

  if (additionalWork.manualAdditionalTime && typeof additionalWork.manualAdditionalTime === 'number') {
    additionalTime += additionalWork.manualAdditionalTime;
  }

  return additionalTime;
}

/**
 * Oblicza całkowity szacowany czas naprawy
 * @param {Object} params - Parametry obliczenia
 * @param {Object} params.employee - Obiekt pracownika
 * @param {string} params.deviceType - Typ urządzenia
 * @param {Object} params.additionalWork - Dodatkowe czynności
 * @returns {Promise<Object>} Obiekt z szczegółami czasu
 */
async function calculateRepairTime(params) {
  const { employee, deviceType, additionalWork = {} } = params;

  const baseTime = await getBaseRepairTime(employee, deviceType);
  const additionalTime = await calculateAdditionalTime(additionalWork);
  const totalTime = baseTime + additionalTime;

  const settings = await loadSettings();

  return {
    baseTime,
    additionalTime,
    totalTime,
    breakdown: {
      base: baseTime,
      demontaz: additionalWork.hasDemontaz ? (settings.additionalTimes?.demontaż?.time || 0) : 0,
      montaz: additionalWork.hasMontaz ? (settings.additionalTimes?.montaż?.time || 0) : 0,
      trudnaZabudowa: additionalWork.hasTrudnaZabudowa ? (settings.additionalTimes?.trudnaZabudowa?.time || 0) : 0,
      manual: additionalWork.manualAdditionalTime || 0
    },
    deviceType,
    employeeName: employee?.name || 'Nieprzypisany'
  };
}

/**
 * Waliduje typ urządzenia
 * @param {string} deviceType - Typ urządzenia do walidacji
 * @returns {Promise<boolean>} Czy typ jest prawidłowy
 */
async function isValidDeviceType(deviceType) {
  const settings = await loadSettings();
  return settings.deviceTypes?.some(d => d.id === deviceType) || false;
}

/**
 * Pobiera listę wszystkich typów urządzeń
 * @returns {Promise<Array>} Tablica typów urządzeń
 */
async function getDeviceTypes() {
  const settings = await loadSettings();
  return settings.deviceTypes || [];
}

/**
 * Pobiera ustawienia dodatkowych czasów
 * @returns {Promise<Object>} Obiekt z ustawieniami dodatkowych czasów
 */
async function getAdditionalTimesSettings() {
  const settings = await loadSettings();
  return settings.additionalTimes || {};
}

/**
 * Formatuje czas do wyświetlenia
 * @param {number} minutes - Czas w minutach
 * @returns {string} Sformatowany czas (np. "1h 30min", "45min")
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Oblicza sugerowany czas dla wizyty na podstawie zlecenia
 * @param {Object} order - Zlecenie
 * @param {Object} employee - Pracownik
 * @returns {Promise<number>} Sugerowany czas w minutach
 */
async function suggestVisitDuration(order, employee) {
  try {
    const response = await fetch('/api/repair-time/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'suggest-duration',
        order,
        employee 
      })
    });
    const data = await response.json();
    return data.duration || 60;
  } catch (error) {
    console.error('Error calculating visit duration:', error);
    return 60; // Domyślnie 1 godzina
  }
}

export {
  calculateRepairTime,
  getBaseRepairTime,
  calculateAdditionalTime,
  isValidDeviceType,
  getDeviceTypes,
  getAdditionalTimesSettings,
  formatTime,
  suggestVisitDuration
};
