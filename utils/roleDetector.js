// utils/roleDetector.js - System wykrywania ról użytkowników

export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee', 
  CLIENT: 'client',
  GUEST: 'guest'
};

export const ROLE_ROUTES = {
  [USER_ROLES.ADMIN]: '/admin',
  [USER_ROLES.EMPLOYEE]: '/pracownik-panel',
  [USER_ROLES.CLIENT]: '/moje-zamowienie',
  [USER_ROLES.GUEST]: '/moje-zamowienie'
};

/**
 * Wykrywa rolę aktualnego użytkownika na podstawie danych w localStorage
 * @returns {Object} { role: string, user: object|null, route: string }
 */
export function detectUserRole() {
  // PRIORYTET 1: Sprawdź czy administrator jest zalogowany
  // Sprawdź stan w sessionStorage (nowy sposób)
  const adminSession = sessionStorage.getItem('adminAuth');
  if (adminSession === 'true') {
    return {
      role: USER_ROLES.ADMIN,
      user: { name: 'Administrator' },
      route: ROLE_ROUTES[USER_ROLES.ADMIN],
      displayName: 'Administrator',
      email: 'admin@technik.pl'
    };
  }

  // Sprawdź stan w localStorage (stary sposób - dla kompatybilności)
  const adminAuthLocal = localStorage.getItem('adminAuth');
  if (adminAuthLocal === 'true') {
    return {
      role: USER_ROLES.ADMIN,
      user: { name: 'Administrator' },
      route: ROLE_ROUTES[USER_ROLES.ADMIN],
      displayName: 'Administrator',
      email: 'admin@technik.pl'
    };
  }

  // PRIORYTET 2: Sprawdź czy pracownik jest zalogowany
  const employeeSession = localStorage.getItem('employeeSession');
  if (employeeSession) {
    try {
      const employeeData = JSON.parse(employeeSession);
      return {
        role: USER_ROLES.EMPLOYEE,
        user: employeeData,
        route: ROLE_ROUTES[USER_ROLES.EMPLOYEE],
        displayName: employeeData.name || `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim(),
        email: employeeData.email
      };
    } catch (error) {
      console.error('Błąd parsowania employeeSession:', error);
    }
  }

  // PRIORYTET 3: Sprawdź czy użytkownik jest zalogowany z Google (klient)
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      return {
        role: USER_ROLES.CLIENT,
        user: userData,
        route: ROLE_ROUTES[USER_ROLES.CLIENT],
        displayName: `${userData.firstName} ${userData.lastName}`,
        email: userData.email
      };
    } catch (error) {
      console.error('Błąd parsowania currentUser:', error);
    }
  }

  // PRIORYTET 4: Sprawdź czy użytkownik technik jest zalogowany (z moje-zamowienie.js)
  const rememberedTechnikUser = localStorage.getItem('rememberedTechnikUser');
  if (rememberedTechnikUser) {
    try {
      const technikData = JSON.parse(rememberedTechnikUser);
      return {
        role: USER_ROLES.CLIENT,
        user: technikData,
        route: ROLE_ROUTES[USER_ROLES.CLIENT],
        displayName: technikData.name || technikData.email.split('@')[0],
        email: technikData.email
      };
    } catch (error) {
      console.error('Błąd parsowania rememberedTechnikUser:', error);
    }
  }

  // Domyślnie zwróć gościa
  return {
    role: USER_ROLES.GUEST,
    user: null,
    route: ROLE_ROUTES[USER_ROLES.GUEST],
    displayName: null,
    email: null
  };
}

/**
 * Pobiera odpowiednią ikonę dla roli użytkownika
 * @param {string} role 
 * @returns {string}
 */
export function getRoleIcon(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return '👨‍💼'; // Administrator
    case USER_ROLES.EMPLOYEE:
      return '🔧'; // Pracownik serwisu
    case USER_ROLES.CLIENT:
      return '👤'; // Klient
    default:
      return '🏠'; // Gość
  }
}

/**
 * Pobiera odpowiedni tekst dla przycisku w zależności od roli
 * @param {string} role 
 * @returns {string}
 */
export function getRoleButtonText(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Panel Administratora';
    case USER_ROLES.EMPLOYEE:
      return 'Panel Serwisanta';
    case USER_ROLES.CLIENT:
      return 'Moje Zamówienia';
    default:
      return 'Moje Konto';
  }
}

/**
 * Pobiera opis roli użytkownika
 * @param {string} role 
 * @returns {string}
 */
export function getRoleDescription(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Zarządzanie systemem, użytkownikami i zamówieniami';
    case USER_ROLES.EMPLOYEE:
      return 'Harmonogram pracy i zlecenia serwisowe';
    case USER_ROLES.CLIENT:
      return 'Status zamówień i historia serwisu';
    default:
      return 'Sprawdź status swoich zamówień';
  }
}

/**
 * Sprawdza czy użytkownik ma uprawnienia do danej ścieżki
 * @param {string} userRole 
 * @param {string} requestedPath 
 * @returns {boolean}
 */
export function hasAccessToPath(userRole, requestedPath) {
  const adminPaths = ['/admin', '/admin-*'];
  const employeePaths = ['/pracownik-*', '/kalendarz-pracownika*'];
  
  if (adminPaths.some(path => requestedPath.startsWith(path.replace('*', '')))) {
    return userRole === USER_ROLES.ADMIN;
  }
  
  if (employeePaths.some(path => requestedPath.startsWith(path.replace('*', '')))) {
    return userRole === USER_ROLES.EMPLOYEE;
  }
  
  // Publiczne ścieżki dostępne dla wszystkich
  return true;
}