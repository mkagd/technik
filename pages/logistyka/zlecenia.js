// pages/logistyka/zlecenia.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DarkModeToggle from '../../components/DarkModeToggle';
import { 
  FiArrowLeft, FiCalendar, FiUser, FiMapPin, FiClock, 
  FiCheckCircle, FiAlertCircle, FiFilter, FiSearch 
} from 'react-icons/fi';

export default function LogistykaZlecenia() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unassigned, assigned, completed
  const [logisticianId, setLogisticianId] = useState(null);

  useEffect(() => {
    loadLogistician();
    loadVisits();
    loadEmployees();
  }, []);

  const loadLogistician = () => {
    const data = localStorage.getItem('employeeSession') || localStorage.getItem('logistykEmployee');
    if (data) {
      try {
        const emp = JSON.parse(data);
        setLogisticianId(emp.id);
      } catch (e) {
        console.error('Error parsing employee data:', e);
      }
    }

    // Fallback
    if (!data) {
      setLogisticianId('EMP25189001');
    }
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visits');
      const data = await res.json();
      
      if (data.success && data.visits) {
        console.log('✅ Załadowano wizyt:', data.visits.length);
        setVisits(data.visits);
      } else {
        console.error('Failed to load visits:', data);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      
      if (data.success && data.employees) {
        const technicians = data.employees.filter(emp => 
          emp.role === 'Serwisant' || emp.role === 'serwisant'
        );
        console.log('✅ Załadowano serwisantów:', technicians.length);
        setEmployees(technicians);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAssign = async (visitId, employeeId) => {
    if (!employeeId) {
      alert('Wybierz serwisanta');
      return;
    }

    if (!confirm('Czy na pewno przypisać to zlecenie?')) return;

    setActionLoading(visitId);
    try {
      const res = await fetch('/api/visits/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: visitId,
          employeeId: employeeId,
          assignedBy: logisticianId,
          notes: 'Przypisane przez logistykę'
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Zlecenie przypisane!');
        loadVisits(); // Przeładuj listę
      } else {
        alert('❌ Błąd: ' + (data.error || 'Nie udało się przypisać'));
      }
    } catch (error) {
      console.error('Error assigning visit:', error);
      alert('❌ Błąd serwera');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrowanie
  const filteredVisits = visits
    .filter(visit => {
      const matchesSearch = 
        visit.visitId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.client?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.issueDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterStatus === 'unassigned') {
        return matchesSearch && (!visit.employeeId || visit.status === 'unassigned');
      } else if (filterStatus === 'assigned') {
        return matchesSearch && visit.employeeId && visit.status !== 'completed';
      } else if (filterStatus === 'completed') {
        return matchesSearch && visit.status === 'completed';
      }
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Statystyki
  const stats = {
    total: visits.length,
    unassigned: visits.filter(v => !v.employeeId || v.status === 'unassigned').length,
    assigned: visits.filter(v => v.employeeId && v.status !== 'completed' && v.status !== 'unassigned').length,
    completed: visits.filter(v => v.status === 'completed').length
  };

  const getStatusBadge = (visit) => {
    if (visit.status === 'completed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Zakończona</span>;
    } else if (visit.employeeId && visit.status !== 'unassigned') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Przypisana</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Nieprzypisana</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Zarządzanie zleceniami</h1>
                <p className="text-sm text-gray-600 mt-1">Przydzielaj wizyty serwisantom</p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiCalendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.total}
            </div>
            <div className="text-sm text-gray-600">Wszystkie zlecenia</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.unassigned}
            </div>
            <div className="text-sm text-gray-600">Nieprzypisane</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiUser className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.assigned}
            </div>
            <div className="text-sm text-gray-600">W trakcie</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.completed}
            </div>
            <div className="text-sm text-gray-600">Zakończone</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po ID, kliencie, adresie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wszystkie ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'unassigned'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nieprzypisane ({stats.unassigned})
              </button>
              <button
                onClick={() => setFilterStatus('assigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                W trakcie ({stats.assigned})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Zakończone ({stats.completed})
              </button>
            </div>
          </div>
        </div>

        {/* Visits list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Ładowanie...</div>
          ) : filteredVisits.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Brak zleceń spełniających kryteria</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredVisits.map((visit) => {
                const employee = employees.find(e => e.id === visit.employeeId);
                
                return (
                  <div key={visit.visitId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {visit.visitId}
                              </h3>
                              {getStatusBadge(visit)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <FiUser className="h-4 w-4 mr-1" />
                                {visit.client?.name || 'Brak danych'}
                              </div>
                              <div className="flex items-center">
                                <FiMapPin className="h-4 w-4 mr-1" />
                                {visit.client?.address || 'Brak adresu'}
                              </div>
                              <div className="flex items-center">
                                <FiClock className="h-4 w-4 mr-1" />
                                {new Date(visit.createdAt).toLocaleDateString('pl-PL')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {visit.issueDescription && (
                          <p className="text-sm text-gray-700 mb-3">
                            <strong>Problem:</strong> {visit.issueDescription}
                          </p>
                        )}

                        {/* Current assignment */}
                        {employee && (
                          <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <FiUser className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-blue-800">
                              Przypisano: <strong>{employee.name}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assign section */}
                      {visit.status !== 'completed' && (
                        <div className="ml-6 flex flex-col space-y-2 w-64">
                          <select
                            id={`employee-${visit.visitId}`}
                            defaultValue={visit.employeeId || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={actionLoading === visit.visitId}
                          >
                            <option value="">Wybierz serwisanta</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById(`employee-${visit.visitId}`);
                              handleAssign(visit.visitId, select.value);
                            }}
                            disabled={actionLoading === visit.visitId}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                          >
                            {actionLoading === visit.visitId ? 'Przypisywanie...' : 'Przypisz'}
                          </button>
                          <Link
                            href={`/admin/wizyty/${visit.visitId}`}
                            className="text-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                          >
                            Szczegóły
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredVisits.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Wyświetlono <strong>{filteredVisits.length}</strong> z <strong>{visits.length}</strong> zleceń.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
