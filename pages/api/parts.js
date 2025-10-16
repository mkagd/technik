// pages/api/parts.js
// 📦 API endpoint for parts inventory

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const partsPath = path.join(process.cwd(), 'data', 'parts-inventory.json');
    
    if (!fs.existsSync(partsPath)) {
      return res.status(404).json({ 
        error: 'Parts inventory file not found',
        parts: []
      });
    }

    const data = fs.readFileSync(partsPath, 'utf-8');
    const inventory = JSON.parse(data);

    // Return parts array
    return res.status(200).json({
      success: true,
      parts: inventory.parts || [],
      count: (inventory.parts || []).length
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
