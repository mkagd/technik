/**
 * 🔐 PRZYKŁAD IMPLEMENTACJI JWT AUTHENTICATION
 * Pokazuje jak dodać logowanie do systemu
 */

// pages/api/auth/login.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { email, password } = req.body;

  // Sprawdź użytkownika (teraz w accounts.json, później w DB)
  const accounts = JSON.parse(fs.readFileSync('data/accounts.json'));
  const user = accounts.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Sprawdź hasło
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Utwórz token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
}

// middleware/auth.js - Ochrona API
export function requireAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Użycie w chrononym API:
// pages/api/clients.js
import { requireAuth } from '../../middleware/auth';

const handler = async (req, res) => {
  // Tylko autoryzowani użytkownicy dostaną się tutaj
  const clients = readClients();
  res.json({ clients });
};

export default requireAuth(handler); // 🔒 Chronione!