// pages/api/parts.js
// 📦 API endpoint for parts inventory - SUPABASE

import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === 'GET') {
    try {
      const { id, category, search } = req.query;

      // Get specific part by ID
      if (id) {
        const { data: part, error } = await supabase
          .from('parts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error || !part) {
          return res.status(404).json({ 
            error: 'Part not found',
            parts: []
          });
        }
        
        return res.status(200).json(part);
      }

      // Build query
      let query = supabase.from('parts').select('*');

      // Filter by category
      if (category) {
        query = query.eq('category', category);
      }

      // Search by name or SKU
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      // Only active parts by default
      query = query.eq('is_active', true);

      // Order by name
      query = query.order('name', { ascending: true });

      const { data: parts, error } = await query;

      if (error) {
        console.error('Error reading parts inventory:', error);
        return res.status(500).json({ 
          error: 'Server error',
          details: error.message,
          parts: []
        });
      }

      return res.status(200).json({
        success: true,
        parts: parts || [],
        count: parts?.length || 0
      });

    } catch (error) {
      console.error('Error reading parts inventory:', error);
      return res.status(500).json({ 
        error: 'Server error',
        details: error.message,
        parts: []
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const partData = req.body;

      if (!partData.name) {
        return res.status(400).json({ error: 'Part name is required' });
      }

      const newPart = {
        id: partData.id || `PART-${Date.now()}`,
        name: partData.name,
        sku: partData.sku || null,
        category: partData.category || null,
        quantity: partData.quantity || 0,
        min_quantity: partData.min_quantity || partData.minQuantity || 0,
        unit: partData.unit || 'szt',
        purchase_price: partData.purchase_price || partData.purchasePrice || null,
        selling_price: partData.selling_price || partData.sellingPrice || null,
        supplier: partData.supplier || null,
        supplier_code: partData.supplier_code || partData.supplierCode || null,
        description: partData.description || null,
        location: partData.location || null,
        photos: partData.photos || [],
        is_active: partData.is_active !== false,
        metadata: partData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('parts')
        .insert([newPart])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding part:', error);
        return res.status(500).json({ error: 'Failed to add part', details: error.message });
      }

      return res.status(201).json({
        success: true,
        part: data
      });

    } catch (error) {
      console.error('Error adding part:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Part ID is required' });
      }

      const dbUpdate = {
        name: updateData.name,
        sku: updateData.sku,
        category: updateData.category,
        quantity: updateData.quantity,
        min_quantity: updateData.min_quantity || updateData.minQuantity,
        unit: updateData.unit,
        purchase_price: updateData.purchase_price || updateData.purchasePrice,
        selling_price: updateData.selling_price || updateData.sellingPrice,
        supplier: updateData.supplier,
        supplier_code: updateData.supplier_code || updateData.supplierCode,
        description: updateData.description,
        location: updateData.location,
        photos: updateData.photos,
        is_active: updateData.is_active !== undefined ? updateData.is_active : updateData.isActive,
        metadata: updateData.metadata,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdate).forEach(key => 
        dbUpdate[key] === undefined && delete dbUpdate[key]
      );

      const { data: updatedPart, error } = await supabase
        .from('parts')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating part:', error);
        return res.status(500).json({ error: 'Failed to update part', details: error.message });
      }

      if (!updatedPart) {
        return res.status(404).json({ error: 'Part not found' });
      }

      return res.status(200).json({
        success: true,
        part: updatedPart
      });

    } catch (error) {
      console.error('Error updating part:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Part ID is required' });
      }

      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting part:', error);
        return res.status(500).json({ error: 'Failed to delete part', details: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Part deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting part:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
