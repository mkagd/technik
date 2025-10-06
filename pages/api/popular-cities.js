import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'popular-cities.json');

// Upewnij się, że plik istnieje
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      cities: [
        { name: 'Dębica', postalCode: '39-200' },
        { name: 'Mielec', postalCode: '39-300' }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Odczytaj dane
function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

// Zapisz dane
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Pobierz listę miast
      const data = readData();
      return res.status(200).json({ 
        success: true, 
        cities: data.cities 
      });
    }

    if (req.method === 'POST') {
      // Dodaj nowe miasto
      const { name, postalCode } = req.body;

      if (!name || !postalCode) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nazwa miasta i kod pocztowy są wymagane' 
        });
      }

      const data = readData();
      
      // Sprawdź czy miasto już istnieje
      const exists = data.cities.some(
        city => city.name.toLowerCase() === name.toLowerCase() && 
                city.postalCode === postalCode
      );

      if (exists) {
        return res.status(400).json({ 
          success: false, 
          error: 'To miasto już istnieje na liście' 
        });
      }

      // Dodaj nowe miasto
      data.cities.push({ name: name.trim(), postalCode: postalCode.trim() });
      writeData(data);

      return res.status(200).json({ 
        success: true, 
        message: 'Miasto dodane pomyślnie',
        cities: data.cities 
      });
    }

    if (req.method === 'DELETE') {
      // Usuń miasto po indeksie
      const { index } = req.query;

      if (index === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Indeks jest wymagany' 
        });
      }

      const data = readData();
      const idx = parseInt(index);

      if (idx < 0 || idx >= data.cities.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nieprawidłowy indeks' 
        });
      }

      // Usuń miasto
      data.cities.splice(idx, 1);
      writeData(data);

      return res.status(200).json({ 
        success: true, 
        message: 'Miasto usunięte pomyślnie',
        cities: data.cities 
      });
    }

    // Nieobsługiwana metoda
    return res.status(405).json({ 
      success: false, 
      error: 'Metoda nie jest obsługiwana' 
    });

  } catch (error) {
    console.error('❌ Błąd w API popular-cities:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Błąd serwera' 
    });
  }
}
