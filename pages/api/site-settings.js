import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'site-settings.json');

export default async function handler(req, res) {
  // Uwaga: Podobnie jak inne API w systemie (rezerwacje, zamówienia),
  // nie wymaga autoryzacji - zakładamy że panel admin jest chroniony na poziomie routingu
  
  try {
    if (req.method === 'GET') {
      // Odczyt ustawień - publiczny
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      
      return res.status(200).json({ 
        success: true, 
        settings 
      });
    }

    if (req.method === 'PUT') {
      // Zapis ustawień - tylko admin
      const updatedSettings = {
        ...req.body,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(
        SETTINGS_FILE,
        JSON.stringify(updatedSettings, null, 2),
        'utf-8'
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Ustawienia zapisane pomyślnie',
        settings: updatedSettings
      });
    }

    return res.status(405).json({ 
      success: false, 
      message: 'Metoda nieobsługiwana' 
    });

  } catch (error) {
    console.error('Błąd API site-settings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera',
      error: error.message 
    });
  }
}
