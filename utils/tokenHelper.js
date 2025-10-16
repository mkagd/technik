// utils/tokenHelper.js
// 🔑 Universal token helper - naprawia wszystkie problemy z autoryzacją

/**
 * Pobiera token z DOWOLNEGO systemu logowania
 * Priorytet: employeeToken > technicianToken > serwisToken
 */
export const getUniversalToken = () => {
  // Sprawdź wszystkie możliwe miejsca
  const tokens = [
    localStorage.getItem('employeeToken'),
    localStorage.getItem('technicianToken'),
    localStorage.getItem('serwisToken'),
    localStorage.getItem('token'),
  ];

  // Zwróć pierwszy niepusty
  const token = tokens.find(t => t && t.length > 10);
  
  if (!token) {
    console.error('❌ NO TOKEN FOUND! Sprawdzono:', {
      employeeToken: !!localStorage.getItem('employeeToken'),
      technicianToken: !!localStorage.getItem('technicianToken'),
      serwisToken: !!localStorage.getItem('serwisToken'),
    });
  } else {
    console.log('✅ Token found:', token.substring(0, 20) + '...');
  }

  return token;
};

/**
 * Synchronizuje token między wszystkimi kluczami
 */
export const syncAllTokens = () => {
  const token = getUniversalToken();
  
  if (token) {
    // Ustaw we wszystkich miejscach
    localStorage.setItem('employeeToken', token);
    localStorage.setItem('technicianToken', token);
    console.log('✅ Token synchronized across all keys');
    return true;
  }
  
  console.error('❌ No token to sync');
  return false;
};

/**
 * Naprawia token - uruchom to gdy masz 401
 */
export const fixToken = () => {
  console.log('🔧 Starting token fix...');
  
  // Krok 1: Sprawdź co mamy
  const employeeToken = localStorage.getItem('employeeToken');
  const technicianToken = localStorage.getItem('technicianToken');
  
  console.log('📋 Current state:', {
    employeeToken: employeeToken ? '✅ EXISTS' : '❌ NULL',
    technicianToken: technicianToken ? '✅ EXISTS' : '❌ NULL',
  });

  // Krok 2: Synchronizuj jeśli któryś istnieje
  if (employeeToken && !technicianToken) {
    localStorage.setItem('technicianToken', employeeToken);
    console.log('✅ Copied employeeToken → technicianToken');
    return true;
  }
  
  if (technicianToken && !employeeToken) {
    localStorage.setItem('employeeToken', technicianToken);
    console.log('✅ Copied technicianToken → employeeToken');
    return true;
  }

  if (employeeToken && technicianToken) {
    console.log('✅ Both tokens exist');
    return true;
  }

  // Krok 3: Brak tokenów
  console.error('❌ NO TOKENS FOUND - You need to login!');
  console.log('🔗 Go to: /pracownik-logowanie');
  return false;
};

/**
 * Debug info - wywołaj aby zobaczyć pełny stan
 */
export const debugTokens = () => {
  console.log('🔍 TOKEN DEBUG INFO:');
  console.log('==================');
  
  const keys = [
    'employeeToken',
    'technicianToken', 
    'serwisToken',
    'token',
    'employeeSession',
    'technicianEmployee',
  ];

  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      } catch {
        console.log(`${key}:`, value.substring(0, 30) + '...');
      }
    } else {
      console.log(`${key}:`, '❌ NULL');
    }
  });
  
  console.log('==================');
};
