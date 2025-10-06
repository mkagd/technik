// components/NorthQuickSearch.js
// Komponent do wyszukiwania części na North.pl z wyświetlaniem wyników w modalu

import { useState } from 'react';

export default function NorthQuickSearch({ 
  partName, 
  partNumber = null, 
  compact = false, 
  maxResults = 50,
  // Nowe propsy dla urządzeń
  deviceType = null,    // np. "pralka", "lodówka", "zmywarka"
  brand = null,         // np. "Samsung", "Bosch"
  isDevice = false      // czy to urządzenie (true) czy część (false)
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const searchOnNorth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query;
      
      if (isDevice && deviceType && brand) {
        // Dla urządzeń - połącz markę i typ
        query = `${brand} ${deviceType}`;
      } else {
        // Dla części - używaj numeru lub nazwy
        query = partNumber || partName;
      }
      
      const res = await fetch(`/api/north/search?query=${encodeURIComponent(query)}&limit=${maxResults}&isDevice=${isDevice}`);
      const data = await res.json();
      
      if (data.success) {
        setResults(data.results || []);
        setShowModal(true);
      } else {
        setError(data.message || 'Błąd wyszukiwania');
      }
    } catch (err) {
      setError('Nie można połączyć się z API North');
      console.error('North search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNorthDirect = () => {
    let searchUrl;
    
    if (isDevice && deviceType && brand) {
      // Dla urządzeń - używaj kategorii + marka
      const categoryMap = {
        'pralka': 'pralki',
        'lodówka': 'chlodnictwo-lodowki',
        'lodowka': 'chlodnictwo-lodowki',
        'zmywarka': 'zmywarki',
        'piekarnik': 'piekarniki',
        'kuchenka': 'kuchenki',
        'okap': 'okapy',
        'suszarka': 'suszarki'
      };
      
      const category = categoryMap[deviceType.toLowerCase()] || 'catalogsearch/result';
      const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
      
      if (categoryMap[deviceType.toLowerCase()]) {
        // URL kategoria + marka
        searchUrl = `https://north.pl/${category}?manufacturer=${encodeURIComponent(brand)}`;
      } else {
        // Fallback do zwykłego search
        searchUrl = `https://north.pl/catalogsearch/result/?q=${encodeURIComponent(`${brand} ${deviceType}`)}`;
      }
    } else {
      // Dla części - używaj numeru lub nazwy
      const query = partNumber || partName;
      searchUrl = `https://north.pl/catalogsearch/result/?q=${encodeURIComponent(query)}`;
    }
    
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // Tryb kompaktowy - mała ikona 🏪
  if (compact) {
    return (
      <>
        <button 
          onClick={searchOnNorth}
          disabled={loading}
          className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
          title="Wyszukaj na North.pl"
        >
          {loading ? '⏳' : '🏪'}
        </button>

        {/* Modal z wynikami */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" 
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>🏪</span>
                    <span>Wyniki z North.pl</span>
                  </h2>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm mt-2 opacity-90">
                  Wyszukiwanie: <span className="font-semibold">
                    {isDevice && brand && deviceType 
                      ? `${brand} ${deviceType}`
                      : (partNumber || partName)
                    }
                  </span>
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {error ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 dark:text-red-400 mb-4">❌ {error}</div>
                    <button 
                      onClick={openNorthDirect}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Otwórz North.pl w nowej karcie
                    </button>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">Brak wyników</div>
                    <button 
                      onClick={openNorthDirect}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Otwórz North.pl w nowej karcie
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((item, i) => (
                      <a 
                        key={i} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg border border-gray-200 dark:border-gray-600 hover:border-orange-500 transition-all"
                      >
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-40 object-contain mb-3 bg-white rounded"
                          />
                        )}
                        <h3 className="font-medium text-sm mb-2 line-clamp-2 text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        {item.sku && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            SKU: {item.sku}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {item.priceFormatted || `${item.price} zł`}
                          </span>
                          {item.inStock !== undefined && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.inStock
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                            }`}>
                              {item.inStock ? '✓ Dostępne' : 'Sprawdź'}
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Znaleziono: {results.length} ofert
                </span>
                <button 
                  onClick={openNorthDirect}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <span>🏪</span>
                  <span>Otwórz North.pl</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Tryb pełny - pełny przycisk
  return (
    <button 
      onClick={searchOnNorth}
      disabled={loading}
      className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Szukam...</span>
        </>
      ) : (
        <>
          <span>🏪</span>
          <span>Sprawdź na North.pl</span>
        </>
      )}
    </button>
  );
}
