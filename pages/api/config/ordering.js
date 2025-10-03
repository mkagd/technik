import fs from 'fs';
import path from 'path';

const systemConfigPath = path.join(process.cwd(), 'data', 'system-config.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // ============================================
    // GET: Pobierz konfigurację
    // ============================================
    const config = readJSON(systemConfigPath);
    
    if (!config) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać konfiguracji' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      config
    });
    
  } else if (req.method === 'PUT') {
    // ============================================
    // PUT: Aktualizuj konfigurację (tylko admin)
    // ============================================
    const {
      updatedBy,        // ID admina
      ordering,         // Ustawienia zamówień
      delivery,         // Ustawienia dostaw
      suppliers,        // Ustawienia dostawców
      notifications     // Ustawienia notyfikacji
    } = req.body;
    
    if (!updatedBy) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak updatedBy' 
      });
    }
    
    // Odczytaj aktualną konfigurację
    let config = readJSON(systemConfigPath);
    if (!config) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać konfiguracji' 
      });
    }
    
    // Aktualizuj sekcje (tylko te które przyszły)
    if (ordering) {
      config.ordering = {
        ...config.ordering,
        ...ordering
      };
    }
    
    if (delivery) {
      config.delivery = {
        ...config.delivery,
        ...delivery
      };
    }
    
    if (suppliers) {
      config.suppliers = {
        ...config.suppliers,
        ...suppliers
      };
    }
    
    if (notifications) {
      config.notifications = {
        ...config.notifications,
        ...notifications
      };
    }
    
    // Dodaj metadata
    config.lastUpdated = new Date().toISOString();
    config.lastUpdatedBy = updatedBy;
    
    // Zapisz
    if (!writeJSON(systemConfigPath, config)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać konfiguracji' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      config,
      message: 'Konfiguracja zaktualizowana'
    });
    
  } else {
    res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
}
