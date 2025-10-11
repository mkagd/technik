import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

/**
 * API endpoint do resetowania hasła administratora
 * POST /api/auth/reset-password
 * 
 * Generuje tymczasowe hasło dla użytkownika
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed'
    });
  }

  try {
    const { email } = req.body;

    // Walidacja
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_EMAIL',
        message: 'Email is required'
      });
    }

    // Sprawdź czy plik z kontami istnieje
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return res.status(404).json({
        success: false,
        error: 'NO_ACCOUNTS',
        message: 'No accounts file found'
      });
    }

    // Wczytaj konta
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    const userIndex = accounts.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      // Nie ujawniamy czy konto istnieje (bezpieczeństwo)
      // Ale zwracamy "sukces" aby nie dać atakującemu informacji
      return res.status(200).json({
        success: true,
        message: 'If account exists, password reset instructions have been sent'
      });
    }

    const user = accounts[userIndex];

    // Sprawdź czy konto jest aktywne
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is deactivated'
      });
    }

    // Wygeneruj tymczasowe hasło (8 znaków, łatwe do przepisania)
    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Zahashuj nowe hasło
    const hashedPassword = bcrypt.hashSync(tempPassword, 12);
    
    // Zaktualizuj konto
    accounts[userIndex].password = hashedPassword;
    accounts[userIndex].passwordResetAt = new Date().toISOString();
    accounts[userIndex].mustChangePassword = true; // Flaga wymuszająca zmianę hasła
    accounts[userIndex].loginAttempts = 0; // Reset prób logowania
    accounts[userIndex].lockedUntil = null; // Odblokuj konto
    
    // Zapisz zmiany
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    
    console.log(`🔐 Password reset for: ${email}`);
    console.log(`🔑 Temporary password: ${tempPassword}`);

    // W prawdziwej aplikacji wysłałbyś email z hasłem
    // Tutaj zwracamy je bezpośrednio (TYLKO DO DEVELOPMENT!)
    return res.status(200).json({
      success: true,
      message: 'Password has been reset',
      resetCode: tempPassword, // W produkcji NIE zwracaj hasła w response!
      warning: 'Save this password! It will not be shown again.'
    });

  } catch (error) {
    console.error('🔐 Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'RESET_ERROR',
      message: 'Internal server error during password reset'
    });
  }
}
