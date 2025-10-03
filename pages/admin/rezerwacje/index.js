// pages/admin/rezerwacje/index.js
// Lista rezerwacji z filtrowaniem i wyszukiwaniem

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMail, FiMapPin, FiClock, FiCalendar, FiDownload, FiRefreshCw, FiPlus
} from 'react-icons/fi';

export default function AdminRezerwacje() {
  const router = useRouter();
  
  const [rezerwacje, setRezerwacje] = useState([]);
  const [filteredRezerwacje, setFilteredRezerwacje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    sortBy: 'date-desc' // date-desc, date-asc, name, status
  });

  // Statusy rezerwacji
  const bookingStatuses = [
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

  const categories = [
    'Pralki', 'Lodówki', 'Zmywarki', 'Piekarniki', 'Kuchenki', 
    'Płyty indukcyjne', 'Suszarki', 'Inne'
  ];

  useEffect(() => {
    loadRezerwacje();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rezerwacje, filters]);

  const loadRezerwacje = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rezerwacje');
      const data = await response.json();
      
      if (response.ok) {
        // API może zwrócić tablicę lub obiekt z polem rezerwacje/data
        const rezerwacjeArray = Array.isArray(data) ? data : (data.rezerwacje || data.data || []);
        setRezerwacje(rezerwacjeArray);
      } else {
        console.error('Błąd pobierania rezerwacji');
        setRezerwacje([]);
      }
    } catch (error) {
      console.error('Błąd:', error);
      setRezerwacje([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rezerwacje];

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(searchLower) ||
        r.email?.toLowerCase().includes(searchLower) ||
        r.phone?.includes(filters.search) ||
        r.city?.toLowerCase().includes(searchLower)
      );
    }

    // Date range
    if (filters.dateFrom) {
      filtered = filtered.filter(r => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => r.date <= filters.dateTo);
    }

    // Category
    if (filters.category) {
      filtered = filtered.filter(r => 
        r.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Status
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          return (a.date || '').localeCompare(b.date || '');
        case 'date-desc':
          return (b.date || '').localeCompare(a.date || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredRezerwacje(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      category: '',
      status: '',
      sortBy: 'date-desc'
    });
  };

  const handleView = (id) => {
    router.push(`/admin/rezerwacje/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/rezerwacje/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRezerwacje();
        setShowDeleteModal(false);
        setBookingToDelete(null);
      } else {
        alert('Błąd podczas usuwania rezerwacji');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd połączenia z serwerem');
    }
  };

  const getStatusInfo = (status) => {
    return bookingStatuses.find(s => s.value === status) || bookingStatuses[0];
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Data', 'Imię', 'Email', 'Telefon', 'Miasto', 'Kategoria', 'Status'];
    const rows = filteredRezerwacje.map(r => [
      r.id,
      r.date,
      r.name,
      r.email,
      r.phone,
      r.city,
      r.category,
      r.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rezerwacje_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout 
      title="Rezerwacje"
      breadcrumbs={[
        { label: 'Rezerwacje' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          Zarządzaj rezerwacjami klientów - przeglądaj, edytuj i aktualizuj statusy
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/rezerwacje/nowa')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiCalendar className="mr-2 h-4 w-4" />
            + Nowa rezerwacja
          </button>
          <button
            onClick={loadRezerwacje}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Odśwież
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredRezerwacje.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Eksportuj CSV
          </button>
        </div>
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
                placeholder="Szukaj po imieniu, email, telefonie lub mieście..."
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
                Data do
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wszystkie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wszystkie</option>
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
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
          <div>
            Znaleziono: <span className="font-semibold">{filteredRezerwacje.length}</span> rezerwacji
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Oczekujące: <span className="font-semibold text-yellow-600">
                {rezerwacje.filter(r => r.status === 'pending').length}
              </span>
            </span>
            <span>
              Dzisiaj: <span className="font-semibold text-blue-600">
                {rezerwacje.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Rezerwacje Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie rezerwacji...</p>
        </div>
      ) : filteredRezerwacje.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak rezerwacji</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.category ? 
              'Nie znaleziono rezerwacji spełniających kryteria wyszukiwania.' :
              'Nie ma jeszcze żadnych rezerwacji.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRezerwacje.map((rezerwacja) => {
                  const statusInfo = getStatusInfo(rezerwacja.status);
                  return (
                    <tr key={rezerwacja.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(rezerwacja.date).toLocaleDateString('pl-PL')}
                            </div>
                            {rezerwacja.time && (
                              <div className="text-xs text-gray-500">
                                {rezerwacja.time}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rezerwacja.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          {rezerwacja.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                          {rezerwacja.phone}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <FiMail className="h-3 w-3 text-gray-400 mr-2" />
                          {rezerwacja.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {rezerwacja.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <span className="mr-1">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(rezerwacja.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Zobacz szczegóły"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleView(rezerwacja.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Edytuj"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setBookingToDelete(rezerwacja);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
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
      )}

      {/* Delete Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Potwierdź usunięcie
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Czy na pewno chcesz usunąć rezerwację <span className="font-semibold">{bookingToDelete.name}</span> z dnia {new Date(bookingToDelete.date).toLocaleDateString('pl-PL')}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookingToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(bookingToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Usuń Rezerwację
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
