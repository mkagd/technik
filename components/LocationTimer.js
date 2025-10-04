import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Play, Pause, Square } from 'lucide-react';

const LocationTimer = ({ 
  orderId, 
  isStarted = false, 
  onStart, 
  onPause, 
  onStop, 
  onLocationUpdate 
}) => {
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(isStarted);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else if (!isRunning) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Location tracking effect
  useEffect(() => {
    if (isRunning && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          };
          setCurrentLocation(location);
          setLocationError(null);
          
          if (onLocationUpdate) {
            onLocationUpdate(location);
          }
        },
        (error) => {
          setLocationError('Nie można pobrać lokalizacji');
          console.error('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRunning, onLocationUpdate]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);
    
    if (onStart) {
      onStart(now);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    
    if (onPause) {
      onPause(elapsedTime);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    
    if (onStop) {
      onStop(elapsedTime);
    }
    
    setElapsedTime(0);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-600" />
          Timer pracy
        </h3>
        
        {currentLocation && (
          <div className="flex items-center text-sm text-green-600">
            <MapPin className="mr-1 h-4 w-4" />
            Lokalizacja śledzona
          </div>
        )}
        
        {locationError && (
          <div className="flex items-center text-sm text-red-600">
            <MapPin className="mr-1 h-4 w-4" />
            {locationError}
          </div>
        )}
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-gray-800">
          {formatTime(elapsedTime)}
        </div>
        {startTime && (
          <div className="text-sm text-gray-500 mt-1">
            Rozpoczęto: {new Date(startTime).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="mr-2 h-4 w-4" />
            {startTime ? 'Wznów' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pauza
          </button>
        )}
        
        {(startTime || elapsedTime > 0) && (
          <button
            onClick={handleStop}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </button>
        )}
      </div>

      {currentLocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div>Szerokość: {currentLocation.latitude.toFixed(6)}</div>
            <div>Długość: {currentLocation.longitude.toFixed(6)}</div>
            <div>Aktualizacja: {new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTimer;