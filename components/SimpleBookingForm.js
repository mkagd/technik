import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaCommentDots, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import reportManager from '../utils/reportManager';

const SimpleBookingForm = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [availability, setAvailability] = useState('');
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedBooking, setSubmittedBooking] = useState(null);
    const [errors, setErrors] = useState({});
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    // Stan dla kodu pocztowego
    const addressInputRef = useRef(null);

    // Ładowanie danych użytkownika przy inicjalizacji
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);

                // Automatyczne wypełnienie danych
                setAddress(user.postalCode || user.address || user.zipCode || '');
                setPhone(user.phone || user.phoneNumber || '');
                setEmail(user.email || '');
            }
        }
    }, []);

    // Obsługa zmian w polu kodu pocztowego
    const handleAddressChange = (e) => {
        const value = e.target.value;
        // Formatowanie kodu pocztowego (automatyczne dodawanie myślnika)
        let formattedValue = value.replace(/\D/g, ''); // usuń wszystko oprócz cyfr
        if (formattedValue.length > 2) {
            formattedValue = formattedValue.slice(0, 2) + '-' + formattedValue.slice(2, 5);
        }
        setAddress(formattedValue);

        // Usuń błąd po rozpoczęciu pisania
        if (errors.address) {
            setErrors({ ...errors, address: '' });
        }
    };

    // Obsługa zmian w numerze telefonu
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setPhone(value);

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors.phone) {
            setErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    // Obsługa zmian w adresie e-mail
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    // Obsługa zmian w opisie problemu
    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors.description) {
            setErrors(prev => ({ ...prev, description: '' }));
        }
    };

    // Obsługa zmian w dostępności
    const handleAvailabilityChange = (e) => {
        const value = e.target.value;
        setAvailability(value);

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors.availability) {
            setErrors(prev => ({ ...prev, availability: '' }));
        }
    };

    // Walidacja formularza
    const validateForm = () => {
        const newErrors = {};

        if (!address.trim()) {
            newErrors.address = 'Podaj kod pocztowy';
        } else if (address.trim().length < 5) {
            newErrors.address = 'Kod pocztowy jest za krótki - podaj pełny kod (np. 39-200)';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Podaj numer telefonu';
        } else if (!/^[\+]?[\d\s\-\(\)]{9,15}$/.test(phone.trim())) {
            newErrors.phone = 'Nieprawidłowy format numeru telefonu';
        }

        // E-mail jest opcjonalny, ale jeśli podany to musi być poprawny
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Nieprawidłowy format adresu e-mail';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Obsługa wysłania formularza
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ OCHRONA: Zapobiegaj wielokrotnym wysyłkom
        if (isSubmitting) {
            console.log('⚠️ Zgłoszenie już jest wysyłane - zignorowano kolejne kliknięcie');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Symulacja wysłania danych
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Przygotuj dane dla reportManager (jako typ RZ - rezerwacja)
            const bookingData = {
                userId: currentUser?.id || null,
                userType: currentUser ? 'registered' : 'guest',
                firstName: currentUser?.firstName || '',
                lastName: currentUser?.lastName || '',
                address: address.trim(),
                phone: phone.trim(),
                email: email.trim() || '',
                description: description.trim() || 'Rezerwacja terminu',
                availability: availability.trim() || '',
                source: 'simple_booking_form'
            };

            // Utwórz zgłoszenie z typem RZ (Rezerwacja)
            const unifiedBooking = reportManager.createReport(bookingData, 'RZ');

            // Zapisz zgłoszenie
            const savedBooking = reportManager.saveReport(unifiedBooking);

            // ✅ NOWE: Wyślij rezerwację do API
            try {
                const reservationData = {
                    name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Gość',
                    phone: phone.trim(),
                    email: email.trim() || '',
                    address: address.trim(),
                    fullAddress: address.trim(),
                    city: '', // Parsowanie miasta z adresu można dodać później
                    street: address.trim(),
                    category: 'AGD',
                    device: 'Nie określono',
                    problem: description.trim() || 'Rezerwacja terminu',
                    availability: availability.trim() || 'Brak preferencji',
                    date: new Date().toISOString(),
                    isLoggedIn: !!currentUser,
                    userId: currentUser?.id || null,
                    clientPhone: phone.trim(),
                    source: 'simple_booking_form'
                };

                console.log('📤 Wysyłanie rezerwacji do API:', reservationData);

                const apiResponse = await fetch('/api/rezerwacje', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reservationData)
                });

                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    console.log('✅ Rezerwacja zapisana na serwerze:', apiData);
                } else {
                    const errorData = await apiResponse.json();
                    console.error('❌ Błąd API:', errorData);
                }
            } catch (apiError) {
                console.error('❌ Błąd podczas wysyłania do API:', apiError);
                // Kontynuuj mimo błędu - localStorage backup działa
            }

            // Dodaj także do starego systemu rezerwacji dla kompatybilności (backup)
            const legacyBooking = {
                id: savedBooking.internalId,
                reportNumber: savedBooking.reportNumber,
                address: address.trim(),
                phone: phone.trim(),
                email: email.trim() || '',
                description: description.trim() || '',
                availability: availability.trim() || '',
                createdAt: savedBooking.timestamp,
                status: 'pending',
                type: 'simple',
                orderNumber: null
            };

            const existingBookings = JSON.parse(localStorage.getItem('simpleBookings') || '[]');
            existingBookings.push(legacyBooking);
            localStorage.setItem('simpleBookings', JSON.stringify(existingBookings));

            setSubmittedBooking(savedBooking);
            setIsSubmitted(true);

            // ✅ NOWE: Zaproponuj utworzenie konta jeśli to gość i ma email
            if (!currentUser && email.trim()) {
                setTimeout(() => {
                    setShowAccountModal(true);
                }, 2000); // Pokaż po 2 sekundach
            }
        } catch (error) {
            console.error('Błąd podczas wysyłania:', error);
            alert('Wystąpił błąd. Spróbuj ponownie.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Funkcja tworzenia konta dla gościa
    const handleCreateAccount = async () => {
        if (!email || !phone || !address) {
            alert('Brak wymaganych danych do utworzenia konta');
            return;
        }

        setIsCreatingAccount(true);

        try {
            // Parsuj adres (zakładając format "33-100" lub "Miasto, 33-100")
            const addressParts = address.split(',').map(p => p.trim());
            const postalCode = addressParts.find(p => /^\d{2}-\d{3}$/.test(p)) || address;
            const city = addressParts.find(p => !/^\d{2}-\d{3}$/.test(p)) || '';

            const registerData = {
                firstName: 'Klient',
                lastName: `#${Date.now()}`,
                email: email,
                phone: phone,
                address: {
                    street: '',
                    buildingNumber: '',
                    city: city || 'Nie podano',
                    postalCode: postalCode,
                    voivodeship: 'podkarpackie',
                    country: 'Polska'
                },
                password: Math.random().toString(36).slice(-8), // Losowe hasło
                type: 'individual'
            };

            const response = await fetch('/api/client/auth?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`✅ Konto utworzone!\n\nEmail: ${email}\nHasło: ${registerData.password}\n\nZapisz te dane! Email powitalny został wysłany.`);
                setShowAccountModal(false);
                
                // Opcjonalnie zaloguj automatycznie
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.client));
                    setCurrentUser(result.client);
                }
            } else {
                alert(`❌ Nie udało się utworzyć konta:\n${result.message}`);
            }
        } catch (error) {
            console.error('Błąd podczas tworzenia konta:', error);
            alert('Wystąpił błąd podczas tworzenia konta');
        } finally {
            setIsCreatingAccount(false);
        }
    };

    // Reset formularza
    const resetForm = () => {
        setAddress('');
        setPhone('');
        setEmail('');
        setDescription('');
        setAvailability('');
        setShowAdditionalFields(false);
        setErrors({});
        setIsSubmitted(false);
        setSubmittedBooking(null);
    };

    if (isSubmitted) {
        return (
            <div className="max-w-md mx-auto mt-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Zgłoszenie wysłane!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Twoje zgłoszenie zostało przyjęte. Skontaktujemy się z Tobą w ciągu 24 godzin.
                    </p>

                    {/* Numer zgłoszenia */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="text-center">
                            <p className="text-sm text-blue-600 mb-1">Numer zgłoszenia:</p>
                            <p className="text-xl font-bold text-blue-900">{submittedBooking?.reportNumber || 'Brak numeru'}</p>
                            <p className="text-xs text-blue-500 mt-1">Zachowaj ten numer do kontaktu z nami</p>
                        </div>
                    </div>

                    {/* Szczegóły zgłoszenia */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
                        <h3 className="font-semibold text-gray-900 mb-2">Szczegóły:</h3>
                        <div className="space-y-1">
                            <p><strong>Typ:</strong> {submittedBooking?.type === 'RZ' ? 'Rezerwacja' : 'Zgłoszenie'}</p>
                            <p><strong>Adres:</strong> {submittedBooking?.contactInfo?.address}</p>
                            <p><strong>Telefon:</strong> {submittedBooking?.contactInfo?.phone}</p>
                            {submittedBooking?.contactInfo?.email && (
                                <p><strong>E-mail:</strong> {submittedBooking?.contactInfo?.email}</p>
                            )}
                            {submittedBooking?.reportDetails?.availability && (
                                <p><strong>Dostępność:</strong> {submittedBooking?.reportDetails?.availability}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Kod pocztowy:</strong> {address}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Telefon:</strong> {phone}
                        </p>
                        {email && (
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>E-mail:</strong> {email}
                            </p>
                        )}
                        {description && (
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Opis problemu:</strong> {description}
                            </p>
                        )}
                        {availability && (
                            <p className="text-sm text-gray-600">
                                <strong>Dostępność:</strong> {availability}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={resetForm}
                        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Wyślij kolejne zgłoszenie
                    </button>

                    {/* ✅ MODAL: Propozycja utworzenia konta */}
                    {showAccountModal && !currentUser && email && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaCheckCircle className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        Utwórz konto?
                                    </h3>
                                    <p className="text-gray-600">
                                        Chcesz śledzić status swojego zgłoszenia online?
                                    </p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-purple-900 mb-2">✨ Korzyści z konta:</h4>
                                    <ul className="text-sm text-purple-800 space-y-1">
                                        <li>📱 Śledzenie statusu zgłoszeń</li>
                                        <li>📧 Powiadomienia email</li>
                                        <li>📋 Historia wszystkich napraw</li>
                                        <li>⚡ Szybsze składanie zleceń</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                                    <p className="text-sm text-gray-700">
                                        <strong>Email:</strong> {email}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hasło zostanie wygenerowane i wysłane na Twój email
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowAccountModal(false)}
                                        className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                        disabled={isCreatingAccount}
                                    >
                                        Nie, dziękuję
                                    </button>
                                    <button
                                        onClick={handleCreateAccount}
                                        disabled={isCreatingAccount}
                                        className="flex-1 py-3 px-6 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                                    >
                                        {isCreatingAccount ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                                Tworzę...
                                            </div>
                                        ) : (
                                            'Tak, utwórz konto'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Szybkie zgłoszenie
                    </h2>
                    <p className="text-gray-600">
                        Podaj podstawowe dane - skontaktujemy się z Tobą
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Pole kodu pocztowego */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kod pocztowy
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                ref={addressInputRef}
                                type="text"
                                value={address}
                                onChange={handleAddressChange}
                                placeholder="np. 39-200"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.address && (
                            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                        )}

                        {/* Wskazówki dla użytkownika */}
                        {!errors.address && (
                            <p className="mt-1 text-xs text-gray-500">
                                💡 Wpisz kod pocztowy obszaru gdzie wykonać usługę (np. "39-200", "33-100")
                            </p>
                        )}
                    </div>

                    {/* Pole telefonu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Numer telefonu
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaPhone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="np. +48 123 456 789"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                    </div>

                    {/* Pole e-mail */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adres e-mail <span className="text-gray-500 text-sm">(opcjonalnie)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="np. jan.kowalski@email.com"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                        {!errors.email && (
                            <p className="mt-1 text-xs text-gray-500">
                                💌 Ułatwia kontakt i otrzymywanie aktualizacji
                            </p>
                        )}
                    </div>

                    {/* Checkbox do rozwinięcia dodatkowych pól */}
                    <div className="border-t border-gray-200 pt-4">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={showAdditionalFields}
                                onChange={(e) => setShowAdditionalFields(e.target.checked)}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                Chcę dodać więcej informacji
                            </span>
                            <span className="ml-2 text-gray-400">
                                {showAdditionalFields ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
                            </span>
                        </label>
                        <p className="mt-1 text-xs text-gray-500 ml-7">
                            📝 Opis problemu i dostępność (opcjonalnie)
                        </p>
                    </div>

                    {/* Dodatkowe pola - pokazywane tylko gdy checkbox jest zaznaczony */}
                    {showAdditionalFields && (
                        <div className="space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/30">
                            {/* Pole opisu problemu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaCommentDots className="inline h-4 w-4 mr-2 text-blue-600" />
                                    Opis problemu
                                </label>
                                <textarea
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    placeholder="np. Pralka nie odprowadza wody, dziwny dźwięk podczas prania..."
                                    rows={3}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-600">
                                    💡 Pomaga nam lepiej przygotować się do wizyty
                                </p>
                            </div>

                            {/* Pole dostępności */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaClock className="inline h-4 w-4 mr-2 text-blue-600" />
                                    Kiedy jesteś dostępny?
                                </label>
                                <input
                                    type="text"
                                    value={availability}
                                    onChange={handleAvailabilityChange}
                                    placeholder="np. Pon-Pt 8:00-16:00, Weekend cały dzień, Tylko popołudnia..."
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.availability ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.availability && (
                                    <p className="mt-1 text-sm text-red-600">{errors.availability}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-600">
                                    📅 Ułatwia nam umówienie dogodnego terminu
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Przycisk wysłania */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 px-6 font-medium rounded-lg transition-all ${isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300'
                            } text-white`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                Wysyłanie...
                            </div>
                        ) : (
                            'Zgłoś naprawę'
                        )}
                    </button>
                </form>

                {/* Informacje dodatkowe */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">
                        Co dalej?
                    </h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Skontaktujemy się z Tobą w ciągu 24h</li>
                        <li>• Ustalimy szczegóły naprawy</li>
                        <li>• Przyjedziemy w dogodnym terminie</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SimpleBookingForm;
