// pages/api/orders/[id]/index.js
// API endpoint dla operacji na pojedynczym zamówieniu

import { readOrders, updateOrder, deleteOrder } from '../../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Brak ID zamówienia' });
    }

    console.log(`📞 API ${req.method} /api/orders/${id}`);

    // GET - pobierz pojedyncze zamówienie
    if (req.method === 'GET') {
        try {
            const orders = await readOrders();
            const order = orders.find(o => o.id === id || o.orderNumber === id);

            if (order) {
                console.log(`✅ Order found: ${order.orderNumber}`);
                return res.status(200).json(order);
            } else {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error reading order:', error);
            return res.status(500).json({ message: 'Błąd odczytu zamówienia' });
        }
    }

    // PUT - aktualizuj zamówienie
    if (req.method === 'PUT') {
        try {
            const updatedOrder = {
                ...req.body,
                id,
                updatedAt: new Date().toISOString()
            };

            const result = updateOrder(updatedOrder);
            if (result) {
                console.log(`✅ Order updated: ${result.orderNumber}`);
                return res.status(200).json({ order: result });
            } else {
                console.log(`❌ Order not found for update: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    // DELETE - usuń zamówienie
    if (req.method === 'DELETE') {
        try {
            const orders = await readOrders();
            const order = orders.find(o => o.id === id || o.orderNumber === id);

            if (!order) {
                console.log(`❌ Order not found for deletion: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }

            const success = deleteOrder(id);
            if (success) {
                console.log(`✅ Order deleted: ${order.orderNumber} (${order.clientName})`);
                return res.status(200).json({ 
                    message: 'Zamówienie zostało usunięte',
                    deleted: {
                        id: order.id,
                        orderNumber: order.orderNumber,
                        clientName: order.clientName
                    }
                });
            } else {
                console.log(`❌ Error deleting order: ${id}`);
                return res.status(500).json({ message: 'Błąd usuwania zamówienia' });
            }
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return res.status(500).json({ message: 'Błąd serwera', error: error.message });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
