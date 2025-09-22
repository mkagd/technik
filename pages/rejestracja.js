// pages/rejestracja.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import GoogleAuth from '../components/GoogleAuth';

export default function Rejestracja() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    address: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Obsługa pomyślnej rejestracji/logowania Google
  const handleGoogleAuth = (userData) => {
    setErrors({ success: `🎉 Witaj ${userData.firstName}! ${userData.isNewUser ? 'Twoje konto zostało utworzone' : 'Zostałeś zalogowany'} przez Google.` });

    // Przekierowanie po krótkiej chwili
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  // Obsługa błędów Google
  const handleGoogleError = (error) => {
    setErrors({ general: `Błąd Google: ${error}` });
  };

  const validateForm = () => {
    const newErrors = {};

    // Walidacja imienia
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Imię jest wymagane';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Imię musi mieć co najmniej 2 znaki';
    }

    // Walidacja nazwiska
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nazwisko jest wymagane';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Nazwisko musi mieć co najmniej 2 znaki';
    }

    // Walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    // Walidacja telefonu
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,15}$/;
    if (!formData.phone) {
      newErrors.phone = 'Numer telefonu jest wymagany';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Nieprawidłowy numer telefonu';
    }

    // Walidacja hasła
    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Hasło musi mieć co najmniej 6 znaków';
    }

    // Walidacja potwierdzenia hasła
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są identyczne';
    }

    // Walidacja miasta
    if (!formData.city.trim()) {
      newErrors.city = 'Miasto jest wymagane';
    }

    // Walidacja adresu
    if (!formData.address.trim()) {
      newErrors.address = 'Adres jest wymagany';
    }

    // Walidacja regulaminu
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Musisz zaakceptować regulamin';
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
      // Symulacja rejestracji - w rzeczywistej aplikacji to byłby request do API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Sprawdzenie czy email już istnieje (symulacja)
      if (typeof window === 'undefined') {
        setErrors({ general: 'Błąd: localStorage niedostępny podczas renderowania po stronie serwera' });
        setLoading(false);
        return;
      }

      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const emailExists = existingUsers.some(user => user.email === formData.email);

      if (emailExists) {
        setErrors({ email: 'Użytkownik z tym emailem już istnieje' });
        setLoading(false);
        return;
      }

      // Dodanie nowego użytkownika
      const newUser = {
        id: Date.now(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        password: formData.password, // W rzeczywistej aplikacji byłoby zahashowane
        createdAt: new Date().toISOString(),
        isActive: true
      };

      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Automatyczne zalogowanie nowego użytkownika
      const userData = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        city: newUser.city,
        address: newUser.address,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Automatyczne zapisanie "zapamiętaj mnie" dla nowo zarejestrowanego użytkownika
      localStorage.setItem('rememberUser', JSON.stringify({
        email: newUser.email,
        rememberMe: true
      }));

      // Pokazanie komunikatu sukcesu z informacją o automatycznym logowaniu
      setErrors({ success: `🎉 Witaj ${formData.firstName}! Twoje konto zostało utworzone i zostałeś automatycznie zalogowany. Za chwilę zostaniesz przekierowany na stronę główną.` });

      // Przekierowanie na stronę główną po krótkiej chwili
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Błąd podczas rejestracji:', error);
      alert('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
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

    // Usuwanie błędu dla pola gdy użytkownik zaczyna pisać
    if (errors[name] || errors.success) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        success: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <FiUserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Utwórz konto</h1>
            <p className="text-gray-600">Dołącz do naszej platformy rezerwacji serwisu</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {errors.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{errors.success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imię i Nazwisko */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Wprowadź imię"
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwisko *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Wprowadź nazwisko"
                    />
                  </div>
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres email *
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

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numer telefonu *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="+48 123 456 789"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {/* Miasto i Adres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miasto *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Warszawa"
                    />
                  </div>
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="ul. Przykładowa 123"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              {/* Hasło */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasło *
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
                    placeholder="Minimum 6 znaków"
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

              {/* Potwierdzenie hasła */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potwierdź hasło *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Powtórz hasło"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Checkbox regulaminu */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="text-gray-700">
                    Akceptuję{' '}
                    <Link href="/regulamin" className="text-blue-600 hover:text-blue-800 underline">
                      regulamin serwisu
                    </Link>
                    {' '}oraz{' '}
                    <Link href="/polityka-prywatnosci" className="text-blue-600 hover:text-blue-800 underline">
                      politykę prywatności
                    </Link>
                    *
                  </label>
                  {errors.acceptTerms && <p className="mt-1 text-red-600">{errors.acceptTerms}</p>}
                </div>
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
                    Tworzenie konta...
                  </div>
                ) : (
                  'Utwórz konto'
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

              {/* Google Registration */}
              <GoogleAuth
                onAuth={handleGoogleAuth}
                onError={handleGoogleError}
                buttonText="Zarejestruj się przez Google"
              />

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Masz już konto?{' '}
                  <Link href="/logowanie" className="text-blue-600 hover:text-blue-800 font-medium">
                    Zaloguj się
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
