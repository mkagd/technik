import fs from 'fs';
import path from 'path';
import { optionalAuth } from '../../../middleware/auth.js';

const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');

/**
 * API endpoint do zarządzania kontami użytkowników
 * Tylko dla administratorów
 */
export default async function handler(req, res) {
  // Sprawdź autoryzację
  await new Promise((resolve, reject) => {
    optionalAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  // Tylko admin może zarządzać kontami
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Only administrators can manage accounts'
    });
  }

  try {
    if (req.method === 'GET') {
      // Pobierz listę kont
      if (!fs.existsSync(ACCOUNTS_FILE)) {
        return res.status(404).json({
          success: false,
          error: 'NO_ACCOUNTS',
          message: 'No accounts file found'
        });
      }

      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
      
      // Usuń hasła z odpowiedzi
      const sanitizedAccounts = accounts.map(acc => {
        const { password, ...rest } = acc;
        return rest;
      });

      return res.status(200).json({
        success: true,
        accounts: sanitizedAccounts
      });
    }

    if (req.method === 'POST') {
      // Dodaj nowe konto (TODO)
      return res.status(501).json({
        success: false,
        error: 'NOT_IMPLEMENTED',
        message: 'Account creation not yet implemented'
      });
    }

    if (req.method === 'PUT') {
      // Edytuj konto (TODO)
      return res.status(501).json({
        success: false,
        error: 'NOT_IMPLEMENTED',
        message: 'Account editing not yet implemented'
      });
    }

    if (req.method === 'DELETE') {
      // Usuń konto (TODO)
      return res.status(501).json({
        success: false,
        error: 'NOT_IMPLEMENTED',
        message: 'Account deletion not yet implemented'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('🔐 Accounts API error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Internal server error'
    });
  }
}
