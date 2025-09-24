// pages/pracownik-panel.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  FiZap
} from 'react-icons/fi';

export default function PracownikPanel() {
  const [employee, setEmployee] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    // Sprawdź czy pracownik jest zalogowany
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }

      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);

      // Załaduj zadania na dzisiaj (mock data)
      const mockTasks = [
        {
          id: 1,
          time: '08:30',
          customerName: 'Jan Kowalski',
          address: 'ul. Długa 5, Warszawa',
          phone: '+48 123 456 789',
          description: 'Pralka nie włącza się, brak reakcji na przyciski',
          device: 'Pralka Samsung WW70J5346MW',
          status: 'pending',
          estimatedDuration: 90,
          priority: 'normal',
          serviceType: 'naprawa'
        },
        {
          id: 2,
          time: '10:00',
          customerName: 'Anna Nowak',
          address: 'ul. Krótka 12, Kraków',
          phone: '+48 987 654 321',
          description: 'Zmywarka nie myje naczyń, słaba cyrkulacja wody',
          device: 'Zmywarka Bosch SMS46GI01E',
          status: 'in_progress',
          estimatedDuration: 120,
          priority: 'high',
          serviceType: 'serwis'
        },
        {
          id: 3,
          time: '14:30',
          customerName: 'Piotr Wiśniewski',
          address: 'ul. Główna 8, Gdańsk',
          phone: '+48 555 123 456',
          description: 'Wymiana filtra w lodówce, przegląd ogólny',
          device: 'Lodówka LG GBB60PZJZS',
          status: 'completed',
          estimatedDuration: 45,
          priority: 'low',
          serviceType: 'przegląd'
        },
        {
          id: 4,
          time: '16:00',
          customerName: 'Maria Kowalczyk',
          address: 'ul. Nowa 3, Wrocław',
          phone: '+48 666 789 123',
          description: 'Kuchenka nie grzeje, problem z palnikiem',
          device: 'Kuchenka gazowa Amica',
          status: 'pending',
          estimatedDuration: 75,
          priority: 'high',
          serviceType: 'naprawa'
        }
      ];
      setTodayTasks(mockTasks);

      // Statystyki tygodniowe
      setWeeklyStats({
        completedTasks: 12,
        totalEarnings: 2340,
        averageRating: 4.8,
        workingHours: 38,
        efficiency: 95
      });

      // Statystyki miesięczne
      setMonthlyStats({
        completedTasks: 48,
        totalEarnings: 9680,
        newClients: 15,
        returnClients: 33,
        averageTaskTime: 85
      });

      // Powiadomienia
      setNotifications([
        {
          id: 1,
          type: 'task',
          message: 'Nowe zlecenie na jutro - 09:00',
          time: '10 min temu',
          urgent: false
        },
        {
          id: 2,
          type: 'achievement',
          message: 'Osiągnięto 50 napraw w tym miesiącu!',
          time: '2 godziny temu',
          urgent: false
        },
        {
          id: 3,
          type: 'warning',
          message: 'Brak części do naprawy - zamów do magazynu',
          time: '1 dzień temu',
          urgent: true
        }
      ]);

      setIsLoading(false);
    }
  }, [router]);

  // Aktualizuj czas co minutę
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FiTool className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel Serwisanta AGD
                </h1>
                <p className="text-sm text-gray-600">
                  Dzień dobry, {employee?.firstName} {employee?.lastName}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('pl-PL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString('pl-PL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              <div className="relative">
                <FiBell className="h-6 w-6 text-gray-600" />
                {notifications.some(n => n.urgent) && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiLogOut className="h-5 w-5 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
                            <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                              📞 Zadzwoń
                            </button>
                            <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                              🗺️ Nawigacja
                            </button>
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
                  
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FiCamera className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium">Zdjęcia</span>
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
      </main>
    </div>
  );
}