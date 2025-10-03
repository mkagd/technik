import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Building, Phone, Mail, Star, Navigation, Calendar, Filter, Search } from 'lucide-react';

const ClientTodoManager = () => {
  const [todos, setTodos] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [selectedTodo, setSelectedTodo] = useState(null);

  useEffect(() => {
    loadTodos();
    loadClients();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await fetch('/data/enhanced_employee_todos.json');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Błąd ładowania TODO:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/data/clients.json');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Błąd ładowania klientów:', error);
    }
  };

  const getUniqueValues = (field) => {
    const values = todos.map(todo => {
      if (field.includes('.')) {
        const parts = field.split('.');
        return todo[parts[0]]?.[parts[1]];
      }
      return todo[field];
    }).filter(Boolean);
    return [...new Set(values)];
  };

  const filteredAndSortedTodos = todos
    .filter(todo => {
      if (selectedEmployee !== 'all' && todo.employeeId !== selectedEmployee) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'completed' && !todo.completed) return false;
        if (filterStatus === 'pending' && todo.completed) return false;
        if (filterStatus === 'overdue' && (todo.completed || new Date(todo.dueDate) >= new Date())) return false;
      }
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
      if (filterCity !== 'all' && todo.location?.city !== filterCity) return false;
      if (searchTerm && !todo.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !todo.clientData?.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'distance':
          return (a.location?.distanceFromBase || 0) - (b.location?.distanceFromBase || 0);
        case 'clientRating':
          return (b.clientHistory?.averageRating || 0) - (a.clientHistory?.averageRating || 0);
        case 'travelTime':
          return (a.location?.estimatedTravelTime || 0) - (b.location?.estimatedTravelTime || 0);
        default:
          return 0;
      }
    });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (todo) => {
    if (todo.completed) return 'text-green-600 bg-green-50';
    if (new Date(todo.dueDate) < new Date()) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateOptimalRoute = (selectedTodos) => {
    if (selectedTodos.length === 0) return [];
    
    // Prosty algorytm najbliższego sąsiada dla optymalizacji trasy
    const remaining = [...selectedTodos];
    const route = [];
    let current = remaining.shift(); // Zaczynamy od pierwszego TODO
    route.push(current);
    
    while (remaining.length > 0) {
      let nearest = remaining[0];
      let nearestIndex = 0;
      let shortestDistance = Infinity;
      
      remaining.forEach((todo, index) => {
        const distance = todo.location?.distanceFromBase || 0;
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = todo;
          nearestIndex = index;
        }
      });
      
      route.push(nearest);
      remaining.splice(nearestIndex, 1);
      current = nearest;
    }
    
    return route;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTodos = filteredAndSortedTodos.filter(todo => 
      todo.dueDate === today || todo.scheduling?.suggestedDate === today
    );
    
    const totalTravelTime = todayTodos.reduce((sum, todo) => 
      sum + (todo.location?.estimatedTravelTime || 0), 0
    );
    
    const totalEstimatedHours = todayTodos.reduce((sum, todo) => 
      sum + (todo.estimatedHours || 0), 0
    );
    
    return {
      count: todayTodos.length,
      completed: todayTodos.filter(todo => todo.completed).length,
      totalTravelTime,
      totalEstimatedHours,
      todos: todayTodos
    };
  };

  const todayStats = getTodayStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek z statystykami */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Zarządzanie TODO z Klientami</h2>
        
        {/* Statystyki dzisiaj */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Dzisiaj</p>
                <p className="text-2xl font-bold text-blue-900">{todayStats.count}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Ukończone</p>
                <p className="text-2xl font-bold text-green-900">{todayStats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Podróż</p>
                <p className="text-2xl font-bold text-orange-900">{formatTime(todayStats.totalTravelTime)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Czas pracy</p>
                <p className="text-2xl font-bold text-purple-900">{todayStats.totalEstimatedHours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtry i wyszukiwanie */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Wszystkie</option>
              <option value="pending">Do zrobienia</option>
              <option value="completed">Ukończone</option>
              <option value="overdue">Przeterminowane</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorytet</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Wszystkie</option>
              <option value="high">Wysoki</option>
              <option value="medium">Średni</option>
              <option value="low">Niski</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Miasto</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Wszystkie</option>
              {getUniqueValues('location.city').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sortuj według</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="dueDate">Data wykonania</option>
              <option value="priority">Priorytet</option>
              <option value="distance">Odległość</option>
              <option value="clientRating">Ocena klienta</option>
              <option value="travelTime">Czas podróży</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Wyszukaj</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Szukaj po nazwie lub kliencie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista TODO */}
      <div className="space-y-4">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500">Brak TODO spełniających kryteria filtrowania.</p>
          </div>
        ) : (
          filteredAndSortedTodos.map(todo => (
            <div key={todo.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Nagłówek TODO */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                        {todo.priority === 'high' ? 'Wysoki' : todo.priority === 'medium' ? 'Średni' : 'Niski'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(todo)}`}>
                        {todo.completed ? 'Ukończone' : new Date(todo.dueDate) < new Date() ? 'Przeterminowane' : 'Do zrobienia'}
                      </span>
                      <span className="text-xs text-gray-500">#{todo.id}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{todo.title}</h3>
                    <p className="text-gray-600 mb-4">{todo.description}</p>
                    
                    {/* Informacje o kliencie */}
                    {todo.clientData && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {todo.clientData.isCompany ? (
                            <Building className="h-4 w-4 text-gray-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="font-medium text-gray-900">{todo.clientData.name}</span>
                          {todo.clientHistory?.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{todo.clientHistory.averageRating}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{todo.clientData.phone}</span>
                          </div>
                          {todo.clientData.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{todo.clientData.email}</span>
                            </div>
                          )}
                          {todo.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{todo.location.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Preferowany kontakt: {todo.clientData.preferredContactTime}</span>
                          </div>
                        </div>
                        
                        {todo.clientData.tags && todo.clientData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {todo.clientData.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Informacje o lokalizacji i czasie */}
                    {todo.location && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4" />
                          <span>{todo.location.distanceFromBase}km</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(todo.location.estimatedTravelTime)} podróży</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Termin: {new Date(todo.dueDate).toLocaleDateString('pl-PL')}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Harmonogram */}
                    {todo.scheduling && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-900">Sugerowany termin:</p>
                        <p className="text-sm text-blue-700">
                          {new Date(todo.scheduling.suggestedDate).toLocaleDateString('pl-PL')} 
                          {todo.scheduling.suggestedTimeSlot && `, ${todo.scheduling.suggestedTimeSlot}`}
                        </p>
                        {todo.scheduling.clientAvailability && (
                          <p className="text-xs text-blue-600 mt-1">
                            Dostępność klienta: {todo.scheduling.clientAvailability}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Historia klienta */}
                    {todo.clientHistory && todo.clientHistory.totalCompletedTasks > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        Historia: {todo.clientHistory.totalCompletedTasks} zadań ukończonych, 
                        średni czas: {todo.clientHistory.averageCompletionTime}h
                        {todo.clientHistory.notes && (
                          <span className="block mt-1 italic">"{todo.clientHistory.notes}"</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Akcje */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button 
                      onClick={() => setSelectedTodo(todo)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Szczegóły
                    </button>
                    {!todo.completed && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                        Oznacz jako gotowe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal szczegółów TODO */}
      {selectedTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Szczegóły TODO</h3>
                <button 
                  onClick={() => setSelectedTodo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedTodo.title}</h4>
                  <p className="text-gray-600 mt-1">{selectedTodo.description}</p>
                </div>
                
                {selectedTodo.clientData && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Informacje o kliencie</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedTodo.clientData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedTodo.location && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Lokalizacja</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedTodo.location, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedTodo.scheduling && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Harmonogram</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedTodo.scheduling, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTodoManager;