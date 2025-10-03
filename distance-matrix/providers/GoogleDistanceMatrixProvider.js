// distance-matrix/providers/GoogleDistanceMatrixProvider.js
// Google Distance Matrix API provider dla rzeczywistych odległości i czasów dojazdu

/**
 * 🚗 GoogleDistanceMatrixProvider - rzeczywiste odległości drogowe
 * 
 * Funkcjonalności:
 * - Rzeczywiste odległości drogowe (nie linia prosta)
 * - Uwzględnienie ruchu drogowego
 * - Różne tryby transportu (driving, walking, transit)
 * - Batch processing dla wydajności
 * - Optymalizacja tras
 */
export default class GoogleDistanceMatrixProvider {
  constructor(config = {}) {
    this.apiKey = config.googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    
    this.config = {
      mode: config.mode || 'driving', // driving, walking, bicycling, transit
      avoid: config.avoid || [], // tolls, highways, ferries, indoor
      units: config.units || 'metric', // metric, imperial
      language: config.language || 'pl',
      region: config.region || 'pl',
      
      // Traffic model dla uwzględnienia ruchu
      departureTime: config.departureTime || 'now',
      trafficModel: config.trafficModel || 'best_guess', // best_guess, pessimistic, optimistic
      
      // Limits dla batch processing
      maxElements: config.maxElements || 25, // Google limit: 25 destinations per request
      maxOrigins: config.maxOrigins || 10   // Google limit: 10 origins per request
    };

    if (!this.apiKey) {
      throw new Error('Google Maps API key is required for Distance Matrix');
    }

    console.log('🚗 GoogleDistanceMatrixProvider initialized:', {
      mode: this.config.mode,
      trafficModel: this.config.trafficModel,
      maxElements: this.config.maxElements
    });
  }

  /**
   * 🎯 Główna metoda - oblicz odległości i czasy między punktami
   * @param {Array} origins - Punkty startowe [{lat, lng}] lub adresy
   * @param {Array} destinations - Punkty docelowe [{lat, lng}] lub adresy
   * @param {Object} options - Dodatkowe opcje
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    try {
      // Walidacja input
      if (!origins || !destinations || !origins.length || !destinations.length) {
        throw new Error('Origins and destinations are required');
      }

      console.log(`🚗 Distance Matrix request: ${origins.length} origins → ${destinations.length} destinations`);

      // Przygotuj parametry URL
      const params = this.buildRequestParams(origins, destinations, options);
      const url = `${this.baseUrl}?${params.toString()}`;

      console.log('🌐 Distance Matrix URL:', url);

      // Wykonaj request
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Sprawdź status Google API
      if (data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      // Przetworz wyniki
      const result = this.processResponse(data, origins, destinations);
      
      console.log('✅ Distance Matrix success:', {
        originCount: result.origins.length,
        destinationCount: result.destinations.length,
        totalElements: result.rows.reduce((sum, row) => sum + row.elements.length, 0)
      });

      return result;

    } catch (error) {
      console.error('🚨 Distance Matrix error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Szybka metoda dla jednej pary punktów
   */
  async calculateSingleDistance(origin, destination, options = {}) {
    const result = await this.calculateDistanceMatrix([origin], [destination], options);
    
    if (result.rows[0]?.elements[0]?.status === 'OK') {
      return result.rows[0].elements[0];
    } else {
      throw new Error('Failed to calculate distance for single pair');
    }
  }

  /**
   * 🎯 Batch processing dla dużych macierzy
   */
  async calculateLargeDistanceMatrix(origins, destinations, options = {}) {
    const results = [];
    
    // Podziel na batche zgodnie z limitami Google
    const originBatches = this.chunkArray(origins, this.config.maxOrigins);
    const destBatches = this.chunkArray(destinations, this.config.maxElements);

    console.log(`📦 Large matrix batching: ${originBatches.length} origin batches × ${destBatches.length} dest batches`);

    for (let i = 0; i < originBatches.length; i++) {
      for (let j = 0; j < destBatches.length; j++) {
        try {
          // Opóźnienie między requestami dla rate limiting
          if (i > 0 || j > 0) {
            await new Promise(resolve => setTimeout(resolve, options.delayBetweenRequests || 100));
          }

          const batchResult = await this.calculateDistanceMatrix(
            originBatches[i], 
            destBatches[j], 
            options
          );

          results.push({
            originBatchIndex: i,
            destBatchIndex: j,
            result: batchResult
          });

        } catch (error) {
          console.warn(`⚠️ Batch [${i},${j}] failed:`, error.message);
          // Kontynuuj z innymi batchami
        }
      }
    }

    // Scal wyniki
    return this.mergeMatrixResults(results, origins.length, destinations.length);
  }

