/**
 * React Hook dla serwisu kodów pocztowych
 * Klient-side hook - wywołuje API endpoint
 * 
 * @module lib/postal-code/usePostalCode
 */

import { useState, useCallback } from 'react';

/**
 * Hook do wyszukiwania miast po kodzie pocztowym
 * @returns {Object} Obiekt z funkcjami i stanem
 */
export function usePostalCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [stats] = useState({
    cacheSize: 0,
    googleRequests: 0,
    googleLimit: 1000,
    googleEnabled: true,
    osmEnabled: true,
    googleUsagePercent: 0
  });

  /**
   * Wyszukuje miasto po kodzie pocztowym przez API
   * @param {string} postalCode - Kod pocztowy (format: "00-001" lub "00001")
   * @returns {Promise<Object|null>} Obiekt z miastem i województwem lub null
   */
  const getCityFromPostalCode = useCallback(async (postalCode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/postal-code-lookup?code=${encodeURIComponent(postalCode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Nie znaleziono miasta dla podanego kodu pocztowego');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result) {
        setLastResult(result);
        return result;
      } else {
        setError('Nie znaleziono miasta dla podanego kodu pocztowego');
        return null;
      }
    } catch (err) {
      const errorMessage = err?.message || 'Nieznany błąd podczas wyszukiwania';
      setError(errorMessage);
      console.error('usePostalCode error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Czyści cache (placeholder - funkcjonalność dostępna tylko po stronie serwera)
   */
  const clearCache = useCallback(() => {
    console.log('clearCache - funkcjonalność dostępna tylko po stronie serwera');
  }, []);

  return {
    getCityFromPostalCode,
    isLoading,
    error,
    stats,
    lastResult,
    clearCache
  };
}

export default usePostalCode;
