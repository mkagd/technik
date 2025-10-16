import '../styles/globals.css'
import { useEffect } from 'react'
import { ThemeProvider } from '../utils/ThemeContext'
import { DarkModeProvider } from '../contexts/DarkModeContext'
import { ToastProvider } from '../contexts/ToastContext'
import PWAInstallPrompt from '../components/PWAInstallPrompt'
import PWAOfflineIndicator from '../components/PWAOfflineIndicator'
import PWADebugPanel from '../components/PWADebugPanel'

export default function App({ Component, pageProps }) {
  // Register Service Worker for offline visit completion sync
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/offline-sync-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Listen for sync messages from Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SYNC_SUCCESS') {
              console.log(`✅ Visit ${event.data.visitId} synced from offline queue!`);
              
              // Optional: Show toast notification
              if (window.showToast) {
                window.showToast(`✅ Wizyta ${event.data.visitId} zsynchronizowana`, 'success');
              }
            } else if (event.data.type === 'SYNC_ERROR') {
              console.error(`❌ Sync failed for visit ${event.data.visitId}:`, event.data.error);
              
              // Optional: Show error notification
              if (window.showToast) {
                window.showToast(`❌ Błąd synchronizacji wizyty ${event.data.visitId}`, 'error');
              }
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Request notification permission for offline sync alerts
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('✅ Notification permission granted');
          } else {
            console.log('ℹ️ Notification permission denied');
          }
        });
      }
    }
  }, []);

  return (
    <DarkModeProvider>
      <ThemeProvider>
        <ToastProvider>
          <PWAOfflineIndicator />
          <PWAInstallPrompt />
          <PWADebugPanel />
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </DarkModeProvider>
  )
}
