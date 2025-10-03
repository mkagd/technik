// components/AddressAutocomplete.js
// Prosty komponent do wyszukiwania adresów z Google Geocoder

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiMapPin, FiLoader } from 'react-icons/fi';
import GoogleGeocoder from '../geocoding/simple/GoogleGeocoder.js';

const AddressAutocomplete = ({ 
  value = '', 
  onChange, 
  placeholder = 'Wpisz adres (np. ul. Floriańska 3, Kraków)',
  className = '',
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Inicjalizuj geocoder
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      geocoderRef.current = new GoogleGeocoder(apiKey);
    } else {
      console.warn('⚠️ Google API Key not found in environment variables');
    }
  }, []);

  // Aktualizuj input gdy value się zmieni z zewnątrz
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search
  const searchAddresses = async (query) => {
    if (!query.trim() || query.length < 3 || !geocoderRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    
    try {
      // Dla prostoty - użyjemy tylko jednego zapytania do Google
      // W pełnej wersji można by dodać suggestions API
      const result = await geocoderRef.current.geocode(query);
      
      setSuggestions([{
        id: 1,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
        confidence: result.confidence,
        components: result.components
      }]);
      setShowSuggestions(true);
      
    } catch (error) {
      console.warn('Geocoding search failed:', error.message);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 500); // 500ms delay
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Wywołaj callback z pełnymi danymi
    if (onChange) {
      onChange({
        address: suggestion.address,
        lat: suggestion.lat,
        lng: suggestion.lng,
        coordinates: [suggestion.lng, suggestion.lat], // [lng, lat] format
        confidence: suggestion.confidence,
        components: suggestion.components
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle direct geocoding on Enter
  const handleDirectGeocode = async () => {
    if (!inputValue.trim() || !geocoderRef.current) return;

    setLoading(true);
    try {
      const result = await geocoderRef.current.geocode(inputValue);
      
      if (onChange) {
        onChange({
          address: result.address,
          lat: result.lat,
          lng: result.lng,
          coordinates: [result.lng, result.lat],
          confidence: result.confidence,
          components: result.components
        });
      }
      
      setInputValue(result.address);
      
    } catch (error) {
      console.error('Direct geocoding failed:', error.message);
      // Możesz dodać toast notification tutaj
    } finally {
      setLoading(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {/* Loading/Search icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <FiLoader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <button
              onClick={handleDirectGeocode}
              disabled={disabled || loading}
              className="p-1 text-gray-400 hover:text-blue-500 disabled:cursor-not-allowed"
              title="Wyszukaj adres"
            >
              <FiSearch className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <FiMapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.address}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                    {suggestion.confidence && (
                      <span className="ml-2">
                        🎯 {(suggestion.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No API key warning */}
      {!geocoderRef.current && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ Google API Key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;