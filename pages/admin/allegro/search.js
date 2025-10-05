import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import DarkModeToggle from '../../../components/DarkModeToggle';

export default function AllegroSearch() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [allegroResults, setAllegroResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [localParts, setLocalParts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc, price-desc, name
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);

  useEffect(() => {
    loadLocalParts();
  }, []);

  const loadLocalParts = async () => {
    try {
      const res = await fetch('/api/inventory/parts');
      const data = await res.json();
      setLocalParts(data.parts || []);
    } catch (error) {
      console.error('Error loading local parts:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Wpisz nazwę części do wyszukania!');
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: '50',
      });

      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`/api/allegro/search?${params}`);
      const data = await res.json();

      if (data.success) {
        let results = data.results || [];

        // Check if demo mode
        setIsDemoMode(data.demo || false);

        // Apply filters
        if (freeDeliveryOnly) {
          results = results.filter(item => item.delivery.free);
        }

        // Sort results
        results.sort((a, b) => {
          if (sortBy === 'price-asc') {
            return parseFloat(a.price.amount) - parseFloat(b.price.amount);
          } else if (sortBy === 'price-desc') {
            return parseFloat(b.price.amount) - parseFloat(a.price.amount);
          } else if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
          }
          return 0;
        });

        setAllegroResults(results);
        setShowComparison(true);
        setSelectedItems([]);
      } else {
        alert('Błąd wyszukiwania: ' + data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Błąd połączenia z Allegro API');
    } finally {
      setSearching(false);
    }
  };

  const toggleSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const findSimilarLocalPart = (allegroName) => {
    const allegroWords = allegroName.toLowerCase().split(' ').filter(w => w.length > 3);
    
    return localParts.find(part => {
      const partName = part.name.toLowerCase();
      return allegroWords.some(word => partName.includes(word));
    });
  };

  const generateShoppingList = () => {
    const selected = allegroResults.filter(item => selectedItems.includes(item.id));
    
    if (selected.length === 0) {
      alert('Zaznacz przynajmniej jedną część!');
      return;
    }

    const total = selected.reduce((sum, item) => sum + parseFloat(item.price.amount), 0);
    
    let content = '='.repeat(60) + '\n';
    content += '              LISTA ZAKUPÓW - ALLEGRO\n';
    content += '='.repeat(60) + '\n\n';
    content += `Data: ${new Date().toLocaleString('pl-PL')}\n`;
    content += `Ilość części: ${selected.length}\n\n`;
    
    selected.forEach((item, idx) => {
      content += `${idx + 1}. ${item.name}\n`;
      content += `   Cena: ${item.price.amount} ${item.price.currency}\n`;
      content += `   Dostawa: ${item.delivery.free ? 'DARMOWA ✓' : item.delivery.price + ' PLN'}\n`;
      content += `   Sprzedawca: ${item.seller.login}${item.seller.superSeller ? ' ⭐' : ''}\n`;
      content += `   Link: ${item.url}\n\n`;
    });

    content += '-'.repeat(60) + '\n';
    content += `SUMA: ${total.toFixed(2)} PLN\n`;
    content += '='.repeat(60) + '\n';

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista_zakupow_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🛒 Wyszukiwanie Części - Allegro
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Znajdź najlepsze oferty części AGD na Allegro
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/allegro/settings')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                title="Konfiguracja OAuth"
              >
                ⚙️ Ustawienia
              </button>
              <DarkModeToggle />
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="space-y-4">
              {/* Main Search */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="🔍 Wpisz nazwę części (np. 'pasek napędowy Bosch', 'filtr hepa')"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium min-w-[120px]"
                >
                  {searching ? '⏳ Szukam...' : '🔍 Szukaj'}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cena od (PLN)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cena do (PLN)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="999"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sortuj według
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="price-asc">Cena: od najniższej</option>
                    <option value="price-desc">Cena: od najwyższej</option>
                    <option value="name">Nazwa: A-Z</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeDeliveryOnly}
                      onChange={(e) => setFreeDeliveryOnly(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      🚚 Tylko darmowa dostawa
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Mode Warning */}
          {isDemoMode && allegroResults.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Tryb DEMO - Przykładowe dane
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    To są przykładowe wyniki. Allegro API wymaga autoryzacji OAuth dla prawdziwych wyszukiwań.
                  </p>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Aby używać prawdziwego Allegro API:</strong>
                    <ol className="list-decimal ml-5 mt-1 space-y-1">
                      <li>
                        Zarejestruj aplikację na{' '}
                        <a 
                          href="https://apps.developer.allegro.pl/" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                        >
                          apps.developer.allegro.pl
                        </a>
                      </li>
                      <li>Pobierz Client ID i Client Secret</li>
                      <li>
                        Kliknij przycisk{' '}
                        <button
                          onClick={() => router.push('/admin/allegro/settings')}
                          className="underline font-semibold hover:text-yellow-900 dark:hover:text-yellow-100"
                        >
                          ⚙️ Ustawienia
                        </button>
                        {' '}i wprowadź dane
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {showComparison && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Wyniki wyszukiwania
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Znaleziono: {allegroResults.length} ofert | Zaznaczono: {selectedItems.length}
                  </p>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={generateShoppingList}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    📄 Pobierz listę ({selectedItems.length})
                  </button>
                )}
              </div>

              {/* Results Grid */}
              {allegroResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Brak wyników. Spróbuj innego zapytania.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allegroResults.map((item) => {
                    const similarPart = findSimilarLocalPart(item.name);
                    const isSelected = selectedItems.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Checkbox */}
                          <div className="flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(item.id)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>

                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-3xl">📦</span>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {item.name}
                            </h3>

                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {item.price.amount} {item.price.currency}
                                </span>
                              </div>

                              <div className="text-gray-600 dark:text-gray-400">
                                {item.delivery.free ? (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    🚚 Darmowa dostawa
                                  </span>
                                ) : (
                                  <span>
                                    Dostawa: {item.delivery.price} PLN
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <span>Sprzedawca: {item.seller.login}</span>
                                {item.seller.superSeller && (
                                  <span className="text-orange-500" title="Super Sprzedawca">⭐</span>
                                )}
                              </div>

                              {item.location && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  📍 {item.location}
                                </div>
                              )}

                              {item.stock > 0 && (
                                <div className="text-gray-500 dark:text-gray-400">
                                  Dostępnych: {item.stock} szt.
                                </div>
                              )}

                              {similarPart && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                                  💡 Masz podobną część: <strong>{similarPart.name}</strong>
                                </div>
                              )}

                              <div className="mt-2">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                                >
                                  Zobacz na Allegro →
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
