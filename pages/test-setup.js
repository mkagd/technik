// pages/test-setup.js
// Strona do konfiguracji danych testowych

import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiDatabase, FiUsers, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';
import dataManager from '../utils/dataManager';

export default function TestSetup() {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const createTestUsers = async () => {
        setLoading(true);
        try {
            const testUsers = [
                {
                    id: 'user_1',
                    email: 'test@example.com',
                    password: 'Test123!',
                    firstName: 'Jan',
                    lastName: 'Kowalski',
                    role: 'customer',
                    isActive: true,
                    emailVerified: true
                },
                {
                    id: 'user_2',
                    email: 'admin@technik.com',
                    password: 'Admin123!',
                    firstName: 'Anna',
                    lastName: 'Administratorka',
                    role: 'admin',
                    isActive: true,
                    emailVerified: true
                },
                {
                    id: 'user_3',
                    email: 'pracownik@technik.com',
                    password: 'Work123!',
                    firstName: 'Piotr',
                    lastName: 'Pracownik',
                    role: 'employee',
                    isActive: true,
                    emailVerified: true
                },
                {
                    id: 'user_4',
                    email: 'reset.test@example.com',
                    password: 'OldPassword123!',
                    firstName: 'Tomasz',
                    lastName: 'Testowy',
                    role: 'customer',
                    isActive: true,
                    emailVerified: true
                }
            ];

            // Dodanie użytkowników do localStorage
            dataManager.setStorageData('users', testUsers);

            // Dodanie przykładowych pracowników
            const testEmployees = [
                {
                    id: 'emp_1',
                    firstName: 'Anna',
                    lastName: 'Administratorka',
                    email: 'admin@technik.com',
                    phone: '+48 123 456 789',
                    specialization: ['Naprawa laptopów', 'Diagnostyka', 'Zarządzanie'],
                    role: 'admin',
                    isActive: true
                },
                {
                    id: 'emp_2',
                    firstName: 'Piotr',
                    lastName: 'Pracownik',
                    email: 'pracownik@technik.com',
                    phone: '+48 987 654 321',
                    specialization: ['Naprawa telefonów', 'Wymiana ekranów'],
                    role: 'employee',
                    isActive: true
                }
            ];

            testEmployees.forEach(emp => {
                dataManager.saveEmployee(emp);
            });

            setMessage('✅ Dane testowe zostały utworzone pomyślnie!');
        } catch (error) {
            setMessage('❌ Błąd podczas tworzenia danych testowych: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearAllData = () => {
        try {
            const result = dataManager.clearAllData();
            if (result.success) {
                setMessage(`✅ Wyczyszczono ${result.removed} kluczy z localStorage`);
            } else {
                setMessage('❌ Błąd podczas czyszczenia danych: ' + result.error);
            }
        } catch (error) {
            setMessage('❌ Błąd: ' + error.message);
        }
    };

    const testPasswordReset = async () => {
        setLoading(true);
        try {
            // Test 1: Żądanie resetowania dla istniejącego użytkownika
            const result1 = await dataManager.requestPasswordReset('reset.test@example.com');
            console.log('Reset request result:', result1);

            if (result1.success && result1.token) {
                // Test 2: Walidacja tokenu
                const result2 = await dataManager.validateResetToken(result1.token);
                console.log('Token validation result:', result2);

                if (result2.valid) {
                    // Test 3: Reset hasła
                    const result3 = await dataManager.resetPassword(result1.token, 'NewPassword123!');
                    console.log('Password reset result:', result3);

                    if (result3.success) {
                        setMessage('✅ Test resetowania hasła zakończony pomyślnie! Sprawdź konsolę dla szczegółów.');
                    } else {
                        setMessage('❌ Błąd podczas resetowania hasła: ' + result3.error);
                    }
                } else {
                    setMessage('❌ Token jest nieprawidłowy: ' + result2.error);
                }
            } else {
                setMessage('❌ Błąd żądania resetowania: ' + result1.error);
            }
        } catch (error) {
            setMessage('❌ Błąd podczas testowania: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const viewStorageData = () => {
        const users = dataManager.getStorageData('users') || [];
        const resetTokens = dataManager.getStorageData('resetTokens') || {};
        const securityLogs = dataManager.getSecurityLogs(10);

        console.log('=== DANE W STORAGE ===');
        console.log('Users:', users);
        console.log('Reset Tokens:', resetTokens);
        console.log('Security Logs:', securityLogs);
        console.log('Active Reset Tokens:', dataManager.getActiveResetTokens());

        setMessage('✅ Dane wyświetlone w konsoli przeglądarki (F12)');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                        <FiDatabase className="w-8 h-8 mr-3 text-blue-600" />
                        Panel Testowy - Konfiguracja Danych
                    </h1>

                    {message && (
                        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm font-mono">{message}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Zarządzanie użytkownikami */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                <FiUsers className="w-5 h-5 mr-2" />
                                Użytkownicy testowi
                            </h2>

                            <button
                                onClick={createTestUsers}
                                disabled={loading}
                                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            >
                                <FiPlus className="w-4 h-4 mr-2" />
                                {loading ? 'Tworzenie...' : 'Utwórz użytkowników testowych'}
                            </button>

                            <div className="text-sm text-gray-600 p-3 bg-green-50 border border-green-200 rounded">
                                <h3 className="font-semibold mb-2">Zostanie utworzonych:</h3>
                                <ul className="space-y-1">
                                    <li>• test@example.com (hasło: Test123!)</li>
                                    <li>• admin@technik.com (hasło: Admin123!)</li>
                                    <li>• pracownik@technik.com (hasło: Work123!)</li>
                                    <li>• reset.test@example.com (hasło: OldPassword123!)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Testowanie resetowania hasła */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                <FiCheck className="w-5 h-5 mr-2" />
                                Test funkcjonalności
                            </h2>

                            <button
                                onClick={testPasswordReset}
                                disabled={loading}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                <FiCheck className="w-4 h-4 mr-2" />
                                {loading ? 'Testowanie...' : 'Test resetowania hasła'}
                            </button>

                            <button
                                onClick={viewStorageData}
                                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <FiDatabase className="w-4 h-4 mr-2" />
                                Pokaż dane w konsoli
                            </button>

                            <div className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p>
                                    Test wykona automatyczne resetowanie hasła dla użytkownika
                                    <code className="font-mono bg-white px-1 rounded">reset.test@example.com</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dangerous actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                            <FiTrash2 className="w-5 h-5 mr-2" />
                            Działania ryzykowne
                        </h2>

                        <button
                            onClick={clearAllData}
                            className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Wyczyść wszystkie dane
                        </button>

                        <p className="text-sm text-gray-500 mt-2">
                            ⚠️ To usunie wszystkie dane z localStorage (użytkownicy, harmonogramy, tokeny, logi)
                        </p>
                    </div>

                    {/* Nawigacja */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4">
                        <button
                            onClick={() => router.push('/logowanie')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Strona logowania
                        </button>
                        <button
                            onClick={() => router.push('/zapomniane-haslo')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Zapomniałeś hasła
                        </button>
                        <button
                            onClick={() => router.push('/admin-bezpieczenstwo')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Panel bezpieczeństwa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
