// API endpoint do obliczania rzeczywistego czasu dojazdu w czasie rzeczywistym
// Używa nowego DistanceMatrixService z folderu /distance-matrix

import { DistanceMatrixService } from '../../distance-matrix/index.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Inicjalizuj DistanceMatrixService
const distanceMatrixService = new DistanceMatrixService({
  googleApiKey: GOOGLE_MAPS_API_KEY,
  enableCache: true
});

// Cache czasów dojazdu aby uniknąć nadmiernego użycia API
const travelTimeCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minut cache

// Rate limiting - zwiększone limity dla intelligent planner
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuta
const MAX_REQUESTS_PER_MINUTE = 50; // Zwiększone z 10 do 50

// Pomocnicza funkcja do tworzenia klucza cache
const getCacheKey = (origin, destination, departureTime) => {
  const originKey = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
  const destinationKey = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
  // Zaokrąglij czas do 15-minutowych bloków dla lepszego cache'owania
  const timeBlock = Math.floor(departureTime / (15 * 60 * 1000)) * (15 * 60 * 1000);
  return `${originKey}->${destinationKey}@${timeBlock}`;
};

// Funkcja do wyczyśzczania starego cache
const cleanOldCache = () => {
  const now = Date.now();
  for (const [key, value] of travelTimeCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      travelTimeCache.delete(key);
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda nie dozwolona' });
  }

  // Rate limiting check
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }
  
  const requests = rateLimitMap.get(clientIP);
  // Wyczyść stare zapytania sprzed minuty
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    // Loguj tylko co 20 błędów żeby nie spamować konsoli
    if (recentRequests.length % 20 === 0) {
      console.log(`🚫 Rate limit exceeded (${recentRequests.length} attempts): ${clientIP} for /api/travel-time`);
    }
    return res.status(429).json({ 
      error: 'Zbyt dużo zapytań, spróbuj ponownie za chwilę',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  // Dodaj aktualne zapytanie
  recentRequests.push(now);
  rateLimitMap.set(clientIP, recentRequests);

  try {
    const { origin, destination, departureTime, trafficModel = 'best_guess' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Brak wymaganych parametrów: origin i destination' 
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Brak Google Maps API Key - używam fallback calculations');
      // Fallback do starych obliczeń jeśli brak API key
      const fallbackTime = calculateFallbackTravelTime(origin, destination);
      return res.json({
        duration: fallbackTime,
        distance: fallbackTime * 0.5, // Przybliżony dystans
        source: 'no_api_key_fallback',
        cached: false,
        trafficDelay: 0
      });
    }

    // Sprawdź cache
    const currentTime = departureTime || Date.now();
    const cacheKey = getCacheKey(origin, destination, currentTime);
    
    cleanOldCache();
    
    if (travelTimeCache.has(cacheKey)) {
      const cached = travelTimeCache.get(cacheKey);
      console.log('✅ Cache hit dla trasy:', cacheKey);
      return res.json({
        ...cached.data,
        cached: true
      });
    }

    // Przygotuj parametry dla Google Maps API
    const originParam = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destinationParam = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
    
    const params = new URLSearchParams({
      origins: originParam,
      destinations: destinationParam,
      key: GOOGLE_MAPS_API_KEY,
      units: 'metric',
      language: 'pl',
      region: 'pl'
    });

    // Dodaj czas wyjazdu dla uwzględnienia korków
    if (departureTime) {
      params.append('departure_time', Math.floor(departureTime / 1000));
      params.append('traffic_model', trafficModel);
    }

    console.log('🌐 Wywołuję DistanceMatrixService dla trasy:', originParam, '->', destinationParam);
    
    // Konwertuj parametry na format oczekiwany przez nasz DistanceMatrixService
    const fromCoords = typeof origin === 'string' ? 
      { lat: 50.0647, lng: 19.9450 } : // fallback dla stringów
      origin;
    const toCoords = typeof destination === 'string' ? 
      { lat: 50.0647, lng: 19.9450 } : // fallback dla stringów
      destination;

    // Użyj naszego DistanceMatrixService
    const distanceResult = await distanceMatrixService.calculateDistance(fromCoords, toCoords, {
      departureTime: departureTime ? new Date(departureTime).toISOString() : 'now',
      trafficModel: trafficModel,
      avoidTolls: false,
      avoidHighways: false
    });

    const result = {
      duration: distanceResult.durationInTraffic?.minutes || distanceResult.duration.minutes,
      distance: distanceResult.distance.km,
      durationText: distanceResult.durationInTraffic?.text || distanceResult.duration.text,
      distanceText: distanceResult.distance.text,
      withTraffic: !!distanceResult.durationInTraffic,
      source: 'distance_matrix_service',
      timestamp: Date.now(),
      trafficDelay: distanceResult.durationInTraffic?.minutes - distanceResult.duration.minutes || 0
    };

    // Zapisz w cache
    travelTimeCache.set(cacheKey, {
      data: { ...result, cached: false },
      timestamp: Date.now()
    });

    console.log('✅ Otrzymano czas dojazdu:', result.duration, 'min,', result.distance, 'km');

    return res.json(result);

  } catch (error) {
    console.error('❌ Google Distance Matrix API failed:', error);
    
    return res.status(500).json({ 
      error: 'Distance calculation failed',
      message: error.message,
      status: 'ERROR'
    });
  }
}