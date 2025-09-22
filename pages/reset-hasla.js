// pages/reset-hasla.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import dataManager from '../utils/dataManager';

export default function ResetHasla() {
    const router = useRouter();
    const { token } = router.query;

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(null);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Sprawdzenie ważności tokenu przy załadowaniu strony
    useEffect(() => {
        if (token) {
            validateToken(token);
        }
    }, [token]);

    const validateToken = async (resetToken) => {
        try {
            const result = await dataManager.validateResetToken(resetToken);

            if (!result.valid) {
                setTokenValid(false);
                return;
            }

            setTokenValid(true);
            setUserEmail(result.email);
        } catch (error) {
            console.error('Błąd podczas walidacji tokenu:', error);
            setTokenValid(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Walidacja hasła
        if (!formData.password) {
            newErrors.password = 'Hasło jest wymagane';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Hasło musi zawierać małe i wielkie litery oraz cyfrę';
        }

        // Walidacja potwierdzenia hasła
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Hasła nie są identyczne';
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

        try {
            // Użycie dataManager do resetowania hasła
            const result = await dataManager.resetPassword(token, formData.password);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Logowanie zdarzenia bezpieczeństwa
            dataManager.logSecurityEvent('password_reset_completed', {
                email: userEmail,
                userAgent: navigator.userAgent
            });

            // Symulacja opóźnienia
            await new Promise(resolve => setTimeout(resolve, 1500));

            setResetSuccess(true);

        } catch (error) {
            console.error('Błąd podczas resetowania hasła:', error);
            setErrors({ submit: 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.' });
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength++;
        else feedback.push('Co najmniej 8 znaków');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Mała litera');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Wielka litera');

        if (/\d/.test(password)) strength++;
        else feedback.push('Cyfra');

        if (/[^a-zA-Z\d]/.test(password)) strength++;
        else feedback.push('Znak specjalny');

        return { strength, feedback };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    // Token nie został jeszcze sprawdzony
    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Sprawdzanie linku resetowania...</p>
                </div>
            </div>
        );
    }

    // Token nieprawidłowy lub wygasł
    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiX className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link nieprawidłowy</h1>
                        <p className="text-gray-600">
                            Link resetowania hasła jest nieprawidłowy lub wygasł
                        </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700 text-sm">
                            Ten link resetowania hasła jest nieprawidłowy, został już użyty lub wygasł.
                            Spróbuj ponownie zresetować hasło.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/zapomniane-haslo"
                            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
                        >
                            Zresetuj hasło ponownie
                        </Link>

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

    // Sukces resetowania
    if (resetSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hasło zostało zmienione!</h1>
                        <p className="text-gray-600">
                            Możesz teraz zalogować się używając nowego hasła
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-700 text-sm">
                            Twoje hasło zostało pomyślnie zmienione. Ze względów bezpieczeństwa zostaniesz
                            przekierowany do strony logowania.
                        </p>
                    </div>

                    <Link
                        href="/logowanie"
                        className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
                    >
                        Przejdź do logowania
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustaw nowe hasło</h1>
                    <p className="text-gray-600">
                        Utwórz nowe, bezpieczne hasło dla konta: <br />
                        <span className="font-medium text-gray-800">{userEmail}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nowe hasło */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nowe hasło
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Wprowadź nowe hasło"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Siła hasła</span>
                                    <span>{passwordStrength.strength}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${passwordStrength.strength <= 2 ? 'bg-red-500' :
                                                passwordStrength.strength <= 3 ? 'bg-yellow-500' :
                                                    passwordStrength.strength <= 4 ? 'bg-blue-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                    ></div>
                                </div>
                                {passwordStrength.feedback.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Brakuje: {passwordStrength.feedback.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Potwierdzenie hasła */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Potwierdź nowe hasło
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Potwierdź nowe hasło"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showConfirmPassword ? (
                                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                <p className="text-red-700 text-sm">{errors.submit}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || passwordStrength.strength < 3}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading || passwordStrength.strength < 3
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300'
                            } text-white`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Zmienianie hasła...
                            </div>
                        ) : (
                            'Zmień hasło'
                        )}
                    </button>
                </form>

                {/* Security Tips */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Wskazówki bezpieczeństwa:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Użyj co najmniej 8 znaków</li>
                        <li>• Połącz wielkie i małe litery</li>
                        <li>• Dodaj cyfry i znaki specjalne</li>
                        <li>• Nie używaj tego hasła w innych serwisach</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
