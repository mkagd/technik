// components/AvailabilityScheduler.js
// 📅 Komponent do wyboru dostępności fizycznej klienta
// Wizualny kalendarz tygodniowy + zarządzanie oknami czasowymi

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiClock, FiHome, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { calculateAvailabilityScore, getAvailabilityCategory } from '../utils/availabilityScore';

export default function AvailabilityScheduler({ value, onChange, compact = false }) {
  const [timeWindows, setTimeWindows] = useState(value?.timeWindows || []);
  const [preferences, setPreferences] = useState(value?.preferences || {
    flexibleSchedule: false,
    requiresAdvanceNotice: false,
    advanceNoticeHours: 24
  });
  const [notes, setNotes] = useState(value?.notes || []);
  const [score, setScore] = useState(0);
  const [category, setCategory] = useState(null);

  // Dostępne dni
  const daysOfWeek = [
    { value: 'monday', label: 'Pon', fullLabel: 'Poniedziałek' },
    { value: 'tuesday', label: 'Wt', fullLabel: 'Wtorek' },
    { value: 'wednesday', label: 'Śr', fullLabel: 'Środa' },
    { value: 'thursday', label: 'Czw', fullLabel: 'Czwartek' },
    { value: 'friday', label: 'Pt', fullLabel: 'Piątek' },
    { value: 'saturday', label: 'Sob', fullLabel: 'Sobota' },
    { value: 'sunday', label: 'Nd', fullLabel: 'Niedziela' }
  ];

  // Szybkie presety
  const quickPresets = [
    {
      name: '🏠 Cały dzień',
      windows: [{
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timeFrom: '08:00',
        timeTo: '20:00',
        label: 'Cały dzień'
      }]
    },
    {
      name: '🕐 Po pracy',
      windows: [
        {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeFrom: '16:00',
          timeTo: '20:00',
          label: 'Po pracy'
        },
        {
          days: ['saturday', 'sunday'],
          timeFrom: '08:00',
          timeTo: '20:00',
          label: 'Weekend'
        }
      ]
    },
    {
      name: '🌙 Tylko wieczory',
      windows: [{
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeFrom: '18:00',
        timeTo: '20:00',
        label: 'Wieczory'
      }]
    },
    {
      name: '📅 Tylko weekendy',
      windows: [{
        days: ['saturday', 'sunday'],
        timeFrom: '10:00',
        timeTo: '18:00',
        label: 'Weekendy'
      }]
    }
  ];

  // Przelicz score przy każdej zmianie
  useEffect(() => {
    const availabilityData = {
      timeWindows,
      preferences,
      presenceHistory: value?.presenceHistory || [],
      stats: value?.stats || {}
    };

    const newScore = calculateAvailabilityScore(availabilityData);
    const newCategory = getAvailabilityCategory(newScore);
    
    setScore(newScore);
    setCategory(newCategory);

    // Callback do rodzica
    if (onChange) {
      onChange({
        ...availabilityData,
        score: newScore,
        category: newCategory.category,
        notes,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [timeWindows, preferences, notes]);

  // Dodaj nowe okno
  const addTimeWindow = () => {
    setTimeWindows([
      ...timeWindows,
      {
        days: [],
        timeFrom: '09:00',
        timeTo: '17:00',
        label: ''
      }
    ]);
  };

  // Usuń okno
  const removeTimeWindow = (index) => {
    setTimeWindows(timeWindows.filter((_, i) => i !== index));
  };

  // Aktualizuj okno
  const updateTimeWindow = (index, field, value) => {
    const newWindows = [...timeWindows];
    newWindows[index] = {
      ...newWindows[index],
      [field]: value
    };
    setTimeWindows(newWindows);
  };

  // Toggle dzień w oknie
  const toggleDay = (windowIndex, day) => {
    const newWindows = [...timeWindows];
    const days = newWindows[windowIndex].days;
    
    if (days.includes(day)) {
      newWindows[windowIndex].days = days.filter(d => d !== day);
    } else {
      newWindows[windowIndex].days = [...days, day];
    }
    
    setTimeWindows(newWindows);
  };

  // Zastosuj preset
  const applyPreset = (preset) => {
    setTimeWindows(preset.windows);
  };

  // Wizualizacja kalendarza tygodniowego
  const renderWeeklyCalendar = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header z godzinami */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Rzędy dla każdego dnia */}
          {daysOfWeek.map(day => {
            const isDayAvailable = timeWindows.some(w => w.days.includes(day.value));
            
            return (
              <div key={day.value} className="flex mb-1">
                <div className="w-16 text-xs font-medium text-gray-700 flex items-center">
                  {day.label}
                </div>
                <div className="flex-1 flex relative h-8 bg-gray-100 rounded">
                  {hours.map((hour, idx) => (
                    <div
                      key={hour}
                      className="flex-1 border-r border-gray-200 last:border-r-0"
                    />
                  ))}
                  
                  {/* Overlay z oknami dostępności */}
                  {timeWindows.map((window, wIdx) => {
                    if (!window.days.includes(day.value)) return null;

                    const [fromH, fromM] = window.timeFrom.split(':').map(Number);
                    const [toH, toM] = window.timeTo.split(':').map(Number);
                    
                    const startPercent = ((fromH - 8 + fromM / 60) / 12) * 100;
                    const endPercent = ((toH - 8 + toM / 60) / 12) * 100;
                    const width = endPercent - startPercent;

                    return (
                      <div
                        key={wIdx}
                        className="absolute h-full bg-green-500 opacity-70 rounded"
                        style={{
                          left: `${startPercent}%`,
                          width: `${width}%`
                        }}
                        title={`${window.timeFrom} - ${window.timeTo}${window.label ? ' (' + window.label + ')' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 opacity-70 rounded"></div>
            <span>Dostępny</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Niedostępny</span>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    // Kompaktowy widok - tylko score i przycisk
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiHome size={24} className="text-blue-600" />
            <div>
              <div className="text-sm font-medium text-gray-700">Dostępność w domu</div>
              {category && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${category.badgeClass} mt-1`}>
                  <span>{category.emoji}</span>
                  <span>{score}/100</span>
                  <span>-</span>
                  <span>{category.label}</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {/* Otwórz modal */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edytuj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header z score */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <FiHome size={32} className="text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dostępność fizyczna klienta</h3>
            <p className="text-sm text-gray-600">Kiedy klient jest w domu i dostępny na wizytę?</p>
          </div>
        </div>
        {category && (
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{score}<span className="text-lg text-gray-500">/100</span></div>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${category.badgeClass} mt-1`}>
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Szybkie presety */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🚀 Szybki wybór:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista okien czasowych */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            ⏰ Okna dostępności
          </label>
          <button
            type="button"
            onClick={addTimeWindow}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiPlus size={16} />
            Dodaj okno
          </button>
        </div>

        {timeWindows.length === 0 && (
          <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <FiAlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-600">Brak okien dostępności</p>
            <p className="text-sm text-gray-500 mt-1">Dodaj okno lub wybierz szybki preset</p>
          </div>
        )}

        <div className="space-y-3">
          {timeWindows.map((window, index) => (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              {/* Dni tygodnia - checkboxy */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-2">Dni:</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <label
                      key={day.value}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                        ${window.days.includes(day.value)
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={window.days.includes(day.value)}
                        onChange={() => toggleDay(index, day.value)}
                        className="hidden"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Godziny */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Od:</label>
                  <input
                    type="time"
                    value={window.timeFrom}
                    onChange={(e) => updateTimeWindow(index, 'timeFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Do:</label>
                  <input
                    type="time"
                    value={window.timeTo}
                    onChange={(e) => updateTimeWindow(index, 'timeTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Etykieta */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.label}
                  onChange={(e) => updateTimeWindow(index, 'label', e.target.value)}
                  placeholder="Etykieta (np. 'Po pracy', 'Weekend')"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeTimeWindow(index)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wizualizacja kalendarza */}
      {timeWindows.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiClock className="text-blue-600" />
            Wizualizacja dostępności
          </h4>
          {renderWeeklyCalendar()}
        </div>
      )}

      {/* Preferencje */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">⚙️ Dodatkowe opcje</h4>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.flexibleSchedule}
              onChange={(e) => setPreferences({...preferences, flexibleSchedule: e.target.checked})}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Elastyczny harmonogram</div>
              <div className="text-sm text-gray-600">Klient może przyjąć technika w dowolnym momencie</div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.requiresAdvanceNotice}
              onChange={(e) => setPreferences({...preferences, requiresAdvanceNotice: e.target.checked})}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Wymaga powiadomienia z wyprzedzeniem</div>
              <div className="text-sm text-gray-600">Trzeba uprzedzić klienta przed wizytą</div>
            </div>
          </label>

          {preferences.requiresAdvanceNotice && (
            <div className="ml-7 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ile godzin wcześniej?
              </label>
              <select
                value={preferences.advanceNoticeHours}
                onChange={(e) => setPreferences({...preferences, advanceNoticeHours: parseInt(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={2}>2 godziny</option>
                <option value={4}>4 godziny</option>
                <option value={12}>12 godzin</option>
                <option value={24}>24 godziny (1 dzień)</option>
                <option value={48}>48 godzin (2 dni)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Notatki */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Notatki o dostępności:
        </label>
        <textarea
          value={notes.join('\n')}
          onChange={(e) => setNotes(e.target.value.split('\n').filter(n => n.trim()))}
          placeholder="Np. 'Pracuje 8-16, dzwonić przed przyjazdem'&#10;'Preferuje wizyty po 17:00'&#10;'W weekendy zawsze w domu'"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">💡 Wskazówki:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Im więcej godzin dostępności, tym wyższy score</li>
              <li>Dostępność w dni robocze to bonus punktów</li>
              <li>System automatycznie podpowie najlepszy czas wizyty</li>
              <li>Technik zobaczy alerty gdy planuje wizytę poza godzinami dostępności</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
