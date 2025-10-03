// pages/ustawienia-czasow.js
// Panel administracyjny do zarządzania czasami napraw

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FiArrowLeft, 
  FiSave, 
  FiRefreshCw,
  FiUser,
  FiClock,
  FiTool,
  FiSettings 
} from 'react-icons/fi';

export default function UstawieniaCzasow() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Dane z API
  const [settings, setSettings] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [additionalTimes, setAdditionalTimes] = useState({});
  
  // Edytowany pracownik
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [editedRepairTimes, setEditedRepairTimes] = useState({});

  // Funkcja pokazywania notyfikacji
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Ładowanie danych z API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/repair-time-settings');
      if (!response.ok) {
        throw new Error('Błąd ładowania ustawień');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      setEmployees(data.employees);
      setDeviceTypes(data.deviceTypes);
      setAdditionalTimes(data.additionalTimes);
      
      // Wybierz pierwszego pracownika domyślnie
      if (data.employees.length > 0) {
        setSelectedEmployeeId(data.employees[0].id);
        setEditedRepairTimes(data.employees[0].repairTimes || {});
      }
      
      showNotification('Ustawienia załadowane pomyślnie', 'success');
    } catch (error) {
      console.error('Błąd ładowania ustawień:', error);
      showNotification('Błąd ładowania ustawień: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Zmiana wybranego pracownika
  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployeeId(employeeId);
      setEditedRepairTimes(employee.repairTimes || {});
    }
  };

  // Zmiana czasu naprawy dla urządzenia
  const handleRepairTimeChange = (deviceType, newTime) => {
    setEditedRepairTimes(prev => ({
      ...prev,
      [deviceType]: parseInt(newTime) || 0
    }));
  };

  // Zapisywanie czasów napraw pracownika
  const saveEmployeeRepairTimes = async () => {
    if (!selectedEmployeeId) {
      showNotification('Wybierz pracownika', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/repair-time-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'employeeRepairTimes',
          data: {
            employeeId: selectedEmployeeId,
            repairTimes: editedRepairTimes
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Błąd zapisywania');
      }

      const result = await response.json();
      showNotification(result.message, 'success');
      
      // Odśwież dane
      await loadSettings();
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      showNotification('Błąd zapisywania: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Zapisywanie czasów dodatkowych
  const saveAdditionalTimes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/repair-time-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'additionalTimes',
          data: {
            demontaz: additionalTimes.demontaż?.time,
            montaz: additionalTimes.montaż?.time,
            trudnaZabudowa: additionalTimes.trudnaZabudowa?.time
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Błąd zapisywania');
      }

      const result = await response.json();
      showNotification(result.message, 'success');
      
      // Odśwież dane
      await loadSettings();
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      showNotification('Błąd zapisywania: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie ustawień...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nagłówek */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FiSettings className="h-7 w-7 text-blue-600" />
                  Ustawienia czasów napraw
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Zarządzaj czasami napraw dla pracowników i typów urządzeń
                </p>
              </div>
            </div>
            <button
              onClick={loadSettings}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="h-4 w-4" />
              Odśwież
            </button>
          </div>
        </div>
      </div>

      {/* Notyfikacja */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel czasów dodatkowych */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiClock className="h-5 w-5 text-blue-600" />
                Czasy dodatkowe
              </h2>
              
              <div className="space-y-4">
                {Object.entries(additionalTimes).map(([key, value]) => {
                  if (key === 'dodatkowy') return null; // Pomijamy "dodatkowy" bo jest ręczny
                  
                  return (
                    <div key={key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {value.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={value.time}
                          onChange={(e) => {
                            setAdditionalTimes(prev => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                time: parseInt(e.target.value) || 0
                              }
                            }));
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600">min</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{value.description}</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={saveAdditionalTimes}
                disabled={isSaving}
                className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="h-4 w-4" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz czasy dodatkowe'}
              </button>
            </div>
          </div>

          {/* Panel czasów napraw pracowników */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="h-5 w-5 text-blue-600" />
                Czasy napraw pracownika
              </h2>

              {/* Wybór pracownika */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz pracownika
                </label>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      👨‍🔧 {emp.name} {emp.specializations?.join(', ') ? `- ${emp.specializations.join(', ')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informacje o pracowniku */}
              {selectedEmployee && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    {selectedEmployee.name}
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    {selectedEmployee.specializations && (
                      <p>🔧 Specjalizacje: {selectedEmployee.specializations.join(', ')}</p>
                    )}
                    {selectedEmployee.agdSpecializations?.devices && (
                      <p>📋 Urządzenia: {selectedEmployee.agdSpecializations.devices.map(d => d.type).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tabela czasów napraw */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deviceTypes.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{device.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{device.label}</p>
                        <p className="text-xs text-gray-500">
                          Domyślnie: {device.defaultTime} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="300"
                        step="5"
                        value={editedRepairTimes[device.id] || device.defaultTime}
                        onChange={(e) => handleRepairTimeChange(device.id, e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600 min-w-[30px]">min</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={saveEmployeeRepairTimes}
                disabled={isSaving || !selectedEmployeeId}
                className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <FiSave className="h-5 w-5" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz czasy napraw'}
              </button>
            </div>
          </div>
        </div>

        {/* Pomoc */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <FiTool className="h-5 w-5" />
            Jak to działa?
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Czasy dodatkowe</strong> - dotyczą wszystkich pracowników i są dodawane do czasu bazowego (demontaż, montaż, trudna zabudowa).
            </p>
            <p>
              <strong>Czasy napraw pracownika</strong> - indywidualne czasy dla każdego pracownika na podstawie jego doświadczenia i specjalizacji.
            </p>
            <p>
              <strong>Obliczanie czasu wizyty:</strong> Czas bazowy pracownika + czasy dodatkowe + czas ręczny = całkowity czas wizyty
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
