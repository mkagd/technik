// pages/api/settings/company-location.js
// API endpoint do zarządzania lokalizacją firmy

import { getServiceSupabase } from '../../../lib/supabase';

// Domyślna lokalizacja (Kraków)
const DEFAULT_LOCATION = {
  lat: 50.0647,
  lng: 19.9450,
  name: 'Kraków',
  address: 'Kraków, Polska',
  updatedAt: new Date().toISOString()
};

// Wczytaj lokalizację z Supabase
async function loadCompanyLocation() {
  try {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'company_location')
      .single();
    
    if (error || !data) {
      // Jeśli nie ma ustawień, zwróć domyślne
      return DEFAULT_LOCATION;
    }
    
    return data.value || DEFAULT_LOCATION;
  } catch (error) {
    console.error('❌ Błąd wczytywania lokalizacji firmy:', error);
    return DEFAULT_LOCATION;
  }
}

// Zapisz lokalizację do Supabase
async function saveCompanyLocation(location) {
  try {
    const supabase = getServiceSupabase();
    
    const locationData = {
      ...location,
      updatedAt: new Date().toISOString()
    };
    
    // Użyj upsert (insert or update)
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key: 'company_location',
        value: locationData,
        category: 'company',
        description: 'Company headquarters location',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Lokalizacja firmy zapisana:', location.name);
    return locationData;
  } catch (error) {
    console.error('❌ Błąd zapisywania lokalizacji firmy:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Pobierz aktualną lokalizację
      const location = await loadCompanyLocation();
      return res.status(200).json(location);
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Zapisz nową lokalizację
      const { lat, lng, name, address } = req.body;
      
      // Walidacja
      if (!lat || !lng) {
        return res.status(400).json({ 
          error: 'Brak współrzędnych (lat, lng)' 
        });
      }
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ 
          error: 'Współrzędne muszą być liczbami' 
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: 'Nieprawidłowe współrzędne GPS' 
        });
      }
      
      const location = await saveCompanyLocation({
        lat,
        lng,
        name: name || 'Siedziba firmy',
        address: address || `${lat}, ${lng}`
      });
      
      return res.status(200).json(location);
      
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('❌ Błąd API company-location:', error);
    return res.status(500).json({ 
      error: 'Błąd serwera',
      message: error.message 
    });
  }
}
