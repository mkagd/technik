// pages/kalendarz-prosty.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiCalendar, FiHome, FiLogOut, FiSave } from 'react-icons/fi';

export default function KalendarzProsty() {
  const [employee, setEmployee] = useState(null);
  const [workDays, setWorkDays] = useState({
    monday: { enabled: true, start: '08:00', end: '16:00' },
    tuesday: { enabled: true, start: '08:00', end: '16:00' },
    wednesday: { enabled: true, start: '08:00', end: '16:00' },
    thursday: { enabled: true, start: '08:00', end: '16:00' },
    friday: { enabled: true, start: '08:00', end: '16:00' },
    saturday: { enabled: false, start: '09:00', end: '14:00' },
    sunday: { enabled: false, start: '10:00', end: '14:00' }
  });

  const router = useRouter();

  const days = [
    { key: 'monday', name: 'Poniedziałek' },
    { key: 'tuesday', name: 'Wtorek' },
    { key: 'wednesday', name: 'Środa' },
    { key: 'thursday', name: 'Czwartek' },
    { key: 'friday', name: 'Piątek' },
    { key: 'saturday', name: 'Sobota' },
    { key: 'sunday', name: 'Niedziela' }
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

      // Załaduj zapisane godziny
      const savedSchedule = localStorage.getItem(`schedule_${employeeData.id}`);
      if (savedSchedule) {
        setWorkDays(JSON.parse(savedSchedule));
      }
    }
  }, [router]);

  const updateDay = (dayKey, field, value) => {
    setWorkDays(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const saveSchedule = () => {
    if (employee) {
      localStorage.setItem(`schedule_${employee.id}`, JSON.stringify(workDays));
      alert('Harmonogram zapisany!');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('employeeSession');
      router.push('/pracownik-logowanie');
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiCalendar className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Harmonogram Pracy</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <FiHome className="h-4 w-4 mr-2" />
                Panel
              </button>
              <button
                onClick={saveSchedule}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <FiSave className="h-4 w-4 mr-2" />
                Zapisz
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                <FiLogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Ustaw godziny pracy dla {employee.firstName} {employee.lastName}
            </h2>

            <div className="space-y-4">
              {days.map(day => (
                <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={workDays[day.key].enabled}
                          onChange={(e) => updateDay(day.key, 'enabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="ml-3 text-lg font-medium text-gray-900">
                          {day.name}
                        </span>
                      </label>
                    </div>

                    {workDays[day.key].enabled && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Od:</label>
                          <input
                            type="time"
                            value={workDays[day.key].start}
                            onChange={(e) => updateDay(day.key, 'start', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Do:</label>
                          <input
                            type="time"
                            value={workDays[day.key].end}
                            onChange={(e) => updateDay(day.key, 'end', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!workDays[day.key].enabled && (
                    <p className="mt-2 text-sm text-gray-500">Dzień wolny</p>
                  )}
                </div>
              ))}
            </div>

            {/* Podsumowanie */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Podsumowanie tygodnia:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Dni robocze:</p>
                  <p className="font-medium">
                    {Object.values(workDays).filter(day => day.enabled).length} dni
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Łączne godziny w tygodniu:</p>
                  <p className="font-medium">
                    {Object.values(workDays)
                      .filter(day => day.enabled)
                      .reduce((total, day) => {
                        const start = new Date(`2000-01-01 ${day.start}`);
                        const end = new Date(`2000-01-01 ${day.end}`);
                        return total + (end - start) / (1000 * 60 * 60);
                      }, 0)} godzin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}