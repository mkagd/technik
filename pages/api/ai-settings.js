// pages/api/ai-settings.js
// API endpoint do zarządzania ustawieniami AI

import fs from 'fs';
import path from 'path';

const AI_SETTINGS_FILE = path.join(process.cwd(), 'data', 'ai-settings.json');

// Domyślne ustawienia AI
const DEFAULT_AI_SETTINGS = {
  openai: true,
  googleVision: false,
  ocrSpace: false,
  tesseract: false,
  primaryProvider: 'openai',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin'
};

// Funkcja do odczytu ustawień AI
function readAISettings() {
  try {
    if (fs.existsSync(AI_SETTINGS_FILE)) {
      const data = fs.readFileSync(AI_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return DEFAULT_AI_SETTINGS;
  } catch (error) {
    console.error('❌ Błąd odczytu ustawień AI:', error);
    return DEFAULT_AI_SETTINGS;
  }
}

// Funkcja do zapisu ustawień AI
function writeAISettings(settings) {
  try {
    // Upewnij się że katalog data istnieje
    const dataDir = path.dirname(AI_SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Dodaj metadata
    const settingsWithMetadata = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin'
    };

    fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(settingsWithMetadata, null, 2));
    console.log('✅ Ustawienia AI zapisane do pliku');
    return true;
  } catch (error) {
    console.error('❌ Błąd zapisu ustawień AI:', error);
    return false;
  }
}

export default function handler(req, res) {
  console.log(`🤖 AI Settings API: ${req.method} ${req.url}`);

  if (req.method === 'GET') {
    // Pobierz aktualne ustawienia AI
    try {
      const settings = readAISettings();
      console.log('📖 Pobrano ustawienia AI:', settings);
      
      res.status(200).json({
        success: true,
        settings: settings,
        message: 'Ustawienia AI pobrane pomyślnie'
      });
    } catch (error) {
      console.error('❌ Błąd pobierania ustawień AI:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd pobierania ustawień AI',
        details: error.message
      });
    }
  } 
  else if (req.method === 'POST') {
    // Zapisz nowe ustawienia AI
    try {
      const newSettings = req.body;
      console.log('💾 Zapisywanie nowych ustawień AI:', newSettings);

      // Walidacja podstawowa
      if (!newSettings || typeof newSettings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowe dane ustawień AI'
        });
      }

      // Sprawdź czy przynajmniej jeden dostawca jest włączony
      const enabledProviders = Object.entries(newSettings)
        .filter(([key, value]) => key !== 'primaryProvider' && key !== 'lastUpdated' && key !== 'updatedBy' && value === true)
        .length;

      if (enabledProviders === 0) {
        return res.status(400).json({
          success: false,
          error: 'Przynajmniej jeden dostawca AI musi być włączony'
        });
      }

      // Sprawdź czy główny dostawca jest włączony
      if (newSettings.primaryProvider && !newSettings[newSettings.primaryProvider]) {
        newSettings[newSettings.primaryProvider] = true;
        console.log(`🔧 Automatycznie włączono głównego dostawcę: ${newSettings.primaryProvider}`);
      }

      // Zapisz ustawienia
      const success = writeAISettings(newSettings);
      
      if (success) {
        const savedSettings = readAISettings();
        console.log('✅ Ustawienia AI zapisane pomyślnie');
        
        res.status(200).json({
          success: true,
          settings: savedSettings,
          message: 'Ustawienia AI zapisane pomyślnie'
        });
      } else {
        throw new Error('Nie udało się zapisać ustawień');
      }
    } catch (error) {
      console.error('❌ Błąd zapisywania ustawień AI:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd zapisywania ustawień AI',
        details: error.message
      });
    }
  }
  else if (req.method === 'DELETE') {
    // Reset ustawień do domyślnych
    try {
      console.log('🔄 Resetowanie ustawień AI do domyślnych');
      
      const success = writeAISettings(DEFAULT_AI_SETTINGS);
      
      if (success) {
        console.log('✅ Ustawienia AI zresetowane pomyślnie');
        res.status(200).json({
          success: true,
          settings: DEFAULT_AI_SETTINGS,
          message: 'Ustawienia AI zresetowane do domyślnych'
        });
      } else {
        throw new Error('Nie udało się zresetować ustawień');
      }
    } catch (error) {
      console.error('❌ Błąd resetowania ustawień AI:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd resetowania ustawień AI',
        details: error.message
      });
    }
  }
  else {
    // Nieobsługiwana metoda HTTP
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({
      success: false,
      error: `Metoda ${req.method} nie jest obsługiwana`
    });
  }
}