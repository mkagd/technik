// pages/api/clients.js
// API endpoint dla zarządzania klientami - SUPABASE + LOCAL FALLBACK

import { getServiceSupabase } from '../../lib/supabase';
import { readClients } from '../../utils/clientOrderStorage';

export default async function handler(req, res) {
    console.log(`📞 API ${req.method} /api/clients`);
    const supabase = getServiceSupabase();

    if (req.method === 'GET') {
        try {
            const { id } = req.query;
            
            // Jeśli podano ID, zwróć pojedynczego klienta
            if (id) {
                const { data: client, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (!error && client) {
                    console.log(`✅ Returning client from Supabase: ${client.name}`);
                    return res.status(200).json(client);
                }
                
                // Fallback: lokalnie
                const localClients = await readClients();
                const localClient = localClients.find(c => c.id === id || c.id?.toString() === id?.toString());
                if (localClient) {
                    console.log(`✅ Returning client from local: ${localClient.name}`);
                    return res.status(200).json(localClient);
                }
                
                console.log(`❌ Client not found: ${id}`);
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }
            
            // Zwróć wszystkich klientów - Supabase + local
            const { data: supabaseClients = [], error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Dodaj lokalnych klientów którzy nie są w Supabase
            const localClients = await readClients();
            const supabaseIds = new Set(supabaseClients.map(c => c.id));
            const localOnlyClients = localClients.filter(c => !supabaseIds.has(c.id));
            
            const allClients = [...supabaseClients, ...localOnlyClients];
            
            console.log(`✅ Returning ${allClients.length} clients (${supabaseClients.length} from Supabase, ${localOnlyClients.length} local)`);
            return res.status(200).json({ clients: allClients });
        } catch (error) {
            console.error('❌ Error reading clients:', error);
            return res.status(500).json({ message: 'Błąd odczytu klientów' });
        }
    }

    if (req.method === 'POST') {
        try {
            const clientData = req.body;

            if (!clientData.name || !clientData.phone) {
                return res.status(400).json({ message: 'Brak wymaganych danych (name, phone)' });
            }

            // Map frontend format to database schema
            const newClient = {
                id: clientData.id || `CLI-${Date.now()}`,
                name: clientData.name,
                email: clientData.email || null,
                phone: clientData.phone,
                address: clientData.address || clientData.street || null,
                city: clientData.city || null,
                postal_code: clientData.postalCode || null,
                nip: clientData.nip || null,
                company: clientData.company || null,
                notes: clientData.notes || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('clients')
                .insert([newClient])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error adding client:', error);
                return res.status(500).json({ message: 'Błąd dodawania klienta', error: error.message });
            }
            
            console.log(`✅ Client added: ${data.id} - ${data.name}`);
            return res.status(201).json({ client: data });
        } catch (error) {
            console.error('❌ Error adding client:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { id, ...updateData } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID klienta' });
            }

            // Debug: sprawdź co przychodzi
            console.log('📝 Aktualizacja klienta:', {
                id,
                hasPhysicalAvailability: !!updateData.physicalAvailability,
                physicalAvailabilityKeys: updateData.physicalAvailability 
                    ? Object.keys(updateData.physicalAvailability) 
                    : null
            });

            // Map fields to database schema
            const dbUpdate = {
                name: updateData.name,
                email: updateData.email,
                phone: updateData.phone,
                address: updateData.address || updateData.street,
                city: updateData.city,
                postal_code: updateData.postalCode || updateData.postal_code,
                nip: updateData.nip,
                company: updateData.company,
                notes: updateData.notes,
                updated_at: new Date().toISOString()
            };

            // Remove undefined values
            Object.keys(dbUpdate).forEach(key => 
                dbUpdate[key] === undefined && delete dbUpdate[key]
            );

            const { data: updatedClient, error } = await supabase
                .from('clients')
                .update(dbUpdate)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error updating client:', error);
                return res.status(500).json({ message: 'Błąd aktualizacji klienta', error: error.message });
            }
            
            if (!updatedClient) {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }
            
            console.log(`✅ Client updated: ${updatedClient.id}`);
            return res.status(200).json({ client: updatedClient });
        } catch (error) {
            console.error('❌ Error updating client:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji klienta' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID klienta' });
            }

            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('❌ Error deleting client:', error);
                return res.status(500).json({ message: 'Błąd usuwania klienta', error: error.message });
            }
            
            console.log(`✅ Client deleted: ${id}`);
            return res.status(200).json({ message: 'Klient usunięty' });
        } catch (error) {
            console.error('❌ Error deleting client:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
