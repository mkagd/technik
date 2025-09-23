// pages/kalendarz-pracownika-nowy.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from 'react-calendar';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiLogOut,
  FiSave,
  FiX,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiSettings,
  FiHome,
  FiPause,
  FiPlay,
  FiRefreshCw
} from 'react-icons/fi';
import 'react-calendar/dist/Calendar.css';

export default function KalendarzPracownikaNowy() {
  const [employee, setEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week'); // week, month
  const [workSchedule, setWorkSchedule] = useState({});
  const [weekTemplate, setWeekTemplate] = useState({
    monday: { start: '08:00', end: '16:00', enabled: true, breaks: [] },
    tuesday: { start: '08:00', end: '16:00', enabled: true, breaks: [] },
    wednesday: { start: '08:00', end: '16:00', enabled: true, breaks: [] },
    thursday: { start: '08:00', end: '16:00', enabled: true, breaks: [] },
    friday: { start: '08:00', end: '16:00', enabled: true, breaks: [] },
    saturday: { start: '09:00', end: '14:00', enabled: false, breaks: [] },
    sunday: { start: '10:00', end: '14:00', enabled: false, breaks: [] }
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const daysOfWeek = [
    { key: 'monday', name: 'Poniedziałek', short: 'Pon' },
    { key: 'tuesday', name: 'Wtorek', short: 'Wt' },
    { key: 'wednesday', name: 'Środa', short: 'Śr' },
    { key: 'thursday', name: 'Czwartek', short: 'Czw' },
    { key: 'friday', name: 'Piątek', short: 'Pt' },
    { key: 'saturday', name: 'Sobota', short: 'Sob' },
    { key: 'sunday', name: 'Niedziela', short: 'Ndz' }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }

      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);

      // Załaduj zapisany harmonogram
      const savedSchedule = localStorage.getItem(`workSchedule_${employeeData.id}`);
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      }

      // Załaduj szablon tygodniowy
      const savedTemplate = localStorage.getItem(`weekTemplate_${employeeData.id}`);
      if (savedTemplate) {
        setWeekTemplate(JSON.parse(savedTemplate));
      }

      setIsLoading(false);
    }
  }, [router]);

  const saveWorkSchedule = () => {
    if (employee) {
      localStorage.setItem(`workSchedule_${employee.id}`, JSON.stringify(workSchedule));
      localStorage.setItem(`weekTemplate_${employee.id}`, JSON.stringify(weekTemplate));
      alert('Harmonogram pracy został zapisany!');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getCurrentWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Poniedziałek jako pierwszy dzień
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const addBreak = (dayKey, date = null) => {
    const newBreak = {
      id: Date.now(),
      start: '12:00',
      end: '13:00',
      name: 'Przerwa obiadowa'
    };

    if (date) {
      // Dodaj przerwę do konkretnego dnia
      const dateKey = getDateKey(date);
      setWorkSchedule(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          breaks: [...(prev[dateKey]?.breaks || []), newBreak]
        }
      }));
    } else {
      // Dodaj przerwę do szablonu tygodniowego
      setWeekTemplate(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          breaks: [...prev[dayKey].breaks, newBreak]
        }
      }));
    }
  };

  const removeBreak = (dayKey, breakId, date = null) => {
    if (date) {
      const dateKey = getDateKey(date);
      setWorkSchedule(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          breaks: prev[dateKey]?.breaks?.filter(b => b.id !== breakId) || []
        }
      }));
    } else {
      setWeekTemplate(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          breaks: prev[dayKey].breaks.filter(b => b.id !== breakId)
        }
      }));
    }
  };

  const updateBreak = (dayKey, breakId, field, value, date = null) => {
    if (date) {
      const dateKey = getDateKey(date);
      setWorkSchedule(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          breaks: prev[dateKey]?.breaks?.map(b => 
            b.id === breakId ? { ...b, [field]: value } : b
          ) || []
        }
      }));
    } else {
      setWeekTemplate(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          breaks: prev[dayKey].breaks.map(b => 
            b.id === breakId ? { ...b, [field]: value } : b
          )
        }
      }));
    }
  };

  const applyTemplateToWeek = () => {
    const weekDates = getCurrentWeekDates();
    const newSchedule = { ...workSchedule };

    weekDates.forEach((date, index) => {
      const dayKey = daysOfWeek[index].key;
      const dateKey = getDateKey(date);
      const template = weekTemplate[dayKey];

      if (template.enabled) {
        newSchedule[dateKey] = {
          start: template.start,
          end: template.end,
          enabled: template.enabled,
          breaks: [...template.breaks]
        };
      }
    });

    setWorkSchedule(newSchedule);
  };

  const applyTemplateToMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const newSchedule = { ...workSchedule };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dayKey = daysOfWeek[dayOfWeek === 0 ? 6 : dayOfWeek - 1].key;
      const template = weekTemplate[dayKey];
      const dateKey = getDateKey(date);

      if (template.enabled) {
        newSchedule[dateKey] = {
          start: template.start,
          end: template.end,
          enabled: template.enabled,
          breaks: [...template.breaks]
        };
      }
    }

    setWorkSchedule(newSchedule);
  };

  const getDaySchedule = (date) => {
    const dateKey = getDateKey(date);
    const dayOfWeek = date.getDay();
    const dayKey = daysOfWeek[dayOfWeek === 0 ? 6 : dayOfWeek - 1].key;
    
    return workSchedule[dateKey] || weekTemplate[dayKey];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie kalendarza...</p>
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
              <FiCalendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Kalendarz Pracy
                </h1>
                <p className="text-sm text-gray-600">
                  {employee?.firstName} {employee?.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FiHome className="h-5 w-5 mr-2" />
                Panel
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
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Zarządzanie harmonogramem</h2>
              <div className="flex rounded-lg border border-gray-300">
                <button
                  onClick={() => setCurrentView('week')}
                  className={`px-4 py-2 text-sm font-medium ${
                    currentView === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Tydzień
                </button>
                <button
                  onClick={() => setCurrentView('month')}
                  className={`px-4 py-2 text-sm font-medium ${
                    currentView === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Miesiąc
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiSettings className="h-4 w-4 mr-2" />
                Szablon tygodniowy
              </button>
              <button
                onClick={applyTemplateToWeek}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiCopy className="h-4 w-4 mr-2" />
                Zastosuj na tydzień
              </button>
              <button
                onClick={applyTemplateToMonth}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Zastosuj na miesiąc
              </button>
              <button
                onClick={saveWorkSchedule}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiSave className="h-4 w-4 mr-2" />
                Zapisz
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Calendar Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                className="w-full border-none"
                tileClassName={({ date }) => {
                  const schedule = getDaySchedule(date);
                  if (schedule?.enabled) {
                    return 'bg-blue-100 text-blue-900 hover:bg-blue-200';
                  }
                  return 'hover:bg-gray-100';
                }}
              />
            </div>
          </div>

          {/* Schedule Content */}
          <div className="lg:col-span-3">
            {currentView === 'week' ? (
              <WeekView 
                weekDates={getCurrentWeekDates()}
                daysOfWeek={daysOfWeek}
                workSchedule={workSchedule}
                setWorkSchedule={setWorkSchedule}
                getDaySchedule={getDaySchedule}
                getDateKey={getDateKey}
                addBreak={addBreak}
                removeBreak={removeBreak}
                updateBreak={updateBreak}
              />
            ) : (
              <MonthView 
                selectedDate={selectedDate}
                daysOfWeek={daysOfWeek}
                workSchedule={workSchedule}
                setWorkSchedule={setWorkSchedule}
                getDaySchedule={getDaySchedule}
                getDateKey={getDateKey}
                addBreak={addBreak}
                removeBreak={removeBreak}
                updateBreak={updateBreak}
              />
            )}
          </div>
        </div>
      </main>

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          weekTemplate={weekTemplate}
          setWeekTemplate={setWeekTemplate}
          daysOfWeek={daysOfWeek}
          onClose={() => setShowTemplateModal(false)}
          addBreak={addBreak}
          removeBreak={removeBreak}
          updateBreak={updateBreak}
        />
      )}
    </div>
  );
}

