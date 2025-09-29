// pages/test-hasla.js

import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiKey, FiCheck, FiX } from 'react-icons/fi';
import dataManager from '../utils/dataManager';

export default function TestHasla() {
    const [testUsers, setTestUsers] = useState([
        { email: 'test@example.com', password: 'haslo123', firstName: 'Jan', lastName: 'Testowy' },
        { email: 'admin@technik.com', password: 'admin123', firstName: 'Admin', lastName: 'Systemu' },
        { email: 'pracownik@technik.com', password: 'pracownik123', firstName: 'Anna', lastName: 'Kowalska' }
    ]);
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState(null);

    const createTestUsers = () => {
        try {
            const existingUsers = dataManager.getStorageData('users') || [];

            testUsers.forEach(user => {
                const exists = existingUsers.find(existing => existing.email === user.email);
                if (!exists) {
                    existingUsers.push({
                        id: dataManager.generateId('USER'),
                        ...user,
                        role: user.email.includes('admin') ? 'admin' : 'customer',
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            });

            dataManager.setStorageData('users', existingUsers);
            setMessage('✅ Utworzono użytkowników testowych!');
            loadStats();
        } catch (error) {
            setMessage('❌ Błąd podczas tworzenia użytkowników: ' + error.message);
        }
    };

    const clearAllData = () => {
        if (confirm('Czy na pewno chcesz usunąć wszystkie dane? Ta operacja jest nieodwracalna.')) {
            dataManager.clearAllData();
            setMessage('🗑️ Wszystkie dane zostały usunięte!');
            loadStats();
        }
    };

    const testPasswordReset = async (email) => {
        try {
            const result = await dataManager.requestPasswordReset(email);
            if (result.success) {
                setMessage(`✅ Token resetowania dla ${email}: ${result.token}`);
                console.log(`Test reset URL: http://localhost:3000/reset-hasla?token=${result.token}`);
            } else {
                setMessage(`❌ Błąd resetowania dla ${email}: ${result.error}`);
            }
            loadStats();
        } catch (error) {
            setMessage(`❌ Błąd: ${error.message}`);
        }
    };

    const loadStats = () => {
        const users = dataManager.getStorageData('users') || [];
        const resetTokens = dataManager.getStorageData('resetTokens') || {};
        const securityLogs = dataManager.getStorageData('securityLog') || [];

        setStats({
            users: users.length,
            resetTokens: Object.keys(resetTokens).length,
            securityLogs: securityLogs.length
        });
    };

    useEffect(() => {
        loadStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <FiKey className="w-6 h-6 mr-2 text-blue-600" />
                        Panel Testowy - Resetowanie Haseł
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Narzędzie do testowania funkcjonalności resetowania haseł w środowisku deweloperskim.
                    </p>

                    {/* Wiadomość */}
                    {message && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800">{message}</p>
                        </div>
                    )}

                    {/* Statystyki */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <FiUser className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Użytkownicy</p>
                                <p className="text-xl font-bold text-gray-900">{stats.users}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <FiKey className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Tokeny reset</p>
                                <p className="text-xl font-bold text-gray-900">{stats.resetTokens}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <FiCheck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Logi bezp.</p>
                                <p className="text-xl font-bold text-gray-900">{stats.securityLogs}</p>
                            </div>
                        </div>
                    )}

                    {/* Akcje */}
                    <div className="space-y-4">
                        <div className="flex space-x-4">
                            <button
                                onClick={createTestUsers}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FiUser className="w-4 h-4 inline mr-2" />
                                Utwórz użytkowników testowych
                            </button>
                            <button
                                onClick={clearAllData}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <FiX className="w-4 h-4 inline mr-2" />
                                Wyczyść wszystkie dane
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista użytkowników testowych */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Użytkownicy testowi</h2>
                    <div className="space-y-4">
                        {testUsers.map((user, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FiMail className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                        <p className="text-xs text-gray-500">Hasło: {user.password}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => testPasswordReset(user.email)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                    Test resetowania
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instrukcje */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instrukcje testowania:</h3>
                    <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                        <li>Kliknij "Utwórz użytkowników testowych" aby dodać testowe konta</li>
                        <li>Kliknij "Test resetowania" przy wybranym użytkowniku</li>
                        <li>Token zostanie wyświetlony w wiadomości oraz w konsoli przeglądarki</li>
                        <li>Przejdź do <a href="/reset-hasla?token=WKLEJ_TOKEN" className="underline">strony resetowania</a> i wklej token</li>
                        <li>Ustaw nowe hasło i sprawdź czy proces działa poprawnie</li>
                        <li>Sprawdź panel bezpieczeństwa: <a href="/admin-bezpieczenstwo" className="underline">Admin → Bezpieczeństwo</a></li>
                    </ol>
                </div>

                {/* Przydatne linki */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <a
                        href="/zapomniane-haslo"
                        className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <h4 className="font-medium text-gray-900">Formularz resetowania</h4>
                        <p className="text-sm text-gray-600">/zapomniane-haslo</p>
                    </a>
                    <a
                        href="/admin-bezpieczenstwo"
                        className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <h4 className="font-medium text-gray-900">Panel bezpieczeństwa</h4>
                        <p className="text-sm text-gray-600">/admin-bezpieczenstwo</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
