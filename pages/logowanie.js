// pages/logowanie.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import GoogleAuth from '../components/GoogleAuth';

export default function Logowanie() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Obsługa pomyślnego logowania Google
  const handleGoogleAuth = (userData) => {
    setErrors({ success: `Witaj ${userData.firstName}! Zostałeś pomyślnie zalogowany przez Google.` });

    // Przekierowanie po krótkiej chwili
    setTimeout(() => {
      const returnUrl = router.query.returnUrl || '/';
      router.push(returnUrl);
    }, 1500);
  };

  // Obsługa błędów logowania Google
  const handleGoogleError = (error) => {
    setErrors({ general: `Błąd logowania Google: ${error}` });
  };

  const validateForm = () => {
    const newErrors = {};

    // Walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    // Walidacja hasła
    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Wywołanie prawdziwego API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Błąd logowania');
      }

      // Zapisanie danych użytkownika w sesji
      const userData = {
        id: result.user.id,
        firstName: result.user.name.split(' ')[0],
        lastName: result.user.name.split(' ').slice(1).join(' ') || '',
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        city: result.user.city,
        address: result.user.address,
        loginTime: result.user.lastLogin,
        isLoggedIn: true
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('chatUserInfo', JSON.stringify(userData));

        if (formData.rememberMe) {
          localStorage.setItem('rememberUser', JSON.stringify({
            email: formData.email,
            rememberMe: true
          }));
        } else {
          localStorage.removeItem('rememberUser');
        }
      }

      // Pokazanie komunikatu sukcesu
      setErrors({ success: `Witaj ponownie, ${userData.firstName}! Zostałeś pomyślnie zalogowany.` });

      // Przekierowanie na stronę główną po krótkiej chwili
      setTimeout(() => {
        const returnUrl = router.query.returnUrl || '/';
        router.push(returnUrl);
      }, 1500);

    } catch (error) {
      console.error('Błąd podczas logowania:', error);
      setErrors({ general: error.message || 'Wystąpił błąd podczas logowania. Spróbuj ponownie.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Usuwanie błędów gdy użytkownik zaczyna pisać
    if (errors[name] || errors.general || errors.success) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: '',
        success: ''
      }));
    }
  };

  // Automatyczne wypełnienie danych jeśli "Zapamiętaj mnie" było zaznaczone
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedUser = localStorage.getItem('rememberUser');
      if (rememberedUser) {
        const userData = JSON.parse(rememberedUser);
        setFormData(prev => ({
          ...prev,
          email: userData.email,
          rememberMe: userData.rememberMe
        }));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <FiLogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Witaj ponownie</h1>
          <p className="text-gray-600">Zaloguj się do swojego konta</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {errors.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{errors.success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="twoj@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Hasło */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
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

            {/* Opcje */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Zapamiętaj mnie
                </label>
              </div>
              <Link href="/zapomniane-haslo" className="text-sm text-blue-600 hover:text-blue-800">
                Zapomniałeś hasła?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300'
                } text-white`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logowanie...
                </div>
              ) : (
                'Zaloguj się'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">lub</span>
              </div>
            </div>

            {/* Google Login */}
            <GoogleAuth
              onAuth={handleGoogleAuth}
              onError={handleGoogleError}
              buttonText="Zaloguj się przez Google"
            />

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Nie masz jeszcze konta?{' '}
                <Link href="/rejestracja" className="text-blue-600 hover:text-blue-800 font-medium">
                  Zarejestruj się
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Demo Users Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Dane testowe:</h4>
          <p className="text-xs text-yellow-700">
            Możesz utworzyć nowe konto lub użyć danych testowych, które zostaną utworzone automatycznie.
          </p>
        </div>
      </div>
    </div>
  );
}
