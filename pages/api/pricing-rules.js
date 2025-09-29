// pages/api/pricing-rules.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ścieżka do pliku JSON z regułami cenowymi
    const filePath = path.join(process.cwd(), 'data', 'pricingRules.json');
    
    // Sprawdź czy plik istnieje
    if (!fs.existsSync(filePath)) {
      console.error('Pricing rules file not found:', filePath);
      return res.status(404).json({ error: 'Pricing rules file not found' });
    }

    // Wczytaj zawartość pliku
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const pricingRules = JSON.parse(fileContents);

    console.log('✅ Pricing rules loaded successfully');
    
    // Zwróć dane z odpowiednimi nagłówkami CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'max-age=300'); // Cache na 5 minut
    
    return res.status(200).json(pricingRules);
    
  } catch (error) {
    console.error('Error loading pricing rules:', error);
    return res.status(500).json({ error: 'Failed to load pricing rules' });
  }
}