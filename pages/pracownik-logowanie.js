// pages/pracownik-logowanie.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiLock, FiEye, FiEyeOff, FiCalendar } from 'react-icons/fi';

export default function PracownikLogowanie() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Sprawdź czy pracownik jest już zalogowany
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeData = localStorage.getItem('employeeSession');
      if (employeeData) {
        setIsLoggedIn(true);
        router.push('/pracownik-panel');
      }
    }
  }, [router]);

  // Mock dane pracowników - w rzeczywistej aplikacji byłyby z bazy danych
  const employees = [
    {
      id: 1,
      email: 'marek.kowalski@techserwis.pl',
      password: 'haslo123',
      firstName: 'Marek',
      lastName: 'Kowalski',
      specialization: ['Naprawa AGD', 'Elektronika'],
      isActive: true
    },
    {
      id: 2,
      email: 'anna.nowak@techserwis.pl',
      password: 'haslo123',
      firstName: 'Anna',
      lastName: 'Nowak',
      specialization: ['Elektryk', 'Instalacje'],
      isActive: true
    },
    {
      id: 3,
      email: 'piotr.wisniewski@techserwis.pl',
      password: 'haslo123',
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      specialization: ['Hydraulik', 'Instalacje wodne'],
      isActive: true
    },
    {
      id: 4,
      email: 'jan.kowalczyk@techserwis.pl',
      password: 'haslo123',
      firstName: 'Jan',
      lastName: 'Kowalczyk',
      specialization: ['Instalacje gazowe', 'Hydraulik'],
      isActive: false
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Usuń błąd dla tego pola po rozpoczęciu pisania
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Symulacja opóźnienia logowania
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Znajdź pracownika
    const employee = employees.find(emp =>
      emp.email === formData.email && emp.password === formData.password
    );

    if (!employee) {
      setErrors({ general: 'Nieprawidłowy email lub hasło' });
      setIsLoading(false);
      return;
    }

    if (!employee.isActive) {
      setErrors({ general: 'Konto zostało dezaktywowane. Skontaktuj się z administratorem.' });
      setIsLoading(false);
      return;
    }

    // Zapisz sesję pracownika
    const sessionData = {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      specialization: employee.specialization,
      loginTime: new Date().toISOString(),
      rememberMe: formData.rememberMe
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('employeeSession', JSON.stringify(sessionData));
    }

    setIsLoading(false);
    router.push('/pracownik-panel');
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Przekierowywanie do panelu pracownika...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FiCalendar className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Pracownika</h1>
          <p className="text-gray-600 mt-2">Zaloguj się, aby zarządzać swoim kalendarzem pracy</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email służbowy
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="twoj.email@techserwis.pl"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Hasło
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Wprowadź hasło"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Zapamiętaj mnie
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logowanie...
              </div>
            ) : (
              'Zaloguj się'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Dane testowe: marek.kowalski@techserwis.pl / haslo123
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Powrót do strony głównej
          </a>
        </div>
      </div>
    </div>
  );
}
