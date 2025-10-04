import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TechnicianLayout from '../../components/TechnicianLayout';

export default function TechnicianCalendar() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      setEmployee(JSON.parse(employeeData));
    } catch (err) {
      console.error('Error parsing employee data:', err);
      router.push('/technician/login');
    }
  }, []);

  // Load visits
  useEffect(() => {
    if (employee) {
      loadVisits();
    }
  }, [employee, currentDate]);

  const loadVisits = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch('/api/technician/visits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd pobierania wizyt');
      }

      setVisits(data.visits || []);
    } catch (err) {
      console.error('Error loading visits:', err);
      setError(err.message || 'Błąd ładowania wizyt');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('technicianToken');
    localStorage.removeItem('technicianEmployee');
    router.push('/technician/login');
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getVisitsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return visits.filter(visit => visit.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-500',
      on_way: 'bg-yellow-500',
      in_progress: 'bg-green-500',
      paused: 'bg-orange-500',
      completed: 'bg-gray-400',
      cancelled: 'bg-red-500',
      rescheduled: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Zaplanowana',
      on_way: 'W drodze',
      in_progress: 'W trakcie',
      paused: 'Wstrzymana',
      completed: 'Zakończona',
      cancelled: 'Anulowana',
      rescheduled: 'Przełożona'
    };
    return labels[status] || status;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      });
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedDateVisits = getVisitsForDate(selectedDate);

  if (loading && visits.length === 0) {
    return (
      <TechnicianLayout employee={employee} currentPage="calendar">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie kalendarza...</p>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="calendar">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kalendarz Wizyt</h1>
          <p className="text-gray-600">Przegląd wszystkich zaplanowanych wizyt</p>
        </div>

          {/* Calendar Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={previousMonth}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dziś
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day, index) => (
                    <div key={index} className="py-3 text-center text-sm font-semibold text-gray-700">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((dayObj, index) => {
                    const dayVisits = getVisitsForDate(dayObj.date);
                    const isToday = isSameDay(dayObj.date, new Date());
                    const isSelected = isSameDay(dayObj.date, selectedDate);

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(dayObj.date)}
                        className={`
                          min-h-[100px] p-2 border-b border-r border-gray-100 text-left hover:bg-gray-50 transition-colors
                          ${!dayObj.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                          ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                        `}
                      >
                        <div className={`
                          inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1
                          ${!dayObj.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                          ${isToday ? 'bg-blue-600 text-white' : ''}
                        `}>
                          {dayObj.day}
                        </div>

                        {dayVisits.length > 0 && (
                          <div className="space-y-1">
                            {dayVisits.slice(0, 2).map((visit, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded truncate ${getStatusColor(visit.status)} text-white`}
                              >
                                {formatTime(visit.time)} {visit.client?.name}
                              </div>
                            ))}
                            {dayVisits.length > 2 && (
                              <div className="text-xs text-gray-500 px-2">
                                +{dayVisits.length - 2} więcej
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected day details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {formatDate(selectedDate)}
                </h3>

                {selectedDateVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Brak wizyt w tym dniu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateVisits.map((visit) => (
                      <Link
                        key={visit.visitId}
                        href={`/technician/visit/${visit.visitId}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-1">{visit.client?.name}</p>
                            <p className="text-sm text-gray-600">{visit.client?.address}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)} text-white`}>
                            {getStatusLabel(visit.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(visit.time)}
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {visit.device?.type} {visit.device?.brand}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </TechnicianLayout>
  );
}