// API endpoint dla generowania zoptymalizowanej trasy dnia
// pages/api/generate-day-route.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { origin, waypoints, optimizeWaypoints = true } = req.body;
      
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        return res.status(200).json({
          success: false,
          error: 'Brak klucza Google Maps API',
          fallback: true
        });
      }

      // Przygotuj waypoints dla Google Maps API
      const waypointsParam = waypoints.map(wp => wp.location).join('|');
      const destination = waypoints[waypoints.length - 1].location;
      
      // Wywołanie Google Maps Directions API z optymalizacją trasy
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${optimizeWaypoints ? 'optimize:true|' : ''}${waypointsParam}&mode=driving&departure_time=now&traffic_model=best_guess&key=${googleMapsApiKey}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Oblicz całkowitą trasę
        let totalDistance = 0;
        let totalDuration = 0;
        let totalDurationInTraffic = 0;
        
        const legs = route.legs.map((leg, index) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
          totalDurationInTraffic += leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value;
          
          return {
            stepNumber: index + 1,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            distance: Math.round(leg.distance.value / 1000 * 10) / 10,
            duration: Math.round(leg.duration.value / 60),
            durationInTraffic: leg.duration_in_traffic ? Math.round(leg.duration_in_traffic.value / 60) : null,
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
            durationInTrafficText: leg.duration_in_traffic ? leg.duration_in_traffic.text : null
          };
        });

        const routeInfo = {
          totalDistance: Math.round(totalDistance / 1000 * 10) / 10, // km
          totalDuration: Math.round(totalDuration / 60), // minuty
          totalDurationInTraffic: Math.round(totalDurationInTraffic / 60), // minuty z ruchem
          optimizedOrder: data.routes[0].waypoint_order || [], // Zoptymalizowana kolejność waypoints
          legs: legs,
          polyline: route.overview_polyline.points,
          bounds: route.bounds,
          warnings: route.warnings || [],
          copyrights: route.copyrights,
          trafficSummary: {
            totalDelay: Math.round((totalDurationInTraffic - totalDuration) / 60),
            averageSpeed: Math.round((totalDistance / 1000) / (totalDurationInTraffic / 3600) * 10) / 10, // km/h
            conditions: getOverallTrafficConditions(totalDurationInTraffic, totalDuration)
          }
        };

        // Generuj URL do Google Maps z zoptymalizowaną trasą
        const optimizedWaypoints = data.routes[0].waypoint_order ? 
          data.routes[0].waypoint_order.map(i => waypoints[i].location).join('|') :
          waypointsParam;
          
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${optimizedWaypoints}&travelmode=driving`;

        return res.status(200).json({
          success: true,
          route: routeInfo,
          googleMapsUrl: googleMapsUrl,
          timestamp: new Date().toISOString()
        });
        
      } else {
        return res.status(400).json({
          success: false,
          error: `Google Maps API Error: ${data.status}`,
          details: data.error_message || 'Nie można wygenerować trasy dnia'
        });
      }

    } catch (error) {
      console.error('Day route generation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Błąd podczas generowania trasy dnia',
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

function getOverallTrafficConditions(durationInTraffic, normalDuration) {
  const delayRatio = durationInTraffic / normalDuration;
  
  if (delayRatio < 1.1) return 'light';
  if (delayRatio < 1.3) return 'moderate';
  if (delayRatio < 1.5) return 'heavy';
  return 'severe';
}