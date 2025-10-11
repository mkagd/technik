// pages/api/orders/[id].js
// API endpoint dla operacji na pojedynczym zleceniu

import {
    readOrders,
    updateOrder,
    patchOrder,
    deleteOrder
} from '../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;
    
    console.log(`📞 API ${req.method} /api/orders/${id}`);

    if (req.method === 'GET') {
        try {
            const orders = await readOrders();
            const order = orders.find(o => o.id == id || o.orderNumber == id);
            
            if (order) {
                console.log(`✅ Found order: ${order.orderNumber}`);
                return res.status(200).json({ 
                    success: true,
                    order 
                });
            } else {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error reading order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd odczytu zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const updateData = req.body;
            console.log(`📝 Patching order ${id} with:`, updateData);
            
            const orders = await readOrders();
            const orderIndex = orders.findIndex(o => o.id == id || o.orderNumber == id);
            
            if (orderIndex === -1) {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
            
            // Zaktualizuj tylko podane pola
            const updatedOrder = {
                ...orders[orderIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            // Zapisz przy użyciu patchOrder
            const success = await patchOrder(id, updateData);
            
            if (success) {
                console.log(`✅ Order ${id} patched successfully`);
                return res.status(200).json({ 
                    success: true,
                    order: updatedOrder,
                    message: 'Zamówienie zaktualizowane'
                });
            } else {
                console.error(`❌ Failed to patch order ${id}`);
                return res.status(500).json({ 
                    success: false,
                    message: 'Błąd aktualizacji zamówienia' 
                });
            }
        } catch (error) {
            console.error('❌ Error patching order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd aktualizacji zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'PUT') {
        try {
            const orderData = req.body;
            console.log(`📝 Updating order ${id}`);
            
            // Pełna aktualizacja zamówienia
            orderData.updatedAt = new Date().toISOString();
            
            const success = await updateOrder(id, orderData);
            
            if (success) {
                console.log(`✅ Order ${id} updated successfully`);
                return res.status(200).json({ 
                    success: true,
                    order: orderData,
                    message: 'Zamówienie zaktualizowane'
                });
            } else {
                console.error(`❌ Failed to update order ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd aktualizacji zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'DELETE') {
        try {
            console.log(`🗑️ Deleting order ${id}`);
            
            const success = await deleteOrder(id);
            
            if (success) {
                console.log(`✅ Order ${id} deleted successfully`);
                return res.status(200).json({ 
                    success: true,
                    message: 'Zamówienie usunięte'
                });
            } else {
                console.error(`❌ Failed to delete order ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd usuwania zamówienia',
                error: error.message
            });
        }
    }

    // Nieobsługiwana metoda
    res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
    return res.status(405).json({ 
        success: false,
        message: `Metoda ${req.method} nie jest obsługiwana` 
    });
}
