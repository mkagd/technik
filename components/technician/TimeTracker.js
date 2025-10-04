import { useState, useEffect } from 'react';

export default function TimeTracker({ visit, onSessionChanged }) {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load session status on mount
  useEffect(() => {
    loadSessionStatus();
  }, [visit.visitId]);

  // Update elapsed time every second when active
  useEffect(() => {
    let interval;
    
    if (sessionStatus?.isActive && !sessionStatus?.isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStatus?.isActive, sessionStatus?.isPaused]);

  const loadSessionStatus = async () => {
    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch(`/api/technician/time-tracking?visitId=${visit.visitId}&action=status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSessionStatus(data.status);
        
        // Initialize elapsed time
        if (data.status?.currentSessionDuration) {
          setElapsedTime(data.status.currentSessionDuration * 60); // Convert minutes to seconds
        }
      }
    } catch (err) {
      console.error('Error loading session status:', err);
    }
  };

  const performAction = async (action, reason = '') => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch('/api/technician/time-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          action,
          reason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd operacji');
      }

      // Update session status
      await loadSessionStatus();

      // Reset elapsed time for new session
      if (action === 'start') {
        setElapsedTime(0);
      }

      // Call callback
      if (onSessionChanged) {
        onSessionChanged(data.visit);
      }

    } catch (err) {
      console.error('Error performing action:', err);
      setError(err.message || 'Błąd operacji');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => performAction('start');
  const handlePause = () => performAction('pause', 'Przerwa');
  const handleResume = () => performAction('resume');
  const handleStop = () => performAction('stop');

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 ${
            sessionStatus?.isActive && !sessionStatus?.isPaused
              ? 'bg-green-600 text-white animate-pulse'
              : sessionStatus?.isPaused
              ? 'bg-orange-600 text-white'
              : 'bg-gray-600 text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-semibold text-sm">Timer pracy</span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Status indicator */}
          <div className="mb-4 text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              sessionStatus?.isActive && !sessionStatus?.isPaused
                ? 'bg-green-100 text-green-800'
                : sessionStatus?.isPaused
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                sessionStatus?.isActive && !sessionStatus?.isPaused
                  ? 'bg-green-600 animate-pulse'
                  : sessionStatus?.isPaused
                  ? 'bg-orange-600'
                  : 'bg-gray-600'
              }`}></div>
              {sessionStatus?.isActive && !sessionStatus?.isPaused
                ? 'Aktywna'
                : sessionStatus?.isPaused
                ? 'Wstrzymana'
                : 'Nieaktywna'}
            </div>
          </div>

          {/* Timer display */}
          <div className="mb-4">
            <div className="text-center mb-2">
              <div className="text-4xl font-mono font-bold text-gray-900">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Czas bieżącej sesji</p>
            </div>

            {/* Total time */}
            {sessionStatus && sessionStatus.totalDuration > 0 && (
              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">Łączny czas</p>
                <p className="text-sm font-semibold text-gray-700">
                  {sessionStatus.totalDuration} min ({sessionStatus.sessionCount} sesji)
                </p>
              </div>
            )}
          </div>

          {/* Control buttons */}
          <div className="space-y-2">
            {!sessionStatus?.isActive ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rozpocznij pracę
              </button>
            ) : sessionStatus?.isPaused ? (
              <div className="space-y-2">
                <button
                  onClick={handleResume}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Wznów
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Zakończ
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handlePause}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Wstrzymaj
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Zakończ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
