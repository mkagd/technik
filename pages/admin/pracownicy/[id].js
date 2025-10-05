// pages/admin/pracownicy/[id].js
// 🚀 STRONA EDYCJI/DODAWANIA PRACOWNIKA
// Kompletny formularz z zakładkami: podstawowe dane, czasy napraw, czasy zabudowy, specjalizacje

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import SecurityTab from '../../../components/admin/SecurityTab';
import { 
  FiSave, FiX, FiUser, FiClock, FiHome, FiTool, FiMapPin, 
  FiTrendingUp, FiTruck, FiAward, FiChevronLeft, FiAlertCircle, FiLock
} from 'react-icons/fi';

export default function PracownikEdycja() {
  const router = useRouter();
  const { id } = router.query;
  const isNewEmployee = id === 'nowy';

  // States
  const [loading, setLoading] = useState(!isNewEmployee);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  // Employee data
  const [employeeData, setEmployeeData] = useState({
    // Podstawowe
    name: '',
    email: '',
    phone: '',
    address: '',
    workingHours: '8:00-16:00',
    experience: '',
    isActive: true,
    specializations: [],
    
    // Czasy napraw
    repairTimes: {
      'pralka': 30,
      'lodówka': 40,
      'zmywarka': 35,
      'piekarnik': 45,
      'kuchenka': 40,
      'płyta indukcyjna': 35,
      'suszarka': 35,
      'pralko-suszarka': 45,
      'zamrażarka': 40,
      'ekspres do kawy': 25,
      'robot kuchenny': 30,
      'blender': 20,
      'sokowirówka': 20,
      'mikrofalówka': 25,
      'okap': 30,
      'inne AGD': 30
    },
    
    // Czasy zabudowy - NOWE!
    builtInWorkTimes: {
      demontaż: 10,
      montaż: 10,
      trudnaZabudowa: 30
    },
    
    // Specjalizacje AGD
    agdSpecializations: {
      primaryCategory: 'AGD',
      devices: [],
      specialSkills: []
    },
    
    // Obszar działania
    serviceArea: {
      primaryCity: '',
      radius: 30,
      preferredDistricts: [],
      maxDistanceKm: 40,
      avoidAreas: [],
      travelTimePreference: 'minimize'
    }
  });

  // Default repair times (reference)
  const defaultRepairTimes = {
    'pralka': 30,
    'lodówka': 40,
    'zmywarka': 35,
    'piekarnik': 45,
    'kuchenka': 40,
    'płyta indukcyjna': 35,
    'suszarka': 35,
    'pralko-suszarka': 45,
    'zamrażarka': 40,
    'ekspres do kawy': 25,
    'robot kuchenny': 30,
    'blender': 20,
    'sokowirówka': 20,
    'mikrofalówka': 25,
    'okap': 30,
    'inne AGD': 30
  };

  // Device types for AGD specializations
  const deviceTypes = [
    { value: 'pralka', label: 'Pralka', icon: '🧺' },
    { value: 'lodówka', label: 'Lodówka', icon: '🧊' },
    { value: 'zmywarka', label: 'Zmywarka', icon: '🍽️' },
    { value: 'piekarnik', label: 'Piekarnik', icon: '🔥' },
    { value: 'kuchenka', label: 'Kuchenka', icon: '🍳' },
    { value: 'płyta indukcyjna', label: 'Płyta indukcyjna', icon: '⚡' },
    { value: 'suszarka', label: 'Suszarka', icon: '🌬️' },
    { value: 'mikrofalówka', label: 'Mikrofalówka', icon: '📻' },
    { value: 'okap', label: 'Okap', icon: '💨' }
  ];

  const brands = ['Samsung', 'LG', 'Bosch', 'Siemens', 'Whirlpool', 'Miele', 'Electrolux', 'Beko', 'Amica'];
  const experienceLevels = [
    { value: 'beginner', label: 'Początkujący', color: 'blue' },
    { value: 'advanced', label: 'Zaawansowany', color: 'green' },
    { value: 'expert', label: 'Ekspert', color: 'purple' }
  ];

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Podstawowe dane', icon: FiUser },
    { id: 'repair-times', label: 'Czasy napraw', icon: FiClock },
    { id: 'built-in-times', label: 'Czasy zabudowy', icon: FiHome },
    { id: 'specializations', label: 'Specjalizacje', icon: FiTool },
    { id: 'service-area', label: 'Obszar działania', icon: FiMapPin },
    { id: 'security', label: 'Bezpieczeństwo', icon: FiLock }
  ];

  // Load employee data
  useEffect(() => {
    if (!isNewEmployee && id) {
      loadEmployee();
    }
  }, [id, isNewEmployee]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        const employee = data.employees.find(e => e.id === id);
        if (employee) {
          setEmployeeData({
            ...employeeData,
            ...employee,
            repairTimes: employee.repairTimes || employeeData.repairTimes,
            builtInWorkTimes: employee.builtInWorkTimes || employeeData.builtInWorkTimes,
            agdSpecializations: employee.agdSpecializations || employeeData.agdSpecializations,
            serviceArea: employee.serviceArea || employeeData.serviceArea
          });
        } else {
          showNotification('Pracownik nie znaleziony', 'error');
          router.push('/admin/pracownicy');
        }
      }
    } catch (error) {
      console.error('❌ Błąd ładowania pracownika:', error);
      showNotification('Błąd ładowania danych pracownika', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    const newErrors = {};
    if (!employeeData.name || employeeData.name.trim().length < 3) {
      newErrors.name = 'Imię i nazwisko musi mieć min. 3 znaki';
    }
    if (!employeeData.phone) {
      newErrors.phone = 'Telefon jest wymagany';
    }
    if (employeeData.email && !employeeData.email.includes('@')) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('basic');
      showNotification('Popraw błędy w formularzu', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const method = isNewEmployee ? 'POST' : 'PUT';
      const body = isNewEmployee ? employeeData : { id, ...employeeData };
      
      const response = await fetch('/api/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(
          isNewEmployee ? 'Pracownik dodany pomyślnie' : 'Pracownik zaktualizowany pomyślnie', 
          'success'
        );
        setHasChanges(false);
        router.push('/admin/pracownicy');
      } else {
        showNotification(data.message || 'Błąd zapisu', 'error');
      }
    } catch (error) {
      console.error('❌ Błąd zapisu:', error);
      showNotification('Błąd połączenia z serwerem', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Masz niezapisane zmiany. Czy na pewno chcesz wyjść?')) {
        router.push('/admin/pracownicy');
      }
    } else {
      router.push('/admin/pracownicy');
    }
  };

  const updateField = (field, value) => {
    setEmployeeData({ ...employeeData, [field]: value });
    setHasChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const updateNestedField = (parent, field, value) => {
    setEmployeeData({
      ...employeeData,
      [parent]: {
        ...employeeData[parent],
        [field]: value
      }
    });
    setHasChanges(true);
  };

  const showNotification = (message, type = 'info') => {
    // TODO: Replace with react-hot-toast
    alert(message);
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Ładowanie..."
        breadcrumbs={[
          { label: 'Pracownicy', path: '/admin/pracownicy' },
          { label: 'Ładowanie...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie danych pracownika...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isNewEmployee ? 'Dodaj Pracownika' : employeeData.name}
      breadcrumbs={[
        { label: 'Pracownicy', path: '/admin/pracownicy' },
        { label: isNewEmployee ? 'Nowy pracownik' : employeeData.name }
      ]}
    >
      {/* Action buttons */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiChevronLeft className="h-5 w-5 mr-1" />
          Powrót do listy
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiX className="inline mr-2 h-4 w-4" />
            Anuluj
          </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <FiSave className="inline mr-2 h-4 w-4" />
                    Zapisz
                  </>
                )}
              </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

      {/* Content - Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          
          {/* TAB: PODSTAWOWE DANE */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Podstawowe informacje</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Imię i nazwisko */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imię i nazwisko <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Jan Kowalski"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={employeeData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="jan.kowalski@techserwis.pl"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Telefon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={employeeData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+48 123 456 789"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1 h-4 w-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Adres */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres/Miasto
                    </label>
                    <input
                      type="text"
                      value={employeeData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Warszawa"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Godziny pracy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Godziny pracy
                    </label>
                    <input
                      type="text"
                      value={employeeData.workingHours}
                      onChange={(e) => updateField('workingHours', e.target.value)}
                      placeholder="8:00-16:00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: HH:MM-HH:MM</p>
                  </div>

                  {/* Doświadczenie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doświadczenie
                    </label>
                    <input
                      type="text"
                      value={employeeData.experience}
                      onChange={(e) => updateField('experience', e.target.value)}
                      placeholder="5 lat"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status aktywności */}
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={employeeData.isActive}
                        onChange={(e) => updateField('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Pracownik aktywny
                      </span>
                    </label>
                    <p className="mt-1 ml-6 text-xs text-gray-500">
                      Nieaktywni pracownicy nie będą widoczni w systemie przydziału zleceń
                    </p>
                  </div>

                  {/* Specjalizacje (proste) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specjalizacje (oddzielone przecinkami)
                    </label>
                    <textarea
                      value={employeeData.specializations?.join(', ') || ''}
                      onChange={(e) => updateField('specializations', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Serwis AGD, Naprawa pralek, Lodówki"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ogólne specjalizacje. Szczegółowe ustawienia AGD są w zakładce "Specjalizacje"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CZASY NAPRAW */}
          {activeTab === 'repair-times' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Czasy napraw dla urządzeń</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Ustaw indywidualne czasy napraw dla tego pracownika. Te czasy będą używane przy obliczaniu czasu wizyt.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(employeeData.repairTimes).map(([device, time]) => (
                    <div key={device} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900 capitalize">
                          {device}
                        </label>
                        <span className="text-xs text-gray-500">
                          Domyślnie: {defaultRepairTimes[device]} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={time}
                          onChange={(e) => {
                            const newTimes = { ...employeeData.repairTimes };
                            newTimes[device] = parseInt(e.target.value) || 0;
                            updateField('repairTimes', newTimes);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600">min</span>
                        <button
                          onClick={() => {
                            const newTimes = { ...employeeData.repairTimes };
                            newTimes[device] = defaultRepairTimes[device];
                            updateField('repairTimes', newTimes);
                          }}
                          className="px-2 py-2 text-xs text-blue-600 hover:text-blue-800"
                          title="Reset do domyślnego"
                        >
                          ↺
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <FiAlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Jak działają czasy napraw?</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Te czasy są bazowe dla każdego typu urządzenia</li>
                        <li>Do czasu bazowego system doda czasy zabudowy (jeśli dotyczy)</li>
                        <li>Krótszy czas = bardziej doświadczony pracownik</li>
                        <li>Używane w systemie planowania wizyt i kalkulacji czasu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CZASY ZABUDOWY - NOWA FUNKCJA! */}
          {activeTab === 'built-in-times' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Czasy pracy z zabudową</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Ustaw dodatkowy czas potrzebny na prace z urządzeniami zabudowanymi. Te czasy są dodawane do czasu bazowego naprawy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Demontaż */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <FiTool className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold text-gray-900">Demontaż</h4>
                        <p className="text-xs text-gray-600">Odkręcanie zabudowy</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={employeeData.builtInWorkTimes.demontaż}
                        onChange={(e) => updateNestedField('builtInWorkTimes', 'demontaż', parseInt(e.target.value) || 0)}
                        className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      />
                      <span className="text-lg font-medium text-gray-700">min</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">
                      Standardowo: 10-15 minut
                    </p>
                  </div>

                  {/* Montaż */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <FiHome className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold text-gray-900">Montaż</h4>
                        <p className="text-xs text-gray-600">Zakręcanie z powrotem</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={employeeData.builtInWorkTimes.montaż}
                        onChange={(e) => updateNestedField('builtInWorkTimes', 'montaż', parseInt(e.target.value) || 0)}
                        className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                      />
                      <span className="text-lg font-medium text-gray-700">min</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">
                      Standardowo: 10-15 minut
                    </p>
                  </div>

                  {/* Trudna zabudowa */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <FiAlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold text-gray-900">Trudna zabudowa</h4>
                        <p className="text-xs text-gray-600">Skomplikowany dostęp</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={employeeData.builtInWorkTimes.trudnaZabudowa}
                        onChange={(e) => updateNestedField('builtInWorkTimes', 'trudnaZabudowa', parseInt(e.target.value) || 0)}
                        className="flex-1 px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold"
                      />
                      <span className="text-lg font-medium text-gray-700">min</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">
                      Standardowo: 25-35 minut
                    </p>
                  </div>
                </div>

                {/* Example calculation */}
                <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Przykład obliczenia czasu wizyty</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-purple-200">
                      <span className="text-sm font-medium text-gray-700">Naprawa pralki (czas bazowy):</span>
                      <span className="text-sm font-semibold text-gray-900">{employeeData.repairTimes['pralka']} min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-purple-200">
                      <span className="text-sm font-medium text-gray-700">+ Demontaż zabudowy:</span>
                      <span className="text-sm font-semibold text-blue-600">+{employeeData.builtInWorkTimes.demontaż} min</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-purple-200">
                      <span className="text-sm font-medium text-gray-700">+ Montaż zabudowy:</span>
                      <span className="text-sm font-semibold text-green-600">+{employeeData.builtInWorkTimes.montaż} min</span>
                    </div>
                    <div className="flex items-center justify-between py-3 bg-white rounded-lg px-4">
                      <span className="text-base font-bold text-gray-900">Całkowity czas wizyty:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {employeeData.repairTimes['pralka'] + employeeData.builtInWorkTimes.demontaż + employeeData.builtInWorkTimes.montaż} min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">⭐ NOWA FUNKCJA!</p>
                      <p>
                        Te ustawienia są nowością w systemie. Pozwalają na precyzyjne kalkulowanie czasu napraw 
                        urządzeń zabudowanych, co poprawia dokładność planowania wizyt i zadowolenie klientów.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SPECJALIZACJE AGD */}
          {activeTab === 'specializations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Specjalizacje AGD</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Określ szczegółowo w jakich urządzeniach i markach pracownik jest wyspecjalizowany
                </p>

                {/* Device specializations */}
                <div className="space-y-4">
                  {deviceTypes.map((deviceType) => {
                    const existingSpec = employeeData.agdSpecializations.devices?.find(d => d.type === deviceType.value);
                    const isActive = !!existingSpec;

                    return (
                      <div key={deviceType.value} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{deviceType.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{deviceType.label}</h4>
                              {isActive && existingSpec && (
                                <p className="text-xs text-gray-600">
                                  {existingSpec.experienceYears} lat doświadczenia · {existingSpec.level}
                                </p>
                              )}
                            </div>
                          </div>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => {
                                const devices = [...(employeeData.agdSpecializations.devices || [])];
                                if (e.target.checked) {
                                  devices.push({
                                    type: deviceType.value,
                                    brands: [],
                                    experienceYears: 1,
                                    level: 'beginner',
                                    certifications: []
                                  });
                                } else {
                                  const index = devices.findIndex(d => d.type === deviceType.value);
                                  if (index > -1) devices.splice(index, 1);
                                }
                                updateNestedField('agdSpecializations', 'devices', devices);
                              }}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {isActive ? 'Aktywne' : 'Nieaktywne'}
                            </span>
                          </label>
                        </div>

                        {isActive && existingSpec && (
                          <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Experience years */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Lata doświadczenia
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={existingSpec.experienceYears}
                                onChange={(e) => {
                                  const devices = [...employeeData.agdSpecializations.devices];
                                  const index = devices.findIndex(d => d.type === deviceType.value);
                                  if (index > -1) {
                                    devices[index].experienceYears = parseInt(e.target.value) || 0;
                                    updateNestedField('agdSpecializations', 'devices', devices);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Level */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Poziom umiejętności
                              </label>
                              <select
                                value={existingSpec.level}
                                onChange={(e) => {
                                  const devices = [...employeeData.agdSpecializations.devices];
                                  const index = devices.findIndex(d => d.type === deviceType.value);
                                  if (index > -1) {
                                    devices[index].level = e.target.value;
                                    updateNestedField('agdSpecializations', 'devices', devices);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                {experienceLevels.map(level => (
                                  <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Brands */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Marki (wybierz wszystkie które obsługuje)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {brands.map(brand => {
                                  const isSelected = existingSpec.brands?.includes(brand);
                                  return (
                                    <button
                                      key={brand}
                                      onClick={() => {
                                        const devices = [...employeeData.agdSpecializations.devices];
                                        const index = devices.findIndex(d => d.type === deviceType.value);
                                        if (index > -1) {
                                          const currentBrands = devices[index].brands || [];
                                          if (isSelected) {
                                            devices[index].brands = currentBrands.filter(b => b !== brand);
                                          } else {
                                            devices[index].brands = [...currentBrands, brand];
                                          }
                                          updateNestedField('agdSpecializations', 'devices', devices);
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
                                      }`}
                                    >
                                      {brand}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: OBSZAR DZIAŁANIA */}
          {activeTab === 'service-area' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Obszar działania</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Określ gdzie pracownik świadczy usługi
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary city */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miasto główne
                    </label>
                    <input
                      type="text"
                      value={employeeData.serviceArea.primaryCity}
                      onChange={(e) => updateNestedField('serviceArea', 'primaryCity', e.target.value)}
                      placeholder="Warszawa"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promień działania: <span className="text-blue-600 font-semibold">{employeeData.serviceArea.radius} km</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={employeeData.serviceArea.radius}
                      onChange={(e) => updateNestedField('serviceArea', 'radius', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5 km</span>
                      <span>100 km</span>
                    </div>
                  </div>

                  {/* Preferred districts */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferowane dzielnice/obszary
                    </label>
                    <input
                      type="text"
                      value={employeeData.serviceArea.preferredDistricts?.join(', ') || ''}
                      onChange={(e) => updateNestedField('serviceArea', 'preferredDistricts', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Mokotów, Ursynów, Wilanów"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Oddziel przecinkami</p>
                  </div>

                  {/* Avoid areas */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Obszary których unika
                    </label>
                    <input
                      type="text"
                      value={employeeData.serviceArea.avoidAreas?.join(', ') || ''}
                      onChange={(e) => updateNestedField('serviceArea', 'avoidAreas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Centrum w godzinach szczytu"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Oddziel przecinkami</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BEZPIECZEŃSTWO */}
          {activeTab === 'security' && !isNewEmployee && (
            <SecurityTab 
              employeeId={id}
              employeeEmail={employeeData.email}
              employeeName={employeeData.name}
            />
          )}

          {/* Informacja dla nowych pracowników */}
          {activeTab === 'security' && isNewEmployee && (
            <div className="py-12 text-center">
              <FiLock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Zapisz pracownika aby zarządzać hasłem
              </h3>
              <p className="text-gray-600">
                Opcje bezpieczeństwa będą dostępne po pierwszym zapisaniu pracownika
              </p>
            </div>
          )}
          
      </div>
    </AdminLayout>
  );
}
