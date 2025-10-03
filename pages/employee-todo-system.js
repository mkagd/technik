import React, { useState } from 'react';
import Layout from '../components/Layout';
import ClientTodoManager from '../components/ClientTodoManager';
import SmartScheduler from '../components/SmartScheduler';
import { Calendar, Users, BarChart3, Settings, MapPin, Clock } from 'lucide-react';

const EmployeeTodoSystemPage = () => {
  const [activeTab, setActiveTab] = useState('manager');

  const tabs = [
    {
      id: 'manager',
      name: 'Zarządzanie TODO',
      icon: Users,
      component: ClientTodoManager
    },
    {
      id: 'scheduler',
      name: 'Inteligentny Harmonogram',
      icon: Calendar,
      component: SmartScheduler
    },
    {
      id: 'analytics',
      name: 'Analityka',
      icon: BarChart3,
      component: TodoAnalytics
    },
    {
      id: 'settings',
      name: 'Ustawienia',
      icon: Settings,
      component: TodoSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ClientTodoManager;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Nagłówek */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System TODO dla Pracowników</h1>
                <p className="text-sm text-gray-600">Zarządzanie zadaniami z integracją klientów</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Ostatnia aktualizacja: {new Date().toLocaleTimeString('pl-PL')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nawigacja */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Zawartość */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ActiveComponent />
        </div>
      </div>
    </Layout>
  );
};

// Komponent analityki
const TodoAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  React.useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/enhanced-employee-todos?stats=true`);
      const data = await response.json();
      setStats(data.statistics);
    } catch (error) {
      console.error('Błąd ładowania analityki:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Brak danych do analizy</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtry okresu */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Analityka TODO</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="day">Dzisiaj</option>
            <option value="week">Ten tydzień</option>
            <option value="month">Ten miesiąc</option>
            <option value="quarter">Ten kwartał</option>
            <option value="year">Ten rok</option>
          </select>
        </div>
      </div>

      {/* Główne statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Całkowita liczba TODO</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.total}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Wskaźnik ukończenia</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.completionRate}%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Średni czas ukończenia</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.averageCompletionTime}h</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Obsłużonych klientów</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.clientsServed}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Wykresy i szczegółowe statystyki */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priorytet */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozkład priorytetów</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Wysoki</span>
              <span className="text-sm text-gray-900">{stats.priorities.high}</span>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(stats.priorities.high / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-600">Średni</span>
              <span className="text-sm text-gray-900">{stats.priorities.medium}</span>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${(stats.priorities.medium / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Niski</span>
              <span className="text-sm text-gray-900">{stats.priorities.low}</span>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(stats.priorities.low / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kategorie */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorie zadań</h3>
          <div className="space-y-3">
            {Object.entries(stats.categories).map(([category, count], index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                <span className="text-sm text-gray-900">{count}</span>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index % 4 === 0 ? 'bg-blue-600' :
                        index % 4 === 1 ? 'bg-green-600' :
                        index % 4 === 2 ? 'bg-purple-600' : 'bg-orange-600'
                      }`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Miasta */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozkład geograficzny</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.cities).map(([city, count]) => (
            <div key={city} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{city}</span>
                <span className="text-2xl font-bold text-blue-600">{count}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((count / stats.total) * 100)}% wszystkich zadań
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Metryki podróży */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statystyki podróży</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Całkowity dystans:</span>
              <span className="font-semibold">{stats.totalDistance} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Całkowity czas podróży:</span>
              <span className="font-semibold">{Math.round(stats.totalTravelTime / 60 * 10) / 10} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Średni dystans na zadanie:</span>
              <span className="font-semibold">{Math.round(stats.totalDistance / stats.total * 10) / 10} km</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status zadań</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-green-600">Ukończone:</span>
              <span className="font-semibold text-green-600">{stats.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Do zrobienia:</span>
              <span className="font-semibold text-blue-600">{stats.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Przeterminowane:</span>
              <span className="font-semibold text-red-600">{stats.overdue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponent ustawień
const TodoSettings = () => {
  const [settings, setSettings] = useState({
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    travelSettings: {
      averageSpeed: 50,
      bufferTime: 15
    },
    notifications: {
      reminders: true,
      conflicts: true,
      dailySummary: true
    },
    display: {
      theme: 'light',
      itemsPerPage: 20
    }
  });

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveSettings = () => {
    // Tutaj można dodać logikę zapisu ustawień
    alert('Ustawienia zostały zapisane!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ustawienia systemu TODO</h2>

        {/* Godziny pracy */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Godziny pracy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Początek dnia pracy</label>
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => handleSettingChange('workingHours', 'start', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Koniec dnia pracy</label>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => handleSettingChange('workingHours', 'end', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Ustawienia podróży */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ustawienia podróży</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Średnia prędkość (km/h)</label>
              <input
                type="number"
                value={settings.travelSettings.averageSpeed}
                onChange={(e) => handleSettingChange('travelSettings', 'averageSpeed', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bufor czasowy (minuty)</label>
              <input
                type="number"
                value={settings.travelSettings.bufferTime}
                onChange={(e) => handleSettingChange('travelSettings', 'bufferTime', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Powiadomienia */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Powiadomienia</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.reminders}
                onChange={(e) => handleSettingChange('notifications', 'reminders', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Przypomnienia o zbliżających się terminach</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.conflicts}
                onChange={(e) => handleSettingChange('notifications', 'conflicts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Powiadomienia o konfliktach czasowych</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.dailySummary}
                onChange={(e) => handleSettingChange('notifications', 'dailySummary', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Dzienne podsumowanie</label>
            </div>
          </div>
        </div>

        {/* Wyświetlanie */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wyświetlanie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motyw</label>
              <select
                value={settings.display.theme}
                onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Jasny</option>
                <option value="dark">Ciemny</option>
                <option value="auto">Automatyczny</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elementów na stronie</label>
              <select
                value={settings.display.itemsPerPage}
                onChange={(e) => handleSettingChange('display', 'itemsPerPage', parseInt(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex gap-4">
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Zapisz ustawienia
          </button>
          <button
            onClick={() => setSettings({
              workingHours: { start: '08:00', end: '18:00' },
              travelSettings: { averageSpeed: 50, bufferTime: 15 },
              notifications: { reminders: true, conflicts: true, dailySummary: true },
              display: { theme: 'light', itemsPerPage: 20 }
            })}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Przywróć domyślne
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTodoSystemPage;