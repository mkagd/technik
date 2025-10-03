// API endpoint dla kalkulacji tras w czasie rzeczywistym
// pages/api/calculate-route.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { origin, destination, mode = 'driving' } = req.body;
      
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        // Fallback bez Google Maps API
        return res.status(200).json({
          success: false,
          error: 'Brak klucza Google Maps API',
          fallback: true
        });
      }

      // Wywołanie Google Maps Directions API
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&departure_time=now&traffic_model=best_guess&key=${googleMapsApiKey}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        const routeInfo = {
          distance: Math.round(leg.distance.value / 1000 * 10) / 10, // km z dokładnością do 0.1
          duration: Math.round(leg.duration.value / 60), // minuty
          durationInTraffic: leg.duration_in_traffic ? Math.round(leg.duration_in_traffic.value / 60) : null,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          durationInTrafficText: leg.duration_in_traffic ? leg.duration_in_traffic.text : null,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          trafficInfo: {
            hasTrafficData: !!leg.duration_in_traffic,
            delay: leg.duration_in_traffic ? Math.round((leg.duration_in_traffic.value - leg.duration.value) / 60) : 0,
            conditions: getTrafficConditions(leg.duration_in_traffic, leg.duration)
          },
          polyline: route.overview_polyline.points, // Do rysowania trasy na mapie
          warnings: route.warnings || [],
          copyrights: route.copyrights
        };

        return res.status(200).json({
          success: true,
          route: routeInfo,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(400).json({
          success: false,
          error: `Google Maps API Error: ${data.status}`,
          details: data.error_message || 'Nie można obliczyć trasy'
        });
      }

    } catch (error) {
      console.error('Route calculation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas kalkulacji trasy',
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: `Metoda ${req.method} nie jest obsługiwana` 
    });
  }
}

function getTrafficConditions(durationInTraffic, normalDuration) {
  if (!durationInTraffic) return 'unknown';
  
  const delayRatio = durationInTraffic.value / normalDuration.value;
  
  if (delayRatio < 1.1) return 'light'; // Mały ruch
  if (delayRatio < 1.3) return 'moderate'; // Umiarkowany ruch  
  if (delayRatio < 1.5) return 'heavy'; // Duży ruch
  return 'severe'; // Bardzo duży ruch/korki
}