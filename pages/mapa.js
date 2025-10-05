// pages/mapa.js

import { useEffect, useState, useRef, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { FiMapPin, FiPhone, FiClock, FiUser, FiTool, FiNavigation, FiFilter, FiRefreshCw, FiSettings } from 'react-icons/fi';
import ModelAIScanner from '../components/ModelAIScanner';
import { formatAddress } from '../utils/formatAddress';

// Funkcje pomocnicze
const getMarkerColor = (status) => {
  switch (status) {
    case 'pending': return '#9333ea'; // fioletowy - zgłoszenia oczekujące
    case 'urgent': return '#dc2626'; // czerwony - pilne zgłoszenia
    case 'scheduled': return '#3b82f6'; // niebieski - zaplanowane
    case 'confirmed': return '#10b981'; // zielony - potwierdzone
    case 'in_progress': return '#f59e0b'; // pomarańczowy - w trakcie
    case 'completed': return '#6b7280'; // szary - zakończone
    case 'cancelled': return '#ef4444'; // czerwony - anulowane
    default: return '#3b82f6';
  }
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'pending': return '#9333ea'; // fioletowy - zgłoszenia oczekujące
    case 'urgent': return '#dc2626'; // czerwony - pilne zgłoszenia
    case 'scheduled': return '#3b82f6'; // niebieski - zaplanowane
    case 'confirmed': return '#10b981'; // zielony - potwierdzone
    case 'in_progress': return '#f59e0b'; // pomarańczowy - w trakcie
    case 'completed': return '#6b7280'; // szary - zakończone
    case 'cancelled': return '#ef4444'; // czerwony - anulowane
    default: return '#3b82f6';
  }
};

