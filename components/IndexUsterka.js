import { useState, useEffect } from 'react';
import { FaWrench, FaPhone, FaMapMarkerAlt, FaTools, FaClock, FaCheckCircle, FaSpinner, FaChevronDown } from 'react-icons/fa';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuickReportForm from '../components/QuickReportForm';

export default function IndexUsterka() {
    const router = useRouter();
    const [selectedMode, setSelectedMode] = useState(null); // null, 'report'
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginDropdown, setShowLoginDropdown] = useState(false);

    // Sprawdź, czy jest aktywny motyw usterka.pl i załaduj dane użytkownika
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme !== 'usterka') {
            // Jeśli nie ma motywu usterka.pl, przekieruj na standardową stronę
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
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (selectedMode === 'report') {
        return (
            <div className="min-h-screen bg-gray-50">
                <QuickReportForm
                    onBack={() => setSelectedMode(null)}
                    theme="usterka"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            {/* Header w stylu usterka.pl */}
            <header className="bg-white shadow-lg border-b-4 border-red-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0 mr-8">
                                <span className="text-3xl font-bold text-red-600">Usterka</span>
                                <span className="text-lg text-gray-600">.pl</span>
                            </div>

                            {/* Menu główne */}
                            <nav className="hidden md:flex md:space-x-6">
                                <a href="#" className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Zgłoś usterkę
                                </a>
                                <a href="#" className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Znajdź fachowca
                                </a>
                                <a href="#" className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Jak to działa
                                </a>
                                <a href="#" className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                                    Cennik
                                </a>
                            </nav>
                        </div>

                        {/* Prawej strony - logowanie/użytkownik */}
                        <div className="flex items-center space-x-4">
                            {!currentUser ? (
                                <>
                                    <div className="relative dropdown-container">
                                        <button
                                            onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                                            className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors"
                                        >
                                            <FiUser className="h-4 w-4 mr-2" />
                                            Logowanie
                                            <FaChevronDown className="h-3 w-3 ml-1" />
                                        </button>

                                        {/* Rozwijana lista */}
                                        {showLoginDropdown && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <Link
                                                    href="/logowanie"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    onClick={() => setShowLoginDropdown(false)}
                                                >
                                                    Logowanie klienta
                                                </Link>
                                                <Link
                                                    href="/rejestracja"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-700">
                                        Witaj, {currentUser.firstName}!
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors"
                                    >
                                        <FiLogOut className="h-4 w-4 mr-2" />
                                        Wyloguj
                                    </button>
                                </div>
                            )}

                            <button className="bg-red-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                                Pilne zgłoszenie
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sekcja Hero */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Lewa strona - tekst i przyciski */}
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                Zgłoś usterkę,<br />
                                <span className="text-red-600">my ją naprawimy!</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Szybkie i profesjonalne naprawy domowe. Sprawdzeni fachowcy w Twojej okolicy już dziś!
                            </p>

                            {/* Przycisk główny */}
                            <div className="mb-8">
                                <button
                                    onClick={() => setSelectedMode('report')}
                                    className="inline-flex items-center px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                                >
                                    <FaWrench className="h-5 w-5 mr-3" />
                                    Szybkie zgłoszenie usterki
                                </button>
                                {currentUser && (
                                    <p className="text-sm text-green-600 mt-2">
                                        ✓ Twoje dane będą automatycznie wypełnione
                                    </p>
                                )}
                            </div>

                            {/* Statystyki */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600 mb-1">24h</div>
                                    <div className="text-sm text-gray-600">Czas reakcji</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600 mb-1">5000+</div>
                                    <div className="text-sm text-gray-600">Napraw</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600 mb-1">98%</div>
                                    <div className="text-sm text-gray-600">Zadowolenia</div>
                                </div>
                            </div>

                            {/* Sekcja logowania dla niezalogowanych */}
                            {!currentUser && (
                                <div className="bg-white border-2 border-red-200 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Masz już konto?</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        <Link
                                            href="/logowanie"
                                            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
                                        >
                                            Zaloguj się
                                        </Link>
                                        <Link
                                            href="/rejestracja"
                                            className="bg-white text-red-600 border-2 border-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors text-center"
                                        >
                                            Zarejestruj się
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        Zaloguj się, aby śledzić swoje zgłoszenia i mieć dostęp do historii napraw
                                    </p>
                                </div>
                            )}

                            {/* Sekcja dla zalogowanych użytkowników */}
                            {currentUser && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                                    <div className="flex items-center mb-4">
                                        <FiUser className="h-5 w-5 text-green-600 mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Witaj, {currentUser.firstName}!
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href="/historia-usterek"
                                            className="flex-1 min-w-[150px] bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                                        >
                                            Historia usterek
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

                        {/* Prawa strona - ilustracja */}
                        <div className="relative">
                            <div className="relative z-10">
                                <img
                                    src="/api/placeholder/500/600"
                                    alt="Fachowiec naprawiający"
                                    className="rounded-2xl shadow-2xl w-full h-auto"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                                    <div className="flex items-center space-x-3">
                                        <FaCheckCircle className="text-green-500 text-xl" />
                                        <div>
                                            <div className="font-semibold text-gray-900">Gwarancja jakości</div>
                                            <div className="text-sm text-gray-600">na każdą naprawę</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-red-600 p-4 rounded-xl shadow-lg z-20">
                                <div className="text-center">
                                    <div className="text-white font-bold text-lg">24/7</div>
                                    <div className="text-red-100 text-sm">Zgłoszenia</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sekcja jak to działa */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Jak to działa?</h2>
                        <p className="text-lg text-gray-600">Prosto i szybko - od zgłoszenia do naprawy</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaWrench className="text-red-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Zgłoś usterkę</h3>
                            <p className="text-gray-600">Opisz problem w prostym formularzu online</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaPhone className="text-orange-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Otrzymaj kontakt</h3>
                            <p className="text-gray-600">Fachowiec skontaktuje się z Tobą w ciągu 2h</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaClock className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Umów termin</h3>
                            <p className="text-gray-600">Wybierz dogodny dla Ciebie termin naprawy</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Gotowe!</h3>
                            <p className="text-gray-600">Ciesz się sprawnie działającym sprzętem</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <span className="text-2xl font-bold text-red-500">Usterka</span>
                                <span className="text-lg text-gray-400">.pl</span>
                            </div>
                            <p className="text-gray-400">
                                Profesjonalne naprawy domowe. Sprawdzeni fachowcy w całej Polsce.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Usługi</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Elektryk</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Hydraulik</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Naprawa AGD</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Złota rączka</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Pomoc</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Jak to działa</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cennik</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
                            <div className="space-y-2 text-gray-400">
                                <div className="flex items-center">
                                    <FaPhone className="h-4 w-4 mr-2" />
                                    <span>+48 800 123 456</span>
                                </div>
                                <div className="flex items-center">
                                    <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                                    <span>Cała Polska</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Usterka.pl. Wszystkie prawa zastrzeżone.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
