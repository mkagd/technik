// pages/api/employees.js - Główne API dla pracowników

import {
    readEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
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

    if (req.method === 'PUT') {
        try {
            console.log('📞 API PUT /api/employees - aktualizacja pracownika:', req.body);

            const { id, ...updateData } = req.body;

            if (!id) {
                return res.status(400).json({
                    message: 'Brak ID pracownika'
                });
            }

            // Sprawdź czy email nie jest już używany przez innego pracownika
            if (updateData.email) {
                const existingEmployees = readEmployees();
                const emailExists = existingEmployees.some(emp => emp.email === updateData.email && emp.id !== id);
                if (emailExists) {
                    return res.status(400).json({
                        message: 'Pracownik z takim adresem email już istnieje'
                    });
                }
            }

            const updatedEmployee = updateEmployee(id, {
                ...updateData,
                metadata: {
                    ...updateData.metadata,
                    updatedAt: new Date().toISOString(),
                    lastModifiedBy: 'admin-panel'
                }
            });

            if (updatedEmployee) {
                console.log('✅ Pracownik zaktualizowany:', id);
                return res.status(200).json({
                    message: 'Pracownik zaktualizowany pomyślnie',
                    employee: updatedEmployee
                });
            } else {
                return res.status(404).json({
                    message: 'Pracownik nie znaleziony'
                });
            }

        } catch (error) {
            console.error('❌ Błąd aktualizacji pracownika:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy aktualizacji pracownika',
                error: error.message
            });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            console.log('📞 API DELETE /api/employees - usuwanie pracownika:', id);

            if (!id) {
                return res.status(400).json({
                    message: 'Brak ID pracownika'
                });
            }

            const success = deleteEmployee(id);

            if (success) {
                console.log('✅ Pracownik usunięty:', id);
                return res.status(200).json({
                    message: 'Pracownik usunięty pomyślnie',
                    id
                });
            } else {
                return res.status(404).json({
                    message: 'Pracownik nie znaleziony'
                });
            }

        } catch (error) {
            console.error('❌ Błąd usuwania pracownika:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy usuwaniu pracownika',
                error: error.message
            });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
