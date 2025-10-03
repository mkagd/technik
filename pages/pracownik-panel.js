// pages/pracownik-panel.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EmployeeTodoPanel from '../components/EmployeeTodoPanel';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiPhone,
  FiMail,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiHome,
  FiDollarSign,
  FiTrendingUp,
  FiBell,
  FiStar,
  FiAward,
  FiTarget,
  FiBarChart,
  FiCamera,
  FiFileText,
  FiUsers,
  FiZap,
  FiChevronDown,
  FiMenu,
  FiList
} from 'react-icons/fi';

export default function PracownikPanel() {
  const [employee, setEmployee] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // 🚀 API Functions
  const loadEmployeeTasks = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/employee-tasks?employeeId=${employeeId}&date=${today}`);
      const data = await response.json();
      
      if (data.success) {
        setTodayTasks(data.tasks);
        
        // Aktualizuj statystyki na podstawie prawdziwych danych
        setWeeklyStats({
          completedTasks: data.stats.completedTasks,
          totalEarnings: data.stats.completedTasks * 195, // średnia cena za zlecenie
          averageRating: 4.8,
          workingHours: Math.min(data.stats.totalTasks * 2, 40), // 2h na zlecenie
          efficiency: Math.round((data.stats.completedTasks / Math.max(data.stats.totalTasks, 1)) * 100)
        });

        console.log(`✅ Załadowano ${data.tasks.length} zadań dla pracownika ${employeeId}`);
      } else {
        console.error('❌ Błąd ładowania zadań:', data.message);
        setTodayTasks([]);
      }
    } catch (error) {
      console.error('❌ Błąd API employee-tasks:', error);
      setTodayTasks([]);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch('/api/employee-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          taskId: taskId,
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        // Odśwież listę zadań
        if (employee) {
          await loadEmployeeTasks(employee.id);
        }
        console.log(`✅ Status zlecenia ${taskId} zaktualizowany na: ${newStatus}`);
      } else {
        console.error('❌ Błąd aktualizacji statusu:', data.message);
      }
    } catch (error) {
      console.error('❌ Błąd aktualizacji statusu:', error);
    }
  };

  useEffect(() => {
    // Sprawdź czy pracownik jest zalogowany
    const initializePanel = async () => {
      if (typeof window !== 'undefined') {
        const employeeSession = localStorage.getItem('employeeSession');
        if (!employeeSession) {
          router.push('/pracownik-logowanie');
          return;
        }

        const employeeData = JSON.parse(employeeSession);
        setEmployee(employeeData);

        // 🚀 Ładuj prawdziwe zadania z API
        await loadEmployeeTasks(employeeData.id);

        // Statystyki miesięczne (będą aktualizowane gdy API zwróci więcej danych)
        setMonthlyStats({
          completedTasks: 0,
          totalEarnings: 0,
          newClients: 0,
          returnClients: 0,
          averageTaskTime: 120
        });

        // Podstawowe powiadomienia (można rozszerzyć o API notifications)
        setNotifications([
          {
            id: 1,
            type: 'info',
            message: 'Panel pracownika został zaktualizowany - teraz używa prawdziwych danych!',
            time: 'teraz',
            urgent: false
          }
        ]);

        setIsLoading(false);
      }
    };

    initializePanel();
  }, [router]);

  // Aktualizuj czas co minutę
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Zamknij user menu gdy kliknięto poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Zakończone';
      case 'in_progress':
        return 'W trakcie';
      case 'pending':
        return 'Oczekuje';
      default:
        return 'Nieznany';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Wysoki';
      case 'normal':
        return 'Normalny';
      case 'low':
        return 'Niski';
      default:
        return 'Normalny';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie panelu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center min-w-0 flex-1">
              <FiTool className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  Panel Serwisanta
                </h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                  Dzień dobry, {employee?.firstName} {employee?.lastName}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Czas - ukryty na małych ekranach */}
              <div className="text-right hidden lg:block">
                <p className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('pl-PL', { 
                    weekday: 'short', 
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString('pl-PL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              {/* Powiadomienia */}
              <div className="relative">
                <FiBell className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                {notifications.some(n => n.urgent) && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 md:h-3 md:w-3 bg-red-500 rounded-full"></span>
                )}
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
                  </div>
                  <FiChevronDown className={`h-4 w-4 ml-1 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {employee?.firstName} {employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Serwisant AGD</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        router.push('/kalendarz-pracownika-prosty');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiCalendar className="h-4 w-4 mr-3" />
                      Kalendarz
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/ai-scanner');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 relative"
                    >
                      <FiCamera className="h-4 w-4 mr-3" />
                      Skanuj z AI
                      <span className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-1 py-0.5 rounded">🤖</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push('/');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiHome className="h-4 w-4 mr-3" />
                      Strona główna
                    </button>
                    
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiSettings className="h-4 w-4 mr-3" />
                      Ustawienia
                    </button>
                    
                    <div className="border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Wyloguj
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiHome className="inline-block w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'todos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiList className="inline-block w-4 h-4 mr-2" />
              Moje TODO
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <FiCheckCircle className="h-8 w-8 mr-3" />
              <div>
                <p className="text-blue-100 text-sm">Dzisiaj wykonane</p>
                <p className="text-2xl font-bold">
                  {todayTasks.filter(task => task.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <FiDollarSign className="h-8 w-8 mr-3" />
              <div>
                <p className="text-green-100 text-sm">Zarobki w tym tygodniu</p>
                <p className="text-2xl font-bold">{weeklyStats.totalEarnings} PLN</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <FiStar className="h-8 w-8 mr-3" />
              <div>
                <p className="text-purple-100 text-sm">Średnia ocena</p>
                <p className="text-2xl font-bold">{weeklyStats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <FiClock className="h-8 w-8 mr-3" />
              <div>
                <p className="text-orange-100 text-sm">Godziny w tym tygodniu</p>
                <p className="text-2xl font-bold">{weeklyStats.workingHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <FiTrendingUp className="h-8 w-8 mr-3" />
              <div>
                <p className="text-indigo-100 text-sm">Efektywność</p>
                <p className="text-2xl font-bold">{weeklyStats.efficiency}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Zadania na dziś */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiCalendar className="h-5 w-5 mr-2" />
                  Harmonogram na dziś ({todayTasks.length} zleceń)
                </h2>
              </div>
              
              <div className="p-6">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Brak zaplanowanych zleceń na dziś</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/zlecenie-szczegoly?id=${task.id}`)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg font-semibold text-blue-600">
                              {task.time}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                              {getTaskStatusLabel(task.status)}
                            </span>
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              ● {getPriorityLabel(task.priority)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ~{task.estimatedDuration} min
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2">{task.customerName}</h3>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <FiMapPin className="h-4 w-4 mr-2" />
                            {task.address}
                          </div>
                          <div className="flex items-center">
                            <FiPhone className="h-4 w-4 mr-2" />
                            {task.phone}
                          </div>
                          <div className="flex items-center">
                            <FiTool className="h-4 w-4 mr-2" />
                            {task.device}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                          {task.description}
                        </p>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => window.open(`tel:${task.phone}`, '_self')}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              📞 Zadzwoń
                            </button>
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(task.address)}`, '_blank')}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              🗺️ Nawigacja
                            </button>
                            {task.status === 'pending' && (
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                              >
                                ▶️ Rozpocznij
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                              >
                                ✅ Zakończ
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                            {task.serviceType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Szybkie akcje */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiZap className="h-5 w-5 mr-2" />
                  Szybkie akcje
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => router.push('/kalendarz-pracownika-prosty')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiCalendar className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium">Kalendarz</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/ai-scanner')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative"
                  >
                    <FiCamera className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium">Skanuj z AI</span>
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-1 py-0.5 rounded-full">🤖</span>
                  </button>
                  
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FiFileText className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium">Raporty</span>
                  </button>
                  
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FiSettings className="h-8 w-8 text-gray-600 mb-2" />
                    <span className="text-sm font-medium">Ustawienia</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Prawa kolumna - Statystyki i powiadomienia */}
          <div className="space-y-6">
            
            {/* Powiadomienia */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiBell className="h-5 w-5 mr-2" />
                  Powiadomienia
                </h2>
              </div>
              
              <div className="p-6">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Brak nowych powiadomień</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border-l-4 ${
                          notification.urgent 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <p className={`text-sm ${
                          notification.urgent ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statystyki miesięczne */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiBarChart className="h-5 w-5 mr-2" />
                  Podsumowanie miesiąca
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wykonane zlecenia</span>
                  <span className="font-semibold text-gray-900">{monthlyStats.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Łączne zarobki</span>
                  <span className="font-semibold text-green-600">{monthlyStats.totalEarnings} PLN</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nowi klienci</span>
                  <span className="font-semibold text-blue-600">{monthlyStats.newClients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Powracający klienci</span>
                  <span className="font-semibold text-purple-600">{monthlyStats.returnClients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Średni czas zlecenia</span>
                  <span className="font-semibold text-gray-900">{monthlyStats.averageTaskTime} min</span>
                </div>
              </div>
            </div>

            {/* Osiągnięcia */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiAward className="h-5 w-5 mr-2" />
                  Twoje osiągnięcia
                </h2>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <FiStar className="h-6 w-6 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Mistrz napraw</p>
                    <p className="text-sm text-gray-600">50+ napraw w miesiącu</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <FiUsers className="h-6 w-6 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Ulubieniec klientów</p>
                    <p className="text-sm text-gray-600">Ocena 4.8+ przez 3 miesiące</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <FiTarget className="h-6 w-6 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Punktualny jak zegarek</p>
                    <p className="text-sm text-gray-600">95%+ punktualności</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* TODO Content */}
        {activeTab === 'todos' && employee && (
          <EmployeeTodoPanel 
            employeeId={employee.id}
            employeeName={employee.name}
          />
        )}
      </main>
    </div>
  );
}