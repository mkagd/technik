// pages/api/clients/[id].js - API do zarządzania pojedynczym klientem

import {
    readClients,
    writeClients,
    readOrders,
    writeOrders
} from '../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        // Pobierz pojedynczego klienta
        try {
            const clients = readClients();
            const client = clients.find(c => c.id === id);

            if (!client) {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }

            // Pobierz też zamówienia klienta
            const orders = readOrders();
            const clientOrders = orders.filter(o => o.clientId === id);

            return res.status(200).json({
                client,
                orders: clientOrders
            });
        } catch (error) {
            console.error('Błąd pobierania klienta:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        // Aktualizuj klienta
        try {
            console.log(`📝 Aktualizacja klienta ${id}:`, req.body);

            const clients = readClients();
            const clientIndex = clients.findIndex(c => c.id === id);

            if (clientIndex === -1) {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }

            // Zaktualizuj dane klienta
            const updatedClient = {
                ...clients[clientIndex],
                ...req.body,
                updated_at: new Date().toISOString()
            };

            clients[clientIndex] = updatedClient;

            // Zapisz zaktualizowanych klientów
            const success = writeClients(clients);

            if (success) {
                console.log('✅ Klient zaktualizowany:', updatedClient);
                return res.status(200).json({
                    message: 'Klient zaktualizowany',
                    client: updatedClient
                });
            } else {
                return res.status(500).json({ message: 'Błąd podczas zapisywania' });
            }

        } catch (error) {
            console.error('Błąd aktualizacji klienta:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'DELETE') {
        // Usuń klienta
        try {
            console.log(`🗑️ Usuwanie klienta ${id}`);

            const clients = readClients();
            const clientIndex = clients.findIndex(c => c.id === id);

            if (clientIndex === -1) {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }

            // Usuń klienta
            const deletedClient = clients[clientIndex];
            clients.splice(clientIndex, 1);

            // Usuń też zamówienia klienta
            const orders = readOrders();
            const updatedOrders = orders.filter(o => o.clientId !== id);

            // Zapisz zmiany
            const clientsSaved = writeClients(clients);
            const ordersSaved = writeOrders(updatedOrders);

            if (clientsSaved && ordersSaved) {
                console.log('✅ Klient i jego zamówienia usunięte');
                return res.status(200).json({
                    message: 'Klient usunięty',
                    deletedClient,
                    deletedOrdersCount: orders.length - updatedOrders.length
                });
            } else {
                return res.status(500).json({ message: 'Błąd podczas usuwania' });
            }

        } catch (error) {
            console.error('Błąd usuwania klienta:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
