// utils/dataManager.js

// Centralny system zarządzania danymi gotowy na migrację na serwer

class DataManager {
    constructor() {
        this.storagePrefix = 'technik_app_';
        this.version = '1.0.0';
        this.apiMode = false; // false = localStorage, true = server API
        this.serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    }

    // ===============================
    // SYSTEM NUMERACJI
    // ===============================

    // Generowanie unikalnego ID - NOWY SYSTEM UNIFIED
    generateId(entityType = 'GENERIC') {
        try {
            const { generateUnifiedID } = require('../scripts/unified-id-system');
            return generateUnifiedID(entityType);
        } catch (error) {
            console.warn('Nie można wczytać unified-id-system:', error.message);
            // Fallback - timestamp z losowymi znakami
            return `${entityType}${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        }
    }

    // Pobierz następny numer zgłoszenia
    getNextReportNumber() {
        const counters = this.getStorageData('counters') || { reports: 0, orders: 0 };
        counters.reports += 1;
        this.setStorageData('counters', counters);

        // Format: ZG-YYYY-NNNN (np. ZG-2025-0001)
        const year = new Date().getFullYear();
        const number = counters.reports.toString().padStart(4, '0');
        return `ZG-${year}-${number}`;
    }

    // Pobierz następny numer zlecenia
    getNextOrderNumber() {
        const counters = this.getStorageData('counters') || { reports: 0, orders: 0 };
        counters.orders += 1;
        this.setStorageData('counters', counters);

        // Format: ZL-YYYY-NNNN (np. ZL-2025-0001)
        const year = new Date().getFullYear();
        const number = counters.orders.toString().padStart(4, '0');
        return `ZL-${year}-${number}`;
    }

    // Reset liczników (do celów administracyjnych)
    resetCounters() {
        this.setStorageData('counters', { reports: 0, orders: 0 });
        return { success: true, message: 'Liczniki zostały zresetowane' };
    }

    // Pobierz aktualne liczniki
    getCounters() {
        return this.getStorageData('counters') || { reports: 0, orders: 0 };
    }

    // ===============================
    // STRUKTURA DANYCH (gotowa na DB)
    // ===============================

    // Struktura pracownika (kompatybilna z tabelą employees)
    createEmployeeRecord(employeeData) {
        return {
            id: employeeData.id || this.generateId(),
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            phone: employeeData.phone || null,
            specialization: Array.isArray(employeeData.specialization)
                ? employeeData.specialization
                : [employeeData.specialization],
            role: employeeData.role || 'employee',
            isActive: employeeData.isActive !== false,
            createdAt: employeeData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: employeeData.lastLogin || null,
            settings: employeeData.settings || {}
        };
    }

    // Struktura harmonogramu (kompatybilna z tabelą schedules)
    createScheduleRecord(employeeId, scheduleData) {
        return {
            id: this.generateId(),
            employeeId: employeeId,
            type: scheduleData.type || 'weekly', // weekly, daily, custom
            data: scheduleData,
            isActive: true,
            validFrom: scheduleData.validFrom || new Date().toISOString(),
            validTo: scheduleData.validTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: employeeId,
            version: scheduleData.version || 1
        };
    }

    // Struktura rezerwacji (kompatybilna z tabelą bookings)
    createBookingRecord(bookingData) {
        return {
            id: this.generateId(),
            employeeId: bookingData.employeeId,
            clientName: bookingData.clientName,
            clientEmail: bookingData.clientEmail || null,
            clientPhone: bookingData.clientPhone,
            serviceType: bookingData.serviceType,
            description: bookingData.description || '',
            scheduledDate: bookingData.scheduledDate,
            scheduledTime: bookingData.scheduledTime,
            estimatedDuration: bookingData.estimatedDuration || 60, // minuty
            status: bookingData.status || 'scheduled', // scheduled, confirmed, in_progress, completed, cancelled
            price: bookingData.price || null,
            notes: bookingData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };
    }

    // ===============================
    // OPERACJE NA DANYCH
    // ===============================

    async saveEmployee(employeeData) {
        const employee = this.createEmployeeRecord(employeeData);

        if (this.apiMode) {
            return await this.apiRequest('POST', '/employees', employee);
        } else {
            return this.localSave('employees', employee.id, employee);
        }
    }

    async getEmployee(employeeId) {
        if (this.apiMode) {
            return await this.apiRequest('GET', `/employees/${employeeId}`);
        } else {
            return this.localGet('employees', employeeId);
        }
    }

    async saveSchedule(employeeId, scheduleData) {
        const schedule = this.createScheduleRecord(employeeId, scheduleData);

        if (this.apiMode) {
            return await this.apiRequest('POST', '/schedules', schedule);
        } else {
            return this.localSave('schedules', `${employeeId}_${Date.now()}`, schedule);
        }
    }

    async getEmployeeSchedules(employeeId) {
        if (this.apiMode) {
            return await this.apiRequest('GET', `/schedules/employee/${employeeId}`);
        } else {
            return this.localGetByPrefix('schedules', employeeId);
        }
    }

    async saveBooking(bookingData) {
        const booking = this.createBookingRecord(bookingData);

        if (this.apiMode) {
            return await this.apiRequest('POST', '/bookings', booking);
        } else {
            return this.localSave('bookings', booking.id, booking);
        }
    }

    async getEmployeeBookings(employeeId, dateFrom = null, dateTo = null) {
        if (this.apiMode) {
            const params = new URLSearchParams();
            if (dateFrom) params.append('from', dateFrom);
            if (dateTo) params.append('to', dateTo);
            return await this.apiRequest('GET', `/bookings/employee/${employeeId}?${params}`);
        } else {
            return this.localGetBookingsByEmployee(employeeId, dateFrom, dateTo);
        }
    }

    // ===============================
    // LOCALSTORAGE OPERATIONS
    // ===============================

    localSave(table, id, data) {
        try {
            const key = `${this.storagePrefix}${table}_${id}`;
            const record = {
                ...data,
                _table: table,
                _key: key,
                _savedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(record));

            // Aktualizuj indeks
            this.updateIndex(table, id);

            return { success: true, data: record };
        } catch (error) {
            console.error('LocalSave error:', error);
            return { success: false, error: error.message };
        }
    }

    localGet(table, id) {
        try {
            const key = `${this.storagePrefix}${table}_${id}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalGet error:', error);
            return null;
        }
    }