const createInfoWindowContent = (client) => {
  const statusText = {
    'pending': 'Zgłoszenie oczekujące',
    'urgent': 'Pilne zgłoszenie',
    'scheduled': 'Zaplanowane',
    'confirmed': 'Potwierdzone',
    'in_progress': 'W trakcie',
    'completed': 'Zakończone',
    'cancelled': 'Anulowane'
  };

  const priorityText = {
    'urgent': 'Pilne',
    'high': 'Wysoki',
    'normal': 'Normalny',
    'low': 'Niski'
  };

  return `
    <div style="max-width: 300px; padding: 12px;">
      <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">
        ${client.clientName}
      </div>
      
      <div style="margin-bottom: 6px;">
        <span style="color: #3b82f6;">📞</span>
        <span style="margin-left: 8px;">${client.clientPhone}</span>
      </div>
      
      <div style="margin-bottom: 6px;">
        <span style="color: #10b981;">📍</span>
        <span style="margin-left: 8px;">${typeof client.address === 'object' ? formatAddress(client.address) : client.address}</span>
      </div>
      
      <div style="margin-bottom: 6px;">
        <span style="color: #f59e0b;">🔧</span>
        <span style="margin-left: 8px;">${client.serviceType}</span>
      </div>
      
      ${client.deviceType ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #8b5cf6;">📱</span>
          <span style="margin-left: 8px;">${client.deviceType}</span>
        </div>
      ` : ''}
      
      ${client.scheduledDate ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #ec4899;">🕐</span>
          <span style="margin-left: 8px;">
            ${new Date(client.scheduledDate).toLocaleDateString('pl-PL')}
            ${client.scheduledTime ? ` o ${client.scheduledTime}` : ''}
          </span>
        </div>
      ` : ''}
      
      ${client.reportDate ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #8b5cf6;">📋</span>
          <span style="margin-left: 8px;">
            Zgłoszenie: ${new Date(client.reportDate).toLocaleDateString('pl-PL')}
          </span>
        </div>
      ` : ''}
      
      ${client.availableHours ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #059669;">⏰</span>
          <span style="margin-left: 8px;">
            Dostępność: ${client.availableHours}
          </span>
        </div>
      ` : ''}
      
      ${client.contactPreference ? `
        <div style="margin-bottom: 6px;">
          <span style="color: #dc2626;">${client.contactPreference === 'phone' ? '📞' : '📧'}</span>
          <span style="margin-left: 8px;">
            Preferowany kontakt: ${client.contactPreference === 'phone' ? 'telefon' : 'email'}
          </span>
        </div>
      ` : ''}
      
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <span style="display: inline-block; padding: 4px 8px; background-color: ${getStatusBadgeColor(client.status)}; color: white; border-radius: 12px; font-size: 12px;">
          ${statusText[client.status] || client.status}
        </span>
        
        ${client.priority && client.priority !== 'normal' ? `
          <span style="display: inline-block; margin-left: 8px; padding: 4px 8px; background-color: ${client.priority === 'urgent' ? '#ef4444' : '#f59e0b'}; color: white; border-radius: 12px; font-size: 12px;">
            ${priorityText[client.priority]}
          </span>
        ` : ''}
      </div>
      
      ${client.description ? `
        <div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 6px; font-size: 14px;">
          <strong>Opis:</strong> ${client.description}
        </div>
      ` : ''}
      
      <div style="margin-top: 12px; text-align: center;">
        <a href="tel:${client.clientPhone}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          📞 Zadzwoń
        </a>
        <a href="https://maps.google.com/maps?daddr=${encodeURIComponent(typeof client.address === 'object' ? formatAddress(client.address) : client.address)}" target="_blank" style="display: inline-block; margin-left: 8px; padding: 8px 16px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          🗺️ Nawiguj
        </a>
        ${(client.status === 'pending' || client.status === 'urgent') ? `
          <div style="margin-top: 8px;">
            <button style="display: inline-block; padding: 6px 12px; background-color: #9333ea; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
              📋 Zaplanuj wizytę
            </button>
            <button style="display: inline-block; margin-left: 4px; padding: 6px 12px; background-color: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
              ✅ Oznacz jako pilne
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

// Komponent Google Maps
function GoogleMapComponent({ center, zoom, clients, onMarkerClick }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const infoWindow = useRef(null);

  // Inicjalizacja mapy
  useEffect(() => {
    if (mapRef.current && !map.current && window.google && window.google.maps) {
      map.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Inicjalizacja InfoWindow
      infoWindow.current = new window.google.maps.InfoWindow();
    }
  }, [center, zoom]);

  // Aktualizacja markerów
  useEffect(() => {
    if (!map.current || !window.google || !window.google.maps) return;

    // Usuń stare markery
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    // Dodaj nowe markery
    clients.forEach(client => {
      if (!client.lat || !client.lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: client.lat, lng: client.lng },
        map: map.current,
        title: client.clientName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: client.priority === 'urgent' ? 12 : client.priority === 'high' ? 10 : 8,
          fillColor: getMarkerColor(client.status),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: (client.status === 'in_progress' || client.status === 'urgent') ? window.google.maps.Animation.BOUNCE : null
      });

      // Event listener dla kliknięcia
      marker.addListener('click', () => {
        const content = createInfoWindowContent(client);
        infoWindow.current.setContent(content);
        infoWindow.current.open(map.current, marker);

        if (onMarkerClick) {
          onMarkerClick(client);
        }
      });

      markers.current.push(marker);
    });

    // Dopasuj widok do markerów
    if (clients.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      clients.forEach(client => {
        if (client.lat && client.lng) {
          bounds.extend({ lat: client.lat, lng: client.lng });
        }
      });

      if (clients.length === 1) {
        map.current.setCenter({ lat: clients[0].lat, lng: clients[0].lng });
        map.current.setZoom(15);
      } else {
        map.current.fitBounds(bounds);
      }
    }
  }, [clients, onMarkerClick]);

  return <div ref={mapRef} className="w-full h-full" />;
}

