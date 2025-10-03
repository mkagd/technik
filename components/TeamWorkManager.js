import React, { useState, useEffect } from 'react';
import { Users, Calendar, MapPin, Clock, AlertTriangle, CheckCircle, Plus, Filter, Search, Route, Zap, Phone, MessageCircle, Settings } from 'lucide-react';

const TeamWorkManager = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  useEffect(() => {
    loadTeamData();
    loadUnassignedTasks();
  }, []);

  const loadTeamData = () => {
    const team = [
      {
        id: 'USER_001',
        name: 'Jan Kowalski',
        role: 'Technik Senior',
        skills: ['AGD', 'RTV', 'Elektronika', 'Gwarancja'],
        skillLevels: { 'AGD': 5, 'RTV': 4, 'Elektronika': 5, 'Gwarancja': 4 },
        availability: {
          [selectedDate]: { start: '08:00', end: '16:00', breaks: ['12:00-13:00'] }
        },
        currentLocation: { lat: 50.8661, lng: 20.6286, address: 'Kielce centrum' },
        workload: {
          today: { assigned: 5, completed: 2, remaining: 3 },
          week: { assigned: 23, completed: 18, remaining: 5 }
        },
        performance: {
          averageRating: 4.8,
          completionRate: 95,
          onTimeRate: 90,
          customerSatisfaction: 4.9
        },
        schedule: [
          { id: 'T001', time: '08:00-10:00', task: 'Naprawa pralki - ul. Wesoła', status: 'completed' },
          { id: 'T002', time: '10:30-12:00', task: 'Serwis lodówki - ul. Krakowska', status: 'completed' },
          { id: 'T003', time: '14:00-16:00', task: 'Wymiana części AGD - ul. Sienkiewicza', status: 'assigned' },
          { id: 'T004', time: '16:30-18:00', task: 'Diagnostyka TV - ul. Warszawska', status: 'assigned' }
        ],
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'USER_002',
        name: 'Marek Nowak',
        role: 'Technik IT',
        skills: ['IT', 'Sieci', 'Hardware', 'Software'],
        skillLevels: { 'IT': 5, 'Sieci': 5, 'Hardware': 4, 'Software': 4 },
        availability: {
          [selectedDate]: { start: '09:00', end: '17:00', breaks: ['13:00-14:00'] }
        },
        currentLocation: { lat: 50.9000, lng: 20.6500, address: 'Kielce - Szydłówek' },
        workload: {
          today: { assigned: 3, completed: 1, remaining: 2 },
          week: { assigned: 18, completed: 15, remaining: 3 }
        },
        performance: {
          averageRating: 4.6,
          completionRate: 88,
          onTimeRate: 92,
          customerSatisfaction: 4.7
        },
        schedule: [
          { id: 'T005', time: '09:00-12:00', task: 'Instalacja sieci - Firma ABC', status: 'in-progress' },
          { id: 'T006', time: '14:00-17:00', task: 'Konfiguracja serwerów - TechMax', status: 'assigned' }
        ],
        status: 'busy',
        lastSeen: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'USER_003',
        name: 'Anna Wójcik',
        role: 'Koordynator',
        skills: ['Zarządzanie', 'Planowanie', 'Komunikacja', 'Analiza'],
        skillLevels: { 'Zarządzanie': 5, 'Planowanie': 5, 'Komunikacja': 5, 'Analiza': 4 },
        availability: {
          [selectedDate]: { start: '08:00', end: '16:00', breaks: ['12:00-13:00'] }
        },
        currentLocation: { lat: 50.8500, lng: 20.6100, address: 'Biuro główne' },
        workload: {
          today: { assigned: 8, completed: 5, remaining: 3 },
          week: { assigned: 35, completed: 30, remaining: 5 }
        },
        performance: {
          averageRating: 4.9,
          completionRate: 98,
          onTimeRate: 95,
          customerSatisfaction: 4.8
        },
        schedule: [
          { id: 'T007', time: '08:00-09:00', task: 'Planowanie tras zespołu', status: 'completed' },
          { id: 'T008', time: '09:00-11:00', task: 'Koordynacja zleceń pilnych', status: 'completed' },
          { id: 'T009', time: '11:00-12:00', task: 'Analiza wydajności zespołu', status: 'in-progress' },
          { id: 'T010', time: '14:00-16:00', task: 'Przygotowanie raportu', status: 'assigned' }
        ],
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'USER_004',
        name: 'Piotr Zieliński',
        role: 'Technik mobilny',
        skills: ['AGD', 'Naprawa mobilna', 'Diagnostyka', 'Gwarancja'],
        skillLevels: { 'AGD': 4, 'Naprawa mobilna': 5, 'Diagnostyka': 4, 'Gwarancja': 3 },
        availability: {
          [selectedDate]: { start: '07:00', end: '15:00', breaks: ['11:00-11:30'] }
        },
        currentLocation: { lat: 50.7800, lng: 20.5500, address: 'W drodze - Pacanów' },
        workload: {
          today: { assigned: 4, completed: 3, remaining: 1 },
          week: { assigned: 20, completed: 18, remaining: 2 }
        },
        performance: {
          averageRating: 4.5,
          completionRate: 90,
          onTimeRate: 85,
          customerSatisfaction: 4.6
        },
        schedule: [
          { id: 'T011', time: '07:00-09:00', task: 'Naprawa TV - Busko-Zdrój', status: 'completed' },
          { id: 'T012', time: '09:30-11:00', task: 'Serwis pralki - Wiślica', status: 'completed' },
          { id: 'T013', time: '11:30-13:00', task: 'Wymiana części - Pacanów', status: 'completed' },
          { id: 'T014', time: '14:00-15:00', task: 'Diagnostyka AGD - Pacanów', status: 'in-progress' }
        ],
        status: 'away',
        lastSeen: new Date(Date.now() - 300000).toISOString()
      }
    ];
    
    setTeamMembers(team);
  };

  const loadUnassignedTasks = () => {
    const tasks = [
      {
        id: 'UNASSIGNED_001',
        title: 'Naprawa zmywarki Bosch',
        description: 'Nie włącza się, prawdopodobnie problem z elektroniką',
        priority: 'high',
        requiredSkills: ['AGD', 'Elektronika'],
        estimatedDuration: 120, // minuty
        client: {
          name: 'Maria Kowalczyk',
          address: 'ul. Paderewskiego 15, Kielce',
          phone: '+48 123 456 789',
          coordinates: { lat: 50.8700, lng: 20.6300 }
        },
        preferredTime: 'Po 14:00',
        urgency: 'Dzisiaj',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        tags: ['gwarancja', 'pilne']
      },
      {
        id: 'UNASSIGNED_002',
        title: 'Instalacja systemu monitoringu',
        description: 'Instalacja 8 kamer IP w biurze firmy',
        priority: 'medium',
        requiredSkills: ['IT', 'Sieci'],
        estimatedDuration: 300,
        client: {
          name: 'Firma XYZ Sp. z o.o.',
          address: 'ul. Przemysłowa 22, Kielce',
          phone: '+48 987 654 321',
          coordinates: { lat: 50.8800, lng: 20.6400 }
        },
        preferredTime: 'Godziny biurowe',
        urgency: 'W tym tygodniu',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        tags: ['instalacja', 'firma']
      },
      {
        id: 'UNASSIGNED_003',
        title: 'Serwis klimatyzacji',
        description: 'Przegląd i czyszczenie jednostki zewnętrznej',
        priority: 'low',
        requiredSkills: ['AGD', 'Klimatyzacja'],
        estimatedDuration: 90,
        client: {
          name: 'Andrzej Nowak',
          address: 'ul. Słowackiego 8, Kielce',
          phone: '+48 555 666 777',
          coordinates: { lat: 50.8600, lng: 20.6200 }
        },
        preferredTime: 'Rano',
        urgency: 'Następny tydzień',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        tags: ['serwis', 'klimatyzacja']
      },
      {
        id: 'UNASSIGNED_004',
        title: 'Naprawa laptopa Dell',
        description: 'Nie uruchamia się system, podejrzewany dysk',
        priority: 'high',
        requiredSkills: ['IT', 'Hardware'],
        estimatedDuration: 150,
        client: {
          name: 'Student - Paweł Wiśniewski',
          address: 'ul. Jagiellońska 12, Kielce',
          phone: '+48 111 222 333',
          coordinates: { lat: 50.8650, lng: 20.6150 }
        },
        preferredTime: 'Po zajęciach - po 16:00',
        urgency: 'Jutro',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        tags: ['laptop', 'student', 'pilne']
      },
      {
        id: 'UNASSIGNED_005',
        title: 'Konfiguracja drukarki sieciowej',
        description: 'Podłączenie i konfiguracja drukarki w sieci firmowej',
        priority: 'low',
        requiredSkills: ['IT', 'Sieci'],
        estimatedDuration: 60,
        client: {
          name: 'Kancelaria Prawna "Lex"',
          address: 'ul. Sienkiewicza 33, Kielce',
          phone: '+48 444 555 666',
          coordinates: { lat: 50.8720, lng: 20.6280 }
        },
        preferredTime: 'Godziny biurowe',
        urgency: 'Kiedy będzie czas',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        tags: ['drukarka', 'konfiguracja']
      }
    ];
    
    setUnassignedTasks(tasks);
  };

  const calculateTaskScore = (task, member) => {
    let score = 0;
    
    // Dopasowanie umiejętności (0-50 punktów)
    const skillMatch = task.requiredSkills.reduce((sum, skill) => {
      const level = member.skillLevels[skill] || 0;
      return sum + level;
    }, 0);
    score += Math.min(skillMatch * 10, 50);
    
    // Odległość (0-20 punktów)
    const distance = calculateDistance(
      member.currentLocation.lat,
      member.currentLocation.lng,
      task.client.coordinates.lat,
      task.client.coordinates.lng
    );
    const distanceScore = Math.max(0, 20 - distance);
    score += distanceScore;
    
    // Obciążenie pracą (0-15 punktów)
    const workloadScore = Math.max(0, 15 - member.workload.today.remaining * 3);
    score += workloadScore;
    
    // Wydajność (0-10 punktów)
    score += (member.performance.completionRate / 100) * 10;
    
    // Priorytet zadania (0-5 punktów)
    const priorityScore = task.priority === 'high' ? 5 : task.priority === 'medium' ? 3 : 1;
    score += priorityScore;
    
    return Math.round(score);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getBestMatches = (task) => {
    return teamMembers
      .map(member => ({
        ...member,
        score: calculateTaskScore(task, member),
        distance: calculateDistance(
          member.currentLocation.lat,
          member.currentLocation.lng,
          task.client.coordinates.lat,
          task.client.coordinates.lng
        ).toFixed(1)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const assignTask = (taskId, memberId, timeSlot) => {
    const task = unassignedTasks.find(t => t.id === taskId);
    const member = teamMembers.find(m => m.id === memberId);
    
    if (!task || !member) return;
    
    // Dodaj zadanie do harmonogramu członka zespołu
    const updatedMembers = teamMembers.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          schedule: [...m.schedule, {
            id: taskId,
            time: timeSlot,
            task: task.title,
            status: 'assigned',
            client: task.client.name,
            address: task.client.address
          }],
          workload: {
            ...m.workload,
            today: {
              ...m.workload.today,
              assigned: m.workload.today.assigned + 1,
              remaining: m.workload.today.remaining + 1
            }
          }
        };
      }
      return m;
    });
    
    // Usuń zadanie z nieprzydzielonych
    const updatedTasks = unassignedTasks.filter(t => t.id !== taskId);
    
    setTeamMembers(updatedMembers);
    setUnassignedTasks(updatedTasks);
    setShowAssignModal(false);
    setSelectedTask(null);
  };

  const autoAssignTasks = () => {
    let tasksToAssign = [...unassignedTasks];
    let updatedMembers = [...teamMembers];
    
    // Sortuj zadania według priorytetu
    tasksToAssign.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    tasksToAssign.forEach(task => {
      const bestMatches = getBestMatches(task);
      const bestMember = bestMatches[0];
      
      if (bestMember && bestMember.score > 60) { // Próg akceptacji
        // Znajdź dostępny slot czasowy
        const suggestedTime = findAvailableTimeSlot(bestMember, task.estimatedDuration);
        
        if (suggestedTime) {
          assignTask(task.id, bestMember.id, suggestedTime);
        }
      }
    });
  };

  const findAvailableTimeSlot = (member, duration) => {
    // Prosta logika znajdowania wolnego czasu
    const availability = member.availability[selectedDate];
    if (!availability) return null;
    
    const startTime = availability.start;
    const endTime = availability.end;
    
    // Sprawdź czy jest miejsce po ostatnim zadaniu
    const lastTask = member.schedule[member.schedule.length - 1];
    if (lastTask) {
      const lastEndTime = lastTask.time.split('-')[1];
      const suggestedStart = addMinutes(lastEndTime, 30); // 30 min buffer
      const suggestedEnd = addMinutes(suggestedStart, duration);
      
      if (suggestedEnd <= endTime) {
        return `${suggestedStart}-${suggestedEnd}`;
      }
    }
    
    return null;
  };

  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = unassignedTasks.filter(task => {
    if (filterSkill !== 'all' && !task.requiredSkills.includes(filterSkill)) return false;
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.client.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredMembers = teamMembers.filter(member => {
    if (filterStatus !== 'all' && member.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Nagłówek z kontrolami */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Zarządzanie zespołem</h2>
            <p className="text-gray-600">Przydzielanie zadań i koordynacja pracy</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={autoAssignTasks}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Zap className="h-4 w-4" />
              Auto-przydziel
            </button>
          </div>
        </div>
        
        {/* Statystyki zespołu */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Zespół</p>
                <p className="text-2xl font-bold text-blue-900">{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Nieprzydzielone</p>
                <p className="text-2xl font-bold text-red-900">{unassignedTasks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Ukończone dzisiaj</p>
                <p className="text-2xl font-bold text-green-900">
                  {teamMembers.reduce((sum, member) => sum + member.workload.today.completed, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">W trakcie</p>
                <p className="text-2xl font-bold text-purple-900">
                  {teamMembers.reduce((sum, member) => 
                    sum + member.schedule.filter(task => task.status === 'in-progress').length, 0
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Wydajność</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(teamMembers.reduce((sum, member) => sum + member.performance.completionRate, 0) / teamMembers.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nieprzydzielone zadania */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Nieprzydzielone zadania ({filteredTasks.length})
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                <Plus className="h-4 w-4" />
                Dodaj
              </button>
            </div>
            
            {/* Filtry */}
            <div className="flex gap-3 mb-4">
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Wszystkie umiejętności</option>
                <option value="AGD">AGD</option>
                <option value="IT">IT</option>
                <option value="RTV">RTV</option>
                <option value="Elektronika">Elektronika</option>
                <option value="Sieci">Sieci</option>
              </select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Szukaj zadań..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Brak nieprzydzielonych zadań</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'Pilne' : task.priority === 'medium' ? 'Średnie' : 'Niskie'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(task.estimatedDuration / 60)}h {task.estimatedDuration % 60}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{task.client.address}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">Umiejętności:</span>
                          {task.requiredSkills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Klient:</span> {task.client.name} | 
                          <span className="font-medium"> Preferowany czas:</span> {task.preferredTime}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowAssignModal(true);
                        }}
                        className="ml-4 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Przydziel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zespół */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Zespół</h3>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Wszyscy</option>
                <option value="online">Online</option>
                <option value="busy">Zajęci</option>
                <option value="away">Nieobecni</option>
              </select>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y">
              {filteredMembers.map(member => (
                <div key={member.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-green-600" title="Zadzwoń">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600" title="Wiadomość">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Umiejętności */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {skill} ({member.skillLevels[skill]}/5)
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Obciążenie */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="text-center">
                      <div className="text-green-600 font-semibold">{member.workload.today.completed}</div>
                      <div className="text-gray-500">Ukończone</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-semibold">{member.workload.today.remaining}</div>
                      <div className="text-gray-500">Pozostałe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-600 font-semibold">{member.performance.completionRate}%</div>
                      <div className="text-gray-500">Wydajność</div>
                    </div>
                  </div>
                  
                  {/* Obecne zadania */}
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium text-gray-700">Harmonogram:</h5>
                    {member.schedule.slice(-3).map((task, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{task.time}</span>
                        <span className={`px-2 py-1 rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status === 'completed' ? 'Ukończone' :
                           task.status === 'in-progress' ? 'W trakcie' : 'Przydzielone'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal przydzielania zadania */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Przydziel zadanie</h3>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedTask.title}</h4>
                <p className="text-gray-600 mb-2">{selectedTask.description}</p>
                <div className="text-sm text-gray-500">
                  <p><span className="font-medium">Klient:</span> {selectedTask.client.name}</p>
                  <p><span className="font-medium">Adres:</span> {selectedTask.client.address}</p>
                  <p><span className="font-medium">Czas:</span> {Math.floor(selectedTask.estimatedDuration / 60)}h {selectedTask.estimatedDuration % 60}m</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Najlepsze dopasowania:</h5>
                <div className="space-y-3">
                  {getBestMatches(selectedTask).map(member => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{member.score}</div>
                              <div className="text-xs text-gray-500">Dopasowanie</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{member.distance}km</div>
                              <div className="text-xs text-gray-500">Odległość</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Obciążenie: {member.workload.today.remaining} zadań pozostałych
                        </div>
                        <button
                          onClick={() => assignTask(selectedTask.id, member.id, '16:00-18:00')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Przydziel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkManager;