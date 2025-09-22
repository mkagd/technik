// utils/reportManager.js
import dataManager from './dataManager';

class ReportManager {
    constructor() {
        this.storageKey = 'unified_reports';
        this.countersKey = 'report_counters';
    }

    // Generuj unikalny numer zgłoszenia
    generateReportNumber(type = 'ZG') {
        const counters = this.getCounters();
        const year = new Date().getFullYear();

        // Obsługa różnych typów zgłoszeń
        const typeKey = type.toLowerCase();
        if (!counters[typeKey]) {
            counters[typeKey] = 0;
        }

        counters[typeKey] += 1;
        this.saveCounters(counters);

        // Format: TYPE-YYYY-NNNN (np. ZG-2025-0001, US-2025-0001)
        const number = counters[typeKey].toString().padStart(4, '0');
        return `${type}-${year}-${number}`;
    }

    // Pobierz liczniki
    getCounters() {
        return JSON.parse(localStorage.getItem(this.countersKey) || '{}');
    }

    // Zapisz liczniki
    saveCounters(counters) {
        localStorage.setItem(this.countersKey, JSON.stringify(counters));
    }

    // Utworz zgłoszenie z ujednoliconym formatem
    createReport(reportData, type = 'ZG') {
        const reportNumber = this.generateReportNumber(type);
        const timestamp = new Date().toISOString();

        const unifiedReport = {
            id: reportNumber, // Używamy numeru zgłoszenia jako ID
            reportNumber: reportNumber,
            internalId: dataManager.generateId(), // Dodatkowy wewnętrzny ID
            type: type, // ZG = Zgłoszenie, US = Usterka
            timestamp: timestamp,
            createdAt: timestamp,
            status: 'new',
            priority: 'normal',
            assignedTo: null,

            // Dane użytkownika
            userId: reportData.userId || null,
            userType: reportData.userType || 'guest',

            // Dane kontaktowe
            contactInfo: {
                firstName: reportData.firstName || '',
                lastName: reportData.lastName || '',
                email: reportData.email || '',
                phone: reportData.phone || '',
                address: reportData.address || '',
                city: reportData.city || ''
            },

            // Dane zgłoszenia
            reportDetails: {
                equipmentType: reportData.finalEquipment || reportData.equipmentType || '',
                customEquipment: reportData.customEquipment || '',
                description: reportData.description || '',
                availability: reportData.finalAvailability || reportData.availability || '',
                customAvailability: reportData.customAvailability || '',
                urgency: reportData.urgency || 'normal'
            },

            // Dane techniczne
            technical: {
                source: reportData.source || 'web_form',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                ipAddress: 'localhost', // W produkcji pobierz prawdziwy IP
                referrer: typeof document !== 'undefined' ? document.referrer : ''
            },

            // Historia statusów
            statusHistory: [{
                status: 'new',
                timestamp: timestamp,
                changedBy: 'system',
                note: 'Zgłoszenie utworzone'
            }],

            // Komentarze
            comments: [],

            // Załączniki (przygotowane na przyszłość)
            attachments: [],

            // Metadane dla synchronizacji z serwerem
            syncStatus: 'pending', // pending, synced, error
            lastSyncAttempt: null,
            syncRetries: 0,

            // Dane oryginalnego formularza (backup)
            originalFormData: reportData
        };

        return unifiedReport;
    }

    // Zapisz zgłoszenie
    saveReport(report) {
        const reports = this.getAllReports();
        reports.unshift(report);
        localStorage.setItem(this.storageKey, JSON.stringify(reports));

        // Dodaj także do starego systemu dla kompatybilności
        this.addToLegacyStorage(report);

        return report;
    }

    // Pobierz wszystkie zgłoszenia
    getAllReports() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    // Pobierz zgłoszenie po numerze
    getReportByNumber(reportNumber) {
        const reports = this.getAllReports();
        return reports.find(report => report.reportNumber === reportNumber);
    }

    // Pobierz zgłoszenia według statusu
    getReportsByStatus(status) {
        const reports = this.getAllReports();
        return reports.filter(report => report.status === status);
    }

    // Pobierz zgłoszenia według userId lub emaila
    getReportsByUser(userIdOrEmail) {
        const reports = this.getAllReports();
        return reports.filter(report =>
            report.userId === userIdOrEmail ||
            report.contactInfo?.email?.toLowerCase() === userIdOrEmail.toLowerCase()
        );
    }

    // Aktualizuj status zgłoszenia
    updateReportStatus(reportNumber, newStatus, note = '', changedBy = 'admin') {
        const reports = this.getAllReports();
        const reportIndex = reports.findIndex(r => r.reportNumber === reportNumber);

        if (reportIndex !== -1) {
            const report = reports[reportIndex];
            const oldStatus = report.status;

            // Aktualizuj status
            report.status = newStatus;

            // Dodaj do historii
            report.statusHistory.push({
                status: newStatus,
                previousStatus: oldStatus,
                timestamp: new Date().toISOString(),
                changedBy: changedBy,
                note: note || `Status zmieniony z ${oldStatus} na ${newStatus}`
            });

            // Zapisz zmiany
            localStorage.setItem(this.storageKey, JSON.stringify(reports));

            // Aktualizuj także w starym systemie
            this.updateLegacyStatus(report);

            return report;
        }

        return null;
    }

    // Dodaj komentarz do zgłoszenia
    addComment(reportNumber, comment, author = 'admin') {
        const reports = this.getAllReports();
        const reportIndex = reports.findIndex(r => r.reportNumber === reportNumber);

        if (reportIndex !== -1) {
            const report = reports[reportIndex];

            report.comments.push({
                id: dataManager.generateId(),
                text: comment,
                author: author,
                timestamp: new Date().toISOString(),
                type: 'comment' // comment, note, system
            });

            localStorage.setItem(this.storageKey, JSON.stringify(reports));
            return report;
        }

        return null;
    }

    // Przygotuj dane do wysyłki na serwer
    prepareForSync(reportNumber) {
        const report = this.getReportByNumber(reportNumber);
        if (!report) return null;

        // Usuń dane wrażliwe lub niepotrzebne dla serwera
        const syncData = {
            ...report,
            technical: {
                ...report.technical,
                userAgent: undefined // Nie wysyłaj user agent na serwer
            }
        };

        return syncData;
    }

    // Oznacz zgłoszenie jako zsynchronizowane
    markAsSynced(reportNumber, serverResponse = null) {
        const reports = this.getAllReports();
        const reportIndex = reports.findIndex(r => r.reportNumber === reportNumber);

        if (reportIndex !== -1) {
            const report = reports[reportIndex];
            report.syncStatus = 'synced';
            report.lastSyncAttempt = new Date().toISOString();
            report.syncRetries = 0;

            if (serverResponse) {
                report.serverData = serverResponse;
            }

            localStorage.setItem(this.storageKey, JSON.stringify(reports));
            return report;
        }

        return null;
    }

    // Oznacz zgłoszenie jako błędne w synchronizacji
    markSyncError(reportNumber, error) {
        const reports = this.getAllReports();
        const reportIndex = reports.findIndex(r => r.reportNumber === reportNumber);

        if (reportIndex !== -1) {
            const report = reports[reportIndex];
            report.syncStatus = 'error';
            report.lastSyncAttempt = new Date().toISOString();
            report.syncRetries = (report.syncRetries || 0) + 1;
            report.lastSyncError = error;

            localStorage.setItem(this.storageKey, JSON.stringify(reports));
            return report;
        }

        return null;
    }

    // Pobierz zgłoszenia oczekujące na synchronizację
    getPendingSync() {
        const reports = this.getAllReports();
        return reports.filter(report =>
            report.syncStatus === 'pending' ||
            (report.syncStatus === 'error' && report.syncRetries < 3)
        );
    }

