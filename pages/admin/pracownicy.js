// pages/admin/pracownicy.js
// 🚀 NOWY PANEL ZARZĄDZANIA PRACOWNIKAMI
// Kompletny system zarządzania pracownikami z edycją wszystkich pól

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter, FiX, FiUser, FiPhone, 
  FiMail, FiMapPin, FiClock, FiStar, FiBriefcase, FiCheckCircle, FiXCircle 
} from 'react-icons/fi';

export default function AdminPracownicy() {
  const router = useRouter();
  
  // States
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    isActive: 'all',
    sortBy: 'name' // name, rating, completedJobs, dateAdded
  });

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [employees, filters]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        setEmployees(data.employees || []);
        console.log('✅ Załadowano pracowników:', data.employees?.length);
      } else {
        console.error('❌ Błąd pobierania pracowników');
        showNotification('Błąd pobierania pracowników', 'error');
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      showNotification('Błąd połączenia z serwerem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search filter (name, email, phone)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.phone?.includes(filters.search)
      );
    }

    // Specialization filter
    if (filters.specialization) {
      filtered = filtered.filter(emp => 
        emp.specializations?.some(spec => 
          spec.toLowerCase().includes(filters.specialization.toLowerCase())
        )
      );
    }

    // Active status filter
    if (filters.isActive !== 'all') {
      const isActiveValue = filters.isActive === 'active';
      filtered = filtered.filter(emp => emp.isActive === isActiveValue);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'completedJobs':
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        case 'dateAdded':
          return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
        default:
          return 0;
      }
    });

    setFilteredEmployees(filtered);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Pracownik usunięty pomyślnie', 'success');
        loadEmployees();
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
      } else {
        showNotification('Błąd usuwania pracownika', 'error');
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      showNotification('Błąd połączenia z serwerem', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    // TODO: Replace with react-hot-toast
    alert(message);
  };

  const handleEdit = (id) => {
    router.push(`/admin/pracownicy/${id}`);
  };

  const handleAdd = () => {
    router.push('/admin/pracownicy/nowy');
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      isActive: 'all',
      sortBy: 'name'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Zarządzanie Pracownikami
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Zarządzaj pracownikami serwisu - edytuj dane, czasy napraw i specjalizacje
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Dodaj Pracownika
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj po imieniu, email lub telefonie..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters Button */}
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
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Wszyscy</option>
                  <option value="active">Aktywni</option>
                  <option value="inactive">Nieaktywni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specjalizacja
                </label>
                <input
                  type="text"
                  placeholder="np. Pralki, Lodówki..."
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
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
                  <option value="name">Imię i nazwisko</option>
                  <option value="rating">Ocena</option>
                  <option value="completedJobs">Liczba zleceń</option>
                  <option value="dateAdded">Data dodania</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Wyczyść filtry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Znaleziono: <span className="font-semibold">{filteredEmployees.length}</span> pracowników
          </div>
          <div>
            Aktywni: <span className="font-semibold text-green-600">
              {employees.filter(e => e.isActive).length}
            </span>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Ładowanie pracowników...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak pracowników</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.specialization ? 
                'Nie znaleziono pracowników spełniających kryteria wyszukiwania.' :
                'Rozpocznij od dodania pierwszego pracownika.'
              }
            </p>
            {!filters.search && !filters.specialization && (
              <div className="mt-6">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  Dodaj Pracownika
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {employee.name}
                        </h3>
                        {employee.isActive ? (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1 h-3 w-3" />
                            Aktywny
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <FiXCircle className="mr-1 h-3 w-3" />
                            Nieaktywny
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{employee.id}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-2">
                    {employee.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiPhone className="mr-2 h-4 w-4 text-gray-400" />
                        {employee.phone}
                      </div>
                    )}
                    {employee.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMail className="mr-2 h-4 w-4 text-gray-400" />
                        {employee.email}
                      </div>
                    )}
                    {employee.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="mr-2 h-4 w-4 text-gray-400" />
                        {employee.address}
                      </div>
                    )}
                    {employee.workingHours && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                        {employee.workingHours}
                      </div>
                    )}
                  </div>

                  {/* Specializations */}
                  {employee.specializations && employee.specializations.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        {employee.specializations.slice(0, 3).map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {spec}
                          </span>
                        ))}
                        {employee.specializations.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                            +{employee.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiStar className="mr-1 h-4 w-4 text-yellow-400" />
                        Ocena
                      </div>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {employee.rating || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiBriefcase className="mr-1 h-4 w-4 text-gray-400" />
                        Zlecenia
                      </div>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {employee.completedJobs || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(employee.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <FiEdit className="mr-1.5 h-4 w-4" />
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      setEmployeeToDelete(employee);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 className="mr-1.5 h-4 w-4" />
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Potwierdź usunięcie
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Czy na pewno chcesz usunąć pracownika <span className="font-semibold">{employeeToDelete.name}</span>? 
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(employeeToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Usuń Pracownika
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
