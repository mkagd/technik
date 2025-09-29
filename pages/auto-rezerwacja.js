// pages/auto-rezerwacja.js - Inteligentna auto-rezerwacja z AI

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FiTool, 
  FiMapPin, 
  FiUser, 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft, 
  FiCpu, 
  FiClock, 
  FiDollarSign, 
  FiAlertTriangle, 
  FiInfo, 
  FiRefreshCw 
} from 'react-icons/fi';

export default function AutoRezerwacja() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    
    // Sprawdź czy użytkownik jest zalogowany
    useEffect(() => {
        const checkUserLogin = () => {
            try {
                const savedUser = localStorage.getItem('userInfo');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    setUserInfo(user);
                    
                    // Wypełnij dane z konta
                    if (user.name) {
                        setFormData(prev => ({
                            ...prev,
                            name: user.name,
                            email: user.email || '',
                            phone: user.phone || ''
                        }));
                    }
                }
            } catch (error) {
                console.error('Błąd odczytu danych użytkownika:', error);
            }
        };
        
        checkUserLogin();
    }, []);
    
    const [formData, setFormData] = useState({
        // Krok 1: Problem
        device: '',
        brand: '',
        model: '',
        problem: '',
        
        // Krok 2: Lokalizacja
        address: '',
        city: '',
        postalCode: '',
        
        // Krok 3: Dane kontaktowe
        name: '',
        phone: '',
        email: '',
        
        // Krok 4: Termin
        preferredTime: '',
        urgency: 'normal',
        additionalNotes: ''
    });

    const totalSteps = 4;

    // LISTA URZĄDZEŃ AGD
    const devices = [
        { value: 'pralka', label: 'Pralka', icon: '🔧', desc: 'Automatyczna pralka' },
        { value: 'zmywarka', label: 'Zmywarka', icon: '🍽️', desc: 'Do naczyń' },
        { value: 'lodówka', label: 'Lodówka', icon: '❄️', desc: 'Chłodziarka' },
        { value: 'piekarnik', label: 'Piekarnik', icon: '🔥', desc: 'Elektryczny/gazowy' },
        { value: 'kuchenka', label: 'Kuchenka', icon: '🔥', desc: 'Płyta grzewcza' },
        { value: 'mikrofalówka', label: 'Mikrofalówka', icon: '⚡', desc: 'Do podgrzewania' },
        { value: 'suszarka', label: 'Suszarka', icon: '🌪️', desc: 'Do ubrań' },
        { value: 'okap', label: 'Okap', icon: '💨', desc: 'Wyciąg kuchenny' },
        { value: 'ekspres', label: 'Ekspres', icon: '☕', desc: 'Do kawy' }
    ];

    // POPULARNE MARKI
    const brands = [
        'Samsung', 'LG', 'Bosch', 'Siemens', 'Whirlpool', 'Electrolux', 
        'Beko', 'Candy', 'Indesit', 'Amica', 'Gorenje', 'Miele', 'AEG'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDeviceSelect = (deviceValue) => {
        setFormData(prev => ({
            ...prev,
            device: deviceValue
        }));
    };

    // INTELIGENTNA ANALIZA AI
    const analyzeWithAI = async () => {
        if (!formData.device || !formData.problem) {
            setMessage('❌ Wypełnij urządzenie i opis problemu przed analizą AI');
            return;
        }

        setIsAnalyzing(true);
        setMessage('🤖 AI analizuje problem...');

        try {
            const response = await fetch('/api/ai-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    device: formData.device,
                    problem: formData.problem,
                    brand: formData.brand,
                    model: formData.model,
                    userInfo: userInfo
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setAiSuggestions(result.suggestions);
                setMessage('✅ Analiza AI zakończona pomyślnie!');
                
                // Auto-ustaw priorytet na podstawie AI
                if (result.suggestions.priority) {
                    setFormData(prev => ({
                        ...prev,
                        urgency: result.suggestions.priority
                    }));
                }
            } else {
                setMessage('❌ Błąd analizy AI: ' + (result.error || 'Nieznany błąd'));
                setAiSuggestions(null);
            }
        } catch (error) {
            console.error('Błąd AI:', error);
            setMessage('❌ Błąd połączenia z AI. Spróbuj ponownie.');
            setAiSuggestions(null);
        }

        setIsAnalyzing(false);
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            setMessage('');
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setMessage('');
        }
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1: return formData.device && formData.problem.length >= 10;
            case 2: return formData.address && formData.city;
            case 3: return formData.name && formData.phone;
            case 4: return formData.preferredTime;
            default: return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('🚀 Tworzenie auto-rezerwacji...');

        try {
            const response = await fetch('/api/auto-service-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    aiSuggestions: aiSuggestions,
                    userInfo: userInfo,
                    accountInfo: userInfo?.isLoggedIn ? userInfo : null
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage(`🎉 **AUTO-REZERWACJA POTWIERDZONA!**\n\n✅ **ID Zamówienia:** ${result.orderId}\n\n${result.confirmation}`);
                
                // Przewiń na górę żeby pokazać komunikat
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Opcjonalnie przekieruj po kilku sekundach
                setTimeout(() => {
                    if (confirm('Czy chcesz zobaczyć swoje zamówienie na mapie?')) {
                        router.push('/mapa');
                    }
                }, 3000);
            } else {
                setMessage('❌ Błąd: ' + (result.error || 'Nieznany błąd'));
            }
        } catch (error) {
            console.error('Błąd submitu:', error);
            setMessage('❌ Błąd połączenia. Spróbuj ponownie.');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        🤖 Inteligentna Auto-Rezerwacja
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Serwis AGD wspomagany sztuczną inteligencją
                    </p>
                    {userInfo?.isLoggedIn && (
                        <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                            👤 Zalogowany jako: {userInfo.name}
                        </div>
                    )}
                </div>

                {/* Progress Bar z ikonami */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[
                            { num: 1, icon: FiTool, label: 'Problem' },
                            { num: 2, icon: FiMapPin, label: 'Lokalizacja' },
                            { num: 3, icon: FiUser, label: 'Kontakt' },
                            { num: 4, icon: FiCheck, label: 'Potwierdzenie' }
                        ].map((step, index) => (
                            <div key={step.num} className="flex items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                    step.num <= currentStep 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'bg-gray-200 text-gray-400'
                                } ${step.num < currentStep ? 'bg-green-500' : ''}`}>
                                    {step.num < currentStep ? (
                                        <FiCheck className="w-6 h-6" />
                                    ) : (
                                        <step.icon className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="ml-2 hidden sm:block">
                                    <div className="text-sm font-medium text-gray-700">{step.label}</div>
                                </div>
                                {index < 3 && (
                                    <div className={`w-16 h-1 mx-4 transition-all ${
                                        step.num < currentStep ? 'bg-green-500' : 'bg-gray-200'
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
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* KROK 1: Problem i AI Analiza */}
                        {currentStep === 1 && (
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <FiTool className="w-8 h-8 text-blue-600 mr-4" />
                                    <h2 className="text-2xl font-bold text-gray-900">Opisz problem</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Wybór urządzenia */}
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-4">
                                            Jakie urządzenie wymaga naprawy? *
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {devices.map((device) => (
                                                <button
                                                    key={device.value}
                                                    type="button"
                                                    onClick={() => handleDeviceSelect(device.value)}
                                                    className={`p-4 rounded-xl border-2 text-center transition-all duration-300 hover:scale-105 ${
                                                        formData.device === device.value
                                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="text-3xl mb-2">{device.icon}</div>
                                                    <div className="font-semibold text-gray-800">{device.label}</div>
                                                    <div className="text-xs text-gray-500">{device.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Marka i model */}
                                    {formData.device && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Marka (opcjonalnie)
                                                </label>
                                                <select
                                                    name="brand"
                                                    value={formData.brand}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Wybierz markę...</option>
                                                    {brands.map(brand => (
                                                        <option key={brand} value={brand}>{brand}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model (opcjonalnie)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="model"
                                                    value={formData.model}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="np. WW80T4020EE"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Opis problemu */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Opisz problem szczegółowo *
                                        </label>
                                        <textarea
                                            name="problem"
                                            value={formData.problem}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Np. Pralka nie włącza się, nie świeci się żadna lampka, sprawdziłem bezpieczniki..."
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            💡 Im dokładniej opiszesz problem, tym lepszą analizę da AI
                                        </p>
                                    </div>

                                    {/* Przycisk analizy AI */}
                                    {formData.device && formData.problem.length >= 10 && (
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <FiCpu className="w-6 h-6 text-purple-600 mr-3" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Analiza AI
                                                    </h3>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={analyzeWithAI}
                                                    disabled={isAnalyzing}
                                                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                            Analizuję...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiCpu className="w-4 h-4 mr-2" />
                                                            Analizuj problem
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                AI przeanalizuje problem i wskaże prawdopodobne przyczyny oraz szacowany koszt naprawy
                                            </p>
                                        </div>
                                    )}

                                    {/* Wyniki analizy AI */}
                                    {aiSuggestions && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                            <div className="flex items-center mb-4">
                                                <FiCheck className="w-6 h-6 text-green-600 mr-3" />
                                                <h3 className="text-lg font-semibold text-green-900">
                                                    Diagnoza AI ({aiSuggestions.confidence}% pewności)
                                                </h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-white p-4 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <FiAlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                                                        <h4 className="font-semibold">Prawdopodobna przyczyna</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-700">
                                                        {aiSuggestions.diagnosis.primaryCause}
                                                    </p>
                                                    <p className="text-xs text-orange-600 mt-1">
                                                        {aiSuggestions.diagnosis.probability}% prawdopodobieństwa
                                                    </p>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <FiDollarSign className="w-5 h-5 text-green-500 mr-2" />
                                                        <h4 className="font-semibold">Szacowany koszt</h4>
                                                    </div>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {aiSuggestions.estimatedCost.display}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        + dojazd {formData.city?.toLowerCase().includes('rzeszów') ? 'GRATIS' : '30-50zł'}
                                                    </p>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <FiClock className="w-5 h-5 text-blue-500 mr-2" />
                                                        <h4 className="font-semibold">Czas naprawy</h4>
                                                    </div>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {aiSuggestions.timeEstimate.display}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Szacowany czas pracy
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Wskazówki AI */}
                                            {aiSuggestions.tips && aiSuggestions.tips.length > 0 && (
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <FiInfo className="w-5 h-5 text-blue-600 mr-2" />
                                                        <h4 className="font-semibold text-blue-900">Wskazówki AI</h4>
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {aiSuggestions.tips.map((tip, index) => (
                                                            <li key={index} className="text-sm text-blue-800">
                                                                • {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KROK 2: Lokalizacja */}
                        {currentStep === 2 && (
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <FiMapPin className="w-8 h-8 text-blue-600 mr-4" />
                                    <h2 className="text-2xl font-bold text-gray-900">Gdzie mamy przyjechać?</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Kod pocztowy
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="39-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Miasto *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Rzeszów"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ulica i numer *
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="ul. Słowackiego 15/3"
                                        />
                                    </div>

                                    {/* Informacja o kosztach dojazdu */}
                                    {formData.city && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-blue-900 mb-2">💰 Koszt dojazdu</h4>
                                            <p className="text-sm text-blue-800">
                                                {formData.city.toLowerCase().includes('rzeszów') ? (
                                                    '🎁 Rzeszów: GRATIS!'
                                                ) : formData.city.toLowerCase().includes('jasło') ? (
                                                    '🚗 Jasło: 30zł'
                                                ) : formData.city.toLowerCase().includes('krosno') ? (
                                                    '🚗 Krosno: 40zł'
                                                ) : (
                                                    '🚗 Standardowy: 30-50zł'
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KROK 3: Dane kontaktowe */}
                        {currentStep === 3 && (
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <FiUser className="w-8 h-8 text-blue-600 mr-4" />
                                    <h2 className="text-2xl font-bold text-gray-900">Twoje dane kontaktowe</h2>
                                </div>

                                {userInfo?.isLoggedIn && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center">
                                            <FiCheck className="w-5 h-5 text-green-600 mr-2" />
                                            <span className="font-medium text-green-900">
                                                Dane wypełnione automatycznie z Twojego konta
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Imię i nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Jan Kowalski"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefon *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+48 123 456 789"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email (opcjonalny)
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="jan@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KROK 4: Termin i podsumowanie */}
                        {currentStep === 4 && (
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <FiCheck className="w-8 h-8 text-blue-600 mr-4" />
                                    <h2 className="text-2xl font-bold text-gray-900">Podsumowanie i termin</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Preferowany termin */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Kiedy Ci pasuje wizyta? *
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'Dziś po południu', label: '🚨 Dziś (pilne)', priority: 'critical' },
                                                { value: 'Jutro rano', label: '⚡ Jutro rano', priority: 'high' },
                                                { value: 'Jutro po południu', label: '⚡ Jutro po południu', priority: 'high' },
                                                { value: 'Pojutrze', label: '📅 Pojutrze', priority: 'normal' },
                                                { value: 'W tym tygodniu', label: '📅 Ten tydzień', priority: 'normal' },
                                                { value: 'W przyszłym tygodniu', label: '📅 Za tydzień', priority: 'low' }
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                                                    formData.preferredTime === option.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name="preferredTime"
                                                        value={option.value}
                                                        checked={formData.preferredTime === option.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <div className="text-sm font-medium">{option.label}</div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dodatkowe uwagi */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dodatkowe uwagi
                                        </label>
                                        <textarea
                                            name="additionalNotes"
                                            value={formData.additionalNotes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="np. Dzwoń po 18:00, kod do bramy: 1234..."
                                        />
                                    </div>

                                    {/* Podsumowanie zamówienia */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Podsumowanie zamówienia</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Urządzenie:</span>
                                                <span>{formData.device} {formData.brand} {formData.model}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Problem:</span>
                                                <span className="text-right max-w-xs">{formData.problem.substring(0, 50)}...</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Adres:</span>
                                                <span>{formData.address}, {formData.city}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Kontakt:</span>
                                                <span>{formData.name} ({formData.phone})</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Termin:</span>
                                                <span>{formData.preferredTime}</span>
                                            </div>
                                            {aiSuggestions && (
                                                <div className="border-t pt-3 mt-3">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Szacowany koszt:</span>
                                                        <span className="font-bold text-green-600">{aiSuggestions.estimatedCost.display}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Dojazd:</span>
                                                        <span>{formData.city?.toLowerCase().includes('rzeszów') ? 'GRATIS 🎁' : '30-50zł'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Diagnoza:</span>
                                                        <span className="text-green-600">GRATIS ✅</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Komunikaty */}
                        {message && (
                            <div className="p-6 border-t">
                                <div className={`p-4 rounded-lg text-sm ${
                                    message.includes('✅') || message.includes('🎉')
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : message.includes('🤖')
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                    <div className="whitespace-pre-line">{message}</div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4 mr-2" />
                                Wstecz
                            </button>

                            <div className="text-sm text-gray-500">
                                Krok {currentStep} z {totalSteps}
                            </div>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep)}
                                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    Dalej
                                    <FiArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isStepValid(currentStep)}
                                    className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                            Tworzenie...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5 mr-2" />
                                            Utwórz Auto-Rezerwację
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Info section */}
                <div className="mt-8 text-center">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 Jak działa Auto-Rezerwacja?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex flex-col items-center">
                                <FiTool className="w-8 h-8 text-blue-600 mb-2" />
                                <p><strong>1. Opisz problem</strong><br/>AI przeanalizuje usterkę</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <FiCpu className="w-8 h-8 text-purple-600 mb-2" />
                                <p><strong>2. Diagnoza AI</strong><br/>Przyczyny i koszty</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <FiUser className="w-8 h-8 text-green-600 mb-2" />
                                <p><strong>3. Twoje dane</strong><br/>Kontakt i lokalizacja</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <FiCheck className="w-8 h-8 text-orange-600 mb-2" />
                                <p><strong>4. Potwierdzenie</strong><br/>Automatyczna rezerwacja</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                        📞 Pilne naprawy: <a href="tel:+48123456789" className="text-blue-600 hover:underline font-medium">+48 123 456 789</a>
                    </p>
                </div>
            </div>
        </div>
    );
}