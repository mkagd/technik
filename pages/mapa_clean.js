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
            // Symulacja danych z harmonogramu (w rzeczywistości pobieralibyśmy z API)
            const today = new Date().toISOString().split('T')[0];

            const harmonogramData = [
                {
                    clientName: 'Jan Kowalski',
                    clientPhone: '+48 123 456 789',
                    address: 'Krakowskie Przedmieście 1, Warszawa',
                    serviceType: 'Naprawa laptopa',
                    deviceType: 'HP Pavilion',
                    scheduledDate: today,
                    scheduledTime: '10:00',
                    status: 'scheduled',
                    priority: 'normal',
                    description: 'Laptop nie włącza się, możliwy problem z zasilaczem'
                },
                {
                    clientName: 'Anna Nowak',
                    clientPhone: '+48 987 654 321',
                    address: 'Nowy Świat 15, Warszawa',
                    serviceType: 'Instalacja systemu',
                    deviceType: 'Dell Inspiron',
                    scheduledDate: today,
                    scheduledTime: '14:00',
                    status: 'confirmed',
                    priority: 'high',
                    description: 'Reinstalacja Windows 11 po ataku malware'
                },
                {
                    clientName: 'Piotr Wiśniewski',
                    clientPhone: '+48 555 123 456',
                    address: 'Marszałkowska 100, Warszawa',
                    serviceType: 'Naprawa telefonu',
                    deviceType: 'iPhone 12',
                    scheduledDate: today,
                    scheduledTime: '16:30',
                    status: 'in_progress',
                    priority: 'urgent',
                    description: 'Pęknięty ekran, wymiana wyświetlacza'
                }
            ];

            return harmonogramData;
        } catch (error) {
            console.error('Błąd ładowania danych z harmonogramu:', error);
            return [];
        }
    };

    // Ładowanie danych z API rezerwacji
    const loadFromRezerwacje = async () => {
        try {
            const response = await fetch('/api/rezerwacje');
            if (!response.ok) {
                console.warn('API rezerwacji niedostępne, używam danych mock');
                return [
                    {
                        clientName: 'Maria Kowalczyk',
                        clientPhone: '+48 666 777 888',
                        address: 'Aleje Jerozolimskie 50, Warszawa',
                        serviceType: 'Serwis komputera',
                        deviceType: 'Lenovo ThinkPad',
                        scheduledDate: '2024-12-20',
                        scheduledTime: '09:00',
                        status: 'scheduled',
                        priority: 'normal',
                        description: 'Powolne działanie systemu, możliwy wirus'
                    }
                ];
            }

            const data = await response.json();
            return data.map(reservation => ({
                clientName: reservation.name,
                clientPhone: reservation.phone,
                address: reservation.address || 'Adres do uzupełnienia',
                serviceType: reservation.serviceType || 'Serwis ogólny',
                deviceType: reservation.deviceType,
                scheduledDate: reservation.date,
                scheduledTime: reservation.time,
                status: 'scheduled',
                priority: reservation.priority || 'normal',
                description: reservation.problem
            }));
        } catch (error) {
            console.error('Błąd ładowania rezerwacji:', error);
            return [];
        }
    };

    // Ładowanie danych z historii napraw
    const loadFromHistoriaNapraw = () => {
        try {
            // Symulacja danych z historii napraw
            const historiaData = [
                {
                    clientName: 'Tomasz Zieliński',
                    clientPhone: '+48 111 222 333',
                    address: 'Płocka 5, Warszawa',
                    serviceType: 'Wymiana dysku',
                    deviceType: 'MacBook Pro',
                    completedDate: '2024-12-15',
                    status: 'completed',
                    priority: 'normal',
                    description: 'Wymieniono dysk SSD 1TB, przywrócono dane z backupu'
                },
                {
                    clientName: 'Katarzyna Dąbrowska',
                    clientPhone: '+48 444 555 666',
                    address: 'Wólczańska 223, Łódź',
                    serviceType: 'Naprawa chłodzenia',
                    deviceType: 'ASUS ROG',
                    completedDate: '2024-12-10',
                    status: 'completed',
                    priority: 'high',
                    description: 'Wyczyszczono układ chłodzenia, wymieniono pastę termoprzewodzącą'
                }
            ];

            return historiaData;
        } catch (error) {
            console.error('Błąd ładowania historii napraw:', error);
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
                const result = await new Promise((resolve, reject) => {
                    geocoder.geocode({ address: client.address }, (results, status) => {
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
                console.error(`Błąd geokodowania dla adresu ${client.address}:`, error);
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

        // Filtr wyszukiwania
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.clientName.toLowerCase().includes(term) ||
                client.clientPhone.includes(term) ||
                client.address.toLowerCase().includes(term) ||
                client.serviceType.toLowerCase().includes(term)
            );
        }

        setFilteredClients(filtered);
    };

    const handleMarkerClick = useCallback((client) => {
        setSelectedClient(client);
    }, []);

    const handleRefresh = () => {
        loadClientsData();
    };

    const render = (status) => {
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
            {/* Nagłówek */}
            <div className="bg-white shadow-sm border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mapa Klientów</h1>
                        <p className="text-gray-600">
                            Wyświetlono {filteredClients.length} z {clientsData.length} klientów
                        </p>
                    </div>

                    {/* Kontrolki */}
                    <div className="flex items-center space-x-4">
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
                            <option value="scheduled">Zaplanowane</option>
                            <option value="confirmed">Potwierdzone</option>
                            <option value="in_progress">W trakcie</option>
                            <option value="completed">Zakończone</option>
                            <option value="cancelled">Anulowane</option>
                        </select>

                        {/* Przycisk odświeżania */}
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Odśwież
                        </button>
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
