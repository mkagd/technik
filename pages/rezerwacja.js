// pages/rezerwacja.js - Kreator "Zamów fachowca" AGD

import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMapPin, FiTool, FiClock, FiCheck, FiArrowRight, FiArrowLeft, FiChevronDown } from 'react-icons/fi';

export default function Rezerwacja() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        postalCode: '',
        city: '',
        street: '',
        fullAddress: '',
        category: 'Pralka',
        device: '',
        brand: '',
        problem: '',
        availability: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

    // Lista popularnych marek AGD
    const brands = [
        'Amica', 'Aeg', 'Beko', 'Bosch', 'Candy', 'Electrolux', 'Gorenje', 
        'Haier', 'Hotpoint', 'Indesit', 'LG', 'Miele', 'Panasonic', 'Samsung', 
        'Sharp', 'Siemens', 'Whirlpool', 'Zanussi'
    ];

    // Mapa kodów pocztowych na miasta
    const postalCodeMap = {
        '39-200': 'Dębica',
        '28-133': 'Pacanów', 
        '39-300': 'Mielec',
        '30-001': 'Kraków',
        '00-001': 'Warszawa',
        '80-001': 'Gdańsk',
        '50-001': 'Wrocław',
        '60-001': 'Poznań',
        '90-001': 'Łódź',
        '31-001': 'Kraków',
        '20-001': 'Lublin'
    };

    const totalSteps = 4;

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Obsługa kodu pocztowego - automatyczne uzupełnianie miasta
        if (name === 'postalCode') {
            const city = postalCodeMap[value] || '';
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

    const handleBrandSelect = (brand) => {
        setFormData({
            ...formData,
            brand: brand
        });
        setShowBrandSuggestions(false);
    };

    const getFilteredBrands = () => {
        if (!formData.brand) return brands.slice(0, 8); // Pokaż pierwsze 8 gdy puste
        return brands.filter(brand => 
            brand.toLowerCase().includes(formData.brand.toLowerCase())
        ).slice(0, 6); // Maksymalnie 6 podpowiedzi
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        if (!formData.postalCode || !formData.city || !formData.street) {
            setMessage('❌ Uzupełnij wszystkie pola adresu: kod pocztowy, miasto i ulicę');
            setIsSubmitting(false);
            return;
        }

        const submitData = {
            ...formData,
            address: `${formData.street}, ${formData.postalCode} ${formData.city}`
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
                setMessage('✅ Zgłoszenie zostało wysłane! Nasz zespół skontaktuje się z Tobą wkrótce.');
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
            case 1: return formData.category && formData.problem; // Co naprawiamy - tylko kategoria i problem
            case 2: return formData.postalCode && formData.city && formData.street; // Gdzie - kod pocztowy, miasto, ulica
            case 3: return formData.name && formData.phone; // Dane kontaktowe (email opcjonalny)
            case 4: return true; // availability is optional
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

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Typ urządzenia AGD *
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'Pralka', icon: '🧺', label: 'Pralka', desc: 'Automatyczna', color: 'from-blue-400 to-blue-600' },
                                                { value: 'Zmywarka', icon: '🫧', label: 'Zmywarka', desc: 'Do naczyń', color: 'from-cyan-400 to-cyan-600' },
                                                { value: 'Lodówka', icon: '🧊', label: 'Lodówka', desc: 'Chłodzenie', color: 'from-indigo-400 to-indigo-600' },
                                                { value: 'Piekarnik', icon: '🍞', label: 'Piekarnik', desc: 'Do pieczenia', color: 'from-orange-400 to-orange-600' },
                                                { value: 'Suszarka', icon: '💨', label: 'Suszarka', desc: 'Do ubrań', color: 'from-purple-400 to-purple-600' },
                                                { value: 'Kuchenka', icon: '🔥', label: 'Kuchenka', desc: 'Gazowa/elektr.', color: 'from-red-400 to-red-600' },
                                                { value: 'Mikrofalówka', icon: '⚡', label: 'Mikrofalówka', desc: 'Do podgrzewania', color: 'from-yellow-400 to-yellow-600' },
                                                { value: 'Okap', icon: '🌪️', label: 'Okap', desc: 'Wyciąg kuchenny', color: 'from-gray-400 to-gray-600' },
                                                { value: 'Inne AGD', icon: '🏠', label: 'Inne AGD', desc: 'Pozostałe', color: 'from-green-400 to-green-600' },
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105 ${
                                                    formData.category === option.value 
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        value={option.value}
                                                        checked={formData.category === option.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white text-xl font-bold shadow-md`}>
                                                        {option.icon}
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-800 mb-1">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Marka (opcjonalnie)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                onFocus={() => setShowBrandSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="np. Samsung, Bosch, LG..."
                                            />
                                            {showBrandSuggestions && (
                                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                    {getFilteredBrands().map((brand) => (
                                                        <button
                                                            key={brand}
                                                            type="button"
                                                            onClick={() => handleBrandSelect(brand)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
                                            Model urządzenia (opcjonalnie)
                                        </label>
                                        <input
                                            type="text"
                                            name="device"
                                            value={formData.device}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="np. WW80T4020EE, KGN39VLDA"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Opis problemu *
                                        </label>
                                        <textarea
                                            name="problem"
                                            value={formData.problem}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Opisz dokładnie co się dzieje z urządzeniem - np. nie włącza się, dziwne dźwięki, nie grzeje, wyświetla kod błędu..."
                                        />
                                    </div>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Preferowany czas wizyty
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                            {[
                                                'Dzisiaj po 16:00',
                                                'Jutro rano',
                                                'Jutro po południu',
                                                'W weekend',
                                                'Pon-Pt 9-17',
                                                'Wieczorami',
                                                'Do uzgodnienia',
                                                'Jak najszybciej'
                                            ].map((time) => (
                                                <label key={time} className={`cursor-pointer border rounded-lg p-2 text-center text-sm transition-colors ${
                                                    formData.availability === time 
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name="availability"
                                                        value={time}
                                                        checked={formData.availability === time}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    {time}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dodatkowe uwagi
                                        </label>
                                        <textarea
                                            name="availability"
                                            value={formData.availability}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="np. Dzwoń po 18:00, nie jestem dostępny w środy, najlepiej SMS..."
                                        />
                                    </div>

                                    {/* Podsumowanie */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-3">📋 Podsumowanie zamówienia:</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Klient:</strong> {formData.name} ({formData.phone})</div>
                                            <div><strong>Adres:</strong> {formData.street}, {formData.postalCode} {formData.city}</div>
                                            <div><strong>Serwis:</strong> {formData.category} 
                                                {(formData.brand || formData.device) && ' - '}
                                                {formData.brand && `${formData.brand} `}
                                                {formData.device}
                                            </div>
                                            <div><strong>Problem:</strong> {formData.problem}</div>
                                            {formData.availability && <div><strong>Dostępność:</strong> {formData.availability}</div>}
                                        </div>
                                    </div>

                                    {message && (
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