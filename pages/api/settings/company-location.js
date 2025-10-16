// pages/api/settings/company-location.js
// API endpoint do zarządzania lokalizacją firmy

import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'company-settings.json');

// Domyślna lokalizacja (Kraków)
const DEFAULT_LOCATION = {
  lat: 50.0647,
  lng: 19.9450,
  name: 'Kraków',
  address: 'Kraków, Polska',
  updatedAt: new Date().toISOString()
};

// Upewnij się że folder data istnieje
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Wczytaj lokalizację
function loadCompanyLocation() {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(SETTINGS_FILE)) {
      // Stwórz domyślny plik
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
        companyLocation: DEFAULT_LOCATION
      }, null, 2));
      return DEFAULT_LOCATION;
    }
    
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return data.companyLocation || DEFAULT_LOCATION;
  } catch (error) {
    console.error('❌ Błąd wczytywania lokalizacji firmy:', error);
    return DEFAULT_LOCATION;
  }
}

// Zapisz lokalizację
function saveCompanyLocation(location) {
  try {
    ensureDataDir();
    
    const settings = fs.existsSync(SETTINGS_FILE)
      ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
      : {};
    
    settings.companyLocation = {
      ...location,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('✅ Lokalizacja firmy zapisana:', location.name);
    return settings.companyLocation;
  } catch (error) {
    console.error('❌ Błąd zapisywania lokalizacji firmy:', error);
    throw error;
  }
}

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Pobierz aktualną lokalizację
      const location = loadCompanyLocation();
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
      
      const location = saveCompanyLocation({
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