    localGetByPrefix(table, prefix) {
        try {
            const results = [];
            const tablePrefix = `${this.storagePrefix}${table}_`;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(tablePrefix) && key.includes(prefix)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        results.push(JSON.parse(data));
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('LocalGetByPrefix error:', error);
            return [];
        }
    }

    localGetBookingsByEmployee(employeeId, dateFrom, dateTo) {
        try {
            const allBookings = this.localGetByPrefix('bookings', '');
            return allBookings.filter(booking => {
                if (booking.employeeId !== employeeId) return false;

                if (dateFrom && booking.scheduledDate < dateFrom) return false;
                if (dateTo && booking.scheduledDate > dateTo) return false;

                return true;
            });
        } catch (error) {
            console.error('LocalGetBookingsByEmployee error:', error);
            return [];
        }
    }

    // Indeks dla szybkiego wyszukiwania
    updateIndex(table, id) {
        try {
            const indexKey = `${this.storagePrefix}index_${table}`;
            let index = localStorage.getItem(indexKey);
            index = index ? JSON.parse(index) : [];

            if (!index.includes(id)) {
                index.push(id);
                localStorage.setItem(indexKey, JSON.stringify(index));
            }
        } catch (error) {
            console.error('UpdateIndex error:', error);
        }
    }

    // ===============================
    // API OPERATIONS (przygotowane na serwer)
    // ===============================

