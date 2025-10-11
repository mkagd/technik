// pages/api/rezerwacje/[id].js - API do zarządzania pojedynczą rezerwacją

import { readReservations, updateReservation, deleteReservation } from '../../../utils/dataStorage';
import {
    readClients,
    readOrders,
    writeClients,
    writeOrders
} from '../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        // Pobierz pojedynczą rezerwację
        try {
            const rezerwacje = readReservations();
            const rezerwacja = rezerwacje.find(r => r.id.toString() === id.toString());

            if (!rezerwacja) {
                return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
            }

            return res.status(200).json(rezerwacja);
        } catch (error) {
            console.error('Błąd pobierania rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        // Aktualizuj rezerwację
        try {
            console.log(`📝 Aktualizacja rezerwacji ${id}:`, req.body);

            const rezerwacje = readReservations();
            const index = rezerwacje.findIndex(r => r.id.toString() === id.toString());

            if (index === -1) {
                return res.status(404).json({ message: 'Rezerwacja nie znaleziona' });
            }

            // Zaktualizuj rezerwację
            const updatedReservation = {
                ...rezerwacje[index],
                ...req.body,
                updated_at: new Date().toISOString()
            };

            rezerwacje[index] = updatedReservation;

            // Zapisz zaktualizowane rezerwacje
            const success = updateReservation(id, req.body);

            if (success) {
                // Spróbuj też zaktualizować odpowiadające dane w systemie klient+zamówienie
                try {
                    const clients = readClients();
                    const orders = readOrders();

                    // Znajdź klienta po danych z rezerwacji
                    const clientIndex = clients.findIndex(c =>
                        c.name === updatedReservation.name || c.phone === updatedReservation.phone
                    );

                    if (clientIndex !== -1) {
                        // Aktualizuj dane klienta
                        clients[clientIndex] = {
                            ...clients[clientIndex],
                            name: updatedReservation.name,
                            phone: updatedReservation.phone,
                            email: updatedReservation.email,
                            address: updatedReservation.address,
                            city: updatedReservation.city,
                            street: updatedReservation.street
                        };

                        // Znajdź i zaktualizuj zamówienie
                        const orderIndex = orders.findIndex(o => o.clientId === clients[clientIndex].id);
                        if (orderIndex !== -1) {
                            orders[orderIndex] = {
                                ...orders[orderIndex],
                                category: updatedReservation.category,
                                serviceType: updatedReservation.device,
                                description: updatedReservation.description,
                                availability: updatedReservation.availability,
                                scheduledDate: updatedReservation.date,
                                status: updatedReservation.status,
                                priority: updatedReservation.priority || 'normal'
                            };
                        }

                        // Zapisz zmiany
                        writeClients(clients);
                        writeOrders(orders);
                        console.log('✅ Zaktualizowano powiązane dane klient+zamówienie');
                    }
                } catch (syncError) {
                    console.warn('⚠️ Nie udało się zsynchronizować z systemem klient+zamówienie:', syncError);
                }

                console.log('✅ Rezerwacja zaktualizowana:', updatedReservation);
                return res.status(200).json({
                    message: 'Rezerwacja zaktualizowana',
                    data: updatedReservation
                });
            } else {
                return res.status(500).json({ message: 'Błąd podczas zapisywania' });
            }

        } catch (error) {
            console.error('Błąd aktualizacji rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'DELETE') {
        // Usuń rezerwację
        try {
            console.log(`🗑️ Usuwanie rezerwacji ${id}`);

            const success = deleteReservation(id);

            if (success) {
                console.log('✅ Rezerwacja usunięta');
                return res.status(200).json({ 
                    success: true,
                    message: 'Rezerwacja usunięta' 
                });
            } else {
                return res.status(404).json({ 
                    success: false,
                    message: 'Rezerwacja nie znaleziona' 
                });
            }

        } catch (error) {
            console.error('Błąd usuwania rezerwacji:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Metoda nie obsługiwana' });
}
