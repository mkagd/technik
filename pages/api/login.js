// pages/api/login.js - Logowanie użytkowników
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }

  try {
    const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');
    
    // Sprawdź czy plik z kontami istnieje
    if (!fs.existsSync(accountsFilePath)) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    // Wczytaj konta
    const accountsData = fs.readFileSync(accountsFilePath, 'utf8');
    const accounts = JSON.parse(accountsData);

    // Zahashuj podane hasło
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    // Znajdź konto
    const account = accounts.find(acc => 
      acc.email === email && 
      acc.password === hashedPassword && 
      acc.isActive
    );

    if (!account) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    // Zaktualizuj lastLogin
    account.lastLogin = new Date().toISOString();
    
    // Zapisz zaktualizowane konta
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2));

    // Odpowiedź bez hasła
    const { password: _, ...accountResponse } = account;

    return res.status(200).json({
      success: true,
      message: 'Zalogowano pomyślnie!',
      user: accountResponse
    });

  } catch (error) {
    console.error('Błąd logowania:', error);
    return res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
}