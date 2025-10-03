import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Navigation, Users, AlertTriangle, CheckCircle, Route, Zap } from 'lucide-react';

const SmartScheduler = () => {
  const [todos, setTodos] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [scheduleMetrics, setScheduleMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      generateOptimizedSchedule();
    }
  }, [todos, selectedDate]);

  const loadData = async () => {
    try {
      const [todosResponse, clientsResponse] = await Promise.all([
        fetch('/data/enhanced_employee_todos.json'),
        fetch('/data/clients.json')
      ]);
      
      const todosData = await todosResponse.json();
      const clientsData = await clientsResponse.json();
      
      setTodos(todosData);
      setClients(clientsData);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizedSchedule = () => {
    const dayTodos = todos.filter(todo => {
      if (todo.completed) return false;
      
      const todoDate = todo.scheduling?.suggestedDate || todo.dueDate;
      return todoDate === selectedDate;
    });

    if (dayTodos.length === 0) {
      setOptimizedSchedule([]);
      setScheduleMetrics({});
      return;
    }

    // Sortowanie według priorytetów i optymalizacja trasy
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    // Najpierw sortujemy według priorytetu
    const sortedByPriority = dayTodos.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Jeśli ten sam priorytet, sortuj według dostępności klienta
      const aTime = getClientPreferredTimeScore(a.clientData?.preferredContactTime);
      const bTime = getClientPreferredTimeScore(b.clientData?.preferredContactTime);
      return aTime - bTime;
    });

    // Teraz optymalizujemy trasę geograficznie
    const optimizedRoute = optimizeRoute(sortedByPriority);
    
    // Przypisujemy czasówki
    const scheduleWithTimes = assignTimeSlots(optimizedRoute);
    
    setOptimizedSchedule(scheduleWithTimes);
    setScheduleMetrics(calculateMetrics(scheduleWithTimes));
  };

  const getClientPreferredTimeScore = (preferredTime) => {
    if (!preferredTime) return 12; // domyślnie południe
    
    const timeMap = {
      'Rano': 8,
      'Przed południem': 10,
      'Południe': 12,
      'Po południu': 14,
      'Po pracy': 17,
      'Wieczorem': 19,
      'Dni robocze': 10,
      'Godziny biurowe': 10,
      '08:00-16:00': 10,
      '09:00-16:00': 11,
      'Po 17:00': 17
    };
    
    return timeMap[preferredTime] || 12;
  };

  const optimizeRoute = (todos) => {
    if (todos.length <= 1) return todos;
    
    // Prosty algorytm najbliższego sąsiada z uwzględnieniem priorytetów
    const result = [];
    const remaining = [...todos];
    
    // Zaczynamy od najwyższego priorytetu
    const firstTodo = remaining.shift();
    result.push(firstTodo);
    
    while (remaining.length > 0) {
      const current = result[result.length - 1];
      let bestNext = null;
      let bestIndex = -1;
      let bestScore = -Infinity;
      
      remaining.forEach((todo, index) => {
        const distanceScore = calculateDistanceScore(current, todo);
        const priorityScore = (priorityOrder[todo.priority] || 0) * 10;
        const timeScore = calculateTimeCompatibilityScore(current, todo);
        
        const totalScore = priorityScore + distanceScore + timeScore;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestNext = todo;
          bestIndex = index;
        }
      });
      
      if (bestNext) {
        result.push(bestNext);
        remaining.splice(bestIndex, 1);
      }
    }
    
    return result;
  };

  const calculateDistanceScore = (todo1, todo2) => {
    const dist1 = todo1.location?.distanceFromBase || 0;
    const dist2 = todo2.location?.distanceFromBase || 0;
    const distanceDiff = Math.abs(dist1 - dist2);
    
    // Im mniejsza różnica odległości, tym wyższy wynik
    return Math.max(0, 50 - distanceDiff);
  };

  const calculateTimeCompatibilityScore = (todo1, todo2) => {
    const time1 = getClientPreferredTimeScore(todo1.clientData?.preferredContactTime);
    const time2 = getClientPreferredTimeScore(todo2.clientData?.preferredContactTime);
    const timeDiff = Math.abs(time1 - time2);
    
    // Im mniejsza różnica czasowa, tym wyższy wynik
    return Math.max(0, 20 - timeDiff);
  };

  const assignTimeSlots = (todos) => {
    let currentTime = 8 * 60; // 8:00 AM w minutach
    const schedule = [];
    
    todos.forEach((todo, index) => {
      const estimatedDuration = (todo.estimatedHours || 2) * 60; // w minutach
      const travelTime = todo.location?.estimatedTravelTime || 30;
      const bufferTime = todo.scheduling?.travelBuffer || 15;
      
      if (index > 0) {
        currentTime += travelTime + bufferTime;
      }
      
      const startTime = currentTime;
      const endTime = currentTime + estimatedDuration;
      
      const preferredTime = getClientPreferredTimeScore(todo.clientData?.preferredContactTime) * 60;
      const timeConflict = Math.abs(startTime - preferredTime) > 120; // 2 godziny tolerancji
      
      schedule.push({
        ...todo,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        scheduledStartTimeFormatted: formatTime(startTime),
        scheduledEndTimeFormatted: formatTime(endTime),
        timeConflict,
        isOptimalTime: !timeConflict && Math.abs(startTime - preferredTime) <= 60,
        travelTimeToNext: index < todos.length - 1 ? (todos[index + 1].location?.estimatedTravelTime || 30) : 0
      });
      
      currentTime = endTime;
    });
    
    return schedule;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateMetrics = (schedule) => {
    if (schedule.length === 0) return {};
    
    const totalWorkTime = schedule.reduce((sum, todo) => 
      sum + ((todo.estimatedHours || 2) * 60), 0
    );
    
    const totalTravelTime = schedule.reduce((sum, todo) => 
      sum + (todo.location?.estimatedTravelTime || 0), 0
    );
    
    const totalDistance = schedule.reduce((sum, todo) => 
      sum + (todo.location?.distanceFromBase || 0), 0
    );
    
    const timeConflicts = schedule.filter(todo => todo.timeConflict).length;
    const optimalTimes = schedule.filter(todo => todo.isOptimalTime).length;
    
    const efficiency = totalWorkTime / (totalWorkTime + totalTravelTime) * 100;
    
    const lastTodo = schedule[schedule.length - 1];
    const dayEndTime = lastTodo.scheduledEndTime + (lastTodo.travelTimeToNext || 0);
    
    return {
      totalTasks: schedule.length,
      totalWorkTime: Math.round(totalWorkTime / 60 * 10) / 10,
      totalTravelTime: Math.round(totalTravelTime / 60 * 10) / 10,
      totalDistance: Math.round(totalDistance * 10) / 10,
      efficiency: Math.round(efficiency),
      timeConflicts,
      optimalTimes,
      dayStartTime: formatTime(schedule[0]?.scheduledStartTime || 480),
      dayEndTime: formatTime(dayEndTime),
      averageRating: schedule.reduce((sum, todo) => 
        sum + (todo.clientHistory?.averageRating || 0), 0) / schedule.length
    };
  };

  const getConflicts = () => {
    return optimizedSchedule.filter(todo => todo.timeConflict);
  };

  const regenerateSchedule = () => {
    generateOptimizedSchedule();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Inteligentny Harmonogram</h2>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={regenerateSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Zap className="h-4 w-4" />
              Zoptymalizuj ponownie
            </button>
          </div>
        </div>

        {/* Metryki harmonogramu */}
        {Object.keys(scheduleMetrics).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-blue-600">Zadania</p>
                  <p className="text-lg font-bold text-blue-900">{scheduleMetrics.totalTasks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-green-600">Praca</p>
                  <p className="text-lg font-bold text-green-900">{scheduleMetrics.totalWorkTime}h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center">
                <Navigation className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-orange-600">Podróż</p>
                  <p className="text-lg font-bold text-orange-900">{scheduleMetrics.totalTravelTime}h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center">
                <Route className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-purple-600">Dystans</p>
                  <p className="text-lg font-bold text-purple-900">{scheduleMetrics.totalDistance}km</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-indigo-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-indigo-600">Efektywność</p>
                  <p className="text-lg font-bold text-indigo-900">{scheduleMetrics.efficiency}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-yellow-600">Konflikty</p>
                  <p className="text-lg font-bold text-yellow-900">{scheduleMetrics.timeConflicts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-emerald-600">Optymalne</p>
                  <p className="text-lg font-bold text-emerald-900">{scheduleMetrics.optimalTimes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-rose-50 rounded-lg p-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-rose-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-rose-600">Czas pracy</p>
                  <p className="text-sm font-bold text-rose-900">{scheduleMetrics.dayStartTime}-{scheduleMetrics.dayEndTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Konflikty czasowe */}
        {scheduleMetrics.timeConflicts > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Wykryto konflikty czasowe</h3>
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className="text-sm text-yellow-600 hover:text-yellow-700 underline"
              >
                {showConflicts ? 'Ukryj' : 'Pokaż szczegóły'}
              </button>
            </div>
            
            {showConflicts && (
              <div className="space-y-2">
                {getConflicts().map(todo => (
                  <div key={todo.id} className="text-sm text-yellow-700">
                    <span className="font-medium">{todo.title}</span> - 
                    zaplanowane na {todo.scheduledStartTimeFormatted}, 
                    ale klient preferuje: {todo.clientData?.preferredContactTime}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Harmonogram */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Zoptymalizowane zadania na {new Date(selectedDate).toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        {optimizedSchedule.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Brak zadań na wybrany dzień</p>
          </div>
        ) : (
          <div className="divide-y">
            {optimizedSchedule.map((todo, index) => (
              <div key={todo.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Czas */}
                  <div className="flex-shrink-0 w-24">
                    <div className="text-lg font-bold text-gray-900">
                      {todo.scheduledStartTimeFormatted}
                    </div>
                    <div className="text-sm text-gray-500">
                      {todo.scheduledEndTimeFormatted}
                    </div>
                  </div>
                  
                  {/* Linia czasu */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${
                      todo.isOptimalTime ? 'bg-green-400' : 
                      todo.timeConflict ? 'bg-red-400' : 'bg-blue-400'
                    }`}></div>
                    {index < optimizedSchedule.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  
                  {/* Zawartość */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{todo.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                        todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {todo.priority === 'high' ? 'Wysoki' : 
                         todo.priority === 'medium' ? 'Średni' : 'Niski'}
                      </span>
                      {todo.isOptimalTime && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Optymalny czas
                        </span>
                      )}
                      {todo.timeConflict && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Konflikt czasowy
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{todo.description}</p>
                    
                    {/* Informacje o kliencie */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{todo.clientData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{todo.location?.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-gray-400" />
                        <span>{todo.location?.distanceFromBase}km, {Math.round(todo.location?.estimatedTravelTime)}min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Szacowany czas: {todo.estimatedHours}h</span>
                      </div>
                    </div>
                    
                    {/* Informacje o podróży do następnego */}
                    {todo.travelTimeToNext > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <Navigation className="h-4 w-4 inline mr-1" />
                        Podróż do następnego zadania: {Math.round(todo.travelTimeToNext)}min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartScheduler;