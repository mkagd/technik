// pages/pracownik-panel-prosty.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dataManager from '../utils/dataManager';
import {
    FiCalendar,
    FiClock,
    FiUser,
    FiLogOut,
    FiSave,
    FiBell,
    FiBarChart,
    FiUsers,
    FiDownload,
    FiUpload,
    FiHardDrive,
    FiServer,
    FiWifi,
    FiWifiOff
} from 'react-icons/fi';

export default function PracownikPanelProsty() {
    const [employee, setEmployee] = useState(null);
    const [quickSchedule, setQuickSchedule] = useState({
        mondayToFriday: { working: false, start: '08:00', end: '16:00', break: '12:00-13:00' },
        saturday: { working: false, start: '09:00', end: '14:00', break: '' },
        sunday: { working: false, start: '10:00', end: '14:00', break: '' }
    });
    const [message, setMessage] = useState('');
    const [dataStats, setDataStats] = useState(null);
    const [serverConnected, setServerConnected] = useState(false);
    const [apiMode, setApiMode] = useState(false);
    const router = useRouter();

    // Sprawdź autoryzację i załaduj dane pracownika
    useEffect(() => {
        const loadData = async () => {
            if (typeof window !== 'undefined') {
                const employeeData = localStorage.getItem('employeeSession');
                if (!employeeData) {
                    router.push('/pracownik-logowanie');
                    return;
                }

                const parsedData = JSON.parse(employeeData);
                setEmployee(parsedData);

                try {
                    // Załaduj harmonogram z DataManager
                    const savedEmployee = await dataManager.getEmployee(parsedData.id);
                    if (savedEmployee) {
                        const schedules = await dataManager.getEmployeeSchedules(parsedData.id);
                        const activeSchedule = schedules.find(s => s.isActive && s.type === 'weekly');
                        if (activeSchedule && activeSchedule.data.quickSchedule) {
                            setQuickSchedule(activeSchedule.data.quickSchedule);
                        }
                    }

                    // Załaduj statystyki i sprawdź połączenie z serwerem
                    setDataStats(dataManager.getDataStats());

                    const connected = await dataManager.checkServerConnection();
                    setServerConnected(connected);

                    // Sprawdź tryb API
                    const apiModeEnabled = localStorage.getItem(`${dataManager.storagePrefix}api_mode`) === 'true';
                    setApiMode(apiModeEnabled);
                } catch (error) {
                    console.error('Błąd ładowania danych:', error);
                    // Fallback - załaduj z localStorage
                    setDataStats(dataManager.getDataStats());
                }
            }
        };

        loadData();
    }, [router]);

    const saveQuickSchedule = async () => {
        if (employee) {
            try {
                // Zapisz pracownika jeśli nie istnieje
                await dataManager.saveEmployee(employee);

                // Zapisz harmonogram
                const scheduleData = {
                    quickSchedule: quickSchedule,
                    type: 'weekly',
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    specialization: employee.specialization,
                    validFrom: new Date().toISOString(),
                    validTo: null
                };

                const result = await dataManager.saveSchedule(employee.id, scheduleData);

                if (result.success) {
                    setMessage('✅ Harmonogram zapisany w systemie!');
                    setDataStats(dataManager.getDataStats());

                    if (apiMode && serverConnected) {
                        // Spróbuj zsynchronizować z serwerem
                        const syncResult = await dataManager.syncWithServer();
                        if (syncResult.success) {
                            setMessage('✅ Harmonogram zapisany i zsynchronizowany z serwerem!');
                        } else {
                            setMessage('✅ Zapisano lokalnie (sync z serwerem nieudany)');
                        }
                    }
                } else {
                    setMessage('❌ Błąd zapisywania: ' + result.error);
                }

            } catch (error) {
                console.error('Błąd zapisu:', error);
                setMessage('❌ Błąd zapisywania harmonogramu');
            }

            setTimeout(() => setMessage(''), 5000);
        }
    };

    const updateSchedule = (period, field, value) => {
        setQuickSchedule(prev => ({
            ...prev,
            [period]: {
                ...prev[period],
                [field]: value
            }
        }));
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('employeeSession');
        }
        router.push('/pracownik-logowanie');
    };

    const exportSchedule = async () => {
        if (employee) {
            try {
                const exportData = await dataManager.exportAllData();

                if (exportData) {
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `harmonogram_backup_${employee.firstName}_${employee.lastName}_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    setMessage('📁 Wszystkie dane wyeksportowane!');
                } else {
                    setMessage('❌ Błąd eksportu danych');
                }
            } catch (error) {
                console.error('Błąd eksportu:', error);
                setMessage('❌ Błąd eksportu danych');
            }
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        const result = await dataManager.importData(importData);

                        if (result.employees || result.schedules || result.bookings) {
                            setMessage(`📥 Zaimportowano: ${result.employees} pracowników, ${result.schedules} harmonogramów, ${result.bookings} rezerwacji`);

                            // Odśwież dane
                            const schedules = await dataManager.getEmployeeSchedules(employee.id);
                            const activeSchedule = schedules.find(s => s.isActive && s.type === 'weekly');
                            if (activeSchedule && activeSchedule.data.quickSchedule) {
                                setQuickSchedule(activeSchedule.data.quickSchedule);
                            }
                            setDataStats(dataManager.getDataStats());
                        } else {
                            setMessage('❌ ' + (result.error || 'Błąd importu'));
                        }
                    } catch (parseError) {
                        setMessage('❌ Nieprawidłowy format pliku');
                    }
                    setTimeout(() => setMessage(''), 5000);
                };
                reader.readAsText(file);
            } catch (error) {
                setMessage('❌ Błąd wczytywania pliku');
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    const clearData = async () => {
        if (employee && confirm('Czy na pewno chcesz usunąć wszystkie dane z lokalnej pamięci?')) {
            try {
                const result = dataManager.clearAllData();
                if (result.success) {
                    setQuickSchedule({
                        mondayToFriday: { working: false, start: '08:00', end: '16:00', break: '12:00-13:00' },
                        saturday: { working: false, start: '09:00', end: '14:00', break: '' },
                        sunday: { working: false, start: '10:00', end: '14:00', break: '' }
                    });
                    setDataStats(dataManager.getDataStats());
                    setMessage(`🗑️ Usunięto ${result.removed} rekordów!`);
                } else {
                    setMessage('❌ Błąd usuwania danych');
                }
            } catch (error) {
                setMessage('❌ Błąd usuwania danych');
            }
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const toggleApiMode = async () => {
        const newMode = !apiMode;
        dataManager.setApiMode(newMode);
        setApiMode(newMode);

        if (newMode) {
            setMessage('🌐 Tryb serwera włączony - dane będą synchronizowane z serwerem');
        } else {
            setMessage('💾 Tryb lokalny włączony - dane zapisywane tylko lokalnie');
        }

        setTimeout(() => setMessage(''), 3000);
    };

    const syncWithServer = async () => {
        if (!serverConnected) {
            setMessage('❌ Brak połączenia z serwerem');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            setMessage('� Synchronizowanie z serwerem...');
            const result = await dataManager.syncWithServer();

            if (result.success) {
                setMessage('✅ Synchronizacja zakończona pomyślnie!');
                setDataStats(dataManager.getDataStats());
            } else {
                setMessage('❌ Błąd synchronizacji: ' + result.error);
            }
        } catch (error) {
            setMessage('❌ Błąd synchronizacji z serwerem');
        }

        setTimeout(() => setMessage(''), 5000);
    };

    if (!employee) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie panelu pracownika...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full mr-4">
                                <FiUser className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Panel Pracownika - Prosty
                                </h1>
                                <p className="text-gray-600">
                                    Witaj, {employee.firstName} {employee.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Specjalizacje: {employee.specialization.join(', ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => router.push('/powiadomienia-pracownik')}
                                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                <FiBell className="h-4 w-4 mr-2" />
                                Powiadomienia
                            </button>
                            <button
                                onClick={() => router.push('/pracownik-statystyki')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Statystyki
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <FiLogOut className="h-4 w-4 mr-2" />
                                Wyloguj
                            </button>
                        </div>
                    </div>
                </div>

                {/* Komunikat */}
                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Szybkie ustawienie godzin pracy */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <FiClock className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Godziny Pracy</h2>
                                    <p className="text-gray-600 text-sm">Ustaw swój harmonogram pracy</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Poniedziałek - Piątek */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">📅 Poniedziałek - Piątek</h3>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={quickSchedule.mondayToFriday.working}
                                            onChange={(e) => updateSchedule('mondayToFriday', 'working', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium">Pracuję</span>
                                    </label>
                                </div>

                                {quickSchedule.mondayToFriday.working && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕐 Od
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.mondayToFriday.start}
                                                    onChange={(e) => updateSchedule('mondayToFriday', 'start', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕕 Do
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.mondayToFriday.end}
                                                    onChange={(e) => updateSchedule('mondayToFriday', 'end', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ☕ Przerwa (np. 12:00-13:00)
                                            </label>
                                            <input
                                                type="text"
                                                value={quickSchedule.mondayToFriday.break}
                                                onChange={(e) => updateSchedule('mondayToFriday', 'break', e.target.value)}
                                                placeholder="12:00-13:00"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sobota */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">🟢 Sobota</h3>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={quickSchedule.saturday.working}
                                            onChange={(e) => updateSchedule('saturday', 'working', e.target.checked)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium">Pracuję</span>
                                    </label>
                                </div>

                                {quickSchedule.saturday.working && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕐 Od
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.saturday.start}
                                                    onChange={(e) => updateSchedule('saturday', 'start', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕕 Do
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.saturday.end}
                                                    onChange={(e) => updateSchedule('saturday', 'end', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ☕ Przerwa (opcjonalnie)
                                            </label>
                                            <input
                                                type="text"
                                                value={quickSchedule.saturday.break}
                                                onChange={(e) => updateSchedule('saturday', 'break', e.target.value)}
                                                placeholder="Brak przerwy"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Niedziela */}
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">🟣 Niedziela</h3>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={quickSchedule.sunday.working}
                                            onChange={(e) => updateSchedule('sunday', 'working', e.target.checked)}
                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium">Pracuję</span>
                                    </label>
                                </div>

                                {quickSchedule.sunday.working && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕐 Od
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.sunday.start}
                                                    onChange={(e) => updateSchedule('sunday', 'start', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    🕕 Do
                                                </label>
                                                <input
                                                    type="time"
                                                    value={quickSchedule.sunday.end}
                                                    onChange={(e) => updateSchedule('sunday', 'end', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ☕ Przerwa (opcjonalnie)
                                            </label>
                                            <input
                                                type="text"
                                                value={quickSchedule.sunday.break}
                                                onChange={(e) => updateSchedule('sunday', 'break', e.target.value)}
                                                placeholder="Brak przerwy"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Przycisk zapisu */}
                            <button
                                onClick={saveQuickSchedule}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <FiSave className="h-5 w-5 mr-2" />
                                💾 Zapisz godziny pracy
                            </button>
                        </div>
                    </div>

                    {/* Funkcje główne */}
                    <div className="space-y-6">
                        {/* Podsumowanie tygodnia */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Podsumowanie tygodnia</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(quickSchedule.mondayToFriday.working ? 5 : 0) +
                                            (quickSchedule.saturday.working ? 1 : 0) +
                                            (quickSchedule.sunday.working ? 1 : 0)}
                                    </div>
                                    <div className="text-sm text-blue-700">Dni robocze</div>
                                </div>

                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {(() => {
                                            let totalHours = 0;
                                            if (quickSchedule.mondayToFriday.working) {
                                                const start = new Date(`2024-01-01 ${quickSchedule.mondayToFriday.start}`);
                                                const end = new Date(`2024-01-01 ${quickSchedule.mondayToFriday.end}`);
                                                totalHours += ((end - start) / (1000 * 60 * 60)) * 5;
                                            }
                                            if (quickSchedule.saturday.working) {
                                                const start = new Date(`2024-01-01 ${quickSchedule.saturday.start}`);
                                                const end = new Date(`2024-01-01 ${quickSchedule.saturday.end}`);
                                                totalHours += (end - start) / (1000 * 60 * 60);
                                            }
                                            if (quickSchedule.sunday.working) {
                                                const start = new Date(`2024-01-01 ${quickSchedule.sunday.start}`);
                                                const end = new Date(`2024-01-01 ${quickSchedule.sunday.end}`);
                                                totalHours += (end - start) / (1000 * 60 * 60);
                                            }
                                            return Math.round(totalHours);
                                        })()}h
                                    </div>
                                    <div className="text-sm text-green-700">Godzin tygodniowo</div>
                                </div>

                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {quickSchedule.saturday.working || quickSchedule.sunday.working ? 'TAK' : 'NIE'}
                                    </div>
                                    <div className="text-sm text-orange-700">Praca w weekendy</div>
                                </div>

                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {[quickSchedule.mondayToFriday.break, quickSchedule.saturday.break, quickSchedule.sunday.break]
                                            .filter(b => b && b.trim().length > 0).length}
                                    </div>
                                    <div className="text-sm text-purple-700">Przerw łącznie</div>
                                </div>
                            </div>
                        </div>

                        {/* Szybkie akcje */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Szybkie akcje</h3>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => {
                                        setQuickSchedule({
                                            mondayToFriday: { working: true, start: '08:00', end: '16:00', break: '12:00-13:00' },
                                            saturday: { working: false, start: '09:00', end: '14:00', break: '' },
                                            sunday: { working: false, start: '10:00', end: '14:00', break: '' }
                                        });
                                    }}
                                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    📅 Standardowy tydzień (Pon-Pt 8:00-16:00)
                                </button>

                                <button
                                    onClick={() => {
                                        setQuickSchedule(prev => ({
                                            ...prev,
                                            saturday: { working: true, start: '09:00', end: '14:00', break: '' }
                                        }));
                                    }}
                                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    🟢 + Sobota (9:00-14:00)
                                </button>

                                <button
                                    onClick={() => {
                                        setQuickSchedule(prev => ({
                                            mondayToFriday: { ...prev.mondayToFriday, working: true },
                                            saturday: { ...prev.saturday, working: true },
                                            sunday: { ...prev.sunday, working: true }
                                        }));
                                    }}
                                    className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    🌟 Całą tydzień (7 dni)
                                </button>
                            </div>
                        </div>

                        {/* Zaawansowane funkcje */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Dodatkowe funkcje</h3>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => router.push('/kalendarz-prosty')}
                                    className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <FiCalendar className="h-4 w-4 mr-2" />
                                    📅 Szczegółowy kalendarz
                                </button>

                                <button
                                    onClick={() => router.push('/integracja-rezerwacji')}
                                    className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <FiUsers className="h-4 w-4 mr-2" />
                                    👥 Rezerwacje klientów
                                </button>

                                <button
                                    onClick={() => router.push('/pracownik-statystyki')}
                                    className="flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    <FiBarChart className="h-4 w-4 mr-2" />
                                    📊 Statystyki pracy
                                </button>
                            </div>
                        </div>

                        {/* Zarządzanie danymi */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                <FiHardDrive className="inline h-5 w-5 mr-2" />
                                💾 Zarządzanie danymi systemu
                            </h3>

                            {/* Status połączenia */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Status systemu:</span>
                                    <div className="flex items-center">
                                        {serverConnected ? (
                                            <>
                                                <FiWifi className="h-4 w-4 text-green-600 mr-1" />
                                                <span className="text-green-600 text-sm">Serwer online</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiWifiOff className="h-4 w-4 text-orange-600 mr-1" />
                                                <span className="text-orange-600 text-sm">Tryb offline</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Tryb zapisu:</span>
                                    <button
                                        onClick={toggleApiMode}
                                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${apiMode
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {apiMode ? (
                                            <>
                                                <FiServer className="h-3 w-3 mr-1" />
                                                Serwer
                                            </>
                                        ) : (
                                            <>
                                                <FiHardDrive className="h-3 w-3 mr-1" />
                                                Lokalny
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {dataStats && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>� Pracownicy: <strong>{dataStats.employees}</strong></div>
                                        <div>📅 Harmonogramy: <strong>{dataStats.schedules}</strong></div>
                                        <div>📋 Rezerwacje: <strong>{dataStats.bookings}</strong></div>
                                        <div>💾 Rozmiar danych: <strong>{Math.round(dataStats.totalSize / 1024)} KB</strong></div>
                                        {dataStats.lastSync && (
                                            <div>🔄 Ostatnia sync: <strong>{new Date(dataStats.lastSync).toLocaleString('pl-PL')}</strong></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {serverConnected && (
                                    <button
                                        onClick={syncWithServer}
                                        className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FiServer className="h-4 w-4 mr-2" />
                                        🔄 Synchronizuj z serwerem
                                    </button>
                                )}

                                <button
                                    onClick={exportSchedule}
                                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FiDownload className="h-4 w-4 mr-2" />
                                    📁 Eksportuj wszystkie dane
                                </button>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileImport}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                        <FiUpload className="h-4 w-4 mr-2" />
                                        📥 Importuj dane
                                    </button>
                                </div>

                                <button
                                    onClick={clearData}
                                    className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    🗑️ Wyczyść lokalne dane
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
