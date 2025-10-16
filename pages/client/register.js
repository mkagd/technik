import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiLock, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff,
  FiHome,
  FiBriefcase
} from 'react-icons/fi';

/**
 * Client Registration Page
 * Strona rejestracji dla nowych klientów
 */
export default function ClientRegister() {
  const router = useRouter();
  
  const [step, setStep] = useState(1); // 1: Dane osobowe, 2: Adres, 3: Hasło
  const [accountType, setAccountType] = useState('individual'); // individual lub company
  
  const [formData, setFormData] = useState({
    // Dane podstawowe
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    
    // Dane firmowe (opcjonalne)
    companyName: '',
    nip: '',
    
    // Adres
    street: '',
    buildingNumber: '',
    apartmentNumber: '',
    city: '',
    postalCode: '',
    
    // Hasło
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [linkedOrdersCount, setLinkedOrdersCount] = useState(0);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Walidacja kroku 1
  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('Imię jest wymagane');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Nazwisko jest wymagane');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email jest wymagany');
      return false;
    }
    // Walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Nieprawidłowy format email');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Numer telefonu jest wymagany');
      return false;
    }
    // Walidacja NIP dla firm
    if (accountType === 'company') {
      if (!formData.companyName.trim()) {
        setError('Nazwa firmy jest wymagana');
        return false;
      }
      if (!formData.nip.trim()) {
        setError('NIP jest wymagany dla firm');
        return false;
      }
      // Prosta walidacja NIP (10 cyfr)
      const nipRegex = /^\d{10}$/;
      if (!nipRegex.test(formData.nip.replace(/[-\s]/g, ''))) {
        setError('NIP musi składać się z 10 cyfr');
        return false;
      }
    }
    return true;
  };

  // Walidacja kroku 2
  const validateStep2 = () => {
    if (!formData.street.trim()) {
      setError('Ulica jest wymagana');
      return false;
    }
    if (!formData.buildingNumber.trim()) {
      setError('Numer budynku jest wymagany');
      return false;
    }
    if (!formData.city.trim()) {
      setError('Miasto jest wymagane');
      return false;
    }
    if (!formData.postalCode.trim()) {
      setError('Kod pocztowy jest wymagany');
      return false;
    }
    // Walidacja kodu pocztowego (XX-XXX)
    const postalRegex = /^\d{2}-\d{3}$/;
    if (!postalRegex.test(formData.postalCode)) {
      setError('Kod pocztowy musi być w formacie XX-XXX');
      return false;
    }
    return true;
  };

  // Walidacja kroku 3
  const validateStep3 = () => {
    if (!formData.password) {
      setError('Hasło jest wymagane');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      return false;
    }
    return true;
  };

  // Przejście do następnego kroku
  const handleNext = () => {
    setError(null);
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  // Powrót do poprzedniego kroku
  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Przygotuj dane do wysłania
      const registrationData = {
        action: 'register',
        type: accountType,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        mobile: formData.mobile.trim() || formData.phone.trim(),
        address: {
          street: formData.street.trim(),
          buildingNumber: formData.buildingNumber.trim(),
          apartmentNumber: formData.apartmentNumber.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          voivodeship: 'podkarpackie',
          country: 'Polska'
        },
        password: formData.password
      };

      // Dodaj dane firmowe jeśli firma
      if (accountType === 'company') {
        registrationData.companyName = formData.companyName.trim();
        registrationData.nip = formData.nip.trim().replace(/[-\s]/g, '');
      }

      const response = await fetch('/api/client/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setLinkedOrdersCount(data.linkedOrdersCount || 0);
        
        // Automatyczne logowanie po rejestracji
        setTimeout(() => {
          localStorage.setItem('clientToken', data.token);
          localStorage.setItem('clientData', JSON.stringify(data.client));
          router.push('/client/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Błąd rejestracji');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Renderowanie formularza w zależności od kroku
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Wybór typu konta */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typ konta
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('individual')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    accountType === 'individual'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiUser className="text-xl" />
                  <span className="font-medium">Osoba prywatna</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('company')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    accountType === 'company'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FiBriefcase className="text-xl" />
                  <span className="font-medium">Firma</span>
                </button>
              </div>
            </div>

            {/* Dane osobowe */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imię *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwisko *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kowalski"
                    required
                  />
                </div>
              </div>

              {/* Dane firmowe */}
              {accountType === 'company' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa firmy *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="TECH-AGD Sp. z o.o."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIP *
                    </label>
                    <input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234567890"
                      maxLength="10"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="jan.kowalski@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123-456-789"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon komórkowy
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="987-654-321"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Informacja o automatycznym linkowaniu */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Już składałeś zgłoszenie?</strong>
                  <p className="mt-1">
                    Podaj ten sam adres i numer telefonu - automatycznie znajdziemy Twoje wcześniejsze zgłoszenia i dodamy je do Twojego konta!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ulica *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ul. Krakowska"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numer budynku *
                  </label>
                  <input
                    type="text"
                    name="buildingNumber"
                    value={formData.buildingNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numer mieszkania
                  </label>
                  <input
                    type="text"
                    name="apartmentNumber"
                    value={formData.apartmentNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miasto *
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dębica"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kod pocztowy *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="39-200"
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 Adres będzie używany do wysyłki korespondencji i planowania wizyt serwisowych.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasło *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 znaków"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potwierdź hasło *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Powtórz hasło"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Wymagania dotyczące hasła:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}>
                      {formData.password.length >= 6 ? '✓' : '○'}
                    </span>
                    Minimum 6 znaków
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={formData.password === formData.confirmPassword && formData.password ? 'text-green-600' : 'text-gray-400'}>
                      {formData.password === formData.confirmPassword && formData.password ? '✓' : '○'}
                    </span>
                    Hasła są identyczne
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  🔒 Hasło jest szyfrowane i przechowywane bezpiecznie. Nigdy nie udostępnimy Twoich danych osobom trzecim.
                </p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Jeśli sukces, pokaż komunikat
  if (success) {
    return (
      <>
        <Head>
          <title>Rejestracja Zakończona - AGD Serwis</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FiCheckCircle className="text-green-600 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Rejestracja Zakończona!
            </h2>
            <p className="text-gray-600 mb-4">
              Twoje konto zostało utworzone{linkedOrdersCount > 0 && ' i automatycznie zlinkowane z wcześniejszymi zgłoszeniami'}.
            </p>
            
            {linkedOrdersCount > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiCheckCircle className="text-blue-600 text-xl" />
                  <span className="font-semibold text-blue-900">
                    Znaleziono {linkedOrdersCount} {linkedOrdersCount === 1 ? 'zlecenie' : linkedOrdersCount < 5 ? 'zlecenia' : 'zleceń'}!
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  Twoje wcześniejsze zgłoszenia zostały automatycznie przypisane do Twojego konta. 
                  Możesz je teraz przeglądać w panelu klienta.
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              Za chwilę zostaniesz przekierowany do panelu klienta.
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Rejestracja Klienta - AGD Serwis</title>
        <meta name="description" content="Załóż nowe konto klienta" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Logo / Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <FiUser className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rejestracja Konta
            </h1>
            <p className="text-gray-600">
              Utwórz konto aby zarządzać swoimi zleceniami
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 transition-all ${
                        step > s ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8 mt-2">
              <span className={`text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Dane osobowe
              </span>
              <span className={`text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Adres
              </span>
              <span className={`text-sm ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Hasło
              </span>
            </div>
          </div>

          {/* Registration Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Render current step */}
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="mt-6 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Wstecz
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Dalej
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Rejestracja...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        Utwórz konto
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Masz już konto?{' '}
              <Link href="/client/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Zaloguj się
              </Link>
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiHome />
              Powrót do strony głównej
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
