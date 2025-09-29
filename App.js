/**
 * GŁÓWNA APLIKACJA MOBILNA - SERWIS TECHNIK
 * 
 * React Native z Expo
 * Integracja z centralnymi schematami danych
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';

// Importy z naszej centralnej struktury danych
import {
  SYSTEM_CONFIG,
  ENUMS,
  MobileHelpers,
  MOBILE_CONSTANTS
} from './shared';

// Import nowego systemu ID
import {
  generateOrderId,
  generateClientId,
  decodeId as parseId
} from './id-system-library';

// Importy komponentów
import ServicemanDashboard from './screens/ServicemanDashboard';
// import LoginScreen from './screens/LoginScreen';
// import OrderListScreen from './screens/OrderListScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Inicjalizacja aplikacji
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 Inicjalizacja aplikacji mobilnej...');
      
      // Sprawdź połączenie z API
      const apiStatus = await checkAPIConnection();
      
      // Załaduj informacje o systemie
      const info = {
        version: SYSTEM_CONFIG.version,
        apiUrl: SYSTEM_CONFIG.api.baseUrl,
        apiConnected: apiStatus,
        features: SYSTEM_CONFIG.mobile.features
      };
      
      setSystemInfo(info);
      
      // Testuj generatory ID
      testIdGenerators();
      
      console.log('✅ Aplikacja zainicjalizowana');
      
    } catch (error) {
      console.error('❌ Błąd inicjalizacji:', error);
      Alert.alert('Błąd', 'Nie udało się zainicjalizować aplikacji');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sprawdź połączenie z API
   */
  const checkAPIConnection = async () => {
    try {
      const response = await fetch(`${SYSTEM_CONFIG.api.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.log('⚠️ Brak połączenia z API:', error.message);
      return false;
    }
  };

  /**
   * Testuj generatory ID
   */
  const testIdGenerators = () => {
    console.log('🧪 Test generatorów ID:');
    
    // Test generowania ID
    const clientId = generateClientId(5); // CLI-006
    const orderId = generateOrderId(10); // ORD-011
    
    console.log('  - Nowy klient:', clientId);
    console.log('  - Nowe zlecenie:', orderId);
    
    // Test parsowania ID
    const parsed = parseId(clientId);
    console.log('  - Parsowanie ID:', parsed);
    
    // Test enum
    const orderStatus = ENUMS.ORDER_STATUS.IN_PROGRESS;
    console.log('  - Status zlecenia:', orderStatus);
  };

  /**
   * Symulacja logowania
   */
  const handleLogin = (userType) => {
    const mockUser = {
      id: 1,
      type: userType,
      name: userType === 'serviceman' ? 'Jan Kowalski' : 'Admin System',
      permissions: SYSTEM_CONFIG.mobile.features[userType] || []
    };
    
    setUser(mockUser);
    Alert.alert('Sukces', `Zalogowano jako ${mockUser.name}`);
  };

  /**
   * Wylogowanie
   */
  const handleLogout = () => {
    setUser(null);
    Alert.alert('Info', 'Wylogowano pomyślnie');
  };

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔧 Serwis Technik</Text>
          <Text style={styles.loadingSubtext}>Ładowanie aplikacji mobilnej...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main app screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Jeśli zalogowany jako serwisant, pokaż dashboard */}
      {user && user.type === 'serviceman' ? (
        <ServicemanDashboard 
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Serwis Technik Mobile</Text>
          <Text style={styles.subtitle}>v{systemInfo?.version}</Text>
        </View>

        {/* System Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Status Systemu</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>API:</Text>
            <Text style={[
              styles.statusValue,
              { color: systemInfo?.apiConnected ? '#10b981' : '#ef4444' }
            ]}>
              {systemInfo?.apiConnected ? '✅ Połączono' : '❌ Brak połączenia'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>URL:</Text>
            <Text style={styles.statusValue}>{systemInfo?.apiUrl}</Text>
          </View>
        </View>

        {/* User Section */}
        {user ? (
          <View style={styles.userCard}>
            <Text style={styles.cardTitle}>Zalogowany użytkownik</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userType}>Typ: {user.type}</Text>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Wyloguj</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>Wybierz typ użytkownika</Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleLogin('client')}
            >
              <Text style={styles.loginButtonText}>👤 Klient</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleLogin('technician')}
            >
              <Text style={styles.loginButtonText}>🔧 Technik</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleLogin('serviceman')}
            >
              <Text style={styles.loginButtonText}>🚗 Serwisant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleLogin('admin')}
            >
              <Text style={styles.loginButtonText}>⚙️ Administrator</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Features Demo */}
        <View style={styles.featuresCard}>
          <Text style={styles.cardTitle}>Funkcje Systemu</Text>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => Alert.alert('Demo', 'Test generatorów ID - sprawdź konsolę')}
          >
            <Text style={styles.featureButtonText}>🆔 Test Generatorów ID</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => Alert.alert('Demo', `Statusy: ${Object.keys(ENUMS.ORDER_STATUS).join(', ')}`)}
          >
            <Text style={styles.featureButtonText}>📊 Pokaż Statusy Zleceń</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => Alert.alert('Demo', `Priorytety: ${Object.keys(ENUMS.PRIORITY).join(', ')}`)}
          >
            <Text style={styles.featureButtonText}>⚡ Pokaż Priorytety</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => Alert.alert('Demo', `Typy urządzeń: ${Object.keys(ENUMS.DEVICE_TYPES).join(', ')}`)}
          >
            <Text style={styles.featureButtonText}>📱 Pokaż Typy Urządzeń</Text>
          </TouchableOpacity>
        </View>

        {/* Schema Info */}
        <View style={styles.schemaCard}>
          <Text style={styles.cardTitle}>Informacje o Schematach</Text>
          <Text style={styles.schemaText}>
            ✅ Klienci: CLI-001, CLI-002...{'\n'}
            ✅ Zlecenia: ORD-001, ORD-002...{'\n'}
            ✅ Serwisanci: SRV-001, SRV-002...{'\n'}
            ✅ Wizyty: VIS-001, VIS-002...{'\n'}
            ✅ Części: ITM-001, ITM-002...
          </Text>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e40af',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  userCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  userType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuresCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  featureButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  schemaCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  schemaText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});