    async apiRequest(method, endpoint, data = null) {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Version': this.version
                }
            };

            if (data) {
                config.body = JSON.stringify(data);
            }

            // Dodaj token autoryzacji jeśli istnieje
            const token = this.getAuthToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.serverUrl}${endpoint}`, config);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request error:', error);
            return { success: false, error: error.message };
        }
    }

    getAuthToken() {
        return localStorage.getItem(`${this.storagePrefix}auth_token`);
    }

    setAuthToken(token) {
        localStorage.setItem(`${this.storagePrefix}auth_token`, token);
    }

    // ===============================
    // MIGRACJA DANYCH
    // ===============================

    // Eksport wszystkich danych do formatu gotowego na serwer
    async exportAllData() {
        const exportData = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            tables: {
                employees: [],
                schedules: [],
                bookings: []
            }
        };

        try {
            // Zbierz wszystkie dane z localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.storagePrefix)) {
                    const data = JSON.parse(localStorage.getItem(key));

                    if (data._table) {
                        exportData.tables[data._table].push(data);
                    }
                }
            }

            return exportData;
        } catch (error) {
            console.error('Export error:', error);
            return null;
        }
    }

    // Import danych z serwera lub pliku
    async importData(importData) {
        try {
            const results = {
                employees: 0,
                schedules: 0,
                bookings: 0,
                errors: []
            };

            for (const [table, records] of Object.entries(importData.tables)) {
                for (const record of records) {
                    try {
                        await this.localSave(table, record.id, record);
                        results[table]++;
                    } catch (error) {
                        results.errors.push(`${table}:${record.id} - ${error.message}`);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }
    }

    // Synchronizacja z serwerem
    async syncWithServer() {
        if (!this.apiMode) {
            console.log('Sync: API mode is disabled');
            return { success: false, error: 'API mode disabled' };
        }

        try {
            const localData = await this.exportAllData();
            const result = await this.apiRequest('POST', '/sync', localData);

            if (result.success) {
                // Zaktualizuj lokalne dane na podstawie odpowiedzi serwera
                if (result.updatedData) {
                    await this.importData(result.updatedData);
                }
            }

            return result;
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===============================
    // RESETOWANIE HASEŁ
    // ===============================

    // Generowanie tokenu resetowania hasła
    generateResetToken() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }

    // Żądanie resetowania hasła
    async requestPasswordReset(email) {
        try {
            if (this.apiMode) {
                const response = await fetch(`${this.serverUrl}/auth/password-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                return await response.json();
            }

            // Tryb localStorage
            const users = this.getStorageData('users') || [];
            const user = users.find(u => u.email === email);

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            const resetToken = this.generateResetToken();
            const resetTokens = this.getStorageData('resetTokens') || {};

            resetTokens[resetToken] = {
                email: email,
                expires: Date.now() + 3600000, // 1 godzina
                used: false,
                createdAt: new Date().toISOString()
            };

            this.setStorageData('resetTokens', resetTokens);

            // W rzeczywistej aplikacji tutaj byłaby wysyłka emaila
            console.log(`Reset token for ${email}: ${resetToken}`);
            console.log(`Reset URL: /reset-hasla?token=${resetToken}`);

            return {
                success: true,
                message: 'Reset token generated',
                token: resetToken // W produkcji nie zwracamy tokenu
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Walidacja tokenu resetowania
    async validateResetToken(token) {
        try {
            if (this.apiMode) {
                const response = await fetch(`${this.serverUrl}/auth/validate-reset-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                return await response.json();
            }

            // Tryb localStorage
            const resetTokens = this.getStorageData('resetTokens') || {};
            const tokenData = resetTokens[token];

            if (!tokenData) {
                return { valid: false, error: 'Token not found' };
            }

            if (tokenData.used) {
                return { valid: false, error: 'Token already used' };
            }

            if (Date.now() > tokenData.expires) {
                return { valid: false, error: 'Token expired' };
            }

            return {
                valid: true,
                email: tokenData.email,
                expiresAt: tokenData.expires
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Resetowanie hasła za pomocą tokenu
    async resetPassword(token, newPassword) {
        try {
            if (this.apiMode) {
                const response = await fetch(`${this.serverUrl}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                return await response.json();
            }

            // Tryb localStorage
            const tokenValidation = await this.validateResetToken(token);
            if (!tokenValidation.valid) {
                return { success: false, error: tokenValidation.error };
            }

            const users = this.getStorageData('users') || [];
            const userIndex = users.findIndex(u => u.email === tokenValidation.email);

            if (userIndex === -1) {
                return { success: false, error: 'User not found' };
            }

            // Aktualizacja hasła użytkownika
            users[userIndex].password = newPassword; // W produkcji powinno być zahashowane
            users[userIndex].lastPasswordChange = new Date().toISOString();
            users[userIndex].updatedAt = new Date().toISOString();

            this.setStorageData('users', users);

            // Oznaczenie tokenu jako użytego
            const resetTokens = this.getStorageData('resetTokens') || {};
            if (resetTokens[token]) {
                resetTokens[token].used = true;
                resetTokens[token].usedAt = new Date().toISOString();
                this.setStorageData('resetTokens', resetTokens);
            }

            return {
                success: true,
                message: 'Password reset successfully',
                email: tokenValidation.email
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Czyszczenie wygasłych tokenów
    cleanupExpiredTokens() {
        try {
            const resetTokens = this.getStorageData('resetTokens') || {};
            const now = Date.now();
            let cleanedCount = 0;

            Object.keys(resetTokens).forEach(token => {
                if (resetTokens[token].expires < now) {
                    delete resetTokens[token];
                    cleanedCount++;
                }
            });

            if (cleanedCount > 0) {
                this.setStorageData('resetTokens', resetTokens);
            }

            return { cleaned: cleanedCount };
        } catch (error) {
            console.error('Error cleaning expired tokens:', error);
            return { cleaned: 0, error: error.message };
        }
    }

    // Pobranie wszystkich aktywnych tokenów (dla admina)
    getActiveResetTokens() {
        try {
            const resetTokens = this.getStorageData('resetTokens') || {};
            const now = Date.now();
            const activeTokens = [];

            Object.entries(resetTokens).forEach(([token, data]) => {
                if (!data.used && data.expires > now) {
                    activeTokens.push({
                        token: token.substring(0, 8) + '...', // Ukryj pełny token
                        email: data.email,
                        createdAt: data.createdAt,
                        expiresAt: new Date(data.expires).toISOString(),
                        timeLeft: Math.max(0, data.expires - now)
                    });
                }
            });

            return activeTokens;
        } catch (error) {
            console.error('Error getting active tokens:', error);
            return [];
        }
    }

    // ===============================
    // BEZPIECZEŃSTWO I AUDYT
    // ===============================

    // Logowanie akcji bezpieczeństwa
    logSecurityEvent(event, details = {}) {
        try {
            const securityLog = this.getStorageData('securityLog') || [];

            securityLog.push({
                id: this.generateId(),
                event: event,
                details: details,
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                ip: 'localhost' // W produkcji pobrałbym prawdziwy IP
            });

            // Zachowaj tylko ostatnie 1000 wpisów
            if (securityLog.length > 1000) {
                securityLog.splice(0, securityLog.length - 1000);
            }

            this.setStorageData('securityLog', securityLog);
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }

    // Pobranie logów bezpieczeństwa
    getSecurityLogs(limit = 100) {
        try {
            const securityLog = this.getStorageData('securityLog') || [];
            return securityLog.slice(-limit).reverse(); // Najnowsze pierwsze
        } catch (error) {
            console.error('Error getting security logs:', error);
            return [];
        }
    }

    // ===============================
    // STATYSTYKI I RAPORTY
    // ===============================

    // Statystyki danych
    getDataStats() {
        const stats = {
            employees: 0,
            schedules: 0,
            bookings: 0,
            totalSize: 0,
            lastSync: null
        };

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.storagePrefix)) {
                    const data = localStorage.getItem(key);
                    stats.totalSize += data.length;

                    if (key.includes('employees_')) stats.employees++;
                    if (key.includes('schedules_')) stats.schedules++;
                    if (key.includes('bookings_')) stats.bookings++;
                }
            }

            stats.lastSync = localStorage.getItem(`${this.storagePrefix}last_sync`);

        } catch (error) {
            console.error('Stats error:', error);
        }

        return stats;
    }

    // Wyczyść wszystkie dane
    clearAllData() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.storagePrefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            return { success: true, removed: keysToRemove.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===============================
    // PODSTAWOWE METODY STORAGE
    // ===============================

    // Pobierz dane z localStorage
    getStorageData(key) {
        try {
            const fullKey = `${this.storagePrefix}${key}`;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error getting storage data for key ${key}:`, error);
            return null;
        }
    }

    // Zapisz dane do localStorage
    setStorageData(key, data) {
        try {
            const fullKey = `${this.storagePrefix}${key}`;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error setting storage data for key ${key}:`, error);
            return false;
        }
    }

    // Usuń dane z localStorage
    removeStorageData(key) {
        try {
            const fullKey = `${this.storagePrefix}${key}`;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error(`Error removing storage data for key ${key}:`, error);
            return false;
        }
    }
}

// Eksportuj instancję singletona
export const dataManager = new DataManager();
export default dataManager;
