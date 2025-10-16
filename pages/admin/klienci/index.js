// pages/admin/klienci/index.js
// Lista klientów z filtrowaniem i wyszukiwaniem

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { getAvailabilityCategory } from '../../../utils/availabilityScore';
import GoogleGeocoder from '../../../geocoding/simple/GoogleGeocoder.js';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMail, FiMapPin, FiUser, FiDownload, FiRefreshCw, FiCalendar, FiHome,
  FiShield, FiLock, FiUnlock, FiUsers, FiActivity, FiTrendingUp,
  FiGrid, FiList, FiColumns, FiCheckSquare, FiSquare, FiPlusCircle, FiShoppingCart
} from 'react-icons/fi';

export default function AdminKlienci() {
  const router = useRouter();
  const toast = useToast();
  
  // 🌍 Geocoder reference
  const geocoder = useRef(null);
  
  const [klienci, setKlienci] = useState([]);
  const [filteredKlienci, setFilteredKlienci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  
  // ✅ NOWE: Widok listy (zapamiętany w localStorage)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clientsViewMode') || 'cards';
    }
    return 'cards';
  });
  
  // ✅ NOWE: Zaznaczanie wielu klientów
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // ✅ NOWE: Dodawanie zlecenia
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [clientForOrder, setClientForOrder] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    city: '',
    source: '',
    dateFrom: '',
    dateTo: '',
    accountStatus: '', // registered, guest, locked, company
    sortBy: 'date-desc' // date-desc, date-asc, name, city
  });

  useEffect(() => {
    loadKlienci();
  }, []);
  
  // 🌍 Inicjalizacja geocodera (Nominatim - nie wymaga API key!)
  useEffect(() => {
    const initGeocoder = async () => {
      try {
        geocoder.current = new GoogleGeocoder(); // Nominatim nie wymaga API key! 🎉
        console.log('🌍 Nominatim Geocoder zainicjalizowany (100% DARMOWY)');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji geocodera:', error);
      }
    };
    initGeocoder();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [klienci, filters]);

  const loadKlienci = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (response.ok) {
        // API może zwrócić tablicę lub obiekt z polem clients/data
        const klienciArray = Array.isArray(data) ? data : (data.clients || data.data || []);
        setKlienci(klienciArray);
      } else {
        console.error('Błąd pobierania klientów');
        setKlienci([]);
      }
    } catch (error) {
      console.error('Błąd:', error);
      setKlienci([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...klienci];

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(k => 
        k.name?.toLowerCase().includes(searchLower) ||
        k.email?.toLowerCase().includes(searchLower) ||
        k.phone?.includes(filters.search) ||
        k.city?.toLowerCase().includes(searchLower) ||
        k.clientId?.toLowerCase().includes(searchLower)
      );
    }

    // City
    if (filters.city) {
      filtered = filtered.filter(k => 
        k.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Source
    if (filters.source) {
      filtered = filtered.filter(k => k.source === filters.source);
    }

    // Account Status
    if (filters.accountStatus) {
      filtered = filtered.filter(k => {
        switch (filters.accountStatus) {
          case 'registered':
            return !!k.passwordHash;
          case 'guest':
            return !k.passwordHash;
          case 'locked':
            return k.isLocked === true;
          case 'company':
            return k.type === 'company' || k.clientType === 'company';
          default:
            return true;
        }
      });
    }

    // Date range
    if (filters.dateFrom) {
      filtered = filtered.filter(k => {
        const clientDate = k.createdAt || k.dateAdded;
        return clientDate >= filters.dateFrom;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(k => {
        const clientDate = k.createdAt || k.dateAdded;
        return clientDate <= filters.dateTo;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'date-desc':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'city':
          return (a.city || '').localeCompare(b.city || '');
        case 'availability-desc':
          return (b.physicalAvailability?.score || 0) - (a.physicalAvailability?.score || 0);
        case 'availability-asc':
          return (a.physicalAvailability?.score || 0) - (b.physicalAvailability?.score || 0);
        default:
          return 0;
      }
    });

    setFilteredKlienci(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      source: '',
      dateFrom: '',
      dateTo: '',
      accountStatus: '',
      sortBy: 'date-desc'
    });
  };

  const handleView = (id) => {
    router.push(`/admin/klienci/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadKlienci();
        setShowDeleteModal(false);
        setClientToDelete(null);
        toast.success('Klient został usunięty');
      } else {
        toast.error('Błąd podczas usuwania klienta');
      }
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };

  // ✅ NOWE: Zaznaczanie wszystkich
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredKlienci.map(k => k.clientId || k.id));
      setSelectedClients(allIds);
    } else {
      setSelectedClients(new Set());
    }
  };

  // ✅ NOWE: Zaznaczanie pojedynczego
  const handleSelectClient = (id) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClients(newSelected);
  };

  // ✅ NOWE: Usuwanie wielu
  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedClients).map(id =>
        fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      await loadKlienci();
      setSelectedClients(new Set());
      setShowBulkDeleteModal(false);
      toast.success(`Usunięto ${deletePromises.length} klientów`);
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd podczas usuwania klientów');
    }
  };

  // ✅ NOWE: Dodawanie zlecenia dla klienta
  const handleAddOrder = (klient) => {
    setClientForOrder(klient);
    setShowAddOrderModal(true);
  };

  // ✅ NOWE: Przekierowanie do tworzenia zlecenia
  const goToCreateOrder = () => {
    if (!clientForOrder) return;
    
    // Zapisz dane klienta w localStorage
    localStorage.setItem('prefilledClient', JSON.stringify({
      clientId: clientForOrder.clientId || clientForOrder.id,
      name: clientForOrder.name,
      phone: clientForOrder.phone || (clientForOrder.phones?.[0]?.number),
      email: clientForOrder.email,
      address: clientForOrder.address || (clientForOrder.addresses?.[0]),
      city: clientForOrder.city
    }));
    
    // Przekieruj do strony tworzenia zamówienia
    router.push('/admin/zamowienia/nowe');
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Imię', 'Email', 'Telefon', 'Miasto', 'Adres', 'Data dodania', 'Źródło'];
    const rows = filteredKlienci.map(k => [
      k.clientId || k.id,
      k.name,
      k.email,
      k.phone,
      k.city,
      k.address,
      k.createdAt || k.dateAdded,
      k.source
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klienci_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sources = [...new Set(klienci.map(k => k.source).filter(Boolean))];
  const cities = [...new Set(klienci.map(k => k.city).filter(Boolean))];

  // Statistics
  const stats = {
    total: klienci.length,
    registered: klienci.filter(k => k.passwordHash).length,
    guests: klienci.filter(k => !k.passwordHash).length,
    locked: klienci.filter(k => k.isLocked).length,
    activeLastMonth: klienci.filter(k => {
      if (!k.lastLogin) return false;
      const lastLogin = new Date(k.lastLogin);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return lastLogin >= monthAgo;
    }).length,
    newThisMonth: klienci.filter(k => {
      if (!k.createdAt) return false;
      const created = new Date(k.createdAt);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return created >= monthStart;
    }).length
  };

  return (
    <AdminLayout 
      title="Klienci"
      breadcrumbs={[
        { label: 'Klienci' }
      ]}
    >
      {/* Statistics Dashboard */}
      {klienci.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Wszyscy klienci</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUsers className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Zarejestrowani</p>
                <p className="text-2xl font-bold text-green-600">{stats.registered}</p>
                {stats.total > 0 && (
                  <p className="text-xs text-gray-400">{((stats.registered / stats.total) * 100).toFixed(0)}% bazy</p>
                )}
              </div>
              <FiShield className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Goście</p>
                <p className="text-2xl font-bold text-gray-600">{stats.guests}</p>
                {stats.total > 0 && (
                  <p className="text-xs text-gray-400">{((stats.guests / stats.total) * 100).toFixed(0)}% bazy</p>
                )}
              </div>
              <FiUser className="h-8 w-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Zablokowani</p>
                <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
                {stats.locked > 0 && (
                  <button 
                    onClick={() => setFilters({...filters, accountStatus: 'locked'})}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Zobacz →
                  </button>
                )}
              </div>
              <FiLock className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Aktywni (30 dni)</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeLastMonth}</p>
                <p className="text-xs text-gray-400">Zalogowani</p>
              </div>
              <FiActivity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nowi (miesiąc)</p>
                <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
                <p className="text-xs text-gray-400">Rejestracje</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
          <p className="text-gray-600 text-sm lg:text-base">
            Zarządzaj bazą klientów - przeglądaj historie wizyt i dane kontaktowe
          </p>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* ✅ Przełącznik widoku */}
            <div className="inline-flex rounded-lg border border-gray-300 bg-white">
              <button
                onClick={() => {
                  setViewMode('cards');
                  localStorage.setItem('clientsViewMode', 'cards');
                }}
                className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Widok kafelków"
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('clientsViewMode', 'list');
                }}
                className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Widok listy"
              >
                <FiList className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('table');
                  localStorage.setItem('clientsViewMode', 'table');
                }}
                className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-r-lg border-l border-gray-300 transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Widok tabeli"
              >
                <FiColumns className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={loadKlienci}
              className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <FiRefreshCw className="mr-1 lg:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Odśwież</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredKlienci.length === 0}
              className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FiDownload className="mr-1 lg:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Eksportuj CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>
        
        {/* ✅ Bulk actions bar */}
        {selectedClients.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Zaznaczono: <strong>{selectedClients.size}</strong> {selectedClients.size === 1 ? 'klient' : 'klientów'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedClients(new Set())}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
              >
                Odznacz wszystko
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Usuń zaznaczone
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj po imieniu, email, telefonie, ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filtry
            {showFilters ? <FiX className="ml-2 h-4 w-4" /> : null}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miasto
              </label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wszystkie</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Źródło
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wszystkie</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status konta
              </label>
              <select
                value={filters.accountStatus}
                onChange={(e) => setFilters({ ...filters, accountStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wszystkie statusy</option>
                <option value="registered">🔐 Zarejestrowany (ma hasło)</option>
                <option value="guest">👤 Gość (bez hasła)</option>
                <option value="locked">🔒 Zablokowany</option>
                <option value="company">🏢 Firma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data od
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sortuj według
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Najnowsi</option>
                <option value="date-asc">Najstarsi</option>
                <option value="name">Imię A-Z</option>
                <option value="city">Miasto A-Z</option>
                <option value="availability-desc">🏠 Dostępność (wysoka → niska)</option>
                <option value="availability-asc">⚠️ Dostępność (niska → wysoka)</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Wyczyść filtry
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {/* ✅ Checkbox "Zaznacz wszystko" */}
            {filteredKlienci.length > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectAll({ target: { checked: selectedClients.size !== filteredKlienci.length } });
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {selectedClients.size === filteredKlienci.length && filteredKlienci.length > 0 ? (
                  <FiCheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <FiSquare className="h-4 w-4" />
                )}
                <span>Zaznacz wszystko</span>
              </button>
            )}
            <div>
              Znaleziono: <span className="font-semibold">{filteredKlienci.length}</span> klientów
            </div>
          </div>
          <div>
            Całkowita baza: <span className="font-semibold text-blue-600">
              {klienci.length}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Klienci - różne widoki */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie klientów...</p>
        </div>
      ) : filteredKlienci.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak klientów</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.city ? 
              'Nie znaleziono klientów spełniających kryteria wyszukiwania.' :
              'Nie ma jeszcze żadnych klientów w bazie.'
            }
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKlienci.map((klient) => {
            const clientId = klient.clientId || klient.id;
            const isSelected = selectedClients.has(clientId);
            
            return (
            <div key={klient.id} className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-all ${
              isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                {/* ✅ Checkbox do zaznaczania */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleSelectClient(clientId)}
                    className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {isSelected ? (
                      <FiCheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FiSquare className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                  {/* Nazwa klienta lub firmy */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {klient.name}
                    </h3>
                    
                    {/* Status badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Typ konta - zarejestrowany/gość */}
                      {klient.passwordHash ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded inline-flex items-center">
                          🔐 Zarejestrowany
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded inline-flex items-center">
                          👤 Gość
                        </span>
                      )}
                      
                      {/* Blokada */}
                      {klient.isLocked && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded inline-flex items-center">
                          🔒 Zablokowany
                        </span>
                      )}
                      
                      {/* Firma */}
                      {(klient.clientType === 'company' || klient.type === 'company') && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded inline-flex items-center">
                          🏢 Firma
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Dane firmy */}
                  {klient.companyData && (
                    <div className="mt-1 mb-2 text-sm">
                      <div className="font-medium text-gray-700">
                        {klient.companyData.name}
                      </div>
                      {klient.companyData.nip && (
                        <div className="text-xs text-gray-500">
                          NIP: {klient.companyData.nip}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    ID: {klient.clientId || klient.id}
                  </span>
                </div>
              </div>
              </div>

              <div className="space-y-2 mb-4">
                {/* Telefony - pokazuje wszystkie */}
                {klient.phones && klient.phones.length > 0 ? (
                  klient.phones.map((phone, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <FiPhone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="flex-1">{phone.number}</span>
                      {phone.isPrimary && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Główny</span>
                      )}
                      {phone.label && !phone.isPrimary && (
                        <span className="ml-2 text-xs text-gray-400">({phone.label})</span>
                      )}
                    </div>
                  ))
                ) : klient.phone ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiPhone className="h-4 w-4 mr-2 text-gray-400" />
                    {klient.phone}
                  </div>
                ) : null}

                {/* Email */}
                {klient.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMail className="h-4 w-4 mr-2 text-gray-400" />
                    {klient.email}
                  </div>
                )}

                {/* Adresy - pokazuje wszystkie */}
                {klient.addresses && klient.addresses.length > 0 ? (
                  klient.addresses.map((address, idx) => (
                    <div key={idx} className="flex items-start text-sm text-gray-600">
                      <FiMapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div>{address.street}</div>
                        <div className="text-xs text-gray-500">
                          {address.postalCode} {address.city}
                        </div>
                        {address.isPrimary && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Główny</span>
                        )}
                        {address.label && !address.isPrimary && (
                          <span className="inline-block mt-1 text-xs text-gray-400">({address.label})</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : klient.city ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {klient.city}
                  </div>
                ) : null}

                {/* Data dodania */}
                {klient.createdAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(klient.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {/* Typ klienta */}
                {klient.clientType && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    klient.clientType === 'company' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {klient.clientType === 'company' ? '🏢 Firma' : '👤 Prywatny'}
                  </span>
                )}

                {/* Źródło */}
                {klient.source && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {klient.source}
                  </span>
                )}
                
                {/* Score dostępności */}
                {klient.physicalAvailability && klient.physicalAvailability.score !== undefined && (() => {
                  const category = getAvailabilityCategory(klient.physicalAvailability.score);
                  return (
                    <span 
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${category.badgeClass}`}
                      title={`Dostępność: ${category.label} (${klient.physicalAvailability.score}/100)`}
                    >
                      <span>{category.emoji}</span>
                      <span>{klient.physicalAvailability.score}</span>
                    </span>
                  );
                })()}

                {/* Status */}
                {klient.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    klient.status === 'active' ? 'bg-green-100 text-green-800' :
                    klient.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {klient.status === 'active' ? '✓ Aktywny' :
                     klient.status === 'inactive' ? '○ Nieaktywny' :
                     klient.status}
                  </span>
                )}

                {/* Ilość telefonów/adresów */}
                {klient.phones && klient.phones.length > 1 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    📞 {klient.phones.length} tel.
                  </span>
                )}
                {klient.addresses && klient.addresses.length > 1 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    📍 {klient.addresses.length} adr.
                  </span>
                )}
              </div>

              {/* ✅ Akcje z przyciskiem "Dodaj zlecenie" */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(clientId)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <FiEye className="mr-1.5 h-4 w-4" />
                    Zobacz
                  </button>
                  <button
                    onClick={() => handleView(clientId)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <FiEdit className="mr-1.5 h-4 w-4" />
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      setClientToDelete(klient);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* ✅ NOWY: Przycisk "Dodaj zlecenie" */}
                <button
                  onClick={() => handleAddOrder(klient)}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <FiPlusCircle className="mr-2 h-4 w-4" />
                  Dodaj zlecenie dla klienta
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* ✅ Widok LISTA - kompaktowy */
        <div className="space-y-3">
          {filteredKlienci.map((klient) => {
            const clientId = klient.clientId || klient.id;
            const isSelected = selectedClients.has(clientId);
            
            return (
              <div 
                key={klient.id} 
                className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleSelectClient(clientId)}
                    className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                  >
                    {isSelected ? (
                      <FiCheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FiSquare className="h-5 w-5" />
                    )}
                  </button>

                  {/* Dane klienta */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Nazwa i ID */}
                    <div>
                      <h3 className="font-semibold text-gray-900">{klient.name}</h3>
                      <p className="text-xs text-gray-500">ID: {clientId}</p>
                      {klient.passwordHash && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          🔐
                        </span>
                      )}
                    </div>

                    {/* Kontakt */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiPhone className="h-3 w-3" />
                        <span>{klient.phone || klient.phones?.[0]?.number || '-'}</span>
                      </div>
                      {klient.email && (
                        <div className="flex items-center gap-1 mt-1">
                          <FiMail className="h-3 w-3" />
                          <span className="truncate">{klient.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Lokalizacja */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="h-3 w-3" />
                        <span>{klient.city || klient.addresses?.[0]?.city || '-'}</span>
                      </div>
                      {klient.source && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {klient.source}
                        </span>
                      )}
                    </div>

                    {/* Akcje */}
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleAddOrder(klient)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Dodaj zlecenie"
                      >
                        <FiPlusCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleView(clientId)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Zobacz szczegóły"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleView(clientId)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edytuj"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setClientToDelete(klient);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Usuń"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* ✅ Widok TABELA */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectAll({ target: { checked: selectedClients.size !== filteredKlienci.length } });
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedClients.size === filteredKlienci.length && filteredKlienci.length > 0 ? (
                        <FiCheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FiSquare className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokalizacja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data dodania
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKlienci.map((klient) => {
                  const clientId = klient.clientId || klient.id;
                  const isSelected = selectedClients.has(clientId);
                  
                  return (
                    <tr 
                      key={klient.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleSelectClient(clientId)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {isSelected ? (
                            <FiCheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FiSquare className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{klient.name}</div>
                            <div className="text-xs text-gray-500">ID: {clientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {klient.phone || klient.phones?.[0]?.number || '-'}
                        </div>
                        {klient.email && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {klient.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {klient.city || klient.addresses?.[0]?.city || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {klient.passwordHash ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Zarejestrowany
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              Gość
                            </span>
                          )}
                          {klient.isLocked && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Zablokowany
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {klient.createdAt ? new Date(klient.createdAt).toLocaleDateString('pl-PL') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAddOrder(klient)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Dodaj zlecenie"
                          >
                            <FiPlusCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleView(clientId)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Zobacz"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleView(clientId)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Edytuj"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setClientToDelete(klient);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Usuń"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Delete Single Modal */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Potwierdź usunięcie
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Czy na pewno chcesz usunąć klienta <span className="font-semibold">{clientToDelete.name}</span>? 
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(clientToDelete.clientId || clientToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Usuń Klienta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Potwierdź usunięcie wielu klientów
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Czy na pewno chcesz usunąć <span className="font-semibold">{selectedClients.size}</span> {selectedClients.size === 1 ? 'klienta' : 'klientów'}? 
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Usuń {selectedClients.size} klientów
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Add Order Modal */}
      {showAddOrderModal && clientForOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dodaj zlecenie dla klienta
            </h3>
            <div className="mb-6">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FiUser className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">{clientForOrder.name}</div>
                  <div className="text-sm text-gray-600">{clientForOrder.phone || clientForOrder.email}</div>
                  <div className="text-xs text-gray-500">{clientForOrder.city}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Zostaniesz przekierowany do formularza tworzenia zamówienia. Dane klienta zostaną automatycznie wypełnione.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddOrderModal(false);
                  setClientForOrder(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={goToCreateOrder}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors inline-flex items-center"
              >
                <FiPlusCircle className="mr-2 h-4 w-4" />
                Utwórz zlecenie
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
