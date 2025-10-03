import React, { useState } from 'react';
import Layout from '../components/Layout';
import TeamCommunication from '../components/TeamCommunication';
import TeamLocationTracker from '../components/TeamLocationTracker';
import TeamWorkManager from '../components/TeamWorkManager';
import { MessageCircle, MapPin, Users, BarChart3, Bell, Settings, Phone, Video, AlertTriangle, CheckCircle } from 'lucide-react';

const TeamCollaborationPage = () => {
  const [activeTab, setActiveTab] = useState('communication');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'message', text: 'Nowa wiadomość w kanale "Pilne"', time: '2 min temu' },
    { id: 2, type: 'location', text: 'Piotr Zieliński: brak aktualizacji lokalizacji', time: '5 min temu' },
    { id: 3, type: 'task', text: '3 nowe nieprzydzielone zadania', time: '10 min temu' }
  ]);

  const tabs = [
    {
      id: 'communication',
      name: 'Komunikacja',
      icon: MessageCircle,
      component: TeamCommunication,
      description: 'Czat zespołowy, kanały tematyczne, rozmowy głosowe'
    },
    {
      id: 'location',
      name: 'Lokalizacje',
      icon: MapPin,
      component: TeamLocationTracker,
      description: 'Śledzenie zespołu w czasie rzeczywistym'
    },
    {
      id: 'workmanager',
      name: 'Zarządzanie pracą',
      icon: Users,
      component: TeamWorkManager,
      description: 'Przydzielanie zadań, koordynacja zespołu'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      component: TeamDashboard,
      description: 'Przegląd zespołu i statystyki'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TeamCommunication;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Nagłówek */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Współpraca zespołowa</h1>
                <p className="text-sm text-gray-600">Komunikacja i koordynacja rozproszonego zespołu techników</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Powiadomienia */}
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Szybkie akcje */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                    <Phone className="h-4 w-4" />
                    Konferencja
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                    <Video className="h-4 w-4" />
                    Video
                  </button>
                </div>
                
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Settings className="h-5 w-5" />
                </button>
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
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Powiadomienia - pasek */}
        {notifications.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1 flex items-center gap-6 text-sm">
                  {notifications.slice(0, 2).map(notification => (
                    <div key={notification.id} className="flex items-center gap-2">
                      <span className="text-yellow-800">{notification.text}</span>
                      <span className="text-yellow-600">({notification.time})</span>
                    </div>
                  ))}
                  {notifications.length > 2 && (
                    <span className="text-yellow-600">+{notifications.length - 2} więcej...</span>
                  )}
                </div>
                <button 
                  onClick={() => setNotifications([])}
                  className="text-yellow-600 hover:text-yellow-700 text-sm"
                >
                  Odrzuć wszystkie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zawartość */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ActiveComponent />
        </div>
      </div>
    </Layout>
  );
};

// Komponent Dashboard
const TeamDashboard = () => {
  const [teamStats, setTeamStats] = useState({
    totalMembers: 4,
    activeMembers: 3,
    tasksToday: 15,
    completedToday: 8,
    messagesLast24h: 47,
    averageResponseTime: 12, // minuty
    totalDistance: 156.3,
    avgSatisfaction: 4.7
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'task_completed',
      user: 'Jan Kowalski',
      action: 'ukończył zadanie "Naprawa pralki Samsung"',
      time: '5 min temu',
      location: 'ul. Wesoła 15, Kielce'
    },
    {
      id: 2,
      type: 'message',
      user: 'Anna Wójcik',
      action: 'napisała w kanale "Pilne"',
      time: '12 min temu',
      details: 'Nowe zgłoszenie awarii pieca'
    },
    {
      id: 3,
      type: 'location_update',
      user: 'Piotr Zieliński',
      action: 'zaktualizował lokalizację',
      time: '18 min temu',
      location: 'W drodze do Pacanowa'
    },
    {
      id: 4,
      type: 'task_assigned',
      user: 'System',
      action: 'przydzielił zadanie dla Marka Nowaka',
      time: '25 min temu',
      details: 'Instalacja systemu monitoringu'
    },
    {
      id: 5,
      type: 'call_started',
      user: 'Marek Nowak',
      action: 'rozpoczął rozmowę głosową',
      time: '1h temu',
      details: 'Kanał "Koordynacja"'
    }
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'location_update': return <MapPin className="h-4 w-4 text-purple-600" />;
      case 'task_assigned': return <Users className="h-4 w-4 text-orange-600" />;
      case 'call_started': return <Phone className="h-4 w-4 text-green-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Główne statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Aktywnych członków</dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {teamStats.activeMembers}/{teamStats.totalMembers}
                </dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Postęp dzisiaj</dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {Math.round((teamStats.completedToday / teamStats.tasksToday) * 100)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Wiadomości 24h</dt>
                <dd className="text-3xl font-bold text-gray-900">{teamStats.messagesLast24h}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Przejechane km</dt>
                <dd className="text-3xl font-bold text-gray-900">{teamStats.totalDistance}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ostatnia aktywność */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Ostatnia aktywność zespołu</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y">
              {recentActivity.map(activity => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {activity.location}</p>
                      )}
                      {activity.details && (
                        <p className="text-xs text-blue-600 mt-1">{activity.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wydajność zespołu */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Wydajność zespołu</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Ukończone zadania dzisiaj</span>
                <span className="text-sm text-gray-500">{teamStats.completedToday}/{teamStats.tasksToday}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(teamStats.completedToday / teamStats.tasksToday) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Średni czas odpowiedzi</span>
                <span className="text-sm text-gray-500">{teamStats.averageResponseTime} min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.max(0, 100 - teamStats.averageResponseTime * 2)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Satysfakcja klientów</span>
                <span className="text-sm text-gray-500">{teamStats.avgSatisfaction}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(teamStats.avgSatisfaction / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{teamStats.activeMembers}</div>
                <div className="text-sm text-gray-500">Aktywni teraz</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{teamStats.totalDistance}km</div>
                <div className="text-sm text-gray-500">Przejechane dziś</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Szybkie akcje</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <MessageCircle className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Nowa wiadomość</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Phone className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Konferencja</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Users className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Przydziel zadanie</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Zgłoś problem</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaborationPage;