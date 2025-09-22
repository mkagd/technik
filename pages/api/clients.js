// pages/api/clients.js
// API endpoint dla zarządzania klientami (zgodny z ClientsContext)

import {
    readClients,
    addClient,
    updateClient,
    deleteClient,
    logClientContact
} from '../../utils/clientOrderStorage';

export default async function handler(req, res) {
    console.log(`📞 API ${req.method} /api/clients`);

    if (req.method === 'GET') {
        try {
            const clients = readClients();
            console.log(`✅ Returning ${clients.length} clients`);
            return res.status(200).json({ clients });
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

            const newClient = addClient(clientData);
            if (newClient) {
                console.log(`✅ Client added: ${newClient.id} - ${newClient.name}`);
                return res.status(201).json({ client: newClient });
            } else {
                return res.status(500).json({ message: 'Błąd dodawania klienta' });
            }
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

            const updatedClient = updateClient({ id, ...updateData });
            if (updatedClient) {
                console.log(`✅ Client updated: ${updatedClient.id}`);
                return res.status(200).json({ client: updatedClient });
            } else {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }
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

            const success = deleteClient(id);
            if (success) {
                console.log(`✅ Client deleted: ${id}`);
                return res.status(200).json({ message: 'Klient usunięty' });
            } else {
                return res.status(500).json({ message: 'Błąd usuwania klienta' });
            }
        } catch (error) {
            console.error('❌ Error deleting client:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
