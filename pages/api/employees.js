// pages/api/employees.js - Główne API dla pracowników

import {
    readEmployees,
    addEmployee,
    readSpecializations,
    readDistanceSettings,
    readEmployeeSettings,
    findEmployeesBySpecialization,
    findBestEmployeeForJob
} from '../../utils/employeeStorage';

export default async function handler(req, res) {

    if (req.method === 'GET') {
        try {
            console.log('📞 API GET /api/employees - pobieranie danych pracowników');

            const { specialization, location, findBest } = req.query;

            // Jeśli szukamy najlepszego pracownika
            if (findBest) {
                const requiredSpecs = Array.isArray(specialization) ? specialization : [specialization];
                const bestEmployee = findBestEmployeeForJob(requiredSpecs, location);
                return res.status(200).json({
                    employee: bestEmployee,
                    message: bestEmployee ? 'Najlepszy pracownik znaleziony' : 'Brak odpowiedniego pracownika'
                });
            }

            // Jeśli filtrujemy według specjalizacji
            if (specialization) {
                const employees = findEmployeesBySpecialization(specialization);
                return res.status(200).json({
                    employees,
                    specialization,
                    count: employees.length
                });
            }

            // Pobierz wszystkich pracowników
            const employees = readEmployees();
            const specializations = readSpecializations();
            const distanceSettings = readDistanceSettings();
            const employeeSettings = readEmployeeSettings();

            console.log(`✅ Zwracam ${employees.length} pracowników`);

            return res.status(200).json({
                employees,
                specializations,
                distanceSettings,
                employeeSettings,
                count: employees.length
            });

        } catch (error) {
            console.error('❌ Błąd pobierania pracowników:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy pobieraniu pracowników',
                error: error.message
            });
        }
    }

    if (req.method === 'POST') {
        try {
            console.log('📞 API POST /api/employees - dodawanie pracownika:', req.body);

            const { name, email, phone, specializations, address, workingHours, experience } = req.body;

            // Podstawowa walidacja
            if (!name || !phone) {
                console.log('❌ Brak wymaganych danych (name, phone)');
                return res.status(400).json({
                    message: 'Brak wymaganych danych: imię i telefon są wymagane'
                });
            }

            // Sprawdź czy email już istnieje (jeśli podano)
            if (email) {
                const existingEmployees = readEmployees();
                const emailExists = existingEmployees.some(emp => emp.email === email);
                if (emailExists) {
                    return res.status(400).json({
                        message: 'Pracownik z takim adresem email już istnieje'
                    });
                }
            }

            const newEmployee = addEmployee({
                name,
                email,
                phone,
                specializations: specializations || [],
                address,
                workingHours,
                experience,
                isActive: true
            });

            if (newEmployee) {
                console.log('✅ Pracownik dodany:', newEmployee.id);
                return res.status(201).json({
                    message: 'Pracownik dodany pomyślnie',
                    employee: newEmployee
                });
            } else {
                return res.status(500).json({
                    message: 'Błąd podczas dodawania pracownika'
                });
            }

        } catch (error) {
            console.error('❌ Błąd dodawania pracownika:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy dodawaniu pracownika',
                error: error.message
            });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