    // Statystyki zgłoszeń
    getStats() {
        const reports = this.getAllReports();
        const counters = this.getCounters();

        return {
            total: reports.length,
            byStatus: {
                new: reports.filter(r => r.status === 'new').length,
                'in-progress': reports.filter(r => r.status === 'in-progress').length,
                resolved: reports.filter(r => r.status === 'resolved').length,
                closed: reports.filter(r => r.status === 'closed').length
            },
            byType: {
                zg: reports.filter(r => r.type === 'ZG').length,
                us: reports.filter(r => r.type === 'US').length
            },
            sync: {
                pending: reports.filter(r => r.syncStatus === 'pending').length,
                synced: reports.filter(r => r.syncStatus === 'synced').length,
                errors: reports.filter(r => r.syncStatus === 'error').length
            },
            counters: counters
        };
    }

    // Kompatybilność z starym systemem
    addToLegacyStorage(report) {
        try {
            const legacyData = {
                id: report.internalId,
                timestamp: report.timestamp,
                userId: report.userId,
                userType: report.userType,
                email: report.contactInfo.email,
                phone: report.contactInfo.phone,
                city: report.contactInfo.city,
                address: report.contactInfo.address,
                description: report.reportDetails.description,
                finalEquipment: report.reportDetails.equipmentType,
                finalAvailability: report.reportDetails.availability,
                status: report.status,
                reportNumber: report.reportNumber
            };

            const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            quickReports.unshift(legacyData);
            localStorage.setItem('quickReports', JSON.stringify(quickReports));
        } catch (error) {
            console.error('Error adding to legacy storage:', error);
        }
    }

    // Aktualizuj status w starym systemie
    updateLegacyStatus(report) {
        try {
            const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            const legacyIndex = quickReports.findIndex(r => r.reportNumber === report.reportNumber);

            if (legacyIndex !== -1) {
                quickReports[legacyIndex].status = report.status;
                localStorage.setItem('quickReports', JSON.stringify(quickReports));
            }
        } catch (error) {
            console.error('Error updating legacy status:', error);
        }
    }

    // Migracja ze starego systemu
    migrateFromLegacy() {
        try {
            const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            const existingReports = this.getAllReports();

            // Sprawdź które zgłoszenia już zostały zmigrowne
            const existingNumbers = existingReports.map(r => r.reportNumber);

            quickReports.forEach(oldReport => {
                if (!oldReport.reportNumber || existingNumbers.includes(oldReport.reportNumber)) {
                    return; // Pomiń jeśli już zmigrowne lub nie ma numeru
                }

                // Konwertuj stare zgłoszenie na nowy format
                const newReport = this.createReport({
                    userId: oldReport.userId,
                    userType: oldReport.userType,
                    email: oldReport.email,
                    phone: oldReport.phone,
                    city: oldReport.city,
                    address: oldReport.address,
                    description: oldReport.description,
                    finalEquipment: oldReport.finalEquipment,
                    finalAvailability: oldReport.finalAvailability,
                    source: 'legacy_migration'
                });

                // Ustaw oryginalny numer i timestamp jeśli istnieją
                if (oldReport.reportNumber) {
                    newReport.reportNumber = oldReport.reportNumber;
                    newReport.id = oldReport.reportNumber;
                }
                if (oldReport.timestamp) {
                    newReport.timestamp = oldReport.timestamp;
                    newReport.createdAt = oldReport.timestamp;
                }
                if (oldReport.status) {
                    newReport.status = oldReport.status;
                }

                existingReports.push(newReport);
            });

            localStorage.setItem(this.storageKey, JSON.stringify(existingReports));
            console.log('Migration completed from legacy system');
        } catch (error) {
            console.error('Error during migration:', error);
        }
    }
}

// Eksportuj instancję singletona
const reportManager = new ReportManager();
export default reportManager;
