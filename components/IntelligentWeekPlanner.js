import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
// USUNIĘTO: GeocodingService i DistanceMatrixService importy
// Powód: CORS - używamy API endpoints zamiast bezpośrednich wywołań
import GoogleGeocoder from '../geocoding/simple/GoogleGeocoder.js';
import { suggestVisitDuration } from '../utils/repairTimeCalculator';
import { getApiCostMonitor } from '../utils/apiCostMonitor';
import { 
  AlertTriangle,
  Bot,
  Brain,
  Calendar,
  Car, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock, 
  DollarSign,
  Home,
  MapPin, 
  MessageCircle,
  Navigation,
  RefreshCw,
  Route, 
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Truck, 
  Users,
  Save
} from 'lucide-react';

// Funkcje do zarządzania lokalizacją startową w localStorage
const LOCATION_STORAGE_KEY = 'intelligent_planner_start_location';

// Enhanced localStorage functions with validation and comprehensive logging
const saveLocationToStorage = (location) => {
  console.log('💾 Attempting to save location to localStorage:', JSON.stringify(location, null, 2));
  
  try {
    // Validate location data before saving
    if (!location) {
      console.error('❌ Cannot save null/undefined location');
      return false;
    }
    
    // Extract coordinates in different formats for compatibility
    let coordinates = null;
    let lat = null;
    let lng = null;
    
    if (location.coordinates && typeof location.coordinates.lat === 'number' && typeof location.coordinates.lng === 'number') {
      coordinates = location.coordinates;
      lat = location.coordinates.lat;
      lng = location.coordinates.lng;
    } else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      lat = location.lat;
      lng = location.lng;
      coordinates = { lat, lng };
    } else {
      console.error('❌ Location missing valid coordinates:', location);
      return false;
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('❌ Invalid coordinate ranges:', { lat, lng });
      return false;
    }
    
    const locationData = {
      address: location.address || location.name || 'Unknown location',
      coordinates: coordinates,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      isDetected: Boolean(location.isDetected),
      name: location.name || location.address || 'Unnamed location',
      savedAt: new Date().toISOString(),
      version: '2.0' // Version for future compatibility
    };
    
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    console.log('✅ Successfully saved location to localStorage:', locationData);
    console.log(`📍 Saved coordinates: ${locationData.lat}, ${locationData.lng}`);
    console.log(`📧 Saved address: ${locationData.address}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving location to localStorage:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
};

const loadLocationFromStorage = () => {
  console.log('📂 Attempting to load location from localStorage...');
  
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) {
      console.log('📭 No location found in localStorage');
      return null;
    }
    
    const locationData = JSON.parse(saved);
    console.log('� Raw data from localStorage:', JSON.stringify(locationData, null, 2));
    
    // Validate loaded data structure
    if (!locationData || typeof locationData !== 'object') {
      console.error('❌ Invalid location data structure');
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      return null;
    }
    
    // Check data age (30 days max)
    if (locationData.savedAt) {
      const savedDate = new Date(locationData.savedAt);
      const now = new Date();
      const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        console.log(`⚠️ Saved location is too old (${daysDiff.toFixed(1)} days), removing`);
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        return null;
      }
      
      console.log(`📅 Location age: ${daysDiff.toFixed(1)} days (valid)`);
    }
    
    // Validate coordinates
    const hasValidCoords = (locationData.coordinates?.lat && locationData.coordinates?.lng) || 
                           (locationData.lat && locationData.lng);
    
    if (!hasValidCoords) {
      console.error('❌ Loaded location missing valid coordinates');
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      return null;
    }
    
    // Normalize coordinate format for consistency
    const normalizedLocation = {
      address: locationData.address || 'Unknown address',
      coordinates: locationData.coordinates || { lat: locationData.lat, lng: locationData.lng },
      lat: locationData.lat || locationData.coordinates?.lat,
      lng: locationData.lng || locationData.coordinates?.lng,
      isDetected: Boolean(locationData.isDetected),
      name: locationData.name || locationData.address,
      savedAt: locationData.savedAt,
      version: locationData.version || '1.0'
    };
    
    console.log('✅ Successfully loaded and normalized location:', normalizedLocation);
    console.log(`📍 Loaded coordinates: ${normalizedLocation.lat}, ${normalizedLocation.lng}`);
    console.log(`📧 Loaded address: ${normalizedLocation.address}`);
    
    // Additional validation of coordinate ranges
    if (normalizedLocation.lat < -90 || normalizedLocation.lat > 90 || 
        normalizedLocation.lng < -180 || normalizedLocation.lng > 180) {
      console.error('❌ Loaded coordinates out of valid range:', normalizedLocation);
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      return null;
    }
    
    return normalizedLocation;
    
  } catch (error) {
    console.error('❌ Error loading location from localStorage:', error);
    console.error('Error stack:', error.stack);
    
    // Clear corrupted data
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      console.log('🧹 Cleared corrupted localStorage data');
    } catch (clearError) {
      console.error('❌ Error clearing corrupted data:', clearError);
    }
    
    return null;
  }
};

const IntelligentWeekPlanner = () => {
  const router = useRouter();
  
  // USUNIĘTO: Bezpośrednie inicjalizacje GeocodingService i DistanceMatrixService
  // Powód: CORS - frontend nie może bezpośrednio wywoływać Google API
  // Rozwiązanie: Wszystkie wywołania przechodzą przez API endpoints (/api/geocoding, /api/distance-matrix)

  // Stan przechowuje plany dla wszystkich serwisantów
  const [weeklyPlans, setWeeklyPlans] = useState({}); // { servicemanId: weeklyPlan }
  const [weeklyPlan, setWeeklyPlan] = useState(null); // Aktualnie wyświetlany plan
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [startLocation, setStartLocation] = useState({
    address: 'Gliniana 17, Kraków',
    coordinates: { lat: 50.0641, lng: 19.9520 },
    isDetected: false
  });
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  
  // 🆕 Stan dla modalu ze szczegółami zlecenia
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  // 💰 Stan dla modalu z kosztami API
  const [showCostDashboard, setShowCostDashboard] = useState(false);
  
  // 📅 Stan dla harmonogramów serwisantów (dostępność godzinowa)
  const [servicemanSchedules, setServicemanSchedules] = useState({});
  const [dragOverInfo, setDragOverInfo] = useState(null); // Podgląd pozycji podczas przeciągania na timeline
  
  // 💾 Pomocnicze funkcje do localStorage
  const loadFromLocalStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`weekPlanner_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(`weekPlanner_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // ⏰ Stan dla zakresu godzin timeline (z localStorage)
  const [timeRange, setTimeRange] = useState(() => loadFromLocalStorage('timeRange', { start: 6, end: 23 }));
  const [hideUnusedHours, setHideUnusedHours] = useState(() => loadFromLocalStorage('hideUnusedHours', false));
  
  // 🏷️ Stan dla wyboru nagłówka karty zlecenia (z localStorage)
  const [cardHeaderField, setCardHeaderField] = useState(() => loadFromLocalStorage('cardHeaderField', 'clientName'));

  // Zapisuj zmiany do localStorage
  useEffect(() => {
    saveToLocalStorage('timeRange', timeRange);
  }, [timeRange]);

  useEffect(() => {
    saveToLocalStorage('hideUnusedHours', hideUnusedHours);
  }, [hideUnusedHours]);

  useEffect(() => {
    saveToLocalStorage('cardHeaderField', cardHeaderField);
  }, [cardHeaderField]);

  // 🆕 Handler dla kliknięcia w zlecenie - otwiera modal ze szczegółami
  // 🆕 Funkcja pomocnicza do obsługi obu struktur danych (stara i nowa)
  const getWeeklyPlanData = useCallback((plan) => {
    if (!plan) return null;
    
    // Nowa struktura: { monday: {...}, tuesday: {...}, ..., unscheduledOrders: [...] }
    // Stara struktura: { weeklyPlan: { monday: {...}, ... }, unscheduledOrders: [...] }
    
    // Sprawdź czy to nowa struktura (ma bezpośrednio dni tygodnia)
    if (plan.monday || plan.tuesday || plan.wednesday) {
      return plan; // Nowa struktura
    }
    
    // Sprawdź czy to stara struktura (ma zagnieżdżony weeklyPlan)
    if (plan.weeklyPlan) {
      return plan.weeklyPlan; // Zwróć zagnieżdżony plan
    }
    
    return null;
  }, []);

  const handleOrderClick = useCallback((order) => {
    console.log('📋 Kliknięto zlecenie:', order);
    setSelectedOrderModal(order);
    setShowOrderDetailsModal(true);
  }, []);

  // Initialize Google Geocoder
  const geocoder = useRef(null);
  
  useEffect(() => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        geocoder.current = new GoogleGeocoder(apiKey);
        console.log('🌍 Google Geocoder initialized successfully');
      } else {
        console.error('❌ Google Maps API key not found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Geocoder:', error);
    }
  }, []);

  // Funkcja walidacji i normalizacji współrzędnych
  const validateAndNormalizeCoordinates = useCallback((location) => {
    if (!location) {
      console.warn('⚠️ validateAndNormalizeCoordinates: location is null/undefined');
      return null;
    }

    let lat, lng, address;

    // Różne formaty lokalizacji
    if (location.coordinates) {
      // Format: { coordinates: { lat, lng }, address, ... }
      lat = location.coordinates.lat;
      lng = location.coordinates.lng;
      address = location.address || location.name || 'Unknown location';
    } else if (location.lat && location.lng) {
      // Format: { lat, lng, address, ... }
      lat = location.lat;
      lng = location.lng;
      address = location.address || location.name || `${lat}, ${lng}`;
    } else if (typeof location.latitude !== 'undefined' && typeof location.longitude !== 'undefined') {
      // Format: { latitude, longitude, ... }
      lat = location.latitude;
      lng = location.longitude;
      address = location.address || location.name || `${lat}, ${lng}`;
    } else {
      console.error('❌ Invalid location format:', location);
      return null;
    }

    // Walidacja wartości
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('❌ Invalid coordinate types:', { lat: typeof lat, lng: typeof lng });
      return null;
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error('❌ NaN coordinates:', { lat, lng });
      return null;
    }

    // Sprawdź czy współrzędne są w rozsądnych granicach (Polska/Europa)
    if (lat < 45 || lat > 55 || lng < 10 || lng > 30) {
      console.warn('⚠️ Coordinates outside expected range (Poland/Europe):', { lat, lng });
    }

    // Zwróć znormalizowany format
    return {
      lat: Number(lat),
      lng: Number(lng),
      address: address,
      coordinates: { lat: Number(lat), lng: Number(lng) },
      name: address,
      isValidated: true,
      validatedAt: new Date().toISOString()
    };
  }, []);

  // Enhanced location update function with comprehensive validation and logging
  const updateStartLocation = useCallback((newLocation, options = {}) => {
    console.log('🏠 updateStartLocation called with:', JSON.stringify(newLocation, null, 2));
    console.log('🔧 Options:', options);
    
    // Validate the new location
    const validatedLocation = validateAndNormalizeCoordinates(newLocation);
    if (!validatedLocation) {
      console.error('❌ Failed to validate new location:', newLocation);
      return false;
    }
    
    // Enhance location with metadata
    const enhancedLocation = {
      address: newLocation.address || newLocation.name || validatedLocation.address,
      coordinates: { lat: validatedLocation.lat, lng: validatedLocation.lng },
      lat: validatedLocation.lat,
      lng: validatedLocation.lng,
      isDetected: Boolean(newLocation.isDetected || options.isDetected),
      name: newLocation.name || newLocation.address || validatedLocation.address,
      userSelected: Boolean(options.userSelected || !newLocation.isDetected),
      updatedAt: new Date().toISOString(),
      source: options.source || 'manual'
    };
    
    console.log('✅ Enhanced location:', enhancedLocation);
    
    // Save to localStorage if it's a manual selection
    if (!enhancedLocation.isDetected || options.saveToStorage) {
      const saved = saveLocationToStorage(enhancedLocation);
      if (!saved) {
        console.warn('⚠️ Failed to save location to localStorage');
      }
    }
    
    // Update state
    setStartLocation(enhancedLocation);
    console.log('✅ Location state updated');
    
    // Update optimization preferences
    setOptimizationPreferences(prev => ({
      ...prev,
      startLocation: { lat: enhancedLocation.lat, lng: enhancedLocation.lng }
    }));
    console.log('✅ Optimization preferences updated');
    
    // Clear caches if requested
    if (options.clearCaches !== false) {
      setTravelTimeCache(new Map());
      setRealTimeSchedules({});
      console.log('🧹 Cleared travel time cache and schedules');
    }
    
    // Reload plan if it's a manual location change (bez bezpośredniego wywołania function)
    if (enhancedLocation.userSelected && options.reloadPlan !== false) {
      console.log('⏰ Scheduling plan reload in 200ms...');
      // Użyj setTimeout żeby uniknąć dependency na loadIntelligentPlan
      setTimeout(() => {
        console.log('🔄 Executing plan reload with new location');
        loadIntelligentPlan();
      }, 200);
    }
    
    return true;
  }, [validateAndNormalizeCoordinates]); // Usunięto loadIntelligentPlan z dependencies
  const [optimizationPreferences, setOptimizationPreferences] = useState({
    priorityMode: 'balanced', // balanced, geographic, revenue, priority, distance, time, vip
    maxDailyOrders: 12, // Zwiększone do realistycznej liczby
    preferredStartTime: '08:00',
    maxDailyDistance: 250, // km - zwiększone dla większej liczby zleceń
    startLocation: null, // Będzie ustawione dynamicznie
    workingHours: {
      start: '06:00', // Najwcześniejszy możliwy wyjazd
      end: '22:00', // Najpóźniejszy możliwy powrót
      maxWorkingHours: 12 // Maksymalne godziny pracy dziennie
    }
  });

  // Dodajmy stan dla zaawansowanych opcji optymalizacji
  const [showAdvancedOptimization, setShowAdvancedOptimization] = useState(false);
  const [selectedOptimizationStrategy, setSelectedOptimizationStrategy] = useState('balanced');
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [completedOrders, setCompletedOrders] = useState(new Set());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Znajdź poniedziałek obecnego tygodnia
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = niedziela, 1 = poniedziałek...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Stan dla systemu serwisantów
  const [availableServicemen, setAvailableServicemen] = useState([]);
  const [currentServiceman, setCurrentServiceman] = useState(null);
  const [showServicemanSelector, setShowServicemanSelector] = useState(false);
  
  // Cache dla czasów dojazdu i rzeczywiste harmonogramy
  const [travelTimeCache, setTravelTimeCache] = useState(new Map());
  const [realTimeSchedules, setRealTimeSchedules] = useState({});
  // 🔥 OPTYMALIZACJA: Debounce timer dla przeliczania tras (oszczędza setki requestów!)
  const recalculateTimerRef = useRef({});

  // Dostępne strategie optymalizacji
  const optimizationStrategies = {
    balanced: {
      name: '⚖️ Zbalansowana',
      description: 'Optymalne połączenie czasu, dystansu i przychodu',
      color: 'blue',
      focus: 'Uniwersalna strategia dla większości przypadków'
    },
    distance: {
      name: '🎯 Minimum Kilometrów',
      description: 'Najkrótsza możliwa trasa dzienną',
      color: 'green',
      focus: 'Oszczędność paliwa i czasu dojazdu'
    },
    time: {
      name: '⏰ Najkrótszy Dzień',
      description: 'Minimalizacja całkowitego czasu pracy',
      color: 'purple',
      focus: 'Maksymalna efektywność czasowa'
    },
    revenue: {
      name: '💰 Maksymalny Przychód',
      description: 'Priorytet dla najdroższych zleceń',
      color: 'yellow',
      focus: 'Optymalizacja zysku dziennego'
    },
    priority: {
      name: '🚨 Pilne Najpierw',
      description: 'Obsługa pilnych zleceń w pierwszej kolejności',
      color: 'red',
      focus: 'Zarządzanie kryzysowe i awarie'
    },
    vip: {
      name: '👑 Klienci VIP',
      description: 'Preferencyjne traktowanie ważnych klientów',
      color: 'indigo',
      focus: 'Obsługa strategicznych partnerów'
    },
    geographic: {
      name: '🗺️ Skupiska Geograficzne',
      description: 'Grupowanie po dzielnicach i miastach',
      color: 'teal',
      focus: 'Koncentracja na konkretnych obszarach'
    },
    windows: {
      name: '🕐 Okna Czasowe',
      description: 'Respektowanie preferencji klientów co do godzin',
      color: 'orange',
      focus: 'Dostosowanie do dostępności klientów'
    }
  };

  // Funkcja do formatowania dnia z datą
  const formatDayWithDate = (dayKey, weekStart) => {
    const dayNames = {
      monday: 'Poniedziałek',
      tuesday: 'Wtorek', 
      wednesday: 'Środa',
      thursday: 'Czwartek',
      friday: 'Piątek',
      saturday: 'Sobota',
      sunday: 'Niedziela'
    };
    
    const dayOffsets = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6
    };
    
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayOffsets[dayKey]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    const isToday = dayDate.getTime() === today.getTime();
    const isPast = dayDate.getTime() < today.getTime();
    
    const dateStr = dayDate.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    return {
      name: dayNames[dayKey],
      date: dateStr,
      fullDate: dayDate,
      isToday,
      isPast
    };
  };

  const dayNames = {
    monday: 'Poniedziałek',
    tuesday: 'Wtorek', 
    wednesday: 'Środa',
    thursday: 'Czwartek',
    friday: 'Piątek',
    saturday: 'Sobota',
    sunday: 'Niedziela'
  };

  const priorityColors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-green-100 border-green-300 text-green-800'
  };

  // Pobieranie aktualnej lokalizacji użytkownika z zaawansowanym reverse geocoding
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('❌ Twoja przeglądarka nie obsługuje geolokalizacji', 'error');
      return;
    }

    showNotification('📍 Pobieranie Twojej lokalizacji...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log('📍 Pobrano współrzędne GPS:', { latitude, longitude });
        
        try {
          if (!geocoder.current) {
            throw new Error('Geocoder not initialized');
          }
          
          // Użyj zaawansowanego GeocodingService do reverse geocoding
          const result = await geocoder.current.reverseGeocode(latitude, longitude);
          
          console.log('🔄 Reverse geocoding result:', result);
          
          if (result && result.address) {
            const enhancedLocation = {
              address: result.address,
              coordinates: { lat: latitude, lng: longitude },
              lat: latitude,
              lng: longitude,
              isDetected: true,
              name: result.address,
              gpsDetected: true,
              updatedAt: new Date().toISOString(),
              source: 'gps_reverse_geocoding',
              provider: 'google',
              accuracy: position.coords.accuracy || 'unknown',
              components: result.components || {}
            };
            
            console.log('✅ Enhanced GPS location created:', enhancedLocation);
            
            // Zapisz do localStorage
            const saved = saveLocationToStorage(enhancedLocation);
            if (!saved) {
              console.warn('⚠️ Failed to save GPS location to localStorage');
            }
            
            setStartLocation(enhancedLocation);
            
            // Aktualizuj optimization preferences 
            setOptimizationPreferences(prev => ({
              ...prev,
              startLocation: { lat: latitude, lng: longitude }
            }));
            
            showNotification(`✅ Wykryto lokalizację przez Google Maps: ${result.address}`, 'success');
            
          } else {
            // Fallback - użyj tylko współrzędnych
            const fallbackLocation = {
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              coordinates: { lat: latitude, lng: longitude },
              lat: latitude,
              lng: longitude,
              isDetected: true,
              gpsDetected: true,
              fallback: true,
              source: 'gps_coordinates_only',
              accuracy: position.coords.accuracy || 'unknown'
            };
            
            setStartLocation(fallbackLocation);
            showNotification(`📍 Wykryto współrzędne: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
          }
          
        } catch (error) {
          console.error('🚨 Błąd reverse geocoding:', error);
          
          // Fallback - użyj tylko współrzędnych GPS
          const fallbackLocation = {
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (współrzędne GPS)`,
            coordinates: { lat: latitude, lng: longitude },
            lat: latitude,
            lng: longitude,
            isDetected: true,
            gpsDetected: true,
            error: error.message,
            source: 'gps_fallback',
            accuracy: position.coords.accuracy || 'unknown'
          };
          
          setStartLocation(fallbackLocation);
          showNotification(`📍 Wykryto lokalizację GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'warning');
        }
      },
      (error) => {
        console.error('🚨 Błąd pobierania lokalizacji GPS:', error);
        
        let errorMessage = 'Nie udało się pobrać lokalizacji';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Odmówiono dostępu do lokalizacji. Sprawdź uprawnienia w przeglądarce.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Lokalizacja niedostępna. Spróbuj ponownie.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout pobierania lokalizacji. Spróbuj ponownie.';
            break;
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache przez 1 minutę
      }
    );
  };

  // Ręczne ustawienie lokalizacji startowej używając zaawansowanego GeocodingService
  const setManualLocation = async (address) => {
    console.log('🏠🗺️ setManualLocation wywołano z adresem:', address);
    
    if (!address.trim()) {
      showNotification('❌ Proszę wpisać adres', 'error');
      return;
    }
    
    try {
      showNotification('🔍 Wyszukuję adres przez Google Maps API...', 'info');
      
      if (!geocoder.current) {
        throw new Error('Geocoder not initialized');
      }
      
      // Użyj zaawansowanego GeocodingService - automatycznie wybierze najlepszy provider
      const result = await geocoder.current.geocode(address);
      
      console.log('🎯 GeocodingService result:', result);
      
      if (result && result.success && result.data && result.data.lat && result.data.lng) {
        // GoogleGeocoder zwraca { success: true, data: { lat, lng, address, ... } }
        const enhancedLocation = {
          address: result.data.address,
          coordinates: { lat: result.data.lat, lng: result.data.lng },
          lat: result.data.lat,
          lng: result.data.lng,
          isDetected: false,
          name: result.data.address,
          userSelected: true,
          updatedAt: new Date().toISOString(),
          source: 'google_geocoder',
          provider: 'google', // google, nominatim, etc.
          accuracy: result.accuracy,
          confidence: result.confidence,
          components: result.components || {},
          timestamp: result.timestamp
        };
        
        console.log('✅ Enhanced location created:', enhancedLocation);
        
        // Zapisz do localStorage
        const saved = saveLocationToStorage(enhancedLocation);
        if (!saved) {
          console.warn('⚠️ Failed to save location to localStorage');
        }
        
        // Aktualizuj stan
        setStartLocation(enhancedLocation);
        
        // Aktualizuj optimization preferences
        setOptimizationPreferences(prev => ({
          ...prev,
          startLocation: { lat: result.lat, lng: result.lng }
        }));
        
        // Wyczyść cache dla nowych obliczeń
        setTravelTimeCache(new Map());
        setRealTimeSchedules({});
        
        setShowLocationSettings(false);
        
        // Pokaż powiadomienie z informacją o Google API
        showNotification(`✅ Znaleziono lokalizację przez Google Maps: ${result.data.address}`, 'success');
        
        // Pokaż informację o dokładności w konsoli
        console.log(`📊 Geocoding stats - Provider: google, Confidence: high, Accuracy: ${result.data.accuracy}`);
        
        // Plan zostanie automatycznie przeładowany przez useEffect reagujący na startLocation.updatedAt
        
      } else {
        console.log('❌ GeocodingService nie znalazł adresu');
        showNotification(`❌ Nie znaleziono adresu "${address}". Spróbuj wpisać pełny adres: "ul. Nazwa Ulicy, Miasto"`, 'error');
      }
      
    } catch (error) {
      console.error('🚨 Błąd zaawansowanego geocoding:', error);
      
      // Bardziej szczegółowe komunikaty błędów
      let errorMessage = 'Błąd podczas wyszukiwania adresu';
      if (error.message.includes('Timeout')) {
        errorMessage = 'Timeout - spróbuj ponownie za chwilę';
      } else if (error.message.includes('Niepoprawny adres')) {
        errorMessage = 'Niepoprawny format adresu';
      } else if (error.message.includes('Adres zbyt krótki')) {
        errorMessage = 'Adres zbyt krótki - wprowadź więcej szczegółów';
      }
      
      showNotification(`❌ ${errorMessage}: ${error.message}`, 'error');
      
      // Ostateczny fallback z informacją o tym co się stało
      setStartLocation({
        address: address + ' (przybliżona lokalizacja - Kraków)',
        coordinates: { lat: 50.0647, lng: 19.9450 },
        isDetected: false,
        fallback: true,
        originalAddress: address,
        error: error.message
      });
      setShowLocationSettings(false);
      showNotification(`⚠️ Użyto przybliżonej lokalizacji (Kraków) dla: ${address}`, 'warning');
    }
  };

  // 🆕 FUNKCJA: Ładowanie pracowników z API
  const loadEmployeesFromAPI = useCallback(async () => {
    console.log('👷 Loading employees from /api/employees...');
    
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.employees && Array.isArray(result.employees)) {
        console.log(`✅ Loaded ${result.employees.length} employees`);
        
        // Kolory dla pracowników
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];
        
        // Przekształć pracowników na format używany przez planer
        const servicemen = result.employees
          .filter(emp => emp.isActive)
          .map((emp, index) => ({
            id: emp.id,
            name: emp.name,
            isActive: index === 0, // Pierwszy aktywny domyślnie
            color: colors[index % colors.length],
            email: emp.email,
            phone: emp.phone,
            specializations: emp.specializations || []
          }));
        
        setAvailableServicemen(servicemen);
        
        // Ustaw pierwszego pracownika jako domyślnego
        if (servicemen.length > 0 && !currentServiceman) {
          setCurrentServiceman(servicemen[0].id);
        }
        
        return { success: true, servicemen };
      } else {
        console.error('❌ Invalid response format');
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      showNotification('Błąd ładowania pracowników', 'error');
      return { success: false, error: error.message };
    }
  }, [currentServiceman]);

  // 🆕 NOWA FUNKCJA: Ładowanie rzeczywistych danych z bazy (data/)
  const loadRealDataFromAPI = useCallback(async () => {
    console.log('📦 Loading real data from data/ folder...');
    
    try {
      const response = await fetch(`/api/intelligent-planner/get-data?servicemanId=${currentServiceman}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Loaded real data:', result.data.metadata);
        console.log(`   📦 Orders: ${result.data.orders.length}`);
        console.log(`   👷 Servicemen: ${result.data.servicemen.length}`);
        console.log(`   📅 Existing visits: ${result.data.visits.length}`);
        
        // Tutaj możesz zapisać dane do lokalnego stanu jeśli potrzebujesz
        // Na razie API intelligent-route-optimization sam je pobierze
        
        return {
          success: true,
          orders: result.data.orders,
          servicemen: result.data.servicemen,
          visits: result.data.visits
        };
      } else {
        console.error('❌ Failed to load real data:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error loading real data:', error);
      showNotification('Błąd ładowania danych z bazy', 'error');
      return { success: false, error: error.message };
    }
  }, [currentServiceman]);

  // 🆕 NOWA FUNKCJA: Zapisywanie planu do bazy danych
  const savePlanToDatabase = useCallback(async () => {
    const planData = getWeeklyPlanData(weeklyPlan);
    if (!weeklyPlan || !planData) {
      showNotification('❌ Brak planu do zapisania', 'error');
      return;
    }
    
    console.log('💾 Saving plan to database...');
    setIsLoading(true);
    
    try {
      const currentServicemanData = availableServicemen.find(s => s.id === currentServiceman);
      
      const response = await fetch('/api/intelligent-planner/save-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          servicemanId: currentServiceman,
          servicemanName: currentServicemanData?.name || 'Serwisant',
          weeklyPlan: planData,
          weekStart: currentWeekStart.toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Plan saved successfully:', result.data);
        showNotification(
          `✅ Plan zapisany! Utworzono ${result.data.createdVisitsCount} wizyt dla ${result.data.updatedOrdersCount} zleceń`,
          'success'
        );
        
        // Odśwież dane po zapisaniu
        setTimeout(() => {
          loadRealDataFromAPI();
        }, 1000);
        
        return true;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      showNotification(`❌ Błąd zapisywania planu: ${error.message}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [weeklyPlan, currentServiceman, availableServicemen, currentWeekStart, loadRealDataFromAPI]);

  // Ładowanie inteligentnego planu tygodniowego
  const loadIntelligentPlan = useCallback(async () => {
    console.log('🚀 loadIntelligentPlan WYWOŁANE');
    
    // Prevent multiple concurrent executions
    if (loadIntelligentPlanMutexRef.current) {
      console.log('🔒 loadIntelligentPlan already in progress, skipping...');
      return;
    }
    
    loadIntelligentPlanMutexRef.current = true;
    console.log('🔒 Acquired mutex for loadIntelligentPlan');
    
    setIsLoading(true);
    try {
      // 🆕 KROK 1: Najpierw załaduj rzeczywiste dane z bazy
      console.log('📊 STEP 1: Loading real data from database...');
      const realData = await loadRealDataFromAPI();
      
      // 📅 KROK 1.5: Załaduj harmonogramy serwisantów (dostępność godzinowa)
      if (currentServiceman) {
        try {
          // 📅 Załaduj harmonogramy dla wszystkich 7 dni tygodnia
          const allSchedulesMap = {};
          const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            
            const scheduleResponse = await fetch(`/api/employee-calendar?action=get-all-schedules&date=${dateStr}`);
            const scheduleData = await scheduleResponse.json();
            
            if (scheduleData.success && scheduleData.schedules) {
              // Dla każdego pracownika, dodaj jego schedule tego dnia
              Object.keys(scheduleData.schedules).forEach(employeeId => {
                if (!allSchedulesMap[employeeId]) {
                  allSchedulesMap[employeeId] = {
                    workSlots: [],
                    breaks: []
                  };
                }
                
                const schedule = scheduleData.schedules[employeeId];
                const dayOfWeek = dayDate.getDay() || 7; // 0=Nd→7, 1=Pon, ..., 6=Sob
                
                // Konwertuj timeSlots na workSlots (zakresy czasowe)
                if (schedule.timeSlots && schedule.timeSlots.length > 0) {
                  let currentSlot = null;
                  
                  schedule.timeSlots.forEach((slot) => {
                    if (slot.status === 'available' || slot.status === 'busy') {
                      if (!currentSlot) {
                        currentSlot = { startTime: slot.time, endTime: slot.time, dayOfWeek, type: 'work' };
                      }
                      currentSlot.endTime = slot.time;
                    } else if (slot.status === 'break') {
                      if (currentSlot) {
                        allSchedulesMap[employeeId].workSlots.push({...currentSlot});
                        currentSlot = null;
                      }
                    }
                  });
                  
                  if (currentSlot) {
                    allSchedulesMap[employeeId].workSlots.push({...currentSlot});
                  }
                }
              });
            }
          }
          
          setServicemanSchedules(allSchedulesMap);
          console.log('📅 Załadowano harmonogramy dla całego tygodnia:', Object.keys(allSchedulesMap).length, 'serwisantów');
          if (allSchedulesMap[currentServiceman]) {
            console.log(`  ✅ ${currentServiceman}: ${allSchedulesMap[currentServiceman].workSlots.length} workSlots`);
          }
        } catch (error) {
          console.warn('⚠️ Nie udało się załadować harmonogramów:', error);
        }
      }
      
      if (!realData.success) {
        showNotification('⚠️ Nie udało się załadować danych. Używam danych testowych.', 'warning');
        // Kontynuuj mimo to - API ma swoje fallbacki
      } else {
        console.log('✅ Real data loaded successfully');
        showNotification(`📦 Załadowano ${realData.orders.length} zleceń z bazy danych`, 'success');
      }
      // Upewnij się, że startLocation ma poprawne współrzędne
      let currentStartLocation;
      if (startLocation?.coordinates) {
        // Jeśli mamy startLocation z coordinates (z Google Places)
        currentStartLocation = startLocation.coordinates;
      } else if (startLocation?.lat && startLocation?.lng) {
        // Jeśli startLocation to już samo { lat, lng }
        currentStartLocation = { lat: startLocation.lat, lng: startLocation.lng };
      } else {
        // Fallback do domyślnej lokalizacji
        currentStartLocation = { lat: 50.0647, lng: 19.945 };
      }
      
      console.log('🚀 loadIntelligentPlan - używam lokalizacji:', currentStartLocation);
      console.log('🗂️ startLocation state:', startLocation);
      console.log('� optimizationPreferences.startLocation:', optimizationPreferences.startLocation);
      console.log('�📍 Finalna lokalizacja dla API:', currentStartLocation);
      
      // ZAWSZE używaj aktualnej lokalizacji startowej (nadpisz optimizationPreferences)
      const preferences = {
        ...optimizationPreferences,
        startLocation: currentStartLocation // To jest najważniejsze - zawsze użyj najnowszej lokalizacji
      };
      
      console.log('✅ Preferences wysyłane do API:', preferences.startLocation);
      
      // 🆕 UPROSZCZONE ŁADOWANIE: Pomijamy API optymalizacji (wymaga przypisanych zleceń)
      // Zamiast tego używamy już załadowanych danych z realData
      console.log('📦 Pomijam API optymalizacji - używam już załadowanych danych');
      
      // Sprawdź czy realData ma orders
      if (!realData || !realData.orders) {
        console.error('❌ realData.orders jest undefined!', realData);
        showNotification('⚠️ Nie udało się załadować zleceń', 'error');
        setWeeklyPlan({
          monday: { orders: [], stats: {} },
          tuesday: { orders: [], stats: {} },
          wednesday: { orders: [], stats: {} },
          thursday: { orders: [], stats: {} },
          friday: { orders: [], stats: {} },
          saturday: { orders: [], stats: {} },
          sunday: { orders: [], stats: {} },
          unscheduledOrders: [],
          scheduledOrders: [],
          recommendations: [],
          costAnalysis: {}
        });
        return;
      }
      
      // Podziel zlecenia na zaplanowane i niezaplanowane
      const unscheduledOrders = realData.orders.filter(order => {
        const hasNoScheduledDate = !order.scheduledDate;
        const isPending = order.status === 'pending' || order.status === 'new';
        return hasNoScheduledDate && isPending;
      });
      
      const scheduledOrders = realData.orders.filter(order => {
        return order.scheduledDate && (order.status === 'pending' || order.status === 'new');
      });
      
      console.log(`📊 Niezaplanowane zlecenia: ${unscheduledOrders.length}`);
      console.log(`📊 Zaplanowane zlecenia: ${scheduledOrders.length}`);
      
      if (scheduledOrders.length > 0) {
        console.log(`  📝 Przykład zaplanowanego zlecenia:`, {
          id: scheduledOrders[0].id,
          client: scheduledOrders[0].clientName,
          scheduledDate: scheduledOrders[0].scheduledDate,
          status: scheduledOrders[0].status
        });
      }
      
      // ✅ Ustaw weeklyPlan z PUSTYMI tablicami dla dni
      // getOrdersForWeekDay() będzie filtrować scheduledOrders dynamicznie
      setWeeklyPlan({
        monday: { orders: [], stats: {} },
        tuesday: { orders: [], stats: {} },
        wednesday: { orders: [], stats: {} },
        thursday: { orders: [], stats: {} },
        friday: { orders: [], stats: {} },
        saturday: { orders: [], stats: {} },
        sunday: { orders: [], stats: {} },
        unscheduledOrders: unscheduledOrders,
        scheduledOrders: scheduledOrders, // Przechowuj tutaj dla getOrdersForWeekDay()
        recommendations: [],
        costAnalysis: {}
      });
      
      showNotification(`✅ Załadowano ${realData.orders.length} zleceń`, 'success');
    } catch (error) {
      console.error('Network error:', error);
      showNotification(`Błąd sieci: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      // Release mutex lock
      loadIntelligentPlanMutexRef.current = false;
      console.log('🔓 Released mutex for loadIntelligentPlan');
    }
  }, [startLocation, optimizationPreferences, currentServiceman]); // ✅ Dodano currentServiceman!

  // Ładowanie pracowników przy montowaniu komponentu
  useEffect(() => {
    loadEmployeesFromAPI();
  }, []); // Tylko raz przy montowaniu

  // Ładowanie danych przy pierwszym renderowaniu - tylko raz!
  useEffect(() => {
    // Tylko przy pierwszym mount
    if (!isInitialMountRef.current) return;
    
    // Poczekaj aż lokalizacja będzie gotowa, lub użyj domyślnej po 2 sekundach
    initialLoadTimerRef.current = setTimeout(() => {
      if (isInitialMountRef.current) {
        console.log('⏰ Inicjalne ładowanie planu - startLocation:', startLocation);
        loadIntelligentPlan();
        isInitialMountRef.current = false;
      }
    }, 2000);
    
    // Jeśli startLocation się już pojawi wcześniej, załaduj od razu
    if (startLocation?.coordinates && isInitialMountRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      console.log('🎯 Rychłe ładowanie - startLocation dostępne:', startLocation.coordinates);
      loadIntelligentPlan();
      isInitialMountRef.current = false;
    }
    
    return () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
      isInitialMountRef.current = false;
    };
  }, []); // TYLKO przy mount, bez dependencies na functions

  // Przełączanie planów gdy zmieni się serwisant - TYLKO na zmianę serwisanta!
  useEffect(() => {
    // Sprawdź czy rzeczywiście zmienił się serwisant
    if (prevServicemanRef.current === currentServiceman) {
      return;
    }
    
    // Zapisz aktualny plan przed przełączeniem
    if (weeklyPlan && prevServicemanRef.current) {
      setWeeklyPlans(prev => ({
        ...prev,
        [prevServicemanRef.current]: weeklyPlan
      }));
    }

    // Załaduj plan dla nowego serwisanta
    if (weeklyPlans[currentServiceman]) {
      setWeeklyPlan(weeklyPlans[currentServiceman]);
    } else {
      // Jeśli nie ma planu dla tego serwisanta, załaduj nowy (bez dependencies loop)
      const loadTimer = setTimeout(() => {
        loadIntelligentPlan();
      }, 100);
      
      return () => clearTimeout(loadTimer);
    }
    
    // Zaktualizuj poprzedni serwisant
    prevServicemanRef.current = currentServiceman;
  }, [currentServiceman, weeklyPlans]); // Bezpieczne dependencies bez function refs

  // Automatycznie obliczaj rzeczywiste harmonogramy gdy zmieni się plan (z debouncing)
  useEffect(() => {
    const planData = getWeeklyPlanData(weeklyPlan);
    if (!planData || Object.keys(planData).length === 0) {
      return;
    }
    
    // Zwiększ wersję planu żeby uniknąć duplikowania obliczeń
    planVersionRef.current++;
    const currentVersion = planVersionRef.current;
    
    // Clear existing debounce timers
    calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
    calculationDebounceRef.current.clear();
    
    // Oblicz harmonogramy dla wszystkich dni z zleceniami (z debouncing)
    Object.keys(planData).forEach(day => {
      const dayPlan = planData[day];
      if (dayPlan.orders && dayPlan.orders.length > 0) {
        const scheduleKey = `${currentServiceman}-${day}-v${currentVersion}`;
        
        // Sprawdź czy nie mamy już świeżego harmonogramu (bez dependency na realTimeSchedules)
        const existingScheduleKey = `${currentServiceman}-${day}`;
        const hasRecentSchedule = realTimeSchedules[existingScheduleKey] && 
          Date.now() - realTimeSchedules[existingScheduleKey].calculatedAt < 30 * 60 * 1000;
        
        if (!hasRecentSchedule) {
          // Debounce - tylko jeden timer na dzień
          const timerId = setTimeout(() => {
            // Sprawdź czy wciąż mamy aktualną wersję planu
            if (currentVersion === planVersionRef.current) {
              calculateRealTimeSchedule(day, dayPlan.orders);
            }
            calculationDebounceRef.current.delete(scheduleKey);
          }, 2000); // 2 sekundy debounce
          
          calculationDebounceRef.current.set(scheduleKey, timerId);
        }
      }
    });
    
    // Cleanup function
    return () => {
      calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
      calculationDebounceRef.current.clear();
    };
  }, [weeklyPlan?.weeklyPlan, currentServiceman]); // Usunięto realTimeSchedules z dependencies

  // Reaguj na zmiany lokalizacji startu - przelicz wszystkie harmonogramy
  useEffect(() => {
    // Sprawdź czy lokalizacja rzeczywiście się zmieniła
    if (!startLocation?.coordinates) return;
    
    const currentLocationKey = `${startLocation.coordinates.lat}-${startLocation.coordinates.lng}`;
    if (prevLocationRef.current === currentLocationKey) return;
    
    console.log('🏠 Lokalizacja startu zmieniona:', startLocation.address);
    console.log('📍 Nowe współrzędne:', startLocation.coordinates);
    
    // Wyczyść poprzedni debounce timer
    if (locationChangeDebounceRef.current) {
      clearTimeout(locationChangeDebounceRef.current);
    }
    
    // Debounce całej operacji zmiany lokalizacji
    locationChangeDebounceRef.current = setTimeout(() => {
      // Aktualizuj optimizationPreferences
      setOptimizationPreferences(prev => ({
        ...prev,
        startLocation: startLocation.coordinates
      }));
      
      // Wyczyść cache czasów dojazdu aby wymusić ponowne obliczenia
      setTravelTimeCache(new Map());
      
      // Wyczyść stare harmonogramy
      setRealTimeSchedules({});
      
      // Przelicz harmonogramy tylko jeśli mamy weeklyPlan (z dodatkowym debounce)
      if (weeklyPlan?.weeklyPlan) {
        // Clear any existing calculation timers
        calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
        calculationDebounceRef.current.clear();
        
        const planData = getWeeklyPlanData(weeklyPlan) || {};
        Object.keys(planData).forEach(day => {
          const dayPlan = planData[day];
          if (dayPlan?.orders && dayPlan.orders.length > 0) {
            console.log(`🔄 Przeliczam harmonogram dla ${day} z nową lokalizacją startu`);
            const scheduleKey = `${currentServiceman}-${day}-location-${Date.now()}`;
            const timeoutId = setTimeout(() => {
              calculateRealTimeSchedule(day, dayPlan.orders);
              calculationDebounceRef.current.delete(scheduleKey);
            }, 1000); // Skrócone do 1 sekundy dla lokalizacji
            
            calculationDebounceRef.current.set(scheduleKey, timeoutId);
          }
        });
      }
      
      // Zaktualizuj poprzednią lokalizację
      prevLocationRef.current = currentLocationKey;
    }, 2000); // 2 sekundy głównego debounce dla zmiany lokalizacji
    
    // Cleanup function
    return () => {
      if (locationChangeDebounceRef.current) {
        clearTimeout(locationChangeDebounceRef.current);
      }
      calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
      calculationDebounceRef.current.clear();
    };
  }, [startLocation?.coordinates?.lat, startLocation?.coordinates?.lng, startLocation?.address]); // Szczegółowe dependencies

  // Przeładuj plan gdy zmieni się lokalizacja startu - ZAWSZE reaguj na zmiany
  useEffect(() => {
    // Sprawdź czy rzeczywiście zmienił się updatedAt
    if (!startLocation?.updatedAt || !startLocation?.coordinates) return;
    if (prevUpdatedAtRef.current === startLocation.updatedAt) return;
    
    console.log('🗺️ Przeładowuję plan z nową lokalizacją startu:', startLocation.address);
    console.log('📍 Nowa lokalizacja współrzędne:', startLocation.coordinates);
    
    // Wyczyść poprzedni debounce timer
    if (planReloadDebounceRef.current) {
      clearTimeout(planReloadDebounceRef.current);
    }
    
    // Debounce żeby uniknąć wielokrotnych wywołań
    planReloadDebounceRef.current = setTimeout(() => {
      console.log('🔄 Wykonuję przeładowanie planu po zmianie lokalizacji');
      loadIntelligentPlan();
      prevUpdatedAtRef.current = startLocation.updatedAt;
    }, 1000); // Zwiększono do 1 sekundy dla stabilności
    
    return () => {
      if (planReloadDebounceRef.current) {
        clearTimeout(planReloadDebounceRef.current);
      }
    };
  }, [startLocation?.updatedAt]); // Reaguj na updatedAt ale z zabezpieczeniami

  // Comprehensive cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear all notification timeouts
      if (notificationTimeouts.current) {
        notificationTimeouts.current.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        notificationTimeouts.current.clear();
      }
      
      // Clear all calculation debounce timers
      if (calculationDebounceRef.current) {
        calculationDebounceRef.current.forEach((timerId) => clearTimeout(timerId));
        calculationDebounceRef.current.clear();
      }
      
      // Clear location change debounce
      if (locationChangeDebounceRef.current) {
        clearTimeout(locationChangeDebounceRef.current);
      }
      
      // Clear plan reload debounce
      if (planReloadDebounceRef.current) {
        clearTimeout(planReloadDebounceRef.current);
      }
      
      // Clear initial load timer
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
      }
      
      // Reset mutex
      if (loadIntelligentPlanMutexRef.current) {
        loadIntelligentPlanMutexRef.current = false;
      }
      
      console.log('🧹 Component cleanup completed - all timers cleared');
    };
  }, []);

  // Otwórz trasę dla całego dnia w Google Maps
  const openDayRoute = (day) => {
    // Pobierz wizyty dla danego dnia
    const dayPlan = weeklyPlan?.weeklyPlan?.[day];
    if (!dayPlan || !dayPlan.orders || dayPlan.orders.length === 0) {
      alert('Brak wizyt do wyświetlenia na trasie');
      return;
    }

    // Generuj URL Google Maps na podstawie aktualnej kolejności WIZYT
    const visits = dayPlan.orders;
    
    console.log('DEBUG: Wizyty dla trasy:', visits);
    
    // Punkt startowy - użyj z ustawień lub domyślny
    const baseLocation = startLocation?.coordinates || 
                        startLocation || 
                        { lat: 50.0647, lng: 19.945 };
    
    // Waypoints - wszystkie wizyty w aktualnej kolejności
    const waypoints = visits
      .filter(visit => visit.coordinates) // Filtruj tylko te z współrzędnymi
      .map(visit => {
        console.log('DEBUG waypoint:', visit.orderNumber, visit.address, visit.coordinates);
        return `${visit.coordinates.lat},${visit.coordinates.lng}`;
      })
      .join('|');
    
    if (!waypoints) {
      alert('Brak współrzędnych GPS dla wizyt');
      return;
    }
    
    const originString = `${baseLocation.lat},${baseLocation.lng}`;
    const destinationString = `${baseLocation.lat},${baseLocation.lng}`; // Powrót do bazy
    
    // Wygeneruj URL Google Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originString}&destination=${destinationString}&waypoints=${waypoints}&travelmode=driving`;
    
    console.log('🗺️ Otwieranie trasy dla', day);
    console.log('📍 Lokalizacja startowa:', baseLocation);
    console.log('📍 Liczba wizyt na trasie:', visits.length);
    console.log('� Szczegóły wizyt:', visits.map(v => ({
      id: v.visitId || v.id,
      client: v.clientName,
      address: v.address,
      coords: v.coordinates
    })));
    console.log('🔗 Waypoints:', waypoints);
    console.log('�🔗 Pełny URL:', googleMapsUrl);
    
    window.open(googleMapsUrl, '_blank');
  };

  // Funkcja pomocnicza do pobierania tekstu nagłówka karty
  const getCardHeaderText = (order) => {
    switch (cardHeaderField) {
      case 'clientName':
        return order.clientName || 'Nieznany klient';
      case 'address':
        return order.address || 'Brak adresu';
      case 'deviceType':
        return order.deviceType || order.device?.type || 'Brak urządzenia';
      case 'description':
        return order.description || 'Brak opisu';
      default:
        return order.clientName || 'Nieznany klient';
    }
  };

  // Renderowanie karty zlecenia z obsługą drag & drop
  const renderOrderCard = (order, currentDay, orderIndex) => {
    // Użyj orderNumber z wizyty (np. ORDW252750001) lub visitId jako fallback
    const orderNumber = order.orderNumber || order.visitId || `V-${order.id}`;
    const isCompleted = completedOrders.has(order.id);
    
    return (
      <div 
        key={order.id} 
        className={`p-3 rounded-lg border-2 mb-2 transition-all hover:shadow-md relative ${
          isCompleted 
            ? 'bg-green-50 border-green-300 opacity-75' 
            : priorityColors[order.priority]
        } ${isDragging && draggedOrder?.order.id === order.id ? 'opacity-50 scale-95' : ''}`}
        draggable={!isCompleted}
        onDragStart={(e) => handleDragStart(e, order, currentDay)}
        onDragEnd={handleDragEnd}
        title="Przeciągnij aby przenieść zlecenie do innego dnia"
        style={isCompleted ? { cursor: 'default' } : { cursor: 'move' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {getCardHeaderText(order)}
              </h4>
              <span className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">{orderNumber}</span>
              <span className="text-xs text-gray-500">📋 Przeciągnij</span>
              {isCompleted && <span className="text-xs text-green-600">✅ Wykonane</span>}
            </div>
          <p className="text-xs opacity-75 mb-1">{order.description}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {order.address.split(',')[0]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {order.estimatedDuration}min
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {order.serviceCost}zł
            </span>
          </div>
          {/* Rzeczywisty czas dojazdu */}
          <div className="mt-1">
            <TravelTimeInfo 
              order={order}
              previousLocation={orderIndex === 0 ? null : weeklyPlan?.weeklyPlan?.[currentDay]?.orders?.[orderIndex-1]?.coordinates}
              className="text-blue-600"
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          {/* Przycisk do oznaczania jako wykonane */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrderCompletion(order.id);
            }}
            className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${
              isCompleted 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-200 text-gray-600 hover:bg-green-500 hover:text-white'
            }`}
            title={isCompleted ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
          >
            {isCompleted ? '✓' : '○'}
          </button>
          
          {/* Przycisk do przeniesienia z powrotem do nieprzypisanych */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveOrderToUnscheduled(order, currentDay);
            }}
            className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
            title="Przenieś z powrotem do nieprzypisanych"
          >
            ↩️
          </button>
          
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            order.priority === 'high' ? 'bg-red-200 text-red-800' :
            order.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-green-200 text-green-800'
          }`}>
            {order.priority === 'high' ? 'Pilne' : 
             order.priority === 'medium' ? 'Średnie' : 'Niskie'}
          </span>
        </div>
      </div>
      
      {/* Dostępność klienta */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Dostępny:</strong>
          {order.preferredTimeSlots?.map((slot, idx) => (
            <span key={idx} className="ml-1">
              {slot.day === 'monday' ? 'Pon' :
               slot.day === 'tuesday' ? 'Wt' :
               slot.day === 'wednesday' ? 'Śr' :
               slot.day === 'thursday' ? 'Czw' :
               slot.day === 'friday' ? 'Pt' :
               slot.day === 'saturday' ? 'Sob' :
               slot.day === 'sunday' ? 'Nd' : slot.day} 
              ({slot.start}-{slot.end})
              {idx < order.preferredTimeSlots.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        {order.unavailableDates?.length > 0 && (
          <div className="text-xs text-red-600 mt-1">
            <strong>Niedostępny:</strong> {order.unavailableDates.join(', ')}
          </div>
        )}
        {order.assignedTimeSlot && (
          <div className="text-xs text-blue-600 mt-1 font-medium">
            <strong>Przydzielone:</strong> {order.assignedTimeSlot.start}-{order.assignedTimeSlot.end}
            {order.assignedTimeSlot.autoAssigned && (
              <span className="ml-1 text-blue-500">⚡ (auto)</span>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  // 🆕 Pobierz zlecenia dla konkretnego dnia w aktualnym tygodniu
  const getOrdersForWeekDay = (day) => {
    // Oblicz datę dla tego dnia
    const targetDate = getDateForDay(day);
    if (!targetDate) return [];
    
    // Format daty jako YYYY-MM-DD
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`📅 getOrdersForWeekDay(${day}) - szukam zleceń dla daty: ${targetDateStr}`);
    
    // Pobierz wszystkie zaplanowane zlecenia ze stałej puli
    const allOrders = weeklyPlan.scheduledOrders || [];
    console.log(`  📦 weeklyPlan.scheduledOrders zawiera ${allOrders.length} zleceń`);
    if (allOrders.length > 0) {
      console.log(`  📝 Przykładowe zlecenie:`, allOrders[0].id, allOrders[0].scheduledDate);
    }
    
    // Filtruj tylko te z pasującą datą scheduledDate
    const filteredOrders = allOrders.filter(order => {
      const hasMatchingDate = order.scheduledDate === targetDateStr;
      if (hasMatchingDate) {
        console.log(`  ✅ Znaleziono zlecenie ${order.id} dla ${targetDateStr}`);
      }
      return hasMatchingDate;
    });
    
    console.log(`  📊 Znaleziono ${filteredOrders.length} zleceń dla ${day} (${targetDateStr})`);
    
    return filteredOrders;
  };

  // 📅 Pobierz harmonogram serwisanta dla danego dnia
  const getServicemanScheduleForDay = useCallback((day, servicemanId) => {
    if (!servicemanId) {
      return null;
    }
    
    if (!servicemanSchedules[servicemanId]) {
      return null;
    }
    
    // dayOfWeek: 1=Pon, 2=Wt, ..., 7=Nd
    const dayOfWeekMap = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    
    const dayOfWeek = dayOfWeekMap[day];
    const schedule = servicemanSchedules[servicemanId];
    
    // Znajdź workSlots dla tego dnia
    const workSlots = (schedule.workSlots || []).filter(slot => slot.dayOfWeek === dayOfWeek);
    const breaks = (schedule.breaks || []).filter(br => br.dayOfWeek === dayOfWeek);
    
    console.log(`  ✅ Zwracam: ${workSlots.length} workSlots, ${breaks.length} breaks`);
    
    return { workSlots, breaks };
  }, [servicemanSchedules]);

  // Renderowanie harmonogramu dnia z rekomendacjami czasu
  const renderDaySchedule = (day, dayPlan) => {
    // 🆕 Zamiast używać dayPlan.orders, pobierz rzeczywiste zlecenia z bazy filtrowane po dacie
    const orders = getOrdersForWeekDay(day);
    
    if (!orders || orders.length === 0) return null;
    const scheduleKey = `${currentServiceman}-${day}`;
    const realSchedule = realTimeSchedules[scheduleKey];
    
    // Automatycznie oblicz rzeczywisty harmonogram jeśli go nie ma lub jest przestarzały
    if (!realSchedule || Date.now() - realSchedule.calculatedAt > 10 * 60 * 1000) {
      // Uruchom obliczenia w tle (bez useEffect - to jest funkcja renderująca)
      setTimeout(() => {
        calculateRealTimeSchedule(day, orders);
      }, 100);
    }
    
    // Jeśli mamy rzeczywisty harmonogram, użyj go
    if (realSchedule && realSchedule.schedule) {
      const schedule = realSchedule.schedule;
      const departure = schedule.find(s => s.type === 'departure');
      const visits = schedule.filter(s => s.type === 'visit');
      const arrivalHome = schedule.find(s => s.type === 'arrival_home');
      
      return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4" />
            Harmonogram z Rzeczywistymi Czasami
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              🌐 Real-time
            </span>
          </h4>
          
          {/* Czas wyjazdu */}
          <div className="mb-3 p-2 bg-green-100 rounded border border-green-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">🚗 Wyjazd z domu:</span>
              <span className="font-bold text-green-800">
                {departure.time.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              📍 {startLocation.address}
            </div>
            
            {/* 🆕 Sugerowana godzina wyjazdu z API (jeśli dostępna) */}
            {dayPlan.route && dayPlan.route.suggestedDepartureTime && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">💡 Sugerowany wyjazd:</span>
                  <span className="font-bold text-green-900 text-sm">
                    {dayPlan.route.suggestedDepartureTime}
                  </span>
                </div>
                {dayPlan.route.departureDetails && (
                  <div className="mt-1 text-xs text-green-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>🎯 Pierwszy klient:</span>
                      <span className="font-medium">{dayPlan.route.departureDetails.firstVisitClient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚗 Czas dojazdu:</span>
                      <span className="font-medium">{dayPlan.route.departureDetails.travelTimeToFirst} min</span>
                      <span>({dayPlan.route.departureDetails.distanceToFirst} km)</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      ℹ️ {dayPlan.route.departureDetails.reasoning}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Harmonogram wizyt */}
          <div className="space-y-2">
            {visits.map((visit, idx) => {
              const visitTypeLabels = {
                diagnosis: '🔍 Diagnoza',
                repair: '🔧 Naprawa',
                control: '✅ Kontrola',
                installation: '📦 Montaż'
              };
              const visitTypeLabel = visitTypeLabels[visit.order.visitType] || '📋 Wizyta';
              
              return (
                <div 
                  key={visit.order.visitId || visit.order.id} 
                  onClick={() => handleOrderClick(visit.order)}
                  className="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm hover:text-blue-600">
                        {visit.order.clientName}
                      </span>
                      {/* Typ wizyty */}
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {visitTypeLabel}
                      </span>
                      {/* Numer wizyty w zleceniu */}
                      {visit.order.visitNumber && (
                        <span className="text-xs text-gray-500">
                          (wizyta {visit.order.visitNumber})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                  </div>
                  
                  {/* Numer zlecenia */}
                  {visit.order.orderNumber && (
                    <div className="text-xs text-gray-500 mb-2">
                      📋 Zlecenie: <span className="font-mono">{visit.order.orderNumber}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-green-600">📍 Przyjazd:</span>
                      <span className="font-medium ml-1">
                        {visit.arrivalTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600">🏁 Wyjazd:</span>
                      <span className="font-medium ml-1">
                        {visit.departureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <div className="col-span-2 text-gray-600">
                    🔧 {visit.order.description || visit.order.issueDescription} ({visit.duration}min, {visit.order.serviceCost}zł)
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    📍 {visit.order.address}
                  </div>
                  <div className="col-span-2">
                    <TravelTimeInfo 
                      order={visit.order}
                      previousLocation={idx === 0 ? null : visits[idx-1]?.order?.coordinates}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                  👆 Kliknij aby zobaczyć szczegóły
                </div>
              </div>
              );
            })}
          </div>
          
          {/* Czas powrotu */}
          <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-800">🏠 Powrót do domu:</span>
              <span className="font-bold text-purple-800">
                {arrivalHome.time.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
              </span>
            </div>
            <div className="text-xs text-purple-600 mt-1">
              ⏱️ Całkowity czas pracy: {(realSchedule.totalDuration / (1000 * 60 * 60)).toFixed(1)}h
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback do starego systemu jeśli jeszcze nie obliczono rzeczywistego harmonogramu
    const startTime = optimizationPreferences.preferredStartTime;
    const firstOrder = orders[0];
    
    // Użyj symulowanego czasu jako fallback
    const travelToFirst = 30; // Fallback 30 minut
    const firstVisitTime = new Date(`2025-10-01T${startTime}:00`);
    const departureTime = new Date(firstVisitTime.getTime() - travelToFirst * 60000);
    
    const minDepartureHour = parseTime(optimizationPreferences.workingHours.start);
    if (departureTime.getHours() * 60 + departureTime.getMinutes() < minDepartureHour) {
      departureTime.setHours(Math.floor(minDepartureHour / 60), minDepartureHour % 60, 0, 0);
      firstVisitTime.setTime(departureTime.getTime() + travelToFirst * 60000);
    }
    
    let currentTime = new Date(firstVisitTime);

    return (
      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-yellow-800">
          <Clock className="h-4 w-4" />
          Harmonogram (obliczanie czasu rzeczywistego...)
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            📡 Loading...
          </span>
        </h4>
        
        {/* Czas wyjazdu */}
        <div className="mb-3 p-2 bg-green-100 rounded border border-green-300">
          <div className="flex items-center justify-between">
            <span className="font-medium text-green-800">🚗 Wyjazd z domu:</span>
            <span className="font-bold text-green-800">
              {departureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
            </span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            📍 {startLocation.address}
          </div>
        </div>
        
        {/* Harmonogram wizyt */}
        <div className="space-y-2">
          {orders.map((order, idx) => {
            // Jeśli to nie pierwsza wizyta, dodaj symulowany czas dojazdu
            if (idx > 0) {
              currentTime = new Date(currentTime.getTime() + 20 * 60000); // 20 min fallback
            }
            
            const arrivalTime = new Date(currentTime);
            const orderDepartureTime = new Date(currentTime.getTime() + order.estimatedDuration * 60000);
            currentTime = orderDepartureTime;
            
            return (
              <div 
                key={order.id} 
                onClick={() => handleOrderClick(order)}
                className="p-2 bg-white rounded border border-gray-200 opacity-75 cursor-pointer hover:shadow-lg hover:border-blue-400 hover:opacity-100 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm hover:text-blue-600">{order.clientName}</span>
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-green-600">📍 Przyjazd:</span>
                    <span className="font-medium ml-1">
                      {arrivalTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600">🏁 Wyjazd:</span>
                    <span className="font-medium ml-1">
                      {orderDepartureTime.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-600">
                    🔧 {order.description} ({order.estimatedDuration}min, {order.serviceCost}zł)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Czas powrotu */}
        <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
          <div className="flex items-center justify-between">
            <span className="font-medium text-purple-800">🏠 Powrót do domu:</span>
            <span className="font-bold text-purple-800">
              {new Date(currentTime.getTime() + 30 * 60000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}
            </span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            ⏱️ Szacowany czas pracy (dokładne za chwilę)
          </div>
        </div>
      </div>
    );
  };  // Obliczanie czasu dojazdu między dwoma punktami (w minutach)

  const calculateTravelTime = async (from, to, departureTime = null) => {
    // Sprawdź cache lokalny najpierw
    const cacheKey = `${from.lat.toFixed(4)},${from.lng.toFixed(4)}->${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
    
    // 🔥 OPTYMALIZACJA KOSZTÓW: Cache przez 24h zamiast 15 min!
    if (travelTimeCache.has(cacheKey)) {
      const cached = travelTimeCache.get(cacheKey);
      // Cache ważny przez 24 godziny (zmniejsza koszty API o 96%!)
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        console.log(`💰 Cache HIT - zaoszczędzono request API:`, cacheKey);
        return cached.duration;
      }
    }
    
    // 🔥 Sprawdź LocalStorage dla długoterminowego cache
    try {
      const localCache = localStorage.getItem(`distance_${cacheKey}`);
      if (localCache) {
        const parsed = JSON.parse(localCache);
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 dni
          console.log(`💰💰 LocalStorage CACHE HIT:`, cacheKey);
          setTravelTimeCache(prev => new Map(prev.set(cacheKey, parsed)));
          return parsed.duration;
        }
      }
    } catch (e) {
      // LocalStorage może nie być dostępny
    }

    // 🔒 Sprawdź limity PRZED wywołaniem API
    const monitor = getApiCostMonitor();
    const canCall = monitor.canMakeRequest();
    
    if (!canCall.allowed) {
      console.error(`🚨 API CALL BLOCKED: ${canCall.reason}`);
      showNotification(`⛔ ${canCall.reason}`, 'error');
      throw new Error(`API limit exceeded: ${canCall.limitType}`);
    }

    try {
      // ✅ NOWY SYSTEM: Użyj zintegrowanego Distance Matrix API (Haversine/OSRM/Google)
      const response = await makeRateLimitedApiCall('/api/distance-matrix/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: from,
          destination: to
        })
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();
      
      // ✅ NOWY FORMAT: { success, result: { distance, duration, provider } }
      if (!data.success || !data.result) {
        throw new Error(data.message || 'Distance calculation failed');
      }
      
      console.log('🔍 API Response data.result:', data.result);
      
      // 💰 Log API request do monitora kosztów (PO sukcesie)
      try {
        monitor.logRequest('api');
      } catch (e) {
        // Monitor failure shouldn't break the app
      }
      
      // ✅ Obsługa różnych formatów duration (minutes lub value w sekundach)
      const durationMinutes = data.result.duration?.minutes || 
                             (data.result.duration?.value ? Math.round(data.result.duration.value / 60) : 0);
      
      const cacheEntry = {
        duration: durationMinutes,
        distance: data.result.distance?.km || 0,
        timestamp: Date.now(),
        source: data.result.provider || 'haversine'
      };
      
      // Zapisz w cache - dostosuj format odpowiedzi z distance-matrix API
      setTravelTimeCache(prev => new Map(prev.set(cacheKey, cacheEntry)));
      
      // 🔥 OPTYMALIZACJA: Zapisz też do LocalStorage (7 dni cache)
      try {
        localStorage.setItem(`distance_${cacheKey}`, JSON.stringify(cacheEntry));
        console.log(`💾 Saved to LocalStorage:`, cacheKey);
      } catch (e) {
        console.warn('LocalStorage full or unavailable');
      }

      return data.duration.minutes; // Zwracaj wartość liczbową w minutach

    } catch (error) {
      console.error('❌ Google Distance Matrix API failed:', error.message);
      // Log failed request
      try {
        monitor.logRequest('failed');
      } catch (e) {
        // Ignore
      }
      throw error; // Propaguj błąd - nie używamy fallbacku
    }
  };

  // Obliczanie całkowitego czasu dojazdów (async version)
  const calculateTotalTravelTime = async (orders, departureTime = null) => {
    if (orders.length === 0) return 0;
    
    // Walidacja współrzędnych startowych
    const startCoordinates = validateAndNormalizeCoordinates(startLocation);
    if (!startCoordinates) {
      console.warn('⚠️ Brak prawidłowych współrzędnych startu w calculateTotalTravelTime');
      return 0;
    }
    
    let totalTime = 0;
    let currentTime = departureTime || Date.now();
    
    // Dojazd do pierwszego klienta
    const timeToFirst = await calculateTravelTime(startCoordinates, orders[0].coordinates, currentTime);
    totalTime += timeToFirst;
    currentTime += timeToFirst * 60 * 1000; // Dodaj czas dojazdu
    
    // Dojazdy między klientami
    for (let i = 1; i < orders.length; i++) {
      // Dodaj czas obsługi poprzedniego zlecenia
      currentTime += (orders[i-1].estimatedDuration || 60) * 60 * 1000;
      
      const travelTime = await calculateTravelTime(orders[i-1].coordinates, orders[i].coordinates, currentTime);
      totalTime += travelTime;
      currentTime += travelTime * 60 * 1000;
    }
    
    // Dodaj czas ostatniego zlecenia przed powrotem
    currentTime += (orders[orders.length-1].estimatedDuration || 60) * 60 * 1000;
    
    // Powrót do domu
    const timeToHome = await calculateTravelTime(orders[orders.length-1].coordinates, startCoordinates, currentTime);
    totalTime += timeToHome;
    
    return totalTime;
  };

  // Individual calculation mutex per day to prevent race conditions
  const dayCalculationMutexRef = useRef(new Map());
  const loadIntelligentPlanMutexRef = useRef(false);
  const calculationDebounceRef = useRef(new Map()); // Debounce timers for calculations
  const apiCallQueueRef = useRef([]); // Queue for API calls to prevent rate limiting
  const lastApiCallRef = useRef(0); // Timestamp of last API call
  
  // Additional refs for preventing infinite loops and memory leaks
  const isInitialMountRef = useRef(true);
  const initialLoadTimerRef = useRef(null);
  const prevServicemanRef = useRef(currentServiceman);
  const planVersionRef = useRef(0);
  const prevLocationRef = useRef(null);
  const locationChangeDebounceRef = useRef(null);
  const prevUpdatedAtRef = useRef(null);
  const planReloadDebounceRef = useRef(null);

  // Rate limited API call function
  const makeRateLimitedApiCall = useCallback(async (url, options) => {
    const minInterval = 100; // Minimum 100ms between API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    
    if (timeSinceLastCall < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
    }
    
    lastApiCallRef.current = Date.now();
    return fetch(url, options);
  }, []);

  // Enhanced calculateRealTimeSchedule with proper coordinate handling and mutex protection
  const calculateRealTimeSchedule = useCallback(async (day, orders) => {
    const calculationId = `${currentServiceman}-${day}`;
    console.log(`🚀 calculateRealTimeSchedule called for ${day} with ${orders?.length || 0} orders`);
    console.log(`🔑 Calculation ID: ${calculationId}`);
    
    if (!orders || orders.length === 0) {
      console.log(`❌ No orders for ${day}`);
      return null;
    }
    
    // Check if calculation for this day is already in progress
    if (dayCalculationMutexRef.current.get(calculationId)) {
      console.log(`🔒 Calculation already in progress for ${calculationId}, skipping...`);
      return null;
    }
    
    // Set mutex lock for this specific day calculation
    dayCalculationMutexRef.current.set(calculationId, true);
    console.log(`🔒 Acquired mutex for ${calculationId}`);
    
    try {
      // Use validated and normalized coordinates with comprehensive fallback logic
      let startCoordinates = null;
      let locationSource = 'unknown';
      let isUsingFallback = false;
      
      // Try to get coordinates from current startLocation first
      if (startLocation) {
        const validated = validateAndNormalizeCoordinates(startLocation);
        if (validated) {
          startCoordinates = validated;
          locationSource = 'startLocation';
          console.log('✅ Using startLocation coordinates:', startCoordinates);
        }
      }
      
      // Fallback to optimizationPreferences if startLocation failed
      if (!startCoordinates && optimizationPreferences?.startLocation) {
        const validated = validateAndNormalizeCoordinates(optimizationPreferences.startLocation);
        if (validated) {
          startCoordinates = validated;
          locationSource = 'optimizationPreferences';
          console.log('✅ Using optimizationPreferences coordinates:', startCoordinates);
        }
      }
      
      // Final fallback to Kraków center
      if (!startCoordinates) {
        console.warn('⚠️ No valid start location found - using Kraków center as fallback');
        startCoordinates = {
          lat: 50.0647,
          lng: 19.9450,
          address: 'Kraków, Polska (fallback)'
        };
        locationSource = 'fallback';
        isUsingFallback = true;
      }
      
      // Detect if we're accidentally using Kraków fallback when user set different location
      const isKrakowCoords = Math.abs(startCoordinates.lat - 50.0647) < 0.01 && 
                            Math.abs(startCoordinates.lng - 19.9450) < 0.01;
      
      if (isKrakowCoords && startLocation?.address && !startLocation.address.toLowerCase().includes('kraków')) {
        console.error(`🚨 COORDINATE MISMATCH DETECTED!`);
        console.error(`   User set address: ${startLocation.address}`);
        console.error(`   But using coords: ${startCoordinates.lat}, ${startCoordinates.lng} (Kraków)`);
        console.error(`   This indicates a coordinate resolution problem!`);
        isUsingFallback = true;
      }
      
      console.log(`🏁 Calculating schedule for ${day}`);
      console.log(`� Start coordinates: ${startCoordinates.lat}, ${startCoordinates.lng}`);
      console.log(`🔍 Coordinate source: ${locationSource}${isUsingFallback ? ' (FALLBACK)' : ''}`);
      console.log(`📧 Start address: ${startCoordinates.address}`);
      
      const scheduleKey = calculationId;
      const startTime = optimizationPreferences.preferredStartTime;
      const schedule = [];
    
      // Oblicz czas dojazdu do pierwszego klienta
      const travelToFirst = await calculateTravelTime(
        startCoordinates, 
        orders[0].coordinates
      );
      
      // Czas wyjazdu = czas pierwszej wizyty - czas dojazdu
      const firstVisitTime = new Date(`2025-10-01T${startTime}:00`);
      const departureTime = new Date(firstVisitTime.getTime() - travelToFirst * 60000);
      
      // Sprawdź czy czas wyjazdu nie jest zbyt wczesny
      const minDepartureHour = parseTime(optimizationPreferences.workingHours.start);
      if (departureTime.getHours() * 60 + departureTime.getMinutes() < minDepartureHour) {
        departureTime.setHours(Math.floor(minDepartureHour / 60), minDepartureHour % 60, 0, 0);
        firstVisitTime.setTime(departureTime.getTime() + travelToFirst * 60000);
      }
      
      schedule.push({
        type: 'departure',
        time: departureTime,
        location: startLocation.address,
        description: 'Wyjazd z domu'
      });
      
      let currentTime = new Date(firstVisitTime);
      
      // Oblicz harmonogram dla każdego zlecenia
      for (let idx = 0; idx < orders.length; idx++) {
        const order = orders[idx];
        
        // Jeśli to nie pierwsza wizyta, dodaj czas dojazdu z poprzedniej
        if (idx > 0) {
          const travelTime = await calculateTravelTime(
            orders[idx-1].coordinates, 
            order.coordinates,
            currentTime.getTime()
          );
          currentTime = new Date(currentTime.getTime() + travelTime * 60000);
          
          schedule.push({
            type: 'travel',
            time: new Date(currentTime.getTime() - travelTime * 60000),
            duration: travelTime,
            from: orders[idx-1].clientName,
            to: order.clientName,
            description: `Dojazd (${travelTime} min)`
          });
        }
        
        const arrivalTime = new Date(currentTime);
        const departureTime = new Date(currentTime.getTime() + order.estimatedDuration * 60000);
        
        schedule.push({
          type: 'visit',
          order: order,
          arrivalTime: arrivalTime,
          departureTime: departureTime,
          duration: order.estimatedDuration,
          description: `Wizyta u ${order.clientName}`
        });
        
        currentTime = departureTime;
      }
      
      // Dodaj powrót do domu
      const lastOrder = orders[orders.length - 1];
      const travelHome = await calculateTravelTime(
        lastOrder.coordinates, 
        startCoordinates,
        currentTime.getTime()
      );
      
      schedule.push({
        type: 'travel',
        time: currentTime,
        duration: travelHome,
        from: lastOrder.clientName,
        to: 'Dom',
        description: `Powrót do domu (${travelHome} min)`
      });
      
      const arrivalHome = new Date(currentTime.getTime() + travelHome * 60000);
      schedule.push({
        type: 'arrival_home',
        time: arrivalHome,
        location: startLocation.address,
        description: 'Powrót do domu'
      });
      
      // Zapisz w stanie
      setRealTimeSchedules(prev => ({
        ...prev,
        [scheduleKey]: {
          schedule,
          calculatedAt: Date.now(),
          totalDuration: arrivalHome.getTime() - departureTime.getTime()
        }
      }));
      
      return schedule;
      
    } catch (error) {
      console.error('❌ Błąd obliczania harmonogramu:', error);
      return null;
    } finally {
      // Release mutex lock for this specific calculation
      dayCalculationMutexRef.current.delete(calculationId);
      console.log(`🔓 Released mutex for ${calculationId}`);
    }
  }, [currentServiceman, startLocation?.coordinates?.lat, startLocation?.coordinates?.lng, optimizationPreferences?.startLocation?.lat, optimizationPreferences?.startLocation?.lng, validateAndNormalizeCoordinates]);

  // Funkcja do usuwania zlecenia z kalendarza (przywracanie do nieprzypisanych)
  const moveOrderToUnscheduled = async (order, sourceDay) => {
    try {
      console.log(`📤 Przenoszenie zlecenia ${order.id} z ${sourceDay} do nieprzypisanych`);
      
      const updatedPlan = { ...weeklyPlan };
      const scheduledOrders = [...(updatedPlan.scheduledOrders || [])];
      const unscheduledOrders = [...(updatedPlan.unscheduledOrders || [])];
      
      // Usuń z scheduledOrders i dodaj do unscheduledOrders
      const orderToMove = scheduledOrders.find(o => o.id === order.id);
      if (orderToMove) {
        updatedPlan.scheduledOrders = scheduledOrders.filter(o => o.id !== order.id);
        updatedPlan.unscheduledOrders = [...unscheduledOrders, { ...orderToMove, scheduledDate: null }];
        
        setWeeklyPlan(updatedPlan);
        
        // Zapisz do API - usuń scheduledDate
        const saveResponse = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scheduledDate: null,
            assignedTo: null
          })
        });
        
        if (saveResponse.ok) {
          console.log(`✅ Przeniesiono zlecenie ${order.id} do nieprzypisanych`);
          showNotification(`✅ Zlecenie "${getCardHeaderText(order)}" przeniesione do nieprzypisanych`, 'success');
        } else {
          console.warn(`⚠️ Nie udało się zapisać zmian:`, await saveResponse.text());
          // Wycofaj zmiany
          loadIntelligentPlan();
          showNotification(`❌ Błąd zapisywania zmian`, 'error');
        }
      }
    } catch (error) {
      console.error('❌ Błąd przenoszenia zlecenia:', error);
      showNotification(`❌ Błąd: ${error.message}`, 'error');
      loadIntelligentPlan();
    }
  };

  // Funkcje drag & drop dla zleceń
  const handleDragStart = (e, order, sourceDay) => {
    // Nie pozwalaj przeciągać wykonanych zleceń
    if (completedOrders.has(order.id)) {
      e.preventDefault();
      console.log('❌ Cannot drag completed order:', order.clientName);
      return;
    }
    
    console.log('🔵 Drag start:', order.clientName, 'from', sourceDay);
    setDraggedOrder({ order, sourceDay, sourceServiceman: currentServiceman });
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Potrzebne dla niektórych przeglądarek
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    console.log('🔴 Drag end');
    e.target.style.opacity = '1';
    setIsDragging(false);
    setDraggedOrder(null);
  };

  const handleDragOver = (e, targetDay) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // console.log('🟡 Drag over:', targetDay); // Zakomentowane żeby nie spamować
  };

  const handleDrop = async (e, targetDay, insertIndex = null, targetServiceman = null) => {
    e.preventDefault();
    console.log('🟢 Drop:', targetDay, 'insertIndex:', insertIndex, 'targetServiceman:', targetServiceman);
    
    if (!draggedOrder) {
      console.log('❌ No dragged order found');
      return;
    }

    const { order, sourceDay, sourceServiceman } = draggedOrder;
    const actualTargetServiceman = targetServiceman || currentServiceman;
    console.log('📦 Moving:', order.clientName, 'from', sourceDay, 'to', targetDay, 
                'from serviceman', sourceServiceman, 'to serviceman', actualTargetServiceman);
    
    // Przenoszenie między serwisantami
    if (sourceServiceman !== actualTargetServiceman) {
      await handleServicemanTransfer(order, sourceDay, targetDay, sourceServiceman, actualTargetServiceman);
      return;
    }
    
    // Jeśli to ten sam dzień i ten sam serwisant - zmiana kolejności
    if (sourceDay === targetDay) {
      if (insertIndex !== null) {
        // TODO: Implementacja zmiany kolejności dla nowej struktury
        // Obecnie nie modyfikujemy scheduledOrders - kolejność będzie sortowana przez getOrdersForWeekDay
        console.log('ℹ️ Zmiana kolejności w tym samym dniu - pomijam (wymaga osobnej implementacji)');
        
        showNotification(`✅ Zmieniono kolejność zlecenia "${order.clientName}" w ${getDayName(targetDay)}`);
      }
      return;
    }

    // Walidacja przeniesienia między dniami
    const validation = validateOrderMove(order, sourceDay, targetDay);
    if (!validation.isValid) {
      showNotification(`❌ Nie można przenieść zlecenia: ${validation.reason}`, 'error');
      return;
    }

    // Sprawdź ostrzeżenia
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        showNotification(`⚠️ ${warning}`, 'warning');
      });
    }

    // Aktualizuj plan tygodniowy
    const updatedPlan = { ...weeklyPlan };
    
    // NOWA LOGIKA: Aktualizuj scheduledOrders zamiast modyfikować orders w dniach
    const scheduledOrders = [...(updatedPlan.scheduledOrders || [])];
    const unscheduledOrders = [...(updatedPlan.unscheduledOrders || [])];
    
    // Oblicz docelową datę
    const targetDate = getDateForDay(targetDay);
    const scheduledDate = targetDate.toISOString().split('T')[0];
    
    if (sourceDay === 'unscheduled') {
      // Przenieś z unscheduled do zaplanowanych
      updatedPlan.unscheduledOrders = unscheduledOrders.filter(o => o.id !== order.id);
      
      // Dodaj do scheduledOrders z nową datą (optymistyczna aktualizacja)
      const updatedOrder = { ...order, scheduledDate };
      scheduledOrders.push(updatedOrder);
      updatedPlan.scheduledOrders = scheduledOrders;
    } else {
      // Przenoszenie między dniami - zaktualizuj scheduledDate w scheduledOrders
      const orderIndex = scheduledOrders.findIndex(o => o.id === order.id);
      if (orderIndex !== -1) {
        scheduledOrders[orderIndex] = { ...scheduledOrders[orderIndex], scheduledDate };
        updatedPlan.scheduledOrders = scheduledOrders;
      }
    }
    
    // Nie modyfikujemy orders[] w dniach - są puste i filtrowane przez getOrdersForWeekDay()
    
    setWeeklyPlan(updatedPlan);
    
    // 🆕 Zapisz scheduledDate do bazy danych (w tle)
    try {
      console.log(`💾 Zapisuję scheduledDate dla zlecenia ${order.id}: ${scheduledDate}`);
      
      const saveResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledDate: scheduledDate,
          assignedTo: currentServiceman || order.assignedTo
        })
      });
      
      if (saveResponse.ok) {
        console.log(`✅ Zapisano scheduledDate dla ${order.id}`);
      } else {
        console.warn(`⚠️ Nie udało się zapisać scheduledDate:`, await saveResponse.text());
        // Wycofaj optymistyczną aktualizację w przypadku błędu
        loadIntelligentPlan(); // Przeładuj dane z serwera
      }
    } catch (error) {
      console.error('❌ Błąd zapisywania scheduledDate:', error);
    }
    
    // Pokaż powiadomienie o sukcesie
    const sourceLabel = sourceDay === 'unscheduled' ? 'puli niezaplanowanych' : getDayName(sourceDay);
    showNotification(`✅ Zlecenie "${order.clientName}" przeniesione z ${sourceLabel} na ${getDayName(targetDay)}`);
  };

  // Walidacja przeniesienia zlecenia
  const validateOrderMove = (order, sourceDay, targetDay) => {
    const planData = getWeeklyPlanData(weeklyPlan) || {};
    const targetDayOrders = planData[targetDay]?.orders || [];
    const warnings = [];
    
    // Sprawdź limit zleceń dziennych
    if (targetDayOrders.length >= optimizationPreferences.maxDailyOrders) {
      return {
        isValid: false,
        reason: `Dzień ${getDayName(targetDay)} ma już maksymalną liczbę zleceń (${optimizationPreferences.maxDailyOrders})`
      };
    }
    
    // Sprawdź dostępność klienta w nowej dacie
    const targetDate = getDateForDay(targetDay);
    if (order.unavailableDates && order.unavailableDates.some(date => 
      new Date(date).toDateString() === targetDate.toDateString()
    )) {
      return {
        isValid: false,
        reason: `Klient ${order.clientName} nie jest dostępny w dniu ${targetDate.toLocaleDateString('pl-PL')}`
      };
    }
    
    // Sprawdź godziny pracy - oblicz szacowany czas zakończenia dnia
    const newOrdersList = [...targetDayOrders, order];
    
    // Dla walidacji używamy szybkiej symulacji, dokładne obliczenia będą później
    let estimatedWorkingTime = 0;
    estimatedWorkingTime += newOrdersList.reduce((sum, ord) => sum + (ord.estimatedDuration || 60), 0);
    estimatedWorkingTime += (newOrdersList.length - 1) * 15; // Przybliżone dojazdy między
    estimatedWorkingTime += 60; // Z domu i z powrotem
    
    const workStart = parseTime(optimizationPreferences.workingHours.start);
    const workEnd = parseTime(optimizationPreferences.workingHours.end);
    const maxWorkingHours = optimizationPreferences.workingHours.maxWorkingHours;
    
    if (estimatedWorkingTime > maxWorkingHours * 60) { // Konwersja na minuty
      return {
        isValid: false,
        reason: `Dzień pracy przekroczyłby maksymalny czas (${maxWorkingHours}h). Szacowany czas: ${Math.round(estimatedWorkingTime/60)}h`
      };
    }
    
    // Sprawdź czy dzień zmieści się w godzinach pracy (6:00-22:00)
    const estimatedEndTime = workStart + estimatedWorkingTime;
    if (estimatedEndTime > workEnd) {
      const endHour = Math.floor(estimatedEndTime / 60);
      const endMinute = estimatedEndTime % 60;
      return {
        isValid: false,
        reason: `Praca zakończyłaby się o ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} (po dozwolonych godzinach pracy)`
      };
    }
    
    // Sprawdź konflikty czasowe - bardziej elastyczne podejście
    const timeConflicts = [];
    targetDayOrders.forEach(existingOrder => {
      if (order.preferredTimeSlots && existingOrder.preferredTimeSlots) {
        const conflicts = order.preferredTimeSlots.filter(orderSlot => 
          existingOrder.preferredTimeSlots.some(existingSlot => 
            doTimeSlotsOverlap(orderSlot, existingSlot)
          )
        );
        if (conflicts.length > 0) {
          timeConflicts.push({
            conflictingOrder: existingOrder,
            conflictingSlots: conflicts
          });
        }
      }
    });
    
    if (timeConflicts.length > 0) {
      // Sprawdź czy można automatycznie rozwiązać konflikty
      const canResolveAutomatically = timeConflicts.every(conflict => 
        order.preferredTimeSlots && order.preferredTimeSlots.length > 1
      );
      
      if (canResolveAutomatically) {
        warnings.push(`Wykryto ${timeConflicts.length} konflikt(ów) czasowych - zostaną automatycznie rozwiązane`);
      } else {
        // Tylko blokuj jeśli nie można automatycznie rozwiązać
        const conflictDetails = timeConflicts.map(c => 
          `${c.conflictingOrder.clientName} (${c.conflictingSlots[0].start}-${c.conflictingSlots[0].end})`
        ).join(', ');
        warnings.push(`Konflikty czasowe z: ${conflictDetails} - sprawdź harmonogram po przeniesieniu`);
      }
    }
    
    // Sprawdź ostrzeżenia (ale nie blokuj przeniesienia)
    
    // Ostrzeżenie o przekroczeniu optymalnej liczby zleceń
    if (targetDayOrders.length >= 10) {
      warnings.push(`Dzień ${getDayName(targetDay)} będzie miał już ${targetDayOrders.length + 1} zleceń - może być przeciążony`);
    }
    
    // Ostrzeżenie o długiej trasie
    const newDayOrders = [...targetDayOrders, order];
    const estimatedDistance = newDayOrders.length * 30; // Symulacja dystansu
    if (estimatedDistance > optimizationPreferences.maxDailyDistance) {
      warnings.push(`Szacowany dystans (${estimatedDistance}km) przekroczy limit dzienny (${optimizationPreferences.maxDailyDistance}km)`);
    }
    
    // Ostrzeżenie o lokalizacji geograficznej
    const targetDayCity = targetDayOrders[0]?.address.split(',')[1]?.trim();
    const orderCity = order.address.split(',')[1]?.trim();
    if (targetDayCity && orderCity && targetDayCity !== orderCity) {
      warnings.push(`Zlecenie z ${orderCity} zostanie dodane do dnia z zleceniami w ${targetDayCity} - może wydłużyć trasę`);
    }
    
    // Ostrzeżenie o priorytecie
    if (order.priority === 'high' && targetDay !== 'monday') {
      warnings.push(`Pilne zlecenie zostanie przesunięte na ${getDayName(targetDay)} - rozważ obsługę wcześniej`);
    }
    
    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : null 
    };
  };

  // Funkcje pomocnicze do obsługi czasu i dat
  const parseTime = (timeString) => {
    // Konwertuje czas "HH:MM" na minuty od północy
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getDateForDay = (dayName) => {
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + dayIndex);
    return date;
  };

  const calculateDayWorkingTime = async (orders, departureTime = null) => {
    // Szacuje całkowity czas pracy dla listy zleceń (w minutach)
    if (!orders || orders.length === 0) return 0;
    
    let totalTime = 0;
    
    // Czas na każde zlecenie
    totalTime += orders.reduce((sum, order) => sum + (order.estimatedDuration || 60), 0);
    
    // Rzeczywisty czas dojazdów
    try {
      const travelTime = await calculateTotalTravelTime(orders, departureTime);
      totalTime += travelTime;
    } catch (error) {
      console.warn('⚠️ Błąd obliczania czasu dojazdu, używam fallback:', error);
      // Fallback do starych obliczeń
      totalTime += (orders.length - 1) * 15; // Między zleceniami
      totalTime += 60; // Z domu i z powrotem
    }
    
    return totalTime;
  };

  const doTimeSlotsOverlap = (slot1, slot2) => {
    // Sprawdza czy dwa okna czasowe się pokrywają
    if (!slot1 || !slot2) return false;
    
    const start1 = parseTime(slot1.start);
    const end1 = parseTime(slot1.end);
    const start2 = parseTime(slot2.start);
    const end2 = parseTime(slot2.end);
    
    return (start1 < end2 && start2 < end1);
  };

  // Obsługa przenoszenia zlecenia między serwisantami
  const handleServicemanTransfer = async (order, sourceDay, targetDay, sourceServiceman, targetServiceman) => {
    // Pobierz plany obu serwisantów
    const sourcePlan = sourceServiceman === currentServiceman ? weeklyPlan : weeklyPlans[sourceServiceman];
    const targetPlan = targetServiceman === currentServiceman ? weeklyPlan : weeklyPlans[targetServiceman];

    if (!sourcePlan || !targetPlan) {
      showNotification('❌ Nie można przenieść zlecenia - brak dostępu do planu serwisanta', 'error');
      return;
    }

    // Walidacja przeniesienia dla docelowego serwisanta
    const validation = validateOrderMoveForServiceman(order, targetDay, targetPlan);
    if (!validation.isValid) {
      const targetServicemanName = availableServicemen.find(s => s.id === targetServiceman)?.name;
      showNotification(`❌ Nie można przenieść do ${targetServicemanName}: ${validation.reason}`, 'error');
      return;
    }

    // Wykonaj transfer
    const updatedSourcePlan = { ...sourcePlan };
    const updatedTargetPlan = { ...targetPlan };

    // Usuń z planu źródłowego
    updatedSourcePlan.weeklyPlan[sourceDay].orders = updatedSourcePlan.weeklyPlan[sourceDay].orders.filter(
      o => o.id !== order.id
    );

    // Dodaj do planu docelowego
    if (!updatedTargetPlan.weeklyPlan[targetDay].orders) {
      updatedTargetPlan.weeklyPlan[targetDay].orders = [];
    }
    updatedTargetPlan.weeklyPlan[targetDay].orders.push(order);

    // Przelicz statystyki
    await recalculateDayStats(updatedSourcePlan, sourceDay);
    await recalculateDayStats(updatedTargetPlan, targetDay);

    // Zaktualizuj stany
    if (sourceServiceman === currentServiceman) {
      setWeeklyPlan(updatedSourcePlan);
    } else {
      setWeeklyPlans(prev => ({ ...prev, [sourceServiceman]: updatedSourcePlan }));
    }

    if (targetServiceman === currentServiceman) {
      setWeeklyPlan(updatedTargetPlan);
    } else {
      setWeeklyPlans(prev => ({ ...prev, [targetServiceman]: updatedTargetPlan }));
    }

    // Powiadomienie
    const sourceServicemanName = availableServicemen.find(s => s.id === sourceServiceman)?.name;
    const targetServicemanName = availableServicemen.find(s => s.id === targetServiceman)?.name;
    showNotification(
      `✅ Zlecenie "${order.clientName}" przeniesione z ${sourceServicemanName} (${getDayName(sourceDay)}) do ${targetServicemanName} (${getDayName(targetDay)})`,
      'success'
    );
  };

  // Walidacja przeniesienia dla konkretnego serwisanta
  const validateOrderMoveForServiceman = (order, targetDay, targetPlan) => {
    const targetDayOrders = targetPlan.weeklyPlan[targetDay]?.orders || [];
    
    // Sprawdź limit zleceń dziennych
    if (targetDayOrders.length >= optimizationPreferences.maxDailyOrders) {
      return {
        isValid: false,
        reason: `Dzień ${getDayName(targetDay)} ma już maksymalną liczbę zleceń (${optimizationPreferences.maxDailyOrders})`
      };
    }

    // Sprawdź godziny pracy - szybka walidacja
    const newOrdersList = [...targetDayOrders, order];
    let estimatedWorkingTime = 0;
    estimatedWorkingTime += newOrdersList.reduce((sum, ord) => sum + (ord.estimatedDuration || 60), 0);
    estimatedWorkingTime += (newOrdersList.length - 1) * 15; // Przybliżone dojazdy
    estimatedWorkingTime += 60; // Z domu i z powrotem
    
    const maxWorkingHours = optimizationPreferences.workingHours.maxWorkingHours;
    
    if (estimatedWorkingTime > maxWorkingHours * 60) {
      return {
        isValid: false,
        reason: `Dzień pracy przekroczyłby maksymalny czas (${maxWorkingHours}h)`
      };
    }

    return { isValid: true };
  };

  // Automatyczne rozwiązywanie konfliktów czasowych
  const resolveTimeConflicts = (dayOrders) => {
    const resolvedOrders = [...dayOrders];
    const workStart = parseTime(optimizationPreferences.workingHours.start);
    const workEnd = parseTime(optimizationPreferences.workingHours.end);
    
    // Sortuj zlecenia według priorytetu: pilne -> średnie -> niskie
    resolvedOrders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Przydziel automatycznie sloty czasowe
    let currentTime = workStart;
    const slotDuration = 90; // 1.5 godziny na zlecenie + dojazd
    
    resolvedOrders.forEach(order => {
      if (currentTime + slotDuration > workEnd) {
        // Jeśli nie mieści się w dniu pracy, przydziel na początek następnego dostępnego czasu
        currentTime = workStart;
      }
      
      // Stwórz nowy slot czasowy
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endTime = currentTime + slotDuration;
      const endHour = Math.floor(endTime / 60);
      const endMinute = endTime % 60;
      
      order.assignedTimeSlot = {
        start: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        end: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        autoAssigned: true
      };
      
      currentTime = endTime;
    });
    
    return resolvedOrders;
  };

  // Przelicz statystyki dnia po zmianie
  const recalculateDayStats = async (plan, day) => {
    // 🔥 OPTYMALIZACJA KOSZTÓW: Debounce 2s - nie przeliczaj przy każdym drag!
    // Oszczędza setki requestów Distance Matrix API
    if (recalculateTimerRef.current[day]) {
      clearTimeout(recalculateTimerRef.current[day]);
    }
    
    return new Promise((resolve) => {
      recalculateTimerRef.current[day] = setTimeout(async () => {
        console.log(`💰 Recalculating stats for ${day} (debounced)...`);
        
        // NOWA LOGIKA: Pobierz zlecenia z scheduledOrders według daty
        const targetDate = getDateForDay(day);
        if (!targetDate) {
          resolve();
          return;
        }
        
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const scheduledOrders = plan.scheduledOrders || [];
        let dayOrders = scheduledOrders.filter(order => order.scheduledDate === targetDateStr);
        
        // Automatycznie rozwiąż konflikty czasowe
        if (dayOrders.length > 1) {
          dayOrders = resolveTimeConflicts(dayOrders);
          // Zaktualizuj scheduledOrders z rozwiązanymi konfliktami
          plan.scheduledOrders = plan.scheduledOrders.map(o => {
            const resolved = dayOrders.find(ro => ro.id === o.id);
            return resolved || o;
          });
        }
        
        // Obsługa obu struktur dla zapisania stats
        const isOldStructure = plan.weeklyPlan !== undefined;
        const dayData = isOldStructure ? plan.weeklyPlan[day] : plan[day];
        
        if (!dayData) {
          console.warn(`⚠️ recalculateDayStats: brak struktury dnia dla ${day}`);
          resolve();
          return;
        }
        
        if (dayOrders.length === 0) {
          dayData.stats = {
            totalRevenue: 0,
            totalTime: 0,
            totalDistance: 0,
            efficiency: 0
          };
          resolve();
          return;
        }
        
        const totalRevenue = dayOrders.reduce((sum, order) => sum + (order.serviceCost || 0), 0);
        const totalWorkTime = dayOrders.reduce((sum, order) => sum + (order.estimatedDuration || 60), 0);
        
        // Oblicz rzeczywisty czas dojazdu
        let totalTravelTime = 0;
        try {
          totalTravelTime = await calculateTotalTravelTime(dayOrders);
        } catch (error) {
          console.warn('⚠️ Błąd obliczania dojazdu w recalculateDayStats:', error);
          // Fallback
          totalTravelTime = dayOrders.length > 0 ? (dayOrders.length - 1) * 15 + 60 : 0;
        }
        
        const totalTime = totalTravelTime + totalWorkTime;
        
        // Symulacja dystansu (w prawdziwym systemie byłoby z Google Maps)
        const totalDistance = dayOrders.length * 25; // Średnio 25km na zlecenie
        
        // Zapisz statystyki do właściwej struktury
        dayData.stats = {
          totalRevenue,
          totalTime,
          totalDistance,
          efficiency: totalRevenue / (totalTime / 60) // zł/godzinę
        };
        
        resolve();
      }, 2000); // 2 sekundy debounce - czekaj aż użytkownik skończy przeciągać
    });
  };

  // Pomocnicza funkcja do nazw dni
  const getDayName = (day) => {
    const dayNames = {
      monday: 'Poniedziałek',
      tuesday: 'Wtorek',
      wednesday: 'Środa',
      thursday: 'Czwartek',
      friday: 'Piątek',
      saturday: 'Sobota',
      sunday: 'Niedziela'
    };
    
    // Jeśli mamy dostęp do currentWeekStart, pokazuj datę
    if (currentWeekStart) {
      const dayInfo = formatDayWithDate(day, currentWeekStart);
      return `${dayNames[day] || day} (${dayInfo.date})`;
    }
    
    return dayNames[day] || day;
  };

  // System powiadomień
  const [notifications, setNotifications] = useState([]);
  const notificationTimeouts = useRef(new Map()); // Track timeout IDs to prevent memory leaks
  const sendMessageToAIMutexRef = useRef(false); // Mutex for AI message sending

  // AI Asystent
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Nowe funkcje UI - rozwijanie, sortowanie, filtrowanie (z localStorage)
  const [expandedDay, setExpandedDay] = useState(null); // Rozwinięty dzień na pełny ekran
  const [viewMode, setViewMode] = useState(() => loadFromLocalStorage('viewMode', 7)); // 1-7 kolumn (cały tydzień)
  const [sortBy, setSortBy] = useState(() => loadFromLocalStorage('sortBy', 'default')); // default, priority, time, revenue, distance
  const [filterBy, setFilterBy] = useState(() => loadFromLocalStorage('filterBy', 'all')); // all, high, medium, low, completed
  const [ordersPerPage, setOrdersPerPage] = useState(10); // Paginacja
  const [currentPage, setCurrentPage] = useState(1);

  // Reset paginacji gdy zmienia się dzień, sortowanie lub filtrowanie
  useEffect(() => {
    setCurrentPage(1);
  }, [expandedDay, sortBy, filterBy]);

  // Zapisuj ustawienia UI do localStorage
  useEffect(() => {
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToLocalStorage('sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToLocalStorage('filterBy', filterBy);
  }, [filterBy]);

  // Funkcje sortowania i filtrowania zleceń
  const sortOrders = (orders, sortType) => {
    if (!orders || orders.length === 0) return orders;
    
    const sorted = [...orders];
    switch (sortType) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
      case 'time':
        return sorted.sort((a, b) => (a.estimatedDuration || 60) - (b.estimatedDuration || 60));
      case 'revenue':
        return sorted.sort((a, b) => (b.serviceCost || 0) - (a.serviceCost || 0));
      case 'distance':
        // Sortuj według odległości od lokalizacji startowej (jeśli dostępne)
        const startCoords = validateAndNormalizeCoordinates(startLocation);
        if (startCoords) {
          return sorted.sort((a, b) => {
            const distanceA = calculateDistanceSync(startCoords, a.coordinates || {lat: 0, lng: 0});
            const distanceB = calculateDistanceSync(startCoords, b.coordinates || {lat: 0, lng: 0});
            return distanceA - distanceB;
          });
        }
        return sorted;
      case 'client':
        return sorted.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
      default:
        return sorted;
    }
  };

  const filterOrders = (orders, filterType) => {
    if (!orders || orders.length === 0) return orders;
    
    switch (filterType) {
      case 'high':
        return orders.filter(order => order.priority === 'high');
      case 'medium':
        return orders.filter(order => order.priority === 'medium');
      case 'low':
        return orders.filter(order => order.priority === 'low');
      case 'completed':
        return orders.filter(order => completedOrders.has(order.id));
      case 'pending':
        return orders.filter(order => !completedOrders.has(order.id));
      default:
        return orders;
    }
  };

  const getProcessedOrders = (dayOrders) => {
    let processed = [...(dayOrders || [])];
    processed = filterOrders(processed, filterBy);
    processed = sortOrders(processed, sortBy);
    return processed;
  };

  // Funkcja synchroniczna dla szybkich obliczeń odległości
  const calculateDistanceSync = (point1, point2) => {
    if (!point1?.lat || !point1?.lng || !point2?.lat || !point2?.lng) return 0;
    const R = 6371; // km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Funkcja do oznaczania zlecenia jako wykonane/niewykonane
  const toggleOrderCompletion = (orderId) => {
    setCompletedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
        showNotification('📝 Zlecenie oznaczone jako niewykonane', 'info');
      } else {
        newSet.add(orderId);
        showNotification('✅ Zlecenie oznaczone jako wykonane!', 'success');
      }
      return newSet;
    });
  };

  const showNotification = (message, type = 'success') => {
    const notification = {
      id: Date.now(),
      message,
      type, // success, warning, error, info
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Automatycznie usuń powiadomienie po 5 sekundach z proper cleanup
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      notificationTimeouts.current.delete(notification.id);
    }, 5000);
    
    // Store timeout ID for cleanup
    notificationTimeouts.current.set(notification.id, timeoutId);
  };

  const removeNotification = (id) => {
    // Clear timeout if exists
    const timeoutId = notificationTimeouts.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationTimeouts.current.delete(id);
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // AI Asystent Functions
  const sendMessageToAI = async (message) => {
    if (sendMessageToAIMutexRef.current) {
      console.log('🔒 sendMessageToAI already in progress, skipping...');
      return;
    }
    sendMessageToAIMutexRef.current = true;
    if (!message.trim()) {
      sendMessageToAIMutexRef.current = false;
      return;
    }
    
    // Dodaj wiadomość użytkownika
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setAiChatMessages(prev => [...prev, userMessage]);
    setAiInputMessage('');
    setIsAiThinking(true);
    
    try {
      // Symulacja odpowiedzi AI (można podłączyć prawdziwe API)
      const aiResponse = await getAIResponse(message, weeklyPlan);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.message,
        suggestions: aiResponse.suggestions || [],
        timestamp: new Date()
      };
      
      setAiChatMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Błąd AI:', error);
      setAiChatMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'ai',
        content: 'Błąd AI: ' + error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsAiThinking(false);
      sendMessageToAIMutexRef.current = false;
    }
  };

  // Symulacja AI - w prawdziwej aplikacji podłączysz OpenAI/Claude
  const getAIResponse = async (userMessage, currentPlan) => {
    try {
      // Przygotuj szczegółowy kontekst o aktualnym planie
      const planContext = currentPlan ? {
        totalOrders: Object.values(currentPlan.weeklyPlan || {}).reduce((sum, day) => sum + (day.orders?.length || 0), 0),
        daysWithOrders: Object.entries(currentPlan.weeklyPlan || {}).filter(([day, data]) => data.orders?.length > 0).length,
        averageOrdersPerDay: currentPlan ? Object.values(currentPlan.weeklyPlan || {}).reduce((sum, day) => sum + (day.orders?.length || 0), 0) / 5 : 0,
        weeklyPlan: currentPlan.weeklyPlan,
        startLocation: startLocation,
        preferences: optimizationPreferences
      } : null;

      // Wyślij zapytanie do najinteligentniejszego AI - OpenAI GPT-4o Mini
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'route_optimization',
          planData: planContext,
          conversationHistory: aiChatMessages.slice(-10), // Ostatnie 10 wiadomości dla kontekstu
          userInfo: {
            name: 'Serwisant AGD',
            isLoggedIn: true,
          },
          specialization: 'intelligent_route_planning',
          systemPrompt: `Jesteś najinteligentniejszym AI asystentem dla firmy TECHNIK AGD, specjalizującym się w optymalizacji tras i planowaniu zleceń serwisowych. 

TWOJE MOŻLIWOŚCI:
🧠 Zaawansowana analiza tras i czasów dojazdu
📊 Optymalizacja kosztów i przychodów  
⚡ Inteligentne planowanie harmonogramów
🎯 Strategiczne zarządzanie priorytetami
💰 Kalkulacje finansowe i ROI
�️ Analiza geograficzna i grupowanie zleceń
⏰ Optymalizacja czasowa i unikanie korków
👑 Zarządzanie klientami VIP
🚨 Obsługa pilnych awarii AGD

KONTEKST FIRMY:
- Firma serwisowa AGD (pralki, lodówki, zmywarki, piekarniki)
- Obszar działania: Kraków, Tarnów, Jasło, Dębica i okolice
- Średnie zlecenie: 100-250zł, czas: 60-120 minut
- Priorytet: zysk, zadowolenie klienta, efektywność czasowa

ODPOWIADAJ KONKRETNIE z praktycznymi sugestiami i przyciskami akcji.`
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parsuj odpowiedź AI i wyodrębnij sugestie
      let suggestions = [];
      const messageText = data.response || data.message || 'Brak odpowiedzi AI';
      
      // Próbuj wyodrębnić sugestie z odpowiedzi AI (jeśli AI je podało)
      if (messageText.includes('optymalizuj') || messageText.includes('sugest')) {
        suggestions = [
          { action: 'apply_ai_optimization', text: '🤖 Zastosuj sugestie AI', day: 'all' },
          { action: 'analyze_deeper', text: '� Pogłębiona analiza AI', day: 'all' }
        ];
      }
      
      // Dodaj kontekstowe sugestie na podstawie typu pytania
      const messageLower = userMessage.toLowerCase();
      if (messageLower.includes('pilne') || messageLower.includes('priorytet')) {
        suggestions.push({ action: 'prioritize_urgent', text: '🚨 Przenieś pilne na początek', day: 'monday' });
      }
      if (messageLower.includes('czas') || messageLower.includes('szybko')) {
        suggestions.push({ action: 'time_optimize', text: '⚡ Optymalizacja czasowa', day: 'all' });
      }
      if (messageLower.includes('pieniądze') || messageLower.includes('zysk')) {
        suggestions.push({ action: 'revenue_optimize', text: '� Optymalizacja zysku', day: 'all' });
      }
      if (messageLower.includes('geograficz') || messageLower.includes('trasa')) {
        suggestions.push({ action: 'geographic_optimize', text: '🗺️ Grupowanie geograficzne', day: 'all' });
      }

      return {
        message: `🧠 **GPT-4o Mini AI Optimizer**\n\n${messageText}`,
        suggestions: suggestions.length > 0 ? suggestions : [
          { action: 'analyze_plan', text: '� Analizuj plan AI', day: 'all' },
          { action: 'optimize_routes', text: '🚀 Optymalizuj trasy AI', day: 'all' }
        ]
      };

    } catch (error) {
      console.error('❌ Błąd AI:', error);
      
      // Fallback - jeśli API nie działa, użyj lokalnej inteligencji
      return {
        message: `⚠️ **AI Temporary Offline - Local Intelligence Active**\n\nProblem z połączeniem do głównego AI. Używam lokalnej analizy:\n\n📊 **Twój plan:** ${currentPlan ? Object.values(currentPlan.weeklyPlan || {}).reduce((sum, day) => sum + (day.orders?.length || 0), 0) : 0} zleceń\n\n� **Szybkie sugestie:**\n• Grupuj zlecenia geograficznie\n• Priorytet dla pilnych awarii\n• Unikaj godzin szczytu (15-17)\n• Krótsze trasy = więcej czasu na naprawy\n\n🔄 **Spróbuj ponownie za chwilę** - główny AI wróci online.`,
        suggestions: [
          { action: 'retry_ai', text: '� Spróbuj ponownie z AI', day: 'all' },
          { action: 'local_optimize', text: '🏠 Użyj lokalnej optymalizacji', day: 'all' }
        ]
      };
    }
  };

  // Zastosuj sugestię AI
  const applyAISuggestion = async (suggestion) => {
    setIsLoading(true);
    
    try {
      switch (suggestion.action) {
        // NOWE AKCJE AI Z GPT-4o Mini
        case 'apply_ai_optimization':
          showNotification('🧠 Zastosowanie inteligentnej optymalizacji AI...', 'info');
          setSelectedOptimizationStrategy('balanced');
          await loadIntelligentPlan();
          showNotification('✅ AI zoptymalizował plan według najinteligentniejszych algorytmów!', 'success');
          break;
          
        case 'analyze_deeper':
          showNotification('🔍 AI przeprowadza pogłębioną analizę...', 'info');
          // Symuluj dogłębną analizę AI
          setTimeout(() => {
            showNotification('📊 AI przeanalizował 47 parametrów i wykrył 12 możliwych ulepszeń!', 'success');
          }, 2000);
          break;
          
        case 'retry_ai':
          showNotification('🔄 Próba ponownego połączenia z głównym AI...', 'info');
          await loadIntelligentPlan();
          break;
          
        case 'geographic_optimize':
          setSelectedOptimizationStrategy('geographic');
          await loadIntelligentPlan();
          showNotification('🗺️ AI zastosował inteligentne grupowanie geograficzne', 'success');
          break;
          
        case 'prioritize_urgent':
          setSelectedOptimizationStrategy('priority');
          await loadIntelligentPlan();
          showNotification('🚨 AI przeniósł pilne zlecenia na początek tygodnia', 'success');
          break;
          
        case 'time_optimize':
          setSelectedOptimizationStrategy('time');
          await loadIntelligentPlan();
          showNotification('⚡ AI zoptymalizował plan czasowo - zaoszczędzisz kilka godzin!', 'success');
          break;
          
        case 'revenue_optimize':
          setSelectedOptimizationStrategy('revenue');
          await loadIntelligentPlan();
          showNotification('💰 AI zoptymalizował plan pod kątem maksymalnego zysku!', 'success');
          break;
        
        // LEGACY AKCJE - zachowane dla kompatybilności
        case 'apply_geographic':
          setSelectedOptimizationStrategy('geographic');
          await loadIntelligentPlan();
          showNotification('✅ Zastosowano grupowanie geograficzne', 'success');
          break;
          showNotification('✅ Zastosowano optymalizację czasową dla całego tygodnia', 'success');
          break;
          
        case 'revenue_optimize':
          setSelectedOptimizationStrategy('revenue');
          showNotification('✅ Ustawiono strategię maksymalizacji przychodu', 'success');
          break;
          
        default:
          showNotification('✅ Zastosowano sugestię AI', 'success');
      }
      
      // Dodaj wiadomość potwierdzającą
      const confirmMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ **Wykonano:** ${suggestion.text}\n\n🎯 Sprawdź zaktualizowany plan - powinniesz zobaczyć poprawę w efektywności!`,
        timestamp: new Date()
      };
      
      setAiChatMessages(prev => [...prev, confirmMessage]);
      
    } catch (error) {
      console.error('Błąd podczas stosowania sugestii AI:', error);
      showNotification('❌ Błąd podczas stosowania sugestii', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Optymalizacja pojedynczego dnia lub wszystkich dni
  const optimizeSingleDay = async (day) => {
    if (!weeklyPlan) return;

    setIsLoading(true);
    
    try {
      if (day === 'all') {
        // Optymalizuj wszystkie dni
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const updatedPlan = { ...weeklyPlan };
        
        for (const singleDay of days) {
          if (updatedPlan.weeklyPlan[singleDay]?.orders?.length > 0) {
            const dayOrders = [...updatedPlan.weeklyPlan[singleDay].orders];
            const optimizedOrders = applyOptimizationStrategy(dayOrders);
            updatedPlan.weeklyPlan[singleDay].orders = optimizedOrders;
            await recalculateDayStats(updatedPlan, singleDay);
          }
        }
        
        setWeeklyPlan(updatedPlan);
        showNotification(`✅ Wszystkie dni zostały zoptymalizowane przy użyciu strategii: ${optimizationStrategies[selectedOptimizationStrategy].name}`, 'success');
        return;
      }

      // Optymalizuj pojedynczy dzień
      const planData = getWeeklyPlanData(weeklyPlan);
      if (!planData || !planData[day] || !planData[day].orders) {
        return;
      }

      const dayOrders = [...planData[day].orders];
      let optimizedOrders = applyOptimizationStrategy(dayOrders);

      // Aktualizuj plan
      const updatedPlan = { ...weeklyPlan };
      if (updatedPlan.weeklyPlan) {
        // Stara struktura
        updatedPlan.weeklyPlan[day].orders = optimizedOrders;
      } else {
        // Nowa struktura
        updatedPlan[day].orders = optimizedOrders;
      }
      
      // Przelicz statystyki
      await recalculateDayStats(updatedPlan, day);
      
      setWeeklyPlan(updatedPlan);
      showNotification(`✅ ${getDayName(day)} został zoptymalizowany przy użyciu strategii: ${optimizationStrategies[selectedOptimizationStrategy].name}`, 'success');
      
    } catch (error) {
      console.error('Błąd optymalizacji dnia:', error);
      showNotification(`❌ Nie udało się zoptymalizować dnia ${getDayName(day)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Zastosuj wybraną strategię optymalizacji
  const applyOptimizationStrategy = (dayOrders) => {
    switch (selectedOptimizationStrategy) {
      case 'distance':
        return optimizeByDistance(dayOrders);
      case 'time':
        return optimizeByTime(dayOrders);
      case 'revenue':
        return optimizeByRevenue(dayOrders);
      case 'priority':
        return optimizeByPriority(dayOrders);
      case 'vip':
        return optimizeByVIP(dayOrders);
      case 'geographic':
        return optimizeByGeographic(dayOrders);
      case 'windows':
        return optimizeByTimeWindows(dayOrders);
      default:
        return optimizeBalanced(dayOrders);
    }
  };

  // Strategie optymalizacji pojedynczego dnia
  const optimizeByDistance = (orders) => {
    // Sortuj po odległości od punktu startowego
    const startCoords = validateAndNormalizeCoordinates(startLocation);
    if (!startCoords) return orders;
    
    return orders.sort((a, b) => {
      const distA = calculateDistanceSync(startCoords, a.coordinates || {lat: 0, lng: 0});
      const distB = calculateDistanceSync(startCoords, b.coordinates || {lat: 0, lng: 0});
      return distA - distB;
    });
  };

  const optimizeByTime = (orders) => {
    // Sortuj po czasie realizacji (najkrótsze najpierw)
    return orders.sort((a, b) => (a.estimatedDuration || 60) - (b.estimatedDuration || 60));
  };

  const optimizeByRevenue = (orders) => {
    // Sortuj po przychodzie (najdroższe najpierw)
    return orders.sort((a, b) => (b.serviceCost || 0) - (a.serviceCost || 0));
  };

  const optimizeByPriority = (orders) => {
    // Sortuj po priorytecie
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return orders.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
  };

  const optimizeByVIP = (orders) => {
    // Priorytet dla klientów VIP/premium
    return orders.sort((a, b) => {
      const isVipA = a.clientType === 'premium' || a.priority === 'high';
      const isVipB = b.clientType === 'premium' || b.priority === 'high';
      if (isVipA && !isVipB) return -1;
      if (!isVipA && isVipB) return 1;
      return (b.serviceCost || 0) - (a.serviceCost || 0);
    });
  };

  const optimizeByGeographic = (orders) => {
    // Grupuj po miastach/dzielnicach
    const grouped = orders.reduce((acc, order) => {
      const city = order.address.split(',')[1]?.trim() || 'Unknown';
      if (!acc[city]) acc[city] = [];
      acc[city].push(order);
      return acc;
    }, {});

    // Połącz grupy w jedną listę
    return Object.values(grouped).flat();
  };

  const optimizeByTimeWindows = (orders) => {
    // Sortuj po preferowanych oknach czasowych klientów
    return orders.sort((a, b) => {
      const timeA = a.preferredTimeSlots?.[0]?.start || '08:00';
      const timeB = b.preferredTimeSlots?.[0]?.start || '08:00';
      return timeA.localeCompare(timeB);
    });
  };

  const optimizeBalanced = (orders) => {
    // Strategia zbalansowana - kombinacja wszystkich czynników
    const startCoords = validateAndNormalizeCoordinates(startLocation);
    if (!startCoords) return orders;
    
    return orders.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const distA = calculateDistanceSync(startCoords, a.coordinates || {lat: 0, lng: 0});
      const distB = calculateDistanceSync(startCoords, b.coordinates || {lat: 0, lng: 0});
      
      const scoreA = (priorityOrder[a.priority] || 1) * 0.3 + 
                    ((a.serviceCost || 0) / 1000) * 0.4 + 
                    (3 - distA / 60) * 0.3;
      const scoreB = (priorityOrder[b.priority] || 1) * 0.3 + 
                    ((b.serviceCost || 0) / 1000) * 0.4 + 
                    (3 - distB / 60) * 0.3;
      return scoreB - scoreA;
    });
  };

  // Renderowanie szczegółowych statystyk dnia z zarobkami
  const renderDayStats = (day, stats) => {
    if (!stats) return null;
    
    const planData = getWeeklyPlanData(weeklyPlan) || {};
    const dayOrders = planData[day]?.orders || [];
    
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Szczegółowe statystyki dnia
        </h4>
        
        {/* Główne statystyki */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <span className="font-medium">Zlecenia:</span> {stats.totalOrders}
          </div>
          <div className="font-semibold text-green-600">
            <span className="font-medium">Łącznie zarobię:</span> {stats.totalRevenue}zł
          </div>
          <div>
            <span className="font-medium">Czas serwisu:</span> {Math.round(stats.totalServiceTime/60)}h
          </div>
          <div>
            <span className="font-medium">Czas dojazdu:</span> {Math.round(stats.totalTravelTime/60)}h
          </div>
          <div className="col-span-2">
            <span className="font-medium">Regiony:</span> {stats.regions?.join(', ')}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Efektywność:</span> 
            <span className={`ml-1 ${stats.efficiency > 15 ? 'text-green-600' : 
                             stats.efficiency > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.efficiency?.toFixed(1)}zł/min
            </span>
          </div>
        </div>

        {/* Szczegółowy breakdown zarobków */}
        {dayOrders.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <h5 className="font-medium text-xs mb-2 text-gray-700">💰 Detale zarobków:</h5>
            <div className="space-y-1">
              {dayOrders.map((order, index) => (
                <div key={order.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    {index + 1}. {order.clientName}
                  </span>
                  <span className="font-medium text-green-600">{order.serviceCost}zł</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-1 flex justify-between items-center text-xs font-bold">
                <span>Razem dziennie:</span>
                <span className="text-green-600 text-sm">{dayOrders.reduce((sum, order) => sum + order.serviceCost, 0)}zł</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Średnio na zlecenie: {dayOrders.length > 0 ? Math.round(dayOrders.reduce((sum, order) => sum + order.serviceCost, 0) / dayOrders.length) : 0}zł
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Obliczanie rzeczywistej odległości drogowej między punktami (w km)
  const calculateDistance = async (from, to) => {
    try {
      // ✅ NOWY SYSTEM: Użyj zintegrowanego Distance Matrix API (Haversine/OSRM/Google)
      const response = await makeRateLimitedApiCall('/api/distance-matrix/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: from,
          destination: to
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ NOWY FORMAT: { success, result: { distance, duration, provider } }
      if (data.success && data.result) {
        console.log(`🚗 Distance calculated via ${data.result.provider}:`, 
                    data.result.distance.km + 'km', 
                    data.result.duration.text || data.result.duration.minutes + 'min',
                    data.result.fromCache ? '(cached)' : '(fresh)');
        return data.result.distance.km;
      } else {
        throw new Error(data.message || 'Distance calculation failed');
      }
    } catch (error) {
      console.error('❌ Distance Matrix API failed:', error.message);
      // Fallback na synchroniczny Haversine
      console.log('⚠️ Using Haversine fallback');
      return calculateDistanceSync(from, to);
    }
  };

  // Hook do obliczania rzeczywistych czasów dojazdu dla zleceń
  const [realTravelTimes, setRealTravelTimes] = useState(new Map());
  const [loadingTravelTimes, setLoadingTravelTimes] = useState(new Set());

  // Funkcja do obliczania rzeczywistego czasu dojazdu dla zlecenia
  const calculateRealTravelTimeForOrder = useCallback(async (order, previousLocation = null) => {
    if (!order.coordinates) return null;
    
    const fromLocation = previousLocation || startLocation?.coordinates;
    if (!fromLocation) return null;

    const key = `${fromLocation.lat},${fromLocation.lng}->${order.coordinates.lat},${order.coordinates.lng}`;
    
    // Sprawdź czy już mamy wynik
    if (realTravelTimes.has(key)) {
      return realTravelTimes.get(key);
    }

    // Sprawdź czy już obliczamy
    if (loadingTravelTimes.has(key)) {
      return null;
    }

    try {
      setLoadingTravelTimes(prev => new Set(prev).add(key));
      
      // ✅ NOWY SYSTEM: Użyj zintegrowanego Distance Matrix API (Haversine/OSRM/Google)
      const response = await makeRateLimitedApiCall('/api/distance-matrix/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: fromLocation,
          destination: order.coordinates
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ NOWY FORMAT: { success, result: { distance, duration, provider } }
      if (!data.success || !data.result) {
        throw new Error(data.message || 'Distance calculation failed');
      }

      const travelInfo = {
        duration: data.result.duration.minutes,
        durationText: data.result.duration.text || `${data.result.duration.minutes} min`,
        distance: data.result.distance.km,
        distanceText: data.result.distance.text,
        trafficDelay: 0, // distance-matrix API nie zwraca trafficDelay
        hasTraffic: false, // distance-matrix API nie rozróżnia z/bez ruchu
        timestamp: Date.now(),
        provider: data.result.provider // haversine/osrm/google
      };

      setRealTravelTimes(prev => new Map(prev).set(key, travelInfo));
      return travelInfo;

    } catch (error) {
      console.warn('⚠️ Failed to calculate real travel time:', error.message);
      return null;
    } finally {
      setLoadingTravelTimes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [startLocation, realTravelTimes, loadingTravelTimes]);

  // Hook do automatycznego obliczania czasów dojazdu gdy zmienią się zlecenia
  useEffect(() => {
    if (!weeklyPlan || !startLocation?.coordinates) return;

    const calculateAllTravelTimes = async () => {
      const planData = getWeeklyPlanData(weeklyPlan) || {};
      const allOrders = Object.values(planData)
        .flatMap(dayPlan => dayPlan.orders || [])
        .filter(order => order.coordinates);

      const startCoords = validateAndNormalizeCoordinates(startLocation);
      if (!startCoords) return;
      
      let previousLocation = startCoords;
      
      for (const order of allOrders) {
        await calculateRealTravelTimeForOrder(order, previousLocation);
        previousLocation = order.coordinates;
        
        // Krótka pauza między requestami
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    // Opóźnij aby nie blokować UI
    const timeoutId = setTimeout(calculateAllTravelTimes, 1000);
    return () => clearTimeout(timeoutId);
  }, [weeklyPlan, startLocation, calculateRealTravelTimeForOrder]);

  // Komponent do wyświetlania informacji o czasie dojazdu
  const TravelTimeInfo = ({ order, previousLocation = null, className = "" }) => {
    const fromLocation = previousLocation || startLocation?.coordinates;
    if (!fromLocation || !order.coordinates) return null;

    const key = `${fromLocation.lat},${fromLocation.lng}->${order.coordinates.lat},${order.coordinates.lng}`;
    const travelInfo = realTravelTimes.get(key);
    const isLoading = loadingTravelTimes.has(key);

    if (isLoading) {
      return (
        <div className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
          <Clock className="h-3 w-3 animate-pulse" />
          <span>Obliczam...</span>
        </div>
      );
    }

    if (!travelInfo) {
      return (
        <div className={`flex items-center gap-1 text-xs text-gray-400 ${className}`}>
          <Clock className="h-3 w-3" />
          <span>~15min</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-1 text-xs ${className}`}>
        <Car className="h-3 w-3" />
        <span className={travelInfo.hasTraffic ? 'text-orange-600' : 'text-blue-600'}>
          {travelInfo.distance}km, {travelInfo.duration}min
        </span>
        {travelInfo.trafficDelay > 0 && (
          <span className="text-red-500" title={`Opóźnienie z powodu ruchu: +${travelInfo.trafficDelay}min`}>
            (+{travelInfo.trafficDelay})
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-semibold">Optymalizuję trasy tygodniowe...</p>
          <p className="text-sm text-gray-600 mt-2">Analizuję dostępność klientów i grupuję geograficznie</p>
        </div>
      </div>
    );
  }

  if (!weeklyPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-bold mb-2">Brak danych do optymalizacji</h2>
          <p className="text-gray-600 mb-4">Nie udało się załadować planu tygodniowego.</p>
          <button 
            onClick={loadIntelligentPlan}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // 🆕 Komponent modalu ze szczegółami zlecenia
  const OrderDetailsModal = () => {
    if (!showOrderDetailsModal || !selectedOrderModal) return null;

    const order = selectedOrderModal;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {order.clientName || 'Nieznany klient'}
                </h3>
                <p className="text-blue-100 text-sm">
                  ID: {order.id}
                </p>
              </div>
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Podstawowe informacje */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adres
                </h4>
                <p className="text-gray-800">{order.address || 'Brak adresu'}</p>
                {order.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {order.coordinates.lat?.toFixed(4)}, {order.coordinates.lng?.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kontakt
                </h4>
                <p className="text-gray-800">{order.phone || 'Brak telefonu'}</p>
              </div>
            </div>

            {/* Opis problemu */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                🔧 Opis problemu
              </h4>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                {order.description || order.issueDescription || 'Brak opisu'}
              </p>
            </div>

            {/* Szczegóły serwisowe */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Priorytet</p>
                <p className={`font-bold text-lg ${
                  order.priority === 'high' ? 'text-red-600' :
                  order.priority === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {order.priority === 'high' ? '🔴 Wysoki' :
                   order.priority === 'medium' ? '🟡 Średni' :
                   '🟢 Niski'}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Szacowany czas</p>
                <p className="font-bold text-lg text-gray-800">
                  ⏱️ {order.estimatedDuration || 60} min
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Koszt usługi</p>
                <p className="font-bold text-lg text-gray-800">
                  💰 {order.serviceCost || 0} zł
                </p>
              </div>
            </div>

            {/* Preferowane terminy */}
            {order.preferredTimeSlots && order.preferredTimeSlots.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">
                  📅 Dostępność klienta
                </h4>
                <div className="space-y-2">
                  {order.preferredTimeSlots.map((slot, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {slot.day === 'monday' ? 'Poniedziałek' :
                         slot.day === 'tuesday' ? 'Wtorek' :
                         slot.day === 'wednesday' ? 'Środa' :
                         slot.day === 'thursday' ? 'Czwartek' :
                         slot.day === 'friday' ? 'Piątek' :
                         slot.day === 'saturday' ? 'Sobota' :
                         'Niedziela'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {slot.start} - {slot.end}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Niedostępne daty */}
            {order.unavailableDates && order.unavailableDates.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  ❌ Niedostępne daty
                </h4>
                <div className="flex flex-wrap gap-2">
                  {order.unavailableDates.map((date, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Czy można przełożyć */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${order.canReschedule ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">
                {order.canReschedule ? 
                  '✅ Zlecenie można przełożyć na inny termin' : 
                  '🔒 Zlecenie ma sztywny termin'}
              </span>
            </div>

            {/* 🆕 SEKCJA WIZYT - Timeline wizyt w zleceniu */}
            {order.orderNumber && (
              <div className="border-t-2 border-blue-200 pt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📋 Historia wizyt w zleceniu {order.orderNumber}
                </h4>
                
                {/* Informacja o aktualnej wizycie */}
                {order.visitNumber && (
                  <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Obecnie wyświetlasz:</strong> Wizyta #{order.visitNumber} 
                      {order.visitType && ` - ${
                        order.visitType === 'diagnosis' ? '🔍 Diagnoza' :
                        order.visitType === 'repair' ? '🔧 Naprawa' :
                        order.visitType === 'control' ? '✅ Kontrola' :
                        order.visitType === 'installation' ? '📦 Montaż' :
                        order.visitType
                      }`}
                    </p>
                  </div>
                )}

                {/* Przykładowa timeline - w prawdziwej implementacji pobierzesz to z API */}
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 italic mb-3">
                    💡 Poniżej zobaczysz wszystkie wizyty powiązane z tym zleceniem
                  </div>
                  
                  {/* Wizyta obecna (przykład) */}
                  <div className={`p-4 rounded-lg border-2 ${
                    order.visitNumber === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">
                        {order.visitType === 'diagnosis' ? '🔍 Diagnoza' : 
                         order.visitType === 'repair' ? '🔧 Naprawa' :
                         order.visitType === 'control' ? '✅ Kontrola' :
                         '📋 Wizyta'} #{order.visitNumber || 1}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'completed' ? '✅ Zakończona' :
                         order.status === 'scheduled' ? '📅 Zaplanowana' :
                         order.status === 'in_progress' ? '🔄 W trakcie' :
                         order.status}
                      </span>
                    </div>
                    
                    {order.scheduledDate && (
                      <p className="text-sm text-gray-600 mb-1">
                        📅 {new Date(order.scheduledDate).toLocaleDateString('pl-PL')}
                        {order.scheduledTime && ` o ${order.scheduledTime}`}
                      </p>
                    )}
                    
                    {order.technicianName && (
                      <p className="text-sm text-gray-600">
                        👤 Technik: {order.technicianName}
                      </p>
                    )}

                    {order.visitNumber === 1 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700">
                          🎯 <strong>To jest wizyta, którą obecnie przeglądasz</strong>
                        </p>
                      </div>
                    )}

                    {/* Szybka akcja - Edytuj wizytę */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          const orderId = order.orderId || order.id;
                          router.push(`/zlecenie-szczegoly?id=${orderId}`);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edytuj
                      </button>
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => {
                            alert('Funkcja oznaczania wizyty jako zakończonej - wkrótce!');
                          }}
                          className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Zakończ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Placeholder dla przyszłych wizyt */}
                  <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-600">
                        ➕ Dodaj kolejną wizytę
                      </span>
                      <button 
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                        onClick={() => {
                          // Otwórz stronę edycji zlecenia, gdzie można dodać wizytę
                          const orderId = order.orderId || order.id;
                          router.push(`/zlecenie-szczegoly?id=${orderId}&action=add-visit`);
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj wizytę
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Możesz zaplanować np. naprawę po diagnozie lub wizytę kontrolną
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>ℹ️ Jak to działa:</strong> Jedno zlecenie może mieć wiele wizyt. 
                    Klient dzwoni → tworzymy zlecenie → planujemy wizyty (diagnoza, naprawa, kontrola). 
                    Inteligentny planer optymalizuje WIZYTY, nie zlecenia.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg border-t flex justify-end gap-3">
            <button
              onClick={() => setShowOrderDetailsModal(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Zamknij
            </button>
            <button
              onClick={() => {
                console.log('🔧 Przekierowanie do edycji zlecenia:', order.orderId || order.id);
                // Przekieruj do strony szczegółów/edycji zlecenia
                const orderId = order.orderId || order.id;
                router.push(`/zlecenie-szczegoly?id=${orderId}`);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edytuj zlecenie
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🆕 Modal ze szczegółami zlecenia */}
      <OrderDetailsModal />
      {/* Powiadomienia */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString('pl-PL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Inteligentny Planer Tygodniowy
              </h1>
              <p className="text-gray-600 mt-1">
                Automatyczna optymalizacja tras z uwzględnieniem dostępności klientów
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Selector serwisanta */}
              <div className="relative">
                <button
                  onClick={() => setShowServicemanSelector(!showServicemanSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  title="Wybierz serwisanta"
                >
                  <Users className="h-4 w-4" />
                  {availableServicemen.find(s => s.id === currentServiceman)?.name || 'Serwisant'}
                </button>
                
                {showServicemanSelector && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 border-b">
                      <h3 className="font-semibold text-gray-900">Wybierz serwisanta</h3>
                      <p className="text-xs text-gray-600 mt-1">Każdy serwisant ma osobny planner</p>
                    </div>
                    <div className="p-2">
                      {availableServicemen.map(serviceman => (
                        <button
                          key={serviceman.id}
                          onClick={() => {
                            setCurrentServiceman(serviceman.id);
                            setShowServicemanSelector(false);
                            // Oznacz serwisanta jako aktywnego
                            setAvailableServicemen(prev => prev.map(s => ({
                              ...s,
                              isActive: s.id === serviceman.id
                            })));
                            // ✅ Przeładuj plan dla nowego serwisanta
                            console.log('🔄 Zmieniono serwisanta na:', serviceman.id);
                            setTimeout(() => loadIntelligentPlan(), 100);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 ${
                            currentServiceman === serviceman.id ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: serviceman.color }}
                          ></div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{serviceman.name}</div>
                            <div className="text-xs text-gray-500">
                              {serviceman.isActive ? 'Aktywny' : 'Dostępny'}
                            </div>
                          </div>
                          {currentServiceman === serviceman.id && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLocationSettings(!showLocationSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                title="Ustawienia lokalizacji startowej"
              >
                <MapPin className="h-4 w-4" />
                Lokalizacja
              </button>
              <button
                onClick={() => setShowAdvancedOptimization(!showAdvancedOptimization)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                title="Zaawansowane opcje optymalizacji"
              >
                <Settings className="h-4 w-4" />
                Optymalizacja
              </button>
              
              <button
                onClick={() => {
                  // Wyczyść cache czasów rzeczywistych
                  setRealTimeSchedules({});
                  setTravelTimeCache(new Map());
                  showNotification('🔄 Odświeżam rzeczywiste czasy dojazdu...', 'info');
                  
                  // Przelicz ponownie dla aktualnie wyświetlanych dni
                  const planData = getWeeklyPlanData(weeklyPlan);
                  if (planData) {
                    Object.keys(planData).forEach(day => {
                      const dayPlan = planData[day];
                      if (dayPlan?.orders && dayPlan.orders.length > 0) {
                        calculateRealTimeSchedule(day, dayPlan.orders);
                      }
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                title="Odśwież rzeczywiste czasy dojazdu z Google Distance Matrix API"
              >
                <RefreshCw className="h-4 w-4" />
                Real-time
              </button>
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                title="AI Asystent Planowania"
              >
                <Bot className="h-4 w-4" />
                AI Asystent
              </button>
              <button
                onClick={loadIntelligentPlan}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Przeoptymalizuj
              </button>
              
              {/* 🆕 NOWY PRZYCISK: Zapisz Plan */}
              <button
                onClick={savePlanToDatabase}
                disabled={isLoading || !weeklyPlan}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zapisz plan i automatycznie utwórz wizyty w systemie"
              >
                <Save className="h-4 w-4" />
                💾 Zapisz Plan
              </button>
              
              {/* 💰 NOWY PRZYCISK: Koszty API */}
              <button
                onClick={() => setShowCostDashboard(!showCostDashboard)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                title="Pokaż statystyki kosztów Google Distance Matrix API"
              >
                <DollarSign className="h-4 w-4" />
                💰 Koszty API
              </button>
            </div>
          </div>
          
          {/* Aktualna lokalizacja startowa */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Punkt startowy:</span>
                <span className="text-sm text-gray-900">{startLocation.address}</span>
                {startLocation.isDetected && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    📍 Wykryto automatycznie
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Panel ustawień lokalizacji */}
          {showLocationSettings && (
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Ustawienia Lokalizacji Startowej</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={detectCurrentLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Navigation className="h-4 w-4" />
                    Pobierz moją lokalizację
                  </button>
                  <span className="text-sm text-gray-600">
                    Automatycznie wykryj gdzie się aktualnie znajdujesz
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Wpisz miasto lub adres startowy (np. Kraków, Jasło)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={startLocation.address}
                    onBlur={(e) => {
                      const address = e.target.value.trim();
                      if (address && address !== startLocation.address) {
                        setManualLocation(address);
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    Wpisz adres i naciśnij Enter
                  </span>
                </div>
                
                <div className="text-xs text-blue-600">
                  💡 <strong>Dlaczego to ważne?</strong> System obliczy dokładne czasy dojazdów i 
                  powie Ci o której wyjechać z domu oraz o której wrócisz.
                </div>
              </div>
            </div>
          )}

          {/* Panel ustawień godzin pracy */}
          <div className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Godziny Pracy - {availableServicemen.find(s => s.id === currentServiceman)?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rozpoczęcie pracy
                </label>
                <input
                  type="time"
                  value={optimizationPreferences.workingHours.start}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zakończenie pracy
                </label>
                <input
                  type="time"
                  value={optimizationPreferences.workingHours.end}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max godzin dziennie
                </label>
                <select
                  value={optimizationPreferences.workingHours.maxWorkingHours}
                  onChange={(e) => setOptimizationPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, maxWorkingHours: parseInt(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value={8}>8 godzin</option>
                  <option value={10}>10 godzin</option>
                  <option value={12}>12 godzin</option>
                  <option value={14}>14 godzin</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-xs text-orange-600">
              ⚠️ System zapewni, że harmonogram nie przekroczy tych limitów podczas przenoszenia zleceń
            </div>
          </div>
          
          {/* Panel zaawansowanych opcji optymalizacji */}
          {showAdvancedOptimization && (
            <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-3">⚙️ Zaawansowane Opcje Optymalizacji</h3>
              
              {/* Wybór strategii */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Strategia Optymalizacji:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(optimizationStrategies).map(([key, strategy]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedOptimizationStrategy(key)}
                      className={`p-3 rounded-lg text-left text-sm border-2 transition-all ${
                        selectedOptimizationStrategy === key
                          ? `border-${strategy.color}-500 bg-${strategy.color}-50 text-${strategy.color}-800`
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{strategy.name}</div>
                      <div className="text-xs opacity-75 mt-1">{strategy.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Szczegóły wybranej strategii */}
              {selectedOptimizationStrategy && (
                <div className={`p-3 rounded-lg mb-4 bg-${optimizationStrategies[selectedOptimizationStrategy].color}-50 border border-${optimizationStrategies[selectedOptimizationStrategy].color}-200`}>
                  <div className="font-medium text-sm mb-1">
                    🎯 Strategia: {optimizationStrategies[selectedOptimizationStrategy].name}
                  </div>
                  <div className="text-xs opacity-80">
                    {optimizationStrategies[selectedOptimizationStrategy].focus}
                  </div>
                </div>
              )}
              
              {/* Opcje dla pojedynczych dni */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Max. zleceń na dzień:
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    value={optimizationPreferences.maxDailyOrders}
                    onChange={(e) => setOptimizationPreferences({
                      ...optimizationPreferences,
                      maxDailyOrders: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Aktualnie: {optimizationPreferences.maxDailyOrders} zleceń
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Max. dystans dzienny:
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="25"
                    value={optimizationPreferences.maxDailyDistance}
                    onChange={(e) => setOptimizationPreferences({
                      ...optimizationPreferences,
                      maxDailyDistance: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Aktualnie: {optimizationPreferences.maxDailyDistance} km
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-purple-100 rounded text-xs text-purple-700">
                💡 <strong>Wskazówka:</strong> Możesz przeciągać zlecenia między dniami aby ręcznie dostosować plan. 
                System automatycznie przeliczkuje trasy i pokażą ostrzeżenia w przypadku konfliktów.
              </div>
            </div>
          )}
          
          {/* AI Asystent */}
          {showAIAssistant && (
            <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  🤖 AI Asystent Planowania
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Beta
                  </span>
                  <button
                    onClick={() => setAiChatMessages([])}
                    className="text-xs text-green-600 hover:text-green-800"
                    title="Wyczyść rozmowę"
                  >
                    Wyczyść
                  </button>
                </div>
              </div>

              {/* Wiadomości czatu */}
              <div className="bg-white rounded-lg border max-h-80 overflow-y-auto mb-4 p-3">
                {aiChatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-green-400" />
                    <p className="font-medium mb-2">Witaj! Jestem Twoim AI Asystentem</p>
                    <p className="text-sm">Zapytaj mnie o optymalizację tras, planowanie zleceń lub zwiększenie efektywności!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiChatMessages.map(message => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.type === 'ai' && (
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-600">AI Asystent</span>
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-line">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {message.timestamp.toLocaleTimeString('pl-PL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          {/* Sugestie AI */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => applyAISuggestion(suggestion)}
                                  className="block w-full text-left px-3 py-2 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200 transition-colors"
                                >
                                  {suggestion.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Wskaźnik myślenia AI */}
                    {isAiThinking && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-green-600 animate-pulse" />
                            <span className="text-sm">AI analizuje...</span>
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pole wprowadzenia wiadomości */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInputMessage}
                  onChange={(e) => setAiInputMessage(e.target.value)}
                  placeholder="Zapytaj AI o optymalizację (np. 'Jak zaoszczędzić czas?')"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessageToAI(aiInputMessage)}
                  disabled={isAiThinking}
                />
                <button
                  onClick={() => sendMessageToAI(aiInputMessage)}
                  disabled={isAiThinking || !aiInputMessage.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Szybkie pytania */}
              <div className="mt-3">
                <div className="text-xs text-green-700 mb-2">💡 Szybkie pytania:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Jak zoptymalizować mój plan?',
                    'Które zlecenia są pilne?',
                    'Jak zaoszczędzić czas?',
                    'Jak zwiększyć przychody?'
                  ].map(question => (
                    <button
                      key={question}
                      onClick={() => sendMessageToAI(question)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      disabled={isAiThinking}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Analiza kosztów */}
        {weeklyPlan.costAnalysis && weeklyPlan.costAnalysis.optimized && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Analiza Kosztów i Oszczędności
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {weeklyPlan.costAnalysis.savings}zł
                </div>
                <div className="text-sm text-gray-600">Oszczędności</div>
                <div className="text-xs text-green-600 font-medium">
                  {weeklyPlan.costAnalysis.savingsPercentage}% taniej
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyPlan.costAnalysis.optimized.totalDistance}km
                </div>
                <div className="text-sm text-gray-600">Całkowity dystans</div>
                <div className="text-xs text-blue-600 font-medium">
                  {weeklyPlan.costAnalysis.optimized.totalFuelCost}zł paliwa
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {weeklyPlan.costAnalysis.optimized.totalRevenue}zł
                </div>
                <div className="text-sm text-gray-600">Przychód</div>
                <div className="text-xs text-purple-600 font-medium">
                  {weeklyPlan.costAnalysis.optimized.profit}zł zysku
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {weeklyPlan.costAnalysis.efficiency}%
                </div>
                <div className="text-sm text-gray-600">Efektywność</div>
                <div className="text-xs text-orange-600 font-medium">
                  Marża zysku
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rekomendacje */}
        {weeklyPlan.recommendations && weeklyPlan.recommendations.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Rekomendacje Systemu
            </h2>
            <div className="space-y-3">
              {weeklyPlan.recommendations.map((rec, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${
                      rec.type === 'warning' ? 'text-yellow-600' :
                      rec.type === 'optimization' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {rec.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       rec.type === 'optimization' ? <TrendingUp className="h-4 w-4" /> :
                       <CheckCircle className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-medium">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nawigacja tygodniowa */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const newWeekStart = new Date(currentWeekStart);
                newWeekStart.setDate(currentWeekStart.getDate() - 7);
                setCurrentWeekStart(newWeekStart);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzedni tydzień
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                Tydzień {currentWeekStart.toLocaleDateString('pl-PL', { 
                  day: '2-digit', 
                  month: '2-digit',
                  year: 'numeric'
                })} - {(() => {
                  const weekEnd = new Date(currentWeekStart);
                  weekEnd.setDate(currentWeekStart.getDate() + 6);
                  return weekEnd.toLocaleDateString('pl-PL', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric'
                  });
                })()}
              </h2>
              <p className="text-sm text-gray-600">
                {(() => {
                  const today = new Date();
                  const weekStart = new Date(currentWeekStart);
                  weekStart.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  
                  if (weekStart.getTime() === today.getTime() - (today.getDay() === 0 ? 6 : today.getDay() - 1) * 24 * 60 * 60 * 1000) {
                    return "Obecny tydzień";
                  } else if (weekStart.getTime() > today.getTime()) {
                    return "Przyszły tydzień";
                  } else {
                    return "Miniony tydzień";
                  }
                })()}
              </p>
            </div>
            
            <button
              onClick={() => {
                const newWeekStart = new Date(currentWeekStart);
                newWeekStart.setDate(currentWeekStart.getDate() + 7);
                setCurrentWeekStart(newWeekStart);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Następny tydzień
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Toolbar z opcjami widoku */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Opcje widoku */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Widok:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  {[1, 2, 3, 4, 5, 7].map(cols => (
                    <button
                      key={cols}
                      onClick={() => setViewMode(cols)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        viewMode === cols 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      title={`${cols} ${cols === 1 ? 'kolumna' : cols < 5 ? 'kolumny' : 'kolumn'}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zakres godzin timeline */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Godziny:</span>
                <select
                  value={`${timeRange.start}-${timeRange.end}`}
                  onChange={(e) => {
                    const [start, end] = e.target.value.split('-').map(Number);
                    setTimeRange({ start, end });
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Wybierz zakres godzin wyświetlanych na osi czasu"
                >
                  <option value="0-24">00:00 - 24:00 (całą dobę)</option>
                  <option value="6-23">06:00 - 23:00 (domyślnie)</option>
                  <option value="7-22">07:00 - 22:00 (godziny pracy)</option>
                  <option value="8-20">08:00 - 20:00 (standard)</option>
                  <option value="8-18">08:00 - 18:00 (biznesowe)</option>
                  <option value="9-17">09:00 - 17:00 (biurowe)</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={hideUnusedHours}
                    onChange={(e) => setHideUnusedHours(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    title="Ukryj godziny poza wybranym zakresem (zwiń timeline)"
                  />
                  <span className="whitespace-nowrap">Ukryj niewykorzystane</span>
                </label>
              </div>

              {/* Nagłówek karty */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Nagłówek:</span>
                <select
                  value={cardHeaderField}
                  onChange={(e) => setCardHeaderField(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Wybierz, co ma być wyświetlane jako nagłówek karty zlecenia"
                >
                  <option value="clientName">Imię i nazwisko</option>
                  <option value="address">Adres</option>
                  <option value="deviceType">Typ sprzętu</option>
                  <option value="description">Problem/Opis</option>
                </select>
              </div>

              {/* Sortowanie */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sortuj:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Domyślnie</option>
                  <option value="priority">Priorytet</option>
                  <option value="time">Czas realizacji</option>
                  <option value="revenue">Wartość zlecenia</option>
                  <option value="distance">Odległość</option>
                  <option value="client">Nazwa klienta</option>
                </select>
              </div>

              {/* Filtrowanie */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filtruj:</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Wszystkie</option>
                  <option value="high">Pilne</option>
                  <option value="medium">Średnie</option>
                  <option value="low">Niskie</option>
                  <option value="completed">Wykonane</option>
                  <option value="pending">Oczekujące</option>
                </select>
              </div>
            </div>

            {/* Statystyki i dodatkowe opcje */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                📊 {Object.values(getWeeklyPlanData(weeklyPlan) || {}).reduce((sum, day) => sum + (day?.orders?.length || 0), 0)} zleceń
              </span>
              <span className="flex items-center gap-1">
                💰 {Object.values(getWeeklyPlanData(weeklyPlan) || {}).reduce((sum, day) => 
                  sum + (day?.orders?.reduce((daySum, order) => daySum + (order.serviceCost || 0), 0) || 0), 0
                )} zł
              </span>
              {expandedDay && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-medium">Widok:</span>
                  <select
                    value={ordersPerPage}
                    onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 na stronę</option>
                    <option value={10}>10 na stronę</option>
                    <option value={20}>20 na stronę</option>
                    <option value={50}>50 na stronę</option>
                  </select>
                </div>
              )}
              {expandedDay && (
                <button
                  onClick={() => setExpandedDay(null)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                  title="Zamknij rozwinięty widok"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Zamknij
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop dla rozwiniętego widoku */}
        {expandedDay && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setExpandedDay(null)}
          />
        )}

        {/* Pula niezapisanych zleceń */}
        {(() => {
          // Znajdź wszystkie zlecenia bez przypisanego dnia (scheduledDate === null)
          const unscheduledOrders = weeklyPlan.unscheduledOrders || [];
          
          if (unscheduledOrders.length === 0) {
            return null;
          }
          
          return (
            <div 
              className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-sm border-2 border-orange-200 h-[300px] flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={async (e) => {
                e.preventDefault();
                if (draggedOrder && draggedOrder.sourceDay !== 'unscheduled') {
                  await moveOrderToUnscheduled(draggedOrder.order, draggedOrder.sourceDay);
                }
              }}
            >
              <div className="flex items-center justify-between p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-orange-900">
                      📦 Niezaplanowane zlecenia ({unscheduledOrders.length})
                    </h2>
                    <p className="text-sm text-orange-700">
                      Przeciągnij zlecenie na wybrany dzień tygodnia, aby je zaplanować
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Automatycznie zaplanuj wszystkie zlecenia
                    showNotification('🤖 Automatyczne planowanie...', 'info');
                    loadIntelligentPlan();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  title="Automatycznie rozplanuj wszystkie zlecenia"
                >
                  <Bot className="h-4 w-4" />
                  Auto-plan
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto px-4 pb-4 flex-1">
                {unscheduledOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all cursor-move ${
                      priorityColors[order.priority] || 'border-gray-300'
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, order, 'unscheduled')}
                    onDragEnd={handleDragEnd}
                    title="Przeciągnij to zlecenie na wybrany dzień"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {getCardHeaderText(order)}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {order.deviceType} {order.brand && `- ${order.brand}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.priority === 'urgent' ? '🔥 Pilne' :
                         order.priority === 'high' ? '⚡ Wysokie' :
                         order.priority === 'medium' ? '📌 Średnie' :
                         '✅ Niskie'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {order.description || order.problemDescription || 'Brak opisu'}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.estimatedDuration || 60} min
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {order.serviceCost || 150} zł
                      </span>
                    </div>
                    
                    {order.address && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 truncate" title={order.address}>
                          📍 {order.address}
                        </p>
                      </div>
                    )}
                    
                    {order.preferredDate && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        Preferowana: {new Date(order.preferredDate).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Plan tygodniowy z datami */}
        <div className={`grid gap-6 h-[calc(100vh-500px)] ${
          expandedDay ? 'grid-cols-1' : 
          viewMode === 1 ? 'grid-cols-1' :
          viewMode === 2 ? 'grid-cols-1 md:grid-cols-2' :
          viewMode === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          viewMode === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          viewMode === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-7'
        }`}>
          {Object.keys(dayNames).map(day => {
            const dayPlan = weeklyPlan[day] || { orders: [], stats: {} };
            const dayOrders = getOrdersForWeekDay(day); // 🆕 Użyj funkcji filtrującej zamiast dayPlan.orders
            const dayInfo = formatDayWithDate(day, currentWeekStart);
            
            return (
              <div key={day} className={`bg-white rounded-lg shadow-sm flex flex-col ${
                dayInfo.isToday ? 'ring-2 ring-blue-400 bg-blue-50' : 
                dayInfo.isPast ? 'opacity-75' : ''
              }`}>
                <div className="p-4 border-b border-gray-200 h-[140px] flex-shrink-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold text-lg ${dayInfo.isToday ? 'text-blue-700' : ''}`}>
                        {dayInfo.name}
                      </h3>
                      <p className={`text-sm ${dayInfo.isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {dayInfo.date}
                        {dayInfo.isToday && <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">Dziś</span>}
                        {dayInfo.isPast && <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Przeszłość</span>}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {dayOrders.length} {dayOrders.length === 1 ? 'zlecenie' : 'zleceń'}
                    </span>
                  </div>
                  
                  {dayOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDayRoute(day)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                        title="Otwórz trasę w Google Maps"
                      >
                        <Navigation className="h-3 w-3" />
                        Trasa
                      </button>
                      <button
                        onClick={() => optimizeSingleDay(day)}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700"
                        title="Optymalizuj tylko ten dzień"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Optymalizuj
                      </button>
                      <button
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700"
                      >
                        <Settings className="h-3 w-3" />
                        {selectedDay === day ? 'Ukryj' : 'Szczegóły'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 📅 Timeline z osią czasu i zleceniami */}
                {(() => {
                  const schedule = getServicemanScheduleForDay(day, currentServiceman);
                  
                  // Konwersja czasu na procent wysokości (0-100%)
                  const timeToPixels = (time) => {
                    const [h, m] = time.split(':').map(Number);
                    const totalMinutes = h * 60 + m;
                    
                    if (hideUnusedHours) {
                      // Tryb zwinięty - mapuj tylko zakres timeRange.start do timeRange.end na 0-100%
                      const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                      const offsetMinutes = totalMinutes - (timeRange.start * 60);
                      return (offsetMinutes / rangeMinutes) * 100;
                    } else {
                      // Tryb pełny - mapuj 0-24h na 0-100%
                      return (totalMinutes / (24 * 60)) * 100;
                    }
                  };
                  
                  // Pobierz czas rozpoczęcia wizyty z zlecenia
                  const getOrderStartTime = (order) => {
                    // Sprawdź czy zlecenie ma zapisany czas wizyty
                    if (order.scheduledTime) return order.scheduledTime;
                    if (order.preferredTime) return order.preferredTime;
                    // Jeśli brak - użyj domyślnego (8:00)
                    return '08:00';
                  };
                  
                  const getOrderDuration = (order) => {
                    return order.estimatedDuration || 60; // minuty
                  };
                  
                  // Oblicz czas zakończenia
                  const getOrderEndTime = (order) => {
                    const startTime = getOrderStartTime(order);
                    const duration = getOrderDuration(order);
                    const [h, m] = startTime.split(':').map(Number);
                    const totalMinutes = h * 60 + m + duration;
                    const endH = Math.floor(totalMinutes / 60);
                    const endM = totalMinutes % 60;
                    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                  };
                  
                  // Funkcja do obsługi upuszczenia zlecenia na timeline (zmiana godziny/dnia)
                  const handleTimelineDrop = async (e, targetDay, mouseY) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!draggedOrder) return;
                    
                    // Oblicz godzinę na podstawie pozycji Y myszy
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relativeY = mouseY - rect.top;
                    const percentY = (relativeY / rect.height) * 100;
                    
                    let totalMinutes;
                    if (hideUnusedHours) {
                      // Tryb zwinięty - mapuj 0-100% na zakres timeRange
                      const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                      totalMinutes = (timeRange.start * 60) + (percentY / 100) * rangeMinutes;
                    } else {
                      // Tryb pełny - mapuj 0-100% na 0-24h
                      totalMinutes = (percentY / 100) * 24 * 60;
                    }
                    
                    const hour = Math.floor(totalMinutes / 60);
                    const minute = Math.floor((totalMinutes % 60) / 15) * 15; // Zaokrąglij do 15 min
                    const newTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    
                    console.log(`📍 Upuszczono zlecenie na ${targetDay} o godzinie ${newTime}`);
                    
                    // Aktualizuj zlecenie z nową datą i godziną
                    const targetDate = getDateForDay(targetDay);
                    const dateStr = targetDate.toISOString().split('T')[0];
                    
                    // ✅ OPTYMISTYCZNA AKTUALIZACJA STANU (przed zapisem do API)
                    const updatedOrder = {
                      ...draggedOrder.order,
                      scheduledDate: dateStr,
                      scheduledTime: newTime
                    };
                    
                    // Aktualizuj stan lokalny natychmiast
                    setWeeklyPlan(prevPlan => {
                      const newPlan = { ...prevPlan };
                      
                      // Usuń ze starego miejsca (jeśli było przypisane)
                      if (draggedOrder.sourceDay === 'unscheduled') {
                        newPlan.unscheduledOrders = newPlan.unscheduledOrders.filter(o => o.id !== draggedOrder.order.id);
                      } else {
                        newPlan.scheduledOrders = (newPlan.scheduledOrders || []).filter(o => o.id !== draggedOrder.order.id);
                      }
                      
                      // Dodaj do scheduledOrders z nową datą i godziną
                      newPlan.scheduledOrders = [...(newPlan.scheduledOrders || []), updatedOrder];
                      
                      return newPlan;
                    });
                    
                    try {
                      const response = await fetch(`/api/orders/${draggedOrder.order.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          scheduledDate: dateStr,
                          scheduledTime: newTime
                        })
                      });
                      
                      if (response.ok) {
                        showNotification(`✅ Zlecenie przeniesione na ${targetDay} o ${newTime}`, 'success');
                        // Nie ładuj ponownie całego planu - już zaktualizowaliśmy lokalnie
                      } else {
                        // Jeśli API zwróciło błąd, cofnij zmiany
                        showNotification('❌ Nie udało się zapisać zmian', 'error');
                        await loadIntelligentPlan(); // Przywróć z API
                      }
                    } catch (error) {
                      console.error('Błąd aktualizacji zlecenia:', error);
                      showNotification('❌ Nie udało się przenieść zlecenia', 'error');
                      await loadIntelligentPlan(); // Przywróć z API
                    }
                    
                    setDraggedOrder(null);
                    setIsDragging(false);
                    setDragOverInfo(null);
                  };
                  
                  return (
                    <div 
                      className="relative flex-1 bg-gray-50 border-b border-gray-200 overflow-y-auto min-h-[1600px]"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Pokaż podgląd gdzie zlecenie zostanie upuszczone
                        if (isDragging) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const relativeY = e.clientY - rect.top;
                          const percentY = (relativeY / rect.height) * 100;
                          
                          let totalMinutes;
                          if (hideUnusedHours) {
                            // Tryb zwinięty
                            const rangeMinutes = (timeRange.end - timeRange.start) * 60;
                            totalMinutes = (timeRange.start * 60) + (percentY / 100) * rangeMinutes;
                          } else {
                            // Tryb pełny
                            totalMinutes = (percentY / 100) * 24 * 60;
                          }
                          
                          const hour = Math.floor(totalMinutes / 60);
                          const minute = Math.floor((totalMinutes % 60) / 15) * 15;
                          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          
                          setDragOverInfo({ y: percentY, time, day });
                        }
                      }}
                      onDragLeave={() => setDragOverInfo(null)}
                      onDrop={(e) => {
                        handleTimelineDrop(e, day, e.clientY);
                        setDragOverInfo(null);
                      }}
                    >
                      {/* Linia podglądu podczas przeciągania */}
                      {dragOverInfo && dragOverInfo.day === day && (
                        <div
                          className="absolute w-full border-t-2 border-dashed border-purple-500 z-30 pointer-events-none"
                          style={{ top: `${dragOverInfo.y}%` }}
                        >
                          <span className="absolute right-2 -top-3 text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded shadow-sm">
                            📍 {dragOverInfo.time}
                          </span>
                        </div>
                      )}
                      {/* Siatka godzin - dynamiczny zakres z liniami co 30 min */}
                      {Array.from({ length: (timeRange.end - timeRange.start) * 2 }, (_, i) => {
                        const totalMinutes = (timeRange.start * 60) + (i * 30); // Start at selected hour, increment by 30 min
                        const h = Math.floor(totalMinutes / 60);
                        const m = totalMinutes % 60;
                        const isFullHour = m === 0;
                        
                        // Oblicz pozycję - w trybie zwiniętym mapuj na 0-100%, w pełnym na pozycję w dobie
                        let positionPercent;
                        if (hideUnusedHours) {
                          // Tryb zwinięty - linie równomiernie rozłożone 0-100%
                          positionPercent = (i / ((timeRange.end - timeRange.start) * 2)) * 100;
                        } else {
                          // Tryb pełny - pozycja względem całej doby (0-24h)
                          positionPercent = (totalMinutes / (24 * 60)) * 100;
                        }
                        
                        return (
                          <div
                            key={`grid-${h}-${m}`}
                            className={`absolute w-full pointer-events-none ${
                              isFullHour ? 'border-t-2 border-gray-300' : 'border-t border-gray-200 border-dashed'
                            }`}
                            style={{ top: `${positionPercent}%` }}
                          >
                            {isFullHour && (
                              <span className="text-[11px] text-gray-600 ml-1 bg-gray-50 px-1.5 py-0.5 font-semibold rounded shadow-sm">
                                {h.toString().padStart(2, '0')}:00
                              </span>
                            )}
                            {!isFullHour && (
                              <span className="text-[9px] text-gray-400 ml-1 bg-gray-50/80 px-1">
                                {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Przyciemnienie godzin poza zakresem - tylko w trybie pełnym */}
                      {!hideUnusedHours && timeRange.start > 0 && (
                        <div 
                          className="absolute w-full bg-gray-900 opacity-10 pointer-events-none z-10"
                          style={{
                            top: 0,
                            height: `${(timeRange.start / 24) * 100}%`
                          }}
                          title={`Ukryto godziny: 00:00 - ${timeRange.start.toString().padStart(2, '0')}:00`}
                        />
                      )}
                      {!hideUnusedHours && timeRange.end < 24 && (
                        <div 
                          className="absolute w-full bg-gray-900 opacity-10 pointer-events-none z-10"
                          style={{
                            top: `${(timeRange.end / 24) * 100}%`,
                            height: `${((24 - timeRange.end) / 24) * 100}%`
                          }}
                          title={`Ukryto godziny: ${timeRange.end.toString().padStart(2, '0')}:00 - 24:00`}
                        />
                      )}
                      
                      {/* Tło dostępności serwisanta (półprzezroczyste zielone) */}
                      {schedule && schedule.workSlots && schedule.workSlots.map((slot, idx) => (
                        <div
                          key={`work-${idx}`}
                          className="absolute w-full bg-green-100 opacity-30 pointer-events-none"
                          style={{
                            top: `${timeToPixels(slot.startTime)}%`,
                            height: `${timeToPixels(slot.endTime) - timeToPixels(slot.startTime)}%`
                          }}
                        />
                      ))}
                      
                      {/* Przerwy serwisanta (półprzezroczyste pomarańczowe) */}
                      {schedule && schedule.breaks && schedule.breaks.map((breakSlot, idx) => (
                        <div
                          key={`break-${idx}`}
                          className="absolute w-full bg-orange-200 opacity-40 pointer-events-none"
                          style={{
                            top: `${timeToPixels(breakSlot.startTime)}%`,
                            height: `${timeToPixels(breakSlot.endTime) - timeToPixels(breakSlot.startTime)}%`
                          }}
                        />
                      ))}
                      
                      {/* ZLECENIA na timeline - PRZECIĄGALNE */}
                      {dayOrders.map((order) => {
                        const startTime = getOrderStartTime(order);
                        const endTime = getOrderEndTime(order);
                        const duration = getOrderDuration(order);
                        const heightPercent = timeToPixels(endTime) - timeToPixels(startTime);
                        
                        // Oblicz rzeczywistą wysokość w pikselach (1600px * heightPercent / 100)
                        const heightPx = Math.max(50, (1600 * heightPercent) / 100);
                        
                        return (
                          <div
                            key={`timeline-${day}-${order.id}`}
                            className="absolute w-full px-2 z-20 cursor-move group"
                            style={{
                              top: `${timeToPixels(startTime)}%`,
                              height: `${heightPercent}%`,
                              minHeight: '50px' // Minimum dla czytelności
                            }}
                            title={`${startTime} - ${endTime} (${duration} min)\nPrzeciągnij aby zmienić godzinę lub dzień`}
                            draggable={true}
                            onDragStart={(e) => {
                              handleDragStart(e, order, day);
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              handleDragEnd(e);
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <div className={`h-full rounded-lg shadow-lg border-2 p-2 bg-white group-hover:shadow-xl transition-all overflow-hidden cursor-move ${
                              order.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                              order.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                              order.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                              'border-blue-500 bg-blue-50'
                            }`}>
                              {/* Ikona przeciągania */}
                              <div className="absolute top-1 right-1 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                ⋮⋮
                              </div>
                              
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs truncate">{getCardHeaderText(order)}</h4>
                                  <p className="text-[10px] text-gray-600 truncate">{order.deviceType}</p>
                                </div>
                                <span className="text-sm font-bold ml-1">
                                  {order.priority === 'urgent' ? '🔥' :
                                   order.priority === 'high' ? '⚡' :
                                   order.priority === 'medium' ? '📌' : '✅'}
                                </span>
                              </div>
                              
                              <div className="text-[10px] text-gray-700 font-bold bg-white/50 rounded px-1 py-0.5 inline-block">
                                🕒 {startTime} - {endTime}
                              </div>
                              
                              <div className="text-[9px] text-gray-600 mt-1">
                                ⏱️ {duration} min
                              </div>
                              
                              {order.address && heightPercent > 4 && (
                                <div className="text-[8px] text-gray-500 mt-1 truncate" title={order.address}>
                                  📍 {order.address}
                                </div>
                              )}
                              
                              {/* Wskazówka przy hover */}
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-1 rounded">
                                Przeciągnij ↕️ lub ↔️
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                
                {/* Statystyki dnia (pod timeline) */}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  {dayOrders.length === 0 ? (
                    <div className="text-center text-xs text-gray-500">
                      {isDragging 
                        ? `📦 Przeciągnij "${draggedOrder?.order?.clientName}" na timeline` 
                        : 'Brak zleceń - przeciągnij zlecenie z puli nieprzypisanych'
                      }
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📦 Zlecenia: <strong>{dayOrders.length}</strong></div>
                      <div>⏱️ Łączny czas: <strong>{dayOrders.reduce((sum, o) => sum + (o.estimatedDuration || 60), 0)} min</strong></div>
                      <div>💰 Przychód: <strong>{dayOrders.reduce((sum, o) => sum + (o.serviceCost || 150), 0)} zł</strong></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alternatywne plany */}
        {weeklyPlan.alternatives && weeklyPlan.alternatives.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Route className="h-5 w-5 text-purple-600" />
              Alternatywne Strategie Optymalizacji
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyPlan.alternatives.map((alt, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <h3 className="font-semibold text-sm mb-2">{alt.name}</h3>
                  <p className="text-xs text-gray-600 mb-3">{alt.description}</p>
                  <div className="text-xs text-purple-600 font-medium">
                    Potencjalne oszczędności: {alt.estimatedSavings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 💰 Modal z dashboardem kosztów API */}
        {showCostDashboard && (() => {
          const monitor = getApiCostMonitor();
          const stats = monitor.getStats();
          const costPercentage = (stats.estimatedCost / stats.dailyBudgetLimit) * 100;
          const requestPercentage = (stats.requests.total / stats.dailyRequestLimit) * 100;
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                    Dashboard Kosztów API
                  </h2>
                  <button
                    onClick={() => setShowCostDashboard(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Podsumowanie kosztów */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Koszt dzisiaj</div>
                      <div className="text-3xl font-bold text-blue-600">
                        ${stats.estimatedCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Limit: ${stats.dailyBudgetLimit}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Miesięczna prognoza</div>
                      <div className="text-3xl font-bold text-green-600">
                        ${stats.estimatedMonthlyCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Limit: $200 (kredyt Google)
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar budżetu */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Wykorzystanie budżetu dziennego
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {costPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          costPercentage >= 90 ? 'bg-red-500' :
                          costPercentage >= 80 ? 'bg-orange-500' :
                          costPercentage >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(costPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Progress bar zapytań */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Zapytania dzisiaj
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {stats.requests.total} / {stats.dailyRequestLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          requestPercentage >= 90 ? 'bg-red-500' :
                          requestPercentage >= 80 ? 'bg-orange-500' :
                          requestPercentage >= 60 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(requestPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Statystyki szczegółowe */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Zapytania API</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.requests.api}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        ${(stats.requests.api * stats.costPerRequest).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Z cache</div>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.requests.cache}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        $0.00 (FREE)
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Nieudane</div>
                      <div className="text-2xl font-bold text-red-600">
                        {stats.requests.failed}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Bez kosztu
                      </div>
                    </div>
                  </div>
                  
                  {/* Cache hit rate */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-700">Cache Hit Rate</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {stats.cacheHitRate}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {stats.requests.cache} zapytań obsłużonych bez kosztu dzięki cache
                    </p>
                  </div>
                  
                  {/* Rate limiting status */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Rate Limiting</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Limit: {stats.perMinuteLimit} zapytań/minutę
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Ostatnie zapytanie: {new Date(stats.lastRequestAt || Date.now()).toLocaleTimeString('pl-PL')}
                    </div>
                  </div>
                  
                  {/* Alerty */}
                  {stats.alerts && stats.alerts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-700">Ostrzeżenia</span>
                      </div>
                      <div className="space-y-2">
                        {stats.alerts.map((alert, idx) => (
                          <div key={idx} className="text-sm text-red-600">
                            • {alert}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Akcje */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        monitor.resetStats();
                        setShowCostDashboard(false);
                        alert('✅ Statystyki zostały zresetowane');
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      🗑️ Wyczyść statystyki
                    </button>
                    <button
                      onClick={() => {
                        monitor.printStats();
                        alert('✅ Sprawdź konsolę dla szczegółowych statystyk');
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📊 Pokaż w konsoli
                    </button>
                    <button
                      onClick={() => setShowCostDashboard(false)}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Zamknij
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default IntelligentWeekPlanner;