export default function MapaKlientow() {
  const [clientsData, setClientsData] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 52.2297, lng: 21.0122 }); // Warszawa
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataCount, setDataCount] = useState(0);
  const [newDataAlert, setNewDataAlert] = useState(false);

  // Stan dla geokodowania adresów
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Stany dla listy klientów i sortowania
  const [showClientsList, setShowClientsList] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'status', 'priority', 'address'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'urgent', 'high', 'normal', 'low'

  // Stany dla modala dodawania klienta
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    street: '',
    serviceType: '',
    device: '',
    problem: '',
    availability: '', // Add availability field
    priority: 'normal',
    status: 'pending'
  });

  // Stany dla AI Scanner
  const [showAIScanner, setShowAIScanner] = useState(false);

  useEffect(() => {
    loadClientsData();

    // Auto-refresh co 30 sekund
    const interval = setInterval(() => {
      loadClientsData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientsData, filter, searchTerm, sortBy, sortOrder, priorityFilter]);

  const loadClientsData = async () => {
    setLoading(true);
    console.log('🔄 Rozpoczynam ładowanie danych klientów...');

    try {
      // Załaduj dane z różnych źródeł - ale skupimy się głównie na rezerwacjach z formularza
      console.log('📊 Ładowanie danych ze źródeł...');

      const sources = [
        loadFromHarmonogram(),      // Na razie puste - przyszłe harmonogramy
        loadFromRezerwacje(),       // GŁÓWNE ŹRÓDŁO - zgłoszenia z formularza
        loadFromHistoriaNapraw(),   // Na razie puste - przyszłe historie
        loadFromZgloszenia()        // Na razie puste - przyszłe dodatkowe zgłoszenia
      ];

      const allData = await Promise.all(sources);
      console.log('📥 Otrzymane dane ze wszystkich źródeł:', allData);

      const combinedData = allData.flat().filter(Boolean);
      console.log('📋 Połączone dane (po usunięciu null/undefined):', combinedData);

      // Usuń duplikaty na podstawie telefonu lub email
      const uniqueClients = removeDuplicates(combinedData);
      console.log('👥 Unikalni klienci (po usunięciu duplikatów):', uniqueClients);
      console.log(`📈 Statystyki: ${uniqueClients.length} unikalnych klientów z ${combinedData.length} rekordów`);

      // Sprawdź czy są nowe dane
      if (dataCount > 0 && uniqueClients.length > dataCount) {
        console.log('🆕 Wykryto nowe zgłoszenia!');
        setNewDataAlert(true);
        setTimeout(() => setNewDataAlert(false), 5000);
      }

      if (uniqueClients.length === 0) {
        console.log('ℹ️ Brak zgłoszeń do wyświetlenia');
        console.log('💡 Wskazówka: Wypełnij formularz na /rezerwacja aby dodać zgłoszenie');
      }

      setClientsData(uniqueClients);
      setDataCount(uniqueClients.length);

      // Geokoduj adresy jeśli nie mają współrzędnych
      await geocodeAddresses(uniqueClients);

      // Ustaw czas ostatniej aktualizacji
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Błąd ładowania danych klientów:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ładowanie danych z harmonogramu admina
  const loadFromHarmonogram = () => {
    try {
      console.log('📅 Sprawdzanie harmonogramu...');
      // Funkcja zarezerwowana na przyszłe dane z harmonogramu admina
      // Na razie zwracamy pustą tablicę, żeby skupić się na zgłoszeniach z formularza
      return [];
    } catch (error) {
      console.error('Błąd ładowania danych z harmonogramu:', error);
      return [];
    }
  };

  // Ładowanie danych z API rezerwacji
  const loadFromRezerwacje = async () => {
    try {
      console.log('🔄 Ładowanie danych z API rezerwacji...');
      const response = await fetch('/api/rezerwacje');
      if (!response.ok) {
        console.warn('❌ API rezerwacji niedostępne (status:', response.status, ')');
        console.warn('🔍 Sprawdź czy serwer jest uruchomiony i endpoint działa');
        return [];
      }

      const responseData = await response.json();
      console.log('📥 Otrzymane dane z API rezerwacji:', responseData);

      if (!responseData || (!responseData.rezerwacje && !Array.isArray(responseData))) {
        console.warn('⚠️ API zwróciło puste dane lub nieprawidłowy format');
        return [];
      }

      const reservations = responseData.rezerwacje || responseData;

      if (!Array.isArray(reservations) || reservations.length === 0) {
        console.log('ℹ️ Brak zgłoszeń w bazie danych - to normalne dla nowej aplikacji');
        return [];
      }

      const mappedData = reservations.map(reservation => {
        console.log('📝 Mapowanie rekordu:', reservation);

        return {
          // Użyj właściwych nazw pól z API
          clientName: reservation.clientName || reservation.name || 'Nieznany klient',
          clientPhone: reservation.clientPhone || reservation.phone || 'Brak telefonu',
          address: reservation.address || `${reservation.street || ''}, ${reservation.city || ''}`.trim() || 'Adres do uzupełnienia',
          serviceType: reservation.serviceType || reservation.category || reservation.device || 'Serwis ogólny',
          deviceType: reservation.device || reservation.deviceType || 'Nie podano',
          scheduledDate: reservation.scheduledDate || reservation.date,
          scheduledTime: reservation.scheduledTime || reservation.time,
          status: reservation.status || 'pending',  // nowe rezerwacje są zgłoszeniami oczekującymi
          priority: reservation.priority || 'normal',
          description: reservation.description || reservation.problem || 'Brak opisu',
          reportDate: reservation.created_at || reservation.date,  // data zgłoszenia
          contactPreference: reservation.email ? 'email' : 'phone',
          availableHours: reservation.availability || 'do uzgodnienia', // Use actual availability from form
          id: reservation.id,
          email: reservation.email
        };
      });

      console.log('✅ Zmapowane dane z rzeczywistych rezerwacji:', mappedData);
      console.log(`📊 Znaleziono ${mappedData.length} zgłoszeń z formularza`);
      return mappedData;
    } catch (error) {
      console.error('❌ Błąd ładowania rezerwacji z API:', error);
      console.error('🔍 Sprawdź czy serwer działa i endpoint /api/rezerwacje jest dostępny');
      return [];
    }
  };

  // Ładowanie danych z historii napraw
  const loadFromHistoriaNapraw = () => {
    try {
      console.log('📝 Sprawdzanie historii napraw...');
      // Funkcja zarezerwowana na przyszłe dane z historii napraw
      // Na razie zwracamy pustą tablicę, żeby skupić się na nowych zgłoszeniach
      return [];
    } catch (error) {
      console.error('Błąd ładowania historii napraw:', error);
      return [];
    }
  };

  // Ładowanie zgłoszeń klientów - główne źródło danych z formularza
  const loadFromZgloszenia = () => {
    try {
      console.log('📩 Sprawdzanie dodatkowych zgłoszeń...');
      // Ta funkcja jest zarezerwowana na przyszłe dodatkowe źródła zgłoszeń
      // Główne zgłoszenia pochodzą teraz z API rezerwacji
      return [];
    } catch (error) {
      console.error('Błąd ładowania zgłoszeń:', error);
      return [];
    }
  };

  // Usuwanie duplikatów na podstawie telefonu
  const removeDuplicates = (data) => {
    const seen = new Set();
    return data.filter(item => {
      const key = item.clientPhone;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Geokodowanie adresów za pomocą Google Maps Geocoding API
  const geocodeAddresses = async (clients) => {
    setIsGeocoding(true);
    setGeocodingProgress(0);

    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API nie jest jeszcze załadowane, pomijam geokodowanie');
      setIsGeocoding(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const updatedClients = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      // Jeśli już ma współrzędne, dodaj bez zmian
      if (client.lat && client.lng) {
        updatedClients.push(client);
        setGeocodingProgress(((i + 1) / clients.length) * 100);
        continue;
      }

      try {
        const addressString = typeof client.address === 'object' ? formatAddress(client.address) : client.address;
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: addressString }, (results, status) => {
            if (status === 'OK') {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        if (result && result[0]) {
          const location = result[0].geometry.location;
          updatedClients.push({
            ...client,
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          // Jeśli geokodowanie się nie udało, dodaj z domyślną lokalizacją (centrum Warszawy)
          updatedClients.push({
            ...client,
            lat: 52.2297,
            lng: 21.0122
          });
        }
      } catch (error) {
        const addressString = typeof client.address === 'object' ? formatAddress(client.address) : client.address;
        console.error(`Błąd geokodowania dla adresu ${addressString}:`, error);
        // Dodaj z domyślną lokalizacją
        updatedClients.push({
          ...client,
          lat: 52.2297,
          lng: 21.0122
        });
      }

      setGeocodingProgress(((i + 1) / clients.length) * 100);

      // Pauza między zapytaniami, żeby nie przekroczyć limitów API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setClientsData(updatedClients);
    setIsGeocoding(false);
  };

  const applyFilters = () => {
    let filtered = [...clientsData];

    // Filtr statusu
    if (filter !== 'all') {
      filtered = filtered.filter(client => client.status === filter);
    }

    // Filtr priorytetu
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(client => client.priority === priorityFilter);
    }

    // Filtr wyszukiwania
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client => {
        const addressString = typeof client.address === 'object' ? formatAddress(client.address) : client.address;
        return client.clientName.toLowerCase().includes(term) ||
          client.clientPhone.includes(term) ||
          addressString.toLowerCase().includes(term) ||
          client.serviceType.toLowerCase().includes(term) ||
          client.deviceType?.toLowerCase().includes(term);
      });
    }

    // Sortowanie
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.scheduledDate || a.reportDate || a.created_at || '1970-01-01');
          bValue = new Date(b.scheduledDate || b.reportDate || b.created_at || '1970-01-01');
          break;
        case 'status':
          const statusOrder = { 'urgent': 0, 'pending': 1, 'scheduled': 2, 'confirmed': 3, 'in_progress': 4, 'completed': 5, 'cancelled': 6 };
          aValue = statusOrder[a.status] || 999;
          bValue = statusOrder[b.status] || 999;
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2, 'low': 3 };
          aValue = priorityOrder[a.priority] || 999;
          bValue = priorityOrder[b.priority] || 999;
          break;
        case 'address':
          aValue = a.address.toLowerCase();
          bValue = b.address.toLowerCase();
          break;
        case 'service':
          aValue = a.serviceType.toLowerCase();
          bValue = b.serviceType.toLowerCase();
          break;
        default:
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredClients(filtered);
  };

  const handleMarkerClick = useCallback((client) => {
    setSelectedClient(client);
  }, []);

  const handleRefresh = () => {
    loadClientsData();
  };

  // Funkcje pomocnicze dla listy klientów
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const focusOnClient = (client) => {
    if (client.lat && client.lng) {
      setMapCenter({ lat: client.lat, lng: client.lng });
      setSelectedClient(client);
      setShowClientsList(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '🟣';
      case 'urgent': return '🔴';
      case 'scheduled': return '🔵';
      case 'confirmed': return '🟢';
      case 'in_progress': return '🟡';
      case 'completed': return '⚪';
      case 'cancelled': return '❌';
      default: return '⚫';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚡';
      case 'normal': return '📋';
      case 'low': return '📝';
      default: return '📋';
    }
  };

  const getSortIcon = (column) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? '↗️' : '↘️';
    }
    return '';
  };

  // Funkcje obsługi modala dodawania klienta
  const handleNewClientChange = (field, value) => {
    setNewClientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler dla AI Scanner - wypełnia pole device
  const handleAIModelDetected = (models) => {
    console.log('🔍 handleAIModelDetected - models:', models);
    
    if (!models || models.length === 0) {
      alert('❌ Nie wykryto modelu na tabliczce');
      setShowAIScanner(false);
      return;
    }

    const detectedModel = models[0];
    
    // Walidacja modelu
    if (!detectedModel || typeof detectedModel !== 'object') {
      console.error('❌ Nieprawidłowy format modelu:', detectedModel);
      alert('❌ Błąd: Nieprawidłowe dane z skanera');
      setShowAIScanner(false);
      return;
    }

    const deviceInfo = {
      brand: detectedModel.brand || '',
      model: detectedModel.model || detectedModel.finalModel || '',
      type: detectedModel.type || detectedModel.finalType || '',
    };

    // Sprawdź czy wykryto przynajmniej markę lub model
    if (!deviceInfo.brand && !deviceInfo.model) {
      alert('❌ Nie udało się rozpoznać marki ani modelu');
      setShowAIScanner(false);
      return;
    }

    // Aktualizuj pole device - połącz markę, model i typ
    const deviceString = `${deviceInfo.brand} ${deviceInfo.model}${deviceInfo.type ? ` (${deviceInfo.type})` : ''}`.trim();
    
    setNewClientForm(prev => ({
      ...prev,
      device: deviceString
    }));

    alert(`✅ Rozpoznano:\n${deviceInfo.brand} ${deviceInfo.model}\nTyp: ${deviceInfo.type}`);
    setShowAIScanner(false);
  };

  const resetNewClientForm = () => {
    setNewClientForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      street: '',
      serviceType: '',
      device: '',
      problem: '',
      availability: '', // Add availability field
      priority: 'normal',
      status: 'pending'
    });
  };

  const handleAddClient = async () => {
    console.log('🎯 handleAddClient started');

    // Walidacja podstawowych danych
    if (!newClientForm.name || !newClientForm.phone) {
      alert('Proszę wypełnić nazwę i telefon klienta');
      return;
    }

    // Przygotowanie adresu
    const fullAddress = newClientForm.address ||
      (newClientForm.street && newClientForm.city ? `${newClientForm.street}, ${newClientForm.city}` : '');

    if (!fullAddress) {
      alert('Proszę podać adres klienta');
      return;
    }

    console.log('✅ Walidacja przeszła');

    try {
      console.log('📝 Dodawanie nowego klienta...');
      console.log('📊 Dane do wysłania:', {
        name: newClientForm.name,
        phone: newClientForm.phone,
        email: newClientForm.email,
        address: fullAddress,
        category: newClientForm.serviceType || 'serwis',
        device: newClientForm.device || 'Nie określono'
      });

      console.log('🌐 Sprawdzenie czy serwer działa...');

      // Najpierw sprawdź czy serwer w ogóle odpowiada
      let serverTest;
      try {
        serverTest = await fetch('/api/rezerwacje');
        console.log('🚦 Test serwera - status:', serverTest.status);
      } catch (testError) {
        console.error('❌ Serwer nie odpowiada:', testError);
        alert('Błąd: Serwer Next.js nie działa. Uruchom "npm run dev" w terminalu.');
        return;
      }

      // Wyślij dane do API rezerwacji (które automatycznie stworzy klienta i zamówienie)
      const response = await fetch('/api/rezerwacje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClientForm.name,
          phone: newClientForm.phone,
          email: newClientForm.email,
          address: fullAddress,
          city: newClientForm.city,
          street: newClientForm.street,
          category: newClientForm.serviceType || 'serwis',
          device: newClientForm.device || 'Nie określono',
          problem: newClientForm.problem || 'Brak opisu',
          availability: newClientForm.availability || 'Nie określono', // Add availability
          date: new Date().toISOString(),
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Odpowiedź serwera:', responseData);

        resetNewClientForm();
        setShowAddClientModal(false);

        // Odśwież dane na mapie
        console.log('🔄 Odświeżanie danych na mapie...');
        await loadClientsData();

        alert('✅ Klient został dodany pomyślnie!');
      } else {
        let errorMessage = 'Nieznany błąd';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || 'Nie udało się dodać klienta';
          console.error('❌ Błąd API:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = `HTTP ${response.status}: ${errorText}`;
          console.error('❌ Błąd parsowania odpowiedzi:', parseError);
          console.error('❌ Raw response:', errorText);
        }
        alert(`❌ Błąd dodawania klienta: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Błąd komunikacji z serwerem:', error);
      alert(`❌ Błąd komunikacji z serwerem: ${error.message}`);
    }
  };

  const render = (status) => {
    if (status === 'LOADING') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Ładowanie mapy Google...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Błąd ładowania mapy</p>
            <p className="text-sm">Sprawdź klucz API Google Maps</p>
          </div>
        </div>
      );
    }

    return (
      <GoogleMapComponent
        center={mapCenter}
        zoom={12}
        clients={filteredClients}
        onMarkerClick={handleMarkerClick}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Ładowanie mapy klientów...</h2>
          <p className="text-gray-500">Pobieranie danych i geokodowanie adresów</p>
          {isGeocoding && (
            <div className="mt-4">
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${geocodingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Geokodowanie adresów... {Math.round(geocodingProgress)}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notification for new data */}
      {newDataAlert && (
        <div className="bg-green-500 text-white px-4 py-2 text-center animate-pulse">
          <span className="font-medium">🎉 Nowe zgłoszenia zostały dodane do mapy!</span>
        </div>
      )}

      {/* Nagłówek */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa Klientów</h1>
            <p className="text-gray-600">
              Wyświetlono {filteredClients.length} z {clientsData.length} klientów
            </p>
          </div>

          {/* Statystyki statusów */}
          <div className="hidden lg:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 rounded-full">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>{filteredClients.filter(c => c.status === 'pending').length} oczekujące</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{filteredClients.filter(c => c.status === 'urgent').length} pilne</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{filteredClients.filter(c => c.status === 'scheduled').length} zaplanowane</span>
            </div>
          </div>

          {/* Kontrolki */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Wyszukiwarka */}
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj klientów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Filtr statusu */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="pending">🟣 Zgłoszenia oczekujące</option>
              <option value="urgent">🔴 Pilne zgłoszenia</option>
              <option value="scheduled">🔵 Zaplanowane</option>
              <option value="confirmed">🟢 Potwierdzone</option>
              <option value="in_progress">🟡 W trakcie</option>
              <option value="completed">⚪ Zakończone</option>
              <option value="cancelled">🔴 Anulowane</option>
            </select>

            {/* Filtr priorytetu */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Wszystkie priorytety</option>
              <option value="urgent">🚨 Pilne</option>
              <option value="high">⚡ Wysokie</option>
              <option value="normal">📋 Normalne</option>
              <option value="low">📝 Niskie</option>
            </select>

            {/* Sortowanie */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">📝 Sortuj po nazwie</option>
              <option value="date">📅 Sortuj po dacie</option>
              <option value="status">📊 Sortuj po statusie</option>
              <option value="priority">⚡ Sortuj po priorytecie</option>
              <option value="address">📍 Sortuj po adresie</option>
              <option value="service">🔧 Sortuj po usłudze</option>
            </select>

            {/* Kierunek sortowania */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title={`Sortowanie ${sortOrder === 'asc' ? 'rosnące' : 'malejące'}`}
            >
              {sortOrder === 'asc' ? '↗️' : '↘️'}
            </button>

            {/* Przycisk listy klientów */}
            <button
              onClick={() => setShowClientsList(!showClientsList)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${showClientsList
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
            >
              <FiFilter className="h-4 w-4 mr-2" />
              {showClientsList ? 'Ukryj listę' : 'Pokaż listę'}
            </button>

            {/* Przycisk dodawania klienta */}
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Dodaj nowego klienta"
            >
              <FiUser className="h-4 w-4 mr-2" />
              Dodaj klienta
            </button>

            {/* Przycisk odświeżania i status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Odśwież
              </button>
              {lastUpdated && (
                <div className="text-sm text-gray-600">
                  Ostatnia aktualizacja: {lastUpdated.toLocaleTimeString()}
                  <div className="text-xs text-gray-500">
                    Auto-odświeżanie co 30s
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista klientów (rozwijana) */}
      {showClientsList && (
        <div className="bg-white border-t border-gray-200 shadow-lg max-h-96 overflow-y-auto z-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Lista klientów ({filteredClients.length})
              </h3>
              <div className="text-sm text-gray-500">
                Sortowanie: {sortBy} {sortOrder === 'asc' ? '↗️' : '↘️'}
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>Brak klientów do wyświetlenia</p>
                <p className="text-sm">Sprawdź filtry lub dodaj nowe zgłoszenia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client, index) => (
                  <div
                    key={client.id || index}
                    onClick={() => focusOnClient(client)}
                    className="client-list-item p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{getStatusIcon(client.status)}</span>
                          <h4 className="font-medium text-gray-900">{client.clientName}</h4>
                          {client.priority === 'urgent' && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              PILNE
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiPhone className="h-3 w-3 mr-2" />
                            <span>{client.clientPhone}</span>
                          </div>
                          <div className="flex items-center">
                            <FiMapPin className="h-3 w-3 mr-2" />
                            <span className="truncate">{typeof client.address === 'object' ? formatAddress(client.address) : client.address}</span>
                          </div>
                          <div className="flex items-center">
                            <FiTool className="h-3 w-3 mr-2" />
                            <span>{client.serviceType}</span>
                          </div>
                          {client.scheduledDate && (
                            <div className="flex items-center">
                              <FiClock className="h-3 w-3 mr-2" />
                              <span>
                                {new Date(client.scheduledDate).toLocaleDateString('pl-PL')}
                                {client.scheduledTime && ` o ${client.scheduledTime}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-3 flex flex-col items-end">
                        <div
                          className="w-4 h-4 rounded-full mb-2"
                          style={{ backgroundColor: getMarkerColor(client.status) }}
                          title={client.status}
                        ></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            focusOnClient(client);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        >
                          <FiNavigation className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Dodatkowe informacje */}
                    {client.description && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {client.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Szybkie statystyki */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-purple-600">
                    {filteredClients.filter(c => c.status === 'pending').length}
                  </div>
                  <div className="text-gray-500">Oczekujące</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">
                    {filteredClients.filter(c => c.priority === 'urgent').length}
                  </div>
                  <div className="text-gray-500">Pilne</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">
                    {filteredClients.filter(c => c.status === 'confirmed').length}
                  </div>
                  <div className="text-gray-500">Potwierdzone</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-600">
                    {filteredClients.filter(c => c.status === 'in_progress').length}
                  </div>
                  <div className="text-gray-500">W realizacji</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="flex-1 relative">
        {filteredClients.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Brak zgłoszeń na mapie
              </h3>
              <p className="text-gray-600 mb-4">
                Nie znaleziono żadnych zgłoszeń serwisowych. Możliwe przyczyny:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
                <li>• Nie wypełniono jeszcze żadnych formularzy</li>
                <li>• Problem z połączeniem z API</li>
                <li>• Dane są filtrowane i nie ma wyników</li>
              </ul>
              <div className="space-y-3">
                <a
                  href="/rezerwacja"
                  className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📝 Dodaj pierwsze zgłoszenie
                </a>
                <button
                  onClick={handleRefresh}
                  className="block w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔄 Odśwież dane
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Wrapper
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key'}
            render={render}
            libraries={['geometry', 'places']}
          />
        )}

        {/* Panel informacji o wybranym kliencie */}
        {selectedClient && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">{selectedClient.clientName}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <FiPhone className="h-4 w-4 mr-2 text-blue-500" />
                <span>{selectedClient.clientPhone}</span>
              </div>
              <div className="flex items-center">
                <FiMapPin className="h-4 w-4 mr-2 text-green-500" />
                <span>{typeof selectedClient.address === 'object' ? formatAddress(selectedClient.address) : selectedClient.address}</span>
              </div>
              <div className="flex items-center">
                <FiTool className="h-4 w-4 mr-2 text-orange-500" />
                <span>{selectedClient.serviceType}</span>
              </div>
              {selectedClient.availableHours && selectedClient.availableHours !== 'do uzgodnienia' && (
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 mr-2 text-green-600" />
                  <span>
                    <strong>Dostępność:</strong> {selectedClient.availableHours}
                  </span>
                </div>
              )}
              {selectedClient.scheduledDate && (
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 mr-2 text-purple-500" />
                  <span>
                    {new Date(selectedClient.scheduledDate).toLocaleDateString('pl-PL')}
                    {selectedClient.scheduledTime && ` o ${selectedClient.scheduledTime}`}
                  </span>
                </div>
              )}
              {selectedClient.description && selectedClient.description !== 'Brak opisu' && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">Problem:</div>
                  <div className="text-sm text-gray-800">{selectedClient.description}</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex space-x-2">
              <a
                href={`tel:${selectedClient.clientPhone}`}
                className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📞 Zadzwoń
              </a>
              <a
                href={`https://maps.google.com/maps?daddr=${encodeURIComponent(typeof selectedClient.address === 'object' ? formatAddress(selectedClient.address) : selectedClient.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
              >
                🗺️ Nawiguj
              </a>
            </div>
          </div>
        )}

        {/* Legenda */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-semibold text-gray-900 mb-2">Legenda</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-600 rounded-full mr-2"></div>
              <span>Zgłoszenia oczekujące</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
              <span>Pilne zgłoszenia</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>Zaplanowane</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Potwierdzone</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span>W trakcie</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
              <span>Zakończone</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              💫 Animowane - w trakcie realizacji<br />
              🆕 Zgłoszenia wymagają odpowiedzi
            </div>
          </div>
        </div>
      </div>

      {/* Modal dodawania nowego klienta */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">➕ Dodaj nowego klienta</h2>
                <button
                  onClick={() => {
                    setShowAddClientModal(false);
                    resetNewClientForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddClient(); }} className="space-y-4">
                {/* Dane podstawowe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa klienta *
                  </label>
                  <input
                    type="text"
                    value={newClientForm.name}
                    onChange={(e) => handleNewClientChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Imię i nazwisko lub nazwa firmy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={newClientForm.phone}
                    onChange={(e) => handleNewClientChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 456 789"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => handleNewClientChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Adres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pełny adres *
                  </label>
                  <input
                    type="text"
                    value={newClientForm.address}
                    onChange={(e) => handleNewClientChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Miasto
                    </label>
                    <input
                      type="text"
                      value={newClientForm.city}
                      onChange={(e) => handleNewClientChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Warszawa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ulica
                    </label>
                    <input
                      type="text"
                      value={newClientForm.street}
                      onChange={(e) => handleNewClientChange('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ul. Przykładowa 123"
                    />
                  </div>
                </div>

                {/* Szczegóły usługi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rodzaj usługi
                  </label>
                  <select
                    value={newClientForm.serviceType}
                    onChange={(e) => handleNewClientChange('serviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wybierz rodzaj usługi</option>
                    <option value="naprawa">Naprawa</option>
                    <option value="serwis">Serwis</option>
                    <option value="instalacja">Instalacja</option>
                    <option value="konsultacja">Konsultacja</option>
                    <option value="inne">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urządzenie/Sprzęt
                  </label>
                  <input
                    type="text"
                    value={newClientForm.device}
                    onChange={(e) => handleNewClientChange('device', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Laptop, telefon, drukarka, itp."
                  />
                  
                  {/* Przycisk AI Scanner */}
                  <button
                    type="button"
                    onClick={() => setShowAIScanner(true)}
                    className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    🤖 Zeskanuj tabliczkę AI
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis problemu
                  </label>
                  <textarea
                    value={newClientForm.problem}
                    onChange={(e) => handleNewClientChange('problem', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Opisz problem lub wymagania..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kiedy klient jest dostępny? 📅
                  </label>
                  <textarea
                    value={newClientForm.availability}
                    onChange={(e) => handleNewClientChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="np. Jutro po 16:00, w weekend, pon-pt 9-17, wieczorami..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={newClientForm.priority}
                      onChange={(e) => handleNewClientChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">🟢 Niski</option>
                      <option value="normal">🟡 Normalny</option>
                      <option value="high">🟠 Wysoki</option>
                      <option value="urgent">🔴 Pilny</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newClientForm.status}
                      onChange={(e) => handleNewClientChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">🟣 Oczekujące</option>
                      <option value="scheduled">🔵 Zaplanowane</option>
                      <option value="confirmed">🟢 Potwierdzone</option>
                      <option value="in_progress">🟡 W trakcie</option>
                    </select>
                  </div>
                </div>

                {/* Przyciski */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientModal(false);
                      resetNewClientForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Dodaj klienta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal AI Scanner */}
      {showAIScanner && (
        <ModelAIScanner
          isOpen={showAIScanner}
          onClose={() => setShowAIScanner(false)}
          onModelDetected={handleAIModelDetected}
        />
      )}
    </div>
  );
}
