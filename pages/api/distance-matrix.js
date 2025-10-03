import { getDistanceMatrixService } from '../../distance-matrix/index.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination are required',
        required: { origin: 'object with lat, lng', destination: 'object with lat, lng' }
      });
    }

    console.log('🚗 Distance Matrix API endpoint called:', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`
    });

    const service = getDistanceMatrixService();
    const result = await service.calculateDistance(origin, destination);

    console.log('✅ Distance calculation successful:', {
      distance: result.distance.km + ' km',
      duration: result.duration.minutes + ' min'
    });

    return res.status(200).json({
      distance: result.distance,
      duration: result.duration,
      status: 'OK'
    });

  } catch (error) {
    console.error('🚨 Distance Matrix API error:', error.message);
    
    return res.status(500).json({ 
      error: 'Distance calculation failed',
      message: error.message,
      status: 'ERROR'
    });
  }
}