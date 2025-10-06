import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { statusToUI } from '../../utils/fieldMapping';
import {
  FiPackage, FiClock, FiCheckCircle, FiXCircle, FiUser,
  FiMail, FiPhone, FiMapPin, FiLogOut, FiSettings,
  FiCalendar, FiTool, FiAlertCircle
} from 'react-icons/fi';

/**
 * Client Dashboard
 * Panel klienta z listą zleceń
 */
export default function ClientDashboard() {
  const router = useRouter();
  
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load client data
  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    const clientData = localStorage.getItem('clientData');

    if (!token || !clientData) {
      router.push('/client/login');
      return;
    }

    try {
      setClient(JSON.parse(clientData));
      loadOrders(JSON.parse(clientData).id);
    } catch (err) {
      console.error('Error loading client data:', err);
      router.push('/client/login');
    }
  }, []);

  // Load client orders
  const loadOrders = async (clientId) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await fetch(`/api/orders?clientId=${clientId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ FIXED: Pusta tablica to NIE błąd - nowy klient może nie mieć jeszcze zleceń
        setOrders(data.orders || []);
        console.log(`✅ Loaded ${data.orders?.length || 0} orders for client ${clientId}`);
      } else {
        // Błąd tylko gdy API zwróciło error, nie gdy brak zleceń
        setError(data.message || 'Nie udało się pobrać zleceń');
        console.error('❌ API error:', data);
      }
    } catch (err) {
      console.error('❌ Error loading orders:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    router.push('/client/login');
  };

  // Status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: statusToUI('pending'), color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      'in-progress': { label: statusToUI('in-progress'), color: 'bg-blue-100 text-blue-800', icon: FiTool },
      'completed': { label: statusToUI('completed'), color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      'cancelled': { label: statusToUI('cancelled'), color: 'bg-red-100 text-red-800', icon: FiXCircle },
      'scheduled': { label: statusToUI('scheduled'), color: 'bg-purple-100 text-purple-800', icon: FiCalendar }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="text-sm" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Panel Klienta - AGD Serwis</title>
        <meta name="description" content="Panel klienta" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiUser className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Panel Klienta</h1>
                  <p className="text-sm text-gray-600">{client.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/client/new-order">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                    <FiPackage />
                    Nowe zgłoszenie
                  </button>
                </Link>
                <Link href="/client/settings">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiSettings className="text-xl" />
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut />
                  <span>Wyloguj</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Client Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dane kontaktowe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium text-gray-900">{client.phone}</p>
                </div>
              </div>
              {client.address && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <FiMapPin className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">Adres</p>
                    <p className="font-medium text-gray-900">
                      {client.address.street} {client.address.buildingNumber}
                      {client.address.apartmentNumber && `/${client.address.apartmentNumber}`}, {client.address.postalCode} {client.address.city}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Orders Section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Moje zlecenia</h2>
            <span className="text-sm text-gray-600">
              Łącznie: <strong>{orders.length}</strong>
            </span>
          </div>

          {/* Orders List */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FiAlertCircle className="text-red-600 text-xl" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!error && orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
            >
              <FiPackage className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Brak zleceń</h3>
              <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych zleceń serwisowych.</p>
              <Link href="/client/new-order">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <FiPackage />
                  Złóż pierwsze zgłoszenie
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order, index) => (
                <Link key={order.id} href={`/client/order/${order.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {order.deviceType} {order.brand}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {order.id}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Model</p>
                      <p className="font-medium text-gray-900">{order.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Problem</p>
                      <p className="font-medium text-gray-900">{order.issueDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data utworzenia</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    {order.assignedToName && (
                      <div>
                        <p className="text-sm text-gray-600">Przydzielony technik</p>
                        <p className="font-medium text-gray-900">{order.assignedToName}</p>
                      </div>
                    )}
                  </div>

                  {order.estimatedCost && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Szacowany koszt</p>
                      <p className="text-xl font-bold text-blue-600">{order.estimatedCost} zł</p>
                    </div>
                  )}
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
