// pages/admin-bezpieczenstwo.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    FiShield,
    FiKey,
    FiUsers,
    FiClock,
    FiTrash2,
    FiRefreshCw,
    FiAlertTriangle,
    FiEye,
    FiArrowLeft
} from 'react-icons/fi';
import dataManager from '../utils/dataManager';

export default function AdminBezpieczenstwo() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('tokens');
    const [resetTokens, setResetTokens] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeTokens: 0,
        expiredTokens: 0,
        usedTokens: 0,
        totalRequests: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Załaduj aktywne tokeny resetowania
            const tokens = dataManager.getActiveResetTokens();
            setResetTokens(tokens);

            // Załaduj logi bezpieczeństwa
            const logs = dataManager.getSecurityLogs(50);
            setSecurityLogs(logs);

            // Oblicz statystyki
            const allTokens = dataManager.getStorageData('resetTokens') || {};
            const now = Date.now();

            let activeCount = 0;
            let expiredCount = 0;
            let usedCount = 0;

            Object.values(allTokens).forEach(token => {
                if (token.used) {
                    usedCount++;
                } else if (token.expires < now) {
                    expiredCount++;
                } else {
                    activeCount++;
                }
            });

            setStats({
                activeTokens: activeCount,
                expiredTokens: expiredCount,
                usedTokens: usedCount,
                totalRequests: Object.keys(allTokens).length
            });

        } catch (error) {
            console.error('Błąd podczas ładowania danych:', error);
        } finally {
            setLoading(false);
        }
    };

    const cleanupExpiredTokens = async () => {
        try {
            const result = dataManager.cleanupExpiredTokens();
            if (result.cleaned > 0) {
                loadData(); // Odśwież dane
                alert(`Usunięto ${result.cleaned} wygasłych tokenów`);
            } else {
                alert('Nie znaleziono wygasłych tokenów do usunięcia');
            }
        } catch (error) {
            console.error('Błąd podczas czyszczenia tokenów:', error);
            alert('Wystąpił błąd podczas czyszczenia tokenów');
        }
    };

    const formatTimeLeft = (timeLeft) => {
        if (timeLeft <= 0) return 'Wygasł';

        const minutes = Math.floor(timeLeft / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pl-PL');
    };

    const getEventIcon = (event) => {
        switch (event) {
            case 'password_reset_requested':
                return <FiKey className="w-4 h-4 text-blue-500" />;
            case 'password_reset_completed':
                return <FiShield className="w-4 h-4 text-green-500" />;
            default:
                return <FiEye className="w-4 h-4 text-gray-500" />;
        }
    };

    const getEventLabel = (event) => {
        switch (event) {
            case 'password_reset_requested':
                return 'Żądanie resetowania hasła';
            case 'password_reset_completed':
                return 'Hasło zresetowane';
            default:
                return event;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Ładowanie danych bezpieczeństwa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/admin"
                                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5 mr-2" />
                                    Powrót do panelu
                                </Link>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <FiShield className="w-6 h-6 mr-2 text-blue-600" />
                                    Bezpieczeństwo
                                </h1>
                            </div>
                            <button
                                onClick={loadData}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                Odśwież
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FiKey className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Aktywne tokeny</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeTokens}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <FiClock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Wygasłe tokeny</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.expiredTokens}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FiShield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Użyte tokeny</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.usedTokens}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <FiUsers className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Wszystkie żądania</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('tokens')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tokens'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <FiKey className="w-4 h-4 inline mr-2" />
                                Tokeny resetowania
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logs'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <FiEye className="w-4 h-4 inline mr-2" />
                                Logi bezpieczeństwa
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tokens' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-medium text-gray-900">Aktywne tokeny resetowania</h2>
                                    <button
                                        onClick={cleanupExpiredTokens}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4 mr-2" />
                                        Wyczyść wygasłe
                                    </button>
                                </div>

                                {resetTokens.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FiKey className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Brak aktywnych tokenów resetowania</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Token
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Utworzony
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Wygasa
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Czas do wygaśnięcia
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {resetTokens.map((token, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {token.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                            {token.token}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(token.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(token.expiresAt)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${token.timeLeft > 30 * 60 * 1000 // 30 minut
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : token.timeLeft > 10 * 60 * 1000 // 10 minut
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                <FiClock className="w-3 h-3 mr-1" />
                                                                {formatTimeLeft(token.timeLeft)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-6">Ostatnie zdarzenia bezpieczeństwa</h2>

                                {securityLogs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FiEye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Brak zdarzeń bezpieczeństwa</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {securityLogs.map((log) => (
                                            <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3">
                                                        {getEventIcon(log.event)}
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-900">
                                                                {getEventLabel(log.event)}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {formatDate(log.timestamp)}
                                                            </p>
                                                            {log.details && log.details.email && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Email: {log.details.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {log.details && log.details.userAgent && (
                                                            <p className="max-w-xs truncate">{log.details.userAgent}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
