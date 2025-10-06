// pages/admin/index.js
// Główny dashboard panelu administracyjnego

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { 
  FiUsers, FiCalendar, FiShoppingBag, FiTool, FiSettings,
  FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiClipboard, FiBarChart2
} from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVisits: 0,
    pendingOrders: 0,
    activeEmployees: 0,
    satisfaction: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Pobierz prawdziwe statystyki z dedykowanego API
      const response = await fetch('/api/stats');
      
      if (response.ok) {
        const data = await response.json();
        
        setStats({
          totalVisits: data.todayVisits || 0,
          pendingOrders: data.ordersByStatus?.pending || 0,
          activeEmployees: data.activeEmployees || 0,
          satisfaction: data.averageRating || 0
        });

        // Ustaw również ostatnią aktywność
        setRecentActivity(data.recentActivity || []);
      } else {
        console.error('Failed to load stats');
      }
    } catch (error) {
      console.error('Błąd ładowania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Wszystkie wizyty',
      value: stats.totalVisits,
      icon: FiCalendar,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Oczekujące zamówienia',
      value: stats.pendingOrders,
      icon: FiClock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Aktywni pracownicy',
      value: stats.activeEmployees,
      icon: FiUsers,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Zadowolenie klientów',
      value: `${stats.satisfaction}/5`,
      icon: FiCheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  const quickActions = [
    {
      title: '👤 Panel Klienta',
      description: 'Logowanie dla klientów',
      icon: FiUsers,
      href: '/client/login',
      color: 'pink'
    },
    {
      title: 'Statystyki szczegółowe',
      description: 'Wykresy, raporty i analizy',
      icon: FiBarChart2,
      href: '/admin/stats',
      color: 'indigo'
    },
    {
      title: '📅 Kalendarz wizyt',
      description: 'Widok kalendarza tygodniowego',
      icon: FiCalendar,
      href: '/admin/kalendarz',
      color: 'blue'
    },
    {
      title: 'Lista wizyt',
      description: 'Zarządzaj wszystkimi wizytami',
      icon: FiCalendar,
      href: '/admin/wizyty',
      color: 'teal'
    },
    {
      title: 'Przydział zleceń',
      description: 'Przydzielaj zlecenia do pracowników',
      icon: FiClipboard,
      href: '/panel-przydzial-zlecen',
      color: 'purple'
    },
    {
      title: 'Magazyn części',
      description: 'Zarządzaj częściami i zamówieniami',
      icon: FiShoppingBag,
      href: '/admin/magazyn',
      color: 'blue'
    },
    {
      title: 'Rozliczenia',
      description: 'Wypłaty pracowników i rozliczenia',
      icon: FiAlertCircle,
      href: '/admin/rozliczenia',
      color: 'green'
    },
    {
      title: 'Nowa rezerwacja',
      description: 'Dodaj nową rezerwację wizyt',
      icon: FiCalendar,
      href: '/admin/rezerwacje/nowa',
      color: 'orange'
    },
    {
      title: 'Zarządzaj pracownikami',
      description: 'Edytuj dane i uprawnienia',
      icon: FiUsers,
      href: '/admin/pracownicy',
      color: 'purple'
    },
    {
      title: 'Alerty bezpieczeństwa',
      description: 'Monitoruj płatności i działania',
      icon: FiAlertCircle,
      href: '/admin/alerty',
      color: 'orange'
    },
    {
      title: '📦 Panel Logistyki',
      description: 'Magazyn, zamówienia i dostawcy',
      icon: FiShoppingBag,
      href: '/logistyka',
      color: 'indigo'
    }
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Witaj w panelu administracyjnym
        </h1>
        <p className="text-gray-600">
          Zarządzaj systemem serwisowym - poniżej znajduje się podsumowanie najważniejszych danych
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className={`${stat.bgColor} rounded-lg border-2 ${stat.borderColor} p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${stat.bgColor} rounded-lg border ${stat.borderColor}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {loading ? '...' : stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Szybkie akcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              pink: 'bg-pink-50 border-pink-200 hover:border-pink-400 text-pink-600',
              indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 text-indigo-600',
              teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-600',
              blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-600',
              green: 'bg-green-50 border-green-200 hover:border-green-400 text-green-600',
              purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-600',
              orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-600'
            };

            return (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className={`${colorClasses[action.color]} rounded-lg border-2 p-4 text-left hover:shadow-md transition-all`}
              >
                <Icon className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* System status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Ostatnia aktywność
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Ładowanie...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Brak ostatniej aktywności</div>
            ) : (
              recentActivity.map((activity, index) => {
                const colors = {
                  order: 'bg-green-500',
                  reservation: 'bg-blue-500',
                  client: 'bg-purple-500'
                };
                const bgColor = colors[activity.type] || 'bg-gray-500';
                
                return (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className={`w-2 h-2 ${bgColor} rounded-full mt-1.5`}></div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">{activity.description}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(activity.date).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* System status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiSettings className="mr-2 h-5 w-5 text-blue-600" />
            Status systemu
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">Serwer API</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">Baza danych</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Połączona</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">Backup</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Aktualny</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Aktualizacje</span>
              </div>
              <span className="text-xs text-yellow-600 font-medium">Dostępne</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
