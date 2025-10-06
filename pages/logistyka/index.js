// pages/logistyka/index.js
// Główny dashboard panelu logistyki

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DarkModeToggle from '../../components/DarkModeToggle';
import { 
  FiPackage, FiShoppingCart, FiTruck, FiAlertCircle,
  FiCheckCircle, FiClock, FiTrendingUp, FiBarChart2,
  FiBox, FiList, FiLayers, FiShoppingBag
} from 'react-icons/fi';

export default function LogistykaDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    urgentOrders: 0,
    totalInventory: 0,
    lowStock: 0,
    approvedToday: 0,
    consolidationOpportunities: 0
  });
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeInfo();
    loadStats();
    loadRecentActivity();
  }, []);

  const loadEmployeeInfo = () => {
    const employeeData = localStorage.getItem('employeeSession') || 
                        localStorage.getItem('logistykEmployee');
    if (employeeData) {
      try {
        setEmployeeInfo(JSON.parse(employeeData));
      } catch (e) {
        console.error('Error parsing employee data:', e);
      }
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Zamówienia części
      const ordersRes = await fetch('/api/part-requests?status=pending');
      const ordersData = await ordersRes.json();
      const pending = ordersData.requests?.length || 0;
      const urgent = ordersData.requests?.filter(r => r.urgency === 'urgent').length || 0;

      // Magazyn
      const inventoryRes = await fetch('/api/inventory/parts');
      const inventoryData = await inventoryRes.json();
      const totalParts = inventoryData.parts?.length || 0;
      const lowStock = inventoryData.parts?.filter(p => p.stock <= p.minStock).length || 0;

      // Zatwierdzone dzisiaj
      const allOrdersRes = await fetch('/api/part-requests');
      const allOrdersData = await allOrdersRes.json();
      const today = new Date().toISOString().split('T')[0];
      const approvedToday = allOrdersData.requests?.filter(r => 
        r.status === 'approved' && r.approvedAt?.startsWith(today)
      ).length || 0;

      setStats({
        pendingOrders: pending,
        urgentOrders: urgent,
        totalInventory: totalParts,
        lowStock: lowStock,
        approvedToday: approvedToday,
        consolidationOpportunities: 0 // TODO: API konsolidacji
      });
    } catch (error) {
      console.error('Błąd ładowania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const res = await fetch('/api/part-requests?limit=5');
      const data = await res.json();
      
      const activities = data.requests?.map(req => ({
        type: req.status === 'approved' ? 'approved' : 'pending',
        description: `${req.status === 'approved' ? '✅ Zatwierdzono' : '⏳ Oczekuje'}: ${req.partName || 'Część'}`,
        date: req.createdAt,
        requestId: req.requestId
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Błąd ładowania aktywności:', error);
    }
  };

  const statCards = [
    {
      title: 'Oczekujące zamówienia',
      value: stats.pendingOrders,
      icon: FiClock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      link: '/logistyka/magazyn/zamowienia?filter=pending'
    },
    {
      title: 'Pilne zamówienia',
      value: stats.urgentOrders,
      icon: FiAlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      link: '/logistyka/magazyn/zamowienia?filter=urgent'
    },
    {
      title: 'Zatwierdzono dzisiaj',
      value: stats.approvedToday,
      icon: FiCheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      link: '/logistyka/magazyn/zamowienia?filter=all'
    },
    {
      title: 'Niski stan magazynu',
      value: stats.lowStock,
      icon: FiAlertCircle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      link: '/logistyka/magazyn/magazyny'
    },
    {
      title: 'Części w magazynie',
      value: stats.totalInventory,
      icon: FiBox,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      link: '/logistyka/magazyn/magazyny'
    },
    {
      title: 'Możliwe konsolidacje',
      value: stats.consolidationOpportunities,
      icon: FiLayers,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      link: '/logistyka/magazyn/konsolidacja'
    }
  ];

  const quickActions = [
    {
      title: 'Zarządzaj zleceniami',
      description: 'Przydzielaj wizyty serwisantom',
      icon: FiList,
      href: '/logistyka/zlecenia',
      color: 'indigo',
      badge: null // TODO: dodać licznik nieprzypisanych
    },
    {
      title: 'Zamówienia do zatwierdzenia',
      description: 'Zatwierdź lub odrzuć zamówienia części',
      icon: FiCheckCircle,
      href: '/logistyka/magazyn/zamowienia',
      color: 'blue',
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : null
    },
    {
      title: 'Magazyn główny',
      description: 'Stan magazynu centralnego',
      icon: FiPackage,
      href: '/logistyka/magazyn/glowny',
      color: 'green',
      badge: stats.lowStock > 0 ? stats.lowStock : null
    },
    {
      title: 'Magazyny serwisantów',
      description: 'Osobiste magazyny pracowników',
      icon: FiPackage,
      href: '/logistyka/magazyn/magazyny',
      color: 'teal'
    },
    {
      title: 'Konsolidacja zamówień',
      description: 'Grupuj zamówienia od dostawców',
      icon: FiLayers,
      href: '/logistyka/magazyn/konsolidacja',
      color: 'purple'
    },
    {
      title: 'Sugestie Allegro',
      description: 'Sprawdź dostępność na Allegro',
      icon: FiShoppingCart,
      href: '/logistyka/allegro/suggestions',
      color: 'orange'
    },
    {
      title: 'Zamów do dostawcy',
      description: 'Złóż zamówienie u dostawcy',
      icon: FiShoppingBag,
      href: '/logistyka/magazyn/admin-order',
      color: 'indigo'
    },
    {
      title: 'Historia zamówień',
      description: 'Zobacz wszystkie zamówienia',
      icon: FiList,
      href: '/logistyka/magazyn/zamowienia?filter=all',
      color: 'gray'
    },
    {
      title: 'Raporty i statystyki',
      description: 'Analizy magazynowe',
      icon: FiBarChart2,
      href: '/logistyka/raporty',
      color: 'teal'
    },
    {
      title: 'Dostawcy',
      description: 'Zarządzaj bazą dostawców',
      icon: FiTruck,
      href: '/logistyka/dostawcy',
      color: 'pink'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-600',
    green: 'bg-green-50 border-green-200 hover:border-green-400 text-green-600',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-600',
    indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 text-indigo-600',
    gray: 'bg-gray-50 border-gray-200 hover:border-gray-400 text-gray-600',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-600',
    pink: 'bg-pink-50 border-pink-200 hover:border-pink-400 text-pink-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Logistyki</h1>
              {employeeInfo && (
                <p className="text-sm text-gray-600 mt-1">
                  Zalogowano jako: <span className="font-medium">{employeeInfo.name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Panel Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Witaj w panelu logistyki! 📦
          </h2>
          <p className="text-gray-600">
            Zarządzaj magazynem, zatwierdzaj zamówienia i koordynuj dostawy części serwisowych.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                href={stat.link}
                className={`${stat.bgColor} rounded-lg border-2 ${stat.borderColor} p-6 hover:shadow-lg transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg border ${stat.borderColor}`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  {stat.value > 0 && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${stat.iconColor} ${stat.bgColor} border ${stat.borderColor}`}>
                      {stat.value}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.title}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Szybkie akcje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className={`${colorClasses[action.color]} rounded-lg border-2 p-4 text-left hover:shadow-md transition-all relative`}
                >
                  {action.badge && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
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

        {/* Recent activity and alerts */}
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
                <div className="text-center py-4 text-gray-500">Brak aktywności</div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className={`w-2 h-2 ${activity.type === 'approved' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full mt-1.5`}></div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">{activity.description}</div>
                      <div className="text-gray-500 text-xs flex items-center justify-between">
                        <span>{new Date(activity.date).toLocaleString('pl-PL')}</span>
                        <span className="text-blue-600 font-mono">{activity.requestId}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link 
                href="/logistyka/magazyn/zamowienia?filter=all"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Zobacz wszystkie zamówienia →
              </Link>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiAlertCircle className="mr-2 h-5 w-5 text-orange-600" />
              Alerty magazynowe
            </h3>
            <div className="space-y-3">
              {stats.lowStock > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <FiAlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-900">Niski stan magazynu</div>
                    <div className="text-sm text-orange-700">
                      {stats.lowStock} części wymaga uzupełnienia
                    </div>
                    <Link 
                      href="/logistyka/magazyn/magazyny"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-1 inline-block"
                    >
                      Sprawdź magazyn →
                    </Link>
                  </div>
                </div>
              )}
              
              {stats.urgentOrders > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <FiClock className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">Pilne zamówienia</div>
                    <div className="text-sm text-red-700">
                      {stats.urgentOrders} zamówień wymaga natychmiastowej uwagi
                    </div>
                    <Link 
                      href="/logistyka/magazyn/zamowienia?filter=urgent"
                      className="text-sm text-red-600 hover:text-red-700 font-medium mt-1 inline-block"
                    >
                      Przejdź do zamówień →
                    </Link>
                  </div>
                </div>
              )}

              {stats.lowStock === 0 && stats.urgentOrders === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-700">Wszystko w porządku!</div>
                  <div className="text-sm">Brak aktywnych alertów</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Panel logistyki</div>
              <div className="text-sm text-blue-700">
                Masz dostęp do wszystkich funkcji magazynowych. W razie pytań skontaktuj się z administratorem systemu.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
