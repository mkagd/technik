// pages/admin-kalendarz.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from 'react-calendar';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiLogOut,
  FiUsers,
  FiEye,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import 'react-calendar/dist/Calendar.css';

export default function AdminKalendarz() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [allSchedules, setAllSchedules] = useState({});
  const router = useRouter();

  // Mock dane pracowników
  const mockEmployees = [
    {
      id: 1,
      firstName: 'Marek',
      lastName: 'Kowalski',
      email: 'marek.kowalski@techserwis.pl',
      specialization: ['Naprawa AGD', 'Elektronika'],
      isActive: true
    },
    {
      id: 2,
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@techserwis.pl',
      specialization: ['Elektryk', 'Instalacje'],
      isActive: true
    },
    {
      id: 3,
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@techserwis.pl',
      specialization: ['Hydraulik', 'Instalacje wodne'],
      isActive: true
    }
  ];

  useEffect(() => {
    if (auth) {
      setEmployees(mockEmployees);
      loadAllSchedules();
    }
  }, [auth]);

  const checkLogin = () => {
    if (password === 'admin123') {
      setAuth(true);
    } else {
      alert('Błędne hasło');
    }
  };

  const loadAllSchedules = () => {
    const schedules = {};

    mockEmployees.forEach(employee => {
      if (typeof window !== 'undefined') {
        const employeeSchedule = localStorage.getItem(`workSchedule_${employee.id}`);
        if (employeeSchedule) {
          schedules[employee.id] = JSON.parse(employeeSchedule);
        } else {
          schedules[employee.id] = {};
        }
      }
    });

    setAllSchedules(schedules);
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getEmployeeScheduleForDate = (employeeId, date) => {
    const dateKey = formatDateKey(date);
    return allSchedules[employeeId]?.[dateKey] || [];
  };

  const getAllEmployeesScheduleForDate = (date) => {
    const dateKey = formatDateKey(date);
    const allSlots = [];

    employees.forEach(employee => {
      const employeeSlots = allSchedules[employee.id]?.[dateKey] || [];
      employeeSlots.forEach(slot => {
        allSlots.push({
          ...slot,
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeSpecialization: employee.specialization
        });
      });
    });

    return allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSelectedDateSchedule = () => {
    if (selectedEmployee === 'all') {
      return getAllEmployeesScheduleForDate(selectedDate);
    } else {
      const employeeId = parseInt(selectedEmployee);
      return getEmployeeScheduleForDate(employeeId, selectedDate).map(slot => ({
        ...slot,
        employeeId: employeeId,
        employeeName: employees.find(e => e.id === employeeId)?.firstName + ' ' + employees.find(e => e.id === employeeId)?.lastName,
        employeeSpecialization: employees.find(e => e.id === employeeId)?.specialization
      }));
    }
  };

  const getEmployeeAvailabilityForDate = (employeeId, date) => {
    const schedule = getEmployeeScheduleForDate(employeeId, date);

    if (schedule.length === 0) return 'unavailable';

    const hasAvailable = schedule.some(slot => slot.isAvailable);
    const hasUnavailable = schedule.some(slot => !slot.isAvailable);

    if (hasAvailable && hasUnavailable) return 'partial';
    if (hasAvailable) return 'available';
    return 'unavailable';
  };

  const getTotalAvailabilityForDate = (date) => {
    const availabilities = employees.map(emp =>
      getEmployeeAvailabilityForDate(emp.id, date)
    );

    const availableCount = availabilities.filter(a => a === 'available').length;
    const partialCount = availabilities.filter(a => a === 'partial').length;
    const totalActive = employees.filter(e => e.isActive).length;

    if (availableCount === totalActive) return 'available';
    if (availableCount + partialCount > 0) return 'partial';
    return 'unavailable';
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      if (selectedEmployee === 'all') {
        const availability = getTotalAvailabilityForDate(date);
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
      } else {
        const employeeId = parseInt(selectedEmployee);
        const availability = getEmployeeAvailabilityForDate(employeeId, date);
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
    }
  };

  const getAvailableEmployeesCount = (date) => {
    return employees.filter(emp =>
      getEmployeeAvailabilityForDate(emp.id, date) !== 'unavailable'
    ).length;
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FiCalendar className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Kalendarz Pracowników</h1>
            <p className="text-gray-600 mt-2">Panel administratora</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Hasło administratora
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Wprowadź hasło"
                onKeyPress={(e) => e.key === 'Enter' && checkLogin()}
              />
            </div>

            <button
              onClick={checkLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium"
            >
              Zaloguj się
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Hasło: admin123</p>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/admin-new"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Powrót do panelu administratora
            </a>
          </div>
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
                  Kalendarz Pracowników
                </h1>
                <p className="text-gray-600">
                  Zarządzanie harmonogramami pracy
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadAllSchedules}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Odśwież
              </button>
              <button
                onClick={() => router.push('/admin-new')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Panel Admin
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters and Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <FiFilter className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Filtry</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pracownik
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Wszyscy pracownicy</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.specialization.join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kalendarz</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                    <span>Dostępny</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                    <span>Częściowo</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
                    <span>Niedostępny</span>
                  </div>
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
          </div>

          {/* Schedule Details */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Podsumowanie
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dzień tygodnia:</span>
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString('pl-PL', { weekday: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dostępni pracownicy:</span>
                  <span className="font-medium">
                    {getAvailableEmployeesCount(selectedDate)} / {employees.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sloty czasowe:</span>
                  <span className="font-medium">
                    {selectedDateSchedule.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule for Selected Date */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Harmonogram na {selectedDate.toLocaleDateString('pl-PL')}
                </h3>
              </div>

              <div className="space-y-3">
                {selectedDateSchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedEmployee === 'all'
                        ? 'Brak slotów czasowych dla żadnego pracownika'
                        : 'Brak slotów czasowych dla wybranego pracownika'
                      }
                    </p>
                  </div>
                ) : (
                  selectedDateSchedule.map((slot) => (
                    <div
                      key={`${slot.employeeId}_${slot.id}`}
                      className={`p-4 rounded-lg border-2 ${slot.isAvailable
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="text-sm text-gray-600">
                            {slot.employeeName}
                          </div>
                          {slot.note && (
                            <div className="text-sm text-gray-500 mt-1">
                              {slot.note}
                            </div>
                          )}
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${slot.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {slot.isAvailable ? 'Dostępny' : 'Niedostępny'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {slot.employeeSpecialization?.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