  /**
   * 🛠️ Budowanie parametrów URL
   */
  buildRequestParams(origins, destinations, options) {
    const params = new URLSearchParams();
    
    // Origins i destinations
    params.append('origins', this.formatLocations(origins));
    params.append('destinations', this.formatLocations(destinations));
    
    // API key
    params.append('key', this.apiKey);
    
    // Podstawowe parametry
    params.append('mode', options.mode || this.config.mode);
    params.append('units', options.units || this.config.units);
    params.append('language', options.language || this.config.language);
    params.append('region', options.region || this.config.region);

    // Unikanie (tolls, highways, etc.)
    const avoid = options.avoid || this.config.avoid;
    if (avoid.length > 0) {
      params.append('avoid', avoid.join('|'));
    }

    // Traffic model dla uwzględnienia ruchu (tylko dla driving mode)
    if ((options.mode || this.config.mode) === 'driving') {
      const departureTime = options.departureTime || this.config.departureTime;
      if (departureTime === 'now') {
        params.append('departure_time', 'now');
      } else if (typeof departureTime === 'number') {
        params.append('departure_time', departureTime.toString());
      }
      
      params.append('traffic_model', options.trafficModel || this.config.trafficModel);
    }

    return params;
  }

  /**
   * 🛠️ Formatowanie lokalizacji dla Google API
   */
  formatLocations(locations) {
    return locations.map(loc => {
      if (typeof loc === 'string') {
        return encodeURIComponent(loc);
      } else if (loc.lat && loc.lng) {
        return `${loc.lat},${loc.lng}`;
      } else {
        throw new Error('Invalid location format. Use {lat, lng} or address string.');
      }
    }).join('|');
  }

  /**
   * 🛠️ Przetwarzanie odpowiedzi Google API
   */
  processResponse(data, origins, destinations) {
    const result = {
      origins: data.origin_addresses || origins,
      destinations: data.destination_addresses || destinations,
      rows: [],
      summary: {
        totalRequests: origins.length * destinations.length,
        successfulRequests: 0,
        failedRequests: 0
      }
    };

    data.rows.forEach((row, originIndex) => {
      const processedRow = {
        elements: []
      };

      row.elements.forEach((element, destIndex) => {
        const processedElement = {
          status: element.status,
          originIndex,
          destinationIndex: destIndex
        };

        if (element.status === 'OK') {
          processedElement.distance = {
            text: element.distance.text,
            value: element.distance.value, // meters
            km: Math.round(element.distance.value / 1000 * 100) / 100 // km rounded to 2 decimals
          };

          processedElement.duration = {
            text: element.duration.text,
            value: element.duration.value, // seconds
            minutes: Math.round(element.duration.value / 60)
          };

          // Duration in traffic (jeśli dostępne)
          if (element.duration_in_traffic) {
            processedElement.durationInTraffic = {
              text: element.duration_in_traffic.text,
              value: element.duration_in_traffic.value,
              minutes: Math.round(element.duration_in_traffic.value / 60)
            };

            // Opóźnienie z powodu ruchu
            processedElement.trafficDelay = {
              seconds: element.duration_in_traffic.value - element.duration.value,
              minutes: Math.round((element.duration_in_traffic.value - element.duration.value) / 60)
            };
          }

          result.summary.successfulRequests++;
        } else {
          processedElement.error = element.status;
          result.summary.failedRequests++;
        }

        processedRow.elements.push(processedElement);
      });

      result.rows.push(processedRow);
    });

    return result;
  }

  /**
   * 🛠️ Utility methods
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  mergeMatrixResults(batchResults, totalOrigins, totalDestinations) {
    // Implementacja scalania wyników z różnych batchów
    // TODO: Zaimplementować gdy będzie potrzebne dla bardzo dużych macierzy
    console.log('📊 Merging matrix results from', batchResults.length, 'batches');
    return batchResults[0]?.result || null;
  }

  /**
   * 📊 Statystyki użycia API
   */
  getUsageStats() {
    return {
      provider: 'google-distance-matrix',
      config: {
        mode: this.config.mode,
        trafficModel: this.config.trafficModel,
        units: this.config.units
      },
      limits: {
        maxElements: this.config.maxElements,
        maxOrigins: this.config.maxOrigins
      }
    };
  }
}