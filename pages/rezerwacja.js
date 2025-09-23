// pages/rezerwacja.js - Kreator "Zamów fachowca" AGD

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMapPin, FiTool, FiClock, FiCheck, FiArrowRight, FiArrowLeft, FiChevronDown } from 'react-icons/fi';

export default function Rezerwacja() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [getCityByPostalCode, setGetCityByPostalCode] = useState(null);
    const [postalCodeMap, setPostalCodeMap] = useState({});
    
    // Dynamiczne ładowanie funkcji kodów pocztowych
    useEffect(() => {
        const loadPostalCodes = async () => {
            try {
                const { getCityByPostalCode: getCity, postalCodeMap: codeMap } = await import('../data/postalCodes');
                setGetCityByPostalCode(() => getCity);
                setPostalCodeMap(codeMap || {});
            } catch (error) {
                console.error('Error loading postal codes:', error);
            }
        };
        loadPostalCodes();
    }, []);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        postalCode: '',
        city: '',
        street: '',
        fullAddress: '',
        categories: [], // Zmienione na tablicę dla wielu typów urządzeń
        devices: [], // Tablica modeli dla każdego urządzenia
        brands: [], // Tablica marek dla każdego urządzenia
        problems: [], // Tablica problemów dla każdego urządzenia
        timeSlot: '',
        additionalNotes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [showBrandSuggestions, setShowBrandSuggestions] = useState(null); // Zmieniamy na index lub null
    const [editMode, setEditMode] = useState({
        client: false,
        address: false,
        timeSlot: false,
        notes: false
    });

    // Lista popularnych marek AGD
    const brands = [
        'Amica', 'Aeg', 'Beko', 'Bosch', 'Candy', 'Electrolux', 'Gorenje', 
        'Haier', 'Hotpoint', 'Indesit', 'LG', 'Miele', 'Panasonic', 'Samsung', 
        'Sharp', 'Siemens', 'Whirlpool', 'Zanussi'
    ];

    const totalSteps = 4;

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Obsługa kodu pocztowego - automatyczne uzupełnianie miasta
        if (name === 'postalCode') {
            let city = '';
            try {
                if (getCityByPostalCode) {
                    city = getCityByPostalCode(value) || '';
                }
            } catch (error) {
                console.error('Error getting city:', error);
                city = '';
            }
            setFormData({
                ...formData,
                [name]: value,
                city: city
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
        
        // Pokazuj podpowiedzi dla marki
        if (name === 'brand') {
            setShowBrandSuggestions(value.length > 0);
        }
    };

    const handleBrandSelect = (brand, index = null) => {
        if (index !== null) {
            // Multi-device mode
            const newBrands = [...formData.brands];
            newBrands[index] = brand;
            setFormData({
                ...formData,
                brands: newBrands
            });
        } else {
            // Single field mode (for backward compatibility)
            setFormData({
                ...formData,
                brand: brand
            });
        }
        setShowBrandSuggestions(null);
    };

    const getFilteredBrands = (searchTerm = '') => {
        const term = searchTerm || formData.brand || '';
        if (!term) return brands.slice(0, 8); // Pokaż pierwsze 8 gdy puste
        return brands.filter(brand => 
            brand.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 6); // Maksymalnie 6 podpowiedzi
    };

    // Nowa funkcja do obsługi wyboru kategorii (multi-select)
    const handleCategoryToggle = (e) => {
        const category = e.target.value;
        const newCategories = formData.categories.includes(category)
            ? formData.categories.filter(cat => cat !== category)
            : [...formData.categories, category];
        
        // Jeśli usuwamy kategorię, usuń też jej detale
        if (formData.categories.includes(category)) {
            const index = formData.categories.indexOf(category);
            const newBrands = [...formData.brands];
            const newDevices = [...formData.devices];
            const newProblems = [...formData.problems];
            
            newBrands.splice(index, 1);
            newDevices.splice(index, 1);
            newProblems.splice(index, 1);
            
            setFormData({
                ...formData,
                categories: newCategories,
                brands: newBrands,
                devices: newDevices,
                problems: newProblems
            });
        } else {
            // Dodajemy nową kategorię
            setFormData({
                ...formData,
                categories: newCategories
            });
        }
    };

    // Funkcja do obsługi detali urządzeń
    const handleDeviceDetailChange = (index, field, value) => {
        const newArray = [...(formData[field + 's'] || [])];
        newArray[index] = value;
        
        setFormData({
            ...formData,
            [field + 's']: newArray
        });
    };

    const toggleEditMode = (field) => {
        setEditMode(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const saveEdit = (field) => {
        setEditMode(prev => ({
            ...prev,
            [field]: false
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            setMessage(''); // Czyszczenie komunikatu przy przejściu do następnego kroku
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setMessage(''); // Czyszczenie komunikatu przy powrocie
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        // Walidacja adresu
        if (!formData.postalCode || !formData.city || !formData.street) {
            setMessage('❌ Uzupełnij wszystkie pola adresu: kod pocztowy, miasto i ulicę');
            setIsSubmitting(false);
            return;
        }

        // Walidacja multi-device
        if (formData.categories.length === 0) {
            setMessage('❌ Wybierz przynajmniej jeden typ urządzenia');
            setIsSubmitting(false);
            return;
        }

        if (formData.categories.some((_, index) => !formData.problems[index]?.trim())) {
            setMessage('❌ Opisz problemy dla wszystkich wybranych urządzeń');
            setIsSubmitting(false);
            return;
        }

        const submitData = {
            ...formData,
            address: `${formData.street}, ${formData.postalCode} ${formData.city}`,
            // Dla kompatybilności z API, wysyłamy również stare pola z pierwszego urządzenia
            category: formData.categories[0] || '',
            brand: formData.brands[0] || '',
            device: formData.devices[0] || '',
            problem: formData.problems[0] || ''
        };

        try {
            const response = await fetch('/api/rezerwacje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (response.ok) {
                const deviceCount = formData.categories.length;
                const deviceText = deviceCount === 1 ? 'urządzenie' : 
                                 deviceCount < 5 ? 'urządzenia' : 'urządzeń';
                setMessage(`✅ Zgłoszenie na ${deviceCount} ${deviceText} zostało wysłane! Nasz zespół skontaktuje się z Tobą wkrótce.`);
                setTimeout(() => {
                    setMessage(prevMessage =>
                        prevMessage + '\n\n🗺️ Możesz już zobaczyć swoje zgłoszenie na mapie!'
                    );
                }, 1500);
            } else {
                setMessage('❌ Błąd: ' + result.message);
            }
        } catch (error) {
            setMessage('❌ Błąd połączenia. Spróbuj ponownie.');
            console.error('Error:', error);
        }

        setIsSubmitting(false);
    };

    const getStepIcon = (step) => {
        switch (step) {
            case 1: return <FiTool className="w-5 h-5" />;
            case 2: return <FiMapPin className="w-5 h-5" />;
            case 3: return <FiUser className="w-5 h-5" />;
            case 4: return <FiClock className="w-5 h-5" />;
            default: return null;
        }
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1: 
                // Multi-device: musi być wybrana przynajmniej jedna kategoria i każda musi mieć opis problemu
                return formData.categories.length > 0 && 
                       formData.categories.every((_, index) => formData.problems[index]?.trim());
            case 2: return formData.postalCode && formData.city && formData.street; // Gdzie - kod pocztowy, miasto, ulica
            case 3: return formData.name && formData.phone; // Dane kontaktowe (email opcjonalny)
            case 4: return formData.timeSlot; // Dostępność - wymagany przedział czasowy
            default: return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🛠️ Serwis AGD - Zamów fachowca
                    </h1>
                    <p className="text-gray-600">
                        Profesjonalna naprawa sprzętu AGD w Twoim domu
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step <= currentStep 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-400'
                                } ${step < currentStep ? 'bg-green-500' : ''}`}>
                                    {step < currentStep ? <FiCheck className="w-5 h-5" /> : getStepIcon(step)}
                                </div>
                                {step < 4 && (
                                    <div className={`w-12 h-1 mx-2 ${
                                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <span className="text-sm text-gray-500">
                            Krok {currentStep} z {totalSteps}
                        </span>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Typ urządzenia AGD */}
                        {currentStep === 1 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiTool className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Co naprawiamy?</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Typ urządzenia AGD * (możesz wybrać kilka)
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'Pralka', icon: '/icons/agd/pralka.svg', label: 'Pralka', desc: 'Automatyczna', color: 'from-blue-400 to-blue-600' },
                                                { value: 'Zmywarka', icon: '/icons/agd/zmywarka.svg', label: 'Zmywarka', desc: 'Do naczyń', color: 'from-cyan-400 to-cyan-600' },
                                                { value: 'Lodówka', icon: '/icons/agd/lodowka.svg', label: 'Lodówka', desc: 'Chłodzenie', color: 'from-indigo-400 to-indigo-600' },
                                                { value: 'Piekarnik', icon: '/icons/agd/piekarnik.svg', label: 'Piekarnik', desc: 'Do pieczenia', color: 'from-orange-400 to-orange-600' },
                                                { value: 'Suszarka', icon: '/icons/agd/suszarka.svg', label: 'Suszarka', desc: 'Do ubrań', color: 'from-purple-400 to-purple-600' },
                                                { value: 'Kuchenka', icon: '/icons/agd/kuchenka.svg', label: 'Kuchenka', desc: 'Gazowa/elektr.', color: 'from-red-400 to-red-600' },
                                                { value: 'Mikrofalówka', icon: '/icons/agd/mikrofalowka.svg', label: 'Mikrofalówka', desc: 'Do podgrzewania', color: 'from-yellow-400 to-yellow-600' },
                                                { value: 'Okap', icon: '/icons/agd/okap.svg', label: 'Okap', desc: 'Wyciąg kuchenny', color: 'from-gray-400 to-gray-600' },
                                                { value: 'Inne AGD', icon: '/icons/agd/inne.svg', label: 'Inne AGD', desc: 'Pozostałe', color: 'from-green-400 to-green-600' },
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105 ${
                                                    formData.categories.includes(option.value)
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                                }`}>
                                                    <input
                                                        type="checkbox"
                                                        name="categories"
                                                        value={option.value}
                                                        checked={formData.categories.includes(option.value)}
                                                        onChange={handleCategoryToggle}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white text-xl font-bold shadow-md p-2`}>
                                                        <img 
                                                            src={option.icon} 
                                                            alt={option.label}
                                                            className="w-6 h-6 object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-800 mb-1">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                                    {formData.categories.includes(option.value) && (
                                                        <div className="mt-2 text-blue-600 text-sm font-semibold">✓ Wybrane</div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detale dla każdego wybranego urządzenia */}
                                    {formData.categories.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                                Szczegóły urządzeń ({formData.categories.length})
                                            </h3>
                                            {formData.categories.map((category, index) => (
                                                <div key={category} className="border rounded-lg p-4 bg-gray-50">
                                                    <h4 className="text-md font-semibold mb-3 flex items-center">
                                                        <div className="w-6 h-6 mr-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-1">
                                                            <img 
                                                                src={`/icons/agd/${category.toLowerCase().replace('ó', 'o').replace('ą', 'a').replace(' agd', '').replace(' ', '-')}.svg`}
                                                                alt={category}
                                                                className="w-4 h-4 object-contain"
                                                            />
                                                        </div>
                                                        {category}
                                                    </h4>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Marka
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={formData.brands[index] || ''}
                                                                    onChange={(e) => handleDeviceDetailChange(index, 'brand', e.target.value)}
                                                                    onFocus={() => setShowBrandSuggestions(index)}
                                                                    onBlur={() => setTimeout(() => setShowBrandSuggestions(null), 200)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    placeholder="np. Samsung, Bosch, LG..."
                                                                />
                                                                {showBrandSuggestions === index && (
                                                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto">
                                                                        {getFilteredBrands(formData.brands[index] || '').map((brand) => (
                                                                            <button
                                                                                key={brand}
                                                                                type="button"
                                                                                onClick={() => handleBrandSelect(brand, index)}
                                                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                                                                            >
                                                                                {brand}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Model (opcjonalnie)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.devices[index] || ''}
                                                                onChange={(e) => handleDeviceDetailChange(index, 'device', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="np. WW80T4020EE"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Opis problemu *
                                                        </label>
                                                        <textarea
                                                            value={formData.problems[index] || ''}
                                                            onChange={(e) => handleDeviceDetailChange(index, 'problem', e.target.value)}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Opisz problem z tym urządzeniem..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Adres */}
                        {currentStep === 2 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiMapPin className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Adres wizyty</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kod pocztowy *
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            placeholder="39-200"
                                            maxLength="6"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            💡 Wpisz kod pocztowy, a miasto wypełni się automatycznie
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Miasto *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Miasto zostanie wypełnione automatycznie"
                                                readOnly={postalCodeMap[formData.postalCode]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ulica i numer *
                                            </label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="np. Główna 123/45"
                                            />
                                        </div>
                                    </div>

                                    {/* Podgląd adresu */}
                                    {formData.postalCode && formData.city && formData.street && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="text-sm text-green-700">
                                                <strong>📍 Pełny adres:</strong> {formData.street}, {formData.postalCode} {formData.city}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Dane kontaktowe */}
                        {currentStep === 3 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiUser className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Twoje dane kontaktowe</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Imię i nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Jan Kowalski"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Telefon *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="+48 123 456 789"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email (opcjonalny) 📧
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="jan@example.com"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            💡 Podaj email żeby otrzymać potwierdzenie i aktualizacje o statusie naprawy
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Dostępność */}
                        {currentStep === 4 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiClock className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Kiedy jesteś dostępny?</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            🕒 W jakich godzinach możemy umówić wizytę? *
                                        </label>
                                        
                                        {/* Informacja o priorytetach terminów */}
                                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                                            <h4 className="font-medium text-gray-800 mb-2">💡 Informacja o terminach:</h4>
                                            <div className="text-sm space-y-1">
                                                <div className="text-green-700">✅ <strong>Cały czas dostępny</strong> = najszybszy termin wizyty</div>
                                                <div className="text-yellow-700">⚠️ <strong>Ograniczona dostępność</strong> = standardowy czas oczekiwania</div>
                                                <div className="text-red-700">⏰ <strong>Po 15:00 i przed 10:00</strong> = najdłuższy czas oczekiwania</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            {[
                                                { value: 'Cały dzień', label: '⏰', desc: 'Cały dzień', subDesc: '8:00-20:00 (najszybszy)', priority: 'high' },
                                                { value: '8:00-12:00', label: '🌅', desc: 'Rano', subDesc: '8:00-12:00', priority: 'medium' },
                                                { value: '12:00-16:00', label: '☀️', desc: 'Popołudnie', subDesc: '12:00-16:00', priority: 'medium' },
                                                { value: '16:00-20:00', label: '🌆', desc: 'Wieczór', subDesc: '16:00-20:00', priority: 'medium' },
                                                { value: 'Weekend', label: '�', desc: 'Weekend', subDesc: 'Sobota/Niedziela', priority: 'medium' },
                                                { value: 'Po 15:00', label: '🌙', desc: 'Tylko wieczory', subDesc: 'Po 15:00 (wolniejszy)', priority: 'low' }
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all duration-200 ${
                                                    formData.timeSlot === option.value 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name="timeSlot"
                                                        value={option.value}
                                                        checked={formData.timeSlot === option.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <div className="text-2xl mb-2">{option.label}</div>
                                                    <div className="text-sm font-semibold text-gray-800 mb-1">{option.desc}</div>
                                                    <div className="text-xs text-gray-600">{option.subDesc}</div>
                                                    
                                                    {/* Simple priority indicators */}
                                                    {option.priority === 'high' && (
                                                        <div className="mt-2 text-xs text-green-600 font-medium">✨ Priorytet</div>
                                                    )}
                                                    {option.priority === 'low' && (
                                                        <div className="mt-2 text-xs text-orange-600">⏳ Wolniejszy</div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            💡 Wybierz preferowany przedział czasowy - ułatwi to planowanie wizyty
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dodatkowe uwagi o dostępności
                                        </label>
                                        <textarea
                                            name="additionalNotes"
                                            value={formData.additionalNotes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="np. Dzwoń po 18:00, nie jestem dostępny w środy, najlepiej SMS..."
                                        />
                                    </div>

                                    {/* Podsumowanie */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-3">📋 Podsumowanie zamówienia:</h3>
                                        <div className="space-y-4 text-sm">
                                            
                                            {/* Dane klienta - edytowalne */}
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="flex-1">
                                                    <strong>Klient:</strong>
                                                    {editMode.client ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                            <input
                                                                type="text"
                                                                value={formData.name}
                                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                                className="px-2 py-1 border rounded text-sm"
                                                                placeholder="Imię i nazwisko"
                                                            />
                                                            <input
                                                                type="tel"
                                                                value={formData.phone}
                                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                                className="px-2 py-1 border rounded text-sm"
                                                                placeholder="Telefon"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="ml-2">{formData.name} ({formData.phone})</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {editMode.client ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit('client')}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                        >
                                                            ✓
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEditMode('client')}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Adres - edytowalny */}
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="flex-1">
                                                    <strong>Adres:</strong>
                                                    {editMode.address ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                                            <input
                                                                type="text"
                                                                value={formData.street}
                                                                onChange={(e) => setFormData({...formData, street: e.target.value})}
                                                                className="px-2 py-1 border rounded text-sm"
                                                                placeholder="Ulica i numer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={formData.postalCode}
                                                                onChange={(e) => {
                                                                    const newFormData = {...formData, postalCode: e.target.value};
                                                                    if (getCityByPostalCode) {
                                                                        const city = getCityByPostalCode(e.target.value);
                                                                        if (city) newFormData.city = city;
                                                                    }
                                                                    setFormData(newFormData);
                                                                }}
                                                                className="px-2 py-1 border rounded text-sm"
                                                                placeholder="Kod pocztowy"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={formData.city}
                                                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                                                className="px-2 py-1 border rounded text-sm"
                                                                placeholder="Miasto"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="ml-2">{formData.street}, {formData.postalCode} {formData.city}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {editMode.address ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit('address')}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                        >
                                                            ✓
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEditMode('address')}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Serwis - multi-device */}
                                            <div className="p-3 bg-white rounded border">
                                                <div className="mb-3">
                                                    <strong>Serwis urządzeń ({formData.categories.length}):</strong>
                                                </div>
                                                {formData.categories.map((category, index) => (
                                                    <div key={category} className="mb-2 pl-4 border-l-2 border-blue-200">
                                                        <div className="flex items-center mb-1">
                                                            <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-0.5">
                                                                <img 
                                                                    src={`/icons/agd/${category.toLowerCase().replace('ó', 'o').replace('ą', 'a').replace(' agd', '').replace(' ', '-')}.svg`}
                                                                    alt={category}
                                                                    className="w-3 h-3 object-contain"
                                                                />
                                                            </div>
                                                            <strong>{category}</strong>
                                                            {(formData.brands[index] || formData.devices[index]) && ' - '}
                                                            {formData.brands[index] && `${formData.brands[index]} `}
                                                            {formData.devices[index]}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <strong>Problem:</strong> {formData.problems[index] || 'Nie opisano'}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="text-xs text-gray-500 mt-2">
                                                    💡 Aby zmienić urządzenia, wróć do kroku 1
                                                </div>
                                            </div>

                                            {/* Preferowane godziny - edytowalne */}
                                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                <div className="flex-1">
                                                    <strong>Preferowane godziny:</strong>
                                                    {editMode.timeSlot ? (
                                                        <select
                                                            value={formData.timeSlot}
                                                            onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                                                            className="ml-2 px-2 py-1 border rounded text-sm"
                                                        >
                                                            <option value="">Wybierz przedział</option>
                                                            <option value="Cały dzień">⏰ Cały dzień (8:00-20:00)</option>
                                                            <option value="8:00-10:00">🌅 8:00-10:00 (Wcześnie)</option>
                                                            <option value="10:00-12:00">🌤️ 10:00-12:00 (Rano)</option>
                                                            <option value="12:00-14:00">☀️ 12:00-14:00 (Południe)</option>
                                                            <option value="14:00-16:00">🌞 14:00-16:00 (Popołudnie)</option>
                                                            <option value="16:00-18:00">🌆 16:00-18:00 (Wieczór)</option>
                                                            <option value="18:00-20:00">🌃 18:00-20:00 (Późny wieczór)</option>
                                                            <option value="Weekend 8:00-12:00">🏠 Weekend 8:00-12:00</option>
                                                            <option value="Weekend 12:00-16:00">🏡 Weekend 12:00-16:00</option>
                                                            <option value="Weekend 16:00-20:00">🏘️ Weekend 16:00-20:00</option>
                                                            <option value="Wieczory po 15:00">🌙 Tylko wieczory (Po 15:00)</option>
                                                            <option value="Poranki przed 10:00">🌄 Tylko poranki (Przed 10:00)</option>
                                                        </select>
                                                    ) : (
                                                        <span className="ml-2">{formData.timeSlot || 'Nie wybrano'}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {editMode.timeSlot ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit('timeSlot')}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                        >
                                                            ✓
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEditMode('timeSlot')}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Uwagi - edytowalne */}
                                            <div className="flex items-start justify-between p-3 bg-white rounded border">
                                                <div className="flex-1">
                                                    <strong>Uwagi:</strong>
                                                    {editMode.notes ? (
                                                        <textarea
                                                            value={formData.additionalNotes}
                                                            onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                                                            className="w-full mt-2 px-2 py-1 border rounded text-sm"
                                                            rows="2"
                                                            placeholder="Dodatkowe uwagi o dostępności..."
                                                        />
                                                    ) : (
                                                        <span className="ml-2">{formData.additionalNotes || 'Brak uwag'}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {editMode.notes ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit('notes')}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                        >
                                                            ✓
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleEditMode('notes')}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Komunikaty - poza krokami, zawsze widoczne */}
                        {message && (
                            <div className="p-6 border-t">
                                <div className={`p-4 rounded-lg text-sm ${message.includes('✅')
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    <div className="whitespace-pre-line">{message}</div>
                                    {message.includes('✅') && message.includes('🗺️') && (
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => router.push('/mapa')}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                            >
                                                🗺️ Zobacz na mapie
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiArrowLeft className="w-4 h-4 mr-1" />
                                Wstecz
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep)}
                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Dalej
                                    <FiArrowRight className="w-4 h-4 ml-1" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isStepValid(currentStep)}
                                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Wysyłanie...' : (
                                        <>
                                            <FiCheck className="w-4 h-4 mr-1" />
                                            Wyślij zamówienie
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Help section */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Potrzebujesz pomocy? Zadzwoń: <a href="tel:+48123456789" className="text-blue-600 hover:underline font-medium">+48 123 456 789</a>
                    </p>
                </div>
            </div>
        </div>
    );
}