// pages/api/admin/test-geo-connection.js
// Test połączenia z różnymi providerami geo

import OSRMProvider from '../../../distance-matrix/providers/OSRMProvider';
import HaversineProvider from '../../../distance-matrix/providers/HaversineProvider';
import GoogleDistanceMatrixProvider from '../../../distance-matrix/providers/GoogleDistanceMatrixProvider';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    const { provider, config } = req.body;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider jest wymagany'
      });
    }
    
    let result;
    
    // Test różnych providerów
    switch (provider) {
      case 'osrm':
        const osrm = new OSRMProvider(config?.distanceMatrix?.osrm || {});
        result = await osrm.testConnection();
        break;
        
      case 'haversine':
        const haversine = new HaversineProvider(config?.distanceMatrix?.haversine || {});
        result = await haversine.testConnection();
        break;
        
      case 'google-matrix':
        const googleMatrix = new GoogleDistanceMatrixProvider(config?.distanceMatrix?.googleMatrix || {});
        result = await googleMatrix.testConnection();
        break;
        
      case 'google-geocoding':
        // Test geocoding - prosty request do Google Geocoding API
        result = await testGoogleGeocoding(config?.geocoding?.googleGeocoding);
        break;
        
      case 'osm-geocoding':
        // Test OSM Nominatim
        result = await testOSMGeocoding(config?.geocoding?.osmGeocoding);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: `Nieznany provider: ${provider}`
        });
    }
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Test connection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Błąd testowania połączenia'
    });
  }
}

/**
 * Test Google Geocoding API
 */
async function testGoogleGeocoding(config) {
  try {
    const start = Date.now();
    const apiKey = config?.apiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Brak API key dla Google Geocoding'
      };
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Kraków,Poland&key=${apiKey}`
    );
    
    const data = await response.json();
    const responseTime = Date.now() - start;
    
    if (data.status === 'OK') {
      return {
        success: true,
        provider: 'google-geocoding',
        responseTime: `${responseTime}ms`,
        message: 'Google Geocoding API działa!',
        sample: data.results[0]?.formatted_address
      };
    } else {
      return {
        success: false,
        provider: 'google-geocoding',
        error: `Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      };
    }
  } catch (error) {
    return {
      success: false,
      provider: 'google-geocoding',
      error: error.message
    };
  }
}

/**
 * Test OSM Nominatim
 */
async function testOSMGeocoding(config) {
  try {
    const start = Date.now();
    const endpoint = config?.endpoint || 'https://nominatim.openstreetmap.org';
    const userAgent = config?.userAgent || 'TechnikAGD/1.0';
    
    const response = await fetch(
      `${endpoint}/search?q=Kraków,Poland&format=json&limit=1`,
      {
        headers: {
          'User-Agent': userAgent
        }
      }
    );
    
    const data = await response.json();
    const responseTime = Date.now() - start;
    
    if (data && data.length > 0) {
      return {
        success: true,
        provider: 'osm-geocoding',
        responseTime: `${responseTime}ms`,
        message: 'OSM Nominatim działa!',
        sample: data[0]?.display_name,
        note: 'Pamiętaj o limicie 1 request/sekundę'
      };
    } else {
      return {
        success: false,
        provider: 'osm-geocoding',
        error: 'Brak wyników z Nominatim'
      };
    }
  } catch (error) {
    return {
      success: false,
      provider: 'osm-geocoding',
      error: error.message
    };
  }
}
