// utils/employeeStorage.js
// System przechowywania pracowników zgodny z aplikacją mobilną (EmployeesContext)

import fs from 'fs';
import path from 'path';
import { generateEmployeeId } from './id-generator.js';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');
const SPECIALIZATIONS_FILE = path.join(process.cwd(), 'data', 'specializations.json');
const DISTANCE_SETTINGS_FILE = path.join(process.cwd(), 'data', 'distanceSettings.json');
const EMPLOYEE_SETTINGS_FILE = path.join(process.cwd(), 'data', 'employeeSettings.json');

// Upewnij się, że folder data istnieje
const ensureDataDir = () => {
    const dataDir = path.dirname(EMPLOYEES_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

// === PRACOWNICY ===

// Odczytaj pracowników z pliku
export const readEmployees = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(EMPLOYEES_FILE)) {
            // Domyślni pracownicy jeśli plik nie istnieje - używamy nowego formatu ID
            const defaultEmployees = [];
            // Zwracamy pustą tablicę - pracownicy będą dodawani przez panel admin
            writeEmployees(defaultEmployees);
            return defaultEmployees;
        }
        const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu pracowników:', error);
        return [];
    }
};

// Zapisz pracowników do pliku
export const writeEmployees = (employees) => {
    try {
        ensureDataDir();
        fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu pracowników:', error);
        return false;
    }
};

// Dodaj nowego pracownika
export const addEmployee = (employeeData) => {
    try {
        const employees = readEmployees();

        // Generuj ID dla nowego pracownika używając nowego systemu
        const newId = generateEmployeeId(employees, new Date(), 'admin-panel');

        const newEmployee = {
            id: newId,
            name: employeeData.name,
            email: employeeData.email,
            phone: employeeData.phone,
            specializations: employeeData.specializations || [],
            isActive: employeeData.isActive !== undefined ? employeeData.isActive : true,
            dateAdded: new Date().toISOString(),
            address: employeeData.address || '',
            workingHours: employeeData.workingHours || '8:00-16:00',
            experience: employeeData.experience || '0 lat',
            rating: employeeData.rating || 5.0,
            completedJobs: employeeData.completedJobs || 0
        };

        employees.push(newEmployee);

        if (writeEmployees(employees)) {
            console.log('✅ Nowy pracownik dodany:', newEmployee.id);
            return newEmployee;
        }
        return null;
    } catch (error) {
        console.error('Błąd dodawania pracownika:', error);
        return null;
    }
};

// Aktualizuj pracownika
export const updateEmployee = (id, updates) => {
    try {
        const employees = readEmployees();
        const index = employees.findIndex(emp => emp.id === id);

        if (index !== -1) {
            employees[index] = {
                ...employees[index],
                ...updates,
                updated_at: new Date().toISOString()
            };

            if (writeEmployees(employees)) {
                console.log('✅ Pracownik zaktualizowany:', id);
                return employees[index];
            }
        }
        return null;
    } catch (error) {
        console.error('Błąd aktualizacji pracownika:', error);
        return null;
    }
};

// Usuń pracownika
export const deleteEmployee = (id) => {
    try {
        const employees = readEmployees();
        const filteredEmployees = employees.filter(emp => emp.id !== id);

        if (filteredEmployees.length < employees.length) {
            if (writeEmployees(filteredEmployees)) {
                console.log('✅ Pracownik usunięty:', id);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Błąd usuwania pracownika:', error);
        return false;
    }
};

// === SPECJALIZACJE ===

// Odczytaj specjalizacje
export const readSpecializations = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(SPECIALIZATIONS_FILE)) {
            const defaultSpecializations = [
                {
                    id: 'spec-001',
                    name: 'Serwis AGD',
                    description: 'Naprawa sprzętu AGD',
                    category: 'agd',
                    isActive: true
                },
                {
                    id: 'spec-002',
                    name: 'Naprawa pralek',
                    description: 'Specjalizacja w pralnikach',
                    category: 'agd',
                    isActive: true
                },
                {
                    id: 'spec-003',
                    name: 'Serwis komputerowy',
                    description: 'Naprawa komputerów stacjonarnych',
                    category: 'it',
                    isActive: true
                },
                {
                    id: 'spec-004',
                    name: 'Naprawa laptopów',
                    description: 'Serwis laptopów i notebooków',
                    category: 'it',
                    isActive: true
                }
            ];
            writeSpecializations(defaultSpecializations);
            return defaultSpecializations;
        }
        const data = fs.readFileSync(SPECIALIZATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu specjalizacji:', error);
        return [];
    }
};

// Zapisz specjalizacje
export const writeSpecializations = (specializations) => {
    try {
        ensureDataDir();
        fs.writeFileSync(SPECIALIZATIONS_FILE, JSON.stringify(specializations, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu specjalizacji:', error);
        return false;
    }
};

// === USTAWIENIA DYSTANSU ===

// Odczytaj ustawienia dystansu
export const readDistanceSettings = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(DISTANCE_SETTINGS_FILE)) {
            const defaultSettings = {
                maxDistance: 50, // km
                preferredDistance: 25, // km
                travelCostPerKm: 2.5, // zł za km
                minimumTravelCost: 20, // zł
                workingRadius: {
                    center: { lat: 52.2297, lng: 21.0122 }, // Warszawa
                    radius: 50 // km
                }
            };
            writeDistanceSettings(defaultSettings);
            return defaultSettings;
        }
        const data = fs.readFileSync(DISTANCE_SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu ustawień dystansu:', error);
        return {};
    }
};

// Zapisz ustawienia dystansu
export const writeDistanceSettings = (settings) => {
    try {
        ensureDataDir();
        fs.writeFileSync(DISTANCE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu ustawień dystansu:', error);
        return false;
    }
};

// === USTAWIENIA PRACOWNIKÓW ===

// Odczytaj ustawienia pracowników
export const readEmployeeSettings = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(EMPLOYEE_SETTINGS_FILE)) {
            const defaultSettings = {
                // Ustawienia per pracownik będą dodawane dynamicznie
                // Format: { employeeId: { setting1: value1, setting2: value2 } }
            };
            writeEmployeeSettings(defaultSettings);
            return defaultSettings;
        }
        const data = fs.readFileSync(EMPLOYEE_SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu ustawień pracowników:', error);
        return {};
    }
};

// Zapisz ustawienia pracowników
export const writeEmployeeSettings = (settings) => {
    try {
        ensureDataDir();
        fs.writeFileSync(EMPLOYEE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu ustawień pracowników:', error);
        return false;
    }
};

// === FUNKCJE POMOCNICZE ===

// Znajdź pracowników według specjalizacji
export const findEmployeesBySpecialization = (specialization) => {
    const employees = readEmployees();
    return employees.filter(emp =>
        emp.isActive && emp.specializations.includes(specialization)
    );
};

// Znajdź najlepszego pracownika dla zadania
export const findBestEmployeeForJob = (requiredSpecializations, location = null) => {
    const employees = readEmployees();

    // Filtruj pracowników którzy mają wymagane specjalizacje
    const suitableEmployees = employees.filter(emp => {
        if (!emp.isActive) return false;
        return requiredSpecializations.some(spec =>
            emp.specializations.includes(spec)
        );
    });

    // Sortuj według oceny i liczby ukończonych zadań
    suitableEmployees.sort((a, b) => {
        const scoreA = a.rating * 0.7 + (a.completedJobs / 100) * 0.3;
        const scoreB = b.rating * 0.7 + (b.completedJobs / 100) * 0.3;
        return scoreB - scoreA;
    });

    return suitableEmployees[0] || null;
};
