// pages/rezerwacja.js - Kreator "Zamów fachowca"

import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMapPin, FiTool, FiClock, FiCheck, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

export default function Rezerwacja() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        city: '',
        street: '',
        fullAddress: '',
        category: 'Serwis AGD',
        device: '',
        problem: '',
        availability: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const totalSteps = 4;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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

        if (!formData.fullAddress && (!formData.city || !formData.street)) {
            setMessage('❌ Podaj pełny adres lub wypełnij pola miasto i ulica');
            setIsSubmitting(false);
            return;
        }

        const submitData = {
            ...formData,
            address: formData.fullAddress || `${formData.street}, ${formData.city}`
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
            case 1: return <FiUser className="w-5 h-5" />;
            case 2: return <FiMapPin className="w-5 h-5" />;
            case 3: return <FiTool className="w-5 h-5" />;
            case 4: return <FiClock className="w-5 h-5" />;
            default: return null;
        }
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1: return formData.name && formData.phone && formData.email;
            case 2: return formData.fullAddress || (formData.city && formData.street);
            case 3: return formData.category && formData.device && formData.problem;
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
                        🛠️ Kreator zamówienia fachowca
                    </h1>
                    <p className="text-gray-600">
                        Szybko i prosto zamów profesjonalny serwis
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
                        {/* Step 1: Dane osobowe */}
                        {currentStep === 1 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiUser className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Dane kontaktowe</h2>
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
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="jan@example.com"
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
                                            Pełny adres *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullAddress"
                                            value={formData.fullAddress || ''}
                                            onChange={handleChange}
                                            placeholder="ul. Krakowska 123/45, 00-001 Warszawa"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            💡 Podaj dokładny adres z numerem budynku/mieszkania i kodem pocztowym
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">lub wypełnij osobno</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Miasto
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Warszawa"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ulica i numer
                                            </label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Główna 123/45"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Serwis */}
                        {currentStep === 3 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiTool className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Szczegóły serwisu</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kategoria serwisu *
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'Serwis AGD', label: '🏠 AGD', desc: 'Sprzęt domowy' },
                                                { value: 'Pralka', label: '🌀 Pralka', desc: 'Automatyczne' },
                                                { value: 'Lodówka', label: '❄️ Lodówka', desc: 'Chłodzenie' },
                                                { value: 'Zmywarka', label: '🍽️ Zmywarka', desc: 'Do naczyń' },
                                                { value: 'Naprawa komputera', label: '💻 Komputer', desc: 'PC/Mac' },
                                                { value: 'Naprawa telefonu', label: '📱 Telefon', desc: 'Smartfon' },
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-colors ${
                                                    formData.category === option.value 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}>
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        value={option.value}
                                                        checked={formData.category === option.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <div className="text-2xl mb-1">{option.label.split(' ')[0]}</div>
                                                    <div className="text-sm font-medium">{option.label.split(' ').slice(1).join(' ')}</div>
                                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Urządzenie/Model *
                                        </label>
                                        <input
                                            type="text"
                                            name="device"
                                            value={formData.device}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="np. Pralka Samsung WW80, Lodówka Bosch, HP Pavilion"
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
                                            placeholder="Opisz dokładnie co się dzieje z urządzeniem, jakie są objawy awarii..."
                                        />
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
                                            <div><strong>Adres:</strong> {formData.fullAddress || `${formData.street}, ${formData.city}`}</div>
                                            <div><strong>Serwis:</strong> {formData.category} - {formData.device}</div>
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