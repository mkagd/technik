/**
 * API Endpoint: Moje Zgłoszenia
 * Zwraca zlecenia użytkownika na podstawie:
 * 1. clientId (dla zalogowanych)
 * 2. phone + address verification (dla niezalogowanych)
 */

import { getOrders } from '../../utils/clientOrderStorage';
import { areAddressesSimilar } from '../../utils/addressNormalizer';

// Rate limiting - max 3 próby na godzinę z tego samego IP
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const attempts = rateLimitStore.get(ip);
  
  // Usuń stare próby
  const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
  rateLimitStore.set(ip, recentAttempts);
  
  if (recentAttempts.length >= 3) {
    return false;
  }
  
  // Dodaj nową próbę
  recentAttempts.push(now);
  rateLimitStore.set(ip, recentAttempts);
  
  return true;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, phone, address } = req.body;

    // Metoda 1: Zalogowany użytkownik (clientId)
    if (clientId) {
      const orders = await getOrders();
      const userOrders = orders.filter(order => order.clientId === clientId);
      
      return res.status(200).json({
        success: true,
        orders: userOrders,
        method: 'authenticated'
      });
    }

    // Metoda 2: Weryfikacja phone + address
    if (phone && address) {
      // Rate limiting
      const clientIP = getClientIP(req);
      if (!checkRateLimit(clientIP)) {
        return res.status(429).json({
          error: 'Too many attempts',
          message: 'Zbyt wiele prób. Spróbuj ponownie za godzinę.',
          retryAfter: 3600
        });
      }

      // Normalizuj telefon
      const normalizedPhone = phone.replace(/\s+/g, '').replace(/^(\+48)?/, '+48');

      // Pobierz wszystkie zlecenia
      const orders = await getOrders();

      // Znajdź zlecenia z pasującym telefonem
      const phoneMatches = orders.filter(order => {
        const orderPhone = order.phone?.replace(/\s+/g, '').replace(/^(\+48)?/, '+48');
        return orderPhone === normalizedPhone;
      });

      if (phoneMatches.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Nie znaleziono zgłoszeń z tym numerem telefonu.'
        });
      }

      // Sprawdź adresy - muszą być wystarczająco podobne (90% threshold)
      const matchedOrders = phoneMatches.filter(order => {
        return areAddressesSimilar(address, order.address, 90);
      });

      if (matchedOrders.length === 0) {
        return res.status(403).json({
          error: 'Verification failed',
          message: 'Adres nie pasuje do zgłoszeń z tym numerem telefonu.'
        });
      }

      return res.status(200).json({
        success: true,
        orders: matchedOrders,
        method: 'phone-address-verification',
        matchCount: matchedOrders.length
      });
    }

    // Brak wymaganych danych
    return res.status(400).json({
      error: 'Bad request',
      message: 'Wymagane: clientId (dla zalogowanych) lub phone + address (weryfikacja)'
    });

  } catch (error) {
    console.error('Error in moje-zgloszenia API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Wystąpił błąd podczas pobierania zgłoszeń.'
    });
  }
}
