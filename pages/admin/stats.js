import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  FiUsers, FiShoppingBag, FiCalendar, FiStar, 
  FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle,
  FiActivity, FiPieChart, FiBarChart2, FiArrowLeft
} from 'react-icons/fi';

/**
 * Admin Statistics Page - Detailed Dashboard
 * Displays comprehensive statistics with charts and visualizations
 */
export default function AdminStats() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics from API
  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Nie udało się pobrać statystyk');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color for status
  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      in_progress: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      contacted: 'text-purple-600 bg-purple-100',
      scheduled: 'text-indigo-600 bg-indigo-100',
      confirmed: 'text-teal-600 bg-teal-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  // Get Polish status name
  const getStatusName = (status) => {
    const names = {
      pending: 'Oczekujące',
      in_progress: 'W trakcie',
      completed: 'Zakończone',
      cancelled: 'Anulowane',
      contacted: 'Skontaktowany',
      scheduled: 'Zaplanowane',
      confirmed: 'Potwierdzone',
    };
    return names[status] || status;
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'order':
        return <FiShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'reservation':
        return <FiCalendar className="w-5 h-5 text-purple-600" />;
      case 'client':
        return <FiUsers className="w-5 h-5 text-green-600" />;
      default:
        return <FiActivity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FiBarChart2 className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Statystyki szczegółowe - Admin Panel</title>
        <meta name="description" content="Szczegółowe statystyki systemu AGD" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Powrót do panelu"
                >
                  <FiArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FiBarChart2 className="w-8 h-8 text-blue-600" />
                    Statystyki szczegółowe
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Ostatnia aktualizacja: {formatDate(stats.generatedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FiActivity className="w-4 h-4" />
                Odśwież
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Clients */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs text-gray-500">Ogółem</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.totalClients}
              </h3>
              <p className="text-sm text-gray-600">Klienci</p>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">Ogółem</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.totalOrders}
              </h3>
              <p className="text-sm text-gray-600">Zamówienia</p>
            </div>

            {/* Total Employees */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  {stats.activeEmployees} aktywnych
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.totalEmployees}
              </h3>
              <p className="text-sm text-gray-600">Pracownicy</p>
            </div>

            {/* Total Reservations */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FiCalendar className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-xs text-gray-500">Ogółem</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stats.totalReservations}
              </h3>
              <p className="text-sm text-gray-600">Rezerwacje</p>
            </div>
          </div>

          {/* Secondary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Today's Visits */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiClock className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Dzisiaj</span>
              </div>
              <h3 className="text-4xl font-bold mb-1">{stats.todayVisits}</h3>
              <p className="text-sm opacity-90">Wizyty dzisiaj</p>
            </div>

            {/* This Week Orders */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiTrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Ten tydzień</span>
              </div>
              <h3 className="text-4xl font-bold mb-1">{stats.thisWeekOrders}</h3>
              <p className="text-sm opacity-90">Zamówienia w tym tygodniu</p>
            </div>

            {/* Average Rating */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <FiStar className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">{stats.totalRatings} ocen</span>
              </div>
              <h3 className="text-4xl font-bold mb-1">{stats.averageRating}</h3>
              <p className="text-sm opacity-90">Średnia ocena</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Orders by Status */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <FiPieChart className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Zamówienia według statusu</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                  const percentage = stats.totalOrders > 0 
                    ? ((count / stats.totalOrders) * 100).toFixed(1) 
                    : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusName(status)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === 'pending' ? 'bg-yellow-500' :
                            status === 'inProgress' ? 'bg-blue-500' :
                            status === 'completed' ? 'bg-green-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orders by Priority */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold text-gray-800">Zamówienia według priorytetu</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.ordersByPriority).map(([priority, count]) => {
                  const percentage = stats.totalOrders > 0 
                    ? ((count / stats.totalOrders) * 100).toFixed(1) 
                    : 0;
                  return (
                    <div key={priority}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {priority === 'low' ? 'Niska' :
                           priority === 'normal' ? 'Normalna' :
                           priority === 'high' ? 'Wysoka' : 'Pilne'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            priority === 'low' ? 'bg-green-500' :
                            priority === 'normal' ? 'bg-blue-500' :
                            priority === 'high' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reservations by Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FiCalendar className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Rezerwacje według statusu</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.reservationsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className={`p-4 rounded-lg ${getStatusColor(status)} text-center`}
                >
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-xs font-medium">{getStatusName(status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Categories */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FiBarChart2 className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">Kategorie urządzeń AGD</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.deviceCategories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 9)
                .map(([category, count]) => {
                  const percentage = stats.totalOrders > 0 
                    ? ((count / stats.totalOrders) * 100).toFixed(1) 
                    : 0;
                  return (
                    <div key={category} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{category}</span>
                        <span className="text-xs text-gray-600">{count}</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{percentage}%</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <FiActivity className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">Ostatnia aktywność</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Typ</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Opis</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map((activity, index) => (
                    <tr
                      key={`${activity.type}-${activity.id}-${index}`}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {activity.type === 'order' ? 'Zamówienie' :
                             activity.type === 'reservation' ? 'Rezerwacja' : 'Klient'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {activity.description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(activity.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.recentActivity.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Brak ostatniej aktywności
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
