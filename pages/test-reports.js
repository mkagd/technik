// pages/test-reports.js
// Strona testowa do sprawdzania systemu zgłoszeń

import { useState, useEffect } from 'react';
import reportManager from '../utils/reportManager';
import { testReportManager, showCurrentState } from '../utils/testReportManager';

export default function TestReports() {
    const [stats, setStats] = useState(null);
    const [allReports, setAllReports] = useState([]);
    const [testResults, setTestResults] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const currentStats = reportManager.getStats();
        const reports = reportManager.getAllReports();
        setStats(currentStats);
        setAllReports(reports);
    };

    const runTest = () => {
        try {
            const result = testReportManager();
            setTestResults(JSON.stringify(result, null, 2));
            loadData();
        } catch (error) {
            setTestResults(`Błąd: ${error.message}`);
        }
    };

    const createTestReport = () => {
        const testData = {
            phone: '123456789',
            email: 'test@example.com',
            address: 'ul. Testowa 1',
            city: 'Warszawa',
            description: 'Problem z drukarką testową',
            equipmentType: 'Drukarka',
            availability: 'Po 16:00',
            source: 'test_page'
        };

        const report = reportManager.createReport(testData, 'ZG');
        reportManager.saveReport(report);

        alert(`Utworzono zgłoszenie: ${report.reportNumber}`);
        loadData();
    };

    const showState = () => {
        showCurrentState();
        alert('Stan systemu wyświetlony w konsoli (F12)');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Systemu Zgłoszeń</h1>

                {/* Statystyki */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-gray-600">Wszystkie zgłoszenia</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-green-600">{stats.sync.synced}</div>
                            <div className="text-sm text-gray-600">Zsynchronizowane</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-yellow-600">{stats.sync.pending}</div>
                            <div className="text-sm text-gray-600">Oczekujące</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-red-600">{stats.sync.errors}</div>
                            <div className="text-sm text-gray-600">Błędy sync</div>
                        </div>
                    </div>
                )}

                {/* Przyciski akcji */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={createTestReport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Utwórz test zgłoszenie
                    </button>
                    <button
                        onClick={runTest}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Uruchom test
                    </button>
                    <button
                        onClick={showState}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Pokaż stan
                    </button>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Odśwież dane
                    </button>
                </div>

                {/* Lista zgłoszeń */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                            Zgłoszenia ({allReports.length})
                        </h2>
                    </div>
                    <div className="p-6">
                        {allReports.length === 0 ? (
                            <p className="text-gray-500">Brak zgłoszeń</p>
                        ) : (
                            <div className="space-y-4">
                                {allReports.slice(0, 10).map((report) => (
                                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {report.reportNumber}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Typ: {report.type} | Status: {report.status}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {report.reportDetails?.description}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Telefon: {report.contactInfo?.phone}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(report.timestamp).toLocaleString('pl-PL')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Wyniki testów */}
                {testResults && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Wyniki testów</h2>
                        </div>
                        <div className="p-6">
                            <pre className="text-sm bg-gray-100 p-4 rounded-lg overflow-auto">
                                {testResults}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Nawigacja */}
                <div className="mt-8 text-center">
                    <div className="space-x-4">
                        <a
                            href="/"
                            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Strona główna
                        </a>
                        <a
                            href="/moje-zamowienie"
                            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Sprawdź status
                        </a>
                        <a
                            href="/zgloszenia-admin"
                            className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Panel admin
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
