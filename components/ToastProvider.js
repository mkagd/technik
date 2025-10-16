import { Toaster } from 'react-hot-toast';

/**
 * Toast Provider Component
 * Dodaje globalny Toaster do aplikacji z konfiguracją
 */
export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Domyślne opcje dla wszystkich toastów
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '14px',
            maxWidth: '500px',
          },
          // Opcje dla success
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#f0fdf4',
              border: '1px solid #86efac',
            },
          },
          // Opcje dla error
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#fef2f2',
              border: '1px solid #fca5a5',
            },
          },
          // Opcje dla loading
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
