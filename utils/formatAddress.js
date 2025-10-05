// utils/formatAddress.js
// Funkcja pomocnicza do formatowania adresu klienta (obsługuje zarówno obiekt jak i string)

/**
 * Formatuje adres klienta - obsługuje zarówno obiekt address jak i string
 * @param {Object|string} address - Adres klienta (obiekt lub string)
 * @returns {string} Sformatowany adres jako string
 */
export function formatAddress(address) {
  // Jeśli adres jest stringiem, zwróć go bezpośrednio
  if (typeof address === 'string') {
    return address;
  }
  
  // Jeśli adres jest obiektem, sformatuj go
  if (typeof address === 'object' && address !== null) {
    const parts = [];
    
    // Ulica z numerem budynku
    if (address.street) {
      let streetPart = address.street;
      if (address.buildingNumber) {
        streetPart += ` ${address.buildingNumber}`;
        if (address.apartmentNumber) {
          streetPart += `/${address.apartmentNumber}`;
        }
      }
      parts.push(streetPart);
    }
    
    // Kod pocztowy i miasto
    const cityPart = [];
    if (address.postalCode) {
      cityPart.push(address.postalCode);
    }
    if (address.city) {
      cityPart.push(address.city);
    }
    if (cityPart.length > 0) {
      parts.push(cityPart.join(' '));
    }
    
    return parts.join(', ');
  }
  
  // Fallback
  return '';
}

/**
 * Formatuje adres dla komponentu React (z obsługą undefined/null)
 * @param {Object|string} address - Adres klienta
 * @param {string} fallback - Tekst zastępczy jeśli brak adresu
 * @returns {string} Sformatowany adres
 */
export function formatAddressOrFallback(address, fallback = 'Brak adresu') {
  const formatted = formatAddress(address);
  return formatted || fallback;
}

/**
 * Pobiera miasto z adresu
 * @param {Object|string} address - Adres klienta
 * @returns {string} Miasto
 */
export function getCityFromAddress(address) {
  if (typeof address === 'string') {
    // Próbuj wyciągnąć miasto z stringa (zakładamy format: "ulica, kod miasto")
    const parts = address.split(',');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].trim();
      // Usuń kod pocztowy (format XX-XXX)
      return lastPart.replace(/^\d{2}-\d{3}\s*/, '').trim();
    }
    return '';
  }
  
  if (typeof address === 'object' && address !== null) {
    return address.city || '';
  }
  
  return '';
}

/**
 * Pobiera ulicę z adresu
 * @param {Object|string} address - Adres klienta
 * @returns {string} Ulica
 */
export function getStreetFromAddress(address) {
  if (typeof address === 'string') {
    // Próbuj wyciągnąć ulicę z stringa (zakładamy format: "ulica, kod miasto")
    const parts = address.split(',');
    if (parts.length > 0) {
      return parts[0].trim();
    }
    return address;
  }
  
  if (typeof address === 'object' && address !== null) {
    let street = address.street || '';
    if (address.buildingNumber) {
      street += ` ${address.buildingNumber}`;
      if (address.apartmentNumber) {
        street += `/${address.apartmentNumber}`;
      }
    }
    return street;
  }
  
  return '';
}

/**
 * Pobiera kod pocztowy z adresu
 * @param {Object|string} address - Adres klienta
 * @returns {string} Kod pocztowy
 */
export function getPostalCodeFromAddress(address) {
  if (typeof address === 'string') {
    // Szukaj kodu pocztowego w formacie XX-XXX
    const match = address.match(/\d{2}-\d{3}/);
    return match ? match[0] : '';
  }
  
  if (typeof address === 'object' && address !== null) {
    return address.postalCode || '';
  }
  
  return '';
}
