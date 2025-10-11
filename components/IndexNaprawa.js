import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaSpinner, FaThumbsUp, FaShieldAlt, FaClock, FaUsers, FaChevronDown } from 'react-icons/fa';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SimpleBookingForm from '../components/SimpleBookingForm';
import BookingWizardForm from '../components/BookingWizardForm';
import QuickReportForm from '../components/QuickReportForm';

export default function IndexNaprawa() {
    const router = useRouter();
    const [selectedMode, setSelectedMode] = useState(null); // null, 'quick', 'full', 'report'
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginDropdown, setShowLoginDropdown] = useState(false);

    // Sprawdź, czy jest aktywny motyw naprawa.pl i załaduj dane użytkownika
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme !== 'naprawa') {
            // Jeśli nie ma motywu naprawa.pl, przekieruj na standardową stronę
            window.location.href = '/';
        }

        // Sprawdzenie czy użytkownik jest zalogowany
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                setCurrentUser(JSON.parse(userData));
            }
            setLoading(false);
        }

        // Zamknij dropdown po kliknięciu poza nim
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setShowLoginDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    if (selectedMode === 'quick') {
        return (
            <div className="min-h-screen bg-gray-50">
                <SimpleBookingForm onBack={() => setSelectedMode(null)} />
            </div>
        );
    }

    if (selectedMode === 'full') {
        return (
            <div className="min-h-screen bg-gray-50">
                <BookingWizardForm onBack={() => setSelectedMode(null)} />
            </div>
        );
    }

    if (selectedMode === 'report') {
        return (
            <div className="min-h-screen bg-gray-50">
                <QuickReportForm
                    onBack={() => setSelectedMode(null)}
                    theme="naprawa"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header w stylu naprawa.pl */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo - maksymalnie na lewo */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0 mr-12">
                                <span className="text-2xl font-bold text-blue-600">Technik</span>
                            </div>

                            {/* Główne menu - lepiej rozłożone */}
                            <nav className="hidden md:flex md:space-x-8">
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Zamów fachowca
                                </a>
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Wyślij sprzęt
                                </a>
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    O nas
                                </a>
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Dla firmy
                                </a>
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Porady
                                </a>
                                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Kontakt
                                </a>
                                <a href="/moje-zamowienie" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Moje zamówienie
                                </a>
                                {currentUser && (
                                    <a href="/historia-napraw" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                        Historia napraw
                                    </a>
                                )}
                            </nav>
                        </div>

                        {/* Prawa strona - telefon i opcje logowania */}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700 mr-4">📞 +48 22 120 24 59</span>

                            {currentUser ? (
                                // Menu dla zalogowanego użytkownika
                                <>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <FiUser className="h-4 w-4" />
                                        <span className="text-sm">
                                            {currentUser.firstName} {currentUser.lastName}
                                        </span>
                                    </div>
                                    <Link
                                        href="/admin-new"
                                        className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                    >
                                        Panel Admin
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm transition-colors"
                                    >
                                        <FiLogOut className="h-4 w-4" />
                                        <span>Wyloguj</span>
                                    </button>
                                </>
                            ) : (
                                // Menu dla niezalogowanego użytkownika z rozwijaną listą
                                <>
                                    <div className="relative dropdown-container">
                                        <button
                                            onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        >
                                            <span>Zaloguj się</span>
                                            <FaChevronDown className={`h-3 w-3 transition-transform ${showLoginDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Rozwijana lista */}
                                        {showLoginDropdown && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <Link
                                                    href="/client/login"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setShowLoginDropdown(false)}
                                                >
                                                    Logowanie klienta
                                                </Link>
                                                <Link
                                                    href="/rejestracja"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setShowLoginDropdown(false)}
                                                >
                                                    Rejestracja klienta
                                                </Link>
                                                <div className="border-t border-gray-200 my-2"></div>
                                                <Link
                                                    href="/admin-new"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => setShowLoginDropdown(false)}
                                                >
                                                    Panel Admin
                                                </Link>
                                                <Link
                                                    href="/pracownik-logowanie"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                                    onClick={() => setShowLoginDropdown(false)}
                                                >
                                                    Panel Pracownika
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">
                                Zgłoś naprawę
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero section w stylu naprawa.pl */}
            <div className="relative bg-gradient-to-br from-blue-50 to-orange-50 py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Lewa strona - tekst i opcje */}
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                Znajdź fachowca,<br />
                                <span className="text-blue-600">który Cię nie zawiedzie</span>
                            </h1>

                            {/* Główne opcje wyboru */}
                            <div className="space-y-4 mb-8">

                                {/* Opcja 1: Szybkie zgłoszenie */}
                                <div
                                    className="bg-white border-2 border-green-200 rounded-xl p-6 cursor-pointer hover:border-green-300 hover:shadow-lg transition-all"
                                    onClick={() => setSelectedMode('report')}
                                >
                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                                            <span className="text-white text-sm">⚡</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Szybkie zgłoszenie</h3>
                                            <p className="text-gray-600 text-sm">
                                                {currentUser
                                                    ? 'Błyskawiczne zgłoszenie z automatycznym wypełnieniem danych.'
                                                    : 'Szybko zgłoś problem - skontaktujemy się w ciągu 2 godzin.'
                                                }
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <FaClock className="text-green-600 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Opcja 2: Zamów fachowca */}
                                <div
                                    className="bg-white border-2 border-orange-200 rounded-xl p-6 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all"
                                    onClick={() => setSelectedMode('quick')}
                                >
                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                                            <span className="text-white text-sm">○</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Zamów fachowca</h3>
                                            <p className="text-gray-600 text-sm">
                                                Fachowiec przyjedzie pod wskazany adres i dokona naprawy.
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <FaMapMarkerAlt className="text-orange-600 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Opcja 3: Wyślij sprzęt */}
                                <div
                                    className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-300 hover:shadow-lg transition-all"
                                    onClick={() => setSelectedMode('full')}
                                >
                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-4 mt-1">
                                            <span className="text-white text-sm">○</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wyślij sprzęt do naprawy</h3>
                                            <p className="text-gray-600 text-sm">
                                                Naprawimy i zdiagnozujemy sprzęt w Ci go odeślemy.
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <FaPhone className="text-gray-600 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kolejne kroki */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center space-x-8">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</div>
                                        <span className="text-sm text-gray-700">Wybierz usługę</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</div>
                                        <span className="text-sm text-gray-700">Wypełnij opcje formularza</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</div>
                                        <span className="text-sm text-gray-700">Umów termin oraz szczegóły wizyty</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">4</div>
                                        <span className="text-sm text-gray-700">Wizyta naszego fachowca</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center space-x-4">
                                        <select className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700">
                                            <option>Usługa</option>
                                            <option>Naprawa AGD</option>
                                            <option>Hydraulika</option>
                                            <option>Elektryk</option>
                                            <option>Klimatyzacja</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Kod pocztowy"
                                            className="w-32 p-3 border border-gray-300 rounded-lg"
                                        />
                                        <button
                                            className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                                            onClick={() => setSelectedMode('quick')}
                                        >
                                            Zapytaj o wycenę
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcja logowania/rejestracji dla niezalogowanych użytkowników */}
                            {!currentUser && (
                                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 mt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Masz już konto?</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Link
                                            href="/client/login"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                                        >
                                            Zaloguj się
                                        </Link>
                                        <Link
                                            href="/rejestracja"
                                            className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
                                        >
                                            Zarejestruj się
                                        </Link>
                                        <Link
                                            href="/admin-new"
                                            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center"
                                        >
                                            Panel Admin
                                        </Link>
                                        <Link
                                            href="/pracownik-logowanie"
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                                        >
                                            Panel Pracownika
                                        </Link>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-3">
                                        Zaloguj się, aby śledzić swoje zamówienia i historię napraw
                                    </p>
                                </div>
                            )}

                            {/* Sekcja dla zalogowanych użytkowników */}
                            {currentUser && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mt-6">
                                    <div className="flex items-center mb-4">
                                        <FiUser className="h-5 w-5 text-green-600 mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Witaj, {currentUser.firstName}!
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href="/historia-napraw"
                                            className="flex-1 min-w-[150px] bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                                        >
                                            Historia napraw
                                        </Link>
                                        <Link
                                            href="/profil"
                                            className="flex-1 min-w-[150px] bg-white text-green-600 border-2 border-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors text-center"
                                        >
                                            Mój profil
                                        </Link>
                                        <Link
                                            href="/admin-new"
                                            className="flex-1 min-w-[150px] bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center"
                                        >
                                            Panel Admin
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prawa strona - zdjęcie fachowca */}
                        <div className="relative">
                            <div className="relative z-10">
                                <img
                                    src="/api/placeholder/500/600"
                                    alt="Profesjonalny fachowiec"
                                    className="rounded-2xl shadow-2xl w-full h-auto"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                                    <div className="flex items-center space-x-3">
                                        <FaThumbsUp className="text-green-500 text-xl" />
                                        <div>
                                            <div className="font-semibold text-gray-900">98% zadowolenia</div>
                                            <div className="text-sm text-gray-600">z naszych usług</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-orange-500 p-4 rounded-xl shadow-lg z-20">
                                <div className="text-center">
                                    <div className="text-white font-bold text-lg">24/7</div>
                                    <div className="text-orange-100 text-sm">Wsparcie</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sekcja korzyści */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Dlaczego wybierają nas?</h2>
                        <p className="text-lg text-gray-600">Sprawdzone rozwiązania dla Twojego domu</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaShieldAlt className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gwarancja jakości</h3>
                            <p className="text-gray-600">Wszystkie usługi objęte są gwarancją. Jeśli coś pójdzie nie tak, naprawimy to za darmo.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaClock className="text-orange-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Szybka realizacja</h3>
                            <p className="text-gray-600">Większość napraw wykonujemy w ciągu 24 godzin od zgłoszenia.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaUsers className="text-green-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sprawdzeni fachowcy</h3>
                            <p className="text-gray-600">Współpracujemy tylko z licencjonowanymi i ubezpieczonymi specjalistami.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Technik</h3>
                            <p className="text-gray-400 text-sm">
                                Profesjonalne usługi serwisowe dla Twojego domu.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Usługi</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white">Naprawa AGD</a></li>
                                <li><a href="#" className="hover:text-white">Hydraulika</a></li>
                                <li><a href="#" className="hover:text-white">Elektryk</a></li>
                                <li><a href="#" className="hover:text-white">Klimatyzacja</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Firma</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white">O nas</a></li>
                                <li><a href="#" className="hover:text-white">Kariera</a></li>
                                <li><a href="#" className="hover:text-white">Kontakt</a></li>
                                <li><a href="#" className="hover:text-white">Regulamin</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Konto</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                {!currentUser ? (
                                    <>
                                        <li><Link href="/client/login" className="hover:text-white">Zaloguj się</Link></li>
                                        <li><Link href="/rejestracja" className="hover:text-white">Zarejestruj się</Link></li>
                                        <li><Link href="/admin-new" className="hover:text-white">Panel Admin</Link></li>
                                        <li><Link href="/moje-zamowienie" className="hover:text-white">Moje zamówienie</Link></li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link href="/profil" className="hover:text-white">Mój profil</Link></li>
                                        <li><Link href="/historia-napraw" className="hover:text-white">Historia napraw</Link></li>
                                        <li><Link href="/admin-new" className="hover:text-white">Panel Admin</Link></li>
                                        <li>
                                            <button
                                                onClick={handleLogout}
                                                className="hover:text-white text-left"
                                            >
                                                Wyloguj się
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Kontakt</h4>
                            <div className="space-y-2 text-sm text-gray-400">
                                <p>📞 +48 22 120 24 59</p>
                                <p>✉️ kontakt@technik.pl</p>
                                <p>📍 Warszawa, Polska</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            © 2024 Technik. Wszystkie prawa zastrzeżone.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

