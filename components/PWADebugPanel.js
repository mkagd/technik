import { useState, useEffect } from 'react';

/**
 * PWA Debug Panel
 * Wyświetla informacje diagnostyczne o PWA
 * Usuń po zakończeniu testów!
 */
export default function PWADebugPanel() {
  const [info, setInfo] = useState({
    isStandalone: false,
    hasServiceWorker: false,
    serviceWorkerState: 'none',
    manifestLoaded: false,
    beforeInstallPromptFired: false,
    dismissed: false,
    userAgent: ''
  });

  useEffect(() => {
    // Sprawdź wszystkie warunki PWA
    const checkPWAStatus = async () => {
      const newInfo = {
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        hasServiceWorker: 'serviceWorker' in navigator,
        serviceWorkerState: 'none',
        manifestLoaded: false,
        beforeInstallPromptFired: false,
        dismissed: localStorage.getItem('pwa-install-dismissed') === 'true',
        userAgent: navigator.userAgent
      };

      // Sprawdź Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          newInfo.serviceWorkerState = registration.active ? 'active' : 'installing';
        }
      }

      // Sprawdź manifest
      try {
        const response = await fetch('/manifest.json');
        newInfo.manifestLoaded = response.ok;
      } catch (e) {
        newInfo.manifestLoaded = false;
      }

      setInfo(newInfo);
    };

    checkPWAStatus();

    // Nasłuchuj na beforeinstallprompt
    const handler = () => {
      setInfo(prev => ({ ...prev, beforeInstallPromptFired: true }));
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Nie pokazuj w production (tylko dla development/testing)
  if (process.env.NODE_ENV === 'production' && !new URLSearchParams(window.location.search).has('debug')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl text-xs max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">🔍 PWA Debug</h3>
        <button
          onClick={() => {
            const panel = document.querySelector('[data-pwa-debug]');
            if (panel) panel.style.display = 'none';
          }}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1" data-pwa-debug>
        <div className="flex items-center space-x-2">
          <span className={info.isStandalone ? 'text-green-400' : 'text-red-400'}>
            {info.isStandalone ? '✅' : '❌'}
          </span>
          <span>Standalone Mode: {info.isStandalone ? 'TAK' : 'NIE'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={info.hasServiceWorker ? 'text-green-400' : 'text-red-400'}>
            {info.hasServiceWorker ? '✅' : '❌'}
          </span>
          <span>Service Worker API: {info.hasServiceWorker ? 'TAK' : 'NIE'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={info.serviceWorkerState === 'active' ? 'text-green-400' : 'text-yellow-400'}>
            {info.serviceWorkerState === 'active' ? '✅' : '⚠️'}
          </span>
          <span>SW State: {info.serviceWorkerState}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={info.manifestLoaded ? 'text-green-400' : 'text-red-400'}>
            {info.manifestLoaded ? '✅' : '❌'}
          </span>
          <span>Manifest.json: {info.manifestLoaded ? 'OK' : 'FAIL'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={info.beforeInstallPromptFired ? 'text-green-400' : 'text-red-400'}>
            {info.beforeInstallPromptFired ? '✅' : '❌'}
          </span>
          <span>Install Prompt: {info.beforeInstallPromptFired ? 'FIRED' : 'PENDING'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={!info.dismissed ? 'text-green-400' : 'text-yellow-400'}>
            {!info.dismissed ? '✅' : '⚠️'}
          </span>
          <span>Dismissed: {info.dismissed ? 'TAK (reset!)' : 'NIE'}</span>
        </div>

        {info.dismissed && (
          <button
            onClick={() => {
              localStorage.removeItem('pwa-install-dismissed');
              window.location.reload();
            }}
            className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            🔄 Reset "Dismissed" i odśwież
          </button>
        )}

        <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
          Browser: {info.userAgent.includes('Chrome') ? 'Chrome' : info.userAgent.includes('Edge') ? 'Edge' : 'Other'}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-gray-400 mb-1">Testy:</div>
          <button
            onClick={() => {
              console.log('🔍 PWA Status:', info);
              alert('Sprawdź console (F12)');
            }}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs mb-1"
          >
            📋 Log do console
          </button>
          <button
            onClick={async () => {
              if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                alert('Service Worker zarejestrowany: ' + registration.scope);
              }
            }}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs"
          >
            🔄 Rejestruj SW ręcznie
          </button>
        </div>
      </div>
    </div>
  );
}
