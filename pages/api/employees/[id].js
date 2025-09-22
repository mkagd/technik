// pages/api/employees/[id].js - API do zarządzania pojedynczym pracownikiem

import {
    readEmployees,
    updateEmployee,
    deleteEmployee,
    readEmployeeSettings,
    writeEmployeeSettings
} from '../../../utils/employeeStorage';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        // Pobierz pojedynczego pracownika
        try {
            const employees = readEmployees();
            const employee = employees.find(emp => emp.id === id);

            if (!employee) {
                return res.status(404).json({ message: 'Pracownik nie znaleziony' });
            }

            // Pobierz też ustawienia pracownika
            const employeeSettings = readEmployeeSettings();
            const settings = employeeSettings[id] || {};

            return res.status(200).json({
                employee,
                settings
            });
        } catch (error) {
            console.error('Błąd pobierania pracownika:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        // Aktualizuj pracownika
        try {
            console.log(`📝 Aktualizacja pracownika ${id}:`, req.body);

            const updatedEmployee = updateEmployee(id, req.body);

            if (updatedEmployee) {
                console.log('✅ Pracownik zaktualizowany:', updatedEmployee);
                return res.status(200).json({
                    message: 'Pracownik zaktualizowany',
                    employee: updatedEmployee
                });
            } else {
                return res.status(404).json({ message: 'Pracownik nie znaleziony' });
            }

        } catch (error) {
            console.error('Błąd aktualizacji pracownika:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'DELETE') {
        // Usuń pracownika
        try {
            console.log(`🗑️ Usuwanie pracownika ${id}`);

            const success = deleteEmployee(id);

            if (success) {
                // Usuń też ustawienia pracownika
                const employeeSettings = readEmployeeSettings();
                delete employeeSettings[id];
                writeEmployeeSettings(employeeSettings);

                console.log('✅ Pracownik usunięty');
                return res.status(200).json({ message: 'Pracownik usunięty' });
            } else {
                return res.status(404).json({ message: 'Pracownik nie znaleziony' });
            }

        } catch (error) {
            console.error('Błąd usuwania pracownika:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
