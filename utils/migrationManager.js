// utils/migrationManager.js
// Manager migracji danych ze starych systemów

import reportManager from './reportManager.js';

class MigrationManager {
    constructor() {
        this.migrationKey = 'migration_status';
    }

    // Sprawdź czy migracja została już wykonana
    isMigrationCompleted() {
        const status = localStorage.getItem(this.migrationKey);
        return status === 'completed';
    }

    // Oznacz migrację jako zakończoną
    markMigrationCompleted() {
        localStorage.setItem(this.migrationKey, 'completed');
        console.log('Migracja oznaczona jako zakończona');
    }

    // Główna funkcja migracji
    async runMigration() {
        if (this.isMigrationCompleted()) {
            console.log('Migracja już została wykonana');
            return { success: true, message: 'Already migrated' };
        }

        console.log('Rozpoczynam migrację danych...');

        try {
            let migratedCount = 0;

            // 1. Migracja quickReports
            const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
            if (quickReports.length > 0) {
                console.log(`Migracja ${quickReports.length} zgłoszeń z quickReports...`);

                for (const oldReport of quickReports) {
                    // Sprawdź czy nie ma już numeru zgłoszenia (nowy format)
                    if (oldReport.reportNumber) {
                        continue; // Już zmigrowne
                    }

                    // Konwertuj stare zgłoszenie na nowy format
                    const reportData = {
                        userId: oldReport.userId,
                        userType: oldReport.userType || 'guest',
                        phone: oldReport.phone,
                        email: oldReport.email,
                        address: oldReport.address,
                        city: oldReport.city,
                        description: oldReport.description,
                        equipmentType: oldReport.finalEquipment || oldReport.equipmentType,
                        availability: oldReport.finalAvailability || oldReport.availability,
                        source: 'legacy_migration',
                        timestamp: oldReport.timestamp
                    };

                    // Określ typ na podstawie danych
                    let reportType = 'ZG'; // domyślnie zgłoszenie serwisowe
                    if (oldReport.type === 'usterka' || oldReport.urgency === 'high') {
                        reportType = 'US';
                    }

                    // Utwórz nowe zgłoszenie
                    const newReport = reportManager.createReport(reportData, reportType);

                    // Zachowaj oryginalny timestamp jeśli istnieje
                    if (oldReport.timestamp) {
                        newReport.timestamp = oldReport.timestamp;
                        newReport.createdAt = oldReport.timestamp;
                    }

                    // Zachowaj oryginalny status
                    if (oldReport.status) {
                        newReport.status = oldReport.status;

                        // Dodaj do historii statusów
                        if (oldReport.status !== 'new') {
                            newReport.statusHistory.push({
                                status: oldReport.status,
                                timestamp: oldReport.timestamp || new Date().toISOString(),
                                changedBy: 'migration',
                                note: 'Status z migracji danych'
                            });
                        }
                    }

                    // Dodaj do unified_reports
                    const existingReports = reportManager.getAllReports();
                    existingReports.push(newReport);
                    localStorage.setItem('unified_reports', JSON.stringify(existingReports));

                    // Aktualizuj stare zgłoszenie z numerem (dla kompatybilności)
                    oldReport.reportNumber = newReport.reportNumber;

                    migratedCount++;
                }

                // Zapisz zaktualizowane quickReports
                localStorage.setItem('quickReports', JSON.stringify(quickReports));
            }

            // 2. Migracja simpleBookings (rezerwacje)
            const simpleBookings = JSON.parse(localStorage.getItem('simpleBookings') || '[]');
            if (simpleBookings.length > 0) {
                console.log(`Migracja ${simpleBookings.length} rezerwacji z simpleBookings...`);

                for (const oldBooking of simpleBookings) {
                    if (oldBooking.reportNumber) {
                        continue; // Już zmigrowne
                    }

                    const bookingData = {
                        phone: oldBooking.phone,
                        email: oldBooking.email,
                        address: oldBooking.address,
                        description: oldBooking.description || 'Rezerwacja terminu',
                        availability: oldBooking.availability,
                        source: 'legacy_booking_migration',
                        timestamp: oldBooking.createdAt
                    };

                    const newBooking = reportManager.createReport(bookingData, 'RZ');

                    // Zachowaj oryginalny timestamp
                    if (oldBooking.createdAt) {
                        newBooking.timestamp = oldBooking.createdAt;
                        newBooking.createdAt = oldBooking.createdAt;
                    }

                    // Zachowaj status
                    if (oldBooking.status) {
                        newBooking.status = oldBooking.status;
                    }

                    // Dodaj do unified_reports
                    const existingReports = reportManager.getAllReports();
                    existingReports.push(newBooking);
                    localStorage.setItem('unified_reports', JSON.stringify(existingReports));

                    // Aktualizuj starą rezerwację z numerem
                    oldBooking.reportNumber = newBooking.reportNumber;

                    migratedCount++;
                }

                // Zapisz zaktualizowane simpleBookings
                localStorage.setItem('simpleBookings', JSON.stringify(simpleBookings));
            }

            // Oznacz migrację jako zakończoną
            this.markMigrationCompleted();

            const result = {
                success: true,
                migratedCount: migratedCount,
                message: `Pomyślnie zmigrowno ${migratedCount} zgłoszeń`
            };

            console.log('Migracja zakończona:', result);
            return result;

        } catch (error) {
            console.error('Błąd podczas migracji:', error);
            return {
                success: false,
                error: error.message,
                message: 'Błąd podczas migracji danych'
            };
        }
    }

    // Funkcja do ręcznego ponownego uruchomienia migracji
    async forceMigration() {
        localStorage.removeItem(this.migrationKey);
        return await this.runMigration();
    }

    // Sprawdź status migracji
    getMigrationStatus() {
        const status = localStorage.getItem(this.migrationKey);
        const unifiedReports = reportManager.getAllReports();
        const quickReports = JSON.parse(localStorage.getItem('quickReports') || '[]');
        const simpleBookings = JSON.parse(localStorage.getItem('simpleBookings') || '[]');

        return {
            completed: status === 'completed',
            unifiedReportsCount: unifiedReports.length,
            legacyQuickReports: quickReports.length,
            legacySimpleBookings: simpleBookings.length,
            counters: reportManager.getCounters()
        };
    }
}

// Eksportuj instancję
const migrationManager = new MigrationManager();
export default migrationManager;
