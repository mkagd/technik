// components/FlexibleAvailabilitySelector.js
// 📅 Elastyczny selektor dostępności - zakres dat i godzin
// Używany przy składaniu/edycji zamówienia

import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiPlus, FiX, FiAlertCircle } from 'react-icons/fi';

export default function FlexibleAvailabilitySelector({ 
  value = [], 
  onChange,
  minDate = null, // Minimalna data (domyślnie: dzisiaj)
  compact = false 
}) {
  // value to tablica slotów: [{ dateFrom, dateTo, timeFrom, timeTo, notes }]
  const [slots, setSlots] = useState(value || []);
  const [expandedSlots, setExpandedSlots] = useState(new Set()); // Które sloty są rozwinięte

  useEffect(() => {
    setSlots(value || []);
  }, [value]);

  // Dodaj nowy slot (domyślnie: dostępny)
  const addSlot = (type = 'available') => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const newSlot = {
      id: Date.now(),
      type: type, // 'available' lub 'unavailable'
      dateFrom: tomorrowStr,
      dateTo: tomorrowStr,
      timeFrom: '08:00',
      timeTo: '20:00',
      notes: ''
    };

    const updated = [...slots, newSlot];
    setSlots(updated);
    onChange && onChange(updated);
  };

  // Usuń slot
  const removeSlot = (id) => {
    const updated = slots.filter(s => s.id !== id);
    setSlots(updated);
    onChange && onChange(updated);
  };

  // Aktualizuj slot
  const updateSlot = (id, field, value) => {
    const updated = slots.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    setSlots(updated);
    onChange && onChange(updated);
  };

  // Szybkie presety czasowe
  const timePresets = [
    { label: 'Rano', from: '08:00', to: '12:00' },
    { label: 'Popołudnie', from: '12:00', to: '16:00' },
    { label: 'Wieczór', from: '16:00', to: '20:00' },
    { label: 'Cały dzień', from: '08:00', to: '20:00' }
  ];

  // Minimum date dla inputów
  const getMinDate = () => {
    if (minDate) return minDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Szybkie dodanie gotowego slotu
  const addQuickSlot = (type, days, timePreset) => {
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() + 1); // Jutro
    
    const dateTo = new Date(dateFrom);
    dateTo.setDate(dateTo.getDate() + days - 1);

    const newSlot = {
      id: Date.now(),
      type: type,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      timeFrom: timePreset.from,
      timeTo: timePreset.to,
      notes: ''
    };

    const updated = [...slots, newSlot];
    setSlots(updated);
    onChange && onChange(updated);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Twoja dostępność
          </label>
          
          {/* SZYBKIE PRESETY - DOSTĘPNOŚĆ */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1.5">✓ Szybko zaznacz kiedy <strong>JESTEŚ</strong> dostępny:</p>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => addQuickSlot('available', 1, { from: '08:00', to: '20:00' })}
                className="text-xs px-2 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded border border-green-300 text-left"
              >
                <span className="font-medium">Jutro</span> <span className="text-green-600">8-20</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickSlot('available', 7, { from: '08:00', to: '20:00' })}
                className="text-xs px-2 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded border border-green-300 text-left"
              >
                <span className="font-medium">Tydzień</span> <span className="text-green-600">8-20</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickSlot('available', 1, { from: '16:00', to: '20:00' })}
                className="text-xs px-2 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded border border-green-300 text-left"
              >
                <span className="font-medium">Jutro wieczór</span> <span className="text-green-600">16-20</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickSlot('available', 30, { from: '08:00', to: '20:00' })}
                className="text-xs px-2 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded border border-green-300 text-left"
              >
                <span className="font-medium">Miesiąc</span> <span className="text-green-600">8-20</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addSlot('available');
                  // Auto-expand nowo dodany slot
                  setTimeout(() => {
                    const lastSlot = slots[slots.length];
                    if (lastSlot) setExpandedSlots(prev => new Set([...prev, lastSlot.id]));
                  }, 50);
                }}
                className="text-xs px-2 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 flex items-center justify-center"
              >
                <FiPlus className="h-3 w-3 mr-1" />
                Własny
              </button>
            </div>
          </div>

          {/* SZYBKIE PRESETY - NIEDOSTĘPNOŚĆ */}
          <div>
            <p className="text-xs text-gray-600 mb-1.5">✗ Szybko zaznacz kiedy <strong>NIE MA CIĘ</strong>:</p>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => addQuickSlot('unavailable', 1, { from: '00:00', to: '23:59' })}
                className="text-xs px-2 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded border border-red-300 text-left"
              >
                <span className="font-medium">Jutro</span> <span className="text-red-600">cały dzień</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickSlot('unavailable', 7, { from: '00:00', to: '23:59' })}
                className="text-xs px-2 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded border border-red-300 text-left"
              >
                <span className="font-medium">Tydzień</span> <span className="text-red-600">urlop</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickSlot('unavailable', 3, { from: '00:00', to: '23:59' })}
                className="text-xs px-2 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded border border-red-300 text-left"
              >
                <span className="font-medium">3 dni</span> <span className="text-red-600">wyjazd</span>
              </button>
              <button
                type="button"
                onClick={() => addSlot('unavailable')}
                className="text-xs px-2 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 flex items-center justify-center"
              >
                <FiPlus className="h-3 w-3 mr-1" />
                Własny
              </button>
            </div>
          </div>
        </div>

        {slots.length === 0 && (
          <div className="text-center py-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Kliknij przycisk wyżej aby szybko dodać slot
            </p>
          </div>
        )}

        {slots.map((slot, index) => {
          const isAvailable = slot.type === 'available' || !slot.type; // domyślnie available
          const borderColor = isAvailable ? 'border-green-200' : 'border-red-200';
          const bgColor = isAvailable ? 'bg-green-50' : 'bg-red-50';
          const isExpanded = expandedSlots.has(slot.id);

          // Formatowanie dat do wyświetlenia
          const formatDateRange = () => {
            if (slot.dateFrom === slot.dateTo) {
              return new Date(slot.dateFrom).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
            }
            return `${new Date(slot.dateFrom).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} - ${new Date(slot.dateTo).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}`;
          };
          
          return (
          <div key={slot.id} className={`p-2 bg-white border-2 ${borderColor} rounded-lg transition-all`}>
            {/* WIDOK ZMINIMALIZOWANY */}
            {!isExpanded && (
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedSlots(prev => new Set([...prev, slot.id]))}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isAvailable ? '✓' : '✗'}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {formatDateRange()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {slot.timeFrom}-{slot.timeTo}
                  </span>
                  {slot.notes && (
                    <span className="text-xs text-gray-400 italic truncate max-w-[120px]">
                      {slot.notes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSlots(prev => new Set([...prev, slot.id]));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlot(slot.id);
                    }}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* WIDOK ROZWINIĘTY */}
            {isExpanded && (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isAvailable ? '✓ Dostępny' : '✗ Niedostępny'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedSlots(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(slot.id);
                      return newSet;
                    })}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    Zwiń
                  </button>
                </div>

                {/* Typ slotu - toggle */}
                <div className="mb-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateSlot(slot.id, 'type', 'available')}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        isAvailable 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ✓ Jestem dostępny
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSlot(slot.id, 'type', 'unavailable')}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        !isAvailable 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ✗ Nie ma mnie
                    </button>
                  </div>
                </div>

            {/* Data od-do */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Od</label>
                <input
                  type="date"
                  value={slot.dateFrom}
                  min={getMinDate()}
                  onChange={(e) => updateSlot(slot.id, 'dateFrom', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Do</label>
                <input
                  type="date"
                  value={slot.dateTo}
                  min={slot.dateFrom}
                  onChange={(e) => updateSlot(slot.id, 'dateTo', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Godziny od-do */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Godzina od</label>
                <input
                  type="time"
                  value={slot.timeFrom}
                  onChange={(e) => updateSlot(slot.id, 'timeFrom', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Godzina do</label>
                <input
                  type="time"
                  value={slot.timeTo}
                  onChange={(e) => updateSlot(slot.id, 'timeTo', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Szybkie presety */}
            <div className="flex gap-1 mb-2">
              {timePresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateSlot(slot.id, 'timeFrom', preset.from);
                    updateSlot(slot.id, 'timeTo', preset.to);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  title={`${preset.from}-${preset.to}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Notatka */}
            <input
              type="text"
              value={slot.notes}
              onChange={(e) => updateSlot(slot.id, 'notes', e.target.value)}
              placeholder="Dodatkowe uwagi (opcjonalnie)"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />

            {/* Przycisk usuń w expanded view */}
            <button
              type="button"
              onClick={() => removeSlot(slot.id)}
              className="mt-2 w-full text-xs text-red-600 hover:text-red-800 py-1"
            >
              Usuń slot
            </button>
          </div>
            )}
          </div>
          );
        })}


        {/* Info box */}
        {slots.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Kliknij slot aby edytować szczegóły
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full version (nie compact)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FiCalendar className="h-5 w-5 mr-2 text-blue-600" />
            Dostępność klienta
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Określ kiedy klient jest dostępny (lub niedostępny) na wizytę
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addSlot('available')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Dostępny
          </button>
          <button
            type="button"
            onClick={() => addSlot('unavailable')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FiX className="h-4 w-4 mr-2" />
            Niedostępny
          </button>
        </div>
      </div>

      {slots.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-base font-medium text-gray-900 mb-2">
            Brak określonej dostępności
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Dodaj przedziały czasowe - zarówno dostępności jak i niedostępności
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => addSlot('available')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ✓ Dodaj dostępność
            </button>
            <button
              type="button"
              onClick={() => addSlot('unavailable')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ✗ Zaznacz niedostępność
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {slots.map((slot, index) => {
          const isAvailable = slot.type === 'available' || !slot.type;
          const borderColor = isAvailable ? 'border-green-200' : 'border-red-200';
          const bgIcon = isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';
          
          return (
          <div key={slot.id} className={`p-4 bg-white border-2 ${borderColor} rounded-lg shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${bgIcon} rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                  {isAvailable ? '✓' : '✗'}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isAvailable ? 'Dostępny' : 'Niedostępny'}
                    </span>
                    <span className="text-gray-400">#{index + 1}</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {slot.dateFrom === slot.dateTo 
                      ? new Date(slot.dateFrom).toLocaleDateString('pl-PL')
                      : `${new Date(slot.dateFrom).toLocaleDateString('pl-PL')} - ${new Date(slot.dateTo).toLocaleDateString('pl-PL')}`
                    }
                    {' • '}
                    {slot.timeFrom}-{slot.timeTo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Usuń przedział"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Typ slotu - toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typ przedziału
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSlot(slot.id, 'type', 'available')}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isAvailable 
                      ? 'bg-green-600 text-white font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✓ Jestem dostępny
                </button>
                <button
                  type="button"
                  onClick={() => updateSlot(slot.id, 'type', 'unavailable')}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    !isAvailable 
                      ? 'bg-red-600 text-white font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✗ Nie ma mnie
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zakres dat */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <FiCalendar className="inline h-4 w-4 mr-1" />
                  Zakres dat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Data od</label>
                    <input
                      type="date"
                      value={slot.dateFrom}
                      min={getMinDate()}
                      onChange={(e) => updateSlot(slot.id, 'dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Data do</label>
                    <input
                      type="date"
                      value={slot.dateTo}
                      min={slot.dateFrom}
                      onChange={(e) => updateSlot(slot.id, 'dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Zakres godzin */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <FiClock className="inline h-4 w-4 mr-1" />
                  Zakres godzin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Godzina od</label>
                    <input
                      type="time"
                      value={slot.timeFrom}
                      onChange={(e) => updateSlot(slot.id, 'timeFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Godzina do</label>
                    <input
                      type="time"
                      value={slot.timeTo}
                      onChange={(e) => updateSlot(slot.id, 'timeTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Szybkie presety */}
                <div className="flex flex-wrap gap-2">
                  {timePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        updateSlot(slot.id, 'timeFrom', preset.from);
                        updateSlot(slot.id, 'timeTo', preset.to);
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notatki */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodatkowe uwagi (opcjonalnie)
              </label>
              <input
                type="text"
                value={slot.notes}
                onChange={(e) => updateSlot(slot.id, 'notes', e.target.value)}
                placeholder="np. Najlepiej przed 12:00, dzwonek nie działa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          );
        })}
      </div>

      {slots.length > 0 && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => addSlot('available')}
            className="flex-1 py-3 text-sm text-green-700 hover:bg-green-50 border-2 border-green-300 border-dashed rounded-lg transition-colors font-medium"
          >
            <FiPlus className="inline h-4 w-4 mr-2" />
            Dodaj dostępność
          </button>
          <button
            type="button"
            onClick={() => addSlot('unavailable')}
            className="flex-1 py-3 text-sm text-red-700 hover:bg-red-50 border-2 border-red-300 border-dashed rounded-lg transition-colors font-medium"
          >
            <FiX className="inline h-4 w-4 mr-2" />
            Zaznacz niedostępność
          </button>
        </div>
      )}

      {slots.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                💡 Elastyczna dostępność
              </h4>
              <p className="text-xs text-blue-700">
                <strong>Zielone sloty (✓)</strong> oznaczają kiedy JESTEŚ dostępny.<br />
                <strong>Czerwone sloty (✗)</strong> oznaczają kiedy NIE MA CIĘ (np. wyjazd, urlop).<br />
                System uwzględni obie informacje przy planowaniu wizyty.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
