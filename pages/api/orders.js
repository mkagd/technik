// pages/api/orders.js
// API endpoint dla zarządzania zamówieniami (zgodny z OrdersContext)

import {
    readOrders,
    addOrder,
    updateOrder,
    patchOrder,
    deleteOrder
} from '../../utils/clientOrderStorage';

export default async function handler(req, res) {
    console.log(`📞 API ${req.method} /api/orders`);

    if (req.method === 'GET') {
        try {
            const orders = readOrders();
            console.log(`✅ Returning ${orders.length} orders`);
            return res.status(200).json({ orders });
        } catch (error) {
            console.error('❌ Error reading orders:', error);
            return res.status(500).json({ message: 'Błąd odczytu zamówień' });
        }
    }

    if (req.method === 'POST') {
        try {
            const orderData = req.body;

            const newOrder = addOrder(orderData);
            if (newOrder) {
                console.log(`✅ Order added: ${newOrder.id}`);
                return res.status(201).json({ order: newOrder });
            } else {
                return res.status(500).json({ message: 'Błąd dodawania zamówienia' });
            }
        } catch (error) {
            console.error('❌ Error adding order:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const updatedOrder = req.body;

            if (!updatedOrder.id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            const result = updateOrder(updatedOrder);
            if (result) {
                console.log(`✅ Order updated: ${result.id}`);
                return res.status(200).json({ order: result });
            } else {
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const { id, ...patch } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            const result = patchOrder(id, patch);
            if (result) {
                console.log(`✅ Order patched: ${result.id}`);
                return res.status(200).json({ order: result });
            } else {
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error patching order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Brak ID zamówienia' });
            }

            const success = deleteOrder(id);
            if (success) {
                console.log(`✅ Order deleted: ${id}`);
                return res.status(200).json({ message: 'Zamówienie usunięte' });
            } else {
                return res.status(500).json({ message: 'Błąd usuwania zamówienia' });
            }
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
