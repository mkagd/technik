// pages/admin/rezerwacje/index.js
// Lista rezerwacji z filtrowaniem i wyszukiwaniem

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';
import { statusToUI, statusToBackend } from '../../../utils/fieldMapping';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '../../../utils/orderStatusConstants';
import { 
  FiEye, FiTrash2, FiEdit, FiSearch, FiFilter, FiX, FiPhone, 
  FiMail, FiMapPin, FiClock, FiCalendar, FiDownload, FiRefreshCw, FiPlus,
  FiChevronUp, FiChevronDown, FiCheck, FiPhoneCall, FiFileText,
  FiGrid, FiList, FiColumns, FiCheckSquare, FiSquare
} from 'react-icons/fi';

export default function AdminRezerwacje() {
  const router = useRouter();
  const toast = useToast();
  
  const [rezerwacje, setRezerwacje] = useState([]);
  const [filteredRezerwacje, setFilteredRezerwacje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // ✅ NOWE: Tryby widoku
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reservationsViewMode') || 'table';
    }
    return 'table';
  });
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    sortBy: 'date-desc' // date-desc, date-asc, name, status
  });

  // Statusy z centralnego pliku orderStatusConstants.js
  const bookingStatuses = Object.keys(STATUS_LABELS).map(statusKey => ({
    value: statusKey,
    label: STATUS_LABELS[statusKey],
    color: STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800',
    icon: STATUS_ICONS[statusKey] || '�'
  }));

  const categories = [
    'Pralki', 'Lodówki', 'Zmywarki', 'Piekarniki', 'Kuchenki', 
    'Płyty indukcyjne', 'Suszarki', 'Inne'
  ];

  useEffect(() => {
    loadRezerwacje();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rezerwacje, filters, sortField, sortDirection]);

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

    // 🆕 WORKFLOW: Rezerwacje domyślnie pokazują tylko status 'pending' (oczekuje na kontakt)
    // '' (pusty) = domyślnie pending
    // '__all__' = wszystkie statusy
    // konkretny status = tylko ten status
    if (filters.status === '__all__') {
      // Pokazuj wszystkie statusy - nie filtruj
    } else if (filters.status) {
      // User wybrał konkretny status - pokaż tylko ten
      filtered = filtered.filter(r => r.status === filters.status);
    } else {
      // Brak wyboru = domyślnie tylko pending (nowe zgłoszenia czekające na kontakt)
      filtered = filtered.filter(r => r.status === 'pending');
    }

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

    // Sort by selected field and direction
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Specjalne traktowanie dla pól z datami
      if (sortField === 'created_at' || sortField === 'date' || sortField === 'createdAt') {
        const aDate = new Date(aVal || 0).getTime();
        const bDate = new Date(bVal || 0).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredRezerwacje(filtered);
    setCurrentPage(1); // Reset do pierwszej strony po zmianie filtrów
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction jeśli to samo pole
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nowe pole, domyślnie desc
      setSortField(field);
      setSortDirection('desc');
    }
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

  const handleStatusChange = async (rezerwacjaId, newStatus) => {
    try {
      const rezerwacja = rezerwacje.find(r => r.id === rezerwacjaId);
      if (!rezerwacja) return;

      // ✅ Użyj ID w URL zamiast w body (Next.js routing)
      const response = await fetch(`/api/rezerwacje/${rezerwacjaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          orderId: rezerwacja.orderId,
          orderNumber: rezerwacja.orderNumber,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // 🎯 NATYCHMIAST usuń z UI jeśli zmiana statusu na 'contacted'
        if (newStatus === 'contacted') {
          setRezerwacje(prev => prev.filter(r => r.id !== rezerwacjaId));
          console.log('✅ Rezerwacja usunięta z listy (status -> contacted)');
        }
        
        // Odśwież dane z serwera
        await loadRezerwacje();
        
        // 🔧 Odśwież badge natychmiast po zmianie statusu
        console.log('🔄 Calling refreshAdminBadges...');
        if (typeof window !== 'undefined' && window.refreshAdminBadges) {
          console.log('✅ refreshAdminBadges exists, calling...');
          await window.refreshAdminBadges();
          console.log('✅ refreshAdminBadges completed');
        } else {
          console.log('❌ refreshAdminBadges NOT found!');
        }
        
        toast.success('Status rezerwacji został zaktualizowany');
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
      const response = await fetch(`/api/rezerwacje/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRezerwacje();
        setShowDeleteModal(false);
        setBookingToDelete(null);
        toast.success('Rezerwacja została usunięta');
      } else {
        toast.error('Błąd podczas usuwania rezerwacji');
      }
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd połączenia z serwerem');
    }
  };



  // Nowa funkcja: Dodaj zlecenie (zmień status na contacted)
  const handleCreateOrder = async (rezerwacjaId) => {
    try {
      await handleStatusChange(rezerwacjaId, 'contacted');
      
      // Toast - drugi parametr to duration w ms
      toast.success('✅ Zlecenie utworzone! Przechodzę do zleceń...', 4000);
      
      setTimeout(() => {
        router.push('/admin/zamowienia');
      }, 1500);
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd podczas tworzenia zlecenia');
    }
  };

  // Nowa funkcja: Umów wizytę (zmień status na scheduled)
  const handleScheduleVisit = async (rezerwacjaId) => {
    try {
      await handleStatusChange(rezerwacjaId, 'scheduled');
      toast.success('📅 Wizyta umówiona! Status zmieniony na "Umówiona wizyta"', 4000);
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd podczas umawiania wizyty');
    }
  };

  const getStatusInfo = (status) => {
    return bookingStatuses.find(s => s.value === status) || bookingStatuses[0];
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRezerwacje.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRezerwacje.map(r => r.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    // ✅ Usunięto window.confirm - modal zajmuje się potwierdzeniem
    try {
      const count = selectedIds.length;
      const deletePromises = selectedIds.map(id => 
        fetch(`/api/rezerwacje/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      await loadRezerwacje();
      setSelectedIds([]);
      toast.success(`Usunięto ${count} rezerwacji`);
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd podczas usuwania rezerwacji');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      const updatePromises = selectedIds.map(id => {
        const rezerwacja = rezerwacje.find(r => r.id === id);
        return fetch('/api/rezerwacje', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: newStatus,
            orderId: rezerwacja?.orderId,
            orderNumber: rezerwacja?.orderNumber,
            updatedAt: new Date().toISOString()
          })
        });
      });

      await Promise.all(updatePromises);
      await loadRezerwacje();
      setSelectedIds([]);
      toast.success(`Zaktualizowano status ${selectedIds.length} rezerwacji`);
    } catch (error) {
      console.error('Błąd:', error);
      toast.error('Błąd podczas aktualizacji statusów');
    }
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

  // Paginacja
  const totalPages = Math.ceil(filteredRezerwacje.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredRezerwacje.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <AdminLayout 
      title="Rezerwacje"
      breadcrumbs={[
        { label: 'Rezerwacje' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <p className="text-gray-600 text-sm lg:text-base">
          Zarządzaj rezerwacjami klientów - przeglądaj, edytuj i aktualizuj statusy
        </p>
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {/* ✅ Przełącznik widoku */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              onClick={() => {
                setViewMode('cards');
                localStorage.setItem('reservationsViewMode', 'cards');
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
                localStorage.setItem('reservationsViewMode', 'list');
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
                localStorage.setItem('reservationsViewMode', 'table');
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
            onClick={() => router.push('/admin/rezerwacje/nowa')}
            className="inline-flex items-center px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <FiCalendar className="mr-1 lg:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">+ Nowa rezerwacja</span>
            <span className="sm:hidden">+ Nowa</span>
          </button>
          <button
            onClick={loadRezerwacje}
            className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <FiRefreshCw className="mr-1 lg:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Odśwież</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredRezerwacje.length === 0}
            className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <FiDownload className="mr-1 lg:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Eksportuj CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* Workflow Info Banner */}
      {filters.status === '' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800">
                <strong>💡 Workflow:</strong> Pokazujesz tylko nowe zgłoszenia ze statusem <strong>"Oczekuje na kontakt"</strong>. 
                Po kliknięciu <strong>"Dodaj zlecenie"</strong> status zmieni się na "Skontaktowano się" i zlecenie przejdzie do widoku Zamówień.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Bug Fix Banner - show ONLY on default view (pending only) if there are "contacted" reservations without orderId */}
      {filters.status === '' && rezerwacje.filter(r => r.status === 'contacted' && !r.orderId && !r.orderNumber).length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-yellow-900">
                  ⚠️ Znaleziono {rezerwacje.filter(r => r.status === 'contacted' && !r.orderId && !r.orderNumber).length} rezerwacji do naprawy
                </h3>
                <p className="mt-1 text-sm text-yellow-800">
                  Te rezerwacje mają status "Skontaktowano się", ale nie zostały przekonwertowane na zlecenia.
                  Kliknij przycisk poniżej, aby automatycznie naprawić konwersję.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!confirm('Czy chcesz naprawić wszystkie uszkodzone rezerwacje?\n\nZostanie utworzonych ' + rezerwacje.filter(r => r.status === 'contacted' && !r.orderId && !r.orderNumber).length + ' zleceń.')) {
                  return;
                }
                
                try {
                  const response = await fetch('/api/rezerwacje/fix-conversions', { method: 'POST' });
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success(`✅ Naprawiono ${result.summary.fixed} rezerwacji!`);
                    await loadRezerwacje();
                  } else {
                    toast.error('Błąd podczas naprawy: ' + result.message);
                  }
                } catch (error) {
                  console.error('Error fixing conversions:', error);
                  toast.error('Błąd połączenia z serwerem');
                }
              }}
              className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap"
            >
              🔧 Napraw wszystkie
            </button>
          </div>
        </div>
      )}

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
                <option value="">⏳ Tylko oczekujące (pending)</option>
                <option value="__all__">📋 Wszystkie statusy</option>
                <option disabled>──────────</option>
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
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
          <div className="flex items-center gap-4">
            <span>
              Znaleziono: <span className="font-semibold">{filteredRezerwacje.length}</span> rezerwacji
            </span>
            {selectedIds.length > 0 && (
              <span className="text-blue-600 font-semibold">
                • Zaznaczono: {selectedIds.length}
              </span>
            )}
            {/* ✅ POPRAWIONY: Zaznacz wszystko (używa starego toggleSelectAll) */}
            {filteredRezerwacje.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                {selectedIds.length === filteredRezerwacje.length && filteredRezerwacje.length > 0 ? (
                  <FiCheckSquare className="h-4 w-4" />
                ) : (
                  <FiSquare className="h-4 w-4" />
                )}
                Zaznacz wszystko
              </button>
            )}
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

      {/* ✅ POPRAWIONY: Bulk Actions Bar (używa starego selectedIds) */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCheckSquare className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                🎯 Nowy panel: Zaznaczono {selectedIds.length} {selectedIds.length === 1 ? 'rezerwację' : 'rezerwacji'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-sm text-orange-700 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
              >
                Odznacz wszystko
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
                Usuń zaznaczone
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredRezerwacje.length && filteredRezerwacje.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data dodania</span>
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data wizyty</span>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Klient</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Kategoria</span>
                      {sortField === 'category' && (
                        sortDirection === 'asc' ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageData.map((rezerwacja) => {
                  const statusInfo = getStatusInfo(rezerwacja.status);
                  const isSelected = selectedIds.includes(rezerwacja.id);
                  return (
                    <tr key={rezerwacja.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(rezerwacja.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(rezerwacja.created_at || rezerwacja.createdAt || rezerwacja.dateAdded || Date.now()).toLocaleDateString('pl-PL')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(rezerwacja.created_at || rezerwacja.createdAt || rezerwacja.dateAdded || Date.now()).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            {/* Sprawdź czy to zakres dat czy pojedyncza data */}
                            {(rezerwacja.dateMode === 'range' || rezerwacja.isFlexibleDate || (rezerwacja.dateRange?.from && rezerwacja.dateRange?.to)) ? (
                              <>
                                <div className="text-sm font-medium text-blue-700">
                                  📅 Elastyczny zakres
                                </div>
                                <div className="text-xs text-gray-600">
                                  {new Date(rezerwacja.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                  {' → '}
                                  {new Date(rezerwacja.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                </div>
                                {rezerwacja.time && (
                                  <div className="text-xs text-gray-500">
                                    🕐 {rezerwacja.time}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {rezerwacja.date ? new Date(rezerwacja.date + 'T00:00:00').toLocaleDateString('pl-PL') : 'Nie ustalono'}
                                </div>
                                {rezerwacja.time && (
                                  <div className="text-xs text-gray-500">
                                    🕐 {rezerwacja.time}
                                  </div>
                                )}
                                {rezerwacja.availability && !rezerwacja.time && (
                                  <div className="text-xs text-gray-500">
                                    {rezerwacja.availability}
                                  </div>
                                )}
                              </>
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
                        <div className="relative inline-block">
                          <select
                            value={rezerwacja.status}
                            onChange={(e) => handleStatusChange(rezerwacja.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-3 py-1.5 pr-8 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all hover:shadow-md ${statusInfo.color}`}
                            style={{ 
                              appearance: 'none',
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.2em 1.2em'
                            }}
                            title="Kliknij aby zmienić status"
                          >
                            {bookingStatuses.map(status => (
                              <option key={status.value} value={status.value}>
                                {status.icon} {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Szybkie akcje według statusu */}
                          {rezerwacja.status === 'pending' && (
                            <button
                              onClick={() => handleCreateOrder(rezerwacja.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                              title="Utwórz zlecenie (zmień status na 'Skontaktowano się')"
                            >
                              <FiFileText className="inline h-4 w-4 mr-1" />
                              Dodaj zlecenie
                            </button>
                          )}
                          
                          {rezerwacja.status === 'contacted' && (
                            <button
                              onClick={() => handleScheduleVisit(rezerwacja.id)}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-medium"
                              title="Umów wizytę (zmień status na 'Umówiona wizyta')"
                            >
                              <FiCalendar className="inline h-4 w-4 mr-1" />
                              Umów wizytę
                            </button>
                          )}

                          {/* Telefon - call link */}
                          <a
                            href={`tel:${rezerwacja.phone || rezerwacja.clientPhone}`}
                            className="text-green-600 hover:text-green-900"
                            title="Zadzwoń"
                          >
                            <FiPhoneCall className="h-5 w-5" />
                          </a>

                          {/* Adres - mapa */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rezerwacja.address || rezerwacja.clientAddress || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900"
                            title="Zobacz na mapie"
                          >
                            <FiMapPin className="h-5 w-5" />
                          </a>

                          {/* Standardowe akcje */}
                          <button
                            onClick={() => handleView(rezerwacja.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Zobacz szczegóły"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleView(rezerwacja.id)}
                            className="text-gray-600 hover:text-gray-900"
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

          {/* Paginacja */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Strona {currentPage} z {totalPages} • Pokazano {startIndex + 1}-{Math.min(endIndex, filteredRezerwacje.length)} z {filteredRezerwacje.length}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                
                {/* Numery stron */}
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Pokaż tylko niektóre strony jeśli jest ich dużo
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Bulk Delete Modal (używa starego handleBulkDelete) */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Potwierdź usunięcie rezerwacji
                </h3>
                <p className="text-sm text-gray-600">
                  Czy na pewno chcesz usunąć <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'rezerwację' : 'rezerwacji'}? 
                  Ta operacja jest <strong>nieodwracalna</strong>.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  handleBulkDelete();
                  setShowBulkDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiTrash2 className="inline-block mr-1.5 h-4 w-4" />
                Usuń {selectedIds.length} {selectedIds.length === 1 ? 'rezerwację' : 'rezerwacji'}
              </button>
            </div>
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