// Week View Component
function WeekView({ weekDates, daysOfWeek, workSchedule, setWorkSchedule, getDaySchedule, getDateKey, addBreak, removeBreak, updateBreak }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Harmonogram tygodniowy
        </h3>
        <p className="text-sm text-gray-600">
          {weekDates[0].toLocaleDateString('pl-PL')} - {weekDates[6].toLocaleDateString('pl-PL')}
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {weekDates.map((date, index) => {
            const dayKey = daysOfWeek[index].key;
            const dayName = daysOfWeek[index].name;
            const dateKey = getDateKey(date);
            const schedule = getDaySchedule(date);

            return (
              <DayScheduleCard
                key={dateKey}
                date={date}
                dayKey={dayKey}
                dayName={dayName}
                schedule={schedule}
                onUpdate={(field, value) => {
                  setWorkSchedule(prev => ({
                    ...prev,
                    [dateKey]: {
                      ...prev[dateKey],
                      [field]: value
                    }
                  }));
                }}
                onAddBreak={() => addBreak(dayKey, date)}
                onRemoveBreak={(breakId) => removeBreak(dayKey, breakId, date)}
                onUpdateBreak={(breakId, field, value) => updateBreak(dayKey, breakId, field, value, date)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Month View Component  
function MonthView({ selectedDate, daysOfWeek, workSchedule, setWorkSchedule, getDaySchedule, getDateKey, addBreak, removeBreak, updateBreak }) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Poniedziałek = 0

  const calendarDays = [];
  
  // Dodaj puste dni z poprzedniego miesiąca
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // Dodaj dni bieżącego miesiąca
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Harmonogram miesięczny - {selectedDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      <div className="p-6">
        {/* Header z dniami tygodnia */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {daysOfWeek.map(day => (
            <div key={day.key} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
              {day.short}
            </div>
          ))}
        </div>

        {/* Kalendarz */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => (
            <MonthDayCard
              key={index}
              date={date}
              schedule={date ? getDaySchedule(date) : null}
              onClick={() => {
                if (date) {
                  // Otwórz szczegóły dnia
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Day Schedule Card Component
function DayScheduleCard({ date, dayKey, dayName, schedule, onUpdate, onAddBreak, onRemoveBreak, onUpdateBreak }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium text-gray-900">{dayName}</h4>
          <span className="text-sm text-gray-500">
            {date.toLocaleDateString('pl-PL')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={schedule?.enabled || false}
              onChange={(e) => onUpdate('enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Praca</span>
          </label>
        </div>
      </div>

      {schedule?.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rozpoczęcie
              </label>
              <input
                type="time"
                value={schedule.start || '08:00'}
                onChange={(e) => onUpdate('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Zakończenie
              </label>
              <input
                type="time"
                value={schedule.end || '16:00'}
                onChange={(e) => onUpdate('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Przerwy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Przerwy</span>
              <button
                onClick={onAddBreak}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <FiPlus className="h-4 w-4 mr-1" />
                Dodaj
              </button>
            </div>
            
            {schedule.breaks && schedule.breaks.length > 0 ? (
              <div className="space-y-2">
                {schedule.breaks.map(breakItem => (
                  <div key={breakItem.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <input
                      type="text"
                      value={breakItem.name}
                      onChange={(e) => onUpdateBreak(breakItem.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Nazwa przerwy"
                    />
                    <input
                      type="time"
                      value={breakItem.start}
                      onChange={(e) => onUpdateBreak(breakItem.id, 'start', e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={breakItem.end}
                      onChange={(e) => onUpdateBreak(breakItem.id, 'end', e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => onRemoveBreak(breakItem.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Brak przerw</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Month Day Card Component
function MonthDayCard({ date, schedule }) {
  if (!date) {
    return <div className="h-20 bg-gray-50 rounded"></div>;
  }

  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className={`h-20 p-2 border rounded cursor-pointer ${
      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="text-sm font-medium text-gray-900">{date.getDate()}</div>
      {schedule?.enabled && (
        <div className="mt-1">
          <div className="text-xs text-blue-600 font-medium">
            {schedule.start} - {schedule.end}
          </div>
          {schedule.breaks && schedule.breaks.length > 0 && (
            <div className="text-xs text-gray-500">
              {schedule.breaks.length} przerw{schedule.breaks.length > 1 ? 'y' : 'a'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ weekTemplate, setWeekTemplate, daysOfWeek, onClose, addBreak, removeBreak, updateBreak }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Szablon tygodniowy
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {daysOfWeek.map(day => (
              <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{day.name}</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={weekTemplate[day.key]?.enabled || false}
                      onChange={(e) => setWeekTemplate(prev => ({
                        ...prev,
                        [day.key]: {
                          ...prev[day.key],
                          enabled: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dzień roboczy</span>
                  </label>
                </div>

                {weekTemplate[day.key]?.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Rozpoczęcie
                        </label>
                        <input
                          type="time"
                          value={weekTemplate[day.key]?.start || '08:00'}
                          onChange={(e) => setWeekTemplate(prev => ({
                            ...prev,
                            [day.key]: {
                              ...prev[day.key],
                              start: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Zakończenie
                        </label>
                        <input
                          type="time"
                          value={weekTemplate[day.key]?.end || '16:00'}
                          onChange={(e) => setWeekTemplate(prev => ({
                            ...prev,
                            [day.key]: {
                              ...prev[day.key],
                              end: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Przerwy w szablonie */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Przerwy</span>
                        <button
                          onClick={() => addBreak(day.key)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          <FiPlus className="h-4 w-4 mr-1" />
                          Dodaj
                        </button>
                      </div>
                      
                      {weekTemplate[day.key]?.breaks && weekTemplate[day.key].breaks.length > 0 ? (
                        <div className="space-y-2">
                          {weekTemplate[day.key].breaks.map(breakItem => (
                            <div key={breakItem.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                              <input
                                type="text"
                                value={breakItem.name}
                                onChange={(e) => updateBreak(day.key, breakItem.id, 'name', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Nazwa przerwy"
                              />
                              <input
                                type="time"
                                value={breakItem.start}
                                onChange={(e) => updateBreak(day.key, breakItem.id, 'start', e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={breakItem.end}
                                onChange={(e) => updateBreak(day.key, breakItem.id, 'end', e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              <button
                                onClick={() => removeBreak(day.key, breakItem.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Brak przerw</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}