// pages/admin/kalendarz.js
// Widok kalendarza z wizytami i planowaniem tras

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { statusToUI, getTechnicianId } from '../../utils/fieldMapping';
import { 
  FiCalendar, FiClock, FiMapPin, FiUser, FiFilter, 
  FiRefreshCw, FiDownload, FiPlus 
} from 'react-icons/fi';

export default function AdminKalendarz() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    thisWeek: 0,
    scheduled: 0,
    completed: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Pobierz zamówienia
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
        setOrders(ordersArray);
        
        // Oblicz statystyki
        calculateStats(ordersArray);
      }

      // Pobierz pracowników
      const employeesRes = await fetch('/api/employees');
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        const employeesArray = Array.isArray(employeesData) ? employeesData : (employeesData.employees || []);
        setEmployees(employeesArray);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    let totalVisits = 0;
    let thisWeek = 0;
    let scheduled = 0;
    let completed = 0;

    ordersData.forEach(order => {
      if (order.visits && Array.isArray(order.visits)) {
        totalVisits += order.visits.length;
        
        order.visits.forEach(visit => {
          const visitDate = new Date(visit.date || visit.scheduledDate);
          
          if (visitDate >= startOfWeek && visitDate < endOfWeek) {
            thisWeek++;
          }
          
          if (visit.status === 'scheduled' || visit.status === 'zaplanowana') {
            scheduled++;
          } else if (visit.status === 'completed' || visit.status === 'zakończona') {
            completed++;
          }
        });
      }
    });

    setStats({
      totalVisits,
      thisWeek,
      scheduled,
      completed
    });
  };

  const filteredOrders = selectedEmployee === 'all' 
    ? orders 
    : orders.filter(order => {
        if (order.assignedTo === selectedEmployee) return true;
        if (order.visits && Array.isArray(order.visits)) {
          return order.visits.some(v => v.employeeId === selectedEmployee);
        }
        return false;
      });

  return (
    <AdminLayout 
      title="Kalendarz wizyt" 
      breadcrumbs={[{ label: 'Kalendarz' }]}
    >
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wszystkie wizyty</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVisits}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ten tydzień</p>
              <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <FiClock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Zaplanowane</p>
              <p className="text-3xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FiMapPin className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Zakończone</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <FiUser className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Employee filter */}
            <div className="flex items-center space-x-2">
              <FiUser className="h-4 w-4 text-gray-500" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Wszyscy pracownicy</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Week selector */}
            <div className="flex items-center space-x-2">
              <FiCalendar className="h-4 w-4 text-gray-500" />
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Odśwież</span>
            </button>
            
            <button
              onClick={() => router.push('/admin/rezerwacje/nowa')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm"
            >
              <FiPlus className="h-4 w-4" />
              <span>Nowa wizyta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FiRefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Ładowanie kalendarza...</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Widok Kalendarza
            </h3>
            <p className="text-gray-600 mb-4">
              Wyświetlanie {filteredOrders.length} zamówień na wybrany tydzień
            </p>
            <button
              onClick={() => router.push('/admin/wizyty')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Zobacz listę wizyt
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Legenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Zaplanowana</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">W trakcie</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-700">Zakończona</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Anulowana</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper function to get current week in YYYY-Www format
function getCurrentWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
