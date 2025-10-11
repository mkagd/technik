// pages/api/admin/settings/maps-geo.js
// API endpoint dla ustawień geo/maps

import { loadGeoConfig, saveGeoConfig } from '../../../../utils/geo/geoConfig';

export default async function handler(req, res) {
  try {
    // GET - Pobierz konfigurację
    if (req.method === 'GET') {
      const config = loadGeoConfig();
      
      return res.status(200).json({
        success: true,
        config: config
      });
    }
    
    // POST - Zapisz konfigurację
    if (req.method === 'POST') {
      const { config } = req.body;
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Brak konfiguracji w body'
        });
      }
      
      // Zapisz
      const result = saveGeoConfig(config);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Konfiguracja zapisana pomyślnie'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Błąd zapisu: ${result.error}`
        });
      }
    }
    
    // Nieobsługiwana metoda
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ API error /api/admin/settings/maps-geo:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
