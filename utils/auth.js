// utils/auth.js
// 🔐 Helper do pobierania tokenu z dowolnego systemu logowania

/**
 * Pobiera token pracownika z localStorage
 * Sprawdza w kolejności:
 * 1. employeeToken (pracownik-logowanie)
 * 2. technicianToken (serwis-logowanie)
 * 
 * @returns {string|null} Token lub null jeśli brak
 */
export const getAuthToken = () => {
  // Try employeeToken first (pracownik-logowanie)
  const employeeToken = localStorage.getItem('employeeToken');
  if (employeeToken) {
    console.log('🔑 Using employeeToken');
    return employeeToken;
  }

  // Fallback to technicianToken (serwis-logowanie)
  const technicianToken = localStorage.getItem('technicianToken');
  if (technicianToken) {
    console.log('🔑 Using technicianToken');
    return technicianToken;
  }

  console.warn('⚠️ No auth token found in localStorage');
  return null;
};

/**
 * Pobiera employeeId z localStorage
 * Sprawdza w kolejności:
 * 1. employeeSession.id
 * 2. technicianEmployee.id
 * 
 * @returns {string|null} EmployeeId lub null
 */
export const getEmployeeId = () => {
  // Try employeeSession first
  const employeeSession = localStorage.getItem('employeeSession');
  if (employeeSession) {
    try {
      const session = JSON.parse(employeeSession);
      if (session.id || session.employeeId) {
        return session.id || session.employeeId;
      }
    } catch (e) {
      console.error('Error parsing employeeSession:', e);
    }
  }

  // Fallback to technicianEmployee
  const technicianEmployee = localStorage.getItem('technicianEmployee');
  if (technicianEmployee) {
    try {
      const employee = JSON.parse(technicianEmployee);
      if (employee.id || employee.employeeId) {
        return employee.id || employee.employeeId;
      }
    } catch (e) {
      console.error('Error parsing technicianEmployee:', e);
    }
  }

  return null;
};

/**
 * Sprawdza czy użytkownik jest zalogowany
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return getAuthToken() !== null;
};

/**
 * Wylogowuje użytkownika (czyści wszystkie tokeny)
 */
export const logout = () => {
  localStorage.removeItem('employeeToken');
  localStorage.removeItem('technicianToken');
  localStorage.removeItem('employeeSession');
  localStorage.removeItem('technicianEmployee');
  localStorage.removeItem('serwisEmployee');
  console.log('🚪 User logged out - all tokens cleared');
};

/**
 * Zapisuje token po zalogowaniu
 * @param {string} token 
 * @param {object} employeeData 
 * @param {string} loginType - 'employee' lub 'technician'
 */
export const setAuthToken = (token, employeeData, loginType = 'employee') => {
  if (loginType === 'employee') {
    localStorage.setItem('employeeToken', token);
    localStorage.setItem('employeeSession', JSON.stringify(employeeData));
  } else {
    localStorage.setItem('technicianToken', token);
    localStorage.setItem('technicianEmployee', JSON.stringify(employeeData));
  }
  console.log(`✅ Auth token set (${loginType})`);
};
