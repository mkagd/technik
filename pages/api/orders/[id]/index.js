// pages/api/orders/[id]/index.js
// API endpoint dla operacji na pojedynczym zamówieniu - SUPABASE

import { getServiceSupabase } from '../../../../lib/supabase';

export default async function handler(req, res) {
    const { id } = req.query;
    const supabase = getServiceSupabase();

    if (!id) {
        return res.status(400).json({ message: 'Brak ID zamówienia' });
    }

    console.log(`📞 API ${req.method} /api/orders/${id}`);

    // GET - pobierz pojedyncze zamówienie
    if (req.method === 'GET') {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .select('*')
                .or(`id.eq.${id},order_number.eq.${id}`)
                .single();

            if (error || !order) {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }

            console.log(`✅ Order found: ${order.order_number}`);
            return res.status(200).json(order);
        } catch (error) {
            console.error('❌ Error reading order:', error);
            return res.status(500).json({ message: 'Błąd odczytu zamówienia' });
        }
    }

    // PUT - aktualizuj zamówienie
    if (req.method === 'PUT') {
        try {
            const updateData = {
                ...req.body,
                updated_at: new Date().toISOString()
            };

            // Remove fields that shouldn't be updated
            delete updateData.id;
            delete updateData.created_at;

            const { data: result, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error updating order:', error);
                return res.status(500).json({ message: 'Błąd aktualizacji zamówienia', error: error.message });
            }
            
            if (!result) {
                console.log(`❌ Order not found for update: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }

            console.log(`✅ Order updated: ${result.order_number}`);
            return res.status(200).json({ order: result });
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ message: 'Błąd aktualizacji zamówienia' });
        }
    }

    // DELETE - usuń zamówienie
    if (req.method === 'DELETE') {
        try {
            // Get order before deleting
            const { data: order } = await supabase
                .from('orders')
                .select('id, order_number')
                .or(`id.eq.${id},order_number.eq.${id}`)
                .single();

            if (!order) {
                console.log(`❌ Order not found for deletion: ${id}`);
                return res.status(404).json({ message: 'Zamówienie nie znalezione' });
            }

            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);
            
            if (error) {
                console.log(`❌ Error deleting order: ${id}`);
                return res.status(500).json({ message: 'Błąd usuwania zamówienia', error: error.message });
            }

            console.log(`✅ Order deleted: ${order.order_number}`);
            return res.status(200).json({ 
                message: 'Zamówienie zostało usunięte',
                deleted: {
                    id: order.id,
                    orderNumber: order.order_number
                }
            });
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return res.status(500).json({ message: 'Błąd serwera', error: error.message });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
