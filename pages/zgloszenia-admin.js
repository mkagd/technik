import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaTools, FaCalendarAlt, FaSearch, FaFilter, FaDownload, FaCog } from 'react-icons/fa';
import reportManager from '../utils/reportManager';
import migrationManager from '../utils/migrationManager';
import ReportManagerPanel from '../components/ReportManagerPanel';

export default function ZgloszeniaAdmin() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showManagementPanel, setShowManagementPanel] = useState(false);

    useEffect(() => {
        // Sprawdź autoryzację administratora
        const adminData = localStorage.getItem('adminSession');
        if (!adminData) {
            router.push('/admin-new');
            return;
        }

        // Załaduj zgłoszenia
        loadReports();
    }, [router]);

    const loadReports = async () => {
        try {
            // Uruchom migrację jeśli nie została jeszcze wykonana
            if (!migrationManager.isMigrationCompleted()) {
                console.log('Uruchamiam migrację danych...');
                const migrationResult = await migrationManager.runMigration();
                if (migrationResult.success) {
                    console.log('Migracja zakończona:', migrationResult.message);
                } else {
                    console.error('Błąd migracji:', migrationResult.message);
                }
            }

            // Pobierz ujednolicone zgłoszenia
            const allReports = reportManager.getAllReports();
            setReports(allReports);
            setFilteredReports(allReports);
        } catch (error) {
            console.error('Błąd podczas ładowania zgłoszeń:', error);

            // Fallback - załaduj ze starego systemu
            const legacyReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            setReports(legacyReports);
            setFilteredReports(legacyReports);
        }
    };

    // Filtrowanie i sortowanie
    useEffect(() => {
        let filtered = [...reports];

        // Filtruj według statusu
        if (filterStatus !== 'all') {
            filtered = filtered.filter(report => report.status === filterStatus);
        }

        // Filtruj według wyszukiwanego terminu
        if (searchTerm) {
            filtered = filtered.filter(report => {
                const description = report.reportDetails?.description || report.description || '';
                const phone = report.contactInfo?.phone || report.phone || '';
                const email = report.contactInfo?.email || report.email || '';
                const equipment = report.reportDetails?.equipmentType || report.finalEquipment || '';
                const reportNumber = report.reportNumber || '';

                return (
                    description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    phone.includes(searchTerm) ||
                    email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    reportNumber.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Sortuj
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'oldest':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

        setFilteredReports(filtered);
    }, [reports, filterStatus, searchTerm, sortBy]);

    const updateReportStatus = (reportId, newStatus) => {
        // Sprawdź czy to nowe zgłoszenie z reportNumber
        const report = reports.find(r => r.id === reportId || r.reportNumber === reportId);
        if (!report) return;

        if (report.reportNumber) {
            // Nowy system - użyj reportManager
            const updatedReport = reportManager.updateReportStatus(report.reportNumber, newStatus, 'Status zmieniony przez administratora', 'admin');
            if (updatedReport) {
                loadReports(); // Przeładuj wszystkie zgłoszenia

                // Aktualizuj wybrany raport jeśli jest to ten sam
                if (selectedReport && (selectedReport.id === reportId || selectedReport.reportNumber === reportId)) {
                    setSelectedReport(updatedReport);
                }
            }
        } else {
            // Stary system - zachowaj kompatybilność
            const updatedReports = reports.map(report =>
                report.id === reportId ? { ...report, status: newStatus } : report
            );
            setReports(updatedReports);
            localStorage.setItem('quickReports', JSON.stringify(updatedReports));

            // Aktualizuj wybrany raport jeśli jest to ten sam
            if (selectedReport && selectedReport.id === reportId) {
                setSelectedReport({ ...selectedReport, status: newStatus });
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-red-100 text-red-800 border-red-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'Nowe';
            case 'in-progress': return 'W realizacji';
            case 'completed': return 'Zakończone';
            case 'cancelled': return 'Anulowane';
            default: return 'Nieznany';
        }
    };

    const exportToCSV = () => {
        const csvData = filteredReports.map(report => ({
            'Numer': report.reportNumber || report.id,
            'Typ': report.type === 'US' ? 'Usterka' : report.type === 'ZG' ? 'Serwis' : 'Zgłoszenie',
            'Data': new Date(report.timestamp).toLocaleDateString('pl-PL'),
            'Godzina': new Date(report.timestamp).toLocaleTimeString('pl-PL'),
            'Telefon': report.contactInfo?.phone || report.phone,
            'Email': report.contactInfo?.email || report.email || '',
            'Adres': report.contactInfo?.address || report.address,
            'Sprzęt': report.reportDetails?.equipmentType || report.finalEquipment || '',
            'Problem': report.reportDetails?.description || report.description,
            'Dostępność': report.reportDetails?.availability || report.finalAvailability,
            'Status': getStatusText(report.status),
            'Typ użytkownika': report.userType === 'registered' ? 'Zarejestrowany' : 'Gość'
        }));

        const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zgloszenia_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Zgłoszenia serwisowe</h1>
                    <p className="text-gray-600">Zarządzaj wszystkimi zgłoszeniami klientów</p>
                </div>

                {/* Filtry i statystyki */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Statystyki */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Nowe</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {reports.filter(r => r.status === 'new').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <FaClock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">W realizacji</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {reports.filter(r => r.status === 'in-progress').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FaCheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Zakończone</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {reports.filter(r => r.status === 'completed').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FaCalendarAlt className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Łącznie</p>
                                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtry i wyszukiwanie */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wyszukaj</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Telefon, email, opis..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Wszystkie</option>
                                <option value="new">Nowe</option>
                                <option value="in-progress">W realizacji</option>
                                <option value="completed">Zakończone</option>
                                <option value="cancelled">Anulowane</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sortuj</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="newest">Najnowsze</option>
                                <option value="oldest">Najstarsze</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        <div className="flex items-end space-x-2">
                            <button
                                onClick={exportToCSV}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                                <FaDownload className="mr-2" />
                                Eksportuj
                            </button>
                            <button
                                onClick={() => setShowManagementPanel(!showManagementPanel)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <FaCog className="mr-2" />
                                Zarządzaj
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel zarządzania */}
                {showManagementPanel && (
                    <div className="mb-6">
                        <ReportManagerPanel />
                    </div>
                )}

                {/* Lista zgłoszeń */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Lista */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Zgłoszenia ({filteredReports.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {filteredReports.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-500">Brak zgłoszeń do wyświetlenia</p>
                                    </div>
                                ) : (
                                    filteredReports.map((report) => (
                                        <div
                                            key={report.id}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'bg-blue-50' : ''
                                                }`}
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="text-sm font-mono text-gray-500">
                                                            {report.reportNumber || `#${report.id}`}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(report.status)}`}>
                                                            {getStatusText(report.status)}
                                                        </span>
                                                        {(report.userType === 'registered' || report.type) && (
                                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                {report.type === 'US' ? 'Usterka' : report.type === 'ZG' ? 'Serwis' : 'Zalogowany'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        {report.reportDetails?.equipmentType || report.finalEquipment || 'Nieokreślony sprzęt'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                        {report.reportDetails?.description || report.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span className="flex items-center">
                                                            <FaPhone className="h-3 w-3 mr-1" />
                                                            {report.contactInfo?.phone || report.phone}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <FaClock className="h-3 w-3 mr-1" />
                                                            {new Date(report.timestamp).toLocaleString('pl-PL')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <FaEye className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Szczegóły zgłoszenia */}
                    <div className="xl:col-span-1">
                        {selectedReport ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {selectedReport.reportNumber || `Zgłoszenie #${selectedReport.id}`}
                                        </h3>
                                        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(selectedReport.status)}`}>
                                            {getStatusText(selectedReport.status)}
                                        </span>
                                    </div>
                                    {selectedReport.type && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Typ: {selectedReport.type === 'US' ? 'Usterka' : 'Zgłoszenie serwisowe'}
                                        </p>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Dane kontaktowe */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Kontakt</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <FaPhone className="h-4 w-4 text-gray-400 mr-2" />
                                                <a href={`tel:${selectedReport.contactInfo?.phone || selectedReport.phone}`} className="text-blue-600 hover:text-blue-800">
                                                    {selectedReport.contactInfo?.phone || selectedReport.phone}
                                                </a>
                                            </div>
                                            {(selectedReport.contactInfo?.email || selectedReport.email) && (
                                                <div className="flex items-center text-sm">
                                                    <FaEnvelope className="h-4 w-4 text-gray-400 mr-2" />
                                                    <a href={`mailto:${selectedReport.contactInfo?.email || selectedReport.email}`} className="text-blue-600 hover:text-blue-800">
                                                        {selectedReport.contactInfo?.email || selectedReport.email}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex items-center text-sm">
                                                <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-gray-600">{selectedReport.contactInfo?.address || selectedReport.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Szczegóły sprzętu */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Sprzęt i problem</h4>
                                        <div className="space-y-2">
                                            {(selectedReport.reportDetails?.equipmentType || selectedReport.finalEquipment) && (
                                                <div className="flex items-center text-sm">
                                                    <FaTools className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-600">{selectedReport.reportDetails?.equipmentType || selectedReport.finalEquipment}</span>
                                                </div>
                                            )}
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-sm text-gray-700">{selectedReport.reportDetails?.description || selectedReport.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dostępność */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Dostępność</h4>
                                        <div className="flex items-center text-sm">
                                            <FaClock className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-gray-600">{selectedReport.reportDetails?.availability || selectedReport.finalAvailability}</span>
                                        </div>
                                    </div>

                                    {/* Informacje dodatkowe */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Informacje</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>Data: {new Date(selectedReport.timestamp).toLocaleString('pl-PL')}</p>
                                            <p>Typ użytkownika: {selectedReport.userType === 'registered' ? 'Zalogowany' : 'Gość'}</p>
                                        </div>
                                    </div>

                                    {/* Akcje */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Zmień status</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updateReportStatus(selectedReport.reportNumber || selectedReport.id, 'in-progress')}
                                                className="px-3 py-2 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                            >
                                                W realizacji
                                            </button>
                                            <button
                                                onClick={() => updateReportStatus(selectedReport.reportNumber || selectedReport.id, 'completed')}
                                                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                            >
                                                Zakończone
                                            </button>
                                            <button
                                                onClick={() => updateReportStatus(selectedReport.reportNumber || selectedReport.id, 'new')}
                                                className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            >
                                                Nowe
                                            </button>
                                            <button
                                                onClick={() => updateReportStatus(selectedReport.reportNumber || selectedReport.id, 'cancelled')}
                                                className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                            >
                                                Anulowane
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                <div className="text-center text-gray-500">
                                    <FaEye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>Wybierz zgłoszenie, aby wyświetlić szczegóły</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Powrót */}
                <div className="mt-6">
                    <button
                        onClick={() => router.push('/admin-new')}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Powrót do panelu admin
                    </button>
                </div>
            </div>
        </div>
    );
}
