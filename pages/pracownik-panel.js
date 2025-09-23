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
  FiHome
} from 'react-icons/fi';

export default function PracownikPanel() {
  const [employee, setEmployee] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
          time: '09:00',
          customerName: 'Jan Kowalski',
          address: 'ul. Kwiatowa 15, Dębica',
          phone: '123-456-789',
          description: 'Naprawa pralki - nie wiruje',
          device: 'Pralka Samsung',
          status: 'pending',
          estimatedDuration: 60
        },
        {
          id: 2,
          time: '11:30',
          customerName: 'Maria Nowak',
          address: 'ul. Słoneczna 8, Rzeszów',
          phone: '987-654-321',
          description: 'Wymiana grzałki w piekarnika',
          device: 'Piekarnik Bosch',
          status: 'pending',
          estimatedDuration: 90
        },
        {
          id: 3,
          time: '14:00',
          customerName: 'Piotr Wiśniewski',
          address: 'ul. Główna 22, Mielec',
          phone: '555-123-456',
          description: 'Serwis lodówki - problem z chłodzeniem',
          device: 'Lodówka Whirlpool',
          status: 'completed',
          estimatedDuration: 45
        }
      ];

      setTodayTasks(mockTasks);
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTodayTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie panelu pracownika...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const pendingTasks = todayTasks.filter(task => task.status === 'pending');
  const completedTasks = todayTasks.filter(task => task.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FiTool className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Panel Pracownika
                </h1>
                <p className="text-sm text-gray-600">
                  Witaj, {employee.firstName} {employee.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/kalendarz-pracownika-prosty')}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiCalendar className="h-5 w-5 mr-2" />
                Kalendarz
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FiHome className="h-5 w-5 mr-2" />
                Strona główna
              </button>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiClock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Zadania na dziś</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingTasks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ukończone</p>
                <p className="text-2xl font-semibold text-gray-900">{completedTasks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiTool className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Specjalizacja</p>
                <p className="text-sm font-semibold text-gray-900">
                  {employee.specialization.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Zadania na dziś - {new Date().toLocaleDateString('pl-PL')}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {todayTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FiCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Brak zadań na dziś</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div key={task.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-lg font-semibold text-blue-600 mr-4">
                          {task.time}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'completed' && <FiCheckCircle className="h-3 w-3 mr-1" />}
                          {task.status === 'completed' ? 'Ukończone' : 
                           task.status === 'in-progress' ? 'W trakcie' : 'Oczekuje'}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {task.customerName}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
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

                      <p className="text-gray-700 mb-3">{task.description}</p>
                      
                      <p className="text-xs text-gray-500">
                        Szacowany czas: {task.estimatedDuration} min
                      </p>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {task.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Rozpocznij
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Oznacz jako ukończone
                          </button>
                        </>
                      )}
                      
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Zakończ zadanie
                        </button>
                      )}

                      {task.status === 'completed' && (
                        <div className="text-green-600 text-sm font-medium">
                          ✓ Ukończone
                        </div>
                      )}

                      <a
                        href={`tel:${task.phone}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors text-center"
                      >
                        <FiPhone className="h-4 w-4 inline mr-1" />
                        Zadzwoń
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}