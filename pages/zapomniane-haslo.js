// pages/zapomniane-haslo.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMail, FiArrowLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';
import dataManager from '../utils/dataManager';

export default function ZapomnianeHaslo() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [message, setMessage] = useState('');

    const validateForm = () => {
        const newErrors = {};

        // Walidacja email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email jest wymagany';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format email';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Usuń błąd po rozpoczęciu wpisywania
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Użycie dataManager do żądania resetowania hasła
            const result = await dataManager.requestPasswordReset(formData.email);

            if (!result.success) {
                if (result.error === 'User not found') {
                    setErrors({ email: 'Nie znaleziono konta z tym adresem email' });
                } else {
                    setMessage('Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie.');
                }
                return;
            }

            // Logowanie zdarzenia bezpieczeństwa
            dataManager.logSecurityEvent('password_reset_requested', {
                email: formData.email,
                userAgent: navigator.userAgent
            });

            setEmailSent(true);
            setMessage(`Instrukcje resetowania hasła zostały wysłane na adres ${formData.email}`);

        } catch (error) {
            console.error('Błąd podczas resetowania hasła:', error);
            setMessage('Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email wysłany!</h1>
                        <p className="text-gray-600">
                            Sprawdź swoją skrzynkę pocztową
                        </p>
                    </div>

                    {/* Message */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-700 text-sm">
                            {message}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-900 mb-2">Co dalej?</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Sprawdź swoją skrzynkę pocztową</li>
                            <li>• Kliknij w link w otrzymanym emailu</li>
                            <li>• Ustaw nowe hasło</li>
                            <li>• Zaloguj się używając nowego hasła</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setEmailSent(false);
                                setFormData({ email: '' });
                                setMessage('');
                            }}
                            className="w-full py-3 px-4 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            Wyślij ponownie
                        </button>

                        <Link
                            href="/logowanie"
                            className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center rounded-lg font-medium transition-colors"
                        >
                            Powrót do logowania
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/logowanie"
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Powrót do logowania
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Zapomniałeś hasła?</h1>
                    <p className="text-gray-600">
                        Podaj swój adres email, a wyślemy Ci link do resetowania hasła
                    </p>
                </div>

                {/* Error/Success Message */}
                {message && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <p className="text-red-700 text-sm">{message}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adres email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Wprowadź swój email"
                                autoComplete="email"
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300'
                            } text-white`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Wysyłanie...
                            </div>
                        ) : (
                            'Wyślij link resetowania'
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Pamiętasz hasło?{' '}
                        <Link href="/logowanie" className="text-blue-600 hover:text-blue-800 font-medium">
                            Zaloguj się
                        </Link>
                    </p>
                </div>

                {/* Support Info */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Potrzebujesz pomocy?</h4>
                    <p className="text-xs text-gray-600">
                        Jeśli nie otrzymasz emaila w ciągu kilku minut, sprawdź folder spam lub skontaktuj się z obsługą techniczną.
                    </p>
                </div>
            </div>
        </div>
    );
}
