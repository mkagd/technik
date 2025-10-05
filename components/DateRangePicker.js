// components/DateRangePicker.js
// Wizualny kalendarz do wyboru pojedynczej daty lub zakresu

import { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

export default function DateRangePicker({ 
  mode = 'single', // 'single' lub 'range'
  onModeChange,
  selectedDate,
  selectedRange, // { from, to }
  onDateChange,
  onRangeChange,
  minDate = new Date()
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generuj dni miesiąca
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysArray = [];
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Pon = 0
    
    // Padding - puste komórki przed 1. dniem
    for (let i = 0; i < startPadding; i++) {
      daysArray.push(null);
    }
    
    // Dni miesiąca
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysArray.push(new Date(year, month, day));
    }
    
    return daysArray;
  }, [currentMonth]);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < new Date(minDate.setHours(0, 0, 0, 0));
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateStr = formatDate(date);
    
    if (mode === 'single') {
      return selectedDate === dateStr;
    } else {
      if (!selectedRange?.from) return false;
      
      const from = new Date(selectedRange.from);
      const to = selectedRange.to ? new Date(selectedRange.to) : null;
      
      if (!to) {
        return formatDate(date) === selectedRange.from;
      }
      
      return date >= from && date <= to;
    }
  };

  const isRangeStart = (date) => {
    if (!date || mode !== 'range' || !selectedRange?.from) return false;
    return formatDate(date) === selectedRange.from;
  };

  const isRangeEnd = (date) => {
    if (!date || mode !== 'range' || !selectedRange?.to) return false;
    return formatDate(date) === selectedRange.to;
  };

  const handleDateClick = (date) => {
    if (!date || isDateDisabled(date)) return;
    
    const dateStr = formatDate(date);
    
    if (mode === 'single') {
      onDateChange(dateStr);
    } else {
      // Tryb range
      if (!selectedRange?.from || (selectedRange.from && selectedRange.to)) {
        // Rozpocznij nowy zakres
        onRangeChange({ from: dateStr, to: null });
      } else {
        // Zakończ zakres
        const from = new Date(selectedRange.from);
        if (date < from) {
          // Kliknięto wcześniejszą datę - zamień miejscami
          onRangeChange({ from: dateStr, to: selectedRange.from });
        } else {
          onRangeChange({ from: selectedRange.from, to: dateStr });
        }
      }
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Toggle mode */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => onModeChange('single')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📆 Konkretna data
        </button>
        <button
          type="button"
          onClick={() => onModeChange('range')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'range'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📅 Elastyczny zakres
        </button>
      </div>

      {/* Info */}
      <div className="mb-3 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        {mode === 'single' ? (
          <span>👆 Kliknij datę, aby wybrać konkretny termin wizyty</span>
        ) : (
          <span>👆 Kliknij pierwszą datę, potem drugą, aby wybrać zakres</span>
        )}
      </div>

      {/* Nagłówek kalendarza */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {monthName}
        </h3>
        
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Dni tygodnia */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Dni miesiąca */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const rangeStart = isRangeStart(date);
          const rangeEnd = isRangeEnd(date);
          const isToday = formatDate(date) === formatDate(new Date());

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                aspect-square p-1 text-sm rounded-lg transition-all relative
                ${disabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'hover:bg-blue-50 cursor-pointer'
                }
                ${selected && mode === 'single'
                  ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700'
                  : ''
                }
                ${selected && mode === 'range'
                  ? 'bg-green-100 text-green-900'
                  : ''
                }
                ${rangeStart
                  ? 'bg-green-600 text-white font-semibold hover:bg-green-700'
                  : ''
                }
                ${rangeEnd
                  ? 'bg-green-600 text-white font-semibold hover:bg-green-700'
                  : ''
                }
                ${isToday && !selected && !disabled
                  ? 'ring-2 ring-blue-400'
                  : ''
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Podgląd wyboru */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {mode === 'single' && selectedDate && (
          <div className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Wybrana data:</span>{' '}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        )}
        
        {mode === 'range' && selectedRange?.from && (
          <div className="text-sm space-y-1">
            {!selectedRange.to ? (
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">Data początkowa:</span>{' '}
                {new Date(selectedRange.from + 'T00:00:00').toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long'
                })}
                <div className="text-xs text-gray-500 mt-1">
                  👆 Kliknij drugą datę, aby zakończyć zakres
                </div>
              </div>
            ) : (
              <div className="text-gray-700">
                <div>
                  <span className="font-medium text-gray-900">Zakres:</span>{' '}
                  {new Date(selectedRange.from + 'T00:00:00').toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long'
                  })}
                  {' → '}
                  {new Date(selectedRange.to + 'T00:00:00').toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({Math.ceil((new Date(selectedRange.to) - new Date(selectedRange.from)) / (1000 * 60 * 60 * 24)) + 1} dni)
                </div>
              </div>
            )}
          </div>
        )}
        
        {mode === 'range' && !selectedRange?.from && (
          <div className="text-sm text-gray-500">
            Kliknij pierwszą datę, aby rozpocząć wybór zakresu
          </div>
        )}
      </div>
    </div>
  );
}
