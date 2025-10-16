import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPackage, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiLogIn,
  FiAlertCircle,
  FiLoader,
  FiHome
} from 'react-icons/fi';

/**
 * Strona "Moje Zgłoszenia"
 * Dla niezalogowanych: localStorage + weryfikacja phone+address
 * Dla zalogowanych: pełna historia zleceń
 */
export default function MojeZgloszenia() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stan dla weryfikacji (niezalogowani)
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState({
    phone: '',
    address: ''
  });
  const [verifying, setVerifying] = useState(false);

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    const clientDataStr = localStorage.getItem('clientData');
    
    if (token && clientDataStr) {
      setIsLoggedIn(true);
      setClientData(JSON.parse(clientDataStr));
      fetchOrdersForLoggedIn(token);
    } else {
      // Niezalogowany - sprawdź localStorage
      loadOrdersFromLocalStorage();
    }
  }, []);

  // Załaduj zlecenia z localStorage (dla niezalogowanych)
  const loadOrdersFromLocalStorage = () => {
    try {
      const storedOrders = localStorage.getItem('myOrders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz zlecenia dla zalogowanego użytkownika
  const fetchOrdersForLoggedIn = async (token) => {
    setLoading(true);
    try {
      const clientDataStr = localStorage.getItem('clientData');
      const clientData = JSON.parse(clientDataStr);
      
      const response = await fetch('/api/moje-zgloszenia', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientId: clientData.id })
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Nie udało się pobrać zgłoszeń');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Weryfikacja phone + address (dla niezalogowanych)
  const handleVerification = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/moje-zgloszenia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verificationData.phone,
          address: verificationData.address
        })
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Zbyt wiele prób weryfikacji. Spróbuj ponownie za godzinę.');
      } else if (data.success) {
        setOrders(data.orders);
        setShowVerification(false);
        // Zapisz do localStorage
        localStorage.setItem('myOrders', JSON.stringify(data.orders));
      } else {
        setError(data.message || 'Weryfikacja nie powiodła się');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setVerifying(false);
    }
  };

  // Formatuj status zlecenia
  const getStatusInfo = (status) => {
    const statusMap = {
      'new': { label: 'Nowe', color: 'blue', icon: FiPackage },
      'pending': { label: 'Oczekujące', color: 'yellow', icon: FiClock },
      'in_progress': { label: 'W realizacji', color: 'indigo', icon: FiLoader },
      'completed': { label: 'Zakończone', color: 'green', icon: FiCheckCircle },
      'cancelled': { label: 'Anulowane', color: 'red', icon: FiXCircle }
    };
    return statusMap[status] || statusMap['new'];
  };

  // Renderuj kartę zlecenia
  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4"
        style={{ borderLeftColor: `var(--color-${statusInfo.color}-500)` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {order.orderNumber || order.id}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
            <StatusIcon className="w-4 h-4" />
            {statusInfo.label}
          </span>
        </div>

        {/* Urządzenia */}
        {order.devices && order.devices.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Urządzenia:</h4>
            <div className="space-y-2">
              {order.devices.map((device, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <FiPackage className="w-4 h-4 text-gray-400" />
                  <span>{device.brand} {device.model}</span>
                  {device.serialNumber && (
                    <span className="text-gray-400">• S/N: {device.serialNumber}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informacje kontaktowe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {order.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span>{order.phone}</span>
            </div>
          )}
          {order.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <FiMapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{order.address}</span>
            </div>
          )}
        </div>

        {/* Przycisk szczegółów */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href={`/track/${order.orderNumber || order.id}`}>
            <a className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
              Zobacz szczegóły →
            </a>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Head>
        <title>Moje Zgłoszenia - AGD Serwis</title>
        <meta name="description" content="Sprawdź status swoich zgłoszeń serwisowych" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <a className="text-gray-600 hover:text-gray-900">
                    <FiHome className="w-6 h-6" />
                  </a>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Moje Zgłoszenia</h1>
              </div>
              
              {!isLoggedIn && (
                <Link href="/client/login">
                  <a className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FiLogIn />
                    Zaloguj się
                  </a>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <FiAlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <>
              {/* Niezalogowany użytkownik - brak zleceń w localStorage */}
              {!isLoggedIn && orders.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Brak zgłoszeń
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Nie znaleziono zgłoszeń w pamięci przeglądarki. Masz dwa sposoby na sprawdzenie swoich zgłoszeń:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {/* Weryfikacja */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-left">
                      <h3 className="font-bold text-gray-900 mb-2">
                        Weryfikacja telefon + adres
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Podaj swój telefon i adres, aby zobaczyć zgłoszenia bez logowania
                      </p>
                      <button
                        onClick={() => setShowVerification(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Weryfikuj
                      </button>
                    </div>

                    {/* Logowanie */}
                    <div className="bg-white rounded-lg shadow-md p-6 text-left">
                      <h3 className="font-bold text-gray-900 mb-2">
                        Zaloguj się
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Masz już konto? Zaloguj się, aby zobaczyć pełną historię
                      </p>
                      <Link href="/client/login">
                        <a className="block w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-center">
                          Logowanie
                        </a>
                      </Link>
                    </div>
                  </div>

                  {/* Opcja rejestracji */}
                  <div className="mt-6">
                    <p className="text-gray-600 text-sm">
                      Nie masz jeszcze konta?{' '}
                      <Link href="/client/register">
                        <a className="text-blue-600 hover:text-blue-700 font-medium">
                          Zarejestruj się
                        </a>
                      </Link>
                      {' '}i automatycznie zlinkujemy Twoje wcześniejsze zgłoszenia!
                    </p>
                  </div>
                </div>
              )}

              {/* Lista zleceń */}
              {orders.length > 0 && (
                <>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      {isLoggedIn 
                        ? `Znaleziono ${orders.length} ${orders.length === 1 ? 'zlecenie' : orders.length < 5 ? 'zlecenia' : 'zleceń'}`
                        : `Wyświetlam ${orders.length} ${orders.length === 1 ? 'zlecenie' : orders.length < 5 ? 'zlecenia' : 'zleceń'} z pamięci przeglądarki`
                      }
                    </p>
                    {!isLoggedIn && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <FiAlertCircle className="inline mr-1" />
                        Zaloguj się lub zarejestruj, aby zobaczyć wszystkie swoje zgłoszenia i mieć do nich dostęp na każdym urządzeniu!
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((order) => (
                      <OrderCard key={order.id || order.orderNumber} order={order} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal weryfikacji */}
        <AnimatePresence>
          {showVerification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowVerification(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Weryfikacja
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Podaj telefon i adres użyte podczas zgłoszenia, aby zobaczyć swoje zlecenia.
                </p>

                <form onSubmit={handleVerification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numer telefonu *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={verificationData.phone}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123-456-789"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres *
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={verificationData.address}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ul. Krakowska 17, Tarnów"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Podaj ten sam adres, który był w zgłoszeniu
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowVerification(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {verifying ? (
                        <>
                          <FiLoader className="animate-spin" />
                          Weryfikuję...
                        </>
                      ) : (
                        'Weryfikuj'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Masz limit 3 prób weryfikacji na godzinę
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
