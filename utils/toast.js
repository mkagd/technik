import toast from 'react-hot-toast';

/**
 * Toast Utility Helper
 * Uproszczone funkcje do wyświetlania powiadomień
 */

export const showToast = {
  /**
   * Sukces - zielone powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {object} options - Dodatkowe opcje (duration, itp.)
   */
  success: (message, options = {}) => {
    return toast.success(message, {
      ...options,
    });
  },

  /**
   * Błąd - czerwone powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {object} options - Dodatkowe opcje
   */
  error: (message, options = {}) => {
    return toast.error(message, {
      ...options,
    });
  },

  /**
   * Ostrzeżenie - pomarańczowe powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {object} options - Dodatkowe opcje
   */
  warning: (message, options = {}) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: '#fffbeb',
        border: '1px solid #fcd34d',
      },
      ...options,
    });
  },

  /**
   * Info - niebieskie powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {object} options - Dodatkowe opcje
   */
  info: (message, options = {}) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#eff6ff',
        border: '1px solid #93c5fd',
      },
      ...options,
    });
  },

  /**
   * Loading - spinner z możliwością aktualizacji
   * @param {string} message - Wiadomość do wyświetlenia
   * @returns {string} - ID toasta do późniejszej aktualizacji
   */
  loading: (message) => {
    return toast.loading(message);
  },

  /**
   * Promise - automatyczna obsługa stanów promise
   * @param {Promise} promise - Promise do monitorowania
   * @param {object} messages - Wiadomości dla każdego stanu
   */
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Ładowanie...',
      success: messages.success || 'Sukces!',
      error: messages.error || 'Wystąpił błąd',
    });
  },

  /**
   * Potwierdzenie - z przyciskami akcji
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {function} onConfirm - Funkcja po potwierdzeniu
   * @param {function} onCancel - Funkcja po anulowaniu
   */
  confirm: (message, onConfirm, onCancel) => {
    return toast(
      (t) => (
        <div>
          <p className="mb-3 font-medium">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onConfirm && onConfirm();
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Potwierdź
            </button>
            <button
              onClick={() => {
                onCancel && onCancel();
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        icon: '❓',
      }
    );
  },

  /**
   * Zamknij konkretny toast
   * @param {string} toastId - ID toasta do zamknięcia
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Zamknij wszystkie toasty
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// Export również oryginalnego toast dla zaawansowanego użycia
export { toast };
