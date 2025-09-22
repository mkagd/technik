// pages/api/clients/[id]/contact.js
// API endpoint dla logowania kontaktów z klientami

import { logClientContact } from '../../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;

    console.log(`📞 API ${req.method} /api/clients/${id}/contact`);

    if (req.method === 'POST') {
        try {
            const { type, source } = req.body;

            if (!type) {
                return res.status(400).json({ message: 'Brak typu kontaktu (type)' });
            }

            const updatedClient = logClientContact(id, type, source || 'WebApp');

            if (updatedClient) {
                console.log(`✅ Contact logged for client ${id}: ${type}`);
                return res.status(200).json({
                    message: 'Kontakt zapisany w historii',
                    client: updatedClient
                });
            } else {
                return res.status(404).json({ message: 'Klient nie znaleziony' });
            }
        } catch (error) {
            console.error('❌ Error logging contact:', error);
            return res.status(500).json({ message: 'Błąd zapisywania kontaktu' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
