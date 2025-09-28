// utils/geocoding.js
// Utility functions for converting addresses to coordinates

export const geocodeAddress = async (address) => {
  try {
    // Using OpenStreetMap Nominatim API (free)
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=pl`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&countrycodes=pl`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country
      };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};