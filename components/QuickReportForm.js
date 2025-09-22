import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaCommentDots, FaClock, FaChevronDown, FaChevronUp, FaTools, FaTv, FaLaptop, FaMobile, FaCar, FaHome, FaWater, FaFire, FaSnowflake, FaBlender } from 'react-icons/fa';
import reportManager from '../utils/reportManager';

const QuickReportForm = ({ onBack, theme = 'naprawa' }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        phone: '',
        email: '',
        description: '',
        availability: '',
        equipmentType: '',
        customEquipment: '',
        availabilityType: '',
        customAvailability: ''
    });
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedReport, setSubmittedReport] = useState(null);
    const [errors, setErrors] = useState({});
    const [dataConfirmed, setDataConfirmed] = useState(false);

    // Konfiguracja motywów
    const themeConfig = {
        naprawa: {
            primaryColor: 'blue',
            gradientFrom: 'from-blue-50',
            gradientTo: 'to-indigo-100',
            headerGradient: 'from-blue-600 to-indigo-600',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            focusColor: 'focus:ring-2 focus:ring-blue-500',
            borderColor: 'border-blue-500 bg-blue-50 text-blue-700',
            iconColor: 'text-blue-600',
            checkboxColor: 'text-blue-600 focus:ring-blue-500',
            title: 'Szybkie zgłoszenie serwisowe',
            subtitle: 'naprawa.pl'
        },
        usterka: {
            primaryColor: 'red',
            gradientFrom: 'from-red-50',
            gradientTo: 'to-orange-100',
            headerGradient: 'from-red-600 to-orange-600',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            focusColor: 'focus:ring-2 focus:ring-red-500',
            borderColor: 'border-red-500 bg-red-50 text-red-700',
            iconColor: 'text-red-600',
            checkboxColor: 'text-red-600 focus:ring-red-500',
            title: 'Zgłoszenie usterki',
            subtitle: 'usterka.pl'
        }
    };

    const currentTheme = themeConfig[theme] || themeConfig.naprawa;

    // Opcje sprzętu AGD/RTV
    const equipmentOptions = [
        { value: 'pralka', label: '🔧 Pralka', icon: FaTools },
        { value: 'lodowka', label: '❄️ Lodówka', icon: FaSnowflake },
        { value: 'kuchenka', label: '🔥 Kuchenka', icon: FaFire },
        { value: 'zmywarka', label: '💧 Zmywarka', icon: FaWater },
        { value: 'telewizor', label: '📺 Telewizor', icon: FaTv },
        { value: 'laptop', label: '💻 Laptop', icon: FaLaptop },
        { value: 'telefon', label: '📱 Telefon', icon: FaMobile },
        { value: 'klimatyzacja', label: '❄️ Klimatyzacja', icon: FaSnowflake },
        { value: 'mikrofalowka', label: '🔥 Mikrofalówka', icon: FaBlender },
        { value: 'inne', label: '🔧 Inne (wpisz własne)', icon: FaTools }
    ];

    // Opcje dostępności
    const availabilityOptions = [
        { value: 'od-zaraz', label: '⚡ Od zaraz' },
        { value: 'dzisiaj', label: '📅 Dzisiaj' },
        { value: 'jutro', label: '📅 Jutro' },
        { value: 'weekend', label: '📅 Weekend' },
        { value: 'nastepny-tydzien', label: '📅 Następny tydzień' },
        { value: 'po-godzinach', label: '🌙 Po godzinach pracy' },
        { value: 'rano', label: '🌅 Rano (7:00-12:00)' },
        { value: 'poporudnie', label: '☀️ Popołudnie (12:00-17:00)' },
        { value: 'wieczor', label: '🌆 Wieczór (17:00-21:00)' },
        { value: 'inne', label: '⏰ Inne (wpisz własne)' }
    ];

    // Ładowanie danych użytkownika przy inicjalizacji
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);

                // Automatyczne wypełnienie danych - lepsze obsługiwanie różnych źródeł danych
                setFormData(prev => ({
                    ...prev,
                    address: user.postalCode || user.address || user.zipCode || '',
                    city: user.city || user.locality || '',
                    phone: user.phone || user.phoneNumber || '',
                    email: user.email || ''
                }));

                // Jeśli dane są kompletne, automatycznie zaznacz potwierdzenie
                if ((user.city || user.locality) && (user.phone || user.phoneNumber) && user.email) {
                    setDataConfirmed(true);
                }

                // Dodatkowe info dla użytkowników Google
                if (user.provider === 'google' && user.googleId) {
                    // Możliwość pobrania dodatkowych danych z Google Contacts API
                    loadGoogleContactsData(user);
                }
            }
        }
    }, []);

    // Funkcja do ładowania dodatkowych danych z Google Contacts
    const loadGoogleContactsData = async (user) => {
        try {
            // Sprawdź czy użytkownik ma włączone synchronizowanie kontaktów Google
            const googleContactsEnabled = localStorage.getItem(`googleContacts_${user.googleId}`) === 'true';

            if (googleContactsEnabled) {
                // Tutaj można dodać logikę pobierania danych z Google Contacts API
                // Na razie symulujemy sprawdzenie czy są dostępne lepsze dane kontaktowe
                const enhancedData = await checkForEnhancedGoogleData(user);

                if (enhancedData) {
                    setFormData(prev => ({
                        ...prev,
                        address: enhancedData.address || prev.address,
                        city: enhancedData.city || prev.city,
                        phone: enhancedData.phone || prev.phone
                    }));
                }
            }
        } catch (error) {
            console.log('Error loading Google contacts data:', error);
        }
    };

    // Symulacja sprawdzania rozszerzonych danych Google
    const checkForEnhancedGoogleData = async (user) => {
        // W rzeczywistej aplikacji tutaj byłoby wywołanie Google Contacts API
        // Na razie zwracamy null lub przykładowe dane
        return null;
    };

    // Obsługa zmian w polach formularza
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Formatowanie kodu pocztowego
    const handleAddressChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '-' + value.slice(2, 5);
        }
        handleInputChange('address', value);
    };

    // Walidacja formularza
    const validateForm = () => {
        const newErrors = {};

        if (!formData.address.trim() && !formData.city.trim()) {
            newErrors.address = 'Podaj kod pocztowy lub miasto';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Podaj numer telefonu';
        } else if (!/^[\+]?[\d\s\-\(\)]{9,15}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Nieprawidłowy format numeru telefonu';
        }

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Nieprawidłowy format adresu e-mail';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Opisz problem z urządzeniem';
        }

        if (!formData.equipmentType) {
            newErrors.equipmentType = 'Wybierz typ sprzętu lub wpisz własny';
        }

        if (formData.equipmentType === 'inne' && !formData.customEquipment.trim()) {
            newErrors.customEquipment = 'Wpisz jaki sprzęt chcesz naprawić';
        }

        if (!formData.availabilityType) {
            newErrors.availabilityType = 'Wybierz kiedy jesteś dostępny lub wpisz własne';
        }

        if (formData.availabilityType === 'inne' && !formData.customAvailability.trim()) {
            newErrors.customAvailability = 'Wpisz kiedy jesteś dostępny';
        }

        // Sprawdź czy dane zostały potwierdzone dla zalogowanych użytkowników
        if (currentUser && !dataConfirmed) {
            newErrors.dataConfirmed = 'Potwierdź poprawność danych kontaktowych';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Obsługa wysyłania formularza
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Symulacja wysyłania
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Określ typ zgłoszenia na podstawie theme
        const reportType = theme === 'usterka' ? 'US' : 'ZG';

        // Przygotuj dane zgłoszenia dla reportManager
        const reportData = {
            userId: currentUser?.id || null,
            userType: currentUser ? 'registered' : 'guest',
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            ...formData,
            finalAvailability: formData.availabilityType === 'inne' ? formData.customAvailability : formData.availabilityType || formData.availability,
            finalEquipment: formData.equipmentType === 'inne' ? formData.customEquipment : formData.equipmentType,
            source: 'quick_report_form',
            theme: theme
        };

        // Utwórz zgłoszenie z ujednoliconym numerem
        const unifiedReport = reportManager.createReport(reportData, reportType);

        // Zapisz zgłoszenie w unified_reports oraz dla kompatybilności w quickReports
        const savedReport = reportManager.saveReport(unifiedReport);

        setSubmittedReport(savedReport);
        setIsSubmitted(true);
        setIsSubmitting(false);
    };

    if (isSubmitted) {
        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.gradientFrom} ${currentTheme.gradientTo} flex items-center justify-center p-4`}>
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
                    <div className="mb-6">
                        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Zgłoszenie wysłane!</h2>
                        <p className="text-gray-600">Twoje zgłoszenie zostało pomyślnie przyjęte</p>
                        <p className="text-sm text-gray-500 mt-1">({currentTheme.subtitle})</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                        <h3 className="font-bold text-gray-900 mb-4">Podsumowanie zgłoszenia:</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Numer zgłoszenia:</strong> {submittedReport?.reportNumber}</p>
                            <p><strong>Typ zgłoszenia:</strong> {submittedReport?.type === 'US' ? 'Usterka' : 'Zgłoszenie serwisowe'}</p>
                            <p><strong>Typ sprzętu:</strong> {submittedReport?.reportDetails?.equipmentType || 'Nieokreślony'}</p>
                            <p><strong>Problem:</strong> {submittedReport?.reportDetails?.description}</p>
                            <p><strong>Dostępność:</strong> {submittedReport?.reportDetails?.availability}</p>
                            <p><strong>Kontakt:</strong> {submittedReport?.contactInfo?.phone}</p>
                            {submittedReport?.contactInfo?.email && <p><strong>E-mail:</strong> {submittedReport?.contactInfo?.email}</p>}
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            Skontaktujemy się z Tobą w ciągu <strong>2 godzin</strong>
                        </p>
                        <button
                            onClick={onBack}
                            className={`${currentTheme.buttonColor} text-white px-8 py-3 rounded-lg transition-colors`}
                        >
                            Powrót do strony głównej
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br ${currentTheme.gradientFrom} ${currentTheme.gradientTo} py-8 px-4`}>
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${currentTheme.headerGradient} px-8 py-6`}>
                        <h1 className="text-2xl font-bold text-white mb-2">{currentTheme.title}</h1>
                        <p className="text-blue-100">
                            {currentUser ? `Witaj ${currentUser.firstName}! Dane zostały automatycznie wypełnione.` : 'Wypełnij formularz aby zgłosić problem'}
                        </p>
                        <p className="text-xs text-blue-200 mt-1">{currentTheme.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {/* Potwierdzenie danych dla zalogowanych */}
                        {currentUser && (
                            <div className={`mb-6 p-4 ${currentTheme.primaryColor === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <h3 className={`font-semibold ${currentTheme.primaryColor === 'blue' ? 'text-blue-900' : 'text-red-900'}`}>
                                            Sprawdź swoje dane kontaktowe
                                        </h3>
                                        {currentUser.provider === 'google' && (
                                            <div className="ml-2 flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                <FaCheckCircle className="mr-1 h-3 w-3" />
                                                Google
                                            </div>
                                        )}
                                    </div>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dataConfirmed}
                                            onChange={(e) => setDataConfirmed(e.target.checked)}
                                            className={`mr-2 h-4 w-4 ${currentTheme.checkboxColor} border-gray-300 rounded`}
                                        />
                                        <span className={`text-sm ${currentTheme.primaryColor === 'blue' ? 'text-blue-800' : 'text-red-800'} font-medium`}>Dane są poprawne</span>
                                    </label>
                                </div>

                                <div className={`text-sm ${currentTheme.primaryColor === 'blue' ? 'text-blue-800' : 'text-red-800'} space-y-1`}>
                                    {currentUser.picture && (
                                        <div className="flex items-center mb-2">
                                            <img
                                                src={currentUser.picture}
                                                alt="Profil"
                                                className="w-8 h-8 rounded-full mr-2"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <span className="text-xs text-gray-600">
                                                {currentUser.firstName} {currentUser.lastName}
                                                {currentUser.provider === 'google' && ' (Google)'}
                                            </span>
                                        </div>
                                    )}
                                    {formData.city && <p><strong>Miasto:</strong> {formData.city}</p>}
                                    {formData.address && <p><strong>Kod pocztowy:</strong> {formData.address}</p>}
                                    <p><strong>Telefon:</strong> {formData.phone || 'Nie podano'}</p>
                                    {formData.email && <p><strong>E-mail:</strong> {formData.email}</p>}

                                    {currentUser.provider === 'google' && (
                                        <div className="mt-2 pt-2 border-t border-blue-200">
                                            <p className={`text-xs ${currentTheme.primaryColor === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
                                                🔄 Dane automatycznie pobrane z Google
                                                {currentUser.lastGoogleSync && (
                                                    <span className="block">
                                                        Ostatnia synchronizacja: {new Date(currentUser.lastGoogleSync).toLocaleString()}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {errors.dataConfirmed && <p className="text-red-500 text-sm mt-2">{errors.dataConfirmed}</p>}
                                <p className={`text-xs ${currentTheme.primaryColor === 'blue' ? 'text-blue-600' : 'text-red-600'} mt-2`}>
                                    💡 Możesz edytować dane poniżej jeśli są nieprawidłowe
                                </p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Dane kontaktowe */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaMapMarkerAlt className={`inline mr-2 ${currentTheme.iconColor}`} />
                                        Miasto
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        placeholder="np. Warszawa"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaMapMarkerAlt className={`inline mr-2 ${currentTheme.iconColor}`} />
                                        Kod pocztowy
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={handleAddressChange}
                                        placeholder="np. 39-200"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                        maxLength="6"
                                    />
                                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaPhone className={`inline mr-2 ${currentTheme.iconColor}`} />
                                        Numer telefonu *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="np. 123 456 789"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaEnvelope className={`inline mr-2 ${currentTheme.iconColor}`} />
                                        E-mail (opcjonalnie)
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="twoj@email.com"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            {/* Typ sprzętu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    <FaTools className={`inline mr-2 ${currentTheme.iconColor}`} />
                                    Co chcesz naprawić? *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    {equipmentOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleInputChange('equipmentType', option.value)}
                                            className={`p-3 text-sm rounded-lg border-2 transition-colors ${formData.equipmentType === option.value
                                                ? currentTheme.borderColor
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                {formData.equipmentType === 'inne' && (
                                    <input
                                        type="text"
                                        value={formData.customEquipment}
                                        onChange={(e) => handleInputChange('customEquipment', e.target.value)}
                                        placeholder="Wpisz jaki sprzęt chcesz naprawić"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.customEquipment ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                )}
                                {errors.equipmentType && <p className="text-red-500 text-sm mt-1">{errors.equipmentType}</p>}
                                {errors.customEquipment && <p className="text-red-500 text-sm mt-1">{errors.customEquipment}</p>}
                            </div>

                            {/* Opis problemu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaCommentDots className={`inline mr-2 ${currentTheme.iconColor}`} />
                                    Opisz problem *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="np. Pralka nie wiruje, telewizor nie włącza się, lodówka hałasuje..."
                                    rows="4"
                                    className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </div>

                            {/* Dostępność */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    <FaClock className={`inline mr-2 ${currentTheme.iconColor}`} />
                                    Kiedy jesteś dostępny? *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    {availabilityOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleInputChange('availabilityType', option.value)}
                                            className={`p-3 text-sm rounded-lg border-2 transition-colors ${formData.availabilityType === option.value
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                {formData.availabilityType === 'inne' && (
                                    <input
                                        type="text"
                                        value={formData.customAvailability}
                                        onChange={(e) => handleInputChange('customAvailability', e.target.value)}
                                        placeholder="Wpisz kiedy jesteś dostępny (np. jutro po 18:00)"
                                        className={`w-full px-4 py-3 border rounded-lg ${currentTheme.focusColor} focus:border-transparent ${errors.customAvailability ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                )}
                                {errors.availabilityType && <p className="text-red-500 text-sm mt-1">{errors.availabilityType}</p>}
                                {errors.customAvailability && <p className="text-red-500 text-sm mt-1">{errors.customAvailability}</p>}
                            </div>

                            {/* Przyciski */}
                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Powrót
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (currentUser && !dataConfirmed)}
                                    className={`flex-1 px-6 py-3 ${currentTheme.buttonColor} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Wysyłanie...
                                        </>
                                    ) : (
                                        'Wyślij zgłoszenie'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuickReportForm;
