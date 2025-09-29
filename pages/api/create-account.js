// pages/api/create-account.js - Tworzenie prawdziwych kont użytkowników
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { name, email, phone, password, address, city, street } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Imię, email i hasło są wymagane' });
  }

  try {
    const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');
    
    // Wczytaj istniejące konta
    let accounts = [];
    if (fs.existsSync(accountsFilePath)) {
      const accountsData = fs.readFileSync(accountsFilePath, 'utf8');
      accounts = JSON.parse(accountsData);
    }

    // Sprawdź czy email już istnieje
    const existingAccount = accounts.find(acc => acc.email === email);
    if (existingAccount) {
      return res.status(400).json({ error: 'Konto z tym emailem już istnieje!' });
    }

    // Zahashuj hasło (prosty hash MD5 - w produkcji użyj bcrypt)
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    // Stwórz nowe konto
    const newAccount = {
      id: `ACC${Date.now()}`,
      name: name,
      email: email,
      phone: phone || '',
      password: hashedPassword,
      address: address || '',
      city: city || '',
      street: street || '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    // Dodaj do listy kont
    accounts.push(newAccount);

    // Zapisz do pliku
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2));

    // Odpowiedź bez hasła
    const { password: _, ...accountResponse } = newAccount;

    return res.status(200).json({
      success: true,
      message: 'Konto zostało utworzone pomyślnie!',
      account: accountResponse
    });

  } catch (error) {
    console.error('Błąd tworzenia konta:', error);
    return res.status(500).json({ error: 'Błąd serwera podczas tworzenia konta' });
  }
}