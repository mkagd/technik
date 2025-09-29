/**
 * DASHBOARD SERWISANTA
 * 
 * Główny ekran dla serwisantów mobilnych
 * - Lista wizyt
 * - Aktywne zlecenia  
 * - GPS tracking
 * - Szybkie akcje
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';

import {
  SERVICEMAN_ENUMS,
  ServicemanHelpers,
  generateVisitNumber
} from '../shared';

const { width } = Dimensions.get('window');

export default function ServicemanDashboard({ user, onLogout }) {
  const [visits, setVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadVisits();
    getCurrentLocation();
  }, []);

  /**
   * Załaduj wizyty serwisanta
   */
  const loadVisits = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - w rzeczywistości z API
      const mockVisits = [
        {
          id: 1,
          visitNumber: 'VIS-2024-001',
          clientName: 'Szkoła Podstawowa Nr 5',
          clientAddress: 'ul. Szkolna 15, Kraków',
          scheduledDate: '2024-12-27T09:00:00Z',
          status: 'scheduled',
          visitType: 'routine',
          ordersCount: 3,
          completedOrders: 0,
          estimatedDuration: 180
        },
        {
          id: 2,
          visitNumber: 'VIS-2024-002',
          clientName: 'Biuro Rachunkowe CONTA',
          clientAddress: 'ul. Krakowska 25/3, Kraków',
          scheduledDate: '2024-12-28T10:00:00Z',
          status: 'scheduled',
          visitType: 'maintenance',
          ordersCount: 2,
          completedOrders: 0,
          estimatedDuration: 120
        }
      ];
      
      setVisits(mockVisits);
      
    } catch (error) {
      console.error('Błąd ładowania wizyt:', error);
      Alert.alert('Błąd', 'Nie udało się załadować wizyt');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Pobierz aktualną lokalizację
   */
  const getCurrentLocation = () => {
    // Mock lokalizacja - w rzeczywistości z expo-location
    setLocation({
      lat: 50.0647,
      lng: 19.9450,
      accuracy: 10
    });
  };

  /**
   * Rozpocznij wizytę
   */
  const startVisit = async (visit) => {
    try {
      Alert.alert(
        'Rozpocząć wizytę?',
        `${visit.clientName}\n${visit.clientAddress}`,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Rozpocznij',
            onPress: async () => {
              // Sprawdź odległość
              if (location && visit.coordinates) {
                const distance = ServicemanHelpers.calculateDistance(
                  location.lat, location.lng,
                  visit.coordinates.lat, visit.coordinates.lng
                );
                
                if (distance > 0.5) {
                  Alert.alert(
                    'Za daleko!',
                    `Jesteś ${distance.toFixed(1)}km od klienta. Zbliż się żeby rozpocząć wizytę.`
                  );
                  return;
                }
              }
              
              // Rozpocznij wizytę
              const updatedVisit = {
                ...visit,
                status: 'in_transit',
                actualStartTime: new Date().toISOString()
              };
              
              setActiveVisit(updatedVisit);
              
              // Aktualizuj listę wizyt
              setVisits(prevVisits => 
                prevVisits.map(v => 
                  v.id === visit.id ? updatedVisit : v
                )
              );
              
              Alert.alert('Sukces', 'Wizyta rozpoczęta! GPS tracking aktywny.');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Błąd rozpoczynania wizyty:', error);
      Alert.alert('Błąd', 'Nie udało się rozpocząć wizyty');
    }
  };

  /**
   * Potwierdź dotarcie na miejsce
   */
  const arriveAtSite = async () => {
    if (!activeVisit) return;
    
    try {
      const updatedVisit = {
        ...activeVisit,
        status: 'on_site'
      };
      
      setActiveVisit(updatedVisit);
      
      setVisits(prevVisits => 
        prevVisits.map(v => 
          v.id === activeVisit.id ? updatedVisit : v
        )
      );
      
      Alert.alert('Potwierdzono', 'Dotarłeś na miejsce. Możesz rozpocząć zlecenia.');
      
    } catch (error) {
      console.error('Błąd potwierdzania dotarcia:', error);
    }
  };

  /**
   * Renderuj kartę wizyty
   */
  const renderVisitCard = (visit) => {
    const statusInfo = SERVICEMAN_ENUMS.VISIT_STATUS[visit.status.toUpperCase()];
    const typeInfo = SERVICEMAN_ENUMS.VISIT_TYPE[visit.visitType.toUpperCase()];
    
    return (
      <View key={visit.id} style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Text style={styles.visitNumber}>{visit.visitNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo?.color || '#6b7280' }]}>
            <Text style={styles.statusText}>{statusInfo?.label || visit.status}</Text>
          </View>
        </View>
        
        <Text style={styles.clientName}>{visit.clientName}</Text>
        <Text style={styles.clientAddress}>{visit.clientAddress}</Text>
        
        <View style={styles.visitDetails}>
          <Text style={styles.detailText}>
            📅 {new Date(visit.scheduledDate).toLocaleString('pl-PL')}
          </Text>
          <Text style={styles.detailText}>
            🏷️ {typeInfo?.label || visit.visitType}
          </Text>
          <Text style={styles.detailText}>
            📝 Zlecenia: {visit.completedOrders}/{visit.ordersCount}
          </Text>
          <Text style={styles.detailText}>
            ⏱️ ~{visit.estimatedDuration} min
          </Text>
        </View>
        
        {visit.status === 'scheduled' && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => startVisit(visit)}
          >
            <Text style={styles.startButtonText}>🚗 Rozpocznij wizytę</Text>
          </TouchableOpacity>
        )}
        
        {visit.status === 'in_transit' && visit.id === activeVisit?.id && (
          <TouchableOpacity 
            style={styles.arriveButton}
            onPress={arriveAtSite}
          >
            <Text style={styles.arriveButtonText}>📍 Dotarłem na miejsce</Text>
          </TouchableOpacity>
        )}
        
        {visit.status === 'on_site' && (
          <TouchableOpacity 
            style={styles.ordersButton}
            onPress={() => Alert.alert('Demo', 'Przejście do listy zleceń')}
          >
            <Text style={styles.ordersButtonText}>📋 Zobacz zlecenia</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Serwisanta</Text>
          <Text style={styles.headerSubtitle}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      {/* Active Visit Status */}
      {activeVisit && (
        <View style={styles.activeVisitBar}>
          <Text style={styles.activeVisitText}>
            🔴 Aktywna wizyta: {activeVisit.visitNumber}
          </Text>
          <Text style={styles.activeVisitStatus}>
            Status: {SERVICEMAN_ENUMS.VISIT_STATUS[activeVisit.status.toUpperCase()]?.label}
          </Text>
        </View>
      )}

      {/* Location Status */}
      {location && (
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>
            📍 GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (±{location.accuracy}m)
          </Text>
        </View>
      )}

      {/* Visits List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadVisits} />
        }
      >
        <Text style={styles.sectionTitle}>Dzisiejsze wizyty</Text>
        
        {visits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🎉 Brak wizyt na dziś!</Text>
          </View>
        ) : (
          visits.map(renderVisitCard)
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Demo', 'Funkcja raportowania problemu')}
          >
            <Text style={styles.actionButtonText}>🚨 Zgłoś problem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Demo', 'Historia wizyt serwisanta')}
          >
            <Text style={styles.actionButtonText}>📊 Historia wizyt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Demo', 'Mapa z lokalizacjami klientów')}
          >
            <Text style={styles.actionButtonText}>🗺️ Mapa klientów</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  activeVisitBar: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  activeVisitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  activeVisitStatus: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 2,
  },
  locationBar: {
    backgroundColor: '#dcfce7',
    padding: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 15,
    marginBottom: 10,
  },
  visitCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  visitNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  clientAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  visitDetails: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 3,
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  arriveButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  arriveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ordersButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ordersButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  quickActions: {
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});