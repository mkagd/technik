import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Phone, User, CheckCircle, AlertCircle, Car, Route, Timer } from 'lucide-react';

const ServicemanDayPlanner = () => {
  const [selectedServiceman, setSelectedServiceman] = useState('USER_001');
  const [dayPlan, setDayPlan] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeTravelData, setRealTimeTravelData] = useState({});

  useEffect(() => {
    loadDayPlan();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Aktualizuj co minutę
    return () => clearInterval(timer);
  }, [selectedServiceman]);

  useEffect(() => {
    // Sprawdź czy są zaplanowane nawigacje
    const checkPendingNavigation = () => {
      const pending = localStorage.getItem('pendingNavigation');
      if (pending) {
        const data = JSON.parse(pending);
        if (Date.now() >= data.scheduledFor) {
          // Czas na kolejną nawigację
          if (confirm(`Czas na kolejne zlecenie!\n${data.nextClient} - ${data.nextAddress}\nCzy uruchomić nawigację?`)) {
            startNavigation({
              address: data.nextAddress,
              coordinates: data.nextDestination
            });
          }
          localStorage.removeItem('pendingNavigation');
        }
      }
    };

    const navTimer = setInterval(checkPendingNavigation, 30000); // Sprawdzaj co 30 sekund
    return () => clearInterval(navTimer);
  }, []);

  const loadDayPlan = async () => {
    try {
      const response = await fetch(`/api/serviceman-day-plan?servicemanId=${selectedServiceman}`);
      const data = await response.json();
      
      if (data.success) {
        setDayPlan(data.data);
      }
    } catch (error) {
      console.error('Błąd ładowania planu dnia:', error);
      // Fallback - przykładowy plan
      setDayPlan(generateSampleDayPlan());
    }
    
    // Załaduj rzeczywiste czasy podróży
    loadRealTimeTravelData();
  };

  const loadRealTimeTravelData = async () => {
    if (!dayPlan?.appointments?.length) return;
    
    const travelData = {};
    let currentLocation = dayPlan.serviceman.currentLocation;
    
    for (let i = 0; i < dayPlan.appointments.length; i++) {
      const app = dayPlan.appointments[i];
      const routeKey = `${i}`;
      
      try {
        const travelInfo = await calculateTravelTime(currentLocation, app.client.coordinates);
        travelData[routeKey] = travelInfo;
        currentLocation = app.client.coordinates;
      } catch (error) {
        console.warn(`Błąd ładowania czasu podróży dla ${app.client.name}:`, error);
      }
    }
    
    setRealTimeTravelData(travelData);
  };

  const generateSampleDayPlan = () => {
    return {
      serviceman: {
        id: 'USER_001',
        name: 'Jan Kowalski',
        phone: '+48 123 456 789',
        currentLocation: { lat: 50.8661, lng: 20.6286, address: 'ul. Warszawska 1, Kielce (Baza)' }
      },
      date: new Date().toISOString().split('T')[0],
      workingHours: { start: '08:00', end: '16:00' },
      appointments: [
        {
          id: 'APP_001',
          orderId: 'ORD25272001',
          time: '08:30',
          duration: 120, // minuty
          status: 'completed',
          client: {
            name: 'Maria Kowalczyk',
            phone: '+48 501 234 567',
            address: 'ul. Paderewskiego 12, Kielce',
            coordinates: { lat: 50.8720, lng: 20.6350 }
          },
          device: {
            type: 'Lodówka',
            brand: 'Bosch',
            model: 'KGN39VLEB',
            issue: 'Nie chłodzi - wymiana termostatu'
          },
          estimatedCost: 280,
          actualStartTime: '08:35',
          actualEndTime: '10:25',
          notes: 'Wymieniono termostat, sprawdzono uszczelki. Klient zadowolony.'
        },
        {
          id: 'APP_002',
          orderId: 'ORD25272002',
          time: '11:00',
          duration: 90,
          status: 'completed',
          client: {
            name: 'Andrzej Nowak',
            phone: '+48 602 345 678',
            address: 'ul. Sienkiewicza 45, Kielce',
            coordinates: { lat: 50.8661, lng: 20.6286 }
          },
          device: {
            type: 'Pralka',
            brand: 'Samsung',
            model: 'WF80F5E5W4W',
            issue: 'Głośna praca - wymiana łożysk bębna'
          },
          estimatedCost: 420,
          actualStartTime: '11:15',
          actualEndTime: '12:30',
          notes: 'Wymieniono łożyska, wyważono bęben. Test pracy OK.'
        },
        {
          id: 'APP_003',
          orderId: 'ORD25272003',
          time: '13:30',
          duration: 75,
          status: 'in_progress',
          client: {
            name: 'Małgorzata Wiśniewska',
            phone: '+48 703 456 789',
            address: 'ul. Krakowska 88, Kielce',
            coordinates: { lat: 50.8847, lng: 20.6492 }
          },
          device: {
            type: 'Zmywarka',
            brand: 'Whirlpool',
            model: 'WFC 3C26',
            issue: 'Nie odpompowuje wody - czyszczenie pompy'
          },
          estimatedCost: 180,
          actualStartTime: '13:40',
          notes: 'W trakcie czyszczenia pompy odpływowej...'
        },
        {
          id: 'APP_004',
          orderId: 'ORD25272004',
          time: '15:00',
          duration: 60,
          status: 'planned',
          client: {
            name: 'Tomasz Mazur',
            phone: '+48 804 567 890',
            address: 'ul. Słowackiego 33, Kielce',
            coordinates: { lat: 50.8590, lng: 20.6180 }
          },
          device: {
            type: 'Mikrofalówka',
            brand: 'LG',
            model: 'MH6535GPS',
            issue: 'Nie grzeje - prawdopodobnie magnetron'
          },
          estimatedCost: 320,
          notes: 'Klient będzie dostępny od 15:00. Przygotować magnetron na wymianę.'
        },
        {
          id: 'APP_005',
          orderId: 'ORD25272005',
          time: '16:00',
          duration: 45,
          status: 'planned',
          client: {
            name: 'Anna Kowalska',
            phone: '+48 905 678 901',
            address: 'ul. Jagiellońska 67, Kielce',
            coordinates: { lat: 50.8520, lng: 20.5980 }
          },
          device: {
            type: 'Odkurzacz',
            brand: 'Dyson',
            model: 'V11 Absolute',
            issue: 'Słaba moc ssania - czyszczenie filtrów'
          },
          estimatedCost: 120,
          notes: 'Szybka wizyta - wymiana i czyszczenie filtrów.'
        }
      ],
      summary: {
        totalAppointments: 5,
        completedAppointments: 2,
        totalPlannedTime: 390, // minuty
        totalDistance: 45.2, // km
        estimatedRevenue: 1320,
        actualRevenue: 700
      }
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'planned': return 'bg-gray-400';
      case 'delayed': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Ukończone';
      case 'in_progress': return 'W trakcie';
      case 'planned': return 'Zaplanowane';
      case 'delayed': return 'Opóźnione';
      case 'cancelled': return 'Anulowane';
      default: return 'Nieznany';
    }
  };

  const isCurrentAppointment = (appointment) => {
    const now = currentTime;
    const startTime = new Date();
    const [hours, minutes] = appointment.time.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const endTime = new Date(startTime.getTime() + appointment.duration * 60000);
    
    return now >= startTime && now <= endTime;
  };

  const calculateTravelTime = async (from, to) => {
    try {
      // Próbuj użyć Google Maps Directions API dla rzeczywistych czasów
      const response = await fetch(`/api/calculate-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: `${from.lat},${from.lng}`,
          destination: `${to.lat},${to.lng}`,
          mode: 'driving'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            distance: data.route.distance,
            time: data.route.duration,
            realTime: true,
            trafficInfo: data.route.trafficInfo
          };
        }
      }
    } catch (error) {
      console.warn('Fallback to simple calculation:', error);
    }
    
    // Fallback - prosta kalkulacja na podstawie odległości
    const R = 6371;
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const travelTimeMinutes = Math.round((distance / 30) * 60); // 30 km/h średnia prędkość
    return { 
      distance: Math.round(distance * 10) / 10, 
      time: travelTimeMinutes,
      realTime: false 
    };
  };

  const startNavigation = (destination, nextAppointment = null) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Nawigacja mobilna - otwórz w aplikacji map
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address)}&travelmode=driving`;
      const appleMapsUrl = `http://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`;
      
      // Próbuj otworzyć Google Maps, jeśli nie działa to Apple Maps
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      window.open(isIOS ? appleMapsUrl : googleMapsUrl, '_system');
      
      // Jeśli jest kolejne zlecenie, przygotuj automatyczną nawigację
      if (nextAppointment) {
        scheduleNextNavigation(nextAppointment);
      }
    } else {
      // Desktop - otwórz w nowej karcie
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address)}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const scheduleNextNavigation = (nextAppointment) => {
    // Zapisz informacje o kolejnym zleceniu w localStorage
    const navigationData = {
      nextDestination: nextAppointment.client.coordinates,
      nextAddress: nextAppointment.client.address,
      nextClient: nextAppointment.client.name,
      nextTime: nextAppointment.time,
      scheduledFor: Date.now() + (5 * 60 * 1000) // Za 5 minut
    };
    
    localStorage.setItem('pendingNavigation', JSON.stringify(navigationData));
    
    // Powiadomienie użytkownika
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setTimeout(() => {
            new Notification('Następne zlecenie', {
              body: `Za 5 minut: ${nextAppointment.client.name} - ${nextAppointment.client.address}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }, 4 * 60 * 1000); // Powiadomienie za 4 minuty
        }
      });
    }
  };

  const generateDayRoute = async () => {
    console.log('🚀 generateDayRoute called, dayPlan:', dayPlan);
    
    if (!dayPlan?.appointments?.length) {
      console.log('❌ No dayPlan or appointments available');
      alert('Brak planu dnia lub terminów do nawigacji');
      return;
    }
    
    const waypoints = dayPlan.appointments.map(app => ({
      location: `${app.client.coordinates.lat},${app.client.coordinates.lng}`,
      stopover: true
    }));
    
    console.log('📍 Waypoints prepared:', waypoints);
    console.log('🏠 Origin:', `${dayPlan.serviceman.currentLocation.lat},${dayPlan.serviceman.currentLocation.lng}`);
    
    try {
      const requestBody = {
        origin: `${dayPlan.serviceman.currentLocation.lat},${dayPlan.serviceman.currentLocation.lng}`,
        waypoints: waypoints,
        optimizeWaypoints: true
      };
      
      console.log('📤 Sending request to API:', requestBody);
      
      const response = await fetch('/api/generate-day-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 API Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        
        if (data.success) {
          console.log('🗺️ Opening optimized route in Google Maps');
          // Otwórz zoptymalizowaną trasę w Google Maps
          const waypointsStr = waypoints.map(w => w.location).join('|');
          const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${dayPlan.serviceman.currentLocation.lat},${dayPlan.serviceman.currentLocation.lng}&destination=${waypoints[waypoints.length-1].location}&waypoints=${waypointsStr}&travelmode=driving`;
          console.log('🔗 Route URL:', routeUrl);
          window.open(routeUrl, '_blank');
        } else {
          console.log('❌ API returned error:', data.error);
          alert(`Błąd API: ${data.error}`);
        }
      } else {
        console.log('❌ API Request failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('Error details:', errorData);
        alert(`Błąd żądania: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Network or other error:', error);
      alert(`Błąd sieci: ${error.message}`);
      
      // Fallback - prosta trasa bez optymalizacji
      console.log('🔄 Using fallback simple route');
      const simpleRouteUrl = `https://www.google.com/maps/dir/${dayPlan.serviceman.currentLocation.lat},${dayPlan.serviceman.currentLocation.lng}/${waypoints.map(w => w.location).join('/')}/`;
      console.log('🔗 Fallback Route URL:', simpleRouteUrl);
      window.open(simpleRouteUrl, '_blank');
    }
  };

  const calculateSimpleDistance = (from, to) => {
    const R = 6371;
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!dayPlan) {
    return <div className="flex items-center justify-center h-64">Ładowanie planu dnia...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek z informacjami o serwisancie */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {dayPlan.serviceman.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{dayPlan.serviceman.name}</h2>
              <p className="text-gray-600">Plan dnia: {new Date(dayPlan.date).toLocaleDateString('pl-PL')}</p>
              <p className="text-sm text-gray-500">
                Godziny pracy: {dayPlan.workingHours.start} - {dayPlan.workingHours.end}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={generateDayRoute}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Wygeneruj trasę całego dnia"
            >
              <Route className="h-4 w-4" />
              Trasa dnia
            </button>
            <button 
              onClick={() => window.open(`tel:${dayPlan.serviceman.phone}`, '_self')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Phone className="h-4 w-4" />
              Zadzwoń
            </button>
          </div>
        </div>
        
        {/* Podsumowanie dnia */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Wizyty</p>
                <p className="text-2xl font-bold text-blue-900">
                  {dayPlan.summary.completedAppointments}/{dayPlan.summary.totalAppointments}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Ukończone</p>
                <p className="text-2xl font-bold text-green-900">{dayPlan.summary.completedAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Dystans</p>
                <p className="text-2xl font-bold text-purple-900">{dayPlan.summary.totalDistance}km</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Czas pracy</p>
                <p className="text-2xl font-bold text-yellow-900">{Math.floor(dayPlan.summary.totalPlannedTime / 60)}h</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-indigo-600">Przychód</p>
                <p className="text-2xl font-bold text-indigo-900">{dayPlan.summary.actualRevenue}zł</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline wizyt */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Harmonogram wizyt</h3>
        
        <div className="space-y-6">
          {dayPlan.appointments.map((appointment, index) => {
            const prevLocation = index === 0 
              ? dayPlan.serviceman.currentLocation 
              : dayPlan.appointments[index - 1].client.coordinates;
            // Użyj rzeczywistych danych podróży jeśli dostępne, lub oblicz podstawowe
            const realTimeTravel = realTimeTravelData[index.toString()];
            const travel = realTimeTravel || {
              distance: Math.round(calculateSimpleDistance(prevLocation, appointment.client.coordinates) * 10) / 10,
              time: Math.round(calculateSimpleDistance(prevLocation, appointment.client.coordinates) * 2), // ~2 min/km w mieście
              realTime: false
            };
            const isCurrent = isCurrentAppointment(appointment);
            
            return (
              <div key={appointment.id} className="relative">
                {/* Linia timeline */}
                {index < dayPlan.appointments.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                <div className={`flex gap-4 ${isCurrent ? 'bg-blue-50 -mx-4 px-4 py-4 rounded-lg border-l-4 border-blue-500' : ''}`}>
                  {/* Status indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full ${getStatusColor(appointment.status)} flex items-center justify-center text-white font-semibold`}>
                      {appointment.status === 'completed' ? <CheckCircle className="h-6 w-6" /> :
                       appointment.status === 'in_progress' ? <Clock className="h-6 w-6" /> :
                       index + 1}
                    </div>
                    {index > 0 && (
                      <div className="mt-2 text-xs text-center">
                        <div className="text-gray-700 font-medium">{travel.distance}km</div>
                        <div className={`flex items-center justify-center gap-1 ${
                          travel.realTime 
                            ? travel.trafficInfo?.delay > 5 
                              ? 'text-red-600' 
                              : travel.trafficInfo?.delay > 2 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                            : 'text-gray-500'
                        }`}>
                          <Timer className="h-3 w-3" />
                          {travel.time}min
                          {travel.realTime && travel.trafficInfo?.delay > 0 && (
                            <span className="text-red-500">+{travel.trafficInfo.delay}</span>
                          )}
                        </div>
                        {travel.realTime && (
                          <div className="text-xs text-blue-600">📡 live</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Szczegóły wizyty */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg text-gray-900">
                          {appointment.time} - {appointment.client.name}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(appointment.status)}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full animate-pulse">
                            TERAZ
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.open(`tel:${appointment.client.phone}`, '_self')}
                          className="p-2 text-gray-400 hover:text-green-600" 
                          title="Zadzwoń do klienta"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const nextApp = dayPlan.appointments[index + 1];
                            startNavigation(appointment.client, nextApp);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1" 
                          title="Nawiguj do klienta"
                        >
                          <Navigation className="h-4 w-4" />
                          Jedź
                        </button>
                        {appointment.status === 'completed' && index < dayPlan.appointments.length - 1 && (
                          <button 
                            onClick={() => {
                              const nextApp = dayPlan.appointments[index + 1];
                              startNavigation(nextApp.client);
                            }}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1" 
                            title="Jedź do kolejnego zlecenia"
                          >
                            <Car className="h-4 w-4" />
                            Następny
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Informacje o kliencie */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.client.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Planowany czas: {appointment.duration} min</span>
                        </div>
                      </div>
                      
                      {/* Informacje o urządzeniu */}
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Urządzenie:</span>
                          <span className="ml-2 text-gray-600">
                            {appointment.device.brand} {appointment.device.model}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Problem:</span>
                          <span className="ml-2 text-gray-600">{appointment.device.issue}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Szacunkowy koszt:</span>
                          <span className="ml-2 text-green-600 font-semibold">{appointment.estimatedCost} zł</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rzeczywisty czas i notatki */}
                    {(appointment.actualStartTime || appointment.notes) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        {appointment.actualStartTime && (
                          <div className="text-sm mb-2">
                            <span className="font-medium text-gray-700">Rzeczywisty czas:</span>
                            <span className="ml-2">
                              {appointment.actualStartTime}
                              {appointment.actualEndTime && ` - ${appointment.actualEndTime}`}
                            </span>
                          </div>
                        )}
                        {appointment.notes && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Notatki:</span>
                            <p className="ml-2 mt-1 text-gray-600">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServicemanDayPlanner;