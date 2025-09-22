// pages/rezerwacja.js - Formularz "Zamów fachowca"

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Rezerwacja() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        city: '',
        street: '',
        fullAddress: '',
        category: 'Serwis AGD', // Default to AGD service
        device: '',
        problem: '',
        availability: '' // Changed from 'date' to 'availability'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        // Walidacja adresu - wymagamy albo pełnego adresu, albo miasta i ulicy
        if (!formData.fullAddress && (!formData.city || !formData.street)) {
            setMessage('❌ Podaj pełny adres lub wypełnij pola miasto i ulica');
            setIsSubmitting(false);
            return;
        }

        // Przygotuj dane do wysłania
        const submitData = {
            ...formData,
            // Jeśli nie ma pełnego adresu, stwórz go z miasta i ulicy
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
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    city: '',
                    street: '',
                    fullAddress: '',
                    category: 'Serwis AGD', // Keep default after form reset
                    device: '',
                    problem: '',
                    availability: '' // Changed from 'date' to 'availability'
                });

                // Pokazuj przycisk do przejścia na mapę
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white text-center">
                        🏠 Zamów serwis AGD
                    </h1>
                    <p className="text-blue-100 text-center mt-2">
                        Pralka, lodówka, zmywarka - naprawimy wszystko!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="jan@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pełny adres *
                            </label>
                            <input
                                type="text"
                                name="fullAddress"
                                value={formData.fullAddress || ''}
                                onChange={handleChange}
                                placeholder="np. ul. Krakowska 123/45, 00-001 Warszawa"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Podaj dokładny adres z numerem budynku/mieszkania i kodem pocztowym
                            </p>
                        </div>

                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                            <p className="font-medium mb-1">🗺️ Lub wypełnij osobno:</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Miasto
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Główna 123/45"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategoria serwisu *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Serwis AGD">🏠 Serwis AGD (sprzęt domowy)</option>
                            <option value="Pralka">🌀 Pralka</option>
                            <option value="Lodówka">❄️ Lodówka/Zamrażarka</option>
                            <option value="Zmywarka">🍽️ Zmywarka</option>
                            <option value="Piekarnik">🔥 Piekarnik/Kuchenka</option>
                            <option value="Mikrofala">📱 Kuchenka mikrofalowa</option>
                            <option value="Odkurzacz">🌪️ Odkurzacz</option>
                            <option value="Klimatyzacja">❄️ Klimatyzacja</option>
                            <option value="Boiler">🚿 Bojler/Podgrzewacz wody</option>
                            <option value="Małe AGD">⚡ Małe AGD (żelazka, tostery, itp.)</option>
                            <option value="Naprawa komputera">💻 Naprawa komputera</option>
                            <option value="Naprawa laptopa">🖥️ Naprawa laptopa</option>
                            <option value="Naprawa telefonu">📱 Naprawa telefonu</option>
                            <option value="Instalacja systemu">⚙️ Instalacja systemu</option>
                            <option value="Usuwanie wirusów">🦠 Usuwanie wirusów</option>
                            <option value="Przeniesienie danych">💾 Przeniesienie danych</option>
                            <option value="Naprawa drukarki">🖨️ Naprawa drukarki</option>
                            <option value="Inne">🔧 Inne</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Urządzenie/Sprzęt *
                        </label>
                        <input
                            type="text"
                            name="device"
                            value={formData.device}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="np. Pralka Samsung WW80, Lodówka Bosch, HP Pavilion"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opis problemu/usterki *
                        </label>
                        <textarea
                            name="problem"
                            value={formData.problem}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Opisz dokładnie co się dzieje z urządzeniem, jakie są objawy awarii..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kiedy jesteś dostępny? 📅
                        </label>
                        <textarea
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="np. Jutro po 16:00, w weekend, pon-pt 9-17, wieczorami po 18:00..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Napisz kiedy będziesz w domu lub kiedy Ci pasuje wizyta
                        </p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md text-sm ${message.includes('✅')
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            <div className="whitespace-pre-line">{message}</div>
                            {message.includes('✅') && message.includes('🗺️') && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => router.push('/mapa')}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        🗺️ Zobacz na mapie
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Wysyłanie...' : '🚀 Wyślij zgłoszenie'}
                    </button>
                </form>

                <div className="bg-gray-50 px-6 py-4 text-center">
                    <p className="text-sm text-gray-600">
                        📍 Po wysłaniu zobaczysz swoje zgłoszenie na{' '}
                        <a href="/mapa" className="text-blue-600 hover:underline">
                            mapie klientów
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}