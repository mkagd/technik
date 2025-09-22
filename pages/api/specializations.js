// pages/api/specializations.js - API do zarządzania specjalizacjami

import {
    readSpecializations,
    writeSpecializations
} from '../../utils/employeeStorage';

export default async function handler(req, res) {

    if (req.method === 'GET') {
        try {
            console.log('📞 API GET /api/specializations - pobieranie specjalizacji');

            const specializations = readSpecializations();

            console.log(`✅ Zwracam ${specializations.length} specjalizacji`);

            return res.status(200).json({
                specializations,
                count: specializations.length
            });

        } catch (error) {
            console.error('❌ Błąd pobierania specjalizacji:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy pobieraniu specjalizacji',
                error: error.message
            });
        }
    }

    if (req.method === 'POST') {
        try {
            console.log('📞 API POST /api/specializations - dodawanie specjalizacji:', req.body);

            const { name, description, category } = req.body;

            // Podstawowa walidacja
            if (!name) {
                return res.status(400).json({
                    message: 'Nazwa specjalizacji jest wymagana'
                });
            }

            const specializations = readSpecializations();

            // Sprawdź czy specjalizacja już istnieje
            const exists = specializations.some(spec => spec.name === name);
            if (exists) {
                return res.status(400).json({
                    message: 'Specjalizacja o tej nazwie już istnieje'
                });
            }

            // Generuj ID
            const maxId = specializations.reduce((max, spec) => {
                const idNum = parseInt(spec.id.replace('spec-', ''));
                return idNum > max ? idNum : max;
            }, 0);

            const newSpecialization = {
                id: `spec-${String(maxId + 1).padStart(3, '0')}`,
                name,
                description: description || '',
                category: category || 'other',
                isActive: true,
                dateAdded: new Date().toISOString()
            };

            specializations.push(newSpecialization);

            if (writeSpecializations(specializations)) {
                console.log('✅ Specjalizacja dodana:', newSpecialization.id);
                return res.status(201).json({
                    message: 'Specjalizacja dodana pomyślnie',
                    specialization: newSpecialization
                });
            } else {
                return res.status(500).json({
                    message: 'Błąd podczas dodawania specjalizacji'
                });
            }

        } catch (error) {
            console.error('❌ Błąd dodawania specjalizacji:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy dodawaniu specjalizacji',
                error: error.message
            });
        }
    }

    if (req.method === 'PUT') {
        try {
            console.log('📞 API PUT /api/specializations - aktualizacja specjalizacji:', req.body);

            const specializations = readSpecializations();
            const updatedSpecializations = req.body;

            if (writeSpecializations(updatedSpecializations)) {
                console.log('✅ Specjalizacje zaktualizowane');
                return res.status(200).json({
                    message: 'Specjalizacje zaktualizowane',
                    specializations: updatedSpecializations
                });
            } else {
                return res.status(500).json({
                    message: 'Błąd podczas aktualizacji specjalizacji'
                });
            }

        } catch (error) {
            console.error('❌ Błąd aktualizacji specjalizacji:', error);
            return res.status(500).json({
                message: 'Błąd serwera przy aktualizacji specjalizacji',
                error: error.message
            });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
