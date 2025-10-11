// pages/api/distance-matrix/calculate.js
// API endpoint do obliczania odległości z nowym systemem providerów

import { getDistanceMatrixManager } from '../../../distance-matrix/providerManager.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { origin, destination, origins, destinations } = req.body;

    // Walidacja
    if (!origin && !origins) {
      return res.status(400).json({
        success: false,
        message: 'Brak origin lub origins w żądaniu'
      });
    }

    if (!destination && !destinations) {
      return res.status(400).json({
        success: false,
        message: 'Brak destination lub destinations w żądaniu'
      });
    }

    const manager = getDistanceMatrixManager();

    // Tryb 1: Pojedyncza odległość
    if (origin && destination) {
      const result = await manager.calculateDistance(origin, destination);
      
      return res.status(200).json({
        success: true,
        result
      });
    }

    // Tryb 2: Macierz odległości
    if (origins && destinations) {
      const result = await manager.calculateDistanceMatrix(origins, destinations);
      
      return res.status(200).json({
        success: true,
        result
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Nieprawidłowe parametry żądania'
    });

  } catch (error) {
    console.error('❌ Distance matrix calculation error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
