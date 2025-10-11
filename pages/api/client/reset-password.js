import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');

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
    console.error('❌ Error saving clients:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token i hasło są wymagane' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' });
    }

    // Znajdź klienta po tokenie
    const clients = await readClients();
    const client = clients.find(c => 
      c.resetToken === token && 
      c.resetTokenExpiry > Date.now()
    );

    if (!client) {
      return res.status(400).json({ 
        error: 'Token jest nieprawidłowy lub wygasł. Spróbuj ponownie.' 
      });
    }

    // Hashuj nowe hasło
    const hashedPassword = await bcrypt.hash(password, 10);

    // Zaktualizuj hasło i usuń token
    client.passwordHash = hashedPassword;
    client.resetToken = null;
    client.resetTokenExpiry = null;
    client.updatedAt = new Date().toISOString();
    saveClients(clients);

    console.log(`✅ Hasło zostało zmienione dla klienta: ${client.email}`);

    res.status(200).json({ 
      message: 'Hasło zostało zmienione pomyślnie!' 
    });

  } catch (error) {
    console.error('❌ Błąd podczas zmiany hasła:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
}
