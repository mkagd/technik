// pages/admin/zamowienia/index.js
// Lista zamówień z filtrowaniem

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { statusToUI } from '../../../utils/fieldMapping';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMapPin, FiShoppingBag, FiDownload, FiRefreshCw, FiCalendar, FiTool, FiPlus
} from 'react-icons/fi';

export default function AdminZamowienia() {
  const router = useRouter();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc'
  });

  // Angielskie wartości w backend, polskie etykiety w UI
  // Statusy zgodne z rezerwacjami dla spójności systemu
  const orderStatuses = [
    { value: 'pending', label: 'Oczekuje na kontakt', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    { value: 'contacted', label: 'Skontaktowano się', color: 'bg-blue-100 text-blue-800', icon: '📞' },
    { value: 'scheduled', label: 'Umówiona wizyta', color: 'bg-purple-100 text-purple-800', icon: '📅' },
    { value: 'confirmed', label: 'Potwierdzona', color: 'bg-green-100 text-green-800', icon: '✅' },
    { value: 'in-progress', label: 'W trakcie realizacji', color: 'bg-indigo-100 text-indigo-800', icon: '🔧' },
    { value: 'waiting-parts', label: 'Oczekuje na części', color: 'bg-orange-100 text-orange-800', icon: '📦' },
    { value: 'ready', label: 'Gotowe do odbioru', color: 'bg-teal-100 text-teal-800', icon: '🎉' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800', icon: '✔️' },
    { value: 'cancelled', label: 'Anulowane', color: 'bg-red-100 text-red-800', icon: '❌' },
    { value: 'no-show', label: 'Nie stawił się', color: 'bg-gray-100 text-gray-800', icon: '👻' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('📞 Fetching orders from API...');
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      console.log('📦 API Response:', { 
        ok: response.ok, 
        status: response.status,
        dataType: Array.isArray(data) ? 'array' : 'object',
        hasOrders: !!data.orders,
        count: Array.isArray(data) ? data.length : (data.orders?.length || 0)
      });
      
      if (response.ok) {
        // API może zwrócić tablicę lub obiekt z polem orders/data
        const ordersArray = Array.isArray(data) ? data : (data.orders || data.data || []);
        console.log(`✅ Loaded ${ordersArray.length} orders`);
        console.log('📋 First order:', ordersArray[0]);
        setOrders(ordersArray);
      } else {
        console.error('❌ Błąd pobierania zamówień:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(o => 
        o.clientName?.toLowerCase().includes(searchLower) ||
        o.clientPhone?.includes(filters.search) ||
        o.orderNumber?.toLowerCase().includes(searchLower) ||
        o.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.deviceType) {
      filtered = filtered.filter(o => o.deviceType === filters.deviceType);
    }

    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(o => o.createdAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(o => o.createdAt <= filters.dateTo);
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          // Porównanie dat jako timestamp
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'date-desc':
          // Porównanie dat jako timestamp (od najnowszej)
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'client':
          return (a.clientName || '').localeCompare(b.clientName || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      deviceType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date-desc'
    });
  };

  const handleView = (id) => {
    router.push(`/admin/zamowienia/${id}`);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        await loadOrders();
        toast.success('Status zamówienia został zaktualizowany');
      } else {
        toast.error('Błąd podczas aktualizacji statusu');
      }
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadOrders();
        setShowDeleteModal(false);
        setOrderToDelete(null);
        toast.success('Zamówienie zostało usunięte');
      } else {
        toast.error('Błąd podczas usuwania zamówienia');
      }
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const deviceTypes = [...new Set(orders.map(o => o.deviceType).filter(Boolean))];

  return (
    <AdminLayout 
      title="Zamówienia"
      breadcrumbs={[
        { label: 'Zamówienia' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          Zarządzaj zamówieniami serwisowymi - przeglądaj, edytuj i aktualizuj statusy
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/zamowienia/nowe')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Nowe zlecenie
          </button>
          
          <button
            onClick={loadOrders}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Odśwież
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj po kliencie, telefonie, nr zamówienia..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filtry
            {showFilters ? <FiX className="ml-2 h-4 w-4" /> : null}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urządzenie</label>
              <select
                value={filters.deviceType}
                onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie</option>
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data od</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sortuj</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Najnowsze</option>
                <option value="date-asc">Najstarsze</option>
                <option value="client">Klient A-Z</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Wyczyść filtry
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Znaleziono: <span className="font-semibold">{filteredOrders.length}</span> zamówień
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Oczekuje: <span className="font-semibold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            </span>
            <span>
              W trakcie: <span className="font-semibold text-indigo-600">
                {orders.filter(o => o.status === 'in-progress').length}
              </span>
            </span>
            <span>
              Zakończone: <span className="font-semibold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie zamówień...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak zamówień</h3>
          <p className="mt-1 text-sm text-gray-500">Nie znaleziono zamówień spełniających kryteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{order.clientName}</h3>
                    <p className="text-xs text-gray-500">{order.orderNumber}</p>
                  </div>
                  <div className="relative inline-block">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      title="Kliknij aby zmienić status"
                    >
                      {orderStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.icon} {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiTool className="h-4 w-4 mr-2 text-gray-400" />
                    {order.deviceType}
                  </div>
                  <a 
                    href={`tel:${order.clientPhone}`}
                    className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                  >
                    <FiPhone className="h-4 w-4 mr-2 text-green-500" />
                    {order.clientPhone}
                  </a>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    <FiMapPin className="h-4 w-4 mr-2 text-purple-500" />
                    {order.city}
                  </a>
                  {order.createdAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="ml-2 text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {order.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{order.description}</p>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleView(order.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <FiEye className="mr-1.5 h-4 w-4" />
                    Zobacz
                  </button>
                  <button
                    onClick={() => handleView(order.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <FiEdit className="mr-1.5 h-4 w-4" />
                    Edytuj
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Potwierdź usunięcie</h3>
            <p className="text-sm text-gray-600 mb-6">
              Czy na pewno chcesz usunąć zamówienie <span className="font-semibold">{orderToDelete.orderNumber}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(orderToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
