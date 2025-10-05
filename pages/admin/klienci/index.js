// pages/admin/klienci/index.js
// Lista klientów z filtrowaniem i wyszukiwaniem

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { getAvailabilityCategory } from '../../../utils/availabilityScore';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMail, FiMapPin, FiUser, FiDownload, FiRefreshCw, FiCalendar, FiHome
} from 'react-icons/fi';

export default function AdminKlienci() {
  const router = useRouter();
  const toast = useToast();
  
  const [klienci, setKlienci] = useState([]);
  const [filteredKlienci, setFilteredKlienci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    city: '',
    source: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc' // date-desc, date-asc, name, city
  });

  useEffect(() => {
    loadKlienci();
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

  return (
    <AdminLayout 
      title="Klienci"
      breadcrumbs={[
        { label: 'Klienci' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          Zarządzaj bazą klientów - przeglądaj historie wizyt i dane kontaktowe
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadKlienci}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Odśwież
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredKlienci.length === 0}
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
          <div>
            Znaleziono: <span className="font-semibold">{filteredKlienci.length}</span> klientów
          </div>
          <div>
            Całkowita baza: <span className="font-semibold text-blue-600">
              {klienci.length}
            </span>
          </div>
        </div>
      </div>

      {/* Klienci Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKlienci.map((klient) => (
            <div key={klient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Nazwa klienta lub firmy */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {klient.name}
                    </h3>
                    {klient.clientType === 'company' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Firma
                      </span>
                    )}
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

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleView(klient.clientId || klient.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <FiEye className="mr-1.5 h-4 w-4" />
                  Zobacz
                </button>
                <button
                  onClick={() => handleView(klient.clientId || klient.id)}
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
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
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
    </AdminLayout>
  );
}
