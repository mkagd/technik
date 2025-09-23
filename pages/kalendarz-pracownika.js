// pages/kalendarz-pracownika.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from 'react-calendar';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
  FiLogOut,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiCopy,
  FiRefreshCw,
  FiSettings,
  FiAlertCircle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUpload
} from 'react-icons/fi';
import 'react-calendar/dist/Calendar.css';

export default function KalendarzPracownika() {
  const [employee, setEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workSchedule, setWorkSchedule] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [currentView, setCurrentView] = useState('month'); // month, week, day
  const [weeklyTemplate, setWeeklyTemplate] = useState({});
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
    isAvailable: true,
    note: '',
    maxBookings: 1,
    breakDuration: 0
  });
  const [copyOptions, setCopyOptions] = useState({
    copyType: 'day', // day, week, month
    targetDate: new Date(),
    overwrite: false
  });
  const router = useRouter();

  // Sprawdź autoryzację i załaduj dane pracownika
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeData = localStorage.getItem('employeeSession');
      if (!employeeData) {
        router.push('/pracownik-logowanie');
        return;
      }

      const parsedData = JSON.parse(employeeData);
      setEmployee(parsedData);

      // Załaduj harmonogram z localStorage
      const savedSchedule = localStorage.getItem(`workSchedule_${parsedData.id}`);
      if (savedSchedule) {
        setWorkSchedule(JSON.parse(savedSchedule));
      }

      // Załaduj szablon tygodniowy
      const savedTemplate = localStorage.getItem(`weeklyTemplate_${parsedData.id}`);
      if (savedTemplate) {
        setWeeklyTemplate(JSON.parse(savedTemplate));
      } else {
        // Utwórz domyślny szablon
        const defaultTemplate = createDefaultWeeklyTemplate();
        setWeeklyTemplate(defaultTemplate);
      }
    }
  }, [router]);

  const createDefaultWeeklyTemplate = () => {
    return {
      1: [ // Poniedziałek
        { startTime: '08:00', endTime: '12:00', isAvailable: true, note: 'Godziny przedpołudniowe', maxBookings: 1, breakDuration: 0 },
        { startTime: '13:00', endTime: '17:00', isAvailable: true, note: 'Godziny popołudniowe', maxBookings: 1, breakDuration: 0 }
      ],
      2: [ // Wtorek
        { startTime: '08:00', endTime: '12:00', isAvailable: true, note: 'Godziny przedpołudniowe', maxBookings: 1, breakDuration: 0 },
        { startTime: '13:00', endTime: '17:00', isAvailable: true, note: 'Godziny popołudniowe', maxBookings: 1, breakDuration: 0 }
      ],
      3: [ // Środa
        { startTime: '08:00', endTime: '12:00', isAvailable: true, note: 'Godziny przedpołudniowe', maxBookings: 1, breakDuration: 0 },
        { startTime: '13:00', endTime: '17:00', isAvailable: true, note: 'Godziny popołudniowe', maxBookings: 1, breakDuration: 0 }
      ],
      4: [ // Czwartek
        { startTime: '08:00', endTime: '12:00', isAvailable: true, note: 'Godziny przedpołudniowe', maxBookings: 1, breakDuration: 0 },
        { startTime: '13:00', endTime: '17:00', isAvailable: true, note: 'Godziny popołudniowe', maxBookings: 1, breakDuration: 0 }
      ],
      5: [ // Piątek
        { startTime: '08:00', endTime: '14:00', isAvailable: true, note: 'Piątek - krótszy dzień', maxBookings: 1, breakDuration: 0 }
      ],
      6: [], // Sobota - wolne
      0: []  // Niedziela - wolne
    };
  };

  const saveSchedule = (newSchedule) => {
    setWorkSchedule(newSchedule);
    if (employee) {
      localStorage.setItem(`workSchedule_${employee.id}`, JSON.stringify(newSchedule));
    }
  };

  const saveWeeklyTemplate = (template) => {
    setWeeklyTemplate(template);
    if (employee) {
      localStorage.setItem(`weeklyTemplate_${employee.id}`, JSON.stringify(template));
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
    }
    router.push('/pracownik-logowanie');
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getSelectedDateSchedule = () => {
    const dateKey = formatDateKey(selectedDate);
    return workSchedule[dateKey] || [];
  };

  const handleAddSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert('Podaj godziny rozpoczęcia i zakończenia');
      return;
    }

    if (newSlot.startTime >= newSlot.endTime) {
      alert('Godzina rozpoczęcia musi być wcześniejsza niż zakończenia');
      return;
    }

    const dateKey = formatDateKey(selectedDate);
    const slot = {
      id: `${dateKey}_${Date.now()}`,
      ...newSlot,
      maxBookings: parseInt(newSlot.maxBookings) || 1,
      breakDuration: parseInt(newSlot.breakDuration) || 0,
      currentBookings: 0
    };

    const updatedSchedule = {
      ...workSchedule,
      [dateKey]: [...(workSchedule[dateKey] || []), slot]
    };

    saveSchedule(updatedSchedule);
    setShowAddModal(false);
    resetNewSlot();
  };

  const resetNewSlot = () => {
    setNewSlot({
      startTime: '',
      endTime: '',
      isAvailable: true,
      note: '',
      maxBookings: 1,
      breakDuration: 0
    });
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot.id);
    setNewSlot({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      note: slot.note,
      maxBookings: slot.maxBookings || 1,
      breakDuration: slot.breakDuration || 0
    });
  };

  const handleSaveEdit = () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert('Podaj godziny rozpoczęcia i zakończenia');
      return;
    }

    const dateKey = formatDateKey(selectedDate);
    const updatedSlots = workSchedule[dateKey].map(slot =>
      slot.id === editingSlot
        ? {
          ...slot,
          ...newSlot,
          maxBookings: parseInt(newSlot.maxBookings) || 1,
          breakDuration: parseInt(newSlot.breakDuration) || 0
        }
        : slot
    );

    const updatedSchedule = {
      ...workSchedule,
      [dateKey]: updatedSlots
    };

    saveSchedule(updatedSchedule);
    setEditingSlot(null);
    resetNewSlot();
  };

  const handleDeleteSlot = (slotId) => {
    if (confirm('Czy na pewno chcesz usunąć ten slot?')) {
      const dateKey = formatDateKey(selectedDate);
      const updatedSlots = workSchedule[dateKey].filter(slot => slot.id !== slotId);

      const updatedSchedule = {
        ...workSchedule,
        [dateKey]: updatedSlots
      };

      saveSchedule(updatedSchedule);
    }
  };

  const toggleSlotAvailability = (slotId) => {
    const dateKey = formatDateKey(selectedDate);
    const updatedSlots = workSchedule[dateKey].map(slot =>
      slot.id === slotId
        ? { ...slot, isAvailable: !slot.isAvailable }
        : slot
    );

    const updatedSchedule = {
      ...workSchedule,
      [dateKey]: updatedSlots
    };

    saveSchedule(updatedSchedule);
  };

  const getDayAvailability = (date) => {
    const dateKey = formatDateKey(date);
    const daySchedule = workSchedule[dateKey] || [];

    if (daySchedule.length === 0) return 'unavailable';

    const hasAvailable = daySchedule.some(slot => slot.isAvailable);
    const hasUnavailable = daySchedule.some(slot => !slot.isAvailable);

    if (hasAvailable && hasUnavailable) return 'partial';
    if (hasAvailable) return 'available';
    return 'unavailable';
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const availability = getDayAvailability(date);
      switch (availability) {
        case 'available':
          return 'bg-green-100 text-green-800';
        case 'partial':
          return 'bg-yellow-100 text-yellow-800';
        case 'unavailable':
          return 'bg-red-100 text-red-800';
        default:
          return '';
      }
    }
  };

  const applyWeeklyTemplate = (targetDate) => {
    const weekStart = new Date(targetDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Poniedziałek

    const updatedSchedule = { ...workSchedule };

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      const dateKey = formatDateKey(currentDate);

      if (weeklyTemplate[dayOfWeek]) {
        const slots = weeklyTemplate[dayOfWeek].map((template, index) => ({
          id: `${dateKey}_template_${index}`,
          ...template,
          currentBookings: 0
        }));
        updatedSchedule[dateKey] = slots;
      } else {
        updatedSchedule[dateKey] = [];
      }
    }

    saveSchedule(updatedSchedule);
    alert('Szablon tygodniowy został zastosowany!');
  };

  const copySchedule = () => {
    const sourceDateKey = formatDateKey(selectedDate);
    const sourceSchedule = workSchedule[sourceDateKey] || [];

    if (sourceSchedule.length === 0) {
      alert('Brak harmonogramu do skopiowania z wybranego dnia');
      return;
    }

    const updatedSchedule = { ...workSchedule };

    if (copyOptions.copyType === 'day') {
      const targetDateKey = formatDateKey(copyOptions.targetDate);
      if (copyOptions.overwrite || !updatedSchedule[targetDateKey] || updatedSchedule[targetDateKey].length === 0) {
        const copiedSlots = sourceSchedule.map((slot, index) => ({
          ...slot,
          id: `${targetDateKey}_copied_${index}_${Date.now()}`,
          currentBookings: 0
        }));
        updatedSchedule[targetDateKey] = copiedSlots;
      }
    } else if (copyOptions.copyType === 'week') {
      const targetWeekStart = new Date(copyOptions.targetDate);
      targetWeekStart.setDate(targetWeekStart.getDate() - targetWeekStart.getDay() + 1);

      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(targetWeekStart);
        targetDate.setDate(targetWeekStart.getDate() + i);
        const targetDateKey = formatDateKey(targetDate);

        if (copyOptions.overwrite || !updatedSchedule[targetDateKey] || updatedSchedule[targetDateKey].length === 0) {
          const copiedSlots = sourceSchedule.map((slot, index) => ({
            ...slot,
            id: `${targetDateKey}_copied_${index}_${Date.now()}`,
            currentBookings: 0
          }));
          updatedSchedule[targetDateKey] = copiedSlots;
        }
      }
    }

    saveSchedule(updatedSchedule);
    setShowCopyModal(false);
    alert('Harmonogram został skopiowany!');
  };

  const exportSchedule = () => {
    const scheduleData = {
      employee: employee,
      schedule: workSchedule,
      weeklyTemplate: weeklyTemplate,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `harmonogram_${employee?.firstName}_${employee?.lastName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const importSchedule = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (importedData.schedule) {
          if (confirm('Czy chcesz zastąpić obecny harmonogram importowanym?')) {
            saveSchedule(importedData.schedule);
          }
        }

        if (importedData.weeklyTemplate) {
          if (confirm('Czy chcesz zastąpić obecny szablon tygodniowy importowanym?')) {
            saveWeeklyTemplate(importedData.weeklyTemplate);
          }
        }

        alert('Harmonogram został zaimportowany!');
      } catch (error) {
        alert('Błąd podczas importu pliku. Sprawdź format pliku.');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie kalendarza pracownika...</p>
        </div>
      </div>
    );
  }

  const selectedDateSchedule = getSelectedDateSchedule();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Zaawansowany Kalendarz Pracy
                </h1>
                <p className="text-gray-600">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  Specjalizacje: {employee.specialization.join(', ')}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Szablon tygodniowy"
              >
                <FiSettings className="h-4 w-4 mr-2" />
                Szablon
              </button>
              <button
                onClick={exportSchedule}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Eksportuj harmonogram"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                Eksport
              </button>
              <label className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                <FiUpload className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importSchedule}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => router.push('/integracja-rezerwacji')}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title="Zarządzanie rezerwacjami klientów"
              >
                <FiUsers className="h-4 w-4 mr-2" />
                Rezerwacje
              </button>
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Panel główny
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>

        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiCheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dostępne sloty</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(workSchedule).flat().filter(slot => slot.isAvailable).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FiClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Godziny pracy</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(workSchedule).flat().length * 2}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <FiAlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dni z harmonogramem</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(workSchedule).filter(date => workSchedule[date].length > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <FiUser className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rezerwacje</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(workSchedule).flat().reduce((sum, slot) => sum + (slot.currentBookings || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kalendarz */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Kalendarz Pracy</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                    <span>Dostępny</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
                    <span>Częściowo</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
                    <span>Niedostępny</span>
                  </div>
                </div>
                <button
                  onClick={() => applyWeeklyTemplate(selectedDate)}
                  className="flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  title="Zastosuj szablon tygodniowy"
                >
                  <FiRefreshCw className="h-4 w-4 mr-1" />
                  Szablon
                </button>
              </div>
            </div>

            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full"
              locale="pl-PL"
            />
          </div>

          {/* Harmonogram dnia */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Harmonogram na {selectedDate.toLocaleDateString('pl-PL')}
                </h2>
                <p className="text-gray-600">
                  {selectedDate.toLocaleDateString('pl-PL', { weekday: 'long' })}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <FiCopy className="h-4 w-4 mr-1" />
                  Kopiuj
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Dodaj slot
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Brak slotów czasowych na ten dzień</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Dodaj pierwszy slot
                  </button>
                </div>
              ) : (
                selectedDateSchedule
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-lg border-2 ${slot.isAvailable
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                        }`}
                    >
                      {editingSlot === slot.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Od
                              </label>
                              <input
                                type="time"
                                value={newSlot.startTime}
                                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Do
                              </label>
                              <input
                                type="time"
                                value={newSlot.endTime}
                                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notatka
                            </label>
                            <input
                              type="text"
                              value={newSlot.note}
                              onChange={(e) => setNewSlot({ ...newSlot, note: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg"
                              placeholder="Opcjonalna notatka"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max rezerwacji
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={newSlot.maxBookings}
                                onChange={(e) => setNewSlot({ ...newSlot, maxBookings: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Przerwa (min)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="60"
                                value={newSlot.breakDuration}
                                onChange={(e) => setNewSlot({ ...newSlot, breakDuration: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`available_${slot.id}`}
                              checked={newSlot.isAvailable}
                              onChange={(e) => setNewSlot({ ...newSlot, isAvailable: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`available_${slot.id}`} className="ml-2 block text-sm text-gray-700">
                              Dostępny do rezerwacji
                            </label>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <FiSave className="h-4 w-4 mr-1" />
                              Zapisz
                            </button>
                            <button
                              onClick={() => setEditingSlot(null)}
                              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              <FiX className="h-4 w-4 mr-1" />
                              Anuluj
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {slot.isAvailable ? (
                              <FiCheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            ) : (
                              <FiXCircle className="h-5 w-5 text-red-600 mr-3" />
                            )}
                            <div>
                              <div className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {slot.note && (
                                <div className="text-sm text-gray-600">{slot.note}</div>
                              )}
                              <div className="text-xs text-gray-500 flex items-center space-x-4">
                                <span>{slot.isAvailable ? 'Dostępny' : 'Niedostępny'}</span>
                                <span>Max rezerwacji: {slot.maxBookings || 1}</span>
                                <span>Rezerwacje: {slot.currentBookings || 0}</span>
                                {slot.breakDuration > 0 && (
                                  <span>Przerwa: {slot.breakDuration}min</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => toggleSlotAvailability(slot.id)}
                              className={`p-1 rounded ${slot.isAvailable
                                  ? 'text-red-600 hover:bg-red-100'
                                  : 'text-green-600 hover:bg-green-100'
                                }`}
                              title={slot.isAvailable ? 'Oznacz jako niedostępny' : 'Oznacz jako dostępny'}
                            >
                              {slot.isAvailable ? <FiXCircle className="h-4 w-4" /> : <FiCheckCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleEditSlot(slot)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Edytuj"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Usuń"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal dodawania slotu */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Dodaj nowy slot</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Godzina rozpoczęcia
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Godzina zakończenia
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notatka (opcjonalna)
                </label>
                <input
                  type="text"
                  value={newSlot.note}
                  onChange={(e) => setNewSlot({ ...newSlot, note: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. Wizyty domowe, serwis w warsztacie"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksymalna liczba rezerwacji
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSlot.maxBookings}
                    onChange={(e) => setNewSlot({ ...newSlot, maxBookings: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przerwa po wizycie (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={newSlot.breakDuration}
                    onChange={(e) => setNewSlot({ ...newSlot, breakDuration: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={newSlot.isAvailable}
                  onChange={(e) => setNewSlot({ ...newSlot, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                  Dostępny do rezerwacji przez klientów
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dodaj slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal kopiowania harmonogramu */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Kopiuj harmonogram</h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ kopiowania
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="copyType"
                      value="day"
                      checked={copyOptions.copyType === 'day'}
                      onChange={(e) => setCopyOptions({ ...copyOptions, copyType: e.target.value })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Na jeden dzień</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="copyType"
                      value="week"
                      checked={copyOptions.copyType === 'week'}
                      onChange={(e) => setCopyOptions({ ...copyOptions, copyType: e.target.value })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Na cały tydzień</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data docelowa
                </label>
                <input
                  type="date"
                  value={copyOptions.targetDate.toISOString().split('T')[0]}
                  onChange={(e) => setCopyOptions({ ...copyOptions, targetDate: new Date(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={copyOptions.overwrite}
                  onChange={(e) => setCopyOptions({ ...copyOptions, overwrite: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="overwrite" className="ml-2 block text-sm text-gray-700">
                  Zastąp istniejący harmonogram
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCopyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={copySchedule}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Kopiuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal szablonu tygodniowego */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szablon tygodniowy</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'].map((dayName, dayIndex) => {
                const dayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1; // Niedziela = 0
                const daySlots = weeklyTemplate[dayOfWeek] || [];

                return (
                  <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{dayName}</h4>
                    <div className="space-y-2">
                      {daySlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updatedTemplate = { ...weeklyTemplate };
                              updatedTemplate[dayOfWeek][slotIndex].startTime = e.target.value;
                              setWeeklyTemplate(updatedTemplate);
                            }}
                            className="p-1 border border-gray-300 rounded text-sm"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updatedTemplate = { ...weeklyTemplate };
                              updatedTemplate[dayOfWeek][slotIndex].endTime = e.target.value;
                              setWeeklyTemplate(updatedTemplate);
                            }}
                            className="p-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            value={slot.note}
                            onChange={(e) => {
                              const updatedTemplate = { ...weeklyTemplate };
                              updatedTemplate[dayOfWeek][slotIndex].note = e.target.value;
                              setWeeklyTemplate(updatedTemplate);
                            }}
                            placeholder="Notatka"
                            className="flex-1 p-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              const updatedTemplate = { ...weeklyTemplate };
                              updatedTemplate[dayOfWeek].splice(slotIndex, 1);
                              setWeeklyTemplate(updatedTemplate);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updatedTemplate = { ...weeklyTemplate };
                          if (!updatedTemplate[dayOfWeek]) {
                            updatedTemplate[dayOfWeek] = [];
                          }
                          updatedTemplate[dayOfWeek].push({
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true,
                            note: '',
                            maxBookings: 1,
                            breakDuration: 0
                          });
                          setWeeklyTemplate(updatedTemplate);
                        }}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <FiPlus className="h-4 w-4 mr-1" />
                        Dodaj slot
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  saveWeeklyTemplate(weeklyTemplate);
                  setShowTemplateModal(false);
                  alert('Szablon tygodniowy został zapisany!');
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Zapisz szablon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
