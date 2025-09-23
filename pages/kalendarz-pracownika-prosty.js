// pages/kalendarz-pr  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [timeInputs, setTimeInputs] = useState({ start: '07:00', end: '15:00' });
  const [expandedDay, setExpandedDay] = useState('');wnika-prosty.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiCalendar,
  FiClock,
  FiHome,
  FiLogOut,
  FiSave,
  FiCopy,
  FiRefreshCw,
  FiPlay,
  FiPause,
  FiX
} from 'react-icons/fi';

export default function KalendarzPracownikaProsty() {
  const [employee, setEmployee] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [workSchedule, setWorkSchedule] = useState({});
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [timeInputs, setTimeInputs] = useState({ start: '07:00', end: '15:00' });
  const [expandedDay, setExpandedDay] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const daysOfWeek = [
    { key: 'monday', name: 'Poniedziałek', short: 'PON' },
    { key: 'tuesday', name: 'Wtorek', short: 'WT' },
    { key: 'wednesday', name: 'Środa', short: 'ŚR' },
    { key: 'thursday', name: 'Czwartek', short: 'CZW' },
    { key: 'friday', name: 'Piątek', short: 'PT' },
    { key: 'saturday', name: 'Sobota', short: 'SOB' },
    { key: 'sunday', name: 'Niedziela', short: 'NDZ' }
  ];

  // Godziny co 30 minut od 7:00 do 22:00
  const timeSlots = [];
  for (let hour = 7; hour <= 22; hour++) {
    timeSlots.push({ hour, minute: 0, display: `${hour}:00` });
    if (hour < 22) {
      timeSlots.push({ hour, minute: 30, display: `${hour}:30` });
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }

      const employeeData = JSON.parse(employeeSession);
      setEmployee(employeeData);

      // Załaduj harmonogram
      const savedSchedule = localStorage.getItem(`simpleWorkSchedule_${employeeData.id}`);
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      } else {
        // Domyślny harmonogram (Pon-Pt 8:00-16:00)
        const defaultSchedule = {};
        daysOfWeek.slice(0, 5).forEach(day => {
          // Sloty od 8:00 do 16:00 (16 slotów po 30 min)
          const workSlots = [];
          const breakSlots = [];
          for (let hour = 8; hour < 16; hour++) {
            workSlots.push(`${hour}:00`);
            workSlots.push(`${hour}:30`);
            // Przerwa obiadowa 12:00-13:00
            if (hour === 12) {
              breakSlots.push(`${hour}:00`);
              breakSlots.push(`${hour}:30`);
            }
          }
          defaultSchedule[day.key] = {
            enabled: true,
            slots: workSlots,
            breaks: breakSlots
          };
        });
        // Weekend wyłączony
        daysOfWeek.slice(5).forEach(day => {
          defaultSchedule[day.key] = {
            enabled: false,
            hours: [],
            breaks: []
          };
        });
        setWorkSchedule(defaultSchedule);
      }

      setIsLoading(false);
    }
  }, [router]);

  const saveSchedule = () => {
    if (employee) {
      localStorage.setItem(`simpleWorkSchedule_${employee.id}`, JSON.stringify(workSchedule));
      alert('Harmonogram został zapisany!');
    }
  };

  const clearSchedule = () => {
    if (confirm('Czy na pewno chcesz wyczyścić cały harmonogram?')) {
      setWorkSchedule({});
      if (employee) {
        localStorage.removeItem(`simpleWorkSchedule_${employee.id}`);
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  const toggleSlot = (dayKey, slotKey) => {
    setWorkSchedule(prev => {
      const daySchedule = prev[dayKey] || { enabled: false, slots: [], breaks: [] };
      const slots = daySchedule.slots || [];
      
      let newSlots;
      if (slots.includes(slotKey)) {
        // Usuń slot
        newSlots = slots.filter(s => s !== slotKey);
      } else {
        // Dodaj slot
        newSlots = [...slots, slotKey].sort();
      }

      return {
        ...prev,
        [dayKey]: {
          ...daySchedule,
          slots: newSlots,
          enabled: newSlots.length > 0
        }
      };
    });
  };

  const toggleBreak = (dayKey, slotKey) => {
    setWorkSchedule(prev => {
      const daySchedule = prev[dayKey] || { enabled: false, slots: [], breaks: [] };
      const breaks = daySchedule.breaks || [];
      
      let newBreaks;
      if (breaks.includes(slotKey)) {
        // Usuń przerwę
        newBreaks = breaks.filter(s => s !== slotKey);
      } else {
        // Dodaj przerwę (tylko jeśli slot jest włączony)
        if (daySchedule.slots && daySchedule.slots.includes(slotKey)) {
          newBreaks = [...breaks, slotKey].sort();
        } else {
          return prev; // Nie dodawaj przerwy do nieaktywnego slotu
        }
      }

      return {
        ...prev,
        [dayKey]: {
          ...daySchedule,
          breaks: newBreaks
        }
      };
    });
  };

  const toggleDay = (dayKey) => {
    setWorkSchedule(prev => {
      const daySchedule = prev[dayKey] || { enabled: false, slots: [], breaks: [] };
      
      if (daySchedule.enabled) {
        // Wyłącz dzień
        return {
          ...prev,
          [dayKey]: {
            enabled: false,
            slots: [],
            breaks: []
          }
        };
      } else {
        // Włącz dzień z domyślnymi slotami 8:00-16:00
        const defaultSlots = [];
        const defaultBreaks = [];
        for (let hour = 8; hour < 16; hour++) {
          defaultSlots.push(`${hour}:00`);
          defaultSlots.push(`${hour}:30`);
          // Przerwa obiadowa 12:00-13:00
          if (hour === 12) {
            defaultBreaks.push(`${hour}:00`);
            defaultBreaks.push(`${hour}:30`);
          }
        }
        return {
          ...prev,
          [dayKey]: {
            enabled: true,
            slots: defaultSlots,
            breaks: defaultBreaks
          }
        };
      }
    });
  };

  const copyDayToAll = (sourceDayKey) => {
    const sourceDay = workSchedule[sourceDayKey];
    if (!sourceDay) return;

    setWorkSchedule(prev => {
      const newSchedule = { ...prev };
      daysOfWeek.forEach(day => {
        if (day.key !== sourceDayKey) {
          newSchedule[day.key] = {
            enabled: sourceDay.enabled,
            slots: [...(sourceDay.slots || [])],
            breaks: [...(sourceDay.breaks || [])]
          };
        }
      });
      return newSchedule;
    });
  };

  const openTimeModal = (dayKey) => {
    const daySchedule = workSchedule[dayKey];
    if (daySchedule && daySchedule.slots && daySchedule.slots.length > 0) {
      const firstSlot = daySchedule.slots[0];
      const lastSlot = daySchedule.slots[daySchedule.slots.length - 1];
      setTimeInputs({ start: firstSlot, end: lastSlot });
    } else {
      // Ustawienie poranych godzin jako domyślne
      setTimeInputs({ start: '07:00', end: '15:00' });
    }
    setEditingDay(dayKey);
    setShowTimeModal(true);
  };

  const applyTimeRange = () => {
    if (!editingDay) return;

    const startTime = timeInputs.start.split(':');
    const endTime = timeInputs.end.split(':');
    const startHour = parseInt(startTime[0]);
    const startMinute = parseInt(startTime[1]);
    const endHour = parseInt(endTime[0]);
    const endMinute = parseInt(endTime[1]);

    // Generuj sloty między start a end
    const newSlots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const slotKey = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
      newSlots.push(slotKey);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    setWorkSchedule(prev => ({
      ...prev,
      [editingDay]: {
        enabled: true,
        slots: newSlots,
        breaks: []
      }
    }));

    setShowTimeModal(false);
    setEditingDay('');
  };

  const getSlotStatus = (dayKey, slotKey) => {
    const daySchedule = workSchedule[dayKey];
    if (!daySchedule || !daySchedule.enabled) return 'disabled';
    
    const isWorking = daySchedule.slots && daySchedule.slots.includes(slotKey);
    const isBreak = daySchedule.breaks && daySchedule.breaks.includes(slotKey);
    
    if (isBreak && isWorking) return 'break';
    if (isWorking) return 'work';
    return 'off';
  };

  const getSlotClass = (status) => {
    switch (status) {
      case 'work':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer';
      case 'break':
        return 'bg-amber-400 hover:bg-amber-500 text-white cursor-pointer';
      case 'off':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer';
      case 'disabled':
        return 'bg-gray-50 text-gray-300 cursor-not-allowed';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer';
    }
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
                  Mapa Godzin Pracy
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
                onClick={saveSchedule}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiSave className="h-5 w-5 mr-2" />
                Zapisz
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
        
        {/* Legenda */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Harmonogram dyżurów (co 30 minut)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Kolory slotów:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded"></div>
                  <span className="text-sm text-gray-700">Dyżur - kliknij lewym</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-amber-400 rounded"></div>
                  <span className="text-sm text-gray-700">Przerwa - kliknij prawym</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded border"></div>
                  <span className="text-sm text-gray-700">Wolne</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Przyciski kontrolne:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded text-white text-xs flex items-center justify-center">✓</div>
                  <span className="text-sm text-gray-700">Włącz/wyłącz dzień</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center">⏰</div>
                  <span className="text-sm text-gray-700">Ustaw godziny wpisując</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border border-emerald-300 rounded text-emerald-600 text-xs flex items-center justify-center">
                    <FiCopy className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-gray-700">Skopiuj do wszystkich</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa godzin */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tygodniowa Mapa Godzin
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kliknij lewym przyciskiem = praca | Kliknij prawym przyciskiem = przerwa
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="w-full">
              {/* Header z godzinami */}
              <div className="flex border-b border-gray-300 bg-white w-full">
                <div className="p-3 bg-gray-50 font-medium text-gray-900 text-center text-sm border-r border-gray-300 w-[100px] flex-shrink-0">
                  Dzień
                </div>
                {timeSlots.map((slot, index) => (
                  <div 
                    key={`${slot.hour}-${slot.minute}`} 
                    className={`p-2 bg-gray-50 text-center text-xs font-medium text-gray-700 border-l border-gray-200 flex-1 min-w-[40px] ${
                      slot.minute === 0 ? 'border-l-2 border-l-gray-400' : ''
                    }`}
                  >
                    {slot.minute === 0 ? slot.hour : ''}
                  </div>
                ))}
              </div>

              {/* Rzędy z dniami */}
              {daysOfWeek.map(day => {
                const daySchedule = workSchedule[day.key] || { enabled: false, hours: [], breaks: [] };
                
                return (
                  <div key={day.key} className={`flex border-b-2 w-full transition-colors ${
                    daySchedule.enabled 
                      ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}>
                    {/* Nazwa dnia */}
                    <div className={`p-3 border-r border-gray-300 w-[100px] flex-shrink-0 ${
                      daySchedule.enabled ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm font-medium text-gray-900">{day.short}</div>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => toggleDay(day.key)}
                            className={`w-5 h-5 rounded text-xs font-medium transition-colors ${
                              daySchedule.enabled 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                            }`}
                            title={daySchedule.enabled ? 'Wyłącz dzień' : 'Włącz dzień'}
                          >
                            {daySchedule.enabled ? '✓' : '✗'}
                          </button>
                          <button
                            onClick={() => openTimeModal(day.key)}
                            className="w-5 h-5 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            title="Ustaw godziny"
                          >
                            ⏰
                          </button>
                          <button
                            onClick={() => copyDayToAll(day.key)}
                            className="w-5 h-5 rounded text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors"
                            title="Skopiuj do wszystkich dni"
                          >
                            <FiCopy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sloty czasowe */}
                    {timeSlots.map(slot => {
                      const slotKey = slot.display;
                      const status = getSlotStatus(day.key, slotKey);
                      
                      return (
                        <div
                          key={slotKey}
                          className={`border-l border-gray-200 transition-colors h-12 flex-1 min-w-[40px] cursor-pointer ${
                            slot.minute === 0 ? 'border-l-2 border-l-gray-400' : ''
                          } ${getSlotClass(status)}`}
                          onClick={() => {
                            if (status !== 'disabled') {
                              toggleSlot(day.key, slotKey);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (status !== 'disabled') {
                              toggleBreak(day.key, slotKey);
                            }
                          }}
                          title={
                            status === 'work' ? `${slotKey} - Dyżur` :
                            status === 'break' ? `${slotKey} - Przerwa` :
                            status === 'off' ? `${slotKey} - Wolne` :
                            `${slotKey} - Wyłączony`
                          }
                        >
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Podsumowanie */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {daysOfWeek.map(day => {
            const daySchedule = workSchedule[day.key] || { enabled: false, slots: [], breaks: [] };
            const workSlots = daySchedule.slots ? daySchedule.slots.length : 0;
            const breakSlots = daySchedule.breaks ? daySchedule.breaks.length : 0;
            const netWorkSlots = workSlots - breakSlots;
            const workHours = (netWorkSlots * 30) / 60; // Konwersja na godziny

            return (
              <div key={day.key} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{day.short}</h3>
                  <span className={`w-3 h-3 rounded-full ${daySchedule.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                </div>
                
                {daySchedule.enabled ? (
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Dyżury:</span>
                      <span className="font-medium text-emerald-600">{workSlots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Przerwy:</span>
                      <span className="font-medium text-amber-500">{breakSlots}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-900">Netto:</span>
                      <span className="font-bold text-gray-900">{workHours.toFixed(1)}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Dzień wolny</div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal do ustawiania godzin */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Ustaw godziny dyżuru
              </h3>
              <button
                onClick={() => setShowTimeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Początek dyżuru:
                  </label>
                  <input
                    type="time"
                    value={timeInputs.start}
                    onChange={(e) => setTimeInputs(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Koniec dyżuru:
                  </label>
                  <input
                    type="time"
                    value={timeInputs.end}
                    onChange={(e) => setTimeInputs(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="p-3 bg-emerald-50 rounded-md">
                  <p className="text-sm text-emerald-700">
                    Dyżur zostanie ustawiony od {timeInputs.start} do {timeInputs.end}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowTimeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={applyTimeRange}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Zastosuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}