// components/ReportManagerPanel.js
// Panel administracyjny do zarządzania zgłoszeniami i synchronizacją

import React, { useState, useEffect } from 'react';
import { FaSync, FaDatabase, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTrash, FaCog } from 'react-icons/fa';
import reportManager from '../utils/reportManager';
import migrationManager from '../utils/migrationManager';
import { testReportManager, clearTestData, showCurrentState } from '../utils/testReportManager';

const ReportManagerPanel = () => {
    const [stats, setStats] = useState(null);
    const [migrationStatus, setMigrationStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const currentStats = reportManager.getStats();
        const currentMigrationStatus = migrationManager.getMigrationStatus();

        setStats(currentStats);
        setMigrationStatus(currentMigrationStatus);
    };

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(''), 5000);
    };

    const handleMigration = async () => {
        setIsLoading(true);
        try {
            const result = await migrationManager.runMigration();
            if (result.success) {
                showMessage(`Migracja zakończona: ${result.message}`, 'success');
            } else {
                showMessage(`Błąd migracji: ${result.message}`, 'error');
            }
            loadData();
        } catch (error) {
            showMessage(`Błąd: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceMigration = async () => {
        if (!confirm('Czy na pewno chcesz wymusić ponowną migrację? Może to spowodować duplikaty.')) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await migrationManager.forceMigration();
            if (result.success) {
                showMessage(`Migracja wymuszona: ${result.message}`, 'success');
            } else {
                showMessage(`Błąd migracji: ${result.message}`, 'error');
            }
            loadData();
        } catch (error) {
            showMessage(`Błąd: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestReports = () => {
        try {
            const result = testReportManager();
            if (result.success) {
                showMessage(`Test zakończony pomyślnie. Utworzono: ${result.reportNumber}`, 'success');
            }
            loadData();
        } catch (error) {
            showMessage(`Błąd testu: ${error.message}`, 'error');
        }
    };

    const handleClearTestData = () => {
        if (!confirm('Czy na pewno chcesz wyczyścić wszystkie dane testowe? Ta operacja jest nieodwracalna.')) {
            return;
        }

        try {
            clearTestData();
            showMessage('Dane testowe wyczyszczone', 'success');
            loadData();
        } catch (error) {
            showMessage(`Błąd: ${error.message}`, 'error');
        }
    };

    const handleShowState = () => {
        showCurrentState();
        showMessage('Stan systemu wyświetlony w konsoli', 'info');
    };

    const syncPendingReports = async () => {
        setIsLoading(true);
        try {
            const pendingReports = reportManager.getPendingSync();
            showMessage(`Znaleziono ${pendingReports.length} zgłoszeń do synchronizacji`, 'info');

            // Tu można dodać logikę wysyłania na serwer
            // Na razie tylko symulujemy
            for (const report of pendingReports.slice(0, 3)) { // Max 3 na raz
                const syncData = reportManager.prepareForSync(report.reportNumber);
                console.log('Dane do wysłania:', syncData);

                // Symulacja API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Oznacz jako zsynchronizowane
                reportManager.markAsSynced(report.reportNumber, { serverId: Date.now() });
            }

            showMessage('Synchronizacja zakończona', 'success');
            loadData();
        } catch (error) {
            showMessage(`Błąd synchronizacji: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!stats || !migrationStatus) {
        return <div className="p-4">Ładowanie...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FaCog className="mr-2" />
                Zarządzanie systemem zgłoszeń
            </h3>

            {/* Komunikat */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                        message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Statystyki */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-600">Wszystkie zgłoszenia</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.sync.synced}</div>
                    <div className="text-sm text-green-600">Zsynchronizowane</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.sync.pending}</div>
                    <div className="text-sm text-yellow-600">Oczekujące</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.sync.errors}</div>
                    <div className="text-sm text-red-600">Błędy sync</div>
                </div>
            </div>

            {/* Status migracji */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FaDatabase className="mr-2" />
                    Status migracji
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Status:</span>
                        <div className={`font-semibold ${migrationStatus.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                            {migrationStatus.completed ? 'Zakończona' : 'Wymagana'}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-600">Unified:</span>
                        <div className="font-semibold">{migrationStatus.unifiedReportsCount}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Legacy Quick:</span>
                        <div className="font-semibold">{migrationStatus.legacyQuickReports}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Legacy Booking:</span>
                        <div className="font-semibold">{migrationStatus.legacySimpleBookings}</div>
                    </div>
                </div>
            </div>

            {/* Działania */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                    onClick={handleMigration}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Migracja
                </button>

                <button
                    onClick={syncPendingReports}
                    disabled={isLoading || stats.sync.pending === 0}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    <FaCheckCircle className="mr-2" />
                    Synchronizuj
                </button>

                <button
                    onClick={handleTestReports}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                    <FaInfoCircle className="mr-2" />
                    Test
                </button>

                <button
                    onClick={handleShowState}
                    className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <FaInfoCircle className="mr-2" />
                    Pokaż stan
                </button>

                <button
                    onClick={handleForceMigration}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                    <FaExclamationTriangle className="mr-2" />
                    Wymuś migrację
                </button>

                <button
                    onClick={handleClearTestData}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <FaTrash className="mr-2" />
                    Wyczyść dane
                </button>
            </div>

            {/* Informacja o licznikach */}
            <div className="mt-4 text-xs text-gray-500">
                <div>Liczniki: ZG={stats.counters.zg || 0}, US={stats.counters.us || 0}, RZ={stats.counters.rz || 0}</div>
                <div>Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}</div>
            </div>
        </div>
    );
};

export default ReportManagerPanel;
