// components/LocationTimer.js
import { useState, useEffect, useRef } from 'react';
import { 
  FiMapPin, 
  FiPlay, 
  FiPause, 
  FiNavigation, 
  FiCheck, 
  FiAlertCircle,
  FiClock,
  FiTarget
} from 'react-icons/fi';
import { geocodeAddress } from '../utils/geocoding';

const LocationTimer = ({ 
  orderLocation, 
  onTimerStart, 
  onTimerStop, 
  isTimerRunning, 
  timerStartTime,
  workSessions = []
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAtLocation, setIsAtLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [distanceToLocation, setDistanceToLocation] = useState(null);
  const [autoTimerEnabled, setAutoTimerEnabled] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [targetCoordinates, setTargetCoordinates] = useState(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const watchIdRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Threshold distance in meters (50m = pretty close)
  const ARRIVAL_THRESHOLD = 50;
  const DEPARTURE_THRESHOLD = 100;

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Parse order location (assuming it's in format like "52.2297,21.0122" or address)
  const parseOrderLocation = async (location) => {
    if (!location) return null;
    
    // If it's coordinates
    const coordsMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordsMatch) {
      return {
        latitude: parseFloat(coordsMatch[1]),
        longitude: parseFloat(coordsMatch[2])
      };
    }
    
    // If it's an address, try geocoding
    setIsGeocodingAddress(true);
    try {
      const coordinates = await geocodeAddress(location);
      setIsGeocodingAddress(false);
      return coordinates;
    } catch (error) {
      console.error('Geocoding failed:', error);
      setIsGeocodingAddress(false);
      return null;
    }
  };

  // Initialize target coordinates when component mounts or orderLocation changes
  useEffect(() => {
    const initializeTargetLocation = async () => {
      if (orderLocation) {
        const coords = await parseOrderLocation(orderLocation);
        setTargetCoordinates(coords);
      }
    };
    
    initializeTargetLocation();
  }, [orderLocation]);

  // Start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokalizacja nie jest obsługiwana w tej przeglądarce');
      return;
    }

    setIsTrackingLocation(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // Cache location for 30 seconds
    };

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setCurrentLocation(newLocation);
        checkLocationProximity(newLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(`Błąd lokalizacji: ${error.message}`);
        setIsTrackingLocation(false);
      },
      options
    );
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    setIsTrackingLocation(false);
  };

  // Check if current location is close to order location
  const checkLocationProximity = (current) => {
    if (!targetCoordinates || !current) return;

    const distance = calculateDistance(
      current.latitude,
      current.longitude,
      targetCoordinates.latitude,
      targetCoordinates.longitude
    );

    setDistanceToLocation(Math.round(distance));

    const wasAtLocation = isAtLocation;
    const nowAtLocation = distance <= ARRIVAL_THRESHOLD;
    const hasLeft = wasAtLocation && distance > DEPARTURE_THRESHOLD;

    setIsAtLocation(nowAtLocation);

    // Auto-start timer when arriving
    if (!wasAtLocation && nowAtLocation && autoTimerEnabled && !isTimerRunning) {
      setArrivalTime(new Date());
      setTimeout(() => {
        onTimerStart();
        alert('🎯 Dotarłeś na miejsce! Timer został automatycznie uruchomiony.');
      }, 1000);
    }

    // Auto-stop timer when leaving (with confirmation)
    if (hasLeft && autoTimerEnabled && isTimerRunning) {
      if (confirm('📍 Wykryto oddalenie od miejsca zlecenia. Czy zatrzymać timer?')) {
        onTimerStop();
      }
    }
  };

  // Manual location check
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokalizacja nie jest obsługiwana');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setCurrentLocation(location);
        checkLocationProximity(location);
      },
      (error) => {
        setLocationError(`Błąd lokalizacji: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getLocationStatus = () => {
    if (!currentLocation) return 'unknown';
    if (distanceToLocation === null) return 'no-target';
    if (distanceToLocation <= ARRIVAL_THRESHOLD) return 'arrived';
    if (distanceToLocation <= 200) return 'close';
    if (distanceToLocation <= 1000) return 'nearby';
    return 'far';
  };

  const locationStatus = getLocationStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiMapPin className="h-5 w-5 mr-2" />
          Lokalizacja i Timer
        </h3>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={autoTimerEnabled}
              onChange={(e) => setAutoTimerEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-2"
            />
            Auto-timer
          </label>
        </div>
      </div>

      {/* Location Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Status lokalizacji</span>
            <div className={`w-3 h-3 rounded-full ${
              locationStatus === 'arrived' ? 'bg-green-500' :
              locationStatus === 'close' ? 'bg-yellow-500' :
              locationStatus === 'nearby' ? 'bg-blue-500' :
              'bg-gray-500'
            }`}></div>
          </div>
          <p className="text-sm text-gray-600">
            {locationStatus === 'arrived' && '🎯 Na miejscu'}
            {locationStatus === 'close' && '📍 Bardzo blisko'}
            {locationStatus === 'nearby' && '🚗 W pobliżu'}
            {locationStatus === 'far' && '🛣️ Daleko'}
            {locationStatus === 'no-target' && '❓ Brak adresu docelowego'}
            {locationStatus === 'unknown' && '📡 Pobieranie lokalizacji...'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Odległość</span>
            <FiTarget className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-lg font-semibold">
            {distanceToLocation !== null ? formatDistance(distanceToLocation) : '---'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Czas na miejscu</span>
            <FiClock className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-lg font-semibold">
            {arrivalTime && isAtLocation ? 
              new Date().toLocaleTimeString('pl-PL', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              }) : '---'
            }
          </p>
        </div>
      </div>

      {/* Error Display */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{locationError}</span>
          </div>
        </div>
      )}

      {/* Location Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={getCurrentLocation}
          disabled={isTrackingLocation}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <FiNavigation className="h-4 w-4 mr-2" />
          Sprawdź lokalizację
        </button>

        <button
          onClick={isTrackingLocation ? stopLocationTracking : startLocationTracking}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isTrackingLocation 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isTrackingLocation ? (
            <>
              <FiPause className="h-4 w-4 mr-2" />
              Zatrzymaj śledzenie
            </>
          ) : (
            <>
              <FiPlay className="h-4 w-4 mr-2" />
              Śledź lokalizację
            </>
          )}
        </button>
      </div>

      {/* Timer Controls */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Kontrola timera</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onTimerStart}
            disabled={isTimerRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <FiPlay className="h-4 w-4 mr-2" />
            Start Timer
          </button>

          <button
            onClick={onTimerStop}
            disabled={!isTimerRunning}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            <FiPause className="h-4 w-4 mr-2" />
            Stop Timer
          </button>

          {locationStatus === 'arrived' && !isTimerRunning && (
            <button
              onClick={onTimerStart}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors animate-pulse"
            >
              <FiCheck className="h-4 w-4 mr-2" />
              Jestem na miejscu - Start!
            </button>
          )}
        </div>
      </div>

      {/* Location Info */}
      {currentLocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Współrzędne:</strong> {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </p>
          <p className="text-xs text-gray-600">
            <strong>Dokładność:</strong> ±{Math.round(currentLocation.accuracy)}m
          </p>
          <p className="text-xs text-gray-600">
            <strong>Ostatnia aktualizacja:</strong> {new Date(currentLocation.timestamp).toLocaleTimeString('pl-PL')}
          </p>
        </div>
      )}

      {/* Auto-timer Info */}
      {autoTimerEnabled && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <FiTarget className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Auto-timer włączony: Timer uruchomi się automatycznie gdy dotrzesz na miejsce (w promieniu {ARRIVAL_THRESHOLD}m)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTimer;