// pages/api/client/update-profile.js
// API dla aktualizacji danych profilu klienta

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'client-sessions.json');

const readClients = () => {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading clients.json:', error);
    return [];
  }
};

const saveClients = (clients) => {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving clients.json:', error);
    return false;
  }
};

const readSessions = () => {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading sessions:', error);
    return [];
  }
};

const validateSession = (token) => {
  const sessions = readSessions();
  const session = sessions.find(s => s.token === token && s.isValid);
  
  if (!session) return null;
  
  const expirationTime = 30 * 24 * 60 * 60 * 1000;
  const sessionAge = Date.now() - new Date(session.createdAt).getTime();
  
  if (sessionAge > expirationTime) {
    return null;
  }
  
  return session;
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use PUT.'
    });
  }

  // Sprawdź autoryzację
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Brak tokenu autoryzacji'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const session = validateSession(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy lub wygasły token'
    });
  }

  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({
      success: false,
      message: 'Typ i dane są wymagane'
    });
  }

  try {
    const clients = readClients();
    const clientIndex = clients.findIndex(c => c.id === session.clientId);

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Klient nie znaleziony'
      });
    }

    const client = clients[clientIndex];

    // Aktualizacja danych osobowych
    if (type === 'personal') {
      const { firstName, lastName, email, phone, mobile, additionalPhones } = data;

      // Walidacja
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Wszystkie pola są wymagane'
        });
      }

      // Sprawdź czy email jest unikalny (jeśli zmieniony)
      if (email.toLowerCase() !== client.email.toLowerCase()) {
        const emailExists = clients.find((c, i) => 
          i !== clientIndex && c.email && c.email.toLowerCase() === email.toLowerCase()
        );
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Ten adres email jest już używany przez inne konto'
          });
        }
      }

      // Sprawdź czy telefon jest unikalny (jeśli zmieniony)
      const normalizedPhone = phone.replace(/[\s-]/g, '');
      if (normalizedPhone !== client.phone.replace(/[\s-]/g, '')) {
        const phoneExists = clients.find((c, i) => {
          if (i === clientIndex || !c.phone) return false;
          return c.phone.replace(/[\s-]/g, '') === normalizedPhone;
        });
        if (phoneExists) {
          return res.status(409).json({
            success: false,
            message: 'Ten numer telefonu jest już używany przez inne konto'
          });
        }
      }

      // Aktualizuj dane
      clients[clientIndex].firstName = firstName.trim();
      clients[clientIndex].lastName = lastName.trim();
      clients[clientIndex].name = `${firstName.trim()} ${lastName.trim()}`;
      clients[clientIndex].email = email.toLowerCase().trim();
      clients[clientIndex].phone = phone.trim();
      clients[clientIndex].mobile = mobile.trim() || phone.trim();
      clients[clientIndex].additionalPhones = additionalPhones || [];
      clients[clientIndex].updatedAt = new Date().toISOString();
    }

    // Aktualizacja adresu
    else if (type === 'address') {
      const { street, buildingNumber, apartmentNumber, city, postalCode, additionalAddresses } = data;

      // Walidacja
      if (!street || !buildingNumber || !city || !postalCode) {
        return res.status(400).json({
          success: false,
          message: 'Wszystkie pola oprócz numeru mieszkania są wymagane'
        });
      }

      // Walidacja kodu pocztowego
      const postalRegex = /^\d{2}-\d{3}$/;
      if (!postalRegex.test(postalCode)) {
        return res.status(400).json({
          success: false,
          message: 'Kod pocztowy musi być w formacie XX-XXX'
        });
      }

      // Aktualizuj adres
      clients[clientIndex].address = {
        street: street.trim(),
        buildingNumber: buildingNumber.trim(),
        apartmentNumber: apartmentNumber?.trim() || '',
        city: city.trim(),
        postalCode: postalCode.trim(),
        voivodeship: client.address?.voivodeship || 'podkarpackie',
        country: client.address?.country || 'Polska'
      };
      clients[clientIndex].additionalAddresses = additionalAddresses || [];
      clients[clientIndex].updatedAt = new Date().toISOString();
    }

    // Aktualizacja hasła
    else if (type === 'password') {
      const { currentPassword, newPassword } = data;

      // Walidacja
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Obecne i nowe hasło są wymagane'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Nowe hasło musi mieć minimum 6 znaków'
        });
      }

      // Sprawdź obecne hasło
      const isPasswordValid = await bcrypt.compare(currentPassword, client.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Obecne hasło jest nieprawidłowe'
        });
      }

      // Hashuj nowe hasło
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      clients[clientIndex].passwordHash = newPasswordHash;
      clients[clientIndex].updatedAt = new Date().toISOString();
    }

    else {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy typ aktualizacji. Użyj: personal, address lub password'
      });
    }

    // Zapisz zmiany
    const saved = saveClients(clients);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas zapisywania zmian'
      });
    }

    // Przygotuj dane klienta do wysłania (bez hasła)
    const updatedClient = {
      id: clients[clientIndex].id,
      name: clients[clientIndex].name,
      firstName: clients[clientIndex].firstName,
      lastName: clients[clientIndex].lastName,
      email: clients[clientIndex].email,
      phone: clients[clientIndex].phone,
      mobile: clients[clientIndex].mobile,
      type: clients[clientIndex].type,
      address: clients[clientIndex].address,
      additionalPhones: clients[clientIndex].additionalPhones || [],
      additionalAddresses: clients[clientIndex].additionalAddresses || []
    };

    console.log('✅ Client profile updated:', clients[clientIndex].id, type);

    return res.status(200).json({
      success: true,
      message: '✅ Dane zostały zaktualizowane',
      client: updatedClient
    });

  } catch (error) {
    console.error('❌ Error in /api/client/update-profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
}
