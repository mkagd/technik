import { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaDownload, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTimes, FaPhone, FaIdCard, FaLock } from 'react-icons/fa';
import { FiMail, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import reportManager from '../utils/reportManager';
import GoogleAuth from '../components/GoogleAuth';

export default function MojeZamowienie() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginMode, setLoginMode] = useState('order'); // 'order' lub 'technik'
    const [loginForm, setLoginForm] = useState({
        orderNumber: '',
        phoneNumber: ''
    });
    const [technikLoginForm, setTechnikLoginForm] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [technikUser, setTechnikUser] = useState(null);

    // Obsługa pomyślnego logowania Google
    const handleGoogleAuth = (userData) => {
        setTechnikUser(userData);
        setIsAuthenticated(true);
        setLoginMode('technik');
        setLoginError('');

        // Automatycznie odśwież zamówienia dla zalogowanego użytkownika
        // refreshUserOrders zostanie automatycznie wywołane przez useEffect przy zmianie technikUser
    };

    // Obsługa błędów logowania Google
    const handleGoogleError = (error) => {
        setLoginError(`Błąd logowania Google: ${error}`);
    };

    // Funkcja do pobierania wszystkich zgłoszeń z różnych źródeł
    const getAllOrders = () => {
        let allOrders = [];

        // 1. Pobierz z nowego systemu (unified_reports)
        try {
            const unifiedReports = reportManager.getAllReports();
            const formattedUnified = unifiedReports.map(report => ({
                id: report.reportNumber || report.id,
                type: getReportTypeLabel(report.type),
                service: report.reportDetails?.equipmentType || 'Usługa serwisowa',
                status: getStatusLabel(report.status),
                statusColor: getStatusColor(getStatusLabel(report.status)),
                date: report.timestamp ? report.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
                address: report.contactInfo?.address || 'Nie podano',
                phone: report.contactInfo?.phone || 'Nie podano',
                email: report.contactInfo?.email || 'Nie podano',
                description: report.reportDetails?.description || 'Brak opisu',
                estimatedTime: getEstimatedTime(report.status, report.type),
                price: getPrice(report.status),
                reportNumber: report.reportNumber,
                isUnified: true
            }));
            allOrders = [...allOrders, ...formattedUnified];
        } catch (error) {
            console.error('Błąd pobierania unified reports:', error);
        }

        // 2. Pobierz z quickReports (dla zgłoszeń które mogą nie być jeszcze zmigrowne)
        try {
            const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            const formattedQuick = quickReports
                .filter(report => !report.reportNumber || !allOrders.find(o => o.reportNumber === report.reportNumber)) // Unikaj duplikatów
                .map(report => ({
                    id: report.reportNumber || report.id,
                    type: 'Zgłoszenie serwisowe',
                    service: report.finalEquipment || report.equipmentType || 'Usługa serwisowa',
                    status: getStatusLabel(report.status),
                    statusColor: getStatusColor(getStatusLabel(report.status)),
                    date: report.timestamp ? report.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
                    address: report.address || 'Nie podano',
                    phone: report.phone || 'Nie podano',
                    email: report.email || 'Nie podano',
                    description: report.description || 'Brak opisu',
                    estimatedTime: getEstimatedTime(report.status, 'ZG'),
                    price: getPrice(report.status),
                    reportNumber: report.reportNumber,
                    isLegacy: true
                }));
            allOrders = [...allOrders, ...formattedQuick];
        } catch (error) {
            console.error('Błąd pobierania quickReports:', error);
        }

        // 3. Pobierz stare bookings (zachowaj dla kompatybilności)
        try {
            const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const formattedBookings = storedBookings
                .filter(booking => !allOrders.find(o => o.id === booking.id)) // Unikaj duplikatów
                .map(booking => ({
                    id: booking.id,
                    type: 'Szybkie zgłoszenie (stare)',
                    service: booking.serviceType || 'Usługa serwisowa',
                    status: getStatusLabel(booking.status),
                    statusColor: getStatusColor(getStatusLabel(booking.status)),
                    date: booking.createdAt ? booking.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    address: booking.address || booking.postalCode || 'Nie podano',
                    phone: booking.phone || 'Nie podano',
                    email: booking.email || 'Nie podano',
                    description: booking.description || 'Brak opisu',
                    estimatedTime: '1-2 dni robocze',
                    price: 'Do wyceny',
                    isOldBooking: true
                }));
            allOrders = [...allOrders, ...formattedBookings];
        } catch (error) {
            console.error('Błąd pobierania starych bookings:', error);
        }

        // 4. Pobierz zlecenia (zachowaj dla kompatybilności)
        try {
            const storedZlecenia = JSON.parse(localStorage.getItem('zlecenia') || '[]');
            const formattedZlecenia = storedZlecenia
                .filter(zlecenie => !allOrders.find(o => o.id === zlecenie.id)) // Unikaj duplikatów
                .map(zlecenie => ({
                    id: zlecenie.id,
                    type: 'Pełna rezerwacja',
                    service: zlecenie.serviceType || 'Usługa serwisowa',
                    status: getStatusLabel(zlecenie.status),
                    statusColor: getStatusColor(getStatusLabel(zlecenie.status)),
                    date: zlecenie.createdAt ? zlecenie.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    address: zlecenie.address || zlecenie.postalCode || 'Nie podano',
                    phone: zlecenie.phone || 'Nie podano',
                    email: zlecenie.email || 'Nie podano',
                    description: zlecenie.description || 'Brak opisu',
                    estimatedTime: zlecenie.status === 'Zakończone' ? 'Zakończono' : '2-3 dni robocze',
                    price: zlecenie.status === 'Zakończone' ? (zlecenie.price || '280 zł') : 'Do wyceny',
                    isOldOrder: true
                }));
            allOrders = [...allOrders, ...formattedZlecenia];
        } catch (error) {
            console.error('Błąd pobierania zleceń:', error);
        }

        // Sortuj po dacie (najnowsze pierwsze)
        allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        return allOrders;
    };

    // Funkcje pomocnicze
    const getReportTypeLabel = (type) => {
        switch (type) {
            case 'ZG': return 'Zgłoszenie serwisowe';
            case 'US': return 'Usterka';
            case 'RZ': return 'Rezerwacja';
            default: return 'Zgłoszenie';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new': return 'Oczekuje na kontakt';
            case 'in-progress': return 'W trakcie realizacji';
            case 'completed': return 'Zakończone';
            case 'cancelled': return 'Anulowane';
            case 'resolved': return 'Zakończone';
            case 'closed': return 'Zakończone';
            default: return status || 'Oczekuje na kontakt';
        }
    };

    const getEstimatedTime = (status, type) => {
        if (['completed', 'resolved', 'closed', 'Zakończone'].includes(status)) {
            return 'Zakończono';
        }
        switch (type) {
            case 'US': return '1 dzień roboczy';
            case 'RZ': return '2-3 dni robocze';
            default: return '1-2 dni robocze';
        }
    };

    const getPrice = (status) => {
        if (['completed', 'resolved', 'closed', 'Zakończone'].includes(status)) {
            return '280 zł'; // Przykładowa cena
        }
        return 'Do wyceny';
    };

    // Funkcja do odświeżania zamówień dla zalogowanego użytkownika
    const refreshUserOrders = () => {
        if (technikUser) {
            // Dla zalogowanego użytkownika - użyj metody z reportManager dla lepszej wydajności
            let userOrders = [];

            // 1. Pobierz z unified_reports przez reportManager
            try {
                const userReports = reportManager.getReportsByUser(technikUser.email);
                const formattedUserReports = userReports.map(report => ({
                    id: report.reportNumber || report.id,
                    type: getReportTypeLabel(report.type),
                    service: report.reportDetails?.equipmentType || 'Usługa serwisowa',
                    status: getStatusLabel(report.status),
                    statusColor: getStatusColor(getStatusLabel(report.status)),
                    date: report.timestamp ? report.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
                    address: report.contactInfo?.address || 'Nie podano',
                    phone: report.contactInfo?.phone || 'Nie podano',
                    email: report.contactInfo?.email || 'Nie podano',
                    description: report.reportDetails?.description || 'Brak opisu',
                    estimatedTime: getEstimatedTime(report.status, report.type),
                    price: getPrice(report.status),
                    reportNumber: report.reportNumber,
                    isUnified: true
                }));
                userOrders = [...userOrders, ...formattedUserReports];
            } catch (error) {
                console.error('Błąd pobierania zgłoszeń użytkownika:', error);
            }

            // 2. Sprawdź także w starych systemach dla kompatybilności
            try {
                const allOrders = getAllOrders();
                const legacyUserOrders = allOrders.filter(order => {
                    // Sprawdź czy to nie jest duplikat z unified_reports
                    const isDuplicate = userOrders.find(userOrder =>
                        userOrder.reportNumber === order.reportNumber ||
                        userOrder.id === order.id
                    );

                    return !isDuplicate &&
                        order.email.toLowerCase() === technikUser.email.toLowerCase();
                });

                userOrders = [...userOrders, ...legacyUserOrders];
            } catch (error) {
                console.error('Błąd pobierania starych zamówień użytkownika:', error);
            }

            // Sortuj po dacie (najnowsze pierwsze)
            userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            setOrders(userOrders);
        } else {
            // Dla niezalogowanego użytkownika - pokaż wszystkie
            const allOrders = getAllOrders();
            setOrders(allOrders);
        }
    };

    // Pobieranie rzeczywistych danych z localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            refreshUserOrders();
        }
    }, [technikUser]); // Odśwież gdy zmieni się zalogowany użytkownik

    const getStatusColor = (status) => {
        switch (status) {
            case 'W trakcie realizacji':
                return 'bg-yellow-100 text-yellow-800';
            case 'Zakończone':
                return 'bg-green-100 text-green-800';
            case 'Oczekuje na kontakt':
                return 'bg-blue-100 text-blue-800';
            case 'Anulowane':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.reportNumber && order.reportNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.phone.includes(searchQuery) ||
        (order.email && order.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = (status) => {
        switch (status) {
            case 'W trakcie realizacji':
                return '🔧';
            case 'Zakończone':
                return '✅';
            case 'Oczekuje na kontakt':
                return '📞';
            default:
                return '📋';
        }
    };

    // Funkcja uwierzytelniania dla niezalogowanych użytkowników
    const handleGuestLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

        // Usuń spacje i znaki specjalne z numeru telefonu
        const cleanPhoneNumber = loginForm.phoneNumber.replace(/[\s\-\(\)]/g, '');
        const cleanOrderNumber = loginForm.orderNumber.trim().toUpperCase();

        // Sprawdź czy pola są wypełnione
        if (!cleanOrderNumber || !cleanPhoneNumber) {
            setLoginError('Proszę wypełnić wszystkie pola');
            setIsLoading(false);
            return;
        }

        // Sprawdź format numeru zamówienia - akceptuj różne prefiksy
        const validFormats = [
            /^(ZG|US|RZ|ZL)-\d{4}-\d{4}$/, // Nowe formaty: ZG, US, RZ + stary ZL
            /^\d{13}$/ // Stary format (timestamp)
        ];

        const isValidFormat = validFormats.some(format => cleanOrderNumber.match(format));

        if (!isValidFormat) {
            setLoginError('Nieprawidłowy format numeru zamówienia (np. ZG-2025-0001, US-2025-0001, RZ-2025-0001)');
            setIsLoading(false);
            return;
        }

        // Sprawdź czy zamówienie istnieje i czy numer telefonu się zgadza
        const foundOrder = orders.find(order => {
            const orderCleanPhone = order.phone.replace(/[\s\-\(\)]/g, '');
            const orderMatchId = order.id === cleanOrderNumber;
            const orderMatchReportNumber = order.reportNumber === cleanOrderNumber;

            return (orderMatchId || orderMatchReportNumber) && orderCleanPhone === cleanPhoneNumber;
        });

        setTimeout(() => {
            if (foundOrder) {
                setIsAuthenticated(true);
                // Pokaż tylko to konkretne zamówienie
                setOrders([foundOrder]);
            } else {
                setLoginError('Nie znaleziono zamówienia z podanym numerem i telefonem');
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setLoginForm({ orderNumber: '', phoneNumber: '' });
        setTechnikLoginForm({ email: '', password: '', rememberMe: false });
        setTechnikUser(null);
        setLoginMode('order');
        setSearchQuery('');
        setSelectedOrder(null);
        // Usuń zapamiętanego użytkownika
        localStorage.removeItem('rememberedTechnikUser');
        // Ponownie załaduj wszystkie zamówienia
        loadAllOrders();
    };

    const loadAllOrders = () => {
        // Funkcja do ponownego załadowania wszystkich zamówień
        if (typeof window !== 'undefined') {
            const allOrders = getAllOrders();
            setOrders(allOrders);
        }
    };

    // Funkcja logowania z technik
    const handleTechnikLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

        // Sprawdź czy pola są wypełnione
        if (!technikLoginForm.email || !technikLoginForm.password) {
            setLoginError('Proszę wypełnić wszystkie pola');
            setIsLoading(false);
            return;
        }

        // Walidacja email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(technikLoginForm.email)) {
            setLoginError('Proszę podać prawidłowy adres e-mail');
            setIsLoading(false);
            return;
        }

        try {
            // Symulacja logowania do systemu technik
            setTimeout(async () => {
                // Sprawdź czy użytkownik istnieje w localStorage
                const storedUsers = localStorage.getItem('technikUsers');
                let users = [];

                if (storedUsers) {
                    try {
                        users = JSON.parse(storedUsers);
                    } catch (error) {
                        console.error('Błąd parsowania użytkowników:', error);
                    }
                }

                // Znajdź użytkownika
                const user = users.find(u =>
                    u.email.toLowerCase() === technikLoginForm.email.toLowerCase() &&
                    u.password === technikLoginForm.password
                );

                if (user) {
                    // Logowanie udane
                    setTechnikUser(user);
                    setIsAuthenticated(true);

                    // Zapamiętaj logowanie jeśli wybrano
                    if (technikLoginForm.rememberMe) {
                        localStorage.setItem('rememberedTechnikUser', JSON.stringify({
                            email: user.email,
                            id: user.id,
                            name: user.name
                        }));
                    }

                    // refreshUserOrders zostanie automatycznie wywołane przez useEffect przy zmianie technikUser
                } else {
                    // Sprawdź czy to nowy użytkownik - jeśli nie ma w bazie, stwórz automatycznie
                    const newUser = {
                        id: `USER-${Date.now()}`,
                        email: technikLoginForm.email,
                        password: technikLoginForm.password,
                        name: technikLoginForm.email.split('@')[0],
                        createdAt: new Date().toISOString(),
                        isActive: true
                    };

                    users.push(newUser);
                    localStorage.setItem('technikUsers', JSON.stringify(users));

                    setTechnikUser(newUser);
                    setIsAuthenticated(true);

                    // Zapamiętaj logowanie jeśli wybrano
                    if (technikLoginForm.rememberMe) {
                        localStorage.setItem('rememberedTechnikUser', JSON.stringify({
                            email: newUser.email,
                            id: newUser.id,
                            name: newUser.name
                        }));
                    }

                    // refreshUserOrders zostanie automatycznie wywołane przez useEffect przy zmianie technikUser
                }

                setIsLoading(false);
            }, 1500);
        } catch (error) {
            console.error('Błąd logowania:', error);
            setLoginError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
        } finally {
            setIsLoading(false);
        }
    };

    // Sprawdź czy użytkownik jest zapamiętany przy ładowaniu strony
    useEffect(() => {
        const rememberedUser = localStorage.getItem('rememberedTechnikUser');
        if (rememberedUser) {
            try {
                const userData = JSON.parse(rememberedUser);
                setTechnikUser(userData);
                setLoginMode('technik');
                setTechnikLoginForm(prev => ({
                    ...prev,
                    email: userData.email,
                    rememberMe: true
                }));

                // Automatycznie zaloguj użytkownika i przefiltruj zamówienia
                setIsAuthenticated(true);
                const allOrders = getAllOrders();
                const userOrders = allOrders.filter(order =>
                    order.email.toLowerCase() === userData.email.toLowerCase()
                );
                setOrders(userOrders);
            } catch (error) {
                console.error('Błąd parsowania zapamiętanego użytkownika:', error);
                localStorage.removeItem('rememberedTechnikUser');
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <a href="/" className="text-2xl font-bold text-blue-600">Technik</a>
                            </div>
                            <nav className="hidden md:ml-8 md:flex md:space-x-8">
                                <a href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                                    Strona główna
                                </a>
                                <a href="#" className="text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-blue-600">
                                    Moje zamówienie
                                </a>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">📞 +48 22 120 24 59</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isAuthenticated ? (
                    /* Login Form */
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="text-center mb-8">
                                <FaLock className="mx-auto text-4xl text-blue-600 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sprawdź status zamówienia</h2>
                                <p className="text-gray-600">
                                    {loginMode === 'order'
                                        ? 'Aby sprawdzić status swojego zamówienia, wprowadź numer zamówienia i telefon podany przy zgłoszeniu.'
                                        : 'Zaloguj się aby zobaczyć wszystkie swoje zamówienia w jednym miejscu.'
                                    }
                                </p>
                            </div>

                            {/* Login Mode Switcher */}
                            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setLoginMode('order')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMode === 'order'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <FaIdCard className="inline mr-2" />
                                    Numer zamówienia
                                </button>
                                <button
                                    onClick={() => setLoginMode('technik')}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMode === 'technik'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <FaUser className="inline mr-2" />
                                    Moje zamówienia
                                </button>
                            </div>

                            {loginMode === 'order' ? (
                                /* Formularz logowania przez numer zamówienia */
                                <>
                                    <form onSubmit={handleGuestLogin} className="space-y-6">
                                        <div>
                                            <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaIdCard className="inline mr-2 text-blue-600" />
                                                Numer zamówienia
                                            </label>
                                            <input
                                                type="text"
                                                id="orderNumber"
                                                placeholder="np. ZG-2024-0001 lub ZL-2024-0001"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={loginForm.orderNumber}
                                                onChange={(e) => setLoginForm(prev => ({ ...prev, orderNumber: e.target.value.toUpperCase() }))}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaPhone className="inline mr-2 text-blue-600" />
                                                Numer telefonu
                                            </label>
                                            <input
                                                type="tel"
                                                id="phoneNumber"
                                                placeholder="np. +48 123 456 789"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={loginForm.phoneNumber}
                                                onChange={(e) => setLoginForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Podaj numer telefonu z jakiego składałeś zamówienie
                                            </p>
                                        </div>

                                        {loginError && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-red-800 text-sm">{loginError}</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full py-3 px-6 font-medium rounded-lg transition-all ${isLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
                                                } text-white flex items-center justify-center`}
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Sprawdzam...
                                                </div>
                                            ) : (
                                                <>
                                                    <FaSearch className="mr-2" />
                                                    Sprawdź status
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">💡 Wskazówki:</h4>
                                        <ul className="text-blue-800 text-sm space-y-1">
                                            <li>• Numer zamówienia znajdziesz w e-mailu potwierdzającym lub SMS-ie</li>
                                            <li>• Szybkie zgłoszenia zaczynają się od "ZG-"</li>
                                            <li>• Pełne rezerwacje zaczynają się od "ZL-"</li>
                                            <li>• Podaj dokładnie ten sam numer telefonu co przy zgłoszeniu</li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                /* Formularz logowania technik */
                                <>
                                    <form onSubmit={handleTechnikLogin} className="space-y-6">
                                        <div>
                                            <label htmlFor="technikEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FiMail className="inline mr-2 text-blue-600" />
                                                Adres e-mail
                                            </label>
                                            <input
                                                type="email"
                                                id="technikEmail"
                                                placeholder="twoj@email.com"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={technikLoginForm.email}
                                                onChange={(e) => setTechnikLoginForm(prev => ({ ...prev, email: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="technikPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaLock className="inline mr-2 text-blue-600" />
                                                Hasło
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    id="technikPassword"
                                                    placeholder="Twoje hasło"
                                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={technikLoginForm.password}
                                                    onChange={(e) => setTechnikLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="rememberMe"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={technikLoginForm.rememberMe}
                                                onChange={(e) => setTechnikLoginForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                                            />
                                            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                                                Zapamiętaj mnie
                                            </label>
                                        </div>

                                        {loginError && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-red-800 text-sm">{loginError}</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full py-3 px-6 font-medium rounded-lg transition-all ${isLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
                                                } text-white flex items-center justify-center`}
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Logowanie...
                                                </div>
                                            ) : (
                                                <>
                                                    <FiLogIn className="mr-2" />
                                                    Zaloguj się                                        </>
                                            )}
                                        </button>
                                    </form>

                                    {/* Divider */}
                                    <div className="relative my-6">
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

                                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h4 className="font-medium text-green-900 mb-2">✨ Moje zamówienia - korzyści:</h4>
                                        <ul className="text-green-800 text-sm space-y-1">
                                            <li>• Dostęp do wszystkich swoich zamówień w jednym miejscu</li>
                                            <li>• Historia napraw i serwisów</li>
                                            <li>• Szybsze składanie nowych zamówień</li>
                                            <li>• Powiadomienia o statusie realizacji</li>
                                            <li>• Logowanie przez Google dla wygody</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm">
                                    Nie masz jeszcze zamówienia?{' '}
                                    <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                                        Złóż pierwsze zamówienie
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Authenticated User Content */
                    <>
                        {/* Page Title */}
                        <div className="mb-8 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {technikUser ? 'Moje zamówienia' : 'Twoje zamówienia'}
                                </h1>
                                <p className="text-gray-600">
                                    {technikUser ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <FaUser className="text-blue-600" />
                                                <span>Zalogowany jako: <strong>{technikUser.email}</strong></span>
                                            </div>
                                            <div className="text-sm">
                                                {searchQuery ? (
                                                    <>Wyniki wyszukiwania: <strong>{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'zamówienie' : 'zamówień'}</>
                                                ) : (
                                                    <>Twoje zamówienia: <strong>{orders.length}</strong> {orders.length === 1 ? 'pozycja' : 'pozycji'}</>
                                                )}
                                                {orders.length !== filteredOrders.length && searchQuery && (
                                                    <span className="text-gray-500"> (z {orders.length} wszystkich)</span>
                                                )}
                                            </div>
                                            {orders.length === 0 && (
                                                <div className="text-blue-600 text-sm">
                                                    💡 Nie masz jeszcze żadnych zamówień na tym koncie
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        'Sprawdź status swoich zgłoszeń i zamówień'
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {technikUser ? 'Wyloguj się' : 'Sprawdź inne zamówienie'}
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            {/* Banner informacyjny o filtrowaniu */}
                            {technikUser && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center text-blue-800 text-sm">
                                        <div className="flex items-center mr-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            <FaUser className="mr-1" />
                                        </div>
                                        <span>
                                            Wyświetlasz tylko zamówienia przypisane do konta: <strong>{technikUser.email}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={technikUser
                                        ? "Szukaj w swoich zamówieniach po numerze, usłudze lub statusie..."
                                        : "Szukaj po numerze zamówienia, usłudze lub statusie..."
                                    }
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>                        {/* Orders List */}
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {technikUser ? 'Brak Twoich zamówień' : 'Brak zamówień'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {searchQuery ? (
                                            'Nie znaleziono zamówień spełniających kryteria wyszukiwania.'
                                        ) : technikUser ? (
                                            <>
                                                Nie masz jeszcze żadnych zamówień na koncie <strong>{technikUser.email}</strong>.
                                                <br />
                                                Złóż pierwsze zamówienie, aby zobaczyć je w tym panelu.
                                            </>
                                        ) : (
                                            'Nie masz jeszcze żadnych zamówień.'
                                        )}
                                    </p>
                                    {!searchQuery && (
                                        <div className="space-y-3">
                                            <a
                                                href="/"
                                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Złóż pierwsze zamówienie
                                            </a>
                                            {technikUser && (
                                                <p className="text-sm text-gray-500">
                                                    Pamiętaj, aby przy składaniu zamówienia podać ten sam email: <strong>{technikUser.email}</strong>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                                                        {getStatusIcon(order.status)} {order.status}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                        {order.type}
                                                    </span>
                                                    {(order.isUnified || order.isLegacy || order.isOldBooking || order.isOldOrder) && (
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                            {order.isUnified ? '🆕 Nowy system' :
                                                                order.isLegacy ? '📋 Zgłoszenie' :
                                                                    order.isOldBooking ? '📱 Szybkie' :
                                                                        '📝 Rezerwacja'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500 mb-1">Usługa</div>
                                                        <div className="font-medium text-gray-900">{order.service}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500 mb-1">Data zgłoszenia</div>
                                                        <div className="font-medium text-gray-900 flex items-center">
                                                            <FaCalendarAlt className="mr-2 text-gray-400" />
                                                            {order.date}
                                                        </div>
                                                    </div>                                    <div>
                                                        <div className="text-sm text-gray-500 mb-1">Adres</div>
                                                        <div className="font-medium text-gray-900 flex items-center">
                                                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                                            {order.address}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-600 mb-4">
                                                    <strong>Opis problemu:</strong> {order.description}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span><strong>Czas realizacji:</strong> {order.estimatedTime}</span>
                                                        <span><strong>Cena:</strong> {order.price}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col space-y-2 ml-4">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                                                >
                                                    <FaEye className="mr-2" />
                                                    Szczegóły
                                                </button>
                                                {order.status === 'Zakończone' && (
                                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
                                                        <FaDownload className="mr-2" />
                                                        Faktura
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Szczegóły zamówienia</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Numer zamówienia</div>
                                        <div className="font-semibold text-gray-900">
                                            {selectedOrder.reportNumber || selectedOrder.id}
                                        </div>
                                        {selectedOrder.reportNumber && selectedOrder.reportNumber !== selectedOrder.id && (
                                            <div className="text-xs text-gray-400">ID: {selectedOrder.id}</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Status</div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedOrder.statusColor}`}>
                                            {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Typ zamówienia</div>
                                    <div className="font-medium text-gray-900">{selectedOrder.type}</div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Usługa</div>
                                    <div className="font-medium text-gray-900">{selectedOrder.service}</div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Opis problemu</div>
                                    <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedOrder.description}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Data zgłoszenia</div>
                                        <div className="font-medium text-gray-900 flex items-center">
                                            <FaCalendarAlt className="mr-2 text-gray-400" />
                                            {selectedOrder.date}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Telefon kontaktowy</div>
                                        <div className="font-medium text-gray-900 flex items-center">
                                            <FaUser className="mr-2 text-gray-400" />
                                            {selectedOrder.phone}
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.email && selectedOrder.email !== 'Nie podano' && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">E-mail kontaktowy</div>
                                        <div className="font-medium text-gray-900">{selectedOrder.email}</div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Adres</div>
                                    <div className="font-medium text-gray-900 flex items-center">
                                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                        {selectedOrder.address}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Czas realizacji</div>
                                        <div className="font-medium text-gray-900">{selectedOrder.estimatedTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Cena</div>
                                        <div className="font-medium text-gray-900">{selectedOrder.price}</div>
                                    </div>
                                </div>

                                {selectedOrder.status === 'Oczekuje na kontakt' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">Co dalej?</h4>
                                        <p className="text-blue-800 text-sm">
                                            Nasz konsultant skontaktuje się z Tobą w ciągu 2 godzin roboczych, aby omówić szczegóły i wstępnie wycenić usługę.
                                        </p>
                                    </div>
                                )}

                                {selectedOrder.status === 'W trakcie realizacji' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 className="font-medium text-yellow-900 mb-2">Trwa realizacja</h4>
                                        <p className="text-yellow-800 text-sm">
                                            Twoje zamówienie jest obecnie realizowane przez naszego fachowca. Otrzymasz powiadomienie po zakończeniu prac.
                                        </p>
                                    </div>
                                )}

                                {selectedOrder.status === 'Zakończone' && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-900 mb-2">Zamówienie zakończone</h4>
                                        <p className="text-green-800 text-sm mb-3">
                                            Dziękujemy za skorzystanie z naszych usług! Jeśli masz pytania dotyczące wykonanych prac, skontaktuj się z nami.
                                        </p>
                                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
                                            <FaDownload className="mr-2" />
                                            Pobierz fakturę
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Development Testing Panel - tylko w trybie development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4 mb-8">
                            <h4 className="font-semibold text-yellow-300 mb-2">🛠️ Panel deweloperski - Testowanie filtrowania</h4>
                            <p className="text-yellow-200 text-sm mb-3">
                                Użyj przycisków poniżej do testowania funkcjonalności filtrowania zamówień:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        // Utwórz dane testowe
                                        const testData = () => {
                                            console.log('🧪 Tworzenie danych testowych...');

                                            // Testowi użytkownicy
                                            const testUsers = [
                                                { id: 'TEST-001', email: 'jan.test@example.com', password: 'test123', name: 'Jan Testowy' },
                                                { id: 'TEST-002', email: 'anna.test@example.com', password: 'test456', name: 'Anna Testowa' }
                                            ];
                                            localStorage.setItem('technikUsers', JSON.stringify(testUsers));

                                            // Testowe zamówienia
                                            const order1 = reportManager.createReport({
                                                email: 'jan.test@example.com',
                                                phone: '+48123456789',
                                                firstName: 'Jan',
                                                lastName: 'Testowy',
                                                description: 'Test - komputer nie włącza się',
                                                equipmentType: 'Komputer',
                                                availability: 'Rano'
                                            });

                                            const order2 = reportManager.createReport({
                                                email: 'anna.test@example.com',
                                                phone: '+48987654321',
                                                firstName: 'Anna',
                                                lastName: 'Testowa',
                                                description: 'Test - drukarka nie drukuje',
                                                equipmentType: 'Drukarka',
                                                availability: 'Popołudnie'
                                            });

                                            reportManager.saveReport(order1);
                                            reportManager.saveReport(order2);

                                            alert(`✅ Utworzono dane testowe!\n\nTestowi użytkownicy:\n• jan.test@example.com (hasło: test123) - ma 1 zamówienie\n• anna.test@example.com (hasło: test456) - ma 1 zamówienie\n\n🔍 TESTOWANIE FILTROWANIA:\n1. Odśwież stronę\n2. Zaloguj się jako jan.test@example.com\n3. Sprawdź czy widzisz tylko swoje zamówienie\n4. Wyloguj się i zaloguj jako anna.test@example.com\n5. Sprawdź czy widzisz inne zamówienie`);
                                        };
                                        testData();
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                    Utwórz dane testowe
                                </button>
                                <button
                                    onClick={() => {
                                        const stats = reportManager.getStats();
                                        console.log('📊 Statystyki systemu:', stats);
                                        alert(`📊 Statystyki:\n• Łącznie zamówień: ${stats.total}\n• Nowe: ${stats.byStatus.new}\n• W trakcie: ${stats.byStatus['in-progress']}\n• Zakończone: ${stats.byStatus.resolved}`);
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                    Pokaż statystyki
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('⚠️ Czy na pewno chcesz wyczyścić wszystkie dane testowe?')) {
                                            localStorage.removeItem('unified_reports');
                                            localStorage.removeItem('quickReports');
                                            localStorage.removeItem('technikUsers');
                                            localStorage.removeItem('rememberedTechnikUser');
                                            alert('🗑️ Dane testowe zostały wyczyszczone. Odśwież stronę.');
                                        }
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                >
                                    Wyczyść dane testowe
                                </button>
                            </div>
                        </div>
                    )}

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
                                <li><a href="#" className="hover:text-white">Kontakt</a></li>
                                <li><a href="#" className="hover:text-white">Regulamin</a></li>
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
