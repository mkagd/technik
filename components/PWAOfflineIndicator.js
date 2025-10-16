import { useState, useEffect } from 'react';

/**
 * PWA Offline Indicator
 * Wyświetla powiadomienie gdy użytkownik traci połączenie z internetem
 */
export default function PWAOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Sprawdź początkowy status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Pokaż powiadomienie że wróciliśmy online
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Nie pokazuj nic jeśli jesteśmy online i nie byliśmy offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 text-center text-sm font-medium z-50 shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>
              Brak połączenia z internetem. Pracujesz w trybie offline.
            </span>
          </div>
        </div>
      )}

      {/* Back online notification */}
      {isOnline && wasOffline && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white py-2 px-4 text-center text-sm font-medium z-50 shadow-lg animate-slide-down">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Połączono ponownie z internetem
            </span>
          </div>
        </div>
      )}
    </>
  );
}
