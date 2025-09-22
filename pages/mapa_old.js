
// pages/mapa.js

import { useEffect, useState, useRef, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { FiMapPin, FiPhone, FiClock, FiUser, FiTool, FiNavigation, FiFilter, FiRefreshCw, FiSettings } from 'react-icons/fi';

// Funkcje pomocnicze
const getMarkerColor = (status) => {
  switch (status) {
    case 'scheduled': return '#3b82f6'; // niebieski
    case 'confirmed': return '#10b981'; // zielony
    case 'in_progress': return '#f59e0b'; // pomarańczowy
    case 'completed': return '#6b7280'; // szary
    case 'cancelled': return '#ef4444'; // czerwony
    default: return '#3b82f6';
  }
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'scheduled': return '#3b82f6';
    case 'confirmed': return '#10b981';
    case 'in_progress': return '#f59e0b';
    case 'completed': return '#6b7280';
    case 'cancelled': return '#ef4444';
    default: return '#3b82f6';
  }
};

const createInfoWindowContent = (client) => {
  const statusText = {
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
        <span style="margin-left: 8px;">${client.address}</span>
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
        <a href="https://maps.google.com/maps?daddr=${encodeURIComponent(client.address)}" target="_blank" style="display: inline-block; margin-left: 8px; padding: 8px 16px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          🗺️ Nawiguj
        </a>
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
    if (mapRef.current && !map.current) {
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
    if (!map.current) return;

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
        animation: client.status === 'in_progress' ? window.google.maps.Animation.BOUNCE : null
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
  
  // Stan dla geokodowania adresów
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    loadClientsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientsData, filter, searchTerm]);

  const loadClientsData = async () => {
    setLoading(true);
    try {
      // Załaduj dane z różnych źródeł
      const sources = [
        loadFromHarmonogram(),
        loadFromRezerwacje(),
        loadFromHistoriaNapraw()
      ];

      const allData = await Promise.all(sources);
      const combinedData = allData.flat().filter(Boolean);
      
      // Usuń duplikaty na podstawie telefonu lub email
      const uniqueClients = removeDuplicates(combinedData);
      
      setClientsData(uniqueClients);
      
      // Geokoduj adresy jeśli nie mają współrzędnych
      await geocodeAddresses(uniqueClients);
      
    } catch (error) {
      console.error('Błąd ładowania danych klientów:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ładowanie danych z harmonogramu admina
  const loadFromHarmonogram = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return [
        {
          id: 'book_001',
          source: 'harmonogram',
          clientName: 'Anna Kowalska',
          clientPhone: '+48 123 456 789',
          serviceType: 'Przegląd pralki',
          description: 'Przegląd okresowy pralki automatycznej Samsung',
          deviceType: 'Pralka Samsung WW70K5410UW',
          address: 'Marszałkowska 15/3, 00-001 Warszawa',
          postalCode: '00-001',
          city: 'Warszawa',
          street: 'Marszałkowska',
          houseNumber: '15/3',
          scheduledDate: today,
          scheduledTime: '09:00',
          status: 'scheduled',
          priority: 'normal',
          lat: 52.2319,
          lng: 21.0067
        },
        {
          id: 'book_002',
          source: 'harmonogram',
          clientName: 'Piotr Nowak',
          clientPhone: '+48 987 654 321',
          serviceType: 'Naprawa zmywarki',
          description: 'Naprawa silnika zmywarki - wydaje dziwne dźwięki podczas pracy',
          deviceType: 'Zmywarka Bosch SMS46KI03E',
          address: 'Puławska 142/7, 02-123 Warszawa',
          postalCode: '02-123',
          city: 'Warszawa',
          street: 'Puławska',
          houseNumber: '142/7',
          scheduledDate: today,
          scheduledTime: '14:00',
          status: 'confirmed',
          priority: 'high',
          lat: 52.1951,
          lng: 21.0265
        },
        {
          id: 'book_003',
          source: 'harmonogram',
          clientName: 'Maria Zielińska',
          clientPhone: '+48 555 666 777',
          serviceType: 'Diagnostyka lodówki',
          description: 'Lodówka nie chłodzi właściwie, sprawdzenie systemu chłodniczego',
          deviceType: 'Lodówka LG GBB62PZGCC',
          address: 'Grochowska 278, 03-456 Warszawa',
          postalCode: '03-456',
          city: 'Warszawa',
          street: 'Grochowska',
          houseNumber: '278',
          scheduledDate: today,
          scheduledTime: '10:00',
          status: 'in_progress',
          priority: 'normal',
          lat: 52.2506,
          lng: 21.1066
        },
        {
          id: 'book_004',
          source: 'harmonogram',
          clientName: 'Tomasz Wiśniewski',
          clientPhone: '+48 777 888 999',
          serviceType: 'Instalacja klimatyzacji',
          description: 'Montaż nowej klimatyzacji split w salonie',
          deviceType: 'Klimatyzacja Daikin FTXM35R',
          address: 'Nowy Świat 45, 00-042 Warszawa',
          postalCode: '00-042',
          city: 'Warszawa',
          street: 'Nowy Świat',
          houseNumber: '45',
          scheduledDate: today,
          scheduledTime: '16:00',
          status: 'scheduled',
          priority: 'urgent',
          lat: 52.2351,
          lng: 21.0190
        }
      ];
    } catch (error) {
      console.error('Błąd ładowania danych z harmonogramu:', error);
      return [];
    }
  };

  // Ładowanie danych z API rezerwacji
  const loadFromRezerwacje = async () => {
    try {
      const response = await fetch('/api/rezerwacje');
      const data = await response.json();
      
      return (data.rezerwacje || []).map(rezerwacja => ({
        id: `rez_${rezerwacja.id}`,
        source: 'rezerwacje',
        clientName: rezerwacja.name,
        clientPhone: rezerwacja.phone,
        clientEmail: rezerwacja.email,
        serviceType: rezerwacja.category,
        deviceType: rezerwacja.device,
        address: `${rezerwacja.street}, ${rezerwacja.city}`,
        city: rezerwacja.city,
        street: rezerwacja.street,
        scheduledDate: rezerwacja.date,
        status: 'scheduled',
        priority: 'normal'
      }));
    } catch (error) {
      console.error('Błąd ładowania rezerwacji:', error);
      return [];
    }
  };

  // Ładowanie danych z historii napraw
  const loadFromHistoriaNapraw = () => {
    try {
      const historyData = JSON.parse(localStorage.getItem('repairHistory') || '[]');
      
      return historyData.map(repair => ({
        id: `hist_${repair.id}`,
        source: 'historia',
        clientName: repair.clientName,
        clientPhone: repair.clientPhone,
        serviceType: repair.serviceType,
        deviceType: repair.deviceType,
        address: repair.address,
        city: repair.city,
        status: 'completed',
        completedDate: repair.completedDate,
        priority: 'normal'
      }));
    } catch (error) {
      console.error('Błąd ładowania historii napraw:', error);
      return [];
    }
  };

  // Usuwanie duplikatów
  const removeDuplicates = (clients) => {
    const seen = new Set();
    return clients.filter(client => {
      const key = client.clientPhone || client.clientEmail || `${client.clientName}_${client.address}`;
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
    
    const clientsWithoutCoords = clients.filter(client => !client.lat || !client.lng);
    
    if (clientsWithoutCoords.length === 0) {
      setIsGeocoding(false);
      return;
    }

    for (let i = 0; i < clientsWithoutCoords.length; i++) {
      const client = clientsWithoutCoords[i];
      try {
        // Użyj Google Maps Geocoding API jeśli jest dostępne
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          const request = {
            address: `${client.address}, Polska`,
            componentRestrictions: { country: 'PL' }
          };
          
          const result = await new Promise((resolve, reject) => {
            geocoder.geocode(request, (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve(results[0]);
              } else {
                reject(new Error('Geocoding failed: ' + status));
              }
            });
          });
          
          client.lat = result.geometry.location.lat();
          client.lng = result.geometry.location.lng();
        } else {
          // Fallback - współrzędne w Warszawie
          client.lat = 52.2297 + (Math.random() - 0.5) * 0.1;
          client.lng = 21.0122 + (Math.random() - 0.5) * 0.1;
        }
        
        setGeocodingProgress(((i + 1) / clientsWithoutCoords.length) * 100);
      } catch (error) {
        console.error(`Błąd geokodowania dla ${client.clientName}:`, error);
        // Fallback coordinates w Warszawie
        client.lat = 52.2297 + (Math.random() - 0.5) * 0.1;
        client.lng = 21.0122 + (Math.random() - 0.5) * 0.1;
      }
    }
    
    setIsGeocoding(false);
    setClientsData([...clients]);
  };

  // Filtrowanie klientów
  const applyFilters = () => {
    let filtered = [...clientsData];
    
    if (filter !== 'all') {
      filtered = filtered.filter(client => client.status === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.clientName.toLowerCase().includes(term) ||
        client.address.toLowerCase().includes(term) ||
        client.serviceType.toLowerCase().includes(term) ||
        client.deviceType?.toLowerCase().includes(term)
      );
    }
    
    setFilteredClients(filtered);
  };

  // Callback dla kliknięcia markera
  const handleMarkerClick = useCallback((client) => {
    setSelectedClient(client);
  }, []);

  // Render funkcja
  const render = (status) => {
    if (status === 'LOADING') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Ładowanie Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-2">Błąd ładowania Google Maps</p>
            <p className="text-sm text-gray-500">
              Sprawdź klucz API lub połączenie internetowe
            </p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie danych klientów...</p>
          {isGeocoding && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Geokodowanie adresów...</p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${geocodingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(geocodingProgress)}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiMapPin className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">
                Mapa Klientów Google Maps
              </h1>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {filteredClients.length} klientów
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Wyszukiwanie */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj klienta, adresu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FiUser className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              
              {/* Filtr statusu */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie</option>
                <option value="scheduled">Zaplanowane</option>
                <option value="confirmed">Potwierdzone</option>
                <option value="in_progress">W trakcie</option>
                <option value="completed">Zakończone</option>
              </select>
              
              {/* Przyciski akcji */}
              <button
                onClick={loadClientsData}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Odśwież
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <Wrapper
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key'}
          render={render}
          libraries={['geometry', 'places']}
        />
        
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
                <span>{selectedClient.address}</span>
              </div>
              <div className="flex items-center">
                <FiTool className="h-4 w-4 mr-2 text-orange-500" />
                <span>{selectedClient.serviceType}</span>
              </div>
              {selectedClient.scheduledDate && (
                <div className="flex items-center">
                  <FiClock className="h-4 w-4 mr-2 text-purple-500" />
                  <span>
                    {new Date(selectedClient.scheduledDate).toLocaleDateString('pl-PL')}
                    {selectedClient.scheduledTime && ` o ${selectedClient.scheduledTime}`}
                  </span>
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
                href={`https://maps.google.com/maps?daddr=${encodeURIComponent(selectedClient.address)}`}
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
              💫 Animowane - w trakcie realizacji
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  // Ładowanie danych z harmonogramu admina
  const loadFromHarmonogram = () => {
    try {
      // Symulacja danych z harmonogramu (w rzeczywistości pobieralibyśmy z API)
      const today = new Date().toISOString().split('T')[0];

      return [
        {
          id: 'book_001',
          source: 'harmonogram',
          clientName: 'Anna Kowalska',
          clientPhone: '+48 123 456 789',
          serviceType: 'Przegląd pralki',
          description: 'Przegląd okresowy pralki automatycznej',
          deviceType: 'pralka',
          address: 'Marszałkowska 15/3, 00-001 Warszawa',
          postalCode: '00-001',
          city: 'Warszawa',
          street: 'Marszałkowska',
          houseNumber: '15/3',
          scheduledDate: today,
          scheduledTime: '09:00',
          status: 'scheduled',
          priority: 'normal',
          // Dodane współrzędne dla Marszałkowskiej w Warszawie
          lat: 52.2319,
          lng: 21.0067
        },
        {
          id: 'book_002',
          source: 'harmonogram',
          clientName: 'Piotr Nowak',
          clientPhone: '+48 987 654 321',
          serviceType: 'Naprawa zmywarki',
          description: 'Naprawa silnika zmywarki - dziwne dźwięki',
          deviceType: 'zmywarka',
          address: 'Puławska 142/7, 02-123 Warszawa',
          postalCode: '02-123',
          city: 'Warszawa',
          street: 'Puławska',
          houseNumber: '142/7',
          scheduledDate: today,
          scheduledTime: '14:00',
          status: 'confirmed',
          priority: 'high',
          lat: 52.1951,
          lng: 21.0265
        },
        {
          id: 'book_003',
          source: 'harmonogram',
          clientName: 'Maria Zielińska',
          clientPhone: '+48 555 666 777',
          serviceType: 'Diagnostyka lodówki',
          description: 'Diagnostyka lodówki - nie chłodzi',
          deviceType: 'lodowka',
          address: 'Grochowska 278, 03-456 Warszawa',
          postalCode: '03-456',
          city: 'Warszawa',
          street: 'Grochowska',
          houseNumber: '278',
          scheduledDate: today,
          scheduledTime: '10:00',
          status: 'in_progress',
          priority: 'normal',
          lat: 52.2506,
          lng: 21.1066
        }
      ];
    } catch (error) {
      console.error('Błąd ładowania danych z harmonogramu:', error);
      return [];
    }
  };

  // Ładowanie danych z API rezerwacji
  const loadFromRezerwacje = async () => {
    try {
      const response = await fetch('/api/rezerwacje');
      const data = await response.json();

      return (data.rezerwacje || []).map(rezerwacja => ({
        id: `rez_${rezerwacja.id}`,
        source: 'rezerwacje',
        clientName: rezerwacja.name,
        clientPhone: rezerwacja.phone,
        clientEmail: rezerwacja.email,
        serviceType: rezerwacja.category,
        deviceType: rezerwacja.device,
        address: `${rezerwacja.street}, ${rezerwacja.city}`,
        city: rezerwacja.city,
        street: rezerwacja.street,
        scheduledDate: rezerwacja.date,
        status: 'scheduled',
        priority: 'normal'
      }));
    } catch (error) {
      console.error('Błąd ładowania rezerwacji:', error);
      return [];
    }
  };

  // Ładowanie danych z historii napraw
  const loadFromHistoriaNapraw = () => {
    try {
      // Symulacja danych z historii (w rzeczywistości pobieralibyśmy z localStorage lub API)
      const historyData = JSON.parse(localStorage.getItem('repairHistory') || '[]');

      return historyData.map(repair => ({
        id: `hist_${repair.id}`,
        source: 'historia',
        clientName: repair.clientName,
        clientPhone: repair.clientPhone,
        serviceType: repair.serviceType,
        deviceType: repair.deviceType,
        address: repair.address,
        city: repair.city,
        status: 'completed',
        completedDate: repair.completedDate,
        priority: 'normal'
      }));
    } catch (error) {
      console.error('Błąd ładowania historii napraw:', error);
      return [];
    }
  };

  // Usuwanie duplikatów
  const removeDuplicates = (clients) => {
    const seen = new Set();
    return clients.filter(client => {
      const key = client.clientPhone || client.clientEmail || `${client.clientName}_${client.address}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Geokodowanie adresów za pomocą Nominatim API
  const geocodeAddresses = async (clients) => {
    setIsGeocoding(true);
    setGeocodingProgress(0);

    const clientsWithoutCoords = clients.filter(client => !client.lat || !client.lng);

    for (let i = 0; i < clientsWithoutCoords.length; i++) {
      const client = clientsWithoutCoords[i];
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

        const searchQuery = `${client.address}, ${client.city}, Polska`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(searchQuery)}`
        );

        const data = await response.json();
        if (data && data.length > 0) {
          client.lat = parseFloat(data[0].lat);
          client.lng = parseFloat(data[0].lon);
        } else {
          // Fallback - random location in Warsaw
          client.lat = 52.2297 + (Math.random() - 0.5) * 0.1;
          client.lng = 21.0122 + (Math.random() - 0.5) * 0.1;
        }

        setGeocodingProgress(((i + 1) / clientsWithoutCoords.length) * 100);
      } catch (error) {
        console.error(`Błąd geokodowania dla ${client.clientName}:`, error);
        // Fallback coordinates
        client.lat = 52.2297 + (Math.random() - 0.5) * 0.1;
        client.lng = 21.0122 + (Math.random() - 0.5) * 0.1;
      }
    }

    setIsGeocoding(false);
    setClientsData([...clients]); // Update state with new coordinates
  };

  // Filtrowanie klientów
  const applyFilters = () => {
    let filtered = [...clientsData];

    // Filtr według statusu
    if (filter !== 'all') {
      filtered = filtered.filter(client => client.status === filter);
    }

    // Filtr wyszukiwania
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(term) ||
        client.address.toLowerCase().includes(term) ||
        client.serviceType.toLowerCase().includes(term) ||
        client.deviceType?.toLowerCase().includes(term)
      );
    }

    setFilteredClients(filtered);
  };

  // Callback dla kliknięcia markera
  const handleMarkerClick = useCallback((client) => {
    setSelectedClient(client);
  }, []);

  // Utwórz niestandardową ikonę markera
  const createCustomIcon = (status, priority) => {
    if (typeof window === 'undefined') return null;

    const L = require('leaflet');
    const color = getMarkerColor(status);
    const size = priority === 'high' ? 30 : priority === 'urgent' ? 35 : 25;

    return L.divIcon({
      className: `custom-marker custom-marker-${color}`,
      html: `<div style="
        background-color: ${color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'orange' ? '#f59e0b' : color === 'gray' ? '#6b7280' : '#ef4444'};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${priority === 'urgent' ? '!' : priority === 'high' ? 'H' : ''}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Centrum mapy na klientów
  const centerMapOnClients = () => {
    if (filteredClients.length === 0) return;

    const validClients = filteredClients.filter(c => c.lat && c.lng);
    if (validClients.length === 0) return;

    if (validClients.length === 1) {
      setMapCenter([validClients[0].lat, validClients[0].lng]);
    } else {
      // Oblicz centrum dla wszystkich klientów
      const avgLat = validClients.reduce((sum, c) => sum + c.lat, 0) / validClients.length;
      const avgLng = validClients.reduce((sum, c) => sum + c.lng, 0) / validClients.length;
      setMapCenter([avgLat, avgLng]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie danych klientów...</p>
          {isGeocoding && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Geokodowanie adresów...</p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${geocodingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(geocodingProgress)}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiMapPin className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">
                Mapa Klientów
              </h1>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {filteredClients.length} klientów
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Wyszukiwanie */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj klienta, adresu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FiUser className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {/* Filtr statusu */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie</option>
                <option value="scheduled">Zaplanowane</option>
                <option value="confirmed">Potwierdzone</option>
                <option value="in_progress">W trakcie</option>
                <option value="completed">Zakończone</option>
              </select>

              {/* Przyciski akcji */}
              <button
                onClick={centerMapOnClients}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiNavigation className="h-4 w-4 mr-2" />
                Wyśrodkuj
              </button>

              <button
                onClick={loadClientsData}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Odśwież
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        {typeof window !== 'undefined' && (
          <MapContainer
            ref={mapRef}
            center={mapCenter}
            zoom={12}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {filteredClients.map((client) => {
              if (!client.lat || !client.lng) return null;

              return (
                <Marker
                  key={client.id}
                  position={[client.lat, client.lng]}
                  icon={createCustomIcon(client.status, client.priority)}
                >
                  <Popup className="custom-marker-popup">
                    <div className="min-w-[250px]">
                      <div className="popup-header">
                        {client.clientName}
                      </div>

                      <div className="popup-content space-y-2">
                        <div className="flex items-center">
                          <FiPhone className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{client.clientPhone}</span>
                        </div>

                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-2 text-green-500" />
                          <span>{client.address}</span>
                        </div>

                        <div className="flex items-center">
                          <FiTool className="h-4 w-4 mr-2 text-orange-500" />
                          <span>{client.serviceType}</span>
                        </div>

                        {client.deviceType && (
                          <div className="text-sm text-gray-600">
                            <strong>Urządzenie:</strong> {client.deviceType}
                          </div>
                        )}

                        {client.scheduledDate && (
                          <div className="flex items-center">
                            <FiClock className="h-4 w-4 mr-2 text-purple-500" />
                            <span>
                              {new Date(client.scheduledDate).toLocaleDateString('pl-PL')}
                              {client.scheduledTime && ` o ${client.scheduledTime}`}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${client.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              client.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                client.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  client.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {client.status === 'scheduled' ? 'Zaplanowane' :
                              client.status === 'confirmed' ? 'Potwierdzone' :
                                client.status === 'in_progress' ? 'W trakcie' :
                                  client.status === 'completed' ? 'Zakończone' :
                                    'Anulowane'}
                          </span>

                          {client.priority && client.priority !== 'normal' && (
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${client.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                              {client.priority === 'urgent' ? 'Pilne' : 'Wysoki priorytet'}
                            </span>
                          )}
                        </div>

                        {client.description && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Opis:</strong> {client.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Legenda */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <h3 className="font-semibold text-gray-900 mb-2">Legenda</h3>
          <div className="space-y-1 text-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
