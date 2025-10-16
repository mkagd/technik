// pages/api/employees.js - API dla pracowników - SUPABASE

import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
    const supabase = getServiceSupabase();

    if (req.method === 'GET') {
        try {
            console.log('📞 API GET /api/employees - pobieranie danych pracowników');

            const { id, specialization, location, findBest } = req.query;

            // Jeśli podano ID, zwróć pojedynczego pracownika
            if (id) {
                const { data: employee, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error || !employee) {
                    return res.status(404).json({ message: 'Pracownik nie znaleziony' });
                }
                
                return res.status(200).json(employee);
            }

            // Jeśli filtrujemy według specjalizacji
            if (specialization) {
                const { data: employees, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('is_active', true);
                
                if (error) {
                    console.error('❌ Błąd pobierania pracowników:', error);
                    return res.status(500).json({ message: 'Błąd pobierania pracowników' });
                }
                
                // Filter by specialization (if stored in role or metadata)
                const filtered = employees.filter(emp => 
                    emp.role === specialization || 
                    emp.specializations?.includes(specialization)
                );
                
                return res.status(200).json({
                    employees: filtered,
                    specialization,
                    count: filtered.length
                });
            }

            // Pobierz wszystkich pracowników
            const { data: employees, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Błąd pobierania pracowników:', error);
                return res.status(500).json({ message: 'Błąd pobierania pracowników' });
            }

            console.log(`✅ Zwracam ${employees?.length || 0} pracowników`);

            return res.status(200).json({
                employees: employees || [],
                count: employees?.length || 0
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

            const { name, email, phone, specializations, address, workingHours, experience, role } = req.body;

            // Podstawowa walidacja
            if (!name || !phone) {
                console.log('❌ Brak wymaganych danych (name, phone)');
                return res.status(400).json({
                    message: 'Brak wymaganych danych: imię i telefon są wymagane'
                });
            }

            // Sprawdź czy email już istnieje (jeśli podano)
            if (email) {
                const { data: existing } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('email', email)
                    .single();
                
                if (existing) {
                    return res.status(400).json({
                        message: 'Pracownik z takim adresem email już istnieje'
                    });
                }
            }

            const newEmployee = {
                id: `EMP-${Date.now()}`,
                name,
                email: email || null,
                phone,
                role: role || 'technician',
                is_active: true,
                hourly_rate: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('employees')
                .insert([newEmployee])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Błąd dodawania pracownika:', error);
                return res.status(500).json({
                    message: 'Błąd podczas dodawania pracownika',
                    error: error.message
                });
            }

            console.log('✅ Pracownik dodany:', data.id);
            return res.status(201).json({
                message: 'Pracownik dodany pomyślnie',
                employee: data
            });

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
                const { data: existing } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('email', updateData.email)
                    .neq('id', id)
                    .single();
                
                if (existing) {
                    return res.status(400).json({
                        message: 'Pracownik z takim adresem email już istnieje'
                    });
                }
            }

            const dbUpdate = {
                name: updateData.name,
                email: updateData.email,
                phone: updateData.phone,
                role: updateData.role,
                is_active: updateData.isActive !== undefined ? updateData.isActive : updateData.is_active,
                hourly_rate: updateData.hourlyRate || updateData.hourly_rate,
                updated_at: new Date().toISOString()
            };

            // Remove undefined values
            Object.keys(dbUpdate).forEach(key => 
                dbUpdate[key] === undefined && delete dbUpdate[key]
            );

            const { data: updatedEmployee, error } = await supabase
                .from('employees')
                .update(dbUpdate)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Błąd aktualizacji pracownika:', error);
                return res.status(500).json({
                    message: 'Błąd aktualizacji pracownika',
                    error: error.message
                });
            }

            if (!updatedEmployee) {
                return res.status(404).json({
                    message: 'Pracownik nie znaleziony'
                });
            }

            console.log('✅ Pracownik zaktualizowany:', id);
            return res.status(200).json({
                message: 'Pracownik zaktualizowany pomyślnie',
                employee: updatedEmployee
            });

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

            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('❌ Błąd usuwania pracownika:', error);
                return res.status(500).json({
                    message: 'Błąd usuwania pracownika',
                    error: error.message
                });
            }

            console.log('✅ Pracownik usunięty:', id);
            return res.status(200).json({
                message: 'Pracownik usunięty pomyślnie',
                id
            });

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
