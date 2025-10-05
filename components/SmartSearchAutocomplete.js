import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

/**
 * SmartSearchAutocomplete Component
 * 
 * Inteligentne wyszukiwanie z autouzupełnianiem:
 * - Fuzzy search (tolerancja na literówki)
 * - Wyszukuje po nazwie, numerze części, markach, modelach
 * - Live suggestions podczas pisania
 * - Nawigacja klawiaturą (↑/↓/Enter/Escape)
 * - Debounce 300ms
 * - Highlighting dopasowanych fragmentów
 * 
 * @param {Array} items - Lista elementów do przeszukania
 * @param {Function} onSearch - Callback wywoływany przy zmianie zapytania
 * @param {Function} onSelect - Callback wywoływany przy wybraniu sugestii
 * @param {string} placeholder - Placeholder dla input
 * @param {string} value - Wartość kontrolowana
 * @param {Function} onChange - Callback dla kontrolowanego inputu
 */
export default function SmartSearchAutocomplete({
  items = [],
  onSearch,
  onSelect,
  placeholder = 'Szukaj części...',
  value = '',
  onChange
}) {
  // POPRAWKA: Nie używaj wewnętrznego state jeśli value jest kontrolowane
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Konfiguracja Fuse.js dla fuzzy search
  const fuse = useMemo(() => {
    if (!items || items.length === 0) return null;
    
    return new Fuse(items, {
      keys: [
        { name: 'name', weight: 2 }, // Najważniejsza nazwa
        { name: 'partNumber', weight: 1.5 },
        { name: 'id', weight: 1 },
        { name: 'compatibleBrands', weight: 0.8 },
        { name: 'compatibleModels', weight: 0.6 },
        { name: 'category', weight: 0.5 },
        { name: 'subcategory', weight: 0.5 }
      ],
      threshold: 0.4, // 0 = perfect match, 1 = match anything
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    });
  }, [items]);

  // Debounced search - używaj value bezpośrednio
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (onSearch) onSearch('');
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, fuse]);

  // Wykonaj wyszukiwanie
  const performSearch = (query) => {
    if (!fuse || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const results = fuse.search(query).slice(0, 5); // Top 5 wyników
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setSelectedIndex(-1);

    if (onSearch) {
      onSearch(query);
    }
  };

  // Obsługa zmiany inputu - przekaż bezpośrednio do parent
  const handleInputChange = (e) => {
    // Nie używaj lokalnego state, tylko wywołaj onChange
    if (onChange) {
      onChange(e);
    }
  };

  // Obsługa klawiszy nawigacyjnych
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex].item);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Wybór sugestii
  const handleSelectSuggestion = (item) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Zaktualizuj wartość przez onChange
    if (onChange) {
      onChange({ target: { value: item.name } });
    }
    
    // Wywołaj callback onSelect
    if (onSelect) {
      onSelect(item);
    }
  };

  // Highlight dopasowanych fragmentów
  const highlightMatch = (text, matches) => {
    if (!matches || matches.length === 0) return text;

    const indices = matches[0].indices;
    const parts = [];
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      // Tekst przed dopasowaniem
      if (start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, start)}
          </span>
        );
      }
      // Dopasowany tekst
      parts.push(
        <span key={`match-${start}`} className="bg-yellow-200 dark:bg-yellow-600 font-semibold">
          {text.substring(start, end + 1)}
        </span>
      );
      lastIndex = end + 1;
    });

    // Pozostały tekst
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  // Zamknij suggestions gdy kliknięto poza
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Clear Button */}
        {value && (
          <button
            onClick={() => {
              setSuggestions([]);
              setShowSuggestions(false);
              if (onChange) onChange({ target: { value: '' } });
              if (onSearch) onSearch('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl
                     max-h-96 overflow-y-auto"
        >
          <div className="py-2">
            {suggestions.map((result, index) => {
              const item = result.item;
              const matches = result.matches;
              const isSelected = index === selectedIndex;

              // Znajdź dopasowania dla głównych pól
              const nameMatch = matches?.find(m => m.key === 'name');
              const partNumberMatch = matches?.find(m => m.key === 'partNumber');

              return (
                <button
                  key={item.id || index}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors duration-150 border-l-4
                             ${isSelected 
                               ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                               : 'border-transparent'
                             }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Miniaturka zdjęcia */}
                    {(item.images?.[0]?.url || item.imageUrl) && (
                      <img
                        src={item.images?.[0]?.url || item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Nazwa części z highlightingiem */}
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {nameMatch 
                          ? highlightMatch(item.name, [nameMatch])
                          : item.name
                        }
                      </div>

                      {/* Numer części */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {partNumberMatch
                          ? highlightMatch(item.partNumber, [partNumberMatch])
                          : item.partNumber
                        }
                      </div>

                      {/* Kategoria i ID */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.subcategory && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {item.subcategory}
                          </span>
                        )}
                        <span>{item.id}</span>
                      </div>

                      {/* Score (tylko dla rozwoju) */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 mt-1">
                          Score: {(1 - result.score).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Cena */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {item.pricing?.retailPrice || 0} zł
                      </div>
                      {item.availability?.available !== undefined && (
                        <div className={`text-xs ${
                          item.availability.available > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Stan: {item.availability.available}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keyboard Hints */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">↑↓</kbd>
                {' '}nawigacja
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">Enter</kbd>
                {' '}wybierz
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">Esc</kbd>
                {' '}zamknij
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && inputValue.trim().length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 
                       border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Nie znaleziono części</p>
            <p className="text-sm mt-1">Spróbuj użyć innych słów kluczowych</p>
          </div>
        </div>
      )}
    </div>
  );
}
