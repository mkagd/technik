
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SimpleBookingForm from '../components/SimpleBookingForm';
import BookingWizardForm from '../components/BookingWizardForm';
import IndexNaprawa from '../components/IndexNaprawa';
import IndexUsterka from '../components/IndexUsterka';
import { FiUser, FiLogOut, FiArrowLeft, FiChevronDown } from 'react-icons/fi';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState(null); // 'quick' lub 'reservation'
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }

      // Sprawdzenie aktualnego motywu
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }

      setLoading(false);
    }
  }, []);

  // Zamykanie dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLoginDropdown && !event.target.closest('.dropdown-container')) {
        setShowLoginDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginDropdown]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberUser');
      setCurrentUser(null);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Jeśli wybrano motyw naprawa.pl, renderuj komponent IndexNaprawa
  if (currentTheme === 'naprawa') {
    return <IndexNaprawa />;
  }

  // Jeśli wybrano motyw usterka.pl, renderuj komponent IndexUsterka
  if (currentTheme === 'usterka') {
    return <IndexUsterka />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TechSerwis</h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                // Menu dla zalogowanego użytkownika
                <>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <FiUser className="h-4 w-4" />
                    <span className="text-sm">
                      Witaj, {currentUser.firstName} {currentUser.lastName}
                    </span>
                  </div>
                  <Link
                    href="/historia-napraw"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Historia napraw
                  </Link>
                  <Link
                    href="/moje-zamowienie"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Moje zamówienie
                  </Link>
                  <Link
                    href="/profil"
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mój profil
                  </Link>
                  <Link
                    href="/admin-new"
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Panel Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>Wyloguj</span>
                  </button>
                </>
              ) : (
                // Menu dla niezalogowanego użytkownika
                <>
                  <Link
                    href="/moje-zamowienie"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Moje zamówienie
                  </Link>
                  <Link
                    href="/rejestracja"
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Zarejestruj się
                  </Link>
                  
                  {/* Rozwijane menu logowania - responsive */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FiUser className="h-4 w-4" />
                      Logowanie
                      <FiChevronDown className={`h-4 w-4 transition-transform ${showLoginDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLoginDropdown && (
                      <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
                        <Link
                          href="/logowanie"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          <FiUser className="inline h-4 w-4 mr-2" />
                          Klient
                        </Link>
                        <Link
                          href="/pracownik-logowanie"
                          className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          🔧 Pracownik
                        </Link>
                        <Link
                          href="/admin-new"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          🛡️ Administrator
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-300/10 to-orange-300/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="text-center py-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Technik Serwis 🚀
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Profesjonalne usługi serwisowe na najwyższym poziomie - Wdrożono z Vercel!
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>12-miesięczna gwarancja</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Fachowcy od ręki</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Bezpłatne odwołanie</span>
              </div>
            </div>

            {/* Sekcja logowania/rejestracji dla niezalogowanych */}
            {!currentUser && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Masz już konto? Zaloguj się i zarządzaj swoimi zamówieniami!
                  </h2>
                  <p className="text-gray-600 text-center mb-6">
                    Zaloguj się, aby mieć dostęp do historii napraw, szybszego składania zamówień i monitorowania statusu
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Link
                      href="/logowanie"
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 justify-center"
                    >
                      <FiUser className="h-4 w-4" />
                      Klient
                    </Link>

                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                      <Link
                        href="/pracownik-logowanie"
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 justify-center text-sm"
                      >
                        🔧 Pracownik
                      </Link>

                      <Link
                        href="/admin"
                        className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2 justify-center text-sm"
                      >
                        🛡️ Admin
                      </Link>
                    </div>

                    <Link
                      href="/rejestracja"
                      className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 justify-center"
                    >
                      <FiUser className="h-4 w-4" />
                      Rejestracja
                    </Link>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900 mb-1">📋 Historia zamówień</div>
                      <div className="text-blue-700">Przeglądaj poprzednie naprawy</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-900 mb-1">⚡ Szybsze zamówienia</div>
                      <div className="text-green-700">Zapisane dane kontaktowe</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-900 mb-1">🔔 Powiadomienia</div>
                      <div className="text-purple-700">Status realizacji na bieżąco</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wybór opcji */}
            <div className="max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Jak chcesz się z nami skontaktować?</h2>

              {/* Przycisk zamów fachowca - najważniejszy */}
              <div className="mb-8">
                <Link
                  href="/rezerwacja"
                  className="block bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl shadow-lg p-8 hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 border-2 border-transparent hover:border-orange-400"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 11-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">🛠️ Zamów Fachowca</h3>
                    <p className="text-white/90 mb-4 text-lg">Wypełnij formularz i zamów profesjonalnego serwisanta</p>
                    <div className="flex justify-center gap-4 text-sm text-white/80">
                      <span>✅ Bezpłatna wycena</span>
                      <span>✅ Gwarancja na naprawę</span>
                      <span>✅ Dojazd w 24h</span>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Opcja 1: Szybkie zgłoszenie */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-200 hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => setBookingType('quick')}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Szybkie zgłoszenie</h3>
                    <p className="text-gray-600 mb-4">Podaj adres i telefon - oddzwaniamy w ciągu 30 minut</p>
                    <div className="text-sm text-orange-600 font-medium">
                      ⚡ Natychmiastowa odpowiedź
                    </div>
                  </div>
                </div>

                {/* Opcja 2: Rezerwacja online */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => setBookingType('reservation')}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Zarezerwuj termin online</h3>
                    <p className="text-gray-600 mb-4">Wybierz dogodny termin i umów wizytę serwisanta</p>
                    <div className="text-sm text-blue-600 font-medium">
                      📅 Wybierz dokładny termin
                    </div>
                  </div>
                </div>

                {/* Opcja 3: Zobacz mapę zgłoszeń */}
                <Link
                  href="/mapa"
                  className="block bg-white rounded-2xl shadow-lg p-8 border-2 border-green-200 hover:border-green-400 transition-colors"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Mapa zgłoszeń</h3>
                    <p className="text-gray-600 mb-4">Zobacz zgłoszenia i serwisantów w Twojej okolicy</p>
                    <div className="text-sm text-green-600 font-medium">
                      🗺️ Interaktywna mapa
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </div>

          {/* Wybór opcji lub formularz */}
          {!bookingType ? (
            /* Wybór opcji jest już powyżej w content */
            null
          ) : (
            <div className="relative">
              {/* Przycisk powrotu */}
              <div className="max-w-md mx-auto mb-4">
                <button
                  onClick={() => setBookingType(null)}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Powrót do wyboru opcji
                </button>
              </div>

              {/* Renderowanie odpowiedniego formularza */}
              {bookingType === 'quick' ? (
                <div>
                  <div className="max-w-md mx-auto mb-6 text-center">
                    <h2 className="text-2xl font-bold text-orange-600 mb-2">Szybkie zgłoszenie</h2>
                    <p className="text-gray-600">Podaj dane - oddzwaniamy w ciągu 30 minut</p>
                  </div>
                  <SimpleBookingForm />
                </div>
              ) : bookingType === 'reservation' ? (
                <div>
                  <div className="max-w-4xl mx-auto mb-6 text-center">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">Rezerwacja terminu online</h2>
                    <p className="text-gray-600">Wybierz usługę i dogodny termin wizyty</p>
                  </div>
                  <BookingWizardForm />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
