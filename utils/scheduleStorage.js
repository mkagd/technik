// utils/scheduleStorage.js

// System zarządzania harmonogramami pracowników z wieloma opcjami przechowywania

class ScheduleStorage {
    constructor() {
        this.storageKey = 'employeeSchedules';
        this.backupKey = 'employeeSchedulesBackup';
    }

    // Zapisz harmonogram pracownika
    saveSchedule(employeeId, scheduleData) {
        try {
            const allSchedules = this.getAllSchedules();
            allSchedules[employeeId] = {
                ...scheduleData,
                lastUpdated: new Date().toISOString(),
                version: (allSchedules[employeeId]?.version || 0) + 1
            };

            // Główne zapisanie
            localStorage.setItem(this.storageKey, JSON.stringify(allSchedules));

            // Backup
            this.createBackup(allSchedules);

            // Export do pliku JSON (opcjonalnie)
            this.exportToFile(employeeId, allSchedules[employeeId]);

            return { success: true, message: 'Harmonogram zapisany pomyślnie' };
        } catch (error) {
            console.error('Błąd zapisywania harmonogramu:', error);
            return { success: false, message: 'Błąd zapisywania harmonogramu' };
        }
    }

    // Wczytaj harmonogram pracownika
    loadSchedule(employeeId) {
        try {
            const allSchedules = this.getAllSchedules();
            return allSchedules[employeeId] || null;
        } catch (error) {
            console.error('Błąd wczytywania harmonogramu:', error);
            return null;
        }
    }

    // Pobierz wszystkie harmonogramy
    getAllSchedules() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Błąd wczytywania danych:', error);
            return {};
        }
    }

    // Utwórz kopię zapasową
    createBackup(data) {
        try {
            const backup = {
                data: data,
                timestamp: new Date().toISOString(),
                version: Date.now()
            };
            localStorage.setItem(this.backupKey, JSON.stringify(backup));
        } catch (error) {
            console.error('Błąd tworzenia kopii zapasowej:', error);
        }
    }

    // Przywróć z kopii zapasowej
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                const backupData = JSON.parse(backup);
                localStorage.setItem(this.storageKey, JSON.stringify(backupData.data));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Błąd przywracania kopii zapasowej:', error);
            return false;
        }
    }

    // Export harmonogramu do pliku JSON
    exportToFile(employeeId, scheduleData) {
        if (typeof window === 'undefined') return;

        try {
            const dataToExport = {
                employeeId: employeeId,
                schedule: scheduleData,
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0'
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // Nie zapisujemy automatycznie, tylko przygotowujemy dane
            // Można dodać opcję manualnego eksportu
            window.scheduleExportData = dataToExport;
        } catch (error) {
            console.error('Błąd przygotowania eksportu:', error);
        }
    }

    // Import harmonogramu z pliku
    importFromFile(fileContent) {
        try {
            const importedData = JSON.parse(fileContent);
            if (importedData.employeeId && importedData.schedule) {
                return this.saveSchedule(importedData.employeeId, importedData.schedule);
            }
            return { success: false, message: 'Nieprawidłowy format pliku' };
        } catch (error) {
            console.error('Błąd importu:', error);
            return { success: false, message: 'Błąd importu pliku' };
        }
    }

    // Wyczyść dane pracownika
    clearEmployeeData(employeeId) {
        try {
            const allSchedules = this.getAllSchedules();
            delete allSchedules[employeeId];
            localStorage.setItem(this.storageKey, JSON.stringify(allSchedules));
            return true;
        } catch (error) {
            console.error('Błąd usuwania danych:', error);
            return false;
        }
    }

    // Synchronizacja z serwerem (przygotowane na przyszłość)
    async syncWithServer(employeeId) {
        // TODO: Implementacja synchronizacji z bazą danych
        console.log('Synchronizacja z serwerem - do implementacji');
        return { success: false, message: 'Synchronizacja niedostępna' };
    }

    // Sprawdź dostępność storage
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Statystyki użycia storage
    getStorageStats() {
        try {
            const allSchedules = this.getAllSchedules();
            const employeeCount = Object.keys(allSchedules).length;
            const dataSize = new Blob([JSON.stringify(allSchedules)]).size;

            return {
                employeeCount,
                dataSizeBytes: dataSize,
                dataSizeKB: Math.round(dataSize / 1024 * 100) / 100,
                storageAvailable: this.isStorageAvailable()
            };
        } catch (error) {
            return {
                employeeCount: 0,
                dataSizeBytes: 0,
                dataSizeKB: 0,
                storageAvailable: false
            };
        }
    }
}

// Eksport instancji singletona
export const scheduleStorage = new ScheduleStorage();
export default scheduleStorage;
