// pages/kalendarz-pracownika-prosty.js

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
  FiX,
  FiChevronLeft,
  FiChevronRight
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const router = useRouter();

  // Funkcje do zarządzania tygodniami
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Poniedziałek
    return new Date(d.setDate(diff));
  };

  const getCurrentWeekDates = () => {
    const monday = getMonday(selectedWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const previousWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
  };

  // Funkcja do obliczania pozycji aktualnej godziny
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Sprawdź czy aktualna godzina mieści się w zakresie kalendarza (7:00-22:00)
    if (currentHour < 7 || currentHour > 22) {
      return null;
    }
    
    // Oblicz pozycję w slotach (każdy slot to 48px wysokości)
    const minutesFromStart = (currentHour - 7) * 60 + currentMinute;
    const slotPosition = minutesFromStart / 30; // Każdy slot to 30 minut
    
    return slotPosition * 48; // 48px wysokości każdego slotu
  };

  const isCurrentTimeVisible = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 7 && currentHour <= 22;
  };

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

      // Załaduj harmonogram dla bieżącego tygodnia
      const weekKey = getMonday(selectedWeek).toISOString().split('T')[0];
      const weekScheduleKey = `workSchedule_${employeeData.id}_${weekKey}`;
      let savedSchedule = localStorage.getItem(weekScheduleKey);
      
      // Jeśli nie ma harmonogramu dla tego tygodnia, użyj domyślnego
      if (!savedSchedule) {
        savedSchedule = localStorage.getItem(`simpleWorkSchedule_${employeeData.id}`);
      }
      
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      } else {
        // Domyślny harmonogram (Pon-Pt 7:00-15:00)
        const defaultSchedule = {};
        daysOfWeek.slice(0, 5).forEach(day => {
          // Sloty od 7:00 do 15:00 (16 slotów po 30 min)
          const workSlots = [];
          const breakSlots = [];
          for (let hour = 7; hour < 15; hour++) {
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

  // Efekt reagujący na zmianę tygodnia
  useEffect(() => {
    if (employee && selectedWeek) {
      const weekKey = getMonday(selectedWeek).toISOString().split('T')[0];
      const weekScheduleKey = `workSchedule_${employee.id}_${weekKey}`;
      let savedSchedule = localStorage.getItem(weekScheduleKey);
      
      if (!savedSchedule) {
        savedSchedule = localStorage.getItem(`simpleWorkSchedule_${employee.id}`);
      }
      
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      }
    }
  }, [selectedWeek, employee]);

  // Efekt do odświeżania aktualnego czasu co minutę
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Odświeżaj co minutę

    return () => clearInterval(timer);
  }, []);

  const saveSchedule = () => {
    if (employee) {
      // Zapisuj harmonogram z datami tygodnia
      const weekKey = getMonday(selectedWeek).toISOString().split('T')[0];
      const weekScheduleKey = `workSchedule_${employee.id}_${weekKey}`;
      localStorage.setItem(weekScheduleKey, JSON.stringify(workSchedule));
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
        // Włącz dzień z domyślnymi slotami 7:00-15:00
        const defaultSlots = [];
        const defaultBreaks = [];
        for (let hour = 7; hour < 15; hour++) {
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
      // Domyślna godzina rozpoczęcia pracy: 7:00
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
    const partialSlots = {};
    
    // Znajdź pierwszy slot (może być częściowy)
    const startSlotHour = startMinute >= 30 ? startHour : startHour;
    const startSlotMinute = startMinute >= 30 ? 30 : 0;
    const startSlotKey = `${startSlotHour}:${startSlotMinute.toString().padStart(2, '0')}`;
    
    // Znajdź ostatni slot (może być częściowy)
    const endSlotHour = endMinute > 30 ? endHour : (endMinute > 0 ? endHour : endHour);
    const endSlotMinute = endMinute > 30 ? 30 : (endMinute > 0 ? 0 : 0);
    const endSlotKey = `${endSlotHour}:${endSlotMinute.toString().padStart(2, '0')}`;

    let currentHour = startSlotHour;
    let currentMinute = startSlotMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endSlotMinute)) {
      const slotKey = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
      newSlots.push(slotKey);
      
      // Sprawdź czy to slot częściowy
      const isFirstSlot = slotKey === startSlotKey;
      const isLastSlot = slotKey === endSlotKey;
      
      if (isFirstSlot && startMinute % 30 !== 0) {
        partialSlots[slotKey] = {
          type: 'start',
          percentage: ((30 - (startMinute % 30)) / 30) * 100
        };
      } else if (isLastSlot && endMinute % 30 !== 0) {
        partialSlots[slotKey] = {
          type: 'end', 
          percentage: ((endMinute % 30) / 30) * 100
        };
      }
      
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
        breaks: [],
        partialSlots: partialSlots
      }
    }));

    setShowTimeModal(false);
    setEditingDay('');
  };

  const toggleExpandDay = (dayKey) => {
    setExpandedDay(expandedDay === dayKey ? '' : dayKey);
  };

  // Mock danych wizyt
  const getVisitsForDay = (dayKey) => {
    const mockVisits = {
      'monday': [
        { id: 1, time: '08:30', client: 'Jan Kowalski', address: 'ul. Długa 5, Warszawa', type: 'Naprawa pralki' },
        { id: 2, time: '10:00', client: 'Anna Nowak', address: 'ul. Krótka 12, Kraków', type: 'Serwis zmywarki' },
        { id: 3, time: '14:30', client: 'Piotr Wiśniewski', address: 'ul. Główna 8, Gdańsk', type: 'Wymiana części' }
      ],
      'tuesday': [
        { id: 4, time: '09:15', client: 'Maria Kowalczyk', address: 'ul. Nowa 3, Wrocław', type: 'Przegląd lodówki' }
      ],
      'wednesday': [
        { id: 5, time: '11:00', client: 'Tomasz Zając', address: 'ul. Stara 15, Łódź', type: 'Naprawa kuchenki' }
      ]
    };
    return mockVisits[dayKey] || [];
  };

  const getSlotStatus = (dayKey, slotKey) => {
    const daySchedule = workSchedule[dayKey];
    if (!daySchedule || !daySchedule.enabled) return { status: 'disabled', partial: false };
    
    const isWorking = daySchedule.slots && daySchedule.slots.includes(slotKey);
    const isBreak = daySchedule.breaks && daySchedule.breaks.includes(slotKey);
    
    // Sprawdź czy to slot częściowy (np. 7:35 w slocie 7:30)
    const isPartial = daySchedule.partialSlots && daySchedule.partialSlots[slotKey];
    
    if (isBreak && isWorking) return { status: 'break', partial: isPartial };
    if (isWorking) return { status: 'work', partial: isPartial };
    return { status: 'off', partial: false };
  };

  const getSlotClass = (statusObj) => {
    const { status, partial } = statusObj;
    let baseClass = '';
    
    switch (status) {
      case 'work':
        baseClass = 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer';
        break;
      case 'break':
        baseClass = 'bg-amber-400 hover:bg-amber-500 text-white cursor-pointer';
        break;
      case 'off':
        baseClass = 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer';
        break;
      case 'disabled':
        baseClass = 'bg-gray-50 text-gray-300 cursor-not-allowed';
        break;
      default:
        baseClass = 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer';
    }
    
    // Dodaj gradient dla częściowych slotów
    if (partial && (status === 'work' || status === 'break')) {
      const color = status === 'work' ? 'emerald' : 'amber';
      const colorCode = status === 'work' ? '#10b981' : '#f59e0b';
      return `${baseClass} relative overflow-hidden`;
    }
    
    return baseClass;
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
          {/* Nawigacja tygodniowa */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={previousWeek}
                  className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ◀ Poprzedni tydzień
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Dzisiaj
                </button>
                <button
                  onClick={nextWeek}
                  className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Następny tydzień ▶
                </button>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {getMonday(selectedWeek).toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' })} - 
                {" " + new Date(getMonday(selectedWeek).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tygodniowa Mapa Godzin
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kliknij lewym przyciskiem = praca | Kliknij prawym przyciskiem = przerwa
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="w-full relative">
              {/* Czerwona linia aktualnego czasu */}
              {isCurrentTimeVisible() && getCurrentTimePosition() !== null && (
                <div 
                  className="absolute left-[100px] right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{
                    top: `${76 + getCurrentTimePosition()}px` // 76px header + pozycja w slotach
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="absolute -top-6 -left-16 text-xs font-bold text-red-600 bg-white px-1 py-0.5 rounded shadow-sm border">
                    {currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              {/* Główna tabela z pionowymi godzinami */}
              <div className="flex">
                {/* Kolumna z godzinami */}
                <div className="bg-gray-50 border-r border-gray-300">
                  {/* Header - dopasowana wysokość do headerów dni */}
                  <div className="font-medium text-gray-900 text-center text-sm border-b border-gray-300 w-[100px] bg-gray-100 flex items-center justify-center" style={{height: '76px'}}>
                    Dzień / Godzina
                  </div>
                  {/* Godziny */}
                  {timeSlots.map((slot, index) => (
                    <div 
                      key={`time-${slot.hour}-${slot.minute}`} 
                      className={`text-center text-xs font-medium text-gray-700 border-b border-gray-200 w-[100px] h-12 flex items-center justify-center ${
                        slot.minute === 0 ? 'bg-gray-100 border-b-2 border-b-gray-400 font-bold' : 'bg-gray-50'
                      }`}
                    >
                      {slot.display}
                    </div>
                  ))}
                </div>

                {/* Kolumny z dniami */}
                <div className="flex-1">
                  {/* Header z nazwami dni */}
                  <div className="flex border-b border-gray-300 bg-white">
                    {daysOfWeek.map((day, index) => {
                      const currentDate = getCurrentWeekDates()[index];
                      const isCurrentDay = isToday(currentDate);
                      
                      return (
                        <div 
                          key={`header-${day.key}`} 
                          className={`flex-1 min-w-[80px] text-center border-r border-gray-300 flex flex-col justify-center ${
                            isCurrentDay ? 'bg-blue-100' : 'bg-gray-50'
                          }`}
                          style={{height: '76px'}}
                        >
                          <div className="px-2 py-1">
                            <div className="text-xs font-medium text-gray-600">
                              {formatDate(currentDate)}
                            </div>
                            <div 
                              className={`text-sm font-medium cursor-pointer hover:text-emerald-600 transition-colors flex items-center justify-center ${
                                isCurrentDay ? 'text-blue-700 font-bold' : 'text-gray-900'
                              }`}
                              onClick={() => toggleExpandDay(day.key)}
                              title="Kliknij aby zobaczyć wizyty"
                            >
                              {day.short} {expandedDay === day.key ? '▼' : '▶'}
                            </div>
                            <div className="flex items-center justify-center space-x-1 mt-1">
                              <button
                                onClick={() => toggleDay(day.key)}
                                className={`w-4 h-4 rounded text-xs font-medium transition-colors ${
                                  (workSchedule[day.key] || {}).enabled 
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                }`}
                                title={(workSchedule[day.key] || {}).enabled ? 'Wyłącz dzień' : 'Włącz dzień'}
                              >
                                {(workSchedule[day.key] || {}).enabled ? '✓' : '✗'}
                              </button>
                              <button
                                onClick={() => openTimeModal(day.key)}
                                className="w-4 h-4 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                                title="Ustaw godziny"
                              >
                                ⏰
                              </button>
                              <button
                                onClick={() => copyDayToAll(day.key)}
                                className="w-4 h-4 rounded text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                                title="Skopiuj do wszystkich dni"
                              >
                                <FiCopy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rzędy z slotami czasu dla każdego dnia */}
                  {timeSlots.map(slot => (
                    <div key={`row-${slot.hour}-${slot.minute}`} className="flex">
                      {daysOfWeek.map((day, dayIndex) => {
                        const currentDate = getCurrentWeekDates()[dayIndex];
                        const isCurrentDay = isToday(currentDate);
                        const slotKey = slot.display;
                        const statusObj = getSlotStatus(day.key, slotKey);
                        const daySchedule = workSchedule[day.key];
                        const partialInfo = daySchedule?.partialSlots?.[slotKey];
                        
                        return (
                          <div
                            key={`slot-${day.key}-${slotKey}`}
                            className={`border-r border-gray-200 border-b border-gray-200 transition-colors h-12 flex-1 min-w-[80px] cursor-pointer relative ${
                              slot.minute === 0 ? 'border-b-2 border-b-gray-400' : ''
                            } ${getSlotClass(statusObj)} ${isCurrentDay ? 'ring-1 ring-blue-200' : ''}`}
                            onClick={() => {
                              if (statusObj.status !== 'disabled') {
                                toggleSlot(day.key, slotKey);
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (statusObj.status !== 'disabled') {
                                toggleBreak(day.key, slotKey);
                              }
                            }}
                            title={
                              statusObj.status === 'work' ? `${slotKey} - Dyżur${partialInfo ? ' (częściowy)' : ''}` :
                              statusObj.status === 'break' ? `${slotKey} - Przerwa` :
                              statusObj.status === 'off' ? `${slotKey} - Wolne` :
                              `${slotKey} - Wyłączony`
                            }
                          >
                            {/* Gradient dla częściowych slotów */}
                            {partialInfo && (statusObj.status === 'work' || statusObj.status === 'break') && (
                              <div 
                                className={`absolute inset-0 ${
                                  statusObj.status === 'work' ? 'bg-emerald-500' : 'bg-amber-400'
                                }`}
                                style={{
                                  background: partialInfo.type === 'start' 
                                    ? `linear-gradient(to right, ${statusObj.status === 'work' ? '#10b981' : '#f59e0b'} ${partialInfo.percentage}%, #e5e7eb ${partialInfo.percentage}%)`
                                    : `linear-gradient(to right, #e5e7eb ${100 - partialInfo.percentage}%, ${statusObj.status === 'work' ? '#10b981' : '#f59e0b'} ${100 - partialInfo.percentage}%)`
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel z rozwinięteymi wizytami */}
        {expandedDay && (
          <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FiCalendar className="h-5 w-5 mr-2" />
                Wizyty na {daysOfWeek.find(d => d.key === expandedDay)?.name} - {formatDate(getCurrentWeekDates()[daysOfWeek.findIndex(d => d.key === expandedDay)])}
              </h3>
            </div>
            <div className="p-6">
              {getVisitsForDay(expandedDay).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Brak zaplanowanych wizyt w tym dniu</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getVisitsForDay(expandedDay).map(visit => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-lg font-semibold text-blue-600">{visit.time}</div>
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Wizyta</div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-2">{visit.client}</div>
                      <div className="text-sm text-gray-600 mb-2">{visit.address}</div>
                      <div className="text-sm text-emerald-600 font-medium">{visit.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                Ustaw godziny pracy
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
                    Rozpoczęcie pracy:
                  </label>
                  <input
                    type="time"
                    min="07:00"
                    max="22:00"
                    step="1800"
                    value={timeInputs.start}
                    onChange={(e) => setTimeInputs(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zakończenie pracy:
                  </label>
                  <input
                    type="time"
                    min="07:00"
                    max="22:00"
                    step="1800"
                    value={timeInputs.end}
                    onChange={(e) => setTimeInputs(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="p-3 bg-emerald-50 rounded-md">
                  <p className="text-sm text-emerald-700">
                    Godziny pracy: {timeInputs.start} - {timeInputs.end}
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