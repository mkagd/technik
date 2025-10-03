import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, AlertTriangle, CheckCircle, Car, User, Route, Zap, Map } from 'lucide-react';
import { Wrapper } from '@googlemaps/react-wrapper';

// Komponent Google Maps z markerami zespołu
const TeamMap = ({ teamMembers, onMarkerClick, center }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Inicjalizuj mapę
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: center || { lat: 50.8661, lng: 20.6286 }, // Kielce jako domyślne centrum
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // Inicjalizuj InfoWindow
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [center]);

  useEffect(() => {
    if (!mapInstance.current || !teamMembers.length) return;

    // Wyczyść istniejące markery
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    const bounds = new window.google.maps.LatLngBounds();

    teamMembers.forEach(member => {
      if (!member.currentLocation?.lat || !member.currentLocation?.lng) return;

      // Marker dla obecnej lokalizacji serwisanta
      const currentMarker = new window.google.maps.Marker({
        position: { lat: member.currentLocation.lat, lng: member.currentLocation.lng },
        map: mapInstance.current,
        title: `${member.name} - ${member.role}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: member.status === 'online' ? '#10b981' : member.status === 'busy' ? '#f59e0b' : '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        animation: member.status === 'busy' ? window.google.maps.Animation.BOUNCE : null
      });

      // Info Window dla serwisanta
      currentMarker.addListener('click', () => {
        const infoContent = `
          <div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
              <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${member.name}</h3>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${member.role}</p>
              <span style="display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; 
                     background-color: ${member.status === 'online' ? '#dcfce7' : member.status === 'busy' ? '#fef3c7' : '#fee2e2'}; 
                     color: ${member.status === 'online' ? '#16a34a' : member.status === 'busy' ? '#d97706' : '#dc2626'};">
                ${member.status === 'online' ? '🟢 Dostępny' : member.status === 'busy' ? '🟡 Zajęty' : '🔴 Offline'}
              </span>
            </div>
            <div style="font-size: 14px; color: #4b5563;">
              <p style="margin: 8px 0;"><strong>📍 Lokalizacja:</strong><br>${member.currentLocation.address}</p>
              ${member.currentTask ? `
                <p style="margin: 8px 0;"><strong>🔧 Aktualne zadanie:</strong><br>${member.currentTask.title}</p>
                <p style="margin: 8px 0;"><strong>⏱️ Czas realizacji:</strong> ${member.currentTask.estimatedDuration} min</p>
              ` : ''}
              ${member.destination ? `
                <p style="margin: 8px 0;"><strong>🎯 Cel:</strong><br>${member.destination.address}</p>
                <p style="margin: 8px 0;"><strong>📅 Przewidywany przyjazd:</strong><br>${new Date(member.destination.estimatedArrival).toLocaleString()}</p>
              ` : ''}
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <div style="display: flex; gap: 8px;">
                <a href="tel:${member.phone || '+48 123 456 789'}" 
                   style="display: inline-block; padding: 6px 12px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 12px;">
                  📞 Zadzwoń
                </a>
                <a href="https://maps.google.com/maps?daddr=${encodeURIComponent(member.currentLocation.address)}" 
                   target="_blank"
                   style="display: inline-block; padding: 6px 12px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 12px;">
                  🗺️ Nawiguj
                </a>
              </div>
            </div>
          </div>
        `;
        
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open(mapInstance.current, currentMarker);
        
        if (onMarkerClick) onMarkerClick(member);
      });

      markersRef.current[`current_${member.id}`] = currentMarker;
      bounds.extend(currentMarker.getPosition());

      // Marker dla celu (jeśli istnieje)
      if (member.destination?.lat && member.destination?.lng) {
        const destinationMarker = new window.google.maps.Marker({
          position: { lat: member.destination.lat, lng: member.destination.lng },
          map: mapInstance.current,
          title: `Cel: ${member.destination.client}`,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: 0
          }
        });

        // Info Window dla celu
        destinationMarker.addListener('click', () => {
          const destInfoContent = `
            <div style="max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">🎯 Cel podróży</h4>
              <p style="margin: 4px 0; color: #4b5563; font-size: 13px;"><strong>Klient:</strong> ${member.destination.client}</p>
              <p style="margin: 4px 0; color: #4b5563; font-size: 13px;"><strong>Adres:</strong> ${member.destination.address}</p>
              <p style="margin: 4px 0; color: #4b5563; font-size: 13px;"><strong>Serwisant:</strong> ${member.name}</p>
              <p style="margin: 8px 0 4px 0; color: #4b5563; font-size: 13px;"><strong>Przewidywany przyjazd:</strong><br>${new Date(member.destination.estimatedArrival).toLocaleString()}</p>
            </div>
          `;
          
          infoWindowRef.current.setContent(destInfoContent);
          infoWindowRef.current.open(mapInstance.current, destinationMarker);
        });

        markersRef.current[`dest_${member.id}`] = destinationMarker;
        bounds.extend(destinationMarker.getPosition());

        // Rysuj trasę między obecną lokalizacją a celem
        const routePath = new window.google.maps.Polyline({
          path: [
            { lat: member.currentLocation.lat, lng: member.currentLocation.lng },
            { lat: member.destination.lat, lng: member.destination.lng }
          ],
          geodesic: true,
          strokeColor: member.status === 'online' ? '#10b981' : '#f59e0b',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapInstance.current
        });

        markersRef.current[`route_${member.id}`] = routePath;
      }
    });

    // Dopasuj widok do wszystkich markerów
    if (teamMembers.length > 0) {
      mapInstance.current.fitBounds(bounds);
    }
  }, [teamMembers, onMarkerClick]);

  return <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '12px' }} />;
};

const TeamLocationTracker = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [mapView, setMapView] = useState('list'); // 'list' lub 'map'
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 50.8661, lng: 20.6286 });

  useEffect(() => {
    loadTeamLocations();
    const interval = setInterval(updateLocations, 30000); // Aktualizuj co 30 sekund
    return () => clearInterval(interval);
  }, []);

  const loadTeamLocations = async () => {
    try {
      const response = await fetch('/api/team-locations?activeOnly=false');
      const data = await response.json();
      
      if (data.success) {
        setTeamMembers(data.data.teamMembers);
        
        // Aktualizuj centrum mapy na podstawie aktywnych serwisantów
        const activeMembers = data.data.teamMembers.filter(m => m.status !== 'offline' && m.currentLocation);
        if (activeMembers.length > 0) {
          const avgLat = activeMembers.reduce((sum, m) => sum + m.currentLocation.lat, 0) / activeMembers.length;
          const avgLng = activeMembers.reduce((sum, m) => sum + m.currentLocation.lng, 0) / activeMembers.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
        
        // Generuj alerty na podstawie danych
        generateAlerts(data.data.teamMembers);
      } else {
        console.error('Błąd ładowania lokalizacji:', data.error);
        // Fallback do danych symulowanych
        loadFallbackData();
      }
    } catch (error) {
      console.error('Błąd połączenia z API:', error);
      // Fallback do danych symulowanych
      loadFallbackData();
    }
  };

  const loadFallbackData = () => {
    // Symulacja danych lokalizacji zespołu (fallback)
    const locations = [
      {
        id: 'USER_001',
        name: 'Jan Kowalski',
        role: 'Technik Senior',
        status: 'online',
        currentLocation: {
          lat: 50.8661,
          lng: 20.6286,
          address: 'ul. Sienkiewicza 45, Kielce',
          accuracy: 10,
          lastUpdate: new Date().toISOString()
        },
        destination: {
          lat: 50.8700,
          lng: 20.6350,
          address: 'ul. Wesoła 15, Kielce',
          estimatedArrival: new Date(Date.now() + 900000).toISOString(),
          client: 'Andrzej Nowak'
        },
        currentTask: {
          id: 'TOD76062628085',
          title: 'Naprawa pralki Samsung',
          priority: 'high',
          estimatedDuration: 180 // minuty
        },
        todayStats: {
          tasksCompleted: 2,
          tasksRemaining: 3,
          totalDistance: 45.2,
          totalTime: 6.5
        },
        route: [
          { lat: 50.8661, lng: 20.6286, time: '09:00', task: 'Start dnia' },
          { lat: 50.8500, lng: 20.6100, time: '09:30', task: 'Naprawa lodówki - UKOŃCZONE' },
          { lat: 50.8600, lng: 20.6200, time: '11:00', task: 'Wymiana części - UKOŃCZONE' },
          { lat: 50.8661, lng: 20.6286, time: '13:00', task: 'Obecna lokalizacja' },
          { lat: 50.8700, lng: 20.6350, time: '13:45', task: 'Naprawa pralki - W DRODZE' },
          { lat: 50.9000, lng: 20.6500, time: '16:00', task: 'Instalacja AGD' },
          { lat: 50.8800, lng: 20.6400, time: '18:00', task: 'Serwis gwarancyjny' }
        ]
      },
      {
        id: 'USER_002',
        name: 'Marek Nowak',
        role: 'Technik IT',
        status: 'busy',
        currentLocation: {
          lat: 50.9000,
          lng: 20.6500,
          address: 'ul. Żelazna 5, Kielce',
          accuracy: 5,
          lastUpdate: new Date(Date.now() - 120000).toISOString()
        },
        destination: {
          lat: 50.8800,
          lng: 20.6600,
          address: 'ul. Krakowska 12, Kielce',
          estimatedArrival: new Date(Date.now() + 1800000).toISOString(),
          client: 'Firma ABC Sp. z o.o.'
        },
        currentTask: {
          id: 'TOD76062639412',
          title: 'Instalacja oprogramowania',
          priority: 'medium',
          estimatedDuration: 240
        },
        todayStats: {
          tasksCompleted: 1,
          tasksRemaining: 2,
          totalDistance: 32.1,
          totalTime: 4.2
        },
        route: [
          { lat: 50.8661, lng: 20.6286, time: '08:00', task: 'Start dnia' },
          { lat: 50.9000, lng: 20.6500, time: '09:00', task: 'Instalacja sieci - W TRAKCIE' },
          { lat: 50.8800, lng: 20.6600, time: '15:00', task: 'Konfiguracja systemu' }
        ]
      },
      {
        id: 'USER_003',
        name: 'Anna Wójcik',
        role: 'Koordynator',
        status: 'online',
        currentLocation: {
          lat: 50.8500,
          lng: 20.6100,
          address: 'Biuro główne - ul. Warszawska 10, Kielce',
          accuracy: 3,
          lastUpdate: new Date().toISOString()
        },
        destination: null,
        currentTask: {
          id: 'COORD_001',
          title: 'Koordynacja zespołu',
          priority: 'high',
          estimatedDuration: 480
        },
        todayStats: {
          tasksCompleted: 5,
          tasksRemaining: 8,
          totalDistance: 0,
          totalTime: 8.0
        },
        route: [
          { lat: 50.8500, lng: 20.6100, time: '08:00', task: 'Biuro - cały dzień' }
        ]
      },
      {
        id: 'USER_004',
        name: 'Piotr Zieliński',
        role: 'Technik mobilny',
        status: 'away',
        currentLocation: {
          lat: 50.7800,
          lng: 20.5500,
          address: 'Droga krajowa 73 - w drodze do Pacanowa',
          accuracy: 15,
          lastUpdate: new Date(Date.now() - 300000).toISOString()
        },
        destination: {
          lat: 50.7600,
          lng: 20.5200,
          address: 'ul. Słupia 114, Pacanów',
          estimatedArrival: new Date(Date.now() + 1200000).toISOString(),
          client: 'Mariusz Bielaszka'
        },
        currentTask: {
          id: 'TOD75017368978',
          title: 'Naprawa laptop Dell',
          priority: 'high',
          estimatedDuration: 120
        },
        todayStats: {
          tasksCompleted: 3,
          tasksRemaining: 1,
          totalDistance: 78.5,
          totalTime: 7.2
        },
        route: [
          { lat: 50.8661, lng: 20.6286, time: '07:00', task: 'Start dnia' },
          { lat: 50.9200, lng: 20.7000, time: '08:00', task: 'Naprawa TV - UKOŃCZONE' },
          { lat: 50.8900, lng: 20.6800, time: '10:30', task: 'Serwis AGD - UKOŃCZONE' },
          { lat: 50.8400, lng: 20.5900, time: '13:00', task: 'Wymiana części - UKOŃCZONE' },
          { lat: 50.7800, lng: 20.5500, time: '15:30', task: 'W drodze do Pacanowa' },
          { lat: 50.7600, lng: 20.5200, time: '16:00', task: 'Naprawa laptopa' }
        ]
      }
    ];
    
    setTeamMembers(locations);
    
    // Generuj przykładowe alerty
    const currentAlerts = [
      {
        id: 1,
        type: 'delay',
        memberId: 'USER_002',
        memberName: 'Marek Nowak',
        message: 'Opóźnienie 30 min w zadaniu - instalacja sieci',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        priority: 'medium'
      },
      {
        id: 2,
        type: 'location',
        memberId: 'USER_004',
        memberName: 'Piotr Zieliński',
        message: 'Brak aktualizacji lokalizacji przez 5 minut',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        priority: 'low'
      }
    ];
    
    setAlerts(currentAlerts);
  };

  const generateAlerts = (members) => {
    const alerts = [];
    const now = Date.now();
    
    members.forEach(member => {
      // Alert o braku aktualizacji lokalizacji
      const lastUpdate = new Date(member.currentLocation.lastUpdate).getTime();
      const minutesSinceUpdate = Math.floor((now - lastUpdate) / 60000);
      
      if (minutesSinceUpdate > 10 && member.status !== 'offline') {
        alerts.push({
          id: `location_${member.id}`,
          type: 'location',
          memberId: member.id,
          memberName: member.name,
          message: `Brak aktualizacji lokalizacji przez ${minutesSinceUpdate} minut`,
          timestamp: new Date().toISOString(),
          priority: minutesSinceUpdate > 30 ? 'high' : 'medium'
        });
      }
      
      // Alert o spóźnieniu do celu
      if (member.destination && member.destination.estimatedArrival) {
        const arrivalTime = new Date(member.destination.estimatedArrival).getTime();
        const delay = Math.floor((now - arrivalTime) / 60000);
        
        if (delay > 0) {
          alerts.push({
            id: `delay_${member.id}`,
            type: 'delay',
            memberId: member.id,
            memberName: member.name,
            message: `Spóźnienie ${delay} min do klienta: ${member.destination.client}`,
            timestamp: new Date().toISOString(),
            priority: delay > 30 ? 'high' : 'medium'
          });
        }
      }
      
      // Alert o niskiej dokładności GPS
      if (member.currentLocation.accuracy > 50) {
        alerts.push({
          id: `accuracy_${member.id}`,
          type: 'gps',
          memberId: member.id,
          memberName: member.name,
          message: `Niska dokładność GPS: ${member.currentLocation.accuracy}m`,
          timestamp: new Date().toISOString(),
          priority: 'low'
        });
      }
    });
    
    setAlerts(alerts);
  };

  const updateLocations = async () => {
    // Aktualizacja lokalizacji w czasie rzeczywistym
    setTeamMembers(prev => prev.map(member => ({
      ...member,
      currentLocation: {
        ...member.currentLocation,
        lastUpdate: new Date().toISOString()
      }
    })));
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLocationAge = (lastUpdate) => {
    const diff = Date.now() - new Date(lastUpdate).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes}min temu`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h temu`;
  };

  const formatETA = (eta) => {
    const diff = new Date(eta).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'Spóźnienie';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}min`;
  };

  const getTeamStats = () => {
    const totalTasks = teamMembers.reduce((sum, member) => 
      sum + member.todayStats.tasksCompleted + member.todayStats.tasksRemaining, 0
    );
    const completedTasks = teamMembers.reduce((sum, member) => 
      sum + member.todayStats.tasksCompleted, 0
    );
    const totalDistance = teamMembers.reduce((sum, member) => 
      sum + member.todayStats.totalDistance, 0
    );
    const activeMembers = teamMembers.filter(member => member.status !== 'offline').length;
    
    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalDistance: Math.round(totalDistance * 10) / 10,
      activeMembers
    };
  };

  const stats = getTeamStats();

  return (
    <div className="space-y-6">
      {/* Nagłówek z przełącznikami widoku */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Śledzenie zespołu</h2>
            <p className="text-gray-600">Lokalizacje i status w czasie rzeczywistym</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mapView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setMapView('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                mapView === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Map className="h-4 w-4" />
              Mapa
            </button>
          </div>
        </div>

        {/* Statystyki zespołu */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Aktywni</p>
                <p className="text-2xl font-bold text-blue-900">{stats.activeMembers}/{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Ukończone</p>
                <p className="text-2xl font-bold text-green-900">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Postęp</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Dystans</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalDistance}km</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Alerty</p>
                <p className="text-2xl font-bold text-red-900">{alerts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerty */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktualne alerty</h3>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.priority === 'high' ? 'bg-red-50 border-red-400' :
                alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.priority === 'high' ? 'text-red-600' :
                      alert.priority === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{alert.memberName}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{getLocationAge(alert.timestamp)}</p>
                    <button className="text-xs text-blue-600 hover:text-blue-700">Rozwiąż</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widok mapy lub lista */}
      {mapView === 'map' ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa zespołu w czasie rzeczywistym</h3>
          <Wrapper 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            render={(status) => {
              console.log('Google Maps status:', status, 'API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
              if (status === 'LOADING') return <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">🗺️ Ładowanie mapy Google...</div>;
              if (status === 'FAILURE') return (
                <div className="h-[500px] bg-red-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-red-600 text-lg mb-2">❌ Błąd ładowania mapy Google</div>
                    <div className="text-sm text-gray-600">
                      Sprawdź klucz API Google Maps lub połączenie internetowe
                    </div>
                  </div>
                </div>
              );
              return <TeamMap teamMembers={teamMembers} onMarkerClick={setSelectedMember} center={mapCenter} />;
            }}
          />
          
          {/* Legenda mapy */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>🟢 Dostępny</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>🟡 Zajęty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>🔴 Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-blue-500"></div>
                <span>🎯 Cel podróży</span>
              </div>
            </div>
          </div>

          {/* Panel szczegółów wybranego serwisanta */}
          {selectedMember && teamMembers.find(m => m.id === selectedMember) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              {(() => {
                const member = teamMembers.find(m => m.id === selectedMember);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Szczegóły: {member.name}</h4>
                      <button 
                        onClick={() => setSelectedMember(null)}
                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${
                          member.status === 'online' ? 'text-green-600' :
                          member.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.status === 'online' ? 'Dostępny' : member.status === 'busy' ? 'Zajęty' : 'Offline'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Zadania dzisiaj:</span>
                        <span className="ml-2 font-medium">{member.todayStats.tasksCompleted}/{member.todayStats.tasksCompleted + member.todayStats.tasksRemaining}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Dystans:</span>
                        <span className="ml-2 font-medium">{member.todayStats.totalDistance}km</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Aktualne zadanie:</span>
                        <span className="ml-2 font-medium">{member.currentTask?.title || 'Brak'}</span>
                      </div>
                    </div>
                    {member.destination && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm"><strong>🎯 Następny cel:</strong> {member.destination.client}</p>
                        <p className="text-xs text-gray-600 mt-1">{member.destination.address}</p>
                        <p className="text-xs text-gray-600">Przewidywany przyjazd: {new Date(member.destination.estimatedArrival).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamMembers.map(member => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm border p-6">
            {/* Nagłówek członka */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-green-600" title="Zadzwoń">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600" title="Wiadomość">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Szczegóły"
                >
                  <Navigation className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Obecna lokalizacja */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Obecna lokalizacja</span>
                <span className="text-xs text-gray-500">({getLocationAge(member.currentLocation.lastUpdate)})</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{member.currentLocation.address}</p>
              <p className="text-xs text-gray-500 ml-6">
                Dokładność: ±{member.currentLocation.accuracy}m
              </p>
            </div>

            {/* Obecne zadanie */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Obecne zadanie</span>
                {member.currentTask ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.currentTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                    member.currentTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {member.currentTask.priority === 'high' ? 'Wysoki' :
                     member.currentTask.priority === 'medium' ? 'Średni' : 'Niski'}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Brak zadania
                  </span>
                )}
              </div>
              {member.currentTask ? (
                <>
                  <p className="text-sm text-gray-900 ml-6">{member.currentTask.title}</p>
                  <p className="text-xs text-gray-500 ml-6">
                    Szacowany czas: {Math.floor(member.currentTask.estimatedDuration / 60)}h {member.currentTask.estimatedDuration % 60}min
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 ml-6">Brak aktualnego zadania</p>
              )}
            </div>

            {/* Cel podróży */}
            {member.destination && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Jadę do</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    ETA: {formatETA(member.destination.estimatedArrival)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{member.destination.address}</p>
                <p className="text-xs text-gray-500 ml-6">Klient: {member.destination.client}</p>
                <p className="text-xs text-gray-500 ml-6">
                  Dystans: {calculateDistance(
                    member.currentLocation.lat,
                    member.currentLocation.lng,
                    member.destination.lat,
                    member.destination.lng
                  ).toFixed(1)}km
                </p>
              </div>
            )}

            {/* Statystyki dnia */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Statystyki dnia</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ukończone:</span>
                  <span className="ml-2 font-medium text-green-600">{member.todayStats.tasksCompleted}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pozostałe:</span>
                  <span className="ml-2 font-medium text-blue-600">{member.todayStats.tasksRemaining}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dystans:</span>
                  <span className="ml-2 font-medium">{member.todayStats.totalDistance}km</span>
                </div>
                <div>
                  <span className="text-gray-600">Czas:</span>
                  <span className="ml-2 font-medium">{member.todayStats.totalTime}h</span>
                </div>
              </div>
            </div>

            {/* Szczegółowa trasa */}
            {selectedMember === member.id && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Trasa dnia</h4>
                <div className="space-y-2">
                  {member.route.map((stop, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        stop.task.includes('UKOŃCZONE') ? 'bg-green-400' :
                        stop.task.includes('W TRAKCIE') || stop.task.includes('W DRODZE') ? 'bg-blue-400' :
                        stop.task.includes('Obecna') ? 'bg-yellow-400' :
                        'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900">{stop.time}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stop.task.includes('UKOŃCZONE') ? 'bg-green-100 text-green-800' :
                            stop.task.includes('W TRAKCIE') || stop.task.includes('W DRODZE') ? 'bg-blue-100 text-blue-800' :
                            stop.task.includes('Obecna') ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {stop.task.includes('UKOŃCZONE') ? 'Ukończone' :
                             stop.task.includes('W TRAKCIE') ? 'W trakcie' :
                             stop.task.includes('W DRODZE') ? 'W drodze' :
                             stop.task.includes('Obecna') ? 'Obecna' :
                             'Planowane'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{stop.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default TeamLocationTracker;